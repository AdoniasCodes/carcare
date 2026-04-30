"use client";

import { useEffect, useState } from "react";

interface PromoCode {
  id: number;
  code: string;
  description: string | null;
  discount_type: "amount" | "percent";
  discount_value: number;
  applies_to: "all" | "subscription" | "booking" | "silver" | "gold" | "platinum";
  max_uses: number | null;
  uses_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

const appliesLabels: Record<string, string> = {
  all: "All",
  booking: "One-time bookings",
  subscription: "All subscriptions",
  silver: "Silver only",
  gold: "Gold only",
  platinum: "Platinum only",
};

export default function AdminPromoPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const [newCode, setNewCode] = useState({
    code: "",
    description: "",
    discount_type: "amount" as "amount" | "percent",
    discount_value: "",
    applies_to: "all",
    max_uses: "",
    expires_at: "",
  });

  const fetchCodes = () => {
    setLoading(true);
    const key = localStorage.getItem("admin-key");
    fetch("/api/promo", { headers: { "x-admin-key": key || "" } })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCodes(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const create = async () => {
    setError("");
    if (!newCode.code.trim()) return setError("Code is required");
    if (!newCode.discount_value || Number(newCode.discount_value) <= 0) return setError("Discount value required");
    if (newCode.discount_type === "percent" && Number(newCode.discount_value) > 100) {
      return setError("Percent must be 1-100");
    }

    setCreating(true);
    const key = localStorage.getItem("admin-key");
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key || "" },
        body: JSON.stringify({
          code: newCode.code.trim().toUpperCase(),
          description: newCode.description || null,
          discount_type: newCode.discount_type,
          discount_value: Number(newCode.discount_value),
          applies_to: newCode.applies_to,
          max_uses: newCode.max_uses ? Number(newCode.max_uses) : null,
          expires_at: newCode.expires_at || null,
          active: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create");
        return;
      }
      setNewCode({
        code: "",
        description: "",
        discount_type: "amount",
        discount_value: "",
        applies_to: "all",
        max_uses: "",
        expires_at: "",
      });
      setShowForm(false);
      fetchCodes();
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (code: PromoCode) => {
    const key = localStorage.getItem("admin-key");
    await fetch(`/api/promo/${code.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": key || "" },
      body: JSON.stringify({ active: !code.active }),
    });
    fetchCodes();
  };

  const remove = async (code: PromoCode) => {
    if (!confirm(`Delete promo code ${code.code}? This cannot be undone.`)) return;
    const key = localStorage.getItem("admin-key");
    await fetch(`/api/promo/${code.id}`, {
      method: "DELETE",
      headers: { "x-admin-key": key || "" },
    });
    fetchCodes();
  };

  const formatDiscount = (c: PromoCode) =>
    c.discount_type === "percent"
      ? `${c.discount_value}% OFF`
      : `${new Intl.NumberFormat("en-ET").format(c.discount_value)} ETB OFF`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Promo Codes</h2>
          <p className="text-gray-500">Create discount codes for bookings and subscriptions</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-5 py-2.5 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {showForm ? "Cancel" : "+ New Code"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Create Promo Code</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input
                type="text"
                value={newCode.code}
                onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                placeholder="LAUNCH2026"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm uppercase tracking-wider"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
              <select
                value={newCode.discount_type}
                onChange={(e) => setNewCode({ ...newCode, discount_type: e.target.value as "amount" | "percent" })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
              >
                <option value="amount">Fixed Amount (ETB)</option>
                <option value="percent">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Value * ({newCode.discount_type === "percent" ? "%" : "ETB"})
              </label>
              <input
                type="number"
                value={newCode.discount_value}
                onChange={(e) => setNewCode({ ...newCode, discount_value: e.target.value })}
                placeholder={newCode.discount_type === "percent" ? "10" : "500"}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applies To *</label>
              <select
                value={newCode.applies_to}
                onChange={(e) => setNewCode({ ...newCode, applies_to: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
              >
                {Object.entries(appliesLabels).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses (optional)</label>
              <input
                type="number"
                value={newCode.max_uses}
                onChange={(e) => setNewCode({ ...newCode, max_uses: e.target.value })}
                placeholder="100"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires (optional)</label>
              <input
                type="date"
                value={newCode.expires_at}
                onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (internal)</label>
              <input
                type="text"
                value={newCode.description}
                onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                placeholder="Why does this code exist?"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          <div className="flex gap-3 mt-5">
            <button
              onClick={create}
              disabled={creating}
              className="px-6 py-2 bg-primary hover:bg-primary-light disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {creating ? "Creating..." : "Create Code"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-12">Loading promo codes...</p>
      ) : codes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-gray-400">No promo codes yet. Create one to start running discounts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map((c) => {
            const expired = c.expires_at && new Date(c.expires_at) < new Date();
            const exhausted = c.max_uses && c.uses_count >= c.max_uses;
            return (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{c.code}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        {formatDiscount(c)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {appliesLabels[c.applies_to]}
                      </span>
                      {!c.active && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">Inactive</span>
                      )}
                      {expired && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Expired</span>
                      )}
                      {exhausted && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Used up</span>
                      )}
                    </div>
                    {c.description && <p className="text-sm text-gray-500">{c.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {c.uses_count} {c.max_uses ? `of ${c.max_uses} uses` : "uses"}
                      {c.expires_at && ` · expires ${new Date(c.expires_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggle(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        c.active
                          ? "bg-amber-100 hover:bg-amber-200 text-amber-800"
                          : "bg-green-100 hover:bg-green-200 text-green-800"
                      }`}
                    >
                      {c.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => remove(c)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
