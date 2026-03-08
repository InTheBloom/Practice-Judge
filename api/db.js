const sqlite3 = require('better-sqlite3');
const db = new sqlite3('../data.db');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

module.exports = { db };
