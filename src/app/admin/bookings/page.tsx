"use client";

import { useEffect, useState, useCallback } from "react";

interface Booking {
  id: string;
  name: string;
  phone: string;
  car_make: string;
  car_model: string;
  car_year: string;
  service_type: string;
  description: string | null;
  location: string;
  preferred_date: string;
  status: string;
  revenue: number | null;
  cost: number | null;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const serviceLabels: Record<string, string> = {
  preventative: "Preventative Maintenance",
  routine: "Routine Maintenance",
  roadside: "Roadside Assistance",
  other: "Other",
};

function formatETB(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-ET").format(amount) + " ETB";
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [editData, setEditData] = useState({ status: "", revenue: "", cost: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const fetchBookings = useCallback(() => {
    const key = localStorage.getItem("admin-key");
    const url = filter === "all" ? "/api/bookings" : `/api/bookings?status=${filter}`;
    fetch(url, { headers: { "x-admin-key": key || "" } })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setBookings(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const openEdit = (booking: Booking) => {
    setSelected(booking.id);
    setEditData({
      status: booking.status,
      revenue: booking.revenue?.toString() || "",
      cost: booking.cost?.toString() || "",
      notes: booking.notes || "",
    });
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    const key = localStorage.getItem("admin-key");

    try {
      const body: Record<string, string | number | null> = { status: editData.status };
      if (editData.revenue) body.revenue = parseFloat(editData.revenue);
      if (editData.cost) body.cost = parseFloat(editData.cost);
      body.notes = editData.notes || null;

      await fetch(`/api/bookings/${selected}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": key || "",
        },
        body: JSON.stringify(body),
      });

      setSelected(null);
      fetchBookings();
    } catch (err) {
      console.error("Failed to update:", err);
    } finally {
      setSaving(false);
    }
  };

  const filters = ["all", "pending", "confirmed", "in_progress", "completed", "cancelled"];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
        <p className="text-gray-500">Manage all customer bookings</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f
                ? "bg-primary text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f === "all" ? "All" : statusLabels[f] || f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-gray-400">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Booking card */}
              <div
                className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() =>
                  selected === booking.id
                    ? setSelected(null)
                    : openEdit(booking)
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {booking.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[booking.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {statusLabels[booking.status] || booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {booking.car_year} {booking.car_make} {booking.car_model} &middot;{" "}
                      {serviceLabels[booking.service_type] || booking.service_type}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {booking.location} &middot; {new Date(booking.preferred_date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <a
                      href={`tel:${booking.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary-light text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {booking.phone}
                    </a>
                    {booking.revenue !== null && (
                      <p className="text-sm font-medium text-green-600 mt-1">
                        {formatETB(booking.revenue)}
                      </p>
                    )}
                  </div>
                </div>
                {booking.description && (
                  <p className="text-sm text-gray-500 mt-2 bg-gray-50 rounded-lg p-3">
                    {booking.description}
                  </p>
                )}
              </div>

              {/* Edit panel */}
              {selected === booking.id && (
                <div className="border-t bg-gray-50 p-4 sm:p-6">
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={editData.status}
                        onChange={(e) =>
                          setEditData((prev) => ({ ...prev, status: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Revenue (ETB)
                      </label>
                      <input
                        type="number"
                        value={editData.revenue}
                        onChange={(e) =>
                          setEditData((prev) => ({ ...prev, revenue: e.target.value }))
                        }
                        placeholder="Amount charged"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost (ETB)
                      </label>
                      <input
                        type="number"
                        value={editData.cost}
                        onChange={(e) =>
                          setEditData((prev) => ({ ...prev, cost: e.target.value }))
                        }
                        placeholder="Cost incurred"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Internal Notes
                      </label>
                      <input
                        type="text"
                        value={editData.notes}
                        onChange={(e) =>
                          setEditData((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        placeholder="Notes about this job"
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
        Click any booking to update status and add revenue/cost.
      </p>
    </div>
  );
}
