# C38/C39 serial action gates: static preparation only

Neither wrapper nor driver has been imported/executed. Preparation used ordinary
byte reads, text generation and Python AST parsing, without bytecode caches.
There was no benchmark, runtime load, process/device control or heavy gate.
No C38/C39 performance pass is claimed.

The reviewed C37 wrapper is preserved byte-for-byte:
`/tmp/dreams-c37-action-gate-v2.py`, SHA256
`475d888d251edd7c7058ad7a37f8c7604f7ab245636f69c02c52d67672c74a31`.
Its prior preparation, review, template and historical evidence are unchanged.

## C38: registered frozen source

Wrapper `/tmp/dreams-c38-action-gate-v2.py`, SHA256
`bac1ee0b58fa870559702a6664c9c3973d0b66ce6259780bd2dc35caa336ce0d`.
It accepts only commit `dfd9a74046479672967868dc21ac6acfda734592`, versions
World37/engine38/content12/reader17/v4 and combined game/persistence SHA256
`773fe2a217a84a97588f449ffd037744f2503e2ff020551c9df80e875cfb1a38`.
The exact 665-file source snapshot is
`/tmp/dreams-retirement-accessibility-final-source.json` (73,358 bytes), SHA256
`4c1c72cfea3d338984c5112523209c900950d53f76ccf4c6dd0a30615d92fcf7`.
The wrapper's source/root arguments must match that actual registration; it
does not silently accept a later source snapshot or infer a new pin.

Root first copies the incomplete
`/tmp/dreams-c38-actions-ready-template.json` to a new attestation path and fills
only actual process/gate closure facts. PID values are deliberately unset: use
actual identities at that run, rather than a stale emulator/Metro pair.

After all native/full/author/heavy work has actually closed, root may run:

```sh
python3 /tmp/dreams-c38-action-gate-v2.py \
  --root /workspace/dreams-worktrees/integration-retirement-accessibility-final \
  --source /tmp/dreams-retirement-accessibility-final-source.json \
  --quiescence /tmp/dreams-c38-actions-ready.json \
  --prefix /tmp/dreams-c38-actions \
  --qemu-pid ACTUAL_CLOSED_QEMU_PID --metro-pid ACTUAL_CLOSED_METRO_PID --execute
```

## C39: fail closed until the actual freeze

Wrapper `/tmp/dreams-c39-action-gate-v2.py`, SHA256
`763db35d4e82e4fe878ee3a6aa0deeeeb25d1ce10a754c77451f4e47a3cce8b8`.
The required tuple is World38/engine39/content13/reader18/v4. C39's source is
not frozen or registered by this preparation; no provisional tree/hash is
accepted as an actual final source.

Root makes a **new** registration from
`/tmp/dreams-c39-action-source-registration-template.json` only after its final
source freeze. The template remains `complete:false`, with no source/hash/root.
The wrapper requires both the registration path and its explicit SHA256 on the
CLI. A complete registration must bind the exact root, commit, frozen snapshot
file/bytes/SHA, file count, actual combined game/persistence hash, target versions
and unchanged original driver. This validation happens before any benchmark
child or pending receipt is created. The registration itself stays pinned
before/after, together with the frozen source snapshot.

Root separately finishes a new actual quiescence attestation from
`/tmp/dreams-c39-actions-ready-template.json`. Later command, with actual final
paths/hash and closed process identities filled explicitly:

```sh
python3 /tmp/dreams-c39-action-gate-v2.py \
  --root FINAL_C39_ROOT --source FINAL_C39_SOURCE_JSON \
  --registration /tmp/dreams-c39-action-source-registration.json \
  --registration-sha256 ACTUAL_FINAL_REGISTRATION_SHA256 \
  --quiescence /tmp/dreams-c39-actions-ready.json \
  --prefix /tmp/dreams-c39-actions \
  --qemu-pid ACTUAL_CLOSED_QEMU_PID --metro-pid ACTUAL_CLOSED_METRO_PID --execute
```

## Unchanged guards, driver and scopes

`/tmp/dreams-c38-c39-action-preparation.json` pins both wrappers, static deltas,
templates, source registration and the four unchanged byte/SHA input pins.
Separate text deltas retain the exact changes from the approved C37 wrapper.
All managed extensions under src/app/tests/tools/assets/.github and root runtime
configuration must match the supplied complete source inventory. Added/deleted
files and symlink entries are refused, including JS shadow imports. Every
mapped byte and root's head/tree/status proof stays pinned before/after.
node_modules/dependency files and unrelated documentation remain outside this
managed inventory, as in the reviewed C37 wrapper.

The original driver remains SHA256
`19da212c32feb53a2f264b4c6062cd0b7a68146a762f82841890ea410408bbe9`:
`node tools/benchmark-actions.cjs --source ROOT --profile --population
--workplaces --raises`. It starts a fresh Node process and transpiles current
TS source directly; no compiled runtime cache is substituted. Its original
primed checkpoint-block mode and measured warm-unpack guards remain exact.

The wrappers issue no ADB/signal/kill/pause/resume command. Root must stop the
app and gracefully close actual owned native/Metro processes, close heavy and
author gates, and attest that no replacement is running. The wrapper checks the
recorded identities are gone/zombies; it does not create quiescence. Root's
attestation must be recent and source-bound, linking actual closed sessions and
raw evidence hashes. No synthetic closed/gate/passing facts are supplied here.

Only new output prefixes are accepted: original raw stdout, stderr, actual child
closure receipt and a compact summary. No prior or failed output is overwritten.
Success requires actual child exit0, unchanged source/registration/input/driver
proofs, 14 exact cases and exactly70 measured warm trials with zero full unpack.
The unchanged driver establishes84 whole cold current and84 whole cold backup
equalities plus12 original raw BeforeAgeUp payload checks, including excluded
warmups; these are derived assertions, not additional stored timing samples.
Four100/1000-contact cases retain explicit generated-stress labels. Begin Life
uses the driver's save kernel; prepared workplace inputs use ordinary commands.
These remain unpaired cloud Node/on-disk SQLite diagnostics, without rendered
UI/native/physical p95 or guaranteed-speedup claims. Root owns actual execution
only after its real quiet window; C37's separate gate remains unchanged.
