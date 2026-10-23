# Automatic NPC artwork

The five focused avatar suites now pass (33 tests), including the exhaustive 1,966,080-layer-plan check and existing avatar V2 integration. The first run exposed a gallery-test root replacement that invalidated React Native Testing Library's query root; keeping the initial Gallery component mounted fixed the harness. No product change was required. Whole-app regression and capture review are coordinated separately.

The existing 16 illustrated heads, their eight age stages, and all rendering geometry stay intact. In particular, the approved men's layer plans and manual preset choices have no geometry changes.

## Artwork audit

The indices below refer to existing artwork, not a person's gender identity. All 16 presets, eight hairstyles and 16 outfits remain available in the player editor without restrictions.

| Artwork | Masculine | Feminine | Explicitly neutral / shared |
| --- | --- | --- | --- |
| Head identity | 0, 2, 3, 5, 7, 9, 12, 14 | 1, 4, 6, 8, 10, 11, 13, 15 | 0, 4, 5, 6, 12, 15 |
| Hairstyle | 1, 2, 3 | 4, 5, 6, 7 | 0, 1, 2, 3, 6, 7 |
| Outfit | 0, 2, 7, 9, 12 | 1, 4, 6, 8, 10, 11, 13, 15 | 0, 2, 3, 5, 7, 9, 12, 14 |

Automatic defaults use the appropriate artwork pool, including shared styles. Nonbinary defaults use the explicit neutral pool with a balanced selection of six facial drawings. Skin tone, saved facial contour and hair colour retain their existing creation/inheritance draws. Compatible hairstyles retain their existing draw; incompatible defaults use a deterministic artwork selection. Head and outfit selection use no simulation randomness.

## Save and identity rules

New generated NPCs store an explicit head identity and outfit plus an optional provenance fingerprint over their scalar appearance. Any appearance edit invalidates that fingerprint; it never authorizes replacing a deliberate saved look. Ageing changes the illustrated age stage while retaining that head identity and latent hair/outfit choices. Ages 0–2 retain the existing baby-head-only rendering.

Old saves are not eagerly rewritten. The shared `Portrait` wrapper supplies render-only compatible defaults only for built-in parent/NPC IDs with exactly the original four appearance fields. The original player, active player, either side of every saved legacy handover, explicit head/outfit choices, and custom/provenance markers are excluded. Unknown external IDs retain their old rendering. The legacy key uses the person ID, so restoring a branch cannot recast that person.

The ordinary Continue as Child command freezes an eligible legacy NPC child's already displayed artwork before switching the active player. This prevents the player exclusion from changing that child's likeness. Existing custom and explicit appearance records remain exact.

## Creation-path audit

- Birth parents: private `createLife` person constructor, followed by the unchanged exact player-appearance override.
- General NPCs: `createContact`, shared by school teacher/classmate/parent, campus students, workplace colleagues and supervisors, social and dating contacts, healthcare, prison and crime contacts, business staff, career/service teams, creator crews, political rivals, royalty founders/heirs, leisure contacts and orphan guardians.
- Adoption: `createContact`.
- Biological children: `createContact` followed by the existing inherited scalar draws, then the same automatic artwork helper. The inherited face preference, skin and hair colour remain intact.

Default NPC employment pools are pinned to the 16 pre-expansion roles in their original order. Explicit professional roles remain possible, with their actual qualification, clear-record and recorded-experience gates. Expanding the job catalogue therefore cannot reroll family background jobs or invent management experience.

## Authored verification

- `tests/game/automatic-appearance.test.ts`: complete tag coverage; diversity; all eight age stages; original NPC RNG bounds/order; central creation paths and inheritance; manual choices; explicit/custom/fingerprint mismatch; active and former-player exclusions; stable child handover; job-pool pinning.
- `tests/game/automatic-appearance-save.test.ts`: unchanged cold SQLite payloads; source-preserving snapshot branch restoration; explicit and automatic choices; inherited child likeness after handover/reload.
- `tests/ui/automatic-avatar-gallery.test.tsx`: actual shared renderer; 50 generated male and 50 generated female NPCs across ages/skin tones in light/dark galleries; 18 neutral examples; 52/88/140px previews; legacy-wrapper and deliberate-choice rendering.

Set `DREAMS_POLISH_CAPTURE_DIR` during the coordinated test phase to write native component trees for the gallery renderer. Capture files include SVG clipping metadata used by the clothing/neck layers.
