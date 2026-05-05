import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getMechanicFromRequest } from "@/lib/mechanic-auth";

export async function PATCH(request: NextRequest) {
  const me = await getMechanicFromRequest(request);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { availability } = await request.json();
  if (!["available", "busy", "off"].includes(availability)) {
    return NextResponse.json({ error: "Invalid availability" }, { status: 400 });
  }

  await supabase.from("mechanics").update({ availability }).eq("id", me.id);
  return NextResponse.json({ ok: true, availability });
}
