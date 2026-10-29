# Cult feature icon audit

The headquarters route previously used `cult/headquarters.png` for all five premises, all six upgrades and every related confirmation. Founding headquarters choices were text-only beneath the same chapel. The art itself was readable; the repeated mapping prevented players from recognising different features.

The final presentation uses the same feature subject in its option, selected row and confirmation. The five premises and six upgrades have eleven distinct subjects. Small option artwork has one focal object, consistent 36–40 px framing and no scenery. New PNGs were visually reviewed at 36 px and 96 px; the generated source and registration are recorded in `assets/generated/cult-options/manifest.json`.

| Feature | Final focal subject | Source decision |
| --- | --- | --- |
| Small Meeting Room | Blue folding chair | New: no suitable existing meeting-room symbol. |
| Woodland Retreat | Timber cabin | New: existing property cabin includes trees and landscaping. |
| Converted Farmhouse | Red-roof farmhouse | New: existing country home includes detailed landscaping. |
| Large Rural Compound | Blue warehouse building | New: existing warehouse loft is an urban property preview. |
| Grand Sanctuary | Blue chapel | Keep original `cult/headquarters.png`: a dominant building. |
| Gathering Hall | Classical hall | Reuse `pets-leisure-atlas.png` museum crop. |
| Residential Quarters | Human bed | New: existing sleep icon is a pillow; pet lodging is unsuitable. |
| Meditation Garden | Lotus on cushion | Reuse `health-legal-atlas.png` meditation crop. |
| Communal Kitchen | Orange cooking pot | Reuse `ordinary-hobby-atlas.png` cooking crop. |
| Workshop | Red pipe wrench | Reuse the simplified plumber PNG: one tool. |
| Grand Monument | Stone obelisk | New: no suitable existing isolated monument. |

Only these six missing subjects add runtime files. Existing atlas crops render directly within their measured bounds; no duplicate extracted PNGs are bundled. Original destination and property catalogues keep their intended contextual previews.

## Related action mappings

Repeated parent-category pictures also obscured individual recruitment methods, ceremonies, follower actions and financial operations. These choices and their review/information popups now reuse clear existing symbols. Uniform numerical alternatives, such as contribution amounts or fee rates, stay text-only.

| Presentation group | Subjects in feature order |
| --- | --- |
| Founding strategy: announcement / social / gathering | Megaphone / social phone / bell |
| Recruitment: street / social / open evening / referral / publicity | Megaphone / social phone / mug / handshake / star |
| Ceremony: dream circle / quiet table / community supper / starlight / open house / grand gathering | Conversation bubbles / lotus / cooking pot / telescope / key / bell |
| Member action: talk / praise / promote / assign / reward / confront / expel | Conversation bubbles / star / throne / clipboard / coins / warning bubble / separated link |
| Responsibility: deputy / treasurer / recruiter / organiser / adviser | Throne / coin chest / megaphone / bell / book |
| Treasury: records / fees / contribute / payout / annual reports | Scroll / coins / contributing hands / payout purse / archive |
| Rival response: challenge / publicity / alliance / reconcile / ignore | Shield / megaphone / handshake / white flag / separated link |
| Criticism response: apologise / transparent accounts / open gathering / replace deputy / rebrand / ignore | White flag / scroll / hall / clipboard / leader robe / newspaper |

The member's actual portrait remains on their selection header and headquarters resident list. Belief books, doctrine scrolls, rule clipboards, the communal chest, claim teapot and existing category symbols remain supported. Disbanding uses the separated-link symbol; past organisations use the archive.

## Implementation and compatibility

`src/assets/CultArt.tsx` exports `cultArtCatalog` (`file`, `subject`, optional measured `rect` and `atlasSize`) plus typed maps for headquarters, upgrades, founding strategy, recruitment, ceremonies, member actions, responsibilities, treasury, rival responses and criticism responses. The same contract feeds the small live review gallery. There are 40 source descriptors for 53 mapped feature slots; reuse follows shared meaning rather than blanket uniqueness.

All twelve original `cultImages` keys and file paths remain available for existing event artwork and saved IDs. New feature IDs are presentation-only; no headquarters IDs, upgrade IDs, commands, prices, rules, outcomes or saved data change. An unknown legacy renderer ID falls back to the original cult symbol.

`EventModal` accepts optional decorative choice artwork in a fixed 36 px slot. Choices without artwork retain their existing text layout. Labels, radio roles, selected/disabled states, explicit Choose behavior and disabled reasons remain unchanged; decorative artwork adds no screen-reader announcement.

Focused coverage is in `tests/ui/cult-art.test.tsx`: eleven distinct feature sources, native frames and crop bounds, decorative accessibility, original IDs, unknown fallback, optional artwork and the plain-choice path. `tests/ui/cult-flow.test.tsx` adds a real-store journey through founding selection, headquarters navigation, all expansion reviews and all six upgrade reviews, with the selected source verified and every review cancelled without save or database changes. Root integration runs these checks with the shared modal and cult suites.
