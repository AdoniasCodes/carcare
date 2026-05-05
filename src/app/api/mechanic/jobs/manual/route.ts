import { NextRequest, NextResponse } from "next/server";
import { supabase, generateId } from "@/lib/db";
import { getMechanicFromRequest } from "@/lib/mechanic-auth";

// Mechanic logs a walk-in or phone-call booking on the spot and self-assigns.
export async function POST(request: NextRequest) {
  const me = await getMechanicFromRequest(request);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    source = "phone",
    start_now = true,
  } = body;

  if (!name?.trim() || !phone?.trim() || !car_make?.trim() || !car_model?.trim() || !location?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validServices = ["preventative", "routine", "roadside", "other"];
  const svc = validServices.includes(service_type) ? service_type : "other";

  const id = generateId();
  const now = new Date().toISOString();
  const today = now.split("T")[0];

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
    preferred_date: today,
    status: start_now ? "in_progress" : "confirmed",
    source: source === "walk_in" ? "walk_in" : "phone",
    assigned_mechanic_id: me.id,
    started_at: start_now ? now : null,
  });

  if (error) {
    console.error("manual booking create failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (start_now) {
    await supabase.from("mechanics").update({ availability: "busy" }).eq("id", me.id);
  }

  return NextResponse.json({ id }, { status: 201 });
}
