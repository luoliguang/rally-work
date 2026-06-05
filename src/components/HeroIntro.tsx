"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function HeroIntro({ totalMatches }: { totalMatches: number }) {
  const rootRef   = useRef<HTMLElement>(null);
  const titleRef  = useRef<HTMLHeadingElement>(null);
  const subRef    = useRef<HTMLParagraphElement>(null);
  const lineRef   = useRef<HTMLDivElement>(null);
  const arrowRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const chars = titleRef.current?.querySelectorAll<HTMLSpanElement>(".char");

    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(chars ?? [], {
        opacity: 0, y: 40, rotateX: -40,
        stagger: 0.08, duration: 0.8,
      })
      .from(subRef.current, { opacity: 0, y: 16, duration: 0.6 }, "-=0.3")
      .from(lineRef.current, { scaleX: 0, duration: 0.5, transformOrigin: "left" }, "-=0.2")
      .from(arrowRef.current, { opacity: 0, y: -10, duration: 0.5 }, "-=0.1");
  }, []);

  const title = "Rally";

  return (
    <section
      ref={rootRef}
      className="relative flex flex-col items-center justify-center"
      style={{ height: "100svh", width: "100vw" }}
    >
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          opacity: 0.4,
        }}
      />

      <div className="relative z-10 text-center px-6">
        {/* Perspective wrapper for char animation */}
        <div style={{ perspective: "600px" }}>
          <h1
            ref={titleRef}
            className="font-extralight tracking-[0.35em] uppercase select-none"
            style={{ fontSize: "clamp(3rem, 12vw, 9rem)", color: "var(--text)" }}
          >
            {title.split("").map((c, i) => (
              <span key={i} className="char inline-block">{c}</span>
            ))}
          </h1>
        </div>

        <p
          ref={subRef}
          className="mt-4 text-sm tracking-widest uppercase"
          style={{ color: "var(--muted)", opacity: 0 }}
        >
          在工厂的日子里，我们打过&nbsp;
          <span style={{ color: "var(--accent)" }}>{totalMatches}</span>
          &nbsp;场球
        </p>

        <div
          ref={lineRef}
          className="mx-auto mt-8 h-px w-16"
          style={{ background: "var(--accent)", opacity: 0 }}
        />
      </div>

      {/* Scroll hint */}
      <div
        ref={arrowRef}
        className="absolute bottom-10 flex flex-col items-center gap-2"
        style={{ opacity: 0 }}
      >
        <span className="text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
          向下滚动
        </span>
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
          <path
            d="M8 2 L8 22 M2 16 L8 22 L14 16"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: "var(--accent)" }}
          />
        </svg>
      </div>
    </section>
  );
}
