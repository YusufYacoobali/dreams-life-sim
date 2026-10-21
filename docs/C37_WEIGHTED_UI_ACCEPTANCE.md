# Targeted UI acceptance with the weighted annual selector

This test-only correction starts from frozen C37
`a4be96ee1e60ab073fbbd2ae95d0ee2d0ee6f361`. It edits the three existing
story-consequence, adult-relationship and childhood UI suites, without changing
runtime, catalogues, fixtures, persistence or version tags.

The initial consolidated regression reached legitimate different scenes because
these tests still calculated a uniform array index for their second event draw.
The volcano case received the project promise, the adult friendship/partner
cases received the long voice note/alone-time scenes, and the homework case
received the break-time scene. Their targeted title/template assertions failed
before their save assertions. The original diagnostic remains in
`/tmp/dreams-production-gaps-accepted-regression.out`; this document does not
claim its still-coordinated full run passed or freeze an incomplete log.

These are explicitly arranged UI unit contexts from the existing `pupil` and
`adultSocial` fixture factories. Those factories already arrange age, stats and
relationships/employment; they are not imported natural birth-to-adult lives.
The corrected cases use one fixed events stream (state1, normal offer guard63)
and explicitly arrange the first weighted ticket of their target only when
that target is in the engine's real eligible pool. The real `weightedEvent`
function still runs and consumes its actual selection draw once. Ordinary UI
Age Up still advances months, checks eligibility and binds actual participants
and effects. No seed loop/search, replacement pending scene, new person,
qualification, money or engine outcome is introduced.

Each spy belongs to its test and is restored by `afterEach`, including failure.
A missing target or any later selector call delegates to the unchanged real
selector/draw. This setup tests the named scene's UI/save consequences; it does
not claim that scene was naturally selected, measure rarity or add lifetime
coverage. All four targeted choices and their original assertions remain.

The consequence-label case keeps both actual school participants, exact named
result rows, all-table rollback, whole-world retry equivalence, zero warm
checkpoint unpack, restored result and duplicate acknowledgement refusal. The
two adult cases retain named friend/partner binding, exact chosen effects,
all-table rollback, zero warm unpack, unchanged money/work/people and once-only
result/journal acknowledgement. The childhood case retains actual teacher,
grades, bond, thirteen attended school periods, failed write, saved result and
unchanged people/RNG after acknowledgement. Actual annual completion remains
asserted in all three suites.

These existing tests use the in-memory SQLite driver. Their reload checks create
fresh stores on that same open database. The adult and consequence-label cases
also create fresh repositories; the childhood case reuses its original
repository and cache. They are not new physical file/closed-connection cold
acceptance. Existing file-SQLite and immutable
archive gates remain separate. No existing raw fixture or historical hash was
changed.

Focused session71467 actually closed0: **4 tests /3 suites passed in16.129s**,
`/tmp/dreams-c37-weighted-ui-focused.out`, with durable exit0 in the matching
`.exit` file. Sequential affected strict TypeScript session51851 actually
closed0 with an empty `/tmp/dreams-c37-weighted-ui-types.out` and matching
`.exit=0`; configuration is `/tmp/dreams-c37-weighted-ui-tsconfig.json`. That
checks the three test dependency graphs, not a separate full application/all-test
gate. No new baseline rerun, full regression, cohort, build or native action
was performed for this correction. Root owns consolidated final acceptance.
