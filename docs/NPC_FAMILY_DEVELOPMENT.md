# NPC courtship, marriage and family development

This extends the bounded existing-person dating slice. It does not generate a
spouse, change the active player, grant qualifications, or give anyone wedding
money. The ordinary annual engine observes at most twelve relevant couples and
attempts at most one wedding per calendar year, including declined attempts.

## Real time and mutual decisions

Only living adult NPC couples whom the player actually knows are observed.
Dating or engagement starts an exact persisted observation clock. Existing
friendship dates and old `npc-dating:YEAR` memories never count toward that clock.
The couple must still be mutually exclusive and have at least twenty-four actual
calendar months since observation before proposing marriage. A repeated annual
hook cannot repeat its attempt, even after a failed save or a change of actor.

Existing romance rules enforce adult ages, mutual preferences, local presence,
and kinship through four generations. Wanted people and those travelling,
hospitalised, in custody, away on service, or below 25 health cannot marry here.
The current player and their partner are excluded. Dependent children, guardianship
and active custody arrangements defer this initial wedding slice: it never moves
parents away from children without a care plan.

Each partner makes a separate saved NPC-stream consent roll. The chance is
`min(90, 40 + floor(actual relationship trust / 2))`; either refusal prevents both
charges and the wedding. This background decision does not use the player's
proposal/ring requirements or fabricate a ring.

## Actual costs and existing legal mechanics

The ceremony uses the existing country's simple-wedding price. The first partner
pays the rounded-up half, the second the remaining half, from their own available
local-currency cash. Locked cash, borrowing and the player's balance cannot fund
it. Existing external contracts/pensions settle through the current month once
before affordability is checked again. Company employment must retain its actual
monthly payroll; this path only spends its already available savings.

`npcCourtships` records exact observation/check dates and countries, proposal
date/location, price/shares, available balances, pre-fee wealth, both rolls and
consent, both actual receipt IDs and the standard marriage ID. Validation uses the
shared indexed ledger, binds the two consecutive payer receipts and after-fee
marriage baselines, rejects duplicate yearly attempts and orphan fees/marriages,
and never scans the full ledger for every historical row.

The shared explicit-person completion helper preserves the existing player
wedding payment order, `marriage_revision` ID, baseline timing, result and royalty
behavior. NPC IDs use a separate prefix. Standard spouse roles, marriage records,
ownership-preserving household movement and royal membership apply. Existing
estate, divorce and custody rules then use the actual marriage; property title
and separate accounts are retained. A named journal entry reports the wedding.

## Later family life

These new unions cannot conceive in their wedding calendar year. In later years,
the existing conception and monthly pregnancy/birth pipeline applies, with both
parents below three existing children, actual child preferences and reproductive
capacity, and local availability. At most twelve relevant new unions are checked
and one new autonomous-family pregnancy begins per year. Each eligible union's
annual attempt is guarded, including unsuccessful attempts. A child is created
only by the real due-date birth pipeline nine months later. Existing legacy NPC
marriage pregnancy behavior is retained.

## Scope and integration

The first observation is deliberately conservative for older dating saves. Current
NPCs have no automatic separation/reunion command; if one is added later, it must
close the saved clock at the actual separation before allowing any reunion clock.
Temporary unavailability postpones a wedding rather than erasing relationship time.
Automatic divorce, adoption, rings/gifts, dependent-family moving plans and wider
unobserved populations remain future depth work.

Root integration uses World33/engine34/content9 and reader13. World32/engine33
worlds gain only the new tags and empty courtship history; exact existing pay,
people, bound scenes, choices, results and RNG remain. Original current, backup
and historical payloads are never eagerly rewritten. Reader13 protects new
consent and wedding records from older applications. Focused tests cover normal annual wedding progression, exact wait,
payment/identity/consent traps, standard estate and delayed birth mechanics,
bounded work, unchanged player wedding behavior, and all-table SQLite rollback,
retry and exact cold resume. They do not claim native-device or full-release
acceptance.
