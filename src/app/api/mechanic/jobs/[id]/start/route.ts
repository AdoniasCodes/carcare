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

  const { data: existing } = await supabase
    .from("bookings")
    .select("id, status, assigned_mechanic_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (existing.assigned_mechanic_id && existing.assigned_mechanic_id !== me.id) {
    return NextResponse.json({ error: "Job already assigned to another mechanic" }, { status: 403 });
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "in_progress",
      assigned_mechanic_id: me.id,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("mechanics").update({ availability: "busy" }).eq("id", me.id);

  return NextResponse.json({ ok: true });
}
