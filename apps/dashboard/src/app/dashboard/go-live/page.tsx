'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle, Circle, Upload, ChevronRight, Shield, Building,
  FileText, Landmark, Clock, ArrowRight, Check, Sparkles
} from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { useToast } from '@/components/toast';
import Link from 'next/link';

const STEPS = [
  { id: 'business', label: 'Business Info', icon: <Building className="w-5 h-5" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
  { id: 'banking', label: 'Settlement Bank', icon: <Landmark className="w-5 h-5" /> },
  { id: 'review', label: 'Review & Submit', icon: <Shield className="w-5 h-5" /> },
];

const BUSINESS_TYPES = [
  'Starter Business (Individual)',
  'Sole Proprietorship',
  'Limited Liability Company (LLC)',
  'Partnership',
  'Public Company',
  'NGO / Non-profit'
];

const INDUSTRIES = [
  'Digital Services / SaaS',
  'E-Commerce & Retail',
  'Logistics & Delivery',
  'Healthcare & Wellness',
  'Education & EdTech',
  'Travel & Hospitality',
  'Financial Services & FinTech',
  'Agriculture & AgTech',
  'Other'
];

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
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'>('NOT_SUBMITTED');
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);

  const [business, setBusiness] = useState({
    businessType: 'Starter Business (Individual)',
    industry: 'Digital Services / SaaS',
    registrationNumber: '',
    taxId: '',
    address: 'Accra, Ghana',
    city: 'Accra',
    website: 'https://atlas-gamma-bay.vercel.app',
  });

  const [banking, setBanking] = useState({
    bankCode: 'GCB',
    accountNumber: '',
    accountName: '',
    branchCode: '001',
  });

  useEffect(() => {
    fetchMerchantKyc();
  }, []);

  const fetchMerchantKyc = async () => {
    try {
      const data: any = await apiFetch('/v1/merchants/me');
      const kyc = data?.metadata?.kyc;
      if (kyc?.status) {
        setKycStatus(kyc.status);
      }
      if (kyc?.business) {
        setBusiness((prev) => ({ ...prev, ...kyc.business }));
      }
      if (kyc?.banking) {
        setBanking((prev) => ({ ...prev, ...kyc.banking }));
      }
    } catch (err) {
      console.error('Failed to load merchant KYC info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/v1/merchants/me', {
        method: 'PATCH',
        body: JSON.stringify({
          metadata: {
            kyc: {
              business,
              banking,
              submittedAt: new Date().toISOString(),
              status: 'PENDING_REVIEW',
            },
          },
        }),
      });
      setKycStatus('PENDING_REVIEW');
      success('Application submitted!', 'Your compliance documents are now under review.');
    } catch (e: any) {
      toastError('Submission failed', e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminQuickApprove = async () => {
    setApproving(true);
    try {
      await apiFetch('/v1/merchants/me/kyc/approve', { method: 'POST' });
      setKycStatus('APPROVED');
      success('Live Mode Activated!', 'Your live API key pair has been automatically provisioned.');
    } catch (e: any) {
      toastError('Approval failed', e?.message);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading verification status...</div>;
  }

  // ── SCREEN 1: APPROVED (LIVE ACTIVE) ──
  if (kycStatus === 'APPROVED') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            Verified Merchant • Live Active
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-3">Live Mode is Activated</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            Your business KYC review has been approved. You have full access to live African payment rails and live API key pairs.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-3">
          <h3 className="font-bold text-slate-800 text-sm">Verified Credentials:</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Business Category</span>
              <span className="font-semibold text-slate-700">{business.businessType}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Settlement Rail</span>
              <span className="font-semibold text-slate-700">{banking.bankCode} Active</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-lg shadow-blue-500/20"
          >
            <span>View Live API Keys in Settings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── SCREEN 2: PENDING REVIEW ──
  if (kycStatus === 'PENDING_REVIEW') {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-blue-600 animate-pulse" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
            Compliance Review In Progress
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-3">Application Under Review</h1>
          <p className="text-slate-500 text-sm mt-1">
            Our compliance officer is verifying your submitted documents against regulatory requirements.
          </p>
        </div>

        {/* Admin Quick-Approve Button */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800 text-sm">Platform Admin Bypass</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly approve KYC and activate Live Mode for this merchant.
            </p>
          </div>

          <button
            onClick={handleAdminQuickApprove}
            disabled={approving}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shrink-0 transition"
          >
            {approving ? 'Activating…' : 'Approve Application'}
          </button>
        </div>
      </div>
    );
  }

  // ── SCREEN 3: APPLICATION FORM ──
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Go Live Application</h1>
        <p className="text-slate-500 text-sm mt-1">
          Complete KYC verification to activate Live Mode and process real money across Africa.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => i < step + 1 && setStep(i)}
              className={`flex items-center gap-2.5 text-sm font-semibold transition-colors ${
                i === step ? 'text-blue-700' : i < step ? 'text-emerald-600 cursor-pointer' : 'text-slate-300'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                  i === step
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : i < step
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-200 bg-white text-slate-300'
                }`}
              >
                {i < step ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
              </div>
              <span className="hidden sm:block">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${i < step ? 'bg-emerald-300' : 'bg-slate-100'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800">1. Business Profile</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Entity Type</label>
                <select
                  value={business.businessType}
                  onChange={(e) => setBusiness({ ...business, businessType: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm"
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Industry</label>
                <select
                  value={business.industry}
                  onChange={(e) => setBusiness({ ...business, industry: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Registered Address</label>
                <input
                  type="text"
                  value={business.address}
                  onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Website or Online Presence</label>
                <input
                  type="url"
                  value={business.website}
                  onChange={(e) => setBusiness({ ...business, website: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800">2. Identity & Verification Documents</h2>
            <p className="text-xs text-slate-500">Upload your government-issued ID (Ghana Card or Passport).</p>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50">
              <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Ghana Card / National ID Uploaded</p>
              <p className="text-[11px] text-slate-400 mt-1">GHA-XXXXX-XX verified via identity check</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800">3. Settlement Bank / Mobile Money</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Bank / Telecom</label>
                <select
                  value={banking.bankCode}
                  onChange={(e) => setBanking({ ...banking, bankCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm"
                >
                  {BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Account Number / Phone</label>
                <input
                  type="text"
                  placeholder="024XXXXXXX or Account number"
                  value={banking.accountNumber}
                  onChange={(e) => setBanking({ ...banking, accountNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800">4. Review & Confirmation</h2>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Business Type:</span>
                <span className="font-semibold text-slate-800">{business.businessType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Industry:</span>
                <span className="font-semibold text-slate-800">{business.industry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Settlement:</span>
                <span className="font-semibold text-slate-800">{banking.bankCode}</span>
              </div>
            </div>
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <span>Continue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition"
            >
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
