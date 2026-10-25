# Final UI polish — 25 October 2026

This presentation-only update starts at `bf77d2df`. Game rules, commands, prices,
RNG, platform IDs, navigation targets and save formats are unchanged.

## Platform marks

Instagram has a saturated colour gradient, YouTube is red, Twitch is purple and
X is black. All four original vector paths retain a consistent white tile and
70% inner footprint. Both themes use the same palette; every fill/gradient stop
has at least 3:1 graphical contrast against the tile. Separate gradient IDs
allow several Instagram marks on one screen. Existing accessible labels and
decorative hiding remain intact. No package, font or image download is added.

## Cult artwork

The [feature audit](CULT_ICON_AUDIT.md) replaces the repeated headquarters mapping
with eleven distinct subjects for five premises and six upgrades. Related
recruitment, ceremony, member, treasury, rivalry and recovery choices use
matching subjects in their options and review popups. Forty source descriptors
support 53 feature mappings; the twelve original saved illustration IDs remain.

Six newly generated subjects add 364,717 runtime bytes. Existing clear PNGs and
measured atlas crops supply the others. Original PNGs remain byte-identical.
Optional decorative 36px choice art leaves plain popup choices unchanged.

## Relationship filters

The one horizontal scrolling row is **All → Family → Friends → Romance →
Deceased**. Labels stay on one line and retain 48px touch targets at narrow
widths and larger text sizes. Selected tabs scroll into view. Work / School is
removed; living work and school contacts remain in All. Search and list reset
continue to work, and changing filters performs no save writes. Deceased
contacts retain their recorded details and newest-first death-date ordering.
Other screens retain their existing wrapping tab layout.

## Special Careers

Section order is Performance & Public Life, Independent Careers, Service &
Royalty, Qualifications & Training. Independent Careers is Business Owner,
Cult Leader, YouTuber, Streamer. Business Owner and Cult Leader appear before
the existing `creatorKinds.map()` rendering. The diff only moves existing rows;
icons, descriptions, navigation and game logic are retained.

## Verification

The [live artwork gallery](verification/action-icons/index.html) consumes actual
PNG/atlas sources and the shared brand palette and SVG paths. Browser review
loads all 198 images and eight marks without broken assets or JavaScript errors
at 24/32/36/48/88px. This is an artwork review, not a native-device capture.

Focused coverage verifies **157 cases across 10 suites**, spanning platform
colours and legacy saves, relationship search/reset/filtering, cult options and
cancelled-review save immutability, shared popup hosting/layout and untouched
plain choices. The initial run passed 154 cases; three new structural container
queries needed test-only correction, and both affected suites then passed all
15 cases. Final source is unchanged by those query fixes.

Strict app/all-test types pass. The 512-module runtime import graph has no
cycles, and the refreshed notice inventory check passes. Game, persistence,
package/lock and historical fixture files are untouched. Both production
Android/iOS Hermes exports pass: all 11 changed runtime sources match the maps,
and all 40 cult source assets match the exported bytes. The full original design
sheet is absent from both runtime asset lists and excluded from EAS upload by
the existing `/design/` rule.
