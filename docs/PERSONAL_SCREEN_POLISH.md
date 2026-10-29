# Named life selection and Statistics viewport

This narrow UI follow-up starts from C35 `e938dbe7`. Its independent visual audit
opened all25 accepted C35 screenshots and the relevant supplied references;
the50 PNG/XML files match the published manifest byte counts and SHA256.

In `native/captures/nia-existing-entry.png` and its XML under
`docs/verification/opening-completion-20261020/`, Alex's and Nia's different
Continue buttons both have the accessible name Continue. Each button now
announces **Continue as [actual saved name]**, keeping its visible text and
existing selection action. No file operation or storage behavior changes.

The three accepted Statistics PNG/XML pairs show its scroll viewport ending
at y687, leaving48 pixels above the game tabs at y735. Profile and Finances
reach y735 on the same390×844 device. Statistics had applied a bottom safe-area
inset in addition to the game shell's existing bottom navigation inset. It now
applies only the top edge, as other personal detail pages do. The actual list,
projection, data, caching, batching and scroll behavior remain unchanged.

The clipped first-view rows are not described as unreachable: the alternate
Statistics capture already shows all10 stats. The persistent Expo development
gear is outside this fix. No portrait, artwork, model/schema/version, game
command, persistence, original fixture, main or frozen native change is made.

Existing meaningful Statistics and Saved Lives component suites pass:
11 tests / two suites in46.969 seconds. They retain the Statistics file-SQLite
read-only/all-eight-table/cold/identity behavior and the existing saved-list
summary, recovery and file-operation behavior. No test is added merely to repeat
the styling or label expression; no existing affected query needed changing.
Strict affected routes and those existing suites pass with no diagnostics, and
the diff check passes. Tests and types ran sequentially in the coordinated slot;
no broad, export or additional cohort gate was run.
Actual normal/130% native viewport and named-selection acceptance belongs to
the coordinator's next integrated-source run, and is not claimed here.
