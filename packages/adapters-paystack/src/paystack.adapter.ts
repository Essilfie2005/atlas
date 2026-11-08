import { ProviderAdapter, ProviderError, ProviderTransactionStatus } from '@atlas/adapters';
import { verifyHmac } from '@atlas/core';
import type {
  ProviderChargeRequest,
  ProviderChargeResponse,
  ProviderPayoutRequest,
  ProviderPayoutResponse,
  ProviderRefundRequest,
  ProviderRefundResponse,
  ProviderWebhookEvent,
  ProviderHealth,
} from '@atlas/adapters';
import { PaystackClient } from './paystack.client.js';
import type { PaystackClientConfig } from './paystack.client.js';
import {
  mapPaystackStatus,
  mapPaystackGatewayResponseToFailureCode,
  mapMobileNetworkToPaystackProvider,
  isPaystackMobileMoneyChannel,
} from './paystack.normalizer.js';
import type { PaystackWebhookPayload, PaystackTransactionData, PaystackTransferData } from './paystack.types.js';

// =============================================================================
// PAYSTACK ADAPTER CONFIGURATION
// =============================================================================

export interface PaystackAdapterConfig extends PaystackClientConfig {
  /**
   * The Paystack webhook signature secret.
   * Found in Paystack Dashboard → Settings → Webhooks.
   * Used to verify incoming webhook requests.
   */
  webhookSecret: string;
}

// =============================================================================
// PAYSTACK ADAPTER
// =============================================================================

/**
 * Paystack payment provider adapter for ATLAS.
 *
 * Supports:
 * - Card payments (via Paystack checkout redirect)
 * - Mobile money (MTN, Vodafone, AirtelTigo — Ghana)
 * - Bank transfers
 * - Payouts to bank accounts and mobile money
 *
 * Supported currencies: GHS (Ghana Cedi), NGN (Nigerian Naira)
 *
 * Reference: https://paystack.com/docs/
 */
export class PaystackAdapter extends ProviderAdapter {
  private readonly client: PaystackClient;
  private readonly webhookSecret: string;

  constructor(config: PaystackAdapterConfig) {
    super();
    this.client = new PaystackClient(config);
    this.webhookSecret = config.webhookSecret;

    if (!config.webhookSecret) {
      throw new Error(
        'PaystackAdapter: webhookSecret is required to verify incoming webhooks.',
      );
    }
  }

  // ─── Metadata ───────────────────────────────────────────────────────────────

  getName(): string {
    return 'paystack';
  }

  getSupportedCurrencies(): ReadonlyArray<string> {
    return ['GHS', 'NGN'];
  }

  // ─── Charge (Payment Collection) ────────────────────────────────────────────

  /**
   * Initiate a charge through Paystack.
   *
   * For card payments: returns an authorizationUrl for the customer to visit.
   * For mobile money: may trigger a USSD prompt — status will be PENDING.
   */
  async charge(request: ProviderChargeRequest): Promise<ProviderChargeResponse> {
    this.assertSupportsCurrency(request.currency);

    // Paystack amounts must be integers (they're already minor units)
    // BigInt → number is safe here because Paystack amounts are bounded
    const amountNumber = Number(request.amount);

    if (request.amount > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new ProviderError(
        'Amount exceeds safe integer range for Paystack API. ' +
          'The maximum amount representable is 9,007,199,254,740,991 minor units.',
        { retryable: false },
      );
    }

    // Determine payment channels
    const channels: string[] = [];
    if (request.channel === 'mobile_money' || request.mobileMoneyNetwork) {
      channels.push('mobile_money');
    } else {
      channels.push('card', 'bank');
    }

    try {
      const response = await this.client.initializeTransaction({
        email: request.customerEmail,
        amount: amountNumber,
        currency: request.currency,
        reference: request.idempotencyKey,
        callbackUrl: request.callbackUrl,
        channels,
        metadata: {
          atlas_intent_id: request.intentId,
          atlas_idempotency_key: request.idempotencyKey,
          customer_name: request.customerName ?? '',
          ...((request.metadata ?? {}) as Record<string, unknown>),
        },
        mobileMoneyPhone: request.mobileNumber,
        mobileMoneyProvider: request.mobileMoneyNetwork
          ? mapMobileNetworkToPaystackProvider(request.mobileMoneyNetwork)
          : undefined,
      });

      if (!response.status) {
        throw new ProviderError(
          `Paystack initialization failed: ${response.message}`,
          { retryable: false, rawResponse: response },
        );
      }

      const data = response.data;

      return {
        providerReference: data.reference,
        status: ProviderTransactionStatus.PENDING,
        authorizationUrl: data.authorization_url,
        accessCode: data.access_code,
        amount: request.amount,
        currency: request.currency,
        rawResponse: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(
        `Failed to initialize Paystack transaction: ${String(error)}`,
        { retryable: true, cause: error instanceof Error ? error : undefined },
      );
    }
  }

  /**
   * Retrieve the current status of a Paystack transaction.
   */
  async getCharge(providerReference: string): Promise<ProviderChargeResponse> {
    try {
      const response = await this.client.verifyTransaction(providerReference);

      if (!response.status) {
        throw new ProviderError(
          `Paystack transaction not found: ${providerReference}`,
          { retryable: false, rawResponse: response },
        );
      }

      const data = response.data;
      const status = mapPaystackStatus(data.status);
      const failureCode = mapPaystackGatewayResponseToFailureCode(data.gateway_response);

      return {
        providerReference: data.reference,
        status,
        amount: BigInt(data.amount),
        currency: data.currency,
        rawResponse: data as unknown as Record<string, unknown>,
        failureCode: status === ProviderTransactionStatus.FAILED ? failureCode : undefined,
        failureMessage:
          status === ProviderTransactionStatus.FAILED
            ? data.gateway_response ?? undefined
            : undefined,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(
        `Failed to verify Paystack transaction: ${String(error)}`,
        { retryable: true, cause: error instanceof Error ? error : undefined },
      );
    }
  }

  // ─── Refund ─────────────────────────────────────────────────────────────────

  /**
   * Issue a refund for a previously succeeded Paystack transaction.
   *
   * Note: Paystack refunds are initiated via their /refund endpoint.
   * Full and partial refunds are supported.
   */
  async refund(request: ProviderRefundRequest): Promise<ProviderRefundResponse> {
    // Paystack does not return a typed refund response in our type file,
    // so we call the API directly via a raw post using the client's axios instance.
    // The refund API is: POST /refund { transaction: reference, amount?: number }
    try {
      const amountNumber = Number(request.amount);

      // Use the client's underlying axios via a typed interface
      const rawClient = this.client as unknown as {
        axios: import('axios').AxiosInstance;
      };

      const response = await rawClient.axios.post<{
        status: boolean;
        message: string;
        data: {
          transaction: { reference: string };
          amount: number;
          currency: string;
          id: number;
          status: string;
        };
      }>('/refund', {
        transaction: request.providerReference,
        amount: amountNumber,
        merchant_note: request.reason ?? 'Refund initiated by ATLAS',
        customer_note: request.reason ?? 'Your payment has been refunded',
      });

      if (!response.data.status) {
        throw new ProviderError(
          `Paystack refund failed: ${response.data.message}`,
          { retryable: false, rawResponse: response.data },
        );
      }

      const refundData = response.data.data;
      const status = mapPaystackStatus(refundData.status);

      return {
        providerRefundReference: String(refundData.id),
        status,
        amount: BigInt(refundData.amount),
        currency: refundData.currency,
        rawResponse: refundData as unknown as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(
        `Failed to issue Paystack refund: ${String(error)}`,
        { retryable: false, cause: error instanceof Error ? error : undefined },
      );
    }
  }

  // ─── Payout (Transfer) ───────────────────────────────────────────────────────

  /**
   * Initiate a payout (transfer) to a beneficiary via Paystack.
   *
   * Process:
   * 1. Create a transfer recipient (or look up an existing one)
   * 2. Initiate the transfer using the recipient code
   *
   * For bank accounts: type = "nuban" (Nigeria) or "ghipss" (Ghana)
   * For mobile money: type = "mobile_money"
   */
  async payout(request: ProviderPayoutRequest): Promise<ProviderPayoutResponse> {
    this.assertSupportsCurrency(request.currency);

    if (request.amount > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new ProviderError(
        'Amount exceeds safe integer range for Paystack API.',
        { retryable: false },
      );
    }

    try {
      // Step 1: Determine recipient type
      let recipientType: 'nuban' | 'mobile_money' | 'ghipss' | 'basa';
      if (request.accountType === 'mobile_money') {
        recipientType = 'mobile_money';
      } else if (request.currency === 'GHS') {
        recipientType = 'ghipss';
      } else {
        recipientType = 'nuban'; // Nigerian bank accounts
      }

      // Step 2: Create transfer recipient
      const recipientResponse = await this.client.createTransferRecipient({
        type: recipientType,
        name: request.recipientName,
        account_number: request.accountNumber,
        bank_code: request.bankCode,
        currency: request.currency,
        description: request.description ?? `Payout ${request.payoutId}`,
        metadata: {
          atlas_payout_id: request.payoutId,
          atlas_idempotency_key: request.idempotencyKey,
        },
      });

      if (!recipientResponse.status) {
        throw new ProviderError(
          `Failed to create Paystack transfer recipient: ${recipientResponse.message}`,
          { retryable: false, rawResponse: recipientResponse },
        );
      }

      const recipientCode = recipientResponse.data.recipient_code;

      // Step 3: Initiate the transfer
      const transferResponse = await this.client.initiateTransfer({
        source: 'balance',
        amount: Number(request.amount),
        recipient: recipientCode,
        reason: request.description ?? `Payout ${request.payoutId}`,
        currency: request.currency,
        reference: request.idempotencyKey,
      });

      if (!transferResponse.status) {
        throw new ProviderError(
          `Failed to initiate Paystack transfer: ${transferResponse.message}`,
          { retryable: false, rawResponse: transferResponse },
        );
      }

      const transferData = transferResponse.data;
      const status = mapPaystackStatus(transferData.status);

      return {
        providerReference: transferData.transfer_code,
        status,
        amount: BigInt(transferData.amount),
        currency: transferData.currency,
        rawResponse: transferData as unknown as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(
        `Failed to initiate Paystack payout: ${String(error)}`,
        { retryable: false, cause: error instanceof Error ? error : undefined },
      );
    }
  }

  /**
   * Retrieve the current status of a Paystack transfer (payout).
   */
  async getPayout(providerReference: string): Promise<ProviderPayoutResponse> {
    try {
      const response = await this.client.verifyTransfer(providerReference);

      if (!response.status) {
        throw new ProviderError(
          `Paystack transfer not found: ${providerReference}`,
          { retryable: false, rawResponse: response },
        );
      }

      const data = response.data;
      const status = mapPaystackStatus(data.status);

      return {
        providerReference: data.transfer_code,
        status,
        amount: BigInt(data.amount),
        currency: data.currency,
        rawResponse: data as unknown as Record<string, unknown>,
        failureCode:
          status === ProviderTransactionStatus.FAILED ? 'transfer_failed' : undefined,
        failureMessage:
          status === ProviderTransactionStatus.FAILED
            ? data.complete_message ?? undefined
            : undefined,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(
        `Failed to verify Paystack transfer: ${String(error)}`,
        { retryable: true, cause: error instanceof Error ? error : undefined },
      );
    }
  }

  // ─── Webhooks ───────────────────────────────────────────────────────────────

  /**
   * Verify that an inbound webhook request came from Paystack.
   *
   * Paystack signs webhooks with HMAC-SHA512 using your secret key
   * and puts the signature in the `X-Paystack-Signature` header.
   *
   * Reference: https://paystack.com/docs/payments/webhooks/#ip-whitelisting
   */
  verifyWebhook(
    payload: string,
    headers: Record<string, string | string[] | undefined>,
  ): boolean {
    const signatureHeader =
      headers['x-paystack-signature'] ?? headers['X-Paystack-Signature'];

    if (!signatureHeader) return false;

    const signature = Array.isArray(signatureHeader)
      ? signatureHeader[0]
      : signatureHeader;

    if (!signature) return false;

    // Paystack uses HMAC-SHA512 with your secret key
    // We use HMAC-SHA256 in our verifyHmac utility, but Paystack uses SHA512.
    // Use Node.js crypto directly for SHA512 verification.
    const { createHmac, timingSafeEqual } = await import('node:crypto').then(
      (m) => m,
    );

    // Since we can't use await in a sync method, use synchronous crypto approach
    const crypto = require('node:crypto') as typeof import('node:crypto');
    const expectedSig = crypto
      .createHmac('sha512', this.webhookSecret)
      .update(payload)
      .digest('hex');

    try {
      const expectedBuf = Buffer.from(expectedSig, 'hex');
      const actualBuf = Buffer.from(signature, 'hex');
      if (expectedBuf.length !== actualBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch {
      return false;
    }
  }

  /**
   * Parse a verified Paystack webhook payload into a normalized ProviderWebhookEvent.
   */
  parseWebhook(payload: string): ProviderWebhookEvent {
    let parsed: PaystackWebhookPayload;
    try {
      parsed = JSON.parse(payload) as PaystackWebhookPayload;
    } catch {
      throw new ProviderError('Failed to parse Paystack webhook payload as JSON', {
        retryable: false,
      });
    }

    const eventType = parsed.event;
    const data = parsed.data as Record<string, unknown>;

    // Determine if this is a charge or transfer event
    const isChargeEvent = eventType.startsWith('charge.');
    const isTransferEvent = eventType.startsWith('transfer.');

    if (isChargeEvent) {
      const txData = parsed.data as PaystackTransactionData;
      const status = mapPaystackStatus(txData.status);
      const failureCode = mapPaystackGatewayResponseToFailureCode(txData.gateway_response);

      // Extract ATLAS intent ID from metadata if present
      const atlasReference = (txData.metadata?.['atlas_intent_id'] as string | undefined);

      return {
        providerEventType: eventType,
        providerReference: txData.reference,
        atlasReference,
        status,
        amount: BigInt(txData.amount),
        currency: txData.currency,
        rawPayload: data,
        failureCode:
          status === ProviderTransactionStatus.FAILED ? failureCode : undefined,
        failureMessage:
          status === ProviderTransactionStatus.FAILED
            ? txData.gateway_response ?? undefined
            : undefined,
      };
    }

    if (isTransferEvent) {
      const txData = parsed.data as PaystackTransferData;
      const status = mapPaystackStatus(txData.status);

      return {
        providerEventType: eventType,
        providerReference: txData.transfer_code,
        status,
        amount: BigInt(txData.amount),
        currency: txData.currency,
        rawPayload: data,
        failureCode:
          status === ProviderTransactionStatus.FAILED ? 'transfer_failed' : undefined,
        failureMessage:
          status === ProviderTransactionStatus.FAILED
            ? txData.complete_message ?? undefined
            : undefined,
      };
    }

    // Unknown event type — return a minimal event for audit purposes
    return {
      providerEventType: eventType,
      providerReference: String(
        (data['reference'] as string | undefined) ??
          (data['transfer_code'] as string | undefined) ??
          'unknown',
      ),
      status: ProviderTransactionStatus.UNKNOWN,
      rawPayload: data,
    };
  }

  // ─── Health Check ─────────────────────────────────────────────────────────

  /**
   * Perform a health check against the Paystack API.
   * Uses the lightweight GET /bank endpoint (Ghana) as the probe.
   */
  async getHealth(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      await this.client.listBanks('ghana');
      const latencyMs = Date.now() - start;
      return {
        healthy: true,
        provider: this.getName(),
        latencyMs,
        message: 'Paystack API is reachable',
        checkedAt: new Date(),
      };
    } catch (error) {
      const latencyMs = Date.now() - start;
      return {
        healthy: false,
        provider: this.getName(),
        latencyMs,
        message: error instanceof Error ? error.message : 'Unknown error',
        checkedAt: new Date(),
      };
    }
  }
}
