# Release audit — 25 October 2026

Candidate starts at `dc097168`. This audit fixes release defects and runs the
whole application regression. It does not certify an installed store build.

## Review reminder

The old flow could starve indefinitely: native store availability hid the
entire app reminder, negative-year facts disqualified opportunities, and an
unanswered offer was consumed across a cold restart. The new behavior is:

- The first clean Life opening at character age **5 or older** offers the app's
  review reminder, including existing release saves without review metadata.
- After an answer, the next reminder is due after **10–20 committed completed
  Age Ups** across lives. Maybe later uses 10. Imports, births, God Mode edits,
  monthly pauses, duplicate receipts and failed saves do not count.
- An unanswered reminder resumes after restart. Its ID remains stable while
  current life/person/revision scope is refreshed; stale callbacks cannot act.
- Health, mood, legal status and past bad events cannot suppress the cadence.
  Active gameplay popups, annual processing, mini-games, cinematics, background
  state and other routes still defer presentation until Life is clear.
- Sure requests the native store API. If it is unavailable or fails, the same
  explicit action can open the store. **Settings → Rate Dreams** opens the store
  directly and remains available when native quotas suppress a sheet.

Google Play/StoreKit do not report whether a native card appeared or a rating
was submitted; their sheet cannot be guaranteed. Android's store link uses
`com.yacoobali.lifesim`. A real Play listing/testing installation is still
needed. iOS's manual fallback needs the actual App Store URL; no ID is invented.

The Android native availability check also lacked a Play Store package query.
Actual manifests from the installed Expo AARs and their Google dependencies
contained no such declaration. Android 11+ visibility can therefore hide Play
from a sideloaded release APK. The new native config plugin adds exactly
`com.android.vending`, preserving existing queries and permissions. Play-installed
apps may already see their installer; this finding does not imply every Play
installation failed. [Artifact hashes and manifests](play-review-visibility.json)
record the dependency inspection.

## Other corrected defects

| Area | Result |
| --- | --- |
| Reminder permission | A disabled Android reminder channel and iOS authorization with no visible destinations are reported accurately. Existing channel choices are preserved. Settings clears stale denial after actual recovery. |
| Clock/timezone changes | A private native receiver re-arms only already-scheduled Dreams reminders when Android's clock or timezone changes while the app is closed. |
| Notification glyph | A dedicated white heart on transparency replaces Android's opaque-launcher fallback. The source SVG and 96px PNG are local assets; the launcher icon is retained. |
| Production testing tools | Production/store builds force God Mode testing access off, including conflicting test flags and saved toggles. Development/internal/preview testing remains available. |
| Permissions | Unused overlay, broad legacy storage and audio-recording permissions are blocked. File backup/sharing uses existing system pickers and app cache. |
| Startup/recovery | Welcome exposes Saved Lives, allowing a corrupt active save to reach explicit recovery and a fresh install to import without a disposable life. |
| Share cache | Each native-share operation removes only its own temporary cache file after sharing settles, including failure. User-selected exported files remain. |
| Archive boundaries | Current/history archive payload limits match the existing 44M checkpoint reader, retaining the 64M total archive cap and exact historical bytes. |
| Cult navigation | Cult routes correctly select Activities in the bottom navigation. |

The notification receiver, glyph and native permission changes require a
**new native release build**; updating JavaScript alone is insufficient.

## Verification

The focused gate covers 150 cases in 16 suites across its initial invocation
and passing affected rerun. Three initial failures were new test assertions or
fixture setup, corrected without production changes. Strict app/test types
pass. The whole regression covers **337 suites / 5,391 cases**: its initial
invocation passed 336 suites / 5,390 cases, with one old onboarding assertion
expecting Saved Lives to be absent. That test now verifies navigation, exactly
one haptic and no save writes. The affected onboarding/config rerun passes all
14 cases. There are no unresolved failures or skipped cases in that scope;
the original run and passing rerun scopes remain explicit. All three named native-plugin
checks pass with `node tools/tests/local-notifications-plugin.test.cjs`.

Fresh offline Android/iOS native project generation passed using Expo's
installed SDK 57 template in an isolated temporary project. Source inspection
verified the current package/version, production testing disabled despite an
injected test flag, private clock receiver/actions and generated Kotlin source,
permission-removal directives, release minification/shrinking, and iOS without
APNs, microphone use or background audio/push. Autolinking resolves store review,
notifications, SQLite, filesystem, sharing and audio native modules. Native
generation is separate from compilation and installed-device verification.

The final generated receiver compiles with Kotlin 2.1.20 against Android API 36,
the actual Expo Notifications 57.0.23 AAR and AndroidX Core 1.17.0. It re-arms
alarms without restoring persistent requests after cancellation. Native checks
also verify exactly one Play Store visibility query and white transparent
notification glyphs at 24/36/48/72/96px. The runtime import graph has 513 modules
and no cycles; notices match current inputs.

Final production Android/iOS Hermes exports pass. Both source maps contain all
13 changed runtime files exactly. [Scoped results and source hashes](checks.json)
record the full/rerun counts, native checks, receiver compile and bundle sizes.

## What still prevents release sign-off

- Build and install the final **signed Android AAB/APK**, then exercise cold and
  offline launch, save/recovery/update, system file pickers/sharing, Back and
  large-text layouts. Verify the merged release manifest and 16KB page-size
  packaging on the actual artifact.
- Observe notifications on Android 13+ with allowed/denied/channel-blocked
  permission, background/closed app, chosen time, timezone/clock change, reboot
  and cold tap. Android force-stop suppresses normal alarms until reopening;
  it is not the sole closed-app test. Check the new small glyph on a device.
- Install through the real Play testing track/account to check review behavior
  and the explicit store link. Verify actual store signing, package registration
  and unused version/build numbers; bind the intended EAS project.
- Supply public privacy/support destinations and the real iOS listing URL,
  confirm supplied audio source/license records and final native notices, and
  complete store rating/data-safety answers. Publisher fields remain unresolved.
- For iOS, archive with Xcode and validate the installed app's entitlements,
  privacy manifests, local reminders, review flow, audio and device layouts.

This workspace has no Android SDK/emulator, Xcode, connected device or signed
candidate artifact. It cannot establish those installed-release results.

Details: [notifications](notifications.md), [app journeys](app-journeys.md),
[native release](native-release.md), [review cadence](review-cadence.md).
