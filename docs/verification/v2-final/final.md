# V2 final five-checkpoint verification

Requested starting commit: `77398bb2`. This work preserves the later built-in artwork delivery `7231fbc6`. Final application source is `a9b3146df95e62a965c4215cbec8310cf27209e7` on `v2`; later verification-only commits do not change that source. The existing shop, navigation, purchase implementation and save format remain intact.

## Independent delivery

| Checkpoint | Commit | Evidence |
| --- | --- | --- |
| 1. Ordinary tenancy endings with unpaid rent | `8c5b7de7` | [26 focused tests, eligibility, escrow, real rollback/retry and cold reopening](landlord.md) |
| 2. Prospective crime balancing | `31993310` | [Seeded before/after comparison and genuine v2/v3 historical saves](crime.md) |
| 3. Artwork and Cell Escape recheck | `6e1ed5bb` | [128 focused tests, PNG/atlas integrity and native controls](artwork.md) |
| 4. UI illustrations and concise financial reviews | `4c3f8414` | [34 focused tests plus 10 landlord UI tests](ui.md) |
| 5. Measured annual command optimisation | `b49ca970` | [Controlled 11-workload comparison, complete outcome hashes and 47 focused tests](performance.md) |
| Final copy audit follow-up | `a9b3146d` | [43 focused UI cases, Model settlement disclosure and current escape practice copy](ui.md) |

Focused runs overlap; their case counts must not be added as unique regression totals. Every implementation checkpoint was committed separately and pushed to `v2` after its focused verification. The final audit also replaces the remaining generic practice star with the already-approved lock illustration; no new artwork was generated during this recheck.

## Integrated checks

| Check | Result |
| --- | --- |
| Strict app and test TypeScript | Pass |
| Runtime import cycles | 616 modules; zero cycles |
| Full regression + affected rerun | 416 suites / 7,191 unique cases pass across runs; original failure retained below |
| 120-life invariant simulation | Pass; exactly 120 unique seeds 0–119, 60 per shard; exit 0 |
| RevenueCat ownership/access regression | All 5 purchase suites / 110 cases pass |
| Integrated annual outcome/save smoke | All 11 workloads pass; five trials plus warm-up per workload |
| Android production Hermes export | Pass |
| iOS production Hermes export | Pass |
| Android internal release APK | Pass; signed x86_64 diagnostic build; no installed-app acceptance |

The complete regression used `npx jest --maxWorkers=2 --workerIdleMemoryLimit=1536MB --json`, followed by `npx jest --runInBand tests/game/editorial-policy.test.ts --json`. The completed full invocation ran all 416 suites in 4,037.709 seconds and exited 1: 415 suites / 7,190 tests passed, and one current-source observation failed because the intended store tracing changed its source SHA. Only the two current store/state observation constants and their comment were refreshed; the historical C35 registration, its immediate rejection of newer source, fixtures and outcome hashes remain unchanged. All five tests in the affected suite then pass. No application source changed for this correction. This is complete full-suite coverage plus an affected-suite rerun, not a single clean full invocation.

[Verification summary and suite inventory](verification.json), [original full results](regression.json.gz), [affected rerun](editorial-rerun.json.gz) and [all 120 simulated lives](soak.json.gz) retain the evidence and original failure. The 7,191 final cases are unique; the five-case rerun overlaps the full invocation. Neither run has skipped/todo cases. No resource or worker-exit warnings occurred in the full run. The default full-suite engine test verifies 12 lives; the separate explicit soak verifies all 120 unique seeds and its successful completion marker.

The initial full run was deliberately canceled after four passing suites to complete the two final copy corrections. Its exit 130 is not represented as a passing regression. The restarted full run uses the final application source above. The two-worker soak began at `b49ca970`; the copy-only follow-up changes no game, persistence, state, feedback or soak workload source.

The [integrated outcome smoke](performance/integrated-outcomes.json) compares canonical worlds, RNG/review state, accepted commands and checkpoint bytes with the controlled performance evidence. Every equality and per-trial cold-open, snapshot, backup and receipt assertion passes. It ran alongside other verification, so its timings are excluded from performance conclusions.

## Measured behavior

Cautious six-year organised-career arrests decrease from 357/384 (93.0%) to 277/384 (72.1%). Across the three styles, 68.8–82.0% reach a fourth assignment and roughly twice as many earn the second promotion. Bold play remains substantially more dangerous. Smuggling still arrests 106/128 cautious characters (82.8%) in this window; these provisional results require playtesting rather than a survival guarantee. Explicit v4 assignment facts preserve genuine old v2/v3 incidents, rolls, cases and outcomes.

In the isolated matched Node/on-disk SQLite comparison, age-70 first Age Up median/p95 changes from 93.47/127.40 ms to 83.73/92.01 ms. Its complete annual frame changes from 185.17/284.50 ms to 164.42/193.37 ms, an 11.2% median improvement. All eleven complete outcomes remain equal. Smaller cases are not uniformly faster: age 18 and the genuine age-nine Continue boundary are slightly slower, and age 50's first-press p95 increases. [Full phase measurements and hashes](performance.md) retain these limits.

Measured changes remove a repeated whole-ledger position allocation and duplicate achievement scans on privately certified immutable worlds. Validation, deterministic rolls, checkpoint encoding and atomic transactions remain authoritative. The fresh post-save review read is retained and tested against a write from a separate SQLite connection. Immediate loading and duplicate-input guards remain covered. No physical-device speedup or resolution of the reported two-second iPhone delay is established by these Node results.

## Compatibility and permissions

[Purchase/access code and configuration](builds/purchase-boundary.json), product IDs, entitlement mapping and RevenueCat integration are unchanged from `7231fbc6`. Testing access never creates saved ownership. Connected tests cover failed writes, exact retry, lost acknowledgements, cold reopening, independent Time Machine branches, historical outcome hashes and child continuation. All five purchase suites / 110 tests pass, including the ownership/access boundaries; configuration tests cover the development/internal override and its production rejection. Historical saves, rollback/retry, Time Machine and child continuation pass within the integrated suite inventory.

Production exports deliberately set both `DREAMS_UNLOCK_ALL_TESTING=1` and `DREAMS_PROFILE_COMMANDS=1`, with production profile, store distribution and production NODE_ENV. The configuration still disables both capabilities. [Production guard proof](builds/production-guard.json), [Android export proof](builds/android-export.json) and [iOS export proof](builds/ios-export.json) record exact bundle/artwork hashes; both platform bundles have valid Hermes bytecode headers. The raw factory returns null build markers; SDK 58's public-config serializer represents those nulls as empty objects. Neither representation is an allowed runtime development/internal marker. This serialization observation does not change application configuration or purchase checks.

## Native build

The fresh SDK 58 Android internal release APK builds successfully from an exact copy of the final application source: 643 Gradle tasks, 43 executed and 600 up to date. Signature verification passes. [Build proof](builds/native-apk.json) and [post-build source parity](builds/native-source-parity-after.json) record the embedded internal testing/profiling flags, valid Hermes bytecode and all three artwork resources. AAPT recompression changes PNG containers and clears invisible RGB beneath alpha zero; every alpha value and every visible RGB pixel remains identical. Production-export artwork bytes remain exact.

The diagnostic APK is 196,398,227 bytes, SHA-256 `b75fbcfee17d05580f8bf39536fbfff9cd49a7b4e7563c79b8703281df44d04a`, at `/workspace/dreams-builds/v2-final-polish-internal-x86_64.apk`. It contains only x86_64, so it is not a physical ARM Android or store-release acceptance artifact. The capped single-worker build completes with no additional OOM events. Existing transitive Amazon SDK stack-map warnings are retained; no RevenueCat/dependency changes were made.

## Native acceptance limits

Actual iOS/Android layouts, 200% text, native animation/accessibility, provider-sandbox purchases and release-device annual latency remain **not run**. Linux has no Xcode/iOS device or KVM-backed Android device. The prior software emulator failed inside Android's `AppStandbyController` before app inspection; no fresh emulator success is claimed. Compilation and Hermes export do not substitute for a functioning device.

The [native acceptance checklist](native-acceptance.md) records concrete device steps for all eight hobby illustrations, separate Cell Escape layers and controls, reduced motion, genuine old escape sessions, cold-save continuation, long financial reviews, tenancy endings, ownership and annual phase timing.
