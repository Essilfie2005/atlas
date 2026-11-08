/**
 * Merchant status within the ATLAS platform.
 */
export enum AtlasMerchantStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

/**
 * Merchant risk classification.
 */
export enum AtlasRiskProfile {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

/**
 * A fully resolved ATLAS merchant entity.
 */
export interface AtlasMerchant {
  id: string;
  legalName: string;
  status: AtlasMerchantStatus;
  country: string; // ISO 3166-1 alpha-2
  riskProfile: AtlasRiskProfile;
  email: string;
  website: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API key type determines which environment the key operates in.
 */
export enum AtlasApiKeyType {
  TEST = 'TEST',
  LIVE = 'LIVE',
}

/**
 * API key lifecycle status.
 */
export enum AtlasApiKeyStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

/**
 * A resolved ATLAS API key.
 * The raw key is NEVER stored — only the hash and prefix.
 */
export interface AtlasApiKey {
  id: string;
  merchantId: string;
  name: string;
  keyHash: string;
  prefix: string;
  type: AtlasApiKeyType;
  status: AtlasApiKeyStatus;
  scopes: string[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
}

/**
 * Result returned when generating a new API key pair.
 * The raw `key` is shown ONCE and never stored — only `hash` is persisted.
 */
export interface ApiKeyCreationResult {
  key: string;    // Full raw key (e.g. "sk_live_xxxxxxxxxxxx") — show once!
  prefix: string; // First 12 chars for display identification
  hash: string;   // SHA-256 hash for storage in the database
}
