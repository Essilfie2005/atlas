import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma, PaymentIntentStatus, PayoutStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { RedisService } from '../../redis/redis.service';
import { LedgerService } from '../ledger/ledger.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { ProvidersService } from '../providers/providers.service';
import {
  CreatePaymentIntentDto,
  ConfirmPaymentIntentDto,
  ListPaymentIntentsDto,
} from './dto/payment-intent.dto';

const IDEMPOTENCY_TTL = 86400; // 24 hours

@Injectable()
export class PaymentIntentsService {
  private readonly logger = new Logger(PaymentIntentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly ledger: LedgerService,
    private readonly webhooks: WebhooksService,
    private readonly providers: ProvidersService,
  ) {}

  async create(merchantId: string, dto: CreatePaymentIntentDto) {
    const idempKey = `idempotency:pi:${merchantId}:${dto.idempotencyKey}`;

    // 1. Check Redis idempotency cache
    const cached = await this.redis.get(idempKey);
    if (cached) {
      this.logger.log(`Idempotency hit: key=${dto.idempotencyKey}`);
      return JSON.parse(cached) as Record<string, unknown>;
    }

    // 2. Amount to minor units (BigInt) — multiply by 100
    const amountMinor = BigInt(Math.round(dto.amount * 100));

    // 3. Create PaymentIntent in DB
    let intent: Awaited<ReturnType<typeof this.prisma.paymentIntent.create>>;
    try {
      intent = await this.prisma.paymentIntent.create({
        data: {
          merchantId,
          amount: amountMinor,
          currency: dto.currency.toUpperCase(),
          status: PaymentIntentStatus.CREATED,
          idempotencyKey: dto.idempotencyKey,
          customerId: dto.customerId ?? null,
          description: dto.description ?? null,
          metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
          returnUrl: dto.returnUrl ?? null,
        },
      });
    } catch (err) {
      // P2002 = unique constraint violation — idempotencyKey already used by this merchant
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(
          `A payment with idempotencyKey "${dto.idempotencyKey}" already exists for this merchant`,
        );
      }
      throw err;
    }

    // 4. Write PENDING CREDIT ledger entry
    await this.ledger.writeEntry({
      merchantId,
      type: 'CREDIT',
      amount: amountMinor,
      currency: dto.currency.toUpperCase(),
      status: 'PENDING',
      description: `Payment intent created: ${intent.id}`,
      transactionId: intent.id,
      metadata: { idempotencyKey: dto.idempotencyKey },
    });

    const response = this.serialize(intent);

    // 5. Cache response for 24h
    await this.redis.setex(idempKey, IDEMPOTENCY_TTL, JSON.stringify(response));

    // 6. Emit webhook (fire-and-forget)
    void this.webhooks
      .emit(merchantId, 'payment_intent.created', response, intent.id)
      .catch((err: Error) =>
        this.logger.warn(`Webhook emit failed: ${err.message}`),
      );

    this.logger.log(
      `PaymentIntent created: id=${intent.id} ${amountMinor}n ${dto.currency} merchant=${merchantId}`,
    );

    return response;
  }

  async confirm(merchantId: string, intentId: string, dto: ConfirmPaymentIntentDto) {
    const intent = await this.prisma.paymentIntent.findFirst({
      where: { id: intentId, merchantId },
    });

    if (!intent) throw new NotFoundException(`PaymentIntent ${intentId} not found`);

    if (!['CREATED', 'PENDING'].includes(intent.status)) {
      throw new ConflictException(
        `PaymentIntent is in status "${intent.status}" and cannot be confirmed`,
      );
    }

    // Update to PROCESSING
    await this.prisma.paymentIntent.update({
      where: { id: intentId },
      data: { status: PaymentIntentStatus.PROCESSING },
    });

    // Create attempt record
    const attempt = await this.prisma.paymentAttempt.create({
      data: {
        paymentIntentId: intentId,
        provider: dto.provider,
        status: 'PENDING',
        providerPaymentMethod: (dto.providerPaymentMethod ?? {}) as Prisma.InputJsonValue,
      },
    });

    let providerResult: {
      success: boolean;
      providerTransactionId?: string;
      providerStatus?: string;
      providerResponse?: Record<string, unknown>;
      errorCode?: string;
      errorMessage?: string;
    };

    try {
      const adapter = this.providers.getAdapter(dto.provider);
      providerResult = await adapter.charge({
        amount: intent.amount,
        currency: intent.currency,
        reference: intentId,
        paymentMethod: dto.providerPaymentMethod ?? {},
        metadata: (intent.metadata as Record<string, unknown>) ?? {},
      });
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Provider charge error: ${error.message}`);
      providerResult = {
        success: false,
        errorCode: 'PROVIDER_ERROR',
        errorMessage: error.message,
      };
    }

    const finalStatus = providerResult.success
      ? PaymentIntentStatus.SUCCEEDED
      : PaymentIntentStatus.FAILED;

    // Update attempt
    await this.prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: providerResult.success ? 'SUCCEEDED' : 'FAILED',
        providerTransactionId: providerResult.providerTransactionId ?? null,
        providerStatus: providerResult.providerStatus ?? null,
        providerResponse: (providerResult.providerResponse ?? {}) as Prisma.InputJsonValue,
        errorCode: providerResult.errorCode ?? null,
        errorMessage: providerResult.errorMessage ?? null,
        processedAt: new Date(),
      },
    });

    // Update intent
    const updatedIntent = await this.prisma.paymentIntent.update({
      where: { id: intentId },
      data: {
        status: finalStatus,
        providerTransactionId: providerResult.providerTransactionId ?? null,
        ...(finalStatus === PaymentIntentStatus.SUCCEEDED ? { succeededAt: new Date() } : { failedAt: new Date() }),
      },
    });


    // Write final ledger entry
    await this.ledger.writeEntry({
      merchantId,
      type: 'CREDIT',
      amount: intent.amount,
      currency: intent.currency,
      status: providerResult.success ? 'SETTLED' : 'REVERSED',
      description: providerResult.success
        ? `Payment settled: ${intentId}`
        : `Payment failed, reversing entry: ${intentId}`,
      transactionId: intentId,
      metadata: {
        provider: dto.provider,
        attemptId: attempt.id,
        providerTransactionId: providerResult.providerTransactionId,
      },
    });

    const response = this.serialize(updatedIntent);

    // Emit webhook
    void this.webhooks
      .emit(
        merchantId,
        providerResult.success ? 'payment_intent.succeeded' : 'payment_intent.failed',
        response,
        intentId,
      )
      .catch((err: Error) =>
        this.logger.warn(`Webhook emit failed: ${err.message}`),
      );

    return response;
  }

  async cancel(merchantId: string, intentId: string) {
    const intent = await this.prisma.paymentIntent.findFirst({
      where: { id: intentId, merchantId },
    });

    if (!intent) throw new NotFoundException(`PaymentIntent ${intentId} not found`);

    if (!['CREATED', 'PENDING'].includes(intent.status)) {
      throw new ConflictException(
        `PaymentIntent in status "${intent.status}" cannot be cancelled`,
      );
    }

    const updated = await this.prisma.paymentIntent.update({
      where: { id: intentId },
      data: { status: PaymentIntentStatus.CANCELLED, cancelledAt: new Date() },
    });

    // Reverse the pending ledger entry
    await this.ledger.writeEntry({
      merchantId,
      type: 'CREDIT',
      amount: intent.amount,
      currency: intent.currency,
      status: 'REVERSED',
      description: `Payment intent cancelled: ${intentId}`,
      transactionId: intentId,
    });

    void this.webhooks
      .emit(merchantId, 'payment_intent.cancelled', this.serialize(updated), intentId)
      .catch((err: Error) =>
        this.logger.warn(`Webhook emit failed: ${err.message}`),
      );

    return this.serialize(updated);
  }

  async list(merchantId: string, query: ListPaymentIntentsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.PaymentIntentWhereInput = {
      merchantId,
      ...(query.status ? { status: query.status as PaymentIntentStatus } : {}),
      ...(query.currency ? { currency: query.currency.toUpperCase() } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.paymentIntent.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.paymentIntent.count({ where }),
    ]);
    return {
      items: items.map((i) => this.serialize(i)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(merchantId: string, intentId: string) {
    const intent = await this.prisma.paymentIntent.findFirst({
      where: { id: intentId, merchantId },
      include: { attempts: { orderBy: { createdAt: 'desc' } } },
    });
    if (!intent) throw new NotFoundException(`PaymentIntent ${intentId} not found`);
    return {
      ...this.serialize(intent),
      attempts: intent.attempts,
    };
  }

  private serialize(intent: { amount: bigint;[k: string]: unknown }): Record<string, unknown> {
    return { ...intent, amount: intent.amount.toString() };
  }
}
