/**
 * All event types that ATLAS can emit as webhook notifications.
 */
export enum WebhookEventType {
  // Payment Intent events
  PAYMENT_INTENT_CREATED = 'payment_intent.created',
  PAYMENT_INTENT_PROCESSING = 'payment_intent.processing',
  PAYMENT_INTENT_REQUIRES_ACTION = 'payment_intent.requires_action',
  PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED = 'payment_intent.failed',
  PAYMENT_INTENT_CANCELLED = 'payment_intent.cancelled',

  // Payout events
  PAYOUT_CREATED = 'payout.created',
  PAYOUT_PROCESSING = 'payout.processing',
  PAYOUT_SUCCEEDED = 'payout.succeeded',
  PAYOUT_FAILED = 'payout.failed',
  PAYOUT_CANCELLED = 'payout.cancelled',
  PAYOUT_REVERSED = 'payout.reversed',
}

/**
 * Delivery status of a webhook event.
 */
export enum WebhookDeliveryStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  ABANDONED = 'ABANDONED',
}

/**
 * The canonical ATLAS webhook event envelope.
 * All webhooks are signed with HMAC-SHA256.
 */
export interface AtlasWebhookEvent {
  id: string;
  merchantId: string;
  paymentIntentId: string | null;
  eventType: WebhookEventType;
  payload: Record<string, unknown>;
  endpointUrl: string;
  deliveryStatus: WebhookDeliveryStatus;
  attemptCount: number;
  nextRetryAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The signed webhook payload sent to merchant endpoints.
 * Merchants must verify `X-Atlas-Signature` against this envelope.
 */
export interface AtlasWebhookPayload<T = Record<string, unknown>> {
  id: string;
  type: WebhookEventType;
  created: number; // Unix timestamp
  data: T;
  apiVersion: string;
}

/**
 * Individual delivery attempt record for a webhook event.
 */
export interface AtlasWebhookDelivery {
  id: string;
  webhookEventId: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody: Record<string, unknown>;
  responseStatus: number | null;
  responseBody: string | null;
  durationMs: number | null;
  success: boolean;
  createdAt: Date;
}
