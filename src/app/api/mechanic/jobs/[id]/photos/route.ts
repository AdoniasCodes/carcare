import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getMechanicFromRequest } from "@/lib/mechanic-auth";

const BUCKET = "job-photos";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getMechanicFromRequest(request);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const form = await request.formData();
  const phase = String(form.get("phase") || "before"); // 'before' | 'after'
  const files = form.getAll("photos") as File[];
  if (!files.length) return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  if (phase !== "before" && phase !== "after") {
    return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("bookings")
    .select("id, assigned_mechanic_id, before_photos, after_photos")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (existing.assigned_mechanic_id !== me.id) {
    return NextResponse.json({ error: "Not your job" }, { status: 403 });
  }

  const urls: string[] = [];
  for (const file of files) {
    if (!(file instanceof File)) continue;
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${id}/${phase}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });
    if (upErr) {
      console.error("photo upload failed:", upErr);
      continue;
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(pub.publicUrl);
  }

  if (!urls.length) return NextResponse.json({ error: "Upload failed" }, { status: 500 });

  const column = phase === "before" ? "before_photos" : "after_photos";
  const merged = [...(existing[column] || []), ...urls];
  await supabase.from("bookings").update({ [column]: merged }).eq("id", id);

  return NextResponse.json({ urls, all: merged });
}
