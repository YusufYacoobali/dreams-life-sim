# Reproduced outcome and narrow correction

This follow-up supersedes the initial source-only crash prediction in `REPORT.md`. The original source-only report, summary and hashes remain byte-exact. Both ordinary paths actually completed a paid year with unintended secondary schooling and a second failed assessment; an uninterrupted-save crash was not observed.

Frozen correction: `eed54f3472ababd2cbcd0ac3dbf16ca255b3bb30`, isolated branch `agent/country-gameplay-audit`, base `c9a7f5b845694e5f8446c50115fb1fd6c3e69b03`. Three files changed; no global version, country-age, fixture, migration, persistence, app or frozen C36 edits.

# Adult full-time work and automatic school entry

Italy's authored game model assesses secondary school at 19 and permits ordinary
full-time work from 18. An adult without a secondary qualification can legitimately
have education stage `none` and a full-time job before 19. Automatically starting
secondary school in the next month would conflict with that existing contract:
the world validator disallows full-time employment during active study.

Automatic public-school entry therefore respects an existing adult full-time
contract whose role is in the real job catalogue. This affects only entry from
stage `none`; it does not remove an enrolled pupil, relax job ages, add a
withdrawal or qualification, or change country school assessment ages. Part-time
workers and minors still enter school under the existing rules. If the adult
leaves the job while still within school age, ordinary automatic entry can occur
again. Existing explicit withdrawals retain their separate permanent meaning.

The regression starts from the original genuine World23 low-grade archive's
unfinished seventeenth-year snapshot. Current normal progression produces an
actual failed assessment at 18 with no secondary qualification. It then uses
ordinary safe-answer job interviews, real borrowing within earned contract
capacity, a paid relocation application and a reviewed funded move to Rome.
One path accepts a work offer; another moves for settlement and obtains a job
through a local interview. Choices, rolls, dates, funds, stats and qualifications
are not overwritten in these two continuations. This is bounded pure-engine
continuation with production checkpoint roundtrips, not SQLite or native
acceptance or a from-birth policy journey.

Separate declared age-boundary unit fixtures cover the existing pupil refusal,
adult part-time work and school attendance, minors' unchanged work-age gate,
absence of an automatic diploma/withdrawal/cash/RNG reward, and school re-entry
after resignation. Those units do not claim natural country journeys.

The unchanged-source baseline actually completed both ordinary paid years, but
also enrolled the worker and added a second failed assessment in Rome at 19
(153 recorded study months versus the retained original 142). The uninterrupted
year did not itself throw: validation ran after secondary school had ended.
A full-time job plus active school is invalid at an intermediate boundary, but
the baseline does not claim an observed natural interrupted-save crash.
The baseline retained three failures and two passing controls in five cases,
13.764 seconds, in `/tmp/dreams-adult-work-school-baseline.out`.

With the narrow entry guard, the new five cases plus the existing education
recovery and school-withdrawal suites passed: 54 tests in three suites, 16.029
seconds (`/tmp/dreams-adult-work-school-focused.out`). The affected strict
TypeScript graph for these three test files and their production imports closed
with exit 0 and an empty log (`/tmp/dreams-adult-work-school-types.out`). No full
suite, full app/UI typecheck, SQLite/native run or policy cohort was performed.
No historical fixture is rewritten.
