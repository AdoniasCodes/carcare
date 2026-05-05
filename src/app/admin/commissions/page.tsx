"use client";

import { useCallback, useEffect, useState } from "react";

interface Row {
  mechanic_id: string;
  full_name: string;
  phone: string;
  active: boolean;
  commission_rate: number;
  jobs: number;
  revenue: number;
  cash_collected: number;
  pending_payments: number;
  commission_amount: number;
}

interface Payout {
  id: number;
  mechanic_id: string;
  period_start: string;
  period_end: string;
  total_jobs: number;
  total_revenue: number;
  commission_amount: number;
  status: string;
  paid_at: string;
  notes: string | null;
  mechanics: { full_name: string } | null;
}

function fmtETB(n: number) {
  return new Intl.NumberFormat("en-ET").format(Math.round(n)) + " ETB";
}

function getThisMonth() {
  const t = new Date();
  return {
    from: `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-01`,
    to: t.toISOString().split("T")[0],
  };
}

function getThisWeek() {
  const t = new Date();
  const day = t.getDay();
  const monday = new Date(t);
  monday.setDate(t.getDate() - ((day + 6) % 7));
  return {
    from: monday.toISOString().split("T")[0],
    to: t.toISOString().split("T")[0],
  };
}

export default function CommissionsPage() {
  const [period, setPeriod] = useState(getThisMonth());
  const [rows, setRows] = useState<Row[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const key = localStorage.getItem("admin-key") || "";
    const [r1, r2] = await Promise.all([
      fetch(`/api/admin/commissions?from=${period.from}&to=${period.to}`, {
        headers: { "x-admin-key": key },
      }).then((r) => r.json()),
      fetch("/api/admin/commissions/payouts", { headers: { "x-admin-key": key } }).then((r) => r.json()),
    ]);
    if (r1?.rows) setRows(r1.rows);
    if (Array.isArray(r2)) setPayouts(r2);
    setLoading(false);
  }, [period.from, period.to]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const recordPayout = async (row: Row) => {
    if (row.commission_amount <= 0) {
      alert("No commission to record.");
      return;
    }
    if (!confirm(`Record ${fmtETB(row.commission_amount)} payout to ${row.full_name}?`)) return;

    const key = localStorage.getItem("admin-key") || "";
    const res = await fetch("/api/admin/commissions", {
      method: "POST",
      headers: { "x-admin-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        mechanic_id: row.mechanic_id,
        period_start: period.from,
        period_end: period.to,
        total_jobs: row.jobs,
        total_revenue: row.revenue,
        commission_amount: row.commission_amount,
      }),
    });
    if (res.ok) fetchAll();
    else alert("Failed");
  };

  const totalCommission = rows.reduce((s, r) => s + r.commission_amount, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalJobs = rows.reduce((s, r) => s + r.jobs, 0);
  const totalPending = rows.reduce((s, r) => s + r.pending_payments, 0);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Commissions</h2>
        <p className="text-gray-500">Per-mechanic earnings · pending payments · payout history</p>
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod(getThisWeek())}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg"
            >
              This Week
            </button>
            <button
              onClick={() => setPeriod(getThisMonth())}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-lg"
            >
              This Month
            </button>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={period.from}
              onChange={(e) => setPeriod({ ...period, from: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={period.to}
              onChange={(e) => setPeriod({ ...period, to: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Jobs" value={String(totalJobs)} />
        <Stat label="Revenue" value={fmtETB(totalRevenue)} />
        <Stat label="Commissions" value={fmtETB(totalCommission)} />
        <Stat label="Pending Payments" value={String(totalPending)} accent={totalPending > 0 ? "amber" : "gray"} />
      </div>

      {/* Per-mechanic */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold">Per-mechanic ({period.from} → {period.to})</h3>
        </div>
        {loading ? (
          <p className="text-gray-400 p-6 text-center">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-gray-400 p-6 text-center">No mechanics</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2">Mechanic</th>
                  <th className="text-right px-4 py-2">Jobs</th>
                  <th className="text-right px-4 py-2">Revenue</th>
                  <th className="text-right px-4 py-2">Cash</th>
                  <th className="text-right px-4 py-2">Rate</th>
                  <th className="text-right px-4 py-2">Commission</th>
                  <th className="text-right px-4 py-2">Pending</th>
                  <th className="text-right px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.mechanic_id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.full_name}</div>
                      <div className="text-xs text-gray-500">{r.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{r.jobs}</td>
                    <td className="px-4 py-3 text-right">{fmtETB(r.revenue)}</td>
                    <td className="px-4 py-3 text-right">{fmtETB(r.cash_collected)}</td>
                    <td className="px-4 py-3 text-right">{Math.round(r.commission_rate * 100)}%</td>
                    <td className="px-4 py-3 text-right font-semibold text-purple-700">
                      {fmtETB(r.commission_amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.pending_payments > 0 ? (
                        <span className="text-amber-700">{r.pending_payments}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => recordPayout(r)}
                        disabled={r.commission_amount <= 0}
                        className="px-3 py-1.5 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 text-green-800 text-xs font-medium rounded-lg"
                      >
                        Record Payout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout history */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold">Payout History</h3>
        </div>
        {payouts.length === 0 ? (
          <p className="text-gray-400 p-6 text-center">No payouts yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2">Mechanic</th>
                  <th className="text-left px-4 py-2">Period</th>
                  <th className="text-right px-4 py-2">Jobs</th>
                  <th className="text-right px-4 py-2">Revenue</th>
                  <th className="text-right px-4 py-2">Commission</th>
                  <th className="text-left px-4 py-2">Paid At</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3">{p.mechanics?.full_name || "—"}</td>
                    <td className="px-4 py-3">{p.period_start} → {p.period_end}</td>
                    <td className="px-4 py-3 text-right">{p.total_jobs}</td>
                    <td className="px-4 py-3 text-right">{fmtETB(p.total_revenue)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-purple-700">
                      {fmtETB(p.commission_amount)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.paid_at ? new Date(p.paid_at).toLocaleString() : "—"}
                    </td>
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

function Stat({ label, value, accent = "gray" }: { label: string; value: string; accent?: string }) {
  const colors: Record<string, string> = {
    gray: "text-gray-900",
    amber: "text-amber-700",
  };
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colors[accent] || colors.gray}`}>{value}</p>
    </div>
  );
}
