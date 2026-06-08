"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Media } from "@/lib/types";

interface LightboxProps {
  media: Media[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
  /** 将原始 URL 转换为可访问的地址，默认直接返回原值 */
  resolveUrl?: (url?: string) => string;
}

const identity = (url?: string) => url ?? "";

export function Lightbox({
  media, index, onClose, onChange, resolveUrl = identity,
}: LightboxProps) {
  const [closing, setClosing] = useState(false);
  const current = media[index];
  const hasPrev = index > 0;
  const hasNext = index < media.length - 1;

  // 下滑手势追踪
  const swipeStartY = useRef<number | null>(null);
  const swipeStartX = useRef<number | null>(null);

  // 带动画的关闭
  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), 200);
  }, [closing, onClose]);

  // 下滑手势：纵向位移 > 60px 且大于横向位移时关闭
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    swipeStartY.current = e.touches[0].clientY;
    swipeStartX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (swipeStartY.current === null || swipeStartX.current === null) return;
    const dy = e.changedTouches[0].clientY - swipeStartY.current;
    const dx = Math.abs(e.changedTouches[0].clientX - swipeStartX.current);
    swipeStartY.current = null;
    swipeStartX.current = null;
    if (dy > 60 && dy > dx) handleClose();
  }, [handleClose]);

  // 锁定 body 滚动
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // 键盘导航
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")                  handleClose();
      if (e.key === "ArrowLeft"  && hasPrev)   onChange(index - 1);
      if (e.key === "ArrowRight" && hasNext)   onChange(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, hasPrev, hasNext, handleClose, onChange]);

  const navBtnStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    [side]: 12, top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "50%", width: 44, height: 44,
    cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "background 0.15s",
    touchAction: "manipulation",   // 消除移动端 300ms 延迟
    zIndex: 1,
  });

  const thumbSrc = (m: Media) =>
    m.type === "image"
      ? resolveUrl((m as { thumb?: string }).thumb ?? m.url)
      : resolveUrl((m as { poster?: string }).poster);

  const out = closing ? "lb-out" : "";

  return createPortal(
    <div
      className={`lb-overlay ${out}`}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.93)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        // cursor:pointer 是 iOS Safari 识别 div 可点击的关键，不可删除
        cursor: "pointer",
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/*
        全屏透明背景按钮
        iOS Safari 不对普通 div 可靠触发 click，用 <button> 作背景层解决此问题。
        z-index: 0，处于所有内容层之下，仅在点击空白区域时响应。
      */}
      <button
        aria-label="关闭"
        onClick={handleClose}
        style={{
          position: "absolute", inset: 0,
          background: "transparent", border: "none",
          cursor: "default", touchAction: "manipulation",
          zIndex: 0,
        }}
      />

      {/* 关闭按钮：48×48 满足移动端最小触控区规范，z-index 保证始终在最顶层 */}
      <button
        aria-label="关闭"
        onClick={e => { e.stopPropagation(); handleClose(); }}
        style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "50%", width: 48, height: 48,
          color: "white", fontSize: "1rem",
          cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center",
          touchAction: "manipulation",
          zIndex: 10,
        }}
      >✕</button>

      {/* 计数 */}
      {media.length > 1 && (
        <div style={{
          position: "absolute", top: 22,
          left: "50%", transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.4)",
          fontSize: "0.72rem", letterSpacing: "0.12em",
          pointerEvents: "none",
          zIndex: 10,
        }}>
          {index + 1} / {media.length}
        </div>
      )}

      {/* 主图区：z-index: 1 保证在透明背景按钮之上，click stopPropagation 防止点图片触发背景关闭 */}
      <div
        className={`lb-main ${out}`}
        onClick={e => e.stopPropagation()}
        style={{
          flex: 1, display: "flex",
          alignItems: "center", justifyContent: "center",
          width: "100%",
          padding: media.length > 1 ? "60px 72px 8px" : "60px 72px",
          position: "relative",
          minHeight: 0,
          cursor: "default",   // 覆盖外层 cursor:pointer
          zIndex: 1,
        }}
      >
        {current.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveUrl(current.url)}
            alt=""
            style={{
              maxWidth: "100%", maxHeight: "100%",
              objectFit: "contain", borderRadius: 6,
              userSelect: "none", pointerEvents: "none",
            }}
          />
        ) : (
          <video
            src={resolveUrl(current.url)}
            poster={resolveUrl(current.poster)}
            controls
            autoPlay
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 6 }}
          />
        )}

        {hasPrev && (
          <button
            aria-label="上一张"
            onClick={e => { e.stopPropagation(); onChange(index - 1); }}
            style={navBtnStyle("left")}
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path d="M8 2L2 8L8 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        {hasNext && (
          <button
            aria-label="下一张"
            onClick={e => { e.stopPropagation(); onChange(index + 1); }}
            style={navBtnStyle("right")}
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path d="M2 2L8 8L2 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* 缩略图条：z-index: 1 同主图区，stopPropagation 防止误触发背景关闭 */}
      {media.length > 1 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            display: "flex", gap: 6,
            padding: "10px 20px 18px",
            overflowX: "auto", maxWidth: "100%",
            scrollbarWidth: "none",
            position: "relative", zIndex: 1,
          }}
        >
          {media.map((m, i) => (
            <div
              key={i}
              onClick={() => onChange(i)}
              style={{
                width: 56, height: 56, flexShrink: 0,
                borderRadius: 6, overflow: "hidden",
                cursor: "pointer",
                border: `2px solid ${i === index ? "var(--accent)" : "rgba(255,255,255,0.15)"}`,
                opacity: i === index ? 1 : 0.45,
                transition: "opacity 0.15s, border-color 0.15s",
                background: "#0d1017",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {thumbSrc(m) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbSrc(m)} alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "1rem" }}>🎬</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
