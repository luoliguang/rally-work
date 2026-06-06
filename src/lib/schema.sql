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

-- 队友名单（后台可增删改，新建比赛记录时从这里勾选）
CREATE TABLE IF NOT EXISTS teammates (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(50) NOT NULL UNIQUE,
  sort_order INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 默认队友（仅在表为空时插入）
INSERT INTO teammates (name, sort_order)
SELECT * FROM (VALUES ('罗洋洋', 1), ('华龙飞', 2), ('何家杰', 3)) AS v(name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM teammates);

-- 比赛记录（核心数据，从 matches.json 迁移到这里）
-- 完整的 Match 对象存在 data(JSONB) 里，id/date 单独列出以便排序和查询。
CREATE TABLE IF NOT EXISTS matches (
  id         VARCHAR(255) PRIMARY KEY,
  date       DATE         NOT NULL,
  data       JSONB        NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_reactions_match ON reactions (match_id);
CREATE INDEX IF NOT EXISTS idx_comments_approved ON comments (is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches (date);
