# V2 scaling baseline

Reference: `8378d0f8` (current v2, including fixes after audited `05cd38aa`). Node v24.19.0, Linux, real on-disk SQLite through `gameStore.dispatch`. Seven measured samples after one warm-up; nearest-rank p50/p95/max. These are host measurements, not phone responsiveness.

## Command-built workloads

Seed 42, birth date 14 November 2026. The existing supported-command life policy provides employment, monthly social activity, adoption and ownership. At each fixed age, a separate branch adds actual introductions/conversations, two paid hobbies, outings, a pet, pet care and affordable property/vehicle purchases. Monthly/yearly limits are honored. The remainder uses legitimate 1-minor-unit personal loans and repayments: an intentionally finance-heavy history stress, not uniform coverage of every feature. No injected history, money, dates, health or RNG. Crime is run separately after each extreme checkpoint so legitimate criminal restrictions do not invalidate the finance cohort.

Actions below exclude decision/acknowledgement commands. Revision counts include all accepted commands. Baseline input preparation used the unchanged reference engine. Full command traces and compressed checkpoint inputs are retained.

| Age | Activity | Actions | Revision | Journal | Ledger | Relationships | NPCs | Canonical / checkpoint bytes |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 23 | light | 0 | 90 | 283 | 8591 | 22 | 17 | 2660239 / 141696 |
| 23 | moderate | 200 | 491 | 394 | 8774 | 23 | 20 | 2748161 / 148564 |
| 23 | heavy | 1000 | 2091 | 794 | 9574 | 23 | 20 | 3050579 / 158656 |
| 23 | extreme | 3000 | 6091 | 1794 | 11574 | 23 | 20 | 3809947 / 183932 |
| 30 | light | 0 | 116 | 376 | 11987 | 23 | 18 | 3691345 / 197136 |
| 30 | moderate | 200 | 517 | 487 | 12171 | 24 | 21 | 3779728 / 203601 |
| 30 | heavy | 1000 | 2117 | 887 | 12971 | 24 | 21 | 4082966 / 213933 |
| 30 | extreme | 3000 | 6117 | 1887 | 14971 | 24 | 21 | 4842853 / 239457 |
| 50 | light | 0 | 191 | 715 | 26319 | 27 | 20 | 8290685 / 448701 |
| 50 | moderate | 200 | 592 | 825 | 26505 | 28 | 23 | 8379373 / 455329 |
| 50 | heavy | 1000 | 2192 | 1225 | 27305 | 28 | 23 | 8682893 / 465677 |
| 50 | extreme | 3000 | 6192 | 2225 | 29305 | 28 | 23 | 9442893 / 490589 |
| 70 | light | 0 | 262 | 960 | 37335 | 27 | 22 | 11760599 / 631937 |
| 70 | moderate | 200 | 663 | 1069 | 37523 | 28 | 25 | 11849638 / 638573 |
| 70 | heavy | 1000 | 2263 | 1469 | 38323 | 28 | 25 | 12153386 / 648813 |
| 70 | extreme | 3000 | 6263 | 2469 | 40323 | 28 | 25 | 12913386 / 673565 |

## End-to-end latency

Routine and finance timings include the action **and** its acknowledgement, durable saves and journal projection. Complete year includes every legitimate decision, outcome and Continue This Year until its cursor closes; a first Age Up is only its first command. No pending months are discarded.

| Age | Activity | Routine p50 / p95 ms | Finance p50 / p95 ms | Full year p50 / p95 ms |
|---|---|---:|---:|---:|
| 23 | light | 22.3 / 37.9 | 24.9 / 35.3 | 38.6 / 50.7 |
| 23 | moderate | 24.1 / 25.7 | 36.7 / 54.6 | 208.1 / 234.0 |
| 23 | heavy | 24.5 / 25.8 | 30.9 / 32.6 | 224.3 / 278.1 |
| 23 | extreme | 32.8 / 34.3 | 43.2 / 45.9 | 293.7 / 327.5 |
| 30 | light | 24.0 / 33.3 | 29.3 / 31.7 | 106.0 / 140.8 |
| 30 | moderate | 26.8 / 36.1 | 35.0 / 38.7 | 207.2 / 252.2 |
| 30 | heavy | 29.9 / 31.7 | 39.1 / 45.8 | 238.2 / 258.6 |
| 30 | extreme | 38.7 / 40.8 | 51.9 / 90.6 | 303.1 / 343.6 |
| 50 | light | 51.2 / 78.9 | 69.4 / 94.5 | 76.9 / 93.5 |
| 50 | moderate | 51.4 / 117.3 | 57.2 / 63.7 | 131.3 / 165.8 |
| 50 | heavy | 62.8 / 78.8 | 92.5 / 108.0 | 147.3 / 180.0 |
| 50 | extreme | 67.2 / 94.0 | 80.0 / 105.9 | 148.0 / 212.7 |
| 70 | light | 74.1 / 89.3 | 97.0 / 106.7 | 122.6 / 135.4 |
| 70 | moderate | 65.3 / 168.9 | 80.6 / 86.6 | 422.4 / 478.8 |
| 70 | heavy | 68.5 / 73.2 | 83.6 / 97.3 | 432.6 / 491.5 |
| 70 | extreme | 71.8 / 123.0 | 91.1 / 107.2 | 514.6 / 578.4 |

## What grows and what to change

- Copying and shape parsing traverse growing journal/relationship/person branches, even for routine changes. Recursive equality then revisits those copies to rediscover unchanged data. This justifies comparing a central copy-on-write transaction against explicit sharing and the reference copy implementation.
- Ledger reconstruction occurs after real appends; routine updates with an unchanged ledger already reuse the index. Preserve this distinction. A privately certified append path can avoid rebuilding unchanged financial history; account/debt reconciliation and subsystem cross-references must still run.
- Checkpoint encoding is the largest ordinary-action span. Main-body JSON/compression grows with journal/activity history. Existing ledger chunks still scan row identities and the full envelope is sent to SQLite. Evaluate identity/fragment reuse first; a new storage schema is not yet justified.
- Journal projection still scans all entries; its Node CPU cost is smaller than encoding, but verified append processing can remove that scan without truncation.
- Active monthly work grows with actual systems. The report retains each monthly subsystem and validator; do not change processing/RNG order to optimize unrelated history.

The raw report includes inclusive (overlapping) copy, shape, equality, ledger, subsystem validation, monthly subsystem, serialization/compression, SQLite transaction/read/write and projection spans. Heap deltas, RSS samples and observed GC are retained. `nativeTransferBytes` is a byte count, not milliseconds or native bridge time. RSS is process-level; sample heap differences are not allocation totals or exact transient peaks. Phase sums must not be added as independent costs.

## Limits and reproduction

No iPhone/Android release device is connected. React commits, GPU paint, native bridge, scrolling, mobile GC/peak memory and tap-to-feedback remain open. The Node report cannot close final device acceptance. The retained realistic interrupted-year fixture is generated by `tools/prepare-v2-continue-performance.cjs` from its genuine pet-decision archive.

Install with `npm ci --cache /tmp/dreams-npm-cache`. Archive `8378d0f8` into an isolated directory and link dependencies. Run `tools/prepare-v2-performance-lives.cjs`, then `tools/prepare-scaling-lives.cjs INPUTS OUTPUT REFERENCE_DIRECTORY`. Run `node --expose-gc tools/benchmark-scaling.cjs --source REFERENCE_DIRECTORY --inputs COHORTS --samples 7 --levels light,moderate,heavy,extreme --output REPORT`. Inputs and raw reports are gzip JSON in this directory. Source hashes are asserted stable by every driver. Full canonical-world, RNG, command and checkpoint SHA comparisons will be required before shipping each architectural stage.
