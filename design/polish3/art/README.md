# Original Polish 3 artwork

All seven source sheets in this directory were generated with the built-in
`image_gen.imagegen` tool with `transparent_background: true`. Krea was not used.
The original generated files remain in `/workspace/generated_images`; this
folder retains unmodified copies for provenance and future art review.

The existing `assets/generated/activity-atlas.png` and
`design/polish/event-icons.png` were inspected for style. The generation direction
was original rounded colorful mobile-game illustrations with clean colored
outlines, soft dimensional shading, readable silhouettes, genuine alpha and
no caption/emoji/stock-art substitution. The first six sources contain a 4×4
arrangement; `jobs-emergency.png` adds four roles in a 2×2 arrangement, using
`jobs-2.png` as the built-in ImageGen style reference.

`brief.json` records source paths, all exact role/action keys, ordered subjects,
and the complete prompts retained for the five mixed/job sheets. The first two
sheets contain the 32 explicitly ordered person actions, followed by four
friendship/teen actions in the mixed sheet. Net Worth uses a treasure chest with
personal assets; Finances uses a cash-flow ledger. Bank artwork stays separate.

`tools/build-polish3-art.py` only registers alpha components, isolates their
transparent bounds, and proportionally scales the authored illustrations onto
256px canvases. It does not paint, recolor, stretch or synthesize artwork.
Runtime PNGs and provenance hashes are in `assets/generated/polish3/manifest.json`.

There are 100 distinct runtime images: 62 ordinary jobs, 36 person actions and two
financial categories. Each has an independent bundled PNG and a static require
in its category registry. No ordinary job or interaction reuses a generic image.

`python tools/build-polish3-art.py --only-sheet jobs-emergency.png` registers the
new 2×2 source without touching the previous 96 files or their registration
metadata. The registration pass verifies their existing hashes before retaining
them. The full build also supports either grid size through source metadata.
