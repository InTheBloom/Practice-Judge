const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('./db.js');
const { checkUserStatus, loginOnly, adminOnly } = require('./logincheck.js');

const saltRounds = 10;

const authRouter = express.Router({ mergeParams: true });
module.exports = { authRouter };

// ユーティリティ
// フロント側と同じロジック
const isValidUsername = (name) => {
    // 文字数制約
    const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
    const charCount = [...segmenter.segment(name)].length;

    if (charCount < 1 || charCount > 20) {
        return false;
    }

    // UTF-16コード数（JSのlengthはUTF-16）
    if (name.length > 100) {
        return false;
    }

    // 使用不可文字
    const banned = /[!#$&'()*+,\/:;=?@\[\]]/;
    if (banned.test(name)) {
        return false;
    }

    return true;
};

const isValidPassword = (pass) => {
    // 許可文字のみ
    const allowed = /^[A-Za-z0-9 !"#$%&'()\-\^\\@\[;:\],.\/=~|`{+*}<>?_]+$/;
    if (!allowed.test(pass)) {
        return false;
    }
    if (pass.length < 10) {
        return false;
    }
    if (50 < pass.length) {
        return false;
    }

    return true;
};

// { login: <bool>, username: <string> }を返却
authRouter.get('/me', (req, res) => {
    const ret = checkUserStatus(req.session);
    return res.json({ login: ret.login, role: ret.role, username: ret.username });
});

// 202または400または409を返す。
// 202の場合{}を返す。
// 400と409の場合{ error: <string> }を返す。
authRouter.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // ログイン済みをはじく
    if (checkUserStatus(req.session).login) {
        return res.status(409).json({
            error: "すでにログインしています。",
        });
    }

    if (typeof username !== "string" || typeof password !== "string") {
        return res.status(400).json({
            error: "ユーザ名およびパスワードを指定してください。",
        });
    }

    const data = db.prepare(`
        SELECT id, username, password_hash, is_active
        FROM users
        WHERE username = ?;
    `).get(username);

    if (data && data.is_active) {
        const same = await bcrypt.compare(password, data.password_hash);
        if (same) {
            req.session.userId = data.id;
            return res.status(202).end();
        }
    }

    return res.json({
        error: "ユーザ名またはパスワードが違います。",
    });
});

// 202か400を返す。
// 400の場合{ error: <string> }を返す。
authRouter.post('/logout', (req, res) => {
    if (!checkUserStatus(req.session).login) {
        return res.status(400).json({ error: "すでにログアウトしています。" });
    }

    return req.session.destroy(() => {
        res.status(202).end();
    });
});

authRouter.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    // 型チェック
    if (typeof username !== "string" || typeof password !== "string") {
        return res.status(400).json({ error: "ユーザ名とパスワードを指定してください。" });
    }

    // すでにログイン中なら弾く
    if (checkUserStatus(req.session).login) {
        return res.status(409).json({ error: "すでにログインしています。" });
    }

    // usernameが制約を満たすか
    if (!isValidUsername(username)) {
        return res.status(400).json({ error: "ユーザ名が条件を満たしません。" });
    }
    // passwordが制約を満たすか
    if (!isValidPassword(password)) {
        return res.status(400).json({ error: "パスワードが条件を満たしません。" });
    }

    // username 一意チェック かつ guestではないかをチェック
    const existing = db.prepare('SELECT id FROM users WHERE username = ?;').get(username);
    if (existing || username === "guest") {
        return res.status(409).json({ error: "そのユーザ名はすでに使用されています。" });
    }

    // パスワードをハッシュ化
    const hash = await bcrypt.hash(password, saltRounds);

    // ユーザ登録
    const info = db.prepare('INSERT INTO users (username, password_hash, is_active) VALUES (?, ?, 1);').run(username, hash);

    // 自動ログイン
    req.session.userId = info.lastInsertRowid;

    return res.status(202).end();
});
