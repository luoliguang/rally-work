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
      <div className={rest.length > 0 ? "flex-[3] overflow-hidden" : "flex-1 overflow-hidden"}>
        {primary.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primary.url} alt="" loading="eager"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.85) saturate(0.88)" }} />
        ) : (
          <video src={primary.url} poster={primary.poster} preload="none" controls
            className="w-full h-full object-cover" />
        )}
      </div>
      {extras.length > 0 && (
        <div className="flex-1 flex gap-px overflow-hidden">
          {extras.map((m, i) => (
            <div key={i} className="relative flex-1 overflow-hidden">
              {m.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.thumb ?? m.url} alt="" loading="lazy"
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.68) saturate(0.7)" }} />
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

// ─── Single entry (100 vw × 100 svh) ─────────────────────────────────────────
function EntryPanel({ match, index }: { match: Match; index: number }) {
  const isImgRight = index % 2 === 0;
  const day   = match.date.slice(8, 10);
  const year  = match.date.slice(0, 4);
  const month = new Date(`${match.date}T00:00:00`).toLocaleDateString("zh-CN", { month: "long" });

  const textContent = (
    <div className="entry-text w-full h-full flex items-center justify-center"
      style={{ padding: "clamp(2rem, 5vw, 5rem)" }}>
      <div style={{ maxWidth: "26rem", width: "100%" }}>
        <div className="flex items-baseline gap-3 mb-5">
          <span className="font-thin tabular-nums leading-none"
            style={{ fontSize: "clamp(3.5rem,7vw,6rem)", color: "var(--accent)", opacity: 0.9 }}>
            {day}
          </span>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{month}</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              {year}{match.weekday ? ` · ${match.weekday}` : ""}
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-xs mb-6 px-3 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.04)", color: "var(--muted)" }}>
          <span className="tabular-nums">{match.scoreUs} · {match.scoreThem}</span>
          <span style={{ color: match.result === "win" ? "var(--accent)" : "#f87171" }}>
            {match.result === "win" ? "胜" : "负"}
          </span>
          {match.opponent && <span>vs {match.opponent}</span>}
        </div>

        <p className="leading-loose"
          style={{ fontSize: "clamp(0.875rem,1.4vw,1rem)", color: "var(--text)", opacity: 0.82 }}>
          {match.caption}
        </p>

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

  const mediaContent = (
    <div className="entry-media w-full h-full overflow-hidden">
      <MediaPanel media={match.media} />
    </div>
  );

  return (
    <section className="rl-panel relative flex flex-shrink-0"
      style={{ width: "100vw", height: "100svh" }}>
      <div className="w-1/2 h-full overflow-hidden">
        {isImgRight ? textContent : mediaContent}
      </div>
      <div className="w-1/2 h-full overflow-hidden">
        {isImgRight ? mediaContent : textContent}
      </div>

      {/* Divider */}
      <div className="absolute inset-y-0 pointer-events-none"
        style={{ left: "50%", width: "1px", background: "var(--border)" }} />

      {/* Centre dot — positioning wrapper never touched by GSAP */}
      <div className="absolute pointer-events-none z-20"
        style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
        <div className="entry-dot">
          <div className="w-3 h-3 rounded-full" style={{
            background: "var(--accent)",
            boxShadow: "0 0 0 4px rgba(110,231,183,0.12), 0 0 14px rgba(110,231,183,0.45)",
          }} />
        </div>
      </div>
    </section>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function TimelineHorizontal({ matches }: { matches: Match[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef   = useRef<HTMLDivElement>(null);
  const dotsRef    = useRef<HTMLDivElement>(null);
  const labelRef   = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Kill any leftover triggers first (handles React 19 Strict Mode double-invoke)
    ScrollTrigger.getAll().forEach(t => t.kill());

    const wrapper = wrapperRef.current;
    const track   = trackRef.current;
    if (!wrapper || !track || matches.length === 0) return;

    const n = matches.length;

    // ── Reveal helper ──────────────────────────────────────────────────────────
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function animateIn(section: HTMLElement, idx: number, delay = 0) {
      if (reduced) return;
      const media = section.querySelector<HTMLElement>(".entry-media");
      const text  = section.querySelector<HTMLElement>(".entry-text");
      const dot   = section.querySelector<HTMLElement>(".entry-dot");
      const tl = gsap.timeline({ delay });
      if (media) tl.to(media, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "power2.inOut" }, 0);
      if (text)  tl.to(text,  { autoAlpha: 1, y: 0, duration: 0.75, ease: "power2.out" }, 0.2);
      if (dot)   tl.to(dot,   { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2.5)" }, 0.4);
    }

    // ── HUD update ─────────────────────────────────────────────────────────────
    function updateHUD(progress: number) {
      const active = Math.round(progress * (n - 1));
      if (labelRef.current) labelRef.current.textContent = `${active + 1} / ${n}`;
      dotsRef.current?.querySelectorAll<HTMLElement>(".prog-dot").forEach((d, i) => {
        const on = i === active;
        d.style.background  = on ? "var(--accent)" : "var(--muted)";
        d.style.transform   = on ? "scale(1.6)"    : "scale(1)";
      });
    }

    // Use requestAnimationFrame so the browser has finished layout before GSAP measures anything
    const raf = requestAnimationFrame(() => {
      const sections = Array.from(track.querySelectorAll<HTMLElement>(".rl-panel"));
      const revealed = new Set<number>();

      // Set initial hidden states for all sections
      if (!reduced) {
        sections.forEach((sec, i) => {
          const media = sec.querySelector<HTMLElement>(".entry-media");
          const text  = sec.querySelector<HTMLElement>(".entry-text");
          const dot   = sec.querySelector<HTMLElement>(".entry-dot");
          if (media) gsap.set(media, { clipPath: i % 2 === 0 ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)" });
          if (text)  gsap.set(text,  { autoAlpha: 0, y: 32 });
          if (dot)   gsap.set(dot,   { autoAlpha: 0, scale: 0 });
        });
      }

      // First section animates in on page load
      animateIn(sections[0], 0, 0.5);
      revealed.add(0);
      updateHUD(0);

      // Single entry — no horizontal scroll needed
      if (n <= 1) return;

      const scrollDist = (n - 1) * window.innerWidth;

      // Drive the horizontal translation with vertical scroll
      gsap.to(track, {
        x: -scrollDist,
        ease: "none",
        scrollTrigger: {
          trigger: wrapper,
          pin:     true,
          scrub:   1,
          end:     () => `+=${scrollDist}`,
          snap: {
            snapTo:   1 / (n - 1),
            duration: { min: 0.3, max: 0.7 },
            ease:     "power2.inOut",
          },
          invalidateOnRefresh: true,
          onUpdate(self) {
            const idx = Math.round(self.progress * (n - 1));
            if (!revealed.has(idx)) {
              revealed.add(idx);
              animateIn(sections[idx], idx);
            }
            updateHUD(self.progress);
          },
        },
      });

      // Recalculate positions after pin spacer is inserted
      ScrollTrigger.refresh();
    });

    return () => {
      cancelAnimationFrame(raf);
      ScrollTrigger.getAll().forEach(t => t.kill());
      gsap.killTweensOf(track);
    };
  }, [matches.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm"
        style={{ height: "100svh", color: "var(--muted)" }}>
        还没有记录。把第一次打球的故事写下来吧。
      </div>
    );
  }

  return (
    // wrapper — gets pinned by ScrollTrigger; overflow:hidden hides off-screen panels
    <div ref={wrapperRef}
      style={{ height: "100svh", overflow: "hidden", position: "relative" }}>

      {/* track — translated horizontally by GSAP */}
      <div ref={trackRef}
        style={{ display: "flex", height: "100%", width: `${matches.length * 100}vw` }}>
        {matches.map((match, i) => (
          <EntryPanel key={match.id} match={match} index={i} />
        ))}
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30
                      flex flex-col items-center gap-3 pointer-events-none">
        <div ref={dotsRef} className="flex gap-2 items-center">
          {matches.map((_, i) => (
            <div key={i} className="prog-dot rounded-full"
              style={{ width: 6, height: 6, background: "var(--muted)",
                       transition: "background 0.3s, transform 0.3s" }} />
          ))}
        </div>
        <span ref={labelRef} className="text-xs tabular-nums tracking-widest"
          style={{ color: "var(--muted)" }}>
          1 / {matches.length}
        </span>
      </div>
    </div>
  );
}
