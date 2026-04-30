import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("x-admin-key");
  const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
  if (authHeader !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { data, error } = await supabase
      .from("video_testimonials")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Failed to list testimonials (admin):", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
