# Crime, romance and writing refinement

This pass starts from published `v2` commit `fc2294b476fec72a77a9a863c7994b025ebe241f`.
The implementation follows the seven-stage refinement plan supplied on 30 October
2026. Verification evidence lives in `docs/verification/crime-romance-refinement/`.

## Compatibility contract

Ordinary World 49 / engine 51 / content 28 and enhanced creative-career World 50 /
engine 52 / content 29 remain distinct supported capabilities. Refinements use
optional, explicitly versioned records. Existing pending decisions own their
frozen wording, participants, outcomes and rules. New offers receive the new
revision; decoding an existing save does not create new gameplay records.

SQLite reader 31 upgrades supported reader 30 and earlier databases by changing
the metadata marker. Compatible eight-table databases retain their literal rows,
packed checkpoints, receipts, backups and Time Machine moments. Reader 32 is
rejected before mutation. The marker protects these new semantics from an older
executable that cannot interpret the new puzzle inputs or asset provenance.

## Crew consistency

The same `eligibleMissionCrew` selection supplies availability, success benefit,
recorded participants, loyalty changes and memories. It excludes former members,
low loyalty, death, confinement, travel, service absence, health unavailability,
wanted status and a different organisation city. Eligible members contribute both
loyalty and criminal experience. The approach picker explains an unavailable
Crew-led option while leaving the other eligible approaches selectable.

## Exit Shuffle

New sessions use an untimed pattern-memory challenge. A player-controlled preview
ends before symbol choices appear. Recall shows progress without the answer;
each successful round leads to a longer pattern. The five difficulty profiles
vary pattern length, round count and mistake allowance, using the existing actual
sentence/security difficulty selection.

Assisted sessions retain the memory task and offer two one-symbol hints for the
whole attempt. Hint and preview screens hide input choices. Labels, wrapping text,
announced feedback and an untimed transition support accessible play. A restrained
feedback animation respects reduced motion. Generated artwork was considered;
the existing named symbols communicate the task more clearly and retain the
mini-game's visual identity.

The saved version, seed and input transcript reproduce phase, round, progress,
mistakes and hints. Pause/reopen cannot reset an attempt. Published v1 sessions
retain their original rules. New v2 starts also store `escapePatternVersion: 1`
and use the existing pure random helper with a local round seed. Earlier v2
sessions without that field keep their original symbols and complete outcomes;
decoding never adds the field. Actual escape incidents and exactly-once settlement
continue through the existing legal and mini-game architecture.

## Distinct criminal missions and vehicle ownership

The eighteen valid mission/style combinations each have at least three actual
result paths. Street assignments affect named rival influence and reputation,
including respect gained despite financial failure. Fraud uses real victim
transfers, complaints and existing public-controversy responses; a scandal can
damage an actual current job's performance. Smuggling retains fictional cargo
delivery, confiscation or loss and can turn a genuine participating associate
into a former member and rival. Crew resentment belongs to the people who
participated. Caution, boldness and crew involvement change odds, proceeds,
expenses, exposure and injury risk.

Version-2 incident metadata freezes the result, participants, financial links,
cargo, scandal and member/rival identities. Validation reconciles even archived
assignment facts against the ledger and legal records. New offences use the
existing investigation, arrest, hearing, sentencing and restitution machinery.
Old `organized-job` incidents and judgments acquire no retrospective metadata.

Vehicle theft transfers one specific registered vehicle. Explicit targets need
an existing lawful vehicle; an anonymous target can introduce an external NPC's
explicit opening vehicle without claiming a purchase payment. The same asset ID
changes possession, with its previous title and costs frozen. The thief receives
no cash reward and cannot sell, insure or bequeath it. Arrest/death seizes held
stolen property. Returning the car restores its original owner's actual title;
it does not mint another car or erase the incident. Retheft of an already marked
record is excluded to preserve the original incident identity.

## Thirty situations with persistent consequences

The [eighty-situation audit](verification/crime-romance-refinement/story-effects-audit.md)
selects nine crime, nine prison and twelve romance/ex premises for small typed
operations. Definitions are data; resolvers own the simulation changes. Binding
copies the operation into a version-2 snapshot. Resolution never consults a live
content lookup to redefine the selected effect.

The consequences include real crew promotion/removal, a named rival who remains
negotiable, later leadership backing, prison rivalry/protection, an injury and
assault case, three calendar months without prison work, paused visits reopened
by an actual letter, mistrust that affects reconciliation, temporary space,
no-contact, a consensual fresh-start discussion and a later NPC divorce request.
Marriage finances still require the canonical reviewed settlement. Unavailable
people and changed relationships cancel the original scene safely.

## Romance and existing annual stories

[Fourteen romance rewrites](verification/crime-romance-refinement/romance-review.md)
mix physical embarrassment, bad-faith choices, absurd props, discovered betrayal
and emotionally serious answers. Twenty-one ordinary/wholesome scenes remain.
The player cannot receive a betrayal accusation without their actual discovered
affair and the partner's knowledge, a divorce spreadsheet without marriage and
an argument, or an ex's fresh-start pitch while either person is committed.

The [annual writing audit](CRIME_ROMANCE_WRITING_AUDIT.md) inspects 121 existing
annual situations and 363 choices: 95 retained, 26 refined, 76 revised payoffs,
four revised setups and 26 exact before/after examples. This is separate from the
original overhaul's 89 interaction-response rewrites. The prose-only revision-2
overlay cannot change IDs, eligibility or effects. Only newly bound
overhaul-enabled offers receive it; old pending wording and journals stay literal.

## Gameplay-oriented review

Review found and corrected cases that counts alone would have missed: a former
crew member incorrectly blocked from negotiating as a rival; a claimed rival
advance without a living unresolved rival; claimed expenses when no money was
paid; theft/return potentially creating extra family assets; historical v1 puzzle
instructions describing v2 controls; and new choice objects losing explicit
undefined keys across cold persistence. A disproportionate rivalry effect on an
ordinary small moment was moved to a serious prison disciplinary premise.

The final puzzle review also found that low-bit hashing forced a four-symbol
cycle, weakening the hardest levels. The versioned local generator removes that
forced cycle. Across 256 sampled seeds, the three longest rounds produce
244 / 254 / 255 different patterns. Actual earlier v2 checkpoints still replay
to their original complete world hashes. This improves the memory task while
preserving already-started puzzles.

The multi-year journeys use actual saved commands. Criminal years include
custody and release rather than bypassing them to keep assignments available;
the original street seed needs ten calendar years to reach its third assignment
year after two convictions. Smuggling reaches a named associate's betrayal.
Fraud creates actual victims and cases. Happy partners stay together across
three real years, while a separate actual affair/confession/breakup journey
reaches reconciliation without deleting its betrayal history.

The systems offer different decisions and lasting consequences across these
journeys. Human judgements about humour and memory difficulty still require
playtesting.

## Final verification

The [verification report](verification/crime-romance-refinement/README.md) records
all provenance: the full frozen run passes 378 suites / 6,261 cases, followed by
14 final affected suites / 184 cases after the pattern refinement. Latest
whole-file coverage is **378 suites / 6,268 passing cases**, with zero missing
files, failures or skips. The 120-life soak, strict app/test types, 570-module
acyclic import graph and notice checks pass. Both final production Hermes maps
contain exact matches for all 44 changed runtime sources.

All nine legacy benchmark inputs, commands and complete outcomes match the
baseline. Longer eleven-sample checks did not reproduce the initial timing
gaps; every raw observation is retained. No performance-only source change was
applied. Native-device acceptance remains unverified.
