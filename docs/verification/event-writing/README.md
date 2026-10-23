# Event and payoff writing overhaul

The full catalogue was audited against `da0b0e5`: **319 events and 957 choices**.
The initial batch revised 114 events / 342 result branches. The follow-up
completes all 19 deferred candidates and their 57 payoffs, bringing the total to
**133 revised events / 399 result branches**. The audit keeps 186 events,
replaces 88 weak premises and improves 45 existing events. No Improve candidates
remain deferred. All existing event and choice IDs remain.

[Read the 19 follow-up situations and every new payoff](deferred-followup.md).
Their eligibility and effects are unchanged, so the existing save markers remain
valid; all already-bound original outcomes are checked against genuine pre-edit
captures.

[Search the complete before/after editorial review](index.html), including each
situation, choice, result and journal entry. [The audit data](catalogue-review.json)
records the decision and reason for every event. Dramatic comparisons use actual
resolved saves from the previous commit; other comparisons show authored live
binding tokens, which the game substitutes before presentation.

## Experience

The rewrites replace chores and lessons with specific incidents: the office
firing spreadsheet, a donkey auction, an unsolicited cake shaped like your head,
a fake wedding website, a school secrets game, a relaxation instructor arguing
about a printer, a runaway washing machine and a caricature drawn as an angry
thumb. Not every scene is a scandal: quiet family and later-life beats remain.

Every revised choice has its own payoff and journal entry. Results describe the
reaction, rather than restating a stat change or explaining a moral. The final
cross-catalogue review removed repeated snoring, bird-conspiracy, charity-auction,
fake-laugh and revenge-post premises. It also corrected a draft/finished-work
contradiction, distinct dating-profile journals, the consecutive unpaid-period
condition and a claimed profile-image change with no corresponding state effect.

There are 27 priority upgrades to immediate stakes. In total, 37 revised events
use the small validated consequence package for quoted cash, actual contract
performance/endings, bound trust, genuine friendship endings or public image.
Other meaningful outcomes use existing health, grade, skill and bond effects.
Payments use frozen local FX quotes and available funds; no silent borrowing.
Job and friendship endings reuse the existing domain functions. No new generic
story engine, world-history collection, follow-up chain or RNG draw was added.

All rarity weights, age ranges, five-year cooldowns and Age Up selection/pacing
stay unchanged. Seven context declarations change to bind people or school
settings actually mentioned; one associated scene illustration changes to fit
its new family premise. UI, navigation, popup layout, avatar V2 artwork and
mini-games are unchanged.

## Saves

Combined markers are **World47 / engine49 / content26 / reader27 / SQLite v4**.
The concurrently published Cult Leader career is retained. Both branches used
World46 / engine48 / content25 independently; migration preserves existing cult
records and adds an empty cult collection only when the writing-branch save has
no such field. Present malformed data is rejected rather than replaced. Earlier
World45 saves gain the same empty collection. Reader13–26 upgrades change only
the database marker. Existing decisions,
results, journal entries, history, quotes, choices and random streams remain
literal. Earlier migrations retain their established policy.

New dramatic bindings carry a copy revision. Unflagged old decisions retain
all 45 original dramatic payoffs; the new revision changes writing only, with
identical domain state and RNG. Genuine previous-commit fixtures exercise both
this and the replaced queue-merge story. Existing historical fixture bytes,
canonical hashes and original eligibility digest are preserved.

## Natural journal review

[Read the 36 complete recorded lives](natural-lives/index.html), or inspect the
[summary and individual JSON journals](lifetime-summary.json). The existing
lifetime test always takes the first available choice without manually creating
employment, relationships or hobbies. Across 12 countries and all three genders,
these lives contain 2,581 decisions, including 596 revised-story encounters and
40 different rewritten situations. Every life completed, with no ordinary
five-year cooldown violation, unresolved binding token or missing nonfatal result.
Focused context and branch tests cover alternatives and careers/relationships
that this passive strategy does not create.

The evidence records runtime `42edd00` verbatim. It exposed ambiguous names in
two existing project callbacks and a debt warning on genuinely free medical
care. Later prospective copy fixes distinguish the actual teacher/classmate and
describe zero patient charges accurately. Stored pending text and these original
captures are preserved. A separate review of the concurrent career's 28 scenes
and 84 payoffs found an entrusted mug-business role incorrectly called a
broadcast in a later callback; its new binding copy now fits both roles.

Medical emergencies remain frequent for untreated chronic illness in the passive
strategy: 641 of 2,094 adult decisions. They reflect the existing health rules,
not new authored event chains. This writing batch does not change disease
progression or suppress genuine health decisions.

## Initial batch verification

The final combined source `98e34b0` passed **302 suites / 4,236 tests in one complete invocation**, including 12 complete seeded lives. Strict app/test types and the **488-module import graph** pass. [Exact commands, counts, source pins and log hashes](test-summary.json) are recorded separately from the earlier writing-only run.

Genuine captures from both independent World46 producers preserve all ten original whole-world choice outcomes after migration. Reader26 row preservation, transaction rollback, retry and duplicate protection pass. The 12 combined-source lifetime replays retain the original actual choices, consequence rows, death ages and ledger-row counts; only the intended prospective copy changes differ. These replay seeds overlap the original 36-life review and are not counted as new distinct lives.

The searchable editorial report was rendered and checked at 390px and 1440px,
including all 114 original revised stories and search filtering. The follow-up adds 19 more stories to the same report. These are report checks, not
native game screenshots. No native-device or new visual-layout acceptance is
claimed for this writing and domain-effect batch.
