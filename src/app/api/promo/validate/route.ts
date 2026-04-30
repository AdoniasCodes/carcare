import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

// POST — public, validates a promo code against a context (booking | subscription | plan)
// Body: { code: string, context: 'booking' | 'subscription', plan?: 'silver'|'gold'|'platinum' }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = (body.code || "").toString().trim().toUpperCase();
    const context = body.context;
    const plan = body.plan;

    if (!code) {
      return NextResponse.json({ valid: false, error: "Enter a code" }, { status: 200 });
    }
    if (!["booking", "subscription"].includes(context)) {
      return NextResponse.json({ valid: false, error: "Invalid context" }, { status: 400 });
    }

    const { data: promo, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code)
      .single();

    if (error || !promo) {
      return NextResponse.json({ valid: false, error: "Code not found" });
    }

    if (!promo.active) {
      return NextResponse.json({ valid: false, error: "This code is no longer active" });
    }

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: "This code has expired" });
    }

    if (promo.max_uses && promo.uses_count >= promo.max_uses) {
      return NextResponse.json({ valid: false, error: "This code has reached its usage limit" });
    }

    // Check applies_to
    const applies = promo.applies_to as string;
    const allowedForBooking = applies === "all" || applies === "booking";
    const allowedForSub =
      applies === "all" ||
      applies === "subscription" ||
      (plan && (applies === plan));

    if (context === "booking" && !allowedForBooking) {
      return NextResponse.json({ valid: false, error: "This code doesn't apply to bookings" });
    }
    if (context === "subscription" && !allowedForSub) {
      return NextResponse.json({ valid: false, error: "This code doesn't apply to this plan" });
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: Number(promo.discount_value),
      description: promo.description,
    });
  } catch (error) {
    console.error("Promo validate failed:", error);
    return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 });
  }
}
