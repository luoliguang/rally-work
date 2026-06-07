import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashIp, getClientIp } from "@/lib/ipHash";

// POST /api/comments/[id]/like  — toggle like (同一 IP 再点则取消)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const commentId = parseInt(id, 10);
  if (isNaN(commentId)) {
    return NextResponse.json({ error: "无效的留言 ID" }, { status: 400 });
  }

  const ipHash = hashIp(getClientIp(req));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 尝试插入点赞记录；已存在则删除（toggle）
    const existing = await client.query(
      `SELECT id FROM comment_likes WHERE comment_id = $1 AND ip_hash = $2`,
      [commentId, ipHash]
    );

    let action: "liked" | "unliked";
    if (existing.rows.length > 0) {
      await client.query(`DELETE FROM comment_likes WHERE id = $1`, [existing.rows[0].id]);
      await client.query(`UPDATE comments SET likes = GREATEST(likes - 1, 0) WHERE id = $1`, [commentId]);
      action = "unliked";
    } else {
      await client.query(
        `INSERT INTO comment_likes (comment_id, ip_hash) VALUES ($1, $2)`,
        [commentId, ipHash]
      );
      await client.query(`UPDATE comments SET likes = likes + 1 WHERE id = $1`, [commentId]);
      action = "liked";
    }

    const { rows } = await client.query(`SELECT likes FROM comments WHERE id = $1`, [commentId]);
    await client.query("COMMIT");

    return NextResponse.json({ action, likes: rows[0]?.likes ?? 0 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("like error", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  } finally {
    client.release();
  }
}
