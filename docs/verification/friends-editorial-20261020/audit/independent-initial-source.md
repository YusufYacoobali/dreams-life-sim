# C36 save/gameplay integration audit

**No actionable source blocker found** in the reviewed C35→C36 integration.
This is an independent read-only review, not a new simulation/test/native run or
complete release certification. Audit checkout is clean
`/workspace/dreams-worktrees/c36-compatibility-audit`, commit
`1a90884119b2c4f8989d13f044f8e69101169b11`, branch
`agent/c36-compatibility-audit`. The pending CharacterPortrait change is excluded.

Read HANDOFF first, then PROGRESS/OPENING_PLAN. Reviewed every changed runtime
file against C35 `e938dbe7` (20 files), existing store/codec/validation interfaces,
new focused assertions, actual annual/focused outputs and their diagnostic.
No root integration/main files changed, and no native tool, test runner,
engine import, simulation, dependency install or fixture generation was used.

## Source identity and compatibility

Independently recomputed source hashes match both the original195 capture and
annual start/end records:

- game: `24a5a40521b31fa94eca4c4d161bbbd74e24c460a08bc675afcd340e392e7ba5`
- game+persistence: `34cc89201f1da71c8c118c09a78025c94161e69afae15ed5354cd413fdeca7e1`
- unchanged annual driver: `b57b6bb3befdba4e776217b3ebf79c1fe4892f2cd7a260fa9b7e928bca75e20e`

World35/engine36/content11/reader15 are coherent. `model.ts:556` adds only empty
bestFriendships to prior34/35 worlds; stored text/history are not rebound.
`repository.ts:38` upgrades reader13/14 inside a marker-only transaction and
rejects future readers. Its old payload/cache/CAS/backup/receipt commit path and
production checkpoint codec remain unchanged. The store still yields before
work and publishes the new world only after repository success
(`gameStore.ts:33,103`). No state, lockfile, dependency, app identity or signing
change is present in this integration.

New optional relationshipLabels are absent on old choices, bounded, unique and
linked to actual effects (`runtime.ts:32`). Binding uses only actual scene
contacts; choose changes the display label only (`events.ts:308`,
`engine.ts:205,260,304`), adding no RNG or mechanical effect. Six captured old
bound worlds and their actual selected results retain complete raw/checksum and
whole-world proofs. Test normalization requires bestFriendships exactly empty,
removes only that field and restores only34/35/10 before the original canonical
SHA comparison; no historical proof was refreshed to the new source.

Health changes retain the first diagnosed date through repeat/NPC care; future
emergencies show observable symptoms and only already-known diagnoses
(`health.ts:100,212,229`). Existing bound emergency copy and quotes are not
rewritten. The new tests retain actual v8 pending text/cost/history, ordinary
repeat care and matched known/unknown RNG/mechanics checks.

BestFriends commands keep life/actor/pair/place identity, one committed NPC
consent draw and pair/year/mutual-current guards, with no money/stat/trust/role
grant. Death and dating close the original agreement; validation guards false
romance endings and conflicting history. Empty histories return immediately;
mutable command copies never reuse the frozen-world cache. The local review
retains unchanged context and has synchronous submission/cancel guards. These
were reviewed together with the preserved global pending/result/store path.

FamilyTree adds only actual dead spouses from death-ended marriage records;
biography uses actual retained actor-specific decisions/jobs/accomplishments.
Both are read-only. Statistics removes a duplicate bottom inset inside the
existing bottom-navigation layout; SavedLives changes only the person's
Continue accessibility label. Neither introduces new save work.

## Actual raw verification

The annual output contains exactly122 valid JSON lines: one start,120 completed
lives with unique consecutive seeds0–119, then one successful completion. All
versions are35/36/11; all120 world hashes are distinct. The recorded32,037
commands, per-life completion ordinals, country counts, age bounds, maximum
people/ledger and monotonic timing are internally consistent. All12 countries
are present (FR/IN6 each; not equal per-country sampling). Ages40–98, maximum27
people/65,779 ledger rows; recorded sweep elapsed651.254s. Stderr is empty.
The tool itself asserts actual death, cause/death journal, no pending/year and
full world validation, plus unchanged game/tool bytes before completion.

This is **pure-engine first-eligible-choice** evidence. The driver sets newborn
acknowledgement before progression. It does not save through SQLite, cold-replay
checkpoints, prove a native life, cover every choice or invoke optional
BestFriends/career actions. It must not be labelled120 new seeds on top of the
existing repeated0–119 policy,120 SQLite lifetimes or all-template acceptance.

Final focused log: **66 tests /13 suites PASS,68.762s**, with explicit
`--testTimeout=30000` and the actual existing
`model-career-acceptance-flow.test.tsx`. It includes the integrated friendship,
old-world migration, story collision, medical context, editorial helper,
late-spouse/biography and genuine career acceptance paths.

Initial log remains **failed**:2 suites failed/11 passed;1 test failed/64 passed,
72.324s. The actor case exceeded the CLI's omitted/default5,000ms timeout, and
the invocation named nonexistent `model-career-exit-flow.test.tsx`. The final
command corrected those two invocation issues; no assertion was weakened.
The repository CI command already specifies30,000ms (workflow line35); a test
may deliberately specify its own longer timeout, e.g. the connected Model case.
These are overlapping runs, not131 separate tests. Logs independently show the
completion footers; session exit0 is coordinator-attested, not re-created here.

## Bounded remaining acceptance/actions

1. Capture the final complete source after the approved portrait patch, then use
   that identity for the coordinator's full regression/types/exports/native and
   timing gates. The existing606-file initial snapshot is195e77a, **not** exact
   final1a: two reviewed UI files and two maintained test files differ; the new
   Model test/docs and personal-screen doc were added later. Game/persistence
   hashes are unchanged, so the120 evidence remains applicable to this game.
2. Preserve the frozen C35 editorial driver's source registration. Its rejection
   of C36, even for manifest-only, is intentional and tested. Reproduction needs
   the historical C35 checkout; do not retarget its pins or relabel old data.
3. A bounded normal-command friendship-grinding/confirmation/cold continuation
   remains useful acceptance for the new optional path. The current27 focused
   checks include deliberately arranged eligibility/consent and actual SQLite
   rollback/retry/cold/result/ack; the120 annual policy exercises its empty-history
   path and does not replace that natural/interactive acceptance. This is an
   evidence gap, not a demonstrated mechanics defect or a new scope expansion.
4. On publishing this checkpoint, update current HANDOFF/PROGRESS/OPENING_PLAN
   from their still-current C35 text using actual C36 gate outcomes and retain
   their old historical sections. No C36 whole-regression/native/physical pass
   is inferred from prior C35 numbers or from this audit.

The user-parked import/export/sharing and additional file/history breadth stay
parked. No completion percentage, all750-branch coverage, physical performance,
iOS/standalone release, or unobserved result is credited here.

Machine-readable assertions, source comparison and all raw SHA256/byte counts:
`/tmp/dreams-c36-compatibility-evidence.json`. Reusable read-only parser:
`/tmp/dreams-c36-compatibility-audit.cjs`; it reads files only and imports no game.
