# Life, relationships and asset polish

This batch follows the user's second polish brief and the reference-art batch
documented in [the previous review](../product-polish/README.md). The user
requested that implementation finish before any tests or checks begin.

## Behavior

- Life resolves its current shortcut centrally: custody, actual special-career
  commitments, active businesses, employment, higher study, school, then
  childhood Profile or adult Career. Age Up keeps the primary action position.
  Settings and the former overflow destinations remain in Activities.
- All twenty homes and twenty vehicles have content specifications. The same
  rounded feature boxes appear in browsing, offer, lease and owned details.
  Existing IDs, prices and bedrooms stay literal. Owned vehicle condition comes
  from the save; catalogue mileage is explicitly **Listing mileage**.
- Person pages group time, support, money/gifts and disagreements. New actions
  have role/age/availability gates, saved annual limits and actual consequences.
  An approved parental outing consumes saved permission. Requested gifts are
  possessions purchased from the other person's available balance.
- Money requests consider the saved bond, personality, age, available funds,
  previous requests and existing debt. Gifts move real cash between accounts.
  Loan offers transfer nothing until explicitly accepted; accepted loans are
  interest-free and repayable through the existing bank interface. Their
  voluntary terms do not alter mandatory family or restitution collection.
- Reviews use a separate app-wide `app_review` preferences record, independent
  of life archives, new lives and appearance settings. Only a committed annual
  completion increments global play years. A candidate waits until all results
  are dismissed; saved negative-year observations and modal/cinematic guards
  suppress bad moments. The first prompt requires age five. Sure schedules
  another prompt in ten to twenty global years; Maybe later uses ten. Store
  APIs cannot report whether a rating was actually submitted, so the recorded
  count represents responses to the game's pre-prompt.
- Death keeps its memorial, adds one factual sentence, a short epitaph and
  compact Life at a Glance, and preserves continuation/new-life actions. Family
  history has a read-only route outside the deceased-life gameplay guard.
  Wealth/properties use frozen estate records. Happiness is labelled **Final
  happiness**: historical peaks and bank/vehicle totals were not recorded and
  are not invented.

## Save and platform boundaries

The runtime tuple is **World43 / engine45 / content22 / SQLite reader23 / v4**.
World42 migration adds only empty `personSupportRequests` and
`personActionHistory`, together with the new markers. Bound events, old people,
balances, ledger, appearance, journals and RNG are preserved. Complete
reader13–22 databases only advance their reader marker; loading old payloads
does not rewrite them or eagerly create review/settings records. Original
archive fixtures and their historical canonical hashes are retained.

The SDK57-compatible `expo-store-review` native module is optional at runtime.
Missing modules, development/web builds, background state and unavailable
stores quietly skip the request. The adapter does not open an external review
URL. A fresh native build is needed to include the newly added module.

## Verification

The focused checks pass after correcting invalid test setup and scoping UI
queries to the active modal. App and test TypeScript checks pass. The runtime
import check covers 427 modules with no cycles, and the notice inventory check
passes with the SDK-compatible review dependency.

Both offline production Hermes exports succeeded. Their source maps contain
all 36 changed runtime files exactly; all 26 illustration/catalogue PNGs from
the preceding art batch are present byte-for-byte (6,103,179 source bytes).
See [bundle evidence](offline-bundles.json).

The browser review contains 36 production RN trees and 72 captures, including
the scroll bottoms. It covers 390px light layouts and 320px dark layouts with
1.4× text. The dimension mocks use the actual RN export, and the home-chip
column assertions verify the layout change. This is a CSS/SVG rendering of
the actual component trees, **not native Android/iOS screenshots**.

| View | Light | Dark / large text |
| --- | --- | --- |
| Life shortcut | [School](life-context-school-light.png) | [School](life-context-school-dark-large.png) |
| Home features | [Offer](asset-property-offer-light.png) | [Offer](asset-property-offer-dark-large.png) |
| Owned car | [Details](asset-owned-vehicle-light.png) | [Details](asset-owned-vehicle-dark-large.png) |
| Person / loan | [Offer](person-loan-offer-light-bottom.png) | [Offer](person-loan-offer-dark-large-bottom.png) |
| Review pre-prompt | [Modal](review-preprompt-light.png) | [Modal](review-preprompt-dark-large.png) |
| Memorial | [Summary](death-summary-light.png) | [Summary](death-summary-dark-large.png) |

Full regression is running. Its final result must be recorded before delivery.
