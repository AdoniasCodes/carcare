"use client";

import { useCallback, useEffect, useState } from "react";

interface Mechanic {
  id: string;
  full_name: string;
  phone: string;
  pin: string;
  active: boolean;
  availability: "available" | "busy" | "off";
  commission_rate: number;
  last_login_at: string | null;
  created_at: string;
}

const availColors: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  busy: "bg-amber-100 text-amber-800",
  off: "bg-gray-200 text-gray-700",
};

export default function AdminMechanicsPage() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Mechanic | null>(null);

  const fetchAll = useCallback(async () => {
    const key = localStorage.getItem("admin-key") || "";
    const res = await fetch("/api/admin/mechanics", { headers: { "x-admin-key": key } });
    const data = await res.json();
    if (Array.isArray(data)) setMechanics(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchAll();
  };

  const toggleActive = async (m: Mechanic) => {
    const key = localStorage.getItem("admin-key") || "";
    await fetch(`/api/admin/mechanics/${m.id}`, {
      method: "PATCH",
      headers: { "x-admin-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ active: !m.active }),
    });
    fetchAll();
  };

  const remove = async (m: Mechanic) => {
    if (!confirm(`Delete ${m.full_name}? This will detach them from all bookings.`)) return;
    const key = localStorage.getItem("admin-key") || "";
    await fetch(`/api/admin/mechanics/${m.id}`, {
      method: "DELETE",
      headers: { "x-admin-key": key },
    });
    fetchAll();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mechanics</h2>
          <p className="text-gray-500">Manage field mechanic accounts</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg"
        >
          + Add Mechanic
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Loading…</p>
      ) : mechanics.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-gray-400">No mechanics yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mechanics.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{m.full_name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${availColors[m.availability]}`}
                    >
                      {m.availability}
                    </span>
                    {!m.active && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">
                        disabled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    📞 {m.phone} · PIN {m.pin} · Commission {Math.round(m.commission_rate * 100)}%
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {m.last_login_at ? `Last login ${new Date(m.last_login_at).toLocaleString()}` : "Never logged in"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setEditing(m); setShowForm(true); }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(m)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                      m.active
                        ? "bg-amber-100 hover:bg-amber-200 text-amber-800"
                        : "bg-green-100 hover:bg-green-200 text-green-800"
                    }`}
                  >
                    {m.active ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => remove(m)}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <MechanicForm
          mechanic={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

function MechanicForm({
  mechanic,
  onClose,
  onSaved,
}: {
  mechanic: Mechanic | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    full_name: mechanic?.full_name || "",
    phone: mechanic?.phone || "",
    pin: mechanic?.pin || "",
    commission_rate: mechanic ? String(mechanic.commission_rate) : "0.10",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const key = localStorage.getItem("admin-key") || "";
      const url = mechanic ? `/api/admin/mechanics/${mechanic.id}` : "/api/admin/mechanics";
      const method = mechanic ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "x-admin-key": key, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold mb-4">{mechanic ? "Edit Mechanic" : "Add Mechanic"}</h3>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (09…)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4-6 digits)</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.pin}
              onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })}
              maxLength={6}
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commission rate (0.10 = 10%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={form.commission_rate}
              onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200"
            />
          </div>
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
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
