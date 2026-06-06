import Link from "next/link";
import type { Match } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";
import { mediaUrl } from "@/lib/mediaUrl";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** One entry on the timeline. Lists show thumbnails only (never heavy media). */
export function MatchCard({ match }: { match: Match }) {
  const thumbs = match.media
    .map((m) => (m.type === "image" ? m.thumb ?? m.url : m.poster))
    .filter((src): src is string => Boolean(src))
    .slice(0, 4)
    .map(mediaUrl);

  return (
    <article className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-5 transition hover:border-slate-600">
      <header className="mb-3 flex items-baseline justify-between gap-4">
        <div>
          <time className="text-sm font-medium text-emerald-400" dateTime={match.date}>
            {formatDate(match.date)}
          </time>
          <p className="text-sm text-slate-400">vs {match.opponent}</p>
        </div>
        <ScoreBadge match={match} />
      </header>

      <p className="line-clamp-2 text-slate-300">{match.caption}</p>

      {thumbs.length > 0 ? (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {thumbs.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${match.id}-${i}`}
              src={src}
              alt=""
              loading="lazy"
              className="aspect-square w-full rounded-lg object-cover transition hover:scale-105"
            />
          ))}
        </div>
      ) : null}

      <Link
        href={`/matches/${match.id}`}
        className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
      >
        查看详情 →
      </Link>
    </article>
  );
}
