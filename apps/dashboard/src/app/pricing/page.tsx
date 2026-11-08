import React from 'react';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    sub: 'No monthly fee',
    color: 'from-slate-50 to-white',
    border: 'border-slate-200',
    badge: null,
    cta: 'Get started free',
    ctaStyle: 'bg-slate-900 text-white hover:bg-slate-800',
    features: [
      'Up to GHS 50,000/month volume',
      '1.5% + GHS 0.50 per transaction',
      'Mobile money & card acceptance',
      'Basic dashboard & analytics',
      '3 API keys',
      'Email support',
      '99.5% uptime SLA',
    ],
    notIncluded: ['Payouts API', 'Recurring billing', 'Split payments', 'Dedicated support'],
  },
  {
    name: 'Growth',
    price: 'GHS 299',
    sub: 'per month',
    color: 'from-blue-600 to-indigo-700',
    border: 'border-transparent',
    badge: 'Most Popular',
    cta: 'Start 14-day free trial',
    ctaStyle: 'bg-white text-blue-700 hover:bg-blue-50',
    features: [
      'Up to GHS 500,000/month volume',
      '1.2% + GHS 0.30 per transaction',
      'Everything in Starter',
      'Payouts & beneficiaries',
      'Recurring / subscriptions',
      'Split payments',
      'Payment pages (hosted)',
      'Webhooks + event logs',
      'Priority email & chat support',
      '99.9% uptime SLA',
    ],
    notIncluded: ['Dedicated account manager', 'Custom contracts'],
  },
  {
    name: 'Scale',
    price: 'GHS 999',
    sub: 'per month',
    color: 'from-slate-50 to-white',
    border: 'border-slate-200',
    badge: null,
    cta: 'Contact sales',
    ctaStyle: 'bg-slate-900 text-white hover:bg-slate-800',
    features: [
      'Unlimited volume',
      'Custom rate (from 0.8%)',
      'Everything in Growth',
      'Dedicated account manager',
      'AI reconciliation insights',
      'Custom webhook retry policies',
      'Multi-user team access',
      'SLA custom contracts',
      '24/7 phone + priority support',
      '99.99% uptime SLA',
    ],
    notIncluded: [],
  },
];

const faqs = [
  {
    q: 'When am I charged?',
    a: 'Transaction fees are deducted automatically from each successful payment. Monthly subscription fees are billed on the 1st of each month.',
  },
  {
    q: 'Can I switch plans?',
    a: 'Yes — upgrade or downgrade anytime from your dashboard. Changes take effect immediately and are prorated.',
  },
  {
    q: 'What currencies does ATLAS support?',
    a: 'GHS (Ghana Cedis) is fully supported with live routes. NGN, KES, ZAR, and XOF are in beta — contact us to enable them.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Growth and Scale plans include a 14-day free trial — no credit card required. You can test everything with our sandbox environment.',
  },
  {
    q: 'How are payouts settled?',
    a: 'Settlements happen T+1 (next business day) for Growth and Scale plans. Starter plan settles T+3.',
  },
  {
    q: 'Do you charge for failed transactions?',
    a: 'Never. You only pay for successful, completed payments.',
  },
];

function CheckIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-black text-xl text-slate-900 tracking-tight">ATLAS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors">Sign in</Link>
            <Link href="/register" className="px-4 py-2 bg-[#5850EC] hover:bg-[#4F46E5] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
              Get started →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Simple, transparent pricing
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
          Pay only for what<br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">actually works</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
          No setup fees. No hidden charges. Cancel anytime. Failed transactions are always free.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => {
            const isDark = plan.color.includes('blue-600');
            return (
              <div
                key={plan.name}
                className={`relative rounded-3xl border overflow-hidden ${plan.border} ${isDark ? '' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute top-5 right-5">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/30">
                      {plan.badge}
                    </span>
                  </div>
                )}
                {/* Card header */}
                <div className={`bg-gradient-to-br ${plan.color} p-8 ${isDark ? 'text-white' : ''}`}>
                  <p className={`text-sm font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-blue-200' : 'text-slate-400'}`}>{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                    {plan.sub !== 'No monthly fee' && <span className={`text-sm ${isDark ? 'text-blue-200' : 'text-slate-400'}`}>{plan.sub}</span>}
                  </div>
                  <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-slate-500'}`}>{plan.sub === 'No monthly fee' ? plan.sub : ''}</p>
                  <Link
                    href="/register"
                    className={`mt-6 block text-center py-3 px-6 rounded-xl font-bold text-sm transition-colors ${plan.ctaStyle}`}
                  >
                    {plan.cta}
                  </Link>
                </div>

                {/* Features */}
                <div className="bg-white p-8 space-y-3">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-start gap-3">
                      <span className="mt-0.5 text-emerald-500"><CheckIcon /></span>
                      <span className="text-sm text-slate-700">{f}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map(f => (
                    <div key={f} className="flex items-start gap-3">
                      <span className="mt-0.5"><XIcon /></span>
                      <span className="text-sm text-slate-400">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise callout */}
        <div className="mt-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-white mb-2">Processing over GHS 5M/month?</h3>
            <p className="text-slate-400">Custom rates, dedicated infrastructure, SLA guarantees and a named account manager. Let's talk.</p>
          </div>
          <Link href="mailto:enterprise@atlas.africa" className="flex-shrink-0 px-8 py-3.5 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-100 transition-colors whitespace-nowrap">
            Contact Enterprise →
          </Link>
        </div>

        {/* FAQs */}
        <div className="mt-20">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-3">Frequently asked questions</h2>
          <p className="text-slate-500 text-center mb-12">Can't find the answer? <a href="mailto:support@atlas.africa" className="text-blue-600 hover:underline">Email our team</a>.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.map(faq => (
              <div key={faq.q} className="bg-slate-50 rounded-2xl p-6">
                <h4 className="font-bold text-slate-900 mb-2">{faq.q}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Ready to start collecting payments?</h2>
          <p className="text-slate-500 mb-8">Join hundreds of African businesses growing with ATLAS.</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="px-8 py-4 bg-[#5850EC] hover:bg-[#4F46E5] text-white font-bold rounded-2xl transition-colors shadow-lg shadow-indigo-200 text-sm">
              Create free account →
            </Link>
            <Link href="/login" className="px-8 py-4 border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-colors text-sm">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <span>© 2026 ATLAS Technologies. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-slate-600 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-slate-600 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-slate-600 transition-colors">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
