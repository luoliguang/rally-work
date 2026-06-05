import { NextResponse } from "next/server";
import { getLatestMatch } from "@/lib/matches";

// GET /api/latest — most recent match, for the home page highlight.
export async function GET() {
  return NextResponse.json(await getLatestMatch());
}
