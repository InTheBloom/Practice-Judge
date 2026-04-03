// /api/ranking

const express = require('express');
const { db } = require('./db.js');

const rankingRouter = express.Router({ mergeParams: true });
module.exports = { rankingRouter };

// [{user_id, username, role, stars, solved}]
rankingRouter.get('/', (req, res) => {
    const query = db.prepare(`
        SELECT r.user_id, u.username, u.role, r.stars, r.solved
        FROM user_ranking AS r
        JOIN users u
        ON r.user_id = u.id
        WHERE u.is_active = 1
    `).all();

    return res.json(query);
});

