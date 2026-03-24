// /api/users

const express = require('express');
const { db } = require('./db.js');
const { checkUserStatus, loginOnly, adminOnly } = require('./logincheck.js');

const usersRouter = express.Router({ mergeParams: true });
module.exports = { usersRouter };

// returns:
// [{ id, username, role, is_active, created_at }]
usersRouter.get('/', adminOnly, (req, res) => {
    const data = db.prepare(`
        SELECT id, username, role, is_active, created_at
        FROM users
    `).all();
    return res.json(data);
});

// returns:
// { username, created_at, role }
usersRouter.get('/:username', (req, res) => {
    const userInfo = db.prepare(`
        SELECT username, role, created_at
        FROM users
        WHERE username = ? and is_active = 1
    `).get(req.params.username);

    if (userInfo == null) {
        return res.status(404).end();
    }

    return res.json(userInfo);
});

// returns:
// { submit: 提出総数, solved: 解決総数 }
usersRouter.get('/:username/solved', (req, res) => {
    const userInfo = db.prepare(`
        SELECT id
        FROM users
        WHERE username = ? and is_active = 1
    `).get(req.params.username);

    if (userInfo == null) {
        return res.json({ submit: 0, solved: 0 });
    }

    const submit = db.prepare(`
        SELECT p.id
        FROM problems p
        JOIN submissions s
        ON p.id = s.problem_id
        WHERE s.user_id = ? and p.is_published = 1
    `).all(userInfo.id).length;
    const solved = db.prepare(`
        SELECT DISTINCT p.id
        FROM problems p
        JOIN submissions s
        ON p.id = s.problem_id
        WHERE s.user_id = ? and s.status = ? and p.is_published = 1
    `).all(userInfo.id, 'AC').length;

    return res.json({ submit, solved });
});

// returns:
// { total: 総データ数 submissions: [提出object（作成時間降順）] }
usersRouter.get('/:username/recent-submissions', (req, res) => {
    // ど〜しようか迷ったけど現状submissionsをとる目的がproblem.jsの方と違うのでこちらにも同様のコードを書く。

    const userInfo = db.prepare(`
        SELECT id
        FROM users
        WHERE username = ? and is_active = 1
    `).get(req.params.username);

    if (userInfo == null) {
        return res.json([]);
    }

    const dataQuery = `
        SELECT s.id, p.id as problem_id, p.title as problem_title, p.difficulty, u.username, s.code_language, s.status, s.time_sec, s.memory_kb, s.created_at, length(hex(s.code)) / 2 as bytes
        FROM submissions s
        JOIN users u
        ON s.user_id = u.id
        JOIN problems p
        ON s.problem_id = p.id
        WHERE s.user_id = ${userInfo.id} and p.is_published = 1
        ORDER BY s.created_at desc
        LIMIT ?
        OFFSET ?;
    `;

    const countQuery = `
        SELECT COUNT(*) as total
        FROM submissions s
        JOIN users u
        ON s.user_id = u.id
        JOIN problems p
        ON s.problem_id = p.id
        WHERE s.user_id = ${userInfo.id} and p.is_published = 1
    `;

    const pageSize = 20;
    const page = (() => {
        if (req.query.page == null) {
            return 0;
        }
        const ret = parseInt(req.query.page) ?? 0;
        return 0 <= ret ? ret : 0;
    })();

    const submissions = db.prepare(dataQuery).all(pageSize, pageSize * page);
    const total = db.prepare(countQuery).get().total;

    return res.json({ total, submissions });
});
