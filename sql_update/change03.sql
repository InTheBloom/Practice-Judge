-- user_statsを使っていないのでdropする
DROP TABLE IF EXISTS user_stats;

-- user_rankingを作成
CREATE TABLE IF NOT EXISTS user_ranking (
    user_id INTEGER PRIMARY KEY,
    stars INTEGER NOT NULL DEFAULT 0,
    solved INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL
);
