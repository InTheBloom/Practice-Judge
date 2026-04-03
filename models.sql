-- ============================================================
-- users テーブル
-- ユーザーの情報を管理
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role INTEGER NOT NULL DEFAULT 'user',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- uer_rankingテーブル
-- ユーザーのランキング計算用
-- ============================================================
CREATE TABLE IF NOT EXISTS user_ranking (
    user_id INTEGER PRIMARY KEY,
    stars INTEGER NOT NULL DEFAULT 0,
    solved INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL
);

-- ============================================================
-- problems テーブル
-- 問題の情報を管理
-- ============================================================
CREATE TABLE IF NOT EXISTS problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT "",
    difficulty INTEGER NOT NULL DEFAULT 1,
    statement TEXT NOT NULL,
    time_limit_sec REAL NOT NULL,
    memory_limit_kb INTEGER NOT NULL,
    judge_code TEXT NOT NULL,
    judge_code_language TEXT NOT NULL,
    editorial TEXT NOT NULL DEFAULT "",
    is_published INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- problem_stats テーブル
-- 問題の挑戦者数、解決者数を管理
-- ============================================================
CREATE TABLE IF NOT EXISTS problem_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id INTEGER NOT NULL,
    challengers INTEGER NOT NULL DEFAULT 0,
    solvers INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- problemsets テーブル
-- 問題セットの情報を管理
-- ============================================================
CREATE TABLE IF NOT EXISTS problemsets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    is_published INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- problemset_problems テーブル
-- 問題がどの問題セットに属するかの情報を管理
-- ============================================================
CREATE TABLE IF NOT EXISTS problemset_problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problemset_id INTEGER NOT NULL,
    problem_id INTEGER NOT NULL,
    sort_order INTEGER NOT NULL
);

-- ============================================================
-- submissions テーブル
-- 提出ごとの情報を管理
-- ============================================================
CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    code_language TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    message TEXT,
    time_sec REAL,
    memory_kb INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- testcases テーブル
-- 問題ごとのテストケース
-- ============================================================
CREATE TABLE IF NOT EXISTS testcases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    testcase_name TEXT NOT NULL,
    problem_id INTEGER NOT NULL,
    input_submission TEXT NOT NULL,
    input_judge TEXT NOT NULL
);

-- ============================================================
-- results テーブル
-- 各提出の各テストケース結果
-- ============================================================
CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL,
    testcase_id INTEGER NOT NULL,
    testcase_name TEXT NOT NULL,
    status TEXT NOT NULL,         -- AC, WA, TLE, RE, MLE, OLE など
    time_sec REAL,              -- 実行時間（秒）
    memory_kb INTEGER            -- 使用メモリ
);
