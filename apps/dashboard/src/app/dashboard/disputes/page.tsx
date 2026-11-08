'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import { AlertTriangle, Clock } from 'lucide-react';

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const data = await apiFetch('/v1/disputes?skip=0&take=20');
      setDisputes((data as any)?.items || []);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Disputes</h1>
        <p className="text-gray-500 mt-1">Manage and respond to chargebacks</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading disputes...</div>
        ) : disputes.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No disputes found</h3>
            <p className="text-gray-500">You currently have no active disputes.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Evidence Due</th>
                <th className="px-6 py-4 font-medium">Date Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {disputes.map((dispute, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">${(dispute.amount / 100).toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{dispute.reason?.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      dispute.status === 'won' ? 'bg-green-100 text-green-700' :
                      dispute.status === 'lost' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {dispute.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {new Date(dispute.evidenceDueBy).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(dispute.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
