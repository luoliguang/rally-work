# Rally —— 羽毛球记录站

> 一个记录我和朋友们打羽毛球的个人网站：**时间线、当天战绩、文案、当天的照片 / 视频**。
> 单人维护，部署在自有服务器。视觉走暗色电影感（类苹果），用 GSAP 做滚动动画。
>
> *(项目名暂定 `Rally`，可改。Rally 既是羽毛球的"一个回合"，也有"相聚、召集"的意思。)*

---

## 这份文档的作用

这是项目的**唯一事实来源（single source of truth）**。无论是我自己、还是 AI 助手（如 Claude Code），读完它就应该清楚：要做什么、怎么做、有哪些约束。需求变更时，**先改这份文档，再改代码**。

> 给 agent 的指令放在 `CLAUDE.md`（命令、架构约束）。本 README 负责产品意图与设计，两者互补。

---

## 1. 目标与范围

### MVP（先做这个，目标是先跑起来）

- **首页**：电影感开场（GSAP），展示最新一场战绩 + 总览数字。
- **时间线页**：按时间倒序列出所有比赛，用分页 /「加载更多」。
- **单场详情页**：完整比分、文案、当天照片 / 视频。
- 数据全部来自**一个 JSON 文件**，由后端（Next 的 Route Handler）通过 API 提供。

### 暂不做（以后再说，别在 MVP 里碰）

- 在线录入后台（admin 表单）
- 数据库 / SQLite（先用 JSON）
- 数据统计图表页、相册页
- 登录 / 多人协作上传

### 已搭好的起步骨架

首页、时间线、单场详情、关于我们四个页面已跑通；`matches.json` + 数据层 + 四个 API + 衍生统计已就绪。**GSAP 电影感开场尚未做**（按里程碑放最后），目前首页是静态展示。

---

## 2. 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 框架 | **Next.js (App Router) + TypeScript** | 前端页面与后端 API 一体，SSR/SSG |
| 样式 | **Tailwind CSS v4** | 暗色主题，无 `tailwind.config.js`（v4 用 CSS `@import`） |
| 动画 | GSAP（含 ScrollTrigger） | **待接入**，只重点用在首页 |
| 数据 | 项目内 `src/data/matches.json` | 手动维护，数据层读取后经 API / Server Component 返回 |
| 部署 | 自有服务器 + nginx | `next start` 跑 Node 进程，nginx 反代；媒体走 `/media` 静态托管 |

> 历史说明：早期 README 设想的是 Vue 3 + Express 双目录方案，现已统一为 Next.js 单体方案（前后端同仓）。产品设计（数据模型、页面、统计、性能原则）完全保留。

---

## 3. 架构

```
浏览器 ──> Next.js App Router
              ├─ Server Component  ──直接调用──> 数据层 (src/lib)
              └─ Route Handler (/api/*) ──> 数据层 ──读取──> matches.json
                                              │
                                              └─ 现算衍生统计（胜率/连胜等，src/lib/stats.ts）
媒体文件（图片/视频）由 nginx 直接托管在 /media 下（远程 URL 也可用于早期开发）
```

- 页面是 Server Component，**直接调用数据层**（不经 fetch）做 SSR/SSG。
- `/api/*` Route Handler 供未来客户端组件 / 外部调用；与页面共享同一套数据层。
- 数据层只做三件事：读 JSON、算衍生统计、（未来）托管媒体。

---

## 4. 数据模型（核心 —— 务必照这个来）

一条记录代表**一天的一次打球**（一次相聚），不是单局。文件：`src/data/matches.json`，类型定义见 `src/lib/types.ts`：

```json
{
  "matches": [
    {
      "id": "2026-06-04-riverside-smashers",
      "date": "2026-06-04",
      "weekday": "周四",
      "opponent": "Riverside Smashers",
      "scoreUs": 21,
      "scoreThem": 18,
      "result": "win",
      "gamesPlayed": 3,
      "gamesWon": 2,
      "caption": "当天文案，可长……",
      "players": ["阿明", "小K", "老张"],
      "mvp": "老张",
      "media": [
        { "type": "image", "url": "/media/2026-06-04/01.jpg", "thumb": "/media/2026-06-04/01-thumb.jpg" },
        { "type": "video", "url": "/media/2026-06-04/clip1.mp4", "poster": "/media/2026-06-04/clip1-poster.jpg", "duration": "00:15" }
      ]
    }
  ]
}
```

字段说明：

- `id`：唯一标识，建议用 `日期-对手slug`，详情页路由 `/matches/[id]` 就用它。
- `date` / `weekday`：日期与星期（星期可选，也可由 date 推算）。
- `opponent`：对手队名。
- `scoreUs` / `scoreThem`：当天有代表性的那局比分（首页和卡片上的大比分）。
- `result`：`"win"` 或 `"loss"`，当天整体胜负标签。
- `gamesPlayed` / `gamesWon`：当天总场次 / 获胜场次，用来算统计。
- `caption`：当天文案，可长。
- `players` / `mvp`：可选。
- `media`：图片或视频数组；图片带 `thumb`，视频务必带 `poster` 封面和 `duration`。

> **重要原则：总场次、总胜场、胜率、最高连胜等统计数字一律不存进 JSON，全部由 `src/lib/stats.ts` 从 `matches` 数组现算。** 存原始数据、算衍生统计，以后加功能不用改结构。
>
> 注：「最高连胜」当前按"按天的 result 连胜"近似计算。

---

## 5. API（MVP）

均为 Next.js Route Handler，位于 `src/app/api/*/route.ts`：

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | `/api/matches?page=1&pageSize=10` | 分页比赛列表（按日期倒序） |
| GET | `/api/matches/:id` | 单场详情 |
| GET | `/api/latest` | 最新一场（首页用） |
| GET | `/api/stats` | 衍生统计：总场次、总胜场、胜率、最高连胜、记录天数、队友数 |

- 媒体文件走静态路径 `/media/...`，不经过 API。
- 页面（Server Component）SSR 时**不走这些 API**，而是直接调用 `src/lib` 数据层；API 留给客户端 / 外部使用。

---

## 6. 页面与交互

### ① 首页 `/`（`src/app/page.tsx`）—— 电影感开场（GSAP 集中在这）

内容固定、只取最新几条数据，所以永远不会卡。计划随滚动展开的几个"镜头"（**GSAP 待接入**）：

- **Hero**：大标题逐行 / 逐字浮现，羽毛球大图随滚动 / 鼠标做轻微视差。
- **总览数字**：`/api/stats` 的数字做 count-up 滚动计数。
- **最新一场高光**：大比分 + 胜负 + 对手 + 一句文案，随滚动淡入上移。
- **引导**：「查看全部比赛 →」跳到时间线。

### ② 时间线页 `/timeline`（`src/app/timeline/page.tsx`）—— 数据区（动效要克制）

- 主体：竖向时间线，每条卡片 = 日期 + 比分 + 胜负标签 + 对手 + **3–4 张缩略图** +「查看详情」。
- 计划：顶部筛选（按月 / 胜负 / 对手）、底部**「加载更多」分页**（**不要无限滚动**）。
- **缩略图只是图片，不自动播视频。**

### ③ 单场详情页 `/matches/[id]`（`src/app/matches/[id]/page.tsx`）—— 重内容的归宿

- 顶部：大比分 + 胜负 + 日期 + 对手 + 当天场次 + 出场队友 / MVP。
- 文案区：当天那段话。
- 媒体区：照片 + 视频；**视频用 `poster` 占位、`preload="none"`，点击才加载播放**。计划加 lightbox 放大。

### ④ 关于我们 `/about`（`src/app/about/page.tsx`）

队伍简介 + 队友头像墙 + 一句口号。（当前为占位。）

---

## 7. 设计与动画规范

- **暗色电影感**：近黑底 + 一个高饱和点缀色（当前用 emerald），大字、大留白。
- **GSAP 只用在首页"开场"**：标题逐字、数字 count-up、视差、stagger 淡入。列表页动效要轻。
- **动画克制有目的**，不是什么都在动 —— 这是显得"高级"的关键。
- **必须支持 `prefers-reduced-motion`**：用户关动效时，跳过花哨动画。

---

## 8. 性能原则（重要，直接关系到卡不卡）

- **列表轻、详情重**：时间线只放缩略图（`thumb` / `poster`），重媒体全部放详情页。
- **不做无限滚动**，用分页 /「加载更多」。
- **视频用封面占位，点击才加载播放**；图片懒加载（`loading="lazy"`）。
- 列表数据真的大了，再上虚拟列表。

---

## 9. 媒体 / 视频

- 全部托管在**自有服务器**，nginx 直接 serve（mp4 默认支持拖动进度条 / range 请求）。
- **大文件先压缩**，首屏图 / 视频尤其要小。
- 每个媒体在 JSON 里存好 `url`，图片存 `thumb`，视频存 `poster` 和 `duration`。
- 早期开发可直接用远程图片 URL；`next.config.mjs` 暂时放开了所有 HTTPS 来源，上线前收紧。

---

## 10. 目录结构

```
really-work/
├─ README.md
├─ CLAUDE.md                  # 给 AI agent 的命令与架构约束
├─ next.config.mjs
├─ postcss.config.mjs         # Tailwind v4 plugin
├─ eslint.config.mjs          # flat config
└─ src/
   ├─ app/
   │  ├─ layout.tsx
   │  ├─ globals.css          # @import "tailwindcss"
   │  ├─ page.tsx             # 首页
   │  ├─ timeline/page.tsx
   │  ├─ matches/[id]/page.tsx
   │  ├─ about/page.tsx
   │  └─ api/
   │     ├─ matches/route.ts
   │     ├─ matches/[id]/route.ts
   │     ├─ latest/route.ts
   │     └─ stats/route.ts
   ├─ components/             # MatchCard、ScoreBadge、MediaItem、StatsBar
   ├─ lib/
   │  ├─ types.ts             # Match、Media、Stats
   │  ├─ matches.ts           # 读 JSON + 分页 + 取单条
   │  └─ stats.ts             # 从 matches 现算衍生统计
   └─ data/
      └─ matches.json         # 比赛数据（手动维护，唯一事实来源）
```

---

## 11. 本地开发

```bash
npm install
npm run dev      # http://localhost:3000
```

| 命令 | 作用 |
|---|---|
| `npm run dev` | 开发服务器（Turbopack） |
| `npm run build` | 生产构建（含类型检查） |
| `npm start` | 跑生产构建 |
| `npm run lint` | ESLint |
| `npm run typecheck` | 仅类型检查 |

---

## 12. MVP 里程碑（按这个顺序做）

1. ~~数据层 + `matches.json` + 四个 API（先塞假数据）~~ ✅ 已完成
2. ~~脚手架 + 四个路由页面~~ ✅ 已完成
3. **时间线页**：补「加载更多」分页与筛选。
4. **单场详情页**：补图片 lightbox。
5. **首页电影感（GSAP）放最后做**：最花时间，先保证数据链路都通了再雕。
6. **部署**：`next build` + nginx 反代到 Node，媒体走 `/media`。

---

## 13. 以后可选的升级（不在 MVP）

- 极简后台 `/admin`：密码保护，填表 + 上传就能加一场，免去手改 JSON。
- 数据从 JSON 迁到 **SQLite**（配合后台用更顺）。
- 数据统计页：胜率曲线、对各对手战绩、月度场次柱状图。
- 相册页：所有照片 / 视频瀑布流。
- 媒体上传与本地存储（目前媒体仅按 URL 引用）。
