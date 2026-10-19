# Recorded development diagnostics

These machine-readable records preserve measured cloud results and their scope.
They are not native-device, visual, storage-budget or complete-game acceptance.
See [PERFORMANCE.md](../PERFORMANCE.md) for interpretation and the open gates.

- `checkpoint-base64-20261019.json` compares the exact old/current decoder on the
  same input and records 10,000 differential cases. It measures base64 only.
- `history-content3-20261019.json` records one actual current-content history,
  UTF-8 world size and compressed checkpoint payload totals. Its 120-checkpoint
  projection repeats the largest observed payload and excludes SQLite overhead.
- `life-sweep-120-20261019.json` records all 120 distinct completed engine seeds,
  unchanged source hash and the 43 matching partial-Jest terminal comparisons.
  The partial Jest run is explicitly not a second completed sweep.
- `sqlite-history-20261019.json` records two real 235-command repository lives
  using plain and compressed live/backup rows. Entire live/backup worlds,
  snapshot bytes/metadata, receipts and preferences match after both runs.

The referenced source commit identifies the game/codec implementation. The
history tool's optional snapshot output and corrected byte-count diagnostic were
added while recording its result. Saved worlds, RNG and gameplay did not change.

`node tools/benchmark-sqlite-history.cjs` additionally runs one real repository
life in a temporary on-disk SQLite database with WAL enabled. Every actual engine
command commits, every Age Up retains its genuine prior snapshot, and the tool
closes/reopens the database to compare the entire world and history count. It
reports live/backup/history payloads, database/WAL sizes and scoped cloud timings.
The temporary database remains available for fixed-input investigation; no app
save is opened. A 79-observation life does not establish the 120-year or
multi-generation storage budget.
