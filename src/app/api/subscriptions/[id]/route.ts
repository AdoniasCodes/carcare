import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

// PATCH — update a subscription (admin only)
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
    const { status, payment_status, start_date, end_date, internal_notes } = body;

    const { data: existing } = await supabase.from("subscriptions").select("id").eq("id", id).single();
    if (!existing) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (status && !["pending", "active", "expired", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (payment_status && !["unpaid", "paid", "partial", "refunded"].includes(payment_status)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    }

    const updates: Record<string, string | number | null> = {};
    if (status !== undefined) updates.status = status;
    if (payment_status !== undefined) updates.payment_status = payment_status;
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;
    if (internal_notes !== undefined) updates.internal_notes = internal_notes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("subscriptions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to update subscription:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
