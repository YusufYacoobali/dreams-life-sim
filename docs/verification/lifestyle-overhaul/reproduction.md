# Reproducing verification

Use the repository's installed dependencies, Node 24, the committed test fixtures
and exact source revisions recorded in the completed verification report. Do not
regenerate historical fixtures or replace long lives with short synthetic worlds.

## Tests and production exports

```sh
npm run typecheck
npm run check:imports
node tools/generate-third-party-notices.cjs --check
DREAMS_REFINEMENT_TEST_REPORT=/tmp/full.json DREAMS_REFINEMENT_SOURCE_COMMIT=SOURCE_COMMIT npx jest --maxWorkers=2 --reporters=default --reporters=./tools/refinement-jest-reporter.cjs
DREAMS_SOAK_WORKERS=2 npm run test:soak -- 120
EXPO_NO_TELEMETRY=1 npx expo export --platform all --max-workers 1 --source-maps --output-dir /tmp/lifestyle-export
node tools/verify-lifestyle-export.cjs /tmp/lifestyle-export /tmp/hermes.json
```

The compact reporter fingerprints runtime and test sources before and after the
run. Keep those sources frozen until the run ends. An affected final rerun must
retain its own report and provenance; combine whole-file results without counting
one case twice. Exports establish bundling and exact source-map inclusion, not
native installation or a signed store build.

The persistent journeys can retain their command traces:

```sh
mkdir -p /tmp/lifestyle-journeys
DREAMS_LIFESTYLE_JOURNEY_DIR=/tmp/lifestyle-journeys npx jest --runInBand lifestyle-journeys
```

These journeys start with untouched historical graduate/family worlds, earn funds
through actual progression and commit every command to on-disk WAL SQLite. The
connection physically closes/reopens at successful command boundaries. Controlled
receipt failures compare all eight tables, reopen before retry, and verify
idempotent receipts. The deliberate end-life command exercises estate and child
continuation; it is not described as natural mortality. Explicitly funded unit
fixtures used by eligibility tests are separate from these journeys.

## Large-life benchmarks

Extract published baseline `2d602ba` and the final verified source into separate
directories using `git archive`; include all `src` because engine imports also
reach minigame core modules. Make the installed `node_modules` available to each.
Decompress the existing
`docs/verification/final-polish/performance-core/workloads.json.gz` archive to
`/tmp/workloads.json`. Its SHA256 is
`a6c3856c079ad07a4dfc47db44269022c68b137befbdc1f69b7672dd2d3233cb`.

Stop regression, export, typecheck and soak workers before recording timings.
Run all benchmark commands sequentially:

```sh
node --expose-gc tools/benchmark-final-performance.cjs --source /path/to/baseline --inputs /tmp/workloads.json --ages 50,70,90 --samples 5 --output /tmp/before.json
node --expose-gc tools/benchmark-final-performance.cjs --source /path/to/final --inputs /tmp/workloads.json --ages 50,70,90 --samples 5 --output /tmp/after.json
node tools/prepare-lifestyle-performance.cjs --source /path/to/final --output /tmp/enabled.json --proof /tmp/enabled-preparation.json
node --expose-gc tools/benchmark-final-performance.cjs --source /path/to/final --inputs /tmp/enabled.json --ages 50,70,90 --samples 5 --output /tmp/enabled-report.json
node tools/prepare-lifestyle-performance.cjs --source /path/to/final --active yes --output /tmp/active.json --proof /tmp/active-preparation.json
node --expose-gc tools/benchmark-final-performance.cjs --source /path/to/final --inputs /tmp/active.json --ages 50,70,90 --samples 5 --output /tmp/active-report.json
node tools/compare-overhaul-performance.cjs --before /tmp/before.json --after /tmp/after.json --opt-in /tmp/enabled-report.json --output /tmp/comparison.json
```

Each case has one warm-up and five measured samples. The driver checks deterministic
command traces/outcomes, exact legacy equivalence, actual SQLite commits,
closed-connection reopening, previous backups and annual checkpoints. Retain all
samples, source/driver/input hashes and phase measurements. The enabled cohort
uses explicit enable/acknowledge commands. The active cohort additionally buys a
modest home and used car, installs a kitchen, accepts a real funded tenant/deposit,
passes a licence, drives, adopts a dog and starts a paid writing routine. Those
preparation commands never patch money, dates, health, participants or randomness.
The routine has not yet attended a month at preparation; full-year processing
advances it normally.

Active inputs contain additional genuine people and records, so their timings
are not a controlled percentage comparison with smaller legacy inputs. Investigate
large timing gaps with an eleven-sample repeat before drawing conclusions. Cloud
Node/SQLite spans do not measure React layout, native frame pacing or touch latency.
