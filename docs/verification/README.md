# Recorded development diagnostics

These machine-readable records preserve measured cloud results and their scope.
They are not native-device, visual, storage-budget or complete-game acceptance.
See [PERFORMANCE.md](../PERFORMANCE.md) for interpretation and the open gates.

- `button-latency-20261019.json` preserves every controlled before/current/
  first-v1-write sample, identical input hashes, cold world-load scope and bundle
  evidence. `action-latency-inputs-v25-20261019.json` retains the two original
  mature snapshot payloads byte-for-byte rather than generating fake mature lives.
- `sqlite-history-v27-responsive-20261019.json` compares the whole current,
  backup and all 79 prior worlds, matching metadata/receipts and actual storage
  costs before/after the responsive-save change. Its full-life timing runs overlap
  other checks; use the separate controlled action comparison for timing claims.
- `leisure-immutable-v27-20261019.json` records all twelve complete country-specific
  journeys through the validated immutable production path, current terminal
  world hashes, exact cold worlds and matching previously recorded semantic fields.
- `restored-save-responsiveness-20261019.json` records 130 affected checks for
  prepared import/recovery/branch states, metadata-corruption safeguards and the
  genuine `8de01d7` mixed-v1/v2 archive. The complete 1,157-test result remains
  scoped to `8de01d7`; these overlapping checks are not a new full regression.

- `android29-system-ui-anr-20261019.png` is an actual pre-game OS failure
  capture. `android29-opening-20261019.log` preserves selected native log lines;
  [the attempt](../NATIVE_OPENING.md) did not establish playable opening UI.

- `life-sweep-v25-120-20261019.json` records the completed 1,994.655-second world25/content3 sweep, every seed and the unchanged game hash.
- `display-settings-20261019.json` records 107 connected UI/state/persistence checks, actual preference failure/retry and independent save archives, plus native configuration introspection. It is not a native rendering pass.
- `scholarships-v25-20261019.json` records the complete 983-test/64-suite checkpoint, actual SQLite aid journey and frozen game-source hash. Its twenty story drafts remain unintegrated.
- `sqlite-history-v25-20261019.json` records the current scholarship-world default-choice repository life (236 commands / 79 moments), scoped separately from the connected aid journey.
- `education-recovery-v24-20261019.json` records the clean 938-test/62-suite
  world-24 checkpoint, actual SQLite recovery journey and its exact source hash.
- `life-sweep-v24-120-20261019.json` records every current-world seed (0–119),
  unchanged source hash and the completed 2,040.171-second pure-engine sweep.
- `sqlite-history-v24-20261019.json` records the current-world 236-command real
  repository life, all 79 historical moments, disk sizes and exact cold resume.
- [school-art-20261019.png](school-art-20261019.png) records browser compositing
  of the original six-subject PNG at 48/128px on light/dark cards. It is not a
  native app capture.

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
