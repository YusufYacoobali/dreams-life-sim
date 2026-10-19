# Save migration fixtures

- `v1-newborn.json`: created with the actual model and creation resolver from commit `44d8bc3`, seed 42, date 18 October 2026.
- `v2-birthday-result.json`: created with the actual model, creation and annual resolver from commit `1ca6d94`, seed 42. The first birthday choice is already committed, while its result awaits acknowledgement.
- `v3-employed-graduate.json`: created with the actual engine from `0c93e75`, seed 16, a US character with fixture-initialised Smarts/Discipline of 90/80. Eighteen years of school, a funded computing degree, an accepted developer application and a year of work produce actual qualifications, debt, tax, work history and 213 ledger rows.
- `v4-property-offer.json`: continued with the actual `4fd9bca` engine from the v3 graduate (fixture opening cash increased by 10 million minor units), with a studio mortgage and ten GROVE shares. The property is listed and annual progression is paused at month two with a persisted buyer offer, actual mortgage/holdings, prices and FX.
- `v5-marriage-result.json`: generated with the actual `45f2024` model/engine. The v3 graduate has fixture-initialised cash and a known high-trust partner; real proposal and wedding commands pay for/give a ring and form the shared household. The committed marriage result awaits acknowledgement. Existing accounts, 215 ledger rows and RNG streams are retained.
- `v6-birth-result.json`: generated with the actual `8066b5f` model/engine from the v5 marriage. Fertility/health and the next outcome stream are fixture-initialised, then real conception, acknowledgement and Age Up commands produce a child after nine paid/simulated months. The birth result is awaiting acknowledgement at the original annual cursor. No current-engine child was substituted into this old format.
- `v7-history-archive.json`: created with the actual `fd6de87` model, repository and gzip/archive codec against real SQLite. It captures the v6 birth-result moment, acknowledges it into a later original future, then restores the earlier moment as `life_fixture_history` and exports that branch with its compressed checkpoint/history and branch origin. Migration must preserve the real child, pending birth, nine-month cursor and historical metadata while adding only new-version defaults.
- `v8-medical-archive.json`: created with the actual `3189a80` model, health engine, repository and archive codec against real SQLite. The v3 graduate receives fixture-initialised asthma severity 80 and Health 90; actual Age Up pauses at month one with an urgent-care decision and a persisted 36,000-minor-unit quote. The export includes the same compressed historical moment. Legal/queue migration must preserve this quote, medical state and random streams.

- `v9-court-archive.json`: created with the actual `c30b883` engine/repository/archive against real SQLite. A vandalism arrest, paid bail and private counsel precede a real Age Up with fixture-initialised asthma severity 80. Urgent care has primary priority and the actual court hearing is deferred at month one. Both current and compressed historical state preserve the held escrow, paid counsel, case evidence, medical quote and RNG streams.

- `v10-creator-archive.json`: created with the actual `020858b` engine/repository/archive in real SQLite. Eight delivered posts, 5,346 followers, 119 minor units of creator receipts and unassessed support income, a persisted brand offer and one prior compressed checkpoint must survive the company-schema migration unchanged.


- `v11-business-archive.json`: generated with the actual `cee69fc` engine, repository and archive codec in real SQLite. A managed café completes twelve actual operating months with two persistent employees, 88 company transactions, funded wages, dividends and personal annual settlement. A compressed pre-year company checkpoint is retained. The skills/career migration must preserve its exact company cash, contracts, history, ledgers and random streams without inventing prior training.

- `v12-career-archive.json`: generated with the actual `2ee8b9c` engine/repository/archive in real SQLite. A selected actor completes six real paid role periods (2,000,000 minor units), with its result pending and the annual frame paused at month six. A compressed pre-year checkpoint retains the active contract, colleagues and the same saved response. The music-schema migration must preserve both states, exact earnings, RNG and pause without rerolling the role.

- `v13-music-archive.json`: generated with the actual `7e76656` engine/repository/archive in real SQLite. A musician completes a live contract and three funded recording months, then six actual listening periods yield 121,470 units and 242,940 minor units of royalties, with actual annual tax settlement. A compressed recording-start checkpoint retains the unfinished release and saved response. Election-schema migration must preserve both stages, payments, identity and random streams.

- `v14-election-archive.json`: generated with the actual `44b2e68` engine/repository/archive in real SQLite from the v13 musician. A funded six-period campaign elects the existing player, with the first office period still unpaid, twelve actual listening periods and 472,576 minor units of royalty receipts. Its compressed pre-year checkpoint retains the ongoing campaign, the same opponent and saved response. Studio migration must preserve the election, appointment, payments, cursor and historical state without creating past production.

- `v15-studio-archive.json`: generated with the actual `1883a54` engine/repository/archive in real SQLite. A Streamer opens an existing profile, buys a laptop, hires two actual freelancers and publishes six initial live sessions. A full actual year produces 102 total sessions/6,120 live minutes, 557,626 minor units of creator income and 132,600 minor units of exact crew transfers across 26 invoices, with sixty recent posts and real earlier archives. The compressed pre-year checkpoint retains the same crew, six posts and production plan. Service migration must preserve current and historical studio identities, ledgers, archives and random streams.

- `v16-service-archive.json`: generated with the actual `7b78152` engine/repository/archive in real SQLite. A navy applicant completes six attended training periods and a saved assessment (discipline 90), then a six-period relief assignment produces 132 service units. Twelve actual paid periods total 3,600,000 minor units, with its result pending at the paused month-twelve cursor. The compressed pre-year checkpoint retains unfinished training and the same exam roll. Royal-house migration must preserve actual contracts, qualification, saved risks/work, colleagues, pay, cursor and historical state.

- `v17-royal-archive.json`: generated with the actual `79e8830` engine/repository/archive in real SQLite. A Japanese royal newborn completes eighteen real years, chooses public duties as an adult and completes another actual year. Twelve attended duty months pay 2,400,000 JPY with actual tax/living/health settlement, no employment or pension service, 58 exact old role archives and 1,219 ledger entries. The prior compressed checkpoint retains the same private eighteen-year-old, actual parents/house, succession and RNG. Credit/currency changes must preserve the original amounts and history.

- `v17-pension-archive.json`: generated with the actual `79e8830` engine/repository/archive in real SQLite, extending the same Japanese royal journey to 29 actual years. Existing people retire from their recorded ordinary service; the parent head has 44 actually paid pension periods and a 1,212,632 JPY annual entitlement, while another contact has nine paid periods. The world contains 3,483 ledger entries, 107 royal archives and the original private pre-duty checkpoint. Currency migration must preserve already-paid counters without inventing retrospective payment records or paying those periods again.

- `v18-foreign-pension-archive.json`: generated with the actual `42605b4` engine/repository/archive in real SQLite. The financial test setup selects an existing qualified administrator aged 67 with real recorded background service and USD earnings rights, ends their job and sets Japanese residence before retirement (v18 has no player emigration command). Actual retirement and twelve monthly Age Up periods then pay 2,408,163 native USD minor units, converted to 3,642,345 JPY gross with 36,430 JPY in actual fees at twelve saved quotes. There are 49 ledger entries; the prior compressed checkpoint retains the unspent entitlement before the first period. Only the initial residence/health setup is arranged; the old engine performs and saves every pension payment, fee, tax, living cost and outcome. Travel migration must preserve both current and historical rights, paid counters, quotes, ledger and RNG.

These fixtures preserve the old encoded formats, exact money, random streams and bound narrative. Tests migrate them through the current codec and verify their continuation without rerolling or reapplying effects. Do not regenerate old fixtures using the current model.

`v24-university-loan-archive.json` was generated with unmodified `464925a`
(world 24 / engine 23 / content 3), before scholarships. Seed 16 starts a real US
life on 1 January 2000 using the store, SQLite repository and Begin Life. Every
year, available choice and result commits normally. Focused study and helpful
classroom conduct are actual commands. The new school rules award secondary
education in 2018; a real university application then enrolls in computing with
a student loan and a 1,400,000-USD-minor tuition payment (`txn_60_4368`). At age
nineteen, revision 65 has twelve completed university months, 100% grades,
4,642 ledger rows and the original debt. The export selects the two latest
genuine pre-Age-Up moments. No version, money, grades, qualification, RNG or
enrolment was manually edited. Preserve the old payment/progress and snapshots;
new awards must not be retroactively invented. Never regenerate with newer code.

`v23-low-grade-school-archive.json` was generated with the unmodified source at
`55fee6b` (world 23 / engine 22 / content 3 / database 4), before school passing
and recovery changes. Seed 16 starts a US life on 1 January 2000 through the real
store, SQLite repository and Begin Life acknowledgement. Every Age Up, available
choice and result commits normally. During actual school years, relaxed study
and disruptive conduct are selected through commands. The old engine awards a
secondary qualification in 2018 despite actual grades of **0%**. Revision 59
retains 4,367 real ledger rows and eleven attended school-year reports. The
archive selects the two genuine pre-Age-Up checkpoints at ages sixteen and
seventeen; older snapshots are omitted from this test archive. No world version,
grades, qualifications, RNG, outcome or participant was manually edited. New
rules must preserve the already earned qualification in the current state while
applying only to future actual school completion from the earlier moments.

`v23-school-plans-archive.json` was generated before the content-three expansion
using the unmodified world-23 / engine-22 / content-two application source from
`1633359` (the later `a920655` checkpoint contains no application source changes).
Seed 42 and the existing school fixture helper establish the US eight-year-old's
actual class. Two bound origin decisions then run through the real resolver and
SQLite command receipts: a project promise and accepted arcade permission, with
the initial NPC stream set to the first accepting consent seed. Actual Age Up
pauses at month one; attendance pays the original parent’s quoted **2,000 USD
minor units** once. The exported current state retains the paid result, 31 ledger
rows and the still-scheduled month-two project. Two compressed checkpoints retain
both plans before Age Up and the unpaid offered outing. No version tags or saved
outcomes were edited. Content-three migration changes only content metadata in
all three worlds, preserving people, choices, money, permission, RNG and cursor.


`v19-family-trip-archive.json` was generated with the actual v19/engine18 source from commit `aa581c1804363b56f7f07a9c6930b9ed34f5c3c0`, before adding emigration. The setup decodes the existing genuine v6 newborn archive, sets initial family health to 100 and the initial NPC test seed to 1, then uses the old command resolver and real SQLite repository for acknowledgement, party booking, snapshot, actual monthly advance and result acknowledgement. The completed save is dated 2024-02-01, with the same three actual parent/spouse/newborn identities, accepted saved consent, package payment of 896,497 USD minor units, one recorded rainy sightseeing period and 353 ledger entries. The prior compressed checkpoint retains the paid active trip before any experienced month. It is a 31,624-byte exported archive. Current/historical migration checks compare the original encoded people, trip, ledger, earnings, RNG and annual cursor exactly; new relocation history starts empty. This JSON is retained unchanged rather than regenerated by newer engines.
