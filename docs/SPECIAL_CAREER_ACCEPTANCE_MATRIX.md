# Eleven special-career acceptance matrix

Audited against `docs/planning/source-specification.md:815`, decision D09 in
`docs/planning/MASTER_PLAN.md:106`, and
`docs/planning/artwork-and-delivery.md:181`. The approved
`design/Life Sim Tycoon_ Career And Business Hub.png` was reopened: it adds
Royalty, Astronaut and Military to the original eight families. Doctor and lawyer
remain qualified ordinary work. No family needs its first implementation again.

The delivery requirement is to exercise each family's entry, ordinary progress,
failure and exit. Catalogue presence, an illustration, a story-context fixture,
and Scenario C alone cannot establish that. This is a source/evidence audit from
`work` checkpoint `0ea6177`; existing evidence was inspected, with only the
affected royalty component suites rerun below. No whole-family completion percentage is
inferred from the number of rows.

Evidence labels:

- **Genuine archive:** unchanged historical producer payload. Its recorded
  results are evidence of that particular journey, not evidence of all choices
  or that its original preparation was unarranged. Exact provenance is in
  `tests/fixtures/README.md`.
- **Arranged domain/component:** tests explicitly initialise funding, stats,
  age, RNG, response rolls or identities. Real commands and monthly calculations
  can establish a branch invariant; they do not establish a natural journey.
- **Connected SQLite:** real store/repository commands and transaction failure.
  Earlier files use the temporary in-memory SQLite driver and `repository.load`
  as their cold-read boundary. They are component tests, despite historical test
  titles saying “native”; they are not Android/iOS acceptance or process restart.
- **New on-disk flow:** the new royalty check closes and reopens the actual file
  connection and bootstraps a new store. Its age/stat/funds/RNG values come from
  the genuine archive, without post-load overrides.

## Mechanics and existing evidence

| Family | Actual entry | Ordinary progression | Refusal or failure | Exit and evidence limits |
| --- | --- | --- | --- | --- |
| Actor | `select-career` audition after authored age/skill/health/commitment gates; two yearly attempts, saved selection draw, no advance salary. | Six actual paid contract periods, recorded attendance/quality, saved audience response, reputation/recognition. | `careers.test.ts` covers skill refusal, saved rejection, import traps; arranged award case sets quality/response. | Contract expiry and `leave-career` cancel unfinished work while retaining earnings/contacts. Genuine v12 contains six paid periods and a pre-year contract. `career-flow` tests arranged audition failure/retry; `career-review-save-flow` uses the genuine prior contract for focus rollback/cold. A genuine connected actor exit remains open. |
| Model | `select-career` casting uses modelling skill, Looks/Fitness and current work/study/age gates. | Three-month project/contract, native-currency pay, attendance and quality. | Arranged `careers.test.ts` model hospital absence records half pay and cancellation; country table runs a model project using explicitly arranged local residence/accounts. | Expiry is exercised for model; explicit shared leave is exercised using actor, not every kind. No genuine model journey or connected casting/leave flow is claimed. |
| Athlete | `select-career` tryout requires Athletics, Fitness and authored ages 18–40. | Three 12-month seasons within one 36-month contract; actual matches, wins, injuries and pay. | Shared entry guards; athlete Fitness refusal is explicit. Shared selection/response and injury mechanisms exist, but not every failure is separately connected for athlete. | Arranged 36-period test proves expiry and no generic promotion reset. No genuine athlete archive or connected leave/season interruption journey was found in this audit. |
| Musician | Live selection requires Music; a completed live project is required before `record-music`. | Actual live contract; three/six funded recording months; saved release response; paid listening periods, finite 60-period licences and factual listening milestone. | `music.test.ts` covers too-early recording, funding pause, cancellation, forged production/royalties. These use arranged qualification/cash/RNG and some explicit response traps. | Leaving live music preserves completed licence payments; cancellation preserves sunk production costs; death ends future payments. Genuine v13 records a completed live contract, production and six listening periods. Existing `music-flow` tests arranged recording-start rollback/retry, not a genuine recorded-release exit. |
| Politician | `start-campaign`, actual registration cost, persistent funded rival and fixed six-period election. Ordinary job/career selection cannot confer office. | Real funded campaign periods; existing winning candidate gets a 48-month office contract; pay starts after appointment, with annual casework and constituent meetings. | Refusal, underfunding, losing to actual rival and conviction dismissal are domain checks; winner/loser branches deliberately arrange skill/response, and conviction test searches an arrest seed. | Withdrawal leaves rival's election running; actual term expiry stops salary. Genuine v14 records an elected player at the first unpaid office period. `politics-flow` tests arranged campaign/election SQLite rollback. Genuine connected withdrawal/term expiry remains open. |
| YouTuber | `start-creator` opens a studio attached to an existing VideoWave profile; no manufactured subscribers or income. | Real videos, owned equipment, paid editor/moderator work and actual creator receipts; part/full-time routines use existing content production. | Full-time skill/equipment/time gates and combined production/crew funding checks; arranged tests cover shortfall warnings and unavailable crew. | `leave-creator` stops cadence, ends crew and retains posted history/invoices; closing account also ends studio. Creator domain exit is arranged. `creator-studio-flow` tests arranged YouTuber start/crew rollback; no genuine full YouTuber entry-to-exit archive was found. |
| Streamer | Existing Streamline account plus `start-creator`; same personal ownership gates, separate live-session semantics. | Actual 30/60/120-minute sessions, real reach/energy/crew transfers, archived live minutes and finite recent details. | Arranged duration comparison, unavailable crew/funding checks and moderation response trap; fake live metadata on non-streaming profile is refused. | Shared studio exit/death retains account history and ends future work. Genuine v15 records 102 sessions/6,120 minutes and actual crew payments. `creator-studio-flow` tests arranged live-post rollback. Genuine connected studio exit remains open. |
| Business owner | `start-business` pays real capital/startup costs, creates separate books and actual owner/manager work; reviewed quotes use company currency. | Orders, costs, facilities, staffing, payroll, earned profit/distributions, actual manager delegation and expansion. | Domain tests cover unfunded wages, creditor recovery and three unpaid months causing liquidation. Those are arranged branch tests; company cash never becomes personal wages merely by ownership. | `sell-business`/close/liquidation settle actual assets, staff claims/debt and residual proceeds. Genuine v11 records twelve company months/staff/88 company transactions. `business-review-save-flow` covers connected review/funding and identity/no-op/all-table failure retention; full natural all-country entrepreneur Scenario C is a separate policy gate. |
| Royalty | Actual royal parent/newborn in GB/JP/ES, or actual marriage; reception buys a meeting chance, never a title. Hereditary succession uses existing people. | Adult public duties pay only attended native-currency months; private life keeps title without allowance. Public focus/occasions affect actual later work/image. | Domain tests cover childhood/unsupported country, hospital absence, conflicting work, no reception introduction and legal succession. Some adult/reception/marriage branches arrange health/relationships/outcome seeds; they are labelled domain setups. | Private mode stops future duty allowance; permanent renunciation and death preserve actual family/estate rights. Genuine v17 records 18 real childhood years plus 12 adult attended duty months. Existing `royalty-flow` uses arranged healthy adult for duties/renunciation. New on-disk tests below cover genuine public→private/focus, private annual continuation and actual newborn refusal. |
| Astronaut | `apply-service` requires authored 25–45 entry age, Science, actual degree/fitness/health and availability; no ordinary-job bypass or instant qualification. | 24 attended training months within 36 calendar months, saved assessment, qualified pay from next period; actual six-period research assignments and promotions. | Domain fixtures explicitly arrange age/skills/cash/exam/risks; training absence/failure and injury/fatality traps test machinery, not natural selection odds. | Fixed 60-month contract, early return, leave/discharge/death retain actual training and paid periods. `service-flow` and `service-context-flow` exercise arranged application/mission/identity retry; the genuine v16 archive is military, not astronaut. A genuine astronaut entry-to-exit journey remains open. |
| Military | `apply-service` for Army/Navy/Air Service with actual secondary qualification, Service Training and authored 18–40 entry age. | Six attended training months in 12 calendar months, saved assessment; fixed 48-month terms, paid qualification/promotion and six-period assignments. | Explicit training failure/absence, direct ordinary-job refusal, sole-caregiver restriction and risk traps use arranged test inputs. | Leave/ordinary resignation, early return, term expiry and death preserve qualification/history and stop future pay. Genuine v16 records six real training periods, passed assessment, twelve paid periods and a completed relief assignment. `career-review-save-flow` uses that genuine state for focus; `service-context-flow` actual returned-member history still begins with arranged prior eligibility. Genuine connected resignation/re-enlistment remains open. |

Source owners for the matrix are `src/game/systems/careers.ts`, `music.ts`,
`politics.ts`, `creators.ts`/`social.ts`, `businesses.ts`/`businessMonth.ts`/
`businessLifecycle.ts`, `royalty.ts` and `services.ts`. Detailed supporting tests
are the same-named files in `tests/game/`, plus the named files in `tests/ui/`.
The career/service catalogues explicitly describe authored game rules rather
than national recruitment law. Currency-table tests arrange residence/accounts;
they are not twelve-country natural careers.

## Bounded change and new evidence

The verified UI gap was Royalty's current public focus/private mode: each was
shown as Selected but could still confirm and save an identical `royal-duties`
command. Both now expose a clear disabled reason. Other public choices preserve
the exact existing `royalDutyReason`; going private remains available according
to the existing engine rules. No command, success/failure odds, allowance, title,
history, money, availability or fee rule changes.

The existing shared `useCareerReview` already binds reviews to life/person,
blocks launches/duplicate confirmation/cancellation while busy, retains failed
commands/errors and closes after durable success. No duplicate hook/identity
implementation was added.

`tests/ui/royalty-review-save-flow.test.tsx` uses unchanged v17 current and prior
checkpoint data. It checks the actual recorded 2,400,000 JPY allowance history;
public→private and changed-public-focus receipt rollback/retry/cold result;
no upfront money, erased duty months, new people or RNG draws on the mode/focus
command; current/no-op/cancel read-only behavior; held-command duplicate/Back
guards; exact all-eight-table failure/read/cold equality; original historical
payload/metadata preservation; and one actual private year through store
commands with twelve zero-allowance nonattendance records. A separately normally
created royal newborn uses the real birth acknowledgement and proves disabled
adult controls plus the actual direct refusal, with no overrides or writes.

This closes a specific royalty transition gap. It does not establish all-eleven
natural acceptance, every failure outcome, every country, full-life integration,
physical timing or actual native/large-text fidelity. The remaining genuine
connected exit/failure gaps in the table should guide future focused work rather
than scheduling the existing families for reimplementation. No old fixture,
engine/model/schema/version/persistence source or ordinary-render scan changes.

Affected validation: the new five tests and three existing royalty component
tests passed together (8 tests/two suites, 34.357 seconds). After adding an
explicit stored-snapshot/original-fixture byte assertion, all five new tests
passed again (10.201 seconds). These counts overlap and are not thirteen
distinct tests. Strict affected-file application/test types and diff checks
passed. No full regression, special-career cohort, country sweep, export or
native run was added by this change.
