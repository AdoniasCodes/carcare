import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

function checkAuth(req: NextRequest) {
  const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
  return req.headers.get("x-admin-key") === adminKey;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.full_name !== undefined) updates.full_name = String(body.full_name).trim();
  if (body.phone !== undefined) {
    const cleanPhone = String(body.phone).replace(/\s/g, "");
    if (!/^(\+251|0)9\d{8}$/.test(cleanPhone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }
    updates.phone = cleanPhone;
  }
  if (body.pin !== undefined) {
    if (!/^\d{4,6}$/.test(String(body.pin))) {
      return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 });
    }
    updates.pin = String(body.pin);
  }
  if (body.commission_rate !== undefined && body.commission_rate !== "") {
    updates.commission_rate = Number(body.commission_rate);
  }
  if (body.active !== undefined) {
    updates.active = !!body.active;
    if (!body.active) updates.session_token = null;
  }
  if (body.availability !== undefined) updates.availability = body.availability;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase.from("mechanics").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { error } = await supabase.from("mechanics").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
