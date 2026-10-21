# Reused loan rate quotes

Education funding and paused-course resumption now display the rate on the
student loan line that actual borrowing will reuse. Bank personal borrowing uses
the same read-only projection. A France-to-Germany move keeps EUR debt at its
original rate: student borrowing remains 2%, and personal borrowing remains
6.5%, rather than advertising Germany's new-line rates of 1.5% and 6%.

The projection matches the existing `common.borrow` identity exactly: active
person, loan kind and home-account currency. A fully repaid canonical line also
retains its rate when drawn again. A different-currency loan does not supply the
quote: new GBP student and personal lines use the current country's authored
4% and 8% rates. These are existing simplified game rules, not claims about
current national lending law.

No debt arithmetic, historical interest, lending eligibility, tuition,
scholarship, command, persistence format or version tag changes. Bank changes
are limited to the import and the confirmation's interest value, allowing the
separate durable-form improvements to integrate independently.

## Connected test scope

`tests/ui/student-loan-rate-flow.test.tsx` starts with seed 3 and an explicitly
configured ordinary developer background from the production NPC constructor.
It does not claim a natural birth-to-career playthrough. Production commands
then borrow in France, withdraw from a real funded course and complete approved
work relocations to Berlin and London. No cash, debt, qualification, grade,
application-count or random-state edits prepare those journeys.

For paused-study coverage, actual cash enrolment and an actual investment
purchase are followed by two complete production annual cycles. Monthly living
costs exhaust cash and the second tuition payment pauses the course after 12
completed study months. Resumption preserves those months and charges the
existing student line's rate.

The UI actions run through the real game store and save repository against a
temporary on-disk SQLite database. Coverage includes university, trade,
professional medicine and law; loan selection and review; cancel with no save
or checkpoint unpack; all-table rollback on an injected receipt-write failure;
retained confirmation or selected funding and alert; retry with zero warm
checkpoint unpacks; exact cold recovery after closing and reopening the SQLite
connection; and acknowledgement without another borrowing, tuition charge or
random draw. Tests also preserve the unchanged v24 archive's historical
snapshot payloads. Bank checks cover local review/cancel and actual borrowing
with warm and reopened-connection cold checks; durable Bank failure handling is
covered by the independently owned Asset/Bank workstream.

Native layouts, country source validation and broad release gates remain with
the coordinating workstream.

Focused validation: the new suite passed 9/9 checks in 22.498 seconds. Existing
education choice/save and scholarship suites passed 17/17 checks in 30.090
seconds. Strict compilation of the new test and its imported source passed;
the staged diff passes whitespace checks. No broad or native gate was run here.

## Accepted C37 admissions test adaptation

The accepted-source full regression retained in
`/tmp/dreams-production-gaps-accepted-regression.out` found three stale university
UI expectations: the shared helper requested `Next` after subject selection,
but the approved undergraduate lifecycle now separates a free application from
offered-place funding and final enrolment consent. The trade/professional,
paused-study and Bank cases retain their existing paths. This correction changes
only this test and documentation; production source, seed3, configured initial
background, fixtures, earlier producer pins and all loan arithmetic are intact.

Each affected university case now submits exactly one actual free Arts
application through the real UI/store, observes its saved outcome, acknowledges
it, and reviews the actual offered place. The free application must leave people,
accounts, debt and ledger untouched. No alternate subject, seed, roll, date or
forced acceptance is prepared. The loan-preview cancellation check starts after
that separately saved application and acknowledgement, so it still proves that
funding previews and cancellation themselves save/draw nothing. Paid enrolment
uses the actual `accept-university-place` command and retained confirmation.
Existing EUR2% and new GBP4% quotes, fully repaid-line reuse, exact borrowing and
tuition, receipt-failure rollback/retry, zero warm unpack and closed-connection
cold acknowledgement remain checked. A new direct raw backup assertion verifies
that successful paid commands preserve the exact previous current payload.

The corrected suite passed9/9 in23.515seconds, with session10407 directly
observed closed exit0 before the environment reconnect
(`/tmp/dreams-c37-student-loan-focused-first.out`). All three fixed-context Arts
applications actually offered a place on their one draw. The original full-run
missing-`Next` failures remain the baseline; no outcome or setup search occurred.

The first temporary `/tmp` type configuration could not resolve the `jest` and
`node` type libraries (TS2688). Its handle was lost at reconnect and receives no
passing credit. After correcting only that configuration's explicit `typeRoots`,
affected strict compilation of this file and its imported source actually closed
exit0 in session54657, with an empty diagnostic log
(`/tmp/dreams-c37-student-loan-types-corrected.out`) and durable exit0 receipt
(`/tmp/dreams-c37-student-loan-types-corrected.exit`). Diff check passes. No broad
regression, native or frozen-source change was performed for this correction.
