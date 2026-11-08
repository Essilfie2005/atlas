import { AtlasPaymentStatus } from '../types/payment.js';

/**
 * Defines which status transitions are valid for a PaymentIntent.
 *
 * The state machine is represented as a directed graph:
 *   key   = current state
 *   value = set of states that can be transitioned to FROM the current state
 *
 * Any transition not in this map is REJECTED.
 */
export const PAYMENT_INTENT_VALID_TRANSITIONS: ReadonlyMap<
  AtlasPaymentStatus,
  ReadonlySet<AtlasPaymentStatus>
> = new Map([
  [
    AtlasPaymentStatus.CREATED,
    new Set([
      AtlasPaymentStatus.PROCESSING,
      AtlasPaymentStatus.CANCELLED,
    ]),
  ],
  [
    AtlasPaymentStatus.PROCESSING,
    new Set([
      AtlasPaymentStatus.REQUIRES_ACTION,
      AtlasPaymentStatus.SUCCEEDED,
      AtlasPaymentStatus.FAILED,
      AtlasPaymentStatus.CANCELLED,
    ]),
  ],
  [
    AtlasPaymentStatus.REQUIRES_ACTION,
    new Set([
      AtlasPaymentStatus.PROCESSING,
      AtlasPaymentStatus.SUCCEEDED,
      AtlasPaymentStatus.FAILED,
      AtlasPaymentStatus.CANCELLED,
    ]),
  ],
  // Terminal states — no further transitions allowed
  [AtlasPaymentStatus.SUCCEEDED, new Set<AtlasPaymentStatus>()],
  [AtlasPaymentStatus.FAILED, new Set<AtlasPaymentStatus>()],
  [AtlasPaymentStatus.CANCELLED, new Set<AtlasPaymentStatus>()],
]);

/**
 * Returns true if transitioning from `from` to `to` is a valid state transition.
 *
 * @example
 * isValidPaymentTransition(AtlasPaymentStatus.CREATED, AtlasPaymentStatus.PROCESSING) // true
 * isValidPaymentTransition(AtlasPaymentStatus.SUCCEEDED, AtlasPaymentStatus.FAILED)   // false
 */
export function isValidPaymentTransition(
  from: AtlasPaymentStatus,
  to: AtlasPaymentStatus,
): boolean {
  const allowedTargets = PAYMENT_INTENT_VALID_TRANSITIONS.get(from);
  if (allowedTargets === undefined) return false;
  return allowedTargets.has(to);
}

/**
 * Returns the set of valid next states for the given current state.
 * Returns an empty set for terminal states.
 */
export function getValidNextStates(
  current: AtlasPaymentStatus,
): ReadonlySet<AtlasPaymentStatus> {
  return PAYMENT_INTENT_VALID_TRANSITIONS.get(current) ?? new Set();
}

/**
 * Returns true if the given status is a terminal state (no further transitions possible).
 */
export function isTerminalPaymentStatus(status: AtlasPaymentStatus): boolean {
  return (
    status === AtlasPaymentStatus.SUCCEEDED ||
    status === AtlasPaymentStatus.FAILED ||
    status === AtlasPaymentStatus.CANCELLED
  );
}

/**
 * Asserts that the transition from `from` to `to` is valid.
 * Throws a descriptive error if the transition is not allowed.
 */
export function assertValidPaymentTransition(
  from: AtlasPaymentStatus,
  to: AtlasPaymentStatus,
  context?: string,
): void {
  if (!isValidPaymentTransition(from, to)) {
    const prefix = context ? `[${context}] ` : '';
    throw new Error(
      `${prefix}Invalid payment status transition: ${from} → ${to}. ` +
        `Allowed transitions from ${from}: [${[...getValidNextStates(from)].join(', ') || 'none (terminal)'}]`,
    );
  }
}
