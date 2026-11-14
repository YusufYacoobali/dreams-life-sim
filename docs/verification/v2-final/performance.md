# Final annual progression performance

The final performance checkpoint removes measured repeated work while preserving the existing command, validation and save boundaries. The reported iPhone two-second delay still requires physical-device verification; Cloud Node results do not establish native touch or rendering latency.

## Changes and scope

- Ledger validation previously built a second position map containing every transaction when a validator requested its first payment position. Position lookups now use the existing transaction map and cache only requested entries. Current transaction identifiers supply an index hint only when the array contains that exact row at that position. Historical, reordered and malformed identifiers fall back to the actual row position. Duplicate/reference/balance checks remain intact.
- Post-save feedback checked achievements in both the previous and newly committed worlds on every command. A private weak cache retains completed achievement IDs only for worlds carrying the model's private immutable certificate. The next command reuses its previous world's calculation. Mutable and externally frozen worlds always recompute. The cache changes no saved data, progression rules, milestone sounds or ownership.
- Optional internal command traces now separate feedback/progression processing from review metadata reads. Simulation, validation, encoding, SQLite, review, publication, React commit and animation-frame observations remain available. Inclusive spans overlap.

The fresh post-save review read remains in place. Another SQLite connection can update review preferences between the life transaction and publication; using only the transaction's earlier metadata would change that behavior. No repository/checkpoint schema, validation rule, RNG consumption, transaction order, UI yield, duplicate guard, loading indicator, RevenueCat entitlement or gameplay permission was changed.

## Reproduction and measurement boundaries

`tools/benchmark-v2-final-performance.cjs` extends the preserved historical driver with checked instrumentation markers and runs the real `createGameStore().dispatch()` path against on-disk WAL SQLite. It records simulation, validation, encoding, SQLite, post-save feedback, review reads and store publication. Only Expo Constants' native configuration boundary is supplied by the Node host, with testing overrides off. The host has no React renderer or native UI yield; React/GPU/touch costs are explicitly unmeasured.

Both sources receive the same actual saved worlds at ages 18, 23, 30, 50 and 70 from [the retained command-generated inputs](../v2-polish/performance.md). Each age measures the first Age Up and every accepted command until that annual frame finishes. Full-year processing excludes human decision time and includes each automatic acknowledgement/choice/resume, not just one press. No post-birth health, money, calendar, RNG or outcome is patched.

An additional genuine Continue This Year boundary comes from the frozen hobby/pet save used by the UI regression. `tools/prepare-v2-continue-performance.cjs` resolves four real commands (acknowledge, advance, stay, acknowledge) to reach an age-nine planning pause. It leaves the live year and saved outcomes intact.

The controlled comparison reserves the shared four-core environment: no crime simulations, Jest, TypeScript, exports, native compilation or emulators run concurrently. Every case uses one warm-up and 21 samples, forced GC outside its measured span, and nearest-rank median/p95. Baseline is commit `7231fbc6`; optimized sources differ only in this checkpoint. Earlier exploratory measurements under concurrent load are excluded from the comparison.

Every trial checks exact outcome repeatability, all RNG streams, complete canonical-world SHA-256, durable cold reopening, current/backup revisions, receipt counts, review metadata, and the original pre-Age-Up snapshot. Raw results retain full source/input/driver digests and individual phase samples. No physical-device result is inferred from these diagnostics.

## Controlled results

Node v24.19.0; 21 measured samples per source/workload after one warm-up. Both sources produce exactly equal complete world outcomes, RNG streams, review trackers, commands and checkpoint byte counts for all eleven workloads.

| Age | Workload | Before median / p95 | After median / p95 |
| --- | --- | --- | --- |
| 18 | First Age Up | 31.38 / 44.32 ms | 33.18 / 50.41 ms |
| 18 | Complete annual frame | 52.04 / 61.13 ms | 54.70 / 63.41 ms |
| 23 | First Age Up | 36.40 / 43.42 ms | 34.25 / 38.77 ms |
| 23 | Complete annual frame | 47.80 / 57.33 ms | 46.45 / 58.02 ms |
| 30 | First Age Up | 34.52 / 41.51 ms | 33.51 / 37.92 ms |
| 30 | Complete annual frame | 138.76 / 209.24 ms | 128.40 / 155.65 ms |
| 50 | First Age Up | 70.90 / 93.05 ms | 66.24 / 132.13 ms |
| 50 | Complete annual frame | 100.52 / 131.24 ms | 93.82 / 110.21 ms |
| 70 | First Age Up | 93.47 / 127.40 ms | 83.73 / 92.01 ms |
| 70 | Complete annual frame | 185.17 / 284.50 ms | 164.42 / 193.37 ms |
| 9 | Continue This Year | 20.49 / 24.91 ms | 21.12 / 26.25 ms |

At age 70, the first Age Up median decreases 10.4% and the complete annual frame decreases 11.2%. Age 18 and the small age-nine Continue boundary are slightly slower in this sample; age 50's first-press p95 also increases. This evidence does not establish an improvement for those cases or for a physical phone. The comparison retains every individual sample instead of treating small timing differences as a guarantee.

First-Age-Up phase medians below are before → after in milliseconds. Resolver work excluding validation is calculated per trial before taking its percentile; it includes copying, command handling and simulation. Other inclusive phases can overlap. Every phase p95 is retained in the linked raw comparisons.

| Age | Resolver excluding validation | Validation | Checkpoint encoding | SQLite transaction | Post-save achievement facts | Review read |
| --- | --- | --- | --- | --- | --- | --- |
| 18 | 8.44 → 7.66 | 8.57 → 10.08 | 11.29 → 12.37 | 0.76 → 0.81 | 0.52 → 0.25 | 0.11 → 0.09 |
| 23 | 8.58 → 8.44 | 10.15 → 9.03 | 14.42 → 14.17 | 0.94 → 0.91 | 0.40 → 0.21 | 0.10 → 0.09 |
| 30 | 5.14 → 5.39 | 13.33 → 11.40 | 13.61 → 14.47 | 1.16 → 1.26 | 0.67 → 0.42 | 0.06 → 0.05 |
| 50 | 11.21 → 12.30 | 30.74 → 24.98 | 24.44 → 24.19 | 2.68 → 2.80 | 1.32 → 0.78 | 0.10 → 0.09 |
| 70 | 14.75 → 13.79 | 43.05 → 37.60 | 27.85 → 27.24 | 3.83 → 3.95 | 2.46 → 1.24 | 0.10 → 0.09 |

The position-map allocation was attributed to its first consumer, NPC courtship validation. At age 70 its median falls from 7.27 to 0.08 ms. Progress facts run once instead of twice for each ordinary committed transition (e.g. the five-command age 30 frame goes from 10 to 5 scans). Validation remains the largest measured resolver cost; checkpoint encoding and native rendering still need device investigation.

The Life source audit found stable busy-state derivations and memoized identity, journal and row children. New journal arrays still require a full journal projection scan while retaining earlier row objects. Detail-route statistics/progression scans are outside the Life render tree. No unmeasured React refactor was made; React commit markers and animation-frame opportunities require an actual internal build to assess native layout and painting.

### Exact outcomes

Each complete canonical world, including saved event text, ledger, RNG state and frozen outcomes, has the same SHA-256 before and after:

| Age | Workload | Complete canonical world SHA-256 |
| --- | --- | --- |
| 18 | firstAgeUp | `a0e8a756dee89f41bc731e324ce712ff30d88bb06bc5f8fb6be79ff2d679ee75` |
| 18 | fullYear | `60d29e69604a5877114d490fc5115ed43d8821a40a74a1ce4c8f1bff8c602129` |
| 23 | firstAgeUp | `c5be58e885d74fb50ab77c5248d415e60ba89a5e09af08ad0cff3b30c1afda53` |
| 23 | fullYear | `40f3dfb5243b261b4a2da20b2bff4ef835c855384d8d9e29fae6e9f6e3e16e70` |
| 30 | firstAgeUp | `04bed09622f6bfa7dbe2a8d2fa0d735db816c3af88431da867e2e2e78d63f63f` |
| 30 | fullYear | `1e332c3443d1a03f9e6650774292f2a6bb116c23747e9fe54c1825f95e4f5c18` |
| 50 | firstAgeUp | `573f4ed0ab86efb7f0f6e989eb5fd60cb7643b8c6624fbbf872dad7f938d6d99` |
| 50 | fullYear | `6baf9e960021485c6dccdca210f856fffc904e1aba29f6ec7cbeebdc0978bbb7` |
| 70 | firstAgeUp | `fc5738d92e570012abe790b37667758474c815dfea468a29a8ec020ca0cfd7e8` |
| 70 | fullYear | `05e68fd5d844ee65fdd462b6c214e827a51e5d9888dc538f57cf9552b97a6ad4` |
| 9 | continueThisYear | `2ace3320a0300d5437d45bacae16fe1267d0443c67ad1bf6e37b89ad26e8c837` |

[Adult comparison](performance/comparison.json.gz) and [Continue comparison](performance/continue-comparison.json.gz) also contain each `completeOutcomeSha256`, which additionally hashes the review tracker and RNG/date/count summary. Both reports include full source/input/driver digests. [Before](performance/before.json.gz), [after](performance/after.json.gz), [Continue before](performance/continue-before.json.gz) and [Continue after](performance/continue-after.json.gz) retain all 21 samples and phase medians/p95. [Continue input](performance/continue-inputs.json.gz) records the historical fixture hash and accepted setup commands. [Artifact manifest](performance/manifest.json) records compressed and decoded SHA-256 values, environment limits and run order.

To reconstruct the isolated measured optimisation from published history, create a separate checkout at `7231fbc6` and apply [the exact runtime patch](performance/optimisation.patch). It changes only the four measured runtime files; later crime and UI checkpoints are excluded from that controlled comparison. Invoke the diagnostic driver from the final checkout with `--source` pointing at the isolated checkout and the same installed dependencies/retained inputs. Patch SHA-256: `8434d00d71644eed7454adbd076dc016c9886fe6a21dd10660048c7b9692584a`.

Reproduce a source with:

```sh
node --expose-gc tools/benchmark-v2-final-performance.cjs \
  --source /path/to/source --inputs /path/to/inputs.json \
  --output /tmp/results.json --samples 21 \
  --kinds firstAgeUp,fullYear --ages 18,23,30,50,70
```

Use `--kinds continueThisYear --ages 9` with the prepared Continue input. Compare two reports with `tools/compare-v2-final-performance.cjs before.json after.json comparison.json`; it rejects changed outcomes, commands, inputs, sample counts, driver hashes or checkpoint byte counts.

## Verification and native acceptance

Focused tests cover ordinary/historical/reordered/malformed ledger identifiers, duplicate transactions, mutable arrays, private immutable achievement caching, externally frozen lookalikes, fresh review writes from a second SQLite connection, failed-save rollback, lost acknowledgements, exact retry and duplicate receipts. Existing feedback and Life renderer tests preserve committed sounds, immediate saving feedback and duplicate-input protection, including an actual interrupted year.

Final checkpoint checks pass: TypeScript for application and tests, 616 runtime modules with no import cycles, and all 47 tests across seven focused suites (`ledger-positions`, `feedback-progress-cache`, `committed-review-publication`, `command-timing`, `gameplay-feedback`, `reviews` and `annual-feedback`). Full regression, 120-life simulation and integrated Hermes/export checks are recorded by the combined final verification after checkpoint integration.

Physical iOS/Android acceptance remains open. This Linux environment has no Xcode/iOS device or KVM. Previous software Android boot attempts failed in Android system services before usable app inspection; a build/export or Node benchmark cannot replace device measurements. In an internal release build, use `DREAMS_PROFILE_COMMANDS=1` and the same saved inputs at every requested age, record median/p95 through visible world updates, inspect React commit/frame observations, and confirm touch feedback, failure/retry, Time Machine and child continuation. Profile flags remain disabled for public production builds.

## Integrated outcome recheck

After all five checkpoints were combined at `b49ca970`, a separate outcome-only smoke reran all eleven workloads with five measured trials and one warm-up each. The [comparison](performance/integrated-outcomes.json), [adult trials](performance/integrated-adult.json.gz) and [Continue trials](performance/integrated-continue.json.gz) preserve complete outcome hashes, exact accepted commands and checkpoint bytes against the controlled comparison above. Every equality, cold-open, backup, snapshot and receipt assertion passed. These trials ran alongside regression/soak work, so their timings are excluded from performance conclusions. The subsequent `a9b3146d` changes only Model review/practice-menu copy, an existing lock illustration and its UI regression; it changes none of these workload sources.
