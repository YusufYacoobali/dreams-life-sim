# Button responsiveness

The user reported seconds of delay on ordinary actions and “Saving” appearing
under unrelated controls. This milestone addresses the action/save path, loading
feedback and unnecessary work in hidden screens. World/engine/content versions
remain **27 / 26 / 4**; database **5** permits the new checkpoint representation.

## Action and storage work

The application still publishes a changed life only after its SQLite transaction
commits. Failed writes retain the previous visible world and RNG; the global
submission guard still rejects rapid duplicate actions. No delayed/background
autosave window was introduced.

The create/load/command path uses fully validated, recursively frozen worlds.
Import, explicit recovery and restored branches prepare the same state/cache
before returning, so their next action also avoids an unnecessary decode.
Only these in-process objects receive an identity certificate. Their append-only
ledger rows can be shared when making a mutable working copy. New/mutable rows
still pass the transaction schema, and the resulting world still passes all
cross-system invariants before it can become a certified snapshot. Cash/debt
totals, account/currency references, transaction lookup and category indexes are
shared only when every frozen transaction reference matches. Changed balances,
references, duplicate IDs and missing debts remain checked on every output.

Command routing validates the selected command rather than creating errors for
all twenty-five unrelated command families. Cold decoding uses plain JSON parsing
and visits containers to restore exact bounded bigint markers, retaining the
original malformed-marker rejection even in fields subsequently stripped by the
world schema. This avoids a JSON reviver callback for every primitive field.

The repository retains one immutable current checkpoint and compares its exact
payload, life ID and revision with the row read inside the transaction. A changed
or damaged row cannot be hidden by that cache. SQLite copies the previous live
payload into the backup internally. Pre-Age-Up history can retain those already
validated compressed bytes instead of decoding, validating and recompressing
them again. The live state, backup, snapshot metadata and command receipt still
commit or roll back together; the cache advances only after success.

## Checkpoint compatibility

Small worlds retain checkpoint-v1. At 512 ledger records, new writes use
checkpoint-v2: a compressed main document and independently compressed blocks of
512 transactions, with a final shorter block. Unchanged certified blocks reuse
their exact compressed representation. Changed/new rows invalidate the matching
block. Cold loading primes reusable blocks only after full validation, matching
versions and row counts.

The combined inflated parts remain bounded below 20 MB, including framing
allowance; each block has the original gzip-size and fingerprint checks. Encoded
payloads remain capped at 28 million characters and complete archives at 64
million. Arrays, framing and block counts are checked before constructing the
world. Old plain rows, checkpoint-v1 and original historical moments remain
readable. The atomic database upgrade changes its marker without eagerly
rewriting those payloads. Older apps refuse database five. No historical record
is trimmed to obtain the improvement.

## Feedback and hidden screens

The native store yields a frame before starting action work so the press can be
drawn. Only the submitted button owns progress feedback, with a 150 ms delay to
avoid flashing a spinner for quick actions. Age Up likewise shows progress only
for its own request. Busy controls retain their actual subtitles/eligibility
reasons rather than replacing them with “Saving”. Pending state and the duplicate
submission guard apply immediately; the spinner delay does not delay saving.

Root/game stacks and the four tabs enable the navigator's supported
`freezeOnBlur` option. Time Machine additionally uses a focus-scoped history read:
a previously visited hidden screen must not reload snapshots and toggle global
busy state after later gameplay actions. It catches up once when reopened.

## Measurement and acceptance

The full **1,157-test / 76-suite** regression passes in **717.063 seconds**,
with strict application/test typing, fresh Android/iOS Hermes bundles and current
Metro manifests/source. Game/persistence source stays fixed through the final
controlled measurements, complete regression and real SQLite comparisons.
That complete result applies to pushed `8de01d7`. Its subsequent entrypoint-only
follow-up passes all **130 affected UI/state/persistence checks / 44 suites** in
74.861 seconds, plus strict types and fresh Hermes/Metro checks. Game, codec and
UI code are unchanged; the follow-up also protects valid backups from inconsistent
replaced-current metadata and rejects contradictory idempotent-branch metadata.
The [follow-up record](verification/restored-save-responsiveness-20261019.json)
retains source hashes and the genuine v1/v2 archive provenance.

Final controlled results and their complete trial/input/source hashes are in
[button-latency-20261019.json](verification/button-latency-20261019.json.gz).
`node tools/benchmark-actions.cjs` uses real on-disk Node SQLite/WAL, one warm-up
and five fixed-input samples, and compares the entire current/backup worlds after
closing and reopening each trial. `--legacy-rows` separately measures the first
write after opening checkpoint-v1; it does not count a pre-converted save as a
first-write result. `--source` selects the unmodified baseline source tree.

The two mature inputs are original byte-for-byte historical payloads from the
earlier world-25 SQLite diagnostic, preserved in
[action-latency-inputs-v25-20261019.json](verification/action-latency-inputs-v25-20261019.json).
They migrate normally under each measured source. The early inputs come from
the genuine first-year and world-27 leisure archives. No person, date, money,
random state or outcome was edited for a timing case.

These diagnostics measure engine-to-durable-commit work and cold opening
of the world data separately. The `coldOpenMs` field measures full decoding over
an already-open SQLite connection and warm filesystem, not complete app or
connection startup. Post-commit equality checks independently close/reopen the
database. The timings exclude native frame/bridge/rendering time and the deliberate
frame yield. Native responsiveness, large-company/1,000-person worlds, 120-year/
multi-generation storage and the complete production-game release gates remain
open. Original fixtures and the earlier release evidence remain historical.
