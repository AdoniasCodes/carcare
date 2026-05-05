import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getMechanicFromRequest } from "@/lib/mechanic-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getMechanicFromRequest(request);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { cash_collected, payment_method, mechanic_notes, revenue } = body;

  const { data: existing } = await supabase
    .from("bookings")
    .select("id, assigned_mechanic_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (existing.assigned_mechanic_id !== me.id) {
    return NextResponse.json({ error: "Not your job" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {
    status: "completed",
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (cash_collected !== undefined && cash_collected !== "") {
    updates.cash_collected = Number(cash_collected) || 0;
    if (revenue === undefined || revenue === "" || revenue === null) {
      updates.revenue = Number(cash_collected) || 0;
    }
  }
  if (revenue !== undefined && revenue !== "" && revenue !== null) {
    updates.revenue = Number(revenue);
  }
  if (payment_method) updates.payment_method = payment_method;
  if (mechanic_notes !== undefined) updates.mechanic_notes = mechanic_notes;

  const { error } = await supabase.from("bookings").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Free up mechanic if no other in-progress jobs
  const { data: stillBusy } = await supabase
    .from("bookings")
    .select("id")
    .eq("assigned_mechanic_id", me.id)
    .eq("status", "in_progress")
    .limit(1);

  if (!stillBusy || stillBusy.length === 0) {
    await supabase.from("mechanics").update({ availability: "available" }).eq("id", me.id);
  }

  return NextResponse.json({ ok: true });
}
