"use client";

import {
  useCallback, useEffect, useRef, useState,
} from "react";
import type { Match, Media } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════════ styles ═══ */
const S = {
  field: {
    width: "100%", padding: "9px 12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--border)", borderRadius: 8,
    color: "var(--text)", fontSize: "0.85rem",
    outline: "none", boxSizing: "border-box",
  } as React.CSSProperties,

  label: {
    display: "block", fontSize: "0.7rem",
    color: "var(--muted)", marginBottom: 5,
    textTransform: "uppercase", letterSpacing: "0.06em",
  } as React.CSSProperties,

  card: {
    padding: "14px 16px", marginBottom: 8,
    border: "1px solid var(--border)", borderRadius: 10,
    background: "rgba(255,255,255,0.02)",
  } as React.CSSProperties,

  btn: (accent = false, danger = false): React.CSSProperties => ({
    padding: "5px 14px", borderRadius: 6, cursor: "pointer",
    fontSize: "0.72rem",
    border: `1px solid ${danger ? "rgba(248,113,113,0.25)" : accent ? "rgba(110,231,183,0.25)" : "rgba(255,255,255,0.1)"}`,
    background: danger ? "rgba(248,113,113,0.08)" : accent ? "rgba(110,231,183,0.1)" : "rgba(255,255,255,0.04)",
    color: danger ? "#f87171" : accent ? "var(--accent)" : "var(--muted)",
  }),

  section: { marginBottom: 24 } as React.CSSProperties,
  sectionTitle: { fontSize: "0.72rem", color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 } as React.CSSProperties,
} as const;

/* shared layout helpers (module-level so they aren't recreated each render) */
function Row({ children, cols = "1fr 1fr" }: { children: React.ReactNode; cols?: string }) {
  return <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12, marginBottom: 12 }}>{children}</div>;
}
function Field({ l, children }: { l: string; children: React.ReactNode }) {
  return <div><label style={S.label}>{l}</label>{children}</div>;
}

/* ═══════════════════════════════════════════════════════════════════ login ════ */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState("");
  const submit = async () => {
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    r.ok ? onLogin() : setErr("密码错误");
  };
  return (
    <main style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ width: 320, padding: 32, border: "1px solid var(--border)", borderRadius: 16 }}>
        <h1 style={{ color: "var(--text)", fontSize: "1rem", marginBottom: 24, fontWeight: 300, letterSpacing: "0.2em" }}>RALLY · 管理后台</h1>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="管理员密码" style={{ ...S.field, marginBottom: 12 }} />
        {err && <p style={{ color: "#f87171", fontSize: "0.72rem", marginBottom: 8 }}>{err}</p>}
        <button onClick={submit} style={{ width: "100%", padding: 10, background: "var(--accent)", color: "#07090e", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>登录</button>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════ media manager ═ */
interface MediaManagerProps {
  items: Media[];
  onChange: (items: Media[]) => void;
}

function MediaManager({ items, onChange }: MediaManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const uploadFiles = useCallback(async (files: FileList) => {
    setUploading(true);
    const results: Media[] = [];
    for (const file of Array.from(files)) {
      const form = new FormData(); form.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const { url } = await res.json() as { url: string };
        const isVideo = /\.(mp4|mov|webm)$/i.test(file.name);
        results.push(isVideo ? { type: "video", url } : { type: "image", url, thumb: url });
      }
    }
    onChange([...items, ...results]);
    setUploading(false);
  }, [items, onChange]);

  const update = (i: number, patch: Partial<Media>) =>
    onChange(items.map((m, idx) => idx === i ? { ...m, ...patch } as Media : m));

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  const addUrl = () => onChange([...items, { type: "image", url: "", thumb: "" }]);

  return (
    <div>
      {/* Upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); uploadFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${drag ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 10, padding: "20px 16px", textAlign: "center",
          cursor: "pointer", marginBottom: 10, transition: "border-color .2s",
          background: drag ? "rgba(110,231,183,0.04)" : "transparent",
        }}
      >
        {uploading
          ? <p style={{ fontSize: "0.78rem", color: "var(--accent)" }}>上传中…</p>
          : <>
            <p style={{ fontSize: "0.78rem", color: "var(--muted)" }}>点击或拖拽上传图片/视频</p>
            <p style={{ fontSize: "0.68rem", color: "var(--muted)", opacity: 0.5, marginTop: 4 }}>jpg / png / webp / mp4 / mov，≤100 MB</p>
          </>
        }
        <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={e => e.target.files && uploadFiles(e.target.files)} />
      </div>

      {/* Media list */}
      {items.map((m, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8, padding: 10, border: "1px solid var(--border)", borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
          {/* Preview */}
          <div style={{ width: 56, height: 56, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {m.type === "image" && m.url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: "1.2rem" }}>{m.type === "video" ? "🎬" : "🖼"}</span>
            }
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Type */}
            <div style={{ display: "flex", gap: 6 }}>
              {(["image", "video"] as const).map(t => (
                <button key={t} onClick={() => update(i, { type: t })}
                  style={{ ...S.btn(m.type === t), padding: "2px 10px", fontSize: "0.68rem" }}>{t}</button>
              ))}
            </div>
            {/* URL */}
            <input value={m.url} onChange={e => update(i, { url: e.target.value })} placeholder="图片/视频 URL" style={{ ...S.field, fontSize: "0.75rem", padding: "6px 10px" }} />
            {/* Thumb / Poster */}
            {m.type === "image"
              ? <input value={(m as { thumb?: string }).thumb ?? ""} onChange={e => update(i, { thumb: e.target.value } as Partial<Media>)} placeholder="缩略图 URL（可留空，默认同上）" style={{ ...S.field, fontSize: "0.75rem", padding: "6px 10px" }} />
              : <input value={(m as { poster?: string }).poster ?? ""} onChange={e => update(i, { poster: e.target.value } as Partial<Media>)} placeholder="视频封面 URL（可留空）" style={{ ...S.field, fontSize: "0.75rem", padding: "6px 10px" }} />
            }
          </div>

          <button onClick={() => remove(i)} style={{ ...S.btn(false, true), padding: "4px 10px", flexShrink: 0 }}>×</button>
        </div>
      ))}

      <button onClick={addUrl} style={{ ...S.btn(), fontSize: "0.72rem" }}>+ 手动填入 URL</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ match form ═ */
type MatchMode = "2p" | "mp";

const WEEKDAYS = ["日","一","二","三","四","五","六"];
function autoWeekday(date: string) {
  return date ? `周${WEEKDAYS[new Date(`${date}T00:00:00`).getDay()]}` : "";
}

interface FormState {
  id: string; date: string; mode: MatchMode;
  opponent: string; scoreUs: string; scoreThem: string; result: "win"|"loss";
  mpScores: { player: string; score: string }[];
  gamesPlayed: string; gamesWon: string;
  caption: string; players: string; mvp: string;
  media: Media[];
}

function buildInitialForm(match?: Match): FormState {
  const hasMP = !!(match?.playerScores?.length);
  return {
    id:          match?.id ?? "",
    date:        match?.date ?? "",
    mode:        hasMP ? "mp" : "2p",
    opponent:    match?.opponent ?? "",
    scoreUs:     match?.scoreUs?.toString() ?? "",
    scoreThem:   match?.scoreThem?.toString() ?? "",
    result:      match?.result ?? "win",
    mpScores:    hasMP
      ? match!.playerScores!.map(p => ({ player: p.player, score: String(p.score) }))
      : [{ player: "", score: "" }, { player: "", score: "" }],
    gamesPlayed: match?.gamesPlayed?.toString() ?? "1",
    gamesWon:    match?.gamesWon?.toString() ?? "1",
    caption:     match?.caption ?? "",
    players:     match?.players?.join(", ") ?? "",
    mvp:         match?.mvp ?? "",
    media:       match?.media ?? [],
  };
}

function formToMatch(f: FormState): Partial<Match> {
  const base: Partial<Match> = {
    date:        f.date,
    weekday:     autoWeekday(f.date),
    result:      f.result,
    gamesPlayed: Number(f.gamesPlayed) || 1,
    gamesWon:    Number(f.gamesWon)    || 0,
    caption:     f.caption.trim(),
    players:     f.players.split(/[,，\s]+/).filter(Boolean),
    mvp:         f.mvp.trim() || undefined,
    media:       f.media,
  };
  if (f.mode === "2p") {
    base.opponent  = f.opponent.trim() || undefined;
    base.scoreUs   = Number(f.scoreUs)   || 0;
    base.scoreThem = Number(f.scoreThem) || 0;
  } else {
    base.playerScores = f.mpScores
      .filter(r => r.player.trim())
      .map(r => ({ player: r.player.trim(), score: Number(r.score) || 0 }));
  }
  return base;
}

interface MatchFormProps {
  initial?: Match;
  onSave: (m: Match) => void;
  onCancel: () => void;
}

function MatchForm({ initial, onSave, onCancel }: MatchFormProps) {
  const [f, setF]     = useState<FormState>(() => buildInitialForm(initial));
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setF(p => ({ ...p, [k]: v }));

  const setMP = (i: number, key: "player"|"score", val: string) =>
    setF(p => ({ ...p, mpScores: p.mpScores.map((r, idx) => idx === i ? { ...r, [key]: val } : r) }));

  async function save() {
    if (!f.date || !f.caption.trim()) { setError("日期和文案为必填项"); return; }
    setSaving(true); setError("");
    const isEdit = !!initial;
    const url    = isEdit ? `/api/admin/matches/${initial!.id}` : "/api/admin/matches";
    const method = isEdit ? "PUT" : "POST";
    const body   = isEdit ? formToMatch(f) : { ...formToMatch(f), id: f.id.trim() || undefined };

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { onSave(await res.json() as Match); }
    else        { setError((await res.json() as { error: string }).error); }
    setSaving(false);
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ fontWeight: 400, fontSize: "0.95rem", color: "var(--text)" }}>
          {initial ? `编辑：${initial.date}` : "新增比赛记录"}
        </h3>
        <button onClick={onCancel} style={S.btn()}>取消</button>
      </div>

      {/* Mode */}
      <div style={S.section}>
        <p style={S.sectionTitle}>比赛类型</p>
        <div style={{ display: "flex", gap: 8 }}>
          {(["2p","mp"] as const).map(m => (
            <button key={m} onClick={() => set("mode", m)}
              style={{ ...S.btn(f.mode === m), padding: "6px 18px" }}>
              {m === "2p" ? "两人对打" : "多人积分"}
            </button>
          ))}
        </div>
      </div>

      {/* Basic */}
      <div style={S.section}>
        <p style={S.sectionTitle}>基础信息</p>
        <Row>
          <Field l="日期 *">
            <input type="date" value={f.date} onChange={e => set("date", e.target.value)} style={S.field} />
          </Field>
          <Field l="星期（自动）">
            <input readOnly value={autoWeekday(f.date)} style={{ ...S.field, opacity: 0.5 }} />
          </Field>
        </Row>
        {!initial && (
          <Field l="ID（留空自动生成）">
            <input value={f.id} onChange={e => set("id", e.target.value)} placeholder="2026-06-10-vs-laozhang" style={{ ...S.field, marginBottom: 12 }} />
          </Field>
        )}
      </div>

      {/* Score */}
      <div style={S.section}>
        <p style={S.sectionTitle}>比分 / 得分</p>
        {f.mode === "2p" ? (
          <Row cols="1fr 90px 90px 90px">
            <Field l="对手">
              <input value={f.opponent} onChange={e => set("opponent", e.target.value)} placeholder="对手名字" style={S.field} />
            </Field>
            <Field l="我方得分">
              <input type="number" value={f.scoreUs} onChange={e => set("scoreUs", e.target.value)} style={S.field} />
            </Field>
            <Field l="对方得分">
              <input type="number" value={f.scoreThem} onChange={e => set("scoreThem", e.target.value)} style={S.field} />
            </Field>
            <Field l="胜负">
              <select className="rl-select" value={f.result} onChange={e => set("result", e.target.value as "win"|"loss")} style={S.field}>
                <option value="win">胜</option>
                <option value="loss">负</option>
              </select>
            </Field>
          </Row>
        ) : (
          <>
            {f.mpScores.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input value={r.player} onChange={e => setMP(i, "player", e.target.value)} placeholder="队友姓名" style={{ ...S.field, flex: 1 }} />
                <input type="number" value={r.score} onChange={e => setMP(i, "score", e.target.value)} placeholder="积分" style={{ ...S.field, width: 90 }} />
                {f.mpScores.length > 2 && (
                  <button onClick={() => setF(p => ({ ...p, mpScores: p.mpScores.filter((_, idx) => idx !== i) }))}
                    style={{ ...S.btn(false, true), padding: "4px 10px" }}>×</button>
                )}
              </div>
            ))}
            <button onClick={() => setF(p => ({ ...p, mpScores: [...p.mpScores, { player: "", score: "" }] }))}
              style={{ ...S.btn(), marginBottom: 8 }}>+ 添加队友</button>
          </>
        )}
        <Row>
          <Field l="总场次">
            <input type="number" value={f.gamesPlayed} onChange={e => set("gamesPlayed", e.target.value)} style={S.field} />
          </Field>
          <Field l="胜场">
            <input type="number" value={f.gamesWon} onChange={e => set("gamesWon", e.target.value)} style={S.field} />
          </Field>
        </Row>
      </div>

      {/* Players & Caption */}
      <div style={S.section}>
        <p style={S.sectionTitle}>队友 / 文案</p>
        <Row>
          <Field l="出场队友（逗号分隔）">
            <input value={f.players} onChange={e => set("players", e.target.value)} placeholder="罗洋洋, 华龙飞" style={S.field} />
          </Field>
          <Field l="MVP（可选）">
            <input value={f.mvp} onChange={e => set("mvp", e.target.value)} placeholder="留空时按得分自动计算" style={S.field} />
          </Field>
        </Row>
        <Field l="文案 *">
          <textarea value={f.caption} onChange={e => set("caption", e.target.value)} rows={4}
            style={{ ...S.field, resize: "vertical" }} />
        </Field>
      </div>

      {/* Media */}
      <div style={S.section}>
        <p style={S.sectionTitle}>图片 / 视频</p>
        <MediaManager items={f.media} onChange={v => set("media", v)} />
      </div>

      {error && <p style={{ color: "#f87171", fontSize: "0.78rem", marginBottom: 10 }}>{error}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={save} disabled={saving}
          style={{ ...S.btn(true), padding: "9px 28px", fontSize: "0.85rem" }}>
          {saving ? "保存中…" : initial ? "保存更改" : "创建记录"}
        </button>
        <button onClick={onCancel} style={{ ...S.btn(), padding: "9px 20px" }}>取消</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ matches tab ═══ */
const PAGE_SIZE = 10;

function MatchesTab() {
  const [matches,  setMatches]  = useState<Match[]>([]);
  const [editing,  setEditing]  = useState<Match | null | "new">(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);

  useEffect(() => {
    fetch("/api/admin/matches")
      .then(r => r.json()).then((d: Match[]) => { setMatches(d.sort((a,b) => b.date.localeCompare(a.date))); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function del(id: string, date: string) {
    if (!confirm(`确认删除 ${date} 的记录？`)) return;
    const res = await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
    if (res.ok) setMatches(p => p.filter(m => m.id !== id));
  }

  function onSave(m: Match) {
    setMatches(p => {
      const exists = p.some(x => x.id === m.id);
      const next   = exists ? p.map(x => x.id === m.id ? m : x) : [...p, m];
      return next.sort((a, b) => b.date.localeCompare(a.date));
    });
    setEditing(null);
  }

  const filtered = matches.filter(m =>
    !search ||
    m.date.includes(search) ||
    m.caption.includes(search) ||
    m.opponent?.includes(search) ||
    m.players?.some(p => p.includes(search))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (loading) return <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>加载中…</p>;

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="搜索日期 / 文案 / 队友…"
          style={{ ...S.field, flex: 1, maxWidth: 320 }} />
        <span style={{ fontSize: "0.72rem", color: "var(--muted)", whiteSpace: "nowrap" }}>{filtered.length} 条</span>
        <button onClick={() => setEditing("new")} style={{ ...S.btn(true), padding: "7px 18px", whiteSpace: "nowrap" }}>
          + 新增记录
        </button>
      </div>

      {/* New form */}
      {editing === "new" && (
        <MatchForm onSave={onSave} onCancel={() => setEditing(null)} />
      )}

      {/* List */}
      {pageItems.map(m => (
        <div key={m.id}>
          {/* Edit form inline */}
          {editing && editing !== "new" && (editing as Match).id === m.id && (
            <MatchForm initial={m} onSave={onSave} onCancel={() => setEditing(null)} />
          )}

          {/* Card */}
          {!(editing && editing !== "new" && (editing as Match).id === m.id) && (
            <div style={S.card}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                {/* Thumbnail */}
                {m.media[0] && (
                  <div style={{ width: 56, height: 56, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
                    {m.media[0].type === "image"
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={(m.media[0] as { thumb?: string; url: string }).thumb ?? m.media[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>🎬</div>
                    }
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 500, color: "var(--text)", fontSize: "0.875rem" }}>{m.date}</span>
                    {m.weekday && <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{m.weekday}</span>}
                    {m.opponent && <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>vs {m.opponent}</span>}
                    {m.playerScores && <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>多人赛</span>}
                    <span style={{ fontSize: "0.72rem", padding: "1px 8px", borderRadius: 4, background: m.result === "win" ? "rgba(110,231,183,0.1)" : "rgba(248,113,113,0.1)", color: m.result === "win" ? "var(--accent)" : "#f87171" }}>
                      {m.result === "win" ? "胜" : "负"}
                    </span>
                    {m.media.length > 0 && <span style={{ fontSize: "0.68rem", color: "var(--muted)", opacity: 0.6 }}>📎 {m.media.length}</span>}
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.caption}
                  </p>
                  {m.players?.length ? (
                    <p style={{ fontSize: "0.68rem", color: "var(--muted)", opacity: 0.6, marginTop: 3 }}>
                      {m.players.join(" · ")}
                    </p>
                  ) : null}
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setEditing(m)} style={{ ...S.btn(true), padding: "4px 12px" }}>编辑</button>
                  <button onClick={() => del(m.id, m.date)} style={{ ...S.btn(false, true), padding: "4px 12px" }}>删除</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {filtered.length === 0 && (
        <p style={{ color: "var(--muted)", fontSize: "0.78rem", textAlign: "center", padding: "2rem" }}>
          {search ? "没有匹配的记录" : "还没有任何记录"}
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            style={{ ...S.btn(), padding: "5px 12px", opacity: safePage === 1 ? 0.4 : 1, cursor: safePage === 1 ? "default" : "pointer" }}
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                ...S.btn(p === safePage),
                padding: "5px 11px",
                minWidth: 32,
                fontWeight: p === safePage ? 600 : 400,
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            style={{ ...S.btn(), padding: "5px 12px", opacity: safePage === totalPages ? 0.4 : 1, cursor: safePage === totalPages ? "default" : "pointer" }}
          >
            →
          </button>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════ stats / comments ═ */
function StatsTab() {
  const [visits, setVisits]   = useState<number|null>(null);
  const [cm,     setCm]       = useState({ pending: 0, approved: 0 });

  useEffect(() => {
    fetch("/api/visits").then(r => r.json()).then(d => setVisits(d.total)).catch(()=>{});
    fetch("/api/admin/comments").then(r => r.json()).then((rows: {is_approved:boolean}[]) =>
      setCm({ pending: rows.filter(c=>!c.is_approved).length, approved: rows.filter(c=>c.is_approved).length })
    ).catch(()=>{});
  }, []);

  const stats = [
    { label: "累计独立访客", value: visits ?? "—", accent: true },
    { label: "待审核留言",   value: cm.pending },
    { label: "已显示留言",   value: cm.approved },
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {stats.map(s => (
        <div key={s.label} style={{ flex: "1 1 140px", padding: 20, border: "1px solid var(--border)", borderRadius: 12, background: "rgba(255,255,255,0.02)" }}>
          <div style={{ fontSize: "2rem", fontWeight: 300, color: s.accent ? "var(--accent)" : "var(--text)" }}>{s.value}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

interface CommentRow { id:number; nickname:string; content:string; is_approved:boolean; created_at:string }
function CommentsTab() {
  const [rows, setRows] = useState<CommentRow[]>([]);
  useEffect(() => { fetch("/api/admin/comments").then(r=>r.json()).then(setRows).catch(()=>{}); }, []);

  const approve = async (id:number, approved:boolean) => {
    await fetch(`/api/admin/comments/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({approved}) });
    setRows(p => p.map(c => c.id===id ? {...c, is_approved:approved} : c));
  };
  const del = async (id:number) => {
    if (!confirm("确认删除？")) return;
    await fetch(`/api/admin/comments/${id}`, { method:"DELETE" });
    setRows(p => p.filter(c => c.id!==id));
  };

  const pending  = rows.filter(c=>!c.is_approved);
  const approved = rows.filter(c=> c.is_approved);

  const renderSection = (title: string, list: CommentRow[], isPending: boolean) => (
    <div key={title}>
      <h3 style={{ ...S.sectionTitle, margin:"20px 0 10px" }}>{title} ({list.length})</h3>
      {list.length===0 && <p style={{ fontSize:"0.78rem", color:"var(--muted)", opacity:0.5 }}>暂无</p>}
      {list.map(c => (
        <div key={c.id} style={{ ...S.card, opacity: isPending ? 1 : 0.7 }}>
          <p style={{ fontSize:"0.875rem", lineHeight:1.7, marginBottom:8 }}>{c.content}</p>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
            <span style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{c.nickname} · {new Date(c.created_at).toLocaleString("zh-CN")}</span>
            <div style={{ display:"flex", gap:6 }}>
              {isPending ? <button onClick={()=>approve(c.id,true)}  style={S.btn(true)}>通过</button>
                         : <button onClick={()=>approve(c.id,false)} style={S.btn()}>撤回</button>}
              <button onClick={()=>del(c.id)} style={S.btn(false,true)}>删除</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (<>{renderSection("待审核", pending, true)}{renderSection("已显示", approved, false)}</>);
}

/* ═══════════════════════════════════════════════════════════════════ main ═════ */
const TABS = ["比赛管理","留言审核","统计"] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [tab,    setTab]    = useState<Tab>("比赛管理");
  const logout = async () => { await fetch("/api/admin/login", { method:"DELETE" }); setAuthed(false); };

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  return (
    <main style={{ minHeight:"100svh", background:"var(--bg)", color:"var(--text)" }}>
      {/* Nav */}
      <div style={{ borderBottom:"1px solid var(--border)", padding:"0 clamp(1rem,4vw,2.5rem)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex" }}>
          {TABS.map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:"14px 18px", background:"none", border:"none",
              borderBottom:`2px solid ${tab===t ? "var(--accent)" : "transparent"}`,
              color: tab===t ? "var(--accent)" : "var(--muted)",
              cursor:"pointer", fontSize:"0.82rem", transition:"color .2s",
            }}>{t}</button>
          ))}
        </div>
        <span style={{ fontSize:"0.72rem", color:"var(--muted)", marginRight:8, opacity:0.6 }}>RALLY 管理后台</span>
        <button onClick={logout} style={{ ...S.btn(), fontSize:"0.72rem" }}>退出</button>
      </div>

      {/* Content */}
      <div style={{ maxWidth:900, margin:"0 auto", padding:"1.5rem clamp(1rem,4vw,2.5rem)" }}>
        {tab === "比赛管理" && <MatchesTab />}
        {tab === "留言审核" && <CommentsTab />}
        {tab === "统计"    && <StatsTab />}
      </div>
    </main>
  );
}
