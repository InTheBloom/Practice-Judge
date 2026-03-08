module constants;
import std.datetime;
import std.traits;
import std.stdio;
import std.format;
import std.path;

immutable pollingInterval = 1.seconds;
immutable maxStdoutSize = 1 << 25;
immutable int compileMemoryLimitKb = 2000000;
immutable Duration compileTimeLimit = 5.seconds;

immutable int judgeMemoryLimitKb = 2000000;
immutable Duration judgeTimeLimit = 3.seconds;

immutable Duration timeMeasureSpan = 1.msecs;

enum cgroupMemoryTemplates = [
    ["/", "sys", "fs", "cgroup", "docker", "%s", "memory.current"],
    ["/", "sys", "fs", "cgroup", "system.slice", "docker-%s.scope", "memory.current"]
];
enum cgroupPidsTemplates = [
    ["/", "sys", "fs", "cgroup", "docker", "%s", "pids.current"],
    ["/", "sys", "fs", "cgroup", "system.slice", "docker-%s.scope", "pids.current"]
];
pragma(msg, format("\n\ncgroupの読み取りディレクトリが正しいか確認してください。\n===\nメモリ:\n%s\nまたは\n%s\n\npid:\n%s\nまたは\n%s\n===\n", buildPath(cgroupMemoryTemplates[0]), buildPath(cgroupMemoryTemplates[1]), buildPath(cgroupPidsTemplates[0]), buildPath(cgroupPidsTemplates[1])));
string[] generateCgroupMemoryFile (string containerId) {
    return [
        format(buildPath(cgroupMemoryTemplates[0]), containerId),
        format(buildPath(cgroupMemoryTemplates[1]), containerId),
    ];
}
string[] generateCgroupPidsFile (string containerId) {
    return [
        format(buildPath(cgroupPidsTemplates[0]), containerId),
        format(buildPath(cgroupPidsTemplates[1]), containerId),
    ];
}

string containerBaseDir = "/home/runner/work";

enum string userInputFile = "in";
enum string usersStdoutFile = "in_user";
enum string judgeInputFile = "in_judge";

enum Language : string {
    c = "C",
    cpp = "C++",
    d = "D",
    python3 = "Python3",
    javascript = "JavaScript", // node.js
    typescript = "TypeScript", // deno
}

enum JudgeProcessState : string {
    pending = "pending",
    inqueue = "inqueue",
    compiling = "compiling",
    executing = "executing",
}

enum JudgeStatus : string {
    AC = "AC",
    WA = "WA",
    RE = "RE",
    CE = "CE",
    IE = "IE",
    TLE = "TLE",
    OLE = "OLE",
    MLE = "MLE",
}

// ユーザーコードのファイル名
immutable string[Language] usercodeFileName = [
    Language.c:          "a.c",
    Language.cpp:        "a.cpp",
    Language.d:          "a.d",
    Language.python3:    "a.py",
    Language.javascript: "a.js",
    Language.typescript: "a.ts",
];

// ジャッジコードのファイル名
immutable string[Language] judgecodeFileName = [
    Language.c:          "judge.c",
    Language.cpp:        "judge.cpp",
    Language.d:          "judge.d",
    Language.python3:    "judge.py",
    Language.javascript: "judge.js",
    Language.typescript: "judge.ts",
];

string judgeInputFileName = "judge_input";

// ユーザーコードコンパイル前のファイルコピー（ホスト -> コンテナ）
immutable string[2][][Language] preUsercodeCompileCopy = [
    Language.c: [
        ["a.c", "a.c"],
    ],
    Language.cpp: [
        ["a.cpp", "a.cpp"],
    ],
    Language.d: [
        ["a.d", "a.d"],
    ],
    Language.python3: [
        ["a.py", "a.py"],
    ],
    Language.javascript: [
        ["a.js", "a.js"]
    ],
    Language.typescript: [
        ["a.ts", "a.ts"],
    ],
];

// ユーザーコードコンパイル時の実行コマンド
immutable string[Language] compileUsercodeCommand = [
    Language.c         : "gcc -o a.out a.c",
    Language.cpp       : "g++ -o a.out a.cpp",
    Language.d         : "dmd -of=\"a.out\" a.d",
    Language.python3   : "python3 -m py_compile a.py",
    Language.javascript: "node --check a.js",
    Language.typescript: "deno check a.ts",
];

// ユーザーコードコンパイル後のファイルコピー（コンテナ -> ホスト）
immutable string[2][][Language] afterUsercodeCompileCopy = [
    Language.c: [
        ["a.out", "a.out"],
    ],
    Language.cpp: [
        ["a.out", "a.out"],
    ],
    Language.d: [
        ["a.out", "a.out"],
    ],
    Language.python3: [
        ["a.py", "a.py"],
    ],
    Language.javascript: [
        ["a.js", "a.js"]
    ],
    Language.typescript: [
        ["a.ts", "a.ts"],
    ],
];

// ジャッジコードコンパイル前のファイルコピー（ホスト -> コンテナ）
immutable string[2][][Language] preJudgecodeCompileCopy = [
    Language.c: [
        ["judge.c", "judge.c"],
    ],
    Language.cpp: [
        ["judge.cpp", "judge.cpp"],
    ],
    Language.d: [
        ["judge.d", "judge.d"],
    ],
    Language.python3: [
        ["judge.py", "judge.py"],
    ],
    Language.javascript: [
        ["judge.js", "judge.js"]
    ],
    Language.typescript: [
        ["judge.ts", "judge.ts"],
    ],
];

// ジャッジコードコンパイル時の実行コマンド
immutable string[Language] compileJudgecodeCommand = [
    Language.c         : "gcc -o judge judge.c",
    Language.cpp       : "g++ -o judge judge.cpp",
    Language.d         : "dmd -of=\"judge\" judge.d",
    Language.python3   : "python3 -m py_compile judge.py",
    Language.javascript: "node --check judge.js",
    Language.typescript: "deno check judge.ts",
];

// ジャッジコードコンパイル後のファイルコピー（コンテナ -> ホスト）
immutable string[2][][Language] afterJudgecodeCompileCopy = [
    Language.c: [
        ["judge", "judge"],
    ],
    Language.cpp: [
        ["judge", "judge"],
    ],
    Language.d: [
        ["judge", "judge"],
    ],
    Language.python3: [
        ["judge.py", "judge.py"],
    ],
    Language.javascript: [
        ["judge.js", "judge.js"],
    ],
    Language.typescript: [
        ["judge.ts", "judge.ts"],
    ],
];

// 実行前ファイルコピー
immutable string[2][][Language] preExecuteCopy = [
    Language.c: [
        [userInputFile, userInputFile],
        ["a.out", "a.out"],
    ],
    Language.cpp: [
        [userInputFile, userInputFile],
        ["a.out", "a.out"],
    ],
    Language.d: [
        [userInputFile, userInputFile],
        ["a.out", "a.out"],
    ],
    Language.python3: [
        [userInputFile, userInputFile],
        ["a.py", "a.py"],
    ],
    Language.javascript: [
        [userInputFile, userInputFile],
        ["a.js", "a.js"],
    ],
    Language.typescript: [
        [userInputFile, userInputFile],
        ["a.ts", "a.ts"],
    ],
];

// 実行時の実行コマンド
immutable string[Language] executeCommand = [
    Language.c         : "./a.out",
    Language.cpp       : "./a.out",
    Language.d         : "./a.out",
    Language.python3   : "python3 a.py",
    Language.javascript: "node a.js",
    Language.typescript: "deno run --allow-all a.ts",
];

// ジャッジ前ファイルコピー
immutable string[2][][Language] preJudgeCopy = [
    Language.c: [
        ["judge", "judge"],
        [userInputFile, userInputFile],
        [usersStdoutFile, usersStdoutFile],
        [judgeInputFile, judgeInputFile],
    ],
    Language.cpp: [
        ["judge", "judge"],
        [userInputFile, userInputFile],
        [usersStdoutFile, usersStdoutFile],
        [judgeInputFile, judgeInputFile],
    ],
    Language.d: [
        ["judge", "judge"],
        [userInputFile, userInputFile],
        [usersStdoutFile, usersStdoutFile],
        [judgeInputFile, judgeInputFile],
    ],
    Language.python3: [
        ["judge.py", "judge.py"],
        [userInputFile, userInputFile],
        [usersStdoutFile, usersStdoutFile],
        [judgeInputFile, judgeInputFile],
    ],
    Language.javascript: [
        ["judge.js", "judge.js"],
        [userInputFile, userInputFile],
        [usersStdoutFile, usersStdoutFile],
        [judgeInputFile, judgeInputFile],
    ],
    Language.typescript: [
        ["judge.ts", "judge.ts"],
        [userInputFile, userInputFile],
        [usersStdoutFile, usersStdoutFile],
        [judgeInputFile, judgeInputFile],
    ],
];

// ジャッジ時の実行コマンド
immutable string[Language] judgeCommand = [
    Language.c         : "./judge",
    Language.cpp       : "./judge",
    Language.d         : "./judge",
    Language.python3   : "python3 judge.py",
    Language.javascript: "node judge.js",
    Language.typescript: "deno run --allow-all judge.ts",
];

Language strToLanguage (string slang) {
    static foreach (lang; EnumMembers!Language) {
        if (slang == lang) {
            return mixin(format("Language.%s", lang));
        }
    }
    stderr.writeln(format("Unknown language %s was submitted. Continue processing as if it were in C++.", slang));
    return Language.cpp;
}
