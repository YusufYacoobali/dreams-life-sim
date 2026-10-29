import { join } from 'node:path';
const { runtimeImportCycles } = require('../../tools/check-runtime-imports.cjs') as {
  runtimeImportCycles: (root: string) => { modules: number; cycles: string[][] };
};

test('application runtime imports stay acyclic so Metro can cold-load every module without partial exports', () => {
  const root = join(__dirname, '../..');
  const report = runtimeImportCycles(root);
  expect(report.modules).toBeGreaterThan(300); expect(report.cycles).toEqual([]);
});
