// Domain model for the badminton record site.
// A "Match" is one day of playing (one gathering), not a single game.
// See README.md §4 for the canonical data model.

export interface ImageMedia {
  type: "image";
  url: string;
  /** Lightweight thumbnail used in lists. */
  thumb?: string;
}

export interface VideoMedia {
  type: "video";
  url: string;
  /** Cover image shown before the video loads. */
  poster?: string;
  /** Human-readable length, e.g. "00:15". */
  duration?: string;
}

export type Media = ImageMedia | VideoMedia;

export interface Match {
  /** Unique id, conventionally `date-opponentSlug`. Used as the detail route param. */
  id: string;
  /** ISO date (YYYY-MM-DD) the session happened. Drives timeline ordering. */
  date: string;
  /** Optional weekday label; can also be derived from `date`. */
  weekday?: string;
  opponent: string;
  /** The headline game score shown on cards and the home page. */
  scoreUs: number;
  scoreThem: number;
  /** Overall win/loss label for the day. */
  result: "win" | "loss";
  /** Total games played / won that day — raw inputs for derived stats. */
  gamesPlayed: number;
  gamesWon: number;
  /** Free-form note about the day; may be long. */
  caption: string;
  players?: string[];
  mvp?: string;
  media: Media[];
}

/**
 * Aggregate numbers. IMPORTANT: these are NEVER stored in the JSON file —
 * they are always recomputed from the raw `matches` array (see lib/stats.ts).
 */
export interface Stats {
  totalMatches: number;
  totalWins: number;
  /** 0..1; multiply by 100 for a percentage. */
  winRate: number;
  /** Longest run of consecutive winning days. */
  longestWinStreak: number;
  daysRecorded: number;
  teammates: number;
}
