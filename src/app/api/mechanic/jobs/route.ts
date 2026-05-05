import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getMechanicFromRequest } from "@/lib/mechanic-auth";

// GET — jobs visible to this mechanic.
// Returns: active (in_progress assigned to me), assigned (pending/confirmed assigned to me),
// open (pending unassigned — so mechanics can self-pick if admin hasn't assigned).
export async function GET(request: NextRequest) {
  const me = await getMechanicFromRequest(request);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: mine } = await supabase
    .from("bookings")
    .select("*")
    .eq("assigned_mechanic_id", me.id)
    .in("status", ["pending", "confirmed", "in_progress"])
    .order("preferred_date", { ascending: true });

  const { data: open } = await supabase
    .from("bookings")
    .select("*")
    .is("assigned_mechanic_id", null)
    .in("status", ["pending", "confirmed"])
    .order("preferred_date", { ascending: true })
    .limit(20);

  const active = (mine || []).filter((b) => b.status === "in_progress");
  const assigned = (mine || []).filter((b) => b.status !== "in_progress");

  return NextResponse.json({ active, assigned, open: open || [] });
}
