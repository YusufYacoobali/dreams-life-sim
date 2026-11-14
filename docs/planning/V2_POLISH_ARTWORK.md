# V2 polish artwork inventory

Style source: [artwork and delivery](artwork-and-delivery.md), the existing transparent ordinary-hobby, pets/leisure, career and health/legal atlases. Keep rounded silhouettes, saturated colour, softly dimensional materials, diffuse upper-left lighting and readable 40–64 px framing. Labels and interaction stay native.

## Reuse

| Use | Existing registry |
| --- | --- |
| Owned property, applicants' homes and vehicle reviews | `CatalogArt`, by the actual asset's catalogue ID |
| Tenant/applicant, guest, crew and inmate selection | Shared `Portrait` through `PersonPicker` |
| Pet profile and introductions | `CompanionArt`, by actual species |
| Pet training/event, care and company | `LifestylePetArt.rosette`, `PetsLeisureArt.vet/paw`, `CompanionArt` |
| Guitar, painting, photography, chess | `PetsLeisureArt` |
| Reading, gaming, cooking, gardening | `OrdinaryHobbyArt` |
| Court, police, prison, meals, visits, release | `HealthLegalArt` |
| Existing careers and the later shop | Existing career, Cult and health/legal illustrations; no new shop art |

## Generated and integrated assets

These assets were generated with OpenAI's built-in `image_gen.imagegen` tool, as requested. No Krea generation was submitted. [Prompts, original source drafts and SHA-256 provenance](../verification/v2-polish/artwork-generation.json) are retained. Final PNGs preserve the generator's original bytes; the source drafts are outside the runtime asset directory.

| Bundled file / stable IDs | Coverage | Integration |
| --- | --- | --- |
| `assets/generated/expanded-hobby-atlas.png`: running, swimming, writing, pottery, singing, coding, fishing, dancing | Eight isolated illustrations with real alpha: blue running shoe; goggles and cap; notebook and pencil; glazed bowl and clay pot; microphone; laptop with unlabelled blocks; rod/reel/float; dance shoes. The spacing revision prevents neighbouring sprites entering a crop. | Measured typed rectangles in `src/assets/expandedHobbyLayout.ts`; all eight `HobbyArt.tsx` branches now use the new illustrations, including their registered event artwork. Existing hobby illustrations remain unchanged. |
| `assets/generated/cell-escape-background.png`: `cell.environment` | Portrait illustrated prison cell, cool stone and warm side light, empty door recess and floor. No controls or text. | Background in `src/minigames/escape/CellEscapeGame.tsx`; bundled and preloaded before a new v3 reservation. |
| `assets/generated/cell-escape-objects.png`: door, window, six keys, lock plate, open padlock | Separate transparent door slab and window; circle/triangle/square/diamond/star/hexagon key bows on smooth gold shafts; blank lock plate; open padlock. Exact one/two/three teeth and matching lock holes/markers are native overlays, so generated pixels cannot alter puzzle facts. | `src/assets/cellEscapeLayout.ts` and `CellEscapeArt.tsx`; animated door and native accessible controls remain separate. Original v1/v2 scenes retain their rendering and loading behavior. |

## Review and limits

All 18 crop bounds were checked against the PNGs' alpha channels. Strong silhouette pixels stay inside their crops; every native key tooth meets its illustrated shaft and stays in bounds. [Pixel review](../verification/v2-polish/artwork-review.png) covers hobby icons at 40/64 px on light/dark surfaces and all six key shapes with one/two/three teeth. Runtime PNGs total 5,530,633 bytes and appear byte-for-byte in both production exports.

[Artwork verification](../verification/v2-polish/artwork.md) records the focused UI, compatibility, persistence and bundle checks. This is generated, inspected and integrated artwork; physical-device appearance and animation acceptance remain open.
