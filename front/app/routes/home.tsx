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
                <h2>問題と問題セット</h2>

                <p>
                    Practice Judgeでは「問題」と「問題セット」があります。
                    問題セットは簡単に言うと問題へのリンク集です。
                    難易度やジャンルが似た問題を解くのに便利です。
                    はじめての場合は問題セット「Practice Judgeへようこそ」に収録されている問題に取り組むのがよいでしょう。
                </p>
                <p>
                    また、1つの問題が複数の問題セットに含まれることや、どの問題セットにも含まれない問題もありえます。
                </p>
            </section>
            <section className="section-home">
                <h2>基本的な使い方</h2>
                <p>問題を解くプログラムを作成し、問題ページから提出すると自動的に採点されます。採点結果は以下のいずれかになります。</p>

                <article>
                    <table role="grid">
                        <thead>
                            <tr>
                                <th scope="col">ステータス</th>
                                <th scope="col">説明</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><span>pending</span></td>
                                <td>ジャッジサーバーの応答を待っています。</td>
                            </tr>
                            <tr>
                                <td><span>compiling</span></td>
                                <td>プログラムのコンパイル中です。コンパイルが必要ない言語の場合でもこのステータスが表示される場合があります。</td>
                            </tr>
                            <tr>
                                <td><span>executing</span></td>
                                <td>プログラムを実行中です。</td>
                            </tr>
                            <tr>
                                <td><span className="pico-color-green-200">AC</span></td>
                                <td>Acceptedを意味します。すべてのテストケースを通過し、正解と判定されています。</td>
                            </tr>
                            <tr>
                                <td><span className="pico-color-pumpkin-200">WA</span>
                                </td>
                                <td>Wrong Answerを意味します。出力結果が期待される答えと一致していません。</td>
                            </tr>
                            <tr>
                                <td><span className="pico-color-pumpkin-200">TLE</span></td>
                                <td>Time Limit Exceededを意味します。プログラムの実行時間制限を超過しています。</td>
                            </tr>
                            <tr>
                                <td><span className="pico-color-pumpkin-200">RE</span></td>
                                <td>Runtime Errorを意味します。実行中にプログラムが異常終了しています。</td>
                            </tr>
                            <tr>
                                <td><span className="pico-color-pumpkin-200">CE</span></td>
                                <td>Compile Errorを意味します。コンパイルに失敗しています。</td>
                            </tr>
                            <tr>
                                <td><span className="pico-color-pumpkin-200">MLE</span></td>
                                <td>Memory Limit Exceededを意味します。プログラムのメモリ使用量が制限を超えています。</td>
                            </tr>
                            <tr>
                                <td><span className="pico-color-pumpkin-200">OLE</span></td>
                                <td>Output Limit Exceededを意味します。プログラムの出力量が制限を超えています。</td>
                            </tr>

                            <tr>
                                <td><span className="pico-color-red-400">IE</span></td>
                                <td>Internal Errorを意味します。ジャッジシステム内部でエラーが発生しています。ユーザーのコードが原因ではありません。</td>
                            </tr>
                        </tbody>
                    </table>
                </article>
            </section>

            <section className="section-home">
                <h2>注意事項</h2>
                <ul>
                    <li>実行結果や判定時間は、サーバの状態により遅延することがあります。</li>
                    <li>故意にサーバーに負荷をかける行為、サーバーに対する攻撃は禁止します。</li>
                    <li>プログラムの提出をはじめとした一部機能を利用するにはアカウント作成が必要です。</li>
                </ul>
            </section>

            <section className="section-home">
                <h2>FAQ</h2>
                <dl>
                    <dt>Q. 提出したコードは公開されますか？</dt>
                    <dd>A. 公開されます。このオンラインジャッジが教育目的であり、ユーザー間で解法を共有できることに価値があると考えているからです。そのため、他のユーザーに閲覧されてはいけない、閲覧されたくないソースコードを提出しないでください。</dd>

                    <dt>Q. 対応している言語は何ですか？</dt>
                    <dd>A. 現在はPython3（Python 3.12.3）、Javascript（Node.js v24.13.0）、Typescript（Deno v2.5.4）、D（dmd-2.111.0）、C、C++（gcc 13.3.0）に対応しています。なお、標準ライブラリ以外は利用できません。</dd>
                </dl>
            </section>

            <section className="section-home">
                <h2>連絡先</h2>
                <address>
                    メール: <a href="mailto:nato.rider.smm2@gmail.com">nato.rider.smm2@gmail.com</a><br />
                    GitHub: <a href="https://github.com/InTheBloom">InTheBloom</a><br />
                    Twitter: <a href="https://x.com/UU9782wsEdANDhp">@UU9782wsEdANDhp</a>
                </address>
            </section>
        </main>
    );
}
