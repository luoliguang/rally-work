import { promises as fs } from "node:fs";
import path from "node:path";
import type { Match } from "./types";

// File-based JSON store — the single source of truth for match data.
// There is no database; this file *is* the database. Swap the helpers below
// for a real DB (or SQLite, see README §12) when the project grows.
// matches.json 是运行时数据（后台增删改），不进 git。
// 全新部署若还没有它，则回退读取随仓库一起的种子文件 matches.example.json。
const DATA_FILE = path.join(process.cwd(), "src", "data", "matches.json");
const SEED_FILE = path.join(process.cwd(), "src", "data", "matches.example.json");

async function readAll(): Promise<Match[]> {
  for (const file of [DATA_FILE, SEED_FILE]) {
    try {
      const raw = await fs.readFile(file, "utf8");
      const parsed = JSON.parse(raw) as { matches: Match[] };
      return parsed.matches ?? [];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") continue; // 试下一个
      throw err;
    }
  }
  return [];
}

/** All matches, oldest day first — read the story from the beginning. */
export async function listMatches(): Promise<Match[]> {
  const matches = await readAll();
  return matches.sort((a, b) => a.date.localeCompare(b.date));
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Paginated slice of the timeline (oldest first). Pages are 1-indexed. */
export async function listMatchesPage(page = 1, pageSize = 10): Promise<Page<Match>> {
  const all = await listMatches();
  const start = (page - 1) * pageSize;
  return {
    items: all.slice(start, start + pageSize),
    page,
    pageSize,
    total: all.length,
  };
}

export async function getMatch(id: string): Promise<Match | null> {
  const matches = await readAll();
  return matches.find((m) => m.id === id) ?? null;
}

/** The most recent match (newest date), for the home page highlight. */
export async function getLatestMatch(): Promise<Match | null> {
  const matches = await readAll();
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.date.localeCompare(a.date))[0];
}
