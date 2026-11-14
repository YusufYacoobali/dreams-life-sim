# Dreams Shop integration verification

Branch: `v2`. Starting source: `05cd38aa`. Application source under test: `4538a374`. Later verification documentation does not change the application.

## Scope and preserved boundaries

- Activities begins with a compact crown card, Dreams Shop, and the requested subtitle. Its `/shop` destination retains Activities navigation. Existing Extras and Settings links remain.
- Locked Athlete, Astronaut, Military and Cult Leader discovery opens the existing three-benefit product detail with localized price and relevant individual/bundle choices. Explore Career and successful verified access open the chosen page after closing the native popup. Neither path starts a job, changes qualifications or spends game money.
- Existing active/between Athlete/service careers and active Cult leadership bypass discovery gating. Testing access uses the existing override without marking ownership. Actor, Model, Musician, Business Owner, Organised Crime and the other free destinations retain their ordinary routes.
- God Mode, checkpoint restoration, tryout/application/founding and Royal Family entry keep their existing permission checks. Checkpoint browsing/saving stays free. Original pending UI actions return to their normal confirmation, with native presentation/dismissal ordering and stale/revoked/busy context protection.
- Product IDs, entitlement mappings, RevenueCat adapter/service, price fetching, shop layout/content/artwork, saved state, resolvers and persistence are unchanged. The extracted access helper shares the original career predicates and keeps ownership checks separate, including storage-wait revocation protection.

The only new dependency is official SDK-matched `expo-blur ~58.0.6` (installed 58.0.6), with no new transitive dependencies. Native iOS blur is optional, guarded against missing/failed native support and disabled by Reduce Transparency. Android/web use reliable dimming. All modal transitions retain reduced-motion support.

## Automated verification

| Check | Result |
| --- | --- |
| Focused purchases, native lifecycle, discovery, navigation, fixture transitions and historical registration | 12 suites / 194 tests pass |
| In-band open-handle diagnostic | 12 suites / 194 tests pass; no reported open handles; exit 0 |
| Strict application/test TypeScript | Pass |
| Runtime import check | 617 modules; zero cycles |
| Full regression | Pass; all 420 suites / 7,261 tests, exit 0 |
| Android production Hermes export | Pass; valid bytecode, 3,702 bundled modules |
| iOS production Hermes export | Pass; valid bytecode, 3,705 bundled modules |

The complete regression ran `npx jest --maxWorkers=3 --workerIdleMemoryLimit=1536MB --json` against the frozen application source and finished in 2,481.291 seconds (41.4 minutes), exit 0. All 420 suites / 7,261 tests passed in this single complete invocation, with zero skipped/todo/runtime-error suites. [Full result archive](regression.json.gz) and [verification summary/suite inventory](verification.json) retain exact counts and SHA-256 hashes. The standard engine suite also completes its default 12 seeded lives; no separate 120-life soak was requested or claimed for this UI-only follow-up.

Jest emitted one worker-shutdown warning after the assertions completed: “A worker process has failed to exit gracefully and has been force exited.” No new OOM event occurred, and no Jest parent/worker remained afterward. A focused `--runInBand --detectOpenHandles` diagnostic of all eight purchase suites plus fixture/editorial/crime/progression journeys passes all 194 tests across 12 suites, exits normally with code 0 and reports no open handles. [Diagnostic result archive](open-handles.json.gz) retains that evidence. This focused check does not identify which earlier suite caused the parallel shutdown warning. The original warning is preserved and is not described as an assertion failure or silently omitted.

The focused command is `npx jest --runInBand tests/purchases tests/game/premium-career-fixtures.test.ts tests/game/editorial-policy.test.ts`. The final focused run adds the existing Organised Crime and progression-continuation UI suites to that command: 194 cases across 12 suites, including all 176 purchase cases across eight suites. Supporting fixtures obtain real active and between-contract states through normal selection and annual commands, preserving original contracts, rolls, wage payments and work history. Only the current lockfile observation was refreshed for the deliberate Expo dependency; the historical C35 registration, frozen fixture bytes and saved outcome hashes are unchanged.

Discovery coverage checks every paid career, free viewing with a still-locked actual Athlete tryout, no save changes on browsing/purchasing, individual/bundle/restoration navigation, unrelated restored ownership, cancellation/unavailable products, repeated cross-career presses, owned/current careers, person/feature isolation, Cult leaders versus followers and testing on/off. Native lifecycle tests explicitly control iOS `onShow`/`onDismiss`, early cached ownership, cancellation before presentation, Android frames, stale/unmounted contexts, revocation and late callbacks. A held-purchase route-blur test also confirms that verified ownership can arrive without resurrecting old navigation or writing a save. They do not establish physical-device timing.

The [Android export proof](exports/android-export-proof.json), [iOS export proof](exports/ios-export-proof.json) and [production guard proof](exports/production-guard-proof.json) retain exact source/bundle hashes and successful guard results with all testing/profile environment variables deliberately set to `1`. Both exports contain the actual Expo Blur implementation. [Preserved source boundaries](preserved-boundaries.json) record unchanged gameplay, saves, provider/catalog/hooks, shop/artwork, navigation layouts and testing build configuration.

## Presentation and reference comparison

References are the three user-supplied main-shop, Full Unlock and Athlete popup images from the original shop request. The main shop and its existing crown/artwork, product order, Full Unlock banner and purple/blue button styling remain unchanged.

Source/component review confirms a lighter backdrop, no new glow/heavy shadow, safe-area bounds, a scrolling content body and persistent purchase CTA at 320 × 568 with 200% text. Secondary links move into the scroll body in compact layouts; ordinary large layouts retain their footer placement. The optional iOS blur uses intensity 20, and the light/dark fallback uses 32%/38% dimming. The references' example prices remain replaced by actual store strings; no static price or artificial ownership was added.

Expected differences from the supplied references, based on source/component inspection:

| Reference | Current behavior |
| --- | --- |
| Example US dollar prices | Exact localized provider strings; unavailable products stay unavailable, with no invented price |
| Organised Crime among paid examples | Four existing premium careers only; Organised Crime remains free through Special Careers |
| Blurred background | Guarded iOS blur where available; reliable lighter dim fallback on Android/unsupported builds |
| Footer text/secondary links always below CTA | Compact/large-text layouts scroll secondary links with the content while the purchase CTA stays fixed |
| Purple Full Unlock and blue individual buttons, crown/career artwork | Existing colors and approved artwork retained |

These are source/component observations, **not a completed native screenshot comparison**. Actual iOS/Android visual differences, native text geometry, focus/scroll behavior and blur appearance require device inspection. System-only emulator captures must not be presented as shop screenshots.

## Native visual and store sandbox acceptance

Native inspection is **not passed**. This Linux workspace has no Xcode or iOS device and no KVM. A fresh API29 software emulator reached boot completion in 279.5 seconds and answered package/window probes, but stayed on “Pixel is starting…” and could not open usable UI. Its [genuine system-only capture](native/android29-system-starting.png) is not a shop screenshot; [attempt proof](native/android29.json) records that no app was installed.

API35 used a different modern image with SwiftShader and Vulkan disabled. Host userdata initialization first delayed launch; an old watchdog then stopped its initial guest window prematurely. That run is [preserved as inconclusive](native/android35-premature.json). A corrected continuation completed its entire verified eight-minute guest budget, with no responsive ADB boot property, Settings focus or usable screenshot. [Final API35 evidence](native/android35.json) records the exact start/deadline and process cleanup. No current APK was built/repacked or installed, and no actual app screenshot comparison is claimed. Both attempts are stopped.

Real RevenueCat/store sandbox purchases are **not run** here: no configured RevenueCat public keys or authenticated Google/Apple store tester/device are available. No account was signed in, real payment attempted, or provider entitlement fabricated for visual inspection. Component tests use explicit test adapters at the existing provider boundary.

On working iOS and Android tester builds, disable premium/internal editing overrides and confirm the TEST MODE banner is absent. Compare Activities, main shop, Full Unlock and each career popup against the supplied references in Light/Dark, on a small screen and with increased text size. Check that the CTA stays visible, all secondary actions remain reachable, Reduce Motion/Reduce Transparency work, and screen readers announce the locked career and modal controls. Then verify actual individual/bundle purchase, cancellation and restoration in the configured store sandbox, followed by unchanged gameplay confirmation/requirements and no automatic in-game spending. Re-enable the testing override separately to check its normal bypass without ownership changes.
