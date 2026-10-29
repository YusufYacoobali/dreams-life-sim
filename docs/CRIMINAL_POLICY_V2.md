# Criminal-life policy v2: genuine secondary withdrawal

Policy v2 replaces the former missing-dropout limitation in the automated
[Scenario B strategy](planning/source-specification.md) with the actual
[secondary withdrawal command](SCHOOL_WITHDRAWAL.md). This is a preregistered
strategy and focused acceptance, not a completed new twelve-country cohort or
complete Scenario B acceptance.

The feature dependency is the independently reviewed
`1f94017f5682e92221bdf13f8e9cea70c6d0bd18` (World34 / engine35 / content9 /
reader14). The coordinator will consolidate content10 and pin that final
integrated source before running the country cohort. This policy changes no
production game code, rules, schema, content, fixtures or original evidence.

## Registered decisions and truthful outcomes

After saved decisions/results finish, every free or paused annual planning
window checks the real `currentSchool` and `schoolWithdrawalReason`. Before
later employment or crime actions, the first eligible current secondary school
is withdrawn from using its exact community ID, country, city and school name.
The authored country minimum, presence and normal activity restrictions apply;
no age/date, stats, money, RNG, hidden legal roll or outcome is changed to make
withdrawal available. A blocked window retains its actual reason. If normal
school completion, illness, death or another restriction prevents the exit,
withdrawal remains unreached.

One real compulsory `leave-school` refusal remains. When an under-minimum
secondary school is actually available, one distinct `school-withdraw` attempt
must be refused with whole-world/RNG equality. Its attempted command is in the
trace but does not count as a committed exit. No extra milestone is added: the
same26 names remain. In v2, `schoolExit` specifically requires the active
person's actual `schoolWithdrawals[]` record and the linked original community
closed as `withdrawn`; ordinary `schoolCompletions[]` cannot substitute. Both
histories are reported separately. The proof retains actual date, age, frozen
rule version/minimum, school identity, grades and recorded attendance.

Successful withdrawal must preserve accounts, ledger, liabilities, employment,
work history, hourly contracts, qualifications, ordinary school completions and
RNG. It grants no diploma, job or income. A real result acknowledgement follows;
later attendance and automatic re-enrolment do not restart.

The existing later strategy remains: at most three actual offences, at most one
per year, in shoplift/pickpocket/burglary order, only after
`max(18, adultAge, schoolEnd)` and no later than35. Withdrawal does not lower
these policy ages. Actual eligible victims, detection, bail affordability,
not-guilty hearings, acquittals/convictions, prison routines, release, work/travel
restrictions, record expiry, retirement, natural death and estate conservation
retain their existing decisions and checks. Reached milestones require actual
records; missing milestones retain death/bound status and their last observed
restriction where one exists. A completed run or reached exit does not establish
that all Scenario B milestones happened; `scenarioBComplete` remains false.

Only actual creation and birth acknowledgement use the real in-memory SQLite
repository/store. Subsequent commands run the immutable pure engine, and cold
checks use production `packCheckpoint` / `unpackCheckpoint` with complete
canonical-world equality and actual frame sizes. This does not claim a full
SQLite/native journey, physical performance, contraband/seizure, all choices,
Scenario A/C or multigeneration acceptance.

## Source registration before the coordinator's cohort

The country assignments remain exactly US900, CA901, GB902, AU903, FR904,
DE905, ES906, IT907, BR908, IN909, JP910 and ZA911. They reuse the original twelve
seeds and add no distinct seeds to the separate120 annual-policy total.

`node tools/run-criminal-policy.cjs --manifest-only` deterministically prints
policy version, exact game/persistence/tool/policy/birth-driver/store SHA256s,
selected seed assignments and scope, without creating or running a life. Run it
on the final frozen integration before the cohort and retain that manifest
beside a **new** v2 output; never overwrite v1 files. The runner independently
pins sources before execution and rejects changes before publishing results.
`--country CODE` and `--max-years N` retain their existing selection/bound scope.
A150-year default requires actual natural death, not successful completion of
every milestone.

The isolated dependency-source registration, not a cohort result, is:

| Source | SHA256 |
| --- | --- |
| Game TS fingerprint | `a7fbc6b93fbe3e32ffe8ab618cb07afa48307702cbf62a2727a47ae6736cd0b6` |
| Game and persistence TS fingerprint | `bcf3ee0419121eec8891d1dec64ffa5bbed70bbb2fe2eba8193d1f30eab12e82` |
| Policy helper | `5091b729b69b514d6aab5a8105afd68ef652434e4ac40c549e5c51ce5f801a4f` |
| Runner | `eb64a09b4f3c91686f970c85359b3012439e9e581ff9e105e4fe223ff87b04bb` |

These game fingerprints must change when the coordinator integrates other
production source. Re-register that source; do not relabel this focused result.

## Preserve the v1 evidence

The original helper/runner remain recoverable at commit `0ea6177`:

| Historical artifact | SHA256 |
| --- | --- |
| `tests/support/criminalPolicy.ts` | `c2736883f2cf873b2fc299687612d740e36ed2543d9127740c56b8c9e1e3d3bd` |
| `tools/run-criminal-policy.cjs` | `a209a9e8b3f31769ddbcff3618b184bdea8bf96f8ee5753561c55784ea508afc` |
| `/tmp/dreams-criminal-natural-policy-20261020.json` | `29d450099ee7ce8635c6661bfebac3334f1ff2c0fc6be2ae8f3663796f4d97a2` |

The original completed v1 twelve-life file is World33 / engine34 / content9,
game fingerprint
`ed3148b53360a79b7ee7237c7a1916d6e878f00662609bf0b3a2a7c027a39f6f`.
Its missing-dropout finding, actual failed/unavailable attempts, acquittals,
natural deaths and other omissions remain historical observations. Its raw
records and prior failure artifacts are not rewritten by this change. Later v2
success cannot retroactively establish that v1 exercised withdrawal.

## Focused acceptance

The focused policy suite uses actual saved births and normal commands: ordinary
US childhood; a bounded US adult crime/legal journey; US/IN/JP withdrawal at their
first real eligible free/planning window and different country minima; and a US
bound below its minimum with an actual unreached restriction. Withdrawal snapshots
check exact scope, no grant/RNG changes, acknowledgement, retained closed school
and no resumed attendance. These bounded tests are not twelve completed lives.

The CLI manifest is checked directly twice for identical bytes, actual source
hashes and all twelve assignments; syntax/help are also checked without a life
run. An initial attempt to spawn the CLI from Jest was rejected locally with
`EPERM`; that subprocess test was removed and the actual CLI was checked through
the supported shell execution tool. The six policy assertions passed in that
initial run. The final focused run passes all6 tests /1 suite in19.814 seconds
(`/tmp/dreams-criminal-policy-v2-tests-final.out`). Strict app/test types pass
(`/tmp/dreams-criminal-policy-v2-types.out`), followed by a final strict test-type
check after the subprocess-test removal
(`/tmp/dreams-criminal-policy-v2-test-types-final.out`).
The registered manifest is `/tmp/dreams-criminal-policy-v2-manifest.json`, SHA256
`70467fb43ad9bc0c3fbaa6bb447e08b036df6216b2252f8706a1229d7949010d`;
its independently generated repeat is byte-identical.
No full regression, annual120, long criminal cohort, native or physical-device
acceptance is claimed here.
