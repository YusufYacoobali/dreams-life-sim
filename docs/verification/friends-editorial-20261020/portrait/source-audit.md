# Bounded portrait/source audit — 20 October 2026

Scope: read-only inspection of integration/opening-next `b692184`, CharacterPortrait/portraitLayout/appearance/model source, original generated provenance, approved design01/design02, and all18 exact PNG paths in `/tmp/dreams-autonomy-accepted-captures.json`. Every PNG was personally opened with view_image, as were both references and the original bundled1254×1254atlas. No image edit/generation, preview server, native interaction or test gate was performed. Parent redirected priority to Exercise after this bounded review.

## Prioritized concrete finding

**P2 visual polish: facial detail is washed out in the actual Android24 renderer.** In `/tmp/dreams-autonomy-native-creation.png` and both appearance-grid captures, irises/eyebrows/mouth have much weaker separation than the approved01/02portraits. In `/tmp/dreams-autonomy-native-school-final.png`, the actual52px Alex portrait reads largely as a pale face silhouette framed by hair; eyes and mouth are hard to distinguish. This is present in undimmed captures, not only the grey modal backdrop.

The source cause is explicit in `src/assets/CharacterPortrait.tsx:25–28`: API<29 uses a full skin-colour tint mask plus only35%normal-opacity grayscale detail, while API29+/iOS use multiply at full detail. The API24 fallback keeps skin/hair palette differences but suppresses facial identity cues. This is an existing visual limitation, not a new engine/data defect or a claim of a measured accessibility contrast failure. Next bounded fix should improve the legacy-Android tint/detail composition while preserving the stored four-trait appearance, original source PNG and intended palettes; compare actual52/88/118/140px output against the references. Do not invent eye/accessory schema to address a rendering issue. Actual Android29+/iOS pixels have not been inspected here.

## Supported coverage and observed limits

- The actual implementation has eight age heads; six stored skin choices; four face proportions; bald plus seven removable hair layers; five hair colours with derived greying. Hair is intentionally latent before age3. The model's bounds exactly match those arrays. Gender does not select or restrict appearance. These are working source features, not just an atlas in a directory.
- Actual normal/130%opening grids show representative bald/short/side-swept/shoulder/curly/bun/afro shapes and different skin/hair palettes. The four-column grid, selected outline and primary Continue control are visible. No neighbour-cell bleed or gross hair misalignment was seen in those particular native combinations. This does not accept every possible pair or every age.
- The supplied Alex captures show the same real person at newborn/age1 and age6; bald infancy to the stored long-curly style follows the source rule. Warm/cold age6 captures retain the same face/hair. They do not establish teen/adult/oldest-stage native identity continuity. The creation previews are explicitly adult previews, not infant captures.
- No fresh random appearance is sampled in CharacterPortrait: age-stage and greying are pure lookups/calculation. Source preservation alone cannot establish visual continuity through all eight heads; the README's earlier120pxbrowser32-case inspection is historical feasibility evidence. No stored native age3/12/19/40/60/80/95boundary matrix was supplied here.
- The accepted-capture manifest pins runtime `5245fbb`, not currentb692184. A git diff confirms CharacterPortrait, portraitLayout and portrait-layers.png are unchanged between those commits, so the inspected pixels are relevant to this renderer. They cannot accept newer unrelated screens, Settings motion, platform packaging or all native accessibility.

## Original-art/registry evidence

The actual atlas is wired by a static local require; measured head/hair rectangles and model-bound traits supply every currently supported portrait option. Existing per-family typed art components/maps are real registries, so absence of a file literally named registry.ts is not proof of missing art. No missing portrait bitmap or required currently-supported trait index was found. Proposed accessory/eye-feature targets in the planning document are not treated as a newly authorised schema requirement.

The general requirement to validate all permitted combinations still needs representative actual-size native evidence across age boundaries, palettes and hair overlap; current accessibility tests prove semantics, not visual layer coverage. This is an acceptance gap, not grounds to regenerate the whole portrait catalogue.

The generated-art README identifies the original production path `/workspace/generated_images/exec-fe1a70af-e12a-425f-8f7d-700b94699dbe.png`; that external workspace file is unavailable now. The committed atlas remains present. I could inspect its pixels and confirm unchanged git content across the capture/current commits, but could not independently compare it to that missing external master. Keep the historical provenance record; do not claim a fresh master-byte comparison.

The visible Expo gear is development chrome and was excluded from findings. Circular neck/hair edge crops were not called defects without an unexpected visible loss. No new eye, accessory, gender, clothing, NPC-role or expression feature was proposed from the target manifest alone.
