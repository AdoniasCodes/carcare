import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getMechanicFromRequest } from "@/lib/mechanic-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getMechanicFromRequest(request);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  // mechanic can read any unassigned job too (so they can decide to start it)
  if (data.assigned_mechanic_id && data.assigned_mechanic_id !== me.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(data);
}
