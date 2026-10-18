# Dreams: Life Simulator — progress and verification

Updated 18 October 2026.

## Goal and authorisation

Build the complete production-quality game described in the [master specification](planning/source-specification.md) and [implementation plan](planning/MASTER_PLAN.md), not only the first playable life. The user approves the overall direction, with a specific prerequisite: reconcile all supplied design screenshots first.

After reconciliation, work autonomously through the phases. Each milestone must be implemented, tested, corrected, documented here, and committed in a working state before advancing. Stop only for material product decisions, genuine blocking dependencies, or unavailable tools. Ordinary implementation choices do not need repeated approval.

Confirmed product choices: adults with non-graphic mature themes, and a wider international selection at launch. The current country proposal contains twelve countries and nine currencies; do not reduce launch scope to US/UK without a product decision.

## Current milestone: core life progression and persistent event flow

The earlier missing-reference blocker was a stale checkout. Fetching origin/main at ed084db brought in all 27 supplied images under design/. Every image has now been opened and reviewed; the [design reconciliation](planning/design-reconciliation.md) records dimensions, provenance, canonical sources, overlaps and all conflict resolutions.

The user explicitly resolved the Premium/cloud reference in favour of a free, offline game with local saves/export/import. No further general plan approval is needed. Implementation can proceed under the existing full-game authorisation.

The reconciled inventory contains 79 canonical screen definitions. Added requirements include a full-screen newborn introduction, wills, family tree, custody/date selection, detailed property sale/mortgage actions, health subviews, criminal record/prison actions, black market, and Royalty/Astronaut/Military career paths. There are now eleven special paths and an initial 256-template event allocation.

The first birth-to-death engine is implemented. Continue through every remaining phase: this core loop is not the complete game. Running-app fidelity and device checks remain unverified until real captures/tests exist.

## Phase status

| Phase | Status | Evidence / remaining work |
| --- | --- | --- |
| 0 — Planning and reconciliation | Complete | Overall direction approved; all 27 images reviewed; conflicts resolved, including confirmed free/offline scope |
| 1 — Technical and visual foundation | In progress | Shared UI/modal structures, routed four-tab app, committed-state coordinator and transactional persistence; device and visual acceptance pending |
| 2 — Artwork and character creation | In progress | Twelve original generated illustrations registered; editable identity/country/city creation and persistent family; portrait layers/customisation/age continuity pending |
| 3 — Core playable life | In progress | Deterministic monthly/annual progression, persistent decisions/results, journal and terminal death; native-device acceptance and broader system integration pending |
| 4 — Core life systems | Not started | Education, work, relationships, family, finance, assets, and investments remain planned |
| 5 — Expanded gameplay | Not started | Health, crime/legal/prison, fame/social, companies, special careers, travel, pets, and hobbies remain planned |
| 6 — Content, depth, legacy, Time Machine | Not started | Nine prose event examples are planning samples; no shipped templates, coverage run, legacy, or restore system |
| 7 — Polish and release validation | Not started | No implemented game to compare or validate on devices |

## Feature status

| Feature family | Implemented | Verified |
| --- | --- | --- |
| Four-tab UI, Life dashboard, shared components and modal flows | Partial: routed app and nested family/profile/health views; five bars, factual journal and cash | Native components and native bundles verified; no device fidelity claim |
| Identity, custom/random creation, family, appearance and ageing | Partial: editable identity and deterministic random creation, actual parent links; DNA stored, initials remain temporary | Twelve-country creation tests pass; generated portraits and ageing pending |
| Seeded engine, resumable annual progression, stats and invariants | Partial: monthly calendar, original leap-day anchor, NPC/player ageing and mortality, bounded effects, persistent annual frame | 120 complete seeded core lives; deterministic decisions, resume, terminal death and direct-command gates pass; no full-system balance claim |
| Context-aware events, decisions, delayed consequences and journal | Partial: 22 original age/context templates, living-parent binding, five-year cooldown, committed results and journal; delayed consequences pending | Decision/result round-trip and eligibility tests pass; no system-event coverage claim |
| SQLite saves, migrations, recovery and import/export | Partial: transactional commands, schema migration, previous-checkpoint recovery, repository and native file import/export surfaces | Real SQLite migration/recovery/failure/reload tests pass; file picker/share require device validation |
| Education, exams, admissions, tuition, scholarships and loans | No | No |
| Jobs, pay, performance, promotion, dismissal and retirement | No | No |
| Dating, marriage, children, divorce, custody and persistent NPCs | No | No |
| Accounts, taxes, borrowing, insurance, properties, vehicles and possessions | No | No |
| Stocks, funds, crypto, valuation, FX and net worth | Partial: exact bigint money/rates/FX primitives; gameplay systems not implemented | Money edge cases, JPY scaling, signs, rounding and mixed-currency rejection pass |
| Health, conditions, treatment, lifestyle and wellbeing | No | No |
| Crime, investigation, arrest, court, prison, record and release | No | No |
| Social media, fame, sponsorships and controversies | No | No |
| Businesses and all eleven special-career paths | No | No |
| Travel, emigration, work/study abroad, pets, hobbies and entertainment | No | No |
| Country-specific rules and all proposed launch currencies | No | No |
| Achievements, challenges, heirlooms and statistics | No | No |
| Death, factual life summary, estate and existing-child legacy | Partial: terminal full-screen death and actual journal/cash/stat summary; estate/legacy pending | Terminal-state engine tests pass; no claim for career/property/child summary fields before those systems exist |
| Historical snapshots and Time Machine branches | No | No |
| Custom generated artwork and portrait continuity | Partial: twelve original generated illustrations bundled in a typed atlas registry | Original source inspected; actual-size device review and portraits pending |
| 250+ distinct high-quality approved event templates | 22 implemented; target remains at least 250, planned allocation 256 | Age/context/cooldown logic tested; full editorial review, breadth and system coverage remain pending |
| Accessibility, performance, native-device UI and release builds | No game implementation | No |

## Verification record

| Check | Outcome | Scope and limits |
| --- | --- | --- |
| Repository / available-file inspection | Completed | Confirms starter application; remote refresh found the supplied design files missed by the earlier stale checkout |
| Planning documentation structure | Passed | Local links, revised 79 unique screen IDs, nine sample events, 256-template allocation, and twelve-country/nine-currency proposal checked |
| Source specification preservation | Passed | Planning source copy checked byte-for-byte against the uploaded text |
| Earlier environment onboarding | Passed for starter | Locked npm install, TypeScript, native Android/iOS Hermes exports, Metro manifest and development-bundle requests; no game behavior established |
| Foundation/core tests and strict TypeScript | Passed | 47 tests across six suites, including 120 complete seeded core lives, actual v1 fixture migration, durable decision/result reload and visible save-failure retry |
| Routed native production bundles | Passed | Android and iOS Hermes exports from expo-router entry, including generated artwork; no device execution established |
| Full gameplay/integration/life scenarios | Partial | 120 core birth-to-death runs pass; education/work/family/economy/legal/legacy scenario matrix is still unimplemented and unrun |
| Reference inspection | Completed | All 27 design images opened at original resolution and mapped to canonical screens |
| Generated artwork / screen fidelity | Partial | Twelve original icons and dedicated memorial generated/source-reviewed; portrait layer experiment generated but not integrated/accepted; running-app visual acceptance pending |
| iOS/Android device interactions | Unrun | Appropriate native execution still needed later; bundle generation is insufficient |

## Change record

- Prepared the A–H planning pack and preserved the supplied specification.
- Recorded the confirmed adult audience and broader launch direction; expanded the proposal to twelve countries.
- Recorded the user's conditional approval and full-game continuation requirement.
- Added this progress ledger; corrected the stale-checkout diagnosis, merged the newer reference commits, reviewed all 27 files, and recorded the user's free/offline decision.
- Implemented the foundation submilestones below; the complete game remains unfinished.

### Foundation submilestone 1A

- Added Expo 57-compatible navigation/persistence/presentation packages and lightweight state/validation dependencies. Explicitly pinned React DOM/renderer and native worklet versions to match the existing React/Expo runtime.
- Added shared light/dark tokens, headers, rows, buttons, portraits, accessible bounded stat bars, four-tab shell and the five event presentation structures. These components are not yet the routed game UI.
- Added versioned deterministic random streams and bigint money/FX primitives. No game economy is claimed implemented.
- Verified strict application/test typing, 13 passing interaction/domain tests, and Expo bundled-version compatibility.
- Kept the working starter entry while building these reusable modules; the next submilestone connects actual life creation/save state and routing.

### Foundation submilestone 1B

- Replaced the starter entry with Expo Router welcome, editable new-life form, one-time birth introduction, four persistent tabs and nested factual profile/family/health views. No placeholder purchase, treatment or Age Up action is exposed.
- Added validated normalized identities/parent links, deterministic creation across twelve country identities and nine currencies, exact bigint save codec, SQLite schema initialization, atomic commands/receipts and saved-life selection. These country identities are not complete country rule packs.
- Added a serialized store that publishes only committed state and permits retry after failure; tests cover duplicate submissions and overlapping initial loads.
- Generated and inspected an original twelve-icon atlas with the image tool; bundled it with a typed clipping registry and provenance. Portraits and device visual review remain pending.
- Verified strict typing, 35 tests and Android/iOS production Hermes exports. Full gameplay, migration/recovery, import/export surfaces and native-device validation remain pending.

### Core submilestone 3A

- Added a pure deterministic command resolver, calendar-month annual frame, explicit interrupted-year resume, seeded NPC/player ageing and mortality, terminal death, five-year event cooldowns and 22 original age-appropriate situations. Effects report actual bounded changes. The broader life systems and delayed consequences remain pending.
- Decisions store bound identities, exact choices and authored consequences. Results are persisted separately before display; acknowledging them cannot apply their effects again. Native modals expose save errors and permit retry.
- Added the dedicated dark full-screen death route, original generated memorial, factual journal summary and new-life flow. The child continuation button explains its unavailable state; actual family formation/estate/legacy are later work.
- Added save/DB version migration, a real v1 fixture generated from commit 44d8bc3, last-valid checkpoint preservation, explicit recovery preview/confirmation and native file import/export surfaces. File-picker/share execution remains unverified on devices.
- Verified 120 full core lives plus strict types, deterministic/round-trip/gating/leap-day tests, real SQLite migration/recovery/reload tests and current Android/iOS Hermes exports. A 120-life sweep caught and led to correction of leap-day parent creation. This is not validation of the complete game or all 256 planned templates.
