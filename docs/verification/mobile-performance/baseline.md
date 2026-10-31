# Mobile performance baseline

Baseline runtime: `8ba6ba14` on `v2`. Audit captured before changing any app/game/persistence runtime source. The separate frozen archive and current runtime sources are byte-identical. Existing histories are retained. This is Node 24.19/real SQLite and React test-renderer evidence; release-mode Android/iPhone acceptance is **open**. Neither adb nor xcrun is available. No JS/UI FPS, tap latency or native peak memory claim is made.

## Coverage and method

The unchanged published natural-life archive supplies ages 10,25,50,70,90. Actual commands derive five explicitly enabled worlds and four active adult property/tenancy/vehicle/pet/hobby worlds. A published real-command will/death/existing-child journey plus its actual result acknowledgement supplies a generation-two world. There are fifteen operation inputs, not fabricated ages, balances or histories. Ordinary talk, work-effort and lawful purchases have thirteen available cases; ineligible child purchases are not forced.

Each Node operation has one excluded warm-up and five measured samples; command reports retain separate simulation/copy/shape/integrity/packing/SQLite phases. Five current screens at all five ordinary ages have three warm-ups and eleven React samples. The existing Life journal benchmark is run in its current `after` mode: this name refers to the earlier journal work, not to new performance changes. Native tab navigation is not emulated by a JS mount/unmount number. CPU/phase drill-downs are diagnostic; final benefit comparisons will use isolated, matched/interleaved runs.

## Ranked findings

1. **Per-transaction certification dominates Age Up.** The age 90 diagnostic adds 82 new rows: freezing them totals 0.022ms, but entering the existing private per-row WeakSet totals 233.88ms within 293.32ms validation. Monthly simulation totals 2.07ms. Reuse the existing private whole-branch certificates and exact copy provenance instead of maintaining one certificate per historical transaction. Full shape checks for new/changed rows and every reference, balance, chronology and cross-system check must remain.

2. **Save reopening repeats decoding even when nothing changed.** `readLife()` reads and decodes the payload on every call. A safe warm path can compare actual SQLite payload bytes, life identity and revision against its one privately certified current world. Any mismatch must decode fully; the native payload read and commit integrity checks stay. No larger retained-life cache is justified.

3. **Cold v4 decoding constructs duplicate expanded histories.** Tuple rows become objects with money markers, a complete canonical JSON string, another parsed object graph and restored bigints before full validation. Decode into the parsed object graph and use the same money/migration/validation pipeline, preserving every frame/hash/size/duplicate/column check and exact packing. This is an allocation target, not permission to weaken validation.

4. **Packing is significant, but its existing chunk caches work.** Compare warm/cold packing below; retained certification and ledger/person chunk caches must remain. No compression-level or format change is justified.

5. **Existing secondary-screen work is smaller and already bounded.** Relationships is virtualised, Life has stable memoised rows, and statistics already memoises by world/person. Observed statistics projection at 90 is a few milliseconds; Zustand publication is under 1 ms. Preserve these optimisations and design. Optimise stable world reuse at the repository boundary before adding broad selector/cache machinery.

## Ordinary five-age measurements

| Age | Initial Age Up median / p95 ms | Full year median / p95 ms | Cold unpack median / p95 ms | Warm repository load median / p95 ms | Warm / cold packing median ms |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 18.51 / 18.66 | 21.91 / 22.04 | 24.76 / 31.64 | 21.09 / 26.34 | 4.33 / 14.21 |
| 25 | 33.75 / 34.01 | 93.67 / 94.35 | 65.82 / 71.89 | 66.31 / 77.13 | 7.44 / 36.00 |
| 50 | 117.62 / 132.76 | 135.33 / 137.43 | 153.59 / 199.86 | 211.90 / 218.96 | 10.21 / 91.57 |
| 70 | 197.29 / 201.62 | 366.24 / 367.99 | 254.41 / 384.90 | 326.39 / 431.25 | 12.37 / 139.15 |
| 90 | 346.25 / 368.67 | 757.70 / 771.80 | 354.60 / 517.12 | 421.70 / 862.13 | 15.08 / 182.82 |

The complete raw cohort reports include median/p95, operation-boundary heap samples and the Node process lifetime RSS high-water. RSS includes setup/transpilation and prior operations; it is not an isolated operation peak or native peak. Cold reopening means a fresh repository/codec with warm OS filesystem caches. Separate memory follow-ups must distinguish retained post-GC data from temporary allocations and process high-water.

Real histories differ: active age 90 naturally dies after three months, whereas the ordinary world completes twelve. Before/after comparisons must use identical cohort inputs, commands, dates, RNG and entire canonical worlds rather than treating a shortened active year as a speedup.

## Retained evidence

Raw reports and CPU profile are under [baseline](baseline); all fifteen immutable input checkpoints are under [inputs](inputs). Input producers use only actual available commands and the original fixture/archive data. Existing fixtures and the published natural-life archive are unchanged. Benchmark programs and flags are retained in the repository. No runtime optimisation has been applied at this audit checkpoint.
