import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { isAdmin, unauthorized } from "@/lib/adminAuth";

// PATCH /api/admin/teammates/[id]  body: { name } — 重命名
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();
  const { id }   = await params;
  const { name } = (await req.json()) as { name?: string };
  const trimmed  = name?.trim();
  if (!trimmed) return NextResponse.json({ error: "姓名不能为空" }, { status: 400 });

  try {
    const { rows } = await pool.query(
      `UPDATE teammates SET name=$1 WHERE id=$2 RETURNING id, name`,
      [trimmed, id]
    );
    if (rows.length === 0) return NextResponse.json({ error: "队友不存在" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: "该姓名已存在" }, { status: 409 });
  }
}

// DELETE /api/admin/teammates/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  await pool.query(`DELETE FROM teammates WHERE id=$1`, [id]);
  return NextResponse.json({ ok: true });
}
