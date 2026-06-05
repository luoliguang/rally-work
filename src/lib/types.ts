// Domain model for the badminton record site.
// A "Match" is one day of playing (one gathering), not a single game.

export interface ImageMedia {
  type: "image";
  url: string;
  thumb?: string;
}

export interface VideoMedia {
  type: "video";
  url: string;
  poster?: string;
  duration?: string;
}

export type Media = ImageMedia | VideoMedia;

/**
 * Individual score for multi-player (3+ person) round-robin sessions.
 * Each player accumulates points throughout the day; this records the final total.
 */
export interface PlayerScore {
  player: string;
  score: number;
}

export interface Match {
  id: string;
  date: string;
  weekday?: string;

  // ── Opponent / 2-player format ──────────────────────────────────────────────
  // Use these when it's a straightforward "us vs them" game.
  opponent?: string;
  scoreUs?: number;
  scoreThem?: number;

  // ── Multi-player format (3+ people, round-robin) ────────────────────────────
  // Use playerScores instead of scoreUs/scoreThem when each person has their own total.
  // Example: [{ player: "阿明", score: 85 }, { player: "小K", score: 72 }]
  playerScores?: PlayerScore[];

  /** Overall result for the day. For multi-player, marks whether the recorder "won". */
  result: "win" | "loss";
  gamesPlayed: number;
  gamesWon: number;
  caption: string;
  players?: string[];
  mvp?: string;
  media: Media[];
}

export interface Stats {
  totalMatches: number;
  totalWins: number;
  winRate: number;
  longestWinStreak: number;
  daysRecorded: number;
  teammates: number;
}
