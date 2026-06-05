"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function HeroIntro({ totalMatches }: { totalMatches: number }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Respect prefers-reduced-motion
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set([headingRef.current, subRef.current, lineRef.current], { opacity: 1, y: 0 });
      return;
    }

    tl.fromTo(headingRef.current, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 1 })
      .fromTo(subRef.current,   { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.5")
      .fromTo(lineRef.current,  { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.6, transformOrigin: "left" }, "-=0.3");
  }, []);

  return (
    <header className="pt-24 pb-16">
      <h1
        ref={headingRef}
        className="text-5xl font-extralight tracking-widest uppercase mb-4"
        style={{ opacity: 0, color: "var(--text)", letterSpacing: "0.3em" }}
      >
        Rally
      </h1>

      <p
        ref={subRef}
        className="text-sm mb-8"
        style={{ opacity: 0, color: "var(--muted)" }}
      >
        在工厂的日子里，我们打过{totalMatches}场球。
      </p>

      <div
        ref={lineRef}
        className="h-px w-12"
        style={{ opacity: 0, background: "var(--accent)" }}
      />
    </header>
  );
}
