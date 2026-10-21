# Pending C37 native onboarding acceptance

This is a preparation tool, not observed native acceptance. Root owns the device and final source freeze. World36/engine37/content12/reader16 is the coordinated target; its source hashes, new life identity, seed, birthday scene and results are deliberately unknown here.

The bounded custom journey is actual custom creation → saved newborn → Begin Life → actual first birthday decision/result → separate acknowledgement, with independently copied cold states at each named milestone. The coordinator supplies the actual pre-creation baseline and created birth checkpoint, chooses visible actions and reviews actual PNG/XML. Extra medical/family/annual interruptions require explicit additional captures and actual commands; the helper never chooses or resolves them. Optional Random Life uses a separate baseline and complete manifest, not another creation inserted into the custom journey.

The generic raw verifier also supports a separate existing-life action journey. Its own measured baseline and first read-only selected capture derive the actual target from `active_life`, require that life already existed and require all first non-preference tables (including the selected current/backup) to equal baseline. A hidden action before this claimed read-only selection refuses. Later only that target's current/backup may change, while every other life and every original receipt/history row remain exact. No existing life ID or actual application outcome is hardcoded. The separate pending existing-life manifest requires saved-action/cold and acknowledgement/cold observations; genuinely offered later enrolment/withdrawal would need explicit additional observations, not assumed success.

`tools/verify-onboarding-native.cjs` loads **no game runtime**, projects no command, searches no RNG, executes no native action and opens SQLite only with `readOnly: true`. Its output says `raw-integrity-passed-not-gameplay-or-visual-acceptance`, with semantic/visual acceptance explicitly false. Revision/receipt/backup transitions are reported as observations, never predicted Begin Life or engine behavior. Actual creation correctness, birth age/identity, exact command worlds/results, visible accessibility and process-stop observations remain separate coordinator/semantic acceptance.

## Required inputs

Copy `tools/onboarding-native-source.pending.json` plus the appropriate `tools/onboarding-native-captures.pending.json` or `tools/existing-life-native-captures.pending.json` to new evidence paths. Each intentionally has `complete:false` and refuses immediately. Keep separate measured baselines/manifests per journey. Do not fill placeholders from an expected future run or mark incomplete captures complete.

Every file pin is `{ "file": "/absolute/actual/file", "bytes": actualByteCount, "sha256": "actual lowercase SHA256" }`. Every database pin is `{ "main": filePin, "wal": filePinOrNull }`. `wal:null` means no WAL exists; an unpinned WAL is refused. A present WAL must be the exact main path plus `-wal`. Main/WAL bytes are checked before and after reads; SQLite may use its local shared-memory sidecar for read locks, which is not credited as an immutable database payload.

The completed source manifest supplies:

- A frozen full commit, absolute root, exact target version declaration and `complete:true`.
- Pinned coordinator outputs of `git rev-parse HEAD`, clean `git status --porcelain`, `git ls-tree -rz HEAD` and raw `git cat-file commit HEAD` under `git.head/status/tree/commit`.
- A `source` mapping of tracked path → SHA256 covering every app/src/assets and root package/lock/app/Babel/Metro/TypeScript config file. Extra pinned tracked files are allowed and checked too.

The helper reconstructs the entire Git tree from the NUL-separated proof and binds its SHA1 to the pinned raw commit object/full commit. Every managed file must be pinned and match both its Git blob and SHA256. Missing/unlisted files, runtime symlinks, unsafe paths, incomplete trees and a dirty status refuse. This pins source bytes; it does not prove that a device loaded those bytes or that declared version tags match a decoded world.

The completed capture manifest supplies the source-manifest file pin, actual device/scope, baseline DB pin and, for custom/random only, exact raw created `birthCheckpoint` file pin. No newline or JSON re-quoting is added to that checkpoint. Existing mode has no birth checkpoint. Each named phase supplies independently copied DB/PNG/XML paths, reviewed image/hierarchy file pins and `coordinatorPersonallyViewed:true`. Cold phases bind their immediately preceding actual phase and a pinned JSON attestation with `complete:true`, `stopped:true`, `restarted:true`, exact `from/to` phase names and `evidence:filePin` for the coordinator's nonempty actual process/capture log. Attestation is provenance supplied by the coordinator, not independent process observation by this verifier.

Required milestone order is in the pending manifest. Extra actual interruption/readonly captures may be inserted without replacing a required milestone. A command phase contains the exact actual visible `command` object; it is recorded only and never executed. Do not infer a choice, birth acknowledgement, saved result, cold stop or outcome from a milestone name.

## Verification and limits

Only after **every** source/capture/PNG/XML/cold-attestation pin passes does the helper require Node SQLite and open any DB. It derives exactly one new life ID from actual baseline→newborn rows, or the actual existing target from its selected capture, and measures all row counts from the inputs. A supplied birth checkpoint must equal its raw created payload. Custom/random preserves every baseline life/backup; existing mode preserves all other lives/backups and the initial selected baseline exactly. Every baseline snapshot/metadata, receipt/branch/restore row remains byte-for-byte. Only actual target current/backup/receipt/snapshot/metadata rows and normal active-life preference are allowed to differ; old and newly appended receipts/history cannot disappear or change. These journeys add no branch/restore records. Each explicit cold/read-only phase after the initial selected capture must have all eight raw tables equal to the immediately preceding capture. Every input pin and helper byte is checked again before a new output is written exclusively; failure creates no successful evidence file.

Run only against actual complete coordinator evidence:

```sh
node tools/verify-onboarding-native.cjs --captures /absolute/complete-captures.json --output /absolute/NEW-raw-result.json
```

No real baseline, source, journey or capture has been processed by this draft. No actual C37/native/standalone/iOS/physical acceptance is claimed. Root must freeze the runtime and authorize any future exact one-command projection separately; this candidate has no projection entry point or game loader.

## Draft validation status

Syntax and synthetic protocol checks are queued behind the shared agent runner; they have not run yet. The dedicated command is `node --test tools/tests/onboarding-native.test.cjs`. It uses temporary synthetic Git repositories and eight-table SQLite files containing deliberately invalid game payload text. Passing those tests can establish raw/provenance guards only, never a valid game world, natural birth, command outcome or native acceptance. No packages or game runtime are loaded by the helper.
