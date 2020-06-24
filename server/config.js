const config = require(__dirname + '/../config.json');

console.log('[OriginServer] Loading the server config...');
console.log('[OriginServer] Getting the NODE_ENV...');

let env = config.default_dev_env;
if (process.env.NODE_ENV) {
    env = process.env.NODE_ENV;
    console.log('[OriginServer] NODE_ENV found, value: ' + process.env.NODE_ENV);
} else {
    console.log('[OriginServer] NODE_ENV not found, setting default value: '+env);
}

console.log('[OriginServer] Loading the server config for ENV: '+env);
if (config[env]) {
    console.log('[OriginServer] Config [ ' + env + ' ] loaded.');
} else {
    console.error('[OriginServer] No config for [ ' + env + ' ] available.');
    console.log('[OriginServer] Exit.');
    process.exit(1);
}

// Adding the main values
config[env].env = env;
config[env].default_port = config.default_port;

module.exports = config[env];