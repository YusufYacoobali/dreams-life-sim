# V2 polish and gameplay delivery

Requested scope: [Master V2 plan](V2_POLISH_GAMEPLAY_PLAN.md). Starting source: `ecab72ac`, branch `v2`.

Each checkpoint includes focused verification before its commit and push. Existing saves, historical outcomes, purchase ownership and the four-tab design remain compatibility boundaries. Changes to deterministic gameplay or optional saved state require their own compatibility coverage.

| Checkpoint | Status |
| --- | --- |
| 1. Shared UI, portrait picker, scoped errors | Implemented; focused checks pass |
| 2. Actor/Model presentation and casting | Implemented; focused checks pass |
| 3. Automatic lifestyle activation and legacy compatibility | Implemented; focused checks pass |
| 4. Vehicles and driving licence | Implemented; focused checks pass |
| 5. Landlord and properties | Pending |
| 6. Hobbies, pets and artwork | Pending |
| 7. Organised Crime balancing and prison UI | Pending |
| 8. Versioned Cell Escape replacement | Pending |
| 9. Writing and measured performance | Pending |
| 10. Regression, native playthroughs and final fixes | Pending |

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


## Queued follow-up

After the master gameplay/polish checkpoints, implement the user's separate Dreams Shop redesign from the subsequently supplied plan and three reference images. Keep its commits separate. Preserve all eight product IDs and RevenueCat entitlements, use localized prices, keep free careers free, add the in-game `/shop` route and reusable product-detail popups, and retain `/store` for Settings/no active life.


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
