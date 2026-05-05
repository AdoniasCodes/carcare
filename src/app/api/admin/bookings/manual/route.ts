import { NextRequest, NextResponse } from "next/server";
import { supabase, generateId } from "@/lib/db";

// Admin-side manual booking creation (e.g. for phone-call customers).
export async function POST(request: NextRequest) {
  const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
  if (request.headers.get("x-admin-key") !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    phone,
    car_make,
    car_model,
    car_year,
    service_type,
    location,
    description,
    preferred_date,
    source = "phone",
    assigned_mechanic_id,
    revenue,
  } = body;

  if (!name?.trim() || !phone?.trim() || !car_make?.trim() || !car_model?.trim() || !location?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validServices = ["preventative", "routine", "roadside", "other"];
  const svc = validServices.includes(service_type) ? service_type : "other";
  const validSources = ["phone", "walk_in", "website"];
  const src = validSources.includes(source) ? source : "phone";

  const id = generateId();
  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase.from("bookings").insert({
    id,
    name: String(name).trim(),
    phone: String(phone).replace(/\s/g, ""),
    car_make: String(car_make).trim(),
    car_model: String(car_model).trim(),
    car_year: String(car_year || "").trim() || "—",
    service_type: svc,
    description: description?.trim() || null,
    location: String(location).trim(),
    preferred_date: preferred_date || today,
    status: assigned_mechanic_id ? "confirmed" : "pending",
    source: src,
    assigned_mechanic_id: assigned_mechanic_id || null,
    revenue: revenue === undefined || revenue === "" ? null : Number(revenue),
  });

  if (error) {
    console.error("admin manual booking failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id }, { status: 201 });
}
