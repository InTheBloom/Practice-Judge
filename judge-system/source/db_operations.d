module db_operations;

import std.format;
import std.path;
import std.stdio;
import std.range;
import core.thread;
import std.datetime;
import d2sqlite3;

import types;
import constants;

void initDbConnection (ref Database db) {
    const string dbFileName = buildPath("..", "data.db");
    db = Database(dbFileName);
    db.execute("PRAGMA busy_timeout = 5000;");
    db.execute("PRAGMA journal_mode = WAL;");
}

void runSQLStatement (void delegate() f) {
    // db lockが発生したら成功するまでリトライ
    while (true) {
        try {
            f();
            break;
        }
        catch (SqliteException e) {
            stderr.writeln("\n==== SQLエラー発生。リトライします。 ======\n", e, "\n==========");
            Thread.sleep(100.msecs);
        }
    }
}

void setSubmissionCE (long submissionId, string msg) {
    Database db;
    initDbConnection(db);

    // 長過ぎるメッセージは1000文字でカット
    if (1000 < msg.length) {
        msg = msg[0 .. 1000];
        msg ~= "\n...";
    }

    runSQLStatement(() {
        auto st = db.prepare("UPDATE submissions SET status = :stat, message = :msg WHERE id = :id;");
        st.bind(":stat", cast(string)(JudgeStatus.CE));
        st.bind(":msg", msg);
        st.bind(":id", submissionId);
        st.execute();
    });
}

void setSubmissionIE (long submissionId, string msg) {
    Database db;
    initDbConnection(db);

    // 長過ぎるメッセージは1000文字でカット
    if (1000 < msg.length) {
        msg = msg[0 .. 1000];
        msg ~= "\n...";
    }

    runSQLStatement(() {
        auto st = db.prepare("UPDATE submissions SET status = :stat, message = :msg WHERE id = :id;");
        st.bind(":stat", cast(string)(JudgeStatus.IE));
        st.bind(":msg", msg);
        st.bind(":id", submissionId);
        st.execute();
    });
}

void setSubmissionRE (long submissionId) {
    setSubmissionWithStat(submissionId, JudgeStatus.RE);
}
void setSubmissionTLE (long submissionId) {
    setSubmissionWithStat(submissionId, JudgeStatus.TLE);
}
void setSubmissionMLE (long submissionId) {
    setSubmissionWithStat(submissionId, JudgeStatus.MLE);
}
void setSubmissionOLE (long submissionId) {
    setSubmissionWithStat(submissionId, JudgeStatus.OLE);
}
void setSubmissionWA (long submissionId, double timeSec, int memoryKb) {
    setSubmissionWithStatAndInfo(submissionId, JudgeStatus.WA, timeSec, memoryKb);
}
void setSubmissionAC (long submissionId, double timeSec, int memoryKb) {
    setSubmissionWithStatAndInfo(submissionId, JudgeStatus.AC, timeSec, memoryKb);
}

void setSubmissionWithStat (long submissionId, JudgeStatus stat) {
    Database db;
    initDbConnection(db);
    runSQLStatement(() {
        auto st = db.prepare("UPDATE submissions SET status = :stat WHERE id = :id;");
        st.bind(":stat", cast(string)(stat));
        st.bind(":id", submissionId);
        st.execute();
    });
}

void setSubmissionWithStatAndInfo (long submissionId, JudgeStatus stat, double time, int memory) {
    Database db;
    initDbConnection(db);
    runSQLStatement(() {
        auto st = db.prepare("UPDATE submissions SET status = :stat, time_sec = :time, memory_kb = :memory WHERE id = :id;");
        st.bind(":stat", cast(string)(stat));
        st.bind(":id", submissionId);
        st.bind(":time", time);
        st.bind(":memory", memory);
        st.execute();
    });
}

long[] insertResults (long submissionId, Testcase[] testcases) {
    Database db;
    initDbConnection(db);
    auto ret = new long[](testcases.length);
    foreach (i, ref testcase; testcases.enumerate(0)) {
        runSQLStatement(() {
            db.execute(format("INSERT INTO results (submission_id, testcase_id, testcase_name, status) VALUES (%s, %s, '%s', '%s');",
                submissionId,
                testcase.testcaseId,
                testcase.testcaseName,
                JudgeProcessState.pending,
            ));

            auto res = db.execute(format("SELECT id FROM results WHERE submission_id = %s and testcase_id = %s;", submissionId, testcase.testcaseId));

            ret[i] = res.front()["id"].as!(long);
        });
    }

    return ret;
}

void setResultExecuting (long resultId) {
    Database db;
    initDbConnection(db);
    runSQLStatement(() {
        db.execute(format("UPDATE results SET status = '%s' WHERE id = %s;", JudgeProcessState.executing, resultId));
    });
}

void setResult (long resultId, JudgeStatus status) {
    Database db;
    initDbConnection(db);
    runSQLStatement(() {
        db.execute(format("UPDATE results SET status = '%s' WHERE id = %s;", status, resultId));
    });
}

void setResultWithStat (long resultId, JudgeStatus status, double timeSec, int memoryKb) {
    Database db;
    initDbConnection(db);
    runSQLStatement(() {
        db.execute(format("UPDATE results SET status = '%s', time_sec = %s, memory_kb = %s WHERE id = %s;", status, timeSec, memoryKb, resultId));
    });
}

void setResultMLE (long resultId) {
    setResult(resultId, JudgeStatus.MLE);
}

void setResultRE (long resultId) {
    setResult(resultId, JudgeStatus.RE);
}

void setResultTLE (long resultId) {
    setResult(resultId, JudgeStatus.TLE);
}

void setResultOLE (long resultId) {
    setResult(resultId, JudgeStatus.OLE);
}

// ジャッジコード実行時
void setResultAC (long resultId, double timeSec, int memoryKb) {
    setResultWithStat(resultId, JudgeStatus.AC, timeSec, memoryKb);
}

void setResultWA (long resultId, double timeSec, int memoryKb) {
    setResultWithStat(resultId, JudgeStatus.WA, timeSec, memoryKb);
}

void setResultIE (long resultId) {
    setResult(resultId, JudgeStatus.IE);
}
