-- 開発初期用dbリセット用データ

-- ユーザデータ
INSERT INTO users (
    username,
    password_hash
) VALUES (
    'inthebloom',
    '$2b$10$18Ondkkv4UJh75LlkBKVeOMLpizN3bcwIxU0LfCn2WVVgjD5ODg5m'
);

-- 問題データ
INSERT INTO problems (
    title,
    statement,
    time_limit_sec,
    memory_limit_kb,
    judge_code,
    judge_code_language
) VALUES (
    'A + B Problem',
    '2つの整数 A, B が与えられる。A + B を出力せよ。',
    2.0,
    256000,
    'import std;
void main () {
    auto ans = readText("in_judge").chomp.to!int;
    bool wa = false;
    try {
        auto user = readText("in_user").chomp.to!int;
        if (user != ans) {
            wa = true;
        }
    }
    catch (Exception e) {
        throw new Exception(readText("in_user"));
        wa = true;
    }

    writeln(wa ? "WA" : "AC");
}',
    'D'
);

-- 提出データ
INSERT INTO submissions (
    problem_id,
    user_id,
    code,
    code_language,
    status
) VALUES (
    1,
    1,
    'a, b = list(map(int, input().split()))
print(a + b)',
    'Python3',
    'pending'
);

INSERT INTO submissions (
    problem_id,
    user_id,
    code,
    code_language,
    status
) VALUES (
    1,
    1,
    '#include <stdio.h>
int main (void) { int a, b; scanf("%d%d", &a, &b); printf("%d\n", a + b); return 0; }',
    'C',
    'pending'
);

INSERT INTO submissions (
    problem_id,
    user_id,
    code,
    code_language,
    status
) VALUES (
    1,
    1,
    'import std;
import core.thread;
void main () {
    auto A = readln.split.to!(int[]);
    const int data = 5000; auto X = new int[][](data, data); foreach (i; 0 .. data) { foreach (j; 0 .. data) { X[i][j] = uniform(0, 100); } } int count = 0; foreach (i; 0 .. data) { foreach (j; 0 .. data) { if (X[i][j] == 50) { count++; } } } stderr.writeln(count); writeln(A[0] + A[1]); }',
    'D',
    'pending'
);

INSERT INTO submissions (
    problem_id,
    user_id,
    code,
    code_language,
    status
) VALUES (
    1,
    1,
    '#include <iostream>
    int main () { int a, b; std::cin >> a >> b; std::cout << a + b << std::endl; }',
    'C++',
    'pending'
);

INSERT INTO submissions (
    problem_id,
    user_id,
    code,
    code_language,
    status
) VALUES (
    1,
    1,
    'const input = await Deno.readTextFile("/dev/stdin"); const A = input.split("\n")[0].split(" ").map(x => parseInt(x)); console.log(A[0] + A[1]);',
    'Typescript',
    'pending'
);

INSERT INTO testcases (
    testcase_name,
    problem_id,
    input_submission,
    input_judge
) VALUES (
    '1 + 1',
    1,
    '1 1',
    '2'
);

INSERT INTO testcases (
    testcase_name,
    problem_id,
    input_submission,
    input_judge
) VALUES (
    '10 + 5',
    1,
    '10 5',
    '15'
);

INSERT INTO testcases (
    testcase_name,
    problem_id,
    input_submission,
    input_judge
) VALUES (
    '0 + 3',
    1,
    '0 3',
    '3'
);

INSERT INTO testcases (
    testcase_name,
    problem_id,
    input_submission,
    input_judge
) VALUES (
    '100 + 104',
    1,
    '100 104',
    '204'
);

INSERT INTO testcases (
    testcase_name,
    problem_id,
    input_submission,
    input_judge
) VALUES (
    '999 + 1',
    1,
    '999 1',
    '1000'
);
