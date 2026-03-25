import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { BASEURL } from '../backend_url';
import { toJST } from '../utils';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ユーザー一覧 - Practice Judge" },
  ];
}

export async function clientLoader ({ request }) {
    const fp = await fetch(new URL("/api/users", BASEURL).href, {
        credentials: "include",
    });
    return await fp.json();
}

export default function AllUsers ({ loaderData }) {
    const users = loaderData;

    return (
    <>
        <main className="container">
            <nav aria-label="breadcrumb">
                <ul>
                    <li><Link to="/control-panel">コントロールパネル</Link></li>
                    <li>ユーザー一覧</li>
                </ul>
            </nav>

            <hr />

            <h1>ユーザー一覧</h1>

            <article>
                <table>
                    <thead>
                        <tr>
                            <th>ユーザーID</th>
                            <th>ユーザー名</th>
                            <th>ロール</th>
                            <th>登録日時</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => {
                            return (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>
                                    <Link to={`/users/${user.username}`}>{user.username}</Link>
                                    {user.is_active == 0 && <>（アカウント停止中）</>}
                                </td>
                                <td>{user.role}</td>
                                <td>{toJST(user.created_at)}</td>
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
