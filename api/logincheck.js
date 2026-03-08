const { db } = require('./db.js');

function checkUserStatus (session) {
    if ("userId" in session) {
        const data = db.prepare('SELECT id, username, is_active, role FROM users WHERE id = ?').get(session.userId);

        if (data && data.is_active === 1) {
            return {
                login: true,
                user_id: session.userId,
                username: data.username,
                role: data.role
            };
        }
    }

    return {
        login: false,
        user_id: -1,
        username: "guest",
        role: "user"
    };
}

function isAdmin (session) {
    const userInfo = checkUserStatus(session);
    return userInfo.login && userInfo.role != "user";
}

function loginOnly (req, res, next) {
    const user = checkUserStatus(req.session);
    if (!user.login) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}

function adminOnly (req, res, next) {
    const user = checkUserStatus(req.session);
    if (user.login) {
        if (user.role == "user") {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    }
    else {
        return res.status(401).json({ error: "Unauthorized" });
    }
}

function inthebloomOnly (req, res, next) {
    const user = checkUserStatus(req.session);
    if (user.login) {
        if (user.role != "inthebloom") {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    }
    else {
        return res.status(401).json({ error: "Unauthorized" });
    }
}

module.exports = { checkUserStatus, isAdmin, loginOnly, adminOnly };
