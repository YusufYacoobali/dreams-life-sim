# Original game artwork

school-atlas.png was generated on 19 October 2026 as an original six-subject
school/evening-study family. The unmodified 1536×1024 RGBA original remains at
/workspace/generated_images/exec-535e69eb-34ca-4425-b0a2-15d73d4b8cc9.png.
SHA-256: `60800298fd36cb6eeb74a51f7044b619f460f430ea7df786f758ecbb1158671e`.

The brief specifies rounded, softly dimensional cartoon objects, consistent
lighting, jewel blues/warm gold/coral, transparent gaps and no text/logos. Its
six subjects are a study book/pencil, shared class project, arcade birthday,
school-trip minibus, report folder and evening book/lamp/work briefcase. Measured
rectangles in src/assets/schoolLayout.ts clip the original pixels. The apparent
coloured background in the raw RGB preview is fully transparent in the gaps;
browser compositing confirms clean silhouettes on light/dark cards at 48/128px.
No opaque subject reaches a crop boundary; measured edge alpha is at most 1/255.

An image-tool edit attempt is retained outside the bundle at
/workspace/generated_images/exec-2ea9702b-c358-4952-9442-4ae9510ab297.png.
The original was selected for its better spacing after composited inspection.
The optional tools/preview-school.cjs reproduces the gallery. Status: generated,
source/browser reviewed, exported and integrated into study, reports, saved
arcade/project plans and evening classes. The recorded browser gallery is in
docs/verification/school-art-20261019.png. Native-device acceptance remains pending. The trip subject is reserved for later
school-trip content and is not evidence of a new trip mechanic.

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

health-legal-atlas.png was generated on 18 October 2026 as sixteen original
time/health/legal objects. The unmodified 1254×1254 RGBA output remains at
/workspace/generated_images/exec-1f4c10ed-d9b2-4e73-bacc-8098506a2ee9.png.
Measured rectangles in src/assets/healthLegalLayout.ts preserve its nonuniform
object spacing. Subjects include rewind, doctor/medicine/care, exercise,
meditation, sleep, diet, court/police/prison/handcuffs, justice, prison meals,
visits and release. Browser inspection at 128px found a meal-tray neighbour
pixel beside the scales; the measured boundary excludes it without editing
the source. The rewind icon is integrated into Time Machine; other subjects
are registered for expanded systems. Native-device fidelity remains pending.

family-atlas.png was generated on 18 October 2026 as twelve original family
objects (rings, rose, hearts, gift, carriage, bottle, adoption teddy, blanket,
will, breakup, family tree and conversation). The unmodified 1448×1086 RGBA
original remains at
/workspace/generated_images/exec-129eebd9-1e7e-4d11-b484-1d64bb8be799.png.
Measured source regions in src/assets/familyLayout.ts avoid nominal-cell
overlaps. All twelve subjects were browser-reviewed at 128px using
tools/preview-family.cjs; carriage/bottle and teddy/tree neighbour pixels were
found and excluded through clipping. Native-device fidelity remains pending.


fame-business-atlas.png was generated on 18 October 2026 as sixteen original
social/fame/business objects. The unmodified 1254×1254 RGBA original remains at
/workspace/generated_images/exec-445679b4-df9e-4b03-8758-01665264bfc4.png.
Source and 128px browser composition were inspected. Measured rectangles in
src/assets/fameBusinessLayout.ts retain the full van/briefcase and exclude
their pixels from the neighbouring laptop/growth subjects. The source PNG
was not edited. Social/fame and business subjects are integrated into their
respective overview, management and confirmation flows. Native-device fidelity remains pending.

career-atlas.png contains sixteen original career/training illustrations generated
on 18 October 2026. Initial output remains at
/workspace/generated_images/exec-9718fa50-623d-41c0-9d8c-d07ca5580a77.png.
An image-tool edit removed a shoe side emblem; its output was copied unchanged
from /workspace/generated_images/exec-b7274d0d-fb80-45fd-b2ee-ab9c392ef28e.png.
SHA-256: b4e3cb00a4741517b64aa46d4b3bf6641c1347a291287410b2f1226d30028327.
Measured rectangles in src/assets/careerLayout.ts were inspected at source and
in the 128px browser composition tools/preview-careers.cjs. Full objects and
transparent gutters are retained. Acting/model/sport/music/politics/training subjects are
integrated; remaining career subjects are registered for subsequent paths.
Native-device fidelity remains unverified.


Travel artwork (`travel-atlas.png`) was generated for this project and copied unchanged from `/workspace/generated_images/exec-efa1c534-0024-4e61-a981-d2d7f5d647b1.png`. SHA-256: `420a9f8cdaa7a399b924fc2bf626898441c95999e8a2897745c7aad940ab6574`. The twelve destination illustrations and four travel subjects have measured source rectangles in `src/assets/travelLayout.ts`. All sixteen were inspected at original resolution and in a 128px browser composition; no adjacent artwork is clipped into the regions. The postcards are illustrative compositions rather than geographical photographs. Source generation and browser crops do not establish native-device fidelity.


## Welcome hero — opening experience

`welcome-hero.png` is an original image generated for the reference 04 welcome composition. The unchanged source is `/workspace/generated_images/exec-b34b0c5e-300b-46c5-a3ff-64a101522361.png`; SHA-256 `8973d44ad6d8a2c7c4e00e32f5e7b794e6efea1668e836e25b74c6bd304c5459`. It depicts a fictional coastal city at sunset, with a backpacked figure, empty navy sky above and dark foreground below. The illustration contains no embedded title, controls or screenshot frame. The app draws the native wordmark, buttons and gradient overlay over the original with `cover` scaling. The source was visually inspected; matched-viewport native composition remains pending because the Android build's required React Native AAR host is blocked by the current network policy. This is not a claim of native visual acceptance.

## Household pets and reserved leisure art

`pets-leisure-atlas.png` is the unmodified 1448×1086 RGBA image-generation
transparency edit of the original opaque pet/leisure draft. The generated source
is `/workspace/generated_images/exec-5acc3ce8-463c-4fc8-9372-5b6f818c4856.png`;
SHA-256 `a4c124c8bca59e84ad175e8eaa136bc15f54291745043bfce845655bbd44be26`.
The older RGB source is preserved in the deferred-work archive. Measured regions
in `src/assets/petsLeisureLayout.ts` exclude neighbouring objects, including a
stethoscope fragment above the chess pieces. Sixteen subjects were inspected at
48/128px on white and actual dark-card backgrounds; the browser gallery is
`docs/verification/pets-art-candidate-20261019.png`. Eight subjects (four species,
paw, food, play and vet) are integrated into world-26 pet flows. The remaining
hobby/entertainment art is reserved and does not establish those mechanics.
Species illustrations do not claim a separate portrait for every adoption
archetype. Native-device fidelity remains unverified.
