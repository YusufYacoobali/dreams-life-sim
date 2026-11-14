# V2 combined verification

Application source under verification: `c22c64bf` on `v2`. The [master gameplay checkpoints](../../planning/V2_POLISH_IMPLEMENTATION.md) precede the separate [shop redesign](../../planning/V2_SHOP_IMPLEMENTATION.md), as requested.

## Automated checks

| Check | Result |
| --- | --- |
| Strict app and test TypeScript | Pass |
| Runtime imports | 613 modules; no cycles |
| Complete purchase suite | 5 suites, 110 cases pass |
| Integrated regression | 410 suites; all 7,143 tests pass; exit 0 |
| 120-life invariant soak | Pass; 120 unique seeds (0–119), 30 per shard; exit 0 |
| Android Hermes production export | Pass; 12 MB bytecode bundle |
| iOS Hermes production export | Pass; 12 MB bytecode bundle |

The production exports deliberately set `DREAMS_UNLOCK_ALL_TESTING=1` and `DREAMS_PROFILE_COMMANDS=1`, with `EAS_BUILD_PROFILE=production`, store distribution and production NODE_ENV. The configuration still returns both capabilities false and both build markers null. Configuration/runtime permission tests cover the allowed development/internal cases and rejected public/production combinations.

The full regression used `npx jest --maxWorkers=2 --workerIdleMemoryLimit=2GB`; the soak used `DREAMS_SOAK_WORKERS=4 npm run test:soak`. The parallel regression emitted a worker-shutdown warning after all assertions passed. A subsequent `--runInBand --detectOpenHandles` run of the changed purchase, annual feedback, escape, hobby and scoped-error UI suites passes all 64 tests across five suites, exits normally and reports no open handles. This focused check does not establish which earlier suite caused the parallel shutdown warning.

The connected persistence checks use real SQLite, failed-save rollback, repeated receipts, closed-connection reopening and independent Time Machine branches. Existing fixture bytes and historical outcome hashes remain pinned. Tests explicitly distinguish new optional activation metadata from literal older salaries, payments, mileage, pet history, pending decisions and RNG outcomes. Earlier failures and the resulting focused fixes are documented in checkpoint 10.

The shop adds no packages or artwork. Product IDs, entitlement mappings, `catalog.ts`, `service.ts`, `native.ts`, `access.ts` and `hooks.ts` are unchanged by its commit. Purchase controls use the store's original localized price strings; testing access never manufactures ownership. Renderer coverage includes every product, bundles, errors/cancellation/restoration, stale callbacks, pending gameplay actions, dark appearance and doubled text size on a small screen.

## Native build and inspection

The final Android internal release APK builds successfully with SDK 58 and an x86_64 ABI (643 Gradle tasks; 525 executed, 118 up to date). `apksigner verify` passes. The copied `app` and `src` trees exactly match the final application source. The APK's embedded `assets/app.config` has both testing/profiling flags true with explicit `internal` markers; the guarded production export configuration has both false with null markers.

APK size: 192,430,311 bytes. SHA-256: `a129c18168a3baa17bfbfd2aeac4690df67c7d5cb9c5dbae3a985124f14ba27e`. This is an internal x86_64 diagnostic artifact, distinct from a physical ARM Android build or a public store release.

The software API 29 emulator reached boot completion and received the complete APK. Its minimum SDK is 24, compatible with that image. The first install lost its response after a transport timeout; a retry with a longer transport budget returned `cmd: Failure calling service package: Broken pipe (32)`. Screenshot and input commands also timed out. The crash buffer identifies a fatal exception in Android's system process (`android.bg`): `IllegalStateException: Wait for admin data timed out` in `AppStandbyController.waitForAdminData`. The emulator was stopped after this bounded attempt. No installed-app inspection, comparison screenshots or native UI acceptance was obtained. Installation/runtime compatibility still needs verification on a functioning device; a passing build is not a substitute for it.

Linux has no Xcode, iOS device or KVM. The software-emulator attempt cannot establish physical-device frame timing or input latency. No actual iOS/physical Android playthrough or RevenueCat provider-sandbox acceptance is claimed from automated renderer checks, compilation or Hermes exports.

## Performance and artwork limits

[Performance evidence](performance.md) confirms immediate annual saving feedback and read-only phase observations. No simulation CPU speedup is claimed. Release-mode median/p95 at ages 18, 23, 30, 50 and 70, visible paint, native accessibility and the full physical-device playthrough matrix remain open.

[Artwork manifest](../../planning/V2_POLISH_ARTWORK.md) identifies the missing original hobby and Cell Escape layers and their integration locations. Existing art and the functional native escape scene remain in use. The generation batch awaits the previously requested Krea cost-preflight approval; it is not reported as delivered. The shop itself reuses existing illustrations as required.
