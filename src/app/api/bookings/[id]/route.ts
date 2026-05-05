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

    const { data: existing } = await supabase.from("bookings").select("id").eq("id", id).single();
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const validStatuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.revenue !== undefined) updates.revenue = body.revenue === "" ? null : Number(body.revenue);
    if (body.cost !== undefined) updates.cost = body.cost === "" ? null : Number(body.cost);
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.assigned_mechanic_id !== undefined) {
      updates.assigned_mechanic_id = body.assigned_mechanic_id || null;
    }
    if (body.cash_collected !== undefined) {
      updates.cash_collected = body.cash_collected === "" ? null : Number(body.cash_collected);
    }
    if (body.payment_method !== undefined) {
      const valid = ["cash", "transfer", "pending"];
      updates.payment_method = body.payment_method && valid.includes(body.payment_method) ? body.payment_method : null;
    }
    if (body.mechanic_notes !== undefined) updates.mechanic_notes = body.mechanic_notes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    if (body.status === "completed") {
      updates.completed_at = new Date().toISOString();
    }
    if (body.status === "in_progress") {
      updates.started_at = new Date().toISOString();
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
