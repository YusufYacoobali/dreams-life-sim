# Final source review

The review covered the new modules, engine and persistence integration, existing
legal/family/relationship commands, navigation, all eighty new story premises,
their choice outcomes, and the rewritten interaction inventory. Test results
and export provenance are recorded separately in the verification README.

## Correctness changes made during review

- Assignment limits are per person and calendar year, including across different
  organisations and the older Underground Job route. The legacy leave command
  uses the new departure handler when its affiliation has been upgraded.
- Each recent job has a unique incident and, when paid, a unique ledger row.
  Import validation rejects reused incidents/payments across organisations and
  checks their actor, gain and month. Older compacted jobs retain totals.
- Crew-led work uses actual available members. No absent person receives credit.
  Recruiting uses a real local contact's willingness and existing trust.
- Imprisonment preserves the outside affiliation. Prison routine membership is
  checked by the actual sentence and group, independently of the legacy pointer.
  Release closes the sentence's prison memberships and retains outside history.
- Leadership changes use saved named crew members. Death selects a surviving
  successor or closes the crew; a dead bound story participant cancels the scene
  without assigning that person's role to somebody else.
- Prison and romance decisions resolve through the engine's dedicated outcome
  path after the pending event is cleared. Stale circumstances give a factual
  cancellation rather than successful saved prose. Crime outcomes also report
  actual expulsion and investigation results.
- Prison support has a real donor debit and recipient credit. Inmate protection
  is used in later fights and is revoked after hostility; exchange-of-favours
  benefits are actual trust, bond and influence changes, without invented money.
- Escape reserves the same personal annual allowance before the first input.
  Cold reopening retains the board, input transcript, difficulty and assistance.
  Forfeiting settles an actual failed attempt; one settlement creates one legal
  incident. Success keeps the unfinished sentence and genuine wanted status.
- Affairs preserve actual adult participants and explicit knowledge. A secret
  cannot appear in player actions as known infidelity. A deliberately ended
  secret affair remains confessible once to its actual current partner, without
  overwriting its earlier ending. Disclosure to family requires actual knowledge.
- NPC proposals transfer only an existing eligible ring, or create a ringless
  engagement. Breakups retain NPC agency. Divorce requests preserve the marriage
  until the existing settlement handles money, property and custody.
- Ex contact boundaries and temporary space have canonical command guards.
  Significant betrayal history affects reconciliation. Happy couples are not
  eligible for conflict-driven breakup/divorce/affair rolls merely by aging.
- Death and child continuation close active affairs and orphan offers while
  retaining histories. Time Machine changes the root life ID without rewriting
  participants or the organisation's immutable origin identity.
- New dates explicitly enable the overhaul on an old save. The four original
  dates and old pending decisions retain their previous behavior.
- Certified in-memory parsing preserves absent optional capability keys exactly
  as cold parsing does; it does not add own properties containing `undefined`.

## Compatibility and performance

Ordinary 49/51/28 and creative 50/52/29 formats remain valid. The explicit
overhaul capability has required histories when present and no decoder defaults
when absent. Future capabilities and missing enabled records are rejected.
The reader-30 database upgrade changes metadata without rewriting stored lives,
backups, receipts, checkpoints or branch records. Genuine fixtures are unchanged.

New validators skip absent histories. Organisation and prison validation reuse
the canonical ledger index rather than rescanning the full ledger for each job
or transfer. Named contacts, histories, offers, scenes and recent job records are
bounded. Annual hooks inspect relevant player relationships and memberships;
they do not simulate an additional full NPC world.

## Editorial and presentation review

The eighty new situations have distinct premises and genuine eligibility. The
review corrected duplicate titles, references to unrecorded events, unsupported
spending, remand-inappropriate dialogue, invented recent arguments, premature
marriage anniversaries and stale participant claims. Seventeen common withdrawal
choices are counted separately from the 240 original authored outcomes.

The existing four main tabs, person profiles, portraits, illustrations, cards,
action rows, confirmations and feedback conventions remain. New UI tests cover
save failure, retry, cancellation, identity changes and cold reopening. Escape
uses named text controls and assisted input; color and motion are supplementary.

## Remaining acceptance limits

No connected Android or iOS device, simulator, signed store build or native
frame measurement was available. Component tests, real SQLite tests and Hermes
exports do not establish installed-device acceptance. Cloud performance samples
measure synchronous engine and SQLite work. They do not establish native input
latency, rendering smoothness or long-term player balance.
