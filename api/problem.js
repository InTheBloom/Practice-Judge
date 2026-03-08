// /api/problems/no/:id/

const express = require('express');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db } = require('./db.js');
const { checkUserStatus, isAdmin, loginOnly, adminOnly } = require('./logincheck.js');

const problemRouter = express.Router({ mergeParams: true });
module.exports = { problemRouter };

// multerの設定
const storage = multer.diskStorage({
  destination(req, file, callback) {
      const uploadPath = fs.mkdtempSync(path.resolve(__dirname, "uploads", "tmp"));
      callback(null, uploadPath);
  },
  filename(req, file, callback) {
      callback(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
    storage,
    fileFilter(req, file, callback) {
    callback(null, true);
  },
});

// 管理者のみ未公開問題を閲覧可能
problemRouter.get('/', (req, res) => {
    let where = "WHERE id = ?";
    if (!isAdmin(req.session)) {
        where += " and is_published = 1";
    }

    const problemQuery = db.prepare(`
        SELECT id, title, author, difficulty, is_published, statement, time_limit_sec, memory_limit_kb, created_at
        FROM problems
        ${where}
    `);
    const problem = problemQuery.get(req.params.id);
    if (!problem) {
        return res.status(404).end();
    }
    return res.json(problem);
});

// 管理画面用api
problemRouter.get('/all', adminOnly, (req, res) => {
    const data = db.prepare(`
        SELECT *
        FROM problems
        WHERE id = ?
    `).get(req.params.id);
    if (data == null) {
        return res.status(404).end();
    }
    return res.json(data);
});

// 解説を取得（非公開問題の場合は管理者のみ）
problemRouter.get('/editorial', (req, res) => {
    let where = "WHERE id = ?";
    if (!isAdmin(req.session)) {
        where += " and is_published = 1";
    }
    const data = db.prepare(`
        SELECT title, is_published, editorial
        FROM problems
        ${where}
    `).get(req.params.id);

    if (data == null) {
        return res.status(404).end();
    }
    return res.json(data);
});

problemRouter.put('/update', adminOnly, (req, res) => {
    const id = Number(req.params.id);

    const {
        title,
        statement,
        author,
        difficulty,
        editorial,
        time_limit_sec,
        memory_limit_kb,
        is_published,
        judge_code,
        judge_code_language
    } = req.body;

    // ----- バリデーション（最低限） -----
    if (title == null || statement == null || author == null || editorial == null || judge_code == null || judge_code_language == null) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    if (isNaN(difficulty) || isNaN(time_limit_sec) || isNaN(memory_limit_kb) || isNaN(is_published)) {
        return res.status(400).json({ error: "Invalid numeric fields" });
    }

    // ----- 問題が存在するか確認 -----
    const exists = db.prepare("SELECT id FROM problems WHERE id = ?;").get(id);

    if (exists == null) {
        return res.status(404).json({ error: "Problem not found" });
    }

    // ----- 更新 -----
    const stmt = db.prepare(`
        UPDATE problems
        SET
            title = ?,
            statement = ?,
            author = ?,
            difficulty = ?,
            editorial = ?,
            time_limit_sec = ?,
            memory_limit_kb = ?,
            is_published = ?,
            judge_code = ?,
            judge_code_language = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
    `);

    stmt.run(
        title,
        statement,
        author,
        difficulty,
        editorial,
        Number(time_limit_sec),
        Number(memory_limit_kb),
        is_published,
        judge_code,
        judge_code_language,
        id
    );

    return res.status(200).end();
});

problemRouter.post('/testcase/upload-zip', adminOnly, upload.single('testcase-zip'), async (req, res) => {
    // 問題が存在するかチェック
    const p = db.prepare('SELECT id FROM problems WHERE id = ?').get(req.params.id);
    if (p == null) {
        return res.status(400).end();
    }

    // ファイルが存在するかチェック
    if (req.file == null) {
        return res.status(400).json({ error: "ファイルがありません。" });
    }

    // ファイルは
    // api/uploads/[tmpdir]/
    // にzipファイルを、さらにそこに解凍先dirを用意する感じ
    // tmpdir
    //   - in.zip
    //   - work
    //       - [extracted file]

    // [bug fixed]: エラー落ち時にディレクトリ消していなかった。
    const cleanup = async () => {
        // 一時ディレクトリごと全部消す
        await fs.promises.rm(req.file.destination, { force: true, recursive: true });
    };

    // zipファイルを解凍
    const unzipWorkDir = path.resolve(req.file.destination, "work");
    const zip = new AdmZip(req.file.path);
    try {
        zip.extractAllTo(unzipWorkDir);
    }
    catch (e) {
        cleanup();
        return res.status(500).json({ error: "zip解凍に失敗しました。" });
    }

    // [bug fixed]: zipファイルの名前と元ディレクトリの名前が異なる可能性がある。
    const inZipDirs = await fs.promises.readdir(unzipWorkDir, { withFileTypes: true });
    if (inZipDirs.length != 1 || !inZipDirs[0].isDirectory()) {
        cleanup();
        return res.status(401).json({ error: "zipファイルの構造が不正です。" });
    }
    const filenameInfo = path.parse(path.resolve(unzipWorkDir, inZipDirs[0].name));

    // ファイル探索してファイル名を列挙
    // .inと.outで終わるファイルを探し、その積集合を取る
    const extractedPath = path.resolve(filenameInfo.dir, filenameInfo.name);
    let files;
    try {
        files = await fs.promises.readdir(extractedPath, { withFileTypes: true });
    }
    catch (e) {
        console.error("ディレクトリ読み取りに失敗しました。");
        cleanup();
        return res.status(500).json({ error: "解凍ディレクトリ読み取りに失敗しました。" });
    }

    const filesIn = new Set();
    const filesOut = new Set();

    for (const file of files) {
        if (!file.isFile()) {
            continue;
        }
        if (file.name.endsWith(".in")) {
            filesIn.add(path.parse(file.name).name);
        }
        if (file.name.endsWith(".out")) {
            filesOut.add(path.parse(file.name).name);
        }
    }

    const completeFiles = filesIn.intersection(filesOut);

    // 内容を読み込みdbにinsertする。
    const inserted = [];
    try {
        for (const file of completeFiles) {
            const iFile = file + ".in";
            const oFile = file + ".out";

            const contents = await Promise.all([
                fs.promises.readFile(path.resolve(extractedPath, iFile), { encoding: 'utf-8' }),
                fs.promises.readFile(path.resolve(extractedPath, oFile), { encoding: 'utf-8' }),
            ]);

            db.prepare(`
                INSERT INTO testcases (
                    testcase_name,
                    problem_id,
                    input_submission,
                    input_judge
                ) VALUES (?, ?, ?, ?)
            `).run(file, req.params.id, contents[0], contents[1]);

            inserted.push(file);
        }
    }
    catch (e) {
        console.error("db挿入失敗: ", e);
        cleanup();
        return res.status(500).json({ error: "一部テストケース追加に失敗しました。" });
    }

    cleanup();

    res.json({ message: `テストケース${inserted.join(', ')}を追加しました。` });
});

problemRouter.get('/testcase', adminOnly, (req, res) => {
    // 問題が存在するかチェック
    const p = db.prepare('SELECT id FROM problems WHERE id = ?').get(req.params.id);
    if (p == null) {
        return res.status(404).end;
    }

    const data = db.prepare(`
        SELECT id, testcase_name
        FROM testcases
        WHERE problem_id = ?
        ORDER BY testcase_name ASC
    `).all(req.params.id);

    return res.json(data);
});

problemRouter.get('/testcase/:testcaseid', adminOnly, (req, res) => {
    // テストケースidを指定して取得
    const data = db.prepare(`
        SELECT testcase_name, input_submission, input_judge
        FROM testcases
        WHERE problem_id = ? and id = ?
    `).get(req.params.id, req.params.testcaseid);

    if (data == null) {
        return res.status(404).json({ error: "指定テストケースが存在しません。" });
    }
    return res.json(data);
});

problemRouter.post('/testcase/create', adminOnly, (req, res) => {
    // 問題が存在するかチェック
    const p = db.prepare('SELECT id FROM problems WHERE id = ?').get(req.params.id);
    if (p == null) {
        return res.status(400).end();
    }

    db.prepare(`
        INSERT INTO testcases (
            testcase_name,
            problem_id,
            input_submission,
            input_judge
        ) VALUES (?, ?, ?, ?)
    `).run("", req.params.id, "", "");

    return res.status(200).end();
});

// body: { id: 数字 }をつけてリクエスト
problemRouter.delete('/testcase/delete', adminOnly, (req, res) => {
    if (req.body.id == null) {
        return res.status(400).end();
    }

    const ret = db.prepare(`
        DELETE FROM testcases WHERE id = ?
    `).run(req.body.id);
    return res.status(200).end();
});

// body: [{ id, testcase_name, input_submission, input_judge }]をつけてリクエスト
problemRouter.put('/testcase/update', adminOnly, (req, res) => {
    // 問題が存在するかチェック
    const p = db.prepare('SELECT id FROM problems WHERE id = ?').get(req.params.id);
    if (p == null) {
        return res.status(404).json({ error: "問題が存在しません。" });
    }

    if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "入力データが配列ではありません。" });
    }

    const ret = [];
    const data = req.body;
    for (const test of data) {
        let reason = "";
        const { id, testcase_name, input_submission, input_judge } = test;
        let bad = false;
        if (testcase_name == null || input_submission == null || input_judge == null) {
            reason += "必要なフィールドが存在しません。";
            bad = true;
        }
        if (!bad && isNaN(id)) {
            reason += "テストケースidが指定されていません。";
            bad = true;
        }

        // idに該当するテストケースが存在するかチェック
        const exists = db.prepare('SELECT id FROM testcases WHERE id = ?').get(id);
        if (!bad && exists == null) {
            reason += "idに該当するテストケースが存在しません。";
            bad = true;
        }

        if (bad) {
            ret.push({ testcase_name, reason });
            continue;
        }

        const result = db.prepare(`
            UPDATE testcases
            SET testcase_name = ?, input_submission = ?, input_judge = ?
            WHERE id = ?
        `).run(testcase_name, input_submission, input_judge, id);
    }

    return res.json(ret);
});

problemRouter.post('/rejudge', adminOnly, (req, res) => {
    // submissionsテーブルのproblem_idがreq.params.idと等しいものであって、ステータスがpending, inqueue, compiling, executing以外のレコードに対して
    // - statusをpendingに変更
    // - message, time_sec, memory_kbをnullに変更
    // 変更されたsubmission idを指すresultレコードを全て削除。

    const queries = [
        `UPDATE submissions
        SET
            status = 'pending',
            message = NULL,
            time_sec = NULL,
            memory_kb = NULL
        WHERE problem_id = @pid
          AND status NOT IN ('pending', 'inqueue', 'compiling', 'executing');`,

        `DELETE FROM results
        WHERE submission_id IN (
            SELECT id
            FROM submissions
            WHERE problem_id = @pid
              AND status = 'pending'
        );`
    ].map(sql => db.prepare(sql));

    let info = [];
    const trans = db.transaction((data) => {
        for (const stmt of queries) {
            info.push(stmt.run(data));
        }
    });
    trans({ pid: req.params.id });

    return res.json({ rejudged: info?.[0]?.changes });
});

problemRouter.post('/submit', loginOnly, (req, res) => {
    const { login, role, username, user_id } = checkUserStatus(req.session);
    let ok = true;
    console.log(username, "submit\n", req.body);
    if (req.body.code == null) {
        ok = false;
    }
    if (req.body.language == null) {
        ok = false;
    }
    // 問題が未公開であれば提出させない。
    // ただし、adminならOK

    let where = "WHERE id = ?";
    if (role == "user") {
        where += " and is_published = 1";
    }
    const pr = db.prepare(`
        SELECT id
        FROM problems
        ${where}
    `).get(req.params.id);
    if (pr == null) {
        ok = false;
    }
    if (!ok) {
        return res.status(400).end();
    }

    const st = db.prepare(`
        INSERT INTO submissions (problem_id, user_id, code, code_language)
        VALUES (?, ?, ?, ?)
    `);
    try {
        const result = st.run(req.params.id, user_id, req.body.code, req.body.language);
        return res.status(201).json({ submissionId: result.lastInsertRowid });
    }
    catch (e) {
        return res.status(500).end();
    }
});

problemRouter.get('/submissions', loginOnly, (req, res) => {
    const pageSize = 20;
    let whereQuery = "WHERE 1 = 1";
    const whereParams = [];

    // 問題番号
    {
        whereQuery += " and s.problem_id = ?";
        whereParams.push(req.params.id);
    }
    // ユーザ名
    (() => {
        if (req.query.username == null) {
            return;
        }
        const data = db.prepare('SELECT id, is_active from users WHERE username = ?;').get(req.query.username);
        if (data != null && data.is_active) {
            whereQuery += " and s.user_id = ?";
            whereParams.push(data.id);
        }
        else {
            whereQuery += " and 0 = 1";
        }
    })();
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
    // 非公開問題かどうか
    {
        if (!isAdmin(req.session)) {
            whereQuery += " and p.is_published = 1";
        }
    }

    // ページ番号
    const page = (() => {
        if (req.query.page == null) {
            return 0;
        }
        const ret = parseInt(req.query.page) ?? 0;
        return 0 <= ret ? ret : 0;
    })();

    const dataQuery = `
        SELECT s.id, p.title as problem_title, p.difficulty, u.username, s.code_language, s.status, s.time_sec, s.memory_kb, s.created_at, length(hex(s.code)) / 2 as bytes
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

// 提出一覧ページから個別に提出の更新をかけるためのapi
problemRouter.get('/submissions/check-status/:submissionId', loginOnly, (req, res) => {
    let where = `WHERE s.id = ? and p.id = ${req.params.id}`;
    if (!isAdmin(req.session)) {
        where += " and is_published = 1";
    }

    const sq = db.prepare(`
        SELECT s.id, s.status, s.time_sec, s.memory_kb
        FROM submissions s
        JOIN problems p
        ON s.problem_id = p.id
        ${where}
    `);
    const rq = db.prepare(`
        SELECT status
        FROM results
        WHERE submission_id = ?
        ORDER BY testcase_name ASC;
    `);
    const sub = sq.get(req.params.submissionId);
    if (sub == null) {
        return res.status(404).end();
    }

    const results = rq.all(req.params.submissionId);
    return res.json({ id: sub.id, status: sub.status, memory_kb: sub.memory_kb, time_sec: sub.time_sec, each: results });
});

problemRouter.get('/submissions/:submissionId', (req, res) => {
    let where = `WHERE s.id = ? and p.id = ${req.params.id}`
    if (!isAdmin(req.session)) {
        where += " and p.is_published = 1";
    }
    const sq = db.prepare(`
        SELECT s.id, s.problem_id, p.title, p.difficulty, u.username, s.code, s.code_language, s.status, length(hex(s.code)) / 2 as bytes, s.message, p.time_limit_sec, p.memory_limit_kb, s.time_sec, s.memory_kb, s.created_at
        FROM submissions s
        JOIN users u
        ON s.user_id = u.id
        JOIN problems p
        ON s.problem_id = p.id
        ${where}
    `);
    const rq = db.prepare(`
        SELECT testcase_name, status, time_sec, memory_kb
        FROM results
        WHERE submission_id = ?
        ORDER BY testcase_name ASC;
    `);
    const sub = sq.get(req.params.submissionId);
    if (sub == null) {
        return res.status(404).end();
    }

    const results = rq.all(req.params.submissionId);
    return res.json({ whole: sub, each: results });
});
