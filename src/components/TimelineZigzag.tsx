"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Match, Media } from "@/lib/types";

gsap.registerPlugin(ScrollTrigger);

// ─── SVG winding path ──────────────────────────────────────────────────────────
// viewBox: "0 0 100 {count*100}". Entry i has its dot at (50, i*100+50).
// Consecutive dots are joined with alternating S-curves.
function buildSpinePath(count: number): string {
  if (count === 0) return "M 50 0";
  const SWING = 20;

  let d = `M 50 0 L 50 50`; // lead-in to first dot

  for (let i = 0; i < count - 1; i++) {
    const fy = i * 100 + 50;
    const ty = (i + 1) * 100 + 50;
    const s  = i % 2 === 0 ? 1 : -1;
    d += ` C ${50 + s * SWING} ${fy + 30}, ${50 - s * SWING} ${ty - 30}, 50 ${ty}`;
  }

  d += ` L 50 ${count * 100}`; // tail
  return d;
}

// ─── Media panel ───────────────────────────────────────────────────────────────
// Handles 1 primary (full panel) + any number of secondary thumbnails in a strip.
function MediaPanel({ media }: { media: Media[] }) {
  if (media.length === 0) {
    return <div className="w-full h-full" style={{ background: "var(--surface)" }} />;
  }

  const [primary, ...rest] = media;
  const extras = rest.slice(0, 3);      // show at most 3 extras
  const overflow = rest.length - extras.length; // count hidden

  return (
    <div className="w-full h-full flex flex-col gap-0.5">
      {/* Primary */}
      <div className={rest.length > 0 ? "flex-[3] overflow-hidden" : "flex-1 overflow-hidden"}>
        {primary.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primary.url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.85) saturate(0.88)" }}
          />
        ) : (
          <video
            src={primary.url}
            poster={primary.poster}
            preload="none"
            controls
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Secondary strip */}
      {extras.length > 0 && (
        <div className="flex-1 flex gap-0.5 overflow-hidden">
          {extras.map((m, i) => (
            <div key={i} className="relative flex-1 overflow-hidden">
              {m.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.thumb ?? m.url}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.70) saturate(0.7)" }}
                />
              ) : (
                <video
                  src={m.url}
                  poster={m.poster}
                  preload="none"
                  controls
                  className="w-full h-full object-cover"
                />
              )}
              {/* Video badge */}
              {m.type === "video" && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.55)" }}
                  >
                    <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                      <path d="M1 1l10 6-10 6V1z" fill="white" />
                    </svg>
                  </div>
                </div>
              )}
              {/* "+N more" badge on the last visible extra */}
              {overflow > 0 && i === extras.length - 1 && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.55)" }}
                >
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

// ─── Single entry section ──────────────────────────────────────────────────────
function EntrySection({ match, index }: { match: Match; index: number }) {
  const isImgRight = index % 2 === 0; // even → image right, text left

  const day   = match.date.slice(8, 10);
  const year  = match.date.slice(0, 4);
  const month = new Date(`${match.date}T00:00:00`).toLocaleDateString("zh-CN", { month: "long" });

  const textContent = (
    <div
      className="entry-text w-full h-full flex items-center justify-center"
      style={{ padding: "clamp(2rem, 5vw, 5rem)" }}
    >
      <div style={{ maxWidth: "26rem", width: "100%" }}>
        {/* Big day number */}
        <div className="flex items-baseline gap-3 mb-5">
          <span
            className="font-thin tabular-nums leading-none"
            style={{ fontSize: "clamp(3.5rem, 7vw, 6rem)", color: "var(--accent)", opacity: 0.9 }}
          >
            {day}
          </span>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{month}</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              {year}{match.weekday ? ` · ${match.weekday}` : ""}
            </div>
          </div>
        </div>

        {/* Score pill — subtle */}
        <div
          className="inline-flex items-center gap-2 text-xs mb-6 px-3 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.04)", color: "var(--muted)" }}
        >
          <span className="tabular-nums">{match.scoreUs}·{match.scoreThem}</span>
          <span style={{ color: match.result === "win" ? "var(--accent)" : "#f87171" }}>
            {match.result === "win" ? "胜" : "负"}
          </span>
          {match.opponent && (
            <span>vs {match.opponent}</span>
          )}
        </div>

        {/* Caption */}
        <p
          className="leading-loose"
          style={{
            fontSize: "clamp(0.875rem, 1.4vw, 1rem)",
            color: "var(--text)",
            opacity: 0.82,
          }}
        >
          {match.caption}
        </p>

        {/* Teammates */}
        {match.players?.length ? (
          <p className="text-xs mt-5" style={{ color: "var(--muted)" }}>
            {match.players.join("　")}
            {match.mvp ? <span className="ml-3" style={{ color: "var(--accent)" }}>MVP · {match.mvp}</span> : null}
          </p>
        ) : null}
      </div>
    </div>
  );

  const mediaContent = (
    <div className="entry-media w-full h-full overflow-hidden">
      <MediaPanel media={match.media} />
    </div>
  );

  return (
    <section
      className="entry-section relative flex"
      data-index={index}
      style={{ height: "100svh", width: "100vw" }}
    >
      {/* Left half */}
      <div className="w-1/2 h-full overflow-hidden">
        {isImgRight ? textContent : mediaContent}
      </div>

      {/* Right half */}
      <div className="w-1/2 h-full overflow-hidden">
        {isImgRight ? mediaContent : textContent}
      </div>

      {/* Center vertical line */}
      <div
        className="absolute inset-y-0 pointer-events-none"
        style={{ left: "50%", width: "1px", background: "var(--border)" }}
      />

      {/* Dot — positioning wrapper (not animated) + inner target (GSAP animates) */}
      <div
        className="absolute z-20 pointer-events-none"
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
      >
        <div className="entry-dot">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              background: "var(--accent)",
              boxShadow: "0 0 0 4px rgba(110,231,183,0.12), 0 0 14px rgba(110,231,183,0.45)",
            }}
          />
        </div>
      </div>
    </section>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function TimelineZigzag({ matches }: { matches: Match[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    root.querySelectorAll<HTMLElement>(".entry-section").forEach((section, i) => {
      const media = section.querySelector<HTMLElement>(".entry-media");
      const text  = section.querySelector<HTMLElement>(".entry-text");
      const dot   = section.querySelector<HTMLElement>(".entry-dot");
      const isImgRight = i % 2 === 0;

      if (reduced) return; // leave everything visible as-is

      // ── Set initial hidden states (pure GSAP, no CSS class conflicts) ────────
      if (media) {
        gsap.set(media, {
          clipPath: isImgRight ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)",
        });
      }
      if (text)  gsap.set(text,  { autoAlpha: 0, y: 36 });
      if (dot)   gsap.set(dot,   { autoAlpha: 0, scale: 0 });

      // ── Animate in on scroll ─────────────────────────────────────────────────
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          once: true,
        },
      });

      if (media) {
        tl.to(media, {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.2,
          ease: "power3.inOut",
        }, 0);
      }

      if (text) {
        tl.to(text, {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
        }, 0.3);
      }

      if (dot) {
        tl.to(dot, {
          autoAlpha: 1,
          scale: 1,
          duration: 0.5,
          ease: "back.out(2)",
        }, 0.55);
      }
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  if (matches.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm"
        style={{ height: "100svh", color: "var(--muted)" }}
      >
        还没有记录。把第一次打球的故事写下来吧。
      </div>
    );
  }

  const spinePath = buildSpinePath(matches.length);

  return (
    <div ref={containerRef} className="relative">
      {/* ── Winding SVG spine ───────────────────────────────────────────────── */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 100 ${matches.length * 100}`}
        preserveAspectRatio="none"
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {/* Soft glow layer */}
        <path d={spinePath} fill="none" stroke="rgba(110,231,183,0.10)" strokeWidth="6" />
        {/* Hair-line */}
        <path d={spinePath} fill="none" stroke="rgba(110,231,183,0.25)" strokeWidth="0.6" strokeLinecap="round" />
      </svg>

      {/* ── Entry sections ────────────────────────────────────────────────────── */}
      {matches.map((match, i) => (
        <EntrySection key={match.id} match={match} index={i} />
      ))}
    </div>
  );
}
