# Dreams: Life Simulator — Phase 0 master plan

**Status: overall direction approved, subject to reconciling the design screenshots first. Implementation is blocked on the missing screenshot files.**

Prepared 18 October 2026 against the supplied master specification. The user has approved the overall direction and authorised autonomous implementation through the complete production-quality game, with tested, working commits at each milestone. That authorisation is conditional on reconciling the design screenshots before implementation. The screenshots remain unavailable; the written visual brief has not been approved as their replacement.

[Implementation progress and verification](../PROGRESS.md) records the current gate, feature status, and evidence. The first playable milestone does not end the authorised scope.

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
| Reference screenshots | No design-references/ directory, design/ directory, attached screen images, or death screen.png was found in the accessible workspace. The README's design-directory mention does not establish its existence. |
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
3. Birth establishes actual parents/guardians, household circumstances, appearance, and starting stats. A short birth result leads directly to the same Life dashboard used at every age.
4. One tap on Age Up produces a short, age-appropriate family event during the introductory year. That introductory event is deliberately selected; later years use normal pacing.
5. The choice changes real state, the result names the consequence, and a first-person journal line appears under the correct age.

Creation remains skippable through Random Life. No tutorials, account signup, monetisation, daily timers, or management chores are prerequisites to playing.

### Typical year

The player might study, compliment a friend, apply for a job, or buy something. Each action opens a small action surface, resolves, updates the current screen, and saves. Age Up handles routine progression, annual money, NPC lives, persistent conditions, and consequences. Quiet years mainly update the journal; important decisions pause progression.

The UI shows Happiness, Health, Smarts, and Looks on the main dashboard as a **proposed** compact summary. Other stats appear where they matter. The screenshot set must confirm the exact visible core stats and arrangement before visual implementation.

### Death and another life

Death replaces the game with a full-screen view using the missing **death screen.png** as the intended authority. The dark background, tombstone illustration, factual lifetime summary, and buttons **View Life Summary**, **Start a New Life**, and **Continue as Child** remain mandatory. Continuing as a child selects an existing living child; the same world and family continue through an estate settlement.

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
| D09 | All specified special-career paths ship with distinct mechanics. | They are part of the requested release, not decorative menu entries. |
| D10 | At least 250 distinct, reviewed situational event templates. | Routine action acknowledgements and renamed variants do not inflate the target. |
| D11 | Free local Time Machine; no paywalls or monetisation. | The specification explicitly excludes unrequested monetisation. |
| D12 | Generated reusable portrait layers with persistent appearance traits. | Supports customisation and ageing without generating pictures at runtime. Layer consistency must pass an early feasibility test. |

## Visual decisions that remain open

The written brief establishes white list screens, navy text, blue actions, a green Age Up button, rounded white event cards, overlapping circular illustrations, and consistent portraits. It does **not** establish exact colour values, font family, spacing, tab icons, card proportions, modal dimensions, or the death-screen composition.

Do not invent those measurements and present them as faithful reproductions. On receipt of the references:

1. Catalogue every file with its actual filename, dimensions, visible features, and any known version/date.
2. Associate it with the screen IDs in the inventory.
3. Mark alternatives, choose the user's stated priorities, and record the winning file for each screen.
4. Extract shared tokens and identify any genuine visual conflicts.
5. Present the reconciled references and any material deviations before implementation.

File timestamps alone are insufficient evidence that one design is newer. Ask when conflicting designs have no reliable order and the choice materially changes the experience.

## Confirmed decisions and remaining prerequisite

1. **Visual authority — blocking prerequisite:** reconcile all supplied screenshots before implementation. The required files, including death screen.png, are not currently available. Do not infer that the conditional approval waives them.
2. **Audience — settled:** adults, non-graphic mature themes. No further audience confirmation is needed.
3. **Country coverage — direction settled, roster proposed:** a wider international selection must be available at the initial complete release. Review the twelve-country candidate roster in D07 and the country-pack contract in the simulation blueprint. It is not a two-country launch with the rest deferred. Only implemented and tested countries will appear as playable choices.
4. **Implementation authorisation — granted conditionally:** the user approves the overall direction and requests autonomous implementation through all phases. After screenshot reconciliation, implement, test, fix, update progress, and commit each working milestone before advancing. Stop only for a major product decision, a genuine blocking dependency, or unavailable tooling.

Ordinary technical choices within an approved plan do not require repeated permission. A major scope or visual change does.

## Completion standard

The overall direction is approved. Phase 0's remaining gate is actual reference reconciliation and resolution of any material conflict it reveals. No application code or artwork has been created. Once that prerequisite is satisfied, continue through all implementation phases without treating the first playable life as project completion. No claim of screenshot analysis, gameplay implementation, generated artwork, or device validation is implied by this plan.
