# C39 startup and button performance source audit

Read-only review of clean `83adaea6f92523d04a27df2e77b11e0a8b14ef1d` in `/workspace/dreams-worktrees/lifestyle-tabs`. The complete source proof records 703 files, World38/engine39/content13/reader18/checkpoint-v4. The 29 inspected runtime/test files are byte-equal to that manifest; hashes are in the companion pins JSON. No runtime, replay, SQL query, native interaction, test, benchmark, installation or source mutation was performed. Existing evidence was read, not rerun.

**Finding: no new actionable source-proven regression in the audited paths. Welcome does not decode all eight lives, ordinary actions do not reread their worlds, and saving feedback remains on the submitted button.** This is a source finding, not a physical-device latency or complete startup acceptance pass.

## Startup and Continue

- `app/_layout.tsx:12` starts the game and app-preferences bootstrap once per root mount. `src/persistence/native.ts:12–31` shares one opening promise, connection and repository initialisation; an actual open failure clears that promise for retry.
- `src/state/gameStore.ts:43–53` reads summaries, then the selected world. The busy guard prevents overlapping bootstrap completion from marking the first read ready early. `src/persistence/repository.ts:94–122` selects **only id/name/revision/update time/branch metadata** for the list: no life payloads. `active_life` selects one ID; `readLife` reads and fully unpacks only that current row, checks its identity/revision, and primes the active cache. Backups, snapshots and seven inactive worlds are not decoded by this path.
- `app/index.tsx:16–24` displays that loaded world. Its Continue handler only routes to Life, Birth or Death. It does not dispatch, reload the life or reopen SQLite. Explicitly selecting a saved life loads that requested life; it does not decode every listed life.
- `repository.ts:43–49` returns immediately for reader18 and changes only the marker for complete readers13–17. **Bounded legacy exception:** `repository.ts:82–90` decodes snapshots missing metadata on the older setup/migration path. This can cost cold-start work for those old databases; it is not the current-reader normal path. No captured database was queried here to assert which branch it takes.
- App preferences share the same opening repository and read one small settings value (`preferencesStore.ts:41–51`, length limit1024), independently of game commands. They do not reload lives.

## Ordinary actions and pressed-button feedback

`useGame.ts:7–9` yields a UI frame before command work; `gameStore.ts:33–38` marks busy synchronously and rejects duplicates. `dispatch:98–106` resolves one command and awaits one durable commit before publishing. It updates the small saved-life summary array in memory. It does not list lives/snapshots, export, or traverse inactive payloads.

`repository.ts:145–172` reuses the certified active world only if life/revision/**actual payload bytes** match. Otherwise it deliberately validates the stored row. Backups copy the previous payload inside SQLite; Before-Age-Up snapshots reuse its existing compressed bytes. The cache changes only after transaction success. Duplicate receipts explicitly load and verify the already-committed life; that exceptional retry is not the ordinary warm path. These integrity checks should not be removed to make timing look better.

`model.ts:103–104,158–171,422–436` certifies immutable worlds/ledger rows: trusted inputs avoid another pre-command full parse and deep cloning of every old transaction, and commit/encoding reuse the certified output. Checkpoint packing caches immutable ledger blocks and unchanged people groups (`checkpoints.ts:25–95`); cold-load cache priming happens after validation. New main-body encoding, output validation and changed data compression remain actual work proportional to the active world. Their existence alone does not prove redundant work or justify weakening validation.

`components.tsx:53–65` computes saving as **busy AND locally submitted**; `useDelayedBusy.ts:8` delays the spinner150ms without delaying the command. Other controls can be disabled while the save is held, but do not acquire a Saving indicator or busy accessibility state. The label remains stable. Existing `interactions.test.tsx:22–45` explicitly checks one delayed spinner and an unpressed button's busy:false; the real held-save case in `hobby-introduction-save-flow.test.tsx:71–79` checks exactly one busy button plus failure rollback/retry/cold equality. These definitions were inspected, not newly executed.

## Rendering and history

Root/game native stacks freeze blurred screens; tabs are lazy and freeze on blur (`app/_layout.tsx:20`, game layout:26, tabs layout:6). The game navigator is keyed by life/person, **not revision**, so ordinary commands do not remount the entire navigation tree. The layouts perform guards/navigation, not lifetime statistics or archive projection.

The visible Life journal memoizes filtering/grouping and virtualizes its rows (`life.tsx:38–49,87`). Finance/statistics use memoized active-world projections; they may legitimately reproject after a world change while visible. This is not a measured hidden-screen render profile. Time Machine's read is focus-scoped and keyed to life/revision (`app/time-machine.tsx:17`); its existing connected test covers no hidden read and one catch-up read on return. Snapshot listing reads metadata, not all historical worlds (`repository.ts:194–196`). Its parked restore/manual-history features were not expanded. The proven API24 clipping workaround remains untouched.

## What existing measurements establish

`/tmp/dreams-c39-actions-summary.json` pins source3224c9ce, the same current game/persistence hash `d72d52f3d6a6e312e490a525c0638638af6c5bb27449ffb8a0dd5833e10acbc0`. The later source bridge changes only the two reviewed UI layouts; it does not change the measured engine/save kernel. The existing 14-case run reports **70 measured warm samples, zero full warm unpacks**, 14 excluded warmups, 84 whole cold-current/backup equalities and12 original Before-Age-Up payload assertions.

| Existing fixed case | Engine-to-commit median | Data cold-open median |
|---|---:|---:|
| First-year choice |2.65ms|1.93ms|
| Its result Continue |2.73ms|1.88ms|
| Age30 routine |23.31ms|99.95ms|
| Age60 routine,36,154 ledger rows |58.18ms|301.84ms|
| Generated1000-contact routine |130.83ms|209.33ms|
| Generated1000-contact first Age-Up step |498.91ms|194.29ms|

These are unpaired cloud Node/on-disk SQLite diagnostics, not rendered/native/physical p95. Stress contacts were generated at once; Begin Life measures the driver save kernel, not the birth store/UI. As `docs/BUTTON_RESPONSIVENESS.md:101–106` explicitly defines it, **coldOpenMs excludes opening the SQLite connection, full app/JS/Metro startup and native frame/bridge/render time**, over an already-open connection and warm filesystem. It cannot explain or contradict a minutes-long emulator DEV boot.

## Finite follow-up

The coordinator reports a software-only API24 Expo Go DEV cold launch taking roughly4–5minutes with63 require-cycle warnings and no KVM. This audit did not reproduce, time or independently attribute that launch. The source reads do not connect those minutes to all-eight-life decoding or the old global Saving bug. Warnings should remain visible; hiding them supplies no performance evidence.

The remaining decision needs a named physical/release-build startup and action measurement separating bundle/module initialisation, repository open/migration, selected-world decode, and first usable frame. If that trace exposes repeated loads, unexpected fallback unpacking, hidden renders or disproportionate validation/encoding, fix the demonstrated path. Until then, the selected-world cold decode and large-world validation/packing are bounded profiling candidates, not established regressions. No speculative model or persistence refactor is recommended from this audit.
