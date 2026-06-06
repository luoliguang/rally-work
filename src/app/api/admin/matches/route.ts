import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/adminAuth";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Match } from "@/lib/types";

const DATA_FILE = path.join(process.cwd(), "src", "data", "matches.json");

async function readMatches(): Promise<Match[]> {
  const raw    = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw) as { matches: Match[] };
  return parsed.matches ?? [];
}

async function writeMatches(matches: Match[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify({ matches }, null, 2), "utf8");
}

// GET /api/admin/matches — 返回所有比赛（管理员用）
export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  const matches = await readMatches();
  return NextResponse.json(matches);
}

// POST /api/admin/matches — 新增一场比赛
export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();

  const body = (await req.json()) as Partial<Match>;

  if (!body.date || !body.caption?.trim()) {
    return NextResponse.json(
      { error: "date 和 caption 为必填项" },
      { status: 400 }
    );
  }

  const matches = await readMatches();

  const newMatch: Match = {
    id:         body.id?.trim() || `${body.date}-${randomUUID().slice(0, 6)}`,
    date:       body.date,
    weekday:    body.weekday,
    opponent:   body.opponent,
    scoreUs:    body.scoreUs,
    scoreThem:  body.scoreThem,
    playerScores: body.playerScores,
    result:     body.result ?? "win",
    gamesPlayed: body.gamesPlayed ?? 1,
    gamesWon:   body.gamesWon ?? 1,
    caption:    body.caption.trim(),
    players:    body.players ?? [],
    mvp:        body.mvp,
    media:      body.media ?? [],
  };

  matches.push(newMatch);
  await writeMatches(matches);

  return NextResponse.json(newMatch, { status: 201 });
}

// DELETE /api/admin/matches/[id] 通过 query param
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return unauthorized();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  const matches = await readMatches();
  const next    = matches.filter((m) => m.id !== id);

  if (next.length === matches.length) {
    return NextResponse.json({ error: "未找到该记录" }, { status: 404 });
  }

  await writeMatches(next);
  return NextResponse.json({ ok: true });
}
