'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    legalName: '', email: '', password: '', confirmPassword: '', country: 'GH', website: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const body = {
        legalName: form.legalName,
        email: form.email,
        password: form.password,
        country: form.country,
        ...(form.website ? { website: form.website } : {}),
      };
      const res = await fetch(`${apiUrl}/v1/merchants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { error?: { message: string } };
      if (!res.ok) { setError(data.error?.message ?? 'Registration failed'); return; }
      setSuccess(true);
    } catch {
      setError('Cannot connect to ATLAS API. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }

  // Clean success screen — no key shown here
  if (success) {
    return (
      <div className="min-h-screen bg-[#0B1F3A] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
          <p className="text-[#7A9CC0] mb-2">Welcome to ATLAS, {form.legalName}.</p>
          <p className="text-[#7A9CC0] text-sm mb-8">
            Sign in to access your dashboard. Your API keys are available under <strong className="text-white">Settings → API Keys</strong>.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Go to Sign In →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1F3A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/30">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">ATLAS</span>
          </div>
          <p className="text-[#7A9CC0] text-sm">Pan-African Payment Infrastructure</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <h1 className="text-xl font-semibold text-white mb-1">Create your account</h1>
          <p className="text-[#7A9CC0] text-sm mb-6">Start accepting payments across Africa</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#B0D8FF] mb-1.5">Legal Business Name</label>
              <input
                value={form.legalName}
                onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                placeholder="Delivery Ltd"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#B0D8FF] mb-1.5">Business Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="hello@yourbusiness.com"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#B0D8FF] mb-1.5">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 8 chars"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  required minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#B0D8FF] mb-1.5">Confirm</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Repeat"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#B0D8FF] mb-1.5">Country</label>
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0B1F3A] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                required
              >
                <option value="GH">🇬🇭 Ghana</option>
                <option value="NG">🇳🇬 Nigeria</option>
                <option value="KE">🇰🇪 Kenya</option>
                <option value="ZA">🇿🇦 South Africa</option>
                <option value="TZ">🇹🇿 Tanzania</option>
                <option value="UG">🇺🇬 Uganda</option>
                <option value="RW">🇷🇼 Rwanda</option>
                <option value="ET">🇪🇹 Ethiopia</option>
                <option value="EG">🇪🇬 Egypt</option>
                <option value="CM">🇨🇲 Cameroon</option>
                <option value="CI">🇨🇮 Côte d&apos;Ivoire</option>
                <option value="SN">🇸🇳 Senegal</option>
                <option value="ZM">🇿🇲 Zambia</option>
                <option value="ZW">🇿🇼 Zimbabwe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#B0D8FF] mb-1.5">
                Website <span className="text-white/30">(optional)</span>
              </label>
              <input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://yourbusiness.com"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-brand/25 mt-2"
            >
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-xs text-center text-[#7A9CC0] mt-5">
            Already have an account?{' '}
            <a href="/login" className="text-brand hover:underline font-medium">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
