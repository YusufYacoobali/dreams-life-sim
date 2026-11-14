# Internal release profiling workflow

Physical iPhone/Android acceptance is **unverified**. This host has no attached phone, `adb`, Xcode or signing credentials. Hermes exports establish bundle compatibility; no signed installation, native paint/frame, native allocation or installed App Store container upgrade is claimed.

## Candidate build

From the committed `v2` checkout:

```sh
npm ci
npm run typecheck
npx eas-cli@latest login
npx eas-cli@latest device:create
npx eas-cli@latest build --profile performance --platform ios
npx eas-cli@latest build --profile performance --platform android
```

`device:create` registers the iPhone for ad hoc distribution; Android does not need it. Complete Apple signing/team selection with the project's owner and install from the returned EAS link. These account/signing commands were **not** submitted here.

The `performance` profile selects the preview environment, iOS **Release**, an Android release APK, and no development client. The app is **Dreams Life Simulator Profile**, identifier `com.yacoobali.lifesim.profile`, scheme `dreams-life-profile`. Its container is separate from the public app. Profiling uses `dreams-performance.db`; ordinary builds retain `dreams.db`.

The profile does **not** grant purchases. Configure sandbox RevenueCat credentials/entitlements for the separate app when testing paid career actions, identically on both sides. Leave God Mode edits off. Public/store builds force profiling permission false even if `DREAMS_PROFILE_COMMANDS=1` is accidentally set. Recording never starts automatically.

Retain the exact source commit and EAS build ID in run notes. If `DREAMS_SOURCE_REVISION` is supplied to the build environment as 7–40 lowercase hexadecimal characters, it also appears in JSON; otherwise that field is null. App version alone does not identify the source.

## Comparable reference in its own container

From the candidate checkout:

```sh
git worktree add --detach /tmp/dreams-device-reference 8378d0f8
node tools/prepare-performance-reference.cjs /tmp/dreams-device-reference
cd /tmp/dreams-device-reference
npm ci
npm run typecheck
npx eas-cli@latest build --profile performance --platform ios
npx eas-cli@latest build --profile performance --platform android
```

The diagnostics overlay retains the original engine, content, RNG, validators, reader-32 repository/codec and journal projection byte-for-byte. It adds the same recording shell, press observation, native transaction timing and publication span. Retain its generated `performance-reference-manifest.json` with the EAS artifacts. Its repository has no internal `load:decode` span; compare inclusive `load` durations.

The reference uses identifier **`com.yacoobali.lifesim.profile.reference`**, a separate app container, and scheme `dreams-life-profile-reference`. Install reference and candidate side by side. Never install the old app over the candidate's upgraded container. This is an instrumented reference, so the overlay manifest is part of its build identity.

## Identical supported benchmark archives

```sh
gzip -dc docs/verification/v2-scaling/followup/gameplay-profiles.json.gz > /tmp/dreams-gameplay-profiles.json
node tools/export-scaling-benchmark-saves.cjs --inputs /tmp/dreams-gameplay-profiles.json --directory /tmp/dreams-device-saves
```

Transfer the generated files to Files on iPhone or local Android storage. In each profiling app, open **Settings**, tap **App Preferences** three times quickly, then open **Performance Diagnostics** under Internal Testing. The God Mode toggle can stay off. Choose **Open Benchmark Saved Lives → Import a Save**, select the same file and confirm the normal preview.

The exporter produces V4 archives readable by both builds and verifies complete canonical equality. It does not rewrite IDs, balances, dates, RNG or history. Age snapshots of one life intentionally retain its original ID; importing another age replaces only that isolated benchmark life after confirmation. No Time Machine checkpoints are fabricated. Each folder includes archive/canonical hashes, age, activity counts and record sizes in a manifest.

Also use the retained original light/moderate/heavy/extreme cohorts; the same exporter accepts them. Real Continue inputs are in `followup/gameplay-continue.json.gz`. They contain actual planning pauses rather than invented annual cursors. Keep input manifests with reports; JSON timing reports deliberately contain no save identity or content.

## Record and export without a debugger

1. Match appearance, motion, haptics, sounds and entitlements. In separate notes record phone model, OS, thermal/battery state, free storage, source/build/manifest IDs, input archive SHA and run order.
2. Choose **Start Recording**, return to the game and warm the selected case. Collect at least **20** ordinary actions, Age Up/Continue commands and complete years, resolving real decisions. For reset comparisons, import a fresh identical copy **outside** the timed action. Alternate app order. Never force unavailable credit/careers or bypass cooldowns.
3. Return to Diagnostics, **Stop Recording**, then **Refresh Breakdown** for p50/p95/maximum/sample counts. **Share JSON Report** opens the native share sheet; **Save JSON Report** writes to a selected folder. Clear between scenarios. No debugger or live console is needed.
4. **Cold Read Active Save** uses an independent native SQLite connection and repository cache without replacing the live writer. Record repeated reads. This is a database/decode probe; also test a real app close/reopen and its opening UI.
5. On Life, follow new facts, drag into old history, close a result and switch tabs. Capture native scrolling/frames while checking access to every old row and the existing follow/manual-scroll behavior. Recording counts journal layout/content, drag and scroll attempts against the latest published revision.
6. Run a sustained session with repeated actions and switches between independent lives/Time Machine branches. Track memory after warm-up and regularly afterwards. Close/reopen, recover a backup and continue a real child; compare complete world/RNG/history and durable receipts through the normal harness.

Export stops recording before file I/O. The ring retains **16,384 events**; overwritten and unfinished traces are explicit. Short scenario-specific runs avoid losing early traces. Snapshots, sorting and JSON allocation occur only on refresh/export. Do not leave Diagnostics open as a substitute for measuring the visible Life screen.

## Report semantics and native traces

Reports use `dreams-performance-report`, version 1. Events contain trace number, command type, age, phase, elapsed milliseconds and optional React duration. Summaries include p50/p95/max/sample count, counts and buffer losses. Environment contains OS/build/engine. Native paint/frame/allocation/memory fields remain **null** unless independently measured; missing data is not zero.

`press` starts at synchronous JS press-handler entry, or dispatch entry for programmatic commands. Simulation start, copy/draft, month/annual, validation/indexing, encoding/compression, SQLite, native transaction, publication/store, journal and UI commits remain separate. Spans are inclusive and overlap; do not sum nested spans. `native:transaction` is elapsed JS time awaiting native SQLite, including bridge scheduling/transfer, rather than pure SQLite CPU.

React `onRender` duration exists only if that React build supports profiling; optimized Release may omit it. JS busy/world commits and animation-frame opportunities **do not establish visible feedback or completed native paint**. Keep native fields unverified without native evidence.

On macOS, attach **Instruments → Time Profiler** to the installed Release app. Add **Animation Hitches/Core Animation**, **Allocations** and **VM Tracker** in separate bounded recordings as supported. Record the same 20 warmed actions/scrolls; retain `.trace` files with matching wall-clock notes. Use the native frame timeline/video for first feedback and updated-screen presentation. Avoid enabling every expensive instrument during latency measurement; measure observer overhead separately.

On Android, use **Android Studio → Profiler** where the release app/device supports attachment, or **Perfetto/System Tracing** with scheduling, frame timeline and memory tracks. Developer Options → System Tracing can capture a bounded run and share its trace. If release heap attachment is unavailable, retain supported system tracks and mark detailed allocation measurement unavailable.

Keep native and JS reports together with a sidecar containing phone model, source/build IDs, input SHA, trace filenames, run order, warm-up/measured counts and exclusions/reasons. Retain outliers. Targets remain visible feedback around **50–100 ms**, ordinary years around **100–300 ms** where feasible, no unexplained multi-second freezes, flatter history growth and stable sustained memory. These are objectives, not established native results.

## Forward-only save boundary

Reader **33** understands V1–V5 and atomically upgrades compatible reader-32 metadata. Old current/backup/snapshot payloads remain literal until an actual save. Future reader **34** is refused before mutation. Reader-32 apps refuse reader-33 databases even if some payloads remain V4. New V5 exports also need a capable reader.

Preserve independent **pre-upgrade** and **post-upgrade** copies. Use only the pre-upgrade copy with the old app and the post-upgrade copy with the new app. Never test downgrade on the only copy. The retained fixture was written by actual reader-32 code from genuine command-generated/archived lives; it is a reproducible installation, **not** a captured user's App Store container. A real installed-container upgrade still requires a backed-up test device and the owner's signing/distribution workflow.
