'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useToast } from '@/components/toast';
import { UserCheck, Plus, Trash2, X } from 'lucide-react';

interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  bankCode: string;
  bankName?: string;
  currency: string;
  accountType: string;
  createdAt: string;
}

const ACCOUNT_TYPES = [
  { value: 'bank_account', label: 'Bank Account' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

const CURRENCIES = ['GHS', 'NGN', 'KES', 'ZAR', 'XOF', 'USD'];

const BANKS: Record<string, { code: string; name: string }[]> = {
  GHS: [
    { code: 'GCB', name: 'GCB Bank' },
    { code: 'ECOBANK_GH', name: 'Ecobank Ghana' },
    { code: 'ABSA_GH', name: 'Absa Ghana' },
    { code: 'STANBIC_GH', name: 'Stanbic Bank Ghana' },
    { code: 'CAL', name: 'CAL Bank' },
    { code: 'MTN_GH', name: 'MTN Mobile Money' },
    { code: 'VODAFONE_GH', name: 'Vodafone Cash' },
    { code: 'AIRTELTIGO_GH', name: 'AirtelTigo Money' },
  ],
  NGN: [
    { code: 'GTB', name: 'GTBank' },
    { code: 'ACCESS', name: 'Access Bank' },
    { code: 'ZENITH', name: 'Zenith Bank' },
    { code: 'UBA', name: 'UBA' },
    { code: 'FIRST_BANK', name: 'First Bank' },
  ],
  KES: [
    { code: 'EQUITY_KE', name: 'Equity Bank Kenya' },
    { code: 'KCBC', name: 'KCB Bank' },
    { code: 'MPESA', name: 'M-Pesa' },
  ],
};

export default function BeneficiariesPage() {
  const { success, error: toastError } = useToast();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    accountNumber: '',
    bankCode: '',
    currency: 'GHS',
    accountType: 'bank_account',
  });

  const availableBanks = BANKS[form.currency] ?? [];

  useEffect(() => { fetchBeneficiaries(); }, []);

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/v1/beneficiaries');
      setBeneficiaries(Array.isArray(data) ? data : (data as any)?.items || []);
    } catch (e: any) {
      toastError('Failed to load beneficiaries', e?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bankCode) { toastError('Please select a bank or wallet'); return; }
    setSubmitting(true);
    try {
      await apiFetch('/v1/beneficiaries', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      success('Beneficiary added', `${form.name} was saved successfully`);
      setShowModal(false);
      setForm({ name: '', accountNumber: '', bankCode: '', currency: 'GHS', accountType: 'bank_account' });
      fetchBeneficiaries();
    } catch (e: any) {
      toastError('Could not add beneficiary', e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from your beneficiaries?`)) return;
    setDeletingId(id);
    try {
      await apiFetch(`/v1/beneficiaries/${id}`, { method: 'DELETE' });
      success('Beneficiary removed', `${name} was deleted`);
      setBeneficiaries(prev => prev.filter(b => b.id !== id));
    } catch (e: any) {
      toastError('Could not remove beneficiary', e?.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Beneficiaries</h1>
          <p className="text-slate-500 mt-1 text-sm">Saved accounts and mobile wallets for sending payouts.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Beneficiary
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading beneficiaries...</div>
        ) : beneficiaries.length === 0 ? (
          <div className="py-16 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <UserCheck className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">No beneficiaries yet</h3>
            <p className="text-slate-400 text-sm mb-5">Add a bank account or mobile wallet to send payouts.</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Add Beneficiary
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Name', 'Account / Wallet', 'Bank / Provider', 'Currency', 'Type', ''].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {beneficiaries.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600 text-xs">{b.accountNumber}</td>
                  <td className="px-6 py-4 text-slate-600">{b.bankName || b.bankCode}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{b.currency}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 capitalize">{b.accountType?.replace('_', ' ')}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(b.id, b.name)}
                      disabled={deletingId === b.id}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Beneficiary</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Kwame Mensah"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value, bankCode: '' })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Type</label>
                  <select value={form.accountType} onChange={e => setForm({ ...form, accountType: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Bank / Wallet Provider</label>
                <select required value={form.bankCode} onChange={e => setForm({ ...form, bankCode: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select provider...</option>
                  {availableBanks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                  {availableBanks.length === 0 && <option disabled>No providers for this currency yet</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {form.accountType === 'mobile_money' ? 'Phone Number' : 'Account Number'}
                </label>
                <input required value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                  placeholder={form.accountType === 'mobile_money' ? '+233 XX XXX XXXX' : '1234567890'}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Beneficiary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
