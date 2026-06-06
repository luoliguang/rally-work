import { Pool } from "pg";

// 单例连接池，整个应用复用
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // 宝塔面板本机 PostgreSQL 不需要 SSL；远程连接时改为 true
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30_000,
});

export default pool;
