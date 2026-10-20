# Production-state lifetime invariant sweep

Current world **30 / engine 29 / content 5** passes **120 distinct seeds
0–119** across all twelve countries through the validated-immutable engine in
**731.299 seconds**, empty stderr and exit zero. Game hash:
`147c545c3af259b1ea88889ff68ca396d76767b9df9c9e7ad4fe9728ad69d737`.
[Summary and all raw cases](verification/life-sweep-raises-120-20261020.json)
retain ages 40–98, max 24 people / 55,199 ledger rows. Ordinary-life metrics
match the same prior workplace seeds; schema and terminal hashes change.
Overlapping runs do not create additional distinct cases.

The first-eligible policy does not introduce optional workplaces or request
raises. Separate domain, SQLite/UI and native checks cover those actions/payroll.
The complete current regression passes **1,356 tests / 96 suites**. There is no
current-source 1,000-seed claim. Earlier [world-29](verification/life-sweep-workplaces-120-20261020.json)
and [world-28/content-five](verification/life-sweep-content5-120-20261020.json)
120-seed records remain historical.

## Earlier content-four 1,000-seed gate

The earlier world-28/content-four run **passes all 1,000 distinct seeds 0–999** through the
production validated-immutable API, across all twelve countries, in
**5,030.819 seconds**. The actual completion record is present, stderr is empty
and the process exits zero. Game and runner hashes stay unchanged. The
[completion record](verification/life-sweep-v28-1000-20261020.json) and
[all raw cases](verification/life-sweep-v28-1000-20261020.ndjson) preserve exact
terminal-world hashes. This closes that scoped content-four engine gate.

`node tools/run-life-sweep.cjs 1000 0 --immutable` exercises seeds 0–999 through
actual birth-to-death engine progression using the validated immutable state path
used by the production store. Without `--immutable`, the existing mutable domain
API remains available for comparisons. The two policies select the same first
eligible decision and acknowledge/resume each actual pending year stage.

The preflight runs complete seeds zero and one through both APIs and compares
entire terminal-world SHA-256 values, versions, command counts, age, people and
ledger rows. Both match exactly. Five invalid CLI argument cases are rejected
before simulation. [The full comparison](verification/life-sweep-mode-comparison-20261020.json)
retains both runs; these two seeds overlap the requested larger run and are not
four additional distinct cases.

## Checks and records

Every command uses the real resolver/invariants. Each year is checked, and each
life must reach an actual death with a cause and factual journal, no open annual
frame or pending event, within the existing 150-year safety limit. Each completed
seed records its actual country, world/engine/content versions, command count,
terminal whole-world hash and size metrics. The full seed range must cover all
twelve supported countries. Lifespan variation is checked for larger batches.

The runner checks both game-source and tool-source hashes at completion. Game
hashes here use TypeScript paths relative to `src/game`; other diagnostic tools
use repository-relative paths, so hashes from different algorithms are not
interchangeable. UI/documentation changes do not alter the tested game source.

A failure stops the run and retains its seed, command trace, source hashes,
error and encoded last valid world in `/tmp/dreams-life-sweep-failures/`. A
creation failure resets the trace/world first, so it cannot report the previous
seed as its starting state. Diagnostics are labelled current-run engine data,
not historical migration fixtures. Source-change failures remain explicit.

## Scope and remaining gates

This is a pure-engine cloud check. Its existing setup marks the newborn
acknowledged before engine progression; it does not exercise the UI/store birth
command. It uses first eligible choices and does not cover every branch, every
optional career/action, native rendering, SQLite durability, 120-year survival,
1,000 simultaneous people or multiple generations. The separate native/SQLite
journeys and twelve real work/pet/dual-hobby country lives retain their own scope.
No historical fixture is regenerated or retagged.

The completed run reaches ages **25–102**, at most **26 people** and **61,778
ledger rows** in one world. It does not establish the separate 120-year,
1,000-person or multi-generation budgets. The supported countries have 63–90
completed cases each. All 1,000 versions match world 28 / engine 27 / content 4.

Future changed-source runs remain incomplete until their actual completion
record, distinct seed set, unchanged source hashes and successful exit are
verified. Partial progress or overlapping preflight cases do not establish a
new gate or whole-Jest regression total. The earlier complete 1,226-test / 80-suite result
remains scoped to `e5a4aaf`; native/production acceptance and conservative
baselines stay open. Continue the full production plan from this verified state.
