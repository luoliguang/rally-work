"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const STRIP_COUNT = 9; // 奇数让中间那条居中，视觉更平衡

export function HeroIntro({ totalMatches }: { totalMatches: number }) {
  const titleWrapRef  = useRef<HTMLDivElement>(null);
  const stripsRef     = useRef<HTMLDivElement>(null);
  const quoteRef      = useRef<HTMLDivElement>(null);
  const metaRef       = useRef<HTMLDivElement>(null);
  const arrowRef      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const strips = Array.from(stripsRef.current?.children ?? []) as HTMLElement[];

    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

    // 遮板初始状态：完全覆盖文字
    gsap.set(strips, { x: "0%" });

    // ── 核心效果：遮板随机顺序、向两侧划开 ──────────────────────────────────
    // 奇数条向右、偶数条向左 → 划开瞬间产生黑白交错的参差感
    tl.to(strips, {
      x: (i: number) => (i % 2 === 0 ? "105%" : "-105%"),
      duration: 0.65,
      stagger: {
        each: 0.06,
        from: "random" as const,
        ease: "none",
      },
    }, 0.2)

    // 划开完成后：下方内容依次出现
    .from(quoteRef.current, { opacity: 0, y: 18, duration: 0.7 }, "-=0.2")
    .from(metaRef.current,  { opacity: 0, y: 10, duration: 0.5 }, "-=0.35")
    .from(arrowRef.current, { opacity: 0, duration: 0.45 }, "-=0.25")

    // ── 箭头持续弹跳 + 文字缓慢闪烁（无限循环） ────────────────────────────
    .add(() => {
      const arrow = arrowRef.current;
      if (!arrow) return;
      // 箭头 SVG 上下弹跳
      gsap.to(arrow.querySelector("svg"), {
        y: 7,
        duration: 0.75,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      // 文字缓慢呼吸闪烁
      gsap.to(arrow.querySelector("span"), {
        opacity: 0.25,
        duration: 1.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    });
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

        {/* ── RALLY 标题 + 遮板层 ──────────────────────────────────────────── */}
        <div ref={titleWrapRef} className="relative select-none" style={{ display: "inline-block" }}>
          <h1
            className="font-extralight uppercase"
            style={{
              fontSize: "clamp(2.8rem, 9vw, 7.5rem)",
              letterSpacing: "0.28em",
              whiteSpace: "nowrap",
              color: "var(--text)",
            }}
          >
            Rally
          </h1>

          {/* 遮板容器：与标题完全重叠，pointer-events 关闭 */}
          <div
            ref={stripsRef}
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            {Array.from({ length: STRIP_COUNT }, (_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top: `${(i / STRIP_COUNT) * 100}%`,
                  width: "100%",
                  height: `${(1 / STRIP_COUNT) * 100 + 0.5}%`, // +0.5% 防止缝隙
                  background: "var(--bg)",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── 引言 ─────────────────────────────────────────────────────────── */}
        <div
          ref={quoteRef}
          className="text-center leading-loose"
          style={{
            maxWidth: "34rem",
            color: "var(--muted)",
            fontSize: "clamp(0.8rem, 1.4vw, 0.92rem)",
          }}
        >
          <p>工厂的日子忙碌，时间总是不够用。</p>
          <p className="mt-1">但我们总能找到彼此，挤出那一两个小时来这里。</p>
          <p className="mt-3" style={{ color: "var(--accent)", opacity: 0.9 }}>
            能在这里相遇，一起挥拍，很难得。
          </p>
        </div>

        {/* ── 场次 + 装饰线 ────────────────────────────────────────────────── */}
        <div ref={metaRef} className="flex flex-col items-center gap-4">
          <p className="text-xs tracking-widest" style={{ color: "var(--muted)" }}>
            一共留下了&ensp;
            <span style={{ color: "var(--accent)", fontSize: "1rem" }}>{totalMatches}</span>
            &ensp;场记录
          </p>
          <div className="h-px w-10" style={{ background: "var(--accent)" }} />
        </div>
      </div>

      {/* ── 向下滚动提示 ─────────────────────────────────────────────────── */}
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
