import { NextRequest, NextResponse } from "next/server";
import getDb, { generateId } from "@/lib/db";

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

    const db = getDb();
    const id = generateId();

    db.prepare(`
      INSERT INTO bookings (id, name, phone, car_make, car_model, car_year, service_type, description, location, preferred_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), cleanPhone, carMake.trim(), carModel.trim(), carYear.trim(), serviceType, description?.trim() || null, location.trim(), preferredDate);

    return NextResponse.json({ id, message: "Booking created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Failed to create booking:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

// GET — list bookings (for admin)
export async function GET(request: NextRequest) {
  try {
    // Simple auth check via header
    const authHeader = request.headers.get("x-admin-key");
    const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
    if (authHeader !== adminKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = "SELECT * FROM bookings";
    const params: string[] = [];

    if (status && status !== "all") {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC";

    const bookings = db.prepare(query).all(...params);
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
