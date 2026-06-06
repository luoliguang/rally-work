import pool from "./db";
import type { Match } from "./types";

// 比赛数据现在存在 PostgreSQL 的 matches 表（data 列为完整 Match 的 JSONB）。
// 读写都走数据库，前端动态读取，后台改完即时生效。

/** All matches, oldest day first — read the story from the beginning. */
export async function listMatches(): Promise<Match[]> {
  const { rows } = await pool.query(
    `SELECT data FROM matches ORDER BY date ASC, created_at ASC`
  );
  return rows.map((r) => r.data as Match);
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Paginated slice of the timeline (oldest first). Pages are 1-indexed. */
export async function listMatchesPage(page = 1, pageSize = 10): Promise<Page<Match>> {
  const offset = (page - 1) * pageSize;
  const [items, count] = await Promise.all([
    pool.query(
      `SELECT data FROM matches ORDER BY date ASC, created_at ASC LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM matches`),
  ]);
  return {
    items: items.rows.map((r) => r.data as Match),
    page,
    pageSize,
    total: count.rows[0].total,
  };
}

export async function getMatch(id: string): Promise<Match | null> {
  const { rows } = await pool.query(`SELECT data FROM matches WHERE id = $1`, [id]);
  return rows.length ? (rows[0].data as Match) : null;
}

/** The most recent match (newest date), for the home page highlight. */
export async function getLatestMatch(): Promise<Match | null> {
  const { rows } = await pool.query(
    `SELECT data FROM matches ORDER BY date DESC, created_at DESC LIMIT 1`
  );
  return rows.length ? (rows[0].data as Match) : null;
}

// ── 写操作（供后台 API 使用）────────────────────────────────────────────────
export async function upsertMatch(match: Match): Promise<Match> {
  await pool.query(
    `INSERT INTO matches (id, date, data)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE
       SET date = EXCLUDED.date, data = EXCLUDED.data, updated_at = NOW()`,
    [match.id, match.date, JSON.stringify(match)]
  );
  return match;
}

export async function deleteMatch(id: string): Promise<boolean> {
  const res = await pool.query(`DELETE FROM matches WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}
