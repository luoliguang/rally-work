"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Comment {
  id: number;
  nickname: string;
  content: string;
  likes: number;
  created_at: string;
}

// ── 配置 ───────────────────────────────────────────────────────────────────────
const LANES = 4;

const SPEED_MAP = { slow: 32, medium: 22, fast: 14 } as const;
type SpeedKey = keyof typeof SPEED_MAP;
const SPEED_LABELS: Record<SpeedKey, string> = { slow: "慢速", medium: "中速", fast: "快速" };

// 昵称 → 固定色（哈希映射，每人一个颜色）
const NICK_PALETTE = [
  "#6ee7b7", // 薄荷绿（accent）
  "#93c5fd", // 浅蓝
  "#f9a8d4", // 粉
  "#fcd34d", // 琥珀
  "#a5b4fc", // 薰衣草紫
  "#6ee7b7", // 重复 accent 让绿色出现概率更高
];
function nicknameColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) & 0xffff;
  return NICK_PALETTE[h % NICK_PALETTE.length];
}

// 相对时间
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d === 0) return "今天";
  if (d === 1) return "昨天";
  if (d < 30)  return `${d} 天前`;
  const m = Math.floor(d / 30);
  if (m < 12)  return `${m} 个月前`;
  return `${Math.floor(m / 12)} 年前`;
}

// 从 localStorage 安全读取
function readStorage<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; }
  catch { return fallback; }
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
export function CommentWall() {
  const [comments,   setComments]   = useState<Comment[]>([]);
  const [nickname,   setNickname]   = useState("");
  const [content,    setContent]    = useState("");
  const [status,     setStatus]     = useState<"idle"|"sending"|"done"|"error">("idle");
  // 当前"激活"的留言 ID：桌面 = hover，移动端 = 点击
  const [activeId,   setActiveId]   = useState<number | null>(null);
  const dismissTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 记录最近一次 pointerdown 的输入类型（mouse / touch / pen）
  // 用于在 onClick 中区分桌面点击和触摸点击
  const lastPointerType = useRef("mouse");

  // 速度：从 localStorage 读取，默认 medium
  const [speedKey, setSpeedKey] = useState<SpeedKey>("medium");

  // 已点赞的 ID 集合（localStorage 持久化，用于渲染 UI 状态）
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  // 各留言的点赞数（本地维护，乐观更新）
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});

  // 客户端挂载后才读 localStorage（避免 SSR 错误）
  useEffect(() => {
    setSpeedKey(readStorage<SpeedKey>("cw-speed", "medium"));
    setLikedIds(new Set(readStorage<number[]>("cw-liked", [])));
  }, []);

  // 拉取留言列表
  useEffect(() => {
    fetch("/api/comments")
      .then(r => r.json())
      .then((rows: Comment[]) => {
        setComments(rows);
        const counts: Record<number, number> = {};
        rows.forEach(c => { counts[c.id] = c.likes; });
        setLikeCounts(counts);
      })
      .catch(() => {});
  }, []);

  // 移动端：点击激活某条留言，4 秒后自动恢复滚动
  const activateTouch = useCallback((id: number) => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setActiveId(prev => {
      if (prev === id) return null;            // 再次点击同一条 → 立即关闭
      dismissTimer.current = setTimeout(() => setActiveId(null), 4000);
      return id;
    });
  }, []);

  // 点击弹幕区域空白处关闭（仅触摸输入时执行，桌面鼠标点击不触发）
  const dismissTouch = useCallback(() => {
    if (lastPointerType.current === "mouse") return;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setActiveId(null);
  }, []);

  // 组件卸载时清理定时器
  useEffect(() => () => { if (dismissTimer.current) clearTimeout(dismissTimer.current); }, []);

  // 点赞 toggle
  const toggleLike = async (id: number) => {
    const isLiked = likedIds.has(id);

    // 乐观更新本地状态
    const nextSet = new Set(likedIds);
    if (isLiked) nextSet.delete(id); else nextSet.add(id);
    setLikedIds(nextSet);
    setLikeCounts(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) + (isLiked ? -1 : 1)),
    }));
    try { localStorage.setItem("cw-liked", JSON.stringify([...nextSet])); } catch {}

    // 发送到服务器（服务器端真正以 IP 去重）
    const res = await fetch(`/api/comments/${id}/like`, { method: "POST" });
    if (res.ok) {
      const { likes } = await res.json() as { likes: number };
      // 用服务器真实值覆盖（防止乐观更新与服务器不一致）
      setLikeCounts(prev => ({ ...prev, [id]: likes }));
    }
  };

  // 提交留言
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

  const durationBase = SPEED_MAP[speedKey];
  const lanes: Comment[][] = Array.from({ length: LANES }, () => []);
  comments.forEach((c, i) => lanes[i % LANES].push(c));

  return (
    <section style={{ borderTop: "1px solid var(--border)", padding: "clamp(3.5rem,7vw,6rem) 0 clamp(3rem,5vw,4rem)" }}>

      {/* ── 标题 ────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "60rem", margin: "0 auto clamp(2rem,4vw,3rem)", padding: "0 clamp(1.5rem,4vw,3rem)", textAlign: "center" }}>
        <h3 className="font-extralight uppercase"
          style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", letterSpacing: "0.2em", color: "var(--text)" }}>
          留言墙
        </h3>
        <p className="mt-3" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
          你也是这段故事的一部分
        </p>
      </div>

      {/* ── 弹幕区域 ─────────────────────────────────────────────────────────── */}
      {comments.length > 0 ? (
        <>
          {/* 弹幕带：触摸点击空白处关闭激活项 */}
          <div
            className="danmaku-wall"
            onPointerDown={e => { lastPointerType.current = e.pointerType; }}
            onClick={dismissTouch}
            style={{
              position: "relative",
              height: `${LANES * 3.4}rem`,
              overflow: "hidden",
              marginBottom: "clamp(2.5rem,5vw,3.5rem)",
              maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
              WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
            }}
          >
            {lanes.map((lane, laneIdx) =>
              lane.map((c, i) => {
                const delay     = -(i * (durationBase / Math.max(lane.length, 1))) - laneIdx * 2.5;
                const duration  = durationBase + (laneIdx % 2) * 5 + (c.content.length > 20 ? 5 : 0);
                const isActive  = activeId === c.id;
                const isLiked   = likedIds.has(c.id);
                const likeCount = likeCounts[c.id] ?? 0;
                const color     = nicknameColor(c.nickname);

                return (
                  <div
                    key={`${laneIdx}-${c.id}`}
                    className="danmaku-item"
                    // 桌面：pointer 事件按 pointerType 区分，过滤触摸 ghost 事件
                    onPointerEnter={e => { if (e.pointerType === "mouse") setActiveId(c.id); }}
                    onPointerLeave={e => { if (e.pointerType === "mouse") setActiveId(null); }}
                    // 移动端：onClick 通过 lastPointerType ref 判断输入类型
                    // 点赞按钮的 stopPropagation 会阻止此 onClick，确保点赞不会误关激活项
                    onClick={e => { if (lastPointerType.current !== "mouse") { e.stopPropagation(); activateTouch(c.id); } }}
                    style={{
                      position: "absolute",
                      top: `${laneIdx * 3.4}rem`,
                      left: 0,
                      whiteSpace: "nowrap",
                      animationName: "danmaku-scroll",
                      animationDuration: `${duration}s`,
                      animationTimingFunction: "linear",
                      animationIterationCount: "infinite",
                      animationDelay: `${delay}s`,
                      animationPlayState: isActive ? "paused" : "running",
                      zIndex: isActive ? 10 : 1,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.55rem",
                        padding: "0.45rem 1rem 0.45rem 1.1rem",
                        borderRadius: "999px",
                        fontSize: "0.85rem",
                        background: isActive ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isActive ? color + "60" : "var(--border)"}`,
                        boxShadow: isActive ? `0 0 20px ${color}20, 0 0 0 1px ${color}30` : "none",
                        transform: isActive ? "scale(1.04)" : "scale(1)",
                        transition: "background 0.2s, box-shadow 0.2s, transform 0.2s, border-color 0.2s",
                        cursor: "default",
                      }}
                    >
                      {/* 昵称（个人固定色） */}
                      <span style={{ color, fontWeight: 500 }}>{c.nickname}</span>

                      {/* 内容 */}
                      <span style={{ color: "var(--text)", opacity: 0.85 }}>{c.content}</span>

                      {/* 激活时额外显示：分隔线 + 时间 + 点赞 */}
                      {isActive && (
                        <>
                          <span style={{ width: 1, height: "0.85rem", background: "var(--border)", display: "inline-block", opacity: 0.5, flexShrink: 0 }} />
                          <span style={{ fontSize: "0.68rem", color: "var(--muted)", flexShrink: 0 }}>
                            {timeAgo(c.created_at)}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); toggleLike(c.id); }}
                            title={isLiked ? "取消点赞" : "点赞"}
                            style={{
                              background: "none", border: "none",
                              cursor: "pointer",
                              display: "inline-flex", alignItems: "center", gap: "0.22rem",
                              padding: "0 4px",
                              color: isLiked ? "#f87171" : "var(--muted)",
                              fontSize: "0.82rem",
                              lineHeight: 1,
                              transition: "transform 0.15s, color 0.15s",
                              flexShrink: 0,
                              // 移动端不做 scale 动画（无鼠标悬停）
                            }}
                            onPointerEnter={e => { if (e.pointerType === "mouse") (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.25)"; }}
                            onPointerLeave={e => { if (e.pointerType === "mouse") (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
                          >
                            {isLiked ? "❤️" : "🤍"}
                            {likeCount > 0 && (
                              <span style={{ fontSize: "0.68rem", opacity: 0.75 }}>{likeCount}</span>
                            )}
                          </button>
                        </>
                      )}

                      {/* 非激活时，若已有点赞数则展示小计数（低调） */}
                      {!isActive && likeCount > 0 && (
                        <span style={{ fontSize: "0.65rem", color: "#f87171", opacity: 0.55, flexShrink: 0 }}>
                          ❤ {likeCount}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* 移动端提示：CSS media query 控制，无需 JS 检测 */}
          <p
            className="danmaku-touch-hint text-center"
            style={{
              fontSize: "0.68rem",
              color: "var(--muted)",
              opacity: 0.4,
              marginTop: "-clamp(1.5rem,3vw,2rem)",
              marginBottom: "clamp(1rem,2vw,1.5rem)",
              // 仅触摸设备可见
              display: "none",
            }}
          >
            点击留言可暂停 · 再点可点赞
          </p>
        </>
      ) : (
        <p className="text-center"
          style={{ fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5, marginBottom: "clamp(2.5rem,5vw,3.5rem)" }}>
          还没有留言，来说第一句话吧
        </p>
      )}

      {/* ── 输入框 ───────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "36rem", margin: "0 auto", padding: "0 clamp(1.5rem,4vw,3rem)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.4rem 0.4rem 0.4rem 1.1rem",
          borderRadius: "999px",
          border: "1px solid var(--border)",
          background: "rgba(255,255,255,0.03)",
        }}>
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            maxLength={50}
            placeholder="昵称"
            style={{ width: "5rem", background: "transparent", border: "none", outline: "none", color: "var(--muted)", fontSize: "0.82rem", flexShrink: 0 }}
          />
          <div style={{ width: 1, height: "1.2rem", background: "var(--border)" }} />
          <input
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            maxLength={300}
            placeholder="留下你想说的话…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: "0.88rem" }}
          />
          <button
            onClick={submit}
            disabled={!content.trim() || status === "sending"}
            style={{
              flexShrink: 0,
              padding: "0.5rem 1.3rem", borderRadius: "999px", border: "none",
              background: content.trim() ? "var(--accent)" : "rgba(255,255,255,0.06)",
              color: content.trim() ? "#07090e" : "var(--muted)",
              fontSize: "0.82rem", fontWeight: 500,
              cursor: content.trim() ? "pointer" : "default",
              transition: "background 0.2s",
            }}
          >
            {status === "sending" ? "发送中" : "发送"}
          </button>
        </div>

        {/* 状态提示 */}
        <p style={{
          textAlign: "center", marginTop: "0.9rem", fontSize: "0.75rem", height: "1rem",
          color: status === "error" ? "#f87171" : "var(--accent)",
          opacity: status === "done" || status === "error" ? 0.9 : 0,
          transition: "opacity 0.3s",
        }}>
          {status === "done"  && "🙏 留言已提交，审核后将在弹幕中飘过"}
          {status === "error" && "提交失败，请稍后重试"}
        </p>
      </div>
    </section>
  );
}
