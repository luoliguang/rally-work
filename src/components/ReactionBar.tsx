"use client";

import { useEffect, useState, useCallback } from "react";

const EMOJIS = ["🏸", "👏", "🏆", "😅"] as const;
type Emoji = (typeof EMOJIS)[number];

interface EmojiData { count: number; mine: boolean }
type ReactionMap = Record<Emoji, EmojiData>;

const DEFAULT: ReactionMap = {
  "🏸": { count: 0, mine: false },
  "👏": { count: 0, mine: false },
  "🏆": { count: 0, mine: false },
  "😅": { count: 0, mine: false },
};

export function ReactionBar({ matchId }: { matchId: string }) {
  const [data, setData]       = useState<ReactionMap>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reactions/${matchId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [matchId]);

  const toggle = useCallback(async (emoji: Emoji) => {
    // Optimistic update
    setData((prev) => ({
      ...prev,
      [emoji]: {
        count: prev[emoji].mine ? prev[emoji].count - 1 : prev[emoji].count + 1,
        mine: !prev[emoji].mine,
      },
    }));

    const res = await fetch(`/api/reactions/${matchId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (!res.ok) {
      // Rollback on error
      setData((prev) => ({
        ...prev,
        [emoji]: {
          count: prev[emoji].mine ? prev[emoji].count - 1 : prev[emoji].count + 1,
          mine: !prev[emoji].mine,
        },
      }));
    }
  }, [matchId]);

  if (loading) return null;

  return (
    <div className="flex gap-2 mt-5 flex-wrap">
      {EMOJIS.map((emoji) => {
        const { count, mine } = data[emoji];
        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            className="flex items-center gap-1.5 text-xs rounded-full transition-all"
            style={{
              padding: "5px 12px",
              background: mine ? "rgba(110,231,183,0.12)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${mine ? "rgba(110,231,183,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: mine ? "var(--accent)" : "var(--muted)",
              cursor: "pointer",
            }}
            aria-label={`${emoji} ${count}`}
          >
            <span>{emoji}</span>
            {count > 0 && (
              <span className="tabular-nums" style={{ fontSize: "0.7rem" }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
