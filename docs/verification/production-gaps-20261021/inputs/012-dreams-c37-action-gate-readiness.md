# C37 serial action gate — prepared only

No benchmark, engine journey, process signal/control or native command was run
while preparing this helper. The C36 result remains a separate historical run.

The unchanged driver is `tools/benchmark-actions.cjs`, SHA256
`19da212c32feb53a2f264b4c6062cd0b7a68146a762f82841890ea410408bbe9`.
The four unchanged input byte/SHA pins are in
`/tmp/dreams-c37-action-preparation.json`; they were checked by ordinary byte
reads against the historical C36 pins. The large historical latency input is
separately pinned even though it is outside the current tracked-source map.

Root must finish current native/full/heavy work, force-stop the app, and
**gracefully close** the current owned emulator and Metro. The helper does not
stop, pause, resume, kill or issue ADB commands. Current PID hints supplied by
root are QEMU171418 and Metro172965; old QEMU100274 is gone. Capture actual
UID/startTicks/argv identities before closing these processes. If root restarts
them, use the new real identities and matching CLI PIDs instead of these hints.

Copy `/tmp/dreams-c37-actions-ready-template.json` to a new
`/tmp/dreams-c37-actions-ready.json`, fill the actual closure facts, final source
commit/SHA, recent timestamp, statement and raw closure evidence for the closed
full/native/heavy sessions. Set `complete:true` only after actual closure and
confirm no replacement emulator/Metro is running. Each `closedGateEvidence`
entry is `{session, processClosed:true, exitCode, raw:{file,bytes,sha256}}`.
Each process entry retains `{role,pid,uid,startTicks,argv,closedAt,processClosed}`.
This is root's attestation; the wrapper additionally checks the recorded old
process identity has gone or is a zombie. No paused-but-live identity qualifies.

Use root's final frozen C37 source snapshot (36/37/C12/reader16/v4), not the
later retirement integration (37/38). The initially accepted snapshot is only
orientation: a reviewed test-only correction may require a new final snapshot.
The gate verifies every supplied source-map byte and game/persistence file set
before and after; its C37 game/persistence hash is pinned to
`c98f5ccef419042d820b377f36201ce1f4f63a479525ca943e865d77007ca9a5`.

Exact later invocation, after root supplies the final snapshot at this path:

```sh
python3 /tmp/dreams-c37-action-gate.py \
  --root /workspace/dreams-worktrees/integration-production-gaps \
  --source /tmp/dreams-production-gaps-final-source.json \
  --quiescence /tmp/dreams-c37-actions-ready.json \
  --prefix /tmp/dreams-c37-actions \
  --qemu-pid 171418 --metro-pid 172965 --execute
```

The invoked command is exactly `node tools/benchmark-actions.cjs --source ROOT
--profile --population --workplaces --raises`. No extra cases or legacy-row
mode is added. The wrapper refuses existing output paths, retains separate raw
stdout/stderr, and writes its actual closed-process receipt and compact summary
only from the executed command. Expected outputs are
`/tmp/dreams-c37-actions.{json,stderr.txt}`,
`/tmp/dreams-c37-actions-receipt.json` and
`/tmp/dreams-c37-actions-summary.json`. A failed run remains a diagnostic; use a
different prefix for an authorised retry rather than overwriting it.

Pass requires exact14 cases/five stored trials each, all70 measured warm full
unpack counters0, valid actual medians/case completion, four explicitly generated
stress inputs and a successful unmodified driver exit. That exit retains the
driver's84 whole cold current/backup assertions and12 original raw BeforeAgeUp
checks, including deterministic sizes/outcomes and source/driver stability.
Those are derived assertions from six executions/case, not84 timing samples.
Begin Life uses the original save-kernel scope; generated100/1000 contacts are
stress contexts. This is unpaired cloud Node/SQLite diagnostic evidence, without
rendered UI/native/physical p95 or guaranteed speedup claims.

Preparation checked Python AST syntax only and inspected the old C36 output to
confirm the existing phase/size shape. It did not import or execute the wrapper,
run its benchmark, use native tools or consume the author test/type slot.
