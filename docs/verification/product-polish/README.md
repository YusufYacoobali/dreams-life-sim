# Reference polish — integrated review

This batch follows the supplied six-phase brief. The comparison baseline is
`work` at `8891d4d`; the existing birth journal and avatar system are retained.
Current save markers are **World42 / engine44 / content21 / SQLite reader22**,
with the existing v4 archive container.

## Completed

| Area | Result |
| --- | --- |
| Artwork |24 original event/pet icons; one cached resolver covering all source registries and60 literal popup IDs. Childhood, family and friends get relevant illustrations. Romance keeps the heart and pink badge. Other categories use distinct light/dark badge colours. |
| Relationships |64px portraits beside saved roles and14px red/amber/green affection bars; actual Mother/Father/adoptive/guardian labels, search, filters, virtualisation and actions retained. |
| Person Profile |Portrait and identity header, grouped relationship/wellbeing stats and illustrated actions. Shared stat tracks, including pets, are14px. |
| Education |Saved primary/secondary start/completion milestones and higher-education completion/failure results, with actual school names. Existing secondary completion is not duplicated. |
| Event participants |New events/results freeze participant names and roles. Legacy decisions derive labels only from their existing bound IDs. Saved prose, choices, effects and name-collision handling remain intact. |
| Catalogue |20 homes and20 vehicles with40 distinct illustrated subjects. All19 original offers keep IDs, prices and order; seven possessions keep their art. |
| Renting |Browse, review, sign, monthly payments and move-out. A lease appears as residence in Assets, Life, My Life and Household; it never becomes owned property or landlord income. |
| Flows and copy |Removed Business Other → Operating model. Fixed zero-bond pet death delivery and added a saved memorial. Shortened pet/hobby setup,37 other UI screens and future family/work/care/business results. Travel row artwork fits; travel/emigration companions visibly start unchecked; emigration restrictions use inline text. |

The lease charges its disclosed first month on signing, then once per calendar
month. It is month-to-month, with no deposit and no refund of rent already paid.
The ordinary housing allowance is removed while leasing; non-housing household
bills remain. Owned-property upkeep and landlord controls are retained. A move,
owned-home move-in, household change or tenant death ends the lease. These are
game rules, not a claim to model a particular country's tenancy law.

## Screenshots and references

The screenshots render **actual production React Native component trees** with
a browser CSS/SVG adapter. They are **not Android/iOS device screenshots**.
Routing and hardware are mocked; Ionicons use their real bundled font. The
adapter approximates native text shaping, font scaling and scroll layout.

| Actual screen title | Original design inspected | Before/after evidence |
| --- | --- | --- |
| Activities |`05-activities-main-menu-overview.png`, Activities panel |[Top](activities-light.png), [Travel/Crime](activities-light-travel.png), [small/dark](activities-dark-large-travel.png) |
| Assets |`07-assets-finances-investing-properties-vehicles.png`, Assets/Properties/Vehicles panels |[Overview](assets-light.png), [Investments](assets-light-investments.png), [small/dark](assets-dark-large-investments.png) |
| Relationships |`08-relationships-dating-marriage-family.png`, Relationships panel |[Light](relationships-light.png), [small/dark](relationships-dark-large.png) |
| Person Profile |`08-relationships-dating-marriage-family.png`, Person Profile panel |[Light](person-light.png), [small/dark](person-dark-large.png) |
| Travel |`10-health-wellness-travel-pets.png`, Travel panel |[Overview](travel-light.png), [destinations](destinations-light.png), [unchecked companions](trip-companions-light-travel-with.png) |
| A New Country |Existing emigration presentation, with the travel reference style retained |[Inline information](emigration-light.png), [unchecked companions at large text](emigration-dark-large-move-with.png) |
| Decision Event |`16-event-modals-milestones-and-outcomes.png`, Decision Event/A Special Date/You Graduated panels |[Childhood](event-shoe-principle-light.png), [friendship](event-friend-different-budget-light.png), [romance](event-partner-alone-time-light.png), [large-text actions](event-friend-different-budget-dark-large-actions.png), [new pet memorial](event-new-pet-memorial-light.png) |
| Rent a Home |Properties/Property Details panels in07 |[Android layout branch](rentals-android-light.png), [iOS layout branch](rentals-ios-light.png), [rented residence](rented-assets-ios-light-your-residence.png) |

The new lease screens have after-only captures because the feature did not exist
at the baseline. [The catalogue gallery](../catalogue-polish/README.md) shows all
forty home/vehicle subjects at40/56/128px on light and dark backgrounds.

The review contains54 screenshots and60 portable component-tree exports.
Normal captures use390×844 at font scale1. Stress captures use320×844, dark
mode and font scale1.4 (travel1.6). The review checks decoded images, local SVG
clip references, real font loading and horizontal overflow. Long modal content
scrolls; the final action remains reachable. See [browser checks](browser-checks.json).

## Checks

- Strict application/test TypeScript and runtime import checks pass;411 modules,
  zero cycles.
- The full `npm test` run exercised258 suites/3,367 tests in33m13s. It found
  stale expectations in three suites: the previous hobby sentence, and two
  tests treating the now-current reader22 as a future version. The assertions
  now use the new sentence and genuinely future reader23; previous-reader21
  coverage was added. All original fee, proficiency, ledger, row-preservation
  and save assertions remain.
- The final12 affected suites pass323 tests after those corrections and the
  final display-copy follow-up. Combined verified coverage is **258 suites /
  3,368 passing tests**, including the added reader21 case. This is a full run
  plus focused reruns, not one initially green invocation. See
  [the exact results](test-summary.json). The final eight-domain-file follow-up
  changes only result display bodies and two pure participant-label imports;
  rules, command IDs, prices, mutations and RNG calls are unchanged.
- Real SQLite tests cover school milestones and pet memorials through queued
  events, failed saves, retry and cold reload; rental cancellation, duplicate
  confirmation, stale callbacks, first/monthly payment and move-out are covered.
- Catalogue tests buy and round-trip all forty homes/vehicles and load an old v4
  owned-home save. Historical archive fixtures and original canonical digests
  remain unchanged; version envelopes and only empty new rental history are
  excluded when reproducing pre-feature hashes.
- Offline Android/iOS Hermes exports pass. Every one of the26 new runtime PNG
  files is present unchanged. [Bundle evidence](offline-bundles.json) records
  byte counts, hashes and Hermes headers; new art totals6,103,179bytes.
- Generated artwork and measured transparent bounds are recorded in
  [the event/pet manifest](../../../assets/generated/polish/manifest.json) and
  [the catalogue manifest](../../../assets/generated/catalogue-art.json).

No new artwork is missing for the requested features. Native visual approval,
device text rendering, GPU performance and physical interactions remain
unverified: this environment has no Android SDK/emulator/adb and no macOS/iOS
simulator or attached device. Browser captures and platform-branch component
tests do not establish device acceptance.

## Reproduce

Portable before/after tree exports are retained in `trees-before/` and
`trees-after/`. They contain only generated fictional review data, component
props and repository-relative artwork references.

```sh
DREAMS_POLISH_TREE_BASE=docs/verification/product-polish/trees node tools/build-product-polish-review.cjs
PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright CHROMIUM_PATH=/usr/bin/chromium node tools/capture-product-polish-review.cjs
```

The HTML review is generated at `/tmp/dreams-polish-review.html`. To refresh
current screen trees, export the capture tests with
`DREAMS_POLISH_CAPTURE_DIR=/tmp/dreams-polish-after`; the relevant files are
`product-polish-review.test.tsx`, `relationship-polish.test.tsx` and
`travel-planning-polish.test.tsx`. The baseline trees were exported using the
same scenarios at8891d4d before applying this batch.
