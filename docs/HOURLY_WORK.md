# Hourly part-time contracts

New Weekend Shop Assistant and Part-time Café Assistant applications offer8,
12(default) or20fixed contracted hours per week. They use52paid weeks per year,
apportioned across actual monthly pay periods. These are authored game rules,
not verified national working-time, leave or minimum-wage laws. All12existing
country entry ages remain16; both roles still need no formal qualification.

The hourly rate uses the existing role/country pay scale divided by the12-hour,
52-week baseline and rounded once to native minor units (including whole-yen
JPY). Annual gross is exactly hourly rate × weekly hours ×52. Monthly payments
use cumulative integer rounding; a complete unchanged year pays the exact annual
gross. No money, service or worked time is earned by browsing, applying, hiring,
acknowledging a result or changing a preview. Reviewed rate/hours/weeks and gross
bind into the saved interview. Withdrawal and refusal create no hourly contract;
the existing once-per-role/calendar-year application limit prevents rerolls.

Students may contract at most16hours weekly, so the20-hour option is disabled.
An existing new20-hour contract also prevents full-time course enrolment. Choose
a compatible job before studying. Hours remain fixed for that contract; this
slice does not add schedule renegotiation. Existing evening recovery courses
remain compatible with ordinary employment. Full-time work/study, special-career,
company, NPC recruitment and relocation entry rules remain unchanged.

Each actual worked month uses up to2/3/5Energy for8/12/20hours;20hours adds1Stress,
in addition to the existing effort/performance rules. Changes stop at stat bounds.
One normal monthly period records weekly hours ×52×60/12paid and worked minutes.
Hospital care retains the existing half-pay rule and records half paid time,
with no worked time/performance draw. Eligible paid travel leave earns pay/service
and paid time without worked time/performance. Unpaid absence earns no pay, time
or service. Paid months retain their existing pension-service meaning rather than
being retrospectively converted into full-time equivalents.

Hourly promotion and accepted raises adjust the hourly rate first, round to native
minor units, then derive the future annual amount at the same contracted hours.
Earlier payments stay exact. Legacy salary promotions and5%annual raise rounding
remain unchanged. Fixed contract currency, original foreign earnings receipts,
reference-currency lifetime earnings, residence taxation and actual service
remain under the existing earnings rules. An inactive actual hourly employee's
background settlement uses that contract's current rate and only elapsed periods
since its start; it does not create a new NPC job or fabricate pre-contract time.
Background rows are dated settlements of contract periods, not device-observed
physical shifts. Ordinary monthly payroll uses the same linked hourly terms for
any relevant actual person, including a prior player.

World32/engine33 links new employment/history IDs to hourly contracts containing
reviewed initial terms, rate changes and paid/worked period receipts. Old annual
contracts and unanswered interviews have no hourly marker and keep their exact
pay/history. Migration adds only an empty collection and version tags; it invents
no old hours, rate changes, service or money and does not eagerly rewrite original
current/backup/history payloads. Reader12 protects the new records. Checkpointv4
and the save-before-publish transaction/cache architecture remain unchanged.

Validation reuses the shared ledger index, indexes raises once and checks identity,
reviewed rates, fixed hours, actual periods/time, exact income receipts, history
and current pay. Both accepted and declined raises bind their original terms;
every accepted request has exactly one corresponding rate change. Pension receipts
cannot be reused as hourly pay. Empty hourly history uses a fast path. Content9
is coordinated with the separate editorial/locality correction; already-bound old
scenes/results and historical payloads retain their original text.

Focused unit and real-SQLite component checks cover all12country pay scales,
8/12/20-hour rounding, both roles, student limits, stale quotes, legacy pending
interviews, withdrawal/refusal, travel leave, hospital pay, promotions/raises,
foreign/background earnings, corruption, rollback/retry, warm checkpoint reuse
and exact cold unanswered interviews/results/payroll. They do not establish
national policy accuracy, natural lifetime coverage, physical timings or complete
Android/iOS/standalone release acceptance. Root integration records final gates.
