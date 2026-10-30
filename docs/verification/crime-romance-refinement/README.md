# Crime, romance and writing refinement verification

The baseline is published `v2` commit
`fc2294b476fec72a77a9a863c7994b025ebe241f`. The full regression and soak use frozen
`6e35d1528f8c1cd6ae8f797c4968cf3bee311226`; the final escape-pattern revision,
affected rerun, static checks, exports and benchmarks use
`e558b7909423246027e040fc3160f756ed02f03d`. Source changes are
prospective; no historical fixture was regenerated. Dependencies, purchases,
RevenueCat, premium careers, art and main navigation remain unchanged.

## Review evidence

- [Six-issue implementation and gameplay review](../../CRIME_ROMANCE_REFINEMENT_REVIEW.md)
- [Exit Shuffle mechanics, accessibility and preserved v1 sessions](escape-review.md)
- [All eighty situations and thirty selected persistent consequences](story-effects-audit.md)
- [Fourteen romance revisions and their actual-state prerequisites](romance-review.md)
- [Existing annual catalogue inventory and before/after audit](../../CRIME_ROMANCE_WRITING_AUDIT.md)
- [Historical compatibility capture method](historical-fixtures.md)
- [Actual multi-year crime/romance and SQLite journeys](integrated-journeys.md)

The independent baseline compatibility run passed four suites / 37 cases against
an isolated exact checkout before refinements. New historical fixtures contain
actual published v1 pending decisions and escape sessions plus complete expected
resolution hashes. Their nineteen cases check original wording, participants,
effects and RNG, including failures, retries and independent branches.

The deliberate gameplay integration covers the three criminal styles, a happy
couple and an affair/confession/breakup/reconciliation journey. Real court cases
and custody delay assignments rather than being patched away. The original
street seed completes jobs in 2023, 2028 and 2033 after two convictions; fraud
uses 2023, 2024 and 2027; smuggling uses 2023–2025 and reaches an actual named
associate's betrayal. Both relationship journeys retain family and relationship
history. Commands commit to on-disk WAL SQLite and physically close/reopen the
connection at command boundaries. New vehicle tests transfer one genuinely
purchased car, verify no payout or duplicate creation, restore original title,
allow the rightful owner's resale and reject repeated marked-car theft.

Focused integration results retain the original run and expanded follow-up
provenance in `integration.json` and `integration-vehicle-followup.json`. The
original run passed all 29 cases but its source-stability guard observed an
unrelated test file changing during parallel implementation; it is not presented
as a frozen whole-repository run. The final full regression below supersedes
that limitation. The focused vehicle follow-up passed all seven cases with no
source changes, bringing independent integration coverage to 31 distinct cases.

## Integrated verification

The complete frozen Jest run passed **378 suites / 6,261 cases**, with zero
failures or skipped cases and no runtime/test source changes during the run.
Its elapsed time was 2,760.578 seconds. The final escape-pattern change then
passed **14 affected suites / 184 cases**, including seven additional cases for
pattern variety, version placement and exact earlier-v2 save replay. This run
also has no failures, skips or source drift.

The latest complete result for each file covers **all 378 suites / 6,268 unique
passing cases**. This is whole-file coverage across the two runs, rather than a
claim that 6,268 cases ran in one invocation. [regression.json](regression.json)
retains every file's provenance and asserts that no current test file is missing.
Raw [full](regression-full.json.gz) and
[final affected](regression-final-affected.json.gz) reports retain every case.
The compact reporter records source fingerprints and case outcomes while
avoiding JSON serialization of Jest's raw BigInt matcher internals.

The **120-life soak passed** for every seed 0–119 across two workers, with all
seven engine checks passing in each worker. Death ages were 22–95; the largest
retained ledger had **61,470 rows**. [soak.json](soak.json) retains all life rows
and the genuine completion marker. It ran before the final escape-only pattern
revision. This is ordinary-life progression coverage; the new memory challenge
has its own five-level, UI, session and persistence tests. The final pattern
revision adds no ordinary-life random draw or automatic gameplay action.

Strict application and test TypeScript checks, the **570-module acyclic import
graph**, and third-party notice checks passed; [static-checks.json](static-checks.json)
records their scope. Package/lock files, existing artwork, purchases and plugins
remain identical to the baseline. The final Android and iOS production Hermes
exports contain exact source matches for **all 44 changed runtime files**, with
no missing or mismatched sources. [hermes-exports.json](hermes-exports.json)
retains each source hash and both bundle hashes.

A client reconnection interrupted the execution-session handles during the full
run. The original processes continued, completed their logs and produced the
full source-stability report and genuine soak completion marker. No source was
changed until both runs finished.

## Performance method

Measurements use the existing `tools/benchmark-final-performance.cjs` driver,
Node 24.19.0 and real on-disk SQLite. The published natural-life workload archive
has SHA256 `a6c3856c079ad07a4dfc47db44269022c68b137befbdc1f69b7672dd2d3233cb`.
Age 50/70/90 inputs retain 21,867 / 36,636 / 47,204 ledger rows respectively.
The exact baseline source is isolated with `git archive`; the workload fixtures
are read without regeneration. Baseline and final measurements run sequentially
after regression, soak and export workers stop.

Each workload has one warm-up and five measured samples. Routine, initial Age Up
and complete-year spans include actual command resolution and SQLite commit.
Complete-year spans also resolve intervening choices/results. The driver checks
closed-connection reopening, previous backups, captured checkpoints, fixed
commands and deterministic full outcome hashes. Legacy inputs are identical.
Enabled inputs add only the prospective empty capability. Active-organisation
inputs use actual join/assignment/bail commands and retain their preparation
proof. No money, dates, rolls or case outcomes are patched for benchmarking.

Cloud Node/SQLite results are synchronous simulation/save measurements. They do
not measure React layout, native frame pacing, touch latency or installed-device
screen-reader behaviour. Five samples on a shared cloud machine cannot establish
a small stable percentage change or a device latency guarantee. Raw reports use
lossless `.json.gz` storage and retain all samples and phase measurements.

### Five-sample results

All **nine legacy inputs, command traces and complete outcomes match the
baseline exactly**, including RNG, people, money and history. The
[comparison](performance-comparison.json) retains ratios, p95 values and source
digests. Raw [baseline](performance-before.json.gz),
[current legacy](performance-after.json.gz) and
[enabled](performance-enabled.json.gz) reports retain every observation.

| Age | Scope | Baseline median | Current legacy | Current enabled |
| --- | --- | ---: | ---: | ---: |
| 50 | Routine | 31.41 ms | 34.65 ms | 39.98 ms |
| 50 | Initial Age Up | 146.20 ms | 141.63 ms | 133.67 ms |
| 50 | Complete year | 162.28 ms | 137.62 ms | 151.55 ms |
| 70 | Routine | 48.20 ms | 46.23 ms | 46.38 ms |
| 70 | Initial Age Up | 220.37 ms | 215.83 ms | 231.37 ms |
| 70 | Complete year | 395.37 ms | 366.63 ms | 401.75 ms |
| 90 | Routine | 51.06 ms | 56.31 ms | 53.94 ms |
| 90 | Initial Age Up | 292.01 ms | 326.85 ms | 315.50 ms |
| 90 | Complete year | 703.22 ms | 838.28 ms | 759.90 ms |

The largest original differences were +27.3% for enabled age-50 routine and
+19.2% for legacy age-90 complete-year processing. Those prompted the longer
repeat below. Other current measurements were faster than baseline; the
five-sample table alone cannot establish a stable percentage change.

### Eleven-sample follow-up

The two largest gaps were checked again with one warm-up and eleven measured
samples, sequentially with the same driver, sources and saved inputs.

| Workload/source | Median | p95 |
| --- | ---: | ---: |
| Age 50 routine, baseline | 36.33 ms | 40.88 ms |
| Age 50 routine, current legacy | 36.34 ms | 41.44 ms |
| Age 50 routine, current enabled | 35.60 ms | 49.13 ms |
| Age 90 complete year, baseline | 822.54 ms | 955.55 ms |
| Age 90 complete year, current legacy | 781.39 ms | 791.49 ms |

Both legacy repeats preserve the exact complete outcome and command trace. The
initial gaps did not persist: the repeat routine medians are effectively equal,
and the current complete year is faster in this repeat. The enabled routine's
higher p95 still shows sample variation. No speculative performance change was
applied. [performance-followup.json](performance-followup.json) retains the
summary and hashes; raw reports are
[routine baseline](performance-repeat-routine-before.json.gz),
[routine legacy](performance-repeat-routine-after.json.gz),
[routine enabled](performance-repeat-routine-enabled.json.gz),
[year baseline](performance-repeat-year-before.json.gz) and
[year legacy](performance-repeat-year-after.json.gz).

### Active organisation

These inputs use a real join, two cautious assignments and actual affordable
bail when needed. Final-source preparation reproduces the earlier prepared
input bytes exactly. The [preparation proof](active-organisation-preparation.json)
retains every command, named member/rival, mission result, case and ledger row.

| Age | People | Ledger rows | Routine median | p95 |
| --- | ---: | ---: | ---: | ---: |
| 50 | 24 | 21,869 | 38.47 ms | 39.20 ms |
| 70 | 26 | 36,638 | 50.56 ms | 55.34 ms |
| 90 | 27 | 47,206 | 62.30 ms | 63.78 ms |

The [active-state report](performance-active-organisation.json.gz) contains all
samples. These are distinct active-crime inputs; their timings do not represent
a controlled percentage comparison with the smaller ordinary input worlds.

### Reproduction

Extract baseline `fc2294b4` and final source `e558b790` into separate directories,
make the installed `node_modules` available to each, and decompress
`docs/verification/final-polish/performance-core/workloads.json.gz` to an input
JSON file. Keep other test/export workers stopped. Run:

```sh
node --expose-gc tools/benchmark-final-performance.cjs --source /path/to/baseline --inputs /tmp/workloads.json --ages 50,70,90 --samples 5 --output /tmp/before.json
node --expose-gc tools/benchmark-final-performance.cjs --source /path/to/final --inputs /tmp/workloads.json --ages 50,70,90 --samples 5 --output /tmp/after.json
node tools/prepare-overhaul-performance.cjs --source /path/to/final --output /tmp/enabled.json
node --expose-gc tools/benchmark-final-performance.cjs --source /path/to/final --inputs /tmp/enabled.json --ages 50,70,90 --samples 5 --output /tmp/enabled-report.json
node tools/compare-overhaul-performance.cjs --before /tmp/before.json --after /tmp/after.json --opt-in /tmp/enabled-report.json --output /tmp/comparison.json
```

For active inputs, add `--organised yes --proof /tmp/preparation.json` to the
preparation command and benchmark with `--kinds routine`. Reproduce the longer
check with `--samples 11 --ages 50 --kinds routine` and
`--samples 11 --ages 90 --kinds fullYear`. Production exports use
`EXPO_NO_TELEMETRY=1 npx expo export --platform all --max-workers 1 --source-maps`;
`tools/verify-crime-romance-refinement-export.cjs` verifies their exact sources.

## Native acceptance

Android/iOS production Hermes exports establish source inclusion and successful
bundling. There is no connected Android device, Apple simulator, signed build or
store installation in this environment. Human memory difficulty, humour, touch
feel, scaled text and spoken delivery remain device/playtest acceptance work.
