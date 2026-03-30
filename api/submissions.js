// /api/submissions

const express = require('express');
const { db } = require('./db.js');

const submissionsRouter = express.Router({ mergeParams: true });
module.exports = { submissionsRouter };


submissionsRouter.get('/', (req, res) => {
    const pageSize = 20;
    let whereQuery = "WHERE 1 = 1";
    const whereParams = [];

    // ステータス
    (() => {
        if (req.query.status == null) {
            return;
        }
        whereQuery += " and s.status = ?";
        whereParams.push(req.query.status);
    })();
    // 言語
    (() => {
        if (req.query.language == null) {
            return;
        }
        whereQuery += " and s.code_language = ?";
        whereParams.push(req.query.language);
    })();

    // 問題の公開設定 + ユーザーのアクティブ設定
    whereQuery += " and p.is_published = 1 and u.is_active = 1";

    // ページ番号
    const page = (() => {
        if (req.query.page == null) {
            return 0;
        }
        const ret = parseInt(req.query.page) ?? 0;
        return 0 <= ret ? ret : 0;
    })();

    const dataQuery = `
        SELECT s.id, p.id as problem_id, p.title as problem_title, p.difficulty, u.username, s.code_language, s.status, s.time_sec, s.memory_kb, s.created_at, length(hex(s.code)) / 2 as bytes
        FROM submissions s
        JOIN users u
        ON s.user_id = u.id
        JOIN problems p
        ON s.problem_id = p.id
        ${whereQuery}
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
        ${whereQuery};
    `;

    const submissions = db.prepare(dataQuery).all(...whereParams, pageSize, pageSize * page);
    const total = db.prepare(countQuery).get(...whereParams).total;
    return res.json({ total, submissions });
});
