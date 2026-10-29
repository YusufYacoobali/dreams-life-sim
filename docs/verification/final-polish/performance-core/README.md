# Late-life performance: measured core changes

Baseline: `3c797e2`. Candidate: the performance-only source in this report, before the independent medical/social/partner changes. Both sides use World48/engine50/content27. Source digests and the three changed-file hashes are in [report.json](report.json) and [runtime-source-hashes.json](runtime-source-hashes.json).

This is cloud Node v24.19.0 with on-disk SQLite/WAL. It is not a physical-device or native-frame benchmark.

## What changed

- Fully validated, recursively frozen branches may be reused after an exact comparison of a private tracked working copy. Object key order is included: person enumeration affects RNG. Each named branch and each person has its own private certificate; an externally frozen object earns none.
- Changed and untrusted values still undergo schema parsing. Cold JSON/imports retain the original compiled whole-world parser. Every existing world-wide reference, date, ledger, earnings, relationship, medical and other integrity check still runs. Mutable copies and mutable validation remain independent.
- Unchanged frozen arrays can reuse their derived ledger index by exact identity. No new incremental index or skipped historical check was introduced.
- Checkpoint JSON fragments reuse weakly keyed strings for unchanged frozen collections/people, capped at 512 Ki characters per fragment. The existing v1/v4 checkpoint formats, deterministic gzip bytes, bounds, compression-block checks and atomic repository protocol remain unchanged.
- A read-only `isImmutableWorld` query supports the separately reviewed Life journal projection. It exposes no way to grant a certificate.

No journal, person, transaction, old save point or annual system is removed. No schema/version change belongs to this performance-only patch. The existing store already publishes busy state before yielding to the UI and publishes successful worlds only after durable commit; this contract is retained.

## Actual fixed-save workloads

The seeded policy uses normal engine commands: walking/restful sleep/mindfulness, eligible paid work, two monthly social accounts, an affordable adoption and a possession. Worlds were prepared in memory, then stored/resumed through the real repository in each SQLite trial. Birth acknowledgement mirrors the production transition. No funds, time, mortality, outcome or RNG is edited to force age 90.

| Age | People | Ledger rows | Full journal rows | Children | Owned assets | Own social accounts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 13 | 2,576 | 94 | 0 | 0 | 0 |
| 25 | 17 | 8,574 | 293 | 0 | 1 | 2 |
| 50 | 20 | 21,867 | 669 | 1 | 1 | 2 |
| 70 | 22 | 36,636 | 984 | 1 | 1 | 2 |
| 90 | 23 | 47,204 | 1241 | 1 | 1 | 2 |

The exact compressed inputs are [workloads.json.gz](workloads.json.gz); raw JSON SHA-256 is `25b4f30388f0a90147c20bf7246c5cd4e77f4b9413c2ce05cdd691a57ab850eb`. A second generation from archived baseline source reproduced the entire input file byte for byte. The 341 engine commands are represented by a retained [command trace](commands.json.gz), apart from the separately described production-equivalent birth acknowledgement. These inputs contain five chosen checkpoints; this preparation is not a claim that every one of the 90 years was run through native SQLite.

## Interleaved before/after results

One warm-up and eleven pairs per fixed save/command; baseline-first and candidate-first order alternate. Each side resolves the same command(s) and packs every result. Every one of the 15 scenarios has exactly the same resulting full-world SHA, RNG, command count and checkpoint bytes. Nearest-rank empirical median/p95 are shown. A pair ratio below 1 means faster in that pair; the median of ratios need not equal the ratio of the separate medians.

| Age | Workload | Before p50 / p95 ms | After p50 / p95 ms | Median pair ratio |
| --- | --- | ---: | ---: | ---: |
| 10 | routine | 13.5 / 30.2 | 11.3 / 31.3 | 0.927 |
| 10 | firstAgeUp | 29.6 / 55.0 | 31.2 / 69.5 | 0.969 |
| 10 | fullYear | 34.5 / 55.0 | 32.6 / 58.4 | 0.687 |
| 25 | routine | 24.0 / 42.9 | 22.0 / 41.6 | 0.908 |
| 25 | firstAgeUp | 42.1 / 60.9 | 47.2 / 135.5 | 1.119 |
| 25 | fullYear | 194.7 / 401.9 | 193.7 / 539.5 | 1.012 |
| 50 | routine | 67.9 / 98.5 | 51.8 / 67.4 | 0.676 |
| 50 | firstAgeUp | 94.2 / 471.5 | 99.4 / 273.8 | 0.998 |
| 50 | fullYear | 206.5 / 1113.1 | 191.9 / 1145.2 | 0.974 |
| 70 | routine | 79.5 / 152.5 | 63.8 / 111.2 | 0.729 |
| 70 | firstAgeUp | 250.7 / 1845.9 | 226.2 / 1427.9 | 1.142 |
| 70 | fullYear | 710.4 / 1698.4 | 614.8 / 1495.8 | 0.864 |
| 90 | routine | 98.6 / 266.0 | 75.4 / 104.9 | 0.714 |
| 90 | firstAgeUp | 184.8 / 305.4 | 174.5 / 226.9 | 0.943 |
| 90 | fullYear | 1083.9 / 1279.5 | 964.3 / 1058.3 | 0.869 |

Ordinary late-life interactions improve in this cohort, and complete-year work at 70/90 improves. First Age Up chunks are mixed, including a near-flat age50 case and a noisy age70 paired ratio above 1. Some younger full-year cases are also mixed. No universal speedup is claimed. Shared-host contention and GC produce large tails; these figures cannot predict phone frame rates.

Full paired samples, CPU usage, heap deltas and subsystem timings are retained in [interleaved.json.gz](interleaved.json.gz).

## SQLite and subsystem timings

The full baseline run has 11 measured samples and the candidate has 5, each after one warm-up. Runs were separate under shared-host load, so their absolute elapsed differences are descriptive rather than causal evidence. Both retain actual transaction/read/write durations; the interleaved report controls order/load more closely for simulation and packing. Below are candidate ordinary-action median milliseconds; validation includes shape/freezing, so columns are not additive.

| Age | Copy | Shape | Freeze | Full validation | Checkpoint pack | SQLite transaction |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 1.1 | 2.0 | 0.0 | 11.9 | 12.5 | 0.8 |
| 25 | 1.1 | 5.8 | 0.0 | 11.6 | 15.0 | 1.0 |
| 50 | 3.6 | 6.1 | 0.1 | 28.5 | 31.2 | 4.8 |
| 70 | 4.8 | 9.3 | 0.1 | 59.9 | 40.8 | 3.4 |
| 90 | 7.9 | 9.5 | 0.1 | 61.9 | 57.3 | 6.9 |

[sqlite-before.json.gz](sqlite-before.json.gz), [sqlite-after.json.gz](sqlite-after.json.gz) and [report.json](report.json) also include first Age Up and complete-year cases, monthly/annual simulation phases, p95, heap allocation deltas and observed Node GC. SQLite trials cold-verify the final world and the retained Before Age Up world; they check backup revision. Exact backups, rollback, receipts/idempotency and restore are additionally tested in the focused repository suites.

Checkpoint packing groups serialization, UTF-8 conversion, hashing, compression and base64 work; this report does not invent a split inside that measured phase. Node synchronous spans are measured, not native dropped frames. An exploratory age70 first-step profile still spent approximately 25–35 ms rebuilding the ledger index. That remaining cost is not claimed as optimised.

## Integrity and reproduction

Eight focused suites / 60 tests pass, plus TypeScript. Coverage includes untouched-world mutation isolation; forged frozen/incorrect-field certificates; invalid balances, references and dates; record-order preservation; cold archives and restores; atomic failures/retry/idempotency; and warm JSON cache invalidation for person/journal edits, Unicode, escapes, bigint and optional fields. Exact canonical JSON and deterministic gzip bytes are compared for both checkpoint formats. Older fixtures were not edited. Full integrated regression/soak/exports are coordinated separately by the root task.

To reproduce, extract `git archive 3c797e2 src` into an empty baseline directory and make this checkout's `node_modules` available there. Decompress the retained workload file with Node zlib or gzip.

`node tools/prepare-performance-lives.cjs 42 /tmp/reproduced.json BASELINE_DIRECTORY`

`node --expose-gc tools/benchmark-performance-pairs.cjs --baseline BASELINE_DIRECTORY --inputs /tmp/workloads.json --samples 11 --output /tmp/pairs.json`

`node --expose-gc tools/benchmark-final-performance.cjs --source BASELINE_DIRECTORY --inputs /tmp/workloads.json --samples 11 --output /tmp/before.json`

`node --expose-gc tools/benchmark-final-performance.cjs --inputs /tmp/workloads.json --samples 5 --output /tmp/after.json`

The benchmark drivers assert source stability across each run. Full-runtime digests include every game/persistence TypeScript source; raw driver hashes are retained. The initial SQLite baseline driver predates a later option/regex extension needed to instrument the new parser signature; timed operations remain the same.

Physical Android/iOS release measurements, real tap-to-paint, bridge/storage latency, React publication, peak RSS/GC behaviour on phones and battery effects remain unverified here. See the separate journal/UI evidence for React rendering.
