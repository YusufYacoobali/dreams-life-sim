# Original game artwork

activity-atlas.png was generated with the image-generation tool on 18 October
2026 for Dreams: Life Simulator. The original output is retained separately at
/workspace/generated_images/exec-3acd6307-af4d-4200-a67c-6aedfb64e8f3.png.

The 1448×1086 RGBA atlas has twelve 362×362 cells: education, career,
relationships, property; money, vehicle, travel, pets; wellbeing, crime,
journal, birthday. The source PNG has transparent pixels and contains no UI text.
The native Illustration component clips cells without editing the source.

Generation direction: original friendly rounded cartoon objects, softly
dimensional shading, consistent lighting, strong silhouettes, vivid colours,
transparent background, no labels or logos. The reference style informed the
brief; the reference images were not copied or sliced into production art.

Status: generated and visually reviewed at source resolution. Integrated into
the asset registry. Actual-size running-app review remains pending. This is a
first sample family, not completion of the full artwork manifest.

death-memorial.png was generated on 18 October 2026 for the dedicated death
screen: a respectful rounded stone memorial with a floating pink heart, on
transparent background. The unmodified original remains at
/workspace/generated_images/exec-7f8fb977-0638-4606-b446-060824c47969.png.
Source-resolution inspection is complete; native-device comparison remains
pending. This illustration follows the dedicated death reference's subject and
palette without copying its pixels.

portrait-layers.png was generated on 18 October 2026 as an original grayscale
layer sheet with eight age stages and seven removable hairstyles. The original
1254×1254 RGBA output remains at
/workspace/generated_images/exec-fe1a70af-e12a-425f-8f7d-700b94699dbe.png.

The source grid is not perfectly aligned. Measured source rectangles in
src/assets/portraitLayout.ts clip it without changing its pixels. The native
CharacterPortrait renderer composes a tint mask with multiply shading, applies
one of four face proportions, six skin tones, eight hair choices (including
bald), five hair colours and age-based greying. Gender identity does not select
or restrict appearance.

Reviewed the original output and a browser rendering at 120 pixels covering
eight ages of the same DNA plus 24 skin/hair/shape combinations. The inspection
harness is tools/preview-portraits.cjs. It establishes clipping/composition
feasibility, not Android/iOS blend-mode support, native performance or final
reference acceptance. Native rendering still needs device validation.

ownership-atlas.png was generated on 18 October 2026 as an original sheet of
sixteen homes, vehicles, possessions and portfolio illustrations. The unmodified
1376×1143 RGBA original remains at
/workspace/generated_images/exec-56dc7fa2-20e1-4493-ac93-7f1302cb5aba.png.
Measured source regions in src/assets/ownershipLayout.ts preserve aspect ratios;
generic building/car categories are reused across related catalogue entries.
All sixteen subjects were inspected in the browser at 128px using
tools/preview-ownership.cjs. A neighbour-pixel artefact below the guitar was
identified and excluded by its source rectangle. Native-device fidelity remains
pending.
