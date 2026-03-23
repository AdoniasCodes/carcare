import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

// PATCH — update a booking (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("x-admin-key");
    const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
    if (authHeader !== adminKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, revenue, cost, notes } = body;

    const db = getDb();

    // Check booking exists
    const existing = db.prepare("SELECT id FROM bookings WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Validate status if provided
    const validStatuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Build update dynamically
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (status !== undefined) { updates.push("status = ?"); values.push(status); }
    if (revenue !== undefined) { updates.push("revenue = ?"); values.push(revenue); }
    if (cost !== undefined) { updates.push("cost = ?"); values.push(cost); }
    if (notes !== undefined) { updates.push("notes = ?"); values.push(notes); }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE bookings SET ${updates.join(", ")} WHERE id = ?`).run(...values);

    const updated = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
