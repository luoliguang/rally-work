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

      {/* ── 主体：桌面左右分栏，手机上下堆叠 ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row" style={{ minHeight: "52vh" }}>

        {/* 左列 / 上块：RALLY 大字 */}
        <div
          className="footer-left flex flex-col items-center justify-center w-full md:w-1/2"
          style={{ padding: "clamp(2.5rem, 5vw, 5rem) clamp(1.5rem, 4vw, 4rem)" }}
        >
          <h2
            className="font-extralight uppercase text-center"
            style={{
              fontSize: "clamp(3rem, 14vw, 9rem)",
              letterSpacing: "0.22em",
              whiteSpace: "nowrap",
              color: "var(--text)",
              opacity: 0.88,
              lineHeight: 1,
            }}
          >
            Rally
          </h2>
          <div style={{ marginTop: "clamp(1.2rem, 2.5vw, 2rem)", width: "2.5rem", height: "1px", background: "var(--accent)" }} />
        </div>

        {/* 右列 / 下块：文案 + 统计 */}
        <div
          className="flex flex-col justify-center w-full md:w-1/2"
          style={{ padding: "clamp(2.5rem, 5vw, 5rem) clamp(1.5rem, 5vw, 5rem)" }}
        >
          <p style={{ color: "var(--muted)", fontSize: "clamp(0.85rem, 1.3vw, 0.95rem)", lineHeight: 1.95 }}>
            生命中总是充满着离别，我想我们也是。有人总说，同事是不能去处成朋友的，但在我或者我们这里，这句话好像并不奏效？亦或者，在最初我们便筛选了不想与之交流之人。
            <br />
            我有时会想，如果有一天我们不再联系，是否还会记得彼此。我想答案是肯定的，因为我们的记忆中总是充满了彼此的影子。
            <br />
            尽管有些漫长，有的短暂，感谢相遇。
          </p>

          <p style={{ marginTop: "1.25rem", color: "var(--accent)", fontSize: "clamp(0.85rem, 1.3vw, 0.95rem)", opacity: 0.9 }}>
            愿这份记录能让我们更珍惜那短暂的相聚。
          </p>

          <div style={{ margin: "2rem 0", height: "1px", background: "var(--border)" }} />

          {total > 0 && (
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <div className="flex items-baseline gap-2">
                <span className="tabular-nums font-light" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--accent)" }}>
                  {total}
                </span>
                <span className="text-xs tracking-wider" style={{ color: "var(--muted)" }}>场记录</span>
              </div>
              {players.size > 0 && (
                <div className="flex items-baseline gap-2">
                  <span className="tabular-nums font-light" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--text)", opacity: 0.6 }}>
                    {players.size}
                  </span>
                  <span className="text-xs tracking-wider" style={{ color: "var(--muted)" }}>位队友</span>
                </div>
              )}
            </div>
          )}

          {dateRange && (
            <p className="text-xs tracking-wider mt-3" style={{ color: "var(--muted)", opacity: 0.5 }}>
              {dateRange}
            </p>
          )}
        </div>
      </div>

      {/* ── 底部署名条（提高可读性） ─────────────────────────────────────────── */}
      <div
        className="flex items-center justify-center text-xs tracking-widest"
        style={{
          borderTop: "1px solid var(--border)",
          color: "rgba(221,225,233,0.5)",
          padding: "1.4rem 1rem",
        }}
      >
        Rally · 记录关于我们的羽毛球时光
      </div>
    </footer>
  );
}
