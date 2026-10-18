# Dreams: Life Simulator — progress and verification

Updated 18 October 2026.

## Goal and authorisation

Build the complete production-quality game described in the [master specification](planning/source-specification.md) and [implementation plan](planning/MASTER_PLAN.md), not only the first playable life. The user approves the overall direction, with a specific prerequisite: reconcile all supplied design screenshots first.

After reconciliation, work autonomously through the phases. Each milestone must be implemented, tested, corrected, documented here, and committed in a working state before advancing. Stop only for material product decisions, genuine blocking dependencies, or unavailable tools. Ordinary implementation choices do not need repeated approval.

Confirmed product choices: adults with non-graphic mature themes, and a wider international selection at launch. The current country proposal contains twelve countries and nine currencies; do not reduce launch scope to US/UK without a product decision.

## Current milestone: persistent health, clinical care and lifestyle

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
| 4 — Core life systems | In progress | Education, ordinary work, ownership/markets, relationships/family, divorce/custody and wills/estate implemented; deeper contacts, remaining education funding and broader acceptance remain pending |
| 5 — Expanded gameplay | In progress | Health/clinical care/lifestyle implemented; crime/legal/prison, fame/social, companies, special careers, travel, pets and hobbies remain planned |
| 6 — Content, depth, legacy, Time Machine | In progress | 22 shipped age/context templates, existing-child legacy and historical branch restore; 250+ target, broad coverage and extras remain pending |
| 7 — Polish and release validation | Not started | Implementation has domain/component checks; native-device comparison and release gates remain open |

## Feature status

| Feature family | Implemented | Verified |
| --- | --- | --- |
| Four-tab UI, Life dashboard, shared components and modal flows | Partial: routed app and nested family/profile/health views; five bars, factual journal and cash | Native components and native bundles verified; no device fidelity claim |
| Identity, custom/random creation, family, appearance and ageing | Partial: editable identity/appearance, deterministic random creation, actual parent links, generated portraits and eight visual age stages | Twelve-country creation/domain tests pass; 120px browser layer review complete; native rendering/fidelity pending |
| Seeded engine, resumable annual progression, stats and invariants | Partial: monthly calendar, original leap-day anchor, NPC/player ageing and mortality, bounded effects, persistent annual frame | 120 complete seeded core lives; deterministic decisions, resume, terminal death and direct-command gates pass; no full-system balance claim |
| Context-aware events, decisions, delayed consequences and journal | Partial: 22 original age/context templates, living-parent binding, five-year cooldown, committed results and journal; delayed consequences pending | Decision/result round-trip and eligibility tests pass; no system-event coverage claim |
| SQLite saves, migrations, recovery and import/export | Partial: transactional commands/checkpoints, schema migration, explicit recovery and compressed full-history local archives | Real SQLite migration/recovery/failure/reload/archive tests pass; file picker/share require device validation |
| Education, exams, admissions, tuition, scholarships and loans | Partial: public school progression, grades/study routines, admission, six subjects, trade/degree/professional study, tuition funding/pause and debt; scholarships/adult remediation/school contacts pending | Twelve profile boundary tests and connected school→degree→qualified job scenario pass |
| Jobs, pay, performance, promotion, dismissal and retirement | Partial: eighteen ordinary roles, qualification/age gates, applications, monthly contracts, routines, promotion/dismissal, work history and earned pension | Exact partial-year pay/tax, direct-command gates and connected work scenario pass; special careers and work contacts pending |
| Dating, marriage, children, divorce, custody and persistent NPCs | Partial: persistent courtship/marriage/households, NPC finances, nine-month pregnancy, births/inherited DNA, adoption, family tree, divorce equalisation, primary/shared care, support and guardianship; deeper autonomous NPC lives/legal proceedings pending | Domain conservation/gates, connected courtship and birth interruptions, genuine migration, native introduction/adoption→real SQLite flows; device acceptance pending |
| Accounts, taxes, borrowing, insurance, properties, vehicles and possessions | Partial: reconciled ledger; nineteen offers; mortgages, rent, upkeep, insurance/loss claims, sale offers, refinancing, forced sale, household shares and estate integration | Conservation and native-component→engine→real-SQLite purchase failure/retry pass; native-device acceptance pending |
| Stocks, funds, crypto, valuation, FX and net worth | Partial: six authored instruments, seeded monthly prices/dividends, positions/cost basis, buys/partial sales, FX accounts/exchange and complete implemented-asset net worth | All twelve local currency profiles, fractional JPY rounding, over-selling, 81 currency directions and fee conservation pass; not live market data |
| Health, conditions, treatment, lifestyle and wellbeing | Partial: fourteen condition models, symptoms/diagnosis/history, qualified persistent clinicians, real fees/caregiver funding, treatment/recovery/side effects, urgent hospital interruptions, dated vaccination, routines/exercise/wellbeing and family-history risk | Twelve local-price profiles, missed/saved diagnosis, fixed treatment outcomes, monthly funding/recovery, terminal priority, hospital pay/attendance and native consultation failure/retry→SQLite pass; clinical/country accuracy and device fidelity remain unverified |
| Crime, investigation, arrest, court, prison, record and release | No | No |
| Social media, fame, sponsorships and controversies | No | No |
| Businesses and all eleven special-career paths | No | No |
| Travel, emigration, work/study abroad, pets, hobbies and entertainment | No | No |
| Country-specific rules and all proposed launch currencies | Partial: twelve authored education/work/finance/health-fee/estate profiles and nine currencies, with shared documented family/medical approximations; legal/immigration detail remains pending | Arithmetic/progression and local fee/family/estate checks pass; external rule-source verification is blocked by active network policy; see COUNTRY_RULES.md |
| Achievements, challenges, heirlooms and statistics | No | No |
| Death, factual life summary, estate and existing-child legacy | Partial: terminal full-screen death, actual career/children/property summary, will/protected heirs, debt/tax-first settlement, specific ownership bequests, minor trusts and same-child continuation with preserved annual cursor | Conservation, all twelve local-currency NPC estates, real v6 migration, a three-generation journey and native legacy storage-failure→retry/cold-load pass; broader seeded/device acceptance pending |
| Historical snapshots and Time Machine branches | Implemented core: complete compressed checkpoints before Age Up, explicit saved moments, reviewed separate-branch restore, original future preserved, only prior history copied, local archive round-trip | Atomic rollback/idempotency, exact RNG/outcomes/market restoration, corruption rejection, recovery history pruning and native confirmation→SQLite failure/retry pass; large/native acceptance pending |
| Custom generated artwork and portrait continuity | Partial: twelve activity, sixteen ownership, twelve family and sixteen time/health/legal illustrations, memorial and layered portraits; health/legal subjects registered for their later systems | Sources inspected, 120px portrait and 128px ownership/family/health/legal browser reviews complete; native-device fidelity and remaining families pending |
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

### Core systems submilestone 4C2

- Added nine-month persisted pregnancies, consent/fertility/age/health gates, care costs, non-graphic low-health pregnancy loss, actual births with inherited appearance/traits, adoption and child names. A birth pauses annual progression and acknowledgement resumes the same remaining months; it cannot create a second child. Known NPC married couples use the same pregnancy pipeline.
- Added real parent/sibling/guardian links, child households and family tree. Orphaned minors retain their identities and move into the care of a living parent, relative or generated guardian. A child born after separation receives a custody/support arrangement.
- Added divorce equalisation against recorded marriage baselines, separate households, reviewed primary/shared care and actual monthly support. Unpaid family payments are conserved liabilities/receivables; collections and manual repayments transfer actual cash once. No cloned wealth or manufactured payment funds.
- Added family planning, tree, child care/name and divorce review surfaces. World v6/engine v5 migration preserves the actual v5 pending marriage result, gifted ring, household, accounts and random state. Estate settlement/legacy and country-specific legal fidelity remain pending.
- Verification: strict application/test types, 119 tests across thirteen suites (107-test full regression plus twelve additional country-family checks), and current Android/iOS production Hermes exports pass. Twelve complete lives pass through NPC family formation; birth interruption/reload, real v5 migration, orphan identity/guardianship, post-divorce birth/support, debt/receivable conservation and native adoption→cold SQLite load are covered. All twelve profiles pass local-currency marriage/child/divorce conservation. Native-device execution and legal/source accuracy remain unverified.

### Core systems submilestone 4C3

- Added a real will editor with exact 10,000-basis-point allocation, eligible executors, protected-family minima, specific owned bequests and revocation. Added saved effective-share previews and factual estate records visible from death, person history and legacy selection.
- Death settles actual NPC/player wealth once: holdings/ordinary assets provide liquidity at recorded sale terms, internal receivables are assigned to an external buyer at a documented discount, creditors/tax are paid first, insolvency is written off and the remaining pool is apportioned without duplicating minor units. Bequests retain the same asset IDs when affordable within the recipient’s share; forced liquidation is explained. Inheritances and outside-couple gifts are excluded from future marital gains.
- Minor cash inheritance is locked until actual adulthood. Direct spending cannot use it; automatic necessary costs of inherited property can. A family residence retained as a bequest preserves its household use when the heir already lives there. Death metrics use recorded pre-settlement wealth/property counts.
- Continue as Child selects a real living existing child at the same date. It preserves their identity, DNA, schooling, relationships and accounts, archives deceased history and resumes remaining annual months only when explicitly requested. An interrupted month-twelve year still finishes settlement exactly once. Saved-life labels follow the new actor after the durable commit.
- World v7/engine v6 adds estate/will/trust/legacy state, ownership provenance and planning-paused annual frames. Actual v6 birth-result migration preserves its child, pregnancy, pending result and monthly cursor. Earlier unknown ownership is marked legacy rather than inventing transfers; old migrations do not fabricate retrospective estates.
- Verification: strict typing and 146 tests across sixteen suites pass across the full regression and corrected focused reruns. Coverage includes twelve complete lives, all twelve local-currency estate profiles, a three-generation journey, protected shares, insolvency, mortgage-before-bequest, necessary trust costs, will percentage validation and native legacy failure/retry/cold-load against real SQLite. Android/iOS Hermes exports pass; native-device behavior, country-source accuracy, performance budgets and the full seeded multi-generation matrix remain open.

### Persistence/legacy submilestone 6A

- Age Up captures a complete compressed historical state in the same transaction as the next world, backup and idempotency receipt. Explicit Save This Moment uses the durable current state. Gzip output is bounded and fingerprint-checked; no seed-only reconstruction or partial character copy is used.
- Time Machine reviews the selected name/age/date and restores it as a new saved branch. The source future stays untouched. Only checkpoints at or before the selected revision follow the branch; future people, prices, outcomes, allowances and random draws cannot leak from the source. Restore receipts and coordinator retry IDs prevent duplicate branches after a failed acknowledgement.
- Local file export/import now includes the full current checkpoint, compressed historical states and branch origin. Plain older saves still import. Complete archive validation precedes replacement; recovery removes checkpoints after the recovered revision. SQLite schema v3 migrates older raw historical rows without changing their worlds; the gameplay world remains v7.
- Added Time Machine navigation from Activities and Life Summary, persistent tabs while alive, saved-branch labels and the generated rewind illustration. Remaining health/legal artwork is registered for later systems without exposing unimplemented actions.
- Strict types, 155 tests across eighteen suites and both native Hermes exports pass. Android/iOS Metro manifests and current development bundles also return 200 with the Time Machine/checkpoint source present. The real-SQLite native confirmation test covers failed restore, retry with the same branch ID and cold reload. The [cloud diagnostic](PERFORMANCE.md) stored 93 observations in 5.9 MB of checkpoint payloads; its conservative 120-largest-checkpoint projection is 12.3 MB. Sixteen new illustrations were source/browser-reviewed at 128px; measured clipping excludes a neighbour pixel beside the scales. Native timing, full-system/multi-generation storage and large import responsiveness remain open.

### Expanded systems submilestone 5A

- Added fourteen authored conditions with onset, symptoms, diagnosis, severity, active/control/recovery states, treatment history and mortality effects. Clinical visits can miss a diagnosis. Programmes store their seeded response before presentation, progress by month, can cause side effects and pause when ongoing funding is unavailable. A saved emergency honours its persisted quoted bill.
- Clinicians are actual persistent, qualified people with recorded work history. Assignment happens only inside a committed action; opening the clinic consumes no randomness. Fees use local profile currencies and actual patient/caregiver balances, with recorded clinician income. Minors retain protected inheritance; caregivers fund their care where present.
- Added serious-condition interruptions, accepted/declined hospital assessment and terminal-outcome priority. A two-month stay pauses course attendance and pays the defined 50% employment leave rate for its actual two monthly periods; pensions continue. Related dating/conception/adoption/exercise restrictions and hospital visits use the same state. Hospital absence can extend a four-year course beyond four calendar years; the connected education test now waits for actual completion.
- Added persistent diet/sleep/exercise/mindfulness and substance habits, dated infection protection, bounded sessions, injury risk, self-improvement, elective/fertility care, and inherited recorded family-risk history without inventing a child’s illness. Effects/costs accrue as time passes; routines/visits cannot be tapped for instant health gains.
- Routed Doctor, Conditions/detail, Exercise and Mind & Body screens through the four-tab shell with generated art. Branch/legacy actor changes reset detail stacks and stale local forms. World v8/engine v7 migration adds empty medical history without rerolling older outcomes; a genuine v7 compressed branch archive verifies both current and historical migration.
- Strict application/test types and 178 tests across twenty suites pass across the full regression and corrected focused checks; twelve complete seeded lives pass with health/NPC care. Current Android/iOS Hermes exports pass. Clinical/national source accuracy, native-device execution, broader balance and final performance gates remain open. The updated [cloud diagnostic](PERFORMANCE.md) reports 7.97 MB of history across 78 observations and a 26.1 MB conservative 120-largest-checkpoint projection; this is not a full-system storage acceptance result.
