import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { isAdmin, unauthorized } from "@/lib/adminAuth";

// GET /api/admin/comments — 管理员查看所有留言（含待审核）
export async function GET() {
  if (!(await isAdmin())) return unauthorized();

  const { rows } = await pool.query(
    `SELECT id, nickname, content, is_approved, created_at
     FROM   comments
     ORDER  BY created_at DESC`
  );
  return NextResponse.json(rows);
}
