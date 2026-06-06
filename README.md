# Rally — 羽毛球记录站

> 在工厂相遇，时间不多，但我们总能挤出来打几拍。  
> 这个站点记录我们每一场球的点滴——时间线、照片、视频、留言。

---

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 16 (App Router) + TypeScript |
| 样式 | Tailwind CSS v4 |
| 动画 | GSAP 3 (ScrollTrigger) |
| 比赛数据 | `src/data/matches.json`（文件即数据库） |
| 互动数据 | PostgreSQL（访问统计 / 表情反应 / 留言） |
| 媒体存储 | 服务器文件系统（`public/uploads/`） |

---

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量模板
cp .env.example .env.local
# 然后编辑 .env.local，填入数据库连接字符串和管理员密码

# 3. 启动开发服务器（Turbopack）
npm run dev
# → http://localhost:3001
```

> **不配置数据库也能跑**：表情反应、留言、访问统计接口会报错，但比赛时间线正常显示。

---

## 命令速查

| 命令 | 说明 |
|---|---|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建（含类型检查） |
| `npm start` | 启动生产服务 |
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | 仅类型检查 |

---

## 数据库初始化

1. 创建一个 PostgreSQL 数据库（宝塔面板 → 数据库 → 添加 PostgreSQL，或本地 pgAdmin），记录用户名/密码/库名
2. 把连接字符串填入 `.env`（或 `.env.local`）：

```
DATABASE_URL=postgresql://rally_user:your_password@localhost:5432/rally_db
```

3. **一键建表**（推荐）——脚本会读取 `src/lib/schema.sql` 并执行，幂等可重复运行：

```bash
npm run db:init
```

> 成功后会打印已建的表和默认队友名单。也可手动在数据库终端执行 `src/lib/schema.sql`。

### 数据库表结构

```sql
visits    -- 访问记录（IP 哈希 + 日期，去重防刷）
reactions -- 表情反应（❤️ 🔥 💪 😂，每位访客每种限一次）
comments  -- 留言墙（需管理员审核后才显示）
teammates -- 队友名单（后台可增删改，新建记录时勾选）
```

---

## 添加比赛记录

直接编辑 `src/data/matches.json`，支持两种格式：

### 两人对打

```json
{
  "id": "2026-06-10-vs-laozhang",
  "date": "2026-06-10",
  "weekday": "周三",
  "opponent": "老张",
  "scoreUs": 21,
  "scoreThem": 18,
  "result": "win",
  "gamesPlayed": 3,
  "gamesWon": 2,
  "caption": "今天手感不错，连续三个后场压制…",
  "players": ["罗洋洋", "老张"],
  "media": [{ "type": "image", "url": "/images/20260610.jpg", "thumb": "/images/20260610.jpg" }]
}
```

### 三人轮流打（自动计算 MVP 和胜负）

```json
{
  "id": "2026-06-15-three-players",
  "date": "2026-06-15",
  "weekday": "周日",
  "playerScores": [
    { "player": "罗洋洋", "score": 85 },
    { "player": "华龙飞", "score": 101 },
    { "player": "何家杰", "score": 44 }
  ],
  "result": "loss",
  "gamesPlayed": 3,
  "gamesWon": 1,
  "caption": "华龙飞今天状态绝了…",
  "players": ["罗洋洋", "华龙飞", "何家杰"],
  "media": []
}
```

> **MVP 和胜负**：有 `playerScores` 时由程序自动计算，不用手填。  
> `players[0]` 视为记录者，其得分最高则为「胜」。

### 上传图片/视频

把文件放到 `public/images/` 目录，路径写 `/images/文件名.jpg`。  
或通过管理后台上传（见下）。

---

## 管理后台

访问 `/admin`，输入 `.env.local` 里设置的 `ADMIN_PASSWORD`。

功能：
- 查看累计独立访客数
- 审核 / 通过 / 删除留言
- 撤回已通过的留言

---

## 上传媒体文件（API）

仅管理员可用：

```bash
curl -X POST https://your-site.com/api/upload \
  -b "rally_admin=authenticated" \
  -F "file=@/path/to/photo.jpg"
# → { "url": "/uploads/abc123.jpg" }
```

返回的 `url` 直接填入 `matches.json` 的 `media[].url`。

---

## API 一览

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/matches` | 分页比赛列表 |
| GET | `/api/matches/[id]` | 单场详情 |
| GET | `/api/latest` | 最新一场 |
| GET | `/api/stats` | 衍生统计（胜率等） |
| GET/POST | `/api/visits` | 访问统计 |
| GET/POST | `/api/reactions/[matchId]` | 表情反应 |
| GET/POST | `/api/comments` | 留言（POST 提交，GET 获取已审核） |
| POST | `/api/admin/login` | 管理员登录 |
| DELETE | `/api/admin/login` | 退出登录 |
| GET | `/api/admin/comments` | 所有留言（含待审） |
| PATCH | `/api/admin/comments/[id]` | 审核留言 |
| DELETE | `/api/admin/comments/[id]` | 删除留言 |
| POST | `/api/upload` | 上传媒体文件 |

---

## 部署（宝塔面板）

```bash
# 服务器上
git pull
npm install --production
npm run build
pm2 restart rally   # 或 pm2 start "npm start" --name rally
```

Nginx 配置关键点：

```nginx
location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header X-Forwarded-For $remote_addr;  # 访客 IP 传递
}

location /uploads/ {
    alias /www/wwwroot/rally/public/uploads/;  # 媒体文件直接由 Nginx 托管
}
```

---

## 目录结构

```
really-work/
├── public/
│   ├── images/          ← 手动放置的图片
│   └── uploads/         ← API 上传的媒体文件
├── src/
│   ├── app/
│   │   ├── page.tsx     ← 首页（时间线 + 留言墙）
│   │   ├── admin/       ← 管理后台
│   │   └── api/         ← 所有 API 路由
│   ├── components/      ← UI 组件
│   ├── data/
│   │   └── matches.json ← 比赛记录（手动维护）
│   └── lib/
│       ├── db.ts        ← PostgreSQL 连接池
│       ├── matches.ts   ← 读取 JSON 的数据层
│       ├── stats.ts     ← 衍生统计（胜率等，不存 JSON）
│       ├── schema.sql   ← 数据库建表语句
│       ├── ipHash.ts    ← IP 哈希（隐私保护）
│       └── adminAuth.ts ← 管理员鉴权
└── .env.example         ← 环境变量模板
```
