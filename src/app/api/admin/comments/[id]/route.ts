import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { isAdmin, unauthorized } from "@/lib/adminAuth";

// PATCH /api/admin/comments/[id]  body: { approved: true|false }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();

  const { id }       = await params;
  const { approved } = (await req.json()) as { approved: boolean };

  await pool.query(
    `UPDATE comments SET is_approved=$1 WHERE id=$2`,
    [approved, id]
  );
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/comments/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();

  const { id } = await params;
  await pool.query(`DELETE FROM comments WHERE id=$1`, [id]);
  return NextResponse.json({ ok: true });
}
