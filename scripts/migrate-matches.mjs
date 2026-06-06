// 把 src/data/matches.json（旧的文件存储）里的比赛数据导入 PostgreSQL 的 matches 表。
// 用法：npm run db:migrate-matches
// 幂等：已存在的 id 不会被覆盖（ON CONFLICT DO NOTHING），可安全重复运行。

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// 加载 .env / .env.local
for (const file of [".env", ".env.local"]) {
  try {
    for (const line of readFileSync(path.join(root, file), "utf8").split("\n")) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith("#") && !(m[1] in process.env)) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch { /* 文件不存在则跳过 */ }
}

if (!process.env.DATABASE_URL) {
  console.error("❌ 未找到 DATABASE_URL，请先配置 .env");
  process.exit(1);
}

// 读取数据源：优先 matches.json，没有则用 matches.example.json
let raw;
for (const f of ["matches.json", "matches.example.json"]) {
  try { raw = readFileSync(path.join(root, "src", "data", f), "utf8"); break; } catch { /* next */ }
}
if (!raw) {
  console.error("❌ 找不到 src/data/matches.json 或 matches.example.json");
  process.exit(1);
}

const matches = (JSON.parse(raw).matches ?? []);
if (matches.length === 0) {
  console.log("数据源里没有比赛记录，无需迁移。");
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

try {
  let inserted = 0, skipped = 0;
  for (const m of matches) {
    const res = await pool.query(
      `INSERT INTO matches (id, date, data) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [m.id, m.date, JSON.stringify(m)]
    );
    if (res.rowCount > 0) inserted++; else skipped++;
  }
  console.log(`✅ 迁移完成：新增 ${inserted} 条，已存在跳过 ${skipped} 条。`);
} catch (err) {
  console.error("❌ 迁移失败：", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
