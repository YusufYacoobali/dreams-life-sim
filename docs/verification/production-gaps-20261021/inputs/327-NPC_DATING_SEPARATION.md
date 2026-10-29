# NPC dating separation

This implements the approved [bounded proposal](NPC_DATING_SEPARATION_PLAN.md)
on the isolated future branch. Accepted C36 remains unchanged. Root must replace
the explicitly marked temporary schema default with a required `npcSeparations`
array in the shared World36/engine37/content12/reader16 integration, adding only
an empty array to legacy World35 and older worlds. Existing raw producers,
archives, checkpoints and historical hashes are not regenerated.

## Authored behavior

An existing open, genuinely observed adult NPC dating courtship can receive one
compatibility check after12 actual calendar months. Both people must be known
to the player, current exclusive partners, living adults in the same home city
and available for local life. The player/current partner, teen relationships,
engagements, marriages, trips, hospital/service/custody absences, wanted status
and health below25 are excluded. Shared households, living minor dependents,
active custody/pregnancy and actual direct financial ties are outside this slice.
The latter include outstanding person loans, employer/employee or business
payable ties, and active hobby participant/payer arrangements. Independent bank
debt and individually held assets remain unchanged.

The frozen V1 rule considers actual bond or trust below50. The chance is
`min(25, max(5, floor((100 - min(bond, trust)) / 4)))` percent:35/35 gives16%.
This is explicitly authored compatibility risk. No unobserved argument,
deterioration, betrayal, unhappiness or change of preferences is invented.

The annual pass sorts and rotates open courtship IDs, inspects at most12 pairs,
and attempts at most **one pair across the world per calendar year**, with one
NPC-stream roll. A continued outcome consumes that same yearly allowance.
An actual check records its observed date for either outcome, without changing
the original courtship start or adding waiting credit. This is independent of
the subsequent wedding observer's different bounded window. Empty/ineligible
passes do not change state or RNG. Existing formation remains
before the new hook, with existing courtship/wedding and family checks after it.

Separation sets the same relationship to `ex`, removes only its partner role,
retains actual ordinary roles/bond/trust/memories, closes the exact observed
courtship on that actual date and adds one named factual journal entry. Old
proposal/fee/consent records remain exact. No pending result is replaced, and
there is no player acknowledgement, monetary/stat grant, settlement or automatic
reunion. Existing `ex` formation rules remain. A continued pair can still use
the normal later paid wedding and delayed birth pipeline.

Each attempt has typed V1 identity, observer/then-partner, date/country/city,
bond/trust/chance/roll/outcome snapshots. Validation binds actual known people,
courtship identity and clock, reciprocal new counters, historical actor periods
and actual endings. It rejects duplicate years and a forged continued result
at the same actual separation date. Later residence/preferences/death/legacy
changes preserve the old snapshots. Genuine old clocks already ended
`separated` need no invented retrospective attempt. Runtime and validation use
linear shared indexes and a bounded annual candidate window; no UI/render scan
or new save architecture is introduced.

## Verification scope

The new domain cases include both outcomes/one draw, all12 current countries,
exact calendar/leap wait, bounded13-pair rotation, unchanged skipped contexts,
history tampering, actual paid-trip postponement, preserved real declined
wedding terms, later death/legacy and genuine old complete-checkpoint hashes.

A declared12-pair adult unit setup then uses only ordinary engine commands,
with no post-setup date/money/stat/RNG changes or outcome searches. It produces
an actual annual separation before wedding. A separate fixed3-pair setup
honestly records six continued checks and three real paid weddings. Neither is
a new natural-country cohort or a claim about unarranged birth-to-adult play.

The on-disk SQLite case holds the actual annual save before its receipt, reads
the original committed state from another connection, rejects a busy duplicate,
then forces failure. All8 tables/world/RNG roll back exactly. The identical
command retries with zero full checkpoint unpack, preserves original archive
payloads and metadata, and cold-reopens the same history, clock and pending
scene. Normal choices/acknowledgements cannot repeat the separation or journal.

The original shared wedding test helper had assumed its sole35/35 pair must
eventually marry. With separation that guarantee is false. Its repair explicitly
sets a healthy50/50 known-peer context between the two actually introduced people before
subsequent normal commands. All old timing, consent, fee, identity, ownership,
birth and estate assertions remain. No production rule or original fixture is
changed to make that positive wedding context pass.

Initial failed checks remain:

- `/tmp/dreams-npc-separations-focused-initial.out`:53pass/4fail. Two new setup
  mistakes used the wrong legacy command field and attempted a foreign-currency
  death without that account; both were corrected. The3-pair case produced
  continued/wedding outcomes rather than the initially expected breakup.
- `/tmp/dreams-npc-separation-fixed-journey-diagnostic.json`: one bounded replay
  of that original3-pair setup, preserving its six continued checks and weddings.
- `/tmp/dreams-npc-separations-types-initial.out`: one new-test implicit-any
  callback annotation error, corrected.
- `/tmp/dreams-npc-separations-focused-v2.out`:58tests/2suites pass16.445s.
- `/tmp/dreams-npc-separations-focused-final.out`:84pass/27fail across6suites,
  109.52s. All27 failures share the old guaranteed-wedding helper; new domain
  and disk-save suites and both existing NPC-formation suites passed.

Prior focused `/tmp/dreams-npc-separations-healthy-final.out` actually closes0:
**111tests/6suites pass31.534s**, including new60cases and the unchanged old
NPC-formation/courtship/payment/birth/estate/disk-save assertions. Prior strict
app/all-test types closes0 in `/tmp/dreams-npc-separations-types-final.out`.
Both precede the final self-review correction:13+ pairs can be visited by
different separation/wedding windows, so the real compatibility observation
must itself update `lastChecked`. The strengthened13-pair test requires full
world validation immediately after a continued attempt.

Final corrected-source `/tmp/dreams-npc-separations-clock-final.out` actually
closes0: **60tests/2suites pass16.51s**, including the strengthened13-pair clock
regression and all8-table disk rollback/retry/cold proof. The earlier111-case
adjacent run remains explicitly before that narrow observation-date correction.
Sequential final `npm run typecheck` (app and every test) actually closes0 in
`/tmp/dreams-npc-separations-clock-types-final.out`. Exact-SHA independent review
is separate; no further source edits or passing reruns are assumed by this doc.

The original unchanged two-introduction circle is retained separately in
`/tmp/dreams-npc-separation-original-circle-diagnostic.json`:7 actual commands,
observed2024-01-01, separation2025-01-01 at35/35, chance16, actual roll14,
world SHA256 `69e1eff0ea0a4075adc47426acaaca5e7bbe53a6f9f53a2064f339716cf260bb`.
Its sole-pair breakup explains the earlier shared helper's failed assumption.
No healthy setup, alternative seed, post-setup edits or roll peeks occur in
that diagnostic. It is qualified-adult unit acceptance, not natural birth play.
No full regression, new lifetime cohort, export, native or performance acceptance
is claimed by this isolated milestone. Root owns the shared migration and final
consolidated gates.
