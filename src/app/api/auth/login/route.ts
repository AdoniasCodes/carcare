import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD || "carcare2024";
    const adminKey = process.env.ADMIN_KEY || "carcare-admin-2024";

    if (password === adminPassword) {
      return NextResponse.json({ key: adminKey });
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
  }
}
