// =============================================================================
// Types
// =============================================================================
export type {
  AtlasPaymentIntent,
  AtlasPaymentAttempt,
  CreatePaymentIntentInput,
} from './types/payment.js';
export { AtlasPaymentStatus, AtlasCurrency, AtlasAttemptStatus } from './types/payment.js';

export type {
  AtlasMerchant,
  AtlasApiKey,
  ApiKeyCreationResult,
} from './types/merchant.js';
export {
  AtlasMerchantStatus,
  AtlasRiskProfile,
  AtlasApiKeyType,
  AtlasApiKeyStatus,
} from './types/merchant.js';

export type {
  AtlasPayout,
  AtlasBeneficiary,
  CreatePayoutInput,
  CreateBeneficiaryInput,
} from './types/payout.js';
export {
  AtlasPayoutStatus,
  AtlasBeneficiaryAccountType,
} from './types/payout.js';

export type {
  AtlasWebhookEvent,
  AtlasWebhookPayload,
  AtlasWebhookDelivery,
} from './types/webhook.js';
export { WebhookEventType, WebhookDeliveryStatus } from './types/webhook.js';

// =============================================================================
// State Machine
// =============================================================================
export {
  PAYMENT_INTENT_VALID_TRANSITIONS,
  isValidPaymentTransition,
  getValidNextStates,
  isTerminalPaymentStatus,
  assertValidPaymentTransition,
} from './state-machine/payment.js';

// =============================================================================
// Utilities
// =============================================================================
export {
  Money,
  parseBigIntAmount,
  serializeBigInt,
  percentOf,
} from './utils/money.js';

export {
  generateId,
  generateIdempotencyKey,
  generateApiKeyPair,
  generateWebhookSigningSecret,
} from './utils/ids.js';
export type { ApiKeyEnvironment, GeneratedApiKey } from './utils/ids.js';

export {
  signHmac,
  verifyHmac,
  hashApiKey,
  sha256,
  buildWebhookSignatureHeader,
  verifyWebhookSignatureHeader,
} from './utils/crypto.js';

// =============================================================================
// Constants
// =============================================================================
export {
  SUPPORTED_CURRENCIES,
  SUPPORTED_COUNTRIES,
  DEFAULT_CURRENCY,
  DEFAULT_COUNTRY,
  MAX_PAYMENT_AMOUNT,
  MAX_PAYMENT_RETRY_ATTEMPTS,
  MAX_WEBHOOK_RETRY_ATTEMPTS,
  WEBHOOK_RETRY_DELAYS_SECONDS,
  API_VERSIONS,
  CURRENT_API_VERSION,
  IDEMPOTENCY_KEY_TTL_SECONDS,
  PAYMENT_PROVIDERS,
} from './constants/index.js';
export type { PaymentProvider } from './constants/index.js';
