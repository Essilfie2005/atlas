import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { Prisma, WebhookEventStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const RETRY_DELAYS_SECONDS = [60, 300, 1800, 7200, 28800]; // 1m, 5m, 30m, 2h, 8h

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}

  /**
   * Create a WebhookEvent record and attempt delivery.
   * If no webhookUrl is configured, the event is recorded but not delivered.
   */
  async emit(
    merchantId: string,
    eventType: string,
    payload: Record<string, unknown>,
    paymentIntentId?: string,
  ): Promise<void> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { webhookUrl: true, webhookSecret: true },
    });

    const event = await this.prisma.webhookEvent.create({
      data: {
        merchantId,
        eventType,
        payload: payload as Prisma.InputJsonValue,
        paymentIntentId: paymentIntentId ?? null,
        status: WebhookEventStatus.PENDING,
        attemptCount: 0,
      },
    });

    this.logger.log(
      `Webhook event created: id=${event.id} type=${eventType} merchant=${merchantId}`,
    );

    if (!merchant?.webhookUrl) {
      this.logger.debug(
        `No webhook URL for merchant ${merchantId} — event recorded, not delivered`,
      );
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: WebhookEventStatus.SKIPPED },
      });
      return;
    }

    // Deliver asynchronously — don't block the caller
    void this.deliver(event.id).catch((err: Error) =>
      this.logger.error(
        `Webhook delivery error: event=${event.id} ${err.message}`,
      ),
    );
  }

  /**
   * Deliver a webhook event by ID.
   * Signs payload with HMAC-SHA256: x-atlas-signature: HMAC(timestamp.payload)
   */
  async deliver(webhookEventId: string) {
    const event = await this.prisma.webhookEvent.findUnique({
      where: { id: webhookEventId },
      include: {
        merchant: { select: { webhookUrl: true, webhookSecret: true } },
      },
    });

    if (!event) throw new NotFoundException(`Webhook event ${webhookEventId} not found`);

    if (!event.merchant?.webhookUrl) {
      return { success: false, errorMessage: 'No webhook URL configured' };
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payloadStr = JSON.stringify(event.payload);
    const signingSecret =
      event.merchant.webhookSecret ??
      this.config.get<string>('atlas.signingSecret') ??
      'atlas-signing-secret';

    const signature = createHmac('sha256', signingSecret)
      .update(`${timestamp}.${payloadStr}`)
      .digest('hex');

    let result: {
      success: boolean;
      statusCode?: number;
      body?: string;
      errorMessage?: string;
    };

    try {
      const response = await fetch(event.merchant.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-atlas-signature': signature,
          'x-atlas-timestamp': timestamp,
          'x-atlas-event': event.eventType,
          'x-atlas-delivery-id': event.id,
          'User-Agent': 'ATLAS-Webhooks/1.0',
        },
        body: payloadStr,
        signal: AbortSignal.timeout(30000),
      });

      const body = await response.text().catch(() => '');
      result = {
        success: response.ok,
        statusCode: response.status,
        body: body.substring(0, 1000),
      };
    } catch (err) {
      result = { success: false, errorMessage: (err as Error).message };
    }

    const newAttemptCount = (event.attemptCount ?? 0) + 1;

    // Record delivery attempt
    await this.prisma.webhookDelivery.create({
      data: {
        webhookEventId: event.id,
        success: result.success,
        statusCode: result.statusCode ?? null,
        responseBody: result.body ?? null,
        errorMessage: result.errorMessage ?? null,
        attemptNumber: newAttemptCount,
        deliveredAt: new Date(),
      },
    });

    // Determine next status
    const nextStatus: WebhookEventStatus = result.success
      ? WebhookEventStatus.DELIVERED
      : newAttemptCount >= RETRY_DELAYS_SECONDS.length
        ? WebhookEventStatus.FAILED
        : WebhookEventStatus.PENDING;

    const nextRetryAt =
      !result.success && newAttemptCount < RETRY_DELAYS_SECONDS.length
        ? new Date(
            Date.now() +
              (RETRY_DELAYS_SECONDS[newAttemptCount - 1] ?? 60) * 1000,
          )
        : null;

    await this.prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        status: nextStatus,
        attemptCount: newAttemptCount,
        lastAttemptAt: new Date(),
        nextRetryAt,
      },
    });

    if (result.success) {
      this.logger.log(`Webhook delivered: event=${event.id} status=${result.statusCode ?? 'ok'}`);
    } else {
      this.logger.warn(
        `Webhook failed: event=${event.id} attempt=${newAttemptCount} error=${result.errorMessage ?? result.statusCode}`,
      );
    }

    return result;
  }

  verifyIncomingWebhook(payload: string, signature: string, secret: string, timestamp?: string): boolean {
    const ts = timestamp ?? Math.floor(Date.now() / 1000).toString();
    const expected = createHmac('sha256', secret)
      .update(`${ts}.${payload}`)
      .digest('hex');
    try {
      return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  }

  async listEvents(merchantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { merchantId };
    const [items, total] = await Promise.all([
      this.prisma.webhookEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, eventType: true, status: true, attemptCount: true,
          lastAttemptAt: true, nextRetryAt: true, createdAt: true, paymentIntentId: true,
        },
      }),
      this.prisma.webhookEvent.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findEvent(merchantId: string, eventId: string) {
    const event = await this.prisma.webhookEvent.findFirst({
      where: { id: eventId, merchantId },
      include: { deliveries: { orderBy: { attemptNumber: 'asc' } } },
    });
    if (!event) throw new NotFoundException(`Webhook event ${eventId} not found`);
    return event;
  }

  async retryEvent(merchantId: string, eventId: string) {
    const event = await this.prisma.webhookEvent.findFirst({
      where: { id: eventId, merchantId },
    });
    if (!event) throw new NotFoundException(`Webhook event ${eventId} not found`);
    await this.prisma.webhookEvent.update({
      where: { id: eventId },
      data: { status: WebhookEventStatus.PENDING, nextRetryAt: null },
    });
    return this.deliver(eventId);
  }

  // ── Inbound Paystack verification ───────────────────────────────────────────

  /**
   * Verify Paystack's HMAC-SHA512 signature.
   * Paystack signs with: HMAC-SHA512(rawBody, PAYSTACK_SECRET_KEY)
   * Header: x-paystack-signature
   */
  verifyPaystackWebhook(rawBody: string, signature: string): boolean {
    const secret = this.config.get<string>('PAYSTACK_SECRET_KEY') ?? '';
    if (!secret || secret.startsWith('sk_test_your')) {
      // In dev without a real key, log and pass through
      this.logger.warn('[DEV] No real PAYSTACK_SECRET_KEY — skipping signature verification');
      return true;
    }
    if (!signature) return false;
    const expected = createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');
    try {
      return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  }

  /**
   * Process a verified inbound Paystack event.
   * Maps Paystack event types → ATLAS PaymentIntent status updates.
   */
  async handlePaystackEvent(body: Record<string, unknown>): Promise<void> {
    const eventType = body['event'] as string;
    const data = body['data'] as Record<string, unknown> | undefined;
    if (!data) return;

    this.logger.log(`Paystack inbound event: ${eventType}`);

    switch (eventType) {
      case 'charge.success': {
        const reference = data['reference'] as string;
        const amount    = data['amount'] as number;          // in kobo/pesewas
        const currency  = data['currency'] as string;
        const email     = (data['customer'] as any)?.email as string;
        const status    = data['status'] as string;

        if (status !== 'success') break;

        // Find our PaymentIntent by idempotencyKey === reference
        const intent = await this.prisma.paymentIntent.findFirst({
          where: { idempotencyKey: reference },
          include: { merchant: { select: { legalName: true } } },
        });

        if (!intent) {
          this.logger.warn(`charge.success: no intent found for ref=${reference}`);
          break;
        }

        if (intent.status === 'SUCCEEDED') break; // idempotent

        const now = new Date();
        const meta = ((intent.metadata as any) ?? {});
        meta.paystackData = { eventType, reference, amount, currency, confirmedAt: now.toISOString() };

        await this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: 'SUCCEEDED', succeededAt: now, metadata: meta },
        });

        this.logger.log(`✅ PaymentIntent ${intent.id} marked SUCCEEDED via Paystack webhook`);

        // Emit our own internal webhook event to the merchant
        void this.emit(intent.merchantId, 'payment_intent.succeeded', {
          id: intent.id, amount, currency, reference,
          customerEmail: email,
          merchantName: (intent as any).merchant?.legalName,
        }, intent.id).catch(() => {});

        // Send payment receipt email
        if (email) {
          void this.email.sendPaymentConfirmation({
            to: email,
            customerName: meta.customerName ?? '',
            amount,
            currency,
            reference,
            merchantName: (intent as any).merchant?.legalName ?? 'Merchant',
            pageName: intent.description ?? 'Payment',
          }).catch(() => {});
        }
        break;
      }

      case 'charge.failed':
      case 'charge.dispute.create': {
        const reference = data['reference'] as string;
        if (!reference) break;

        const intent = await this.prisma.paymentIntent.findFirst({
          where: { idempotencyKey: reference },
        });

        if (!intent || intent.status === 'FAILED') break;

        await this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: 'FAILED', failedAt: new Date() },
        });

        this.logger.warn(`⚠️  PaymentIntent ${intent.id} marked FAILED via Paystack webhook (${eventType})`);

        void this.emit(intent.merchantId, 'payment_intent.failed', {
          id: intent.id, reference, reason: eventType,
        }, intent.id).catch(() => {});
        break;
      }

      case 'transfer.success':
      case 'transfer.failed':
      case 'transfer.reversed': {
        const transferCode = data['transfer_code'] as string;
        this.logger.log(`Transfer event ${eventType}: code=${transferCode}`);
        // Payout status updates would go here
        break;
      }

      default:
        this.logger.debug(`Unhandled Paystack event: ${eventType}`);
    }
  }
}
