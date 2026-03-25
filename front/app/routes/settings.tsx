import { BASEURL } from '../backend_url';
import { useState } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router';
import { isValidUsername, isValidPassword } from '../utils';

export function meta() {
    return [
        { title: "設定 - Practice Judge" }
    ];
}

export async function clientLoader ({ params }) {
    return;
}

export function ErrorBoundary ({ error }) {
    let msg = "不明なエラー";
    if (error instanceof Error) {
        msg = error.message;
    }

    return (
        <main className="container">
            <h1>エラー</h1>
            <p>{msg}</p>
        </main>
    );
}

export default function Settings ({ loaderData }) {
    return (
        <main className="container">
            <h1>設定</h1>
            <ChangeUsername />
            <ChangePassword />
        </main>
    );
}

function ChangeUsername () {
    const { loginInfo } = useOutletContext();

    const [newUsername, setNewUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const handler = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!isValidUsername(newUsername)) {
            setMsg("新しいユーザ名が条件を満たしていません。");
            setLoading(false);
            return;
        }

        const fChange = await fetch(new URL("/api/auth/change-username", BASEURL).href, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newUsername, password }),
            credentials: "include",
        });

        if (!fChange.ok) {
            const data = await fChange.json();
            setMsg(data.error ?? "変更に失敗しました。");
        }
        else {
            // 強制リロード
            setMsg("変更に成功しました。1秒後にリロードします。");
            setNewUsername("");
            setPassword("");

            new Promise((resolve) => {
                setTimeout(resolve, 1000);
            }).then(() => {
                window.location.href = "/settings";
            });
        }

        setLoading(false);
    };

    return (
        <article>
            <h2>ユーザー名を変更する</h2>
            <form onSubmit={handler}>
                <strong>現在のユーザー名</strong>
                <p>{loginInfo.username}</p>
                <label>
                    <strong>新しいユーザー名</strong>
                    <input
                        type="text"
                        value={newUsername}
                        required
                        onChange={(e) => setNewUsername(e.target.value)}
                    />
                </label>
                <ul>
                    <li>UTF-16において100コード以内かつ1文字以上20文字以内である必要があります。</li>
                    <li><code>!#$&'()*+,/:;=?@[]</code>以外の文字を使用可能です。</li>
                </ul>
                <label>
                    <strong>現在のパスワード（確認）</strong>
                    <input
                        type="password"
                        value={password}
                        required
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>
                <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading ? "true" : "false"}
                    style={{ maxWidth: "5em" }}
                >
                    変更
                </button>
            </form>
            {msg && <p className="pico-color-red-500">{msg}</p>}
        </article>
    );
}

function ChangePassword () {
    const [newPassword, setNewPassword] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const handler = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!isValidPassword(newPassword)) {
            setMsg("新しいパスワードが条件を満たしていません。");
            setLoading(false);
            return;
        }

        const fChange = await fetch(new URL("/api/auth/change-password", BASEURL).href, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newPassword, password }),
            credentials: "include",
        });

        if (!fChange.ok) {
            const data = await fChange.json();
            setMsg(data.error ?? "変更に失敗しました。");
        }
        else {
            // 強制リロード
            setMsg("変更に成功しました。1秒後にリロードします。");
            setNewPassword("");
            setPassword("");

            new Promise((resolve) => {
                setTimeout(resolve, 1000);
            }).then(() => {
                window.location.href = "/settings";
            });
        }

        setLoading(false);
    };

    return (
        <article>
            <h2>パスワードを変更する</h2>
            <form onSubmit={handler}>
                <label>
                    <strong>新しいパスワード</strong>
                    <input
                        type="password"
                        value={newPassword}
                        required
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </label>
                    <ul>
                        <li>10文字以上50文字以下である必要があります。</li>
                        <li>半角英数字と記号<code style={{ whiteSpace: "pre" }}>{' '}!"#$%&'()-^\@[;:],./\=~|`{'{'}+*{'}'}{'<>'}?_</code>を使用可能です。</li>
                    </ul>
                <label>
                    <strong>現在のパスワード（確認）</strong>
                    <input
                        type="password"
                        value={password}
                        required
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>
                <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading ? "true" : "false"}
                    style={{ maxWidth: "5em" }}
                >
                    変更
                </button>
            </form>
            {msg && <p className="pico-color-red-500">{msg}</p>}
        </article>
    );
}
