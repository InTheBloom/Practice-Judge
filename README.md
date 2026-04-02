# Practice Judge

## はじめに
Practice Judgeはプログラミング初学者が基礎的な文法、言語機能、アルゴリズムを習得するために、プログラミングの練習を行うためのオンラインジャッジです。

本プロジェクトは「ジャッジ」「API」「フロント」の3パーツに分かれています。
現状それぞれに仕様書やドキュメントがなく、記憶を頼りに開発されています。


## システムが依存するソフトウェア

### sqlite3
全データを保持するdb（data.db）はsqlite3によって動いています。
また、APIサーバーはcookieによるセッション管理を行っており、cookieとユーザーの紐付けをsession.dbで管理していますが、これもsqlite3によって動いています。

### Dockerデーモン、Dockerクライアント
ジャッジシステムはDockerコンテナをサンドボックスとして利用しているため、起動ユーザーがsudoなしでDockerを起動できることが必要です。具体的に起動するコマンドはジャッジのソースコードを参照してください。（数ファイルしか無いのでgrepしたらすぐおわります。）

### D言語
ジャッジシステムはD言語によって動作しています。現在の私の環境はdmd 2.108.1です。

### node.js
APIはexpress、フロントはvite + react-router v7で作成されています。node.js及びnpmが必要です。

### Linux
ジャッジシステムで用いるサンドボックスのリソース管理にcgroup v1またはv2が必要です。ubuntuならとりあえず動くと思います。

### tmux
プロセスを常駐させておくのにtmuxセッションを利用しています。


## 起動方法
上記依存ソフトウェアを正しくインストールした後、
- `/api/.env`の設定（`.env.example`を参考に）

を行う。
セットアップの後は`start.sh`単体で設定なく起動できるようにしているつもりです。
ただし、デプロイ環境がInTheBloomの想定するものでない場合、プロセスのポートなどは変更したほうが良いかもしれません。
起動はできると思いますが、いろいろ暗黙知があり、現状私以外がメンテできる状況ではないと思います。




## ファイル配信周り
static/以下が静的ファイルの配信。よってここは本番環境と開発環境で中身が変わる。
開発時と本番時どちらもapiサーバからexpressで配信しているものを`http://fronturl/static`からproxyを通すことで取りに行っている。開発時の設定は`/front/vite.config.ts`、本番時の設定は`/front/serve.js`で行う。

## 言語追加方法
1. DockerFileにその言語のインストール設定を追記する。
2. ジャッジデーモンで色々設定する。
    基本的に影響範囲は`constants.d`だけのはず。
3. フロントで色々設定する。
    * 説明画面（front/app/routes/for\_beginners.tsx）
    * 提出画面（front/app/routes/problem\_page.tsx）
    * 提出一覧画面（front/app/routes/problem\_submissions.tsx）
    * 個別問題管理画面（front/app/routes/control\_panel\_problem.tsx）
    * ace-editor（front/app/ace-editor.tsx）
4. 既存言語との兼ね合いで文字列変更した場合はdbの値を変える。
5. start.sh実行時にイメージのビルドを選択する。（イメージが存在しない場合は自動ビルドが走る）
