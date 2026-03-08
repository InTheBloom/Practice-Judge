import { useState, useEffect } from "react";
import { useNavigate, Link, useOutletContext } from "react-router";
import { BASEURL } from '../backend_url';
import parse from 'html-react-parser';

export function meta({ data }: Route.MetaArgs) {
    const id = data?.problemset?.id;
    const ptitle = data?.problemset?.title;

    let title = "問題セットが見つかりません";
    if (id != null && ptitle != null) {
        title = `#${data.problemset.id} ${data.problemset.title}`;
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
    const fetched = await Promise.all([
        fetch(new URL(`/api/problemsets/no/${params.problemsetId}`, BASEURL).href, {
            credentials: "include",
        }),
        fetch(new URL(`/api/problems/solved`, BASEURL).href, {
            credentials: "include",
        }),
        fetch(new URL("/api/problems/clearrate", BASEURL).href, {
            credentials: "include",
        }),
    ]);
    for (const f of fetched) {
        if (!f.ok) {
            throw new Error("データ取得失敗");
        }
    }

    const jsons = await Promise.all(fetched.map(r => r.json()));

    const solved = {};
    const submitted = {};
    for (const v of jsons[1].solvedIds) {
        solved[v.id] = true;
    }
    for (const v of jsons[1].submittedIds) {
        submitted[v.id] = true;
    }

    const rate = {};
    for (const v of jsons[2]) {
        rate[v.problem_id] = { challengers: v.challengers, solvers: v.solvers };
    }

    return {
        problemset: jsons[0].problemset,
        setProblems: jsons[0].setProblems,
        solved,
        submitted,
        rate,
    };
}

export default function Page({ params, loaderData }) {
    const { problemset, setProblems, solved, submitted, rate } = loaderData;

    const calcColor = (pid) => {
        if (solved[pid] != null) {
            return "pico-background-green-50";
        }
        if (submitted[pid] != null) {
            return "pico-background-pumpkin-50";
        }
        return "";
    };

    const ALP = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";


    return (
        <main className="container">
            <article>
                <h1>#{problemset.id} {problemset.title}</h1>
                <hr />
                {parse(problemset.description)}
            </article>

            <article className="overflow-auto">
                <table style={{ whiteSpace: "nowrap" }}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>問題タイトル</th>
                            <th>難易度</th>
                            <th>解決者数 / 挑戦者数</th>
                        </tr>
                    </thead>
                    <tbody>
                        {setProblems.map((p, index) => {
                            let diff = "";
                            for (let i = 0; i < 5; i++) {
                                diff += i < p.difficulty ? "⭐" : "☆";
                            }
                            return (
                                <tr key={p.id}>
                                    <td className={calcColor(p.id)}>{ALP[index]}</td>
                                    <td className={calcColor(p.id)}><Link to={`/problems/no/${p.id}`} target="_blank" rel="noopener noreferrer">{p.title}</Link></td>
                                    <td className={calcColor(p.id)}>{diff}</td>
                                    <td className={calcColor(p.id)}>
                                        {rate[p.id] == null ? 0 : rate[p.id].solvers}
                                        /
                                        {rate[p.id] == null ? 0 : rate[p.id].challengers}
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
