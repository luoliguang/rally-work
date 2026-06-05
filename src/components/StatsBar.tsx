import type { Stats } from "@/lib/types";

const items = (s: Stats) => [
  { label: "总场次", value: s.totalMatches },
  { label: "胜场", value: s.totalWins },
  { label: "胜率", value: `${Math.round(s.winRate * 100)}%` },
  { label: "最高连胜", value: s.longestWinStreak },
  { label: "记录天数", value: s.daysRecorded },
  { label: "队友", value: s.teammates },
];

/** Overview numbers. Home page is the place to later add GSAP count-up (README §6). */
export function StatsBar({ stats }: { stats: Stats }) {
  return (
    <dl className="grid grid-cols-3 gap-4 sm:grid-cols-6">
      {items(stats).map((it) => (
        <div key={it.label} className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 text-center">
          <dd className="text-2xl font-bold tabular-nums text-white">{it.value}</dd>
          <dt className="mt-1 text-xs text-slate-400">{it.label}</dt>
        </div>
      ))}
    </dl>
  );
}
