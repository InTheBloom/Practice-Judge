// /api/problems/

const express = require('express');
const { db } = require('./db.js');
const { checkUserStatus, isAdmin, loginOnly, adminOnly } = require('./logincheck.js');

const problemsRouter = express.Router({ mergeParams: true });
module.exports = { problemsRouter };


// 問題idの配列 { submittedIds: [], solvedIds: [] }を返す。
// 未ログインなら空が保証される。
problemsRouter.get('/solved', (req, res) => {
    const userInfo = checkUserStatus(req.session);

    if (!userInfo.login) {
        return res.json({ submittedIds: [], solvedIds: [] });
    }

    const submittedIds = db.prepare(`
        SELECT DISTINCT p.id
        FROM problems p
        JOIN submissions s
        ON p.id = s.problem_id
        WHERE s.user_id = ? and p.is_published = 1
    `).all(userInfo.user_id);
    const solvedIds = db.prepare(`
        SELECT DISTINCT p.id
        FROM problems p
        JOIN submissions s
        ON p.id = s.problem_id
        WHERE s.user_id = ? and s.status = ? and p.is_published = 1
    `).all(userInfo.user_id, 'AC');
    return res.json({ submittedIds, solvedIds });
});

// [{ problem_id, challengers, solvers }]を返す
problemsRouter.get('/clearrate', (req, res) => {
    const ret = db.prepare(`
        SELECT problem_id, challengers, solvers
        FROM problem_stats
    `).all();

    res.json(ret);
});

problemsRouter.get('/', (req, res) => {
    let where = "WHERE 1 = 1";
    if (!isAdmin(req.session)) {
        where += " and is_published = 1";
    }
    const problemsQuery = db.prepare(`
        SELECT id, title, difficulty, is_published
        FROM problems
        ${where}
        ORDER BY id DESC
    `);
    const problems = problemsQuery.all();
    return res.json(problems);
});

problemsRouter.get('/all', adminOnly, (req, res) => {
    const problemsQuery = db.prepare(`
        SELECT id, title, difficulty, is_published
        FROM problems
        ORDER BY id DESC
    `);
    const problems = problemsQuery.all();
    return res.json(problems);
});

problemsRouter.put('/create', adminOnly, (req, res) => {
    const stmt = db.prepare(`
        INSERT INTO problems
        (title, statement, editorial, time_limit_sec, memory_limit_kb, is_published, judge_code, judge_code_language)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const data = stmt.run(
        "新規問題",
        `<!--
問題文サンプル
必ず問題文、制約、入力形式、出力形式、入出力例を含むようにしてください。
HTMLで記述してください。katexを使用することができます。
入出力例では<pre class="sample"><code></code></pre>とした上で、見出しには<h3>を用いてください（自動的にサンプルコピーボタンが付与されます。）
また、入出力例はテストケースに含まれるものを用いるとよいでしょう。
katexを適用したくない場合はclass="nokatex"が利用できます。
-->
<h3>問題文</h3>
<p>2つの整数 $A, B$ が与えられます。$A + B$を出力してください。</p>

<h3>制約</h3>
<ul>
    <li>$A, B \\leq 100$</li>
    <li>入力はすべて整数</li>
</ul>

<h3>入力形式</h3>
<pre><code>$A \\  B$</code></pre>

<h3>出力形式</h3>
<p>答えを1行で出力してください。</p>

<hr />

<h3>入力例1</h3>
<pre class="sample"><code>1 1</code></pre>
<h3>出力例1</h3>
<pre class="sample"><code>2</code></pre>`,
        `<!--
htmlで記載してください。
<code editor language=""></code>
を用いることでACE Editorが利用できます。
languageはシンタックスハイライトに利用されます。
有効な値はC, D, TypeScript, JavaScript, Python3, htmlのいずれかです。（今後対応言語が増えた際はここも増えます。）
未指定やこれら以外が指定された場合は言語指定がtextになります。

特にフォーマットの指定はありませんが、提出リンクを掲載する場合は
https://judge.inthebloom.org/[残りのパス]ではなく
/[残りのパス]
を利用したほうが良いと思います。
-->
<p>
    この問題は入出力を正しく行うための練習問題です。
</p>
<p>
    プログラムは基本的にデータを1行ずつ処理するのが得意です。
    例えば、Python3の<code>input()</code>は入力ストリームから1行データを読み取ります。
    <code>input()</code>を利用して、次のように処理するのが一般的です。
</p>
<ol>
    <li>受け取った1行のデータを空白文字で区切り、数字のみが含まれる文字列に分割する。</li>
    <li>それぞれの数字を<code>int()</code>を用いて数に変換する。</li>
</ol>
<p>
    手順1はほとんどの言語で用意されている<code>split()</code>のような関数を用いると簡単に実現可能です。
    Python3では以下のようになります。
</p>
<code editor language="Python3"># 入力の1行目を変数lineに代入
line = input()

# 空白文字で分割して、変数line_splittedに分割結果の入ったリストを代入
line_splitted = line.split()

# intへ変換
A = int(line_splitted[0])
B = int(line_splitted[1])

# 出力
print(A + B)</code>

<p><a href="/problems/no/1/submissions/70">実装例</a></p>`,
        2,
        2000000,
        0,
        `# ./in ./in_user ./in_judgeの3ファイルが利用可能です。
# ./in : 提出されたプログラムに入力されたデータ
# ./in_user : 提出されたプログラムから出力されたデータ
# ./in_judge : 各テストケースで定義したジャッジプログラムへの入力データ
# ACをstdoutに出力するとACと判定されます。そうでなく、かつプログラムが正常に終了するとWAと判定されます。
# TLE、MLE、例外、0以外の返却値で終了した場合などはIE（Internal Error）判定になります。注意してジャッジを作成してください。

print("AC")`,
        'Python3',
    );

    return res.json({ newProblemId: data.lastInsertRowid });
});
