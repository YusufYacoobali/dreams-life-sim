# Dreams: Life Simulator — progress and verification

Updated 18 October 2026.

## Goal and authorisation

Build the complete production-quality game described in the [master specification](planning/source-specification.md) and [implementation plan](planning/MASTER_PLAN.md), not only the first playable life. The user approves the overall direction, with a specific prerequisite: reconcile all supplied design screenshots first.

After reconciliation, work autonomously through the phases. Each milestone must be implemented, tested, corrected, documented here, and committed in a working state before advancing. Stop only for material product decisions, genuine blocking dependencies, or unavailable tools. Ordinary implementation choices do not need repeated approval.

Confirmed product choices: adults with non-graphic mature themes, and a wider international selection at launch. The current country proposal contains twelve countries and nine currencies; do not reduce launch scope to US/UK without a product decision.

## Current milestone: relationships, households and persistent NPC finances

The earlier missing-reference blocker was a stale checkout. Fetching origin/main at ed084db brought in all 27 supplied images under design/. Every image has now been opened and reviewed; the [design reconciliation](planning/design-reconciliation.md) records dimensions, provenance, canonical sources, overlaps and all conflict resolutions.

The user explicitly resolved the Premium/cloud reference in favour of a free, offline game with local saves/export/import. No further general plan approval is needed. Implementation can proceed under the existing full-game authorisation.

The reconciled inventory contains 79 canonical screen definitions. Added requirements include a full-screen newborn introduction, wills, family tree, custody/date selection, detailed property sale/mortgage actions, health subviews, criminal record/prison actions, black market, and Royalty/Astronaut/Military career paths. There are now eleven special paths and an initial 256-template event allocation.

The first birth-to-death engine is implemented. Continue through every remaining phase: this core loop is not the complete game. Running-app fidelity and device checks remain unverified until real captures/tests exist.

## Phase status

| Phase | Status | Evidence / remaining work |
| --- | --- | --- |
| 0 — Planning and reconciliation | Complete | Overall direction approved; all 27 images reviewed; conflicts resolved, including confirmed free/offline scope |
| 1 — Technical and visual foundation | In progress | Shared UI/modal structures, routed four-tab app, committed-state coordinator and transactional persistence; device and visual acceptance pending |
| 2 — Artwork and character creation | In progress | Generated layered portraits, appearance editor and eight age stages now integrated; native rendering/fidelity and remaining illustration families pending |
| 3 — Core playable life | In progress | Deterministic monthly/annual progression, persistent decisions/results, journal and terminal death; native-device acceptance and broader system integration pending |
| 4 — Core life systems | In progress | Education, ordinary work, ownership/markets and courtship/marriage/households implemented; children, divorce/custody, wills/estate and broader integration remain pending |
| 5 — Expanded gameplay | Not started | Health, crime/legal/prison, fame/social, companies, special careers, travel, pets, and hobbies remain planned |
| 6 — Content, depth, legacy, Time Machine | In progress | 22 shipped age/context templates; 250+ target, broad coverage, legacy and restore remain pending |
| 7 — Polish and release validation | Not started | Implementation has domain/component checks; native-device comparison and release gates remain open |

## Feature status

| Feature family | Implemented | Verified |
| --- | --- | --- |
| Four-tab UI, Life dashboard, shared components and modal flows | Partial: routed app and nested family/profile/health views; five bars, factual journal and cash | Native components and native bundles verified; no device fidelity claim |
| Identity, custom/random creation, family, appearance and ageing | Partial: editable identity/appearance, deterministic random creation, actual parent links, generated portraits and eight visual age stages | Twelve-country creation/domain tests pass; 120px browser layer review complete; native rendering/fidelity pending |
| Seeded engine, resumable annual progression, stats and invariants | Partial: monthly calendar, original leap-day anchor, NPC/player ageing and mortality, bounded effects, persistent annual frame | 120 complete seeded core lives; deterministic decisions, resume, terminal death and direct-command gates pass; no full-system balance claim |
| Context-aware events, decisions, delayed consequences and journal | Partial: 22 original age/context templates, living-parent binding, five-year cooldown, committed results and journal; delayed consequences pending | Decision/result round-trip and eligibility tests pass; no system-event coverage claim |
| SQLite saves, migrations, recovery and import/export | Partial: transactional commands, schema migration, previous-checkpoint recovery, repository and native file import/export surfaces | Real SQLite migration/recovery/failure/reload tests pass; file picker/share require device validation |
| Education, exams, admissions, tuition, scholarships and loans | Partial: public school progression, grades/study routines, admission, six subjects, trade/degree/professional study, tuition funding/pause and debt; scholarships/adult remediation/school contacts pending | Twelve profile boundary tests and connected school→degree→qualified job scenario pass |
| Jobs, pay, performance, promotion, dismissal and retirement | Partial: eighteen ordinary roles, qualification/age gates, applications, monthly contracts, routines, promotion/dismissal, work history and earned pension | Exact partial-year pay/tax, direct-command gates and connected work scenario pass; special careers and work contacts pending |
| Dating, marriage, children, divorce, custody and persistent NPCs | Partial: persistent introductions, friendship/trust/memories, gifts, consent/preferences, dating, proposal/ring ownership, weddings, shared households, independent NPC pay/tax/budget/pensions and grief; children/divorce/custody pending | Domain conservation/gates and connected multi-year friendship→dating→marriage pass; native introduction→real SQLite flow; device acceptance pending |
| Accounts, taxes, borrowing, insurance, properties, vehicles and possessions | Partial: reconciled ledger; nineteen catalogue offers; mortgages, rent, upkeep, insurance/loss claims, delayed sale offers, refinancing, forced sale and household shares; estate integration pending | Conservation and native-component→engine→real-SQLite purchase failure/retry pass; native-device acceptance pending |
| Stocks, funds, crypto, valuation, FX and net worth | Partial: six authored instruments, seeded monthly prices/dividends, positions/cost basis, buys/partial sales, FX accounts/exchange and complete implemented-asset net worth | All twelve local currency profiles, fractional JPY rounding, over-selling, 81 currency directions and fee conservation pass; not live market data |
| Health, conditions, treatment, lifestyle and wellbeing | No | No |
| Crime, investigation, arrest, court, prison, record and release | No | No |
| Social media, fame, sponsorships and controversies | No | No |
| Businesses and all eleven special-career paths | No | No |
| Travel, emigration, work/study abroad, pets, hobbies and entertainment | No | No |
| Country-specific rules and all proposed launch currencies | Partial: twelve explicit authored education/work/finance profiles and nine currencies; legal/health/family/immigration detail remains pending | Arithmetic/progression tests pass; external rule-source verification is blocked by active network policy; see COUNTRY_RULES.md |
| Achievements, challenges, heirlooms and statistics | No | No |
| Death, factual life summary, estate and existing-child legacy | Partial: terminal full-screen death and actual journal/cash/stat summary; estate/legacy pending | Terminal-state engine tests pass; no claim for career/property/child summary fields before those systems exist |
| Historical snapshots and Time Machine branches | No | No |
| Custom generated artwork and portrait continuity | Partial: twelve activity, sixteen ownership and twelve family illustrations, death memorial and generated portrait layers/editor integrated | Sources inspected, 120px portrait and 128px ownership/family browser reviews complete; native-device fidelity and remaining families pending |
| 250+ distinct high-quality approved event templates | 22 implemented; target remains at least 250, planned allocation 256 | Age/context/cooldown logic tested; full editorial review, breadth and system coverage remain pending |
| Accessibility, performance, native-device UI and release builds | Partial: accessible shared controls and production bundles; broader audit/performance/device/release gates pending | Component interactions and bundle generation; no native-device claim |

## Verification record

| Check | Outcome | Scope and limits |
| --- | --- | --- |
| Repository / available-file inspection | Completed | Confirms starter application; remote refresh found the supplied design files missed by the earlier stale checkout |
| Planning documentation structure | Passed | Local links, revised 79 unique screen IDs, nine sample events, 256-template allocation, and twelve-country/nine-currency proposal checked |
| Source specification preservation | Passed | Planning source copy checked byte-for-byte against the uploaded text |
| Earlier environment onboarding | Passed for starter | Locked npm install, TypeScript, native Android/iOS Hermes exports, Metro manifest and development-bundle requests; no game behavior established |
| Foundation/core tests and strict TypeScript | Passed through 4B; 4C1 verification recorded below | Default regression includes twelve full lives, native component purchase with real SQLite, genuine migration fixtures and connected education/work. npm run test:soak expands the seed sweep to 120 |
| Routed native production bundles | Passed | Android and iOS Hermes exports from expo-router entry, including generated artwork; no device execution established |
| Full gameplay/integration/life scenarios | Partial | The 4A 120-life sweep passed in 163 seconds. Current v4 default twelve-life sweep and connected work/property/mortgage/sale/trading paths pass. Full family/legal/business/fame/legacy scenario matrix remains pending |
| Reference inspection | Completed | All 27 design images opened at original resolution and mapped to canonical screens |
| Generated artwork / screen fidelity | Partial | Activity/ownership/family art, dedicated memorial and layered portraits integrated; browser clipping/composition checked; running native-app acceptance pending |
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

### Artwork/creation submilestone 2A

- Generated an original grayscale portrait-layer sheet, measured its imperfect cell alignment and implemented native clipping, tint/multiply shading and shared persistent appearance rendering. Four face proportions, six skin tones, eight hair options and five colours are editable during creation.
- Added eight visual age stages and gradual hair greying while preserving the same DNA; replaced temporary initials in all existing person views. Identity remains independent of appearance.
- Inspected the source and a 120px browser composition covering eight ages plus 24 appearance combinations. This is a feasibility check; Android/iOS blend-mode execution, screen fidelity, performance and the wider artwork family remain unverified.

### Core systems submilestone 4A

- Added twelve versioned authored game profiles for local schooling, currency, wages, living costs, tuition, income bands, interest and retirement. Their assumptions and verification limitations are explicit in COUNTRY_RULES.md; these are not verified current legal models. Broader rule-pack systems remain pending.
- Added public school progression, grades and study effort; gated admissions, six subjects, two-year trades/four-year degrees and professional medicine/law; cash/loan tuition, preserved paused study and completed qualifications. Added eighteen ordinary job roles, real contracts/pay, applications with yearly cooldowns, performance/routines, promotion/dismissal, resignation, work history and earned pensions.
- Added reconciled cash/debt ledger, visible mandatory-cost arrears, interest, withholding and annual/death tax adjustment, borrowing and repayment. Initial household savings now scale to local wages. No purchase or investment is claimed implemented.
- Routed actual education, occupation/job-board and bank/loan screens through the persistent four-tab shell. Native device flows remain unverified.
- Migrated world format to v3/engine v2 without rerolling saved v1/v2 decisions/results; fixtures from old commits verify continued acknowledgement. Tests cover all twelve arithmetic/progression profiles, tuition pause/resume, conservation, partial-year earnings/tax and a connected school→university→qualified work→pay scenario.
- Current 120-life expanded sweep passes in 163 seconds; default regression uses twelve lives for faster iteration. All 67 tests pass across the default/soak and focused runs. Android/iOS production exports pass; device execution remains unrun.

### Core systems submilestone 4B

- Added real ownership for six property, six vehicle and six possession offers. Purchase payments, deposits, closing fees, mortgage principal, amortised payments, upkeep, rent, vacancies, insurance, damage, restoration, extra payments, refinancing and forced sales all update the same world and ledger. Cash/asset/debt changes conserve value apart from explicit fees, costs and simulated changes.
- Property listings retain ownership until a buyer's delayed offer is accepted. A monthly interruption at month twelve now resumes into exactly one annual settlement/event; accepting a result never repeats the month. Six missed payments trigger a discounted sale, and shortfall remains debt.
- Added six fictional stocks/funds/crypto instruments, seeded monthly histories/FX, dividends, positions, fees, cost basis and realised gains; market moves do not directly credit unrealised gains. Whole-share and fractional-crypto trades use bigint and final-currency rounding. Net worth includes each cash account, owned physical asset and holding once, less each liability once.
- Added currency accounts and reviewed exchange quotes; upward fee rounding prevents tiny JPY/cent loops creating cash. Tests exercise all 81 currency directions.
- Added catalogue, purchase, asset-management, investment/trading and currency bank surfaces. Moved the four root tabs under a shared detail stack with the persistent bottom navigation, preserving root tab mounts and giving details an actual push/back stack. Native navigation/scroll/device acceptance remains unverified.
- Generated, registered and browser-reviewed sixteen ownership illustrations; adjusted measured clipping after noticing a neighbour pixel below the guitar. Source PNGs remain unmodified.
- World v4/engine v3 migration preserves an actual v3 graduate/worker fixture with debt, pay/tax and 213 ledger entries. Verified strict types, 90 tests, current Android/iOS Hermes exports, property/mortgage/refinance/trading conservation and a native-component purchase→storage-failure→retry path against real SQLite.

### Core systems submilestone 4C1

- Added persistent community/dating introductions, friendship and trust, once-per-year interactions, real money gifts, mutual adult dating preferences/consent, proposal/ring ownership, wedding costs, shared households, moving out and asking to live with a parent. Added creation family options and adult preference editing independent of appearance/gender.
- NPCs retain identities, qualifications, contracts, pay history, savings and budgets. Connected household members/partners/parents and asset owners receive monthly pay, tax, upkeep, living costs and discretionary spending in their own accounts. Other contacts' recorded contracts settle elapsed background periods once when they return. This is an explicit simulation approximation, not a claim of monthly autonomous life decisions for every acquaintance.
- Added household budget shares for adults/dependants, primary-home savings, local school-completion independence, NPC job searches, earned pensions and relationship grief. Account/asset ownership remains individual. Children, custody, divorce settlements and estates remain the next work.
- World v5/engine v4 adds bonds, households, marriage history, biology/preferences and economic cursors. Migration preserves an actual v4 paused property-offer save, exact loans/holdings/FX and bound decisions; it does not invent historical NPC jobs. Annual command counters are actor-scoped for future legacy continuity.
- Generated twelve family illustrations and reviewed their 128px browser composition. Corrected measured clipping around the carriage, bottle, teddy and tree without changing the source PNG. Native-device fidelity remains unverified.
- Verification: strict application/test typing and 98 tests across eleven suites pass across the default regression and corrected focused rerun. Twelve complete core lives pass in the expanded financial pipeline (74 seconds); domain tests include a multi-year courtship through actual actions and Age Up, and a native introduction→real SQLite flow. Current Android/iOS Hermes production exports pass. Device execution and full-system balance remain unverified.
