"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Match } from "@/lib/types";
import { MemoryEntry } from "./MemoryEntry";

gsap.registerPlugin(ScrollTrigger);

export function TimelineScroll({ matches }: { matches: Match[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll<HTMLElement>(".memory-card");

    cards.forEach((card) => {
      gsap.to(card, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  if (matches.length === 0) {
    return (
      <p className="text-center py-24 text-sm" style={{ color: "var(--muted)" }}>
        还没有记录。把第一次打球的故事写下来吧。
      </p>
    );
  }

  return (
    <div ref={containerRef} className="relative pl-8">
      {/* Vertical spine */}
      <div className="timeline-spine" />

      <div className="space-y-20 pb-24">
        {matches.map((match, i) => (
          <div key={match.id} className="relative">
            {/* Dot on the spine */}
            <div
              className="absolute -left-8 top-4 w-2 h-2 rounded-full border"
              style={{
                borderColor: "var(--accent)",
                background: "var(--bg)",
                transform: "translateX(calc(-50% + 0.5px))",
              }}
            />
            <MemoryEntry match={match} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
