'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle, Loader2, Shield, Lock, CreditCard,
  Phone, Building2, ChevronRight, AlertCircle
} from 'lucide-react';
import { formatMoney } from '@/lib/currency';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://atlas-vrv3.onrender.com/v1';

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

function loadPaystack(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if (window.PaystackPop) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Paystack script failed to load'));
    document.head.appendChild(s);
  });
}

function InlineCheckoutContent() {
  const searchParams = useSearchParams();

  const publicKey = searchParams.get('key') || '';
  const initialEmail = searchParams.get('email') || '';
  const initialName = searchParams.get('name') || '';
  const initialPhone = searchParams.get('phone') || '';
  const amountStr = searchParams.get('amount') || '10';
  const currency = (searchParams.get('currency') || 'GHS').toUpperCase();
  const reference = searchParams.get('ref') || `ref_${Date.now()}`;

  const numAmount = Math.max(0.1, parseFloat(amountStr) || 10);
  const minorAmount = Math.round(numAmount * 100);

  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [method, setMethod] = useState<'mobile_money' | 'card' | 'bank_transfer'>('mobile_money');
  const [momoNetwork, setMomoNetwork] = useState('MTN');

  const [stage, setStage] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [successRef, setSuccessRef] = useState('');

  // Validate fields
  const isValid = email.includes('@') && email.includes('.');

  const handlePay = useCallback(async () => {
    if (!isValid) return;
    setStage('processing');
    setErrorMessage('');

    try {
      await loadPaystack();

      // Fallback public key or provider resolution
      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY || 'pk_live_d7fa739a25b184f7b24388e63b78be05f57a3e35';

      if (!window.PaystackPop) {
        throw new Error('Payment gateway initializing... please retry');
      }

      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: email.trim(),
        amount: minorAmount,
        currency,
        ref: reference,
        channels: method === 'mobile_money' ? ['mobile_money'] : method === 'card' ? ['card'] : ['bank_transfer'],
        metadata: {
          atlasPublicKey: publicKey,
          customerName: name,
          customerPhone: phone,
          integration: 'atlas.js',
        },
        callback: (response: any) => {
          const finalRef = response.reference || reference;
          setSuccessRef(finalRef);
          setStage('success');

          // Notify parent window embedder via postMessage
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(
              {
                type: 'ATLAS_PAYMENT_SUCCESS',
                data: {
                  reference: finalRef,
                  amount: numAmount,
                  currency,
                  email: email.trim(),
                },
              },
              '*'
            );
          }
        },
        onClose: () => {
          setStage('form');
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'ATLAS_PAYMENT_CANCEL' }, '*');
          }
        },
      });

      handler.openIframe();
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initialization failed');
      setStage('error');
    }
  }, [isValid, email, minorAmount, currency, reference, method, publicKey, name, phone, numAmount]);

  return (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Brand Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-blue-500/20">
            A
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">ATLAS</span>
            <span className="text-[10px] text-slate-400 block font-medium">Secured Checkout</span>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/60">
          <Lock className="w-3 h-3 text-emerald-600" />
          <span>256-bit Encrypted</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col justify-between overscroll-contain">
        {stage === 'form' && (
          <div className="space-y-5">
            {/* Amount Banner */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-center">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total to Pay</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {formatMoney(numAmount, currency)}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">
                Payment Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('mobile_money')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    method === 'mobile_money'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Phone className="w-4 h-4 mb-1" />
                  <span>MoMo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    method === 'card'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mb-1" />
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('bank_transfer')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    method === 'bank_transfer'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 mb-1" />
                  <span>Bank</span>
                </button>
              </div>
            </div>

            {/* Customer Inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                />
              </div>

              {method === 'mobile_money' && (
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Mobile Money Number</label>
                  <div className="flex gap-2">
                    <select
                      value={momoNetwork}
                      onChange={(e) => setMomoNetwork(e.target.value)}
                      className="px-2.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700"
                    >
                      <option value="MTN">MTN</option>
                      <option value="TELECEL">Telecel</option>
                      <option value="AT">AT</option>
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="024 000 0000"
                      className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Full Name (Optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kwame Mensah"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                />
              </div>
            </div>
          </div>
        )}

        {stage === 'processing' && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center animate-pulse">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Processing Payment</h3>
              <p className="text-xs text-slate-500 mt-1">Please confirm the prompt on your phone or card popup</p>
            </div>
          </div>
        )}

        {stage === 'success' && (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Payment Successful!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Amount paid: <strong>{formatMoney(numAmount, currency)}</strong>
              </p>
              <div className="mt-3 bg-slate-50 rounded-lg p-2.5 text-[11px] font-mono text-slate-600 border border-slate-200/60">
                Ref: {successRef}
              </div>
            </div>
          </div>
        )}

        {stage === 'error' && (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Payment Not Completed</h3>
              <p className="text-xs text-red-500 mt-1">{errorMessage || 'An error occurred during payment.'}</p>
            </div>
            <button
              onClick={() => setStage('form')}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Footer Submit Button */}
        {stage === 'form' && (
          <div className="pt-4">
            <button
              type="button"
              disabled={!isValid}
              onClick={handlePay}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <span>Pay {formatMoney(numAmount, currency)}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-slate-400">
              <Shield className="w-3 h-3 text-slate-400" />
              <span>Powered by ATLAS Pan-African Payment Rails</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InlineCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <InlineCheckoutContent />
    </Suspense>
  );
}
