module types;
import constants;

import std.process;
import std.format;
import std.string;
import std.file;
import std.stdio;
import std.datetime;
import std.algorithm;
import std.parallelism;
import std.conv;
import core.thread;

struct Container {
    string containerId;
    int memoryLimitKb = -1;
    double timeLimitSec = 0;

    void setMemoryLimitKb (int m) {
        memoryLimitKb = m;
    }

    void createNew (string cmd) {
        auto args = [
            "docker", "container", "create",
            "--memory", format("%sk", memoryLimitKb),
            "--memory-swap", format("%sk", memoryLimitKb),
            "--env NO_COLOR=true",
            "--net", "none",
            "--pids-limit", "100",
            "--interactive",
            "--init",
            "--entrypoint=\"\"",
            "judge-env",
            cmd,
        ];
        string concated = args.fold!((a, b) => a ~ " " ~ b)("");
        containerId = executeShell(concated).output.strip;
    }

    void copyFileToContainer (string hostAbsPath, string containerAbsPath) {
        if (containerId != "") {
            execute([
                "docker", "container", "cp",
                hostAbsPath,
                format("%s:%s", containerId, containerAbsPath)
            ]);
        }
    }

    void copyFileFromContainer (string hostAbsPath, string containerAbsPath) {
        if (containerId != "") {
            auto ret = execute([
                "docker", "container", "cp",
                format("%s:%s", containerId, containerAbsPath),
                hostAbsPath
            ]);
        }
    }

    void rm () {
        if (containerId != "") {
            execute([
                "docker", "container", "rm", "--force", containerId
            ]);
        }
    }

    ExecuteResult run (File stdinFile, File stdoutFile, File stderrFile, Duration timeLimit) {
        auto pid = spawnShell(format("docker container start --interactive %s", containerId), stdinFile, stdoutFile, stderrFile);
        ExecuteResult ret;

        void keep () {
            auto begin = Clock.currTime();
            auto end = Clock.currTime();
            auto acc = 0.seconds;
            bool start = false;
            while (true) {
                // memory check
                long memory = () {
                    auto memoryFilePaths = generateCgroupMemoryFile(containerId);
                    long ret = 0;
                    foreach (path; memoryFilePaths) {
                        try {
                            auto v = readText(path).strip.to!(long);
                            ret = max(ret, v);
                        }
                        catch (Exception e) {
                            // pass
                        }
                    }
                    return ret;
                }();
                ret.maxMemoryKb = max(ret.maxMemoryKb, cast(int)(memory / 1000));

                // time check
                auto pidFilePaths = generateCgroupPidsFile(containerId);
                foreach (path; pidFilePaths) {
                    try {
                        int v = readText(path).strip.to!(int);
                        if (2 <= v) {
                            if (!start) {
                                start = true;
                                begin = Clock.currTime();
                            }
                            end = Clock.currTime();
                        }
                    }
                    catch (Exception e) {
                        // pass
                    }
                }

                auto state = tryWait(pid);
                if (state.terminated) {
                    ret.TLE = false;
                    ret.status = state.status;
                    ret.elapsedTime = end - begin;
                    break;
                }
                if (!state.terminated && timeLimit < acc) {
                    kill(pid);
                    ret.TLE = true;
                    break;
                }

                Thread.sleep(timeMeasureSpan);
                if (start) {
                    acc += timeMeasureSpan;
                }
            }
        }

        auto timeKeeper = task(&keep);
        timeKeeper.executeInNewThread();
        timeKeeper.yieldForce();
        return ret;
    }

    Duration getRunTime () {
        if (containerId == "") {
            return Duration.zero;
        }
        auto ret = executeShell(format("docker container inspect --format '{{.State.StartedAt}} {{.State.FinishedAt}}' %s", containerId)).output.strip.split;
        writeln("parseddata: ", ret);
        auto start = SysTime.fromISOExtString(ret[0]);
        auto end = SysTime.fromISOExtString(ret[1]);
        return end - start;
    }

    bool isOOMKilled () {
        if (containerId != "") {
            return execute([
                "docker", "inspect", 
                containerId,
                "--format", "'{{.State.OOMKilled}}'"
            ]).output[1] == 't';
        }
        return false;
    }
}

// 提出コードとジャッジコードのコンパイルを実行するタスク
class CompileTask {
    Problem problem;
    Submission submission;
    string workDir;

    void cleanUp () {
        rmdirRecurse(workDir);
    }
}

// テストケースに対する実行タスク
class JudgeTask {
    Problem problem;
    Submission submission;
    Testcase[] testcases;
    string workDir;

    void cleanUp () {
        rmdirRecurse(workDir);
    }
}

struct Problem {
    long problemId;
    string judgeCode;
    Language judgeCodeLanguage;
    double timeLimitSec;
    int memoryLimitKb;
}

struct Submission {
    long problemId;
    long submissionId;
    string code;
    Language language;
}

struct Testcase {
    int testcaseId;
    string testcaseName;
    string inputSubmission;
    string inputJudge;
}

struct ExecuteResult {
    bool TLE = false;
    int status = 1;
    int maxMemoryKb = 0;
    Duration elapsedTime;
}
