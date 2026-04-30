import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

const DEFAULT_PRICES: Record<string, number> = {
  silver: 1500,
  gold: 2500,
  platinum: 4000,
};

// POST — create a new subscription (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, carMake, carModel, carYear, plateNumber, plan, location, notes, promoCode } = body;

    if (
      !name?.trim() ||
      !phone?.trim() ||
      !carMake?.trim() ||
      !carModel?.trim() ||
      !carYear?.trim() ||
      !plan ||
      !location?.trim()
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\s/g, "");
    if (!/^(\+251|0)9\d{8}$/.test(cleanPhone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    if (!["silver", "gold", "platinum"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get the current admin-set price (fallback to default if pricing row missing)
    const { data: pricingRow } = await supabase
      .from("plan_pricing")
      .select("current_price")
      .eq("plan", plan)
      .single();
    const basePrice = pricingRow?.current_price ?? DEFAULT_PRICES[plan];

    // Apply promo code if any
    let discountApplied = 0;
    let appliedCode: string | null = null;
    if (promoCode) {
      const codeUpper = promoCode.trim().toUpperCase();
      const { data: pc } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", codeUpper)
        .single();
      if (pc && pc.active) {
        const expired = pc.expires_at && new Date(pc.expires_at) < new Date();
        const exhausted = pc.max_uses && pc.uses_count >= pc.max_uses;
        const applies = pc.applies_to as string;
        const allowed =
          applies === "all" ||
          applies === "subscription" ||
          applies === plan;
        if (!expired && !exhausted && allowed) {
          if (pc.discount_type === "percent") {
            discountApplied = Math.round(basePrice * (Number(pc.discount_value) / 100));
          } else {
            discountApplied = Math.min(basePrice, Number(pc.discount_value));
          }
          appliedCode = codeUpper;
        }
      }
    }

    const finalPrice = Math.max(0, basePrice - discountApplied);
    const id = "SUB-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

    const { error } = await supabase.from("subscriptions").insert({
      id,
      name: name.trim(),
      phone: cleanPhone,
      email: email?.trim() || null,
      car_make: carMake.trim(),
      car_model: carModel.trim(),
      car_year: carYear.trim(),
      plate_number: plateNumber?.trim() || null,
      plan,
      price: basePrice,
      final_price: finalPrice,
      promo_code: appliedCode,
      discount_applied: discountApplied,
      location: location.trim(),
      notes: notes?.trim() || null,
    });

    if (error) throw error;

    // Increment promo usage (best-effort)
    if (appliedCode) {
      const { data: pc } = await supabase
        .from("promo_codes")
        .select("uses_count")
        .eq("code", appliedCode)
        .single();
      if (pc) {
        await supabase
          .from("promo_codes")
          .update({ uses_count: (pc.uses_count || 0) + 1 })
          .eq("code", appliedCode);
      }
    }

    return NextResponse.json({ id, plan, price: basePrice, final_price: finalPrice, discount: discountApplied }, { status: 201 });
  } catch (error) {
    console.error("Failed to create subscription:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}

// GET — list subscriptions (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("x-admin-key");
    const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
    if (authHeader !== adminKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const plan = searchParams.get("plan");

    let query = supabase.from("subscriptions").select("*");
    if (status && status !== "all") query = query.eq("status", status);
    if (plan && plan !== "all") query = query.eq("plan", plan);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}
