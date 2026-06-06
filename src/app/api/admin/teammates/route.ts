import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { isAdmin, unauthorized } from "@/lib/adminAuth";

// GET /api/admin/teammates — 队友名单（按排序）
export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  const { rows } = await pool.query(
    `SELECT id, name FROM teammates ORDER BY sort_order, id`
  );
  return NextResponse.json(rows);
}

// POST /api/admin/teammates  body: { name } — 新增队友
export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const { name } = (await req.json()) as { name?: string };
  const trimmed  = name?.trim();
  if (!trimmed) return NextResponse.json({ error: "姓名不能为空" }, { status: 400 });

  try {
    const { rows } = await pool.query(
      `INSERT INTO teammates (name, sort_order)
       VALUES ($1, COALESCE((SELECT MAX(sort_order) + 1 FROM teammates), 1))
       RETURNING id, name`,
      [trimmed]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: "该队友已存在" }, { status: 409 });
  }
}
