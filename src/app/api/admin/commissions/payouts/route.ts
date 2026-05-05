import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

function checkAuth(req: NextRequest) {
  const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";
  return req.headers.get("x-admin-key") === adminKey;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("commission_payouts")
    .select("*, mechanics(full_name)")
    .order("paid_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
