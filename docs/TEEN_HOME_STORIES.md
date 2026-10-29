# Early-teen home situations

Content five adds ten distinct situations and thirty choices, bringing the
source catalogue to 100 against the minimum of 250. They cover an old childhood
recording, growing out of clothes, stopping a game, a parent's phone interruption,
repeated message checking, returning a charger, revisiting an old drawing,
preparing a meal together, an unclear voice message and an overfull evening plan.
They are in [teenHomeStories.ts](../src/game/content/teenHomeStories.ts).

The situations use existing bounded stats and parent bonds. They create no
people, qualification, pay, purchase, debt, hobby practice or callback. Five
physical family scenes require the actual available parent at home. The voice
message explicitly permits remote contact with the saved parent. Four situations
remain independent of a parent. Age bounds and the existing five-year cooldown
still apply; optional year-end selection and first-year pacing are unchanged.

Selection also excludes a callback origin ID already present in saved story
records. Sparse older event history could otherwise offer a duplicate promise
whose choice the existing scheduler correctly rejects. The durable origin
guards both project and arcade families without rewriting their history.

## Existing lives

World 28 / engine 27 remain unchanged; the content tag advances from 4 to 5.
Migration changes that tag after the existing migrations. It does not rebind an
offered choice, rewrite a result or journal, draw RNG, introduce contacts or
retroactively award an effect. New situations enter future selection only.

The actual Android paid arcade result is preserved as
`tests/fixtures/v28-native-arcade-archive.json`. It was exported using isolated,
unmodified `e29e634` source, with its combined source hash checked before use,
from the original native revision-34 database copy. Its current payload and all
twelve original v1/v2 moment payloads/metadata are byte-exact. No newer game
source regenerates that historical input. See
[provenance](verification/native-arcade-archive-v28-20261020.json).

Migration checks compare every field of all thirteen original worlds apart
from the content tag, including the saved native currency text, actual R75
payment, accepted permission and random state. Real SQLite acknowledgement
failure/retry/cold-load checks keep the paid outcome and process the actual
remaining eleven months without charging the outing again.

## Verification scope

Every new choice runs in all twelve countries with actual bounded effects,
round-trip/replay checks and no render-time mutation. Additional cases check
zero/100 stat and bond bounds, both age boundaries, cooldown and physical versus
remote parent context. The complete **1,285 tests / 91 suites** pass in
**713.383 seconds**, strict application/test types and both fresh Hermes exports
pass. All **120 distinct current-source immutable lifetimes** pass in **643.205
seconds**, across twelve countries. Every terminal world/metric matches the
same pre-hardening case; overlapping runs do not add distinct cases.
[Source, checks and bundles](verification/teen-home-content5-20261020.json)
and [raw complete regression](verification/regression-content5-20261020.txt)
retain the final source hashes.

Actual Android continuation from the earlier prepared life reaches the new
phone-at-dinner scene at sixteen. Final-source cold decision/result preserve
every table; choice 46 and acknowledgement 47 match entire expected worlds.
The earlier annual replay matches simulation fields with explicitly recorded
native currency-spacing exceptions. All prior lives/history stay exact; the
old outing remains charged once. [Native provenance and limits](verification/android24-teen-home-20261020/)
distinguish the original scene offer from final-source cold/choice checks.
Fresh current-source engine/SQLite diagnostics retain **78.65 ms** median for
the age-60 routine and no full checkpoint decode in all 35 warm samples.

The earlier 1,000-seed lifetime pass belongs to content four. A later content
update needs current-source evidence; it cannot inherit that pass as if its
source hash were unchanged. The 250-template minimum, broader stories, balance,
editorial/release review and physical/standalone/iOS gates remain open. Story
counts are not an overall game-completion score.
