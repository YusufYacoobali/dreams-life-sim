# Bounded university admissions proposal

Approved design, implemented independently from frozen
`6f4b34c40005f5fba8eeee540bada9e0787ccbb0`.
The production gap audit is `13bc0998068483a012a5a5fd4b1c9d279b0852b0`, item3;
the approved simulation plan's Education section explicitly requires accepted,
rejected, waitlisted and withdrawn applications. The lifecycle implementation and
focused evidence are recorded in `UNIVERSITY_ADMISSIONS_ACCEPTANCE.md`.
These are authored game rules v1, not
researched national admissions law or a new country-balance claim.

## Player behavior and compatibility

University's actual Education entry uses a free reviewed application first.
Applying consents only to that application: it starts no course, borrows no
money, activates no scholarship and charges no tuition. A saved place offer
then has its own reviewed enrolment/funding action. Withdrawal is an explicit
saved action; cancelling any local review saves/draws nothing.

First scope is undergraduate university. Trade and professional study keep
their working paths. Keep the existing `enroll` command's immediate behavior
for legacy callers and existing archived scenarios; do not fabricate an
application for it. Block that compatibility path while a real matching live
admission exists, so it cannot reroll or bypass an open application. The current
UI's University entry and matching scholarship shortcut use the new lifecycle.
Existing policy drivers using legacy `enroll` do not establish new admissions
acceptance and must not be described as doing so.

Migration adds empty collections only. Existing current/paused courses,
qualifications, tuition, debt, old result copy, pending/deferred choices,
scholarship records, receipts and archive bytes remain exact. No old successful
enrolment becomes an invented accepted application. Root owns the coordinated
World36/engine37/content12/reader16 migration/version integration.

## Authored decisions and ordinary time

Use the existing academic/availability prerequisites and admission chance:
`min(95, 20 + round((grades + smarts)/2))`. A new application consumes exactly
one actual outcomes-stream draw. Reserve a five-point band on either side of
the existing cutoff for waitlisting: roll <= chance-5 offers a place now;
chance-5 < roll <= min(100,chance+5) waits one calendar month; larger rolls reject.
At the one due review, the saved roll <= original chance offers a place,
otherwise it rejects. This preserves the existing overall chance when actual
prerequisites stay satisfied, adds no reroll, and retains a genuine possible
later rejection. The committed roll stays internal; previews never inspect it.

The waitlist has one real due date and one final decision through ordinary
monthly progression, with no direct date/month-system calls by UI. Recheck
academic requirements then; lost qualification/grade eligibility can reject.
Changing work or funding does not invent a successful enrolment: those current
requirements are checked again when the actual place is accepted. A due offer
uses the existing annual planning pause so the player can review it before
continuing the year. No course/tuition progresses while merely waiting.

An offer lasts twelve calendar months from the actual offer date. Actual move,
death, expiry or starting another course closes incompatible live applications
with a dated reason, never a payment. One live university application at a time;
the existing person/program/field/calendar-year attempt key is retained across
both legacy and new commands. Withdrawal neither clears that key nor refunds
an earlier real course. Application and enrolment each commit once.

## Saved facts and money

An application records actual person ownership within its containing life, local school/country/city,
field, policyv1, application date, real grade/smarts assessment, saved roll/cutoff,
current status and dated transitions, one review due date, offer/expiry/end
dates, and the actual offered tuition currency/amount and course length. Every
status transition is retained; an accepted waitlist does not erase that wait.

Accepting rechecks the real current person/course/compatibility, location and
deadline. It uses a shared course-start path without an admission draw, honoring
the offered tuition/length. The separate review identifies cash or the actual
native-currency student debt line/rate, optional currently eligible scholarship,
and exact first-year bill. Current available cash excludes locked inheritance.
Only successful acceptance activates the aid, books the real loan if selected,
charges the real bill and starts zero completed study months. Store actual
first-payment/loan ledger references, not reconstructed past costs. A failed
durable save retains the reviewed terms and funding choices for exact retry.

Scholarships keep their independent genuine application/expiry/renewal rules.
A matching live admission may apply for aid despite its own yearly admission
attempt key; accepting rechecks the exact real offer's grade/resources/location/
expiry. Aid does not itself admit the student or replace enrolment consent.

The separately planned factual-course slice will retain an incomplete-course record on a real subsequent course withdrawal before
the mutable current-course slot is cleared/overwritten. For a legacy course,
unknown start date and historical paid amounts remain unknown; retain only
actual recorded months/covered tuition months/current terms and observed end.
If a legacy already-incomplete slot would be overwritten by a new enrolment,
preserve an explicitly dated observation with unknown start/end, rather than
inventing its earlier withdrawal date, admission or payment. New enrolments have
their real start and first-payment references. This is a narrowly scoped second
commit, not reconstruction of every earlier school year or all historical costs.

## Implementation boundary and focused evidence

Own new admissions schema/system/validation, an Education admissions card/review,
narrow shared prerequisite/start-course and matching scholarship integration,
and new connected tests/docs. Coordinate distinct engine/model/createLife hooks
with Teen Relationships/Rarity; root alone integrates shared tags/migration.
UI drafts key actual life/person/application, not revision, retain failed same-
context reviews, and reset on identity changes. Only the pressed action is busy.

Use unchanged genuine archived secondary/college contexts and ordinary commands
to earn observed accepted, rejected, waitlisted, withdrawn and enrolled states.
No stats/cash/date/RNG overrides, invented qualifications, forced outcomes or new
seed search. Pure decision-boundary tests may supply scalar roll inputs without
claiming a natural game world. If a bounded genuine journey does not reach a
branch, report that limit rather than fabricate evidence.

Focused actual file-SQLite cases must cover all-eight-table rollback, exact old
rows/payloads/current pending, held/failed review retention, no application-time
tuition/debt, waitlist resolution/withdrawal/expiry, repeat/current-context guards,
exact offer funding/aid/locked-cash behavior, retry with zero warm full unpack,
closed-connection cold world/result equality and acknowledgement once. Ordinary
continuation proves enrolment starts study and future tuition only after actual
acceptance; withdrawal retains factual incomplete study and real debt. No broad
gate, native interaction or frozen C36 integration change belongs in this slice.
