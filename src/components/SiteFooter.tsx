import type { Match } from "@/lib/types";

function fmtMonthYear(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
}

export function SiteFooter({ matches }: { matches: Match[] }) {
  const total   = matches.length;
  const first   = matches[0]?.date;
  const last    = matches[matches.length - 1]?.date;
  const players = new Set(matches.flatMap((m) => m.players ?? []));

  const dateRange =
    first && last && first !== last
      ? `${fmtMonthYear(first)} — ${fmtMonthYear(last)}`
      : first
      ? fmtMonthYear(first)
      : "";

  return (
    <footer style={{ borderTop: "1px solid var(--border)" }}>

      {/* ── 主体：50 / 50 视觉等重分栏 ─────────────────────────────────────── */}
      <div className="flex" style={{ minHeight: "52vh" }}>

        {/* 左列：RALLY 充满列高，与右侧内容等重 */}
        <div
          className="flex flex-col items-center justify-center"
          style={{
            width: "50%",
            borderRight: "1px solid var(--border)",
            padding: "clamp(3rem, 5vw, 5rem) clamp(2rem, 4vw, 4rem)",
          }}
        >
          {/* 字号拉大，让字母视觉上"填满"左列 */}
          <h2
            className="font-extralight uppercase text-center"
            style={{
              fontSize: "clamp(4rem, 10vw, 9rem)",
              letterSpacing: "0.22em",
              whiteSpace: "nowrap",
              color: "var(--text)",
              opacity: 0.88,
              lineHeight: 1,
            }}
          >
            Rally
          </h2>
          <div
            style={{
              marginTop: "clamp(1.2rem, 2.5vw, 2rem)",
              width: "2.5rem",
              height: "1px",
              background: "var(--accent)",
            }}
          />
        </div>

        {/* 右列：内容紧凑居中，与左侧大字等重 */}
        <div
          className="flex flex-col justify-center"
          style={{
            width: "50%",
            padding: "clamp(3rem, 5vw, 5rem) clamp(2.5rem, 5vw, 5rem)",
          }}
        >
          {/* 情感文案 */}
          <p
            style={{
              color: "var(--muted)",
              fontSize: "clamp(0.85rem, 1.3vw, 0.95rem)",
              lineHeight: 1.95,
            }}
          >
            在工厂的日子，忙碌而短暂。
            <br />
            感谢相遇，
            <br />
          </p>

          <p
            style={{
              marginTop: "1.25rem",
              color: "var(--accent)",
              fontSize: "clamp(0.85rem, 1.3vw, 0.95rem)",
              opacity: 0.9,
            }}
          >
            愿这份记录能让我们更珍惜那短暂的相聚。
          </p>

          {/* 分割线 */}
          <div
            style={{
              margin: "2rem 0",
              height: "1px",
              background: "var(--border)",
            }}
          />

          {/* 统计数据：横排紧凑，不撑高右列 */}
          {total > 0 && (
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <div className="flex items-baseline gap-2">
                <span
                  className="tabular-nums font-light"
                  style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--accent)" }}
                >
                  {total}
                </span>
                <span className="text-xs tracking-wider" style={{ color: "var(--muted)" }}>
                  场记录
                </span>
              </div>

              {players.size > 0 && (
                <div className="flex items-baseline gap-2">
                  <span
                    className="tabular-nums font-light"
                    style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--text)", opacity: 0.6 }}
                  >
                    {players.size}
                  </span>
                  <span className="text-xs tracking-wider" style={{ color: "var(--muted)" }}>
                    位队友
                  </span>
                </div>
              )}
            </div>
          )}

          {dateRange && (
            <p
              className="text-xs tracking-wider mt-3"
              style={{ color: "var(--muted)", opacity: 0.5 }}
            >
              {dateRange}
            </p>
          )}
        </div>
      </div>

      {/* ── 底部署名条 ───────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-center py-5 text-xs tracking-widest"
        style={{
          borderTop: "1px solid var(--border)",
          color: "var(--muted)",
          opacity: 0.35,
        }}
      >
        Rally · 记录关于我们的羽毛球时光
      </div>
    </footer>
  );
}
