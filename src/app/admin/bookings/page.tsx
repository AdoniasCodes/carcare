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
  source: string | null;
  assigned_mechanic_id: string | null;
  cash_collected: number | null;
  payment_method: string | null;
  mechanic_notes: string | null;
  before_photos: string[] | null;
  after_photos: string[] | null;
}

interface Mechanic {
  id: string;
  full_name: string;
  active: boolean;
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
  preventative: "Preventative",
  routine: "Routine",
  roadside: "Roadside",
  other: "Other",
};

const sourceLabels: Record<string, string> = {
  website: "🌐 Web",
  phone: "📞 Phone",
  walk_in: "🚶 Walk-in",
};

function formatETB(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-ET").format(amount) + " ETB";
}

const FILTERS = ["all", "pending", "confirmed", "in_progress", "completed", "cancelled", "payment_pending"] as const;
type Filter = (typeof FILTERS)[number];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    status: "",
    revenue: "",
    cost: "",
    notes: "",
    assigned_mechanic_id: "",
    cash_collected: "",
    payment_method: "",
  });
  const [saving, setSaving] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const fetchAll = useCallback(() => {
    const key = localStorage.getItem("admin-key") || "";
    const statusParam = filter === "all" || filter === "payment_pending" ? "" : `?status=${filter}`;
    Promise.all([
      fetch(`/api/bookings${statusParam}`, { headers: { "x-admin-key": key } }).then((r) => r.json()),
      fetch("/api/admin/mechanics", { headers: { "x-admin-key": key } }).then((r) => r.json()),
    ])
      .then(([bk, mk]) => {
        if (Array.isArray(bk)) {
          let list = bk as Booking[];
          if (filter === "payment_pending") {
            list = list.filter(
              (b) =>
                b.status === "completed" &&
                (b.payment_method === "pending" ||
                  (b.revenue && (b.cash_collected ?? 0) < (b.revenue ?? 0)))
            );
          }
          setBookings(list);
        }
        if (Array.isArray(mk)) setMechanics(mk);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const mechanicMap = mechanics.reduce<Record<string, Mechanic>>((acc, m) => {
    acc[m.id] = m;
    return acc;
  }, {});

  const openEdit = (b: Booking) => {
    setSelected(b.id);
    setEditData({
      status: b.status,
      revenue: b.revenue?.toString() || "",
      cost: b.cost?.toString() || "",
      notes: b.notes || "",
      assigned_mechanic_id: b.assigned_mechanic_id || "",
      cash_collected: b.cash_collected?.toString() || "",
      payment_method: b.payment_method || "",
    });
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    const key = localStorage.getItem("admin-key") || "";
    try {
      const body: Record<string, unknown> = { status: editData.status };
      body.revenue = editData.revenue;
      body.cost = editData.cost;
      body.notes = editData.notes || null;
      body.assigned_mechanic_id = editData.assigned_mechanic_id || null;
      body.cash_collected = editData.cash_collected;
      body.payment_method = editData.payment_method || null;

      await fetch(`/api/bookings/${selected}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify(body),
      });
      setSelected(null);
      fetchAll();
    } finally {
      setSaving(false);
    }
  };

  const quickAssign = async (bookingId: string, mechanicId: string) => {
    const key = localStorage.getItem("admin-key") || "";
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ assigned_mechanic_id: mechanicId || null }),
    });
    fetchAll();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
          <p className="text-gray-500">Manage all jobs · assign mechanics · review photos</p>
        </div>
        <button
          onClick={() => setShowManual(true)}
          className="px-4 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg"
        >
          + New Booking
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f === "all"
              ? "All"
              : f === "payment_pending"
              ? "Payment Pending"
              : statusLabels[f] || f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Loading…</p>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-gray-400">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const mech = b.assigned_mechanic_id ? mechanicMap[b.assigned_mechanic_id] : null;
            const allPhotos = [...(b.before_photos || []), ...(b.after_photos || [])];
            return (
              <div key={b.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div
                  className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50"
                  onClick={() => (selected === b.id ? setSelected(null) : openEdit(b))}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">{b.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || "bg-gray-100 text-gray-600"}`}>
                          {statusLabels[b.status] || b.status}
                        </span>
                        {b.source && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                            {sourceLabels[b.source] || b.source}
                          </span>
                        )}
                        {mech && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800 font-medium">
                            🔧 {mech.full_name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {b.car_year} {b.car_make} {b.car_model} · {serviceLabels[b.service_type] || b.service_type}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {b.location} · {new Date(b.preferred_date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <a
                        href={`tel:${b.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-primary hover:text-primary-light text-sm font-medium"
                      >
                        📞 {b.phone}
                      </a>
                      {b.revenue !== null && (
                        <p className="text-sm font-medium text-green-600 mt-1">{formatETB(b.revenue)}</p>
                      )}
                      {b.cash_collected !== null && (
                        <p className="text-xs text-gray-500">Cash: {formatETB(b.cash_collected)}</p>
                      )}
                    </div>
                  </div>

                  {/* photo strip */}
                  {allPhotos.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
                      {allPhotos.slice(0, 8).map((u, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <a key={i} href={u} target="_blank" rel="noreferrer" className="shrink-0">
                          <img
                            src={u}
                            alt=""
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                        </a>
                      ))}
                      {allPhotos.length > 8 && (
                        <div className="shrink-0 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                          +{allPhotos.length - 8}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline assign */}
                  {b.status !== "completed" && b.status !== "cancelled" && (
                    <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs text-gray-500">Assign:</span>
                      <select
                        value={b.assigned_mechanic_id || ""}
                        onChange={(e) => quickAssign(b.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded border border-gray-200 bg-white"
                      >
                        <option value="">— unassigned —</option>
                        {mechanics.filter((m) => m.active).map((m) => (
                          <option key={m.id} value={m.id}>{m.full_name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {b.description && (
                    <p className="text-sm text-gray-500 mt-2 bg-gray-50 rounded-lg p-3">{b.description}</p>
                  )}
                  {b.mechanic_notes && (
                    <p className="text-sm text-purple-700 mt-2 bg-purple-50 rounded-lg p-3">
                      <span className="font-semibold">Mechanic notes:</span> {b.mechanic_notes}
                    </p>
                  )}
                </div>

                {selected === b.id && (
                  <div className="border-t bg-gray-50 p-4 sm:p-6">
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={editData.status}
                          onChange={(e) => setEditData((p) => ({ ...p, status: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                        >
                          {Object.entries(statusLabels).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mechanic</label>
                        <select
                          value={editData.assigned_mechanic_id}
                          onChange={(e) => setEditData((p) => ({ ...p, assigned_mechanic_id: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                        >
                          <option value="">— unassigned —</option>
                          {mechanics.map((m) => (
                            <option key={m.id} value={m.id}>{m.full_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Revenue (ETB)</label>
                        <input
                          type="number"
                          value={editData.revenue}
                          onChange={(e) => setEditData((p) => ({ ...p, revenue: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost (ETB)</label>
                        <input
                          type="number"
                          value={editData.cost}
                          onChange={(e) => setEditData((p) => ({ ...p, cost: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cash Collected</label>
                        <input
                          type="number"
                          value={editData.cash_collected}
                          onChange={(e) => setEditData((p) => ({ ...p, cash_collected: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <select
                          value={editData.payment_method}
                          onChange={(e) => setEditData((p) => ({ ...p, payment_method: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                        >
                          <option value="">—</option>
                          <option value="cash">Cash</option>
                          <option value="transfer">Transfer</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                        <input
                          type="text"
                          value={editData.notes}
                          onChange={(e) => setEditData((p) => ({ ...p, notes: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="px-6 py-2 bg-primary hover:bg-primary-light disabled:bg-gray-300 text-white text-sm font-medium rounded-lg"
                      >
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                      <button
                        onClick={() => setSelected(null)}
                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showManual && (
        <ManualBookingModal
          mechanics={mechanics}
          onClose={() => setShowManual(false)}
          onCreated={() => { setShowManual(false); fetchAll(); }}
        />
      )}
    </div>
  );
}

function ManualBookingModal({
  mechanics,
  onClose,
  onCreated,
}: {
  mechanics: Mechanic[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    car_make: "",
    car_model: "",
    car_year: "",
    service_type: "roadside",
    location: "",
    description: "",
    preferred_date: new Date().toISOString().split("T")[0],
    source: "phone",
    assigned_mechanic_id: "",
    revenue: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const key = localStorage.getItem("admin-key") || "";
      const res = await fetch("/api/admin/bookings/manual", {
        method: "POST",
        headers: { "x-admin-key": key, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[92vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">New Booking (manual entry)</h3>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Customer Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
            <Field label="Car Make" value={form.car_make} onChange={(v) => setForm({ ...form, car_make: v })} required />
            <Field label="Car Model" value={form.car_model} onChange={(v) => setForm({ ...form, car_model: v })} required />
            <Field label="Year" value={form.car_year} onChange={(v) => setForm({ ...form, car_year: v })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <select
                value={form.service_type}
                onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
              >
                <option value="roadside">Roadside</option>
                <option value="preventative">Preventative</option>
                <option value="routine">Routine</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={form.preferred_date}
                onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
              >
                <option value="phone">Phone</option>
                <option value="walk_in">Walk-in</option>
                <option value="website">Website</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign</label>
              <select
                value={form.assigned_mechanic_id}
                onChange={(e) => setForm({ ...form, assigned_mechanic_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
              >
                <option value="">— none —</option>
                {mechanics.filter((m) => m.active).map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>
          </div>
          <Field label="Revenue (optional, ETB)" value={form.revenue} onChange={(v) => setForm({ ...form, revenue: v })} type="number" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-primary hover:bg-primary-light disabled:bg-gray-300 text-white font-semibold rounded-lg"
            >
              {saving ? "Saving…" : "Create Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
      />
    </div>
  );
}
