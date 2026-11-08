// =============================================================================
// Paystack API Response Types
// Full type coverage of the Paystack REST API
// Reference: https://paystack.com/docs/api/
// =============================================================================

/**
 * Standard Paystack API response envelope.
 * All Paystack API responses follow this shape.
 */
export interface PaystackApiResponse<T = unknown> {
  status: boolean;
  message: string;
  data: T;
  meta?: PaystackMeta;
}

/**
 * Pagination metadata from Paystack list endpoints.
 */
export interface PaystackMeta {
  total: number;
  skipped: number;
  perPage: number;
  page: number;
  pageCount: number;
  next?: string;
  previous?: string;
}

// =============================================================================
// TRANSACTION / CHARGE
// =============================================================================

/**
 * Paystack transaction initialization data.
 * Returned by POST /transaction/initialize
 */
export interface PaystackInitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export type PaystackInitializeResponse = PaystackApiResponse<PaystackInitializeData>;

/**
 * Paystack authorization object (saved card / mobile money details).
 */
export interface PaystackAuthorization {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  channel: string;           // "card" | "mobile_money" | "bank" | etc.
  card_type: string;
  bank: string;
  country_code: string;
  brand: string;
  reusable: boolean;
  signature: string;
  account_name: string | null;
  mobile_money_number?: string;
  receiver_bank_account_number?: string | null;
  receiver_bank?: string | null;
}

/**
 * Customer object as returned by Paystack.
 */
export interface PaystackCustomer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  customer_code: string;
  phone: string | null;
  metadata: Record<string, unknown> | null;
  risk_action: string;
  international_format_phone: string | null;
}

/**
 * Log entry in a Paystack transaction timeline.
 */
export interface PaystackTransactionLog {
  start_time: number;
  time_spent: number;
  attempts: number;
  errors: number;
  success: boolean;
  mobile: boolean;
  input: unknown[];
  history: Array<{
    type: string;
    message: string;
    time: number;
  }>;
}

/**
 * Full Paystack transaction data returned by GET /transaction/verify/:reference
 */
export interface PaystackTransactionData {
  id: number;
  domain: string;                // "test" | "live"
  status: string;                // "success" | "failed" | "abandoned" | "ongoing" | "pending" | "processing" | "reversed"
  reference: string;
  receipt_number: string | null;
  amount: number;                // Amount in kobo/pesewas (Paystack uses integers too)
  message: string | null;
  gateway_response: string;
  paid_at: string | null;
  created_at: string;
  channel: string;               // "card" | "mobile_money" | "bank"
  currency: string;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  log: PaystackTransactionLog | null;
  fees: number | null;
  fees_split: Record<string, unknown> | null;
  authorization: PaystackAuthorization;
  customer: PaystackCustomer;
  plan: unknown | null;
  split: Record<string, unknown>;
  subaccount: Record<string, unknown>;
  order_id: string | null;
  paidAt: string | null;
  createdAt: string;
  requested_amount: number;
  pos_transaction_data: unknown | null;
  source: unknown | null;
  fees_breakdown: unknown | null;
  transaction_date: string;
  plan_object: Record<string, unknown>;
  subaccount_object: Record<string, unknown>;
}

export type PaystackVerifyResponse = PaystackApiResponse<PaystackTransactionData>;

// =============================================================================
// TRANSFER RECIPIENTS (for payouts)
// =============================================================================

/**
 * Transfer recipient details (used for initiating payouts).
 */
export interface PaystackTransferRecipientDetails {
  authorization_code?: string;
  account_number?: string;
  account_name?: string | null;
  bank_code?: string;
  bank_name?: string;
  mobile_money_number?: string;
  mobile_money_network?: string;
}

/**
 * Transfer recipient object returned by Paystack.
 */
export interface PaystackTransferRecipient {
  active: boolean;
  createdAt: string;
  currency: string;
  description: string;
  domain: string;
  email: string | null;
  id: number;
  integration: number;
  metadata: Record<string, unknown> | null;
  name: string;
  recipient_code: string;
  type: string;                  // "nuban" | "mobile_money" | "ghipss" | "basa"
  updatedAt: string;
  is_deleted: boolean;
  details: PaystackTransferRecipientDetails;
}

export type PaystackCreateTransferRecipientResponse =
  PaystackApiResponse<PaystackTransferRecipient>;

/**
 * Request body for creating a transfer recipient.
 */
export interface PaystackCreateTransferRecipientRequest {
  type: 'nuban' | 'mobile_money' | 'ghipss' | 'basa';
  name: string;
  account_number: string;
  bank_code?: string;
  currency: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// TRANSFERS (PAYOUTS)
// =============================================================================

/**
 * Transfer data returned by Paystack for payout operations.
 */
export interface PaystackTransferData {
  integration: number;
  domain: string;
  amount: number;
  currency: string;
  source: string;                // "balance"
  reason: string;
  recipient: number;
  status: string;                // "pending" | "success" | "failed" | "otp"
  transfer_code: string;
  id: number;
  createdAt: string;
  updatedAt: string;
  reference: string | null;
  failures: unknown | null;
  titan_code: unknown | null;
  source_details: unknown | null;
  fee_charged: number | null;
  fees_breakdown: unknown | null;
  gateway_response: string | null;
  otp: string | null;
  transfer_attempts: unknown[];
  complete_message: string;
  needs_otp: boolean;
  paid_at: string | null;
}

export type PaystackInitiateTransferResponse = PaystackApiResponse<PaystackTransferData>;
export type PaystackVerifyTransferResponse = PaystackApiResponse<PaystackTransferData>;

/**
 * Request body for initiating a Paystack transfer.
 */
export interface PaystackInitiateTransferRequest {
  source: 'balance';
  amount: number;                // Amount in minor units (kobo/pesewas)
  recipient: string;             // Recipient code (e.g. "RCP_xxxx")
  reason?: string;
  currency?: string;
  reference?: string;            // Optional idempotency reference
}

// =============================================================================
// WEBHOOKS
// =============================================================================

/**
 * Paystack webhook event types.
 */
export type PaystackWebhookEventType =
  | 'charge.success'
  | 'charge.dispute.create'
  | 'charge.dispute.resolve'
  | 'transfer.success'
  | 'transfer.failed'
  | 'transfer.reversed'
  | 'paymentrequest.success'
  | 'paymentrequest.pending'
  | 'subscription.create'
  | 'subscription.disable'
  | 'invoice.create'
  | 'invoice.update'
  | 'invoice.payment_failed'
  | 'customeridentification.failed'
  | 'customeridentification.success'
  | 'dedicatedaccount.assign.success'
  | 'dedicatedaccount.assign.failed';

/**
 * Paystack webhook event payload.
 * The `data` field varies by event type.
 */
export interface PaystackWebhookPayload {
  event: PaystackWebhookEventType;
  data: PaystackTransactionData | PaystackTransferData | Record<string, unknown>;
}

// =============================================================================
// BANKS
// =============================================================================

/**
 * Bank object returned by Paystack GET /bank
 */
export interface PaystackBank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  active: boolean;
  is_deleted: boolean;
  country: string;
  currency: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export type PaystackListBanksResponse = PaystackApiResponse<PaystackBank[]>;

// =============================================================================
// ACCOUNT VALIDATION
// =============================================================================

/**
 * Account number validation result.
 */
export interface PaystackAccountValidationData {
  account_number: string;
  account_name: string;
  bank_id: number;
}

export type PaystackValidateAccountResponse =
  PaystackApiResponse<PaystackAccountValidationData>;

// =============================================================================
// ERRORS
// =============================================================================

/**
 * Paystack API error shape.
 */
export interface PaystackApiError {
  status: false;
  message: string;
  data?: Record<string, string[]>;
}
