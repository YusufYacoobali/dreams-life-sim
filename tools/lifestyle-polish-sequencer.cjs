// Start the long persistent balance policy early; preserve every test file.
const Base = require('@jest/test-sequencer').default;
module.exports = class extends Base {
  sort(tests) {
    const ordered = super.sort(tests);
    return [...ordered.filter(test => test.path.endsWith('/lifestyle-polish-balance.test.ts')), ...ordered.filter(test => !test.path.endsWith('/lifestyle-polish-balance.test.ts'))];
  }
};
