# Career review reliability

The shared career confirmation now keeps its reviewed command and terms until
the command saves successfully. Failed saves show one accessible error inside
the dialog and retain the review for retry. Cancellation and opening a review
remain local. While saving, the shared hook rejects another command and prevents
cancellation; only the submitted confirmation reports busy.

All seven existing callers use the shared behavior: special careers, service,
creator studios, skills training, music, politics and royalty. Their background
error is hidden while a review owns that error. Review identity includes the
actual life and active person, plus the kind for dynamic career/service/studio
routes. Changing that context clears an old command without tying drafts to
ordinary saved revisions.

The career focus and service routine already selected are disabled with an
explicit reason. Selecting an unchanged plan therefore cannot create another
saved result. A real change still applies the original command and leaves past
work, qualifications, pay, contacts, projects and assignments intact.

The [connected checks](../tests/ui/career-review-save-flow.test.tsx) use the
production store and an actual on-disk SQLite database. They start with the
original v12 active-actor snapshot and the v16 service checkpoint's genuinely
passed training and completed assignment. The service setup acknowledges the
stored result using the production engine, entering its existing planning pause.
No fixture, selection outcome, training result, funds, date, skill or random
stream is rewritten.

For both domains the checks cover cancellation/current-plan no-ops, exact
rollback of all eight tables and current world, one retained modal error, retry
with zero full checkpoint unpacks, exact cold load through a newly opened
database/store, and one acknowledgement without duplicated effects. They also
cover duplicate submission, blocked cancellation and Android Back during saving,
focused busy feedback, and clearing a review on career-kind changes.

These are component/SQLite checks. They do not establish physical interaction
timing, native screen layout or new qualification/selection success. The
simulation, persistence, progression and immutable fixtures remain unchanged.

All nine affected tests across three suites pass in 5.957 seconds with a
30-second test timeout, including the existing career and service flows.
Application and test type checks also pass. Consolidated exports and native
acceptance belong to the primary integration stream.
