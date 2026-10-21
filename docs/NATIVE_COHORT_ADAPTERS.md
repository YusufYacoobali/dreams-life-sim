# Prepared C38/C39 native acceptance adapters

Tool/docs-only preparation from frozen C38
`dfd9a74046479672967868dc21ac6acfda734592`. No game, persistence, fixture,
dependency, version or existing C37 helper changes. The inspected C37 semantic
source is `4effed2cd69b85f033873fef331e5ee893904957`; the original raw tools
retain their independently reviewed `87b792b` bytes. They remain separate
historical producers and continue to accept their own C37 source only.

The [original proposal](/tmp/dreams-native-c38-c39-adapter-plan.md), SHA256
`8cbc6476d40f19e138396bd24b35082a2d67059381dae8e0458dcebaf9696bd3`,
received coordinator and independent Work design approval before implementation.
Exact feature review is separate. This preparation decodes/replays no genuine
production checkpoint or native database and performs no device action.

## Fixed profiles and retained controls

| Explicit cohort | World | Engine | Content | SQLite reader |
| --- | ---: | ---: | ---: | ---: |
| `c38` | 37 | 38 | 12 | 17 |
| `c39` | 38 | 39 | 13 | 18 |

Profiles are frozen constants. The source manifest and capture manifest must
both declare the selected cohort and exact tuple. The semantic trace declares
the same cohort. No arbitrary version override or default real input exists.
C39's actual frozen source commit is supplied by the coordinator later; this
adapter neither guesses a commit nor treats the C38 checkout as C39 evidence.

The shared raw support/CLI retain the original complete captured Git proof:
hash-pinned HEAD/empty status, full raw commit object, reconstructed complete
NUL-separated `ls-tree` root, actual SHA256/Git blob checks, regular files and
no unlisted runtime files. Every extension under `app`, `src` and `assets`,
and the managed root configuration, is checked **before requiring SQLite or
loading any source runtime**. Coordinator Git proof captures are explicit
inputs; the helper does not spawn Git or assert it independently observed a
fresh status command. Source/capture/tool evidence is checked again afterward.

Raw verification retains all eight production tables, measured baseline
ownership, protected other-life/current/backup/history rows, appended-row
retention, explicit main/WAL pins and exact read-only/cold equality. Its output
still says `raw-integrity-passed-not-gameplay-or-visual-acceptance`. It loads
no game runtime, projects no commands and does not turn arbitrary raw rows into
gameplay acceptance. Existing-mode initial selection must preserve all baseline
non-preference tables, including the target; no hidden initial action is allowed.

The semantic support hard-pins both new raw helper byte hashes. It requires
the actual successful raw result for the exact source/capture trace before
runtime loading. It retains the original production codec, complete canonical
world/RNG/pending/annual comparisons, exact prior-current backup bytes and exact
receipt additions. It executes each already-chosen supplied command exactly
once. Begin Life uses the actual `createGameStore.acknowledgeBirth` action with
the same strict recording Persistence and exact birth receipt. No automatic
resume/ack/choice, seed/outcome search, SQL write, native input, money-text,
whitespace or locale normalization is added. A stale preloaded source runtime
is refused; TS imports are byte checked before compile. TypeScript/Zustand
versions match the pinned lock; installed dependency bytes remain a separate
reproducible-build scope.

Every decoded current and backup requires actual arrays `teenRelationships`,
`universityApplications`, `studyCourses`, `npcSeparations` and `npcMoves`.
The production codec still validates the entire world and every checkpoint part.

## Actual saved tags before migration

The new semantic layer separately inspects the original stored main JSON before
the production decoder can migrate it. Plain and checkpoint v1/v2/v3/v4 framing
are recognized. Compressed inspection bounds declared/main inflation, checks
the gzip size trailer, exact inflated length and main FNV fingerprint, then
reports original tags, five-array presence, main bytes and main SHA256. This
metadata inspection alone does **not** validate people/ledger parts, all envelope
invariants or game semantics; full production decoding remains mandatory.

A newly created checkpoint or a current checkpoint written by a supplied command
or birth acknowledgement must already contain the exact cohort tags and all
five real arrays. The requirement remains active for subsequent read-only/cold
current captures. A newly written old-tag/missing-field payload fails even if
production migration would make its decoded world look current.

An existing-life initial read-only boot may retain genuine older raw current and
backup payloads. Those rows must equal the separately measured baseline exactly;
the decoded current/backup must still pass the complete current production codec.
The first command current must use the new tuple, while its backup stays exactly
the older prior current bytes. Later action/cold backup comparisons retain the
original rules. No eager payload upgrade, old history rewrite or synthesized
empty field is performed to make captures pass.

## Coordinator use after actual captures close

All checked-in inputs remain `complete: false` and refuse execution. Copy the
appropriate profile's `native-cohort-c38-*` or `native-cohort-c39-*` pending
templates to **new** coordinator `/tmp` files. The custom/Random Life and existing
journeys stay separate. Fill the source proof, baseline, actual distinct capture
DB/PNG/XML pins, personally reviewed image flags and actual stop/restart evidence.
Copy only actual chosen commands; do not invent a missing interruption or ack.
The eight required source/capture/trace templates are protocol blanks, not runs.

For example, only after real C38 inputs are complete:

```sh
node tools/verify-native-cohort-raw.cjs --cohort c38 \
  --captures /ABS/actual-c38-captures.json --output /ABS/NEW-c38-raw.json
node tools/verify-native-cohort-semantic.cjs \
  --trace /ABS/actual-c38-semantic-trace.json --output /ABS/NEW-c38-semantic.json
```

The semantic trace pins the exact completed capture manifest, approved new
`native-cohort-raw-support.cjs` and successful raw report (including its two
approved tool pins). Output paths must be new; previous evidence is never
overwritten. The C39 commands use `--cohort c39` and genuinely separate completed
C39 source/capture/trace manifests. The source root may be the coordinator's
separate frozen checkout; it need not be this tools-only checkout.

## Preparation evidence and limits

Seven CJS syntax checks and one in-process Node run actually closed exit `0`.
The first run passed **86/86 synthetic checks** in 1,084.65037ms:
`/tmp/dreams-native-cohort-adapter-tests-first.out` and matching `.exit` (`0`).
The command directly required the three authored test files in one Node process;
it used no subprocess test isolation and had no initial failed attempt.

The read-only original-producer inventory
`/tmp/dreams-native-cohort-c37-preservation.json` (3,488 bytes, SHA256
`b6763d81e03ec5b64b104e285ac194dde1c8b7ac1153de260c19fa89674691a8`)
checks 12 original C37 raw/semantic helper, protocol-test, pending-input and
documentation files against their actual Git blob IDs at `4effed2`. All are
exact. This new worktree changes no tracked file from its frozen C38 base.

All original 33 raw and 23 semantic synthetic controls are retained in the new
adapted tests. Additional checks cover both exact profiles, legacy boot/first
backup, newly written stale tags/missing arrays, cross-profile refusal, all five
array types, bounded main frames and unlisted JSON/CSS/binary runtime files before
runtime/SQLite capture loading. Synthetic source blobs use the same independent
fixed real-Git fixture and throw if executed. Injected fake engine/store/migration
worlds are explicitly protocol doubles; the production CLI has no fake-runtime
option. Synthetic PNG/XML/attestations assert no observed real device.

No actual C38/C39 native database has been opened, projected or accepted here.
No actual input/capture, image, benchmark, full Jest/type/export/cohort or device
claim follows from the protocol tests. Actual gameplay equality, creation/input
correctness, visual quality, process stops and physical/standalone/iOS acceptance
remain their own coordinator-owned evidence scopes.
