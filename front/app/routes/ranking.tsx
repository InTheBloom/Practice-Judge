import { useState } from "react";
import { Link } from "react-router";
import { BASEURL } from '../backend_url';

export function meta({}: Route.MetaArgs) {
    return [
        { title: "ユーザーランキング - Practice Judge" },
    ];
}

export async function clientLoader() {
    // APIからランキングデータを取得する想定のエンドポイント
    const res = await fetch(new URL("/api/ranking", BASEURL).href, {
        credentials: "include",
    });
    
    if (!res.ok) {
        throw new Error("ランキングデータの取得に失敗しました");
    }
    
    const users = await res.json();
    return { users };
}

export default function UsersRanking({ loaderData }) {
    const { users } = loaderData;
    // users: [{ user_id, username, role, stars, solved }, ...]

    const [order, setOrder] = useState(0); // 0: 解決数順, 1: スター数順
    const [hideAdmin, setHideAdmin] = useState(true);

    // ソート用関数
    const sortFunctions = [
        // 0: 解決数順（同数の場合はスター数 > ID順）
        (a, b) => {
            if (b.solved !== a.solved) return b.solved - a.solved;
            if (b.stars !== a.stars) return b.stars - a.stars;
            return a.user_id - b.user_id;
        },
        // 1: スター数順（同数の場合は解決数 > ID順）
        (a, b) => {
            if (b.stars !== a.stars) return b.stars - a.stars;
            if (b.solved !== a.solved) return b.solved - a.solved;
            return a.user_id - b.user_id;
        },
    ];

    // フィルタリングとソートを適用
    const displayUsers = users
        .filter(u => !hideAdmin || (u.role !== "admin" && u.role !== "inthebloom"))
        .sort(sortFunctions[order]);

    return (
        <main className="container">
            <h1>ユーザーランキング（直近1週間）</h1>

            <hr />

            <div style={{ display: "flex", columnGap: "1.5em", marginBottom: "1em", alignItems: "center" }}>
                <div>
                    <OrderRadioButton state={order} setter={setOrder} />
                </div>
                <div>
                    <ToggleSwitch state={hideAdmin} setter={setHideAdmin}>
                        管理者(Admin)を非表示
                    </ToggleSwitch>
                </div>
            </div>

            <article className="overflow-auto">
                <table style={{ whiteSpace: "nowrap" }}>
                    <thead>
                        <tr>
                            <th>順位</th>
                            <th>ユーザー名</th>
                            <th>解決問題数</th>
                            <th>難易度スター獲得数</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayUsers.map((user, index) => {
                            const rank = index + 1;
                            let rankDisplay = rank + "位";
                            if (rank === 1) rankDisplay = "🥇 1位";
                            if (rank === 2) rankDisplay = "🥈 2位";
                            if (rank === 3) rankDisplay = "🥉 3位";

                            return (
                                <tr key={user.user_id}>
                                    <td><strong>{rankDisplay}</strong></td>
                                    <td>
                                        <Link to={`/users/${user.username}`}>
                                            {user.username}
                                        </Link>
                                    </td>
                                    <td>{user.solved} 問</td>
                                    <td>{user.stars} ⭐</td>
                                </tr>
                            );
                        })}
                        {displayUsers.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: "center" }}>
                                    直近1週間でACを獲得したユーザーがいません。
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </article>
        </main>
    );
}

// ------------------------------------
// UI部品
// ------------------------------------

function ToggleSwitch({ children, state, setter }) {
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

function OrderRadioButton({ state, setter }) {
    const handleChange = (e) => {
        setter(Number(e.target.value));
    };
    return (
        <fieldset style={{ margin: 0, padding: 0, border: "none", display: "flex", gap: "1em" }}>
            <label>
                <input 
                    type="radio" 
                    name="ranking_order" 
                    value="0" 
                    onChange={handleChange} 
                    checked={state === 0} 
                /> 解決数順
            </label>

            <label>
                <input 
                    type="radio" 
                    name="ranking_order" 
                    value="1" 
                    onChange={handleChange} 
                    checked={state === 1} 
                /> スター数順
            </label>
        </fieldset>
    );
}
