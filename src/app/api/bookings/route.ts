import { NextRequest, NextResponse } from "next/server";
import { supabase, generateId } from "@/lib/db";

// POST — create a new booking (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, carMake, carModel, carYear, serviceType, preferredDate, location, description } = body;

    // Validate required fields
    if (!name?.trim() || !phone?.trim() || !carMake?.trim() || !carModel?.trim() || !carYear?.trim() || !serviceType || !preferredDate || !location?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate phone format
    const cleanPhone = phone.replace(/\s/g, "");
    if (!/^(\+251|0)9\d{8}$/.test(cleanPhone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    // Validate service type
    const validServices = ["preventative", "routine", "roadside", "other"];
    if (!validServices.includes(serviceType)) {
      return NextResponse.json({ error: "Invalid service type" }, { status: 400 });
    }

    const id = generateId();

    const { error } = await supabase.from("bookings").insert({
      id,
      name: name.trim(),
      phone: cleanPhone,
      car_make: carMake.trim(),
      car_model: carModel.trim(),
      car_year: carYear.trim(),
      service_type: serviceType,
      description: description?.trim() || null,
      location: location.trim(),
      preferred_date: preferredDate,
    });

    if (error) throw error;

    return NextResponse.json({ id, message: "Booking created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Failed to create booking:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

// GET — list bookings (for admin)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-admin-key");
    const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
    if (authHeader !== adminKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase.from("bookings").select("*");

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
