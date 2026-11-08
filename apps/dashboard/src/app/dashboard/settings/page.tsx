'use client';
import React, { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiKey {
  id: string;
  name: string;
  type: 'TEST' | 'LIVE';
  keyPrefix: string;
  publicKey?: string;
  status: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

interface FreshKeyPair {
  name: string;
  secretKey: string;
  publicKey: string;
}

interface Merchant {
  id: string;
  legalName: string;
  email: string;
  country: string;
  website: string | null;
  webhookUrl: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getToken() { return typeof window !== 'undefined' ? sessionStorage.getItem('atlas_token') ?? '' : ''; }
function authHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }; }
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-brand/10 text-brand hover:bg-brand/20 transition-colors">
      {copied
        ? <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied!</>
        : <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>}
    </button>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('apikeys');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [freshKey, setFreshKey] = useState<FreshKeyPair | null>(null); // shown once after creation
  const [revoking, setRevoking] = useState<string | null>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({ legalName: '', website: '', webhookUrl: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const fetchKeys = useCallback(async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch(`${API}/v1/auth/keys`, { headers: authHeaders() });
      const data = await res.json() as { data?: ApiKey[] };
      setKeys(data.data ?? []);
    } catch { /* ignore */ } finally { setLoadingKeys(false); }
  }, []);

  const fetchMerchant = useCallback(async () => {
    try {
      const res = await fetch(`${API}/v1/merchants/me`, { headers: authHeaders() });
      const data = await res.json() as { data?: Merchant };
      if (data.data) {
        setMerchant(data.data);
        setProfileForm({ legalName: data.data.legalName, website: data.data.website ?? '', webhookUrl: data.data.webhookUrl ?? '' });
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchKeys(); fetchMerchant(); }, [fetchKeys, fetchMerchant]);

  async function createKey() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/v1/auth/keys`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: newKeyName.trim(), type: 'TEST' }),
      });
      const data = await res.json() as { data?: ApiKey & { rawKey?: string; secretKey?: string; publicKey?: string } };
      if (data.data?.rawKey || data.data?.secretKey) {
        setFreshKey({
          name: newKeyName.trim(),
          secretKey: data.data.secretKey || data.data.rawKey || '',
          publicKey: data.data.publicKey || `pk_test_${data.data.id ?? ''}`,
        });
      }
      setNewKeyName('');
      setShowCreate(false);
      await fetchKeys();
    } finally { setCreating(false); }
  }

  async function revokeKey(id: string) {
    setRevoking(id);
    try {
      await fetch(`${API}/v1/auth/keys/${id}`, { method: 'DELETE', headers: authHeaders() });
      await fetchKeys();
    } finally { setRevoking(null); }
  }

  async function saveProfile() {
    setSavingProfile(true);
    setProfileMsg('');
    try {
      await fetch(`${API}/v1/merchants/me`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ legalName: profileForm.legalName || undefined, website: profileForm.website || undefined, webhookUrl: profileForm.webhookUrl || undefined }),
      });
      setProfileMsg('Saved successfully');
      setTimeout(() => setProfileMsg(''), 3000);
    } finally { setSavingProfile(false); }
  }

  const tabs = [
    { id: 'apikeys', label: 'API Keys', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg> },
    { id: 'profile', label: 'Profile', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { id: 'webhooks', label: 'Webhooks', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
    { id: 'live', label: 'Go Live', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Settings</h1>
        <p className="text-muted text-sm mt-1">Manage your API keys, profile, and integrations</p>
      </div>

      {/* Fresh key banner — shown once after creating a key */}
      {freshKey && (
        <div className="bg-gradient-to-r from-brand/10 to-blue-400/10 border border-brand/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                <p className="text-sm font-semibold text-[#0B1F3A]">New API Key Pair Created ({freshKey.name})</p>
              </div>
              <p className="text-xs text-muted">Copy both keys now. The Secret Key will never be displayed in full again.</p>
            </div>
            <button onClick={() => setFreshKey(null)} className="text-muted hover:text-[#0B1F3A]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Public Key */}
            <div className="bg-[#0B1F3A] rounded-xl p-4 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Public (Publishable) Key</span>
                <CopyBtn value={freshKey.publicKey} />
              </div>
              <p className="text-[11px] text-slate-400">Client-side & mobile checkout</p>
              <code className="text-blue-300 font-mono text-xs break-all select-all">{freshKey.publicKey}</code>
            </div>

            {/* Secret Key */}
            <div className="bg-[#0B1F3A] rounded-xl p-4 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Secret Key</span>
                <CopyBtn value={freshKey.secretKey} />
              </div>
              <p className="text-[11px] text-slate-400">Server-side API authentication</p>
              <code className="text-amber-300 font-mono text-xs break-all select-all">{freshKey.secretKey}</code>
            </div>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 bg-white border border-border rounded-xl p-1 w-fit shadow-card">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-brand text-white shadow-sm'
                : 'text-muted hover:text-[#0B1F3A] hover:bg-page-bg'
            }`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── API Keys Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'apikeys' && (
        <div className="space-y-6">
          {/* Test Keys section */}
          <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[#0B1F3A]">Test API Keys</h2>
                <p className="text-xs text-muted mt-0.5">Use these in your development environment. No real money moves.</p>
              </div>
              <button onClick={() => setShowCreate(!showCreate)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors shadow-sm shadow-brand/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Key
              </button>
            </div>

            {/* Create key inline form */}
            {showCreate && (
              <div className="px-6 py-4 bg-brand/5 border-b border-border flex items-center gap-3">
                <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. Development, Staging…)"
                  className="flex-1 px-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  onKeyDown={e => e.key === 'Enter' && createKey()}
                  autoFocus
                />
                <button onClick={createKey} disabled={creating || !newKeyName.trim()}
                  className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark disabled:opacity-50 transition-colors">
                  {creating ? 'Creating…' : 'Create'}
                </button>
                <button onClick={() => setShowCreate(false)} className="text-muted hover:text-[#0B1F3A]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            {/* Developer Guide Callout */}
            <div className="px-6 py-3 bg-blue-50/70 border-b border-blue-100 flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-xs text-slate-600 leading-normal">
                Use your <strong className="text-brand font-semibold">Public Key</strong> in frontend web & mobile apps to initiate checkout. Keep your <strong className="text-slate-800 font-semibold">Secret Key</strong> confidential on your backend server.
              </p>
            </div>

            {/* Keys list */}
            {loadingKeys ? (
              <div className="p-6 space-y-3">
                {[1, 2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : keys.filter(k => k.type === 'TEST' && k.status === 'ACTIVE').length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                </div>
                <p className="text-sm font-medium text-[#0B1F3A]">No test keys yet</p>
                <p className="text-xs text-muted mt-1">Create a key above to start integrating with the ATLAS API</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {keys.filter(k => k.type === 'TEST' && k.status === 'ACTIVE').map(key => (
                  <div key={key.id} className="px-6 py-5 hover:bg-page-bg/40 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand/10 rounded-lg flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-[#0B1F3A]">{key.name}</p>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">TEST</span>
                          </div>
                          <p className="text-xs text-muted">Created {timeAgo(key.createdAt)} {key.lastUsedAt ? `• Last used ${timeAgo(key.lastUsedAt)}` : '• Never used'}</p>
                        </div>
                      </div>
                      <button onClick={() => revokeKey(key.id)} disabled={revoking === key.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors border border-red-200 disabled:opacity-50">
                        {revoking === key.id ? 'Revoking…' : 'Revoke'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                      {/* Public Key */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">Public Key (Publishable)</span>
                          <CopyBtn value={key.publicKey || `pk_test_${key.id}`} />
                        </div>
                        <code className="text-xs font-mono text-slate-800 break-all select-all font-medium">{key.publicKey || `pk_test_${key.id}`}</code>
                      </div>

                      {/* Secret Key */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-md">Secret Key</span>
                          <CopyBtn value={key.keyPrefix} />
                        </div>
                        <code className="text-xs font-mono text-slate-500 break-all">{key.keyPrefix}••••••••••••••••••••••••</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Keys section */}
          <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[#0B1F3A]">Live API Keys</h2>
                <p className="text-xs text-muted mt-0.5">Real payments. Requires business verification.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Locked
              </span>
            </div>
            <div className="px-6 py-8 flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/20 to-blue-300/20 flex items-center justify-center shrink-0">
                <svg className="w-7 h-7 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#0B1F3A] mb-1">Activate Live Mode</p>
                <p className="text-sm text-muted">Submit your business registration and incorporation documents to unlock live payments across Africa.</p>
              </div>
              <button onClick={() => setActiveTab('live')}
                className="shrink-0 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-dark transition-colors shadow-sm shadow-brand/20">
                Apply Now →
              </button>
            </div>
          </div>

          {/* Revoked keys */}
          {keys.filter(k => k.status === 'REVOKED').length > 0 && (
            <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-[#0B1F3A]">Revoked Keys</h2>
              </div>
              <div className="divide-y divide-border">
                {keys.filter(k => k.status === 'REVOKED').map(key => (
                  <div key={key.id} className="px-6 py-3 flex items-center gap-4 opacity-50">
                    <code className="text-xs text-muted font-mono flex-1">{key.keyPrefix}••••••••••••••••••••••••</code>
                    <p className="text-xs text-muted">{key.name}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-500 font-medium">REVOKED</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Profile Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 max-w-2xl space-y-5">
          <h2 className="font-semibold text-[#0B1F3A]">Business Profile</h2>
          <div>
            <label className="block text-sm font-medium text-[#0B1F3A] mb-1.5">Legal Business Name</label>
            <input value={profileForm.legalName} onChange={e => setProfileForm({ ...profileForm, legalName: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0B1F3A] mb-1.5">Email Address <span className="text-muted text-xs">(read-only)</span></label>
            <input readOnly value={merchant?.email ?? ''} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-page-bg text-muted" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0B1F3A] mb-1.5">Website</label>
            <input value={profileForm.website} onChange={e => setProfileForm({ ...profileForm, website: e.target.value })}
              placeholder="https://" className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <button onClick={saveProfile} disabled={savingProfile}
              className="px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-dark disabled:opacity-50 transition-colors">
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
            {profileMsg && <p className="text-sm text-green-600 font-medium">✓ {profileMsg}</p>}
          </div>
        </div>
      )}

      {/* ── Webhooks Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'webhooks' && (
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 max-w-2xl space-y-5">
          <h2 className="font-semibold text-[#0B1F3A]">Webhook Configuration</h2>
          <div>
            <label className="block text-sm font-medium text-[#0B1F3A] mb-1.5">Endpoint URL</label>
            <input value={profileForm.webhookUrl} onChange={e => setProfileForm({ ...profileForm, webhookUrl: e.target.value })}
              placeholder="https://your-server.com/webhooks/atlas"
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
            <p className="text-xs text-muted mt-1.5">ATLAS will POST signed events to this URL for payment.succeeded, payout.completed, and more.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={saveProfile} disabled={savingProfile}
              className="px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-dark disabled:opacity-50 transition-colors">
              {savingProfile ? 'Saving…' : 'Save Endpoint'}
            </button>
            <button className="px-5 py-2.5 border border-border text-sm font-semibold rounded-xl hover:bg-page-bg transition-colors text-[#0B1F3A]">
              Send Test Event
            </button>
          </div>
        </div>
      )}

      {/* ── Go Live Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'live' && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-gradient-to-br from-brand/10 to-blue-300/10 border border-brand/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <h2 className="font-bold text-[#0B1F3A]">Activate Live Mode</h2>
                <p className="text-xs text-muted">Usually reviewed within 1–2 business days</p>
              </div>
            </div>
            <p className="text-sm text-muted">Submit your business details to start accepting real payments across Africa. We review every application manually to maintain platform integrity.</p>
          </div>
          <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0B1F3A] mb-1.5">Business Registration Number</label>
              <input placeholder="e.g. CS000123456" className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0B1F3A] mb-1.5">Contact Phone</label>
              <input type="tel" placeholder="+233 20 000 0000" className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0B1F3A] mb-1.5">Business Address</label>
              <textarea rows={2} placeholder="Street, City, Country" className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0B1F3A] mb-1.5">Incorporation Document</label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-brand transition-colors cursor-pointer">
                <svg className="w-8 h-8 text-muted mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p className="text-sm text-muted">Click to upload or drag & drop</p>
                <p className="text-xs text-muted mt-1">PDF up to 10MB</p>
              </div>
            </div>
            <button className="w-full py-3 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-colors shadow-sm shadow-brand/20">
              Submit for Review →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
