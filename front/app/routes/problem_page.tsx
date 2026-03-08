import { useState, useEffect } from "react";
import { useNavigate, Link, useOutletContext } from "react-router";
import "katex/dist/katex.min.css";
import { BASEURL } from '../backend_url';
import parse from 'html-react-parser';
import renderMathInElement from '../auto-render';
import { AceEditorWritable } from '../ace_editor';

import { createPrompt } from '../prompt.ts';

export function meta({ data }: Route.MetaArgs) {
    const title = data?.title ?? "問題が見つかりません";
    return [
        { title: `${title} - Practice Judge` },
    ];
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

export async function clientLoader ({ params }) {
    const res = await fetch(new URL(`/api/problems/no/${params.problemId}`, BASEURL).href, {
        credentials: "include",
    });

    // 問題が見つからなければErrorBoundaryに投げる
    if (!res.ok) {
        throw new Error("問題が見つかりません。");
    }

    return await res.json();
}

export default function Page({ params, loaderData }) {
    const [source, setSource] = useState("");
    const [language, setLanguage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const problem = loaderData;
    const { loginInfo } = useOutletContext();

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);

        if (source === "") {
            setMessage("ソースコードが空です。");
            setSubmitting(false);
            return;
        }
        if (language === "") {
            setMessage("言語を選択してください。");
            setSubmitting(false);
            return;
        }

        // 未ログインの場合はloginページへ遷移
        if (!loginInfo.login) {
            navigate("/login");
            return;
        }

        JSON.stringify({
            language: language,
            code: source,
        });
        const res = await fetch(new URL(`api/problems/no/${params.problemId}/submit`, BASEURL).href, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                language: language,
                code: source,
            }),
            credentials: 'include',
        });

        if (res.ok) {
            setSource("");
            setSubmitting(false);
            // 自分の提出ページに遷移
            const id = await res.json();

            navigate(`/problems/no/${params.problemId}/submissions?username=${loginInfo.username}`);
            return;
        }

        setSubmitting(false);
    }

    // DOMパース -> サンプルコピーボタン作成 -> katex変換
    const parser = new DOMParser();
    const problemDOM = parser.parseFromString(problem.statement, "text/html");

    const promptHTML = problemDOM.body.innerHTML;

    // 1. preについたsampleクラスを探して直前のh3にボタンを作成
    // 2. reactノードに変換するときにonClickを設定。自分より後にある直近のpre.sampleのinnerTextをclipboardへコピー
    {
        const pres = problemDOM.querySelectorAll('pre.sample');
        for (const pre of pres) {
            const h3 = pre.previousElementSibling;

            if (h3 && h3.tagName === 'H3') {
                h3.innerHTML += `<button class="sample-copy outline secondary">コピー</button>`;
            }
        }
    }
    renderMathInElement(problemDOM);

    const problemJSX = parse(problemDOM.body.innerHTML, {
        replace (domNode) {
            if (domNode.attribs?.class?.includes("sample-copy")) {
                return (
                    <SampleCopyButton
                        className={domNode.attribs.class}
                        onClick={(e) => handleSampleCopy(e)}
                    >
                    コピー
                    </SampleCopyButton>
                );
            }
            return;
        }
    });

    async function handleSampleCopy (element) {
        const press = document.querySelectorAll('pre.sample');
        for (const pre of press) {
            if (element.target.compareDocumentPosition(pre) & Node.DOCUMENT_POSITION_FOLLOWING) {
                await navigator.clipboard.writeText(pre.innerText);
                break;
            }
        }
    };

    let diff = "";
    for (let i = 0; i < problem.difficulty; i++) {
        diff += "⭐";
    }
    for (let i = 0; i < 5 - problem.difficulty; i++) {
        diff += "☆";
    }
    const author = problem.author == "" ? "匿名" : problem.author;

    return (
        <main className="container">
            <article>
                <h2>{problem.title}{!problem.is_published && <span className="pico-color-red-450">（非公開）</span>}</h2>
                <p>
                    難易度: {diff}<br />
                    実行時間制限: {problem.time_limit_sec} sec<br />
                    メモリ制限: {problem.memory_limit_kb / 1000} MB
                </p>

                <p>
                    問題作成者: {author}
                </p>

                <hr />

                <AIhelpButton
                    onClick={() => navigator.clipboard.writeText(createPrompt(promptHTML))}
                >
                    AI質問用プロンプトをコピー🤖
                </AIhelpButton>

                <ul style={{ marginTop: "5px" }}>
                    <li>
                        <Link
                            to="https://chatgpt.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            🔗chatGPT
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="https://gemini.google.com/app?hl=ja"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            🔗Google Gemini
                        </Link>
                    </li>
                </ul>

                <hr />

                {problemJSX}
            </article>

            <form onSubmit={handleSubmit}>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option disabled value="">言語を選択してください</option>
                    <option value="C">C（gcc 13.3.0）</option>
                    <option value="C++">C++（g++ 13.3.0）</option>
                    <option value="D">D（dmd-2.111.0）</option>
                    <option value="Python3">Python3（Python 3.12.3）</option>
                    <option value="JavaScript">JavaScript（Node.js v24.13.0）</option>
                    <option value="TypeScript">TypeScript（Deno v2.5.4）</option>
                </select>

                <AceEditorWritable
                    language={language}
                    value={source}
                    onChange={(newValue) => setSource(newValue)}
                />

                <div style={{ marginTop: "1em" }}>
                    <button
                        style={{ width: "5em" }}
                        type="submit"
                        disabled={submitting}
                        aria-busy={submitting ? "true" : "false"}
                    >
                        提出
                    </button>
                    {message && <p className="pico-color-red-500">{message}</p>}
                </div>
            </form>
        </main>
    );
}

function SampleCopyButton ({ children, onClick, className }) {
    const [copied, setCopied] = useState(false);
    // useEffectはcopiedCodeの変化で発火し、trueへの変化ならwaitしてfalseにセットする。
    useEffect(() => {
        if (!copied) {
            return;
        }

        const id = setTimeout(() => setCopied(false), 1000);
        return () => clearTimeout(id);
    }, [copied]);

    const props = {
        onClick: (e) => {
            onClick(e);
            setCopied(true);
        },
        className: className,
    };
    if (copied) {
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

function AIhelpButton ({ children, onClick }) {
    const [copied, setCopied] = useState(false);
    // useEffectはcopiedCodeの変化で発火し、trueへの変化ならwaitしてfalseにセットする。
    useEffect(() => {
        if (!copied) {
            return;
        }

        const id = setTimeout(() => setCopied(false), 1000);
        return () => clearTimeout(id);
    }, [copied]);

    const props = {
        onClick: () => {
            onClick();
            setCopied(true);
        },
    };
    if (copied) {
        props["data-tooltip"] = "コピーしました！";
    }

    return (
        <button
            {...props}
            className="outline"
        >
            {children}
        </button>
    );
}
