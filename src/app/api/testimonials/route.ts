import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { buildEmbedUrl, detectPlatform } from "@/lib/video-embed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("x-admin-key");
  const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
  return authHeader === adminKey;
}

// GET — public, list active testimonials sorted
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("video_testimonials")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Failed to list testimonials:", error);
    return NextResponse.json([]);
  }
}

// POST — create a testimonial (admin)
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { video_url, customer_name, customer_car, caption, sort_order } = body;

    if (!video_url?.trim()) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
    }

    const platform = detectPlatform(video_url);
    if (!platform) {
      return NextResponse.json({ error: "Unsupported URL — must be TikTok, Facebook, or YouTube" }, { status: 400 });
    }

    // Validate we can build an embed
    const embed = buildEmbedUrl(video_url);
    if (!embed) {
      return NextResponse.json({ error: "Could not parse video URL — check the format" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("video_testimonials")
      .insert({
        platform,
        video_url: video_url.trim(),
        customer_name: customer_name?.trim() || null,
        customer_car: customer_car?.trim() || null,
        caption: caption?.trim() || null,
        sort_order: sort_order != null ? Number(sort_order) : 0,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Failed to create testimonial:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
