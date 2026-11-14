# V2 polish and gameplay delivery

Requested scope: [Master V2 plan](V2_POLISH_GAMEPLAY_PLAN.md). Starting source: `ecab72ac`, branch `v2`.

Each checkpoint includes focused verification before its commit and push. Existing saves, historical outcomes, purchase ownership and the four-tab design remain compatibility boundaries. Changes to deterministic gameplay or optional saved state require their own compatibility coverage.

| Checkpoint | Status |
| --- | --- |
| 1. Shared UI, portrait picker, scoped errors | Implemented; focused checks pass |
| 2. Actor/Model presentation and casting | Implemented; focused checks pass |
| 3. Automatic lifestyle activation and legacy compatibility | Implemented; focused checks pass |
| 4. Vehicles and driving licence | Implemented; focused checks pass |
| 5. Landlord and properties | Implemented; focused checks pass |
| 6. Hobbies, pets and artwork | UI implemented; art batch awaiting approval |
| 7. Organised Crime balancing and prison UI | Implemented; focused checks and seeded comparison pass |
| 8. Versioned Cell Escape replacement | Implemented; original scene art awaiting approval |
| 9. Writing and measured performance | Feedback/tracing implemented; physical-device performance open |
| 10. Regression, native playthroughs and final fixes | 410 suites / 7,143 tests, 120-life soak, exports and Android release build pass; physical-device acceptance open |

## Checkpoint 1

- Added one portrait-based person selector with search, relationship/age labels, explicit confirmation, cancellation and current eligibility checks. Vehicle passengers/gifts, home gatherings, shared hobby practice and pet family activities use it. Prison and recruitment integration follows in checkpoint 7.
- Lifestyle, legal, creative-career and pet actions attach an ephemeral error scope to their dispatch. Reviews show only their own failures; leaving an in-flight workflow discards its late error. Route changes clear stale errors from older workflows. No error metadata is saved.
- Review buttons and live errors sit outside modal scrolling content. Existing safe-area spacing, artwork, haptics, reduced-motion behavior and guarded queued inputs remain shared through EventModal.
- No simulation, RNG, financial transaction or save-schema changes in this checkpoint.
- Focused verification: 66 cases across 11 relevant suites pass across the main run and affected reruns, including real SQLite failure/retry/cold reopen, cancelled/queued selections, current eligibility and late workflow errors. Strict app/test types and the 598-module import-cycle check pass. Native screen geometry, enlarged text, VoiceOver and TalkBack still require installed-device inspection; renderer assertions do not establish those results.


## Checkpoint 2

- Agency selection contains three unique representations. Commissions use exact percentages, and negotiation remains a dashboard action. Casting cards have one primary action, with acting negotiation available in the audition review. Refresh and decline commands remain accepted by the engine for compatibility but are absent from the public UI.
- Current quarter/country boards update at a successful gameplay-command boundary. Existing board generation and country caches retain answered offers and rolls; returning to a country does not reroll. Read-only decoding/rendering does not prepare a new board. Older stale boards are prepared by the next normal gameplay action.
- Optional `industry.castingHistory` retains answered offers when boards change. Its absent value stays absent in older saves; new histories round-trip through real SQLite and checkpoints. No migration, existing transcript rewrite or simulation RNG draw was introduced.
- Active model brand obligations sit near the top with a prominent fulfilment action. Completed agreements and settlement claims remain below the career opportunities.
- Public reception wording reflects the production medium while retaining saved outcome tiers. Confirmed zero fame on a major success is correct at the existing 100-point earned-fame cap; prospective results now explain that case. Existing pending text stays untouched. Future quiet adult-year text is a concise birthday fact.
- Verification: focused Actor overhaul, Model mechanics, creative polish, board maintenance/integrity, UI, modal and SQLite save suites pass across main runs and affected reruns. This includes legacy/currency fixtures, unchanged RNG streams, current-country caches, archived-decision validation, exact checkpoint round-trips, the earned-fame cap and rollback/retry of a brand appearance. Strict app/test types and the 599-module import-cycle check pass. Installed-device acceptance remains pending.


## Subsequent shop delivery

The user's separate [Dreams Shop redesign](V2_SHOP_IMPLEMENTATION.md) follows these gameplay changes in its own commit, `c22c64bf`. It preserves all eight product IDs and RevenueCat entitlements, uses localized prices, keeps free careers free, adds the in-game `/shop` route and reusable product-detail popups, and retains `/store` for Settings/no active life.


## Checkpoint 3

- New lives already initialise the lifestyle container. Missing property, vehicle and household-pet activities now initialise prospectively with a successful gameplay action, without activation prompts. The setup is idempotent and does not draw random numbers or create a separate save transaction.
- Old pending events, active mini-games and interrupted annual processing retain their frozen context. Ordinary setup waits for a safe boundary; a player explicitly starting a new lifestyle action can prepare its required state at that action's boundary.
- Read-only presentation previews the same setup for quotes and eligibility, without mutating the store or decoded checkpoint. Legacy activation commands remain supported as idempotent requests.
- Existing anonymous rentals stay anonymous with their exact agreed economics until they end. Existing mileage, improvements, licences, paid pet history, ownership, health, bonds and pricing versions remain literal. Setup never manufactures earlier trips or changes care prices.
- Verification: 214 tests in nine relevant suites pass, including read-only old checkpoint decoding, frozen legacy decisions, partial setup, real recorded mileage, anonymous rental preservation, atomic SQLite rollback/retry/cold reopening, independent Time Machine branches and older pet history. Strict app/test types and the 601-module import-cycle check pass. Native playthrough acceptance remains pending.


## Checkpoint 4

- Vehicle details group Driving & Trips, Care & Maintenance, Upgrades and Ownership. The existing sell/insurance actions join the ownership group; the duplicate generic repair flow and trade-in control are absent. Scrapping appears only for severe damage. Passenger and gift choices use portraits in the shared popup.
- The Driving Licence lives in Assets and opens three sequential questions. Selecting or cancelling is read-only; only the final submission charges the quoted fee. Failed saves keep the last question available for retry. Vehicle detail pages no longer contain licence controls.
- New US road tests cost $80 with country-relative pricing. Optional attempt `feeVersion: 2` preserves validation of older payments at their original fee. Legacy boat/pilot records and backend commands remain supported.
- New boat/aircraft purchases are hidden in the catalogue and direct offer pages. Existing owned vehicles, specifications and histories remain available.
- Prospective v2 vehicle quotes depend on value, age, wear, type and the asset's country/currency. Earlier v1 vehicle policies keep their original prices/distances, and historical receipts stay literal. Resolver quote verification and real transactions remain authoritative.
- Verification: 232 relevant cases across nine suites pass across main runs and affected reruns. Coverage includes pricing, country/age eligibility, the three-step quiz, cancellation, real SQLite failed-save/retry, ownership grouping and light/dark/large-text renderer checks. Historical v1 vehicle and frozen-decision fixtures pass. Strict app/test types and the 601-module import check pass; native geometry still needs installed-device acceptance.


## Checkpoint 5

- Named tenancies have a portrait overview and grouped Tenants & Applications, Rent & Payments, Maintenance and End Tenancy workflows. Actual payment records and past tenancies are expandable/paged; deposit returns, arrears and agreed rent remain literal.
- The resolver and UI share `tenancyActionReason`, including annual timing, market bounds, the increase cap, inspection privacy, repair quotes/funds, notice, overdue rent, independent review and its further waiting month. Ineligible eviction completion is absent; the process shows completed and outstanding requirements.
- Occupied homes no longer open irrelevant installation/gathering lists or duplicate inspections. Home invitations retain the shared portrait picker.
- Prospective background checks and independent reviews now scale with country wages (US $40/$100). New background-check requests verify their quoted fee. Existing payments keep their saved amounts, and property maintenance remains based on property value.
- Verification: six existing focused suites (263 cases), seven new core/UI cases and affected vehicle/review reruns pass. Real seeded rent periods produce arrears and reported maintenance; tests cover every eviction gate, rent bounds, no-write cancellation, actual save failures/retries and one deposit refund. Landlord UI tests close and reopen real SQLite connections. The existing property-investor cold-reopen journey also passes. Strict app/test types and the 604-module import-cycle check pass. Installed-device geometry and accessibility acceptance remain pending.

## Checkpoint 6

- One Personal Projects section shows the unfinished project's progress, actual eligibility and next action. Creating another project waits until completion; completed work has expandable, paged history. The resolver's earned-practice and legacy project rules remain unchanged.
- Competitions and routine reviews use shorter copy and structured costs. Routine/community-event failures use their own error scope. Shared outings now use separate venue and portrait popups, without truncating contacts or appending an inline list.
- Optional pet activities are grouped into Training & Events, Health & Care and Company & Outings. Reviews reuse existing pet artwork; introductions use illustrated companion selection and family invitations use the portrait picker. Existing feeding, illness, health, training, bond, funding and ownership rules are unchanged.
- [Artwork inventory and integration manifest](V2_POLISH_ARTWORK.md) records existing illustrations to reuse and the eight missing hobby illustrations plus Cell Escape layers. Generation is awaiting the Krea skill's explicit cost-preflight approval. No new art is claimed complete.
- Verification: 66 cases across seven existing suites, three new UI cases and the two existing hobby/pet cold-connection journeys pass. New UI checks cover read-only cancellation, actual later-practice completion, SQLite failure/retry/cold reopening, once-only pet payments, and unrelated-error isolation. Strict app/test types and the 605-module import-cycle check pass. Actual phone appearance and accessibility acceptance remain pending.

## Checkpoint 7

- Organised Crime follows Cult Leader in Special Careers. Three illustrated organisation choices replace invitation/decline pairs. Recruitment uses the shared portrait picker and the resolver's complete eligibility helper; promotions also recognise an already-used annual decision. Existing crew, mission, rival and leadership mechanics remain.
- Prison activities group Daily Routine, Prison Relationships, Prison Group, Family & Outside Contacts, Legal Options and Escape. Inmate/outside-contact choices use portraits without inline truncation. Direct-action errors are scoped to the prison workflow.
- [Seeded comparison](../verification/v2-polish/organised-crime.md): 25,344 independent mission trials and 768 earned career progressions per source. Cautious introductory immediate arrest falls from 36–63% to 8–11%; bold remains 36–39%, with further investigations. More cautious careers earn first/second promotions, while 116–123 of 128 still eventually face an arrest within the driver window.
- New assignments save explicit v3 facts. Reports leave strong evidence and may lead to later investigation rather than forcing immediate arrest. Old v2 incidents, cases, rolls, receipts and pending text remain literal; no new RNG draw or migration is introduced.
- Verification: the existing crime, mission, crew, prison, persistence and UI suites pass across the main runs and affected reruns (including 113 cases in the final four-suite rerun). New tests pin three old worlds/follow-up outcomes, verify a later report arrest through real SQLite failure/retry/cold reopening, and exercise read-only prison selection and a once-only conversation retry. Both full seeded source comparisons, strict app/test types and import checks pass. Device appearance/accessibility acceptance remains pending.

## Checkpoint 8

- New escape attempts use explicit v3 Cell Escape transcripts: select a shaped key, then place it in a matching lock. Higher levels add locks, repeated shapes distinguished by notch count, and tighter mistake limits. Board generation uses a separate local stream and never consumes life RNG.
- The native scene has individually accessible key/lock controls, a sliding door, unlocking feedback, wrong-key movement, reduced-motion alternatives and the existing preference-controlled sound/haptics. There is no new memory-preview, hint or assisted-mode flow. Entering Attempt Prison Escape prepares and saves the attempt directly; failed reservation remains retryable in context.
- Existing v1, original v2 and mixed-pattern v2 sessions retain their controls, timing, hints, names, journal text and exact results. Genuine starts/paused saves were captured from archived executables (`fc2294b4`, `736e1857`); the earlier original-v2 fixture stays unchanged. No version is manufactured by deleting fields from a newly started attempt.
- Reservation, one yearly attempt, sentence context, wanted status, failure/forfeit charges, once-only settlement and Time Machine behavior remain authoritative. A new escape attempt cannot submit legacy controls, and an older game cannot accept a v3 key placement.
- The requested original illustrated environment/object layers remain in the [artwork manifest](V2_POLISH_ARTWORK.md), awaiting the pending generation approval. The functional native door/key/lock presentation is implemented; generated-scene fidelity and phone appearance are not claimed complete.
- Verification: all 67 cases across six focused core/UI/state suites pass. Coverage includes five-level matching/failure paths, genuine v1/v2 complete-result hashes, queued/disabled/unmounted inputs, pause/relaunch, actual on-disk SQLite start/input/settlement rollback and retry, closed-connection reopening and an independent Time Machine branch. Strict app/test types and the 608-module import-cycle check pass. Device animation/audio/accessibility acceptance remains pending.

## Checkpoint 9

- Life shows its annual saving indicator immediately instead of waiting 150 ms. Accepted-command and repeated-input behavior, UI yielding, exact simulation, validation, checkpoints and transaction order remain unchanged.
- Optional development/internal `DREAMS_PROFILE_COMMANDS=1` observations cover the complete command and React commits/frame opportunities. Production metadata is forcibly disabled, no trace is saved and observation failures cannot affect commands.
- [Performance evidence and limits](../verification/v2-polish/performance.md) retain actual seeded checkpoints at all five requested ages, their real command trace and exploratory Node/on-disk SQLite phase measurements. These do not reproduce the reported mobile delay; no unmeasured simulation speedup or release-device acceptance is claimed. Physical iOS/Android timing and playthroughs remain open.
- Shortened several hobby descriptions, preserving all rules and previously saved events. Earlier checkpoints cover prospective result wording, quiet-year filler, natural crime copy and concise workflow reviews.
- Annual pacing regressions now consume genuinely archived pre-polish pending project frames, keeping compatibility tests independent of new lifestyle offers in newly started years. Historical editorial registration remains pinned; only current-source observation hashes were refreshed.
- Verification: immediate feedback, exact durable results, rejected repeats, failed-save rollback/retry, observer isolation and production profiling guards pass focused tests. The focused rerun passes 54 cases across five suites, including the existing vehicle-sale cancellation/rollback/cold-reopen journey through its new Ownership section. Strict app/test types and the 609-module import check pass. Final integrated results are recorded in checkpoint 10 and its linked verification report.

## Checkpoint 10 — verification and final fixes

- The initial full run reported 389 passing suites and 19 failures. Most failures were old assertions that omitted newly automatic optional lifestyle state or assumed a particular future offer preceded all others. Their focused reruns pass after checking new metadata separately, retaining literal old state, and answering genuine intervening offers. Original fixture bytes, outcome hashes, receipts, salary, care history and RNG checks remain pinned. New crime journeys require explicit v3 rules; old v2 fixture checks stay unchanged.
- One worker was killed under memory pressure and the archived 91-year family journey exceeded its 30-second allowance. Resource-separated reruns verified the worker's suite and all family assertions. The latter spent 18.3 seconds preparing its archive and completed all assertions in 31.7 seconds, so that one connected fixture journey now has an explicit 60-second allowance.
- The last unreported long-life suite was stopped before completion after its manual-activation-at-age-20 assertion was identified as obsolete. It now requires activation at the first normal command boundary; the full integrated run includes all its natural-life, mortality, wages, fees, driving and cold-save checks. The initial run is not reported as a clean full pass.
- Found and fixed a real display issue: fractional agency percentages were rounded by the shared modal formatter. Contract review, signed-result and agency-history rates now retain their exact percentages; other stat and money formatting stays unchanged. Eighteen focused game/modal cases and 19 creative UI cases pass.
- Age Up and Continue This Year both pass a real SQLite/UI-yield test for immediate saving feedback, blocked repeat input and exact resolver results. The resume case reaches its planning pause through actual archived pet/year commands rather than patched annual flags.
- Final integrated verification passes all 410 suites / 7,143 tests, all 120 unique soak lives, strict app/test types, the 613-module import check, both production Hermes exports and the SDK 58 Android internal release APK build. The [combined verification report](../verification/v2-polish/final.md) records the exact scope, the parallel worker-shutdown warning and a clean 64-test focused open-handle rerun.
- The separate shop implementation follows these gameplay changes. Original art remains tracked in the asset manifest; physical iOS/Android appearance, accessibility and release-device performance acceptance remain open.
