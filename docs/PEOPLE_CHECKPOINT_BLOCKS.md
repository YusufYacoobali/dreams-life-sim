# Reusing unchanged people in compressed checkpoints

Larger saves previously compressed every person's data again for an ordinary
button press. The new v3 frame keeps the changing world body, groups of up to32
people and the existing512-row ledger blocks separate. Small worlds with fewer
than512ledger rows and at most32people keep the original v1 path. Readers still
accept original plain worlds, v1 and v2 frames; saved historical payloads are
never converted in place.

People compression uses the exact serialized block text as its key. Any changed
field invalidates that block. The cache keeps at most64entries and8MiB of estimated
retained text/compressed-string weight, plus bounded object overhead. Only fully
validated frozen data primes it. Read-only previous-life/recovery previews can
freeze their worlds without displacing the active life's people blocks. The
repository's authoritative world/payload cache still updates only after durable
commit. Compression memoisation never publishes game state.

The reader bounds combined uncompressed size before allocating, checks each
block's declared length/fingerprint and validates object/array framing, block
lengths and duplicate person IDs. It reconstructs the complete world and runs
all existing shape, financial and cross-system checks before priming caches.
Untrusted mutable/frozen inputs do not gain certified status. Size limits remain
20MB per world and28MB per checkpoint payload; cache reuse never bypasses them.

Database reader7 protects v3 frames from older applications. The upgrade retains
all old current/backup/history rows until a real save. Failure leaves the reader
marker and every row unchanged. Even older moments with missing metadata retain
their original compressed payload when their summary is reconstructed. Current
world30/engine29/content6 and simulation results are unchanged; the current
120-seed engine gate still applies to its exact unchanged game source.

All **1,409 tests / 102 suites** pass in **825.637 seconds**, strict application/test types and both fresh Hermes exports.
Twenty-two new codec checks cover empty ledgers, selective recompression, cold
priming, read-only previews, cache eviction, malformed/corrupt frames, validation
before cache priming, atomic upgrades, missing metadata and genuine mixed-format
archives. The initial full run caught only a stale DB6 preference assertion;
its correction and complete clean rerun are retained in the evidence.

| Cloud engine + SQLite case | Before median | After median | Current payload before / after |
| --- | ---: | ---: | ---: |
| 100-known-contact routine | 25.86ms | 25.85ms | 230,482 / 236,286 bytes |
| 100-known-contact first Age Up step | 61.34ms | 62.82ms | 250,477 / 256,173 bytes |
| 1000-known-contact routine | 178.00ms | 112.17ms | 453,495 / 515,635 bytes |
| 1000-known-contact first Age Up step | 459.85ms | 462.99ms | 557,747 / 621,971 bytes |

The fixed driver compares isolated e8a9097 against this codec serially after
validation jobs close. All11inputs and four entire stress outcomes match. All55
warm samples per source avoid full checkpoint decode; every cold current/backup
and original Before Age Up payload is exact. Generated-at-once known contacts
are a cloud stress setup with the existing coarse NPC model. Five samples/case
do not establish physical p95. Current/backup sizes include format overhead.
The 1000-contact routine is about 37% faster with a 14% larger payload. Annual
progression changes many people and gains little in this comparison. The smaller
100-contact routine is effectively unchanged; this is not a uniform speedup.
[Raw comparison](verification/population-people-blocks-comparison-20261020.json).

Actual Android retains all eight tables through reader6→7/cold/browsing/draft.
Normal routine result80 writes v3, keeping original v2 backup79 and all14ledger
blocks exact. Cold80 retains every table; acknowledgement81 keeps the exact
whole expected world, people/ledger blocks and original v3 backup80. All four
inactive lives/backups,36old moments/metadata and67old receipts stay exact.
[Native captures and proof](verification/android24-people-blocks-20261020/),
[source and complete checks](verification/people-blocks-20261020.json).

This changes internal save representation, with no new importing, sharing or
exporting UI. Physical/native p95, complete120-year/three-generation history below
50MB and broader production release gates remain open.
