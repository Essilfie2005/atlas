// Re-export the Prisma client singleton
export { prisma, default } from './client.js';

// Re-export all Prisma-generated types so consumers don't need to import
// from @prisma/client directly — they only depend on @atlas/db
export type {
  // Model types
  Merchant,
  ApiKey,
  Customer,
  PaymentIntent,
  PaymentAttempt,
  Beneficiary,
  Payout,
  LedgerEntry,
  Settlement,
  WebhookEvent,
  WebhookDelivery,
  AuditLog,

  // Enum types
  MerchantStatus,
  RiskProfile,
  ApiKeyType,
  ApiKeyStatus,
  PaymentIntentStatus,
  PaymentAttemptStatus,
  PayoutStatus,
  LedgerEntryType,
  SettlementStatus,
  WebhookEventDeliveryStatus,

  // Prisma utility types
  Prisma,
} from './generated/prisma/index.js';

// Re-export enum values (not just types) for runtime usage
export {
  MerchantStatus,
  RiskProfile,
  ApiKeyType,
  ApiKeyStatus,
  PaymentIntentStatus,
  PaymentAttemptStatus,
  PayoutStatus,
  LedgerEntryType,
  SettlementStatus,
  WebhookEventDeliveryStatus,
} from './generated/prisma/index.js';
