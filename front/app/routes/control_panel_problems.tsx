import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { BASEURL } from '../backend_url';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "問題エディター（一覧） - Practice Judge" },
  ];
}

export async function clientLoader ({ request }) {
    const fp = await fetch(new URL("/api/problems/all", BASEURL).href, {
        credentials: "include",
    });
    return await fp.json();
}

export default function ControlPanelProblems ({ loaderData }) {
    const problems = loaderData;

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function createNewProblem () {
        if (!window.confirm("問題を作成します。よろしいですか？")) {
            return;
        }

        setLoading(true);
        const res = await fetch(new URL("/api/problems/create", BASEURL).href, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        setLoading(false);
        navigate("/control-panel/problems");
    }

    return (
    <>
        <main className="container">
            <nav aria-label="breadcrumb">
                <ul>
                    <li><Link to="/control-panel">コントロールパネル</Link></li>
                    <li>問題一覧</li>
                </ul>
            </nav>

            <hr />

            <h1>問題一覧</h1>
            <button onClick={createNewProblem} disabled={loading} aria-busy={loading ? "true" : "false"}>新規問題</button>

            <article>
                <table>
                    <thead>
                        <tr>
                            <th>問題ID</th>
                            <th>問題タイトル</th>
                            <th>テストケース</th>
                            <th>リジャッジ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {problems.map((problem) => {
                            return (
                            <tr key={problem.id}>
                                <td>{problem.id}</td>
                                <td>
                                    <Link to={`/control-panel/problems/no/${problem.id}`}>{problem.title}</Link>
                                    {problem.is_published == 0 && <>（非公開）</>}
                                </td>
                                <td><Link to={`/control-panel/problems/no/${problem.id}/testcase`}>テストケース編集</Link></td>
                                <td><RejudgeButton problemId={problem.id}></RejudgeButton></td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </article>
        </main>
    </>
    );
}

function RejudgeButton ({ problemId }) {
    const [rejudging, setRejudging] = useState(false);

    const rejudge = async (problemId) => {
        if (!window.confirm(`問題ID ${problemId}への提出をすべてリジャッジします。よろしいですか？`)) {
            return;
        }
        setRejudging(true);

        const res = await fetch(new URL(`/api/problems/no/${problemId}/rejudge`, BASEURL), {
            method: "POST",
            credentials: "include",
        });

        if (res.ok) {
            const resval = await res.json();
            console.log(`rejudge ok. ${resval.rejudged} submissions rejudged.`);
        }
        else {
            console.error("rejudge failed.");
        }
        setRejudging(false);
    };


    return (
        <button onClick={() => rejudge(problemId)} disabled={rejudging} aria-busy={rejudging ? "true" : "false"}>リジャッジする</button>
    );
}
