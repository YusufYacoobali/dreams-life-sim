# Native opening checks

Native opening, matched-reference visual comparison, accessibility and release
acceptance remain open. Component tests and Hermes exports establish separate
development checks.

## Android 29 software-emulator attempt, 19 October 2026

This bounded attempt uses official Google command-line tools, emulator 37.2.12,
the Android 29 default x86_64 image (revision eight), platform-tools 37.0.1 and
the official Expo Go 57.0.9 APK. The APK's minimum API is 24; its SHA-256 is
`14c18828a3d04e43922245920bd941b978fd1c7a5aec88a0188032f0bb4972ce`.
No custom React Native build or signing was established.

The isolated AVD requests two cores, software SwiftShader graphics, disabled
Vulkan and a 780×1688 / 320-dpi display (390×844 logical pixels). There is no
`/dev/kvm`; acceleration is disabled. The emulator increased requested memory
from 1,536 to 2,048 MB. Android reports boot complete after 174.993 seconds.

At 17:25:19 UTC, before Expo Go launched, Android recorded an ANR while executing
`com.android.systemui/.SystemUIService`.
[The actual pre-game capture](verification/android29-system-ui-anr-20261019.png)
shows its “System UI isn't responding” dialog. Expo Go subsequently installed;
its package path was confirmed, the local project URI launched, ADB reverse
mapped port 8081 and ReactHost reported that Metro was running. Metro received a
bundle request. Later capture showed the same system dialog over a blank screen,
with no usable game screen or completed gameplay interaction. Bounded screen/
package commands also timed out. The streamed install client timed out, while
the non-streamed upload completed and the package was present; a returned
installer success line is not claimed.

The [selected native log lines](verification/android29-opening-20261019.log)
retain the OS failure and launch observations. Expo Go also logged headless-app
loader reflection errors; the evidence does not establish their effect on this
project. No game JavaScript crash or successful Begin Life is inferred from the
launcher/Metro messages. The emulator was stopped after the bounded attempt.

The previous Android 15 software attempt also reached bundle download/Running
main but repeatedly hung in System UI/Phone. A responsive accelerated emulator
or physical Android device is still needed for the opening interaction and
matched-viewport comparison. iOS native checks require macOS/device access.

The managed outbound policy still omits the React Native artifact host needed
by the custom build. This attempt used allowed official SDK/Expo downloads;
it did not alter proxy/TLS settings, use an alternate artifact mirror or retry
the previously denied custom-build download unchanged.

## Reduced-density Android 29 attempt

After the world-26 pet regression, the same isolated AVD was cold-started at
**390×844 physical pixels / 160 dpi**, retaining the intended 390×844 logical
layout while rendering one quarter as many pixels. It requested two cores,
2,048 MB, SwiftShader, Vulkan disabled and no hardware acceleration. Animations
were disabled through the Android settings service. This used the existing
installed Expo Go; the denied custom-build artifact was not retried.

The emulator reports the requested display configuration. SurfaceFlinger reports
its boot-finished milestone after 115,380 ms; Android's `sys.boot_completed`
property remained empty. At **19:18:55 UTC**, before the game launched, Android
again reported an ANR in `com.android.systemui`. The actual
[390×844 capture](verification/android29-lowres-system-ui-anr-20261019.png)
shows that system dialog over the Android wallpaper. Choosing Wait succeeded as
an injected command; subsequent project launch returned **“Can't find service:
activity”**, exit 20. No usable opening screen or Begin Life was reached. The
[selected native lines](verification/android29-lowres-opening-20261019.log)
retain these observations. The isolated emulator was stopped.

The lower raster load shortened the compositor milestone but did not establish
responsive Android services. No native visual/gameplay, performance or release
gate is closed by this attempt. Continue independent gameplay implementation;
a responsive device/accelerated emulator and macOS/iOS execution remain needed.
