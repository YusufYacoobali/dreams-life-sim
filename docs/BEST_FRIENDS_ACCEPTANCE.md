# Best friends: bounded consent and durable history

The explicit Best Friends capability in `docs/planning/source-specification.md`
§5.5 is implemented as a separate agreement attached to actual people and their
existing friendship. The 250-template catalogue is unchanged. This next batch
uses World 35 / engine 36 / content 11 / database reader 15; content 11 is the parent
coordinator's shared future-content bump, also reserved for the separate health
wording and collision-label streams. Those other streams are not implemented by
this branch.

## Rules and retained context

The Person Profile offers a review for an existing non-family, non-romantic
friend with at least 75 bond and 60 trust. Both people must be living, in the same
city and country, and outside custody, wanted status, hospital, travel and
away-service restrictions. From age 6, minors may ask only another minor within
two years of their own age. Ordinary friendships still grow through the existing
relationship actions; opening this review does not increase a bond or save.

Each person has at most one current agreement. A proposal cannot replace either
person's agreement, and each pair can ask once per calendar year. The committed
proposal consumes exactly one existing NPC RNG draw. Immutable rule V1 records
the actual pair, relationship, proposal date/place, bond/trust, chance and roll:
`min(95, 20 + floor((bond + trust) / 2))`. No additional decision roll, stats,
trust, money, role, job, romance or NPC-generated relationship is granted.
Refusal preserves the ordinary friendship; the UI reports best friends only
when both agreed. Explicit ending, actual death and a new romance preserve the
original consent row and record the ending date/reason/person. These rules do
not replace existing adult dating, grief, inheritance, family or custody rules.

The review binds the actual life, actor, target, relation, both residences and
agreement history. Unrelated revision/stat changes retain it; eligibility is
rechecked at confirmation. Immediate submission and cancellation guards keep
one command in flight. Failure keeps the reviewed command and old world; a
retry uses the unchanged saved RNG. History is read-only, initially shows six
actual records and can reveal earlier records without dispatch. Frozen worlds
reuse an immutable-array index; mutable command copies do not cache stale
agreement maps. Old worlds with no agreements take an empty-history fast path.

## Migration evidence

Only `bestFriendships:[]` is added to an old World 34 save. The previous saved
people, RNG, accounts, story bindings, pending results, journal and school exits
are preserved. Reader 13/14 upgrades only the metadata marker to 15; no table,
payload or moment is eagerly rewritten. Future reader 16 is refused. A failed
marker transaction rolls back before retry.

`tests/fixtures/v34-natural-editorial-us-checkpoint.json` copies the actual
completed C35 US 900 terminal checkpoint unchanged: frozen producer
`73cedc7643fa3cbcd0ad32dfa27abfb59dac8aaa`, 225 ordinary post-birth commands,
revision 226, naturally died aged 49. Its original raw checksum is
`afbd3a1a85bc05cbc046917fd61195545fa9e0704bd2aced19c0be1981809901`.
Removing **only** the new empty agreement array and restoring 34/35/10 recovers
original canonical SHA256
`03cced796c1fb4a0b1f24e63ef0b3cd1673b5fec0412b4dcd4ca8b6b667a92fd`.
It is a reused seed with SQLite birth/acknowledgement and subsequent pure-engine
commands, not a native or full SQLite life. Old v30 native and v33 AU canonical
proofs remain distinct; their raw fixtures and original checksums are unchanged.
Current-tag assertions are updated deliberately, never original producer tags.

## Verification scope

Focused new checks cover acceptance/refusal, one NPC draw, no unrelated grants,
pair/year and mutual-current guards, family/minor/context restrictions, stale
life/actor/relation/place rejection, exact ending/death history, actual adult
date equivalence, contradictory-save refusal and immutable index reuse. Chosen
consent responses and eligibility thresholds are explicitly arranged unit/UI
fixtures; they are not natural consent-rate or friendship-grinding observations.

The UI test uses an actual temporary on-disk SQLite database, production
repository/store and fresh connection. It checks read-only review/cancel,
held-save duplicate/cancel guards, receipts-trigger rollback, unchanged world
and RNG, retained single accessible error, same-command retry, warm zero full
checkpoint unpack, exact cold result and acknowledgement, explicit ending, old
inactive life/moment byte preservation, same-context review retention and
actual selected-life/person context dismissal. Separate reader 13/14 tests deny
all row writes and prove only metadata changes. Existing genuine native hiring
and hourly outcomes plus the large AU checkpoint remain compatibility checks.

Initial new-test run: 24 passed and 1 UI query failure because an underlying
ActionRow and its Modal button share a name. The query was scoped to the actual
Modal; no production behavior or assertion was weakened. Corrected UI-only run:
2 tests /1 suite passed (3.005s). Initial full application and all-test strict
TypeScript checks passed. Final-source focused checks passed: 27 tests / 3 suites (16.071s).
Compatibility checks passed: 177 tests / 9 suites (57.443s), including actual
adult dating equivalence, genuine v30 native and v33 AU canonical proofs,
interviews, hourly work, bound old hiring and reader rollback/cold/acknowledgement.
Final application and all-test strict TypeScript validation also passed
(`npm run typecheck`, exit0). Full regression, performance samples, natural grinding, native pixels,
TalkBack, physical devices and store/standalone release acceptance remain with
the coordinator; no such acceptance is claimed by this branch.
