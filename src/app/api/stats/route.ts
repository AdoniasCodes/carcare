import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-admin-key");
    const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
    if (authHeader !== adminKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const today = new Date().toISOString().split("T")[0];
    const monthStart = today.substring(0, 7) + "-01";

    // Today's bookings
    const todayCount = db.prepare(
      "SELECT COUNT(*) as count FROM bookings WHERE date(preferred_date) = date(?)"
    ).get(today) as { count: number };

    // Pending bookings
    const pendingCount = db.prepare(
      "SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'"
    ).get() as { count: number };

    // This month's revenue
    const monthRevenue = db.prepare(
      "SELECT COALESCE(SUM(revenue), 0) as total FROM bookings WHERE status = 'completed' AND created_at >= ?"
    ).get(monthStart) as { total: number };

    // This month's cost
    const monthCost = db.prepare(
      "SELECT COALESCE(SUM(cost), 0) as total FROM bookings WHERE status = 'completed' AND created_at >= ?"
    ).get(monthStart) as { total: number };

    // Total bookings
    const totalCount = db.prepare(
      "SELECT COUNT(*) as count FROM bookings"
    ).get() as { count: number };

    // Bookings per day (last 14 days)
    const dailyBookings = db.prepare(`
      SELECT date(preferred_date) as date, COUNT(*) as count
      FROM bookings
      WHERE preferred_date >= date('now', '-14 days')
      GROUP BY date(preferred_date)
      ORDER BY date ASC
    `).all() as { date: string; count: number }[];

    // Revenue per week (last 8 weeks)
    const weeklyRevenue = db.prepare(`
      SELECT strftime('%Y-W%W', created_at) as week,
             COALESCE(SUM(revenue), 0) as revenue,
             COALESCE(SUM(cost), 0) as cost
      FROM bookings
      WHERE status = 'completed'
        AND created_at >= date('now', '-56 days')
      GROUP BY week
      ORDER BY week ASC
    `).all() as { week: string; revenue: number; cost: number }[];

    return NextResponse.json({
      todayBookings: todayCount.count,
      pendingBookings: pendingCount.count,
      monthRevenue: monthRevenue.total,
      monthProfit: monthRevenue.total - monthCost.total,
      totalBookings: totalCount.count,
      dailyBookings,
      weeklyRevenue,
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
