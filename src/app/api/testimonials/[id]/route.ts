import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("x-admin-key");
  const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
  return authHeader === adminKey;
}

// PATCH — update a testimonial (admin)
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
    if (body.customer_name !== undefined) updates.customer_name = body.customer_name || null;
    if (body.customer_car !== undefined) updates.customer_car = body.customer_car || null;
    if (body.caption !== undefined) updates.caption = body.caption || null;
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("video_testimonials")
      .update(updates)
      .eq("id", Number(id))
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to update testimonial:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE — admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { error } = await supabase.from("video_testimonials").delete().eq("id", Number(id));
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete testimonial:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
