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
