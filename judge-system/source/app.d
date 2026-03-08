import std;
import core.thread;
import core.time;
import d2sqlite3;

// 自前モジュール
import db_operations;
import constants;
import types;

void main() {
    // スレッドプールの準備
    defaultPoolThreads(10);

    while (true) {
        stderr.writeln("polling...");

        // db監視 -> 新規ジャッジタスクをput
        createCompileTasks();
        Thread.sleep(pollingInterval);
    }
}

/* taskの作成 */
void createCompileTasks () {
    Database db;
    initDbConnection(db);

    // statusがpendingなsubmissionを取ってきてキューに詰める
    Submission[] subs;
    runSQLStatement(() {
        auto resultrange = db.execute(format("SELECT * FROM submissions WHERE status = '%s' ORDER BY created_at ASC;", JudgeProcessState.pending));
        foreach (sub; resultrange) {
            subs ~= Submission();
            subs[$ - 1].problemId = sub["problem_id"].as!(long);
            subs[$ - 1].submissionId = sub["id"].as!(long);
            subs[$ - 1].code = sub["code"].as!(string);
            subs[$ - 1].language = strToLanguage(sub["code_language"].as!(string));
        }
    });

    foreach (sub; subs) {
        // タスクを作成 -> statusをinqueueに変更
        auto t = new CompileTask();

        // 1. タスク実行用のディレクトリ名を生成しておく（mkdirは起動時）
        t.workDir = buildPath(tempDir(), "judge-process", sub.submissionId.to!(string));

        // 2. 必要な値を埋めていく
        auto problem = Problem();
        runSQLStatement(() {
            auto cursor = db.execute(format("SELECT * FROM problems where id = %s", sub.problemId)).front();
            problem.problemId = cursor["id"].as!(long);
            problem.judgeCode = cursor["judge_code"].as!(string);
            problem.judgeCodeLanguage = strToLanguage(cursor["judge_code_language"].as!(string));
            problem.timeLimitSec = cursor["time_limit_sec"].as!(double);
            problem.memoryLimitKb = cursor["memory_limit_kb"].as!(int);
        });

        t.problem = problem;
        t.submission = sub;

        // ステータスをinqueueに変更
        runSQLStatement(() {
            db.execute(format("UPDATE submissions SET status = '%s' WHERE id = %s;", JudgeProcessState.inqueue, sub.submissionId));
        });

        // 3. タスクプールにenqueue
        taskPool.put(task(&startCompileTask, t));
    }
}

/* taskの実行開始 */
void startCompileTask (CompileTask t) {
    stderr.writeln("starting task. workdir = ", t.workDir);
    // ディレクトリの作成
    mkdirRecurse(t.workDir);

    Database db;
    initDbConnection(db);

    // ユーザーコードのコンパイル
    // ステータスをcompilingに変更
    runSQLStatement(() {
        db.execute(format("UPDATE submissions SET status = '%s' WHERE id = %s;", JudgeProcessState.compiling, t.submission.submissionId));
    });
    {
        auto lang = t.submission.language;
        auto container = Container();
        container.setMemoryLimitKb(compileMemoryLimitKb);
        container.createNew(compileUsercodeCommand[lang]);
        scope(exit) {
            container.rm();
        }

        // ファイル生成
        std.file.write(buildPath(t.workDir, usercodeFileName[lang]), t.submission.code);

        // コピー
        foreach (copies; preUsercodeCompileCopy[lang]) {
            container.copyFileToContainer(
                buildPath(t.workDir, copies[0]),
                buildPath(containerBaseDir, copies[1]),
            );
        }

        auto stdinFile = File("/dev/null", "r");
        auto stdoutFile = File(buildPath(t.workDir, "out"), "w");
        auto stderrFile = File(buildPath(t.workDir, "err"), "w");
        scope(exit) {
            remove(stdoutFile.name);
            remove(stderrFile.name);
        }

        auto result = container.run(stdinFile, stdoutFile, stderrFile, compileTimeLimit);
        stdoutFile.close();
        stderrFile.close();

        if (container.isOOMKilled()) {
            setSubmissionCE(t.submission.submissionId, "コンパイル時使用メモリ制限超過");
            t.cleanUp();
            return;
        }
        if (result.TLE) {
            setSubmissionCE(t.submission.submissionId, "コンパイル時制限時間超過");
            t.cleanUp();
            return;
        }
        if (result.status != 0) {
            auto msg = readText(stderrFile.name);
            setSubmissionCE(t.submission.submissionId, msg);
            t.cleanUp();
            return;
        }

        foreach (copies; afterUsercodeCompileCopy[lang]) {
            container.copyFileFromContainer(
                buildPath(t.workDir, copies[1]),
                buildPath(containerBaseDir, copies[0]),
            );
        }
    }

    // ジャッジコードのコンパイル
    {
        auto lang = t.problem.judgeCodeLanguage;
        auto container = Container();
        container.setMemoryLimitKb(compileMemoryLimitKb);
        container.createNew(compileJudgecodeCommand[lang]);
        scope(exit) {
            container.rm();
        }

        // ファイル生成
        std.file.write(buildPath(t.workDir, judgecodeFileName[lang]), t.problem.judgeCode);

        // ファイルコピー
        foreach (copies; preJudgecodeCompileCopy[lang]) {
            container.copyFileToContainer(
                buildPath(t.workDir, copies[0]),
                buildPath(containerBaseDir, copies[1]),
            );
        }
        auto stdinFile = File("/dev/null", "r");
        auto stdoutFile = File(buildPath(t.workDir, "out"), "w");
        auto stderrFile = File(buildPath(t.workDir, "err"), "w");
        scope(exit) {
            remove(stdoutFile.name);
            remove(stderrFile.name);
        }

        auto result = container.run(stdinFile, stdoutFile, stderrFile, compileTimeLimit);
        if (container.isOOMKilled() || result.TLE || result.status != 0) {
            setSubmissionIE(t.submission.submissionId, format("ジャッジコードのコンパイル失敗\n===\n%s", readText(stderrFile.name)));
            t.cleanUp();
            return;
        }

        foreach (copies; afterJudgecodeCompileCopy[lang]) {
            container.copyFileFromContainer(
                buildPath(t.workDir, copies[1]),
                buildPath(containerBaseDir, copies[0]),
            );
        }
    }

    stderr.writeln("compile task ok.");

    // 次のタスクの作成、put
    auto judgeTask = new JudgeTask();
    judgeTask.submission = t.submission;
    judgeTask.problem = t.problem;
    judgeTask.workDir = t.workDir;
    ResultRange tests;
    runSQLStatement(() {
        tests = db.execute(format("SELECT * FROM testcases WHERE problem_id = %s ORDER BY testcase_name ASC;", t.problem.problemId));
    });
    foreach (test; tests) {
        auto testcase = Testcase();
        testcase.testcaseId = test["id"].as!(int);
        testcase.testcaseName = test["testcase_name"].as!(string);
        testcase.inputSubmission = test["input_submission"].as!(string);
        testcase.inputJudge = test["input_judge"].as!(string);
        judgeTask.testcases ~= testcase;
    }

    taskPool.put(task(&startJudgeTask, judgeTask));
}

void startJudgeTask (JudgeTask t) {
    stderr.writeln("judge task start.");
    // 各テストケースについて直列に実行

    // ステータスをexecutingに変更
    Database db;
    initDbConnection(db);
    runSQLStatement(() {
        db.execute(format("UPDATE submissions SET status = '%s' WHERE id = %s;", JudgeProcessState.executing, t.submission.submissionId));
    });


    bool isIE = false;
    bool isRE = false;
    bool isTLE = false;
    bool isMLE = false;
    bool isOLE = false;
    bool isWA = false;

    double maxTimeSec = 0;
    int maxMemoryKb = 0;
    string IEmsg = "";

    // 全てのテストケースのresultを先にinsertしておく
    auto resultIds = insertResults(t.submission.submissionId, t.testcases);

    foreach (i, ref testcase; t.testcases.enumerate(0)) {
        double timeSec = 0;
        int memoryKb = 0;
        {
            // コンテナの作成
            auto container = Container();
            container.setMemoryLimitKb(t.problem.memoryLimitKb);
            auto lang = t.submission.language;
            container.createNew(executeCommand[lang]);
            scope(exit) {
                container.rm();
            }

            // ファイル生成
            std.file.write(buildPath(t.workDir, userInputFile), testcase.inputSubmission);

            // コピー
            foreach (copies; preExecuteCopy[lang]) {
                container.copyFileToContainer(
                    buildPath(t.workDir, copies[0]),
                    buildPath(containerBaseDir, copies[1]),
                );
            }

             auto stdinFile = File(buildPath(t.workDir, userInputFile), "r");
             auto stdoutFile = File(buildPath(t.workDir, usersStdoutFile), "w");
             auto stderrFile = File(buildPath(t.workDir, "err"), "w");

            scope(exit) {
                remove(stderrFile.name);
            }

            auto ret = container.run(stdinFile, stdoutFile, stderrFile, doubleToDuration(t.problem.timeLimitSec) + 500.msecs);

            // 強制終了された場合
            if (container.isOOMKilled()) {
                setResultMLE(resultIds[i]);
                isMLE = true;
                continue;
            }
            if (ret.TLE || doubleToDuration(t.problem.timeLimitSec) < ret.elapsedTime) {
                setResultTLE(resultIds[i]);
                isTLE = true;
                continue;
            }

            // OLE
            stdoutFile.open(stdoutFile.name, "r");
            if (maxStdoutSize < stdoutFile.size()) {
                setResultOLE(resultIds[i]);
                isOLE = true;
                continue;
            }
            stdoutFile.close();

            // RE
            if (ret.status != 0) {
                setResultRE(resultIds[i]);
                isRE = true;
                continue;
            }

            timeSec = durationToDouble(ret.elapsedTime);
            memoryKb = ret.maxMemoryKb;

            maxMemoryKb = max(maxMemoryKb, memoryKb);
            maxTimeSec = max(maxTimeSec, timeSec);
        }

        // ジャッジ
        {
            auto container = Container();
            container.setMemoryLimitKb(judgeMemoryLimitKb);
            auto lang = t.problem.judgeCodeLanguage;
            container.createNew(judgeCommand[lang]);
            scope(exit) {
                container.rm();
            }

            // ファイル生成
            std.file.write(buildPath(t.workDir, judgeInputFile), testcase.inputJudge);

            // コピー
            foreach (copies; preJudgeCopy[lang]) {
                container.copyFileToContainer(
                    buildPath(t.workDir, copies[0]),
                    buildPath(containerBaseDir, copies[1]),
                );
            }

            auto stdinFile = File("/dev/null", "r");
            auto stdoutFile = File(buildPath(t.workDir, "out"), "w");
            auto stderrFile = File(buildPath(t.workDir, "err"), "w");

            auto ret = container.run(stdinFile, stdoutFile, stderrFile, judgeTimeLimit);

            // ジャッジ失敗
            if (container.isOOMKilled() || ret.TLE || ret.status != 0) {
                setResultIE(resultIds[i]);
                isIE = true;

                if (container.isOOMKilled()) {
                    IEmsg ~= format("==========\ncase %s: OOMKilled.\nstderr: %s\n", testcase.testcaseName, readText(stderrFile.name));
                }
                else if (ret.TLE) {
                    IEmsg ~= format("==========\ncase %s: TLE.\nstderr: %s\n", testcase.testcaseName, readText(stderrFile.name));
                }
                else if (ret.status != 0) {
                    IEmsg ~= format("==========\ncase %s: RE.\nstderr: %s\n", testcase.testcaseName, readText(stderrFile.name));
                }
                continue;
            }

            bool isAC = false;
            try {
                isAC = readText(stdoutFile.name).split("\n")[0].strip == "AC";
            }
            catch (Exception e) {
                setResultIE(resultIds[i]);
                isIE = true;
                IEmsg ~= format("==========\ncase %s: Result not found.\n", testcase.testcaseName);
            }

            if (isAC) {
                setResultAC(resultIds[i], timeSec, memoryKb);
            }
            else {
                isWA = true;
                setResultWA(resultIds[i], timeSec, memoryKb);
            }
        }
    }

    // 全テストケース終了したのでsubmissionを書き換えて終了
    // 各テストケースについて、優先度はIE -> RE -> TLE -> MLE -> OLE -> WA -> AC

    () {
        if (isIE) {
            setSubmissionIE(t.submission.submissionId, format("ジャッジプログラムに問題があります。\nmsg: %s", IEmsg));
            return;
        }
        if (isRE) {
            setSubmissionRE(t.submission.submissionId);
            return;
        }
        if (isTLE) {
            setSubmissionTLE(t.submission.submissionId);
            return;
        }
        if (isMLE) {
            setSubmissionMLE(t.submission.submissionId);
            return;
        }
        if (isOLE) {
            setSubmissionOLE(t.submission.submissionId);
            return;
        }
        if (isWA) {
            setSubmissionWA(t.submission.submissionId, maxTimeSec, maxMemoryKb);
            return;
        }

        setSubmissionAC(t.submission.submissionId, maxTimeSec, maxMemoryKb);
    }();

    stderr.writeln("judge task ok.");
    t.cleanUp();
}

Duration doubleToDuration (double x) {
    return (cast(long)(1000 * x)).msecs;
}
double durationToDouble (Duration x) {
    return cast(double)(x.total!("msecs")) / 1000;
}
