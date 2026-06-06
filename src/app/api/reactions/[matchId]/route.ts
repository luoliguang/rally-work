import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashIp, getClientIp } from "@/lib/ipHash";

const ALLOWED_EMOJIS = ["❤️", "🔥", "💪", "😂"] as const;

// GET /api/reactions/[matchId]
// 返回该条记忆的各表情计数 + 当前访客已点的表情列表
export async function GET(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const ipHash = hashIp(getClientIp(req));

  const { rows } = await pool.query(
    `SELECT emoji,
            COUNT(*)::int                                           AS count,
            BOOL_OR(ip_hash = $2)                                   AS mine
     FROM   reactions
     WHERE  match_id = $1
     GROUP  BY emoji`,
    [matchId, ipHash]
  );

  // 确保所有允许的 emoji 都出现在结果里（即使 count 为 0）
  const map: Record<string, { count: number; mine: boolean }> = {};
  for (const e of ALLOWED_EMOJIS) map[e] = { count: 0, mine: false };
  for (const r of rows) map[r.emoji] = { count: r.count, mine: r.mine };

  return NextResponse.json(map);
}

// POST /api/reactions/[matchId]  body: { emoji }
// 同一访客对同一 emoji 再次点击则取消（toggle）
export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const { emoji }   = (await req.json()) as { emoji: string };

  if (!ALLOWED_EMOJIS.includes(emoji as (typeof ALLOWED_EMOJIS)[number])) {
    return NextResponse.json({ error: "不支持的表情" }, { status: 400 });
  }

  const ipHash = hashIp(getClientIp(req));

  // 先尝试插入；如果已存在则删除（toggle）
  const existing = await pool.query(
    `SELECT id FROM reactions WHERE match_id=$1 AND emoji=$2 AND ip_hash=$3`,
    [matchId, emoji, ipHash]
  );

  if (existing.rows.length > 0) {
    await pool.query(`DELETE FROM reactions WHERE id=$1`, [existing.rows[0].id]);
    return NextResponse.json({ action: "removed" });
  } else {
    await pool.query(
      `INSERT INTO reactions (match_id, emoji, ip_hash) VALUES ($1,$2,$3)`,
      [matchId, emoji, ipHash]
    );
    return NextResponse.json({ action: "added" });
  }
}
