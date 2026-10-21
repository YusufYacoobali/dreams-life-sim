# C37 action gate v2 — static preparation only

Use `/tmp/dreams-c37-action-gate-v2.py`, SHA256
`475d888d251edd7c7058ad7a37f8c7604f7ab245636f69c02c52d67672c74a31`.
The original wrapper/preparation/readiness remain unchanged as the rejected
static v1 diagnostic: its inventory missed added non-TypeScript shadow files.
Neither wrapper has been imported or executed; no benchmark/process/native
operation occurred. V2 was checked with Python AST syntax parsing only.

V2 requires an exact full managed file inventory, all extensions, under
`src`, `app`, `tests`, `tools`, `assets`, `.github` and root runtime/configuration
candidates. It rejects unlisted/deleted entries and symlink roots/files/folders,
including extra `.js` imports beside pinned TypeScript. Every source-map byte,
the original driver, all four immutable inputs and root's captured Git
head/tree/status artifacts are pinned before/after. The separately pinned
historical latency JSON stays outside the tracked source map. Dependencies in
`node_modules` and unrelated documentation are outside this managed inventory.

Root supplies the **final C37 tree and source snapshot** as CLI arguments. They
are not hardcoded to the earlier integration tree. Use the actual `root` field
and commit from root's final snapshot, including the final test-only fixes.
The accepted game/persistence pin remains C37 World36/engine37/content12/reader16/
v4 and `c98f5ccef419042d820b377f36201ce1f4f63a479525ca943e865d77007ca9a5`.
The later retirement integration is a different runtime and is refused.

After all actual full/native/heavy gates close, root force-stops the app and
gracefully closes the exact owned QEMU/Metro. No helper ADB/signals/pause/kill or
resume code exists. Capture actual PID/UID/startTicks/argv before closing.
Root's current hints are QEMU171418/Metro172965; use new identities if restarted.
Do not reuse old QEMU100274. The helper checks the recorded identities are gone
or zombies and requires root's attestation that no replacement is running.

Fill a new `/tmp/dreams-c37-actions-ready.json` from the preserved incomplete
`/tmp/dreams-c37-actions-ready-template.json`. Complete only actual facts:
source commit/SHA/root, recent timestamp, app stopped, all heavy gates closed,
no replacement QEMU/Metro, exact closed identities and linked closed-gate
sessions/raw hashes. Gate-evidence entry shape:
`{session,processClosed:true,exitCode,raw:{file,bytes,sha256}}`.

Later command; replace `FINAL_C37_ROOT` with the exact root from the final source
snapshot and use root's actual final source path and current recorded PID pair:

```sh
python3 /tmp/dreams-c37-action-gate-v2.py \
  --root FINAL_C37_ROOT \
  --source /tmp/dreams-production-gaps-final-source.json \
  --quiescence /tmp/dreams-c37-actions-ready.json \
  --prefix /tmp/dreams-c37-actions \
  --qemu-pid 171418 --metro-pid 172965 --execute
```

The unchanged driver command is `node tools/benchmark-actions.cjs --source ROOT
--profile --population --workplaces --raises`, SHA256
`19da212c32feb53a2f264b4c6062cd0b7a68146a762f82841890ea410408bbe9`.
Four original input byte/SHA pins are preserved in
`/tmp/dreams-c37-action-preparation-v2.json` and checked separately before/after.
No new case, seed, outcome override or legacy-row mode is introduced.

New output prefix only: raw `.json`, `.stderr.txt`, actual `-receipt.json` and
`-summary.json`. Existing outputs and failed diagnostics are never overwritten.
Pass requires actual closed exit0, unchanged source/input/driver/provenance,
14 exact cases and70 measured warm trials with zero full unpack. The frozen
driver retains84 whole cold current/backup checks and12 exact original
BeforeAgeUp payload checks; these counts derive from six executions/case,
including one excluded warmup. Four100/1000-contact cases stay explicitly
generated stress contexts, and prepared workplace inputs use ordinary commands.
No C37 pass is claimed until root actually executes and closes the run. Results
are cloud Node/SQLite diagnostics, without rendered UI/native/physical p95 or
guaranteed speedup claims. Historical C36 evidence remains unchanged.
