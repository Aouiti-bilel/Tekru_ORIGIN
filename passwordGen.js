const bcrypt = require('bcrypt');
const args = process.argv.slice(2);

console.log(`\nPassword gen tool.\n`);
console.error(`Do not use in production.\n`);

args.map((password, key) => {
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, function (err, hash) {
            console.log(`Hash[${key}]: ${hash}\n`);
        });
    });
});
