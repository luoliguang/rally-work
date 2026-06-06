"use client";

import { useEffect, useRef, useState } from "react";

interface Comment {
  id: number;
  nickname: string;
  content: string;
  created_at: string;
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)  return "刚刚";
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
}

export function CommentWall() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickname, setNickname] = useState("");
  const [content,  setContent]  = useState("");
  const [status,   setStatus]   = useState<"idle"|"sending"|"done"|"error">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <section style={{ borderTop: "1px solid var(--border)", padding: "clamp(3rem,6vw,5rem) clamp(1.5rem,4vw,3rem)" }}>
      <div style={{ maxWidth: "54rem", margin: "0 auto" }}>

        {/* 标题 */}
        <div className="flex items-baseline gap-4 mb-8">
          <h3 className="font-extralight tracking-widest uppercase"
            style={{ fontSize: "clamp(1rem,2vw,1.2rem)", color: "var(--text)" }}>
            留言墙
          </h3>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            你也是这段故事的一部分
          </span>
        </div>

        {/* 投稿区 */}
        <div className="mb-10 rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="留下你想说的话…（最多 300 字，需审核后显示）"
            className="w-full resize-none bg-transparent outline-none text-sm"
            style={{
              padding: "1rem 1.25rem",
              color: "var(--text)",
              lineHeight: 1.7,
            }}
          />
          <div className="flex items-center justify-between px-4 pb-3 gap-3"
            style={{ borderTop: "1px solid var(--border)" }}>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={50}
              placeholder="昵称（可不填）"
              className="bg-transparent outline-none text-xs flex-1"
              style={{ color: "var(--muted)" }}
            />
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: "var(--muted)", opacity: 0.5 }}>
                {content.length}/300
              </span>
              <button
                onClick={submit}
                disabled={!content.trim() || status === "sending"}
                className="text-xs rounded-full px-4 py-1.5 transition-all"
                style={{
                  background: content.trim() ? "var(--accent)" : "rgba(255,255,255,0.06)",
                  color: content.trim() ? "#07090e" : "var(--muted)",
                  cursor: content.trim() ? "pointer" : "default",
                  border: "none",
                  fontWeight: 500,
                }}
              >
                {status === "sending" ? "提交中…" : "提交"}
              </button>
            </div>
          </div>
        </div>

        {/* 状态提示 */}
        {status === "done" && (
          <p className="text-xs mb-6" style={{ color: "var(--accent)" }}>
            🙏 留言已提交，等待审核后显示
          </p>
        )}
        {status === "error" && (
          <p className="text-xs mb-6" style={{ color: "#f87171" }}>
            提交失败，请稍后重试
          </p>
        )}

        {/* 已审核留言 */}
        {comments.length === 0 ? (
          <p className="text-xs text-center py-8" style={{ color: "var(--muted)", opacity: 0.5 }}>
            还没有留言，来说第一句话吧
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {comments.map((c) => (
              <div key={c.id}
                className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text)", opacity: 0.85 }}>
                  {c.content}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                    {c.nickname}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)", opacity: 0.5 }}>
                    · {timeAgo(c.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
