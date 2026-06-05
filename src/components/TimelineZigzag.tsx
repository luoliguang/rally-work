"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Match, Media } from "@/lib/types";

gsap.registerPlugin(ScrollTrigger);

// ─── Media panel ──────────────────────────────────────────────────────────────
function MediaPanel({ media }: { media: Media[] }) {
  if (media.length === 0) {
    return <div className="w-full h-full" style={{ background: "var(--surface)" }} />;
  }
  const [primary, ...rest] = media;
  const extras   = rest.slice(0, 3);
  const overflow = rest.length - extras.length;

  return (
    <div className="w-full h-full flex flex-col gap-px">
      <div className={rest.length > 0 ? "flex-[3] min-h-0 overflow-hidden" : "flex-1 min-h-0 overflow-hidden"}>
        {primary.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primary.url} alt="" loading="lazy"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.85) saturate(0.88)" }} />
        ) : (
          <video src={primary.url} poster={primary.poster}
            preload="none" controls className="w-full h-full object-cover" />
        )}
      </div>
      {extras.length > 0 && (
        <div className="flex-1 min-h-0 flex gap-px overflow-hidden">
          {extras.map((m, i) => (
            <div key={i} className="relative flex-1 overflow-hidden">
              {m.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.thumb ?? m.url} alt="" loading="lazy"
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.65) saturate(0.7)" }} />
              ) : (
                <video src={m.url} poster={m.poster} preload="none" controls
                  className="w-full h-full object-cover" />
              )}
              {m.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
                      <path d="M1 1l8 5-8 5V1z" />
                    </svg>
                  </div>
                </div>
              )}
              {overflow > 0 && i === extras.length - 1 && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.55)" }}>
                  <span className="text-white text-sm font-medium">+{overflow}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single entry row ─────────────────────────────────────────────────────────
function EntryRow({ match, index }: { match: Match; index: number }) {
  const isImgRight = index % 2 === 0;
  const day   = match.date.slice(8, 10);
  const year  = match.date.slice(0, 4);
  const month = new Date(`${match.date}T00:00:00`).toLocaleDateString("zh-CN", { month: "long" });

  const textSide = (
    <div className="entry-text flex items-center justify-center w-full h-full"
      style={{ padding: "clamp(2rem, 5vw, 5rem)" }}>
      <div style={{ maxWidth: "26rem", width: "100%" }}>
        {/* Date */}
        <div className="flex items-baseline gap-3 mb-5">
          <span className="font-thin tabular-nums leading-none"
            style={{ fontSize: "clamp(3rem,6vw,5.5rem)", color: "var(--accent)", opacity: 0.9 }}>
            {day}
          </span>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{month}</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              {year}{match.weekday ? ` · ${match.weekday}` : ""}
            </div>
          </div>
        </div>

        {/* Score pill */}
        <div className="inline-flex items-center gap-2 text-xs mb-6 px-3 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.04)", color: "var(--muted)" }}>
          <span className="tabular-nums">{match.scoreUs} · {match.scoreThem}</span>
          <span style={{ color: match.result === "win" ? "var(--accent)" : "#f87171" }}>
            {match.result === "win" ? "胜" : "负"}
          </span>
          {match.opponent && <span>vs {match.opponent}</span>}
        </div>

        {/* Caption */}
        <p className="leading-loose"
          style={{ fontSize: "clamp(0.875rem,1.4vw,1rem)", color: "var(--text)", opacity: 0.82 }}>
          {match.caption}
        </p>

        {/* Players */}
        {match.players?.length ? (
          <p className="text-xs mt-5" style={{ color: "var(--muted)" }}>
            {match.players.join("　")}
            {match.mvp && (
              <span className="ml-3" style={{ color: "var(--accent)" }}>MVP · {match.mvp}</span>
            )}
          </p>
        ) : null}
      </div>
    </div>
  );

  const mediaSide = (
    <div className="entry-media w-full h-full overflow-hidden">
      <MediaPanel media={match.media} />
    </div>
  );

  return (
    // min-height slightly under viewport so the next entry peeks in at the bottom
    <article className="rl-entry relative flex" style={{ minHeight: "88vh" }}>

      <div className="w-1/2 h-full" style={{ minHeight: "88vh" }}>
        {isImgRight ? textSide : mediaSide}
      </div>
      <div className="w-1/2 h-full" style={{ minHeight: "88vh" }}>
        {isImgRight ? mediaSide : textSide}
      </div>

      {/* Vertical divider */}
      <div className="absolute inset-y-0 pointer-events-none"
        style={{ left: "50%", width: "1px", background: "var(--border)" }} />

      {/* Centre dot — positioning wrapper never GSAP-animated */}
      <div className="absolute pointer-events-none z-20"
        style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
        <div className="entry-dot">
          <div className="w-2.5 h-2.5 rounded-full" style={{
            background: "var(--accent)",
            boxShadow: "0 0 0 4px rgba(110,231,183,0.1), 0 0 12px rgba(110,231,183,0.4)",
          }} />
        </div>
      </div>
    </article>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function TimelineZigzag({ matches }: { matches: Match[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Kill existing triggers (handles React 19 Strict Mode double-invoke)
    ScrollTrigger.getAll().forEach(t => t.kill());

    const container = containerRef.current;
    if (!container || matches.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Wait one frame so the browser has finished layout before GSAP measures
    const raf = requestAnimationFrame(() => {
      const entries = Array.from(container.querySelectorAll<HTMLElement>(".rl-entry"));

      entries.forEach((entry, i) => {
        const media = entry.querySelector<HTMLElement>(".entry-media");
        const text  = entry.querySelector<HTMLElement>(".entry-text");
        const dot   = entry.querySelector<HTMLElement>(".entry-dot");

        if (!reduced) {
          // Set initial hidden states via GSAP (avoids CSS/transform conflicts)
          if (media) gsap.set(media, { clipPath: i % 2 === 0 ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)" });
          if (text)  gsap.set(text,  { autoAlpha: 0, y: 36 });
          if (dot)   gsap.set(dot,   { autoAlpha: 0, scale: 0 });
        }

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: entry,
            start: "top 82%",   // fires when entry top is 82% down the viewport
            once: true,         // no need to re-animate on scroll-back
          },
        });

        if (!reduced) {
          if (media) tl.to(media, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power2.inOut" }, 0);
          if (text)  tl.to(text,  { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" }, 0.2);
          if (dot)   tl.to(dot,   { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2.5)" }, 0.4);
        }
      });

      ScrollTrigger.refresh();
    });

    return () => {
      cancelAnimationFrame(raf);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [matches.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center py-32 text-sm"
        style={{ color: "var(--muted)" }}>
        还没有记录。把第一次打球的故事写下来吧。
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {matches.map((match, i) => (
        <EntryRow key={match.id} match={match} index={i} />
      ))}
    </div>
  );
}
