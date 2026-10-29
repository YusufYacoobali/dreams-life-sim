# Named early story consequences

The approved M04 result surface shows the actual committed effects of a choice.
An early school result could previously show two different changes both labelled
`Relationship`, leaving the affected people unclear.

## Concrete reproduction

Starting from the existing `pupil('US', 8)` setup, bind the authored
`school-volcano-breach` scene and resolve its normal `clean` choice. The current
saved school contacts are Avery Bennett, the classmate, and Avery Reed, the
teacher. The two committed bond changes are +3% and +2%, respectively, but both
rows previously read `Relationship`. Their first names are also identical, so
first names alone would not distinguish these actual people.

The same generic effect renderer handles the arcade invitation's original
parent/classmate changes. Its later callback already identifies each bond;
the origin result did not provide equivalent information.

## Change and preservation

Newly resolved generic relationship effects identify the full name of the
actual person linked to the persisted relationship ID, followed by
`· relationship`. An effect concerning two other people identifies both names.
Names are ordinary literal text: quotes, dollar signs and token-like substrings
are not substituted. Relationship changes still use the existing capped
before/after difference and its actual tone.

No effects, choices, eligibility, people, money, random draws, narrative copy or
result IDs change. Existing bound decisions retain their stored participant IDs
and narrative. An already saved result retains its original rows; loading or
rendering never recalculates its copy. The genuine native workplace result76
still has its original two `Relationship` rows through load and acknowledgement.
Original fixture bytes are not regenerated or edited.

The adjacent generic stat, skill and school-grade paths already report actual
capped differences. Stress tone correctly treats a reduction as positive.
The transfer path posts the quoted minor-unit amount to both real accounts in
the same command; the current 250 authored situations do not produce generic
transfer effects. This audit found no additional grounded change in those paths.

## Focused verification

All 35 tests in the five focused suites pass in 16.299 seconds:
`story-consequence-labels`, `story-consequence-labels-flow`,
`story-callback-flow`, `childhood-story-flow` and `story-callbacks`.
Strict application and test typechecks and `git diff --check` also pass.

The new engine tests check two real school bonds, positive and negative bounds,
neutral +0% rows, actual capped stats, literal names, unchanged RNG/money/people,
cold results and preservation of the genuine older result.

A connected component/SQLite test uses normal Age Up to select and bind the
school scene. A failed receipt write rolls back all eight tables and retains the
decision. Warm retry uses the same repository without checkpoint unpacking;
the saved named result remains exact across cold bootstrap, and acknowledgement
cannot apply either bond again. The event-stream seed used to select this scene
is explicit test setup, not a claim of a natural native journey.

The isolated change retains its base version tags. Root integration owns the
next engine version, consolidated regression and native acceptance. These
focused checks do not establish physical-device layout, performance or release
acceptance, and the situation catalogue remains at 250.
