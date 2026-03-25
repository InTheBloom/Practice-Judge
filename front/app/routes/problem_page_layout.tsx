import { Link, Outlet, useOutletContext, useNavigate } from 'react-router';
import { useState } from 'react';
import { BASEURL } from '../backend_url';

export default function ProblemPageLayout ({ params }) {
    const ctx = useOutletContext();
    const problemId = params.problemId;
    const { loginInfo } = ctx;

    return (
    <>
        <header className="container" style={{ marginBottom: "1em" }}>
            <nav>
                <ul>
                    <li><Link to={`/problems/no/${problemId}`}>
                        <span style={{ fontSize: "1.2em" }}>📝 問題文を見る</span>
                    </Link></li>
                    <li><Link to={`/problems/no/${problemId}/submissions`}>
                        <span style={{ fontSize: "1.2em" }}>📊 提出一覧を見る</span>
                    </Link></li>
                    <li><Link to={`/problems/no/${problemId}/submissions?username=${loginInfo.username}`}>
                        <span style={{ fontSize: "1.2em" }}>👤 自分の提出を見る</span>
                    </Link></li>
                    <li><Link to={`/problems/no/${problemId}/editorial`}>
                        <span style={{ fontSize: "1.2em" }}>💡 解説を見る</span>
                    </Link></li>
                </ul>
            </nav>
        </header>

        <Outlet context={ctx} />
    </>
    );
}
