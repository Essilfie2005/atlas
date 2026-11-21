'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import {
  Key, Webhook, BookOpen, Copy, Check, Code,
  ExternalLink, Play, Shield, Terminal, Globe, Smartphone,
  CheckCircle2, Sparkles
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
      amount: 2500, // Amount in minor units (2500 = GHS 25.00)
      currency: 'GHS',
      customerEmail: 'customer@example.com',
      description: 'Order #1042',
    },
    {
      headers: {
        Authorization: 'Bearer ${secretKey}',
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('Payment Intent Created:', response.data);
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
    "amount": 2500,  # Minor units (2500 = GHS 25.00)
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
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Load atlas.js for live testing */}
      <Script src="/atlas.js" strategy="lazyOnload" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Developer Hub & SDKs
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Integrate Pan-African payment rails into your web apps, mobile apps, and backend services.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://atlas-vrv3.onrender.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition shadow-subtle active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Interactive OpenAPI Docs</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>
          <button
            onClick={runDemoCheckout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Test Checkout Modal</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar whitespace-nowrap">
        {[
          { id: 'quickstart', label: 'Quickstart & SDKs', icon: Code },
          { id: 'keys', label: 'API Key Pairs', icon: Key },
          { id: 'webhooks', label: 'Webhooks', icon: Webhook },
          { id: 'endpoints', label: 'Core Endpoints', icon: Terminal },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'border-brand text-brand dark:text-blue-400 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Quickstart & SDKs */}
      {activeTab === 'quickstart' && (
        <div className="space-y-5">
          {/* Hero Banner */}
          <div className="bg-zinc-950 text-white rounded-2xl p-5 sm:p-6 border border-zinc-800 shadow-card relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-semibold uppercase tracking-wider border border-blue-400/30">
                Client SDK v1.1 Active
              </span>
              <h3 className="text-lg sm:text-xl font-bold mt-2">Embed Checkout with atlas.js</h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                Add African Mobile Money (MTN, Telecel, AT) and Card payments directly to any website with a single script tag. Zero dependencies required.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 mt-4">
                <button
                  onClick={runDemoCheckout}
                  className="px-3.5 py-2 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Try Live Checkout Demo</span>
                </button>
                <button
                  onClick={() => setActiveTab('keys')}
                  className="px-3.5 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 rounded-xl text-xs font-semibold transition border border-zinc-700"
                >
                  <span>View Public Key</span>
                </button>
              </div>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-card">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-850/60">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {(['html', 'nodejs', 'python', 'curl'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition ${
                      selectedLang === lang
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {lang === 'html' ? 'atlas.js (HTML)' : lang}
                  </button>
                ))}
              </div>

              <button
                onClick={() => copyToClipboard(codeSnippets[selectedLang], 'snippet')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition active:scale-95"
              >
                {copiedKey === 'snippet' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 bg-zinc-950 text-zinc-100 overflow-x-auto max-w-full font-mono text-xs leading-relaxed">
              <pre className="no-scrollbar">
                <code>{codeSnippets[selectedLang]}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: API Key Pairs */}
      {activeTab === 'keys' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 sm:p-6 space-y-5 shadow-card">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white">Active Scoped API Key Pairs</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Use your Public Key on client websites. Keep your Secret Key securely on your backend server.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Public Key Card */}
            <div className="bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    Publishable Key (Client)
                  </span>
                  <button
                    onClick={() => copyToClipboard(publicKey, 'pub')}
                    className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                  >
                    {copiedKey === 'pub' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  Used by <strong>atlas.js</strong> drop-in forms. Safe to publish in frontend code.
                </p>
              </div>
              <code className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all select-all font-medium">
                {publicKey}
              </code>
            </div>

            {/* Secret Key Card */}
            <div className="bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    Secret Key (Server)
                  </span>
                  <button
                    onClick={() => copyToClipboard(activeTestKey?.keyPrefix || 'sk_test_...', 'sec')}
                    className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                  >
                    {copiedKey === 'sec' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  Used exclusively for server-to-server calls to create charges and execute payouts.
                </p>
              </div>
              <code className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-400 break-all select-all">
                {secretKey}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 sm:p-6 space-y-4 shadow-card">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white">Webhook Signature Verification</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              ATLAS signs all event payloads with HMAC-SHA512. Verify each request before fulfilling orders.
            </p>
          </div>

          <div className="bg-zinc-950 text-zinc-100 rounded-2xl p-4 font-mono text-xs overflow-x-auto leading-relaxed border border-zinc-800">
            <p className="text-zinc-400 mb-2">// Node.js / Express Webhook Handler:</p>
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
        <div className="space-y-3">
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
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-card">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    {ep.method}
                  </span>
                  <code className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-mono">{ep.path}</code>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{ep.desc}</p>
              </div>
              <a
                href="https://atlas-vrv3.onrender.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-brand dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
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
