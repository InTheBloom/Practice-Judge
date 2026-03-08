import { Link } from 'react-router';

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: "管理画面 - Practice Judge" },
  ];
}

export default function ControlPanel () {
    return (
        <>
            <main className="container">
                <nav aria-label="breadcrumb">
                    <ul>
                        <li>コントロールパネル</li>
                    </ul>
                </nav>

                <hr />

                <h2>コントロールパネル（管理者用）</h2>
                <p><Link to="/control-panel/problems">問題管理</Link></p>
                <p><Link to="/control-panel/problemsets">問題セット管理</Link></p>
                <p><Link to="/control-panel/users">ユーザ管理</Link></p>
            </main>
        </>
    );
}
