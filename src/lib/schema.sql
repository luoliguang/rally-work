-- Rally 数据库初始化脚本
-- 在宝塔面板的 PostgreSQL 终端里执行一次即可

-- 访问记录（按 IP 哈希 + 日期去重，防刷）
CREATE TABLE IF NOT EXISTS visits (
  id           SERIAL PRIMARY KEY,
  ip_hash      VARCHAR(64)  NOT NULL,
  visited_date DATE         NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (ip_hash, visited_date)
);

-- 表情反应（每位访客对同一条记忆每种表情只能点一次）
CREATE TABLE IF NOT EXISTS reactions (
  id         SERIAL PRIMARY KEY,
  match_id   VARCHAR(255) NOT NULL,
  emoji      VARCHAR(20)  NOT NULL,
  ip_hash    VARCHAR(64)  NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, emoji, ip_hash)
);

-- 全局留言墙（is_approved 默认 false，需管理员审核）
CREATE TABLE IF NOT EXISTS comments (
  id          SERIAL PRIMARY KEY,
  nickname    VARCHAR(50)  NOT NULL DEFAULT '匿名',
  content     TEXT         NOT NULL CHECK (char_length(content) BETWEEN 1 AND 300),
  is_approved BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_reactions_match ON reactions (match_id);
CREATE INDEX IF NOT EXISTS idx_comments_approved ON comments (is_approved, created_at DESC);
