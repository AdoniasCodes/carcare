import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getMechanicFromRequest } from "@/lib/mechanic-auth";

export async function POST(request: NextRequest) {
  const me = await getMechanicFromRequest(request);
  if (!me) return NextResponse.json({ ok: true });

  await supabase
    .from("mechanics")
    .update({ session_token: null, availability: "off" })
    .eq("id", me.id);

  return NextResponse.json({ ok: true });
}
