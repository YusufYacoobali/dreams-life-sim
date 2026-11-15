# Local Android builds

Use the locked dependencies with Node 24.3+ in the Node 24 line, a compatible JDK (17 or newer), and the Android SDK selected by Expo/React Native. Run commands from the repository root. On Windows, the project path may contain spaces; the repair helper uses Node file APIs rather than shell commands.

## Repair the Gradle/Kotlin/R8 errors

The 15 November 2026 logs show three stale-template failures:

- The native Gradle wrapper is **9.3.1**, while Android Gradle Plugin **9.2.1** requires **9.4.1**.
- After upgrading the wrapper, applying `org.jetbrains.kotlin.android` fails because AGP 9 has already created its built-in `kotlin` extension.
- Once Kotlin configuration succeeds, `android/app/build.gradle` still calls `getDefaultProguardFile('proguard-android.txt')`. AGP 9 rejects this non-optimizing rules file during configuration, even when minification is disabled. It requires `proguard-android-optimize.txt`.

The installed Expo **58.0.25** template already specifies Gradle **9.4.1**, `android.builtInKotlin=false`, `android.newDsl=false` and the optimized R8 default. React Native **0.88.1** and Expo use AGP **9.2.1**. The local generated `android` directory has retained older settings; Git ignores that directory, so pulling source changes does not refresh it.

In PowerShell, run:

```powershell
git pull
npm ci
npx expo run:android --variant release
```

The usual direct Expo command now repairs an existing Android project's Gradle/Kotlin/R8/CMake settings automatically when Expo reads the app config, before Gradle runs. `npm run android:release` and `npm run android` also retain their repair hooks. With no generated Android folder, Expo creates a fresh native project using its installed template and the project's config plugins.

## Windows native path errors

If `:app:buildCMakeRelWithDebInfo` fails with `Filename longer than 260 characters`, the generated C++ paths exceed the limit in Ninja 1.10.2 bundled with Android's default CMake 3.22.1. Increasing `CMAKE_OBJECT_PATH_MAX` does not give that Ninja executable long-path support.

The project selects **CMake 3.31.6 on Windows**, which bundles Ninja **1.12.1** with long-path support. Install that CMake version under Android Studio's SDK Manager → SDK Tools → Show Package Details if it is absent. Windows long paths must also be enabled; they were already enabled on the connected Windows machine. Other build hosts keep their existing CMake selection. See the [Ninja 1.12 release notes](https://github.com/ninja-build/ninja/releases/tag/v1.12.0).

`plugins/withWindowsNativeBuild.cjs` applies the setting during fresh prebuilds. The repair helper applies the same setting to an existing ignored Android project before direct `npx expo run:android` commands. No folder move or edits to installed dependencies are required.

For Google Play uploads, use the [EAS production build and remote version-counter workflow](EAS_RELEASES.md). Local Expo builds do not auto-increment the EAS store counter.

For manual inspection or repair:

```powershell
npm run android:check
npm run android:repair
npx expo run:android --variant release
```

`android:check` reports stale settings with exit code 1 and writes nothing. It also reports when Android has not been generated yet. `android:repair` updates the generated project to match the **locally installed Expo template** and the project's Windows CMake selection, without downloading or guessing a new Gradle version:

| File | Setting |
|---|---|
| `android/gradle/wrapper/gradle-wrapper.properties` | `distributionUrl` |
| `android/gradle.properties` | `android.builtInKotlin`, `android.newDsl` |
| `android/app/build.gradle` | Replace the obsolete `getDefaultProguardFile` argument with `proguard-android-optimize.txt`; select CMake 3.31.6 when Gradle runs on Windows |

This keeps the SDK 58 template's external Kotlin plugin, compatible Android DSL and optimized R8 rules. `android.newDsl` is separate from React Native's `newArchEnabled`, which remains enabled. The R8 repair changes only calls to the obsolete default; custom ProGuard files, keep rules, signing configuration and other Gradle code are preserved. It accepts single/double quotes and whitespace across LF/Windows CRLF lines.

Before writing, the helper saves all affected originals under `.expo/android-build-backups/repair-…/android/…`. That directory is Git-ignored. It preserves line endings, unrelated Gradle settings, native code, keystores and signing configuration. If an old wrapper has checksum verification, upgrading it to 9.4.1 also installs the [published Gradle 9.4.1-bin checksum](https://services.gradle.org/distributions/gradle-9.4.1-bin.zip.sha256). Repeating the repair makes no further changes or backups. Missing native files or an unsupported template/checksum combination fail before edits.

The automatic hook is limited to the explicit `run:android` command and prepares a complete existing project once per CLI process. Normal config reads, Metro startup, exports, prebuild, iOS commands and EAS archive config evaluation remain read-only. Missing/incomplete native projects are left for Expo's native-project handling. The repair does not regenerate the whole native project. Broader SDK/template changes require a separate native prebuild after backing up native-only customizations.

## Verification

Verified on Windows on **15 November 2026**:

- `node node_modules/jest/bin/jest.js --runInBand --cacheDirectory .expo/jest-cache tests/config/android-build-repair.test.ts`: **20 tests pass**, including actual Expo-template reads, direct CLI config evaluation, backups, LF/CRLF preservation, unchanged signing settings, repeated repairs and the Windows CMake selection.
- `node tools/repair-android-build.cjs --check`: current, with no further changes needed.
- `npx expo run:android --variant release --device <connected-device-id>`: **BUILD SUCCESSFUL in 27m 28s**, including native compilation for all four configured architectures, release optimization and APK packaging. The original failing Gesture Handler object compiled successfully with a **345-character path** using Ninja 1.12.1.
- The release APK installed and opened on the connected **Samsung A15 (SM-A155F)**. ADB confirmed `com.yacoobali.lifesim/.MainActivity` in the foreground and a running app process; the filtered startup error logs contained no AndroidRuntime, ReactNativeJS or ReactNative errors. The user also confirmed the app works.
- APK: `android/app/build/outputs/apk/release/app-release.apk`, **263,201,770 bytes**, SHA-256 `8abb77731b75c9f95693905fc4bf1010d6bccb1f9f9aad41800d57c9c76c5707`. The full local build log is `.expo/android-release-build.log` (Git-ignored).

The successful build still emitted dependency deprecation/R8 warnings and a Gradle daemon metaspace warning. These did not prevent compilation, installation or startup. Gameplay and purchase flows were not exercised as part of the build repair. Dependency versions, the lockfile and application code were unchanged.
