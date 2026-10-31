# Reproduction and scope

Implementation and test sources: `5f51d2e89e589667acb31d67f68e6d066e45e204`.
Baseline: `439aa14d80bd03da41d00889adabfb9fb246c0a3`.
Commands run from the repository root with the pinned installed dependencies.
The final delivery commit adds documentation and evidence to these sources.

```sh
npm run typecheck
npm run check:imports
node tools/generate-third-party-notices.cjs --check
mkdir -p /tmp/polish-final-journeys
DREAMS_REFINEMENT_TEST_REPORT=/tmp/lifestyle-polish-full.json \
DREAMS_REFINEMENT_SOURCE_COMMIT=5f51d2e89e589667acb31d67f68e6d066e45e204 \
DREAMS_LIFESTYLE_JOURNEY_DIR=/tmp/polish-final-journeys \
npx jest --maxWorkers=2 --testSequencer=./tools/lifestyle-polish-sequencer.cjs \
  --reporters=default --reporters=./tools/refinement-jest-reporter.cjs
DREAMS_SOAK_WORKERS=2 npm run test:soak -- 120
EXPO_NO_TELEMETRY=1 npx expo export --platform all --max-workers 1 \
  --source-maps --output-dir /tmp/dreams-lifestyle-polish-hermes
node tools/verify-lifestyle-polish-export.cjs \
  /tmp/dreams-lifestyle-polish-hermes /tmp/lifestyle-polish-hermes.json
```

The sequencer only starts the long balance file first; it excludes no files.
The compact reporter records every case, complete per-file counts, source
fingerprints and any runtime/test source drift during that invocation.
The two-worker soak runs the unchanged ordinary engine policy, seeds0–119;
active new features have their own eight persistent policy journeys.

## Historical choices

`tests/fixtures/lifestyle-439-decisions.json.gz` was captured before the runtime
edits, with an isolated `git archive 439aa14 src tests/fixtures tests/helpers`.
The eligibility helper was extracted verbatim from that commit's
`tests/game/lifestyle-stories.test.ts`, exporting only its `prepared` function.
The archived implementation offered all sixty templates with `forceForTest`,
then computed SHA256 of `encodeWorld(resolveCommand(savedWorld, choose, true))`
for both choices. These are explicitly funded/controlled eligibility fixtures,
not natural player lives. Expected hashes came only from the archived producer.
Current tests decode each original world byte-for-byte and compare each entire
resolved world to those independent expected hashes. The original seven
first-stage cases and every earlier fixture remain unchanged.

## Performance

Run benchmarks sequentially after all regression, soak, export and type workers
stop. Extract baseline439aa14 and implementation5f51d2e8 `src` into separate
folders and link the installed `node_modules` into each. Decompress the unchanged
`docs/verification/final-polish/performance-core/workloads.json.gz` as the common
legacy input. For each source run:

```sh
node --expose-gc tools/benchmark-final-performance.cjs --source SOURCE \
  --inputs /tmp/polish-performance-inputs.json --ages 50,70,90 \
  --samples 5 --output REPORT.json
```

Derive enabled and active cohorts with `tools/prepare-lifestyle-performance.cjs`
using the final source, `--output INPUT.json --proof PROOF.json`, adding
`--active yes` for the latter. Preparation uses real commands and existing funds;
it never rewrites dates, health, random streams or financial history. Run the
same benchmark driver on both final cohorts. Compare before/after/enabled via
`tools/compare-overhaul-performance.cjs`. Raw trials are retained, including
one excluded warm-up per case, per-command resolve/commit spans, heap and GC
observations, cold reopen, original pre-year snapshots and backup assertions.
These cloud Node/SQLite spans do not measure native frames, React rendering,
touch response or human enjoyment.

## Exploratory runs

Before the frozen full invocation, the first balance development run exposed an
invalid16-hour test command (the schema offers8/12/20) and an ordinary policy
that died naturally at84 rather than reaching the test's requested90. The
fixture now requests valid12-hour terms; the90-year control replays the published
healthy ordinary-life command policy. The paid-reading policy still permits
natural death and is reported at its actual final age. No runtime mortality,
funds, dates or random streams were patched to fix those test assumptions.
These development failures and focused checks are not combined into a clean
full-run claim. The final report identifies the actual complete invocation.

No installed Android/iOS acceptance or human playtest was performed. Hermes
exports, React Native component tests and automated player policies have the
narrower scopes stated in their reports.
