# Opening experience: priority and completion estimates

The user redirected priority on 19 October 2026 after reporting a real startup
crash and substantial differences from the supplied designs. Complete the
opening path before resuming pets, hobbies or other later features.

## Current assessment

The complete production scope is approximately **50% complete**. These are
conservative effort estimates, not measured screen acceptance scores. Passing
mechanics tests does not establish visual fidelity or device readiness.

| Area | Estimate | Remaining work |
| --- | ---: | --- |
| Onboarding and creation | 45% baseline | Welcome hero, distinct custom/random routes, appearance grid, fuller birth introduction, device review |
| Life screen and early childhood | 55% baseline | Reference layout, first-year guidance, meaningful early content, native interactions |
| Core simulation and Age Up | 80% | Broad system integration, long-life balance and performance |
| Saves/recovery/export/import | 80% | Native picker/share, large archives and release acceptance |
| Education and ordinary work | 70% | School contacts, scholarships, deeper school/remediation paths and native acceptance |
| Relationships/family/inheritance | 75% | Broader autonomous-life depth, integrated scenarios and device acceptance |
| Assets and finances | 80% | Balance, broad integration and native acceptance |
| Health and crime/legal | 70% | Rule-source verification, balance, integrated scenarios and native acceptance |
| Special careers/businesses | 70% | Breadth of stories, balance, integrated journeys and device acceptance |
| Travel/emigration | 75% | Native acceptance, country-source verification and broader scenarios |
| Pets/hobbies/entertainment | 5% | Paused, unintegrated work; persistent gameplay and native surfaces still pending |
| Extras/achievements/challenges | 25% | Most extras and factual progress/unlock surfaces |
| Distinct situational stories | 9% | 22 of at least 250 shipped; system acknowledgements do not count |
| Visual fidelity/polish | 50% | Matched-viewport native comparison, missing artwork/flows and accessibility polish |
| Device/release readiness | 10% | Actual Android/iOS journeys, native builds, performance and release gates |

These baseline estimates are retained until the corresponding opening checks
are completed; a hotfix or generated illustration alone does not advance them.

## Order of work

1. **Startup reliability.** Fix the `Intl`/BigInt crash with exact money display.
   Reproduce Number-only Intl in regression checks, including real SQLite
   creation and newborn acknowledgement failure/retry. Hotfix `0a44fc0` is
   pushed to `work`; 694 tests/48 suites, types and Android/iOS bundles pass.
2. **Welcome.** Match the hero composition in
   [reference 04](../design/04-full-app-screen-overview.png): original background,
   native title/buttons, distinct custom/random starts, continue and saved lives,
   loading and retry states. No paywall or cloud account.
3. **Creation and appearance.** Use the compact identity/location structure in
   [reference 02](../design/02-onboarding-life-dashboard-age-up-profile.png) and
   the four-column avatar/appearance tabs in
   [reference 01](../design/01-character-appearance.png). Preserve the draft
   across navigation; edits must reach the actual saved person. Keep optional
   family preferences accessible without requiring them for the basic path.
4. **Newborn and first Life screen.** Follow
   [birth.png](../design/birth.png): actual date/location, nationality, gender,
   existing parents, hometown, one-time Begin Life, compact identity/balance,
   all five stat bars, chronological factual journal, green Age Up and menu.
   Verify first-year progression, decisions, durable retries and cold resume.
5. **Android opening acceptance.** Build and run the real app, capture these
   screens at a matched viewport, fix layout/runtime problems and exercise
   custom creation, random creation, first Age Up and resume. Official SDK and
   a software Android emulator are being configured; no native pass is claimed
   until the app runs. iOS native acceptance still requires macOS/device access.
6. **Resume the broader backlog.** Pets/hobbies, education/contact depth,
   extras, at least 250 reviewed stories, remaining art and complete release
   gates remain part of the original goal.

## Review gate

The opening milestone is ready for review only after the complete path works,
the supplied layouts have been compared to real app captures, and remaining
platform limitations are stated. Commit and push a tested checkpoint before
moving on. Update this document with actual evidence rather than replacing
unrun checks with a percentage.


## Current implementation and verification

- Welcome, custom/random previews, shared draft navigation, sixteen avatar presets and appearance tabs, actual newborn identity/family details, the compact five-stat Life screen, chronological journal, fixed Age Up and working menu are implemented in the current opening changes.
- The custom navigation test selects an avatar, changes skin/hair/colour and country/city, persists that exact person, acknowledges birth, retries a failed first Age Up, finishes the actual first year and resumes the same life cold. Random reroll/customisation and preserving an existing life also have connected real-SQLite checks. These are native-component tests, not Android screenshots.
- The SDK build caught an indirect `expo-font` 58 dependency in the Expo 57 project. It is now an explicit SDK-aligned `~57.0.4` dependency. Unused `expo-blur` was removed; the app's existing modal backdrop uses no BlurView and does not claim a blur implementation.
- Official Android tools, Java toolchains and a software Android 15 emulator were installed. The emulator boots. The real debug app build remains blocked at the required React Native 0.86.3 AAR download: Maven redirects to `repo.reactnative.dev`, and the active network proxy returns HTTP 403. Both debug and release artifact requests are blocked. The exact domain was added to the saved environment configuration draft; the configuration tool reports that Review/Save/Publish is required before the policy applies. No actual-app Android or iOS visual pass is claimed.
- The complete **697-test / 49-suite** regression, strict application/test typing, offline SDK-version alignment and fresh Android/iOS Hermes bundles (5.0/4.7 MB, 45 assets) pass. Current Android/iOS Metro manifests/source bundles also return HTTP200 with the new opening code. Baseline percentage estimates remain conservative until native review is possible.
