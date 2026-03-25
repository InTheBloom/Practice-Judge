import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { BASEURL } from "../backend_url";
import { AceEditorReadOnly } from "../ace_editor.tsx";
import { toJST } from '../utils';

export async function clientLoader ({ params }) {
    const res = await fetch(new URL(`/api/problems/no/${params.problemId}/submissions/${params.submissionId}`, BASEURL).href, {
        credentials: "include",
    });
    if (!res.ok) {
        throw new Error("提出が見つかりません。");
    }
    return await res.json();
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

export function meta({ data }) {
    let title = "提出が見つかりません";
    const id = data?.whole?.id;
    if (id != null) {
        title = `提出 #${id}`;
    }
    return [
        { title: `${title} - Practice Judge` },
    ];
}

export default function Page({ loaderData, params }) {
    const initialData = loaderData as {
        whole: any;
        each: Array<any>;
    };
    const [submission, setSubmission] = useState(initialData);
    const submissionRef = useRef(submission);
    useEffect(() => {
        submissionRef.current = submission;
    }, [submission]);

    const [expandCode, setExpandCode] = useState(false);
    const problemId = params.problemId;

    useEffect(() => {
        let ignore = false;
        const interval = setInterval(async () => {
            const finishedStatuses = ["AC", "WA", "CE", "RE", "TLE", "MLE", "OLE", "IE"];
            if (finishedStatuses.indexOf(submissionRef.current.whole.status) == -1) {
                const res = await fetch(new URL(`/api/problems/no/${params.problemId}/submissions/${params.submissionId}`, BASEURL).href, {
                    credentials: 'include',
                });
                if (!res.ok) {
                    // 正常系以外は放置（途中で非公開化される可能性を考えて）
                    return;
                }

                const sub = await res.json();
                if (!ignore) {
                    setSubmission(sub);
                }
            }
        }, 1000);

        return () => {
            ignore = true;
            clearInterval(interval);
        };
    }, [params.submissionId]);

    if (!submission || !submission.whole || !submission.each) {
        return <p style={{ color: "red" }}>Submission not found!</p>;
    }

    const { whole, each } = submission;

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
        <h2>提出 #{whole.id}</h2>

        <article>
            <h3 style={{ display: "inline-block", marginRight: "0.5em" }}>ソースコード</h3>
            <button
                style={{ marginRight: "0.5em" }}
                onClick={() => setExpandCode(!expandCode)}
                className="button-small-padding"
            >
                {expandCode ? "一部表示に変更" : "全行表示に変更"}
            </button>
            <CodeCopyButton
                onClick={() => navigator.clipboard.writeText(whole.code)}
            >
                コードをコピー
            </CodeCopyButton>
            <div style={{ margin: "1em 0" }}>
                <AceEditorReadOnly
                    language={whole.code_language}
                    value={whole.code}
                    expand={expandCode}
                />
            </div>
        </article>

        <article>
            <h3>詳細情報</h3>
            <table>
                <tbody>
                    <tr>
                        <th scope="row">提出日時</th>
                        <td>{toJST(whole.created_at)}</td>
                    </tr>
                    <tr>
                        <th scope="row">問題</th>
                        <td><Link to={`/problems/no/${problemId}`}>{whole.title}</Link></td>
                    </tr>
                    <tr>
                        <th scope="row">難易度</th>
                        <td>{"⭐".repeat(whole.difficulty) + "☆".repeat(5 - whole.difficulty)}</td>
                    </tr>

                    <tr>
                        <th scope="row">ユーザー</th>
                        <td><Link to={`/users/${whole.username}`}>{whole.username}</Link> <Link to={`/problems/no/${problemId}/submissions?username=${whole.username}`}>🔍</Link></td>
                    </tr>

                    <tr>
                        <th scope="row">言語</th>
                        <td>{whole.code_language}</td>
                    </tr>

                    <tr>
                        <th scope="row">ステータス</th>
                        <td>
                            <span className={statusColorClass[whole.status]}>
                                {whole.status}
                            </span>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">コード長</th>
                        <td>
                            {whole.bytes} Byte
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">実行時間</th>
                        <td>
                            {whole.time_sec == null ? "-" : whole.time_sec} / {whole.time_limit_sec} sec
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">メモリ使用量</th>
                        <td>
                            {whole.memory_kb == null ? "-" : whole.memory_kb} / {whole.memory_limit_kb} KB
                        </td>
                    </tr>
                </tbody>
            </table>
        </article>

        {whole.message && (
            <article>
                <h3>エラーメッセージ</h3>
                <pre><code>{whole.message}</code></pre>
            </article>
        )}


        {0 < each.length && (
            <article className="overflow-auto">
                <h3>テストケース結果</h3>
                <table style={{ whiteSpace: "nowrap" }}>
                    <thead>
                        <tr>
                            <th scope="col">テストケース名</th>
                            <th scope="col">ステータス</th>
                            <th scope="col">実行時間 (sec)</th>
                            <th scope="col">メモリ (KB)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {each.map((tc, idx) => (
                            <tr key={idx}>
                                <td>{tc.testcase_name}</td>
                                <td><span className={statusColorClass[tc.status]}>{tc.status}</span></td>
                                <td>{tc.time_sec == null ? "-" : tc.time_sec}</td>
                                <td>{tc.memory_kb == null ? "-" : tc.memory_kb}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </article>
        )}
    </main>
  );
}

function CodeCopyButton ({ children, onClick }) {
    const [copiedCode, setCopiedCode] = useState(false);
    // useEffectはcopiedCodeの変化で発火し、trueへの変化ならwaitしてfalseにセットする。
    useEffect(() => {
        if (!copiedCode) {
            return;
        }

        const id = setTimeout(() => setCopiedCode(false), 1000);
        return () => clearTimeout(id);
    }, [copiedCode]);

    const props = {
        className: "button-small-padding",
        onClick: () => {
            onClick();
            setCopiedCode(true);
        },
    };
    if (copiedCode) {
        props["data-tooltip"] = "コピーしました！";
    }

    return (
        <button
            {...props}
        >
            {children}
        </button>
    );
}
