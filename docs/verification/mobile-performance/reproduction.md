# Reproduction and measurement scope

Baseline runtime: `8ba6ba14c6af47e4d868fc51bf2131d85cc9de1e`.
Final runtime/tests: `ffc7d8282cf7a1bd043015cf9972f77e438a934c`.
Use the pinned installed dependencies. No package upgrades are part of this work.
The delivery adds profiling tools/evidence without changing that runtime tree.

## Sources and inputs

Extract each revision's `src` into a separate immutable directory and link the
installed `node_modules`. Preserve the existing archive and fixtures. Decompress
the four files under `inputs/` to an ordinary JSON input folder. They contain
all five ordinary/enabled ages, four active adult ages and the actual successor.
Equivalent commands can regenerate the derived input groups:

```sh
node tools/prepare-lifestyle-performance.cjs --source BASELINE --ages 10,25,50,70,90 --output enabled.json --proof enabled-proof.json
node tools/prepare-lifestyle-performance.cjs --source BASELINE --ages 25,50,70,90 --active yes --output active.json --proof active-proof.json
node tools/prepare-mobile-generation.cjs BASELINE generations.json
```

The ordinary input is the unchanged decompressed
`docs/verification/final-polish/performance-core/workloads.json.gz`.
Preparation uses real commands and available funds. The successor acknowledges
its actual continuation result; no pending event is cleared by editing data.
The under-five publication probe uses an actual available Age Up rather than
forcing an ineligible mindfulness routine. Source files/hashes and command
outcomes are retained in the raw reports.

## Regression, types and soak

```sh
npm run typecheck
npm run check:imports
node tools/generate-third-party-notices.cjs --check
mkdir -p /tmp/mobile-final-journeys
DREAMS_REFINEMENT_TEST_REPORT=/tmp/mobile-full.json \
DREAMS_REFINEMENT_SOURCE_COMMIT=ffc7d8282cf7a1bd043015cf9972f77e438a934c \
DREAMS_LIFESTYLE_JOURNEY_DIR=/tmp/mobile-final-journeys \
npx jest --maxWorkers=2 --testSequencer=./tools/lifestyle-polish-sequencer.cjs \
  --reporters=default --reporters=./tools/refinement-jest-reporter.cjs
DREAMS_SOAK_WORKERS=2 npm run test:soak -- 120
```

The first full invocation on `41863731` was interrupted during review of original
version metadata in v4 migration/cache eligibility. Its partial results are not
added to the final complete run. The corrected final run has separate frozen
source fingerprints. The soak began at `41863731`; the final follow-up changes
only the checkpoint guard and its test. Game sources, engine policy/test and
soak runner bytes are identical; the seed loop performs engine commands and
plain-JSON restoration, not v4 checkpoint decoding. Every completed seed is
retained, with the completion marker and baseline scalar comparison. Full final
regression separately exercises the corrected checkpoint path.

## Controlled measurements

Run after all regression, soak, export and type workers stop. For each input
cohort (`ordinary`, `enabled`, `active`, `generations`), run baseline then final
operations with one excluded warm-up and five retained samples:

```sh
node --expose-gc tools/benchmark-mobile-operations.cjs --source SOURCE --inputs INPUT.json --samples 5 --output operations.json
node --expose-gc tools/benchmark-final-performance.cjs --source SOURCE --inputs INPUT.json --samples 5 --output sqlite.json
```

The existing SQLite driver selects empirical percentiles with `floor((n-1)*p)`; the operation/pair drivers use `ceil(n*p)-1`. Each before/after comparison uses the same driver and convention. Five/eleven retained samples and their empirical p95 values are finite workload observations, not population confidence bounds or mobile-device acceptance. Raw trials are retained.

For the generation-two child, pass `--kinds firstAgeUp,fullYear` to the second
command: the adult/older-child routine is deliberately not forced.
For each cohort, use eleven alternating same-process command pairs:

```sh
node --expose-gc tools/benchmark-performance-pairs.cjs --baseline BASELINE --candidate FINAL --inputs INPUT.json --samples 11 --output pairs.json
```

Again use `--kinds firstAgeUp,fullYear` for the young successor. Ordinary talk,
work-effort and legitimate purchases have separate available-action reports:

```sh
node --expose-gc tools/benchmark-mobile-actions.cjs --source SOURCE --inputs ordinary.json --samples 11 --output actions.json
node --expose-gc tools/benchmark-mobile-memory.cjs --source SOURCE --inputs INPUT_DIRECTORY --output memory.json
node tools/verify-mobile-canonical.cjs --baseline BASELINE --candidate FINAL --inputs INPUT_DIRECTORY --output canonical.json
```

The memory driver alternates two distinct existing lives in one real repository,
opens full detail projections and records pre/post-GC heap and lifetime RSS.
It then commits up to sixteen full-year Age Up/Continue sequences per life, using the same available-choice policy and stopping at natural death. It retains all ledger/journal rows and compares every command/date/RNG/whole-world result between sources. It is finite Node cache-churn evidence, not
an assertion about unmeasured native memory or every possible session.
Canonical verification includes enhanced creative checkpoints and the original
published crime/prison/romance/escape outcome hashes, without rewriting fixtures.

## React and production bundles

```sh
DREAMS_MOBILE_SCREEN_INPUTS=ordinary.json DREAMS_MOBILE_SCREEN_OUTPUT=screens.json \
npx jest --runInBand --testMatch '**/tests/performance/mobile-screens.bench.tsx'
DREAMS_JOURNAL_PHASE=after DREAMS_JOURNAL_INPUTS=ordinary.json DREAMS_JOURNAL_OUTPUT=journal.json \
npx jest --runInBand --testMatch '**/tests/performance/life-journal-render.bench.tsx'
EXPO_NO_TELEMETRY=1 npx expo export --platform all --max-workers 1 --source-maps --output-dir /tmp/mobile-hermes
node tools/verify-mobile-performance-export.cjs /tmp/mobile-hermes hermes.json
```

The existing journal benchmark's `after` label selects the journal implementation
already present at baseline, not a new mobile-performance implementation.
These are test-renderer mount/update/projection metrics. Production UI files,
virtualisation, variable heights, Android clipping protection and art remain.
Hermes exports verify bundling and exact source inclusion; release-mode native
frames, tap feedback, navigation, scrolling and memory remain an open gate.


## Fixed small-successor follow-up

The original age-1 SQLite full-year result was 3.39 ms slower, prompting one
fixed follow-up after all other workers stopped. Run candidate then baseline,
retaining the original five-sample files and these separate eleven-sample files:

```sh
node --expose-gc tools/benchmark-final-performance.cjs --source FINAL --inputs generations.json --kinds firstAgeUp,fullYear --samples 11 --output final-generations-sqlite-followup.json
node --expose-gc tools/benchmark-final-performance.cjs --source BASELINE --inputs generations.json --kinds firstAgeUp,fullYear --samples 11 --output baseline-generations-sqlite-followup.json
```

This follow-up is diagnostic, not added to the original 44-profile count. No
runtime or test source changes intervene, and all complete outcomes agree.
