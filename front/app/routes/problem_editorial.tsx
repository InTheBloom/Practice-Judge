import { useState, useEffect } from "react";
import { Link } from "react-router";
import { BASEURL } from '../backend_url';
import parse from 'html-react-parser';
import renderMathInElement from '../auto-render';
import { AceEditorReadOnly } from '../ace_editor';

export function links () {
    return [
        { rel: "stylesheet", href: new URL("/static/katex/katex.min.css", BASEURL).href },
    ];
}

export function meta({ data }: Route.MetaArgs) {
    let title = "問題が見つかりません";
    if (data?.title != null) {
        title = `解説 ${data.title}`;
    }

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
    const res = await fetch(new URL(`/api/problems/no/${params.problemId}/editorial`, BASEURL).href, {
        credentials: "include",
    });

    // 問題が見つからなければErrorBoundaryに投げる
    if (!res.ok) {
        throw new Error("問題が見つかりません。");
    }

    return await res.json();
}

export default function Editorial ({ params, loaderData }) {
    const problem = loaderData;

    // DOMパース -> <code editor language="text"></code>部分をaceeditorに置換
    const parser = new DOMParser();
    const problemDOM = parser.parseFromString(problem.editorial, "text/html");
    renderMathInElement(problemDOM);

    const editorialJSX = parse(problemDOM.body.innerHTML, {
        replace (domNode) {
            if (domNode?.type == "tag" && domNode?.name == "code") {
                // 属性editorの確認
                const hasEditor = domNode?.attribs?.hasOwnProperty("editor");
                if (hasEditor == null || !hasEditor) {
                    return;
                }

                // languageの取得
                const language = domNode?.attribs?.language ?? "text";

                return (
                    <AceEditorReadOnly
                        language={language}
                        value={domNode.children[0].data}
                        expand={true}
                    />
                );
            }
            return;
        }
    });

    return (
        <main className="container">
            <article>
                <h2><Link to={`/problems/no/${params.problemId}`}>{problem.title}{!problem.is_published && <span className="pico-color-red-450">（非公開）</span>}</Link> 解説</h2>

                <hr />

                {editorialJSX.length == 0 ? "この問題には解説がありません。" : editorialJSX}
            </article>
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
