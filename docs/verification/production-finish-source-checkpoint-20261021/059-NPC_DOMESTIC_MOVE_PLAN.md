# Proposal: one independent retirement move

Approved bounded implementation based on initial future union
`4981d473b11bc587046f78caaeb69bcb3277464f`, isolated from the frozen C37
acceptance source. The original proposal was `c94729b`; root owns the later
coordinated schema/reader migration and production acceptance.

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
  training. The actual earned pension is positive, with at least 12 **recorded
  paid pension periods** and a real receipt in the current month. Do not infer
  attendance/pay from an old birth date or migrated lifetime counter alone.
- `lastEconomicMonth` must equal the current month. Current income, necessary
  bills and annual tax must already have been processed by the actual annual settlement loop. Do not settle skipped
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
  contact IDs, rotate by calendar year and inspect at most 12 relevant contacts.
  Select the first fully eligible and funded person. No population generation
  or private-outcome search; no changed world/RNG for an empty pass.
- At most one actual opportunity across the world per calendar year. Authored
  V1 chance 20%, exactly one `npcs` draw; record `stayed` or `moved`, consuming
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
never borrow, unlock held money or charge the active player. This fully settled
retiree slice defers an account with any remaining locked cash: saved V1
attempts therefore record `lockedCashBefore: 0n`. No eligibility check releases
a trust or catches up missed economics.

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
The frozen country/city/cost/tax V1 table binds the quote for future validation.

Both outcomes retain the pre-attempt ledger cursor, exact account ID, cash,
locked cash and available cash, plus actual living cost, fee and three-month
reserve. Validation reconstructs cash from the immutable account opening cash
and a single forward ledger-prefix sweep. It never compares a historical
budget to today's balance or locked cash. A successful payment occupies the
saved next ledger position; a stayed attempt has no moving payment.

The annual loop calls the existing `settleTax` exactly once per financial actor,
in the existing order, through a wrapper that captures gross/withheld, country,
account, start/end ledger cursors and the actual reconciliation/refund receipt.
Only these transient actual-settlement proofs permit `npcMovesYear` to act.
The saved proof binds V1 due/adjustment, the exact payment span (including the
zero-adjustment empty span), and a settlement before the moving charge. A
current pension receipt or `lastEconomicMonth` alone never substitutes for tax
settlement. The current receipt must be regular paid pension income, and its
actual gross/withheld corroborate lower bounds on the captured pre-tax cycle.
The saved tax proof links the original settlement finance journal by exact ID,
position, command revision, participant, date and actual text bytes. Validation
never reformats old journal copy with the current locale implementation. Zero
adjustment still retains this actual journal when pension gross is positive.
This is bounded snapshot/artifact corroboration, not independent reconstruction
of every taxable cycle source (sale cash, capital gains, FX and background pay
have different semantics). A genuine empty tax-payment span has no extra marker;
its ordered bounds are checked without claiming every empty ledger cursor can
be independently certified. No tax formula, fee, ordinary withholding or settlement journal is
changed. Positive arrears or any remaining tax-cycle balance defer movement.

Use shared ledger indexing for exact payer/account/category/currency/date/amount
and orphan-payment checks, plus per-person/year indexes for the one-opportunity
and one-success rules. Old moves/households need no reconstructed records;
old worlds gain only an empty collection in the later root-owned migration.
Historical snapshots must remain valid after later death, player legacy,
another player-led move or household dissolution. Do not require a historical
household snapshot to equal today's mutable membership/location.

## Evidence required before integration, if approved

Focused cases should prove real 12-period retirement pay and fully settled
affordability, both one-draw outcomes, all 12 country/city lists and9 currencies
including JPY, locks/reserve boundary, skipped commitments and unchanged job/study/history.
Use declared unit contexts followed by normal annual commands to prove actual
move/payment/local-interaction consequences and later continuing pension pay.
Retain any natural missing move; never change seed/rolls to force one.

Use real file SQLite held-receipt failure/all 8-table rollback, identical warm
retry with zero full unpack, exact production-codec cold reopen, original
archive preservation and duplicate annual protection. Add malformed new-history
and payment traps, plus genuine old checkpoint/bound-result compatibility with
only the future empty field. Root owns any final migration/tags/full/native gates.
Implementation evidence is appended after actual focused gates close; this
plan itself claims no runtime, native or broad production acceptance.

## Implemented isolated slice and focused acceptance

The implementation is based on `4981d473b11bc587046f78caaeb69bcb3277464f`.
It adds only `npcMoves[]`, the three typed movement modules and the narrow
create/validate/annual hook. No UI commands, country/nationality changes, jobs,
qualifications, family settlements, relocation offers or global tags are added.
The isolated `.default([])` is explicitly temporary: root must replace it with
a required field and an empty legacy migration in the later coordinated version.
The current C37 accepted source and all immutable fixture files are untouched.

The wrapper preserves the original `settleTax` invocation/order and effects,
including a zero-income actor without a native-currency account. Missing accounts
prevent a moving quote; they do not create a new refusal or account. Actual
original reconciliation/refund rows bind exact amounts/cursors. The zeroed
snapshot/empty-span/no-original-artifact forgery, wrong artifact/position/bytes,
pension substitutions, cash/reserve/payment/counter mutations and extra living
household members are rejected. The latest pension payment must be regular
income; background catch-up does not qualify for the current annual settlement.

The meaningful paid-pension context uses the unchanged genuine v18 archive
`67204e03663bb0715af6f101932eb7d5371090e5e6a1e1d9ffe7236dc72add9a`:
Morgan's actual old 12 paid USD-to-JPY pension receipts, pension rights, service,
opening accounts, cash and work history. The unit setup explicitly introduces
an adult known-child observer, advances the declared starting calendar one
month, runs the real pension/living helpers for the 13th payment and declares
one initial NPC stream. This is an arranged observer/calendar/random context;
it is not a natural-birth or native relocation claim. Subsequent journey
commands use the first available ordinary choice/acknowledgement/resume/advance,
with no later date, health, money, RNG, outcome or alternative-seed changes.

That fixed journey actually stayed in its first opportunity, then moved
Tokyo to Kyoto on 2029-02-01 with 37 actual recorded paid pension periods.
It retained 4,137,820JPY before the 64,000JPY moving payment and checked the
330,000JPY three-month reserve. The actual tax reconciliation had no cash
adjustment and retained its original journal artifact. Another normal 12 months
reached 49 pension periods on 2030-02-01, preserving annual native pension rights
of 2,408,163USD minor units and 588 service months. No new employment, service or
qualification was created by moving. Its local in-person interaction correctly
became unavailable while the ordinary relationship and household IDs remained.
The country/cost tests cover all 12 frozen packs and nine currencies, including
JPY rounding; they do not claim 12 natural relocation journeys.

Actual file SQLite acceptance imports the genuine v18 and v30 archives, holds
the real annual receipt transaction, rejects a duplicate busy dispatch, observes
all 8 unchanged tables from a separate read-only connection, forces rollback,
and retries the identical command with zero full checkpoint unpack calls.
It proves exact previous raw-current payload bytes in backup, exact old archive
rows/snapshot payloads, one moving payment/journal, a new-connection production
codec cold reopen, acknowledgements and duplicate acknowledgement refusal.
Historical validator cases retain the old budget after later spending,
household dissolution, a new residence and death; they do not pretend those
explicitly arranged later mutations are a natural estate/legacy journey.

Actual gate evidence (no broad, native, cohort, export or performance run):

- Initial session 14064 CLOSED1 before executing tests: missing function brace;
  retained `/tmp/dreams-npc-retirement-moves-tests-initial.out`, corrected.
- First executable session 21986 CLOSED0: 60 tests/2 suites, 11.688s;
  `/tmp/dreams-npc-retirement-moves-tests-second.out`.
- Closed-business payable owner boundary added; session 37017 CLOSED0:
  61 tests/2 suites, 7.524s; `/tmp/dreams-npc-retirement-moves-tests-final.out`.
- Sequential `npm run typecheck`, session 45697 CLOSED0, app and all test types;
  `/tmp/dreams-npc-retirement-moves-types-final.out`, no diagnostics.
- Exact raw-backup assertion added after review; final session 89060 CLOSED0:
  61 tests/2 suites, 7.395s;
  `/tmp/dreams-npc-retirement-moves-tests-raw-backup-final.out`.
- Fixed actual journey summary (record, command, original archive SHA and
  before/moved/continued canonical hashes):
  `/tmp/dreams-npc-retirement-move-fixed-journey.json`.

These `/tmp` paths are original local evidence locations, not portable release
artifacts. Root owns later archive publication, coordinated strict migration,
full regression, performance and native acceptance.
