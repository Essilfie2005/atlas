'use client';
import { useState } from 'react';
import { CheckCircle, Circle, Upload, ChevronRight, Shield, Building, FileText, Landmark } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { useToast } from '@/components/toast';

const STEPS = [
  { id: 'business', label: 'Business Info', icon: <Building className="w-5 h-5" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
  { id: 'banking', label: 'Settlement Bank', icon: <Landmark className="w-5 h-5" /> },
  { id: 'review', label: 'Review & Submit', icon: <Shield className="w-5 h-5" /> },
];

const BUSINESS_TYPES = ['Sole Proprietorship', 'Limited Liability Company (LLC)', 'Partnership', 'Public Company', 'NGO / Non-profit'];
const INDUSTRIES = ['E-Commerce', 'Logistics & Delivery', 'Healthcare', 'Education', 'Food & Beverage', 'Travel & Hospitality', 'Technology / SaaS', 'Financial Services', 'Agriculture', 'Other'];
const BANKS = [
  { code: 'GCB', name: 'GCB Bank' },
  { code: 'ECOBANK', name: 'Ecobank Ghana' },
  { code: 'ABSA', name: 'Absa Bank Ghana' },
  { code: 'STANBIC', name: 'Stanbic Bank' },
  { code: 'CAL', name: 'CAL Bank' },
  { code: 'ZENITH_GH', name: 'Zenith Bank Ghana' },
  { code: 'ACCESS_GH', name: 'Access Bank Ghana' },
  { code: 'FIDELITY_GH', name: 'Fidelity Bank Ghana' },
];

export default function GoLivePage() {
  const { success, error: toastError } = useToast();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [business, setBusiness] = useState({ businessType: '', industry: '', registrationNumber: '', taxId: '', address: '', city: '', website: '' });
  const [banking, setBanking] = useState({ bankCode: '', accountNumber: '', accountName: '', branchCode: '' });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/v1/merchants/me', {
        method: 'PATCH',
        body: JSON.stringify({
          metadata: { kyc: { business, banking, submittedAt: new Date().toISOString(), status: 'PENDING_REVIEW' } },
        }),
      });
      setSubmitted(true);
      success('Application submitted!', 'Our team will review your documents within 1–2 business days.');
    } catch (e: any) {
      toastError('Submission failed', e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-3">Application Submitted!</h1>
        <p className="text-slate-500 leading-relaxed mb-8">
          Your Go Live application is under review. Our compliance team will verify your information and get back to you within <strong>1–2 business days</strong>.
        </p>
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 text-left">
          <h3 className="font-bold text-blue-900 mb-3">What happens next?</h3>
          <ol className="space-y-2 text-sm text-blue-700">
            <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold text-xs flex items-center justify-center flex-shrink-0">1</span> Our team reviews your business details and documents</li>
            <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold text-xs flex items-center justify-center flex-shrink-0">2</span> We verify your settlement bank account</li>
            <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 font-bold text-xs flex items-center justify-center flex-shrink-0">3</span> You receive an email confirmation with live API keys enabled</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Go Live Application</h1>
        <p className="text-slate-500 text-sm mt-1">Complete KYC verification to activate Live Mode and process real payments.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => i < step + 1 && setStep(i)}
              className={`flex items-center gap-2.5 text-sm font-semibold transition-colors ${i === step ? 'text-blue-700' : i < step ? 'text-emerald-600 cursor-pointer' : 'text-slate-300'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${i === step ? 'border-blue-600 bg-blue-600 text-white' : i < step ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-300'}`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
              </div>
              <span className="hidden sm:block">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 ${i < step ? 'bg-emerald-300' : 'bg-slate-100'}`} />}
          </div>
        ))}
      </div>

      {/* Step panels */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">

        {/* Step 0 — Business Info */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Business Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Type</label>
                <select value={business.businessType} onChange={e => setBusiness({...business, businessType: e.target.value})}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select type...</option>
                  {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Industry</label>
                <select value={business.industry} onChange={e => setBusiness({...business, industry: e.target.value})}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Registration Number</label>
                <input value={business.registrationNumber} onChange={e => setBusiness({...business, registrationNumber: e.target.value})}
                  placeholder="e.g. CS-123456789"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tax ID / TIN</label>
                <input value={business.taxId} onChange={e => setBusiness({...business, taxId: e.target.value})}
                  placeholder="e.g. C0012345678"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Address</label>
                <input value={business.address} onChange={e => setBusiness({...business, address: e.target.value})}
                  placeholder="Street address"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">City</label>
                <input value={business.city} onChange={e => setBusiness({...business, city: e.target.value})}
                  placeholder="e.g. Accra"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Website</label>
                <input value={business.website} onChange={e => setBusiness({...business, website: e.target.value})}
                  placeholder="https://yourbusiness.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* Step 1 — Documents */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Business Documents</h2>
            <p className="text-sm text-slate-500">Upload clear, legible copies. Accepted formats: PDF, JPG, PNG (max 10MB each).</p>
            <div className="space-y-4">
              {[
                { label: 'Certificate of Incorporation / Business Registration', required: true },
                { label: 'Tax Identification Number (TIN) Certificate', required: true },
                { label: 'Director / Owner National ID', required: true },
                { label: 'Proof of Business Address (utility bill, bank statement)', required: false },
                { label: 'Audited Financial Statements (last 12 months)', required: false },
              ].map(doc => (
                <div key={doc.label} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{doc.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{doc.required ? 'Required' : 'Optional'}</p>
                  </div>
                  <label className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors flex-shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={() => {}} />
                  </label>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 border border-slate-100">
              📎 Documents are encrypted and stored securely. Only ATLAS compliance staff have access. We follow GDPR and local data protection regulations.
            </div>
          </div>
        )}

        {/* Step 2 — Banking */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Settlement Bank Account</h2>
            <p className="text-sm text-slate-500">This is where ATLAS will deposit your settlement funds. Must be a business account in your company name.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bank</label>
                <select value={banking.bankCode} onChange={e => setBanking({...banking, bankCode: e.target.value})}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select bank...</option>
                  {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Account Number</label>
                <input value={banking.accountNumber} onChange={e => setBanking({...banking, accountNumber: e.target.value})}
                  placeholder="0123456789"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Account Name</label>
                <input value={banking.accountName} onChange={e => setBanking({...banking, accountName: e.target.value})}
                  placeholder="Exact name as on account"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Branch Code <span className="text-slate-400 font-normal">(optional)</span></label>
                <input value={banking.branchCode} onChange={e => setBanking({...banking, branchCode: e.target.value})}
                  placeholder="e.g. 001"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Review & Submit</h2>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Business</h3>
                <dl className="space-y-2 text-sm">
                  {[['Type', business.businessType], ['Industry', business.industry], ['Reg. Number', business.registrationNumber], ['Tax ID', business.taxId], ['Address', business.address + (business.city ? ', ' + business.city : '')]].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-slate-400">{k}</dt>
                      <dd className="font-medium text-slate-700">{v || <span className="text-slate-300">Not provided</span>}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Settlement Bank</h3>
                <dl className="space-y-2 text-sm">
                  {[['Bank', BANKS.find(b => b.code === banking.bankCode)?.name ?? banking.bankCode], ['Account', banking.accountNumber], ['Name', banking.accountName]].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-slate-400">{k}</dt>
                      <dd className="font-medium text-slate-700">{v || <span className="text-slate-300">Not provided</span>}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                By submitting, you confirm that all information is accurate and you accept ATLAS's{' '}
                <a href="#" className="underline font-semibold">Terms of Service</a> and{' '}
                <a href="#" className="underline font-semibold">Merchant Agreement</a>.
              </p>
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-colors"
          >
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : '✓ Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
