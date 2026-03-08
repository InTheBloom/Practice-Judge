import { useState } from "react";
import { Link } from "react-router";
import { BASEURL } from "../backend_url";
import { AceEditorWritable } from '../ace_editor';

// --- clientLoader ---
export async function clientLoader ({ request, params }) {
    const url = new URL(`/api/problems/no/${params.problemId}/all`, BASEURL).href;
    const res = await fetch(url, {
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Problem not found");
    }

    return await res.json();
}

export function meta({ data }) {
    return [
        { title: `問題 #${data?.id} 編集 - Practice Judge` },
    ];
}

export default function ControlPanelProblem ({ loaderData, params }) {
    const [title, setTitle] = useState(loaderData.title);
    const [statement, setStatement] = useState(loaderData.statement);
    const [author, setAuthor] = useState(loaderData.author);
    const [difficulty, setDifficulty] = useState(loaderData.difficulty);
    const [editorial, setEditorial] = useState(loaderData.editorial);
    const [timeLimit, setTimeLimit] = useState(loaderData.time_limit_sec);
    const [memoryLimit, setMemoryLimit] = useState(loaderData.memory_limit_kb);
    const [isPublished, setIsPublished] = useState(loaderData.is_published);
    const [judgeCode, setJudgeCode] = useState(loaderData.judge_code);
    const [judgeLang, setJudgeLang] = useState(loaderData.judge_code_language);

    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    async function onSave() {
        setSaving(true);
        setSaveMsg("");

        const url = new URL(`/api/problems/no/${params.problemId}/update`, BASEURL).href;

        const res = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                statement,
                author,
                difficulty: Number(difficulty),
                editorial,
                time_limit_sec: Number(timeLimit),
                memory_limit_kb: Number(memoryLimit),
                is_published: parseInt(isPublished),
                judge_code: judgeCode,
                judge_code_language: judgeLang
            }),
            credentials: "include",
        });

        if (!res.ok) {
            setSaveMsg("保存に失敗しました。");
            setSaving(false);
            return;
        }

        setSaveMsg("保存しました！");
        setSaving(false);
    }

    const saveBtn = <>
            <button
                onClick={onSave}
                aria-busy={saving ? "true" : "false"}
                disabled={saving}
            >
                保存
            </button>
        </>;
    const btnMsg = saveMsg === "" ? <></> : saveMsg.includes("失敗")
                                        ? <p className="pico-color-red-500">{saveMsg}</p>
                                        : <p className="pico-color-green-500">{saveMsg}</p>;

    return (
        <main className="container">
            <nav aria-label="breadcrumb">
                <ul>
                    <li><Link to="/control-panel">コントロールパネル</Link></li>
                    <li><Link to="/control-panel/problems">問題一覧</Link></li>
                    <li>問題編集 #{loaderData.id}</li>
                </ul>
            </nav>

            <hr />

            <h2>問題編集 #{loaderData.id}</h2>

            <label>
                <strong>タイトル</strong>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </label>

            <label>
                <strong>作成者</strong>
                <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                />
            </label>
            <label>
                <strong>難易度</strong>
                <input
                    type="number"
                    value={difficulty}
                    min={1}
                    max={5}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                />
            </label>

            <strong>問題文</strong>
            <div style={{ display: "flex", marginBottom: "1em" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                    {saveBtn}
                </div>

                <div style={{ width: "90%" }}>
                    <AceEditorWritable
                        language={"html"}
                        value={statement}
                        onChange={(newValue) => setStatement(newValue)}
                    />
                </div>
            </div>

            <strong>解説</strong>
            <div style={{ display: "flex" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                    {saveBtn}
                </div>

                <div style={{ width: "90%" }}>
                    <AceEditorWritable
                        language={"html"}
                        value={editorial}
                        onChange={(newValue) => setEditorial(newValue)}
                    />
                </div>
            </div>

            <div className="grid">
                <label>
                    <strong>時間制限 (sec)</strong>
                    <input
                        type="number"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value)}
                    />
                </label>

                <label>
                    <strong>メモリ制限 (KB)</strong>
                    <input
                        type="number"
                        value={memoryLimit}
                        onChange={(e) => setMemoryLimit(e.target.value)}
                    />
                </label>
            </div>

            <label>
                <strong>ジャッジコード</strong>
                <AceEditorWritable
                    language={judgeLang}
                    value={judgeCode}
                    onChange={(newCode) => setJudgeCode(newCode)}
                />
            </label>

            <label>
                <strong>ジャッジ言語</strong>
                <select
                    value={judgeLang}
                    onChange={(e) => setJudgeLang(e.target.value)}
                >
                    <option value="C">C</option>
                    <option value="C++">C++</option>
                    <option value="D">D</option>
                    <option value="Python3">Python3</option>
                    <option value="JavaScript">JavaScript</option>
                    <option value="TypeScript">TypeScript</option>
                </select>
            </label>

            <fieldset>
                <legend><strong>公開設定</strong></legend>
                <input type="radio" id="公開" name="publish" value="1" onChange={(e) => setIsPublished(Number(e.target.value))} checked={isPublished == 1} />
                <label htmlFor="公開">公開する</label>
                <input type="radio" id="非公開" name="publish" value="0" onChange={(e) => setIsPublished(Number(e.target.value))} checked={isPublished == 0} />
                <label htmlFor="公開">公開しない</label>
            </fieldset>

            {saveBtn}
            {btnMsg}
        </main>
    );
}

