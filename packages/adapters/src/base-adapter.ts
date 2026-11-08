import type {
  ProviderChargeRequest,
  ProviderChargeResponse,
  ProviderPayoutRequest,
  ProviderPayoutResponse,
  ProviderRefundRequest,
  ProviderRefundResponse,
  ProviderWebhookEvent,
  ProviderHealth,
} from './types.js';

/**
 * Abstract base class for all ATLAS payment provider adapters.
 *
 * Every concrete adapter (Paystack, Flutterwave, MTN MoMo, etc.) MUST extend
 * this class and implement all abstract methods.
 *
 * Design principles:
 * - All monetary amounts are BigInt in minor units
 * - All methods return normalized ATLAS types (not provider-specific ones)
 * - Adapters are stateless — all configuration is passed to the constructor
 * - Adapters handle their own HTTP retries internally (with exponential backoff)
 * - Adapters MUST be idempotent — duplicate calls with the same idempotency key
 *   must not cause duplicate charges
 */
export abstract class ProviderAdapter {
  /**
   * Returns the canonical identifier for this provider.
   * Must be lowercase, snake_case, and stable across deployments.
   *
   * @example "paystack" | "flutterwave" | "mtn_momo"
   */
  abstract getName(): string;

  /**
   * Returns the ISO 4217 currency codes this adapter supports.
   *
   * @example ['GHS', 'NGN']
   */
  abstract getSupportedCurrencies(): ReadonlyArray<string>;

  /**
   * Initiate a charge (payment collection) request.
   *
   * For redirect-based flows (e.g. Paystack checkout), the response will
   * contain an `authorizationUrl`. The user must be redirected there.
   *
   * For direct charge flows (mobile money), the provider may initiate
   * a USSD push — status will be PENDING until the user confirms.
   *
   * @throws {ProviderError} on network failure or provider API error
   */
  abstract charge(request: ProviderChargeRequest): Promise<ProviderChargeResponse>;

  /**
   * Retrieve the current status of a previously initiated charge.
   *
   * @param providerReference - The provider's transaction reference ID
   * @throws {ProviderError} if the transaction is not found or network fails
   */
  abstract getCharge(providerReference: string): Promise<ProviderChargeResponse>;

  /**
   * Issue a full or partial refund for a previously succeeded charge.
   *
   * @throws {ProviderError} on failure
   */
  abstract refund(request: ProviderRefundRequest): Promise<ProviderRefundResponse>;

  /**
   * Initiate a payout (disbursement) to a beneficiary.
   *
   * @throws {ProviderError} on failure
   */
  abstract payout(request: ProviderPayoutRequest): Promise<ProviderPayoutResponse>;

  /**
   * Retrieve the current status of a previously initiated payout.
   *
   * @param providerReference - The provider's transfer/payout reference ID
   * @throws {ProviderError} if the payout is not found or network fails
   */
  abstract getPayout(providerReference: string): Promise<ProviderPayoutResponse>;

  /**
   * Verify that an inbound webhook request originated from the provider.
   *
   * MUST use a timing-safe comparison when verifying HMAC signatures.
   *
   * @param payload   - The raw request body as a string (do not parse before verifying)
   * @param headers   - The inbound request headers
   * @returns true if the webhook signature is valid
   */
  abstract verifyWebhook(
    payload: string,
    headers: Record<string, string | string[] | undefined>,
  ): boolean;

  /**
   * Parse a verified webhook payload into a normalized ProviderWebhookEvent.
   *
   * Only call this AFTER verifyWebhook() returns true.
   *
   * @param payload - The raw request body string
   * @returns Normalized webhook event
   * @throws {ProviderError} if the payload cannot be parsed
   */
  abstract parseWebhook(payload: string): ProviderWebhookEvent;

  /**
   * Perform a health check against the provider API.
   *
   * Should be a lightweight call (e.g. resolve a bank list or ping endpoint).
   * Must complete within a reasonable timeout (recommend < 5s).
   *
   * @returns ProviderHealth with latency and status
   */
  abstract getHealth(): Promise<ProviderHealth>;

  // ─── Concrete helpers available to all adapters ──────────────────────────

  /**
   * Returns true if the given currency is supported by this adapter.
   */
  supportsCurrency(currency: string): boolean {
    return this.getSupportedCurrencies().includes(currency.toUpperCase());
  }

  /**
   * Asserts that the given currency is supported.
   * @throws {Error} if the currency is not supported by this adapter
   */
  assertSupportsCurrency(currency: string): void {
    if (!this.supportsCurrency(currency)) {
      throw new Error(
        `Provider '${this.getName()}' does not support currency '${currency}'. ` +
          `Supported currencies: [${this.getSupportedCurrencies().join(', ')}]`,
      );
    }
  }

  /**
   * Returns a string identifier useful for logging.
   */
  toString(): string {
    return `ProviderAdapter(${this.getName()})`;
  }
}

/**
 * Error thrown by provider adapters when a provider API call fails.
 */
export class ProviderError extends Error {
  /** HTTP status code from the provider, if applicable */
  readonly statusCode?: number;
  /** Provider's own error code */
  readonly providerCode?: string;
  /** Provider's own error message */
  readonly providerMessage?: string;
  /** Raw provider response for debugging */
  readonly rawResponse?: unknown;
  /** Whether this error is retryable */
  readonly retryable: boolean;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      providerCode?: string;
      providerMessage?: string;
      rawResponse?: unknown;
      retryable?: boolean;
      cause?: Error;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'ProviderError';
    this.statusCode = options.statusCode;
    this.providerCode = options.providerCode;
    this.providerMessage = options.providerMessage;
    this.rawResponse = options.rawResponse;
    this.retryable = options.retryable ?? false;
  }
}
