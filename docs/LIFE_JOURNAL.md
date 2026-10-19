# Life journal positioning

Resuming the actual age-nine Riley life opened the journal at birth and ages
zero to four. The first content-size event arrived before the virtualised list
had its real viewport/cell metrics, and the old code immediately stopped trying.

The list now coalesces scroll work into an animation frame, follows viewport,
content and individual row measurements, and cancels pending work when the
player drags to read older entries. New facts or a different life/person resume
following. A passive effect preserves the manual reading position when the
navigator freezes and reveals a tab; layout effects reconnect on reveal.
The chronological, variable-height list stays virtualised. No timer loop,
background save or world mutation is introduced.

The affected onboarding/startup/interaction/real-SQLite hobby checks pass:
**13 checks / four suites in 6.479 seconds**, with strict application/test types
and fresh Android/iOS Hermes exports. Component tests do not establish native
list layout; actual Android captures separately verify it.

Actual Android 24 checks show the full latest age-nine entry after a fresh mount
and a force-stop/cold Continue. Scrolling to older age-seven/eight entries works;
opening Activities and returning keeps older history visible instead of jumping
to the latest facts. [Raw captures and SQLite comparison](verification/android24-journal-20261019/)
retain the evidence. All eight SQLite tables remain exact: three lives, eleven
original moments and nine receipts. This layout-only change does not alter the
world, money, RNG or the persistence format.

[Source and bundle hashes](verification/life-journal-20261019.json) identify the
verified candidate. The complete 1,226-test / 80-suite game result still belongs
to `e5a4aaf`; these overlapping affected checks are not a new whole-suite total.
Physical-device timing, complete reference/accessibility, standalone and iOS
acceptance remain open. Continue the native opening/early-game review and the
full production plan; further file breadth is deferred under the user's scope.
