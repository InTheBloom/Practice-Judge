CREATE TABLE problems_new (
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

INSERT INTO problems_new (
    id,
    title,
    author,
    difficulty,
    statement,
    time_limit_sec,
    memory_limit_kb,
    judge_code,
    judge_code_language,
    is_published,
    created_at,
    updated_at
)
SELECT id, title, author, difficulty, statement, time_limit_sec, memory_limit_kb, judge_code, judge_code_language, is_published, created_at, updated_at FROM problems;

DROP TABLE problems;
ALTER TABLE problems_new RENAME TO problems;
