import { NextRequest, NextResponse } from "next/server";
import { supabase, generateSessionToken } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { phone, pin } = await request.json();
    if (!phone || !pin) {
      return NextResponse.json({ error: "Phone and PIN required" }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\s/g, "");

    const { data: mechanic, error } = await supabase
      .from("mechanics")
      .select("id, full_name, phone, pin, active")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (error || !mechanic) {
      return NextResponse.json({ error: "Invalid phone or PIN" }, { status: 401 });
    }

    if (!mechanic.active) {
      return NextResponse.json({ error: "Account disabled. Contact admin." }, { status: 403 });
    }

    if (String(mechanic.pin) !== String(pin)) {
      return NextResponse.json({ error: "Invalid phone or PIN" }, { status: 401 });
    }

    const token = generateSessionToken();
    await supabase
      .from("mechanics")
      .update({
        session_token: token,
        last_login_at: new Date().toISOString(),
        availability: "available",
      })
      .eq("id", mechanic.id);

    return NextResponse.json({
      token,
      mechanic: { id: mechanic.id, full_name: mechanic.full_name, phone: mechanic.phone },
    });
  } catch (err) {
    console.error("mechanic login failed:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
