# Keep creation on screen until saving finishes

Fresh creation previously started saving without a confirmation modal. Its
visible Header Back still navigated, and New Life did not intercept Android
hardware Back. The pending submission could later finish and redirect from an
unrelated screen to the newborn introduction.

New Life now sets an immediate submission ref before calling the existing save.
The actual Back callback checks that ref, so a queued tap in the same turn is
blocked before React renders the busy state. A focus-scoped Android Back listener
also checks the ref and current busy state; it is removed on blur/unmount. The
visible Back stays in its original layout, dimmed and accessibly disabled while
busy. Header's optional `backDisabled` prop defaults to false for other screens.

The ref clears in `finally`. After a failed save, Back and editing become
available again, the exact draft remains and the existing live save error stays
visible. Existing-life confirmation/cancellation and the one successful route to
`/birth` remain unchanged. No game, store, repository, save format, version or art
was changed. This is not a global navigation lock or native/iOS acceptance.

The existing held-save regression captures the actual Header press handler and
hardware handler before submission, invokes them immediately after Start in the
same React act, then checks busy Header accessibility and hardware interception.
The unchanged source meaningfully failed with one unexpected `router.back` call
(`/tmp/dreams-creation-back-baseline-third.out`, 1 failed/1 passed, 1.963 seconds).
Two earlier instrumentation diagnostics remain separately preserved: the host
button did not expose `onPress`, and a direct composite Pressable query did not
resolve. The corrected test walks from the real accessible Back node to its
actual handler ancestor; these setup diagnostics are not gameplay findings.

The final three focused opening suites passed: 9 tests, 5.604 seconds
(`/tmp/dreams-creation-back-focused-final.out`). They retain actual SQLite rollback and
all-eight-table comparisons, unchanged drafts/errors after failure, one failed
creation attempt plus one successful retry, exactly one saved new life and one
successful `/birth` route, duplicate/busy controls, restored Back after failure,
listener cleanup and birth acknowledgement once. The extended held-save case
uses in-memory SQLite and bootstraps a fresh store/repository on that same open
connection; it does not claim a closed-connection cold resume. The existing-life
review suite separately retains its original on-disk rollback, closed-connection
reopening and old-life preservation checks. Original custom/random/appearance
flows also pass. These are native-component tests with SQLite, not Android
screenshots, physical hardware or a fresh native acceptance run.

Strict application types passed with an empty log
(`/tmp/dreams-creation-back-app-types.out`). The initial affected-test typecheck
caught React Native86's hardware listener event argument in the test Set type;
the diagnostic is retained in `/tmp/dreams-creation-back-test-types.out`. The
test now uses the installed listener signature and a declared unit event. The
final focused run above and affected three-test import graph typecheck both
closed with exit0; the latter log is empty
(`/tmp/dreams-creation-back-test-types-final.out`). No full regression, all-test
typecheck, export or native run was performed for this isolated change.
