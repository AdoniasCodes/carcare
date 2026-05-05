import { NextRequest, NextResponse } from "next/server";
import { supabase, generateMechanicId } from "@/lib/db";

function checkAuth(req: NextRequest) {
  const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
  return req.headers.get("x-admin-key") === adminKey;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("mechanics")
    .select("id, full_name, phone, pin, active, availability, commission_rate, last_login_at, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { full_name, phone, pin, commission_rate } = body;

  if (!full_name?.trim() || !phone?.trim() || !pin?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const cleanPhone = String(phone).replace(/\s/g, "");
  if (!/^(\+251|0)9\d{8}$/.test(cleanPhone)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }
  if (!/^\d{4,6}$/.test(String(pin))) {
    return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 });
  }

  const id = generateMechanicId();
  const rate = commission_rate !== undefined && commission_rate !== "" ? Number(commission_rate) : 0.10;

  const { error } = await supabase.from("mechanics").insert({
    id,
    full_name: full_name.trim(),
    phone: cleanPhone,
    pin: String(pin),
    commission_rate: rate,
    active: true,
    availability: "off",
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Phone already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id }, { status: 201 });
}
