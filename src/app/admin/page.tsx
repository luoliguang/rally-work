"use client";

import {
  useCallback, useEffect, useRef, useState, Fragment,
} from "react";
import { createPortal } from "react-dom";
import type { Match, Media, VideoMedia } from "@/lib/types";
import { Lightbox } from "@/components/Lightbox";

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

/* ─────────────────────────────── 自定义日期选择器（完全自绘，暗色主题）─── */
const CAL_WEEK = ["一", "二", "三", "四", "五", "六", "日"];

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => (value ? new Date(`${value}T00:00:00`) : new Date()));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const year  = view.getFullYear();
  const month = view.getMonth();
  const start = (new Date(year, month, 1).getDay() + 6) % 7; // 周一为首列
  const days  = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(start).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  const fmt = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const today = new Date();
  const todayStr = fmt(today.getFullYear(), today.getMonth(), today.getDate());

  const pick = (d: number) => { onChange(fmt(year, month, d)); setOpen(false); };
  const shiftMonth = (n: number) => setView(new Date(year, month + n, 1));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* 触发器 */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ ...S.field, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ color: value ? "var(--text)" : "var(--muted)", opacity: value ? 1 : 0.5 }}>
          {value || "选择日期"}
        </span>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="var(--accent)" strokeWidth="1.2" />
          <path d="M2 6h12M5.5 1.5v3M10.5 1.5v3" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {/* 弹出日历 */}
      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
            width: 280, padding: 14, borderRadius: 12,
            background: "var(--surface)", border: "1px solid var(--border)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* 头部：月份 + 翻月 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: 500 }}>
              {year} 年 {month + 1} 月
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button type="button" onClick={() => shiftMonth(-1)} style={{ ...S.btn(), padding: "3px 10px" }}>‹</button>
              <button type="button" onClick={() => shiftMonth(1)}  style={{ ...S.btn(), padding: "3px 10px" }}>›</button>
            </div>
          </div>

          {/* 星期表头 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
            {CAL_WEEK.map(w => (
              <div key={w} style={{ textAlign: "center", fontSize: "0.68rem", color: "var(--muted)", padding: "2px 0" }}>{w}</div>
            ))}
          </div>

          {/* 日期格子 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const ds = fmt(year, month, d);
              const isSel = ds === value;
              const isToday = ds === todayStr;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(d)}
                  style={{
                    aspectRatio: "1", border: "none", borderRadius: 7, cursor: "pointer",
                    fontSize: "0.78rem",
                    background: isSel ? "var(--accent)" : "transparent",
                    color: isSel ? "#07090e" : isToday ? "var(--accent)" : "var(--text)",
                    fontWeight: isSel || isToday ? 600 : 400,
                    outline: isToday && !isSel ? "1px solid rgba(110,231,183,0.4)" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* 底部：今天 / 清除 */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
            <button type="button" onClick={() => { onChange(""); setOpen(false); }}
              style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.75rem", cursor: "pointer" }}>清除</button>
            <button type="button" onClick={() => { onChange(todayStr); setOpen(false); }}
              style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "0.75rem", cursor: "pointer" }}>今天</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────── 自定义数字步进器（替换原生上下箭头）─── */
function NumberStepper({ value, onChange, min = 0, max }: { value: string; onChange: (v: string) => void; min?: number; max?: number }) {
  const num = Number(value) || 0;
  const step = (n: number) => {
    let next = num + n;
    if (next < min) next = min;
    if (max !== undefined && next > max) next = max;
    onChange(String(next));
  };
  const sideBtn: React.CSSProperties = {
    width: 34, flexShrink: 0, border: "none", background: "rgba(255,255,255,0.05)",
    color: "var(--accent)", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1,
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  return (
    <div style={{ display: "flex", alignItems: "stretch", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", height: 38 }}>
      <button type="button" onClick={() => step(-1)} style={sideBtn}>−</button>
      <input
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^\d]/g, ""))}
        inputMode="numeric"
        style={{ flex: 1, minWidth: 0, textAlign: "center", background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: "0.9rem" }}
      />
      <button type="button" onClick={() => step(1)} style={sideBtn}>+</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ login ════ */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw,       setPw]       = useState("");
  const [remember, setRemember] = useState(false);
  const [err,      setErr]      = useState("");

  const submit = async () => {
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw, remember }),
    });
    r.ok ? onLogin() : setErr("密码错误");
  };

  return (
    <main style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ width: 320, padding: 32, border: "1px solid var(--border)", borderRadius: 16 }}>
        <h1 style={{ color: "var(--text)", fontSize: "1rem", marginBottom: 24, fontWeight: 300, letterSpacing: "0.2em" }}>RALLY · 管理后台</h1>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="管理员密码" style={{ ...S.field, marginBottom: 12 }} />
        {err && <p style={{ color: "#f87171", fontSize: "0.72rem", marginBottom: 8 }}>{err}</p>}

        {/* 记住我 */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            style={{ accentColor: "var(--accent)", width: 14, height: 14, cursor: "pointer" }}
          />
          <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>记住我（30 天内免登录）</span>
        </label>

        <button onClick={submit} style={{ width: "100%", padding: 10, background: "var(--accent)", color: "#07090e", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>登录</button>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════ media manager ═ */

/* ── 视频帧提取：在浏览器内抓取指定秒数的帧，返回 JPEG Blob ─────────────────── */
function extractVideoFrame(videoUrl: string, atSecond = 2): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted      = true;
    video.preload    = "auto";
    video.crossOrigin = "anonymous";
    video.src        = videoUrl;

    const capture = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = video.videoWidth  || 1280;
      canvas.height = video.videoHeight || 720;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      canvas.toBlob((blob) => resolve(blob ?? null), "image/jpeg", 0.85);
    };

    video.addEventListener("seeked", capture, { once: true });
    video.addEventListener("error", () => resolve(null), { once: true });

    // canplaythrough 确保视频帧数据就绪后再 seek，避免黑帧
    video.addEventListener("canplaythrough", () => {
      const target = Math.min(atSecond, video.duration > 0 ? video.duration * 0.9 : atSecond);
      if (Math.abs(video.currentTime - target) < 0.1) {
        capture(); // 已经在目标帧，直接截取
      } else {
        video.currentTime = target;
      }
    }, { once: true });
  });
}

/* ── 图片裁剪工具 ─────────────────────────────────────────────────────────────── */
const CROP_RATIOS: { label: string; value: number | null }[] = [
  { label: "1:1 方形", value: 1 },
  { label: "4:3 风景", value: 4 / 3 },
  { label: "16:9 宽屏", value: 16 / 9 },
  { label: "自由",     value: null },
];

function computeDisplaySize(natW: number, natH: number): { w: number; h: number } {
  const limit = Math.min(520, window.innerWidth - 96, window.innerHeight - 320);
  let w = natW, h = natH;
  if (w > limit) { h = Math.round(h * limit / w); w = limit; }
  if (h > limit) { w = Math.round(w * limit / h); h = limit; }
  return { w, h };
}

function initCropRect(
  dw: number, dh: number, ratio: number | null
): { x: number; y: number; w: number; h: number } {
  if (ratio === null) return { x: 0, y: 0, w: dw, h: dh };
  let cw = dw, ch = cw / ratio;
  if (ch > dh) { ch = dh; cw = ch * ratio; }
  cw = Math.min(cw, dw); ch = Math.min(ch, dh);
  return { x: Math.round((dw - cw) / 2), y: Math.round((dh - ch) / 2), w: Math.round(cw), h: Math.round(ch) };
}

interface CropModalProps {
  file: File;
  onConfirm: (blob: Blob) => void;
  onSkip:    () => void;
  onCancel:  () => void;
}

function CropModal({ file, onConfirm, onSkip, onCancel }: CropModalProps) {
  const [imgUrl,   setImgUrl]   = useState("");
  const [natural,  setNatural]  = useState<{ w: number; h: number } | null>(null);
  const [display,  setDisplay]  = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [ratioIdx, setRatioIdx] = useState(0);
  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Keep latest mutable values accessible in global event handlers (avoids stale closures)
  const live = useRef({ display: { w: 0, h: 0 }, ratioIdx: 0, crop: null as typeof crop });
  live.current = { display, ratioIdx, crop };

  const dragRef = useRef<{
    type: "move" | "se";
    startMx: number; startMy: number;
    startCrop: { x: number; y: number; w: number; h: number };
  } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onImgLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const nat  = { w: img.naturalWidth, h: img.naturalHeight };
    setNatural(nat);
    const disp = computeDisplaySize(nat.w, nat.h);
    setDisplay(disp);
    setCrop(initCropRect(disp.w, disp.h, CROP_RATIOS[0].value));
  }, []);

  const changeRatio = useCallback((i: number) => {
    setRatioIdx(i);
    const { display: d } = live.current;
    if (d.w) setCrop(initCropRect(d.w, d.h, CROP_RATIOS[i].value));
  }, []);

  const startDrag = useCallback((e: React.MouseEvent, type: "move" | "se") => {
    e.preventDefault();
    const c = live.current.crop;
    if (!c) return;
    dragRef.current = { type, startMx: e.clientX, startMy: e.clientY, startCrop: { ...c } };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const { display: disp, ratioIdx: ri } = live.current;
      const { type, startMx, startMy, startCrop } = d;
      const ratio = CROP_RATIOS[ri].value;
      const dx = e.clientX - startMx;
      const dy = e.clientY - startMy;

      if (type === "move") {
        setCrop({
          ...startCrop,
          x: Math.max(0, Math.min(disp.w - startCrop.w, startCrop.x + dx)),
          y: Math.max(0, Math.min(disp.h - startCrop.h, startCrop.y + dy)),
        });
      } else {
        // SE 缩放角
        let nw = Math.max(40, startCrop.w + dx);
        let nh = ratio !== null ? nw / ratio : Math.max(40, startCrop.h + dy);
        nw = Math.min(nw, disp.w - startCrop.x);
        if (ratio !== null) {
          nh = nw / ratio;
          if (nh > disp.h - startCrop.y) { nh = disp.h - startCrop.y; nw = nh * ratio; }
        } else {
          nh = Math.min(nh, disp.h - startCrop.y);
        }
        setCrop({ ...startCrop, w: Math.max(40, nw), h: Math.max(40, nh) });
      }
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []); // empty deps — live ref carries latest state

  const handleConfirm = useCallback(() => {
    const { crop: c, display: disp } = live.current;
    if (!c || !natural || !imgRef.current) return;
    const sx = natural.w / disp.w;
    const sy = natural.h / disp.h;
    const cw = Math.round(c.w * sx);
    const ch = Math.round(c.h * sy);
    const canvas = document.createElement("canvas");
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(imgRef.current, Math.round(c.x * sx), Math.round(c.y * sy), cw, ch, 0, 0, cw, ch);
    const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
    canvas.toBlob(blob => { if (blob) onConfirm(blob); }, mime, 0.92);
  }, [natural, file, onConfirm]);

  const currentRatio = CROP_RATIOS[ratioIdx].value;

  // 用 Portal 渲染到 document.body，避免父层 backdropFilter / transform 创建新
  // stacking context 导致 position:fixed 定位基准错乱
  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onCancel}
    >
      <div
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, maxWidth: 660, width: "100%" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--text)" }}>
            裁剪图片 · 拖动调整范围
          </h3>
          <button type="button" onClick={onCancel} style={{ ...S.btn(), padding: "3px 10px", fontSize: "0.7rem" }}>×</button>
        </div>

        {/* 比例选择 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
          <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>比例</span>
          {CROP_RATIOS.map((r, i) => (
            <button key={r.label} type="button" onClick={() => changeRatio(i)}
              style={{ ...S.btn(i === ratioIdx), padding: "4px 12px", fontSize: "0.7rem" }}>
              {r.label}
            </button>
          ))}
        </div>

        {/* 图片 + 裁剪框 */}
        <div style={{ display: "flex", justifyContent: "center", background: "#000", borderRadius: 10, overflow: "hidden", minHeight: 120, marginBottom: 10 }}>
          <div style={{ position: "relative", width: display.w || "auto", height: display.h || "auto", flexShrink: 0, userSelect: "none" }}>
            {/* 仅在 imgUrl 赋值后才渲染，避免 src="" 触发浏览器重新请求页面 */}
            {imgUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img ref={imgRef} src={imgUrl} alt="" onLoad={onImgLoad} draggable={false}
                style={{ display: "block", width: display.w || "auto", height: display.h || "auto" }} />
            )}
            {crop && (
              <>
                {/* 四块遮罩遮住裁剪框以外区域 */}
                <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: crop.y, background: "rgba(0,0,0,0.6)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", left: 0, top: crop.y + crop.h, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", left: 0, top: crop.y, width: crop.x, height: crop.h, background: "rgba(0,0,0,0.6)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", left: crop.x + crop.w, top: crop.y, right: 0, height: crop.h, background: "rgba(0,0,0,0.6)", pointerEvents: "none" }} />

                {/* 裁剪框本体（拖动移位） */}
                <div
                  onMouseDown={e => startDrag(e, "move")}
                  style={{ position: "absolute", left: crop.x, top: crop.y, width: crop.w, height: crop.h, border: "2px solid var(--accent)", boxSizing: "border-box", cursor: "move" }}
                >
                  {/* 三等分辅助线 */}
                  {[1, 2].map(n => (
                    <Fragment key={n}>
                      <div style={{ position: "absolute", left: `${n * 33.33}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.2)", pointerEvents: "none" }} />
                      <div style={{ position: "absolute", top: `${n * 33.33}%`, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.2)", pointerEvents: "none" }} />
                    </Fragment>
                  ))}
                  {/* SE 缩放角 */}
                  <div
                    onMouseDown={e => { e.stopPropagation(); startDrag(e, "se"); }}
                    style={{ position: "absolute", bottom: -5, right: -5, width: 12, height: 12, background: "var(--accent)", borderRadius: 2, cursor: "se-resize" }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* 裁剪尺寸提示 */}
        {crop && natural && (
          <p style={{ fontSize: "0.67rem", color: "var(--muted)", textAlign: "center", marginBottom: 14 }}>
            裁剪后：{Math.round(crop.w * natural.w / display.w)} × {Math.round(crop.h * natural.h / display.h)} px
            {currentRatio !== null && ` · ${CROP_RATIOS[ratioIdx].label}`}
          </p>
        )}

        {/* 操作按钮 */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onSkip}         style={{ ...S.btn(),      padding: "8px 16px" }}>跳过，原图上传</button>
          <button type="button" onClick={handleConfirm}  style={{ ...S.btn(true),  padding: "8px 22px" }}>裁剪并上传</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface MediaManagerProps {
  items: Media[];
  onChange: (items: Media[]) => void;
}

function MediaManager({ items, onChange }: MediaManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading,        setUploading]        = useState(false);
  const [drag,             setDrag]             = useState(false);
  const [cropQueue,        setCropQueue]        = useState<File[]>([]);
  const [generatingPoster, setGeneratingPoster] = useState<number | null>(null);
  const [previewIndex,     setPreviewIndex]     = useState<number | null>(null);
  const [posterTime,       setPosterTime]       = useState(2);

  // 上传任意 File 或 Blob，返回可访问的 URL
  const uploadOne = useCallback(async (blob: Blob | File, fallbackName?: string): Promise<string | null> => {
    const f = blob instanceof File
      ? blob
      : new File([blob], fallbackName ?? `crop-${Date.now()}.${blob.type === "image/png" ? "png" : "jpg"}`, { type: blob.type });
    const form = new FormData(); form.append("file", f);
    const res  = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) return null;
    return ((await res.json()) as { url: string }).url;
  }, []);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const arr    = Array.from(files);
    const isVid  = (f: File) => /\.(mp4|mov|webm)$/i.test(f.name) || f.type.startsWith("video/");
    const videos = arr.filter(f =>  isVid(f));
    const images = arr.filter(f => !isVid(f));

    // 视频直接上传（无需裁剪），上传后自动提取封面
    if (videos.length > 0) {
      setUploading(true);
      const results: Media[] = [];
      for (const file of videos) {
        const url = await uploadOne(file);
        if (url) {
          const frameBlob = await extractVideoFrame(url);
          const poster = frameBlob
            ? await uploadOne(frameBlob, `poster-${Date.now()}.jpg`) ?? undefined
            : undefined;
          results.push({ type: "video", url, ...(poster ? { poster } : {}) });
        }
      }
      onChange([...items, ...results]);
      setUploading(false);
    }

    // 图片进入裁剪队列，每张逐一弹出裁剪框
    if (images.length > 0) setCropQueue(q => [...q, ...images]);
  }, [items, onChange, uploadOne]);

  // 从剪贴板直接粘贴图片（截图、复制的图片）
  const pasteImage = useCallback(async () => {
    try {
      const clipItems = await navigator.clipboard.read();
      const files: File[] = [];
      for (const item of clipItems) {
        const imgType = item.types.find(t => t.startsWith("image/"));
        if (imgType) {
          const blob = await item.getType(imgType);
          const ext  = imgType.split("/")[1] || "png";
          files.push(new File([blob], `pasted-${Date.now()}.${ext}`, { type: imgType }));
        }
      }
      if (files.length) await uploadFiles(files);
      else alert("剪贴板里没有图片。先截图或右键复制一张图片再粘贴。");
    } catch {
      alert("无法读取剪贴板，请确认浏览器已授予剪贴板权限。");
    }
  }, [uploadFiles]);

  // 裁剪确认：上传已裁剪的 Blob，然后处理队列下一张
  const onCropConfirm = useCallback(async (blob: Blob) => {
    setUploading(true);
    const url = await uploadOne(blob);
    if (url) onChange([...items, { type: "image", url, thumb: url }]);
    setCropQueue(q => q.slice(1));
    setUploading(false);
  }, [items, onChange, uploadOne]);

  // 跳过裁剪：直接上传原图
  const onCropSkip = useCallback(async () => {
    const file = cropQueue[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadOne(file);
    if (url) onChange([...items, { type: "image", url, thumb: url }]);
    setCropQueue(q => q.slice(1));
    setUploading(false);
  }, [cropQueue, items, onChange, uploadOne]);

  const onCropCancel = useCallback(() => setCropQueue([]), []);

  // 为已有视频手动生成封面（使用 posterTime 指定秒数）
  const generatePosterFor = useCallback(async (i: number) => {
    const m = items[i];
    if (m.type !== "video" || !m.url) return;
    setGeneratingPoster(i);
    const frameBlob = await extractVideoFrame(m.url, posterTime);
    if (frameBlob) {
      const poster = await uploadOne(frameBlob, `poster-${Date.now()}.jpg`);
      if (poster) onChange(items.map((item, idx) => idx === i ? { ...item, poster } as Media : item));
    }
    setGeneratingPoster(null);
  }, [items, onChange, uploadOne, posterTime]);

  // 设为封面：将第 i 项移到 index 0
  const setCover = useCallback((i: number) => {
    const arr = [...items];
    const [item] = arr.splice(i, 1);
    arr.unshift(item);
    onChange(arr);
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
        onPaste={e => {
          const imgFiles = Array.from(e.clipboardData.files).filter(f => f.type.startsWith("image/") || f.type.startsWith("video/"));
          if (imgFiles.length) { e.preventDefault(); uploadFiles(imgFiles); }
        }}
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
            <p style={{ fontSize: "0.78rem", color: "var(--muted)" }}>点击、拖拽或粘贴上传图片/视频</p>
            <p style={{ fontSize: "0.68rem", color: "var(--muted)", opacity: 0.5, marginTop: 4 }}>jpg / png / webp / mp4 / mov，≤100 MB</p>
          </>
        }
        <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={e => e.target.files && uploadFiles(e.target.files)} />
      </div>

      {/* Paste button */}
      <button onClick={pasteImage} style={{ ...S.btn(), fontSize: "0.72rem", marginBottom: 10 }}>
        📋 从剪贴板粘贴图片
      </button>

      {/* Media list */}
      {items.map((m, i) => (
        <div key={i} style={{
          display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8,
          padding: 10,
          border: `1px solid ${i === 0 && m.type === "image" ? "rgba(110,231,183,0.4)" : "var(--border)"}`,
          borderRadius: 8, background: "rgba(255,255,255,0.02)",
        }}>
          {/* Preview — 点击全屏预览 */}
          <div
            onClick={() => setPreviewIndex(i)}
            title="点击预览"
            style={{
              width: 56, height: 56, borderRadius: 6, overflow: "hidden",
              flexShrink: 0, background: "var(--surface)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "zoom-in", position: "relative",
            }}
          >
            {m.type === "image" && m.url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : m.type === "video" && (m as VideoMedia).poster
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={(m as VideoMedia).poster} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: "1.2rem" }}>{m.type === "video" ? "🎬" : "🖼"}</span>
            }
            {/* 封面角标 */}
            {i === 0 && m.type === "image" && (
              <span style={{
                position: "absolute", bottom: 2, right: 2,
                fontSize: "0.55rem", lineHeight: 1,
                background: "var(--accent)", color: "#07090e",
                borderRadius: 3, padding: "1px 4px", fontWeight: 700,
              }}>封面</span>
            )}
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Type + 封面操作 */}
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              {(["image", "video"] as const).map(t => (
                <button key={t} onClick={() => update(i, { type: t })}
                  style={{ ...S.btn(m.type === t), padding: "2px 10px", fontSize: "0.68rem" }}>{t}</button>
              ))}
              {i > 0 && (
                <button
                  onClick={() => setCover(i)}
                  style={{ ...S.btn(), padding: "2px 10px", fontSize: "0.68rem" }}
                >★ 设为封面</button>
              )}
              {i === 0 && (
                <span style={{ fontSize: "0.65rem", color: "var(--accent)", opacity: 0.8 }}>★ 当前封面</span>
              )}
            </div>
            {/* URL */}
            <input value={m.url} onChange={e => update(i, { url: e.target.value })} placeholder="图片/视频 URL" style={{ ...S.field, fontSize: "0.75rem", padding: "6px 10px" }} />
            {/* Thumb / Poster */}
            {m.type === "image"
              ? <input value={(m as { thumb?: string }).thumb ?? ""} onChange={e => update(i, { thumb: e.target.value } as Partial<Media>)} placeholder="缩略图 URL（可留空，默认同上）" style={{ ...S.field, fontSize: "0.75rem", padding: "6px 10px" }} />
              : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <input value={(m as VideoMedia).poster ?? ""} onChange={e => update(i, { poster: e.target.value } as Partial<Media>)} placeholder="视频封面 URL（可留空）" style={{ ...S.field, fontSize: "0.75rem", padding: "6px 10px" }} />
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: "0.68rem", color: "var(--muted)", flexShrink: 0 }}>第</span>
                    <input
                      type="number" min={0} max={9999} value={posterTime}
                      onChange={e => setPosterTime(Math.max(0, Number(e.target.value)))}
                      style={{ ...S.field, width: 64, fontSize: "0.75rem", padding: "4px 8px", textAlign: "center" }}
                    />
                    <span style={{ fontSize: "0.68rem", color: "var(--muted)", flexShrink: 0 }}>秒截帧</span>
                    <button
                      onClick={() => generatePosterFor(i)}
                      disabled={generatingPoster === i}
                      style={{ ...S.btn(), fontSize: "0.68rem", padding: "4px 10px", flexShrink: 0, whiteSpace: "nowrap" }}
                    >
                      {generatingPoster === i ? "生成中…" : "生成封面"}
                    </button>
                  </div>
                </div>
            }
          </div>

          <button onClick={() => remove(i)} style={{ ...S.btn(false, true), padding: "4px 10px", flexShrink: 0 }}>×</button>
        </div>
      ))}

      <button onClick={addUrl} style={{ ...S.btn(), fontSize: "0.72rem" }}>+ 手动填入 URL</button>

      {/* 裁剪弹窗：队列里有图片时逐一弹出 */}
      {cropQueue.length > 0 && (
        <CropModal
          file={cropQueue[0]}
          onConfirm={onCropConfirm}
          onSkip={onCropSkip}
          onCancel={onCropCancel}
        />
      )}

      {/* 全屏预览灯箱 */}
      {previewIndex !== null && items.length > 0 && (
        <Lightbox
          media={items}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onChange={setPreviewIndex}
        />
      )}
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
  players: string[];                      // 出场队友（勾选）
  scores: Record<string, string>;         // 多人赛：player -> 得分
  gamesPlayed: string; gamesWon: string;
  caption: string; mvp: string;
  media: Media[];
}

function buildInitialForm(match?: Match): FormState {
  const hasMP = !!(match?.playerScores?.length);
  const scores: Record<string, string> = {};
  match?.playerScores?.forEach(p => { scores[p.player] = String(p.score); });
  return {
    id:          match?.id ?? "",
    date:        match?.date ?? "",
    mode:        hasMP ? "mp" : "2p",
    opponent:    match?.opponent ?? "",
    scoreUs:     match?.scoreUs?.toString() ?? "",
    scoreThem:   match?.scoreThem?.toString() ?? "",
    result:      match?.result ?? "win",
    players:     match?.players ?? (match?.playerScores?.map(p => p.player) ?? []),
    scores,
    gamesPlayed: match?.gamesPlayed?.toString() ?? "1",
    gamesWon:    match?.gamesWon?.toString() ?? "1",
    caption:     match?.caption ?? "",
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
    players:     f.players,
    mvp:         f.mvp.trim() || undefined,
    media:       f.media,
  };
  if (f.mode === "2p") {
    base.opponent  = f.opponent.trim() || undefined;
    base.scoreUs   = Number(f.scoreUs)   || 0;
    base.scoreThem = Number(f.scoreThem) || 0;
  } else {
    // 多人赛：得分行直接来自勾选的出场队友
    base.playerScores = f.players.map(p => ({ player: p, score: Number(f.scores[p]) || 0 }));
  }
  return base;
}

interface MatchFormProps {
  initial?: Match;
  onSave: (m: Match) => void;
  onCancel: () => void;
}

function MatchForm({ initial, onSave, onCancel }: MatchFormProps) {
  const [f, setF]       = useState<FormState>(() => buildInitialForm(initial));
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const [roster, setRoster] = useState<string[]>([]);
  const [newName, setNewName] = useState("");

  // 加载队友名单；合并已存在于本记录但不在名单里的旧名字
  useEffect(() => {
    fetch("/api/admin/teammates")
      .then(r => r.json())
      .then((rows: { name: string }[]) => {
        const names = rows.map(r => r.name);
        const extra = f.players.filter(p => !names.includes(p));
        setRoster([...names, ...extra]);
      })
      .catch(() => setRoster(f.players));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setF(p => ({ ...p, [k]: v }));

  // 勾选 / 取消出场队友
  const togglePlayer = (name: string) =>
    setF(p => p.players.includes(name)
      ? { ...p, players: p.players.filter(n => n !== name) }
      : { ...p, players: [...p.players, name] });

  const setScore = (player: string, val: string) =>
    setF(p => ({ ...p, scores: { ...p.scores, [player]: val } }));

  // 临时添加新队友（同时存入名单，下次默认就有）
  async function addTeammate() {
    const name = newName.trim();
    if (!name || roster.includes(name)) { setNewName(""); return; }
    setRoster(r => [...r, name]);
    setF(p => ({ ...p, players: [...p.players, name] }));
    setNewName("");
    fetch("/api/admin/teammates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(() => {});
  }

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
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontWeight: 400, fontSize: "1rem", color: "var(--text)" }}>
          {initial ? `编辑记录 · ${initial.date}` : "新增比赛记录"}
        </h3>
        <button onClick={onCancel} style={S.btn()}>关闭</button>
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
        <Row cols="180px 1fr">
          <Field l="日期 *">
            <DatePicker value={f.date} onChange={v => set("date", v)} />
          </Field>
          <Field l="星期（自动）">
            <div style={{ ...S.field, display: "flex", alignItems: "center", color: f.date ? "var(--accent)" : "var(--muted)", opacity: f.date ? 1 : 0.4 }}>
              {autoWeekday(f.date) || "选择日期后自动显示"}
            </div>
          </Field>
        </Row>
        {!initial && (
          <Field l="ID（留空自动生成）">
            <input value={f.id} onChange={e => set("id", e.target.value)} placeholder="2026-06-10-vs-laozhang" style={S.field} />
          </Field>
        )}
      </div>

      {/* 出场队友（勾选） */}
      <div style={S.section}>
        <p style={S.sectionTitle}>出场队友</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {roster.map(name => {
            const on = f.players.includes(name);
            return (
              <button key={name} onClick={() => togglePlayer(name)}
                style={{
                  ...S.btn(on), padding: "6px 14px",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                <span style={{ fontSize: "0.85rem" }}>{on ? "✓" : "+"}</span>
                {name}
              </button>
            );
          })}
        </div>
        {/* 临时新增队友 */}
        <div style={{ display: "flex", gap: 8, maxWidth: 280 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTeammate())}
            placeholder="添加新队友…" style={{ ...S.field, fontSize: "0.78rem", padding: "6px 10px" }} />
          <button onClick={addTeammate} style={{ ...S.btn(), whiteSpace: "nowrap" }}>添加</button>
        </div>
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
              <input type="number" className="rl-num" value={f.scoreUs} onChange={e => set("scoreUs", e.target.value)} style={S.field} />
            </Field>
            <Field l="对方得分">
              <input type="number" className="rl-num" value={f.scoreThem} onChange={e => set("scoreThem", e.target.value)} style={S.field} />
            </Field>
            <Field l="胜负">
              <select className="rl-select" value={f.result} onChange={e => set("result", e.target.value as "win"|"loss")} style={S.field}>
                <option value="win">胜</option>
                <option value="loss">负</option>
              </select>
            </Field>
          </Row>
        ) : f.players.length === 0 ? (
          <p style={{ fontSize: "0.78rem", color: "var(--muted)", opacity: 0.6, padding: "8px 0" }}>
            先在上方勾选出场队友，这里会自动生成各人的得分行。
          </p>
        ) : (
          <>
            {f.players.map(player => (
              <div key={player} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 7 }}>
                <span style={{ width: 90, fontSize: "0.85rem", color: "var(--text)" }}>{player}</span>
                <input type="number" className="rl-num" value={f.scores[player] ?? ""} onChange={e => setScore(player, e.target.value)}
                  placeholder="积分" style={{ ...S.field, width: 110 }} />
              </div>
            ))}
            <p style={{ fontSize: "0.7rem", color: "var(--muted)", opacity: 0.5, marginTop: 4 }}>
              MVP 与胜负将按最高分自动判定（最高分者为记录方，胜）
            </p>
          </>
        )}
        <div style={{ marginTop: 12 }}>
          <Row>
            <Field l="总场次">
              <NumberStepper value={f.gamesPlayed} onChange={v => set("gamesPlayed", v)} min={0} />
            </Field>
            <Field l="胜场">
              <NumberStepper value={f.gamesWon} onChange={v => set("gamesWon", v)} min={0} />
            </Field>
          </Row>
        </div>
      </div>

      {/* MVP & Caption */}
      <div style={S.section}>
        <p style={S.sectionTitle}>文案</p>
        <Field l="MVP（可选，留空时多人赛按得分自动计算）">
          <input value={f.mvp} onChange={e => set("mvp", e.target.value)} placeholder="留空自动判定" style={{ ...S.field, marginBottom: 12 }} />
        </Field>
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
          style={{ ...S.btn(true), padding: "10px 32px", fontSize: "0.85rem" }}>
          {saving ? "保存中…" : initial ? "保存更改" : "创建记录"}
        </button>
        <button onClick={onCancel} style={{ ...S.btn(), padding: "10px 24px" }}>取消</button>
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
  const [toast,    setToast]    = useState("");

  useEffect(() => {
    fetch("/api/admin/matches")
      .then(r => r.json()).then((d: Match[]) => { setMatches(d.sort((a,b) => b.date.localeCompare(a.date))); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  }

  async function del(id: string, date: string) {
    if (!confirm(`确认删除 ${date} 的记录？`)) return;
    const res = await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
    if (res.ok) { setMatches(p => p.filter(m => m.id !== id)); showToast("已删除"); }
  }

  function onSave(m: Match) {
    const isEdit = matches.some(x => x.id === m.id);
    setMatches(p => {
      const next = isEdit ? p.map(x => x.id === m.id ? m : x) : [...p, m];
      return next.sort((a, b) => b.date.localeCompare(a.date));
    });
    setEditing(null);
    showToast(isEdit ? "✓ 修改已保存" : "✓ 记录创建成功");
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

      {/* List —— 卡片始终在顶部，表单走弹窗，不会被推下去 */}
      {pageItems.map(m => (
        <div key={m.id} style={S.card}>
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

      {/* ── 弹窗表单 ─────────────────────────────────────────────────────────── */}
      {editing && (
        <div
          onClick={() => setEditing(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)",
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            overflowY: "auto", padding: "clamp(1rem,4vh,3rem) 1rem",
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 720 }}>
            <MatchForm
              initial={editing === "new" ? undefined : editing}
              onSave={onSave}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}

      {/* ── 成功提示 Toast ───────────────────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
            zIndex: 200, padding: "12px 24px", borderRadius: 999,
            background: "var(--accent)", color: "#07090e",
            fontSize: "0.85rem", fontWeight: 600,
            boxShadow: "0 8px 30px rgba(110,231,183,0.3)",
            animation: "toast-in 0.3s ease",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════ stats / comments ═ */
const DANMAKU_SPEEDS = [
  { key: "slow",   label: "慢速", desc: "32 秒 / 条" },
  { key: "medium", label: "中速", desc: "22 秒 / 条（默认）" },
  { key: "fast",   label: "快速", desc: "14 秒 / 条" },
] as const;
type SpeedKey = "slow" | "medium" | "fast";

function StatsTab() {
  const [visits, setVisits] = useState<number|null>(null);
  const [cm,     setCm]     = useState({ pending: 0, approved: 0 });
  const [speed,  setSpeed]  = useState<SpeedKey>("medium");

  useEffect(() => {
    fetch("/api/visits").then(r => r.json()).then(d => setVisits(d.total)).catch(()=>{});
    fetch("/api/admin/comments").then(r => r.json()).then((rows: {is_approved:boolean}[]) =>
      setCm({ pending: rows.filter(c=>!c.is_approved).length, approved: rows.filter(c=>c.is_approved).length })
    ).catch(()=>{});
    try {
      const saved = JSON.parse(localStorage.getItem("cw-speed") ?? "null");
      if (saved === "slow" || saved === "medium" || saved === "fast") setSpeed(saved);
    } catch {}
  }, []);

  function changeSpeed(key: SpeedKey) {
    setSpeed(key);
    try { localStorage.setItem("cw-speed", JSON.stringify(key)); } catch {}
  }

  const stats = [
    { label: "累计独立访客", value: visits ?? "—", accent: true },
    { label: "待审核留言",   value: cm.pending },
    { label: "已显示留言",   value: cm.approved },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 数据统计卡片 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {stats.map(s => (
          <div key={s.label} style={{ flex: "1 1 140px", padding: 20, border: "1px solid var(--border)", borderRadius: 12, background: "rgba(255,255,255,0.02)" }}>
            <div style={{ fontSize: "2rem", fontWeight: 300, color: s.accent ? "var(--accent)" : "var(--text)" }}>{s.value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 留言弹幕速度 */}
      <div style={{ padding: 20, border: "1px solid var(--border)", borderRadius: 12, background: "rgba(255,255,255,0.02)" }}>
        <p style={S.sectionTitle}>留言弹幕速度</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {DANMAKU_SPEEDS.map(({ key, label, desc }) => (
            <button key={key} onClick={() => changeSpeed(key)}
              style={{ ...S.btn(speed === key), padding: "8px 18px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
              <span style={{ fontSize: "0.82rem" }}>{label}</span>
              <span style={{ fontSize: "0.65rem", opacity: 0.6 }}>{desc}</span>
            </button>
          ))}
        </div>
        <p style={{ fontSize: "0.68rem", color: "var(--muted)", opacity: 0.5 }}>
          偏好存储在当前浏览器，切换后刷新留言墙页面生效。
        </p>
      </div>
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
