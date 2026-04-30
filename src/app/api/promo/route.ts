import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("x-admin-key");
  const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
  return authHeader === adminKey;
}

// GET — list all promo codes (admin)
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to list promo codes:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST — create a new promo code (admin)
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const code = (body.code || "").toString().trim().toUpperCase();
    if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

    const discount_type = body.discount_type;
    if (!["amount", "percent"].includes(discount_type)) {
      return NextResponse.json({ error: "Invalid discount_type" }, { status: 400 });
    }

    const discount_value = Number(body.discount_value);
    if (!Number.isFinite(discount_value) || discount_value <= 0) {
      return NextResponse.json({ error: "Invalid discount_value" }, { status: 400 });
    }

    const applies_to = body.applies_to || "all";
    if (!["all", "subscription", "booking", "silver", "gold", "platinum"].includes(applies_to)) {
      return NextResponse.json({ error: "Invalid applies_to" }, { status: 400 });
    }

    const insertRow: Record<string, string | number | boolean | null> = {
      code,
      description: body.description || null,
      discount_type,
      discount_value,
      applies_to,
      max_uses: body.max_uses ? Number(body.max_uses) : null,
      active: body.active !== false,
      expires_at: body.expires_at || null,
    };

    const { data, error } = await supabase.from("promo_codes").insert(insertRow).select().single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This code already exists" }, { status: 409 });
      }
      throw error;
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Failed to create promo code:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
