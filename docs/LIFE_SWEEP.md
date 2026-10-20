# Production-state lifetime invariant sweep

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

A requested 1,000-case run is **incomplete until** its completion record reports
all 1,000 distinct seeds, unchanged source hashes and successful exit. Partial
progress and overlapping preflight cases do not establish this gate or a new
whole-Jest regression total. The complete 1,226-test / 80-suite result remains
scoped to `e5a4aaf`; native/production acceptance and conservative baselines stay
open. Continue independent UI/reference work while the game source is fixed.
