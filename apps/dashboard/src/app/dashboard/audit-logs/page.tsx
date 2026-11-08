'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import { List, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // In a real app, you might pass the filter to the API. 
      // For now we'll just fetch and filter client-side if needed or assume API handles it.
      let url = '/v1/audit-logs?skip=0&take=50';
      const data = await apiFetch(url);
      
      let fetchedLogs = (data as any)?.items || [];
      if (actionFilter) {
        fetchedLogs = fetchedLogs.filter((log: any) => log.action.includes(actionFilter));
      }
      
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 mt-1">Track actions and changes in your workspace</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md px-3 py-2 shadow-sm">
          <Filter size={16} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Filter by action..." 
            className="outline-none text-sm text-gray-700 w-48"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <List className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No audit logs found</h3>
            <p className="text-gray-500">No activity matches your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Resource</th>
                  <th className="px-6 py-4 font-medium">Actor</th>
                  <th className="px-6 py-4 font-medium">IP Address</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {logs.map((log, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{log.action}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs bg-gray-50 rounded px-2 py-1 inline-block mt-2 mb-2 ml-4">
                      {log.resourceId || log.resource}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{log.actorId || log.actor}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{log.ipAddress}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
