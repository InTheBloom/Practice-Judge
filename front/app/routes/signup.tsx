import { useState } from "react";
import { useNavigate } from 'react-router';
import { BASEURL } from '../backend_url';
import { isValidUsername, isValidPassword } from '../utils';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "登録 - Practice Judge" },
  ];
}


export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // ユーザ名、パスワード制約を満たすか
    if (!isValidUsername(username)) {
        setError("ユーザ名が条件を満たしていません。");
        setLoading(false);
        return;
    }
    if (!isValidPassword(password)) {
        setError("パスワードが条件を満たしていません。");
        setLoading(false);
        return;
    }

    try {
      const res = await fetch(new URL("/api/auth/signup", BASEURL).href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (res.status === 202) {
          navigate("/");
      } else {
        const data = await res.json();
        setError(data.error || "登録に失敗しました");
      }
    } catch (err) {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ maxWidth: "600px", margin: "2em auto" }}>
      <h2>登録</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1em" }}>
          <label>
            ユーザ名
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5em" }}
            />
          </label>
          <ul>
            <li>UTF-16において100コード以内かつ1文字以上20文字以内である必要があります。</li>
            <li><code>!#$&'()*+,/:;=?@[]</code>以外の文字を使用可能です。</li>
          </ul>
        </div>
        <div style={{ marginBottom: "1em" }}>
          <label>
            パスワード
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5em" }}
            />
          </label>
          <ul>
            <li>10文字以上50文字以下である必要があります。</li>
            <li>半角英数字と記号<code style={{ whiteSpace: "pre" }}>{' '}!"#$%&'()-^\@[;:],./\=~|`{'{'}+*{'}'}{'<>'}?_</code>を使用可能です。</li>
          </ul>
        </div>
        <button
            type="submit"
            disabled={loading}
            aria-busy={loading ? "true" : "false"}
            style={{ padding: "0.5em 1em" }}
        >
            登録
        </button>
      </form>
    </main>
  );
}
