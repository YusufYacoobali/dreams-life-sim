# Combined polish and mini-game verification

The completed [reference polish](../product-polish/README.md) and
[Life/relationship polish](../next-polish/README.md) are merged with the two
published mini-game commits ending at `c9fe858`. Runtime source is pinned to
merge commit `047ce13`; subsequent verification documentation and test-only
corrections do not change the runtime.

Current markers are **World44 / engine46 / content23 / reader24 / SQLite v4**.
The reader distinguishes both World42 variants by their complete marker tuple:
`42/44/20` retains published mini-game sessions; `42/44/21` retains rental
leases. Personal support saves at `43/45/22` retain their offers, loans, action
history and leases. New prospective histories are empty. Current missing
histories and corrupt published session envelopes are rejected.

Fifteen new migration cases exercise active and completed sessions, literal
inputs/seeds/scores, applied modifiers, burglary reservations and one-time
settlement, paid leases and a saved actionable loan offer. The review tracker
also rejects a claim during a running session without changing its schedule.
Reader upgrades remain marker-only, including reader23; historical archives,
registered digests and frozen source policies are preserved.

## Checks

- App and all-test TypeScript checks: passed.
- Runtime import graph: 456 modules, no cycles.
- Third-party inventory: current, 31 direct dependencies, zero installed-version
  mismatches; 1,069 project art files referenced.
- Complete Jest regression: **275 suites / 3,527 tests passed**, no failures
  or skipped tests, in one full invocation (740.158 seconds). No corrections
  or follow-up runs were needed. See [test record](test-summary.json).
- Final offline Android/iOS Hermes exports: passed. All 158 changed runtime
  sources match both source maps exactly; all 41 changed artwork/audio files
  are bundled byte-for-byte (8,621,815 source bytes). See
  [bundle evidence](offline-bundles.json).

Existing browser component-tree captures remain in the linked batch reviews;
the upstream mini-game captures are retained under
[mini-game review](../minigame-overhaul-20261022/README.md). These are browser
renderings, not Android/iOS device captures. This environment has no Android
SDK, iOS simulator or connected device; native rendering/performance and actual
store-sheet presentation were not exercised.
