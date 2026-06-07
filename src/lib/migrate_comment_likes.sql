-- 留言点赞功能迁移脚本
-- 执行方式：在宝塔 PostgreSQL 控制台或 psql 中运行一次即可，重复执行安全

BEGIN;

-- 1. comments 表加 likes 字段
ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes INTEGER NOT NULL DEFAULT 0;

-- 2. 点赞去重表
CREATE TABLE IF NOT EXISTS comment_likes (
  id         SERIAL PRIMARY KEY,
  comment_id INTEGER     NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  ip_hash    VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (comment_id, ip_hash)
);

-- 3. 索引
CREATE INDEX IF NOT EXISTS idx_comment_likes ON comment_likes (comment_id);

COMMIT;
