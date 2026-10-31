# Mobile performance overhaul

Baseline: `8ba6ba14` on `v2`. Runtime/test changes are frozen at `ffc7d828`.
This is a performance-only change: gameplay/content, RNG order, pacing, money,
characters, journals, purchases, UI/navigation and saved formats are retained.
Installed-device performance acceptance remains open: no Android/iPhone device
or iOS simulator is available. Node and test-renderer results are reported with
that narrower scope.

## Audit and selected changes

[The baseline audit](verification/mobile-performance/baseline.md) measured the
five published natural ages, enabled/active lifestyle variants, a real second
generation, ordinary available actions, save reopening, state publication,
projections and five screens before runtime changes. The dominant measured costs
were transaction certification, repeated decoding and temporary expanded JSON.
Monthly simulation was much smaller. Existing virtualised journals/relationships,
statistics memoisation, WAL, bounded chunk caches and busy-before-work feedback
are preserved.

The implementation has three coherent changes:

1. **Ledger certificates describe an immutable branch.** A ledger's existing
   private certificate proves its shape only after full world validation and
   recursive freezing. A working copy can reuse a row only at the exact position
   of that privately certified source. Appended/replaced/moved rows are parsed;
   imports and frozen lookalikes have no certificate. Every balance, reference,
   chronology and cross-system integrity check still runs. Parsed arrays keep no
   provenance link, so they cannot retain a chain of older ledger arrays. This
   removes the large per-row WeakSet without introducing saved state or an
   append-only incremental financial index. Lazy position lookup builds its Map
   directly instead of allocating an intermediate array of entry pairs.

2. **V4 decoding avoids the expanded JSON round trip.** Verified tuple/person
   blocks build the parsed input graph directly. Money restoration, migrations,
   schema and whole-world integrity checks use the same shared decoder as plain
   saves. Frame sizes, expansion limits, gzip checksums, columns, duplicates,
   block lengths and bigint bounds remain. The former tuple JSON negative-zero
   normalization is preserved. Existing chunks prime caches only after complete
   validation. Packing, compression settings and v1–v4 formats do not change.

3. **A warm load proves that the actual stored bytes are unchanged.** The
   repository still reads SQLite's payload and revision. It reuses its one
   privately certified current World only when life ID, revision and payload
   bytes all match. Every mismatch decodes and checks metadata normally. Preview
   does not displace the active cache. Commit retains the payload integrity read,
   exact original backup/snapshot bytes, transaction boundary, receipt ordering
   and failure/retry behavior. Durable success is never published early.

## Evidence and limits

The final controlled ordinary-life measurements reduce cold decode medians by
28–41% across ages 10–90. At age 70/90, full-year SQLite command p95 falls from
346/744 ms to 181/424 ms in the Node workload. Eleven-sample alternating
engine/checkpoint pairs show about 30%/24% lower full-year p95 at those ages;
first-command tail improvements are less consistent. Every result, including
small unchanged/slower young-life profiles, remains in the comparison.

The isolated position-index profile reduces temporary allocation from 10.49 MB
to 5.86 MB. The final finite memory workload records 32 life switches followed by
137 persisted commands across 19 natural year sequences, preserving every
history and outcome. Node process lifetime RSS high-water is about 15% lower;
retained-heap drift and its limits are reported rather than relabelled as native
peak memory. Packing/compression is unchanged; no universal packing target or
mobile memory target is declared achieved.

The complete frozen regression passes **394 suites / 6,976 tests**, alongside
the separate 120-life soak, strict types, import/notice checks and both final
Hermes exports. Final controlled/interleaved reports, p95 figures, memory-churn
observations and exact source/soak provenance are recorded in
[after.md](verification/mobile-performance/after.md) and
[comparison.json](verification/mobile-performance/comparison.json). Expected
historical hashes and fixture contents are never rewritten to obtain a pass.
Independent baseline/candidate checks include exact canonical and packed bytes
for ordinary, lifestyle, enhanced-creative and earlier crime/prison/romance/
escape histories. No history is truncated and no life is shortened to improve a
timing. Active late-life mortality is compared only against the same input and
command sequence, not against a different ordinary year's duration.

The existing screen design already avoids several requested problems. Life and
Relationships retain their virtualised lists, variable-height content and
Android clipping protection; statistics already memoises by world/person. A
warm repository read now also preserves World identity, allowing those existing
selectors/memos to avoid redundant work. No new cache framework, broad screen
rewrite, fixed row height, dependency or loading screen was justified.

The existing store yields after publishing busy state. Cooperative simulation
was optional and conditional on visible device stalls; no native evidence is
available to establish that need. The synchronous resolver and one atomic final
save remain. There are no partially published months, extra logical commands,
additional transactions, changed interruption boundaries or extra RNG draws.

## Regression risks

Shape-certificate bugs could hide a changed row or retain an old history: targeted
checks cover prefix reuse, changed shapes/money, duplicate/undefined rows,
reordering, wrong-field borrowing, frozen forgeries and original-world isolation.
Cold-decoder bugs could change values or weaken rejection: tuple/canonical tests
cover malformed frames, size limits, Unicode, large signed money, original
chunks, negative zero and legacy round trips. Warm-cache bugs could hide an
external write: real SQLite checks cover same-revision changed/corrupt bytes,
metadata mismatches, stale writes, failed commits and exact receipt retry.

Release-mode device tap feedback/completed-save latency, JS/UI frames, scroll
smoothness, native memory and cold launch remain **unverified**. Successful
Hermes exports and Node speedups do not close that gate. Raw reports distinguish
operation-boundary heap samples, process-lifetime RSS and retained post-GC heap;
none is relabelled as native peak memory or a guarantee for every session.
