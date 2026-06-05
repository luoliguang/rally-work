import type { Match } from "@/lib/types";

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return {
    month: d.toLocaleDateString("zh-CN", { month: "long" }),
    day: d.getDate(),
    year: d.getFullYear(),
  };
}

export function MemoryEntry({ match, index }: { match: Match; index: number }) {
  const { month, day, year } = formatDate(match.date);
  const isEven = index % 2 === 0;

  // Pick the best hero image/poster available
  const hero = match.media.find((m) => m.type === "image") as
    | { type: "image"; url: string; thumb?: string }
    | undefined;
  const video = match.media.find((m) => m.type === "video") as
    | { type: "video"; url: string; poster?: string; duration?: string }
    | undefined;

  return (
    <article
      className="memory-card"
      data-index={index}
    >
      {/* Date label */}
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-6xl font-light tabular-nums leading-none" style={{ color: "var(--accent)", opacity: 0.9 }}>
          {day}
        </span>
        <div>
          <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {month}
          </div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            {year}
            {match.weekday ? ` · ${match.weekday}` : ""}
          </div>
        </div>

        {/* Score — small, low-key */}
        <div className="ml-auto flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
          <span className="tabular-nums">
            {match.scoreUs}
            <span className="mx-1 opacity-40">:</span>
            {match.scoreThem}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              background: match.result === "win" ? "rgba(110,231,183,0.1)" : "rgba(248,113,113,0.1)",
              color: match.result === "win" ? "#6ee7b7" : "#f87171",
            }}
          >
            {match.result === "win" ? "胜" : "负"}
          </span>
        </div>
      </div>

      {/* Hero media */}
      {hero ? (
        <div className="overflow-hidden rounded-lg mb-5" style={{ aspectRatio: isEven ? "16/9" : "4/3" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero.url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.92) saturate(0.9)" }}
          />
        </div>
      ) : video ? (
        <div className="overflow-hidden rounded-lg mb-5" style={{ aspectRatio: "16/9" }}>
          <video
            src={video.url}
            poster={video.poster}
            preload="none"
            controls
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        /* No media: subtle separator */
        <div className="mb-5 h-px" style={{ background: "var(--border)" }} />
      )}

      {/* Caption */}
      <p className="text-base leading-relaxed mb-3" style={{ color: "var(--text)", opacity: 0.85 }}>
        {match.caption}
      </p>

      {/* Location + teammates — tiny metadata */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--muted)" }}>
        {match.players?.length ? (
          <span>{match.players.join("、")}</span>
        ) : null}
        {match.mvp ? <span>MVP: {match.mvp}</span> : null}
      </div>

      {/* Extra media strip (if more than 1 photo) */}
      {match.media.length > 1 ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {match.media.slice(1).map((m, i) => {
            if (m.type === "image") {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={m.thumb ?? m.url}
                  alt=""
                  loading="lazy"
                  className="w-full rounded aspect-square object-cover"
                  style={{ opacity: 0.75 }}
                />
              );
            }
            return (
              <video
                key={i}
                src={m.url}
                poster={m.poster}
                preload="none"
                controls
                className="w-full rounded aspect-square object-cover"
              />
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
