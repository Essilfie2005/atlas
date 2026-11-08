import type { AtlasCurrency } from '@atlas/core';

// =============================================================================
// PROVIDER TRANSACTION STATUS
// =============================================================================

/**
 * Canonical ATLAS provider-level transaction status.
 * All provider adapters must map their native statuses to this enum.
 */
export enum ProviderTransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
  CANCELLED = 'CANCELLED',
  UNKNOWN = 'UNKNOWN',
}

// =============================================================================
// CHARGE (PAYMENT COLLECTION)
// =============================================================================

/**
 * Request to charge a customer through a payment provider.
 * All amounts in minor units as BigInt.
 */
export interface ProviderChargeRequest {
  /** ATLAS PaymentIntent ID — used as the provider reference */
  intentId: string;
  /** Idempotency key to deduplicate requests */
  idempotencyKey: string;
  /** Amount in minor units */
  amount: bigint;
  /** ISO 4217 currency code */
  currency: AtlasCurrency;
  /** Customer email for provider-side customer creation/lookup */
  customerEmail: string;
  /** Customer name */
  customerName?: string;
  /** Customer phone number (E.164 format) */
  customerPhone?: string;
  /** URL to redirect to after authorization */
  callbackUrl?: string;
  /** Optional description shown on provider statement */
  description?: string;
  /** Arbitrary key-value metadata forwarded to the provider */
  metadata?: Record<string, string>;
  /** Mobile money channel (e.g. "mobile_money") */
  channel?: string;
  /** Mobile money network (e.g. "MTN", "VODAFONE") */
  mobileMoneyNetwork?: string;
  /** Mobile number to charge (E.164 format) */
  mobileNumber?: string;
}

/**
 * Response from a provider charge initiation.
 */
export interface ProviderChargeResponse {
  /** Provider's unique transaction reference */
  providerReference: string;
  /** Normalized transaction status */
  status: ProviderTransactionStatus;
  /** Authorization URL for redirect-based flows */
  authorizationUrl?: string;
  /** Access code for embedded checkout flows */
  accessCode?: string;
  /** Amount charged (minor units) — should match request */
  amount: bigint;
  /** Currency of the charge */
  currency: string;
  /** Provider-specific raw response for audit purposes */
  rawResponse: Record<string, unknown>;
  /** Failure reason code (if status === FAILED) */
  failureCode?: string;
  /** Human-readable failure message (if status === FAILED) */
  failureMessage?: string;
}

// =============================================================================
// PAYOUT (DISBURSEMENT)
// =============================================================================

/**
 * Request to disburse funds to a beneficiary through a provider.
 * All amounts in minor units as BigInt.
 */
export interface ProviderPayoutRequest {
  /** ATLAS Payout ID */
  payoutId: string;
  /** Idempotency key */
  idempotencyKey: string;
  /** Amount to disburse in minor units */
  amount: bigint;
  /** ISO 4217 currency code */
  currency: AtlasCurrency;
  /** Recipient name */
  recipientName: string;
  /** Account type: 'bank_account' or 'mobile_money' */
  accountType: 'bank_account' | 'mobile_money';
  /** Account number or mobile number (E.164) */
  accountNumber: string;
  /** Bank code (for bank account payouts) */
  bankCode?: string;
  /** Mobile money network (for mobile money payouts) */
  mobileNetwork?: string;
  /** ISO 3166-1 alpha-2 country code */
  country: string;
  /** Payout description / narration */
  description?: string;
  /** Arbitrary metadata */
  metadata?: Record<string, string>;
}

/**
 * Response from a provider payout initiation.
 */
export interface ProviderPayoutResponse {
  /** Provider's payout transfer reference */
  providerReference: string;
  /** Normalized payout status */
  status: ProviderTransactionStatus;
  /** Amount disbursed (minor units) */
  amount: bigint;
  /** Currency */
  currency: string;
  /** Provider-specific raw response */
  rawResponse: Record<string, unknown>;
  /** Failure code if status === FAILED */
  failureCode?: string;
  /** Failure message if status === FAILED */
  failureMessage?: string;
}

// =============================================================================
// WEBHOOK
// =============================================================================

/**
 * A normalized inbound webhook event from a provider.
 */
export interface ProviderWebhookEvent {
  /** Provider's event type string (e.g. "charge.success") */
  providerEventType: string;
  /** Provider's transaction/reference ID */
  providerReference: string;
  /** ATLAS PaymentIntent or Payout ID extracted from metadata */
  atlasReference?: string;
  /** Normalized transaction status */
  status: ProviderTransactionStatus;
  /** Amount (minor units), if present in the event */
  amount?: bigint;
  /** Currency, if present in the event */
  currency?: string;
  /** Full raw payload for audit storage */
  rawPayload: Record<string, unknown>;
  /** Failure code, if applicable */
  failureCode?: string;
  /** Failure message, if applicable */
  failureMessage?: string;
}

// =============================================================================
// PROVIDER HEALTH
// =============================================================================

/**
 * Provider health check result.
 */
export interface ProviderHealth {
  /** Whether the provider API is reachable */
  healthy: boolean;
  /** Provider identifier */
  provider: string;
  /** Latency of the health check in milliseconds */
  latencyMs?: number;
  /** Optional status message from the provider */
  message?: string;
  /** Timestamp of the check */
  checkedAt: Date;
}

// =============================================================================
// REFUND
// =============================================================================

/**
 * Request to issue a refund for a previously charged transaction.
 */
export interface ProviderRefundRequest {
  /** Provider's original transaction reference */
  providerReference: string;
  /** Amount to refund in minor units (may be partial) */
  amount: bigint;
  /** Currency */
  currency: AtlasCurrency;
  /** Reason for the refund */
  reason?: string;
  /** ATLAS-level idempotency key */
  idempotencyKey: string;
}

/**
 * Response from a provider refund request.
 */
export interface ProviderRefundResponse {
  /** Provider's refund reference */
  providerRefundReference: string;
  /** Normalized status */
  status: ProviderTransactionStatus;
  /** Amount refunded (minor units) */
  amount: bigint;
  /** Currency */
  currency: string;
  /** Raw provider response */
  rawResponse: Record<string, unknown>;
}
