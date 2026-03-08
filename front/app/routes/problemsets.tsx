import { useState, useEffect } from "react";
import { Link } from "react-router";
import { BASEURL } from '../backend_url';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "問題セット一覧 - Practice Judge" },
  ];
}

export async function clientLoader () {
    const fret = await Promise.all([
        fetch(new URL("/api/problemsets", BASEURL).href, {
            credentials: "include",
        }),
        fetch(new URL("/api/problems/solved", BASEURL).href, {
            credentials: "include",
        }),
        fetch(new URL("/api/problemsets/registered-problems", BASEURL).href, {
            credentials: "include",
        }),
    ]);
    const ret = await Promise.all(fret.map(r => r.json()));

    const solved = {};
    const submitted = {};
    for (const v of ret[1].solvedIds) {
        solved[v.id] = true;
    }
    for (const v of ret[1].submittedIds) {
        submitted[v.id] = true;
    }

    return { problemsets: ret[0], solved, submitted, registeredProblems: ret[2] };
}

export default function Problemsets ({ loaderData }) {
    const { problemsets, solved, submitted, registeredProblems } = loaderData;
    // problemsets: [{ id, title }]
    // solved: { solved_id1: true, solved_id2: true, ... }
    // submitted: { submitted_id1: true, submitted_id2_id2: true, ... }
    // registeredProblems: [{ problemset_id, problem_id }]

    function calcColor (setid) {
        const problemCount = registeredProblems.reduce((acc, p) => acc + (p.problemset_id == setid ? 1 : 0), 0);
        const solvedCount = registeredProblems.reduce((acc, p) => acc + (p.problemset_id == setid && solved[p.problem_id] != null ? 1 : 0), 0);

        if (problemCount == solvedCount) {
            return "pico-background-green-50";
        }
        if (solvedCount > 0) {
            return "pico-background-pumpkin-50";
        }
        return "";
    }

    return (
        <main className="container">
            <h1>問題セット一覧</h1>
            <hr />
            {problemsets.map((ps) => {
                return (
                    <article key={ps.id} className={calcColor(ps.id)}>
                        <Link to={`/problemsets/no/${ps.id}`}>
                            #{ps.id} {ps.title}
                        </Link>
                    </article>
                );
            })}
        </main>
    );
}
