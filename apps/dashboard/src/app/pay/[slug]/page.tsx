'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle, XCircle, Loader2, Shield, Lock,
  CreditCard, Phone, Building2, ChevronRight, ArrowLeft
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface PageData {
  id: string;
  name: string;
  description: string | null;
  amount: string | null;
  currency: string;
  logoUrl: string | null;
  merchant: { legalName: string; country: string | null };
}

type Stage = 'loading' | 'details' | 'paying' | 'success' | 'failed' | 'error';
type PayMethod = 'card' | 'mobile_money' | 'bank_transfer';

const NETWORKS = [
  { id: 'MTN',       label: 'MTN MoMo',       color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'VODAFONE',  label: 'Vodafone Cash',  color: '#EF4444', bg: '#FEF2F2' },
  { id: 'AIRTELTIGO',label: 'AirtelTigo',     color: '#EC4899', bg: '#FDF4FF' },
];

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount / 100);
}
function sym(c: string) { return { GHS: 'GH₵', NGN: '₦', KES: 'KSh', USD: '$', ZAR: 'R' }[c] ?? c; }
function fmtCard(v: string) { return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim(); }
function fmtExpiry(v: string) { const d=v.replace(/\D/g,'').slice(0,4); return d.length>=3?d.slice(0,2)+'/'+d.slice(2):d; }
function cardBrand(n: string) { const d=n.replace(/\s/g,''); if(/^4/.test(d))return'Visa'; if(/^5[1-5]/.test(d))return'Mastercard'; return ''; }

export default function PayPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [stage, setStage]         = useState<Stage>('loading');
  const [pageData, setPageData]   = useState<PageData | null>(null);
  const [errorMsg, setErrorMsg]   = useState('');
  const [step, setStep]           = useState<'info'|'payment'>('info');

  // Payer details
  const [email, setEmail]         = useState('');
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [customAmount, setCustomAmount] = useState('');

  // Payment method
  const [method, setMethod]       = useState<PayMethod>('card');
  const [network, setNetwork]     = useState('MTN');
  const [momoPhone, setMomoPhone] = useState('');
  const [cardNum, setCardNum]     = useState('');
  const [expiry, setExpiry]       = useState('');
  const [cvv, setCvv]             = useState('');
  const [cardName, setCardName]   = useState('');

  // Result
  const [successRef, setSuccessRef] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/v1/payment-pages/public/${slug}`)
      .then(r => r.json())
      .then(json => {
        if (json.data) { setPageData(json.data); setStage('details'); }
        else { setErrorMsg(json.error?.message ?? 'Payment page not found'); setStage('error'); }
      })
      .catch(() => { setErrorMsg('Could not load this payment page.'); setStage('error'); });
  }, [slug]);

  const isOpenAmount = !pageData?.amount || pageData.amount === '0';
  const fixedAmount  = pageData?.amount ? Number(pageData.amount) : 0;
  const currency     = pageData?.currency ?? 'GHS';
  const totalAmount  = isOpenAmount ? Number(customAmount) * 100 : fixedAmount;
  const canContinue  = email.includes('@') && name.trim().length > 1 && (!isOpenAmount || Number(customAmount) > 0);

  const handlePay = useCallback(async () => {
    setStage('paying');
    try {
      const res = await fetch(`${API}/v1/payment-pages/public/${slug}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, phone: phone.trim() || undefined, amount: isOpenAmount ? Number(customAmount) : undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? 'Checkout failed');

      const { reference, intentId, amount, publicKey } = json.data;

      await runPaystack({
        publicKey: publicKey || 'pk_test_xxxxxxxx',
        email: email.trim(), amount, currency, reference,
        channels: method === 'mobile_money' ? ['mobile_money'] : method === 'bank_transfer' ? ['bank_transfer'] : ['card'],
        onSuccess: async (txRef: string) => {
          await fetch(`${API}/v1/payment-pages/public/confirm`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intentId, reference: txRef, status: 'success' }),
          });
          setPaidAmount(amount); setSuccessRef(txRef); setStage('success');
        },
        onCancel: () => { setStage('details'); setStep('payment'); },
      });
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Payment failed'); setStage('failed');
    }
  }, [email, name, phone, customAmount, isOpenAmount, slug, currency, method]);

  // ── Screens ──────────────────────────
  if (stage === 'loading') return <Shell pageData={null}><div className="flex flex-col items-center gap-3 py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /><p className="text-sm text-slate-400">Loading...</p></div></Shell>;
  if (stage === 'error')   return <Shell pageData={null}><div className="flex flex-col items-center gap-4 py-16 text-center"><XCircle className="w-12 h-12 text-red-400" /><h2 className="text-xl font-bold text-slate-800">Page Not Found</h2><p className="text-slate-500 text-sm">{errorMsg}</p></div></Shell>;
  if (stage === 'paying')  return <Shell pageData={pageData}><div className="flex flex-col items-center gap-4 py-20"><div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center animate-pulse"><Lock className="w-7 h-7 text-indigo-500" /></div><p className="text-slate-700 font-semibold text-sm">Processing your payment...</p><p className="text-slate-400 text-xs">Please do not close this page</p></div></Shell>;

  if (stage === 'success') return (
    <Shell pageData={pageData}>
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center shadow-inner">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Payment Successful!</h2>
          <p className="text-slate-500 mt-1.5 text-sm">{fmt(paidAmount, currency)} paid to <strong>{pageData?.merchant?.legalName}</strong></p>
        </div>
        <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 p-5 text-left space-y-2">
          {([['Amount', fmt(paidAmount, currency), true, false], ['Paid to', pageData?.merchant?.legalName ?? '', false, false], ['Email', email, false, false], ['Reference', successRef, false, true]] as [string,string,boolean,boolean][]).map(([l,v,b,m]) => (
            <div key={l} className="flex justify-between items-center py-0.5">
              <span className="text-xs text-slate-400">{l}</span>
              <span className={`text-sm text-slate-700 ${b?'font-bold':''} ${m?'font-mono text-xs':''}`}>{v}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400">A receipt has been sent to <strong>{email}</strong></p>
      </div>
    </Shell>
  );

  if (stage === 'failed') return (
    <Shell pageData={pageData}>
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center"><XCircle className="w-8 h-8 text-red-400" /></div>
        <h2 className="text-xl font-bold text-slate-900">Payment Failed</h2>
        <p className="text-slate-500 text-sm">{errorMsg}</p>
        <button onClick={() => { setStage('details'); setStep('payment'); }} className="mt-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">Try Again</button>
      </div>
    </Shell>
  );

  // ── Main checkout (step 1: info, step 2: payment) ─────────────────────
  return (
    <Shell pageData={pageData}>

      {/* ── Step 1: Customer Info ── */}
      {step === 'info' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800">Your Details</h2>

          {isOpenAmount && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Amount ({currency})</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">{sym(currency)}</span>
                <input type="number" min="0.01" step="0.01" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email Address *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Phone <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+233 24 000 0000"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors" />
          </div>

          <button onClick={() => setStep('payment')} disabled={!canContinue}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl transition-colors mt-2 shadow-lg shadow-indigo-100">
            Continue to Payment <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Step 2: Payment Method ── */}
      {step === 'payment' && (
        <div className="space-y-5">
          <button onClick={() => setStep('info')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors -mt-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          {/* Amount pill */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl px-5 py-4 flex items-center justify-between text-white">
            <div>
              <p className="text-xs text-indigo-200 font-medium uppercase tracking-wider mb-0.5">You are paying</p>
              <p className="text-3xl font-black">{fmt(totalAmount, currency)}</p>
            </div>
            <div className="text-right opacity-80">
              <p className="text-sm font-semibold">{name}</p>
              <p className="text-xs">{email}</p>
            </div>
          </div>

          {/* Method selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'card',          icon: <CreditCard className="w-4 h-4" />, label: 'Card' },
                { id: 'mobile_money',  icon: <Phone className="w-4 h-4" />,      label: 'Mobile Money' },
                { id: 'bank_transfer', icon: <Building2 className="w-4 h-4" />,  label: 'Bank Transfer' },
              ] as { id: PayMethod; icon: React.ReactNode; label: string }[]).map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${method === m.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}>
                  {m.icon}
                  <span className="leading-tight text-center">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card fields */}
          {method === 'card' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Card Number</label>
                <div className="relative">
                  <input value={cardNum} onChange={e => setCardNum(fmtCard(e.target.value))} placeholder="1234 5678 9012 3456" maxLength={19}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors pr-20" />
                  {cardBrand(cardNum) && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{cardBrand(cardNum)}</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Expiry</label>
                  <input value={expiry} onChange={e => setExpiry(fmtExpiry(e.target.value))} placeholder="MM/YY" maxLength={5}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">CVV</label>
                  <input type="password" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="•••" maxLength={4}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Name on Card</label>
                <input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="As printed on card"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors" />
              </div>
            </div>
          )}

          {/* Mobile Money fields */}
          {method === 'mobile_money' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Network</label>
                <div className="grid grid-cols-3 gap-2">
                  {NETWORKS.map(n => (
                    <button key={n.id} onClick={() => setNetwork(n.id)}
                      style={network === n.id ? { borderColor: n.color, background: n.bg } : {}}
                      className={`py-3 rounded-xl border-2 text-xs font-bold transition-all ${network === n.id ? 'text-slate-800' : 'border-slate-200 text-slate-400 hover:border-slate-300 bg-white'}`}>
                      {n.id}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Mobile Number</label>
                <input type="tel" value={momoPhone} onChange={e => setMomoPhone(e.target.value)} placeholder="024 000 0000"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors" />
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 text-xs text-amber-700 leading-relaxed">
                📱 You will receive a payment prompt on <strong>{momoPhone || 'your phone'}</strong>. Approve it to complete the payment.
              </div>
            </div>
          )}

          {/* Bank Transfer */}
          {method === 'bank_transfer' && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1.5">
              <p className="text-sm font-semibold text-blue-800">Bank Transfer</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                After clicking Pay, you will receive a virtual account number to transfer <strong>{fmt(totalAmount, currency)}</strong> to. Your payment confirms automatically once received.
              </p>
            </div>
          )}

          {/* Pay button */}
          <button onClick={handlePay}
            className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-xl transition-colors shadow-lg shadow-indigo-100">
            <Lock className="w-4 h-4" />
            Pay {fmt(totalAmount, currency)} Securely
          </button>

          <p className="text-center text-xs text-slate-400">Your payment is encrypted with 256-bit SSL. Processed by Paystack.</p>
        </div>
      )}
    </Shell>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────
function Shell({ children, pageData }: { children: React.ReactNode; pageData: PageData | null }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-purple-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {pageData && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-4 mb-3 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-black flex-shrink-0 shadow">
              {pageData.merchant?.legalName?.charAt(0) ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{pageData.merchant?.legalName}</p>
              <h1 className="text-sm font-bold text-slate-900 truncate">{pageData.name}</h1>
              {pageData.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{pageData.description}</p>}
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 p-6">
          {children}
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <Shield className="w-3 h-3 text-slate-300" />
          <p className="text-xs text-slate-400">Secured by <strong className="text-slate-600">ATLAS</strong> · 256-bit SSL encryption</p>
        </div>
      </div>
    </div>
  );
}

// ── Paystack JS runner ───────────────────────────────────────────────────
declare global { interface Window { PaystackPop?: any } }

function loadPaystack(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.onload = () => resolve(); s.onerror = () => reject(new Error('Paystack load failed'));
    document.head.appendChild(s);
  });
}

async function runPaystack(opts: {
  publicKey: string; email: string; amount: number; currency: string; reference: string;
  channels: string[]; onSuccess: (r: string) => void; onCancel: () => void;
}) {
  await loadPaystack();
  return new Promise<void>(resolve => {
    const h = window.PaystackPop!.setup({
      key: opts.publicKey, email: opts.email, amount: opts.amount, currency: opts.currency,
      ref: opts.reference, channels: opts.channels,
      callback: (r: any) => { opts.onSuccess(r.reference ?? opts.reference); resolve(); },
      onClose: () => { opts.onCancel(); resolve(); },
    });
    h.openIframe();
  });
}
