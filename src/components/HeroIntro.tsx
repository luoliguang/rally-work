"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function HeroIntro({ totalMatches }: { totalMatches: number }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const metaRef  = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chars   = titleRef.current?.querySelectorAll<HTMLSpanElement>(".char");

    if (reduced) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // 1. 字母逐个飞入（带模糊 + 透视翻转）
    tl.from(chars ?? [], {
      opacity: 0, y: 50, scale: 1.3, filter: "blur(10px)", rotateX: -45,
      stagger: 0.07, duration: 0.9,
    })

    // 2. 飞入完成后，字母做轻微交错浮动（无限循环）
    .add(() => {
      chars?.forEach((c, i) => {
        gsap.to(c, {
          y: i % 2 === 0 ? -6 : 6,
          duration: 1.8 + i * 0.12,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.08,
        });
      });
    })

    // 3. 引言 + 元信息依次出现
    .from(quoteRef.current, { opacity: 0, y: 20, duration: 0.7 }, "-=0.5")
    .from(metaRef.current,  { opacity: 0, y: 12, duration: 0.5 }, "-=0.3")
    .from(arrowRef.current, { opacity: 0, y: -8, duration: 0.5 }, "-=0.2");
  }, []);

  return (
    <section
      className="relative flex flex-col items-center justify-center"
      style={{ height: "100svh", width: "100vw" }}
    >
      {/* 网格背景 */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage:
          "linear-gradient(var(--border) 1px,transparent 1px)," +
          "linear-gradient(90deg,var(--border) 1px,transparent 1px)",
        backgroundSize: "80px 80px",
        opacity: 0.3,
      }} />

      <div className="relative z-10 flex flex-col items-center gap-10 px-8 w-full">

        {/* ── RALLY 标题：white-space:nowrap 保证单行 ── */}
        <div style={{ perspective: "700px" }}>
          <h1
            ref={titleRef}
            className="font-extralight uppercase select-none"
            style={{
              fontSize: "clamp(2.8rem, 9vw, 7.5rem)",
              letterSpacing: "0.28em",
              whiteSpace: "nowrap",
              color: "var(--text)",
            }}
          >
            {"Rally".split("").map((c, i) => (
              <span key={i} className="char inline-block">{c}</span>
            ))}
          </h1>
        </div>

        {/* ── 引言 ── */}
        <div
          ref={quoteRef}
          className="text-center leading-loose"
          style={{ maxWidth: "34rem", color: "var(--muted)", fontSize: "clamp(0.8rem, 1.4vw, 0.92rem)" }}
        >
          <p>工厂的日子忙碌，时间总不够用。</p>
          <p className="mt-1">但我们总能挤出那吃饭的半个小时。</p>
          <p className="mt-3" style={{ color: "var(--accent)", opacity: 0.9 }}>
            能在这里相遇，一起挥拍，倍感荣幸。愿这份记录能让我们更珍惜那短暂的相聚。
          </p>
        </div>

        {/* ── 场次 + 装饰线 ── */}
        <div ref={metaRef} className="flex flex-col items-center gap-4">
          <p className="text-xs tracking-widest" style={{ color: "var(--muted)" }}>
            一共留下了&ensp;
            <span style={{ color: "var(--accent)", fontSize: "1rem" }}>{totalMatches}</span>
            &ensp;场记录
          </p>
          <div className="h-px w-10" style={{ background: "var(--accent)" }} />
        </div>
      </div>

      {/* ── 向下滚动提示 ── */}
      <div
        ref={arrowRef}
        className="absolute bottom-8 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="text-xs tracking-widest" style={{ color: "var(--muted)" }}>
          向下滚动
        </span>
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
          <path d="M8 2L8 22M2 16L8 22L14 16"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: "var(--accent)" }} />
        </svg>
      </div>
    </section>
  );
}
