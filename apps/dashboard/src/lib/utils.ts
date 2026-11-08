export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: bigint | number | string, currency = 'GHS'): string {
  const num = typeof amount === 'bigint' ? Number(amount) / 100 : typeof amount === 'string' ? parseFloat(amount) / 100 : amount / 100;
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency, minimumFractionDigits: 2 }).format(num);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

export function formatRelative(date: string | Date): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return formatDate(date);
}

export function getStatusColor(status: string): string {
  const s = status.toUpperCase();
  if (['SUCCEEDED','DELIVERED','ACTIVE','MATCHED','COMPLETED','WON'].includes(s)) return 'bg-emerald-50 text-emerald-700';
  if (['FAILED','REVOKED','MISMATCHED','LOST','FRAUDULENT'].includes(s)) return 'bg-red-50 text-red-600';
  if (['PENDING','PROCESSING','CREATED','OPEN','UNDER_REVIEW','PAST_DUE'].includes(s)) return 'bg-amber-50 text-amber-700';
  if (['CANCELLED','EXPIRED','ARCHIVED','CLOSED'].includes(s)) return 'bg-slate-100 text-slate-500';
  return 'bg-blue-50 text-blue-700';
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + '…' : str;
}
