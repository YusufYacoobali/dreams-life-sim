# Lifestyle overhaul verification

The baseline is published `v2` commit
`2d602ba9641960e9d965765ade9ed9daa6a780f3`. Final gameplay/UI sources are
`f5f2d17b4dd545250b6de7af4a070843ab89dd51`; the last assertion/evidence commit is
`2750dc353a631f935dc475db2d54bbafc58b2230`. No runtime source changes after the
complete frozen regression. [Source preservation](source-preservation.json)
confirms package/access/purchase/plugin files and all 1,300 original asset and
fixture files remain unchanged. Two new atlases and one independently captured
first-stage compatibility fixture are added. All new gameplay is free.

## Gameplay and saved journeys

- [Implementation and save policy](../../LIFESTYLE_OVERHAUL.md)
- [Gameplay and architecture review](gameplay-review.md)
- [Writing audit of all sixty situations](../../LIFESTYLE_WRITING_AUDIT.md)
- [Full authored situation inventory](situation-inventory.json)
- [Five actual persistent journeys covering the six acceptance themes](integrated-journeys.md)
- [Artwork hashes and source references](artwork.json)
- [Commands to reproduce verification](reproduction.md)

The journeys start from untouched historical graduate/family fixtures and use
actual commands, earned funds and calendar progression. Every successful command
commits to on-disk WAL SQLite, physically closes/reopens the connection and
compares the complete loaded world. Controlled receipt failures preserve all
eight tables, cold-load before retry and verify idempotency. Property and hobby
journeys create independent Time Machine branches; actual estate settlement
preserves home improvements, vehicle mileage, pet care and person-specific hobby
and licence histories. Explicit end-life commands test estate and existing-child
continuation; they are not described as natural mortality.

The separate [trade-in check](trade-in-sqlite.json) verifies a composite real
sale/fee/purchase, exact net funds, original title ending, separately reviewed
replacement, stale quotes, export/import, all-table rollback, cold retry and
idempotency. It uses an explicitly funded eligibility fixture, not a natural life.
Run `node tools/verify-lifestyle-trade-in.cjs /tmp/trade-in.json` to reproduce it.

## Regression and compatibility

Latest complete results cover **all 388 suites / 6,652 unique passing cases**,
with zero remaining failures, skips, todos or missing test files.
[regression.json](regression.json) records per-file provenance. These counts use
the latest whole-file result, rather than adding duplicate executions.

The full frozen run completed all 388 suites / 6,650 cases in 1,350.669 seconds.
It passed 6,627 cases; 23 assertions in four files needed updates for reader 32/33,
the six specialty vehicles and the explicitly checked empty newborn capability.
No historical expected digest was replaced. The final affected rerun passed all 85 cases across five files, including two
additional shared-ticket acceptance/refusal cases. Both reports have zero runtime/test source drift:
[full raw run](regression-full.json.gz) and
[final five-file rerun](regression-final-affected.json.gz).

New coverage includes all 120 choices across sixty situations, stale-context
cancellation and literal player-written names; twelve-country licence payments;
sixty new-species adoption/basic-care/vet currency cases; paid competition results
for every hobby; rooms and housing suitability; mileage and training tampering;
age-related comfort support; project credits from genuine attended months;
refused invitations; free casual leisure; old relationship memories; reviewed
ending/refund; and actual multi-generation ownership/care. The UI review tests
cover read-only preview, cancellation, storage failure/retry and a genuine Tokyo
relocation save with both USD and JPY accounts.

Seven first-stage pending/action outcomes were produced by exact frozen
`fdfd7a5ff69583a68a1cdb1c2fd2a7aea028fcb1` sources. Current decoding and resolution
retain complete expected world hashes for earlier boat usage, pet training,
project work, property choices and hobby challenges. Their explicitly funded
unit setup is disclosed separately from the natural journeys. The existing
512-newborn historical digest stays exact after checking and excluding only the
new empty capability, alongside previously allowed prospective fields.
Reader32 changes metadata only for supported eight-table databases; future
reader33 is refused. Existing archive1/plain imports remain supported, while new
archive2 exports prevent archive1-only clients from silently stripping features.

## Soak and static checks

The **120-life soak passes**, with every seed 0–119 completed across two workers.
Death ages are 22–95; the largest retained ledger has **61,470 rows**.
[soak.json](soak.json) retains all life observations and the genuine completion
marker. All 120 death-age, people-count and ledger-row observations match the
published previous soak; this is scalar observation agreement, not full-world
equivalence. The soak began at a955d318; the intervening f5f2d17b change is
licence-review UI only. Game, persistence, engine-test/policy and runner sources
are unchanged, as recorded in the proof. This is ordinary-life coverage; the
new lifestyle actions have their separate controlled and persistent journeys.

Strict application/test TypeScript, the **593-module acyclic import graph**, and
third-party inventory checks pass; [static-checks.json](static-checks.json) retains
the commands and scope. The final Android and iOS production Hermes exports have
exact source matches for **all 58 changed runtime files**, without missing or
mismatched content. Both new PNGs are present byte-for-byte in the exported
assets. [hermes-exports.json](hermes-exports.json) retains source, bundle and PNG
hashes. This verifies successful bundling and source inclusion.

## Large-life performance

Measurements use Node 24.19.0, the existing fixed-world benchmark driver and
real on-disk WAL SQLite, sequentially after regression, typecheck, soak and
export workers stop. The published natural-life archive remains unchanged
(SHA256 a6c3856c079ad07a4dfc47db44269022c68b137befbdc1f69b7672dd2d3233cb).
Age 50/70/90 worlds retain 21,867 / 36,636 / 47,204 ledger rows. Baseline and final
sources are isolated with git archive. One warm-up precedes five measured
samples per case; the driver checks closed-connection reopening, previous
backups, annual checkpoints and deterministic complete outcomes.

**All nine legacy inputs, command traces and complete encoded outcomes match
the baseline exactly**, including RNG, people and finances.
[Comparison and source/input digests](performance-comparison.json) retain the proof.

| Age | Scope | Baseline median | Current legacy | Current enabled |
| --- | --- | ---: | ---: | ---: |
| 50 | Routine | 35.54 ms | 34.11 ms | 37.53 ms |
| 50 | Initial Age Up | 121.96 ms | 110.82 ms | 143.00 ms |
| 50 | Complete year | 146.72 ms | 128.62 ms | 140.27 ms |
| 70 | Routine | 44.87 ms | 42.80 ms | 52.89 ms |
| 70 | Initial Age Up | 195.45 ms | 194.28 ms | 245.78 ms |
| 70 | Complete year | 355.83 ms | 332.52 ms | 391.90 ms |
| 90 | Routine | 51.58 ms | 55.69 ms | 57.51 ms |
| 90 | Initial Age Up | 282.22 ms | 315.63 ms | 297.19 ms |
| 90 | Complete year | 664.70 ms | 770.29 ms | 696.35 ms |

Raw [baseline](performance-before.json.gz), [current legacy](performance-after.json.gz),
[enabled](performance-enabled.json.gz) and [active](performance-active.json.gz)
reports retain every sample and phase measurement. Enabled worlds use actual
enable/acknowledge commands with empty new histories, rather than patched flags.
Their [preparation proof](enabled-preparation.json) preserves those commands.

The initial largest gaps were +15.9% for legacy age 90 complete-year processing
and +25.8% for enabled age 70 initial Age Up. Those prompted one warm-up and
eleven measured samples per source, again sequentially:

| Workload | Baseline median | Current median | Baseline/current p95 |
| --- | ---: | ---: | ---: |
| 90 complete year | 722.71 ms | 707.51 ms | 756.85 / 805.61 ms |
| 70 initial age up (enabled) | 220.35 ms | 208.99 ms | 242.26 / 224.94 ms |

Those initial gaps did not persist. The legacy repeat also preserves the exact
complete outcome and command trace. These small cloud samples do not establish a
small stable percentage improvement or native-device latency. No speculative
performance change was applied. [Follow-up summary](performance-followup.json)
and raw [age 90 baseline](performance-repeat-before.json.gz),
[age 90 current](performance-repeat-after.json.gz),
[age 70 baseline](performance-repeat-enabled-before.json.gz) and
[age 70 enabled](performance-repeat-enabled-after.json.gz) retain the evidence.

Active worlds use actual modest-home/kitchen, named tenancy/deposit, licence,
used-car/trip, dog adoption and writing-routine commands. No funds, dates,
health, people or RNG are patched. The writing routine has not yet attended a
month at preparation. [Active preparation](active-preparation.json) retains
every command, actual participant and payment.

| Age | People | Initial ledger rows | Routine median | p95 |
| --- | ---: | ---: | ---: | ---: |
| 50 | 23 | 21,874 | 37.72 ms | 39.20 ms |
| 70 | 25 | 36,643 | 50.83 ms | 51.13 ms |
| 90 | 26 | 47,211 | 59.84 ms | 60.24 ms |

The active age 50 and age 70 year spans use three and nine commands respectively.
The active age 90 character dies in January 2117; its labelled fullYear case ends
at that natural death after one command, rather than measuring twelve months.
It must not be presented as a faster equivalent year. Active worlds also contain
additional real people/records and different events, so their timings are not a
controlled percentage comparison with legacy worlds. Cloud Node/SQLite spans
do not measure React layout, native frames, touch feel or screen-reader delivery.

## Remaining acceptance work

There is no installed Android/iOS build, connected physical device, Apple
simulator or human playtest in this verification. Touch feel, screen-reader
speech, large-text layout on devices, humour and long-term progression balance
still need human/device review. Automated checks and visual atlas inspection do
not establish a numerical 9/10 gameplay-quality score. The optional third hobby
routine and amateur racing were not needed for the core requested journeys;
the established two-routine balance remains.
