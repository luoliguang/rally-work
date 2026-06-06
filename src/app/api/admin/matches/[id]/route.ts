import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Match } from "@/lib/types";

const DATA_FILE = path.join(process.cwd(), "src", "data", "matches.json");

async function readMatches(): Promise<Match[]> {
  const raw    = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw) as { matches: Match[] };
  return parsed.matches ?? [];
}
async function writeMatches(matches: Match[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify({ matches }, null, 2), "utf8");
}

// PUT /api/admin/matches/[id] — 更新整条记录
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();

  const { id }  = await params;
  const body    = (await req.json()) as Partial<Match>;
  const matches = await readMatches();
  const idx     = matches.findIndex((m) => m.id === id);

  if (idx === -1) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  // 保留原 id，合并其余字段
  matches[idx] = { ...matches[idx], ...body, id };
  await writeMatches(matches);

  return NextResponse.json(matches[idx]);
}

// DELETE /api/admin/matches/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();

  const { id }  = await params;
  const matches = await readMatches();
  const next    = matches.filter((m) => m.id !== id);

  if (next.length === matches.length) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  await writeMatches(next);
  return NextResponse.json({ ok: true });
}
