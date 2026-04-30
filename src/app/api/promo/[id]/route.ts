import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("x-admin-key");
  const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
  return authHeader === adminKey;
}

// PATCH — update a promo code (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, string | number | boolean | null> = {};
    if (body.active !== undefined) updates.active = !!body.active;
    if (body.description !== undefined) updates.description = body.description || null;
    if (body.discount_value !== undefined) {
      const n = Number(body.discount_value);
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json({ error: "Invalid discount_value" }, { status: 400 });
      }
      updates.discount_value = n;
    }
    if (body.max_uses !== undefined) updates.max_uses = body.max_uses ? Number(body.max_uses) : null;
    if (body.expires_at !== undefined) updates.expires_at = body.expires_at || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("promo_codes")
      .update(updates)
      .eq("id", Number(id))
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to update promo code:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE — remove a promo code (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { error } = await supabase.from("promo_codes").delete().eq("id", Number(id));
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete promo code:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
