import { Link, Outlet, useOutletContext, useNavigate } from 'react-router';
import { useState } from 'react';
import { BASEURL } from '../backend_url';

export default function ProblemSetPageLayout ({ params }) {
    const ctx = useOutletContext();
    const problemsetId = params.problemsetId;
    const { loginInfo } = ctx;

    return (
    <>
        <header className="container" style={{ marginBottom: "1em" }}>
            <nav>
                <ul>
                    <li><Link to={`/problemsets/no/${problemsetId}`}>概要</Link></li>
                    <li><Link to={`/problemsets/no/${problemsetId}/problems`}>問題一覧を見る</Link></li>
                    <li><Link to={`/problemsets/no/${problemsetId}/submissions`}>提出一覧を見る</Link></li>
                    <li><Link to={`/problemsets/no/${problemsetId}/submissions?username=${loginInfo.username}`}>自分の提出を見る</Link></li>
                </ul>
            </nav>
        </header>

        <Outlet context={ctx} />
    </>
    );
}
