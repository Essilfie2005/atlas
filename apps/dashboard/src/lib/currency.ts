export const CURRENCY_SYMBOLS: Record<string, string> = {
  GHS: 'GH₵',
  NGN: '₦',
  KES: 'KSh',
  ZAR: 'R',
  USD: '$',
  EUR: '€',
  GBP: '£',
  XOF: 'CFA',
  XAF: 'FCFA',
  RWF: 'FRw',
  UGX: 'USh',
  TZS: 'TSh',
};

export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  GH: 'GHS',
  NG: 'NGN',
  KE: 'KES',
  ZA: 'ZAR',
  CI: 'XOF',
  SN: 'XOF',
  CM: 'XAF',
  RW: 'RWF',
  UG: 'UGX',
  TZ: 'TZS',
  US: 'USD',
  GB: 'GBP',
};

export function getCurrencySymbol(currency?: string | null): string {
  if (!currency) return '$';
  const upper = currency.toUpperCase();
  return CURRENCY_SYMBOLS[upper] ?? upper;
}

export function formatMoney(amountMinor: number | bigint | string, currency?: string | null): string {
  const num = typeof amountMinor === 'bigint' ? Number(amountMinor) : Number(amountMinor || 0);
  const major = (num / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${major}`;
}

export function getMerchantDefaultCurrency(country?: string | null): string {
  if (!country) return 'GHS';
  return COUNTRY_TO_CURRENCY[country.toUpperCase()] ?? 'GHS';
}
