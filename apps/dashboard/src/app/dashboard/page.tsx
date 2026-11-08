'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Activity, DollarSign } from 'lucide-react';
import { formatMoney, getMerchantDefaultCurrency, getCurrencySymbol } from '@/lib/currency';

export default function DashboardPage() {
  const [merchant, setMerchant] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [merchantRes, recentTxRes, countRes]: [any, any, any] = await Promise.all([
          apiFetch('/v1/merchants/me').catch(() => null),
          apiFetch('/v1/payment-intents?limit=5&take=5').catch(() => ({ items: [], data: [] })),
          apiFetch('/v1/payment-intents?limit=1&take=1').catch(() => ({ total: 0, pagination: { total: 0 } }))
        ]);
        
        const recentItems = recentTxRes?.items ?? recentTxRes?.data ?? [];
        const totalCount = countRes?.pagination?.total ?? countRes?.total ?? 0;
        
        setMerchant(merchantRes);
        setRecentTransactions(recentItems);
        setTotalTransactions(totalCount);
        
        const totalVol = recentItems.reduce((acc: number, tx: any) => acc + (Number(tx.amount) || 0), 0);
        setVolume(totalVol);
      } catch (error) {
        console.error('Error loading dashboard data', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map(i => (
             <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  const merchantCurrency = getMerchantDefaultCurrency(merchant?.country);
  const primaryCurrency = recentTransactions[0]?.currency || merchantCurrency;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold">Welcome back{merchant?.legalName || merchant?.name ? `, ${merchant.legalName || merchant.name}` : ''}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Volume (Recent)</h3>
            <span className="text-xs font-semibold text-slate-400">{getCurrencySymbol(primaryCurrency)}</span>
          </div>
          <div className="text-2xl font-bold">{formatMoney(volume, primaryCurrency)}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
            <Activity className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{totalTransactions}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
        </div>
        <div className="p-6">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No transactions yet. Start accepting payments via the ATLAS API.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b last:border-0">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatMoney(tx.amount, tx.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          tx.status === 'SUCCEEDED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          tx.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          tx.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {tx.customerEmail || tx.metadata?.customerEmail || '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
