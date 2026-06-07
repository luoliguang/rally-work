import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { getMatch, upsertMatch, deleteMatch } from "@/lib/matches";
import type { Match } from "@/lib/types";
import { unlink } from "node:fs/promises";
import path from "node:path";

// 删除 /uploads/xxx 对应的磁盘文件，其它来源的 URL 忽略
async function deleteUploadFile(url: string) {
  if (!url.startsWith("/uploads/")) return;
  const filename = path.basename(url);
  const filepath = path.join(process.cwd(), "public", "uploads", filename);
  try {
    await unlink(filepath);
  } catch {
    // 文件不存在则忽略
  }
}

function extractUploadUrls(match: Match): string[] {
  return (match.media ?? [])
    .flatMap((m) => [m.url, (m as { thumb?: string }).thumb ?? ""])
    .filter((u) => u.startsWith("/uploads/"));
}

// PUT /api/admin/matches/[id] — 更新整条记录
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();

  const { id }     = await params;
  const body       = (await req.json()) as Partial<Match>;
  const existing   = await getMatch(id);
  if (!existing) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  const merged: Match = { ...existing, ...body, id };
  await upsertMatch(merged);

  // 删除编辑中被移除的 /uploads/ 文件
  const oldUrls = new Set(extractUploadUrls(existing));
  const newUrls = new Set(extractUploadUrls(merged));
  await Promise.all(
    [...oldUrls].filter((u) => !newUrls.has(u)).map(deleteUploadFile)
  );

  return NextResponse.json(merged);
}

// DELETE /api/admin/matches/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();

  const { id }   = await params;
  const existing = await getMatch(id);
  if (!existing) return NextResponse.json({ error: "记录不存在" }, { status: 404 });

  await deleteMatch(id);

  // 删除该记录关联的所有 /uploads/ 文件
  await Promise.all(extractUploadUrls(existing).map(deleteUploadFile));

  return NextResponse.json({ ok: true });
}
