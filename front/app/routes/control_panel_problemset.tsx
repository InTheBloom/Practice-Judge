import { useState } from "react";
import { Link } from "react-router";
import { BASEURL } from "../backend_url";
import { AceEditorWritable } from '../ace_editor';

// --- loader ---
export async function clientLoader ({ params }) {
    const problemset = await fetch(new URL(`/api/problemsets/no/${params.problemsetId}/all`, BASEURL).href, {
        credentials: "include",
    });

    if (!problemset.ok) {
        throw new Error("fetch error");
    }

    return {
        problemsetData: await problemset.json(),
    };
}

export function meta({ data }) {
    return [
        { title: `問題セット編集 #${data.problemsetData.problemset.id} - Practice Judge` },
    ];
}

// --- Component ---
export default function ControlPanelProblemset({ loaderData, params }) {
    const { problemset } = loaderData.problemsetData;

    const [title, setTitle] = useState(problemset.title ?? "");
    const [description, setDescription] = useState(problemset.description ?? "");
    const [isPublished, setIsPublished] = useState(problemset.is_published ?? false);

    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    async function onSave() {
        setSaving(true);
        setSaveMsg("");

        const url = new URL(`/api/problemsets/no/${params.problemsetId}/update-detail`, BASEURL).href;

        const payload = {
            problemset: {
                id: params.problemsetId,
                title,
                description,
                is_published: isPublished,
            },
        };

        const res = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
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

    return (
        <main className="container">
            <nav aria-label="breadcrumb">
                <ul>
                    <li><Link to="/control-panel">コントロールパネル</Link></li>
                    <li><Link to="/control-panel/problemsets">問題セット一覧</Link></li>
                    <li>セット編集 #{problemset.id}</li>
                </ul>
            </nav>

            <hr />

            <h2>問題セット編集 #{problemset.id}</h2>

            <label>
                <strong>タイトル</strong>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </label>

            <label>
                <strong>説明文</strong>
                <AceEditorWritable
                    language={"html"}
                    value={description}
                    onChange={(newDesc) => setDescription(newDesc)}
                />
            </label>

            <fieldset>
                <legend><strong>公開設定</strong></legend>
                <input type="radio" id="公開" name="publish" value="1" onChange={(e) => setIsPublished(Number(e.target.value))} checked={isPublished == 1} />
                <label htmlFor="公開">公開する</label>
                <input type="radio" id="非公開" name="publish" value="0" onChange={(e) => setIsPublished(Number(e.target.value))} checked={isPublished == 0} />
                <label htmlFor="公開">公開しない</label>
            </fieldset>

            <button
                onClick={onSave}
                aria-busy={saving ? "true" : "false"}
                disabled={saving}
            >
                {saving ? "保存中..." : "保存する"}
            </button>

            {saveMsg && <p className="pico-color-red-500">{saveMsg}</p>}
        </main>
    );
}

