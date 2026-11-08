import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

/**
 * Sign a payload using HMAC-SHA256.
 *
 * @param payload - The raw string payload to sign (typically JSON)
 * @param secret  - The HMAC signing secret
 * @returns Hex-encoded HMAC-SHA256 signature
 *
 * @example
 * const sig = signHmac('{"event":"payment.succeeded"}', process.env.ATLAS_SIGNING_SECRET);
 * // sig = "3f4a2b1c..."
 */
export function signHmac(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

/**
 * Verify an HMAC-SHA256 signature using a timing-safe comparison.
 *
 * Uses `timingSafeEqual` to prevent timing-based side-channel attacks.
 * Both buffers must be the same length; we compare hex strings so they always are.
 *
 * @param payload   - The raw string payload that was signed
 * @param signature - The hex-encoded signature to verify
 * @param secret    - The HMAC signing secret
 * @returns true if the signature is valid, false otherwise
 */
export function verifyHmac(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const expectedSignature = signHmac(payload, secret);
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const actualBuffer = Buffer.from(signature, 'hex');

    // Buffers must be same length for timingSafeEqual
    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    // If anything fails (e.g. invalid hex), treat as verification failure
    return false;
  }
}

/**
 * Compute the SHA-256 hash of an API key for database storage.
 * The raw key is NEVER stored — only this hash.
 *
 * @param key - The raw API key string
 * @returns Hex-encoded SHA-256 digest
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex');
}

/**
 * Compute a SHA-256 hash of arbitrary data.
 *
 * @param data - The data to hash
 * @returns Hex-encoded SHA-256 digest
 */
export function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Build the ATLAS webhook signature header value.
 *
 * Format: t={timestamp},v1={signature}
 * This format (similar to Stripe's) allows webhook consumers to verify
 * both the signature and the timestamp to prevent replay attacks.
 *
 * @param payload   - The JSON payload string
 * @param secret    - The signing secret for this webhook endpoint
 * @param timestamp - Unix timestamp in seconds (defaults to now)
 * @returns The value to set as the X-Atlas-Signature header
 */
export function buildWebhookSignatureHeader(
  payload: string,
  secret: string,
  timestamp?: number,
): string {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const signedPayload = `${ts}.${payload}`;
  const signature = signHmac(signedPayload, secret);
  return `t=${ts},v1=${signature}`;
}

/**
 * Verify an ATLAS webhook signature header.
 *
 * @param payload           - The raw request body string
 * @param signatureHeader   - The X-Atlas-Signature header value
 * @param secret            - The signing secret for this endpoint
 * @param toleranceSeconds  - Max allowed age of the event in seconds (default: 300)
 * @returns true if valid and within the tolerance window
 */
export function verifyWebhookSignatureHeader(
  payload: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300,
): boolean {
  try {
    // Parse: t={timestamp},v1={signature}
    const parts = signatureHeader.split(',');
    const tPart = parts.find((p) => p.startsWith('t='));
    const v1Part = parts.find((p) => p.startsWith('v1='));

    if (!tPart || !v1Part) return false;

    const timestamp = parseInt(tPart.slice(2), 10);
    const signature = v1Part.slice(3);

    if (isNaN(timestamp)) return false;

    // Check timestamp is within tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) return false;

    // Verify signature
    const signedPayload = `${timestamp}.${payload}`;
    return verifyHmac(signedPayload, signature, secret);
  } catch {
    return false;
  }
}
