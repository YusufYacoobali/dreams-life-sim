# Performance evidence and open gates

These are cloud diagnostics, not native-device acceptance. Re-run after the remaining systems/content are integrated and measure actual iOS/Android hardware before release.

Machine-readable measurements are preserved in [verification/](verification/README.md).

## Database representation four: actual repository storage

`node tools/benchmark-sqlite-history.cjs` runs the same seed/date/available choices
as the content-three history case through the actual repository, committing all
235 commands and retaining every genuine pre-Age-Up snapshot. It uses on-disk
Node SQLite with WAL, then closes/reopens and compares the complete saved world.
Both runs finish 79 observations, death at 78, 18 people and 47,202 ledger rows.

| Actual one-life storage | Plain live/backup rows | Compressed live/backup rows |
| --- | ---: | ---: |
| Current payload | 14,980,913 bytes | 801,666 bytes |
| Previous valid backup payload | 14,905,010 bytes | 797,358 bytes |
| All 79 genuine historical payloads | 27,334,703 bytes | 27,334,703 bytes |
| Closed database file | 72,376,320 bytes | 29,933,568 bytes |
| Peak database + WAL + shared memory | 103,391,328 bytes | 36,327,648 bytes |

Post-run comparison finds the **entire live and backup worlds identical**, with
exactly the same snapshots/metadata, receipts and preferences. No history was
trimmed. [The recorded results](verification/sqlite-history-20261019.json) include
source hashes and complete-world fingerprints.

Database version four writes current lives, imported lives, recovery and new
branches using the existing bounded checkpoint-v1 format. The existing 20 MB
inflated-checkpoint / 28-million-character encoded bounds also apply to live
writes; larger integrated worlds remain a release gate. It still reads old
plain rows. The transactional upgrade changes the database marker without bulk
rewriting worlds or consuming RNG. A previous plain current row can remain the
backup until the next actual commit. Older app versions refuse the new database
marker explicitly. The final clean **905-test / 60-suite** regression passes
in 667.495 seconds, including the genuine plain-state upgrade, failed migration
and save rollback/retry, checksum recovery and all startup/callback/branch flows.
Strict typing, both fresh Hermes exports and current Metro source checks pass.

These measurements use two **fresh databases**. Existing files may retain freed
SQLite pages; the upgrade does not run a blocking VACUUM or promise immediate
file shrinkage. This 79-observation result does not establish the planned
120-year/multi-generation 50 MB budget, and the late-checkpoint projection below
still exceeds it.

Observed cloud command p95 was 1,629.4 ms before and 1,969.9 ms after; cold load
was 683.2 ms and 1,037.5 ms respectively. The runs overlap different other cloud
work, so they do not establish a controlled timing comparison. Compression adds
work even as it reduces storage/write volume. Native responsiveness, memory and
large archive acceptance remain open; no timing speedup is claimed.

## Reproducible core-life sweeps

`npm run test:soak` requests 120 complete seeded lives. Use
`npm run test:soak -- 1000` for the larger release sweep, or an explicit count
from 1 to 1,000 for harness diagnostics. The engine test budget now scales with
the requested count (at least 15 minutes, otherwise two minutes per life).
Expanded runs print the seed, completed/requested counts, age at death, world
size and per-life/cumulative elapsed milliseconds after every completed life.
The wrapper rejects invalid counts and propagates failures.

The current content-three **120-life pure-engine Node sweep passes**; see the
recorded result below. The duplicate expanded Jest run was stopped after 43
completed lives and is not counted as a completed Jest sweep. The 1,000-life,
120-year and multi-generation gates remain open. These first-available choices
also do not replace the connected career/family/custody/legacy matrices.

## World-23/content-two diagnostic, 19 October 2026

The current harness was checked with one complete seeded life (25.350 seconds
inside Jest, seven engine checks passing) and invalid CLI input. This establishes
the configurable count and failure path, not the expanded sweeps.

The separate history benchmark completed 79 annual observations, with death at
78, 17 people and 33,604 ledger rows. Its largest encoded world was 10,561,992
bytes; compressed checkpoint payloads totalled 20,764,622 bytes. Repeating its
largest checkpoint 120 times projects **68,528,880 bytes**, above the planned
50 MB history budget. This is a projection, not an actual 120-year or SQLite
storage measurement. Current live/backup rows, WAL pages and assets are additional.
The history/storage release gate remains open.

Cloud p95 timings were 125.9 ms for Age Up, 330.9 ms for packing and 496.0 ms for
decoding/validating. This run overlapped regression/Metro activity and uses a
different workload from the older baselines below; it is not a controlled timing
comparison or evidence of native responsiveness.

The subsequent content-three pure-engine sweep completed 120 lives with
unchanged game-source hashes; its scoped results are below. Both sweep/history
drivers now choose an actually available option,
so low funds cannot make them select a disabled attendance/payment choice.

## Checkpoint decoder and measured runner

Checkpoint decoding now uses a byte lookup table and scalar quartet values,
removing the per-quartet arrays/callback from the old decoder. The checkpoint-v1
representation, exact bytes, gzip fingerprint and existing size limits are
preserved. Twenty-four checks cover independent Buffer encodings, all padding
forms, chunk boundaries, a one-million-byte input, UTF-8, the genuine old archive,
invalid characters/padding and oversize rejection. Archive, recovery, branch,
SQLite retry and format-only startup flows pass. The complete regression passes
**902 tests / 59 suites** in 687.703 seconds, with strict typing and fresh
Android/iOS Hermes exports. These are development checks, not device acceptance.

The isolated cloud Node 24 comparison uses the exact decoder source from
`d70c58e`, checked by SHA-256, with 1,000,003 decoded bytes / 1,333,340 encoded
characters and ten interleaved measured samples per decoder after warmup:

| Isolated base64 decode | Original | Current |
| --- | ---: | ---: |
| Median | 40.55 ms | 13.40 ms |
| p95 | 50.69 ms | 22.48 ms |

Ten thousand deterministic valid/invalid differential inputs also agree with the
original implementation. These timings cover base64 only; JSON, decompression,
validation, SQLite, full restore and native devices still need their own measures.
Reproduce with:

```bash
git show d70c58e:src/persistence/checkpoints.ts > /tmp/dreams-checkpoint-baseline.ts
node tools/benchmark-checkpoint-base64.cjs /tmp/dreams-checkpoint-baseline.ts
```

`node tools/run-life-sweep.cjs 120` runs the same pure-engine birth/date/seeds,
available-choice policy, per-year invariants, terminal checks and a factual death
journal check directly under Node. It records country coverage, timings and a
game-source hash, then verifies the source is unchanged at completion. An optional
second argument selects the first seed; count plus start must not exceed 1,000.
It complements Jest's native-component/SQLite/codec checks.

The twelve-seed diagnostic completed in **148.648 seconds**, with terminal age,
people and ledger counts matching the first twelve current Jest sweep records
exactly. The corresponding Jest records reached seed eleven in 631.136 seconds.
Runs overlap other cloud work; this measures harness runtime, not a simulation or
native-device speedup.

The expanded direct Node run subsequently completed **120/120 distinct seeds**
(0–119) in **2,209.809 seconds**, exit zero. It covered all twelve countries, ages
at death 40–98, at most 24 people and 55,199 ledger rows. Its game-source hash
`9c3040f28de2157839267ce8a2092eb73d81c13f08fda1f93f6ae9259a0f6c69`
was unchanged from startup to completion. All terminal age/people/ledger metrics
match the 43 overlapping completed Jest lives. The slower duplicate Jest run was
stopped after that overlap was checked; it is a partial run, not another
completed 120-life pass.

[Every seed and the final summary](verification/life-sweep-120-20261019.json) are
preserved. The default regression covers twelve of the same seeds; overlapping
runs are not counted as additional distinct lives. This closes the current
120-seed core-engine check only. It does not establish all-choice balance,
1,000-person/1,000-seed, SQLite, 120-year, multi-generation or native acceptance.

## Current content-three history measurement

After the decoder change, the current seed-42 history diagnostic completed 79
observations with death at 78, 18 people and 47,202 ledger rows. It measured
**14,905,010 UTF-8 bytes** for the largest world and **27,334,703 bytes** of
compressed checkpoint payloads in total. Repeating its largest late checkpoint
120 times projects **95,682,960 bytes**. The 50 MB history gate remains open;
this projection is not an actual 120-year/multi-generation or SQLite measurement.

Cloud p95 was 203.7 ms for Age Up, 622.1 ms for packing and 774.8 ms for full
decode/validation. This is a larger world than the content-two run and overlapped
other sweeps. It does not measure a decoder-only speedup or native timing. The
isolated same-input comparison above is the evidence for the decoder change.

The history tool now measures UTF-8 byte length explicitly. Older raw-world size
figures used JavaScript string length and should be treated as approximate raw
sizes; their compressed checkpoint JSON payload counts are ASCII byte counts.
An optional output path captures the largest self-contained checkpoint for later
fixed-input profiling:

```bash
node tools/benchmark-history.cjs /tmp/dreams-largest-checkpoint.json
```

Next storage work must measure complete multi-generation worlds, live/backup/WAL
overhead and native responsiveness, then reduce representation costs while
preserving the complete reconciled history, random streams and restorable worlds.

`node tools/benchmark-history.cjs` runs one deterministic current-engine life, taking/restoring a compressed full-state checkpoint before every Age Up. The 18 October 2026 run used Node 24 in this cloud workspace:

| Observation | Result |
| --- | --- |
| Annual observations/checkpoints | 93 |
| Final age | 92 (death within the last interval) |
| People / ledger rows at death | 5 / 7,001 |
| Largest encoded world | 2,086,157 bytes |
| Sum of compressed checkpoint payloads | 5,916,093 bytes |
| 120 copies of the largest observed checkpoint | 12,254,520 bytes |
| Age Up resolver p95 | 12.2 ms |
| Checkpoint pack p95 | 52.8 ms |
| Checkpoint decode/validate p95 | 72.9 ms |

The 120-checkpoint projection deliberately repeats the largest observed payload. It is not a simulated 120-year world or a three-generation workload. Payload totals exclude metadata, SQLite/WAL page overhead, live/backup rows and artwork. The compression result supports the current implementation choice; it does not establish the planned 50 MB history budget for the complete game.

Checkpoints use deterministic gzip with an output-size cap and a content fingerprint, preserving the complete world/RNG/pending decision. The fingerprint detects damage; it is not an authenticity signature. Local archives contain the current checkpoint, compressed history and branch origin. Import validates the complete archive before replacing local data.

Open gates include a fully integrated 120-year/multi-generation world, a 1,000-person performance case, large-archive import responsiveness, SQLite/WAL/storage measurements, low-memory devices, and actual native p95 interaction/year targets. The broader 1,000-seed and three-generation release matrices remain unrun.

After health/NPC clinical care was integrated, the same seed produced 78 annual observations, death at 77, ten people and 13,980 ledger rows. Its largest world was 4,130,069 bytes and checkpoint payloads totalled 7,966,330 bytes. Repeating the largest checkpoint 120 times projects 26,067,960 bytes. Cloud p95 timings were 22.5 ms for Age Up, 99.1 ms for packing and 133.9 ms for decoding/validating. Different health outcomes change both lifespan and workload; this is evidence of growth, not a controlled speedup/regression comparison or native acceptance.
