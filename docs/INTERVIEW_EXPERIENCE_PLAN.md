# Bounded paid experience in new ordinary interviews

Proposal based on `ace1e38e12ae2493501a30e6f003201e0fd6ab41`, isolated from the
frozen C37/C38 integrations. The read-only country/balance audit is
`/tmp/dreams-country-balance-next-audit.md`, SHA256
`8568b7db900be4efdb9d9d4d932bb794de7f408ff14f74d616b1ce86da893019`.
The [simulation blueprint](planning/simulation-and-persistence.md#L141) requires
actual employment history to influence interviews. Current ordinary interview
chance considers stats, fame, convictions and the answer, but not work history.

## Existing binding policy

`work.ts` binds employer, exact annual/hourly pay and each answer into the saved
`job-interview` effect. It does **not** save chance or roll at application.
At answer resolution, current eligibility is checked; the current stats and
answer determine a 15–95% chance and one `outcomes` draw. Withdrawal draws nothing.
Old saved effects must retain this exact path, narrative and random-stream count.

## Authored V1 rule

Relevant ordinary roles share the existing `JobRole.sector`: for example paid
Weekend Shop Assistant work is relevant to Retail Assistant, and Café Assistant
to Barista. Special careers are excluded. This is an authored game rule, not a
claim about national recruitment practice.

Each six distinct, evidenced paid calendar months contributes one percentage
point, capped at five points after thirty months. The existing final 15–95%
bounds remain. Hours, gross money and currencies are never converted into extra
months. Different jobs/payments in the same month count once.

Do not trust lifetime totals or `monthsWorked` alone: the latter can include
unpaid company accrual or supplied background history. Positive ordinary monthly
wage receipts must identify this person's actual ordinary external contract and
currency within its recorded dates. Hourly work uses its exact worked-period to
gross-transaction link. Salaried receipts are used only when the contract is
unambiguous in that calendar month. Skip ambiguous switches, company payroll,
background aggregate income, back pay, pensions, leave/hospital hourly periods,
unpaid periods and another person's receipts. Conservatively omitted old evidence
earns no invented retrospective experience.

Bind a small optional V1 experience quote and the final per-answer chance into
**new** effects. A factual sentence in the new interview explains the evidenced
months and modest bonus, without promising employment or higher salary. The
saved quote survives cold resume and is validated against its real evidence at
answer resolution; an absent quote selects the untouched legacy formula.
No new world collection, guessed legacy default, earned months, money, rank,
qualification or extra random draw is added. The coordinator owns a later
World38/engine39/content13/reader18 union; this branch does not change global tags.

## Focused acceptance

Use genuine hourly/ordinary earned-work archives and normal resignation,
application, answer and pay commands; state any deliberately arranged boundary
setup. Test thresholds/caps, related versus irrelevant roles, other people,
unpaid/ambiguous periods, currencies and exact old saved pending/result behavior.
Compare preview/RNG and complete codec worlds. Add one connected real on-disk
application/answer failure and retry, duplicate/busy guard, zero warm full unpack,
closed-connection cold decision/result/acknowledgement, and unchanged original
raw backups/history. No seed search, broad cohort, native or full-regression run.
Run narrow checks only after the shared queue is explicitly released, then obtain
Work's independent exact-SHA review before coordinator integration.
