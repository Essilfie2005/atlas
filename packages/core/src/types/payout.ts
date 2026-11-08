import type { AtlasCurrency } from './payment.js';

/**
 * Payout lifecycle status.
 */
export enum AtlasPayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REVERSED = 'REVERSED',
}

/**
 * The type of account a beneficiary holds.
 */
export enum AtlasBeneficiaryAccountType {
  BANK_ACCOUNT = 'bank_account',
  MOBILE_MONEY = 'mobile_money',
}

/**
 * A beneficiary is a named destination for payouts —
 * either a bank account or a mobile money wallet.
 */
export interface AtlasBeneficiary {
  id: string;
  merchantId: string;
  name: string;
  accountType: AtlasBeneficiaryAccountType;
  accountNumber: string;
  bankCode: string | null;
  mobileNetwork: string | null;
  currency: AtlasCurrency;
  country: string; // ISO 3166-1 alpha-2
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A payout represents a disbursement to a beneficiary.
 * All monetary values are BigInt in minor units.
 */
export interface AtlasPayout {
  id: string;
  merchantId: string;
  beneficiaryId: string;
  amount: bigint;
  currency: AtlasCurrency;
  status: AtlasPayoutStatus;
  idempotencyKey: string;
  provider: string | null;
  providerReference: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  failureCode: string | null;
  failureMessage: string | null;
  providerResponse: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input required to create a new Payout.
 */
export interface CreatePayoutInput {
  merchantId: string;
  beneficiaryId: string;
  amount: bigint;
  currency: AtlasCurrency;
  idempotencyKey: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Input required to create or update a Beneficiary.
 */
export interface CreateBeneficiaryInput {
  merchantId: string;
  name: string;
  accountType: AtlasBeneficiaryAccountType;
  accountNumber: string;
  bankCode?: string;
  mobileNetwork?: string;
  currency: AtlasCurrency;
  country: string;
  metadata?: Record<string, unknown>;
}
