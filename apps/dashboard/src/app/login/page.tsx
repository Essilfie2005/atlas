'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json() as {
        data?: { token?: string; merchant?: { legalName: string; email: string } };
        error?: { message: string };
      };

      if (!res.ok) {
        setError(data.error?.message ?? 'Invalid email or password');
        return;
      }

      const { token, merchant } = data.data ?? {};
      if (!token) { setError('Login failed — no token received'); return; }

      sessionStorage.setItem('atlas_token', token);
      sessionStorage.setItem('atlas_merchant_name', merchant?.legalName ?? 'Merchant');
      sessionStorage.setItem('atlas_merchant_email', merchant?.email ?? '');

      router.push('/dashboard');
    } catch {
      setError('Cannot connect to ATLAS API. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">ATLAS</span>
          </div>
          <p className="text-slate-400 text-sm">Pan-African Payment Infrastructure</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Sign in to Dashboard</h1>
          <p className="text-sm text-gray-500 mb-6">Use your email and password to continue</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="hello@yourbusiness.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                required
                autoFocus
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <a href="/forgot-password" className="text-xs text-brand hover:underline font-medium">Forgot password?</a>
              </div>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !form.email || !form.password}
              className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-center text-gray-400">
              Don&apos;t have an account?{' '}
              <a href="/register" className="text-brand hover:underline font-medium">
                Register your business
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          ATLAS v1.0 · Built for Africa
        </p>
      </div>
    </div>
  );
}
