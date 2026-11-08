/**
 * ATLAS canonical payment status enum.
 * Maps provider-specific statuses to this unified set.
 */
export enum AtlasPaymentStatus {
  CREATED = 'CREATED',
  PROCESSING = 'PROCESSING',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Supported currencies in the ATLAS platform.
 * All minor unit denominators are defined in packages/core/constants.
 */
export enum AtlasCurrency {
  GHS = 'GHS', // Ghana Cedi — minor unit: pesewa (1 GHS = 100 pesewas)
  NGN = 'NGN', // Nigerian Naira — minor unit: kobo (1 NGN = 100 kobo)
  KES = 'KES', // Kenyan Shilling — minor unit: cent (1 KES = 100 cents)
  UGX = 'UGX', // Ugandan Shilling — minor unit: cent (1 UGX = 100 cents)
  TZS = 'TZS', // Tanzanian Shilling — minor unit: cent (1 TZS = 100 cents)
  ZAR = 'ZAR', // South African Rand — minor unit: cent (1 ZAR = 100 cents)
  USD = 'USD', // US Dollar — minor unit: cent (1 USD = 100 cents)
}

/**
 * A fully resolved ATLAS payment intent.
 * All monetary values are BigInt in minor units.
 */
export interface AtlasPaymentIntent {
  id: string;
  merchantId: string;
  customerId: string | null;
  amount: bigint;
  currency: AtlasCurrency;
  status: AtlasPaymentStatus;
  idempotencyKey: string;
  description: string | null;
  metadata: Record<string, unknown>;
  returnUrl: string | null;
  cancelledAt: Date | null;
  succeededAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Status of a single provider-level charge attempt.
 */
export enum AtlasAttemptStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

/**
 * A single provider-level payment attempt linked to a PaymentIntent.
 * All monetary values are BigInt in minor units.
 */
export interface AtlasPaymentAttempt {
  id: string;
  intentId: string;
  provider: string;
  providerReference: string | null;
  status: AtlasAttemptStatus;
  amount: bigint;
  currency: AtlasCurrency;
  failureCode: string | null;
  failureMessage: string | null;
  providerResponse: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input required to create a new PaymentIntent.
 */
export interface CreatePaymentIntentInput {
  merchantId: string;
  customerId?: string;
  amount: bigint;
  currency: AtlasCurrency;
  idempotencyKey: string;
  description?: string;
  metadata?: Record<string, unknown>;
  returnUrl?: string;
}
