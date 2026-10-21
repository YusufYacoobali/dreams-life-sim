const { main } = require('./run-ab.cjs');
if (require.main === module) main('A', process.argv.slice(2), __filename).catch(error => { process.stderr.write(String(error.stack ?? error) + '\n'); process.exitCode = 1; });
module.exports = { main: argv => main('A', argv, __filename) };
