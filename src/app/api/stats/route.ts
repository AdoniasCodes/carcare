import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-admin-key");
    const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
    if (authHeader !== adminKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];
    const monthStart = today.substring(0, 7) + "-01";
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString();

    // Today's bookings
    const { count: todayCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("preferred_date", today);

    // Pending bookings
    const { count: pendingCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // This month's completed bookings (for revenue/cost)
    const { data: monthData } = await supabase
      .from("bookings")
      .select("revenue, cost")
      .eq("status", "completed")
      .gte("created_at", monthStart);

    const monthRevenue = (monthData || []).reduce((sum, b) => sum + (b.revenue || 0), 0);
    const monthCost = (monthData || []).reduce((sum, b) => sum + (b.cost || 0), 0);

    // Total bookings
    const { count: totalCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true });

    // Bookings per day (last 14 days)
    const { data: recentBookings } = await supabase
      .from("bookings")
      .select("preferred_date")
      .gte("preferred_date", fourteenDaysAgo);

    const dailyMap: Record<string, number> = {};
    (recentBookings || []).forEach((b) => {
      const date = b.preferred_date;
      dailyMap[date] = (dailyMap[date] || 0) + 1;
    });
    const dailyBookings = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Weekly revenue (last 8 weeks)
    const { data: weeklyData } = await supabase
      .from("bookings")
      .select("created_at, revenue, cost")
      .eq("status", "completed")
      .gte("created_at", eightWeeksAgo);

    const weeklyMap: Record<string, { revenue: number; cost: number }> = {};
    (weeklyData || []).forEach((b) => {
      const d = new Date(b.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const week = weekStart.toISOString().split("T")[0];
      if (!weeklyMap[week]) weeklyMap[week] = { revenue: 0, cost: 0 };
      weeklyMap[week].revenue += b.revenue || 0;
      weeklyMap[week].cost += b.cost || 0;
    });
    const weeklyRevenue = Object.entries(weeklyMap)
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week));

    return NextResponse.json({
      todayBookings: todayCount || 0,
      pendingBookings: pendingCount || 0,
      monthRevenue,
      monthProfit: monthRevenue - monthCost,
      totalBookings: totalCount || 0,
      dailyBookings,
      weeklyRevenue,
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
