"use client";

import { useEffect } from "react";
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
  const current = media[index];
  const hasPrev = index > 0;
  const hasNext = index < media.length - 1;

  // 锁定 body 滚动
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // 键盘导航
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")                  onClose();
      if (e.key === "ArrowLeft"  && hasPrev)   onChange(index - 1);
      if (e.key === "ArrowRight" && hasNext)   onChange(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, hasPrev, hasNext, onClose, onChange]);

  const navBtn = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    [side]: 12, top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "50%", width: 44, height: 44,
    color: "white", fontSize: "1.6rem", lineHeight: 1,
    cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "background 0.15s",
    zIndex: 1,
  });

  const thumbSrc = (m: Media) =>
    m.type === "image"
      ? resolveUrl((m as { thumb?: string }).thumb ?? m.url)
      : resolveUrl((m as { poster?: string }).poster);

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.93)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "50%", width: 40, height: 40,
          color: "white", fontSize: "1rem",
          cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center",
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
        }}>
          {index + 1} / {media.length}
        </div>
      )}

      {/* 主图区 */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          flex: 1, display: "flex",
          alignItems: "center", justifyContent: "center",
          width: "100%",
          padding: media.length > 1 ? "60px 72px 8px" : "60px 72px",
          position: "relative",
          minHeight: 0,
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
              userSelect: "none",
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
          <button onClick={e => { e.stopPropagation(); onChange(index - 1); }} style={navBtn("left")}>‹</button>
        )}
        {hasNext && (
          <button onClick={e => { e.stopPropagation(); onChange(index + 1); }} style={navBtn("right")}>›</button>
        )}
      </div>

      {/* 缩略图条 */}
      {media.length > 1 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            display: "flex", gap: 6,
            padding: "10px 20px 18px",
            overflowX: "auto", maxWidth: "100%",
            scrollbarWidth: "none",
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
