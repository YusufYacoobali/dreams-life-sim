# Busy-year optional scene pacing

Proposal based on `ace1e38e12ae2493501a30e6f003201e0fd6ab41`, isolated from
accepted C37 and the frozen C38 integration. No runtime or test edits accompany
this proposal. Root owns the later World38 / engine39 / content13 / reader18
union; this branch will not bump global tags or rewrite existing fixtures.

## Concrete gap

[Writing and events](planning/writing-and-events.md:47) says a year already
carrying important decisions receives fewer optional events. The
[source specification](planning/source-specification.md:188) calls for
intelligent pacing. The read-only country/balance audit at
`/tmp/dreams-country-balance-next-audit.md` found that
[finishYear](../src/game/engine.ts:195) still uses the same 78% optional offer
chance regardless of earlier urgent choices and due consequences. Rarity changes
which scene is selected; it does not make that chance depend on a busy year.

Existing saved data cannot fully reconstruct that workload. The
[annual frame](../src/game/systems/estateSchemas.ts:4) records dates, month cursor,
stage and planning pause. Journal choice facts retain an event ID but do not
uniformly retain its original template/classification. Health/legal/story
records describe different subsets and are not a complete actual prompt log.
Do not infer a historical count from IDs, present conditions or today's state.

## Bounded proposed rules

Only **new** annual frames opt into optional `annual.pacing` metadata:
`{ruleVersion:1, decisions:[{eventId,templateId,personId,date,journalIndex}]}`. Retain at most
the first three important decisions actually resolved in that frame; its length
is the bounded factual workload counter. No new world collection, journal entry,
financial payment, reward, stat or achievement is created by recording it.

The frozen V1 important-template list is medical emergency, arrest, court
hearing, public controversy, brand offer, property-sale offer, the arcade
invitation callback, the project deadline callback and its two-year recall.
These are actual scheduled choices. Manual introductions, job interviews,
ordinary activity results and acknowledgements do not inflate the count.

Capture the actual monthly frame when `choose` begins, then record once after
its successful effects and existing choice journal are written. Retain that
frame reference if an effect archives it for a death; the normal critical-health
death check also follows this observation. A rejected/failed-save command
publishes neither count nor effects. Link each observation to the existing exact
`eventId + '_choice'` journal fact, its actual array position, participant and
date. Validate uniqueness, known V1 templates, chronological dates within the
frame and actual journal identity with at most three direct journal lookups.
The journal is append-only; no new scan/index of all history is required for an
unrelated button. A queued-but-unanswered, cancelled or
expired prompt is not a resolved decision; moving between pending/deferred/result
states and cold reopening does not add another observation.

Authored V1 optional offer chances:

| Important resolved choices | Optional scene chance |
| --- | ---: |
| 0 | 78% |
| 1 | 50% |
| 2 | 25% |
| 3 or more | 10% |

These are explicit game tuning choices, not measured balance or the planning
document's illustrative 45/40/15 distribution. Keep one optional scene maximum;
do not add a simultaneous two-event-year mechanic. The first birthday remains
guaranteed, using exactly the existing uniform introductory selection.

An absent `pacing` field means **legacy 78%** for the entire interrupted frame,
even if new commands resolve an old pending choice. Never default/backfill that
field on load. A new frame explicitly creates an empty observation list.
`legacyAnnual` uses the same optional schema: archive/child continuation retain
the actual frame observations without inventing a new count or reconstructing
old ones. The count belongs to that simulated frame, including a genuine legacy
continuation, rather than retrospectively estimating a new person's workload.

## Random streams and mandatory content

Use the same one saved events-stream offer roll as the old 78% path. Whenever
the original 78% check and eligible-pool conditions would select a candidate,
consume exactly the original uniform/weighted selection draw, even if the lower
busy-year threshold then suppresses displaying that candidate. Binding is pure;
do not bind/store an unused event or add it to eventHistory. This preserves the
existing events-stream draw schedule, including suppressed cases, without any
preview draw, reroll, private outcome search or new stream. Quiet and legacy
frames retain their previous selection behavior.

No changes to monthly health/legal/family/school/callback generation, queue
priority, due periods, choice effects, NPC/outcomes/economy streams, rarity
weights, eligibility or cooldowns. Already-bound decisions/results remain exact.
The ordinary quiet-year summary remains factual and is still acknowledged.

## Implementation and focused evidence

Own only a small typed pacing helper/schema/validator, the optional annual-frame
field, narrow new-frame/choose/finishYear hooks, a bounded validation call, new
focused domain/save tests and dedicated documentation.
Coordinate engine/model/schema hunks with root; Story owns independent ordinary
interview experience code. No global tags, old producer fixtures, main/source
freeze, native tools, full regression, annual cohort or performance measurement.

Tests should cover all thresholds/cap and read-only previews; actual resolved
urgent and due callback choices; no count from results/acknowledgements/manual
interviews/unanswered prompts; rejected command and duplicate protection;
first-birthday uniformity; the exact old event draw schedule for suppressed and
offered candidates; legacy absent-field/old-bound-result preservation; and
normal interruption/continue/finish behavior. Use explicitly declared unit
contexts or genuine existing archive contexts with honest labels, then ordinary
commands; never search alternative seeds to force a desired outcome.

File SQLite acceptance should hold the actual command receipt, observe all eight
unchanged tables from a second connection, force rollback, retry the identical
command with zero full unpack, preserve exact old raw backups/history, cold-open
the same observation/result and acknowledge once. Root owns broader consolidated
and release acceptance. Final runtime needs independent Work review and actual
focused/strict closures before integration.
