const bcrypt = require('bcrypt');

const pass = "biejajbai3892b";
const main = async () => {
    const hash = await bcrypt.hash(pass, 10);
    console.log("pass: ", pass);
    console.log(hash);
};

main();
