import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-d";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/theme-chrome";

const normalizedLanguage = {
    C: "c_cpp",
    "C++": "c_cpp",
    D: "d",
    TypeScript: "typescript",
    JavaScript: "javascript",
    Python3: "python",
    html: "html",
};

// workerを使おうとするとトラブるので使わない。
// setOptionsで設定可能
// 行数の自動調節もsetOptionsでできるのを発見した

export function AceEditorReadOnly ({ language, value, expand }) {
    const lineCount = value.split(/\r\n|\r|\n/).length;

    const line = expand
                ? lineCount
                : 20 < lineCount
                    ? 20
                    : lineCount;

    return (
        <div className="ace-container">
            <AceEditor
                mode={normalizedLanguage[language] ?? "text"}
                theme="chrome"
                value={value}
                width="100%"
                fontSize={16}
                readOnly={true}
                showLineNumbers={true}
                showPrintMargin={false}
                highlightActiveLine={false}
                tabSize={4}
                setOptions={{
                    useWorker: false,
                    maxLines: line,
                }}
            />
        </div>
    );
}

export function AceEditorWritable ({ language, value, onChange }) {
    const lineCount = value.split(/\r\n|\r|\n/).length;

    const line = lineCount < 20
                    ? 20
                    : lineCount;

    return (
        <div className="ace-container">
            <AceEditor
                mode={normalizedLanguage[language] ?? "text"}
                theme="chrome"
                value={value}
                width="100%"
                fontSize={16}
                onChange={onChange}
                showLineNumbers={true}
                showPrintMargin={false}
                tabSize={4}
                setOptions={{
                    useWorker: false,
                    minLines: line,
                    maxLines: line,
                }}
            />
        </div>
    );
}
