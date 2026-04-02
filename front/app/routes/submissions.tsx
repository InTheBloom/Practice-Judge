import { Link, useNavigate, useSearchParams } from "react-router";
import { useState, useEffect, useRef } from "react";
import { BASEURL } from "../backend_url";
import { toJST } from '../utils';

export async function clientLoader ({ request, params }) {
    const url = new URL(request.url);
    const page = url.searchParams.get("page") ?? "0";
    const status = url.searchParams.get("status") ?? "";
    const language = url.searchParams.get("language") ?? "";

    const query = new URLSearchParams();
    query.set("page", page);
    if (status) query.set("status", status);
    if (language) query.set("language", language);

    const res = await fetch(
        new URL(`/api/submissions?${query.toString()}`, BASEURL).href, {
            credentials: "include",
    });

    if (!res.ok) {
        throw new Error("アクセスに失敗しました（サーバーエラー）");
    }

    const data = await res.json();
    return { ...data, page: Number(page), status, language };
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

export function meta () {
    return [
        { title: "提出一覧 - Practice Judge" },
    ];
}

export default function Page ({ loaderData }) {
    const { submissions, total, page, status, language } = loaderData;

    const [currentSub, setCurrentSub] = useState(submissions);
    const currentSubRef = useRef(currentSub);

    // state更新
    useEffect(() => {
        setCurrentSub(submissions);
    }, [submissions]);

    // ref更新
    useEffect(() => {
        currentSubRef.current = currentSub;
    }, [currentSub]);

    const navigate = useNavigate();
    const totalPages = Math.ceil(total / 20);

    const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const query = new URLSearchParams();
        query.set("page", "0"); // フィルタ変更時は最初のページ
        const formData = new FormData(form);
        const stat = formData.get("status")?.toString() ?? "";
        const lang = formData.get("language")?.toString() ?? "";
        if (stat) query.set("status", stat);
        if (lang) query.set("language", lang);

        navigate(`/submissions?${query.toString()}`);
    };

    const statusColorClass = {
        AC : "pico-color-green-200",
        WA : "pico-color-pumpkin-200",
        TLE: "pico-color-pumpkin-200",
        RE : "pico-color-pumpkin-200",
        CE : "pico-color-pumpkin-200",
        MLE: "pico-color-pumpkin-200",
        OLE: "pico-color-pumpkin-200",
        IE : "pico-color-red-400",
    };

    return (
        <main className="container">
            <h1>提出一覧</h1>

            <article>
                <h3 style={{display: "inline-block"}}>カスタム検索</h3>
                <form onSubmit={handleFilterSubmit}>
                    <div className="grid">
                        <label>
                            言語
                            <select name="language" defaultValue={language}>
                                <option value="">すべて</option>
                                <option value="C">C</option>
                                <option value="C++">C++</option>
                                <option value="D">D</option>
                                <option value="Python3">Python3</option>
                                <option value="JavaScript">JavaScript</option>
                                <option value="TypeScript">TypeScript</option>
                            </select>
                        </label>

                        <label>
                            ステータス
                            <select name="status" defaultValue={status}>
                                <option value="">すべて</option>
                                <option value="AC">AC</option>
                                <option value="WA">WA</option>
                                <option value="TLE">TLE</option>
                                <option value="RE">RE</option>
                                <option value="CE">CE</option>
                                <option value="MLE">MLE</option>
                                <option value="OLE">OLE</option>
                                <option value="IE">IE</option>
                            </select>
                        </label>
                    </div>
                    <button type="submit" className="searchbtn">検索</button>
                </form>
            </article>

            <Pagination
                status={status}
                language={language}
                page={page}
                total={total}
                totalPages={totalPages}
            />

            <article className="overflow-auto">
                <table style={{ whiteSpace: "nowrap" }}>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>提出時間</th>
                        <th>問題</th>
                        <th>難易度</th>
                        <th>ステータス</th>
                        <th>ユーザー</th>
                        <th>言語</th>
                    </tr>
                    </thead>
                    <tbody>
                        {currentSub.map((sub) => {
                            let diff = "";
                            for (let i = 0; i < 5; i++) {
                                diff += i < sub.difficulty ? "⭐" : "☆";
                            }
                            return (
                                <tr key={sub.id}>
                                    <td>
                                        <Link to={`/problems/no/${sub.problem_id}/submissions/${sub.id}`}># {sub.id}</Link>
                                    </td>
                                    <td>{toJST(sub.created_at)}</td>
                                    <td><Link to={`/problems/no/${sub.problem_id}`}>{sub.problem_title}</Link></td>
                                    <td>{diff}</td>
                                    <td className={statusColorClass[sub.status] ?? ""}>
                                        {sub.status}
                                    </td>
                                    <td><Link to={`/users/${sub.username}`}>{sub.username}</Link></td>
                                    <td>{sub.code_language}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </article>
        </main>
    );
}

function Pagination ({ status, language, page, total, totalPages }) {
    const prev = 0 < page ? (
        <Link
            to={`/submissions?page=${page - 1}${status ? `&status=${status}` : ""}${language ? `&language=${language}` : ""}`}
        >
            ← Prev
        </Link>
    ) : (
        <>
            ← Prev
        </>
    );

    const next = page + 1 < totalPages ? (
        <Link
            to={`/submissions?page=${page + 1}${status ? `&status=${status}` : ""}${language ? `&language=${language}` : ""}`}
        >
            Next →
        </Link>
    ) : (
        <>
            Next →
        </>
    );

    return (
        <>
            <div style={{ textAlign: "center" }}>
                {prev} | {next}
            </div>
            <p>
                {page + 1} / {totalPages} ページ（{total} 件）
            </p>
        </>
    );
}
