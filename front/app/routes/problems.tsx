import { useState, useEffect } from "react";
import { Link } from "react-router";
import { BASEURL } from '../backend_url';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "問題一覧 - Practice Judge" },
  ];
}

export async function clientLoader () {
    const fret = await Promise.all([
        fetch(new URL("/api/problems", BASEURL).href, {
            credentials: "include",
        }),
        fetch(new URL("/api/problems/clearrate", BASEURL).href, {
            credentials: "include",
        }),
        fetch(new URL("/api/problems/solved", BASEURL).href, {
            credentials: "include",
        }),
    ]);
    const ret = await Promise.all(fret.map(r => r.json()));
    const rate = {};
    for (const v of ret[1]) {
        rate[v.problem_id] = { challengers: v.challengers, solvers: v.solvers };
    }

    const solved = {};
    const submitted = {};
    for (const v of ret[2].solvedIds) {
        solved[v.id] = true;
    }
    for (const v of ret[2].submittedIds) {
        submitted[v.id] = true;
    }

    return { problems: ret[0], rate, solved, submitted };
}

export default function Problems ({ loaderData }) {
    const { problems, rate, solved, submitted } = loaderData;
    // rate: { problem_id1: { challengers, solvers }, problem_id2: { challengers, solvers}, ... }
    // solved: { solved_id1: true, solved_id2: true, ... }
    // submitted: { submitted_id1: true, submitted_id2_id2: true, ... }

    function calcColor (problem) {
        if (solved[problem.id] != null) {
            return "var(--solved-bg)";
        }
        if (submitted[problem.id] != null) {
            return "var(--tried-bg)";
        }
        return "";
    }

    const [hideSolved, setHideSolved] = useState(false);
    const [order, setOrder] = useState(0);

    const funs = [
        (a, b) => {
            return b.id - a.id;
        },
        (a, b) => {
            const v = b.difficulty - a.difficulty;
            return v == 0 ? b.id - a.id : v;
        },
        (a, b) => {
            const v = a.difficulty - b.difficulty;
            return v == 0 ? b.id - a.id : v;
        },
    ];

    const problemsView = problems.filter(v => !hideSolved || solved[v.id] == null)
                                 .sort(funs[order]);

    return (
        <main className="container">
            <h1>問題一覧</h1>

            <hr />

            <div style={{ display: "flex", columnGap: "1em", marginBottom: "1em" }}>
                <div>
                    <AscRadioButton state={order} setter={setOrder} />
                </div>
                <div>
                    <ToggleSwitch state={hideSolved} setter={setHideSolved} >
                        解決済を非表示
                    </ToggleSwitch>
                </div>
            </div>

            <article className="overflow-auto">
                <table style={{ whiteSpace: "nowrap" }}>
                    <thead>
                        <tr>
                            <th>問題ID</th>
                            <th>問題タイトル</th>
                            <th>難易度</th>
                            <th>解決者数 / 挑戦者数</th>
                        </tr>
                    </thead>
                    <tbody>
                        {problemsView.map((p) => {
                            let diff = "";
                            for (let i = 0; i < 5; i++) {
                                diff += i < p.difficulty ? "⭐" : "☆";
                            }
                            return (
                                <tr key={p.id}>
                                    <td style={{ background: `${calcColor(p)}`}}>{p.id}</td>
                                    <td style={{ background: `${calcColor(p)}`}}><Link to={`/problems/no/${p.id}`}>{p.title}{!p.is_published && <span className="pico-color-red-450">（非公開）</span>}</Link></td>
                                    <td style={{ background: `${calcColor(p)}`}}>{diff}</td>
                                    <td style={{ background: `${calcColor(p)}`}}>
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

function ToggleSwitch ({ children, state, setter }) {
    return (
        <label>
            <input
                type="checkbox"
                checked={state}
                onChange={(e) => setter(e.target.checked)}
            />
            {children}
        </label>
    );
}

function AscRadioButton ({ state, setter }) {
    const f = (e) => {
        const v = e.target.value;
        setter(Number(v));
    };
    return (
        <>
            <label>
                <input type="radio" name="order" value="0" onChange={f} checked={state === 0} /> 新着順
            </label>

            <label>
                <input type="radio" name="order" value="1" onChange={f} checked={state === 1} /> 難しい順
            </label>

            <label>
                <input type="radio" name="order" value="2" onChange={f} checked={state === 2} /> 簡単順
            </label>
        </>
    );
}
