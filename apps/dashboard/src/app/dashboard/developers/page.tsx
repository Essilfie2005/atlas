'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import {
  Key, Webhook, BookOpen, Copy, Check, Code,
  ExternalLink, Play, Shield, Terminal, Globe, Smartphone
} from 'lucide-react';
import Script from 'next/script';

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'keys' | 'webhooks' | 'endpoints'>('quickstart');
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [selectedLang, setSelectedLang] = useState<'html' | 'nodejs' | 'python' | 'curl'>('html');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setLoadingKeys(true);
    try {
      const data: any = await apiFetch('/v1/auth/keys');
      setApiKeys(data?.data || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoadingKeys(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activeTestKey = apiKeys.find((k) => k.type === 'TEST' && k.status === 'ACTIVE') || apiKeys[0];
  const publicKey = activeTestKey?.publicKey || `pk_test_${activeTestKey?.id || 'sample_key_12345'}`;
  const secretKey = activeTestKey?.keyPrefix ? `${activeTestKey.keyPrefix}••••••••••••••••••••••••` : 'sk_test_••••••••••••••••••••••••';

  // Live test demo runner
  const runDemoCheckout = () => {
    if (typeof window !== 'undefined' && (window as any).Atlas) {
      const Atlas = (window as any).Atlas;
      const atlas = new Atlas({
        key: publicKey,
        amount: 25.0,
        currency: 'GHS',
        email: 'developer.test@example.com',
        name: 'Demo Customer',
        phone: '0241234567',
        onSuccess: (res: any) => {
          alert(`🎉 Payment Successful! Reference: ${res.reference}`);
        },
        onCancel: () => {
          console.log('Customer dismissed checkout');
        },
      });
      atlas.open();
    } else {
      alert('Atlas.js script is initializing. Please try again in a moment.');
    }
  };

  const codeSnippets = {
    html: `<!-- 1. Include ATLAS Client SDK in your HTML or Next.js app -->
<script src="https://atlas-gamma-bay.vercel.app/atlas.js"></script>

<!-- 2. Drop-in payment trigger button -->
<button onclick="payWithAtlas()" class="pay-btn">Pay GH₵ 25.00</button>

<script>
  function payWithAtlas() {
    const atlas = new Atlas({
      key: '${publicKey}', // Your Public Key
      email: 'customer@example.com',
      amount: 25.00,
      currency: 'GHS', // GHS, NGN, KES, ZAR, USD
      name: 'Customer Name',
      phone: '0240000000',
      onSuccess: function(response) {
        console.log('Payment successful! Reference:', response.reference);
        window.location.href = '/receipt?ref=' + response.reference;
      },
      onCancel: function() {
        console.log('Payment modal closed');
      }
    });

    atlas.open();
  }
</script>`,

    nodejs: `// Install: npm install axios
const axios = require('axios');

async function createPaymentIntent() {
  const response = await axios.post(
    'https://atlas-vrv3.onrender.com/v1/payment-intents',
    {
      amount: 2500, // 25.00 in minor currency units (pesewas/kobo)
      currency: 'GHS',
      customerEmail: 'customer@example.com',
      description: 'Order #1092',
      metadata: { orderId: '1092' }
    },
    {
      headers: {
        Authorization: 'Bearer ${secretKey}', // Your ATLAS Secret Key
        'Content-Type': 'application/json'
      }
    }
  );

  console.log('Created Intent:', response.data);
  return response.data;
}

createPaymentIntent();`,

    python: `# Install: pip install requests
import requests

url = "https://atlas-vrv3.onrender.com/v1/payment-intents"

headers = {
    "Authorization": "Bearer ${secretKey}",
    "Content-Type": "application/json"
}

payload = {
    "amount": 2500,  # Minor units
    "currency": "GHS",
    "customerEmail": "customer@example.com",
    "description": "Subscription Renewal"
}

response = requests.post(url, json=payload, headers=headers)
print("Payment Intent Response:", response.json())`,

    curl: `# Create a Payment Intent via ATLAS REST API
curl -X POST https://atlas-vrv3.onrender.com/v1/payment-intents \\
  -H "Authorization: Bearer ${secretKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 2500,
    "currency": "GHS",
    "customerEmail": "customer@example.com",
    "description": "API Direct Charge"
  }'`,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Load atlas.js for live testing */}
      <Script src="/atlas.js" strategy="lazyOnload" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Developer Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            Integrate Pan-African payment rails into your websites, mobile apps, and backend services.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://atlas-vrv3.onrender.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Interactive API Swagger</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <button
            onClick={runDemoCheckout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Test Checkout Modal</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('quickstart')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'quickstart'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code className="w-4 h-4" />
          Quickstart & SDKs
        </button>

        <button
          onClick={() => setActiveTab('keys')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'keys'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          API Key Pairs
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'webhooks'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Webhook className="w-4 h-4" />
          Webhooks
        </button>

        <button
          onClick={() => setActiveTab('endpoints')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'endpoints'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Core Endpoints
        </button>
      </div>

      {/* Tab 1: Quickstart & SDKs */}
      {activeTab === 'quickstart' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold uppercase tracking-wider border border-blue-400/30">
                Client SDK v1.0 Released
              </span>
              <h2 className="text-xl font-bold mt-2">Embed Checkout with atlas.js</h2>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                Add African Mobile Money (MTN, Telecel, AT) and Card payments directly to any website with a single script tag. Zero dependencies required.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={runDemoCheckout}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Try Live Checkout Demo
                </button>
                <button
                  onClick={() => setActiveTab('keys')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition"
                >
                  View Your Public Key
                </button>
              </div>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                {(['html', 'nodejs', 'python', 'curl'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                      selectedLang === lang
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    {lang === 'html' ? 'atlas.js (HTML)' : lang}
                  </button>
                ))}
              </div>

              <button
                onClick={() => copyToClipboard(codeSnippets[selectedLang], 'snippet')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                {copiedKey === 'snippet' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 bg-slate-950 text-slate-100 overflow-x-auto">
              <pre className="font-mono text-xs leading-relaxed">
                <code>{codeSnippets[selectedLang]}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: API Key Pairs */}
      {activeTab === 'keys' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Active API Key Pair</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Use your Public Key on frontend websites and mobile apps. Keep your Secret Key confidential on your backend.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Public Key Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                    Public (Publishable) Key
                  </span>
                  <button
                    onClick={() => copyToClipboard(publicKey, 'pub')}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                  >
                    {copiedKey === 'pub' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Used by <strong>atlas.js</strong> and client-side checkout forms. Safe to publish publicly.
                </p>
              </div>
              <code className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 break-all select-all font-medium">
                {publicKey}
              </code>
            </div>

            {/* Secret Key Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                    Secret Key
                  </span>
                  <button
                    onClick={() => copyToClipboard(activeTestKey?.keyPrefix || 'sk_test_...', 'sec')}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                  >
                    {copiedKey === 'sec' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Used exclusively for server-to-server calls to create charges, initiate payouts, and fetch data.
                </p>
              </div>
              <code className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-500 break-all select-all">
                {secretKey}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Webhook Events & Verification</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ATLAS sends real-time HTTP POST notifications to your server whenever a transaction completes or changes state.
            </p>
          </div>

          <div className="bg-slate-950 text-slate-100 rounded-2xl p-5 font-mono text-xs overflow-x-auto">
            <p className="text-slate-400 mb-2">// Verifying webhook signatures in Node.js / Express:</p>
            <pre>
              {`const crypto = require('crypto');

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-atlas-signature'];
  const hash = crypto
    .createHmac('sha512', process.env.ATLAS_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== signature) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;
  if (event.event === 'payment_intent.succeeded') {
    const payment = event.data;
    console.log('Payment completed:', payment.id, payment.amount);
    // Fulfill customer order here
  }

  res.sendStatus(200);
});`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: Core Endpoints */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          {[
            {
              method: 'POST',
              path: '/v1/payment-intents',
              desc: 'Create a new payment intent with automatic routing and idempotency.',
            },
            {
              method: 'GET',
              path: '/v1/payment-intents/:id',
              desc: 'Retrieve full details and status of an existing payment intent.',
            },
            {
              method: 'POST',
              path: '/v1/customers',
              desc: 'Create or update a customer profile with payment history.',
            },
            {
              method: 'POST',
              path: '/v1/payouts',
              desc: 'Initiate a mobile money or bank payout to a recipient.',
            },
            {
              method: 'POST',
              path: '/v1/payment-pages',
              desc: 'Generate a hosted, shareable payment link for products or services.',
            },
          ].map((ep, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-blue-100 text-blue-700">
                    {ep.method}
                  </span>
                  <code className="text-sm font-bold text-slate-800 font-mono">{ep.path}</code>
                </div>
                <p className="text-xs text-slate-500">{ep.desc}</p>
              </div>
              <a
                href="https://atlas-vrv3.onrender.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
              >
                <span>Docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
