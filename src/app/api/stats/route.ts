import { NextResponse } from "next/server";
import { getStats } from "@/lib/stats";

// GET /api/stats — derived aggregate numbers (computed, never stored).
export async function GET() {
  return NextResponse.json(await getStats());
}
