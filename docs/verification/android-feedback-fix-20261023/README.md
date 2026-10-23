# Android feedback fixes — 23 October 2026

Android release playback was reported silent even with Sound Effects enabled, the Sound profile selected and Media volume raised. The original integration's bundle exports did not establish audible device playback. This follow-up fixes reproducible controller defects and enables the requested fresh-install defaults.

## Playback

- The 45 ms tap and 144 ms Age Up cue previously had JavaScript cutoffs measured from calling `play()`. Native startup could consume the entire window. They now finish on the native completion event; longer effects trim against actual native playback position. A bounded watchdog only handles missing native completion.
- Expo Audio's installed Android implementation reports `isLoaded = false` at `STATE_ENDED`, although its status event reports the completed clip loaded. Waiting for readiness before rewinding prevented cached clips from replaying. Ended clips now rewind first; genuinely cold clips load before seeking.
- All cached players use `downloadFirst` for bundled local asset resolution. Readiness and seek budgets tolerate native startup while stale, disabled or backgrounded requests remain suppressed. Significant cue priority, receipt deduplication, one playback lane, mini-game files, volumes and committed-result selection remain intact.
- Development builds report setup/player/playback errors once per stage, including an actionable warning if the native audio module is absent. Hardware failures still never block saving or navigation.

## Defaults and reminders

With no saved app-settings record, Sound Effects, Haptic Feedback and Daily Reminders now start on. Existing stored records retain their choices and historical missing-field semantics. Explicit false flags survive cold loads and unrelated preference changes. No settings migration, world/schema revision or RNG change is introduced.

Daily reminders default to 19:00 local time. OS notification permission is requested once after a life begins, while the app is active, only if permission is undetermined. Existing denials and saved opt-outs are retained. Settings provides an explicit permission retry for an already-on preference, and reschedules after the grant even when the preference itself needs no write. Disabling during an outstanding permission prompt cannot later re-enable the schedule.

## Verification

The regression run passed 344 tests across 30 suites. The final controller/reminder pass passed 22 tests, including two additional cancellation regressions, for 346 distinct passing tests. Production and test TypeScript checks, runtime import checks, and Android/iOS production Metro/Hermes exports passed. Both exports contain all eight existing audio assets. Exact source hashes, suite lists and bundle evidence are in [report.json](report.json).

Tests exercise delayed native startup, native completion ordering, Android ended-player reuse, native-position trims, slow cold loading, disable/background cancellation, existing cue deduplication, successful/failed saves, real SQLite preference durability and cold loads, actual Android setup/Age Up haptic calls, notification permission timing, denial/retry and pending-prompt opt-outs. Device APIs are mocked at the native boundary.

**Native listening remains unverified here.** There is no Android SDK/emulator, attached Android device or iOS runtime in this environment. Exports verify bundling, not physical audio or vibration. The user is testing a release APK: install a newly built APK containing this commit, including the existing `expo-audio` native dependency, before retesting. An already installed older APK does not gain these changes by toggling settings.

On that build, verify audible taps and repeated Age Ups, one cue per committed year, milestone sequencing, purchase/failure cues, silent-mode handling, sound off/on across relaunch, background cancellation, and physical setup/Age Up haptics. Confirm reminder permission and delivery on the device. No new release APK was built or distributed by this task.
