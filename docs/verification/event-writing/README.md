# Event and payoff writing overhaul

The full catalogue was audited against `da0b0e5`: **319 events and 957 choices**.
This batch revises **114 events / 342 result branches**. It keeps 186 events,
replaces 88 weak premises, and improves 26 existing events. Another 19 Improve
classifications identify candidates outside this initial batch; their text is
unchanged. All existing event and choice IDs remain.

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

Current markers are **World46 / engine48 / content25 / reader26 / SQLite v4**.
World45 and reader13–25 upgrades change markers only. Existing decisions,
results, journal entries, history, quotes, choices and random streams remain
literal. Earlier migrations retain their established policy.

New dramatic bindings carry a copy revision. Unflagged old decisions retain
all 45 original dramatic payoffs; the new revision changes writing only, with
identical domain state and RNG. Genuine previous-commit fixtures exercise both
this and the replaced queue-merge story. Existing historical fixture bytes,
canonical hashes and original eligibility digest are preserved.

## Verification

Focused event, consequence, legacy-copy and SQLite rollback/retry checks pass.
Strict app/test types and the 473-module import check pass. The full regression
and natural lifetime journal review will be recorded after the final source
freeze. No native-device or new visual-layout acceptance is claimed for this
writing and domain-effect batch.
