# Dreams permanent purchases

Implemented on `v2`. Purchases use `react-native-purchases` 11.0.0 with Expo SDK 58 / React Native 0.88. The SDK autolinks in native development/release builds; no extra Expo config plugin is required. Expo Go and builds without a public SDK key show an unavailable store while free gameplay continues.

## Catalogue and dashboard setup

Create these **non-consumable / one-time** products in both stores. IDs must match exactly. Prices below are UK targets for your dashboard setup; the app displays the store's localized `priceString`, preserving decimal places. There are no subscriptions, consumables, upgrades, offers or discount calculations.

| Apple and Google product ID | Name | UK target | RevenueCat entitlements attached |
| --- | --- | --- | --- |
| `dreams.athlete` | Athlete Career | £9.99 | `athlete` |
| `dreams.astronaut` | Astronaut Career | £9.99 | `astronaut` |
| `dreams.cult` | Cult Leader Career | £9.99 | `cult` |
| `dreams.military` | Military Career | £9.99 | `military` |
| `dreams.god_mode` | God Mode | £9.99 | `god_mode` |
| `dreams.time_machine` | Unlimited Time Machine | £7.99 | `time_machine` |
| `dreams.career_pass` | All Careers Pass | £24.99 | `athlete`, `astronaut`, `cult`, `military` |
| `dreams.full_unlock` | Full Unlock | £29.99 | All six above |

1. **App Store Connect:** use the existing `com.yacoobali.lifesim` app. Complete paid-app agreements, tax and banking. In In-App Purchases, create the eight Non-Consumables above, with exact IDs, reference names, localized names/descriptions, availability, prices and required review screenshots. Select appropriate international prices. Add purchases to the app submission when you later submit. This implementation does not publish or submit anything.
2. **Google Play Console:** use the app with package `com.yacoobali.lifesim`. Complete payments setup. Under Monetize with Play → Products → One-time products, create the same eight IDs. Use one active, backwards-compatible Buy purchase option per product (not Rent), keep purchases non-consumable, activate it in the intended regions, and set localized pricing. RevenueCat's SDK handles acknowledgement; the app never consumes a purchase. Upload a billing-enabled build to an internal test track when ready, enroll testers and configure license testing. Do not create subscription plans or consumable credit products.
3. **RevenueCat project:** add/connect the Apple and Google apps for those bundle/package IDs. Supply the required App Store Connect in-app purchase key / issuer / key ID and Google Play service-account credentials through the dashboards, following RevenueCat's store-connection checks. Configure store server notifications / real-time developer notifications for timely refunds and revocations. Never place those secret credentials in this repository or client app.
4. **RevenueCat entitlements:** create exactly `athlete`, `astronaut`, `cult`, `military`, `god_mode`, `time_machine`. Import each Apple and Google product. Attach it to every entitlement listed in its table row, on both platforms. Bundles grant multiple feature entitlements; there are no separate `career_pass` or `full_unlock` entitlement IDs.
5. **RevenueCat offering:** optionally create offering `default`, mark it Current and add eight custom packages. Recommended package identifiers: `athlete`, `astronaut`, `cult`, `military`, `god_mode`, `time_machine`, `career_pass`, `full_unlock`; pair the Apple and Google product in each package using the matching table ID. **Runtime fetches the exact product IDs via `getProducts(..., NON_SUBSCRIPTION)` and purchases store products directly, so offering/package identifiers are not a runtime dependency.** This avoids subscription-style packages and makes product availability independent of the current offering. No special upgrade offering is used.
6. **Public app keys:** the Dreams Apple and Google public SDK keys are bundled in `app.json` under `expo.extra.revenueCat.iosApiKey` / `androidApiKey`. `src/purchases/native.ts` uses the appropriate key per platform. Optional `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` environment variables take precedence for other build environments; they are not fields named this way in app.json. Unset overrides use the bundled defaults. A wrong-platform, placeholder or secret-key override disables billing rather than silently using another app. See [the environment example](../.env.example). Rebuild after changing keys; never bundle secret REST keys or store credentials.
7. **Native builds:** run `npm ci`, then create a fresh Expo development build or EAS internal build. Installing the JavaScript update alone cannot add native billing to an older binary. Build iOS on macOS/EAS and Android with its configured SDK/EAS. Local Android releases still use `npx expo run:android --variant release`. Every build requires verified ownership for premium features. Three-tap internal controls remain available in configured internal builds and development, but their saved toggle cannot grant paid access.
8. **Sandbox acceptance:** in App Store Connect → Users and Access → Sandbox, create sandbox testers for native development builds; use the device’s sandbox account settings when requested. TestFlight purchases also use the sandbox. On Google Play, enroll the test store account in both license testing and the internal track, and install through that track. On each platform test every product and both bundles, cancellation, declined/pending payments, rapid taps, restoration on a new install, existing and changed store accounts, background/foreground updates, a verified cache offline/cold start, and refund/revocation after refresh. Check exact localized decimal prices in multiple regions. Verify each purchase resumes its selected flow and never buys an already-owned feature through a bundle. These require real store configuration and devices; mocked component/service tests are not sandbox transactions.

No registration or monetisation backend is added. RevenueCat uses its anonymous app-user identity; do not add `logOut` or generate a new identity on life creation. Purchases apply across lives. Restore uses the current Apple/Google store account. Cross-platform identity linking without an app account is not promised. Keep RevenueCat's restore/transfer policy appropriate for your desired reinstall/account-change behavior and verify it during sandbox acceptance.

## Entry points and restrictions

- **Dreams Store:** Settings and Extras. Full Unlock is featured, then All Careers Pass and six individual unlocks; owned features include bundle grants. Every surface includes restore, refresh and unavailable/error/loading states.
- **Athlete:** Review Tryout before opening the career confirmation.
- **Astronaut / Military:** Review Service Application before the service confirmation. The selected branch stays in place.
- **Cult:** Review Founding before the existing founding confirmation. The cult name, beliefs, fees and headquarters stay in place.
- **God Mode:** Settings/Extras or the direct editor route. Offers God Mode and Full Unlock. Royal Family selection in New Life offers the same purchases and retains the draft.
- **Time Machine:** selecting a checkpoint to restore offers Unlimited Time Machine and Full Unlock. Purchase returns to that checkpoint's normal restore confirmation.

Career pages, requirements and training remain free. Athlete/service paywalls offer that individual career, Career Pass and Full Unlock; cult does the same. There are no startup, random-event or Age Up paywalls.

Command checks in `src/state/gameStore.ts` protect career entry, royal selection, God Mode edits and restores independently of buttons or navigation. `src/purchases/access.ts` keeps command classification outside the simulation. No simulation RNG, money system, save schema or migration markers change. Seeded natural royal births and marriage into royalty remain free; deliberate royal selection is checked at creation as well as in the UI.

Active and between-contract careers for the current character retain their existing career flow, assignments and renewal eligibility. Left/retired/discharged careers need ownership to start again. Other actions, historical records, imported lives, branches, recovery, saving, death and child continuation remain accessible. Existing God Mode edits are never reversed. Checkpoints are not touched by the purchase service; branching uses the existing repository transaction only after access and the normal confirmation.

## Purchase and access behavior

A single purchase service accepts customer info only from RevenueCat. Trusted entitlement verification is enabled; only `VERIFIED` / `VERIFIED_ON_DEVICE` customer information grants access. It resolves the six **active entitlements**, not editable preferences, receipts embedded in saves or local product flags. Store product ownership is derived by checking that all of its feature entitlements are owned. This also prevents buying an individual feature already provided by a bundle.

Customer-info updates apply immediately. Foreground refresh uses the SDK's cache policy; SDK-supported verified offline customer info is accepted, and temporary refresh failures preserve already-verified in-memory access. A fresh install without cached verification cannot gain paid access offline. An authoritative customer update replaces the entire ownership set, so revoked/refunded features disappear when RevenueCat reports them. There is no second persisted entitlement cache or indefinite local unlock. Active-career continuation remains allowed by the save-compatibility rule.

An operation lock blocks duplicate purchases/restores. Cancellation and failure retain the pending UI action. Completion is emitted only after returned customer information grants the product's features. Restore updates ownership and resumes a waiting feature flow if entitled. A stale/unmounted life context cannot resume a retained action. Successful career purchases open the original confirmation instead of automatically executing a gameplay command or spending in-game money.

`src/purchases/analytics.ts` provides an optional in-process event subscriber, with paywall/store/product/purchase/restore events, product IDs, triggers and ownership state. It installs no provider and sends no data. Save contents and personal information are excluded.

## Premium testing override (disabled)

All six premium features now require verified RevenueCat ownership in every build. `app.config.cjs` overwrites old unlock metadata with `unlockAllTesting=false` / `unlockAllTestingBuild=null`; the runtime also ignores old true metadata. Every EAS profile explicitly sets `DREAMS_UNLOCK_ALL_TESTING=0`. Setting this legacy flag to `1` no longer grants access, even in development.

The base game remains free. Existing saves, committed God Mode edits and active-career continuation retain the compatibility policy above. No purchase ownership is written into saves or preferences. Three quick App Preferences taps still reveal internal controls; God Mode editing and deliberate royal selection require God Mode or Full Unlock ownership. Practice and opt-in profiling remain separate internal tools.

Pull the updated branch, stop Metro and rebuild/reinstall the native app. A previously installed release binary retains its old code until updated. For Metro development, restart with `npx expo start -c`. Test real purchases with Apple sandbox/TestFlight or Play testing and license-test accounts, without restoring a free-access flag.

## Live RevenueCat audit — 15 November 2026

Read-only inspection of **Dreams: Life Simulator** (`proj3dfa17e8`) found:

| Check | Observed result / remaining work |
| --- | --- |
| App identity | Apple `app7a940b1397` and Google `appe262ca8fdf` both use `com.yacoobali.lifesim`, matching the production app. |
| Public SDK keys | Both keys supplied by the owner exactly match these RevenueCat apps. Now bundled in app.json, so no EAS public-key environment variables are required unless overriding them. |
| Store connections | Apple App Store Connect and in-app purchase keys are marked configured; Google Play service-account credentials are marked configured. These flags alone do not prove all permissions or server notifications are valid. |
| Entitlements | All six exact feature IDs exist and their Apple individual/bundle mappings match the catalogue above. The inactive `dreams_life_simulator_pro` entitlement is unused by this app. |
| Android catalogue | **Zero Google Play products registered in RevenueCat.** Confirm/create the eight one-time, non-consumable products above in Play Console, activate Buy options and regional prices, then import all eight into the Google RevenueCat app and attach the same entitlement mappings. Apple products do not grant Android purchases automatically. |
| Apple store status | All eight real App Store Connect products report **`needs_action` / `MISSING_METADATA`**. Their review information is null. Complete required metadata/review screenshots and resolve App Store Connect's remaining fields; prices and basic en-US names/descriptions already exist. Recheck the live store status before submission/testing. |
| Offering/packages | The app fetches exact permanent-product IDs directly. An offering or hosted paywall is optional and does not fix missing products or entitlement mappings. |
| Device acceptance | Still required: a Play-installed testing build/license tester and an Apple sandbox/TestFlight tester, purchase + restore for each SKU/bundle, cancellation/pending/refund behavior, and matching active entitlements in RevenueCat. No live transaction was made during this audit. |

No more SDK keys or private credentials are needed from the owner for the code configuration. The remaining information needed to verify transactions is: the eight Android product IDs and their active purchase-option/region status (confirm whether the IDs above already exist in Play Console), completed Apple metadata status, the test track/account used, and a RevenueCat App User ID plus native SDK logs from a test purchase/restore. Keep service-account JSON, Apple p8 files, store-account passwords and secret API keys in their dashboards.

This audit made no dashboard/store writes and submitted no products for review.

## Implementation files

- `src/purchases/`: typed catalogue, SDK adapter, central service, resolver/hooks, command classification, purchase UI, contextual action retention, app lifecycle and analytics.
- `app/store.tsx`, `app/_layout.tsx`, Settings, Extras, New Life, Time Machine: discovery, initialization/foreground refresh and contextual entry points.
- Career/Cult review helpers, God Mode access/editor and the internal mini-game playground: return-to-action integration and separated testing access.
- Game store/runtime, `app.config.cjs`, `eas.json`, dependency manifests and `.env.example`: enforcement, public-build configuration and native SDK wiring.
- `tests/purchases/` plus existing licensed-player save/UI fixtures and release-config tests: new purchase coverage and regression compatibility.

## Verification scope

The purchase suites use mocked native billing responses, real service/hook/UI behavior, and real SQLite for command/save protection. They do not perform store sandbox transactions. Native autolinking detects the Android `RNPurchasesPackage` and the iOS `RNPurchases.podspec` (11.0.0).

No signed APK/AAB/IPA, real purchase, sandbox restore, refund notification or physical-device interaction is claimed. This Linux workspace has no configured Android SDK or Apple toolchain; Hermes exports and autolinking are not native compilation. The long 120-life soak was stopped after four completed lives to focus resources on the full regression suite, which includes its own 12-life invariant sweep. It is not recorded as a passed 120-life soak.

## Paid-lock verification — 15 November 2026

- 245 tests pass across 16 focused suites: purchase service/native adapter/UI/navigation, all six feature locks and bundles, revocation, save protection, internal three-tap controls, real runtime ownership enforcement, build guards and Android repair configuration. Native billing is mocked. The final access-test cleanup also passes all 36 cases.
- Strict application/test TypeScript and the 624-module runtime import check pass with zero cycles.
- Actual Expo public production config includes the supplied platform SDK keys, retains `com.yacoobali.lifesim` and resolves premium testing, hidden internal tools and profiling flags to false even with old environment switches set to `1`.
- Production Android and iOS Metro/Hermes exports pass, with both bytecode headers verified and legacy testing switches deliberately set to `1` during export. Expo telemetry was disabled because this workspace has no writable default Expo home.
- The live audit above is read-only. No signed build, installed-device purchase, restore or refund was performed; device/sandbox acceptance remains outstanding.

## Automated results — 29 October 2026

| Check | Actual result |
| --- | --- |
| `npm run typecheck` | Strict app and test types pass. |
| `npx jest tests/purchases --runInBand --silent` | 45/45 new tests pass: all eight products, independent/bundle ownership, restore, cancellation/failure, repeated taps, missing config, verification, offline cache, revocation, command/save guards and contextual UI continuation. Billing is mocked. |
| `npx jest --maxWorkers=4 --silent` plus focused reruns | 342 suites / 5,458 unique cases covered with passing results after reruns. The initial full invocation had 336 passing suites and six failures (5,451 passing cases / seven failures). Four existing UI fixtures needed explicit licensed-player access; the editorial source-observation hashes needed updating for the changed store/state/lockfile; one statistics case timed out under concurrent CPU load. All six affected suites pass on focused reruns. No unresolved failures remain. This is not a claim of one clean full invocation. |
| Existing engine invariant sweep | The full regression's 12 complete seeded lives pass. The separate 120-life soak was stopped after four completed lives and did not finish. |
| `npm run check:imports` | 524 runtime modules; zero import cycles. |
| `node tools/generate-third-party-notices.cjs --check` | Pass; dependency/license inventory updated for RevenueCat with zero installed version mismatches. |
| Expo native autolinking | `react-native-purchases` is registered for Android and iOS, version 11.0.0. |
| `expo export --platform all --max-workers 1` | Final-source Android and iOS Hermes exports pass, with no live store keys. |
| `git diff --check` | Pass. |

The six resolved full-run suites are `lifetime-statistics-flow`, `royalty-review-save-flow`, `onboarding-haptics-flow`, `editorial-policy`, `service-context-flow` and `time-machine-flow`. The original C35 historical registration and all saved fixtures remain unchanged; only observations of current source hashes were updated. Existing editor/save/finance checks also pass (96 cases across four focused suites).

## Exact changed-file list

- `.env.example`
- `.gitignore`
- `README.md`
- `THIRD_PARTY_NOTICES.md`
- `app.config.cjs`
- `app/(game)/extras.tsx`
- `app/_layout.tsx`
- `app/new-life.tsx`
- `app/settings.tsx`
- `app/store.tsx`
- `app/time-machine.tsx`
- `docs/GOD_MODE.md`
- `docs/HANDOFF.md`
- `docs/MINIGAMES.md`
- `docs/MONETISATION.md`
- `docs/third-party-inventory.json`
- `eas.json`
- `package-lock.json`
- `package.json`
- `src/access/godMode.ts`
- `src/game/godMode.ts`
- `src/minigames/MiniGamePlayground.tsx`
- `src/purchases/PurchaseLifecycle.tsx`
- `src/purchases/PurchaseUI.tsx`
- `src/purchases/access.ts`
- `src/purchases/analytics.ts`
- `src/purchases/catalog.ts`
- `src/purchases/hooks.ts`
- `src/purchases/native.ts`
- `src/purchases/service.ts`
- `src/state/gameStore.ts`
- `src/state/useGame.ts`
- `src/ui/CareerReview.tsx`
- `src/ui/CultDialog.tsx`
- `src/ui/GodModeAccess.tsx`
- `src/ui/GodModeEditor.tsx`
- `src/ui/annualFinances.ts`
- `tests/config/release-config.test.ts`
- `tests/game/editorial-policy.test.ts`
- `tests/purchases/access.test.ts`
- `tests/purchases/native.test.ts`
- `tests/purchases/service.test.ts`
- `tests/purchases/ui.test.tsx`
- `tests/state/god-mode-access.test.ts`
- `tests/support/native-ui.cjs`
- `tests/ui/astronaut-career-acceptance-flow.test.tsx`
- `tests/ui/athlete-career-acceptance.test.tsx`
- `tests/ui/cult-flow.test.tsx`
- `tests/ui/god-mode-flow.test.tsx`
- `tests/ui/minigame-flow.test.tsx`
- `tests/ui/onboarding-haptics-flow.test.tsx`
- `tests/ui/royalty-flow.test.tsx`
- `tests/ui/royalty-review-save-flow.test.tsx`
- `tests/ui/saved-files-flow.test.tsx`
- `tests/ui/service-context-flow.test.tsx`
- `tests/ui/service-flow.test.tsx`
- `tests/ui/time-machine-flow.test.tsx`
