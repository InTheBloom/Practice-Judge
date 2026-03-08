// /api/problemsets/no/:id/

const express = require('express');
const { db } = require('./db.js');
const { checkUserStatus, loginOnly, adminOnly } = require('./logincheck.js');

const problemsetRouter = express.Router({ mergeParams: true });
module.exports = { problemsetRouter };

problemsetRouter.get('/all', adminOnly, (req, res) => {
    const problemset = db.prepare(`
        SELECT *
        FROM problemsets
        WHERE id = ?
    `).get(req.params.id);
    if (problemset == null) {
        return res.status(404).end();
    }

    const setProblems = db.prepare(`
        SELECT p.id, p.title, pp.sort_order
        FROM problemset_problems pp
        JOIN problems p
        ON pp.problem_id = p.id
        WHERE pp.problemset_id = ?
    `).all(req.params.id);

    return res.json({ problemset, setProblems });
});

// 問題セットの問題一覧を取得
problemsetRouter.get('/', (req, res) => {
    const problemset = db.prepare(`
        SELECT id, title, description
        FROM problemsets
        WHERE id = ?
    `).get(req.params.id);
    if (problemset == null) {
        return res.status(404).end();
    }

    const setProblems = db.prepare(`
        SELECT p.id, p.title, p.difficulty, pp.sort_order
        FROM problemset_problems pp
        JOIN problems p
        ON pp.problem_id = p.id
        WHERE pp.problemset_id = ? and p.is_published = 1
    `).all(req.params.id);

    return res.json({ problemset, setProblems });
});

// { problemset }を受け取る
problemsetRouter.put('/update-detail', adminOnly, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid problemset ID' });
    }

    const { problemset } = req.body;
    if (!problemset) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    const exists = db.prepare(`SELECT id FROM problemsets WHERE id = ?`).get(id);
    if (!exists) {
        return res.status(404).json({ error: 'Problemset not found' });
    }

    const updateProblemset = db.prepare(`
        UPDATE problemsets
        SET title = ?, description = ?, is_published = ?
        WHERE id = ?
    `);

    const trx = db.transaction(() => {
        updateProblemset.run(
            problemset.title ?? '',
            problemset.description ?? '',
            problemset.is_published ?? 0,
            id,
        );
    });

    try {
        trx();
    } catch (e) {
        console.error(e);
        return res.status(400).json({ error: e.message });
    }

    return res.status(200).end();
});

// setProblems: [{ id, sort_order }] }を受け取る
problemsetRouter.put('/update-set', adminOnly, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid problemset ID' });
    }

    const { setProblems } = req.body;
    if (!Array.isArray(setProblems)) {
        return res.status(400).json({ error: "Invalid payload" });
    }

    const deleteProblems = db.prepare(`
        DELETE FROM problemset_problems
        WHERE problemset_id = ?
    `);

    const insertProblem = db.prepare(`
        INSERT INTO problemset_problems (problemset_id, problem_id, sort_order)
        VALUES (?, ?, ?)
    `);

    for (const pr of setProblems) {
        // id, sort_order が整数かチェック
        if (!Number.isInteger(pr.id) || !Number.isInteger(pr.sort_order)) {
            return res.status(400).json({ error: "Invalid payload" });
        }
    }

    deleteProblems.run(id);
    for (const pr of setProblems) {
        insertProblem.run(id, pr.id, pr.sort_order);
    }

    return res.status(200).end();
});
