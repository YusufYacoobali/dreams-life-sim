# Welcome redesign — 23 October 2026

The welcome page uses a solid navy surface, a compact native SVG branching-path motif and centred Dreams / Life Simulator branding. Continue Life is primary when a life is available; Start New Life is primary otherwise. Random Life remains available. Help is an icon with a 44px touch target in the top-right corner.

The scenery asset, tagline, welcome-only Saved Lives action and footer are removed. The existing root ink cinematic, its assets and startup logic are unchanged. Saved Lives remains under Activities. No game, store, persistence, creation-page or other game-screen code is changed by this redesign.

Image generation supplied the small motif concept; its heart, star and leaf were rebuilt with native SVG paths and circles. The screen does not load the generated bitmap. Krea was not used.

## Captures

These are Chromium / React Native Web renders of the production `app/index.tsx` and `OpeningScene.tsx`, after the ink reveal. They are not Android or iOS device captures. The harness uses an actual archived saved-world fixture decoded by the current engine for returning-player views; its read-only state, route recorder, icon-font loader and fixed safe-area insets are browser adapters. Device colour schemes and the real theme provider are exercised. The 2× text-metric adapter approximates native font scaling and the logo's fit behaviour; it does not establish native large-text fidelity.

| View | Logical viewport | Capture |
| --- | --- | --- |
| New player, light settings | 390 × 844 | [New player](new-phone.png) |
| Returning player, dark settings | 390 × 844 | [Returning player](returning-phone.png) |
| Small phone, new player | 320 × 568 | [Small phone](new-small.png) |
| Small phone, returning player | 320 × 568 | [Small returning](returning-small.png) |
| Tall phone | 430 × 932 | [Tall phone](returning-tall.png) |
| Tablet, light settings | 768 × 1024 | [Tablet](new-tablet.png) |
| Tablet, dark settings | 1024 × 1366 | [Returning tablet](returning-tablet.png) |
| Small phone, 2× text metrics | 320 × 568 | [Top](returning-large-text.png), [scrolled actions](returning-large-text-scrolled.png) |
| New player, 2× text metrics | 390 × 844 | [Top](new-large-text.png), [scrolled actions](new-large-text-scrolled.png) |
| Loading | 390 × 844 | [Loading](loading-phone.png) |
| Read failure / retry | 390 × 844 | [Error](error-phone.png) |

The capture run checks horizontal bounds, minimum 44px button heights and the absence of removed copy/actions. It clicks Continue, Start New Life, Random Life and Help and checks their recorded destinations. Large-text clicks scroll to the offscreen actions. No browser page errors occurred. Exact dimensions, button bounds, routes and source hashes are in [captures.json](captures.json).

## Checks

- `npm run typecheck`: passed for production and tests.
- `npm run check:imports`: passed; no runtime import cycles.
- Ten relevant Jest suites: **47 tests passed**. Coverage includes birth/living/completed-life Continue routes, real SQLite saves staying unchanged, Help content, creation and random previews, failure/retry and busy gates, haptics, the existing ink cinematic and startup lifecycle.
- `node tools/generate-third-party-notices.cjs --check`: passed. The asset inventory no longer references the removed scenery file. The current branch already supplies the matching native SVG dependency; no dependency versions changed in this redesign.

The current upstream `work` branch was integrated before the final checks and captures. Historical files and captures elsewhere are retained as evidence of their original versions.

## Reproduce

```sh
npm ci
npm install --prefix /tmp/dreams-welcome-preview --no-audit --no-fund esbuild@0.25.11 react-native-web@0.21.2
node tools/preview-welcome.cjs /tmp/dreams-welcome-captures
npm run typecheck
npm run check:imports
node node_modules/jest/bin/jest.js tests/ui/welcome-screen.test.tsx tests/ui/onboarding-flow.test.tsx tests/ui/onboarding-accessibility-flow.test.tsx tests/ui/onboarding-haptics-flow.test.tsx tests/ui/scene-motion.test.tsx tests/ui/settings-flow.test.tsx tests/persistence/opening-migration.test.ts tests/ui/cinematic-assets.test.ts tests/ui/cinematic-transition.test.tsx tests/ui/startup-flow.test.tsx --maxWorkers=3
```

The preview tool uses installed Playwright and `/usr/bin/chromium`; `DREAMS_PREVIEW_MODULES` can select another temporary installation directory. Browser tooling is not added to the app's dependencies.
