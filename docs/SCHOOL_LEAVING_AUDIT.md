# School leaving: supported rules and remaining Scenario B gap

Reviewed 20 October 2026. This is an education eligibility and scope audit, not a
new national-law verification or a completed criminal-life acceptance gate.

The [source specification](planning/source-specification.md#53-education)
requires dropping out, and its Scenario B includes school → dropout → crime.
The [simulation contract](planning/simulation-and-persistence.md#education)
requires country leaving-age rules, actual qualifications and preserved incomplete
study/debt. Its country section explicitly describes the twelve packs as
simplified game models and requires sourced regional baselines for consequential
rules. The existing [primary-source audit](EDUCATION_SOURCE_AUDIT.md) distinguishes
school attendance, continued participation and qualification completion; it does
not approve one national permission to leave school in each pack.

## Existing public-school boundary

`RulePack` defines entry, secondary transition and `schoolEnd`. It has no separate
voluntary-leaving or continued-participation age. Eleven profiles assess the
current shared secondary course at eighteen; Italy assesses it at nineteen.
These are authored course ages, not verified compulsory-attendance laws.

Actual attendance enters school automatically below `schoolEnd`; an available
pupil reaches the grade/recorded-study assessment at that boundary. A pass needs
50% grades and twelve recorded study months. A failed assessment preserves the
outcome and awards no qualification. Monthly absence for hospital care, custody,
pursuit, trips or service pauses attendance and can delay the assessment.

`leave-school` supports university, trade and professional-course withdrawal.
It rejects primary/secondary school, including an interrupted pupil who remains
enrolled after `schoolEnd`. An adult birthday is not independent permission to
leave this course. In particular, using `adultAge` would create a new eighteen-
year leaving rule for Italy's nineteen-year course without an approved rule.
Leaving only an overdue interrupted course would not establish the ordinary
pre-completion dropout path in Scenario B.

Consequently this change retains the public-school withdrawal restriction and
states the actual game assessment age/limitation on School and Education.
Original passing/failing outcomes, qualifications, school/callback identities,
monthly recovery, course withdrawal, debt and legacy history are unchanged.
Scenario B's public-school dropout stage remains **unimplemented**. A completed
school assessment without a diploma is not relabelled as voluntary dropout.

## Corrected eligibility mismatch

A real remanded university student could see enabled Study harder, Study routine
and Leave course controls; a paused course also offered Fund Next Year. The
engine already rejects every one of these actions in custody. Tapping them
therefore produced an avoidable failed action instead of explaining the existing
restriction before pressing.

`educationActionReason` now shares those existing command restrictions between
the resolver and Education: custody, active course, once-yearly study, tuition
pause and unsupported public-school withdrawal. Controls expose the same refusal
and the funding button's accessible label includes it. Routine/application drafts
retain their existing durable save/retry/cancel behavior; the modal callback also
ignores a busy submission. No attendance, health, leaving-age, admission, fee,
qualification, successful-command or custody policy is added here.

Focused real-SQLite checks cover genuine saved university study and an actually
cash-funded paused course followed by ordinary offences and actual remand, exact
blocked-command refusals, zero writes/decodes from blocked controls, and cold
restore of the same restrictions. Separate checks cover the once-yearly refusal
and read-only US/Italy assessment explanations. Existing admission,
withdrawal/funding rollback/retry, no-op/cancel and ordinary education/domain
checks remain part of the focused gate: **40 tests / 2 suites pass in 60.483s**,
with strict focused application/test typing. The first run's unchanged UI case
hit the default five-second infrastructure timeout; the final run uses the
existing thirty-second concurrent-host timeout and retains every assertion.
The initial new test trace also exposed that the paused-course offences were
not immediately detected; the final trace follows at most one ordinary year of
visible events to actual delayed arrest, without editing legal state or rolls.
These are configured component/domain scenarios, not a natural birth-to-death,
timing improvement or native release claim.

## Next complete dropout slice

A useful public-school dropout path needs a separately approved authored leaving
rule and participation alternatives, with the regional scope recorded for each
country. It also needs a durable voluntary-withdrawal record distinct from an
exam failure; automatic attendance must respect that record rather than silently
reenrolling. The reviewed action must name the current course, explain that it
awards no qualification, preserve grades/actual attendance and existing debt,
and allow later recovery only through its real eligibility and attended work.
Moves and legacy must retain both the original school record and any still-
applicable destination participation rule. Existing completed qualifications and
old bound scenes must never be reassessed on load.

Do not derive that permission from `schoolEnd - 2`, `adultAge`, a search snippet,
or an inaccessible national source. Country-specific optional upper-secondary/
vocational routes are a better next data model than renaming the current shared
completion birthday as national law. University/trade/professional withdrawal
also still needs fuller permanent incomplete-course history across subsequent
reenrolments; current course fields, journal, payment and any scholarship history
must not be mistaken for that complete record.
