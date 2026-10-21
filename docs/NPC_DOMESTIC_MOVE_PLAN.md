# Proposal: one independent retirement move

Proposal only, based on integrated source
`101925f1dbb4fa8f8efb8dd948ce79a33de624c2`. No runtime, migration, tag,
fixture, native or test changes accompany this document. The C37 acceptance
source remains frozen.

## What is actually missing

The [source specification](planning/source-specification.md#L864) explicitly
requires relevant NPCs to move, as well as form relationships, become ill and
die. The [simulation plan](planning/simulation-and-persistence.md#L127) calls for
bounded persistent-person autonomy and factual journal updates. The earlier
[gap audit](PRODUCTION_GAP_AUDIT_C36.md#L123) correctly distinguishes independent
relocation from movement already present in family and player-led mechanics.

Current residence changes are real but have other triggers:

- [Marriage](../src/game/systems/relationships.ts#L93) combines the actual
  spouses' households and places them at the selected existing home.
- [Child placement/custody/care](../src/game/systems/family.ts#L77) moves actual
  dependents to their actual caregiver, retaining those identities.
- [Property move-in](../src/game/systems/assets.ts#L157),
  [moving in with a parent](../src/game/systems/relationships.ts#L141) and
  [emigration](../src/game/systems/relocation.ts#L138) are player commands;
  existing household companions can move with them.
- [Leaving the family household](../src/game/systems/npcBudget.ts#L85) creates
  an independent household at the authored adulthood boundary, without
  changing the person's city. [Annual NPC decisions](../src/game/systems/npcBudget.ts#L59)
  search for employment; they do not choose a new residence.

There is no independent NPC decision to move their own residence to another
city. This is missing gameplay, rather than only an unrun acceptance check.

## Smallest coherent slice

An **established retiree living independently** can choose a single permanent
move to another supported city in the same country. A retired known parent or
friend moving away changes actual local availability. This first slice avoids
inventing a job transfer, silently quitting a job/course, moving a family or
settling jointly held interests. It does not promise better wages, cheaper
housing or a new friend in the destination; those city-specific advantages are
not modelled today.

### Eligibility and bounded choice

- Actual living NPC directly known to the player, initially in the player's
  country/city; exclude the player, their partner and every active romantic
  relationship, including the approved teen state.
- At least the existing residence-country retirement age; no employment or
  training. The actual earned pension is positive, with at least12 **recorded
  paid pension periods** and a real receipt in the current month. Do not infer
  attendance/pay from an old birth date or migrated lifetime counter alone.
- `lastEconomicMonth` must equal the current month. Current income, necessary
  bills and annual tax must already have been processed. Do not settle skipped
  decades or advance pension pay while checking candidates or rendering.
  Unobserved contacts without a current settled budget simply defer this slice.
- The existing household has exactly one living member: this person. Its
  `homeAssetId` is null; the person owns no physical assets or active business
  and has no active pet, minor dependent, custody arrangement or pregnancy.
  Deceased household members stay exact; no living companion moves.
- No outstanding owned liability, direct creditor/payer/employer obligation,
  local business/service/royal/studio/campaign/recording commitment, active
  course/recovery/admission/scholarship or live care obligation. Preserve all
  completed work, qualifications, pensions, financial accounts and historical
  commitments. Do not manufacture a resignation, withdrawal, gift or clearance.
- Exclude wanted, detained, imprisoned, hospitalised, low-health (<35), active
  trip/assignment and unresolved court cases. A participant in an already-bound
  pending/deferred decision is not moved out from under that saved context.
- Require an origin in the existing country city catalogue. Sort known eligible
  contact IDs, rotate by calendar year and inspect at most12 relevant contacts.
  Select the first fully eligible and funded person. No population generation
  or private-outcome search; no changed world/RNG for an empty pass.
- At most one actual opportunity across the world per calendar year. Authored
  V1 chance20%, exactly one `npcs` draw; record `stayed` or `moved`, consuming
  that yearly opportunity either way. A stayed actor can reconsider in a later
  actual year. At most one successful move per person in this first slice.
  Pick the destination deterministically from the other existing cities, using
  the saved year and catalogue order; no second random draw.

The exact threshold/chance are authored balance choices, not empirical claims
or verified retirement/tenancy law. All twelve current country packs retain
their existing supported cities, currencies and retirement ages.

### Actual payment, household and consequences

Use one local-currency moving charge, `roundRatio(baseWage, 50n)`: this matches
the existing [one-adult domestic transport scale](../src/game/systems/travel.ts#L39).
Require available cash after that charge to retain three months of the actual
solo [household living cost](../src/game/systems/households.ts#L23). The reserve
is a budget check, not another expense, transfer, refundable deposit or gift.
Charge only a successful move, once, from the mover's own available account;
never borrow, unlock held money or charge the active player.

Retain the same independent household ID and exact membership: household
records have no separate street/city field, and the sole living resident's
`city` is their modelled residence. No lease/property is created. With no owned
home, the existing standard housing/living cost continues next month. The
country, nationality, account currencies, pension contract/receipts, qualifications
and all old earnings remain exact. No currency exchange or special tax reset is
needed for a domestic move. No pension period, income, service month or progress
is awarded by moving.

The real city change affects local spend-time and future story eligibility
through existing presence guards. Any later player-controlled work/course choice
uses the real new residence; this move itself offers neither. Ordinary
relationships/Best Friends/family links persist; distance does
not create a breakup or erase friendship. The normal post-command
[refresh phase](../src/game/engine.ts#L387) handles location-bound future plans
with their existing recorded cancellation/fallback behavior, without rewriting
old bound scenes or results. Add one factual named journal entry for this known
person, including the actual cities and moving payment. No private motive,
improved mood, new employment or new acquaintance is invented.

Place the future annual hook after current financial settlement and before
annual dating/courtship selection, so the same year's new scenes use the actual
new location. Current employed/studying NPCs remain excluded: their independent
relocation requires a real job/course continuity or accepted replacement offer
and is still a separate future mechanic.

## Can existing relocation history safely represent this?

**Not unchanged.** Existing [relocation records](../src/game/systems/relocationSchemas.ts#L18)
mean a player-reviewed foreign application: a destination ID, application fee,
expiry, route/offer, party approval, tax/FX quote and employment settlement.
[Validation explicitly refuses the same country](../src/game/systems/relocationValidation.ts#L16),
requires its fee receipt and binds ended old employment. The Emigrate route and
pet-move validation also consume that exact shape. A domestic move cannot be
saved there by inventing an application/fee/expiry or silently relaxing those
old invariants. Many supported domestic cities are not travel destination IDs.

Prefer one separate typed `npcMoves[]` collection in a **later coordinated
runtime version**, without changing any current tags or old relocation rows.
Minimal V1 attempt: person/observer/known-relation IDs; actual date/country/cities;
historical household/member snapshot; already-paid pension receipt reference
and settled-through month; currency, actual available cash, moving charge and
retained reserve; one chance/roll/outcome; actual payment ID only when moved.
The frozen country/city/cost rule version binds the quote for future validation.

Use shared ledger indexing for exact payer/account/category/currency/date/amount
and orphan-payment checks, plus per-person/year indexes for the one-opportunity
and one-success rules. Old moves/households need no reconstructed records;
old worlds gain only an empty collection in the later root-owned migration.
Historical snapshots must remain valid after later death, player legacy,
another player-led move or household dissolution. Do not require a historical
household snapshot to equal today's mutable membership/location.

## Evidence required before integration, if approved

Focused cases should prove real12-period retirement pay and fully settled
affordability, both one-draw outcomes, all12 country/city lists and9 currencies
including JPY, locks/reserve boundary, skipped commitments and unchanged job/study/history.
Use declared unit contexts followed by normal annual commands to prove actual
move/payment/local-interaction consequences and later continuing pension pay.
Retain any natural missing move; never change seed/rolls to force one.

Use real file SQLite held-receipt failure/all8-table rollback, identical warm
retry with zero full unpack, exact production-codec cold reopen, original
archive preservation and duplicate annual protection. Add malformed new-history
and payment traps, plus genuine old checkpoint/bound-result compatibility with
only the future empty field. Root owns any final migration/tags/full/native gates.
No such checks, commands, native actions or runtime implementation were run for
this proposal.
