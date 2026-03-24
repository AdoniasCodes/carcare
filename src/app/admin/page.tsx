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
}

function formatETB(amount: number): string {
  return new Intl.NumberFormat("en-ET").format(amount) + " ETB";
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = localStorage.getItem("admin-key");
    fetch("/api/stats", {
      headers: { "x-admin-key": key || "" },
    })
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
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
