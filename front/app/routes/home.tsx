import { Link } from 'react-router';
import { BASEURL } from '../backend_url';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ホーム - Practice Judge" },
  ];
}

export default function Home() {
    return (
        <main className="container">
            <section className="section-home">
                <h1>Practice Judgeにようこそ</h1>
                <p>
                    Practice Judgeは、プログラミングの実践的な練習問題を解くことができるオンラインジャッジです。
                    ユーザーが作成、提出したプログラムをPractice Judgeのサーバーが実行し、正誤判定を行います。
                </p>
            </section>

            <section className="section-home">
                <h2>Practice Judgeについて知る</h2>
                <ul>
                    <li><a href="/for-beginners#Practice Judgeとは？">Practice Judgeとは？</a></li>
                    <li><a href="/for-beginners#利用方法">利用方法</a></li>
                    <li><a href="/for-beginners#FAQ・注意事項">FAQ・注意事項</a></li>
                </ul>
            </section>

            <section className="section-home">
                <h2>開発者連絡先</h2>
                <address>
                    メール: <a href="mailto:nato.rider.smm2@gmail.com">nato.rider.smm2@gmail.com</a><br />
                    GitHub: <a href="https://github.com/InTheBloom">InTheBloom</a><br />
                    Twitter: <a href="https://x.com/UU9782wsEdANDhp">@UU9782wsEdANDhp</a>
                </address>
            </section>
        </main>
    );
}
