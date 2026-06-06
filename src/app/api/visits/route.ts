import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashIp, getClientIp } from "@/lib/ipHash";

// POST /api/visits — 记录一次访问（同一 IP 当天最多记一条）
export async function POST(req: Request) {
  try {
    const ip     = getClientIp(req);
    const ipHash = hashIp(ip);

    // INSERT … ON CONFLICT DO NOTHING 保证幂等
    await pool.query(
      `INSERT INTO visits (ip_hash, visited_date)
       VALUES ($1, CURRENT_DATE)
       ON CONFLICT DO NOTHING`,
      [ipHash]
    );

    const { rows } = await pool.query(
      `SELECT COUNT(DISTINCT ip_hash) AS total FROM visits`
    );

    return NextResponse.json({ total: Number(rows[0].total) });
  } catch {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

// GET /api/visits — 返回累计独立访客数
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(DISTINCT ip_hash) AS total FROM visits`
    );
    return NextResponse.json({ total: Number(rows[0].total) });
  } catch {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
