# Cinematic transitions

The full-screen welcome lasts **3.2 seconds**, birth **3.3 seconds**, and death
**2.8 seconds**. The golden/blue curling ink, fine veins, wordmark reveal, and
liquid transition remain. Birth/death may hold their opaque frame slightly longer
while navigation commits.

60 FPS reference previews:
[welcome](verification/cinematics-20261022/welcome.mp4) ·
[birth](verification/cinematics-20261022/birth.mp4) ·
[death](verification/cinematics-20261022/death.mp4).

## Rendering and startup

`CinematicInk.tsx` now plays bundled `.lottie` assets with `lottie-react-native`
7.3.8, the version specified by Expo SDK 57. iOS uses Core Animation; Android
uses Lottie's hardware rendering mode. No JavaScript timer, worklet, SVG string
construction, or trigonometry runs per animation frame. The small runtime timing
module is separate from the offline geometry evaluator.

`tools/generate-cinematics.cjs` evaluates the original `inkGeometry.ts` ahead of
time, converts quadratic contours to equivalent cubic paths, and adaptively
bakes keyframes. It checks every 60 Hz sample, limits point/tangent interpolation
error to 0.3 design pixels, and preserves fixed contour topology. Native engines
interpolate continuously between keys. The 400×900 composition fills the display
with proportional cropping on phones and tablets. The three compressed native
assets total about 6.6 MB; they load as native resources rather than large JSON
objects parsed/stringified on the JavaScript thread.

The player waits for native decoding before starting. Birth covers at 1.4 seconds
and death at 1.2 seconds, holds that exact opaque native frame until the target
route commits plus two layout frames, then plays the remaining segment natively.
Load/decode failure settles through the same once-only navigation boundary as
Reduced Motion and the watchdog. Welcome keeps a navy loading surface and has
no Skip button.

A local 60 FPS H.264 video was considered. Native vector playback preserves the
transparent liquid boundary over the actual next screen on both platforms,
without depending on cross-platform alpha-video support. The MP4 files here are
review artifacts; the app plays the local native vector assets.

Regenerate/check authored assets with:

```sh
node tools/generate-cinematics.cjs
node tools/generate-cinematics.cjs --check
```

Lettering is outlined offline so playback needs no font initialization. The
checked-in command outlines come from Liberation Sans; attribution and the OFL
license are in `assets/cinematics/LETTERING-LICENSE.txt`. Notices/inventory are
updated for the new SDK-compatible playback dependency.

The root host uses a full-window iOS overlay and an Android translucent native
Modal above navigation and event dialogs. iOS avoids presenting a second modal
controller while a successful-creation confirmation is dismissing. Status bars
are hidden during playback.

The native splash remains until the overlay has laid out/shown. Both native
backgrounds are navy in light/dark mode. `assets/cinematic-splash.png` is one
transparent pixel: supplying an image makes the SDK 57 iOS plugin update the
storyboard's named background color and image constraints. A background-only
configuration retained its white storyboard fallback during config introspection.
The transparent image displays no mark; its source file is 70 bytes. A native rebuild
applies the splash configuration and links the native animation dependency.

## Triggers and cleanup

- The welcome intro is claimed once per JS runtime. Returning to welcome or
  remounting the navigator does not replay it. Deep links skip the welcome intro.
- Preferences and the OS motion response settle before motion begins. An unknown
  OS response is distinct from a saved Reduce Motion preference. A missing
  response gets a bounded static fallback.
- New Life requests birth only after `startLife` reports a successful save. The
  submission guard stays held through cover/navigation, preventing duplicate taps.
- The root observes a living-to-dead change for the same life and active person
  at the next committed revision. Loading, recovery/import routes and switching
  saved lives do not request a death sequence.
- During death, the current game route stays mounted while ink spreads. Birth
  and death navigate exactly once when fully covered, wait for the destination
  path to commit plus two layout frames, then reveal it. Their ordinary native
  route animations are disabled.
- Backgrounding, Reduce Motion changes and the watchdog settle a request.
  Request IDs reject late callbacks from an older sequence. Reduced/unknown
  motion navigates directly; no animation delay is required.

Existing welcome, birth and memorial content/actions remain. Their old zoom,
ring and particle entrances were replaced with their settled artwork. The
independent `SceneMotion` implementation and its 1.8-second cap are unchanged.
Game state, persistence, save schemas, engine, RNG and outcomes are unchanged.

## Native startup corrections on 22 October 2026

A device launch exposed a worklet serialization error that the browser preview
could not reproduce: `inkRibbon` captured `curl` and `roundedContour` while those
bindings were still undefined. The previous correction initialized leaf worklets
before their callers. Native asset playback now removes these worklets entirely.
`cinematic-assets.test.ts` replaces that regression test: it validates masks and
fixed topology, checks opaque/clear boundaries, compares every 60 Hz frame to the
original quadratic curves (maximum curve error below 0.6 design pixels), and
rejects runtime imports of the offline geometry module.

The reported require cycles were removed by separating dramatic-event offering
from resolution, moving sale-quote arithmetic and course durations into shared
leaf modules, and importing person helpers directly. The existing event/asset/
education exports remain available. Draws, rule calculations, command results
and save schemas are unchanged. `npm run check:imports` checks all runtime
imports, including re-exports, and reports **394 modules, zero cycles**. Metro's
require-cycle warnings remain enabled.

SDK 57 patch dependencies are aligned to Expo **57.0.31**, Router **57.0.29**,
and Sharing **57.0.24**; the packaged SDK compatibility check finds no mismatches.
The online Expo metadata endpoint is blocked in this environment, so verification
uses the current official Expo package's bundled metadata and registry patches.

The corrected source passes 377 checks across the 20 affected suites, strict
app/test typing, the import-graph check, SDK compatibility, and fresh Android/iOS
Hermes exports. Device playback still needs confirmation. Detailed evidence is in
[the startup correction record](verification/cinematics-20261022/startup-fixes.json).

After updating a checkout:

```sh
npm ci
npx expo start --clear
```

Rebuild a custom development client after native package updates. Expo Go users
should use a client supporting SDK 57.

## Smooth-playback verification on 22 October 2026

- Strict app/test typing, all affected lifecycle/persistence/settings/architecture
  tests, deterministic asset regeneration, and SDK compatibility pass.
- Both Android and iOS Hermes production exports include all three local native
  animation resources. These are exports, not device-installed release builds.
- Browser reference renders use the **bundled assets** over the actual welcome,
  birth and memorial screens with read-only fixture state. Reviewed 400×900 and
  768×1024 layouts, all opaque/clear boundaries, and genuine 60 FPS previews.
  These validate appearance and timing, not native frame delivery.
- No physical device, Android SDK/adb, iOS simulator, or release-build signing
  environment is available in this Linux session. Stable native 60 FPS therefore
  remains a device acceptance check; no native frame-rate measurement is claimed.

On a connected development machine, install dependencies, rebuild the native
client, and run release builds on representative Android/iOS phones:

```sh
npm ci
npx expo run:android --variant release --device
# On macOS with Xcode/signing configured:
npx expo run:ios --configuration Release --device
```

Use Android Studio/Perfetto FrameTimeline and Xcode's Animation Hitches/Core
Animation instruments during a cold welcome, a successfully saved birth, and a
committed death. Target a stable 60 Hz cadence (16.7 ms budget) during motion;
check slow navigation's opaque hold separately. Also check background/foreground
and Reduce Motion. Debug/Expo Go timing and the reference MP4s do not establish
release-device performance. Detailed local evidence is in
[smooth-playback.json](verification/cinematics-20261022/smooth-playback.json).

## Initial implementation verification on 22 October 2026

- Strict app/test TypeScript checks pass.
- All 233 regression suites outside `tests/game/engine.test.ts` pass across
  completed broad-run suites and the remaining-suite run. The long-running
  12-life engine soak was interrupted; engine source is unchanged. Both initial
  failures (splash-test isolation and the current dependency checksum pin) were
  corrected and passed their rechecks.
- Twelve focused lifecycle, real-SQLite failed-save/retry/cold-resume and static
  milestone checks pass. The existing feedback/settings journey also passes all
  sixteen checks with native chrome isolated from that test's persisted settings.
- Android and iOS Hermes production exports pass. Expo config introspection
  confirms the Android splash color and iOS storyboard RGB both equal `#061633`.
- Browser captures render the actual `CinematicInk` component over the actual
  existing screens, using read-only fixture state. Reviewed 320×568, 400×900 and
  768×1024 viewports, including fully covered and fully clear endpoints. The
  initial video was 30 FPS; it has been replaced by the 60 FPS previews above.
- Isolated actual-animation Chromium sampling at 400×900 observed 16.7ms median
  and p95 frame intervals, with zero intervals over 34ms, both normally and with
  4× CPU throttling. This is a browser diagnostic; physical-phone performance
  remains to be measured.

Native Android/iOS playback, launch-to-animation frame captures, VoiceOver/
TalkBack behavior and mid-range physical-phone performance still need device
verification. This Linux session has no configured mobile simulator/device.
The checked-in captures are browser renders, with native navigation/window
behavior covered by component tests and native bundle/config checks.

## Reproduce the visual review

Keep optional browser tools outside the mobile dependency graph:

```sh
npm install --prefix /tmp/dreams-cinematic-tools esbuild playwright react-native-web@0.21 lottie-web
DREAMS_REVIEW_TOOLS=/tmp/dreams-cinematic-tools \
  node tools/review-cinematics.cjs /tmp/dreams-cinematic-review --film
```

The script uses `/usr/bin/chromium`; override with `DREAMS_CHROMIUM` if needed.
`DREAMS_REVIEW_VIEWPORT=768x1024` changes the viewport. It captures deterministic
frames from the bundled native assets, with a fixture-only adapter for game
state/navigation. `--film` writes separate welcome/birth/death PNG sequences
at 60 FPS, which can be encoded with ffmpeg using `-framerate 60`. Review tools/fixtures are excluded from the app build.
