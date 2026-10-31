# Age 50/70/90 measurements

Baseline `439aa14` and final `7fe1a2e1` game/persistence sources run in separate
immutable archives using Node 24.19.0 and real on-disk WAL SQLite. All regression,
soak, typecheck and current export workers finished before these sequential
measurements. Each case has one excluded warm-up and five retained samples.
The original published workload archive is unchanged (SHA256
`a6c3856c079ad07a4dfc47db44269022c68b137befbdc1f69b7672dd2d3233cb`).
Age 50/70/90 inputs retain 21,867 / 36,636 / 47,204 ledger rows. Prepared enabled
and active inputs come only from actual commands and existing funds.

All nine legacy inputs, command sequences, RNG outcomes and complete-world
hashes match between baseline and final. Raw reports retain resolve/commit
spans, inclusive phase breakdowns, heap/GC observations, cold reopening,
backup checks and original pre-year snapshot checks. The UI-only adult trade-in
follow-up has identical game/persistence sources to the completed full run.

| Age | Workload | Baseline ms | Final legacy ms | Final enabled ms | Final active ms |
| ---: | --- | ---: | ---: | ---: | ---: |
| 50 | routine | 28.99 | 34.05 | 39.59 | 34.81 |
| 50 | firstAgeUp | 129.21 | 133.25 | 138.78 | 120.61 |
| 50 | fullYear | 153.27 | 138.34 | 164.53 | 175.70 |
| 70 | routine | 45.03 | 44.68 | 50.73 | 44.18 |
| 70 | firstAgeUp | 204.13 | 219.55 | 227.72 | 198.91 |
| 70 | fullYear | 380.31 | 408.60 | 380.21 | 610.20 |
| 90 | routine | 52.71 | 51.10 | 51.03 | 57.23 |
| 90 | firstAgeUp | 291.67 | 348.25 | 328.07 | 341.00 |
| 90 | fullYear | 740.79 | 742.53 | 699.53 | 331.91 |

These are medians of synchronous cloud command-plus-commit spans, not React
rendering, touch response, native frames or installed-device Age Up latency.
Enabled inputs add only the explicitly reviewed capability. Active inputs add
actual managed property/tenancy, kitchen, licence/car/trip, dog and paid writing.
They have different pending events and command counts. At 70, the first active
Age Up pauses in May, whereas the legacy pause is September. At 90, the active
`fullYear` case dies naturally in January after three months and one command;
the legacy year continues to October with six commands. Its shorter measured
duration is **not** evidence of a faster full year. Independent replay in
[active-age90-ending.json](active-age90-ending.json) verifies the actual death
date against the measured entire-world hash. The age 70 active year takes nine
commands rather than four and measures 610.20 ms rather than 408.60 ms.

The initial largest legacy median gap was 19.4% at age 90 first Age Up; the
initial largest enabled-versus-plain gap was 36.5% at age 50 routine. One fixed
11-sample follow-up for each concern preserves all raw data. On identical
legacy 90 inputs, baseline/final medians are 332.01/317.05 ms (-4.5%). On identical
explicitly enabled 50 inputs they are 33.93/34.91 ms (+2.9%). Their complete
outcomes and command policies match. These observations do not establish a
causal speedup or an across-device performance guarantee. No benchmark-driven
runtime optimization or history truncation was introduced.

See [comparison](performance-comparison.json), [follow-up](performance-followup.json),
the eight compressed raw reports and the preparation proofs. Reproduction uses
the existing benchmark driver; no display code consumes additional RNG.
