import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { listMatches, upsertMatch } from "@/lib/matches";
import { randomUUID } from "node:crypto";
import type { Match } from "@/lib/types";

// GET /api/admin/matches — 返回所有比赛（管理员用）
export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  return NextResponse.json(await listMatches());
}

// POST /api/admin/matches — 新增一场比赛
export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();

  const body = (await req.json()) as Partial<Match>;
  if (!body.date || !body.caption?.trim()) {
    return NextResponse.json({ error: "date 和 caption 为必填项" }, { status: 400 });
  }

  const newMatch: Match = {
    id:           body.id?.trim() || `${body.date}-${randomUUID().slice(0, 6)}`,
    date:         body.date,
    weekday:      body.weekday,
    opponent:     body.opponent,
    scoreUs:      body.scoreUs,
    scoreThem:    body.scoreThem,
    playerScores: body.playerScores,
    result:       body.result ?? "win",
    gamesPlayed:  body.gamesPlayed ?? 1,
    gamesWon:     body.gamesWon ?? 1,
    caption:      body.caption.trim(),
    players:      body.players ?? [],
    mvp:          body.mvp,
    media:        body.media ?? [],
  };

  await upsertMatch(newMatch);
  return NextResponse.json(newMatch, { status: 201 });
}
