// /api/problemsets/

const express = require('express');
const { db } = require('./db.js');
const { checkUserStatus, loginOnly, adminOnly } = require('./logincheck.js');

const problemsetsRouter = express.Router({ mergeParams: true });
module.exports = { problemsetsRouter };

problemsetsRouter.get('/all', adminOnly, (req, res) => {
    const query = db.prepare(`
        SELECT *
        FROM problemsets
        ORDER BY id DESC
    `);
    const problemsets = query.all();
    return res.json(problemsets);
});

// 一覧画面でsolvedを出す必要があるので中身を取得できないといけない。
// all側との整合を保つために2apiに分ける。
problemsetsRouter.get('/', (req, res) => {
    const query = db.prepare(`
        SELECT id, title
        FROM problemsets
        WHERE is_published = 1
        ORDER BY id DESC
    `);

    const problemsets = query.all();
    return res.json(problemsets);
});

// 判定さえできればよいので（プレビュー出さないので）だいぶ適当に返す
problemsetsRouter.get('/registered-problems', (req, res) => {
    const registeredProblems = db.prepare(`
        SELECT problemset_id, problem_id
        FROM problemset_problems pp
        JOIN problems p
        ON pp.problem_id = p.id
        WHERE p.is_published = 1
    `).all();

    return res.json(registeredProblems);
});

problemsetsRouter.put('/create', adminOnly, (req, res) => {
    const stmt = db.prepare(`
        INSERT INTO problemsets
        (title, description)
        VALUES (?, ?)
    `);

    const data = stmt.run(
        "新規問題セット",
        `<!--
htmlで記述してください。
見出しはh2以降にしてください。
ace editor（提出表示に使ってるやつ）やkatexには対応していません。（要望があれば対応を検討）
-->

<h2>見出し</h2>

<p>この問題セットはhogeのために作られました。</p>`,
    );

    return res.json({ newProblemsetId: data.lastInsertRowid });
});
