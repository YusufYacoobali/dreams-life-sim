# Prospective story consequence audit

All **80** overhaul situations were reviewed at `fc2294b4`: 20 organisation,
25 prison and 35 romance/ex situations. **30** selected templates gain typed
simulation operations: **9 crime, 9 prison and 12 romance/ex**. The remaining
50 retain their mechanical scale. Romance copy changes are recorded separately
in the romance review; classification here concerns consequences, not wording.

The original crime catalogue already offered a real common withdrawal action,
several rival influence decisions, one member departure and two investigation
risks. Those are counted as existing consequences, not invented as new work.
Original prison stories were statistical. Original romance stories were
statistical except two ex-contact boundaries. The new map contains choice IDs
and small enums; the engine owns every operation. Nothing executes scripts from
story content.

## What survives and affects later play

- Crime: a false accusation or coercive refusal can turn the actual bound
  associate into a named rival and remove them from assignments. Removed members
  remain historical people and can negotiate later genuine rival truces. Role
  changes alter the same crew used by mission eligibility. A leader's recorded
  backing or objection changes the real later leadership vote by ten percentage
  points, under the existing caps. Investigation choices use the real legal
  pipeline rather than a narrative arrest.
- Prison: threats create actual unit rivalries and revoke protection/favours;
  settlement ends the rivalry and blocks a subsequent rival challenge. Where a
  dispute-repair story has a genuine rival available, it binds that rival first.
  A deliberately labelled punch injures that inmate and creates one assault
  incident/case without rewriting the existing sentence. Staff reviews and
  instruction refusals can suspend prison work for exactly three calendar months,
  with both the work switch and engine enforcing the restriction. The pledge of
  support is saved as protection, influences existing group loyalty, and improves
  the subsequent reciprocal protection request while the pledge remains active.
  A family argument can pause visits while leaving letters available; an actual
  honest letter clears the pause. A written reply creates a real zero-cost
  family-contact entry.
- Romance: continued mistrust reduces later reconciliation chances; addressing
  it clears the active grievance without deleting historical arguments. A request
  for space blocks romantic outings for three months with normal communication
  still possible. No-contact boundaries block real future approaches and can be
  deliberately lifted. An ex discussion opens the existing reconciliation action
  with a one-use consent bonus, and still allows refusal. An unresolved separation
  discussion in an already badly damaged marriage can produce a real NPC divorce
  request on a later annual update; marriage, assets and custody await the
  existing reviewed settlement. A healthy marriage is never forced into divorce
  by the scene. Affair discussions bind the actual known record; they cannot
  invent an affair or reveal a different one. Their ordinary honest answers stay
  small, while refusing the discussion can create real temporary space.

## Binding and compatibility

New offers use rule version 2. They freeze both prose and consequence enums.
Prison offers also bind their original context, relationship identity and role;
crime offers bind member/leader/rival roles. Resolution never reads the current
operation map. Active v1 offers keep their original snapshots and semantics;
validators reject attempts to attach new operations to them. Original ordinary
and enhanced creative capability tuples remain unchanged.

Unavailable participants cancel or disable their original decisions without
substituting people. A former crew member can still participate as their actual
rival identity. Family stories check the original relationship role, prison
stories check the actual sentence/unit, and revised romance stories check adult
availability, exact commitment and bound affair. A canonical legal decision may
take priority after an assault; the frozen scene outcome remains queued.

## Full inventory

| Group | Stable event ID | Classification | Baseline effects | New frozen choice operations |
| --- | --- | --- | --- | --- |
| crime | `confidential-bio` | Extend consequences | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. Existing incident/investigation risk. | expose → investigation |
| crime | `larger-share` | Retain mechanics | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| crime | `informant-rumour` | Extend consequences | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. | expose → named-rival |
| crime | `rival-associate` | Retain mechanics | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. Actual saved rival influence and truce state. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| crime | `boss-accounting` | Extend consequences | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. | expose → leadership-objection |
| crime | `lieutenant-campaign` | Extend consequences | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. | support → lieutenant, expose → withdraw-role |
| crime | `better-offer` | Retain mechanics | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. Actual saved rival influence and truce state. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| crime | `crew-apology` | Retain mechanics | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| crime | `family-dinner` | Retain mechanics | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| crime | `matching-jackets` | Retain mechanics | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| crime | `rival-charity` | Retain mechanics | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. Actual saved rival influence and truce state. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| crime | `boss-retirement` | Retain mechanics | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| crime | `missing-member` | Extend consequences | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. | refuse → withdraw-role |
| crime | `rival-mistake` | Retain mechanics | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. Actual saved rival influence and truce state. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| crime | `loyalty-test` | Extend consequences | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. | refuse → leadership-objection |
| crime | `member-exit` | Extend consequences | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. Existing voluntary member departure. | refuse → named-rival |
| crime | `boss-favourite` | Extend consequences | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. | support → leadership-backing |
| crime | `rival-truce` | Retain mechanics | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. Actual saved rival influence and truce state. Existing incident/investigation risk. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| crime | `crew-memory` | Retain mechanics | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| crime | `leadership-pressure` | Extend consequences | Bound loyalty/reputation/relationship changes and memories; common optional membership exit. | expose → withdraw-role |
| prison | `prison-invisible-border` | Extend consequences | Bound conduct/standing/health/stress/relationship changes. | agree → repair, mock → rivalry |
| prison | `prison-motivational-enterprise` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| prison | `prison-guard-name` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| prison | `prison-library-margin` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| prison | `prison-letter-ordinary` | Extend consequences | Bound conduct/standing/health/stress/relationship changes. | reply → send-letter |
| prison | `prison-visiting-clock` | Extend consequences | Bound conduct/standing/health/stress/relationship changes. | listen → restore-contact, blame → pause-visits |
| prison | `prison-missing-mug` | Extend consequences | Bound conduct/standing/health/stress/relationship changes. | explain → repair, insult → assault, staff → rivalry |
| prison | `prison-job-trophy` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| prison | `prison-favour-interest` | Extend consequences | Bound conduct/standing/health/stress/relationship changes. | promise → pledge-protection |
| prison | `prison-hearing-chair` | Extend consequences | Bound conduct/standing/health/stress/relationship changes. | angry → work-suspension |
| prison | `prison-cardboard-empire` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| prison | `prison-yard-warning` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| prison | `prison-release-envelope` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| prison | `prison-family-boundary` | Extend consequences | Bound conduct/standing/health/stress/relationship changes. | honest → restore-contact, insist → pause-visits, listen → restore-contact |
| prison | `prison-contraband-denial` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| prison | `prison-rival-rumour` | Extend consequences | Bound conduct/standing/health/stress/relationship changes. | specific → repair, threat → rivalry |
| prison | `prison-study-shame` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| prison | `prison-meal-election` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| prison | `prison-birthday-silence` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| prison | `prison-quiet-friend` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| prison | `prison-priority-queue` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| prison | `prison-boasting-contest` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| prison | `prison-shift-pressure` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| prison | `prison-inspection-dignity` | Extend consequences | Bound conduct/standing/health/stress/relationship changes. | rage → work-suspension |
| prison | `prison-release-friend` | Retain mechanics | Bound conduct/standing/health/stress/relationship changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-two-anniversaries` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-phone-face-down` | Extend consequences | Bound relationship/happiness/stress changes. | trust → repair-boundary, inspect → jealousy |
| romance | `romance-emergency-contact` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-restaurant-review` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-jealous-photo` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-boundary-joke` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-blank-weekend` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-wrong-name` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-matching-outfits` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-argument-footnotes` | Extend consequences | Bound relationship/happiness/stress changes. | read → repair-boundary, mine → repair-boundary, bin → marriage-discussion |
| romance | `romance-sleep-opinions` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-personal-space` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-unfinished-apology` | Extend consequences | Bound relationship/happiness/stress changes. | own → repair-boundary, but → jealousy |
| romance | `romance-public-status` | Extend consequences | Bound relationship/happiness/stress changes. | clarify → affair-discussion, reassure → affair-discussion, evade → temporary-space |
| romance | `romance-cooking-verdict` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-museum-silence` | Extend consequences | Bound relationship/happiness/stress changes. | listen → repair-boundary, reopen → temporary-space |
| romance | `romance-wedding-album` | Extend consequences | Bound relationship/happiness/stress changes. | quiet → marriage-discussion, blame → marriage-discussion |
| romance | `romance-future-city` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-hobby-envy` | Extend consequences | Bound relationship/happiness/stress changes. | listen → repair-boundary, rank → temporary-space |
| romance | `romance-unwanted-advice` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-jealous-compliment` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-private-nickname` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-silent-evening` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-grown-together` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-perfect-couple` | Extend consequences | Bound relationship/happiness/stress changes. | real → repair-boundary, perform → jealousy |
| romance | `romance-ex-old-song` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-ex-apology` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-ex-birthday` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-ex-accountability` | Extend consequences | Bound relationship/happiness/stress changes. | own → repair-boundary, deny → no-contact |
| romance | `romance-ex-mutual-joke` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-ex-closure` | Extend consequences | Bound relationship/happiness/stress changes. Existing no-contact choice. | boundary → no-contact |
| romance | `romance-ex-new-number` | Retain mechanics | Bound relationship/happiness/stress changes. Existing no-contact choice. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |
| romance | `romance-ex-what-if` | Extend consequences | Bound relationship/happiness/stress changes. | real → repair-boundary, blame → no-contact |
| romance | `romance-ex-friendship` | Extend consequences | Bound relationship/happiness/stress changes. | slow → reconcile-request, no → no-contact |
| romance | `romance-ex-small-news` | Retain mechanics | Bound relationship/happiness/stress changes. | Small moment, or an already substantive membership/rivalry decision; no artificial escalation. |

## Verification and editorial restraint

`tests/game/story-consequences-refinement.test.ts` checks the complete 80/30
inventory, all nine upgraded crime templates after cold decode and a Time Machine
checkpoint, a former member's actual later truce, and the leadership objection
through eight genuine missions and a later vote. It checks actual assault and
exactly-once choice handling, family contact reopening, genuine letter records,
work suspension boundaries and changed original relationships. The existing
all-choice suites still cover every authored crime/prison/romance choice after
cold reload. The dedicated romance refinement suite checks downstream dates,
reconciliation, no contact, divorce requests, happy marriages and saved v1 prose.
The persistence compatibility suite compares genuine `fc2294b4` bound decisions
and complete resulting world hashes, including v1 rule snapshots.

No claim of 30 fundamentally different simulation systems is made: these are
carefully selected applications of a small set of existing operations. A quiet
inmate asking for company and a harmless romantic cake remain ordinary moments.
They do not create enemies or legal cases just to meet a count. Device touch,
rendering and installed-build behaviour require separate evidence.
