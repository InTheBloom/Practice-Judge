import { Link } from 'react-router';
import { BASEURL } from '../backend_url';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "はじめての方へ - Practice Judge" },
  ];
}

export default function ForBeginners() {
    return (
        <main className="container">
            <h1>Practice Judgeについて知る</h1>

            <section className="section-home">
                <h2 id="Practice Judgeとは？">Practice Judgeとは？</h2>
                <p>
                    Practice Judgeはプログラミング基礎能力の向上を目的としたオンラインジャッジです。
                    オンラインジャッジとは、ユーザーの作成したプログラムを実行し、事前に用意されたテストをクリアするかを自動で判定するサービスのことを指します。
                </p>

                <p>
                    Practice Judgeの内部システムはユーザーの作成したプログラムを実行し、プロセス（※1）の<strong>標準入力</strong>（※2）からテストデータを入力します。
                    その後プロセスの<strong>標準出力</strong>（※3）から出力を読み取り、期待される出力かどうかを判定します。
                </p>

                <p>
                    この仕組みによりユーザーはプログラムの正しさを自動で検証することができ、正しい処理の記述に集中することができます。
                    また、誤りを含むプログラムはテストデータにより検出された場合不正解と判定されるため、このシステムによる正解判定は実績と自信に繋がります。
                </p>

                <small>
                    ※1. 実行中のプログラムのこと<br />
                    ※2. <code>input()</code>等で利用できる入力先<br />
                    ※3. <code>print()</code>等で利用できる出力先<br />
                </small>
            </section>

            <section className="section-home">
                <h2 id="利用方法">利用方法</h2>
                <p>
                    ページヘッダーの「問題」や「問題一覧」から各問題へと挑戦することができます。
                </p>
                <p>
                    問題を解くプログラムを作成したら、使用言語を選択し、提出フォームから提出してください。（プログラムの提出にはログインが必要です。）
                    各問題ページから自分の提出、すべての提出、解説が閲覧できます。
                </p>

                <p>
                    提出されたプログラムは自動的に正誤判定されます。
                    正誤判定結果は以下の表のいずれかになります。
                    特に、正解と判定された場合は<span className="pico-color-green-200">AC</span>となります。
                </p>

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
                                <td>ジャッジの応答を待っています。</td>
                            </tr>
                            <tr>
                                <td><span>compiling</span></td>
                                <td>プログラムのコンパイル中です。コンパイルが必要ない言語の場合、構文が正しいかのチェック中です。</td>
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
                                <td>Wrong Answerを意味します。ユーザーのプログラムによる出力が期待される出力ではありません。</td>
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
                <h2 id="FAQ・注意事項">FAQ・注意事項</h2>

                <h3>FAQ</h3>
                <dl>
                    <dt>Q. 提出したコードは公開されますか？</dt>
                    <dd>
                        A. 公開されます。このオンラインジャッジが教育目的であり、ユーザー間で解法を共有できることに価値があると考えているからです。
                        そのため、他のユーザーに閲覧されてはいけない、閲覧されたくないソースコードを提出しないでください。
                    </dd>

                    <dt>Q. 提出したコードを消去したい</dt>
                    <dd>
                        A. 開発者による直接の対応が必要です。ホームページに記載の開発者連絡先まで連絡をお願いします。
                    </dd>

                    <dt>Q. アカウントを消去したい</dt>
                    <dd>
                        A. アカウントの停止を行うことができます。停止されたアカウントの提出は閲覧できなくなり、今後同じユーザー名を使用できなくなります。この場合も現時点では開発者による直接の対応が必要です。同様に連絡先まで連絡をお願いします。
                    </dd>

                    <dt>Q. 対応している言語は何ですか？</dt>
                    <dd>
                        A. 現在はPython3（Python 3.12.3）、Javascript（Node.js v24.13.0）、Typescript（Deno v2.5.4）、D（dmd-2.111.0）、C、C++（gcc 13.3.0）に対応しています。なお、標準ライブラリ以外は利用できません。
                    </dd>
                </dl>

                <h3>注意事項</h3>
                <ul>
                    <li>実行結果や判定時間は、サーバの状態により遅延することがあります。</li>
                    <li>故意にサーバーに負荷をかける行為、サーバーに対する攻撃は禁止します。</li>
                    <li>プログラムの提出をはじめとした一部機能を利用するにはアカウント作成が必要です。</li>
                </ul>
            </section>
        </main>
    );
}
