# Compact transaction checkpoints

The natural family runner reproduced an Age Up failure after 91 calendar years:
the next world exceeded 20 MB, predominantly repeated ledger field names and money
wrappers. Checkpoint v4 records those field names once and stores transactions
as ordered arrays. Cash/debt deltas remain exact signed decimal strings; loading
reconstructs their original BigInt representation before full world validation.
No transaction, person, random stream, financial fact or historical year is removed.

Unchanged certified ledger and people blocks remain reusable. The cache signature
includes the columns, so a v2/v3 object block can never be reused as tuple data.
The first real command after an old load converts ledger blocks; subsequent cold
v4 loads prime reusable blocks only after the entire world passes validation.
Small worlds still use v1. All previous formats remain readable under their
original 20 MB decompression / 28 million-character payload limits.

V4 bounds the complete decompressed compact representation to 32 MB, its encoded
payload to 44 million characters, and reconstructed canonical expansion to 80 MB.
Gzip output sizes/checksums, descriptor totals, row widths, unique columns,
person identities and block lengths are checked. Expansion is bounded before
constructing transaction objects. The full-world decoder keeps its old 20 million
character default; only this bounded v4 path requests 80 million. This is capacity
handling, not a guarantee that the largest allowed input is fast on every device.
Database reader 8 protects new frames from older apps without eagerly rewriting
existing current, backup or history payloads.

The exact pinned natural year 91 v3 save now advances beyond 20 MB. Its SQLite check
covers reader migration failure/retry, commit failure/rollback/retry, exact old
backup and Before Age Up payload bytes, cold current/recovery and acknowledgement.
Additional codec checks cover huge signed money, Unicode/escaped strings, nullable
references, old-to-new cache isolation and well-checksummed malformed tuples.

The unchanged normal-command family driver now reaches three natural deaths at
ages 86, 79 and 83, across 2072 calendar months (172 years 8 months). All 43 cold comparisons,
173 original annual payloads/metadata and 892 receipts remain exact. The final world
is 30,686,073 canonical bytes, 48 people and 96,979 transactions. It is a cloud SQLite
journey, not a native journey or a population stress case.

The complete acceptance is still open: database+WAL+SHM reaches 162,931,384 bytes,
and exporting its retained history exceeds the existing 64 million-character archive
limit. No save command failed in this run; the final archive step did. The driver
correctly exits 1. [Raw evidence](verification/family-storage-tuples-20261020/)
retains both outcomes. A read-only lossless fragment estimate finds 20,474,197 unique
UTF8 bytes within 149,837,207 original snapshot-payload bytes. This estimate is not
an achieved database budget. Next share repeated retained blocks, preserve exact
original payload reconstruction and measure the real database again.

Final verification: all 1,457 tests / 106 suites, strict application/test types,
fresh Android/iOS Hermes exports and the same 120 immutable lifetime seeds pass.
Every complete terminal-world hash/metric matches content seven. A serial action
pair preserves all 14 inputs and four stress outcomes, with 70 warm samples per
source avoiding full decode. Actual Android routine 90 / cold 90 / acknowledgement
91 retain exact whole worlds, old backup bytes and all prior history; its migration
timing is explicitly scoped in the native record. [Source and complete gates](verification/compact-transactions-20261020.json).
