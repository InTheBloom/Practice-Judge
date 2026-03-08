const express = require('express');
const sqlite3 = require('better-sqlite3');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
dotenv.config();

const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);
const sessionDb = new sqlite3("sessions.db");

const app = express();
const port = 8181;


// ログ設定
const loggerStream = {
    write: message => console.log(`From loggerStream: ${message}`),
};

app.use(morgan('tiny', { stream: loggerStream }));

// db設定
const { db } = require('./db.js');

// ログイン関連
// バカほど大変だったのでつまづきポイントをよく抑えておく
// 結局、動作に必要だったのは2点
// 1. cloudflare tunnelがリバースプロキシとして動いていて、かつ
//            https       http
//    フロント -> プロキシ -> node
//    という形になっていることの解消。この状況でsecureが設定されたcookieを送信するために、「プロキシを信用」する必要がある。
//    cloudflare側でX-Forwareded-protoを設定してくれているので、express-session側はproxy設定をしたら良い。
// 2. なんかクロスオリジンでcookieをやり取りするのめっちゃ厳しいらしい。
//    発生していた現象として、ログインを叩いてもログイン状態にならない。なのに再度ログインを叩くとログイン済みですと言われる。というもの。
//    これはdomainの適用範囲が問題だった。「ブラウザ-apiサーバ」のcookieは正しく登録されていたが、/api/auth/meなどを叩くのはreact-router側なので「ブラウザ-フロント」のcookieとして使えないとダメだった。ここでdomainを指定していないのが影響して、共有できずに死んでいた。
//    secure: true （https通信以外でcookieのやり取りを行わない）
//    sameSite: "none" （クロスオリジンでcookieをやり取りするときに制限をゆるくする）
//    domain: ".inthebloom.org" （cookieの使用範囲を指定）
//    を設定したらうまく行く。

const cookie = {
    maxAge: 14 * 24 * 60 * 60 * 1000, // 2週間
    // https環境でcookieがやり取りできなくなってしまうの
    // https://github.com/expressjs/session
};
if (app.get('env') == 'production') {
    cookie.secure = true;
    console.log("本番モードとして動作中...");
    console.log("FRONTURL: ", process.env.FRONTURL);
}
else {
    console.log("開発モードとして動作中...");
}

app.use(
    session({
        name: 'practice-judge.sid',
        rolling: true, // cookieの更新
        resave: false,
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET || 'fallback-secret',
        proxy: true,

        cookie: cookie,

        store: new SqliteStore({
            client: sessionDb,
            expired: {
                clear: true,
                intervalMs: 900000 // 削除チェック間隔: 15分
            }
        }),
    })
);

// bodyの解析
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// query parameterの解析
app.set('query parser', "extended");


// jobの登録
const { setSchedule } = require('./cronjob.js');
setSchedule();

// cors設定
const FRONTURL = process.env.FRONTURL;
app.use(cors({
    origin: FRONTURL,
    credentials: true,
}));














const { loginOnly, adminOnly } = require('./logincheck');

// ================ ファイル公開設定 ====================
const staticDir = path.resolve(__dirname, '..', 'static');
app.use('/static', express.static(staticDir));
// ==================================================

// ========== apiルーティングの設定 ==========

const apiRouter = express.Router({ mergeParams: true });

const { submissionsRouter } = require('./submissions.js');
apiRouter.use('/submissions', submissionsRouter);

const { problemRouter } = require('./problem.js');
apiRouter.use('/problems/no/:id', problemRouter);

const { problemsRouter } = require('./problems.js');
apiRouter.use('/problems', problemsRouter);

const { problemsetsRouter } = require('./problemsets.js');
apiRouter.use('/problemsets', problemsetsRouter);

const { problemsetRouter } = require('./problemset.js');
apiRouter.use('/problemsets/no/:id', problemsetRouter);

const { authRouter } = require('./auth.js');
apiRouter.use('/auth', authRouter);

const { usersRouter } = require('./users.js');
apiRouter.use('/users', usersRouter);

app.use('/api', apiRouter);

// ========================================














app.listen(port, () => {
    console.log(`api server listening on port ${port}`);
});
