'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import { RefreshCw, ChevronDown, ChevronUp, Webhook } from 'lucide-react';

export default function WebhooksPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/v1/webhooks/events');
      setEvents((data as any)?.items || []);
    } catch (error) {
      console.error('Failed to fetch webhook events', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await apiFetch(`/v1/webhooks/events/${id}/retry`, { method: 'POST' });
      fetchEvents();
    } catch (error) {
      console.error('Failed to retry event', error);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredEvents = statusFilter === 'ALL' 
    ? events 
    : events.filter(e => e.status === statusFilter);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhook Events</h1>
          <p className="text-gray-500">Monitor and debug webhook deliveries.</p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-gray-300 border rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
          <button 
            onClick={fetchEvents}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center text-gray-600"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg shadow-sm">
          <Webhook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No webhook events yet</h3>
          <p className="text-gray-500">Configure your webhook endpoint in Settings.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Attempt</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.map((event) => (
                <React.Fragment key={event.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {event.type || 'Unknown Event'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${
                        event.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                        event.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.attempts || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.lastAttempt ? new Date(event.lastAttempt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(event.createdAt || Date.now()).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {event.status === 'FAILED' && (
                        <button 
                          onClick={() => handleRetry(event.id)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" /> Retry
                        </button>
                      )}
                      <button 
                        onClick={() => toggleRow(event.id)}
                        className="text-gray-500 hover:text-gray-900 inline-flex items-center"
                      >
                        {expandedRows[event.id] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </td>
                  </tr>
                  {expandedRows[event.id] && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="text-sm text-gray-900 font-mono bg-gray-800 text-gray-100 p-4 rounded-md overflow-x-auto">
                          <pre>{JSON.stringify(event.payload || {}, null, 2)}</pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
