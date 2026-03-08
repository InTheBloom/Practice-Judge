import { index, route, layout } from "@react-router/dev/routes";

export default [
    layout("routes/normal_layout.tsx", [
        // ホーム画面
        route("/", "routes/home.tsx"),

        // ユーザ画面
        route("/users/:userName", "routes/userpage.tsx"),

        // ↓問題
        route("/problems", "routes/problems.tsx"),

        layout("routes/problem_page_layout.tsx", [
            route("/problems/no/:problemId", "routes/problem_page.tsx"),
            layout("routes/login_layout.tsx", [
                route("/problems/no/:problemId/submissions", "routes/problem_submissions.tsx"),
            ]),
            route("/problems/no/:problemId/submissions/:submissionId", "routes/problem_submission.tsx"),
            route("/problems/no/:problemId/editorial", "routes/problem_editorial.tsx"),
        ]),

        // ↓問題セット
        route("/problemsets/", "routes/problemsets.tsx"),
        route("/problemsets/no/:problemsetId", "routes/problemset_page.tsx"),

        // ↓サインイン・ログイン画面
        route("/signup", "routes/signup.tsx"),
        route("/login", "routes/login.tsx"),

        // ↓コントロールパネル
        layout("routes/admin_layout.tsx", [
            route("/control-panel", "routes/control_panel.tsx"),

            route("/control-panel/problems", "routes/control_panel_problems.tsx"),
            route("/control-panel/problems/no/:problemId", "routes/control_panel_problem.tsx"),
            route("/control-panel/problems/no/:problemId/testcase", "routes/control_panel_problem_testcase.tsx"),

            route("/control-panel/problemsets", "routes/control_panel_problemsets.tsx"),
            route("/control-panel/problemsets/no/:problemsetId", "routes/control_panel_problemset.tsx"),
            route("/control-panel/problemsets/no/:problemsetId/set", "routes/control_panel_problemset_set.tsx"),

            route("/control-panel/users", "routes/control_panel_users.tsx"),
        ]),
    ]),
];
