# Native opening checks

The custom first-year opening now runs on Android 24 in the official Expo Go
client, including an unchanged cold result resume. Complete matched-reference,
accessibility, physical-device performance, standalone and iOS acceptance remain
open. Component tests and Hermes exports establish separate development checks.

## Android 24 opening journey, 19 October 2026

The isolated lower-resource AVD uses the official Android 24 default x86_64
image, revision eight, emulator 37.2.12 and Expo Go 57.0.9 (the same verified
official APK described below). It requests two cores and 1,536 MB, SwiftShader,
Vulkan disabled, no hardware acceleration and a **390×844 physical / 160-dpi**
display. Android boots to a responding launcher; the APK install returns
**Success**. ADB reverse connects the local project to Metro. These are actual
native captures, with the Android system bars and Expo development overlays
retained.

The custom journey selects an avatar, changes gender to female and the country
to Australia/Sydney, then creates **Rohan Sharma**. The actual newborn identifies
the saved parent Isla Sharma, mother, age 37. Begin Life commits once. The Life
screen shows the five factual stat bars, exact AUD balance, birth journal and
Age Up. The first actual year offers `first-cake`; choosing `smash` commits
“The photograph survives”, Happiness 74→79 and parent relationship +3.

The app is force-stopped on that result, its SQLite database/WAL copied for
read-only diagnostics, and the actual project relaunched. Welcome offers Continue
as Rohan; the original result reappears. All logical rows in **all eight database
tables** match exactly before/after cold startup, including current, backup,
one prior moment, three receipts and preferences. Revision stays three, with
the completed twelve-month cursor and original money/RNG. Acknowledgement then
returns to age one with the factual birthday journal entry once. The exported
8,614-byte [actual native result save](verification/android24-opening-20261019/custom-result-save.json)
and [exact comparison](verification/android24-opening-20261019/cold-resume.json)
retain this evidence. No world/tag/stat/identity/outcome was manually edited.

Native review found two compatibility bugs: API 24–28 does not implement React
Native's multiply blending, so the opaque grayscale detail layer hid all portrait
tints; dark icons also disappeared on the older runtime's dark status bar.
The fallback retains the selected tint with lighter detail, and those legacy
bars use light icons. The fresh native Life/random previews show actual colour
and readable system text. Modern portrait blending/theme behavior is preserved.

Comparison with reference 04 also found that the welcome Image's intrinsic
1024×1536 dimensions overrode its absolute-fill constraints. The native capture
cropped out the central character and city. Explicit percentage width/height now
lets `cover` frame the artwork within the actual viewport. Preserve the original
PNG; this is a layout correction.

The fresh [welcome capture](verification/android24-opening-20261019/welcome-after.png)
shows the corrected central figure and city. The two-parent
[newborn capture](verification/android24-opening-20261019/newborn-after.png)
shows the complete Begin Life control after reducing top whitespace. Random
Life and Roll Again produce distinct actual previews (Leonardo Russo in Milan,
then Ren Watanabe in Kyoto). The confirmation is cancelled once, reopened and
accepted; the created Japanese, non-binary newborn matches that final preview.
The [two-life check](verification/android24-opening-20261019/two-lives.json)
compares the entire preserved custom world with the single expected
acknowledgement of its original result. Accounts, ledger and RNG stay unchanged;
the new random life is separate and initially unacknowledged. No save is replaced.

All fourteen affected onboarding/startup/settings/interaction checks pass across
four suites in 3.605 seconds, with strict application/test typing and fresh
Android/iOS Hermes exports. This UI-only change preserves game/persistence hash
`cca2039afee12cf05ff902cb6fc1ef3228777d90fd498fffdf91c63a381e8d30`.
The complete 1,226-test game checkpoint remains scoped to `e5a4aaf`; these
overlapping checks are not a fabricated new full-suite total. Exact UI/bundle
hashes are in the [polish record](verification/android24-opening-polish-20261019.json).

The [raw captures](verification/android24-opening-20261019/) establish these
scoped interactions. Development warnings/overlays and software rendering are
visible; this is not a pixel-fidelity or native performance pass. The complete
opening/release gate and the conservative progress baselines remain open.

## Android 24 larger text and creation keyboard

At actual 130% system text, welcome actions, custom fields, sixteen appearance
cells and scrollable continuation/start controls remain readable. The complete
`AlexandriaCassandraMontgomery` input survives selecting Australia/Sydney and
Avatar 7, then Continue back. Native bounds confirm 48dp targets for gender,
appearance tabs and face controls.

Opening Country with a focused name field had retained the keyboard's reduced
modal height after IME dismissal. Explicit keyboard dismissal before location/
start dialogs now restores the available height; country Choose/Cancel are
reachable. New-life confirmation is cancelled using Android Back. Every SQLite
table remains exact (active revision 51, three lives/twelve moments/fifteen
receipts); no new life is created. The isolated test emulator's default text
scale is restored. See [onboarding scope](ONBOARDING_ACCESS.md),
[14-check/source/bundle record](verification/onboarding-keyboard-20261019.json)
and [raw captures/values](verification/android24-onboarding-access-20261019/).
This is one 130% software-device case, not complete accessibility/release acceptance.

## Android 24 year, school study and new journal facts

The real Riley child year advances once despite consecutive Age Up taps, pauses
on Biscuit's actual death after ten months, then resumes the same remaining two
months. Age ten retains twenty-four monthly reading practices, the original
manual practice, 49 proficiency, 27,840 AUD minor paid, thirty-six guitar months
and all forty-six pet-care periods. A real school Study Harder action changes
82% grades to 89%, then shows the once-per-year restriction.

This exposed FlatList's estimated-tail scroll stopping above newly added facts.
Using the native ScrollView's actual content end now shows the birthday and study
fact; manual older-history scrolling and tab return still work. Primary school
also removes secondary-only graduation/recovery guidance, keeping the actual
primary grades and activities visible.

Every field of the native current/backup and intermediate worlds matches six
production commands, revisions 45→51. A final force-stop/cold Continue opens the
latest study fact, with every row in all eight SQLite tables unchanged. All eleven original moments/metadata and
nine original receipts remain exact, as do both inactive worlds/backups. The one
new moment is byte-identical to the original revision-45 current payload. See
[actual captures/comparisons](verification/android24-childhood-20261019/),
[journal behavior](LIFE_JOURNAL.md) and the
[18-check/source/bundle record](verification/childhood-native-polish-20261019.json).
Game/persistence/versions and broader release baselines stay unchanged.

## Android 24 hobby selection

Selecting a hobby originally appended its controls below the full catalogue,
leaving the visible screen unchanged. Dedicated detail routes now show Reading's
25% proficiency, twelve months, actual Ruby payer/$11.60 fee and used-practice
reason immediately at the top. Video Games shows its own zero progress and the
existing two-routine limit. Stop Routine opens the real confirmation; cancellation,
Android Back and header Back work without changing any SQLite table. Activities
stays selected. [Leisure details](LEISURE.md) and
[actual captures/comparison](verification/android24-hobbies-20261019/) retain
fourteen affected checks, strict types, fresh Hermes hashes and unchanged game
source. Broader native/release gates remain open.

## Android 24 resumed journal

Actual age-nine resume revealed a journal positioning error: the first
content-size event stopped following before the virtualised rows were measured,
leaving birth/ages zero to four visible. Coalesced viewport/content/row follow now
reaches the final age-nine facts, including force-stop/cold Continue. Manual drag
stops following, and tab freezing no longer resets older-history reading.
The actual manual age-seven/eight history remains visible after Activities and
return. All eight native SQLite tables stay exact. [Journal details](LIFE_JOURNAL.md)
retain 13 affected checks / four suites, strict types, fresh Hermes exports,
[source hashes](verification/life-journal-20261019.json) and
[raw captures/comparison](verification/android24-journal-20261019/).

## Android 24 saved-life continuation

The random Japanese life also completes its actual first year: rebuilding the
fallen tower produces “A better foundation”, Smarts 90→93, then age-one journal.
Switching lives restores the entire original custom world. The native system
share action writes a valid 10,279-byte Ren archive and opens the chooser; the
image has no receiver, so no external transfer is established.

Native import found the SDK Document Picker/modern File System scoped-cache
mismatch. Using the modern File picker and its actual returned document fixes
the permission failure. The native preview shows the genuine age-nine Riley
reading save at revision 44, without database changes before confirmation.
Import restores every field and all nine original compressed moments/metadata,
keeping both earlier lives intact. Acknowledgement produces exactly revision 45.
The separate Directory picker exports inactive Ren while Riley stays active:
the file is byte-identical to the earlier Ren archive and all eight database
tables remain unchanged. [Save files](SAVE_FILES.md) records the 20 automated
checks/types/exports and [raw native evidence](verification/android24-files-20261019/).

These finish an already over-80%-complete milestone under the user's latest
scope. Further file breadth is deferred; onboarding and early gameplay resume.

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

At 19:49:35 UTC, the read-only managed-runtime tool reports current observed and
enforced **spec revision 12**, restricted `package_managers` networking, no custom
allowed hosts, and no `repo.reactnative.dev` in the effective policy. The
[safe status record](verification/native-network-state-20261019.json) contains no
credentials or environment identity. No unchanged denied artifact request was
retried. A newer spec number alone does not establish access to the missing host.
