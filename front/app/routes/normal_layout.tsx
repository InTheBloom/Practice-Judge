import { Link, Outlet, useNavigate } from 'react-router';
import { useState, useRef } from 'react';
import { BASEURL } from '../backend_url';

import { useColorMode } from '../contexts';

export async function clientLoader () {
    const res = await fetch(new URL('/api/auth/me', BASEURL).href, {
        credentials: "include",
    });
    return await res.json();
}

export default function Outer ({ loaderData }) {
    const loginInfo = loaderData;

    return (
    <>
        <header className="top-header container-fluid" >
            <nav>
                <TitleMenu loginInfo={loginInfo} />
            </nav>
            <nav>
                <Menu />
            </nav>
        </header>

        <div className="maincontents">
            <Outlet context={{ loginInfo }} />
        </div>
    </>
    );
}

function TitleMenu ({ loginInfo }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const userDropdownRef = useRef(null);

    const colorModeObj = useColorMode();

    async function handleLogout () {
        if (!window.confirm("ログアウトしますか？")) {
            return;
        }
        const res = await fetch(new URL('/api/auth/logout', BASEURL).href, {
            method: 'POST',
            credentials: 'include'
        });
        if (res.ok) {
            navigate('/');
        }
    }


    const title = <Link to="/" style={{ fontSize: "2em", textDecoration: "none" }}>Practice Judge</Link>;

    const toggle = () => {
        if (colorModeObj == null) {
            return;
        }
        const cur = colorModeObj.colorMode;
        const nex = cur == "light" ? "dark" : "light";
        colorModeObj.setColorMode(nex);
    };
    const themeSwitchLabel = colorModeObj?.colorMode === "light" ? "🌙ダークモードに変える" : "☀️ライトモードに変える";
    const themeSwitch =
        <button
            className="contrast"
            onClick={toggle}
        >
            {themeSwitchLabel}
        </button>;

    let RightMenu = (() => {
        if (!loginInfo.login) {
            return (
                <ul>
                    <li>{themeSwitch}</li>
                    <li><Link to="/login">ログイン</Link></li>
                    <li><Link to="/signup">登録</Link></li>
                </ul>
            );
        }
        return (
            <ul>
                <li>{themeSwitch}</li>
                {loginInfo.role != "user" && <li><Link to="/control-panel">管理</Link></li>}
                <li>
                    <details className="dropdown" style={{ "display": "inline-block" }} ref={userDropdownRef}>
                        <summary role="button" className="secondary">{loginInfo.username}</summary>
                        <ul>
                            <li>
                                <Link
                                    to={`/users/${loginInfo.username}`}
                                    onClick={() => {
                                        if (userDropdownRef.current?.open) {
                                            userDropdownRef.current.open = false;
                                        }
                                    }}
                                >
                                    プロフィール
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to={"/settings"}
                                    onClick={() => {
                                        if (userDropdownRef.current?.open) {
                                            userDropdownRef.current.open = false;
                                        }
                                    }}
                                >
                                    設定
                                </Link>
                            </li>
                            <li
                                role="button"
                                onClick={handleLogout}
                                disabled={loading}
                                aria-busy={loading ? "true" : "false"}
                            >
                                ログアウト
                            </li>
                        </ul>
                    </details>
                </li>
            </ul>
        );
    })();

    return (
        <>
            {title}
            {RightMenu}
        </>
    );
}

function Menu () {
    return (
    <>
        <ul>
            <li><Link to={"/problemsets"}>問題セット一覧</Link></li>
            <li><Link to={"/problems"}>問題一覧</Link></li>
            <li><Link to={"/submissions"}>提出一覧</Link></li>
            <li><Link to={"/ranking"}>ランキング</Link></li>
        </ul>
    </>
    );
}
