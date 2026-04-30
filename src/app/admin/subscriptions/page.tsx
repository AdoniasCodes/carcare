"use client";

import { useEffect, useState, useCallback } from "react";

interface Subscription {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  car_make: string;
  car_model: string;
  car_year: string;
  plate_number: string | null;
  plan: "silver" | "gold" | "platinum";
  price: number;
  location: string;
  notes: string | null;
  status: string;
  payment_status: string;
  start_date: string | null;
  end_date: string | null;
  internal_notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  expired: "bg-gray-200 text-gray-700",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
};

const paymentColors: Record<string, string> = {
  unpaid: "bg-red-50 text-red-700 border-red-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  refunded: "bg-gray-100 text-gray-700 border-gray-200",
};

const planColors: Record<string, string> = {
  silver: "bg-slate-100 text-slate-700 border-slate-200",
  gold: "bg-amber-50 text-amber-700 border-amber-200",
  platinum: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

function formatETB(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-ET").format(amount) + " ETB";
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [editData, setEditData] = useState({ status: "", payment_status: "", start_date: "", end_date: "", internal_notes: "" });
  const [saving, setSaving] = useState(false);

  const fetchSubs = useCallback(() => {
    const key = localStorage.getItem("admin-key");
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (planFilter !== "all") params.set("plan", planFilter);
    const url = "/api/subscriptions" + (params.toString() ? `?${params}` : "");
    fetch(url, { headers: { "x-admin-key": key || "" } })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSubs(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter, planFilter]);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  const openEdit = (sub: Subscription) => {
    setSelected(sub.id);
    setEditData({
      status: sub.status,
      payment_status: sub.payment_status,
      start_date: sub.start_date || "",
      end_date: sub.end_date || "",
      internal_notes: sub.internal_notes || "",
    });
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    const key = localStorage.getItem("admin-key");

    try {
      const body: Record<string, string | null> = {
        status: editData.status,
        payment_status: editData.payment_status,
      };
      body.start_date = editData.start_date || null;
      body.end_date = editData.end_date || null;
      body.internal_notes = editData.internal_notes || null;

      await fetch(`/api/subscriptions/${selected}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": key || "" },
        body: JSON.stringify(body),
      });

      setSelected(null);
      fetchSubs();
    } catch (err) {
      console.error("Failed to update:", err);
    } finally {
      setSaving(false);
    }
  };

  const filters = ["all", "pending", "active", "expired", "cancelled"];
  const planFilters = ["all", "silver", "gold", "platinum"];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Subscriptions</h2>
        <p className="text-gray-500">Yearly preventive roadside assistance plans</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-3">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f === "all" ? "All status" : statusLabels[f] || f}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {planFilters.map((f) => (
          <button
            key={f}
            onClick={() => { setPlanFilter(f); setLoading(true); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              planFilter === f ? "bg-accent text-white" : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {f === "all" ? "All plans" : f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Loading subscriptions...</p>
      ) : subs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-gray-400">No subscriptions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map((sub) => (
            <div key={sub.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div
                className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => (selected === sub.id ? setSelected(null) : openEdit(sub))}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">{sub.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${planColors[sub.plan]}`}>
                        {sub.plan}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[sub.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusLabels[sub.status] || sub.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${paymentColors[sub.payment_status]}`}>
                        {sub.payment_status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {sub.car_year} {sub.car_make} {sub.car_model}
                      {sub.plate_number ? ` · ${sub.plate_number}` : ""}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {sub.location}
                      {sub.start_date && sub.end_date ? ` · ${sub.start_date} → ${sub.end_date}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <a
                      href={`tel:${sub.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary-light text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {sub.phone}
                    </a>
                    <p className="text-sm font-medium text-green-600 mt-1">{formatETB(sub.price)}</p>
                  </div>
                </div>
              </div>

              {selected === sub.id && (
                <div className="border-t bg-gray-50 p-4 sm:p-6">
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                      <select
                        value={editData.payment_status}
                        onChange={(e) => setEditData((prev) => ({ ...prev, payment_status: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm capitalize"
                      >
                        {["unpaid", "paid", "partial", "refunded"].map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={editData.start_date}
                        onChange={(e) => setEditData((prev) => ({ ...prev, start_date: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={editData.end_date}
                        onChange={(e) => setEditData((prev) => ({ ...prev, end_date: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                      <input
                        type="text"
                        value={editData.internal_notes}
                        onChange={(e) => setEditData((prev) => ({ ...prev, internal_notes: e.target.value }))}
                        placeholder="Internal notes"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="px-6 py-2 bg-primary hover:bg-primary-light disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => setSelected(null)}
                      className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-sm text-gray-400 mt-6">
        Click any subscription to update status, payment, or dates.
      </p>
    </div>
  );
}
