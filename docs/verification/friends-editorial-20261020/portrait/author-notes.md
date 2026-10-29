# Isolated legacy Android portrait candidate

Base: pushed root `e938dbe7d2f949cd9acc5c1dabc16b3f34d02434`.
Worktree: `/workspace/dreams-worktrees/portrait-fallback`, `agent/portrait-fallback`.
Owned change: `src/assets/CharacterPortrait.tsx` only. No new assets, tests,
dependencies, schema, appearance, game, persistence or native interactions.

## Actual visual/source finding

Personally opened the accepted C35 `profile-large.png`, `nia-selected.png`, and
`creation-large-clean.png`, both design01/02 references and the complete original
bundled atlas. The child profile has markedly faint eyes/brows/mouth and the adult
faces lose substantial dark/light separation. The original atlas retains those
details. This confirms the earlier bounded source audit rather than merely
assuming its conclusion. It is not a measured accessibility-contrast failure.

The prior API<29 branch paints a flat tint mask, then adds only .35 opacity of
the normal grayscale source. Increasing that opacity would dilute the selected
skin/hair palette further. API>=29/iOS use full multiply detail and are untouched.

## Bounded candidate and backend evidence

Legacy Android now renders one original grayscale image through native color
matrix filters. The matrix maps source neutral luminance `g` to the selected
RGB tint multiplied by `g`, preserving full facial detail and the actual palette
instead of substituting new colors. The filter coefficients use the installed
React Native0.86 native sepia/saturation/hue/brightness matrices. Their fixed
basis is computed once per module; each layer memoizes its filter by platform
and selected color. No bitmap is decoded, recolored or traversed in JavaScript.
The platform filter blits the existing cropped layer; it replaces the prior two
legacy images with one. This is source reasoning, not a measured performance win.

The installed React Native `BaseViewManager.java` LayerEffectsHelper applies
color-matrix-only filters through `Paint.setColorFilter` / `setLayerType` without
the API31 RenderEffect requirement. `FilterHelper.kt` uses `ColorMatrixColorFilter`
for these four filters; blur and drop shadow are absent. `BlendModeHelper.kt`
confirms the existing native multiply path requires API29. Android's
`parseColorMatrixFilters` pre-concatenates matrices, so the candidate array is
brightness, hueRotate, saturate, sepia (rightmost sepia operates first). The
processFilter JS parser requires a `deg` suffix on nonzero hue values; the
candidate supplies that string explicitly.

The algebra was checked for all six unchanged skin colors, five unchanged hair
colors and a neutral grey: neutral-white target reconstruction error was at
floating-point precision. This is mathematical/source inspection only, not
native or visual acceptance. The source atlas is the existing grayscale art;
no new color-filter image or generated derivative was substituted.

Source rectangles, image positions/scales, face scaling, palette constants,
age stages, greying, mask pixels, stored traits/IDs and accessibility semantics
are unchanged. Other platforms retain their existing two-image multiply branch.

## Required root acceptance

Candidate stays isolated until actual API24 comparison. Root owns ExpoGo/Metro
and native interaction. Compare the same genuine Nia revision138 and existing
opening/profile portraits; verify all eight database tables are unchanged,
actual eye/brow/mouth separation improves, palette differences remain sensible,
mask/edge geometry remains intact and ordinary scrolling/button response is not
degraded. Native filters can have backend/device behavior that source equations,
React tests, TypeScript and Hermes exports cannot accept. Do not merge based on
matrix equations alone. C36 gameplay gates need not wait for this visual slice.

## Closed focused checks and important export diagnostic

Frozen candidate: `b3bf10821605271a3b039815af2b61f352e49a48` (one source file).
Existing portrait accessibility tests pass2/1 in3.426s, and strict application
plus all-test TypeScript checks pass. Both processes actually closed with exit0.
Logs: `/tmp/dreams-portrait-fallback-tests.out` and
`/tmp/dreams-portrait-fallback-types.out`.

The first export command closed0 but is REJECTED as candidate evidence: shared
Metro cache/router context reused integration-opening-next sources. Its HBC
disassembly explicitly contained the old TintedLayer opacity.35 branch and none
of the distinctive new matrix coefficients. Diagnostic log:
`/tmp/dreams-portrait-fallback-export-stale-source.out`; old disassembly:
`/tmp/dreams-portrait-fallback-android-bytecode.txt`. No shared caches or physical
dependencies were cleared or edited.

Only the affected export was rerun, with fresh per-command
`TMPDIR=/tmp/dreams-portrait-fallback-metro`, one worker and external source maps.
That process actually closed0. Both actual Hermes files exist. Both platform
maps contain the exact frozen CharacterPortrait source bytes (SHA256
`a00a7c1d0f45ff636bcccc9fe8f49018f6398e3a10bcc1f30c54db17d9c2ae3f`),
and EVERY mapped app/src sourceContent byte-matches this checkout. Corrected
Android HBC disassembly contains the new1.351/1.203/.937 matrix coefficients.
Corrected log: `/tmp/dreams-portrait-fallback-export-isolated.out`.
Output/metadata/maps: `/tmp/dreams-portrait-fallback-export-isolated`.
Receipt: `/tmp/dreams-portrait-fallback-export-provenance.json`.

All own test/type/export processes are closed. No new mirrored style/matrix
test, native interaction or broad gameplay gate was introduced. These source,
semantic and packaging checks do not replace the root's actual API24 visual and
button/scroll comparison. Its development Metro response must likewise prove
the actual candidate source, rather than trusting workdir/port alone.
