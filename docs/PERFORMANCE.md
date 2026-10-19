# Performance evidence and open gates

These are cloud diagnostics, not native-device acceptance. Re-run after the remaining systems/content are integrated and measure actual iOS/Android hardware before release.

## Reproducible core-life sweeps

`npm run test:soak` requests 120 complete seeded lives. Use
`npm run test:soak -- 1000` for the larger release sweep, or an explicit count
from 1 to 1,000 for harness diagnostics. The engine test budget now scales with
the requested count (at least 15 minutes, otherwise two minutes per life).
Expanded runs print the seed, completed/requested counts, age at death, world
size and per-life/cumulative elapsed milliseconds after every completed life.
The wrapper rejects invalid counts and propagates failures.

Changing the harness is not a completed sweep. The current 120/1,000-life gates
remain open until their measured results are recorded here. These core-life
choices also do not replace the connected career/family/custody/legacy matrices.

## World-23/content-two diagnostic, 19 October 2026

The current harness was checked with one complete seeded life (25.350 seconds
inside Jest, seven engine checks passing) and invalid CLI input. This establishes
the configurable count and failure path, not the expanded sweeps.

The separate history benchmark completed 79 annual observations, with death at
78, 17 people and 33,604 ledger rows. Its largest encoded world was 10,561,992
bytes; compressed checkpoint payloads totalled 20,764,622 bytes. Repeating its
largest checkpoint 120 times projects **68,528,880 bytes**, above the planned
50 MB history budget. This is a projection, not an actual 120-year or SQLite
storage measurement. Current live/backup rows, WAL pages and assets are additional.
The history/storage release gate remains open.

Cloud p95 timings were 125.9 ms for Age Up, 330.9 ms for packing and 496.0 ms for
decoding/validating. This run overlapped regression/Metro activity and uses a
different workload from the older baselines below; it is not a controlled timing
comparison or evidence of native responsiveness.

The content-three checkpoint starts a separate 120-life sweep, with unchanged
game-source hashes recorded at startup. It is in progress, not an accepted
result. Both sweep/history drivers now choose an actually available option,
so low funds cannot make them select a disabled attendance/payment choice.

`node tools/benchmark-history.cjs` runs one deterministic current-engine life, taking/restoring a compressed full-state checkpoint before every Age Up. The 18 October 2026 run used Node 24 in this cloud workspace:

| Observation | Result |
| --- | --- |
| Annual observations/checkpoints | 93 |
| Final age | 92 (death within the last interval) |
| People / ledger rows at death | 5 / 7,001 |
| Largest encoded world | 2,086,157 bytes |
| Sum of compressed checkpoint payloads | 5,916,093 bytes |
| 120 copies of the largest observed checkpoint | 12,254,520 bytes |
| Age Up resolver p95 | 12.2 ms |
| Checkpoint pack p95 | 52.8 ms |
| Checkpoint decode/validate p95 | 72.9 ms |

The 120-checkpoint projection deliberately repeats the largest observed payload. It is not a simulated 120-year world or a three-generation workload. Payload totals exclude metadata, SQLite/WAL page overhead, live/backup rows and artwork. The compression result supports the current implementation choice; it does not establish the planned 50 MB history budget for the complete game.

Checkpoints use deterministic gzip with an output-size cap and a content fingerprint, preserving the complete world/RNG/pending decision. The fingerprint detects damage; it is not an authenticity signature. Local archives contain the current checkpoint, compressed history and branch origin. Import validates the complete archive before replacing local data.

Open gates include a fully integrated 120-year/multi-generation world, a 1,000-person performance case, large-archive import responsiveness, SQLite/WAL/storage measurements, low-memory devices, and actual native p95 interaction/year targets. The broader 1,000-seed and three-generation release matrices remain unrun.

After health/NPC clinical care was integrated, the same seed produced 78 annual observations, death at 77, ten people and 13,980 ledger rows. Its largest world was 4,130,069 bytes and checkpoint payloads totalled 7,966,330 bytes. Repeating the largest checkpoint 120 times projects 26,067,960 bytes. Cloud p95 timings were 22.5 ms for Age Up, 99.1 ms for packing and 133.9 ms for decoding/validating. Different health outcomes change both lifespan and workload; this is evidence of growth, not a controlled speedup/regression comparison or native acceptance.
