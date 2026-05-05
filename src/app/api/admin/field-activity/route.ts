import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

function checkAuth(req: NextRequest) {
  const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
  return req.headers.get("x-admin-key") === adminKey;
}

// Live snapshot for the admin dashboard:
// - mechanics + their availability + active job (if any)
// - count of unassigned pending/confirmed jobs
// - completed-but-payment-pending jobs (reminder list)
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: mechanics }, { data: activeJobs }, { count: openCount }, { data: pendingPayments }] =
    await Promise.all([
      supabase
        .from("mechanics")
        .select("id, full_name, availability, active, last_login_at")
        .eq("active", true)
        .order("full_name", { ascending: true }),
      supabase
        .from("bookings")
        .select("id, name, location, assigned_mechanic_id, started_at, service_type")
        .eq("status", "in_progress"),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .is("assigned_mechanic_id", null)
        .in("status", ["pending", "confirmed"]),
      supabase
        .from("bookings")
        .select("id, name, phone, revenue, cash_collected, payment_method, completed_at, assigned_mechanic_id")
        .eq("status", "completed")
        .or("payment_method.eq.pending,payment_method.is.null")
        .order("completed_at", { ascending: false })
        .limit(20),
    ]);

  type ActiveJob = NonNullable<typeof activeJobs>[number];
  const activeByMech: Record<string, ActiveJob> = {};
  (activeJobs || []).forEach((j) => {
    if (j.assigned_mechanic_id) activeByMech[j.assigned_mechanic_id] = j;
  });

  const field = (mechanics || []).map((m) => ({
    ...m,
    activeJob: activeByMech[m.id] || null,
  }));

  return NextResponse.json({
    field,
    openJobs: openCount || 0,
    pendingPayments: pendingPayments || [],
  });
}
