# Final polish: inline requirements and purchases

Audited `app/` and `src/ui/` against `3c797e2` before editing. The existing
`Body muted` component already supplies standard secondary text in both themes;
no new notice component or screen layout is needed.

## Decorative notices removed

| Screen | Previous notice | Presentation |
| --- | --- | --- |
| Service / Astronaut | Unmet entry requirements with blue background and left border | Plain secondary text immediately above the disabled application action |
| Service | Qualification status in a blue panel | Plain secondary text beside the current service information |
| Black Market | Market-unavailable explanation in a blue panel | Plain secondary text; existing disabled purchase actions retain their reasons |
| Will | Saved/draft/default-instructions message in a blue panel | Plain secondary text with its live-region announcement retained |
| Offer details | Unmet purchase/rental requirement in primary text | Standard secondary text, also included in the disabled button's accessible name |

Emigration's application/departure requirements already use plain secondary
text. They were retained. Family planning/adoption notices belong to the partner
workstream; that agent was notified of both blue requirement wrappers and reports
their removal. Medical and Life screens are owned by their respective workstreams.

## Coloured states intentionally retained

These are interaction or gameplay states rather than informational callouts:

- Appearance presets/swatches, creation gender, settings theme and legacy heir
  choices use real selected/checked states.
- Emigration destinations, route/companion choices; divorce custody choices;
  service branches; post/music choices; prison routines; and job hours use
  actual selectable controls.
- Property purchase-method controls, filter tabs, finance filters, hobby routines
  and event approaches use actual selected controls.
- Relationship, asset-listing, achievement, family-tree and ordinary action rows
  use pressed states or the currently selected person. Relationship shortcut
  buttons are navigation actions.
- Chart bars and stat/progress tracks convey values. Result tones, real errors,
  primary buttons, opening/death scenes and modal backdrops retain their roles.

The audit checked both theme references and hard-coded background colours.
No remaining ordinary decorative blue explanation was identified in the owned
screens. The integrated medical, partner and Life changes require root review
after merging; this document is not a physical-device inspection claim.

## Durable purchase navigation

Cash purchases, mortgages and signed home leases use the existing dispatch and
SQLite commit path. Only a successful dispatch schedules return to `/assets`.
The following render closes the local confirmation first, then calls Expo
Router's `dismissTo`, which returns through existing navigation rather than
pushing another details or Assets screen. Life, person and committed revision
must still match; an unmounted details screen cannot redirect another screen.
A one-shot token guards duplicate navigation. Moving out of a lease keeps the
existing detail behaviour.

The persistent result remains in `world.pending` and is rendered by the shared
stack-level result host in the Assets context. Navigation never acknowledges it.
Cold loading and explicit acknowledgement retain their existing save semantics.

Connected component tests exercise actual on-disk SQLite transactions, rollback,
warm retry, cold load, duplicate confirmation, cancellation, stale callbacks,
insufficient funds and leaving during a save. Property, vehicle and possession
cases render the real Assets component after a mocked router handoff and verify
the new inventory plus one saved result. Router/native-stack behaviour and
physical-device pixels are separate integration checks owned by the root task.

## Focused checks

Nine unique suites / 43 tests passed across the purchase, property-method,
rental, feature, legal-review, emigration-default, service and will flows. The
purchase suite was rerun after its final insufficient-funds case was added;
counts above replace the earlier version of that suite rather than adding it
twice. `npm run typecheck` also passed. Final whole-game regression and platform
exports belong to the integrated root source.
