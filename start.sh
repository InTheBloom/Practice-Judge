#!/bin/bash


# コマンド実行くん by gemini + me
# コマンドを想定された引数以外で実行するとhelpが出ます。



# --- 設定エリア ---
# このスクリプトを実行すべきディレクトリの名前
EXPECTED_DIR_NAME="online-judge" 
SESSION_NAME="PracticeJudge"

IMAGE_NAME="judge-env"
DOCKERFILE_PATH="docker_judge"

DB_FILE="data.db"
DB_MODEL="models.sql"
DB_BACKUP_DIR="DB_BACKUP"

BACKENDURL="https://judge-api.inthebloom.org"
FRONTURL="https://judge.inthebloom.org"
PORT="5173"

# 設定に関して
# フロント側からapiの指定はfront/.envとfront/.env.productionで定義
# 開発モード時のフロント指定（CORS的に要らない？）はapi/.envで定義。本番時はコマンドで注入して上書きしている。
# api側のポートはソースに埋め込みapi/app.js

# dockerコンテナのビルド
function ensure_docker_image() {
    if ! docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
        echo "Docker イメージ '$IMAGE_NAME' が存在しません。ビルドします。"
        docker build -f "$DOCKERFILE_PATH" -t "$IMAGE_NAME" .
        return
    fi

    read -p "Docker イメージ '$IMAGE_NAME' は既に存在します。再ビルドしますか？ (y/N): " chk
    case "$chk" in
        [yY][eE][sS]|[yY])
            docker build -f "$DOCKERFILE_PATH" -t "$IMAGE_NAME" .
            ;;
        *)
            echo "既存イメージを使用します。"
            ;;
    esac
}

function ensure_db() {
    if [ ! -f "$DB_FILE" ]; then
        echo "${DB_FILE}がないため、初期化スクリプトを実行します"
        sqlite3 "$DB_FILE" < "$DB_MODEL"
    fi

    if [ ! -f "$DB_BACKUP_DIR" ]; then
        echo "${DB_BACKUP_DIR}がないため、作成します。"
        mkdir -p "$DB_BACKUP_DIR"
    fi
}

# 開発用(dev)のコマンド定義
function run_dev() {
    JUDGESYSTEM_START="cd judge-system && dub build && ./judge"
    API_START="cd api && npm run start"
    FRONT_START="cd front && npm run dev"

    echo "【開発モード】で起動します..."
    tmux send-keys -t ${SESSION_NAME}:0 "${JUDGESYSTEM_START}" Enter
    echo "ジャッジシステムを起動"
    echo "${JUDGESYSTEM_START}"
    tmux new-window -t ${SESSION_NAME} -n "API"
    tmux send-keys -t ${SESSION_NAME}:1 "${API_START}" Enter
    echo "APIを起動"
    echo "${API_START}"
    tmux new-window -t ${SESSION_NAME} -n "Front"
    tmux send-keys -t ${SESSION_NAME}:2 "${FRONT_START}" Enter
    echo "フロントを起動"
    echo "${FRONT_START}"
}

# 本番用(release)のコマンド定義
function run_release() {
    JUDGESYSTEM_START="cd judge-system && dub build --build=release && ./judge"
    API_START="cd api && rm -rf node_modules && npm i && NODE_ENV=production FRONTURL=${FRONTURL} npm run start"
    FRONT_START="cd front && rm -rf node_modules && npm i && npm run build && PORT=${PORT} BACKENDURL=${BACKENDURL} node serve.js"

    echo "【本番モード】で起動します..."
    tmux send-keys -t ${SESSION_NAME}:0 "${JUDGESYSTEM_START}" Enter
    echo "ジャッジシステムを起動"
    echo "${JUDGESYSTEM_START}"
    tmux new-window -t ${SESSION_NAME} -n "API"
    tmux send-keys -t ${SESSION_NAME}:1 "${API_START}" Enter
    echo "APIを起動"
    echo "${API_START}"
    tmux new-window -t ${SESSION_NAME} -n "Front"
    tmux send-keys -t ${SESSION_NAME}:2 "${FRONT_START}" Enter
    echo "フロントを起動"
    echo "${FRONT_START}"
}


# ココから下はスクリプトが壊れたときのみみたらOK












# --- メイン処理 ---

# 1. 引数チェック（使い方の表示）
if [ "$1" != "dev" ] && [ "$1" != "release" ]; then
    echo "使い方: $0 [dev|release]"
    echo "  dev    : 開発用コマンドを実行します"
    echo "  release: 本番用コマンドを実行します"
    exit 1
fi

# 2. カレントディレクトリの確認
CURRENT_DIR=$(basename "$PWD")
if [ "$CURRENT_DIR" != "$EXPECTED_DIR_NAME" ]; then
    echo "警告: 現在のディレクトリ ($CURRENT_DIR) は、想定されているディレクトリ ($EXPECTED_DIR_NAME) ではありません。"
    read -p "このまま実行しますか？ (y/N): " chk
    case "$chk" in
        [yY][eE][sS]|[yY]) ;;
        *) echo "中止しました。"; exit 1 ;;
    esac
fi

# 3. Docker イメージ確認
ensure_docker_image

# 4. db確認
ensure_db

# 5. tmuxセッションの作成
tmux has-session -t $SESSION_NAME 2>/dev/null
if [ $? -eq 0 ]; then
    echo "エラー: すでに tmux セッション '$SESSION_NAME' が存在します。"
    exit 1
fi

tmux new-session -d -s $SESSION_NAME

# 6. モードに応じた実行
if [ "$1" == "dev" ]; then
    run_dev
else
    run_release
fi

echo "---------------------------------------"
echo "サーバー起動完了。 'tmux a -t $SESSION_NAME' で確認してください。"
