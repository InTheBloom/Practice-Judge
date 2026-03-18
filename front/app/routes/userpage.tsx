import { BASEURL } from '../backend_url';
import { useState, useEffect } from 'react';
import { Link } from 'react-router';

export function meta({ data }) {
    const uname = data?.userInfo?.username ?? "ユーザーが見つかりません";
    return [
        { title: `${uname} - Practice Judge` }
    ];
}

export async function clientLoader ({ params }) {
    const fUserInfo = await fetch(new URL(`/api/users/${params.userName}`, BASEURL).href, {
        credentials: "include",
    });
    // 見つからなければthrowしてErrorBoundaryに投げる
    if (!fUserInfo.ok) {
        throw new Error("ユーザーが見つかりません。");
    }

    // 他のapiを叩く
    const fSolvedInfo = await fetch(new URL(`/api/users/${params.userName}/solved`, BASEURL).href, {
        credentials: "include",
    });
    const solvedInfo = await fSolvedInfo.json();

    const userInfo = await fUserInfo.json();

    return { userInfo, solvedInfo }
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

export default function UserPage ({ loaderData }) {
    const { userInfo, solvedInfo } = loaderData;
    const [submissionPage, setSubmissionPage] = useState(0);
    const [totalSubmissions, setTotalSubmissions] = useState(0);
    const [currentSubmissions, setCurrentSubmissions] = useState([]);

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
        const update = async () => {
            const fRecentSubmissions = await fetch(new URL(`/api/users/${userInfo.username}/recent-submissions?page=${submissionPage}`, BASEURL).href, { credentials: 'include' });
            const { total, submissions } = await fRecentSubmissions.json();
            setCurrentSubmissions(submissions);
            setTotalSubmissions(total);
        }
        update();

        return () => {
            ignore = true;
        };
    }, [userInfo.username, submissionPage]);

    const totalPages = Math.ceil(totalSubmissions / 20);

    const buttonStyle = {
        padding: "0px 5px"
    };
    const prev = 0 < submissionPage
                    ? <button style={buttonStyle} onClick={() => setSubmissionPage((v) => v - 1)}>← Prev</button>
                    : <>← Prev</>;
    const next = submissionPage + 1 < totalPages
                    ? <button style={buttonStyle} onClick={() => setSubmissionPage((v) => v + 1)}>Next →</button>
                    : <>Next →</>;
        

    const pageNation = (
    <div style={{ textAlign: "center" }}>
        <div>
            {prev} {next}
        </div>
        {submissionPage + 1} / {totalPages} ページ（{totalSubmissions} 件）
    </div>
    );

    return (
        <main className="container">
            <h1>
                {userInfo.username}
                {(userInfo.role == "admin" || userInfo.role == "inthebloom") && <>（<span className="pico-color-red-450">管理者</span>）</> }
            </h1>

            <time dateTime={toJST(userInfo.created_at)}>
                登録日: {toJST(userInfo.created_at)}
            </time>

            <div className="grid" style={{ marginTop: "2em" }}>
                <Card name={"提出"} value={solvedInfo.submit} />
                <Card name={"解決"} value={solvedInfo.solved} />
            </div>

            <article className="overflow-auto">
                <h2>このユーザーの提出</h2>

                {pageNation}

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
                        {currentSubmissions.map((sub) => {
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

function Card ({ name, value }) {
    return (
        <article style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
            <div style={{ fontSize: "1.5em" }}>{value}</div>
            <div style={{ fontSize: "1.5em" }}>{name}</div>
        </article>
    );
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
