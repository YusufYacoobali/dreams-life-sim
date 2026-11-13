# V2 polish and gameplay delivery

Requested scope: [Master V2 plan](V2_POLISH_GAMEPLAY_PLAN.md). Starting source: `ecab72ac`, branch `v2`.

Each checkpoint includes focused verification before its commit and push. Existing saves, historical outcomes, purchase ownership and the four-tab design remain compatibility boundaries. Changes to deterministic gameplay or optional saved state require their own compatibility coverage.

| Checkpoint | Status |
| --- | --- |
| 1. Shared UI, portrait picker, scoped errors | Implemented; focused checks pass |
| 2. Actor/Model presentation and casting | Pending |
| 3. Automatic lifestyle activation and legacy compatibility | Pending |
| 4. Vehicles and driving licence | Pending |
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
