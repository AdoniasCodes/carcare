import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

// Force dynamic so admin pricing edits propagate immediately
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Default fallbacks if DB is unreachable or rows missing
const DEFAULTS = [
  { plan: "silver", base_price: 1500, current_price: 1500, discount_label: null, discount_reason: null },
  { plan: "gold", base_price: 2500, current_price: 2500, discount_label: null, discount_reason: null },
  { plan: "platinum", base_price: 4000, current_price: 4000, discount_label: null, discount_reason: null },
];

// GET — public, returns all 3 plan prices (used by landing + /subscription)
export async function GET() {
  try {
    const { data, error } = await supabase.from("plan_pricing").select("*");
    if (error) throw error;

    const byPlan = new Map((data || []).map((r) => [r.plan, r]));
    const merged = DEFAULTS.map((d) => byPlan.get(d.plan) || d);
    return NextResponse.json(merged);
  } catch (error) {
    console.error("Failed to fetch pricing:", error);
    // Return defaults on error so the public site never breaks
    return NextResponse.json(DEFAULTS);
  }
}
