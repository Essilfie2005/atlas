"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCcw } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export default function Recurring() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const data = await apiFetch("/v1/subscriptions");
      setSubscriptions((data as any)?.items || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await apiFetch("/v1/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          planName: formData.get("planName"),
          amount: Math.round(Number(formData.get("amount")) * 100),
          currency: "GHS",
          interval: String(formData.get("interval")).toUpperCase(),
          startDate: new Date().toISOString(),
        }),
      });
      setIsModalOpen(false);
      loadSubscriptions();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Recurring Subscriptions</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Subscription
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-dashed rounded-lg">
          <RefreshCcw className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No subscriptions</h3>
          <p className="text-gray-500 mb-4">Create a subscription to bill customers regularly</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            New Subscription
          </button>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-gray-500">Plan Name</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500">Customer</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500">Amount</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500">Interval</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500">Next Charge</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subscriptions.map((sub: any, i: number) => (
                <tr key={sub.id || i}>
                  <td className="px-6 py-4">{sub.planName}</td>
                  <td className="px-6 py-4">{sub.customer}</td>
                  <td className="px-6 py-4">{sub.amount}</td>
                  <td className="px-6 py-4">{sub.interval}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{sub.nextCharge}</td>
                  <td className="px-6 py-4">{sub.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">New Subscription</h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                  <input
                    name="planName"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Email</label>
                  <input
                    name="customer"
                    type="email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    name="amount"
                    type="number"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Interval</label>
                  <select
                    name="interval"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
