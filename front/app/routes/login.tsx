import { useState } from "react";
import { useNavigate } from 'react-router';
import { BASEURL } from '../backend_url';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ログイン - Practice Judge" },
  ];
}

export default function LoginPage () {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(new URL("/api/auth/login", BASEURL).href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (res.status === 202) {
          // 強制リロードさせたい
          window.location.href = "/";
      } else {
        const data = await res.json();
        setError(data.error || "ログインに失敗しました");
      }
    } catch (err) {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ maxWidth: "600px", margin: "2em auto" }}>
      <h2>ログイン</h2>
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
        </div>
        <button type="submit" disabled={loading} aria-busy={loading ? "true" : "false"} style={{ padding: "0.5em 1em" }}>
            ログイン
        </button>
      </form>
    </main>
  );
}
