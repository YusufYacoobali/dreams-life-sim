# Bounded NPC dating separation: proposed first slice

Proposal only; no gameplay or schema changes are implemented by this commit.
The isolated base is `6f4b34c40005f5fba8eeee540bada9e0787ccbb0`.
The accepted C36 runtime remains unchanged. Root owns the future coordinated
World36 / engine37 / content12 / reader16 migration and integration.

## Existing requirement and actual gap

The [source specification](planning/source-specification.md#L864) requires NPCs
to remember relevant events and relationships to develop, deteriorate and end.
The [simulation plan](planning/simulation-and-persistence.md#L127) requires
bounded relevant-person autonomy, persistent identities and legible journal facts.

[NPC dating](../src/game/systems/npcRelationships.ts#L55) currently forms an
actual existing-person pair with two independent consent rolls. It does not end
that relationship. [Courtship](../src/game/systems/npcCourtships.ts#L60) observes
real elapsed dating time, then can arrange an actual consensual paid wedding.
Its [existing integration contract](NPC_FAMILY_DEVELOPMENT.md#L65) explicitly
requires any future separation to close the actual clock before a reunion.
The [player breakup command](../src/game/systems/relationships.ts#L188) acts as
the active player and applies player/target consequences; impersonating that
actor is inappropriate for autonomous NPC decisions.

New NPC contacts start at [35 bond and35 trust](../src/game/systems/relationships.ts#L71).
The annual [relationship drift](../src/game/systems/relationships.ts#L233) only
touches the player's own edges. A below35 gate would therefore exclude ordinary
new NPC pairs without another new simulation system. This proposal instead
defines an explicit early-courtship compatibility risk from actual low scores.
It does not claim that an unobserved deterioration occurred, and does not add
new NPC score drift or rewrite old scores.

## Proposed authored V1 rules

1. Consider only an actual open `npcCourtships` row with no marriage, linked to
   its same current relationship. That relationship must be exactly `dating`;
   engaged, married, teen-dating, ex and widowed pairs are excluded. No old
   memory or friendship date creates a courtship or separation record.
2. Both living people must be known through actual relationships with the
   current player, adults under the existing residence-country game rules,
   and each other's exclusive current partner. Neither may be the active
   player or that player's current partner. The shared `activeRomance` partner
   index must respect the approved teen state after coordinated integration.
3. Require at least12 actual calendar months since `observedSince`, using
   `monthFrom` plus day-aware date comparison. Require the same current home
   country/city and no active trip, service absence, hospital stay, custody,
   wanted status or health below25. Temporary absence simply postpones this
   check; it is not evidence of a breakup.
4. Exclude a shared non-null household, either person's living minor dependent,
   active custody arrangement or current pregnancy. Check no active marriage
   involving either person. This first slice leaves dependent-family and
   household decisions to their own future mechanics. Assets/accounts are
   individually owned in the current model; no new joint-title or settlement
   model is introduced.
5. A pair is at risk only when actual bond OR trust is below50. Freeze the V1
   chance as `min(25, max(5, floor((100 - min(bond, trust)) / 4)))` percent.
   Ordinary35/35 gives16%; both scores at least50 are excluded without a draw.
   This is an authored game balance rule, not a national-law or empirical claim.
6. Select candidates deterministically: sort genuine open courtship IDs, rotate
   by calendar year, inspect at most12 relevant pairs, and attempt the first
   eligible pair. Ineligible early entries cannot monopolise every year.
   Take exactly one `npcs` draw in1..100, with `roll <= chance` meaning separation.
   No random candidate selection, roll peek, retry-until-success or second draw.
7. At most one actual attempted pair across the world per calendar year,
   including a continued outcome. Save `npc-separation:YEAR = 1` only with the
   actual typed attempt. An empty/ineligible pass changes no world fields or
   RNG. Repeated calls after an attempt do nothing.

A separation does not require two people to consent to staying together. The
single draw represents whether the observed relationship ends. Copy states only
the resulting fact, such as “A and B stopped dating.” It does not invent an
initiator, betrayal, argument, mutual consent, new friendship or happiness loss.

## Record shape and chronological integration

Use a new typed root `npcSeparations[]` collection, rather than extending every
old courtship row or adding untyped memories. Each actual attempt stores:

- unique ID and literal `ruleVersion: 1`;
- the actual courtship ID, relationship ID and ordered person IDs;
- the observing player ID and then-current player-partner ID or null;
- actual attempt date, each person's then-current country and common city;
- actual pre-attempt bond/trust, frozen V1 chance, one roll, and outcome
  `continued` or `separated`.

The snapshot explains the decision after later moves, death, preferences changes
or legacy takeover; history is not validated against today's mutable location or
active player. Person/courtship/relationship identity links remain mandatory.

Insert one annual hook between existing `npcRelationshipsYear` and
`npcCourtshipsYear` in [finishYear](../src/game/engine.ts#L174). Newly formed
unobserved pairs have no courtship and cannot be selected. Newly observed pairs
also cannot meet the12-month wait. The separation check must precede the same
pass's wedding eligibility; it must not allow marriage first and reinterpret it
as a dating breakup afterward.

On `continued`, save only the attempt/counter and RNG progression; normal
courtship and wedding checks continue unchanged afterward. On `separated`:

- set that same relationship's romance to `ex` and remove only its partner role;
- retain actual ordinary roles, bond, trust, memories and last interaction year;
  retain the existing friend/coworker/classmate/teacher/acquaintance precedence,
  adding an acquaintance role only if no ordinary role remains;
- close the actual linked courtship immediately with `lastChecked` and `ended`
  both equal to the actual current date, `endReason: 'separated'`;
- retain `observedSince`, observed countries and every existing proposal,
  consent roll, quote, declined outcome and fee link exactly;
- add one named factual relationships journal entry, without replacing a
  pending event/result or manufacturing a player acknowledgement.

There are no balance/stat/qualification/fame rewards, fees, forced feelings,
marriage/divorce/pregnancy/custody/ownership/estate mutations or NPC generation.
Existing `ex` pairs are [excluded from new NPC formation](../src/game/systems/npcRelationships.ts#L57);
this slice does not add reunion. A future reunion must create a new observed
clock, never reopen the old24-month wedding credit.

## Validation and implementation boundaries

New `npcSeparationSchemas.ts`, `npcSeparations.ts` and
`npcSeparationValidation.ts` own the new authored rule and typed history.
Narrow shared edits are imports/one root collection and validation call in
`model.ts`, empty new-life collection in `createLife.ts`, and one import/hook in
`engine.ts`. Existing courtship and player command schemas stay byte-shaped as
before. No new UI route is required: the actual relationship label and factual
journal expose the changed world through existing player-facing screens.

Build relation/partner/known/dependent/marriage/pregnancy indexes in linear passes.
The runtime does not search all people pairs or scan complete histories for each
candidate. Validation has an empty-history fast path and shared maps grouped by
courtship/relationship; it does not rescan ledgers or every prior attempt for
every record.

Validation binds IDs, snapshot date/adult countries, actual known relationships
already established by that date, chronology and12-month wait, V1 low-score
eligibility/chance/roll/outcome, unique attempt year/counter and clock bounds.
A separated outcome must reciprocally link exactly one actual courtship ending
on its date with reason separated and no marriage. No later attempt may reuse
that ended clock. A continued record can precede a later wedding/separation or
death and must remain valid. Do not reject honest old records because today's
player, preferences, location, roles or living state changed.

Root's union migration adds only an empty array to old World35 worlds and
requires the field in final World36. Do not reconstruct old separations from
memories or retrofit records onto legacy courtships. Do not eagerly rewrite
existing raw current/backup/history payloads or old producer metadata. No broad
tag-expectation churn, fixture regeneration, new native or120-seed claim.

## Focused evidence plan after proposal approval

- Declared controlled cases: actual12-month/day/leap boundary, both outcomes,
  exact one draw, repeated-call/global-year guard, bounded rotating13+ window,
  high-score/ineligible no-draw and no generated identities.
- Negative guards: player/current partner, under18/teen/mixed18/17, engaged or
  married, missing/closed/unobserved courtship, absent/locality restrictions,
  same household, dependent/custody/pregnancy; no free financial or stat changes.
- Malformed-history traps: wrong identity/courtship/year/date/counter, invented
  earlier observation, changed rule/chance/roll/outcome and separated-clock
  contradictions. Positive later-location/preferences/legacy/death history.
- A bounded normal `resolveCommand` annual journey from an explicitly declared
  adult unit setup proves the real finishYear hook, actual separation before
  wedding, no same-year rematching, preserved ordinary roles and exact old
  proposals. Keep actual continued and wedding outcomes, with no RNG overrides
  after setup, seed searching or forced marriage/breakup.
- Real file SQLite held-receipt failure for the actual annual command: all8
  tables/world/RNG exact on rollback; same command retry, zero full warm unpack,
  exact typed result/clock after production checkpoint cold reopen; preserve
  original backups and historical payloads. No new modal to test in this slice.
- Genuine existing old checkpoint/bound-result compatibility asserts the new
  empty field only, while preserving exact old producer bytes, pending text,
  selected outcome, history, financial facts and RNG. Root owns final strict
  future-schema migration proof with the other approved new arrays.
- Focused game/persistence cases, affected NPC relationships/courtship/family
  suites and strict app/all-test types only, in the coordinated serial queue.
  Root owns full regression, lifetime/export/native/performance acceptance.
