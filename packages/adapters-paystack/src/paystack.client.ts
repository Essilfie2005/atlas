import axios, { type AxiosInstance, type AxiosRequestConfig, AxiosError } from 'axios';
import { ProviderError } from '@atlas/adapters';
import type {
  PaystackInitializeResponse,
  PaystackVerifyResponse,
  PaystackInitiateTransferResponse,
  PaystackVerifyTransferResponse,
  PaystackCreateTransferRecipientResponse,
  PaystackCreateTransferRecipientRequest,
  PaystackInitiateTransferRequest,
  PaystackListBanksResponse,
  PaystackValidateAccountResponse,
  PaystackApiError,
} from './paystack.types.js';

// =============================================================================
// PAYSTACK CLIENT CONFIGURATION
// =============================================================================

export interface PaystackClientConfig {
  /** Paystack secret key — sk_test_xxx or sk_live_xxx */
  secretKey: string;
  /**
   * Use the live Paystack API.
   * When false (default), uses the same base URL but with test keys.
   * Paystack uses the key prefix to determine test vs. live mode.
   */
  useLiveMode?: boolean;
  /** Request timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
  /** Maximum number of retry attempts for retryable errors (default: 3) */
  maxRetries?: number;
}

// Paystack base URL — same for both test and live; key prefix determines mode
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// HTTP status codes that should trigger a retry
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

// =============================================================================
// PAYSTACK HTTP CLIENT
// =============================================================================

/**
 * Low-level HTTP client wrapping the Paystack REST API.
 *
 * Handles:
 * - Authentication via Authorization: Bearer header
 * - Request timeouts
 * - Exponential backoff retries for transient failures
 * - Error normalization into ProviderError
 *
 * Reference: https://paystack.com/docs/api/
 */
export class PaystackClient {
  private readonly axios: AxiosInstance;
  private readonly maxRetries: number;

  constructor(private readonly config: PaystackClientConfig) {
    if (!config.secretKey) {
      throw new Error('Paystack secretKey is required');
    }
    if (!config.secretKey.startsWith('sk_test_') && !config.secretKey.startsWith('sk_live_')) {
      throw new Error(
        'Invalid Paystack secret key format. Expected sk_test_xxx or sk_live_xxx',
      );
    }

    this.maxRetries = config.maxRetries ?? 3;

    this.axios = axios.create({
      baseURL: PAYSTACK_BASE_URL,
      timeout: config.timeoutMs ?? 30_000,
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'atlas-paystack-adapter/1.0.0',
      },
    });
  }

  // ─── Transactions ───────────────────────────────────────────────────────────

  /**
   * Initialize a new transaction and get the authorization URL.
   *
   * POST /transaction/initialize
   *
   * @param params.email         Customer email
   * @param params.amount        Amount in kobo/pesewas (minor units as a number — Paystack uses integers)
   * @param params.currency      ISO 4217 currency code (GHS, NGN)
   * @param params.reference     Unique transaction reference (idempotency key)
   * @param params.callbackUrl   URL to redirect after payment
   * @param params.metadata      Optional metadata passed to Paystack
   * @param params.channels      Payment channels to enable (e.g. ["mobile_money", "card"])
   */
  async initializeTransaction(params: {
    email: string;
    amount: number;
    currency: string;
    reference: string;
    callbackUrl?: string;
    metadata?: Record<string, unknown>;
    channels?: string[];
    mobileMoneyPhone?: string;
    mobileMoneyProvider?: string;
  }): Promise<PaystackInitializeResponse> {
    const payload: Record<string, unknown> = {
      email: params.email,
      amount: params.amount,
      currency: params.currency,
      reference: params.reference,
    };

    if (params.callbackUrl) payload['callback_url'] = params.callbackUrl;
    if (params.metadata) payload['metadata'] = params.metadata;
    if (params.channels) payload['channels'] = params.channels;
    if (params.mobileMoneyPhone) payload['mobile_money'] = {
      phone: params.mobileMoneyPhone,
      provider: params.mobileMoneyProvider ?? 'mtn',
    };

    return this.post<PaystackInitializeResponse>('/transaction/initialize', payload);
  }

  /**
   * Verify a transaction by its reference.
   *
   * GET /transaction/verify/:reference
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    if (!reference || reference.trim() === '') {
      throw new ProviderError('Transaction reference is required for verification', {
        retryable: false,
      });
    }
    return this.get<PaystackVerifyResponse>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
    );
  }

  // ─── Transfer Recipients ────────────────────────────────────────────────────

  /**
   * Create a transfer recipient (required before initiating a payout).
   *
   * POST /transferrecipient
   */
  async createTransferRecipient(
    params: PaystackCreateTransferRecipientRequest,
  ): Promise<PaystackCreateTransferRecipientResponse> {
    return this.post<PaystackCreateTransferRecipientResponse>(
      '/transferrecipient',
      params,
    );
  }

  // ─── Transfers (Payouts) ────────────────────────────────────────────────────

  /**
   * Initiate a transfer (payout) to a transfer recipient.
   *
   * POST /transfer
   */
  async initiateTransfer(
    params: PaystackInitiateTransferRequest,
  ): Promise<PaystackInitiateTransferResponse> {
    return this.post<PaystackInitiateTransferResponse>('/transfer', params);
  }

  /**
   * Verify a transfer by its reference.
   *
   * GET /transfer/verify/:reference
   */
  async verifyTransfer(reference: string): Promise<PaystackVerifyTransferResponse> {
    if (!reference || reference.trim() === '') {
      throw new ProviderError('Transfer reference is required for verification', {
        retryable: false,
      });
    }
    return this.get<PaystackVerifyTransferResponse>(
      `/transfer/verify/${encodeURIComponent(reference)}`,
    );
  }

  // ─── Utility ────────────────────────────────────────────────────────────────

  /**
   * List supported banks for a given country.
   *
   * GET /bank
   */
  async listBanks(country: string = 'ghana'): Promise<PaystackListBanksResponse> {
    return this.get<PaystackListBanksResponse>(
      `/bank?country=${encodeURIComponent(country)}&use_cursor=true&perPage=100`,
    );
  }

  /**
   * Validate a bank account number.
   *
   * GET /bank/resolve
   */
  async validateAccount(
    accountNumber: string,
    bankCode: string,
  ): Promise<PaystackValidateAccountResponse> {
    return this.get<PaystackValidateAccountResponse>(
      `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
    );
  }

  // ─── HTTP Methods with retry ─────────────────────────────────────────────────

  private async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry<T>({ method: 'GET', url: path, ...config });
  }

  private async post<T>(
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.requestWithRetry<T>({ method: 'POST', url: path, data, ...config });
  }

  /**
   * Execute an HTTP request with exponential backoff retries.
   * Retries are only attempted for known transient errors.
   */
  private async requestWithRetry<T>(
    config: AxiosRequestConfig,
    attempt = 1,
  ): Promise<T> {
    try {
      const response = await this.axios.request<T>(config);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const statusCode = error.response?.status;
        const responseData = error.response?.data as PaystackApiError | undefined;
        const providerMessage = responseData?.message ?? error.message;
        const isRetryable =
          statusCode !== undefined && RETRYABLE_STATUS_CODES.has(statusCode);

        // Only retry if retryable and we have retries left
        if (isRetryable && attempt < this.maxRetries) {
          const delayMs = Math.min(
            1000 * Math.pow(2, attempt - 1) + Math.random() * 100,
            10_000,
          );
          await sleep(delayMs);
          return this.requestWithRetry<T>(config, attempt + 1);
        }

        throw new ProviderError(
          `Paystack API error: ${providerMessage}`,
          {
            statusCode,
            providerMessage,
            rawResponse: error.response?.data,
            retryable: isRetryable,
          },
        );
      }

      // Non-Axios errors (e.g. network timeouts, Node.js errors)
      if (error instanceof Error) {
        const isNetworkError =
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('ENOTFOUND') ||
          error.message.includes('timeout');

        if (isNetworkError && attempt < this.maxRetries) {
          const delayMs = Math.min(
            1000 * Math.pow(2, attempt - 1) + Math.random() * 100,
            10_000,
          );
          await sleep(delayMs);
          return this.requestWithRetry<T>(config, attempt + 1);
        }

        throw new ProviderError(`Paystack network error: ${error.message}`, {
          retryable: isNetworkError,
          cause: error,
        });
      }

      throw new ProviderError('Unknown error communicating with Paystack', {
        retryable: false,
      });
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
