# Bounded first teenage relationships: implementation plan

Prepared against frozen `6f4b34c40005f5fba8eeee540bada9e0787ccbb0`
(World35 / engine36 / content11 / reader15). The current integration remains
immutable. The coordinator's next shared target is World36 / engine37 /
content12 / reader16; the coordinator owns the final version/migration union.
This plan contains no implementation or acceptance claim.

## Source requirement and invariant

The [specification's teenage stage](planning/source-specification.md#L263)
includes first relationships at13–17. Current
[romanceReason](../src/game/systems/relationships.ts#L82) and
[model validation](../src/game/model.ts#L218) require adults for existing
dating/engaged/married states. Those adult states and their age checks remain.
The new path is nonsexual and has no engagement, wedding, pregnancy, family
planning, housing, automatic job, tuition or qualification effect.

## Authored V1 rules

- A proposal concerns an existing known peer and the actual relation ID, not a
  generated person. Both must be13–17, below their actual residence country's
  adultAge, living and no more than24 actual calendar months apart by DOB.
  Integer age labels alone must not admit a gap approaching three years.
- Exclude close family through the existing four-generation kinship rule, parent,
  guardian, teacher and current supervisory/authority relations. Both actual
  gender/preferences must match. The target cannot be the actor.
- Both must be in their ordinary home country/city, physically together, outside
  custody, not wanted, not hospitalised, not travelling or away on assignment.
  No active romantic relationship with someone else is permitted. Existing
  friendship/classmate roles remain factual and are retained.
- Starting a first relationship requires at least50bond/40trust and4energy.
  This is an authored game rule, not a claim about national law. One proposal
  attempt is permitted per actual pair per calendar year, including refusal.
- The actual command draws once from `npcs`. V1 chance is
  `max(15,min(90,25+floor((bond+trust)/2)))`; initial eligible bounds make the
  practical minimum70. Persist the actual chance, roll, date, people, country/
  city, relation and reviewed eligibility snapshots. Browsing/review/cancellation
  never draws, spends time/energy or records an attempt.
- Acceptance starts one real `teen-dating` relationship and records a cost-free
  local first date. It consumes4energy. It grants no automatic happiness, bond,
  trust, money, qualifications or adult privileges. Refusal retains the existing
  ordinary relation/roles/bond/trust and has no energy or money charge. Both
  outcomes receive factual journal/result/history; refusal is not silently retried.
- This slice provides the initial consent/date and an explicit end command.
  Ongoing conversations/compliments/time together remain the existing meaningful
  interactions; no new compulsory repeated-date administration is added. A
  current pair cannot create another initial-consent row while still together.
- End works through a separate command without a physical-presence or minor-only
  restriction. It works while one person is18 and the other16–17, when apart or
  in custody; one party can end a relationship. It retains original consent and
  ordinary roles/history, ends the exact current record, and grants no reward or
  fabricated financial/stat penalty. Engine life/result/custody serialization
  continues to apply. Death closes the record at the actual death date.

## State, ageing and shared helpers

Add distinct `romance:'teen-dating'` and typed `teenRelationships[]` records.
Existing adult dating/engaged/married validation remains adult-only. A separate
validator requires a matching genuinely consented active teen record for the new
state, validates its original ages/DOB gap/snapshots/chance/roll/year guard, and
shares global romantic exclusivity. Old worlds gain only an empty new collection;
old relationships, pending/results, history, money and RNG are not reconstructed.

Record statuses distinguish declined, active, ended and continued-as-adults.
Endings retain date/reason/actor (or actual deceased person); decline has no
invented relationship ending. Retain proposed country/ruleVersion so later
relocation/rule changes do not rewrite the original eligibility facts. Validate
history chronologically, using indexed relationships/parents/active records and
an empty-history fast path; no full ledger scan or population cross-product.

Shared `activeRomance`/partner lookup recognises the distinct state for exclusivity,
ordinary relationship labels, grief and Best Friends ending. It does not turn
teen dating into adult marriage eligibility. Beginning a teen relationship closes
an existing Best Friends agreement through its existing romance-ending mechanism.
An adult cannot create a new teen record even if already linked to a teen.

When one person reaches adulthood, keep the actual ongoing nonsexual relationship
and its original consent; new teen proposals stay unavailable. The separate end
action remains available. When both are adults, the normal refresh marks the
teen phase continued-as-adults at the actual date and changes the existing
relationship to ordinary `dating`. It creates no new date, payment, bonus, consent
draw or backdated adult NPC courtship time. Existing adult date/proposal/wedding/
conception checks then apply normally. Do not force a birthday breakup or orphan
the relation. Refresh after dates advance, actual deaths and relevant commands.

## UI and ownership

New Person-profile card: current first-relationship status, factual consent/history,
one eligible first-date action/review and explicit ending. Review binds actual
life/actor/target/relation/location/current record; an unrelated revision does
not reset it. Recheck live eligibility before confirmation. Save before close,
retain the same draft and one inline live alert on failure, and guard immediate
duplicate submissions/cancellation. Display a pause reason during a mixed-age
transition rather than hiding the ending action. No Meet People dating generation
or existing adult romance card redesign is needed for this initial slice.

Owned additions: `src/game/systems/teenRelationshipSchemas.ts`,
`teenRelationships.ts`, `teenRelationshipValidation.ts`,
`src/ui/TeenRelationship.tsx`, focused domain/UI tests and a dedicated acceptance
document. Narrow shared hunks: relationship romance enum; `activeRomance`/labels;
model/createLife field+validation/index integration; engine command registration/
dispatch/refresh; Person card mount; custody allowlist permits only the new
ending action. Coordinate exact shared symbols with the rarity/admissions owners
and independent reviewer. No edits to their content/education modules, original
fixtures, main/integration, production tags or broad version-expectation tests.
Any temporary branch-only collection default is explicitly marked for replacement
by the coordinator's final36/37/12/16 migration.

## Focused meaningful verification

1. Actual first request accepted/refused, one saved NPC draw, fixed annual pair
   allowance, no preview grants/reroll, source-world immutability and exact cold
   pending/result/consent history. Use declared deterministic unit branches;
   do not label controlled setup as natural lifetime acceptance.
2. Age12/13/17/18 boundaries; exact24-month DOB boundary and over-boundary;
   mutual preferences, kinship/authority, self/unknown peer, other partner,
   bond/trust/energy, same place and real absence restrictions. Direct invalid
   commands leave complete world and RNG exact. Exercise country-rule guards
   without claiming verified national teen-dating laws.
3. One-active-person/pair invariants; forged roll/chance/date/year guard/record;
   no unbacked teen state or simultaneous adult/teen partner; historical records
   stay valid after later unrelated changes. No accepted record on a refused ask.
4. Actual mixed-age birthday continuation and independent ending; both-adult
   transition; actual death/Best Friends closure; adult ask-date/proposal/marry/
   conception remain rejected for minors and preserve legacy adult behavior.
5. Real on-disk SQLite/store/Person-card flow with held failed receipt: exact
   same review plus one error, busy duplicate/cancel guards, all eight raw tables
   rolled back, retry with zero full checkpoint unpack, exact saved result and
   consent cold, acknowledge once, no-op/browsing writes absent. Include actual
   life/person-context reset rather than resetting every revision.
6. Compatibility from an unchanged genuine archive: empty new field only, old
   identity/relationships/pending/results/RNG/money/history exact, no inferred
   teenage backstory. Root owns final complete-source tags/migration evidence.

Run only affected focused domain/UI checks and strict types in the coordinator's
serial slot. No full regression,120-seed/cohort/export/native or new acceptance
claims; root consolidates final gates. Freeze a local reviewable commit and logs
before reporting completion.
