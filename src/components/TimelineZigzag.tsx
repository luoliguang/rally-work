"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Match, Media } from "@/lib/types";
import { ReactionBar } from "./ReactionBar";
import { Lightbox } from "./Lightbox";
import { timelineConfig as TL } from "@/config/timeline";
import { mediaUrl } from "@/lib/mediaUrl";

gsap.registerPlugin(ScrollTrigger);

// 生成一条穿过所有圆点的「不规则手绘感」路径。
// 坐标系：viewBox 为 0 0 100 (n*100)，第 i 个圆点位于 (50, i*100+50)。
// 相邻圆点之间用带轻微抖动的两段贝塞尔曲线连接，形成自然的左右摆动。
function seededJitter(seed: number): number {
  const x = Math.sin(seed * 99.13) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1; // -1 ~ 1，确定性（每次渲染一致）
}

// 用「真实像素」坐标生成路径：w/h 为容器宽高，圆点在 (w/2, (i+0.5)*h/n)。
// 像素坐标系下 getTotalLength / 虚线 / 箭头定位全部同一单位，不会错位。
function buildConnectorPath(n: number, w: number, h: number): string {
  if (n < 2 || w === 0) return "";
  const cx  = w / 2;
  const eh  = h / n;
  const amp = Math.min(w * TL.track.wobbleRatio, TL.track.wobbleMax); // 摆动幅度（像素）
  const dotY = (i: number) => i * eh + eh / 2;

  let d = `M ${cx} ${dotY(0)}`;
  for (let i = 1; i < n; i++) {
    const y0 = dotY(i - 1);
    const y1 = dotY(i);
    const midY = (y0 + y1) / 2;
    const j1 = seededJitter(i * 3 + 1) * amp;
    const j2 = seededJitter(i * 3 + 2) * amp;
    d += ` Q ${cx + j1} ${y0 + eh * 0.25}, ${cx + j1 * 0.4} ${midY}`;
    d += ` Q ${cx - j2} ${y1 - eh * 0.25}, ${cx} ${y1}`;
  }
  return d;
}

// ─── Media panel ──────────────────────────────────────────────────────────────
// Uses absolute inset-0 so it always fills its container exactly,
// regardless of whether the parent uses height or min-height.
function MediaPanel({ media }: { media: Media[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (media.length === 0) {
    return <div className="absolute inset-0" style={{ background: "var(--surface)" }} />;
  }

  const [primary, ...rest] = media;
  const strips  = rest.slice(0, 3);           // 副图最多显示 3 张
  const hidden  = rest.length - strips.length; // 超出的数量，显示在 +N 角标

  return (
    <>
      <div className="absolute inset-0 flex flex-col gap-px">

        {/* ── 主图 ── */}
        <div
          className={`${strips.length > 0 ? "flex-[3]" : "flex-1"} relative overflow-hidden media-group`}
          style={{ cursor: primary.type === "image" ? "zoom-in" : undefined }}
          onClick={() => primary.type === "image" ? setLightboxIndex(0) : undefined}
        >
          {primary.type === "image" ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(primary.url)} alt="" loading="lazy" className="primary-img" />
              <div className="zoom-hint-overlay">
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="6.5" cy="6.5" r="4.5" stroke="white" strokeWidth="1.5"/>
                    <path d="M10 10L14 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M4.5 6.5H8.5M6.5 4.5V8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <video src={mediaUrl(primary.url)} poster={mediaUrl(primary.poster)}
              preload="none" controls className="w-full h-full object-cover" />
          )}
        </div>

        {/* ── 副图条（最多 3 格）── */}
        {strips.length > 0 && (
          <div className="flex-1 flex gap-px overflow-hidden">
            {strips.map((m, i) => {
              const isLast   = i === strips.length - 1;
              const showMore = isLast && hidden > 0;
              return (
                <div
                  key={i}
                  className="relative flex-1 overflow-hidden media-group"
                  style={{ cursor: "zoom-in" }}
                  onClick={() => setLightboxIndex(i + 1)}
                >
                  {m.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(m.thumb ?? m.url)} alt="" loading="lazy" className="secondary-img" />
                  ) : (
                    <>
                      <video src={mediaUrl(m.url)} poster={mediaUrl(m.poster)}
                        preload="none" controls className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(0,0,0,0.5)" }}>
                          <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
                            <path d="M1 1l8 5-8 5V1z" />
                          </svg>
                        </div>
                      </div>
                    </>
                  )}

                  {/* +N 角标：点击进灯箱 */}
                  {showMore ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                      style={{ background: "rgba(0,0,0,0.58)" }}>
                      <span className="text-white font-light" style={{ fontSize: "1.4rem", lineHeight: 1 }}>+{hidden}</span>
                      <span className="text-white" style={{ fontSize: "0.6rem", opacity: 0.6, letterSpacing: "0.1em" }}>查看全部</span>
                    </div>
                  ) : (
                    /* 放大镜提示（无 +N 时显示） */
                    <div className="zoom-hint-overlay">
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                          <circle cx="6.5" cy="6.5" r="4.5" stroke="white" strokeWidth="1.5"/>
                          <path d="M10 10L14 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M4.5 6.5H8.5M6.5 4.5V8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          media={media}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
          resolveUrl={mediaUrl}
        />
      )}
    </>
  );
}

// ─── Single entry row ─────────────────────────────────────────────────────────
function EntryRow({ match, index }: { match: Match; index: number }) {
  const isImgRight = index % 2 === 0;
  const day   = match.date.slice(8, 10);
  const year  = match.date.slice(0, 4);
  const month = new Date(`${match.date}T00:00:00`).toLocaleDateString("zh-CN", { month: "long" });

  // ── Auto-derive MVP and result from playerScores when available ─────────────
  // players[0] is assumed to be the recorder; if their score is highest → win.
  const sortedScores = match.playerScores
    ? [...match.playerScores].sort((a, b) => b.score - a.score)
    : [];
  const autoMvp    = sortedScores[0]?.player;
  const displayMvp = match.mvp ?? autoMvp;   // manual override takes priority

  const recorderName   = match.players?.[0];
  const recorderScore  = sortedScores.find(s => s.player === recorderName)?.score;
  const autoResult     = recorderScore !== undefined
    ? (recorderScore === sortedScores[0]?.score ? "win" : "loss") as "win" | "loss"
    : match.result;
  const displayResult  = match.playerScores?.length ? autoResult : match.result;

  const textSide = (
    <div className="entry-text flex items-center justify-center w-full h-full"
      style={{ padding: "clamp(2rem, 4vw, 4rem)" }}>
      {/* 加大 maxWidth，给 caption 更多横向空间，减少奇怪换行 */}
      <div style={{ maxWidth: "30rem", width: "100%" }}>

        {/* Date */}
        <div className="flex items-baseline gap-3 mb-6">
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

        {/* Score — two layouts depending on 2-player vs multi-player */}
        <div className="mb-7">
          {match.playerScores?.length ? (
            // ── Multi-player: each person's total score ──────────────────────
            <div className="flex flex-wrap gap-2">
              {[...match.playerScores]
                .sort((a, b) => b.score - a.score)
                .map((ps, i) => {
                  const isTop = i === 0;
                  return (
                    <div
                      key={ps.player}
                      className="flex items-center gap-2 text-xs rounded-full"
                      style={{
                        padding: "6px 14px",   /* 明确内边距，避免文字紧贴边框 */
                        background: isTop ? "rgba(110,231,183,0.1)" : "rgba(255,255,255,0.05)",
                        color: isTop ? "var(--accent)" : "var(--muted)",
                        border: `1px solid ${isTop ? "rgba(110,231,183,0.25)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      <span>{ps.player}</span>
                      <span className="tabular-nums font-medium">{ps.score}</span>
                      {isTop && <span style={{ opacity: 0.5 }}>↑</span>}
                    </div>
                  );
                })}
            </div>
          ) : (
            // ── 2-player: us vs them ─────────────────────────────────────────
            <div className="inline-flex items-center gap-2 text-xs rounded-full"
              style={{
                padding: "6px 14px",
                background: "rgba(255,255,255,0.05)",
                color: "var(--muted)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
              <span className="tabular-nums">{match.scoreUs} · {match.scoreThem}</span>
              <span style={{ color: displayResult === "win" ? "var(--accent)" : "#f87171" }}>
                {displayResult === "win" ? "胜" : "负"}
              </span>
              {match.opponent && <span>vs {match.opponent}</span>}
            </div>
          )}
        </div>

        {/* Caption — 行高从 leading-loose(2.0) 降到 1.85，减少行间堆叠感 */}
        <p style={{
          fontSize: "clamp(0.875rem, 1.4vw, 1rem)",
          color: "var(--text)",
          opacity: 0.82,
          lineHeight: 1.85,
        }}>
          {match.caption}
        </p>

        {/* Players + MVP */}
        {match.players?.length ? (
          <div className="mt-6 flex flex-col gap-2">
            <p className="text-xs tracking-wide" style={{ color: "var(--muted)" }}>
              {match.players.join("　")}
            </p>
            {displayMvp && (
              <p className="text-xs" style={{ color: "var(--accent)" }}>
                MVP · {displayMvp}
              </p>
            )}
          </div>
        ) : null}

        {/* 表情反应 */}
        <ReactionBar matchId={match.id} />
      </div>
    </div>
  );

  // `relative` on entry-media gives MediaPanel's `absolute inset-0` a positioning root
  const mediaSide = (
    <div className="entry-media relative w-full h-full overflow-hidden">
      <MediaPanel media={match.media} />
    </div>
  );

  return (
    // 手机：上下堆叠（图片在上、文字在下），自然高度
    // 桌面：左右分栏、满屏高，按 index 交替左右（rl-entry 的高度由 CSS 媒体查询控制）
    <article className="rl-entry relative flex flex-col md:flex-row">

      {/* 图片：手机永远在上（order-1）；桌面按交替排布 */}
      <div className={`rl-media-wrap w-full md:w-1/2 overflow-hidden order-1 ${isImgRight ? "md:order-2" : "md:order-1"}`}>
        {mediaSide}
      </div>

      {/* 文字：手机在下（order-2）；桌面按交替排布 */}
      <div className={`w-full md:w-1/2 md:h-full overflow-hidden order-2 ${isImgRight ? "md:order-1" : "md:order-2"}`}>
        {textSide}
      </div>

      {/* 圆点：仅桌面显示（z-20，盖在虚线之上） */}
      <div className="hidden md:block absolute pointer-events-none z-20"
        style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
        <div className="entry-dot">
          <div className="rounded-full" style={{
            width: TL.dot.size, height: TL.dot.size,
            background: TL.dot.color,
            boxShadow: TL.dot.glow,
          }} />
        </div>
      </div>
    </article>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function TimelineZigzag({ matches }: { matches: Match[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const snakeRef     = useRef<SVGPathElement>(null);
  const arrowRef     = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 }); // 容器像素尺寸，路径据此用真实坐标绘制

  // 测量容器尺寸（挂载 + 窗口变化时），让 SVG 用真实像素坐标系
  useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (el) setDims({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [matches.length]);

  // ── 滚动驱动的「蛇形」线段 + 箭头 ───────────────────────────────────────────
  useEffect(() => {
    if (matches.length < 2 || dims.w === 0) return;
    if (!window.matchMedia(`(min-width: ${TL.breakpoint}px)`).matches) return; // 仅桌面

    const container = containerRef.current;
    const snake     = snakeRef.current;
    const arrow     = arrowRef.current;
    if (!container || !snake || !arrow) return;

    const n = matches.length;
    const total    = snake.getTotalLength();     // 像素长度（viewBox = 真实像素）
    const snakeLen = total * TL.snake.lengthRatio; // 蛇身最大长度
    const GAP      = total * 2;                  // 间隔远大于路径长，杜绝虚线绕回产生「幽灵段」

    let raf = 0;
    let lastY = window.scrollY;
    let dir   = 1;                               // 1=向下，-1=向上

    const render = () => {
      raf = 0;
      const rect = container.getBoundingClientRect();
      const eh   = rect.height / n;
      const firstDotTop = rect.top + eh / 2;     // 第一个圆点距视口顶部
      const span = (n - 1) * eh || 1;
      let p = (window.innerHeight * TL.progressAnchor - firstDotTop) / span;
      p = Math.max(0, Math.min(1, p));

      // 蛇头领跑：head 从 0（第一个圆点）走到 total（最后一个圆点）
      const head = p * total;
      const vis  = Math.min(snakeLen, head);     // 蛇身从 0 长到 snakeLen，再保持
      snake.style.strokeDasharray  = `${vis} ${GAP}`;
      snake.style.strokeDashoffset = `${-(head - vis)}`;

      // 蛇头（箭头）位置 —— 像素坐标系下 getPointAtLength 直接就是像素
      const pt  = snake.getPointAtLength(head);
      const pt2 = snake.getPointAtLength(Math.min(total, head + 1));
      let angle = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
      if (TL.arrow.followScrollDirection && dir < 0) angle += 180; // 向上滚 → 箭头反向朝上
      arrow.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%) rotate(${angle}deg)`;
      arrow.style.opacity = p < 0.999 ? "1" : "0";
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) dir = y > lastY ? 1 : -1;
      lastY = y;
      if (!raf) raf = requestAnimationFrame(render);
    };

    render();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [matches.length, dims]);

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
  }, [matches.length]);

  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center py-32 text-sm"
        style={{ color: "var(--muted)" }}>
        还没有记录。把第一次打球的故事写下来吧。
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {matches.map((match, i) => (
        <EntryRow key={match.id} match={match} index={i} />
      ))}

      {/* 不规则虚线 + 滚动蛇形线段（仅桌面显示） */}
      {matches.length > 1 && dims.w > 0 && (() => {
        const d = buildConnectorPath(matches.length, dims.w, dims.h);
        return (
          <>
            <svg
              className="hidden md:block"
              aria-hidden
              viewBox={`0 0 ${dims.w} ${dims.h}`}
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                zIndex: 15, pointerEvents: "none",
              }}
            >
              {/* 底层：静态不规则虚线（轨道） */}
              <path
                d={d}
                fill="none"
                stroke={TL.track.color}
                strokeWidth={TL.track.width}
                strokeDasharray={TL.track.dash}
                strokeLinecap="round"
              />
              {/* 上层：随滚动前移的发光蛇身 */}
              <path
                ref={snakeRef}
                d={d}
                fill="none"
                stroke={TL.snake.color}
                strokeWidth={TL.snake.width}
                strokeLinecap="round"
                style={{ filter: TL.snake.glow }}
              />
            </svg>

            {/* 蛇头：箭头，随滚动沿路径下窜 */}
            <div
              ref={arrowRef}
              className="hidden md:block"
              style={{
                position: "absolute", top: 0, left: 0, zIndex: 16,
                pointerEvents: "none", opacity: 0, willChange: "transform",
                filter: TL.arrow.glow,
              }}
            >
              <svg width={TL.arrow.size} height={TL.arrow.size} viewBox="0 0 22 22" fill="none">
                {/* 默认指向右（+X），由 rotate 跟随路径切线方向 */}
                <path d="M5 5 L16 11 L5 17 Z" fill={TL.arrow.color} />
              </svg>
            </div>
          </>
        );
      })()}
    </div>
  );
}
