# Avatar V2 implementation review

This implements the approved sixteen-person cast in `design/avatar-v2/candidate-sheet.png`, using the original `design/01-character-appearance.png` as the art direction. All new illustration sources were produced with the built-in image generation workflow. No Krea was used.

Open [the self-contained visual review](index.html) for the original design, historical renderer and integrated V2 side by side. The numbered PNGs include the sixteen identities, four portraits, six skin tones on light and dark source identities, five hair colours, eight hairstyles, four contours, eight ages, 52/88/140px portraits on light and dark backgrounds, sixteen clothing choices and the production appearance/Life/profile/NPC/family screens.

## What changed

The previous renderer had four shared face bases, runtime skin/hair tint masks and an outfit hash based on editable appearance traits. Hair edits could therefore change clothes, and different presets reused the same facial features. V2 keeps sixteen facial identities with authored full-colour eyes, brows, mouths, ears, heads and necks. Eight illustrated age stages per identity cover newborn, child, teen, adult, middle age, older adult, elderly and very elderly. The existing age boundaries remain unchanged; greying blends an illustrated grey wig progressively after 45.

The reusable rig separates rear hair, anatomical shoulders, head/ears/neck, clothing and foreground hair. Four contours adjust the outer cheeks and jaw locally while preserving central eye/nose pixels. Six skin and five hair choices use offline continuous colour grading, preserving authored shading and neutral ink. Natural approved head colours retain their source pixels after registration. There are no runtime tint masks or image filters.

The existing appearance screen now includes a Clothing tab with sixteen illustrated outfits. Selecting clothes preserves the facial identity, skin, hair and contour. Presets select their original outfit, while later hair/skin edits preserve the chosen garment. No new screens, navigation or gameplay mechanics were added.

## Saves and rendering

The original `face`, `skin`, `hair` and `hairColor` indices remain valid. Optional integer `identity` and `outfit` fields each accept 0–15. Old four-field records remain unchanged during decode/encode; their identity and default clothing derive from the immutable person ID. New creation identities derive from the creation seed without drawing from any game random stream. Names and editable appearance traits do not determine identity. Explicit clothing survives SQLite reload. All 29 entity portrait consumers pass the same person ID through the shared renderer.

`CharacterPortrait` retains its public props and adds only optional `personId`. Scalar memoization preserves unchanged native image trees across copied saves, renames and decorative-label changes. Newborns retain latent hair preferences while displaying no adult wig. Runtime rendering uses local `Image`/`View` layers, clipping and opacity, with no new dependency or network request. Historical V1 assets remain in repository history/reference material and are excluded from both platform exports.

The runtime library contains 1,084 PNG layers: 768 head atlases (six skin grades × eight ages × sixteen identities, each containing four contours), 96 shoulder plates, sixteen garments and 204 front/rear hair layers. These are shared artwork components, not complete portraits for every combination. The PNG library is 110,119,588 bytes (105.02MiB). A portrait uses three to seven images; the sixteen-preset adult grid references 38.34MiB of unique decoded textures. These measured budgets are a storage/memory tradeoff of full-colour portable PNG artwork. They are not device memory or frame-time measurements.

## Evidence and limits

The visual review renders actual production React Native component trees exported from component tests through a browser CSS adapter. Routing, icons and hardware are mocked. These are **not native Android/iOS screenshots**. No simulator or physical device is available here, so native GPU performance, on-device memory and platform image interpolation remain unverified.

- `art-checks.json`: image hashes/dimensions/transparency, source fidelity for all 128 natural age heads, no clipped tile-side pixels, four distinct contours with unchanged central features, and all six skin grades ordered for every identity/age.
- `runtime-checks.json`: all 1,966,080 identity/skin/face/hair/colour/outfit/age combinations, local layer completeness, crop bounds, image count and decoded texture budgets; all entity consumers include stable IDs.
- `browser-checks.json`: decoded images, no remote image requests or browser errors, no desktop/mobile document overflow, and the production sixteen-avatar grid remains four columns.
- `platform-checks.json`: offline Android/iOS Expo exports, all 1,084 bundled PNG hashes/dimensions match, and obsolete portrait assets are absent. Export success does not constitute a native build or device render.
- `test-results.md`: TypeScript, import graph and applicable save, creation, UI, accessibility and upstream integration tests.

## Reproduce

Build artwork with `python tools/build-avatar-v2-art.py` (Pillow, NumPy, SciPy), then run `python tools/validate-avatar-v2-art.py` and `node tools/check-avatar-v2-runtime.cjs`. The compiler reads the checked-in authoring layers and emits a static local `require` registry; generation services are not used during build or gameplay.

Run `DREAMS_AVATAR_CAPTURE_DIR=/tmp/dreams-v2-trees-final npx jest --runInBand tests/ui/avatar-v2-integration.test.tsx`, then use the same capture-directory variable with `node tools/build-avatar-v2-review.cjs`. Run `node tools/capture-avatar-v2-review.cjs` with Playwright/Chromium available (or set `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH`).

Export with `EXPO_OFFLINE=1 npx expo export --platform android --output-dir /tmp/dreams-avatar-v2-android-final --dump-assetmap --max-workers 2` and the corresponding iOS command, then run `node tools/check-avatar-v2-bundles.cjs`. The platform audit also accepts `DREAMS_AVATAR_ANDROID_EXPORT` and `DREAMS_AVATAR_IOS_EXPORT` directories.
