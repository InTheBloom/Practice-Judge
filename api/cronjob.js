const { db } = require('./db.js');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

module.exports = { setSchedule };

function setSchedule () {
    problemStatsAggregation();
    backup();
}

function problemStatsAggregation () {
    // 10分に一度problem_statsを更新する。
    cron.schedule("*/10 * * * *", () => {
        console.log(`schedule run started at ${new Date()}.`);
        const agg = db.prepare(`
            SELECT
                problem_id,
                COUNT(DISTINCT user_id) AS challengers,
                COUNT(DISTINCT CASE WHEN status = 'AC' THEN user_id END) AS solvers
            FROM submissions
            GROUP BY problem_id;
        `).all();

        for (const v of agg) {
            const check = db.prepare(`
                SELECT id
                FROM problem_stats
                WHERE problem_id = ?
            `).get(v.problem_id);

            if (check == null) {
                // 新規insert
                db.prepare(`
                    INSERT INTO problem_stats (
                        problem_id,
                        challengers,
                        solvers
                    )
                    VALUES (
                        ?,
                        ?,
                        ?
                    )
                `).run(v.problem_id, v.challengers, v.solvers);
            }
            else {
                // update
                db.prepare(`
                    UPDATE problem_stats
                    SET
                        challengers = ?,
                        solvers = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE problem_id = ?
                `).run(v.challengers, v.solvers, v.problem_id);
            }
        }
    });
}

async function backup () {
    // AM 3:00にバックアップを実行

    const backupDir = path.resolve(__dirname, "../", "DB_BACKUP");
    await fs.promises.mkdir(backupDir, { recursive: true });

    const backupFilePrefix = "backup";

    cron.schedule("0 3 * * *", async () => {
        const files = await fs.promises.readdir(backupDir, { withFileTypes: true });
        let count = 0;
        let oldestFile = "";
        let oldestTime = Number.POSITIVE_INFINITY;

        for (const file of files) {
            if (file.isFile() && file.name.startsWith(backupFilePrefix)) {
                count++;
                const time = Number(file.name.split('_')[1]);
                if (time < oldestTime) {
                    oldestTime = time;
                    oldestFile = file.name;
                }
            }
        }

        // 最も古いファイルを削除
        if (7 <= count && oldestFile != "") {
            try {
                await fs.promises.rm(path.resolve(backupDir, oldestFile));
            }
            catch (e) {
                console.error("不要バックアップ削除に失敗: ", e);
            }
        }

        // バックアップ作成
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        try {
            await db.backup(path.resolve(backupDir, `${backupFilePrefix}_${Date.now()}_${y}-${m}-${d}.db`));
            console.log(`backup ok at ${y}-${m}-${d}`);
        }
        catch (e) {
            console.error(`backup failed at ${y}-${m}-${d}: `, e);
        }
    });
}
