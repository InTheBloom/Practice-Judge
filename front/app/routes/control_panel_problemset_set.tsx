import { useState } from "react";
import { Link } from "react-router";
import { BASEURL } from "../backend_url";

// --- Loader ---
// GET /api/problemsets/no/:problemsetId/
export async function clientLoader ({ params }) {
    const res1 = await fetch(
        new URL(`/api/problemsets/no/${params.problemsetId}/all`, BASEURL).href, {
        credentials: "include",
    });

    const res2 = await fetch(
        new URL(`/api/problems/all`, BASEURL).href, {
        credentials: "include",
    });

    if (!res1.ok || !res2.ok) {
        throw new Error("Problemset not found");
    }
    return {
        problemsetDetail: await res1.json(),
        problems: await res2.json(),
    }
}

export function meta({ data }) {
    return [
        { title: `問題セット #${data.problemsetDetail.problemset.id} セット編集 - Practice Judge` },
    ];
}

export default function ControlPanelProblemsetSet({ loaderData, params }) {
    const { problemset, setProblems } = loaderData.problemsetDetail;
    const problems = loaderData.problems;
    const problemsDict = {};
    problems.forEach(p => problemsDict[p.id] = p);

    // problemset: メタデータ
    // setProblems: [{ id, sort_order }]
    // problems: [{ id, title }]

    const [list, setList] = useState(setProblems.map(p => p.id));
    // list: []

    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    const addItem = (p) => {
        const next = list.concat();
        next.push(p.id);
        setList(next);
    };

    const removeItem = (idx) => {
        if (!window.confirm("削除しますか？")) {
            return;
        }
        const next = list.filter((p, i) => i !== idx);
        setList(next);
    };

    const swapup = (idx) => {
        const next = list.concat();
        const v = next[idx];
        next[idx] = next[idx - 1];
        next[idx - 1] = v;
        setList(next);
    };

    const swapdown = (idx) => {
        const next = list.concat();
        const v = next[idx];
        next[idx] = next[idx + 1];
        next[idx + 1] = v;
        setList(next);
    };

    async function onSave() {
        setSaving(true);
        setMsg("");

        const payload = list.map((p, i) => {
            return {id: p, sort_order: i + 1}
        });

        const url = new URL(`/api/problemsets/no/${params.problemsetId}/update-set`, BASEURL);
        const res = await fetch(url.href, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ setProblems: payload })
        });

        if (!res.ok) {
            setMsg("保存に失敗しました");
        } else {
            setMsg("保存しました！");
        }
        setSaving(false);
    }

    return (
        <main className="container">

            <nav aria-label="breadcrumb">
                <ul>
                    <li><Link to="/control-panel">コントロールパネル</Link></li>
                    <li><Link to="/control-panel/problemsets">問題セット一覧</Link></li>
                    <li>セット編集 #{problemset.id}</li>
                </ul>
            </nav>

            <h2>セット編集 #{problemset.id}</h2>
            <div style={{ display: "flex" }}>
                <article style={{ height: "110vh", overflowY: "scroll", flex: "6" }}>
                    <p>問題セット名: <strong>{problemset.title}</strong></p>

                    <div style={{ display: "flex" }}>
                        <button
                            onClick={onSave}
                            disabled={saving}
                            aria-busy={saving ? "true" : "false"}
                        >
                            {saving ? "保存中..." : "保存する"}
                        </button>
                        {msg && <p className="pico-color-red-500">{msg}</p>}

                        <table>
                            <thead>
                                <tr>
                                    <th>問題順</th>
                                    <th>問題ID</th>
                                    <th>問題タイトル</th>
                                    <th></th>
                                    <th></th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody className="set-selector">
                                {list.map((p, i) => (
                                    <tr key={`${i}-${problemsDict[p].id}`}>
                                        <td>
                                            {i + 1}
                                        </td>
                                        <td>
                                            {p}
                                        </td>
                                        <td>
                                            <Link to={`/problems/no/${p}`}>
                                                {problemsDict[p].title}
                                                {problemsDict[p].is_published == 0 && "（非公開）"}
                                            </Link>
                                        </td>
                                        <td>
                                            {0 < i && <button onClick={() => swapup(i)}>↑</button>}
                                        </td>
                                        <td>
                                            {i < list.length - 1 && <button onClick={() => swapdown(i)}>↓</button>}
                                        </td>
                                        <td>
                                            <button onClick={() => removeItem(i)}>削除</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>

                <article style={{ height: "110vh", overflowY: "scroll", flex: "4" }}>
                    <h3 style={{ marginTop: "1em" }}>問題一覧</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>問題ID</th>
                                <th>問題タイトル</th>
                                <th>難易度</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {problems.map((p, i) => (
                                <tr key={p.id}>
                                    <td>
                                        {list.includes(p.id) && "✅"}{p.id}
                                    </td>
                                    <td>
                                        <Link to={`/problems/no/${p.id}`}>
                                            {p.title}
                                            {p.is_published == 0 && "（非公開）"}
                                        </Link>
                                    </td>
                                    <td>
                                        {p.difficulty}
                                    </td>
                                    <td>
                                        <button onClick={() => addItem(p)}>追加</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </article>
            </div>
        </main>
    );
}

