import { createId } from '@paralleldrive/cuid2';
import { createHmac, randomBytes } from 'node:crypto';

/**
 * Generate a globally unique ID using cuid2.
 * Suitable for use as a primary key in the database.
 *
 * @example
 * generateId() // "clzx2q5j40000qgr3h5b7d8c1"
 */
export function generateId(): string {
  return createId();
}

/**
 * Generate a random idempotency key.
 * 32 bytes of cryptographically random data encoded as hex = 64 character string.
 *
 * @example
 * generateIdempotencyKey() // "3f4a2b1c9d8e7f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f0a1b2c3d4e5f6"
 */
export function generateIdempotencyKey(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Environment mode for API key generation.
 */
export type ApiKeyEnvironment = 'test' | 'live';

/**
 * The result of generating a new API key pair.
 * The raw `key` must be shown to the user exactly ONCE and then discarded.
 * Only the `hash` is stored in the database.
 */
export interface GeneratedApiKey {
  /** Full raw API key — SHOW ONCE, never persist this value */
  key: string;
  /** First 12 chars of the key for display/identification purposes */
  prefix: string;
  /** SHA-256 hex digest of the raw key — store this in the database */
  hash: string;
}

/**
 * Generate a new API key pair.
 *
 * Format: sk_{environment}_{32_bytes_hex}
 * Example: sk_test_3f4a2b1c9d8e7f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f0a1b2c3d4e5f6
 *
 * The raw key is returned once for delivery to the user.
 * The hash should be stored; the raw key should NOT be stored.
 *
 * @param environment - 'test' or 'live'
 * @returns { key, prefix, hash }
 */
export function generateApiKeyPair(
  environment: ApiKeyEnvironment = 'test',
): GeneratedApiKey {
  const rawSecret = randomBytes(32).toString('hex');
  const key = `sk_${environment}_${rawSecret}`;
  const prefix = key.substring(0, 12); // e.g. "sk_test_3f4a"

  // SHA-256 hash of the full raw key
  const hash = createHmac('sha256', 'atlas-api-key-hash-pepper')
    .update(key)
    .digest('hex');

  return { key, prefix, hash };
}

/**
 * Generate a random signing secret for webhook endpoints.
 * 32 bytes of cryptographically random data encoded as hex.
 */
export function generateWebhookSigningSecret(): string {
  return `whsec_${randomBytes(32).toString('hex')}`;
}
