'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Key, Webhook, BookOpen, Copy, Eye, EyeOff } from 'lucide-react';

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState('api-keys');
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'api-keys') {
      fetchApiKeys();
    } else if (activeTab === 'webhooks') {
      fetchWebhooks();
    }
  }, [activeTab]);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      const data: any = await apiFetch('/v1/auth/keys');
      setApiKeys(data?.data || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const data: any = await apiFetch('/v1/webhooks/events');
      setWebhooks(data?.data || []);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Developers</h1>
        <p className="text-gray-500 mt-1">Manage API keys, webhooks, and access documentation.</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'api-keys'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Key size={16} />
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'webhooks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Webhook size={16} />
            Webhooks
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'docs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen size={16} />
            Documentation
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'api-keys' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">Standard API Keys</h3>
              <button className="bg-gray-900 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800">
                Create Secret Key
              </button>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading keys...</div>
            ) : (
              <div className="p-0">
                {apiKeys.length === 0 ? (
                   <div className="p-8 text-center text-gray-500">No API keys found.</div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600">
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-6 py-3 font-medium">Token</th>
                        <th className="px-6 py-3 font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {apiKeys.map((key, i) => (
                        <tr key={i}>
                          <td className="px-6 py-4 font-medium text-gray-900">{key.name || 'Default Key'}</td>
                          <td className="px-6 py-4 font-mono text-gray-500 flex items-center gap-2">
                            ••••••••••••••••
                            <button className="text-gray-400 hover:text-gray-600"><Copy size={14}/></button>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{new Date(key.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">Webhook Endpoints</h3>
              <button className="bg-gray-900 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800">
                Add Endpoint
              </button>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading webhooks...</div>
            ) : (
              <div className="p-0">
                {webhooks.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No webhooks configured.</div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600">
                        <th className="px-6 py-3 font-medium">URL</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {webhooks.map((wh, i) => (
                        <tr key={i}>
                          <td className="px-6 py-4 font-medium text-gray-900">{wh.url}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{new Date(wh.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <BookOpen className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">API Documentation</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Explore our comprehensive guides and API references to integrate our payments infrastructure into your application.
            </p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              Read the Docs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
