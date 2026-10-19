# Creation keyboard and larger text

Actual Android 24 review at **130% system font scale**, 390×844/160dpi, verifies
the welcome actions, custom form, country list, four-column appearance grid and
scrollable Continue/Start controls. The native accessibility tree retains the
complete `AlexandriaCassandraMontgomery` input rather than only its visible tail.
Choosing Australia/Sydney, selecting Avatar 7 and returning through Continue
preserve that full draft identity and location.

Opening Country while a name field was focused left the native modal using the
keyboard's previous reduced height after the keyboard disappeared. It showed
only two countries in a small scroll area. Country/City and Start confirmation
now explicitly dismiss the keyboard before opening their native dialog. There
is no added timer, save or delayed action. The actual corrected country picker
uses the full available height; its Choose/Cancel actions are reachable at 130%.

Avatar arrows and gender radios in creation, plus appearance tabs/face controls,
now have at least **48dp** touch targets. Native UIAutomator bounds independently
confirm all three gender controls, four appearance tabs and four face controls at
48dp height and at least 48dp width. The sixteen avatar cells remain readable.

All **14 affected checks / four suites** pass in **3.511 seconds**, with strict
application/test types and fresh Android/iOS Hermes exports. The connected
real-SQLite onboarding journey still covers actual creation/appearance/country,
newborn acknowledgement, first-year save failure/retry and cold continuation.
[Source/bundle record](verification/onboarding-keyboard-20261019.json) and
[unmodified native captures/values](verification/android24-onboarding-access-20261019/)
retain the scope. The real new-life confirmation is opened and cancelled with Android Back.
All eight native SQLite tables stay exact: three lives, twelve original moments
and fifteen receipts at active revision 51. This check edits an unsaved creation
draft, not a saved life. The isolated emulator's default text scale is restored: `font_scale` was initially
absent; deleting the test override makes Android report `1.0`. No app preference
changes.

Game/persistence and the complete 1,226-test / 80-suite checkpoint stay unchanged;
overlapping affected checks do not establish a new complete regression. This
130% Android software-device case is not complete accessibility, physical-device
performance, standalone, iOS or matched-reference acceptance. Those gates and
conservative production baselines remain open. Continue onboarding/early-game/
full production work; further file breadth remains deferred.
