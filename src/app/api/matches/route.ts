import { NextResponse } from "next/server";
import { listMatchesPage } from "@/lib/matches";

// GET /api/matches?page=1&pageSize=10 — paginated timeline, newest day first.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "10");
  const result = await listMatchesPage(
    Number.isFinite(page) && page > 0 ? page : 1,
    Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10,
  );
  return NextResponse.json(result);
}
