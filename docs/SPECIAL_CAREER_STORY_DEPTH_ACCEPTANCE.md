# Dedicated special-career situations

Source starts at C38 `ace1e38e12ae2493501a30e6f003201e0fd6ab41`.
The [proposal](SPECIAL_CAREER_STORY_DEPTH_PLAN.md) was independently reviewed
before implementation (original document SHA256
`6602a4394f4a952e275c2177fd154a13fcdf8e95d32308e579e55258d8c25b6c`).
Its committed source is `895a5be`; final implementation review is separate.

## Authored coverage and actual context

The fourteen new situations provide two dedicated situations for each of the
eleven special-career paths. The existing generic Creator situation remains
one shared source situation and is not credited twice. The complete source
catalogue is now 265 situations / 795 authored choices, including 23 special
career situations: 22 dedicated and one shared. This closes the specific
[two-per-path requirement](planning/writing-and-events.md#L219); it does not
establish complete coverage of every other content allocation or career outcome.

The separate `specialCareerDepthStories.ts` export appends to the original
251 entries. Every original 250 narrative/choice projection retains SHA256
`3bcaeee8d5d03b0710cf9a96d0dff6cb53b182f452bc8f52c9a85e5c26be6d01`;
the old nine special-career situations and all existing bound payloads remain
unchanged. New entries comprise eight common and six uncommon incidents.
Selection weights, random draws, five-year cooldown and normal annual
scheduling are unchanged; the larger eligible catalogue deliberately gives
these careers more possible situations.

Actor, Model, Athlete, Musician, Politician, Military, Astronaut and Royalty use
their existing actual active-career/employment or public-duty predicates.
Dedicated YouTuber/Streamer scenes require an active local studio, its exact
account ID, the actual owner, matching platform and active account status.
The old shared Creator predicate remains unchanged. Business scenes require
an active company actually owned here by this person. New scenes are local
and adult; the normal age/presence gates exclude minors, death, hospital,
custody, pursuit, trips and service absence. No scene invents a paid recording,
public stream, released work, mission, family member or contact.

All 42 choices change only bounded existing stats (requested magnitude at
most four). They grant no money, company/media/career progress, pay, property,
qualification, fame, position, relationship or generated people. Model wording
was made appearance-neutral after independent review identified bald Models.
The implementation adds no persisted field, migration, command or global tag;
the coordinator owns the later content-version union.

## Focused evidence and limits

The domain setups are explicitly arranged. Six paths use genuine old recorded
Actor, Politician, Streamer, Military, Royalty or Business contexts. YouTuber
creates its actual matching profile/studio at the recorded Streamer context.
Model, Athlete, Musician and Astronaut use the recorded graduate, declared
qualifying stats/skills, and exactly one real selection/application at fixed
outcome state 1. Astronaut's earlier birth year is a declared age arrangement.
No seed search, repeated selection, manufactured career/project/pay record or
new natural birth/cohort is claimed. Old pending/annual boundaries are cleared
only to isolate the new authored incident.

Upper/lower stat boundaries exercise all 42 choices, actual capped effect rows,
complete production checkpoint roundtrips, exact deterministic replay, absence
of other world grants and single acknowledgement. Negative context tests cover
wrong owner/account/platform/status/location, inactive paths, age, absence and
cooldown. The actual raw v28 school decision and v12 career result are compared
directly to their decoded stored pending payloads; old archive codec/replay and
raw SHA checks remain distinct from new-scene acceptance.

One representative file-SQLite UI case binds the new chair sound-check scene
at a genuine recorded Streamer context with an explicit new working-life ID.
The complete old v12 archive is imported separately and remains byte exact,
including its old current/backup, snapshots and branch/history rows. Held
duplicate submission, forced receipt rollback, retained exact scene/error,
identical warm retry with zero full unpack, exact previous-current backup,
all-eight-table equality on a closed/new connection, result rendering and
once-only acknowledgement are required. This is an arranged bound-scene test,
not a natural encounter, actual broadcast, new country seed or native capture.

The first four affected suites actually closed successfully: 66 tests / four
suites, 41.566s, `/tmp/dreams-special-career-depth-focused-first.out` (exit file
`0`). These include the new domain/UI cases and existing rarity/rare-adult
acceptance. No failed focused run occurred.

A separate bounded adjacent command selected the four catalogue-registration,
US workplace and US adult-relationship cases: four tests / four suites passed
in 3.404s, `/tmp/dreams-special-career-depth-adjacent.out` (exit file `0`). Its
281 other cases were unselected by the CLI name filter, not changed to skipped
source or represented as a complete rerun of those suites.

Initial application strict passed. Initial all-test strict then reported only
TS2454 in the new UI test's indirect SQLite connection assignment
(`/tmp/dreams-special-career-depth-types.out`, exit `2`). The correction is a
definite-assignment annotation; it changes no emitted runtime or assertion.
The final sequential application and **all-test** strict checks actually closed
with exit `0` and an empty `/tmp/dreams-special-career-depth-types-final.out`.
The successful focused code differs only by that erased type annotation.

The read-only preservation inventory
`/tmp/dreams-special-career-depth-preservation.json` is 12,873 bytes, SHA256
`b4742d9ad7a1d0db7290fb0339b62f10dc6b0107ea03868357fff1f338739ff4`.
It compares actual Git blob IDs and current bytes to the frozen base: all 49
fixture files (48 JSON plus README), package/lock/app configuration, and the
original nine-scene source are exact. No existing raw fixture, historical
driver/source pin or checkpoint tag is refreshed.

The fourteen new scenes are authored and validated in this branch. Independent
exact-SHA feature review remains separate from proposal/WIP review; these
changes are not a claim that the frozen main build already ships the new scenes.
No full regression, long cohort, device or performance gate is run by this
slice; the coordinator owns combined acceptance.
