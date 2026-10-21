# Authored annual event rarity

Specification sections 4.1 and 4.4 require weighted appearance and distinct common, uncommon, rare and extremely rare events. The annual selector previously chose uniformly from every eligible template. This change adds an authored rarity field and version-one relative weights:

| Authored tier | Relative weight per eligible template |
| --- | ---: |
| Common, including omitted metadata | 100 |
| Uncommon | 25 |
| Rare | 5 |
| Extremely rare | 1 |

These are relative weights within the actual eligible pool, not absolute annual chances. Different ages, existing people, household, activities and cooldowns change the pool. The existing 78% offer guard still allows quiet years. A first birthday still guarantees the same original uniform introduction pool and exactly the same event-stream draw as before.

The caller performs existing eligibility checks before weighting. Selection reads no world state and creates no participants or outcomes; it uses one supplied integer draw from the already saved `events` stream. The `npcs`, `outcomes` and `economy` streams are untouched by selection. New authoring does not override age, local availability, school/work/family context, callback-origin exclusions or the five-year recurrence rule. Story selection adds one bounded pass through the already eligible catalogue only at annual selection, with no UI rendering, save-decode or per-button work.

The first implementation commit retains 250 situations and 750 choices. Twelve existing occasional situations are uncommon: classroom volcano, tree audition, mascot petition, secret language, label swap, yearbook proof, family interview, reply-all mistake, mistaken organiser badge, uncertain film memory, old competition and a parrot's perfectly timed interruption. Temporary childhood shop separation is rare. The remaining 237 are common. Only metadata changes; their authored narrative, choices, effects and identities remain exact. The extremely rare tier is supported but has no authored situation in this first selector commit; the separately reviewed single adult scene is a subsequent content increment.

Rarity belongs to source authoring and is not added to saved pending events. Existing bound choices/results, journal entries, effects and history are never looked up or rebound. Future unbound annual selections intentionally use the new weights. Original historical source tags, fixtures, producer hashes, counts and observation cohorts remain unchanged.

The coordinator owns future World 36 / engine 37 / content 12 / reader 16 consolidation. This branch does not edit model, migration, create-life, repository, global tags or frozen C36 source. School's separate callback work owns the scheduled-story binding hunk; this branch owns the annual picker and disjoint rarity annotations.

Focused coverage includes exact per-tier integer spans, all positions of a genuinely archived eligible pool, absence/cooldown preservation, invalid-pool/draw refusals, actual SQLite birth with unchanged first-year selection, and genuine saved month-twelve annual continuation with the same quiet-year guard and precise draw count. Existing collision and capped-consequence suites provide original bound-scene/result proofs.

The selector commit passes 20 tests in three focused suites, 24.849 seconds; process 48601 actually closed with exit 0. Sequential strict application and all-test TypeScript checks also actually closed with exit 0 (74720). Logs are `/tmp/dreams-event-rarity-focused-attempt1.out` and `/tmp/dreams-event-rarity-types-attempt1.out`. No failed attempt, broad regression, new policy cohort, export or native command was run by this slice. The original 250 narratives/choice copy, projected in source order without eligibility/rarity metadata, has SHA256 `3bcaeee8d5d03b0710cf9a96d0dff6cb53b182f452bc8f52c9a85e5c26be6d01`; the subsequent single-scene content test preserves this exact projection.

## Separately reviewed extremely rare scene

The next content commit adds exactly one adult local situation, `adult-accidental-living-exhibit`: while reading a map at a free community art display, the player is mistaken for a living exhibit. Its three distinct choices explain honestly, briefly play along before explaining, or invent an explanation that becomes awkward. Only modest existing happiness, respect, stress and energy changes apply, with actual caps. Anonymous background visitors create no persistent people, contacts, roles, fame, awards, qualifications, items, payments or income.

Current authored counts become 251 situations / 753 choices: 237 common, 12 uncommon, one rare and one extremely rare. Every original 250 narrative and choice remains exact under the same pinned copy projection. Historical 250-situation observations, their counts and raw fixtures remain unchanged. The extremely rare scene has relative weight 1 only when the existing adult/local eligibility rules permit it. It cannot enter the first-year introduction pool, and is unavailable during the genuine tested hospital stay.

New-scene tests are explicit domain bindings against the recorded graduate context, with declared upper/lower stat boundaries. They verify all three capped outcomes, exact decision/result codec continuation, no unintended stat/person/account/record changes, one acknowledgement and duplicate refusals. They do not claim a natural sighting of this extremely rare scene, a new life/country seed, native play or full-life SQLite acceptance.
