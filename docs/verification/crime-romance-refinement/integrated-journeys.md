# Independent integrated gameplay review

The three additional persistence files contain **31 cases**. The combined run
passed all 29 cases then present; the expanded vehicle follow-up passed all
seven vehicle cases, covering 31 distinct passing cases between the two runs.
There are no failures or skipped cases in these completed results.
`integration.json` and `integration-vehicle-followup.json` preserve the case
names, results, commands and log digests. The first reporter detected one
concurrently edited unrelated mission test; no runtime source or integration
test changed during that run. The seven-case follow-up had no changed sources.
The final full regression supplies stable whole-repository coverage.

`seeded-journeys.json` retains the five actual journey traces. They start from
the published employed-graduate save with declared adult relationship/experience
contexts and fixed initial outcome seeds. After that setup, commands alone
advance dates, draw outcomes, earn or lose money and change relationships. Every
command is committed to real on-disk WAL SQLite, the connection is closed, and
the world is loaded through a new connection. The first assignment and affair
also survive injected receipt-write failure, exact retry and duplicate receipt.

| Journey | Actual progression | Distinct consequences |
| --- | --- | --- |
| Street Syndicate, seed 42 | 66 commands; assignments in 2023, 2028 and 2033 | Two convictions interrupt the career; a later assignment leaves exposure and another actual pending case. The same named crew and rival survive the intervening custody. |
| Fraud Network, seed 314159 | 46 commands; assignments in 2023, 2024 and 2027 | Actual victims lose matching money; a conviction interrupts assignments, and later profitable schemes produce victim complaints and actual pending cases. |
| Smuggling Ring, seed 271828 | 31 commands; assignments in 2023, 2024 and 2025 | A participating named associate betrays the crew; two contraband cases reach actual acquittals. The original rivals and participation memories remain recorded. |
| Happy couple, seed 421 | 14 commands over three actual years | Ordinary dates preserve the relationship. There are no affairs, random breakups or divorce requests. This seed receives no authored romance offer during the window. |
| Affair and former partner, seed 0 | 23 commands over two actual years | A real secret affair is confessed; the partner ends the dating relationship. Subsequent conversations and apologies lead to an accepted reconciliation. The original affair, discovery and breakup memories remain. |

The original ten-calendar-year street scenario budget was too short to include
three assignment years after its genuine prison terms. The test now allows up
to twenty calendar years; it keeps the original seed and real sentences. This
is a test budget, not a gameplay timer or a change made to force criminal
success. That journey demonstrates the cost of repeated serious convictions,
alongside the other lives' different legal and social outcomes.

The other seven new persistence cases exercise genuine vehicle theft. The named
victim first buys the car using the normal purchase command and actual funds.
The theft transfers that same asset ID, records its incident and original title,
and creates no purchase or cash reward for the thief. Caught and uncaught
outcomes roll back atomically and survive actual connection reopening. A return
on one Time Machine branch restores the recorded owner's original title while
the other branch still holds the unsaleable stolen vehicle. Death seizes held
stolen property before estate liquidation, and the rightful owner can sell a
returned car while retaining its theft history. Explicit victims without a
recorded vehicle and repeated attempts against a recovered car are rejected
without changing inventory, accounts, histories or the original input world.

These deliberate criminal and romantic journeys complement the ordinary
120-life soak. They do not establish a distribution of long-term balance from
five seeds or replace touch/accessibility review on an installed device.
