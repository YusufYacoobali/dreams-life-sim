# Local Android builds

Use the locked dependencies with Node 24.3+ in the Node 24 line, a compatible JDK (17 or newer), and the Android SDK selected by Expo/React Native. Run commands from the repository root. On Windows, the project path may contain spaces; the repair helper uses Node file APIs rather than shell commands.

## Repair the Gradle/Kotlin errors

The 15 November 2026 log shows two failures:

- The native Gradle wrapper is **9.3.1**, while Android Gradle Plugin **9.2.1** requires **9.4.1**.
- After upgrading the wrapper, applying `org.jetbrains.kotlin.android` fails because AGP 9 has already created its built-in `kotlin` extension.

The installed Expo **58.0.25** template already specifies Gradle **9.4.1**, `android.builtInKotlin=false` and `android.newDsl=false`. React Native **0.88.1** and Expo use AGP **9.2.1**. The local generated `android` directory has retained older settings; Git ignores that directory, so pulling source changes does not refresh it.

In PowerShell, run:

```powershell
git pull
npm ci
npm run android:release
```

`android:release` runs the repair first, then `expo run:android --variant release`. The ordinary `npm run android` command also runs the repair before Expo. With no generated Android folder, Expo creates a fresh native project using its installed template.

For Google Play uploads, use the [EAS production build and remote version-counter workflow](EAS_RELEASES.md). Local Expo builds do not auto-increment the EAS store counter.

For inspection or to keep using the original Expo command:

```powershell
npm run android:check
npm run android:repair
npx expo run:android --variant release
```

`android:check` reports stale settings with exit code 1 and writes nothing. It also reports when Android has not been generated yet. `android:repair` updates the generated project to match the **locally installed Expo template**, without downloading or guessing a new Gradle version:

| File | Setting |
|---|---|
| `android/gradle/wrapper/gradle-wrapper.properties` | `distributionUrl` |
| `android/gradle.properties` | `android.builtInKotlin`, `android.newDsl` |

This keeps the SDK 58 template's external Kotlin plugin and compatible Android DSL. `android.newDsl` is separate from React Native's `newArchEnabled`, which remains enabled.

Before writing, the helper saves all affected originals under `.expo/android-build-backups/repair-…/android/…`. That directory is Git-ignored. It preserves line endings, unrelated Gradle settings, native code, keystores and signing configuration. If an old wrapper has checksum verification, upgrading it to 9.4.1 also installs the [published Gradle 9.4.1-bin checksum](https://services.gradle.org/distributions/gradle-9.4.1-bin.zip.sha256). Repeating the repair makes no further changes or backups. Missing native files or an unsupported template/checksum combination fail before edits.

Direct `npx expo run:android` calls bypass npm lifecycle hooks; run `android:repair` first when using that command with an existing native folder. The repair does not regenerate the whole native project. Broader SDK/template changes require a separate native prebuild after backing up native-only customizations.

## Verification

- A fresh isolated `expo prebuild --platform android --no-install` succeeds and generates the three expected settings without a new config plugin or dependency upgrade.
- Removing the Kotlin/DSL flags and restoring the old wrapper in that generated project reproduces the stale configuration. The helper restores it; exactly the two property files change across **50 generated native files**, and the next check reports no changes.
- **49 tests across three configuration suites pass**, including actual Node/Expo-template reads, Windows CRLF, paths with spaces, dry-run behavior, backups, duplicate settings, wrapper checksums, idempotence, incomplete projects, unchanged native signing files and existing release/access configuration.
- Strict application/test TypeScript passes. Application/gameplay sources, dependency versions and the lockfile are unchanged.

A complete APK build remains **unverified on this cloud host**. No Android SDK is installed, and the Gradle configuration attempt stopped while downloading the wrapper with `UnknownHostException: services.gradle.org`. The user's Windows build must complete with the commands above; no successful native compilation, installation or signing is claimed from the prebuild/configuration checks.
