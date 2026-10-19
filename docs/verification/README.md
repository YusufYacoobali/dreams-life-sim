# Recorded development diagnostics

These machine-readable records preserve measured cloud results and their scope.
They are not native-device, visual, storage-budget or complete-game acceptance.
See [PERFORMANCE.md](../PERFORMANCE.md) for interpretation and the open gates.

- `checkpoint-base64-20261019.json` compares the exact old/current decoder on the
  same input and records 10,000 differential cases. It measures base64 only.
- `history-content3-20261019.json` records one actual current-content history,
  UTF-8 world size and compressed checkpoint payload totals. Its 120-checkpoint
  projection repeats the largest observed payload and excludes SQLite overhead.

The referenced source commit identifies the game/codec implementation. The
history tool's optional snapshot output and corrected byte-count diagnostic were
added while recording its result. Saved worlds, RNG and gameplay did not change.
