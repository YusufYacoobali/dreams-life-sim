# Annual advancement: checkpoint 9 evidence

The confirmed change is immediate saving feedback on Life's annual button. Previously `useDelayedBusy` waited 150 ms; a blocked command could then prevent the delayed update from rendering. Life now derives its progress indicator directly from the accepted command's busy state. Duplicate-input guards, the existing UI yield, simulation, validation, checkpoint format and transaction order remain intact.

## Observation

Set `DREAMS_PROFILE_COMMANDS=1` for a development/internal build. `app.config.cjs` disables this capability in public/production builds. Events prefixed `DREAMS_COMMAND_TIMING` contain a process-local trace number, command, age, phase and elapsed milliseconds. They contain no world, names, purchase data or saved identifiers. Observation is off by default; observer failures cannot fail gameplay.

Spans cover press, busy, UI yield, simulation, validation, checkpoint packing, SQLite transaction, review loading and state publication. Life also reports React busy/world commits and subsequent animation-frame opportunities. These JavaScript observations do **not** establish GPU paint, touch latency or native frame duration. Spans overlap; do not add inclusive times together.

## Reproducible diagnostic inputs

`tools/prepare-v2-performance-lives.cjs` uses declared seed 42, an ordinary US birth and actual commands: walking/restful sleep/mindfulness, eligible work, two monthly social accounts, affordable adoption and an affordable possession. Birth acknowledgement mirrors the existing production transition. No later money, health, calendar, RNG or outcome is patched. This declared health/work policy naturally reaches all five target ages; it is not a population sample.

`performance/inputs.json.gz` contains actual checkpoints at ages 18, 23, 30, 50 and 70. `performance/commands.json.gz` retains the command trace. The input file records the game/persistence source digest. Inputs were generated from checkpoint 8 plus the observational wrappers used for the private native comparison build, before the Life feedback change. Historical performance drivers and their pins remain untouched.

An exploratory run of `benchmark-mobile-command-phases.cjs` used those exact worlds, one warm-up and five measured `firstAgeUp` samples per age below, on Node 24.19 with on-disk SQLite. Native compilation ran concurrently, so this is bottleneck discovery only, not a before/after acceptance measurement. The complete samples, source/input/driver digests and exact outcome hashes are in `performance/exploratory.json.gz`.

| Age | Command + save median / p95 | Resolve median | Commit median |
| --- | --- | --- | --- |
| 23 | 44.04 / 44.36 ms | 28.35 ms | 15.68 ms |
| 70 | 156.34 / 158.45 ms | 105.41 ms | 32.51 ms |

Validation and checkpoint packing dominate this diagnostic. It does not reproduce a two-second phone delay. No speculative weakening of validation, history, RNG or save integrity was made, and no simulation speedup is claimed.

## Verification and limits

The renderer/store test holds the real command at the UI yield: Saving your year and the disabled/busy button appear before simulation or SQLite can begin. The pre-change test failed because the indicator was absent; the changed version passes. Repeated taps commit once. Separate on-disk SQLite tests verify complete phase coverage, exact resolver equality, failed-save rollback and retry, including a throwing timing observer. Production configuration tests reject profiling metadata for public builds.

Actual release-mode iOS and physical Android median/p95, visible paint and end-to-end playthrough acceptance remain **open**. Linux has no iOS build/device access and no KVM; a software Android emulator cannot establish physical-device performance. The SDK 58 Android release build is being checked independently. Artwork delivery is tracked in the separate asset manifest.
