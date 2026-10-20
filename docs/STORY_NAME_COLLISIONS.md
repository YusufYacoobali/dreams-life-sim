# Distinguishing real people who share a name

The frozen C35 editorial cohort exposed three real early-story ambiguities. The
people, roles and effects were correct; the displayed names were indistinguishable:

| Existing observation | Actual people | Ambiguity |
| --- | --- | --- |
| IN seed909, `result.json#/decisions/8`, age10 | Rohan Khan, classmate; Rohan Mehta, teacher | Both appeared as Rohan. |
| GB seed902, `result.json#/decisions/12`, age14 | Amelia Morgan, teacher; Amelia Takahashi, parent | Both appeared as Amelia. |
| IT seed907, `result.json#/decisions/9` and `/10`, age14/15 | `person_npc_15_6`, classmate; `person_npc_29_11`, teacher | Both have the real full name Leonardo Ferrari. |

For new bindings only, matching displayed names belonging to different bound
person IDs now receive their full name and actual scene role, for example
`Leonardo Ferrari (classmate)` and `Leonardo Ferrari (teacher)`. Only contacts
actually bound by the template participate. A matching teacher who is absent
from the scene does not alter a classmate-only story. One person occupying more
than one valid role does not collide with themself. Unambiguous copy stays exact.

When full names also match, affected new choices save a small optional
`relationshipLabels` list. Its entries identify the existing relationship effect
by ID; strict validation rejects empty/oversized lists, duplicate or unrelated
effect IDs, and unbounded strings. These labels affect result presentation only.
The existing effect arrays, targets, deltas, caps, availability and RNG are exact.
Old choices have no new default field: their loaded text, journal and resolved
results remain exact. No existing pending/queued scene or history is rebound.
Names containing dollar signs, quotes or token-like text remain literal.

The new fixture contains six exact original decision checkpoints from
`/tmp/dreams-opening-next-editorial-20261020`: IN7/8, GB10/12 and IT9/10. Before
editing runtime, a bounded extraction replayed only each original committed
command prefix from its original acknowledged-birth checkpoint. Every extracted
decision and selected result matched the original recorded cold canonical-world
SHA, and the complete game/persistence/state/lock/store/birth-driver pins matched
before and after extraction. The fixture records those pins, raw input file
hashes, JSON pointers, prefix counts, checkpoint hashes and exact old result
checkpoints. It creates no new life, seed, selected policy branch or override.
The extraction log is `/tmp/dreams-story-name-collision-capture.out`; its producer
is `/tmp/capture-dreams-story-collisions.cjs`. Existing fixtures are unchanged.

Targeted data cases compare all original chosen worlds exactly, both genuine
first-name collisions, the identical-full-name case, two unchanged scenes,
all three project branches' complete gameplay state, persisted display metadata,
literal/same-identity lexical boundaries, and invalid label associations. The
new-binding comparison intentionally binds fresh text against the recorded
context in a test copy; production never rebinds that old saved decision.

One connected component case uses the actual Pending Event UI and a file-backed
SQLite database. A newly bound copy of the genuine Italian scene selects the
existing third branch, checking both distinct relationship labels. Receipt
failure retains the exact reviewed scene, single error, full world and all eight
tables; retry performs zero warm checkpoint unpack. A genuinely closed/reopened
connection resumes the exact saved result and role labels, followed by one
acknowledgement and an unchanged duplicate refusal. This is explicit archived
context/new-binding component evidence, not a second natural cohort or a native
device claim. No stats, cash, names, age/date, RNG, context or effects are edited.

The primary agent owns the consolidated future engine/reader/content tags and
full integration gates. This isolated branch changes no version file, migration,
economy, policy, new story count, main checkout or frozen integration branch.
Fourteen tests / three focused suites pass in 29.470 seconds, including the
existing named-consequence domain suite. Both strict application and all-test
TypeScript checks pass. Each process ran sequentially and closed with exit 0;
logs are `/tmp/dreams-story-name-collisions-focused.out` and
`/tmp/dreams-story-name-collisions-types.out`. Diff whitespace and unchanged
state/persistence/systems/UI/dependency checks pass. No broad regression, export,
native run or whole-country cohort was run for this slice.
