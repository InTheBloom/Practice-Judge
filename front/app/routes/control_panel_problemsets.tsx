import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { BASEURL } from "../backend_url";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "問題セット一覧 - Practice Judge" },
    ];
}

export async function clientLoader () {
    const res = await fetch(new URL("/api/problemsets/all", BASEURL).href, {
        credentials: "include",
    });
    return await res.json();
}

export default function ControlPanelProblemsets({ loaderData }) {
    const problemsets = loaderData;

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function createNewProblemset() {
        if (!window.confirm("新規問題セットを作成しますか？")) {
            return;
        }

        setLoading(true);
        await fetch(new URL("/api/problemsets/create", BASEURL).href, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        setLoading(false);

        // 再読み込みのために同一画面へ戻る
        navigate("/control-panel/problemsets");
    }

    return (
        <>
            <main className="container">
                <nav aria-label="breadcrumb">
                    <ul>
                        <li><Link to="/control-panel">コントロールパネル</Link></li>
                        <li>問題セット一覧</li>
                    </ul>
                </nav>
                <hr />

                <h1>問題セット一覧</h1>
                <button
                    onClick={createNewProblemset}
                    disabled={loading}
                    aria-busy={loading ? "true" : "false"}
                >
                    新規問題セット
                </button>

                <article>
                    <table>
                        <thead>
                            <tr>
                                <th>セットID</th>
                                <th>問題セット名</th>
                                <th>セット編集</th>
                            </tr>
                        </thead>
                        <tbody>
                            {problemsets.map((ps) => (
                                <tr key={ps.id}>
                                    <td>{ps.id}</td>
                                    <td>
                                        <Link to={`/control-panel/problemsets/no/${ps.id}`}>
                                            {ps.title}
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={`/control-panel/problemsets/no/${ps.id}/set`}>
                                            編集
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </article>
            </main>
        </>
    );
}
