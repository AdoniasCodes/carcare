import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getMechanicFromRequest } from "@/lib/mechanic-auth";

export async function GET(request: NextRequest) {
  const me = await getMechanicFromRequest(request);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todayJobs } = await supabase
    .from("bookings")
    .select("id, revenue, cash_collected, status, completed_at")
    .eq("assigned_mechanic_id", me.id)
    .gte("completed_at", todayStart.toISOString())
    .eq("status", "completed");

  const jobsDone = todayJobs?.length || 0;
  const cashCollected = (todayJobs || []).reduce((s, j) => s + (j.cash_collected || 0), 0);
  const revenue = (todayJobs || []).reduce((s, j) => s + (j.revenue || j.cash_collected || 0), 0);
  const estCommission = revenue * (me.commission_rate || 0);

  return NextResponse.json({
    mechanic: me,
    today: { jobsDone, cashCollected, revenue, estCommission },
  });
}
