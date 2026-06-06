// 一键初始化数据库：读取 src/lib/schema.sql 并在 DATABASE_URL 指向的库上执行。
// 用法：npm run db:init
// 幂等：脚本里的建表全用 CREATE TABLE IF NOT EXISTS，默认队友只在表为空时插入，可重复运行。

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

// 加载 .env / .env.local（无需额外依赖，手动解析）
function loadEnv() {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  for (const file of [".env", ".env.local"]) {
    try {
      const content = readFileSync(path.join(root, file), "utf8");
      for (const line of content.split("\n")) {
        const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
        if (m && !line.trim().startsWith("#")) {
          const key = m[1];
          let val = m[2].trim().replace(/^["']|["']$/g, "");
          if (!(key in process.env)) process.env[key] = val;
        }
      }
    } catch {
      // 文件不存在则跳过
    }
  }
  return root;
}

const root = loadEnv();

if (!process.env.DATABASE_URL) {
  console.error("❌ 未找到 DATABASE_URL。请先在 .env 里配置数据库连接字符串。");
  process.exit(1);
}

const schemaPath = path.join(root, "src", "lib", "schema.sql");
const sql = readFileSync(schemaPath, "utf8");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

try {
  console.log("→ 连接数据库…");
  await pool.query(sql);
  const { rows } = await pool.query("SELECT name FROM teammates ORDER BY sort_order, id");
  console.log("✅ 初始化完成。已建表：visits / reactions / comments / teammates");
  console.log("   当前队友名单：" + (rows.map(r => r.name).join("、") || "（空）"));
} catch (err) {
  console.error("❌ 初始化失败：", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
