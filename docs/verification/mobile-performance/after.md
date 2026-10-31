# Final performance results

Final runtime/test source: `ffc7d828`. Baseline: `8ba6ba14`. The complete final regression passes 6,976 cases across 394 suites, with no failures/pending/todos or source drift. An earlier partial invocation was stopped for the migration-cache review and is not added to those counts. The 120-life pure-engine soak passes; its exact game/policy bytes are unchanged by the final codec-only guard follow-up.

## Controlled actual SQLite commands

| Age | Operation | Commands | Baseline median / p95 ms | Final median / p95 ms |
| ---: | --- | ---: | ---: | ---: |
| 10 | routine | 1 | 6.77 / 6.96 | 5.36 / 5.49 |
| 10 | firstAgeUp | 1 | 18.55 / 19.78 | 13.70 / 14.60 |
| 10 | fullYear | 2 | 19.87 / 21.64 | 14.26 / 14.81 |
| 25 | routine | 1 | 12.86 / 13.99 | 9.67 / 11.46 |
| 25 | firstAgeUp | 1 | 30.62 / 31.12 | 18.31 / 19.13 |
| 25 | fullYear | 5 | 95.69 / 97.10 | 68.64 / 71.35 |
| 50 | routine | 1 | 28.98 / 32.27 | 19.92 / 20.75 |
| 50 | firstAgeUp | 1 | 129.07 / 142.58 | 50.83 / 52.74 |
| 50 | fullYear | 2 | 127.62 / 127.92 | 73.03 / 75.05 |
| 70 | routine | 1 | 43.01 / 43.86 | 27.39 / 28.52 |
| 70 | firstAgeUp | 1 | 219.61 / 223.86 | 59.56 / 61.55 |
| 70 | fullYear | 4 | 323.13 / 346.13 | 178.79 / 181.40 |
| 90 | routine | 1 | 51.76 / 52.10 | 35.13 / 36.25 |
| 90 | firstAgeUp | 1 | 291.82 / 293.85 | 60.79 / 62.29 |
| 90 | fullYear | 6 | 726.73 / 744.27 | 412.17 / 423.73 |

All matched SQLite command sequences, dates, entire-world hashes and RNG outcomes agree. Separate eleven-sample alternating pairs cover all ordinary/enabled/active input command profiles and two generation-two profiles. The JSON retains every result, not only the largest improvements. Active age 90 still dies at its original three-month boundary; no shortened life is used as an ordinary full-year speedup.

## Loading and retained allocations

| Age | Cold unpack baseline / final median ms | Warm load baseline / final median ms |
| ---: | ---: | ---: |
| 10 | 22.60 / 15.09 | 19.69 / 0.14 |
| 25 | 66.08 / 38.96 | 62.33 / 0.25 |
| 50 | 142.32 / 102.50 | 191.54 / 0.37 |
| 70 | 238.74 / 171.30 | 324.30 / 0.59 |
| 90 | 327.07 / 235.55 | 378.64 / 0.71 |

Memory reports contain 32 actual alternating selects/loads of two distinct lives through one real repository, with full statistics, relationship and journal projections, followed by up to sixteen actual full-year command sequences per life (stopping at original natural death). Every durable command, date, whole-world hash and RNG state in that continued trajectory agrees between baseline and final. Post-GC heap is grouped by life rather than comparing a large age 90 world with its smaller successor. RSS is a Node process lifetime high-water including setup/transpilation, not an isolated operation peak or native peak. Finite churn is evidence about this workload, not proof for every possible session. The large per-row certificate registry and position-entry temporary arrays were removed; original histories and bounded chunk caches remain.

## Screen and device scope

All five-age Life/Relationships/Assets/Activities/Statistics test-renderer mount/update measurements and the existing journal benchmark are retained. Production UI/navigation/artwork source files are unchanged. Existing memoisation/virtualisation remains; exact-byte warm loads now preserve World identity for those subscribers. These measurements are not native navigation, scroll FPS or touch latency.

Both final production Hermes exports contain exact matches for all four changed runtime files. Historical 35-world canonical/packed-byte checks, full regression, checkpoint versions, receipts, rollback, recovery, generations and branch independence pass. Release-mode iPhone/Android profiling is **unverified/open**. Engineering targets are compared to observed data, not declared achieved on mobile.

See [comparison.json](comparison.json), [verification.json](verification.json), [soak.json](soak.json), [canonical.json](canonical.json), raw [controlled-before](controlled-before)/[after](after) reports and [reproduction](reproduction.md).

## Observed targets and allocation scope

Ordinary ages 10–90 cold decode medians fall by 28–41%. Exact-byte warm repository loads stay below 1 ms in this Node/SQLite workload; reading the actual stored payload remains mandatory. The native SQLite bridge cost is unmeasured.

| Ordinary age | Profile | Paired engine/packing p95 reduction | SQLite command p95 reduction |
| ---: | --- | ---: | ---: |
| 70 | routine | 32.1% | 35.0% |
| 70 | firstAgeUp | 22.8% | 72.5% |
| 70 | fullYear | 29.7% | 47.6% |
| 90 | routine | 21.6% | 30.4% |
| 90 | firstAgeUp | 2.8% | 78.8% |
| 90 | fullYear | 23.7% | 43.1% |

The 20–30% late-life target is met for these ordinary full-year profiles. It is not met by every operation: the age-90 first-command paired p95 improves only slightly despite a better median. The candidate also has a roughly 1.6% median paired increase for ordinary age-10 first Age Up and a roughly 0.1% increase for active age-25 first Age Up; those small profiles remain in the comparison. This is not a claim that every command or every p95 improves. The phase breakdown attributes the large first-command gain chiefly to validation: ordinary age-90 resolve median falls from 265.17 to 38.89 ms. Warm-load reuse is a separate improvement; the existing commit cache already reused matching bytes. The durable payload integrity read, backup/snapshot bytes and transaction remain. Five/eleven-sample percentiles use each retained driver’s convention, described in reproduction; these are finite observations, not native population confidence bounds.

Packing/compression and its caches are retained. No across-the-board 20% packing improvement is claimed. The isolated positioned-index allocation drops from 10,487,968 to 5,861,248 bytes (44.1%); that phase is not whole-app peak memory.

| Life-switch view, cycles 8–31 | Baseline post-GC first / last MiB | Final post-GC first / last MiB |
| --- | ---: | ---: |
| Ordinary age 90 | 88.20 / 88.25 | 81.29 / 82.02 |
| Generation two, age 1 | 61.31 / 61.34 | 56.16 / 56.89 |

Node process lifetime RSS high-water is 638.55 → 544.80 MiB (14.7% lower), including setup, life switching and continued commands. This does not establish the 15–25% native peak-memory target. The final retained-heap views drift upward by about 0.7 MiB over that finite late window; the baseline drifts about 0.05 MiB. These observations do not prove zero drift or a bound for every session. The source audit confirms private weak provenance, one active repository world and the existing bounded chunk caches, with no parsed-ledger origin chain.

Both sources execute the same 19 natural year sequences / 137 persisted commands after switching: the ordinary life dies after three years at the same recorded date, while its distinct generation-two control completes sixteen years. Full command/date/RNG/canonical results match at every recorded sequence. Retained heap during continued play is reported beside the growing ledger/person/journal counts rather than presented as a fixed-size workload.


## Small successor follow-up

The initial five-sample age-1 successor full-year SQLite median rises from
39.46 to 42.85 ms (+8.6%, 3.39 ms). This prompted one fixed eleven-sample
follow-up with candidate then baseline process order: median 39.90 → 37.39 ms,
p95 42.19 → 40.11 ms. Commands, dates, entire-world hashes and RNG still agree.
The alternating engine/checkpoint median ratio for that profile is 0.986, with
six of eleven candidate samples faster. These observations show sampling/JIT/GC
sensitivity for the small profile, not a reliable young-life speedup or a
persistent observed regression. No original result is discarded or replaced;
raw `generations-sqlite-followup.json.gz` files are retained in both report
folders and the comparison has a separate follow-up section. No runtime/test
change was made for the follow-up.
