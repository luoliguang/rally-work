import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { getMatch, upsertMatch, deleteMatch } from "@/lib/matches";
import type { Match } from "@/lib/types";

// PUT /api/admin/matches/[id] — 更新整条记录
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();

  const { id }  = await params;
  const body    = (await req.json()) as Partial<Match>;
  const existing = await getMatch(id);
  if (!existing) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  const merged: Match = { ...existing, ...body, id }; // 保留原 id
  await upsertMatch(merged);
  return NextResponse.json(merged);
}

// DELETE /api/admin/matches/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();

  const { id } = await params;
  const ok = await deleteMatch(id);
  if (!ok) return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
