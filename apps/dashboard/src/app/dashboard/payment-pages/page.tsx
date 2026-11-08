'use client';
import { useEffect, useState } from 'react';
import { Plus, CreditCard, Copy, ExternalLink, CheckCircle, X, Globe, Eye } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { useToast } from '@/components/toast';
import { formatMoney, getMerchantDefaultCurrency } from '@/lib/currency';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    INACTIVE: 'bg-slate-100 text-slate-500 border-slate-200',
    ARCHIVED: 'bg-red-50 text-red-600 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[status] ?? styles.INACTIVE}`}>
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
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-mono text-slate-400 truncate max-w-[140px]">/pay/{slug}</span>
      <button onClick={copy} className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0">
        {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <a href={`/pay/${slug}`} target="_blank" rel="noopener noreferrer"
        className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0">
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
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
      setPages((data as any)?.items || []);
      if (merchantRes?.country) {
        setForm(prev => ({ ...prev, currency: getMerchantDefaultCurrency(merchantRes.country) }));
      }
    } catch (e: any) {
      toastError('Failed to load payment pages', e?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/v1/payment-pages', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          amount: form.amount ? Number(form.amount) * 100 : undefined,
          currency: form.currency,
        }),
      });
      success('Payment page created', `"${form.name}" is now live`);
      setIsModalOpen(false);
      setForm({ name: '', description: '', amount: '', currency: 'GHS' });
      loadPages();
    } catch (e: any) {
      toastError('Failed to create page', e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Deactivate "${name}"?`)) return;
    try {
      await apiFetch(`/v1/payment-pages/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'INACTIVE' }) });
      success('Page deactivated', `"${name}" is now inactive`);
      loadPages();
    } catch (e: any) {
      toastError('Failed to deactivate page', e?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Pages</h1>
          <p className="text-slate-500 text-sm mt-1">No-code hosted pages. Share the link — customers pay directly.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Page
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading pages...</div>
      ) : pages.length === 0 ? (
        <div className="py-16 flex flex-col items-center bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <CreditCard className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">No payment pages yet</h3>
          <p className="text-slate-400 text-sm mb-5">Create a page and share the link to start collecting.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Create Payment Page
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pages.map((page: any) => (
            <div key={page.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              {/* Card top color bar */}
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-500" />
                  </div>
                  <StatusBadge status={page.status ?? 'ACTIVE'} />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{page.name || page.title}</h3>
                {page.description && <p className="text-slate-400 text-xs mb-3 line-clamp-2">{page.description}</p>}
                <div className="text-xl font-black text-slate-900 mb-4">
                  {page.amount ? formatMoney(page.amount, page.currency) : 'Open amount'}
                </div>

                {/* Shareable link */}
                {page.slug && (
                  <div className="bg-slate-50 rounded-xl px-3 py-2 mb-4 border border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Shareable Link</p>
                    <CopyLinkButton slug={page.slug} />
                  </div>
                )}

                <div className="flex gap-2">
                  <a
                    href={page.slug ? `/pay/${page.slug}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </a>
                  <button
                    onClick={() => handleDeactivate(page.id, page.name || page.title)}
                    className="flex-1 py-2 text-xs font-semibold text-slate-500 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Create Payment Page</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Page Name</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Conference Registration"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell customers what they're paying for..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount <span className="text-slate-400 font-normal">(leave blank = open)</span></label>
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Currency</label>
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['GHS', 'NGN', 'KES', 'ZAR', 'USD'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
