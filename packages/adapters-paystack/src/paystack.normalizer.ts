import { ProviderTransactionStatus } from '@atlas/adapters';

// =============================================================================
// PAYSTACK STATUS NORMALIZER
// =============================================================================

/**
 * Maps Paystack native transaction/transfer status strings to
 * the canonical ATLAS ProviderTransactionStatus enum.
 *
 * Paystack transaction statuses:
 *   success    → charge completed successfully
 *   failed     → charge was attempted but failed
 *   abandoned  → customer did not complete the authorization
 *   ongoing    → authorization is in progress (redirect)
 *   pending    → awaiting processing (mobile money)
 *   processing → being processed by provider (mobile money)
 *   reversed   → transaction was reversed/refunded
 *   queued     → queued for processing
 *
 * Paystack transfer statuses:
 *   pending    → transfer initiated, awaiting processing
 *   success    → transfer completed successfully
 *   failed     → transfer failed
 *   otp        → awaiting OTP confirmation
 *   reversed   → transfer was reversed
 *
 * Reference: https://paystack.com/docs/payments/payment-statuses/
 */
export function mapPaystackStatus(status: string): ProviderTransactionStatus {
  const normalized = status.toLowerCase().trim();

  switch (normalized) {
    case 'success':
      return ProviderTransactionStatus.SUCCEEDED;

    case 'failed':
    case 'abandoned':
      return ProviderTransactionStatus.FAILED;

    case 'pending':
    case 'queued':
      return ProviderTransactionStatus.PENDING;

    case 'ongoing':
    case 'processing':
    case 'otp': // Transfer awaiting OTP confirmation — treat as processing
      return ProviderTransactionStatus.PROCESSING;

    case 'reversed':
      return ProviderTransactionStatus.REVERSED;

    default:
      // Log a warning but don't throw — unknown statuses are mapped to UNKNOWN
      // so the system can handle them gracefully
      console.warn(
        `[paystack-normalizer] Unknown Paystack status: '${status}'. Mapping to UNKNOWN.`,
      );
      return ProviderTransactionStatus.UNKNOWN;
  }
}

/**
 * Maps a Paystack gateway_response string to an ATLAS failure code.
 *
 * @param gatewayResponse - The gateway_response field from Paystack's verify endpoint
 * @returns A normalized failure code string, or undefined if the transaction succeeded
 */
export function mapPaystackGatewayResponseToFailureCode(
  gatewayResponse: string | null | undefined,
): string | undefined {
  if (!gatewayResponse) return undefined;

  const normalized = gatewayResponse.toLowerCase().trim();

  const failureCodeMap: Record<string, string> = {
    'insufficient funds': 'insufficient_funds',
    'transaction declined': 'declined',
    'do not honor': 'do_not_honor',
    'invalid card number': 'invalid_card',
    'card expired': 'card_expired',
    'incorrect pin': 'incorrect_pin',
    'card not supported': 'card_not_supported',
    'transaction timed out': 'timeout',
    'bank not available': 'bank_unavailable',
    'mobile money operator not available': 'mobile_operator_unavailable',
    'incorrect otp': 'incorrect_otp',
    'invalid mobile number': 'invalid_mobile_number',
    'user is inactive': 'user_inactive',
    'beneficiary phone not registered': 'beneficiary_not_registered',
    'daily limit exceeded': 'daily_limit_exceeded',
    'fraud suspected': 'fraud_suspected',
  };

  for (const [key, code] of Object.entries(failureCodeMap)) {
    if (normalized.includes(key)) return code;
  }

  // If we have a gateway_response but can't map it, use a sanitized version
  return normalized.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

/**
 * Determine if a Paystack channel string is a mobile money channel.
 */
export function isPaystackMobileMoneyChannel(channel: string): boolean {
  return channel.toLowerCase() === 'mobile_money';
}

/**
 * Map a mobile money network name to the Paystack provider code.
 * Paystack requires specific codes for mobile money providers.
 */
export function mapMobileNetworkToPaystackProvider(network: string): string {
  const map: Record<string, string> = {
    mtn: 'mtn',
    'mtn ghana': 'mtn',
    vodafone: 'vod',
    'vodafone cash': 'vod',
    vodacash: 'vod',
    airteltigo: 'atl',
    airtel: 'atl',
    tigo: 'atl',
  };

  const normalized = network.toLowerCase().trim();
  return map[normalized] ?? normalized;
}
