// Compact regression evidence without serializing Jest's raw BigInt matcher data.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
function fingerprint() {
  const files = [];
  const walk = relative => {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const child = path.join(relative, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.isFile() && /\.[jt]sx?$/.test(child)) files.push(child);
    }
  };
  for (const directory of ['app', 'src', 'tests']) walk(directory);
  return Object.fromEntries(files.sort().map(file => [file, sha(fs.readFileSync(path.join(root, file)))]));
}
class RefinementJestReporter {
  constructor() {
    this.started = new Date().toISOString();
    this.sources = fingerprint();
    this.sourceCommit = process.env.DREAMS_REFINEMENT_SOURCE_COMMIT ?? null;
  }
  onRunComplete(_contexts, results) {
    const final = fingerprint();
    const changed = [...new Set([...Object.keys(this.sources), ...Object.keys(final)])].filter(file => this.sources[file] !== final[file]);
    const report = {
      sourceCommit: this.sourceCommit,
      started: this.started,
      finished: new Date().toISOString(),
      sourceDigest: sha(JSON.stringify(this.sources)),
      changedSourcesDuringRun: changed,
      suites: { total: results.numTotalTestSuites, passed: results.numPassedTestSuites, failed: results.numFailedTestSuites, pending: results.numPendingTestSuites },
      cases: { total: results.numTotalTests, passed: results.numPassedTests, failed: results.numFailedTests, pending: results.numPendingTests, todo: results.numTodoTests },
      files: results.testResults.map(file => ({
        file: path.relative(root, file.testFilePath),
        passed: file.numPassingTests, failed: file.numFailingTests, pending: file.numPendingTests, todo: file.numTodoTests,
        failureMessage: file.failureMessage ?? null,
        cases: file.testResults.map(test => ({ name: test.fullName, status: test.status, duration: test.duration })),
      })).sort((a, b) => a.file.localeCompare(b.file)),
    };
    const destination = process.env.DREAMS_REFINEMENT_TEST_REPORT;
    if (!destination) throw Error('DREAMS_REFINEMENT_TEST_REPORT must name the evidence JSON file');
    fs.writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
    if (changed.length) this.error = Error('Runtime or test sources changed during regression; inspect the evidence before claiming a stable run');
  }
  getLastError() { return this.error; }
}
module.exports = RefinementJestReporter;
