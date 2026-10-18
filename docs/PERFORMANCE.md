# Performance evidence and open gates

These are cloud diagnostics, not native-device acceptance. Re-run after the remaining systems/content are integrated and measure actual iOS/Android hardware before release.

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
