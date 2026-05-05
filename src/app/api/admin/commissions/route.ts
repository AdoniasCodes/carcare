import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

function checkAuth(req: NextRequest) {
  const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
  return req.headers.get("x-admin-key") === adminKey;
}

// GET — aggregate commissions per mechanic for a period.
// query: ?from=YYYY-MM-DD&to=YYYY-MM-DD (defaults to current month)
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const today = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const todayStr = today.toISOString().split("T")[0];

  const from = searchParams.get("from") || monthStart;
  const to = searchParams.get("to") || todayStr;

  const fromIso = new Date(from + "T00:00:00").toISOString();
  const toIso = new Date(to + "T23:59:59").toISOString();

  const [{ data: mechanics }, { data: jobs }] = await Promise.all([
    supabase.from("mechanics").select("id, full_name, phone, commission_rate, active"),
    supabase
      .from("bookings")
      .select("id, assigned_mechanic_id, revenue, cash_collected, completed_at, status, payment_method")
      .eq("status", "completed")
      .gte("completed_at", fromIso)
      .lte("completed_at", toIso),
  ]);

  const byMech: Record<string, { jobs: number; revenue: number; cash: number; pending: number }> = {};
  (jobs || []).forEach((j) => {
    if (!j.assigned_mechanic_id) return;
    const k = j.assigned_mechanic_id;
    if (!byMech[k]) byMech[k] = { jobs: 0, revenue: 0, cash: 0, pending: 0 };
    byMech[k].jobs++;
    byMech[k].revenue += j.revenue || 0;
    byMech[k].cash += j.cash_collected || 0;
    if (j.payment_method === "pending") byMech[k].pending++;
  });

  const rows = (mechanics || []).map((m) => {
    const stats = byMech[m.id] || { jobs: 0, revenue: 0, cash: 0, pending: 0 };
    return {
      mechanic_id: m.id,
      full_name: m.full_name,
      phone: m.phone,
      active: m.active,
      commission_rate: m.commission_rate,
      jobs: stats.jobs,
      revenue: stats.revenue,
      cash_collected: stats.cash,
      pending_payments: stats.pending,
      commission_amount: stats.revenue * m.commission_rate,
    };
  });

  return NextResponse.json({ from, to, rows });
}

// POST — record a payout
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { mechanic_id, period_start, period_end, total_jobs, total_revenue, commission_amount, notes } = body;

  if (!mechanic_id || !period_start || !period_end) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await supabase.from("commission_payouts").insert({
    mechanic_id,
    period_start,
    period_end,
    total_jobs: Number(total_jobs) || 0,
    total_revenue: Number(total_revenue) || 0,
    commission_amount: Number(commission_amount) || 0,
    status: "paid",
    paid_at: new Date().toISOString(),
    notes: notes || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
