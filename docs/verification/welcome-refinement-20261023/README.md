# Welcome refinement — 23 October 2026

The native SVG motif now has 7-unit main branches, heavier lower branches, larger symbol badges and warm white symbols on restrained gold, rose and mint fills. It reuses the original image-generation concept; no new bitmap is loaded. The welcome background uses a subtle diagonal navy gradient.

Returning players see “Continue as [full name]” beneath Continue Life. The caption can wrap and follows accessibility text scaling. Start New Life has a stronger blue border and tint, pale blue text and a plus icon while remaining secondary to Continue. Compact spacing keeps all life actions visible at standard text size on a 320 × 568 phone. Larger text uses the existing scroll container. The ink cinematic, navigation, loading/error handling and saves are unchanged.

## Captures

These are Chromium / React Native Web captures of the production welcome components after the ink reveal, using the existing read-only archived save fixture. They are not Android or iOS device captures. Light/dark device settings are exercised through the real theme provider; fixed safe-area insets and the 2× text-metric adapter approximate native layout. Native large-text fidelity remains unverified.

- [New player](new-phone.png), [returning player](returning-phone.png)
- Small phone: [new](new-small.png), [returning](returning-small.png)
- [Tall phone](returning-tall.png)
- Tablet: [new](new-tablet.png), [returning](returning-tablet.png)
- Large text: [new](new-large-text.png), [new scrolled](new-large-text-scrolled.png), [returning](returning-large-text.png), [returning scrolled](returning-large-text-scrolled.png)
- [Loading](loading-phone.png), [error/retry](error-phone.png)

The capture run checks at least 44px button heights, horizontal bounds, no horizontal page overflow and all life actions visible above the bottom safe area at standard text size. Continue, Start New Life, Random Life and Help were clicked and their routes checked. All eleven scenarios passed with no browser page errors. [captures.json](captures.json) records bounds, routes and source hashes.

## Checks

- `npm run typecheck`: production and test types passed.
- `npm run check:imports`: 488 modules, no runtime import cycles.
- Seven relevant Jest suites: **35 tests passed**, including welcome, onboarding, accessibility, haptics, scene motion, ink transitions and startup. Existing welcome assertions now check the visible active-life name and its ability to wrap and scale.
- `git diff --check`: passed.

Reproduce the captures with `node tools/preview-welcome.cjs /tmp/dreams-welcome-refinement`. Temporary browser tooling and native-runtime limitations are documented in the [original welcome verification](../welcome-redesign-20261023/README.md).
