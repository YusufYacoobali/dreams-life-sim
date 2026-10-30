# Baseline and integration contracts

Baseline: remote `v2` at `d8f3d99c31d2ef9fddacb9cf5ad0b9cc20172bd0`,
including the Actor/Model presentation fixes after the plan's `98a80438`.

Reviewed `HANDOFF.md`, `planning/writing-and-events.md`, `CULT_LEADER.md`,
the canonical legal, relationship, family, event, mini-game and persistence paths.

## Existing behavior retained

- Criminal incidents own their evidence and saved detection/trial draws. Arrests
  produce one linked case, and hearings own fines, remand credits and sentences.
- Street and prison affiliations share gang history; prison membership belongs to
  a specific sentence. Outside organised membership must survive a prison pointer.
- Exclusive romance remains on the existing relationship edge. Marriage, divorce,
  housing, custody and support remain in the family settlement machinery.
- Mini-games reserve a real action before accepting input, save their seed and
  transcript, and settle at most once. Escape extends this protocol.
- Pending decisions contain already-bound copy/effects; editorial changes apply
  only to future offers. Old pending choices do not become new rule versions.
- Commands copy and validate the world. Repository commits atomically persist the
  world, receipt and checkpoint; failed saves must leave no partial action.

## Capability contract

Keep both supported tuples: ordinary World 49 / engine 51 / content 28 and
enhanced creative World 50 / engine 52 / content 29. The prospective overhaul
uses a separate explicit `overhaulVersion: 1` capability, with prison lives,
affairs and romance offers. These fields are optional on legacy worlds and have
no decoder defaults: decoding old archives must not invent histories or consume
RNG. New lives start with empty collections. New overhaul commands explicitly
enable the capability on an existing life. Ordinary old commands and pending
choices remain compatible. SQLite reader 30 upgrades metadata only.

## Gameplay contracts

Organised careers extend gang records, use named people and bounded histories,
record proceeds in the ordinary ledger and enter the existing legal pipeline.
Two assignments and one major organisation decision are the annual target.
Outside assignments cannot run in custody, while prison affiliations remain
separate. Rank history survives imprisonment, release and succession.

Prison security follows offences, sentence length and conduct. New interactions
bind actual fellow inmates; family visits/support require real eligible people,
location, custody and affordability. Escape is a short abstract puzzle, with
saved inputs and one reserved attempt per year, followed by real legal effects.

Affairs use separate actual adult participants and knowledge records. A secret
cannot appear as a discovery without an established witness or confession.
Partner autonomy observes relationship history and cooldowns; a divorce request
does not end marriage or bypass its settlement. New situations share the normal
pending queue and keep quiet years possible.

## Verification contract

Use focused tests and the full regression, app/test strict types, import-cycle
checks, seeded lives, available soak checks and both production Hermes exports.
Record measured performance against the same age 50/70/90 workloads. Keep genuine
legacy fixtures unchanged. Record unavailable installed-device acceptance plainly.
The implementation and writing reports distinguish actual shipped behavior,
observed test evidence, and remaining limitations.
