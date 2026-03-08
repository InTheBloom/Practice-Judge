import { Link, useNavigate, useSearchParams } from "react-router";
import { useState, useEffect, useRef } from "react";
import { BASEURL } from "../backend_url";

export async function clientLoader ({ request, params }) {
    const url = new URL(request.url);
    const page = url.searchParams.get("page") ?? "0";
    const username = url.searchParams.get("username") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const language = url.searchParams.get("language") ?? "";

    const query = new URLSearchParams();
    query.set("page", page);
    if (username) query.set("username", username);
    if (status) query.set("status", status);
    if (language) query.set("language", language);

    const res = await fetch(
        new URL(`/api/problems/no/${params.problemId}/submissions?${query.toString()}`, BASEURL).href, {
            credentials: "include",
    });

    // metaに問題タイトル表示するためだけに無駄に呼ぶ
    const resp = await fetch(
        new URL(`/api/problems/no/${params.problemId}/`, BASEURL).href, {
            credentials: "include",
    });

    if (!res.ok) {
        if (res.status == 401) {
            throw new Error("ログインが必要です。");
        }
        throw new Error("アクセスに失敗しました（サーバーエラー）");
    }
    if (!resp.ok) {
        throw new Error("アクセスに失敗しました（サーバーエラー）");
    }

    const data = await res.json();
    const datap = await resp.json();
    return { ...data, title: datap.title, page: Number(page), username, status, language, problemId: params.problemId };
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

export function meta ({ params, data }) {
    const prefix = data?.username == "" ? "" : `${data?.username} の`;
    return [
        { title: `${data?.title} ${prefix}提出一覧 - Practice Judge` },
    ];
}

function toJST(datetime: string) {
    return new Date(datetime + "Z").toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export default function Page ({ loaderData }) {
    const { submissions, total, page, username, status, language, problemId } = loaderData;

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
        const uname = formData.get("username")?.toString() ?? "";
        const stat = formData.get("status")?.toString() ?? "";
        const lang = formData.get("language")?.toString() ?? "";
        if (uname) query.set("username", uname);
        if (stat) query.set("status", stat);
        if (lang) query.set("language", lang);

        navigate(`/problems/no/${problemId}/submissions?${query.toString()}`);
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

    useEffect(() => {
        let ignore = false;
        const intervalId = setInterval(async () => {
            const datafetch = [];
            for (const sub of currentSubRef.current) {
                if (statusColorClass[sub.status] != null) {
                    continue;
                }
                datafetch.push(fetch(new URL(`/api/problems/no/${problemId}/submissions/check-status/${sub.id}`, BASEURL).href, {
                    credentials: "include",
                }));
            }

            const results = await Promise.all(datafetch);
            // 404を返してきたリクエストは無視する

            const jsonResults = await Promise.all(results.filter(r => r.ok).map(r => r.json()));

            if (ignore) {
                return;
            }

            // submissionの変更に追従できるようにfunctional updateを用いる
            setCurrentSub(prevSub => {
                let nextSub = [...prevSub];
                for (let i = 0; i < nextSub.length; i++) {
                    for (const data of jsonResults) {
                        if (nextSub[i].id != data.id) {
                            continue;
                        }
                        if (data.status.includes("executing")) {
                            let confirmed = 0;
                            for (const caseStatus of data.each) {
                                confirmed += statusColorClass[caseStatus.status] == null ? 0 : 1;
                            }
                            nextSub[i].status = data.status + ` (${confirmed} / ${data.each.length})`;
                        }
                        else {
                            nextSub[i].status = data.status;
                        }
                        nextSub[i].memory_kb = data.memory_kb;
                        nextSub[i].time_sec = data.time_sec;
                    }
                }

                return nextSub;
            });
        }, 2000);

        return () => {
            ignore = true;
            clearInterval(intervalId);
        };
    }, [problemId]);

    return (
        <main className="container">
            <h2>{username != "" && `${username} の`}提出一覧</h2>

            {/* フィルタフォーム */}
            <article>
                <h3 style={{display: "inline-block"}}>カスタム検索</h3>
                <form onSubmit={handleFilterSubmit}>
                    <div className="grid">
                        <label>
                            提出したユーザー
                            <input name="username" placeholder="Username" defaultValue={username} />
                        </label>

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
                problemId={problemId}
                username={username}
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
                        <th>ユーザー</th>
                        <th>言語</th>
                        <th>ステータス</th>
                        <th>コード長</th>
                        <th>実行時間</th>
                        <th>メモリ使用量</th>
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
                                        <Link to={`/problems/no/${problemId}/submissions/${sub.id}`}># {sub.id}</Link>
                                    </td>
                                    <td>{toJST(sub.created_at)}</td>
                                    <td><Link to={`/problems/no/${problemId}`}>{sub.problem_title}</Link></td>
                                    <td>{diff}</td>
                                    <td><Link to={`/users/${sub.username}`}>{sub.username}</Link></td>
                                    <td>{sub.code_language}</td>
                                    <td className={statusColorClass[sub.status] ?? ""}>
                                        {sub.status}
                                    </td>
                                    <td>{sub.bytes} Byte</td>
                                    <td>
                                        {sub.time_sec == null ? "-" : `${sub.time_sec} sec`}
                                    </td>
                                    <td>
                                        {sub.memory_kb == null ? "-" : `${sub.memory_kb} KB`}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </article>
        </main>
    );
}

function Pagination ({ problemId, username, status, language, page, total, totalPages }) {
    const prev = 0 < page ? (
        <Link
            to={`/problems/no/${problemId}/submissions?page=${page - 1}${
            username ? `&username=${username}` : ""
            }${status ? `&status=${status}` : ""}${language ? `&language=${language}` : ""}`}
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
            to={`/problems/no/${problemId}/submissions?page=${page + 1}${
            username ? `&username=${username}` : ""
            }${status ? `&status=${status}` : ""}${language ? `&language=${language}` : ""}`}
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
