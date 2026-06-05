import type { Match, Stats } from "./types";
import { listMatches } from "./matches";

/**
 * Derive all aggregate numbers from raw matches. Per README §4, nothing here
 * is ever persisted — store raw data, compute derived stats on read.
 */
export function computeStats(matches: Match[]): Stats {
  const totalMatches = matches.length;
  const totalWins = matches.filter((m) => m.result === "win").length;

  // Longest streak of consecutive winning *days*, scanned in chronological order.
  const chronological = [...matches].sort((a, b) => a.date.localeCompare(b.date));
  let longestWinStreak = 0;
  let current = 0;
  for (const m of chronological) {
    current = m.result === "win" ? current + 1 : 0;
    if (current > longestWinStreak) longestWinStreak = current;
  }

  const teammates = new Set(matches.flatMap((m) => m.players ?? [])).size;

  return {
    totalMatches,
    totalWins,
    winRate: totalMatches === 0 ? 0 : totalWins / totalMatches,
    longestWinStreak,
    daysRecorded: new Set(matches.map((m) => m.date)).size,
    teammates,
  };
}

export async function getStats(): Promise<Stats> {
  return computeStats(await listMatches());
}
