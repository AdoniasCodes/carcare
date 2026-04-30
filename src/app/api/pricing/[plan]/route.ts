import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

// PATCH — update one plan's pricing/discount (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ plan: string }> }
) {
  try {
    const authHeader = request.headers.get("x-admin-key");
    const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
    if (authHeader !== adminKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await params;
    if (!["silver", "gold", "platinum"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const body = await request.json();
    const { base_price, current_price, discount_label, discount_reason } = body;

    const updates: Record<string, string | number | null> = { updated_at: new Date().toISOString() };
    if (base_price !== undefined) {
      const n = Number(base_price);
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json({ error: "Invalid base_price" }, { status: 400 });
      }
      updates.base_price = n;
    }
    if (current_price !== undefined) {
      const n = Number(current_price);
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json({ error: "Invalid current_price" }, { status: 400 });
      }
      updates.current_price = n;
    }
    if (discount_label !== undefined) updates.discount_label = discount_label || null;
    if (discount_reason !== undefined) updates.discount_reason = discount_reason || null;

    // Upsert — row may not exist yet
    const { data: existing } = await supabase.from("plan_pricing").select("plan").eq("plan", plan).single();

    if (!existing) {
      // Need both prices on insert
      const insertRow = {
        plan,
        base_price: updates.base_price ?? 0,
        current_price: updates.current_price ?? updates.base_price ?? 0,
        discount_label: updates.discount_label ?? null,
        discount_reason: updates.discount_reason ?? null,
      };
      const { data, error } = await supabase.from("plan_pricing").insert(insertRow).select().single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from("plan_pricing")
      .update(updates)
      .eq("plan", plan)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to update pricing:", error);
    return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
  }
}
