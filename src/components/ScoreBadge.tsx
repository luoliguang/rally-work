import type { Match } from "@/lib/types";

/** The headline score with a win/loss accent color. */
export function ScoreBadge({ match, size = "md" }: { match: Match; size?: "md" | "lg" }) {
  const won = match.result === "win";
  const scoreClass = size === "lg" ? "text-5xl" : "text-2xl";
  return (
    <div className="flex items-center gap-3">
      <span className={`font-bold tabular-nums ${scoreClass} text-white`}>
        {match.scoreUs}
        <span className="mx-2 text-slate-500">:</span>
        {match.scoreThem}
      </span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          won ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
        }`}
      >
        {won ? "WIN" : "LOSS"}
      </span>
    </div>
  );
}
