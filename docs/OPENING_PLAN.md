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
| Onboarding and creation | 45% baseline | Native visual review, creation/newborn polish and device acceptance |
| Life screen and early childhood | 55% baseline | More early-story callbacks and native layout/interaction review |
| Core simulation and Age Up | 80% | Broad system integration, long-life balance and performance |
| Saves/recovery/export/import | 80% | Native picker/share, large archives and release acceptance |
| Education and ordinary work | 70% | Persistent school contacts implemented; scholarships, deeper school/remediation paths and native acceptance remain |
| Relationships/family/inheritance | 75% | Broader autonomous-life depth, integrated scenarios and device acceptance |
| Assets and finances | 80% | Balance, broad integration and native acceptance |
| Health and crime/legal | 70% | Rule-source verification, balance, integrated scenarios and native acceptance |
| Special careers/businesses | 70% | Breadth of stories, balance, integrated journeys and device acceptance |
| Travel/emigration | 75% | Native acceptance, country-source verification and broader scenarios |
| Pets/hobbies/entertainment | 5% | Paused, unintegrated work; persistent gameplay and native surfaces still pending |
| Extras/achievements/challenges | 25% | Most extras and factual progress/unlock surfaces |
| Distinct situational stories | 20% | 49 of at least 250 implemented; full coverage/editorial/release review remains open |
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
6. **Deepen childhood first.** Match the school page in [birth.png](../design/birth.png), connect persistent classmates/teachers, actual attended club practice, behaviour and reports, then expand distinct childhood stories. Continue this independent work while the Android download host remains unavailable.
7. **Resume the broader backlog.** Pets/hobbies, remaining education depth,
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

## School foundation

The reference school page now has connected Study Harder, Classmates, Teachers,
Extracurricular Activities and Behave in Class actions. A class and its qualified
teacher are generated once during actual school attendance, with persistent
portraits, relationships, real households and paid teacher/parent jobs. Opening
a screen, searching, importing or loading never generates contacts or progress.

One free school club practices during attended months and builds its actual
career skill. Classroom behaviour affects teacher trust and the report after
twelve attended months; the report uses the whole period’s behaviour, so changing
plans at the last minute cannot erase a disruptive year. Academic help saves its
chance, draw and actual bounded grade effect, once per attended school year.
Trips, hospitalisation and custody pause this school routine. Leaving school,
moving and death preserve the old class/report history. Existing public-school
completion rules are unchanged; failure/remediation and scholarships remain open.

World 21 / engine 20 adds empty school history to older saves. The genuine world-20
foreign-employment archive and its approved-move checkpoint retain people,
relocations, native earnings, saved FX, accounts, ledger and all random streams.
The full **717-test / 51-suite** regression passes, including twelve complete
seeded lives, all twelve school profiles, preserved contacts, monthly practice and
weighted reports, saved help outcomes and real SQLite failure/retry/cold-load
flows. Strict application/test typing, offline SDK metadata alignment, fresh
Android/iOS Hermes bundles (5.0/4.7 MB, 45 assets), and current Metro source
bundles for both platforms pass. No new native visual pass or
completion-percentage increase is claimed.

## Childhood story expansion

The working catalogue now contains 49 distinct situations: 22 existing templates
and 27 newly authored infant/childhood/school situations. First-year choices now
include three scenes that need no living parent, alongside the original cake
scene. The first Age Up guarantees an eligible choice without inventing a parent.
The catalogue count is about 20% of the 250 minimum; overall completion remains
approximately 50%, and the other baseline estimates are unchanged.

School stories bind saved classmates/teachers from the current local school;
absent, hospitalised, travelling or departed contacts are excluded. Choices can
change actual grades, skills and the existing relationships. A strengthened
classmate bond can become a friendship while retaining the classmate role and
the same person through later school years. Grade changes feed the existing
university admission rules and never award qualifications by themselves.

See [content coverage and limits](CONTENT_COVERAGE.md). Delayed callbacks, deeper
school paths, broad adult/system-specific stories and native visual review are
still pending. The complete **763-test / 53-suite** regression, strict typing,
fresh Android/iOS production bundles and current Metro source checks pass.
The tested story code is pushed in `2f25f5e`.

## Startup compatibility hotfix: missing formatToParts

The user reported that Begin Life still crashed because the device’s NumberFormat
implementation has no `formatToParts`. The previous BigInt-only compatibility
check was insufficient. Reported startup issues now take priority over further
features so the development build is playable while the game is built. The
uncommitted callback work is preserved outside the active source and paused.

The money formatter now requires only `.format(Number)`, probes safe small values
for locale conventions, and builds the actual arbitrary-size balance from exact
BigInt digits. It never calls `formatToParts` or needs `signDisplay`/`resolvedOptions`.
A missing/unusable Intl constructor falls back to an exact readable amount.
Grouping, decimal placement, currency affixes, explicit signs, non-Latin digits
and JPY zero-decimal amounts remain covered. No save schema or gameplay changes
are included in this hotfix.

The format-only runtime check now follows real creation→Begin Life→first Age Up→
choice/result→SQLite save→cold resume, then opens Assets, Relationships and
Activities. The 38 focused checks, strict typing, both production Hermes bundles
and both current Metro bundles pass. The full regression is running separately.
Native hardware acceptance remains pending; the user’s exact missing-method
limitation is reproduced by the tests.
