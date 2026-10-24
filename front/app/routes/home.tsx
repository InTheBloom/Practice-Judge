export function meta({}: Route.MetaArgs) {
  return [
    { title: "Halloween Night - Practice Judge" },
  ];
}

export default function Home() {
    return (
        <main className="container halloween-home">
            <section className="halloween-hero">
                <div className="halloween-hero-copy">
                    <p className="halloween-eyebrow">OCTOBER 2026</p>
                    <h1>
                        HAPPY
                        <strong>HALLOWEEN!</strong>
                    </h1>
                </div>

                <div className="haunted-terminal" aria-label="ハロウィンテーマの装飾">
                    <div className="haunted-terminal-bar" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                        <small>midnight_judge.sh</small>
                    </div>
                    <div className="haunted-terminal-body">
                        <p><span className="terminal-prompt">$</span> echo "Happy Halloween"</p>
                        <p className="terminal-muted">The night is full of bugs...</p>
                        <p>pumpkin.cpp <span className="terminal-ok">🎃</span></p>
                        <p>ghost.rs <span className="terminal-ok">👻</span></p>
                        <p>candy.py <span className="terminal-ok">🍬</span></p>
                        <div className="terminal-verdict">
                            <span>OCTOBER 31</span>
                            <strong>BOO!</strong>
                        </div>
                    </div>
                    <span className="terminal-spider" aria-hidden="true">🕷️</span>
                </div>
            </section>

            <section className="section-home">
                <h2>Practice Judgeにようこそ</h2>
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
                    GitHub: <a href="https://github.com/InTheBloom" target="_blank" rel="noopener noreferrer">InTheBloom</a><br />
                    Twitter: <a href="https://x.com/UU9782wsEdANDhp" target="_blank" rel="noopener noreferrer">@UU9782wsEdANDhp</a>
                </address>
            </section>
        </main>
    );
}
