'use client';

import { useEffect, useState } from 'react';
import { Plus, CreditCard, Copy, ExternalLink, CheckCircle, X, Globe, Eye, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { useToast } from '@/components/toast';
import { formatMoney, getMerchantDefaultCurrency } from '@/lib/currency';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://atlas-gamma-bay.vercel.app';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    INACTIVE: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
    ARCHIVED: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${styles[status] ?? styles.INACTIVE}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status?.charAt(0) + (status?.slice(1).toLowerCase() ?? '')}
    </span>
  );
}

function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${BASE_URL}/pay/${slug}`;
  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between gap-1.5 bg-zinc-50 dark:bg-zinc-850/60 rounded-xl p-2.5 border border-zinc-100 dark:border-zinc-800">
      <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate max-w-[170px]">/pay/{slug}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button 
          onClick={copy} 
          title="Copy link"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors"
        >
          {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
        <a 
          href={`/pay/${slug}`} 
          target="_blank" 
          rel="noopener noreferrer"
          title="Open hosted page"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-brand dark:hover:text-blue-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export default function PaymentPages() {
  const { success, error: toastError } = useToast();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', amount: '', currency: 'GHS' });

  useEffect(() => { loadPages(); }, []);

  const loadPages = async () => {
    try {
      const [data, merchantRes]: [any, any] = await Promise.all([
        apiFetch('/v1/payment-pages'),
        apiFetch('/v1/merchants/me').catch(() => null),
      ]);
      setPages(Array.isArray(data) ? data : data?.items ?? []);
      if (merchantRes?.country) {
        setForm(f => ({ ...f, currency: getMerchantDefaultCurrency(merchantRes.country) }));
      }
    } catch (e: any) {
      toastError('Failed to load payment pages', e?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        currency: form.currency,
      };
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.amount && !isNaN(Number(form.amount))) payload.amount = Math.round(Number(form.amount) * 100);

      await apiFetch('/v1/payment-pages', { method: 'POST', body: JSON.stringify(payload) });
      success('Payment page created', `"${form.name}" is now live`);
      setIsModalOpen(false);
      setForm({ name: '', description: '', amount: '', currency: form.currency });
      loadPages();
    } catch (e: any) {
      toastError('Could not create page', e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Deactivate "${name}"? Customers won't be able to pay through it.`)) return;
    try {
      await apiFetch(`/v1/payment-pages/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'INACTIVE' }) });
      success('Page deactivated', `"${name}" is now inactive`);
      loadPages();
    } catch (e: any) {
      toastError('Failed to deactivate page', e?.message);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Payment Pages
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Shareable, hosted checkout links. No code required — customers pay via Mobile Money or card.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-xl transition shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" /> 
          <span>Create Payment Page</span>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-400 animate-pulse">Loading payment pages...</div>
      ) : pages.length === 0 ? (
        <div className="py-16 flex flex-col items-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center px-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3 text-zinc-400">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">No payment links created yet</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">
            Generate your first hosted payment link to start collecting mobile money and card payments immediately.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-brand text-white text-xs font-semibold rounded-xl hover:bg-brand-dark transition shadow-sm"
          >
            Create Your First Page
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page: any) => (
            <div 
              key={page.id} 
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-card p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-brand dark:text-blue-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <StatusBadge status={page.status ?? 'ACTIVE'} />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white text-base leading-snug mb-1">
                  {page.name || page.title}
                </h3>
                {page.description && (
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-3 line-clamp-2">
                    {page.description}
                  </p>
                )}
                <div className="text-xl font-bold font-mono tabular-nums text-zinc-900 dark:text-white mb-3">
                  {page.amount ? formatMoney(page.amount, page.currency) : <span className="text-xs font-sans text-zinc-400">Custom customer amount</span>}
                </div>

                {/* Shareable link */}
                {page.slug && (
                  <CopyLinkButton slug={page.slug} />
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <a
                  href={page.slug ? `/pay/${page.slug}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-brand dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-xl transition"
                >
                  <Eye className="w-3.5 h-3.5" /> 
                  <span>Preview</span>
                </a>
                <button
                  onClick={() => handleDeactivate(page.id, page.name || page.title)}
                  className="flex-1 py-2 text-xs font-semibold text-zinc-500 hover:text-rose-600 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition"
                >
                  Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal (Bottom sheet on mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div 
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border-t sm:border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Create Payment Link</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="pt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Page / Product Title *
                </label>
                <input 
                  required 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. VIP Conference Pass"
                  className="w-full px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl text-base sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/30" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What is the customer purchasing?"
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl text-base sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Fixed Amount <span className="text-zinc-400 font-normal">(blank = open)</span>
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={form.amount} 
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl text-base sm:text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/30" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Currency
                  </label>
                  <select 
                    value={form.currency} 
                    onChange={e => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl text-base sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  >
                    {['GHS', 'NGN', 'KES', 'ZAR', 'USD'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-brand text-white text-xs font-semibold rounded-xl hover:bg-brand-dark disabled:opacity-50 transition shadow-sm"
                >
                  {submitting ? 'Creating...' : 'Create Payment Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
