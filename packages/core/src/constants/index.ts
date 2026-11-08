import { AtlasCurrency } from '../types/payment.js';

// =============================================================================
// CURRENCY CONFIGURATION
// =============================================================================

/**
 * All currencies supported by the ATLAS platform.
 * Each entry maps ISO 4217 code to metadata.
 */
export const SUPPORTED_CURRENCIES: ReadonlyMap<
  AtlasCurrency,
  {
    code: AtlasCurrency;
    name: string;
    symbol: string;
    minorUnitFactor: number; // How many minor units = 1 major unit
    minPaymentAmount: bigint; // Minimum charge in minor units
    maxPaymentAmount: bigint; // Maximum charge in minor units
  }
> = new Map([
  [
    AtlasCurrency.GHS,
    {
      code: AtlasCurrency.GHS,
      name: 'Ghana Cedi',
      symbol: '₵',
      minorUnitFactor: 100,
      minPaymentAmount: 100n,    // 1.00 GHS minimum
      maxPaymentAmount: 10_000_000_00n, // 10,000,000.00 GHS maximum
    },
  ],
  [
    AtlasCurrency.NGN,
    {
      code: AtlasCurrency.NGN,
      name: 'Nigerian Naira',
      symbol: '₦',
      minorUnitFactor: 100,
      minPaymentAmount: 100n,    // 1.00 NGN minimum
      maxPaymentAmount: 100_000_000_00n, // 100,000,000.00 NGN maximum
    },
  ],
  [
    AtlasCurrency.KES,
    {
      code: AtlasCurrency.KES,
      name: 'Kenyan Shilling',
      symbol: 'KSh',
      minorUnitFactor: 100,
      minPaymentAmount: 100n,     // 1.00 KES minimum
      maxPaymentAmount: 10_000_000_00n, // 10,000,000.00 KES maximum
    },
  ],
  [
    AtlasCurrency.UGX,
    {
      code: AtlasCurrency.UGX,
      name: 'Ugandan Shilling',
      symbol: 'USh',
      minorUnitFactor: 100,
      minPaymentAmount: 100n,
      maxPaymentAmount: 100_000_000_00n,
    },
  ],
  [
    AtlasCurrency.TZS,
    {
      code: AtlasCurrency.TZS,
      name: 'Tanzanian Shilling',
      symbol: 'TSh',
      minorUnitFactor: 100,
      minPaymentAmount: 100n,
      maxPaymentAmount: 100_000_000_00n,
    },
  ],
  [
    AtlasCurrency.ZAR,
    {
      code: AtlasCurrency.ZAR,
      name: 'South African Rand',
      symbol: 'R',
      minorUnitFactor: 100,
      minPaymentAmount: 100n,    // 1.00 ZAR minimum
      maxPaymentAmount: 10_000_000_00n, // 10,000,000.00 ZAR maximum
    },
  ],
  [
    AtlasCurrency.USD,
    {
      code: AtlasCurrency.USD,
      name: 'US Dollar',
      symbol: '$',
      minorUnitFactor: 100,
      minPaymentAmount: 50n,      // 0.50 USD minimum
      maxPaymentAmount: 1_000_000_00n, // 1,000,000.00 USD maximum
    },
  ],
]);

// =============================================================================
// COUNTRY CONFIGURATION
// =============================================================================

/**
 * All countries currently supported by the ATLAS platform.
 */
export const SUPPORTED_COUNTRIES: ReadonlyMap<
  string,
  {
    code: string;       // ISO 3166-1 alpha-2
    name: string;
    defaultCurrency: AtlasCurrency;
    callingCode: string;
  }
> = new Map([
  [
    'GH',
    {
      code: 'GH',
      name: 'Ghana',
      defaultCurrency: AtlasCurrency.GHS,
      callingCode: '+233',
    },
  ],
  [
    'NG',
    {
      code: 'NG',
      name: 'Nigeria',
      defaultCurrency: AtlasCurrency.NGN,
      callingCode: '+234',
    },
  ],
  [
    'KE',
    {
      code: 'KE',
      name: 'Kenya',
      defaultCurrency: AtlasCurrency.KES,
      callingCode: '+254',
    },
  ],
  [
    'UG',
    {
      code: 'UG',
      name: 'Uganda',
      defaultCurrency: AtlasCurrency.UGX,
      callingCode: '+256',
    },
  ],
  [
    'TZ',
    {
      code: 'TZ',
      name: 'Tanzania',
      defaultCurrency: AtlasCurrency.TZS,
      callingCode: '+255',
    },
  ],
  [
    'ZA',
    {
      code: 'ZA',
      name: 'South Africa',
      defaultCurrency: AtlasCurrency.ZAR,
      callingCode: '+27',
    },
  ],
]);

// =============================================================================
// DEFAULTS
// =============================================================================

export const DEFAULT_CURRENCY: AtlasCurrency = AtlasCurrency.GHS;
export const DEFAULT_COUNTRY = 'GH';

// =============================================================================
// PAYMENT LIMITS
// =============================================================================

/**
 * Absolute maximum payment amount across all currencies (in minor units).
 * Currency-specific limits are defined per-currency in SUPPORTED_CURRENCIES.
 * This is a hard global cap.
 */
export const MAX_PAYMENT_AMOUNT: bigint = 1_000_000_000n; // 10M major units at 100 minor/major

/**
 * Maximum number of retry attempts for a failed payment.
 */
export const MAX_PAYMENT_RETRY_ATTEMPTS = 3;

/**
 * Maximum number of retry attempts for a failed webhook delivery.
 */
export const MAX_WEBHOOK_RETRY_ATTEMPTS = 10;

/**
 * Webhook retry delays in seconds (exponential-ish backoff).
 * Index 0 = delay before 1st retry, index N = delay before Nth retry.
 */
export const WEBHOOK_RETRY_DELAYS_SECONDS: ReadonlyArray<number> = [
  5,      // 5 seconds
  30,     // 30 seconds
  120,    // 2 minutes
  600,    // 10 minutes
  1_800,  // 30 minutes
  3_600,  // 1 hour
  7_200,  // 2 hours
  21_600, // 6 hours
  43_200, // 12 hours
  86_400, // 24 hours
];

// =============================================================================
// API VERSIONING
// =============================================================================

/**
 * All released API versions, newest first.
 */
export const API_VERSIONS: ReadonlyArray<string> = ['2024-01-01'];

/**
 * The current (latest) API version.
 */
export const CURRENT_API_VERSION: string = API_VERSIONS[0] ?? '2024-01-01';

// =============================================================================
// IDEMPOTENCY
// =============================================================================

/**
 * How long idempotency keys are cached in Redis (seconds).
 */
export const IDEMPOTENCY_KEY_TTL_SECONDS = 86_400; // 24 hours

// =============================================================================
// PROVIDERS
// =============================================================================

/**
 * All registered payment provider identifiers.
 */
export const PAYMENT_PROVIDERS = {
  PAYSTACK: 'paystack',
  FLUTTERWAVE: 'flutterwave',
  MTN_MOMO: 'mtn_momo',
  VODAFONE_CASH: 'vodafone_cash',
  AIRTEL_MONEY: 'airtel_money',
} as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];
