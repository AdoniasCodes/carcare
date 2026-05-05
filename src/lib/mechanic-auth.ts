import { NextRequest } from "next/server";
import { supabase } from "./db";

export interface MechanicSession {
  id: string;
  full_name: string;
  phone: string;
  availability: "available" | "busy" | "off";
  commission_rate: number;
  active: boolean;
}

export async function getMechanicFromRequest(req: NextRequest): Promise<MechanicSession | null> {
  const token = req.headers.get("x-mechanic-token");
  if (!token) return null;

  const { data, error } = await supabase
    .from("mechanics")
    .select("id, full_name, phone, availability, commission_rate, active, session_token")
    .eq("session_token", token)
    .maybeSingle();

  if (error || !data || !data.active) return null;
  return data as MechanicSession;
}
