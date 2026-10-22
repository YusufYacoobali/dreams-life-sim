# Release-readiness audit

Updated22October: package/bundle ID is now **com.yacoobali.lifesim** and the existing icon is retained. Three Android safe-area inconsistencies are fixed. Optional daily local reminders add `expo-notifications ~57.0.23`, explicit opt-in, configurable19:00default,28messages and seven non-expiring repeating weekday requests. Focused persistence/service/UI/inset cases and strict types pass. Offline config introspection confirms the new identity and no APNs entitlement or remote-notification background mode. The library declares Android notification and reboot-recovery permissions; final dependency-merged permissions remain unverified. This is not an installed delivery or new-identity pass.

The old b75generated native project is **stale after these native-config/dependency changes**. Regenerate from final source before the next actual build; do not run the old project or assume the earlier native-config equality still applies. No new prebuild/Gradle/blocked download was attempted. Add installed daily delivery, time/timezone/permission changes, disable/reboot, cold-tap routing, system-bar layouts and iOS local-only signing checks to final acceptance. The batch's automatic full Quality run follows its completed source push.

## Accepted navigation/button checkpoint — prior runtime80a10b5

Current runtime `80a10b5` adds navigation/keyboard/button/Help fixes over `b75e617`. Its exact final checkpointa022467 [Quality39737962016](https://github.com/YusufYacoobali/dreams-life-sim/actions/runs/39737962016) passes locked install, strict app/all-test types and2,824tests/222suites. Scoped API24/Expo Go keyboard and normal/150% Statistics layout checks pass. Prior b75campus/year/cold and bundle observations retain their own source scope. [HANDOFF](HANDOFF.md) is authoritative for current results.

**Open native defect:** changing system text150%→100% and immediately opening the Expo URI caused an ART/JNI deleted-global-reference abort in `host.exp.exponent`. No game JavaScript exception was identified and the cause remains unisolated. Normal-text force-stop/reopen/Continue succeeds; all eight saved-data tables are exact before UI, after the crash and after recovery. This is not crash-free acceptance: isolate the configuration/reload sequence on the eventual standalone build. Actual crash logs and reviewed layouts are retained at `/workspace/.cache/dreams-layout-80a10b5`.

Final80a10b5 Android/iOS production Hermes export actually exits0 at `/tmp/dreams-layout-final-production-export`; metadata, both HBC headers and all four changed UI sources in both maps pass. Android5,108,556bytes/iOS4,840,736bytes. This is bundle generation, not a standalone artifact or installed-device pass.

The clean candidate is verified atb75 in `/workspace/dreams-worktrees/native-prebuild-gameplay`, branch`review/native-prebuild-campus-first-month-b75e617`; move it to the final runtime when packaging resumes. The historical `/tmp` build wrapper did not survive reconnect; recreate its source/resource guards then. Native configuration is unchanged. Latest enforced environment policy79 remains package-managers-only and omits required `repo.reactnative.dev`; last actual Gradle attempt failed on the React0.86.3AAR redirect403. No unchanged build retry or new prebuild occurred. Toolchain, generated native project, saved emulator disk and original histories are retained. The latest supervised emulator/Metro session is closed and the temporarily relocated NDK is restored.

No APK/AAB/IPA, standalone installation/offline pass, iOS/macOS build, physical-device p95, spoken TalkBack/VoiceOver, hardware audio/haptics or production signing is claimed. Those acceptance steps and final distribution disclosures remain open. The historical audit below retains its original source/tool-installation scope.

## Historical audit — original83adaea scope


Updated 21 October 2026 from main `1c9e4eaf160a9c9a38befdbf4f34fbe79d4865f9`.
Application source matches frozen combined UI source
`83adaea6f92523d04a27df2e77b11e0a8b14ef1d`: World38 / engine39 / content13 /
reader18 / checkpointv4. This is release preparation, not a signed-release
approval or a new gameplay completion percentage.

Current implementation has 265 situations / 795 choices. Gate results belong to
their exact producer; consult [PROGRESS](PROGRESS.md),
[the opening plan](OPENING_PLAN.md) and [current regression evidence](verification/final-regression-20261021.json).
Additional import/export/sharing, file/history tools and storage breadth remain
parked. Reliable automatic saving and exact resume remain required.

## Current evidence and acceptance boundary

| Area | Evidence available | Remaining release acceptance |
| --- | --- | --- |
| Gameplay/types | Source-pinned `33b6a5f` regression passes 2,686 tests / 211 suites; strict app/all-test types pass. Later two UI layout fixes preserve every game/persistence file. This audit ran no game tests or overlapping author-count aggregation. | Coordinator publishes current scenario/editorial/annual/session outcomes with exact source bridges. A successful policy exit does not establish every goal/context. |
| Bundles | Recorded Android/iOS Hermes exports exist. Actual corrected Android development manifest/map proof matches 334 runtime files against 703 source pins. | Neither kind of map establishes an APK/AAB/IPA, merged release manifest or installed standalone app. |
| Android interaction | Scoped API 24 software-emulator/Expo Go opening, exact saved/cold results and large-text checks exist. Coordinator reports current reader 17→18 and corrected 130% read-only checks. | Current interview/normal-text/session work is coordinator-owned and still in progress at this audit boundary. Release-build interruptions, supported sizes/tablets and physical-device acceptance remain separate. |
| Native project | Current offline Android prebuild actually exits0 from the installed SDK 57 local template, without installation. Correct identity/launcher resources are inspected below. | Native dependency resolution, compilation, release signing, merged resources/permissions and installed release acceptance remain unrun. |
| iOS | Linux Hermes exports and source bundle ID/build number exist. | No macOS/Xcode build, simulator or physical iOS acceptance occurred. Android generation does not establish iOS icons, entitlements, privacy manifests or signing. |
| Save/performance | Recorded SQLite rollback/retry, exact histories/backups/cold results and 70-sample warm zero-unpack diagnostics retain their own scope. | Named physical-device p95, cold restore, memory and smooth release-build scrolling remain unrun. Node/software-emulator timings are not physical p95. |
| Accessibility/audio/offline | Source has descriptive controls, motion preferences and optional local feedback. Generated main manifest omits microphone recording permission. | TalkBack/VoiceOver speech/focus, real-device haptics/audio/silent-mode behavior and standalone airplane-mode play/save/force-stop/resume remain unrun. |

The coordinator owns ongoing scenario/session review and expanded annual
aggregation. Read their subsequent actual records rather than infer results
from this document. Standalone/iOS/physical gates remain open independently.

## Actual offline Android generation

The isolated project is
`/workspace/dreams-worktrees/native-prebuild-current/android`, from exact `83adaea`.
It is ignored, unbuilt and has not been merged or distributed.
[Exact command, exit and inspection](verification/native-prebuild-current-20261021/README.md)
record the local template, source/lock hashes,757-package installation and actual
start/closure. All 703 source files match before and after. Prebuild changed only
the Android/iOS package convenience scripts; the generated version was retained
as evidence and the original bytes restored. The tracked isolated tree is clean.
No install, Gradle invocation, artifact request, ADB or production signing was
requested.

| Generated source | Actual finding | Scope/action |
| --- | --- | --- |
| Identity | Dreams Life Simulator; application ID/namespace `com.yusufyacoobali.dreamslifesim`; version 1.0.0 / code 1; portrait launcher; `dreams-life` deep link. | Source generation passes; installed identity/deep-link recovery remain unrun. iOS source build number remains 1. |
| Toolchain | Expo 57.0.30 / RN 0.86.3; wrapper Gradle 9.3.1; source catalogue AGP 8.12.0, compile/target 36, minimum 24, build-tools 36.0.0 and NDK 27.1.12297006. Hermes/Fabric/edge-to-edge enabled. | Inspected defaults, not successful Gradle resolution. JDK 21 reports successfully; no Gradle task ran. |
| Launcher |20 generated PNG/WebP files include 48–192px standard/round icons, 108–432px adaptive foregrounds and 288–1152px splash resources. Adaptive background is `#071D49`. The 192px resource shows the original life-path/sun/cloud mark. | Generated-source review only; installed masks, launch appearance, physical small-icon readability and iOS 1024px output remain unrun. [Original provenance](APP_IDENTITY_AND_BRANDING.md) stays authoritative. |
| Fonts | No TTF/OTF copied into the generated Android source tree at this stage. Ionicons is a local Metro font dependency. | This is not a demonstrated missing-font defect: final native/Metro asset packaging has not run. Inspect actual release resources/notices/rendered glyphs later. |
| Audio | Main manifest has `MODIFY_AUDIO_SETTINGS`/`VIBRATE`; no `RECORD_AUDIO`. Source disables microphone permission and background recording/playback. | Final dependency-merged manifest and hardware behavior remain unverified. |
| Other permissions | Main source declares `INTERNET`, `SYSTEM_ALERT_WINDOW`, and read/write external storage limited to API 32 and below. Cleartext is explicitly enabled in debug/debugOptimized manifests. | Source declarations are not merged runtime permissions or transmission evidence. No permission configuration was changed. |
| Android OS backup | `android:allowBackup="true"`; no explicit backup/data-extraction rules generated. | Device/platform settings may back up SQLite saved-life data. Draft privacy text acknowledges this; no in-game cloud-sync service or backup-policy change is claimed. |
| Signing/profile | Generated release build type uses template debug signing; release minification defaults off. Development key material was excluded from copied evidence. | **Not distribution signed.** The owner must supply release signing through its chosen secure process before distribution. No production credential/account was created. |

## External block and unrun matrix

[Current safe observation](verification/native-prebuild-current-20261021/environment-status-safe.json):
managed spec 54 / observed 54, observations current, running, restricted networking
**enforced**, `package_managers`, zero custom hosts and 144 effective hosts.
IDs, credential bindings and proxy details are omitted. `repo.reactnative.dev`
is absent. No request to that host, unchanged build retry, alternate repository,
mirror, proxy, CI build or policy change occurred.

| Dependency/gate | Exact current evidence | Next action |
| --- | --- | --- |
| RN Android AAR | Current source requires `com.facebook.react:react-android:0.86.3`; HermesV1 defaults to `com.facebook.hermes:hermes-android:250829098.0.17`. Earlier custom-build access to `repo.reactnative.dev` was automatically rejected. | The denied host remains blocked. Current Gradle/AAR availability is unverified: default resolver source mentions Maven Central/Google, so do not invent a new failed request or label the historic denial a current 0.86.3 resolution. Coordinate legitimate toolchain/dependency access before a build; no bypass/unchanged retry. |
| SDK platform | `platforms;android-36` absent in the observed SDK. Existing official index lists standard revision 2, 65,878,410-byte archive at permitted `dl.google.com`. | Package plan ready; installation waits for root's disk-space assessment. No SDK download/install occurred here. Preserve active API 24/AVD data and all raw captures/logs. |
| NDK/CMake | NDK 27.1.12297006 absent; cached Linux archive 663,976,775 bytes. Generated app/RN plugin does not pin CMake; cached 3.22.1 is only a candidate, 22,308,647 bytes. | Hold large installation until extraction/build space fits. Actual AGP CMake resolution is unrun. [Exact package/host/size plan](verification/native-prebuild-current-20261021/sdk-preparation.json). |
| Build tools/JDK | Build-tools36.0.0 present; JDK 21 available. | Presence is not build acceptance. No emulator image, SDK package or live process changed. |
| Standalone Android | Native source generation passes; no APK/AAB or merged release artifact from this work. | After legitimate dependencies and sufficient space, compile/inspect a candidate, then test installed offline/resume/permissions/branding. Secure signing and upload are separate owner-controlled steps. |
| iOS | Linux environment; macOS/Xcode/device unavailable here. | Genuine native build/simulator and real-device pass remain unrun. |
| Physical/a11y/audio | No physical release-device, TalkBack/VoiceOver, hardware feedback or standalone airplane-mode pass. | Record real device/OS/build/outcomes; source searches/Expo Go cannot substitute. |

SDK package facts use an existing 19 October official repository index, not a
newly fetched repository or successful installation. Permitted SDK preparation
is separate from the unchanged denied artifact-host boundary.

## Offline source, notices and distribution draft

Current bounded `app/`/`src/` scan finds no `fetch`, XMLHttpRequest, HTTP URL,
analytics/Firebase/Sentry identifier, privacy/support URL or mail link. This is
application-source evidence, not a complete native SDK privacy/network audit.
Thirteen statically required PNGs total 23,090,937 source bytes; the local tap cue
is 2,028 bytes. Neither sum is an APK/IPA size or decoded-memory budget.

The [candidate notices](THIRD_PARTY_INVENTORY.md), artwork/font/audio provenance
and original root Expo MIT notice remain intact. Compare with actual native
AAR/Pod/resource graphs before distribution: npm metadata does not identify
all shipped code or establish legal clearance.

[The unpublished local packet](RELEASE_PACKET_DRAFT.md) supplies listing and
privacy/support drafts plus concrete handoff fields. The publisher still needs
real support/privacy destinations, rating/data-safety answers, distribution/
signing choices and final-artifact disclosures. No account, external message,
credential, deployment or store action occurred. No legal/privacy conclusion or
ready-to-submit claim is invented.

Unexpected-render failure/invalid-deep-link recovery are still final-build checks.
Expo Router defaults are used; no custom ErrorBoundary is not itself a proven
crash defect. Preserve authoritative saves and visible atomic-command failures.

## Historical hosted CI and audit scope

Initial [run39480837966](https://github.com/YusufYacoobali/dreams-life-sim/actions/runs/39480837966)
failed on one default 5-second connected-test timeout; CI explicitly uses 30 seconds
without changing assertions. Later source-specific passes exist, including
[C34](verification/hosted-ci-autonomy-20261020.json). The workflow remains
read-only, Node 24, locked install, strict app/test types and Jest with a 45-minute
job timeout. This audit did not poll/change/rerun CI or credit a current-main
hosted result without an actual completed run.

Local work comprises offline prebuild, exact source/lock/generated-file checks,
metadata/link/hash validation and `git diff --check`. No new game regression,
annual/policy cohort, export, native interaction or denied build was run.
