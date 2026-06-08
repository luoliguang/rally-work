import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { notifyNewComment } from "@/lib/notify";

// GET /api/comments — 返回已审核的留言（最新在前）
export async function GET() {
  const { rows } = await pool.query(
    `SELECT id, nickname, content, likes, created_at
     FROM   comments
     WHERE  is_approved = TRUE
     ORDER  BY created_at DESC
     LIMIT  100`
  );
  return NextResponse.json(rows);
}

// POST /api/comments — 提交留言（待审核）
export async function POST(req: Request) {
  const body = (await req.json()) as { nickname?: string; content?: string };
  const nickname = (body.nickname?.trim() || "匿名").slice(0, 50);
  const content  = body.content?.trim() ?? "";

  if (!content || content.length > 300) {
    return NextResponse.json(
      { error: "留言内容不能为空，且不超过 300 字" },
      { status: 400 }
    );
  }

  await pool.query(
    `INSERT INTO comments (nickname, content) VALUES ($1, $2)`,
    [nickname, content]
  );

  // 飞书通知（异步，不阻塞响应）
  void notifyNewComment(nickname, content);

  return NextResponse.json(
    { message: "留言已提交，审核后将显示 🙏" },
    { status: 201 }
  );
}
