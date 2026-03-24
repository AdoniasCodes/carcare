import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

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

    // Check booking exists
    const { data: existing } = await supabase.from("bookings").select("id").eq("id", id).single();
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Validate status if provided
    const validStatuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Build update object
    const updates: Record<string, string | number | null> = {};
    if (status !== undefined) updates.status = status;
    if (revenue !== undefined) updates.revenue = revenue;
    if (cost !== undefined) updates.cost = cost;
    if (notes !== undefined) updates.notes = notes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to update booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
