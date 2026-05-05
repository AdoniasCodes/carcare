"use client";

import { useEffect, useState } from "react";

interface Stats {
  todayBookings: number;
  pendingBookings: number;
  monthRevenue: number;
  monthProfit: number;
  totalBookings: number;
  dailyBookings: { date: string; count: number }[];
  weeklyRevenue: { week: string; revenue: number; cost: number }[];
  activeSubscriptions: number;
  pendingSubscriptions: number;
  subscriptionRevenue: number;
  subscriptionsByPlan: { silver: number; gold: number; platinum: number };
}

interface FieldMechanic {
  id: string;
  full_name: string;
  availability: "available" | "busy" | "off";
  activeJob: { id: string; name: string; location: string; service_type: string; started_at: string | null } | null;
}

interface PendingPayment {
  id: string;
  name: string;
  phone: string;
  revenue: number | null;
  cash_collected: number | null;
  payment_method: string | null;
  completed_at: string | null;
}

interface FieldActivity {
  field: FieldMechanic[];
  openJobs: number;
  pendingPayments: PendingPayment[];
}

function formatETB(amount: number): string {
  return new Intl.NumberFormat("en-ET").format(amount) + " ETB";
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [field, setField] = useState<FieldActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = localStorage.getItem("admin-key") || "";
    const headers = { "x-admin-key": key };
    const load = () => {
      Promise.all([
        fetch("/api/stats", { headers }).then((r) => r.json()),
        fetch("/api/admin/field-activity", { headers }).then((r) => r.json()),
      ])
        .then(([s, f]) => {
          setStats(s);
          if (f && !f.error) setField(f);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats || stats.todayBookings === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load dashboard</p>
          <p className="text-gray-400 text-sm">Database may not be configured for this environment.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Today's Bookings", value: stats.todayBookings.toString(), color: "bg-blue-50 text-blue-700" },
    { label: "Pending", value: stats.pendingBookings.toString(), color: "bg-amber-50 text-amber-700" },
    { label: "Monthly Revenue", value: formatETB(stats.monthRevenue), color: "bg-green-50 text-green-700" },
    { label: "Monthly Profit", value: formatETB(stats.monthProfit), color: "bg-purple-50 text-purple-700" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500">Overview of your business</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color.split(" ")[1]}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Field activity (live) */}
      {field && (
        <div className="grid lg:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Field Activity</h3>
              <span className="text-xs text-gray-400">live · refreshes every 30s</span>
            </div>
            {field.openJobs > 0 && (
              <div className="mb-3 px-3 py-2 bg-amber-50 text-amber-800 rounded-lg text-sm">
                ⚠ {field.openJobs} unassigned job{field.openJobs === 1 ? "" : "s"} waiting
              </div>
            )}
            {field.field.length === 0 ? (
              <p className="text-gray-400 text-sm">No active mechanics</p>
            ) : (
              <ul className="space-y-2">
                {field.field.map((m) => {
                  const dot =
                    m.availability === "available"
                      ? "bg-green-500"
                      : m.availability === "busy"
                      ? "bg-amber-500"
                      : "bg-gray-400";
                  return (
                    <li key={m.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <span className={`mt-1.5 inline-block w-2.5 h-2.5 rounded-full ${dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{m.full_name}</p>
                        {m.activeJob ? (
                          <p className="text-xs text-purple-700 truncate">
                            🔧 {m.activeJob.name} · {m.activeJob.location}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 capitalize">{m.availability}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Reminders</h3>
            {field.pendingPayments.length === 0 ? (
              <p className="text-gray-400 text-sm">All payments collected ✓</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {field.pendingPayments.map((p) => {
                  const owed = (p.revenue || 0) - (p.cash_collected || 0);
                  return (
                    <li key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.payment_method === "pending" ? "marked pending" : "no payment method"} ·
                          {p.completed_at ? ` ${new Date(p.completed_at).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        {owed > 0 && (
                          <p className="text-sm font-semibold text-red-600">{formatETB(owed)} owed</p>
                        )}
                        <a href={`tel:${p.phone}`} className="text-xs text-primary underline">
                          📞 {p.phone}
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Subscription summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Subscriptions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-700">{stats.activeSubscriptions ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pendingSubscriptions ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Revenue (paid)</p>
            <p className="text-2xl font-bold text-purple-700">{formatETB(stats.subscriptionRevenue ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">By Plan</p>
            <p className="text-sm text-gray-700">
              S {stats.subscriptionsByPlan?.silver ?? 0} · G {stats.subscriptionsByPlan?.gold ?? 0} · P {stats.subscriptionsByPlan?.platinum ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Daily bookings chart (simple bar visualization) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Bookings (Last 14 Days)</h3>
        {stats.dailyBookings.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No booking data yet</p>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {stats.dailyBookings.map((day, i) => {
              const maxCount = Math.max(...stats.dailyBookings.map((d) => d.count), 1);
              const height = (day.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{day.count}</span>
                  <div
                    className="w-full bg-primary/80 rounded-t-md min-h-[4px] transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-gray-400">
                    {new Date(day.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekly revenue */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Weekly Revenue</h3>
        {stats.weeklyRevenue.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No revenue data yet. Complete bookings and add revenue to see data here.</p>
        ) : (
          <div className="space-y-3">
            {stats.weeklyRevenue.map((week, i) => {
              const maxRev = Math.max(...stats.weeklyRevenue.map((w) => w.revenue), 1);
              const width = (week.revenue / maxRev) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{week.week}</span>
                    <span className="font-medium text-gray-900">{formatETB(week.revenue)}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
