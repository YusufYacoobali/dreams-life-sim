# Cinematic transitions

The welcome intro now occupies the whole display for 2.6 seconds. Golden ink
curls through a navy composition, reveals the Dreams wordmark, and sweeps away
to the existing welcome screen. Birth uses a 1.5-second cream/blue sequence with
“A New Life Begins”; death uses 1.8 seconds of dark ink and fading gold embers.

[Welcome playback](verification/cinematics-20261022/welcome.mp4) ·
[welcome frames](verification/cinematics-20261022/welcome-frames.png) ·
[birth frames](verification/cinematics-20261022/birth-frames.png) ·
[death frames](verification/cinematics-20261022/death-frames.png).

## Rendering and startup

`src/ui/cinematic/CinematicInk.tsx` renders local vector pours and animated SVG
clipping paths. `inkGeometry.ts` contains the authored flow curves, curling
contours, wet-tip taper, translucent veins, coverage geometry and timing. The
same Reanimated shared clock drives all paths on the native UI runtime. Smooth
geometry controls the easing; the clock itself advances linearly. The scene
fills the viewport with proportional cropping, preserving the wordmark on both
phones and tablets. Clipping avoids full-screen luminance-mask/filter passes.
There are no remote assets, video players, bitmap frame sequences or game RNG
calls in this implementation.

The SDK 57 bundled-module metadata specifies SVG 15.15.4, splash screen 57.0.10,
Reanimated 4.5.1 and Worklets 0.10.1; the installed versions match. Only SVG and
splash screen were added as direct dependencies. Notices/inventory were refreshed.

The root host uses a full-window iOS overlay and an Android translucent native
Modal above navigation and event dialogs. iOS avoids presenting a second modal
controller while a successful-creation confirmation is dismissing. Status bars
are hidden during playback; safe-area insets keep Skip reachable.

The native splash remains until the overlay has laid out/shown. Both native
backgrounds are navy in light/dark mode. `assets/cinematic-splash.png` is one
transparent pixel: supplying an image makes the SDK 57 iOS plugin update the
storyboard's named background color and image constraints. A background-only
configuration retained its white storyboard fallback during config introspection.
The transparent image displays no mark; its source file is 70 bytes. A native rebuild
applies the splash configuration and links the new SVG dependency.

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
- Skip, backgrounding, Reduce Motion changes and the watchdog settle a request.
  Request IDs reject late callbacks from an older sequence. Reduced/unknown
  motion navigates directly; no animation delay is required.

Existing welcome, birth and memorial content/actions remain. Their old zoom,
ring and particle entrances were replaced with their settled artwork. The
independent `SceneMotion` implementation and its 1.8-second cap are unchanged.
Game state, persistence, save schemas, engine, RNG and outcomes are unchanged.

## Verification on 22 October 2026

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
  attached video includes a half-second hold after the 2.6-second intro.
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
npm install --prefix /tmp/dreams-cinematic-tools esbuild playwright react-native-web@0.21
DREAMS_REVIEW_TOOLS=/tmp/dreams-cinematic-tools \
  node tools/review-cinematics.cjs /tmp/dreams-cinematic-review --film
```

The script uses `/usr/bin/chromium`; override with `DREAMS_CHROMIUM` if needed.
`DREAMS_REVIEW_VIEWPORT=768x1024` changes the viewport. It captures deterministic
frames from the production component, with a fixture-only adapter for game
state/navigation. `--film` also writes numbered PNG frames at 30fps, which can
be encoded with ffmpeg. Review tools/fixtures are excluded from the app build.
