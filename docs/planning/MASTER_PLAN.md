# Dreams: Life Simulator — Phase 0 master plan

**Status: Phase 0 reconciled; implementation authorised. All 27 supplied screenshots are reviewed. The user confirmed free, offline gameplay with local saves/export/import.**

Prepared 18 October 2026 against the supplied master specification. The user has approved the overall direction and authorised autonomous implementation through the complete production-quality game, with tested, working commits at each milestone. The newer main commits contain the screenshots previously missing from the stale local checkout. They have now been imported and individually reviewed; see the [complete design reconciliation](design-reconciliation.md).

[Implementation progress and verification](../PROGRESS.md) records the current gate, feature status, and evidence. The first playable milestone does not end the authorised scope.

20 October scope update: automatic saving and resuming where play stopped remain
required. The user explicitly parks further load/save tools, import/export/sharing,
Time Machine breadth and history-storage optimisation. Existing implemented
features/data remain intact. Continue the full gameplay, content, visual and
release plan; this update takes precedence over older file-feature priorities.

## Current verified checkpoint — 20 October

World34/engine35/content10/reader14 passes2,282tests/169suites, strict types,
both Hermes exports, the same120annual seeds and scoped Android action/cold
checks, including exact original history and70warm samples with zero full unpack.
Profile/Statistics/Finances, motion/optional feedback, voluntary school withdrawal
and actual hobby introductions are integrated. Overall production is about65%;
[the current evidence and remaining limits](../verification/opening-completion-20261020.json)
and [current workstreams](../HANDOFF.md) take precedence over historical milestones.
Continue independent family/terminal/story/health/best-friend and career acceptance
work with coordinated integration, testing and commits. Broad balance, country,
visual/accessibility and device release acceptance remain open.

## Earlier implementation milestones (historical sources)

The minimum250annual situations are now implemented, including125actual-life
contexts and375new choices, alongside18persisted ordinary-job interviews. Full
1,657-test regression, same120immutable lifetimes, twelve natural country journeys
and exact Android adult/pet cold results pass. This closes the source quota, not
full editorial/balance/release acceptance. Continue immediate adoption details and
visible Review action, broader factual progression, remaining work/leisure depth,
visual/accessibility review and release gates. Overall production is about55%.
[Current source and acceptance](../LIFE_CONTEXT_STORIES.md),
[handoff](../HANDOFF.md).

The progression increment now tracks40factual achievements and12challenges,
with personal/archived history and virtualised rows. All129related checks,
strict types, both exports and exact Android progress/cold results pass. Native
large-text review also fixes wrapped100%labels. Continue hobby community events
and remaining depth, balance, visual/accessibility and release work.
[Progression evidence](../PROGRESSION_GOALS.md).

## Product decision

Build a fast, offline life simulator around **Age Up → event → choice → consequence → journal**. The player can also take short, meaningful actions between years. A satisfying ordinary life must be as viable as a criminal, famous, wealthy, unlucky, or chaotic one.

The four tabs are **Life, Assets, Relationships, Activities**, in that order. The Life tab remains the home of the journal and green Age Up button. Features share one simulation, one set of persistent people, and one financial ledger. A displayed success always follows an actual engine result.

The first playable milestone is one complete birth-to-death life with restoration after closing the app. That milestone is not the complete release: education, work, family, wealth, health, crime, prison, special careers, business, travel, pets, content depth, legacy, and Time Machine remain explicit later gates.

## Evidence and limitations

| Item | What was actually established |
| --- | --- |
| Repository | Existing Expo SDK 57 / React Native 0.86.3 / React 19.2.3 starter, TypeScript strict mode; App.tsx is the blank starter. |
| Existing systems | No navigation library, store, persistence, game engine, authored events, automated gameplay tests, or custom game illustrations. |
| Existing images | All six assets were visually inspected: Expo launcher, splash, adaptive icon layers, and favicon. They are not UI design references. |
| Reference screenshots | Found 27 PNG files in design/ on main at ed084db, fetched and merged after the user's correction. All were opened at original resolution, including death screen.png. The earlier absence report was based on a stale checkout. |
| BitLife research | HTTPS retrieval of the official site and official App Store listing was attempted; both were denied with HTTP 403. No current BitLife build, screenshots, exact probabilities, economy values, or store description was verified. |
| Gameplay basis | The supplied specification's explicitly described BitLife patterns, plus the original design proposals in these documents. |
| Current development capability | Earlier onboarding validated npm ci, TypeScript, native Hermes exports, and Metro manifest/development bundle requests for Android and iOS. Those checks do not establish gameplay or device UI fidelity. |
| Artwork tooling | Image generation is available. It has not been invoked; no generated asset or approved style sample exists. |

Research destinations attempted: https://www.bitlifeapp.com/ and https://apps.apple.com/us/app/bitlife-life-simulator/id1374403536. They are evidence of attempted access, not cited proof of specific mechanics.

## Review pack: deliverables A–H

| Deliverable | Document |
| --- | --- |
| A. Unique screens, purpose, source family, and flows | [Screens and navigation](screens-and-navigation.md), inventory |
| B. Overlaps and canonical implementations | [Screens and navigation](screens-and-navigation.md), reconciliation register |
| C. Missing screens, failure paths, and transitions | [Screens and navigation](screens-and-navigation.md), missing-flow audit |
| D. Navigation map, modal flows, and back behavior | [Screens and navigation](screens-and-navigation.md), route map |
| E. Mechanics, integration, architecture, saves, and invariants | [Simulation and persistence](simulation-and-persistence.md) |
| F. Voice, event authoring, original samples, and content coverage | [Writing and events](writing-and-events.md) |
| G. Asset families, reuse, generation, and acceptance | [Artwork and delivery](artwork-and-delivery.md), artwork manifest |
| H. Phases, exit criteria, and full-life testing | [Artwork and delivery](artwork-and-delivery.md), roadmap and release gates |

[The supplied specification](source-specification.md) is preserved alongside this plan.

## Proposed experience

### First minute

1. Welcome offers Continue when a valid life exists, Random Life, and Create Life.
2. Random Life opens a populated, editable creation form; starting it requires one clear confirmation.
3. Birth establishes actual parents/guardians, household circumstances, appearance, and starting stats. The full-screen newborn introduction from birth.png leads directly to the same Life dashboard used at every age.
4. One tap on Age Up produces a short, age-appropriate family event during the introductory year. That introductory event is deliberately selected; later years use normal pacing.
5. The choice changes real state, the result names the consequence, and a first-person journal line appears under the correct age.

Creation remains skippable through Random Life. No tutorials, account signup, monetisation, daily timers, or management chores are prerequisites to playing.

### Typical year

The player might study, compliment a friend, apply for a job, or buy something. Each action opens a small action surface, resolves, updates the current screen, and saves. Age Up handles routine progression, annual money, NPC lives, persistent conditions, and consequences. Quiet years mainly update the journal; important decisions pause progression.

The UI shows **Happiness, Health, Smarts, Looks, and Respect**, matching the five-bar layout in references 02/03 and birth.png. Other stats appear where they matter. This replaces the initial four-stat proposal.

### Death and another life

Death replaces the game with a full-screen view using **death screen.png** as the authority. The dark background, tombstone illustration, factual lifetime summary, and buttons **View Life Summary**, **Start a New Life**, and **Continue as Child** remain mandatory. The older popup/red variants are superseded. Continuing as a child selects an existing living child; the same world and family continue through an estate settlement.

## Design decisions

The audience and wider international launch direction are confirmed by the user's replies. The overall plan direction is now approved subject to screenshot reconciliation. Use the documented recommendations as the implementation baseline once that prerequisite is satisfied; raise material product or visual conflicts rather than repeatedly requesting approval for ordinary technical choices.

| ID | Recommendation | Reason and consequence |
| --- | --- | --- |
| D01 | Four specified tabs; ordinary actions stay within a few taps. | Preserves the requested interaction model and limits menu depth. |
| D02 | One Life dashboard across all ages, with age/state-specific content. | Prevents disconnected newborn, child, adult, and prison demos. |
| D03 | Separate full-screen death route; consolidated decision/result modals. | Follows the explicit visual priorities. |
| D04 | Offline engine and authored content; Expo Router, Zustand, SQLite. | Persistent command transactions and route-based navigation without a backend. Dependencies are proposals only. |
| D05 | Pure deterministic domain functions and one serialized command boundary. | Reproducible outcomes, testable rules, and reliable resume during a year. |
| D06 | Annual time steps; policies/routines persist, manual actions are optional. | Avoids daily scheduling, compulsory tapping, and endless stat grinding. |
| D07 | Confirmed direction: a wider country selection at launch. Proposed roster: United States, Canada, United Kingdom, Australia, France, Germany, Spain, Italy, Brazil, India, Japan, and South Africa. | Twelve country packs across nine currencies; each must pass its own rules, content, and migration checks. The direction is confirmed; the specific roster is proposed for review. |
| D08 | Confirmed audience: adults, non-graphic mature themes. | Allows cheeky crime/family/work stories while keeping the illustrated presentation consistent. The user selected this audience explicitly. |
| D09 | All specified and illustrated special-career paths ship with distinct mechanics. | The later detailed career reference adds Royalty, Astronaut, and Military to the eight initially planned paths. Doctor/lawyer remain qualified standard careers. |
| D10 | At least 250 distinct, reviewed situational event templates; initial allocation now 256. | Six additional templates cover the three newly identified career paths. Routine acknowledgements and renamed variants do not inflate the target. |
| D11 | Free local Time Machine; no paywalls or monetisation. | The specification explicitly excludes unrequested monetisation. |
| D12 | Generated reusable portrait layers with persistent appearance traits. | Supports customisation and ageing without generating pictures at runtime. Layer consistency must pass an early feasibility test. |

## Visual reconciliation

The [reconciliation register](design-reconciliation.md) catalogues all 27 files, source commits, dimensions, winning designs, overlaps, added screens, and conflicts. The revised inventory contains 79 canonical screen definitions.

Implementation follows:

1. Core layout from 02/03, feature-specific detailed sheets, and the later standalone references.
2. A persistent four-tab bar on normal feature pages; no fifth Extras tab.
3. Five-bar dashboard and one shared Life view across ages, plus the one-time newborn introduction.
4. Consolidated modal structures from 16/17; full-screen death from the dedicated image.
5. Functional wills, family tree, detailed property management, custody, black market, and additional career paths identified in the images.
6. Actual money, facts, and original direct writing rather than copying inconsistent illustrative values or generic filler.

The exact font family cannot be proven from raster pixels. Initial measured palette/proportion targets are documented; final visual fidelity still requires actual app captures and comparison.

## Confirmed decisions and remaining prerequisite

1. **Reference inspection — completed:** all 27 screenshots are present and reconciled. The earlier missing-files blocker is resolved.
2. **Audience — settled:** adults, non-graphic mature themes. No further audience confirmation is needed.
3. **Country coverage — direction settled, roster proposed:** a wider international selection must be available at the initial complete release. Review the twelve-country candidate roster in D07 and the country-pack contract in the simulation blueprint. It is not a two-country launch with the rest deferred. Only implemented and tested countries will appear as playable choices.
4. **Implementation authorisation — granted conditionally:** the user approves the overall direction and requests autonomous implementation through all phases. After screenshot reconciliation, implement, test, fix, update progress, and commit each working milestone before advancing. Stop only for a major product decision, a genuine blocking dependency, or unavailable tooling.
5. **Premium/cloud conflict — resolved:** the user explicitly selected free, offline gameplay with local saves/export/import. Do not implement Premium subscriptions, paywalls, accounts, cloud sync or fake Connected indicators. The reference's local saved-life layout remains applicable.

Ordinary technical choices within an approved plan do not require repeated permission. A major scope or visual change does.

## Completion standard

The overall direction is approved, screenshot reconciliation is complete, and the Premium/cloud conflict is settled. Continue through all implementation phases without treating the first playable life as project completion. Reference inspection does not establish running-app visual fidelity; implemented and verified progress is tracked separately.
