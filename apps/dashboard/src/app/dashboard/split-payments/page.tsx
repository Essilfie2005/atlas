"use client";

import { useEffect, useState } from "react";
import { Plus, Split } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export default function SplitPayments() {
  const [splits, setSplits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadSplits();
  }, []);

  const loadSplits = async () => {
    try {
      const data = await apiFetch("/v1/split-payments");
      setSplits((data as any)?.items || []);
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
      await apiFetch("/v1/split-payments", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          currency: formData.get("currency"),
          totalAmount: Number(formData.get("totalAmount")),
        }),
      });
      setIsModalOpen(false);
      loadSplits();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Split Payments</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Split
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : splits.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-dashed rounded-lg">
          <Split className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No split payments</h3>
          <p className="text-gray-500 mb-4">Create a split payment to divide incoming funds</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            New Split
          </button>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500">Currency</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500">Participants</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500">Total Amount</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {splits.map((split: any, i: number) => (
                <tr key={split.id || i}>
                  <td className="px-6 py-4">{split.name}</td>
                  <td className="px-6 py-4">{split.currency}</td>
                  <td className="px-6 py-4">{split.participants || 0}</td>
                  <td className="px-6 py-4">{split.totalAmount}</td>
                  <td className="px-6 py-4">{split.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">New Split Payment</h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    name="name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <input
                    name="currency"
                    defaultValue="USD"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <input
                    name="totalAmount"
                    type="number"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  />
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
