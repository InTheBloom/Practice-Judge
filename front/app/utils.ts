//
// 認証系
//

const isValidUsername = (name: string) => {
    // 文字数制約
    const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
    const charCount = [...segmenter.segment(name)].length;

    if (charCount < 1 || charCount > 20) {
        return false;
    }

    // UTF-16コード数（JSのlengthはUTF-16）
    if (name.length > 100) {
        return false;
    }

    // 使用不可文字
    const banned = /[!#$&'()*+,\/:;=?@\[\]]/;
    if (banned.test(name)) {
        return false;
    }

    return true;
};

const isValidPassword = (pass: string) => {
    // 許可文字のみ
    const allowed = /^[A-Za-z0-9 !"#$%&'()\-\^\\@\[;:\],.\/=~|`{+*}<>?_]+$/;
    if (!allowed.test(pass)) {
        return false;
    }
    if (pass.length < 10) {
        return false;
    }
    if (pass.length > 50) {
        return false;
    }

    return true;
};

// --------------------------------------------
//
// 便利系
//

function toJST(datetime: string) {
    return new Date(datetime + "Z").toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export {
    isValidUsername,
    isValidPassword,
    toJST,
}
