import type { AtlasCurrency } from '../types/payment.js';

/**
 * Currency metadata — number of minor units per major unit.
 * All ATLAS currencies use 100 minor units per major unit.
 */
const CURRENCY_MINOR_UNITS: Record<string, number> = {
  GHS: 100, // 1 GHS = 100 pesewas
  NGN: 100, // 1 NGN = 100 kobo
  KES: 100, // 1 KES = 100 cents
  UGX: 100, // 1 UGX = 100 cents
  TZS: 100, // 1 TZS = 100 cents
  ZAR: 100, // 1 ZAR = 100 cents
  USD: 100, // 1 USD = 100 cents
};

/**
 * Immutable Money value object.
 *
 * Stores amounts as BigInt in minor units to avoid all floating-point issues.
 * NEVER construct Money from a float — use Money.fromMajorUnits() or Money.fromMinorUnits() only.
 *
 * @example
 * const price = Money.fromMajorUnits(100, 'GHS'); // 100.00 GHS
 * const fee   = Money.fromMinorUnits(250n, 'GHS'); // 2.50 GHS
 * const total = price.add(fee);                    // 102.50 GHS
 * console.log(total.format());                     // "GHS 102.50"
 */
export class Money {
  /** The amount in minor units (e.g. pesewas). Always a non-negative BigInt. */
  readonly amount: bigint;
  readonly currency: string;

  private constructor(amount: bigint, currency: string) {
    if (amount < 0n) {
      throw new RangeError(
        `Money amount cannot be negative. Got: ${amount} ${currency}`,
      );
    }
    this.amount = amount;
    this.currency = currency.toUpperCase();
  }

  /**
   * Create a Money instance from minor units (e.g. pesewas, kobo, cents).
   * This is the primary constructor for amounts stored in the database.
   */
  static fromMinorUnits(amount: bigint, currency: string): Money {
    return new Money(amount, currency);
  }

  /**
   * Create a Money instance from major units (e.g. GHS).
   * The integer part is multiplied by the minor unit factor.
   * Use this only when converting human-readable inputs.
   *
   * @param majorUnits - Whole number of major currency units (e.g. 100 for 100 GHS)
   * @param currency - ISO 4217 currency code
   */
  static fromMajorUnits(majorUnits: number, currency: string): Money {
    if (!Number.isInteger(majorUnits)) {
      throw new TypeError(
        `fromMajorUnits() requires an integer. Got: ${majorUnits}. ` +
          `Use fromMinorUnits() with a BigInt if you need fractional amounts.`,
      );
    }
    if (majorUnits < 0) {
      throw new RangeError(`majorUnits cannot be negative. Got: ${majorUnits}`);
    }
    const factor = Money.getMinorUnitFactor(currency);
    return new Money(BigInt(majorUnits) * BigInt(factor), currency);
  }

  /**
   * Create a zero-value Money instance for the given currency.
   */
  static zero(currency: string): Money {
    return new Money(0n, currency);
  }

  /**
   * Returns the minor-unit factor (e.g. 100 for GHS).
   */
  static getMinorUnitFactor(currency: string): number {
    const factor = CURRENCY_MINOR_UNITS[currency.toUpperCase()];
    if (factor === undefined) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
    return factor;
  }

  /**
   * Returns the amount in minor units as a BigInt.
   * This is the value to store in the database.
   */
  toMinorUnits(): bigint {
    return this.amount;
  }

  /**
   * Returns a human-readable formatted string.
   * Does NOT use Intl.NumberFormat to avoid floating-point issues.
   *
   * @example
   * Money.fromMinorUnits(10050n, 'GHS').format() // "GHS 100.50"
   * Money.fromMinorUnits(100n, 'GHS').format()   // "GHS 1.00"
   */
  format(): string {
    const factor = BigInt(Money.getMinorUnitFactor(this.currency));
    const major = this.amount / factor;
    const minor = this.amount % factor;
    const decimalPlaces = Math.log10(Number(factor));
    const minorStr = minor.toString().padStart(decimalPlaces, '0');
    return `${this.currency} ${major.toString()}.${minorStr}`;
  }

  /**
   * Add another Money amount. Currencies must match.
   */
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  /**
   * Subtract another Money amount. Currencies must match.
   * Throws if the result would be negative.
   */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    if (other.amount > this.amount) {
      throw new RangeError(
        `Cannot subtract ${other.format()} from ${this.format()} — result would be negative.`,
      );
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  /**
   * Multiply by an integer scalar.
   */
  multiply(scalar: bigint): Money {
    if (scalar < 0n) {
      throw new RangeError(`Scalar must be non-negative. Got: ${scalar}`);
    }
    return new Money(this.amount * scalar, this.currency);
  }

  /**
   * Returns true if this amount equals the other.
   */
  equals(other: Money): boolean {
    return this.currency === other.currency && this.amount === other.amount;
  }

  /**
   * Returns true if this amount is greater than the other.
   */
  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  /**
   * Returns true if this amount is less than the other.
   */
  lessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount < other.amount;
  }

  /**
   * Returns true if the amount is zero.
   */
  isZero(): boolean {
    return this.amount === 0n;
  }

  /**
   * Returns a plain object representation suitable for JSON serialization.
   * Note: BigInt amounts are serialized as strings to avoid precision loss.
   */
  toJSON(): { amount: string; currency: string } {
    return { amount: this.amount.toString(), currency: this.currency };
  }

  toString(): string {
    return this.format();
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: cannot operate on ${this.currency} and ${other.currency}`,
      );
    }
  }
}

/**
 * Helper: parse a BigInt amount from a database value.
 * Handles the case where Prisma returns BigInt as a number in some configs.
 */
export function parseBigIntAmount(value: bigint | number | string): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new TypeError(
        `Cannot convert non-integer number to BigInt amount: ${value}`,
      );
    }
    return BigInt(value);
  }
  return BigInt(value);
}

/**
 * Helper: safely serialize a BigInt to a string for JSON/logging.
 */
export function serializeBigInt(value: bigint): string {
  return value.toString();
}

/**
 * Compute a percentage of a Money value.
 * The percentage is expressed as basis points (1/100 of a percent) to avoid floating point.
 *
 * @param money - The base amount
 * @param basisPoints - e.g. 150 = 1.5%
 *
 * @example
 * percentOf(Money.fromMinorUnits(10000n, 'GHS'), 150n)
 * // 1.5% of 100 GHS = 1.50 GHS = 150 pesewas
 */
export function percentOf(money: Money, basisPoints: bigint): Money {
  const result = (money.amount * basisPoints) / 10000n;
  return Money.fromMinorUnits(result, money.currency);
}
