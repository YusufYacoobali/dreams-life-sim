# Dreams Shop implementation

Source request: [shop redesign plan](V2_SHOP_REDESIGN_PLAN.md) and the three supplied reference images. Implemented after the master gameplay changes, in an isolated checkout while their long automated checks continue.

The shop has a purple/blue Full Unlock banner with the existing gold crown and Best Value badge; compact Career Packs, Time Machine and God Mode rows; and one four-career container. Organised Crime retains free access through the existing Special Careers page. One View All Careers action opens that page during an active life. Without an active life, the root shop remains usable for purchases and explains why career browsing is unavailable.

All eight products open reusable detail popups. Full Unlock has a lavender header, three illustrated included benefits and a purple purchase button. Individual products use their existing artwork, three accurate benefits and the blue purchase button. Only the detail button starts payment. Localized `priceString` values use raw native Text, including the button, so the game's whole-number formatter cannot round them.

`/shop` belongs to the game's Activities navigation. Settings and no-life contexts retain `/store`; both render `ShopScreen`. Contextual paywalls reuse the detail content within their existing native Modal, including individual/bundle choices and Restore Purchases. Successful access resumes the original pending UI action once and preserves its normal gameplay confirmation. Changed/unmounted contexts and stale buttons cannot resume or purchase.

Ownership uses the existing verified purchase state. Testing access does not label an unpurchased item Owned. Busy state blocks payment duplicates, product changes, close and Android Back; cancellation and errors stay retryable. Missing prices have a refresh path. Light/dark colors, enlarged text, reduced-motion transitions, safe-area constraints and scrolling body/persistent purchase controls are supported.

No new packages or artwork were added. `catalog.ts`, `service.ts`, `native.ts`, `access.ts` and `hooks.ts` remain unchanged, as do product IDs, entitlement mappings, gameplay permissions and save formats.

## Verification

- The focused purchase UI/navigation run passes 52 cases. Coverage includes every popup's content, localized price and existing artwork; full and career bundle ownership; loading/unavailable/cancel/failure/restore paths; repeated and stale native callbacks; retained gameplay confirmations; the testing override; root/no-life navigation; and small dark screens at doubled text scale.
- Strict app/test types and the 613-module import-cycle check pass.
- The complete purchase suite passes all 110 cases across five suites. Final full regression, final Hermes exports and native inspection are recorded after final integration. Renderer assertions establish component structure and behavior, not actual device geometry or payment-provider sandbox acceptance.
