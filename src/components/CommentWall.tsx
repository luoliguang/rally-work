"use client";

import { useEffect, useRef, useState } from "react";

interface Comment {
  id: number;
  nickname: string;
  content: string;
  created_at: string;
}

const LANES = 4;            // 弹幕轨道数
const DURATION_BASE = 18;   // 基准飘行时长（秒）

export function CommentWall() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickname, setNickname] = useState("");
  const [content,  setContent]  = useState("");
  const [status,   setStatus]   = useState<"idle"|"sending"|"done"|"error">("idle");

  useEffect(() => {
    fetch("/api/comments")
      .then((r) => r.json())
      .then(setComments)
      .catch(() => {});
  }, []);

  async function submit() {
    if (!content.trim() || status === "sending") return;
    setStatus("sending");
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname.trim(), content: content.trim() }),
    });
    if (res.ok) {
      setContent("");
      setStatus("done");
      setTimeout(() => setStatus("idle"), 4000);
    } else {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  // 把留言分配到各轨道，循环复用保证每条轨道都有内容
  const lanes: Comment[][] = Array.from({ length: LANES }, () => []);
  comments.forEach((c, i) => lanes[i % LANES].push(c));

  return (
    <section
      style={{
        borderTop: "1px solid var(--border)",
        padding: "clamp(3.5rem,7vw,6rem) 0 clamp(3rem,5vw,4rem)",
      }}
    >
      {/* 标题 */}
      <div
        style={{
          maxWidth: "60rem",
          margin: "0 auto clamp(2rem,4vw,3rem)",
          padding: "0 clamp(1.5rem,4vw,3rem)",
          textAlign: "center",
        }}
      >
        <h3
          className="font-extralight uppercase"
          style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", letterSpacing: "0.2em", color: "var(--text)" }}
        >
          留言墙
        </h3>
        <p className="mt-3" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
          你也是这段故事的一部分
        </p>
      </div>

      {/* ── 弹幕带 ────────────────────────────────────────────────────────────── */}
      {comments.length > 0 ? (
        <div
          className="danmaku-wall"
          style={{
            position: "relative",
            height: `${LANES * 3}rem`,
            overflow: "hidden",
            marginBottom: "clamp(2.5rem,5vw,3.5rem)",
            maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
          }}
        >
          {lanes.map((lane, laneIdx) =>
            lane.map((c, i) => {
              // 同轨道内错开起始时间，速度略有差异
              const delay    = -(i * (DURATION_BASE / Math.max(lane.length, 1))) - laneIdx * 2;
              const duration = DURATION_BASE + (laneIdx % 2) * 4 + (c.content.length > 20 ? 4 : 0);
              return (
                <div
                  key={`${laneIdx}-${c.id}`}
                  className="danmaku-item"
                  style={{
                    position: "absolute",
                    top: `${laneIdx * 3}rem`,
                    left: 0,
                    whiteSpace: "nowrap",
                    animation: `danmaku-scroll ${duration}s linear infinite`,
                    animationDelay: `${delay}s`,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.45rem 1.1rem",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span style={{ color: "var(--accent)", fontWeight: 500 }}>{c.nickname}</span>
                    <span style={{ color: "var(--text)", opacity: 0.85 }}>{c.content}</span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <p
          className="text-center"
          style={{ fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5, marginBottom: "clamp(2.5rem,5vw,3.5rem)" }}
        >
          还没有留言，来说第一句话吧
        </p>
      )}

      {/* ── 输入框 ────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "36rem", margin: "0 auto", padding: "0 clamp(1.5rem,4vw,3rem)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 0.4rem 0.4rem 1.1rem",
            borderRadius: "999px",
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
            placeholder="昵称"
            style={{
              width: "5rem",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--muted)",
              fontSize: "0.82rem",
              flexShrink: 0,
            }}
          />
          <div style={{ width: 1, height: "1.2rem", background: "var(--border)" }} />
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            maxLength={300}
            placeholder="留下你想说的话…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontSize: "0.88rem",
            }}
          />
          <button
            onClick={submit}
            disabled={!content.trim() || status === "sending"}
            style={{
              flexShrink: 0,
              padding: "0.5rem 1.3rem",
              borderRadius: "999px",
              border: "none",
              background: content.trim() ? "var(--accent)" : "rgba(255,255,255,0.06)",
              color: content.trim() ? "#07090e" : "var(--muted)",
              fontSize: "0.82rem",
              fontWeight: 500,
              cursor: content.trim() ? "pointer" : "default",
              transition: "background 0.2s",
            }}
          >
            {status === "sending" ? "发送中" : "发送"}
          </button>
        </div>

        {/* 状态提示 */}
        <p
          style={{
            textAlign: "center",
            marginTop: "0.9rem",
            fontSize: "0.75rem",
            height: "1rem",
            color: status === "error" ? "#f87171" : "var(--accent)",
            opacity: status === "done" || status === "error" ? 0.9 : 0,
            transition: "opacity 0.3s",
          }}
        >
          {status === "done"  && "🙏 留言已提交，审核后将在弹幕中飘过"}
          {status === "error" && "提交失败，请稍后重试"}
        </p>
      </div>
    </section>
  );
}
