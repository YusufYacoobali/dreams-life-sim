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

## Missing original assets

Generation has not been submitted. A Krea medium-quality draft batch is awaiting cost-preflight approval; its live model schema exposes transparent PNG output but no CU prices. Native visual acceptance is separate from image review.

| Planned file / stable IDs | Brief | Integration |
| --- | --- | --- |
| `assets/generated/expanded-hobby-atlas.png`: running, swimming, writing, pottery, singing, coding, fishing, dancing | Eight isolated illustrations, transparent 4×2 atlas. Blue running shoe; swimming goggles and cap; notebook and pencil; glazed pottery bowl; microphone; laptop with abstract unlabelled blocks; rod/reel with float; dance shoes. No text, people, logos, baked buttons or panel borders. Keep wide transparent gutters. | Measured typed rectangles in `src/assets/expandedHobbyLayout.ts`; replace the eight line-icon branches in `HobbyArt.tsx`. |
| `assets/generated/cell-escape-background.png`: `cell.environment` | Portrait view into a friendly stylised prison cell, cool stone, warm side light, clear central door recess, no locks, keys, labels or controls. | Full-screen background in the new escape scene; controls remain separately positioned and accessible. |
| `assets/generated/cell-escape-objects.png`: `cell.door`, `cell.key.*`, `cell.lock.*` | Separate transparent door layer and oversized fictional geometric keys/locks (circle, triangle, diamond, square). Distinct silhouettes, gold keys, coloured lock plates. No realistic mechanism details or embedded instructions. | Typed clipped objects layered in the new escape scene; native hit targets, progress, animation and reduced-motion feedback. |

Keep original outputs and prompt/reference provenance; inspect alpha, clipping and silhouettes before integrating. Optimise production PNGs without changing geometry or losing alpha. Check every icon at 40 and 64 px on light/dark surfaces. If generation cannot be completed, this manifest is the explicit remaining art work; do not claim placeholder icons meet the requested style.
