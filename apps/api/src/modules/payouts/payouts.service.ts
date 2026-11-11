import {
  Injectable, NotFoundException, ForbiddenException, Logger,
} from '@nestjs/common';
import { Prisma, PayoutStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { LedgerService } from '../ledger/ledger.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { ProvidersService } from '../providers/providers.service';
import { CreateBeneficiaryDto, CreatePayoutDto, ListPayoutsDto } from './dto/payout.dto';

const IDEMPOTENCY_TTL = 86400;

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly ledger: LedgerService,
    private readonly webhooks: WebhooksService,
    private readonly providers: ProvidersService,
  ) {}

  async createBeneficiary(merchantId: string, dto: CreateBeneficiaryDto) {
    const beneficiary = await this.prisma.beneficiary.create({
      data: {
        merchantId,
        name: dto.name,
        accountType: dto.accountType,
        accountNumber: dto.accountNumber,
        bankCode: dto.bankCode ?? null,
        mobileNetwork: dto.mobileNetwork ?? null,
        currency: dto.currency?.toUpperCase() ?? null,
        country: dto.country?.toUpperCase() ?? 'GH',
        status: 'ACTIVE',
      },
    });
    this.logger.log(`Beneficiary created: id=${beneficiary.id} merchant=${merchantId}`);
    return beneficiary;
  }

  async listBeneficiaries(merchantId: string) {
    return this.prisma.beneficiary.findMany({
      where: { merchantId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPayout(merchantId: string, dto: CreatePayoutDto) {
    const idempKey = `idempotency:payout:${merchantId}:${dto.idempotencyKey}`;

    // 1. Idempotency check
    const cached = await this.redis.get(idempKey);
    if (cached) {
      this.logger.log(`Idempotency hit: payout key=${dto.idempotencyKey}`);
      return JSON.parse(cached) as Record<string, unknown>;
    }

    // 2. Load and validate beneficiary
    const beneficiary = await this.prisma.beneficiary.findUnique({
      where: { id: dto.beneficiaryId },
    });
    if (!beneficiary) throw new NotFoundException(`Beneficiary ${dto.beneficiaryId} not found`);
    if (beneficiary.merchantId !== merchantId) {
      throw new ForbiddenException('Beneficiary does not belong to this merchant');
    }

    const amountMinor = BigInt(Math.round(dto.amount * 100));
    const currency = dto.currency.toUpperCase();

    // 3. Create Payout record
    const payout = await this.prisma.payout.create({
      data: {
        merchantId,
        beneficiaryId: dto.beneficiaryId,
        amount: amountMinor,
        currency,
        status: PayoutStatus.CREATED,
        provider: dto.provider,
        idempotencyKey: dto.idempotencyKey,
        description: dto.description ?? null,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    // 4. Write DEBIT PENDING ledger entry
    await this.ledger.writeEntry({
      merchantId,
      type: 'DEBIT',
      amount: amountMinor,
      currency,
      status: 'PENDING',
      description: `Payout initiated: ${payout.id}`,
      payoutId: payout.id,
      metadata: { provider: dto.provider, beneficiaryId: dto.beneficiaryId },
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
      providerResult = await adapter.payout({
        amount: amountMinor,
        currency,
        reference: payout.id,
        beneficiary: {
          name: beneficiary.name,
          accountType: beneficiary.accountType,
          accountNumber: beneficiary.accountNumber,
          ...(beneficiary.bankCode ? { bankCode: beneficiary.bankCode } : {}),
          ...(beneficiary.mobileNetwork ? { mobileNetwork: beneficiary.mobileNetwork } : {}),
          ...(beneficiary.country ? { country: beneficiary.country } : {}),
        },
        metadata: (payout.metadata as Record<string, unknown>) ?? {},
      });
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Payout provider error: ${error.message}`);
      providerResult = {
        success: false,
        errorCode: 'PROVIDER_ERROR',
        errorMessage: error.message,
      };
    }

    const finalStatus = providerResult.success ? PayoutStatus.COMPLETED : PayoutStatus.FAILED;

    // 5. Update payout
    const updated = await this.prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: finalStatus,
        providerTransactionId: providerResult.providerTransactionId ?? null,
        providerResponse: (providerResult.providerResponse ?? {}) as Prisma.InputJsonValue,
        processedAt: new Date(),
      },
    });

    // 6. Write final DEBIT ledger entry
    if (providerResult.success) {
      await this.ledger.writeEntry({
        merchantId,
        type: 'DEBIT',
        amount: amountMinor,
        currency,
        status: 'SETTLED',
        description: `Payout completed: ${payout.id}`,
        payoutId: payout.id,
        metadata: {
          provider: dto.provider,
          providerTransactionId: providerResult.providerTransactionId,
        },
      });

      // Flat withdrawal fee: GHS 1.00 (100 pesewas)
      const PAYOUT_FEE_MINOR = BigInt(100);
      await this.ledger.writeEntry({
        merchantId,
        type: 'DEBIT',
        amount: PAYOUT_FEE_MINOR,
        currency,
        status: 'SETTLED',
        description: `ATLAS withdrawal fee: ${payout.id}`,
        payoutId: payout.id,
        metadata: { fee: 100, payoutAmount: Number(amountMinor) },
      });
    }

    const response = this.serialize(updated);
    await this.redis.setex(idempKey, IDEMPOTENCY_TTL, JSON.stringify(response));

    // 7. Emit webhook
    void this.webhooks
      .emit(
        merchantId,
        providerResult.success ? 'payout.completed' : 'payout.failed',
        response,
        payout.id,
      )
      .catch((err: Error) =>
        this.logger.warn(`Webhook emit failed: ${err.message}`),
      );

    return response;
  }

  async listPayouts(merchantId: string, query: ListPayoutsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.PayoutWhereInput = {
      merchantId,
      ...(query.status ? { status: query.status as PayoutStatus } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.payout.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { beneficiary: true },
      }),
      this.prisma.payout.count({ where }),
    ]);
    return {
      items: items.map((p) => this.serialize(p)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findPayout(merchantId: string, payoutId: string) {
    const payout = await this.prisma.payout.findFirst({
      where: { id: payoutId, merchantId },
      include: { beneficiary: true },
    });
    if (!payout) throw new NotFoundException(`Payout ${payoutId} not found`);
    return this.serialize(payout);
  }

  private serialize(payout: { amount: bigint;[k: string]: unknown }): Record<string, unknown> {
    return { ...payout, amount: payout.amount.toString() };
  }
}
