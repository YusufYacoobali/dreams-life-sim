# Validation results

Current polish preserves the newer `e460be8` cinematic-playback update from remote `work` and builds on the `016cbbf` avatar overhaul. TypeScript and the final targeted run pass: **11 suites, 46 tests**, covering actual appearance controls, absent face-shape UI, independent clothing, SQLite reload, immutable facial identity, per-face/age hair fits, accessibility/memoization all onboarding journeys, runtime import architecture and the updated cinematic assets/transitions. The complete 1,966,080-combination local-layer/crop audit passes with a maximum of five image layers. The browser review includes 25 captures, a 184px clothing preview, all sixteen faces with each long-hair style and age comparisons. SVG clip IDs are namespaced per capture instance and their references are checked. Android/iOS exports audit all 1,018 current PNG layers. The final neckline fitting data was followed by another passing appearance integration run (5 tests) and refreshed captures/exports. Native device rendering remains untested.

The earlier integration validation below is retained as historical coverage, not a claim that those broad suites were rerun for this polish.

Original integration base: `901ea01` from remote `work`. The existing ink cinematics, native worklet fixes and internal God Mode editor were preserved.

- `npm run typecheck`: passed, application and test TypeScript projects.
- `npm run check:imports`: passed, 393 runtime modules, zero cycles.
- Final targeted Jest run: **15 suites, 148 tests passed** in 75.393s. Covered avatar integration, all 1,966,080 layer combinations, portrait accessibility/memoization, appearance labels, new-life review, all three onboarding journeys, creation, save JSON, copied worlds, profile save flow, and upstream God Mode game/UI/save tests. This includes independent clothing selection and SQLite reload, legacy four-field records, stable identity after renames and hair changes, and no artwork-related game RNG draws.
- Artwork validator: all source/hash/dimension/alpha, contour, skin-order and natural-colour fidelity checks passed.
- Runtime audit: all 1,966,080 combinations resolve local layers within actual image crop bounds, with at most seven images. All 29 entity portrait consumers include immutable person IDs.
- Browser capture audit: twenty comparison/gallery/production-screen captures; all images decode, no document overflow at desktop or 390px width, no browser errors or HTTP image requests. Actual creation grid has sixteen cells in four rows of four.
- Android and iOS offline Expo exports passed. Each platform's exported artwork was audited against all 1,084 source layer hashes and dimensions. Obsolete V1 portrait assets are not bundled.
- `git diff --check`: passed.

Earlier broad regression run on the implementation before the latest upstream rebase: 233 suites / 3,107 tests, with 232 suites and 3,106 tests passing. Its only failure was the old Avatar 7 accessible-description expectation after the approved artwork changed that preset's traits. The expectation was corrected and that suite passed on rerun. It is also included in the final passing targeted run. The entire 33-minute suite was not repeated after later changes.

A subsequent integration run on `2668ad4` passed 23 suites / 86 tests, including runtime architecture, cinematic transitions/native worklets, cinematic death saving, startup, Life motion, relationships, contacts, family, legacy, saved-life previews and the avatar/save/onboarding suites. The final run above additionally checks the new `901ea01` God Mode work and clothing functionality.

These checks do not establish native-device rendering, GPU timing or on-device memory. Browser screenshots use the documented CSS adapter of production React Native trees; platform exports check JavaScript/assets rather than native builds. No Android emulator, iOS simulator or physical device was available.
