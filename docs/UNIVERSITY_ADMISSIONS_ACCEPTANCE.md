# University admissions: bounded lifecycle

This independent slice starts from `6f4b34c40005f5fba8eeee540bada9e0787ccbb0`.
It implements undergraduate applications required by the simulation plan and
production gap audit item 3. The approved policy is in
[UNIVERSITY_ADMISSIONS_PLAN.md](UNIVERSITY_ADMISSIONS_PLAN.md). Trade/professional
study and legacy direct `enroll` callers retain their immediate admission path;
they do not manufacture application records. A legacy call cannot bypass a real
live university application or reuse its subject/calendar-year attempt.

Applications are free. Accepted means a place offer, with separate reviewed
enrolment/funding consent. One saved outcomes roll determines an immediate
offer/rejection or one calendar-month waitlist. The due review uses that saved
roll and current academic eligibility without another draw. An actual offer
pauses ordinary annual progression for planning and lasts twelve calendar
months. Waiting, withdrawing and expiry start no course, aid, tuition or loan.

Policy v1 freezes the existing authored tuition in each country's actual minor
units, including zero-decimal JPY. It is not a national-policy accuracy claim.
Actual enrolment rechecks course availability, location, deadline, current aid
and spendable native-currency cash; it honours the saved offered tuition/length
and the actual existing native student-loan line/rate. It stores the real first
tuition and borrowing references. Aid retains its independent application,
resource/grade requirements and renewal rules; the admission attempt cannot
make its matching scholarship or place acceptance self-ineligible.

No version tags or decoder migration were changed here. The temporary schema
default is an isolated-branch bridge only. Root must integrate the REQUIRED
future `universityApplications` array with empty legacy migration only for
World <=35, alongside the coordinated World36/engine37/content12/reader16 work.
No old enrolment, paid amount, qualification, pending scene or admission is
reconstructed. Factual incomplete-course records and the existing scholarship
review reliability fix are separate subsequent commits.

These implementation and migration notes describe the original isolated slice.
The combined World36/engine37/content12/reader16 runtime has its coordinated
migration and additional ordinary story selection. Its current waitlist evidence
is recorded separately below; the original observations are retained as history.

## Historical isolated connected evidence

The unchanged v24 historical pupil is reopened through the actual repository
branch API, then completes the final secondary year using ordinary commands.
The selected archive's original life and historical payloads remain protected,
alongside a separately imported unchanged v30 archive. The working branch's
mutable snapshots are not mislabelled as immutable imported history.

Four actual file-SQLite UI cases cover free application, separate funded
enrolment, offered-place withdrawal, and a genuinely reached waitlist. Receipt
insertion failures roll back all eight tables and the exact world. Confirmation
choices/body remain with one modal error; duplicate submit, Back and cancel are
blocked during held saves. Retry performs zero warm full checkpoint unpack;
actual backup bytes equal the immediately preceding current payload. Closing
the database and opening a new connection restores exact committed worlds and
results. Acknowledgement/repeat commands cannot award another place or bill.
Ordinary continuation starts study only after actual enrolment, while waiting
and withdrawal leave tuition and student borrowing absent.

The fixed eight-application journey uses one original pupil and one Computing
application each calendar year. It resigns any actual employment before applying
and chooses the first available ordinary scene response. It does not edit world
statistics, cash, dates, qualifications or random streams, inspect a hidden roll
to choose an action, search seeds, or force an outcome.

| Application year | Observed initial decision | End of ordinary year |
| --- | --- | --- |
| 2018 | Accepted | Offer expired |
| 2019 | Accepted | Withdrawn |
| 2020 | Rejected | Rejected |
| 2021 | Accepted | Withdrawn |
| 2022 | Waitlisted | Accepted at February review, then withdrawn |
| 2023 | Accepted | Withdrawn |
| 2024 | Accepted | Withdrawn |
| 2025 | Rejected | Rejected |

The same 2022 waiting state is earned on disk through those ordinary commands.
Actual Life Age Up failure/retry proves one February offer, one planning pause,
exact cold result and retained failed withdrawal. A final waitlist rejection
was not reached by this trace; scalar policy boundaries are tested separately
and do not claim a naturally reached world. No seed search was added to fill it.

The unchanged v20 approved-work-move checkpoint supplies a real US-to-Japan move.
Normal resignation permits a local free-application draft; an actual meditation
revision keeps it, the actual relocation resets it, and an unmounted callback
cannot dispatch. A new Tokyo review quotes yen from actual residence while
nationality stays US. Local selection/cancel performs no world/save/RNG work.

Existing education and scholarship suites retain their trade/professional and
legacy command checks, while undergraduate UI expectations follow the new free
application and later consent. The genuine scholarship journey proves a real
award remains unactivated until enrolment and that its actual tuition waiver,
student debt and later renewal still reconcile.

## Historical isolated validation

- `/tmp/dreams-university-admissions-focused-first.out`: 100 tests / 6 suites
  passed, 76.654s (before the final explicit confirmation type guard).
- `/tmp/dreams-university-admissions-ui-final.out`: final affected UI source,
  4 connected tests / 1 suite passed, 27.518s; adds the genuine waitlist case.
- `/tmp/dreams-university-admissions-types-final.out`: final strict app and
  all-test types both closed exit0 with no diagnostics.
- `git diff --check` passed. No broad regression, native, export, cohort or
  frozen C36 integration change was performed by this slice.

Earlier diagnostics remain: the first two-case run reached rollback/retry/cold
checks but failed an overbroad test history assertion, corrected to capture
original rows before creating the working branch. The first strict run exposed
a grouped-union narrowing error, corrected with an explicit confirmation guard.
Neither failed run is credited as a passing gate.

## Current combined-runtime waitlist acceptance

This test-only follow-up starts from combined source
`4981d473b11bc587046f78caaeb69bcb3277464f`. The weighted ordinary story selection
changes the pupil's actually reached academic history. The first waitlist now
occurs on 1 January 2020 and ends in rejection at its 1 February final review.
The root's existing eight-year domain run also observes an immediate accepted
offer in 2022. These outcomes replace neither the historical isolated observations
above nor the game's saved admissions policy.

The connected check stops at that first actual waitlist. It uses the same
unchanged historical pupil, ordinary secondary completion, one Computing
application per calendar year, actual employment resignation and ordinary scene
choices. No seed, date, statistics, funds, qualification or saved roll is edited,
and no search continues past the rejection to find a waitlist offer.

The real Life Age Up button holds one ordinary month during a receipt-write
failure. All eight tables and the exact world roll back, the duplicate press is
blocked, one visible error remains, and retry commits once with zero warm full
checkpoint unpack. The saved review preserves its original roll/chance, closed
rejection transitions and lack of tuition or borrowing. A closed connection and
new repository restore that exact result and all eight tables.

Rejection interrupts for its saved result but does not set the offer's planning
pause. Acknowledging it immediately continues the remaining ordinary annual
months, reaching the next actual scene on 1 December 2020. Completing that real
year reaches 1 January 2021 with one final rejection
journal entry. A further cold reopen displays the actual waitlist/rejection
history without offer or withdrawal controls; stale acknowledgement, acceptance
and withdrawal refuse without writes. Original imported payloads and history
remain protected. The separate accepted-offer, funded-enrolment and offered-place
withdrawal UI cases are unchanged.

An actual waitlist-to-offer transition is not reached by this current policy.
The isolated 2022 offer remains historical positive evidence. Scalar admission
boundaries and conditional generic assertions do not establish a newly reached
waitlist offer or current SQLite coverage of that offer's planning pause.

Current validation:

- `/tmp/dreams-admissions-current-waitlist-tests-first.out`: 6 connected tests /
  1 suite passed, 48.116s, including the unchanged accepted-offer, enrolment and
  withdrawal cases. The emitted actual observation records the saved roll 96,
  chance 92, one February rejection, no planning pause and final revision 78.
- `/tmp/dreams-admissions-current-waitlist-types.out`: affected strict TypeScript
  check closed exit0 with no diagnostics, using
  `/tmp/dreams-admissions-current-waitlist-tsconfig.json` to include the actual
  UI test and its imported application/domain code.
- `git diff --check` passed.

No current native, visual, whole-suite, export or cohort pass is claimed by this
follow-up. The original combined focused-run failure remains in
`/tmp/dreams-production-gaps-initial-focused.out`; its stale 2020 expectation is
the test defect repaired here, not a passing gate.
