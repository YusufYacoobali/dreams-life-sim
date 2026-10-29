# C39 criminal policy v2: independent actual-artifact review

No artifact-reconciliation defect found. All 12 country results, command traces and final checkpoints agree with the registered source and the closed run receipt. Natural outcomes and unmet milestones are retained; this is not complete Scenario B acceptance.

Root session **77019 closed with exit 0**. Its receipt records 151.557 seconds for the wrapper; the actual adapter reports 151.006 seconds. The source is **33b6a5fcb0aae73dfc235a15394b34d8afda00cc**, World 38 / engine 39 / content 13 / reader 18 / checkpoint v4. All 688 registered source files were exact before and after the root run.

This Codex review read every country result and its command/checkpoint artifacts, checked hashes and reported arithmetic, and correlated the fixed policy source. Only birth used the actual in-memory SQLite/store; later steps were immutable engine commands and production checkpoints. The reviewer did not execute the game, decode a world, rerun the policy/codec, use SQL, replay commands, access a device or search outcomes.

## Actual outcomes

| Country / seed | Death age | Convicted / acquitted cases | Reached / 26 | Unreached milestone names |
| --- | ---: | ---: | ---: | --- |
| US / 900 | 73 | 1 / 1 | 25 | delayedArrest |
| CA / 901 | 85 | 1 / 1 | 26 | None of the 26 named milestones |
| GB / 902 | 68 | 2 / 1 | 25 | holidayCompleted |
| AU / 903 | 50 | 1 / 1 | 25 | retirement |
| FR / 904 | 86 | 2 / 1 | 26 | None of the 26 named milestones |
| DE / 905 | 75 | 1 / 0 | 26 | None of the 26 named milestones |
| ES / 906 | 79 | 1 / 2 | 26 | None of the 26 named milestones |
| IT / 907 | 54 | 0 / 2 | 10 | delayedArrest, conviction, prisonRoutine, prisonTime, prisonStudy, prisonPay, prisonConnection, custodyGuard, release, recordWorkGate, foreignWorkApplication, holiday, holidayCompleted, recordExpired, rehired, retirement |
| BR / 908 | 46 | 2 / 0 | 25 | retirement |
| IN / 909 | 80 | 2 / 0 | 26 | None of the 26 named milestones |
| JP / 910 | 74 | 1 / 0 | 25 | delayedArrest |
| ZA / 911 | 76 | 3 / 0 | 26 | None of the 26 named milestones |

- All 12 actually withdrew from secondary school at their saved country minimum: US16, CA16, GB16, AU17, FR16, DE16, ES16, IT16, BR17, IN14, JP15 and ZA15. Withdrawal awarded no qualification. The policy retained its later adult offence gates; Italy first offended at 19.
- Italy had two acquittals and two real remand rows, but no sentence, prison pay or release. Its 16 missing named milestones remain unreached; null restriction fields do not justify inventing a refusal reason. The sentence-specific custodyGuard milestone is absent despite actual remand.
- GB paid for a Paris trip that was interrupted during legal consequences. holidayCompleted remains unreached. AU, BR and IT died before retirement. US and JP never recorded delayedArrest.
- Across all lives: 36 actual offences; 26 cases (17 convicted, 9 acquitted); all 17 sentences released; 12 remand rows. The 37 reported custody windows contained zero ordinary wage receipts. There were 183 positive prison-pay rows.
- The 22 paid foreign work applications produced 14 approvals and 8 declines, with no move or foreign contract acceptance. They establish application handling, not foreign residence or earnings. Ten of 11 paid trips completed; GB was interrupted.
- All 12 died through ordinary engine progression and settled estates. Italy recorded Hypertension and ZA declining health; “naturallyDied” does not mean every cause was literally labelled natural causes. Reported estate amounts reconcile per currency.

## Trace and persistence evidence

All 3,174 attempted commands are retained: 3,117 committed revisions and 57 rejected commands. The 596 availability/ineligible observations are separate from those rejected commands. The reviewer independently recomputed all 12 canonical tagged-BigInt trace hashes and checked attempted length against revision deltas.

The run reports 413 production-codec round trips, including overlapping milestone, bound and final states. These remain producer assertions, not new reviewer replays or 413 distinct worlds. Each final v4 envelope/file size agrees with its reported final check; compact part-byte sums and declared bounds were checked without decompression. Expanded canonical JSON bytes differ by design from compact tuple bytes. Complete canonical world equality and final world hashes remain producer-reported assertions.

All 26 milestone objects and every negative observation remain pinned in the original files. The detailed report copies all unreached objects, indexes negative observations by JSON pointer, and hashes the original observation/cold/custody/legal/financial arrays. Six countries reached every named milestone, but every actual result retains scenarioBComplete=false. Seizure/contraband, all choices, multigeneration, full-life SQLite and native acceptance are not established. Seeds 900..911 are reused: zero extra distinct annual seeds and no Scenario A/C completion claim.

## Exact evidence references

- Actual raw policy folder: `/workspace/.cache/dreams-current-c39-policies/criminal-v2` (38 files: manifest, aggregate, and 12 result/commands/final-checkpoint triples).
- Closed root receipt: `/tmp/dreams-production-finish-accepted-criminal-v2-receipt.json`.
- Raw stdout: `/tmp/dreams-production-finish-accepted-criminal-v2.out` — 657,841 bytes; SHA256 `7b5c3e4e65339175ddde47a730f9ef4b3aa89c2be32d98a5220bc82aad512c1a`. Its 12 progress rows and exact aggregate tail agree with the files.
- Frozen 688-file snapshot: `/tmp/dreams-production-finish-accepted-source.json` — SHA256 `2e08fd925c673437ff7de7c76c0fd79d02832617d0014efc1c3e471782fe9b56`.
- Game SHA256: `7de215076995f7dbe7c76eceb080ba00b6de6f1783c12340d1e82677c996245b`.
- Combined game/persistence SHA256: `d72d52f3d6a6e312e490a525c0638638af6c5bb27449ffb8a0dd5833e10acbc0`.
- [Detailed review](report.json) contains all country summaries, unmet objects, negative pointers and reported final hashes.
- [Artifact manifest](artifact-manifest.json) pins every actual raw file, receipt, registration, Git/provenance artifact, source helper and the producer/loaded-runtime hash maps. These are current C39 artifacts; historical v1/v2 records were not rewritten.
- [Analysis helper](analyse.py) and [closed analysis stdout](https://github.com/YusufYacoobali/dreams-life-sim/blob/da0b0e59cc11fc37b81eb0a20bcf5251e6eba5af/docs/verification/country-policies-20261021/reviews/B/analysis.out) perform JSON/hash arithmetic only.

GB902 was selected before review and its actual three files were shared with Story for a separate narrative review. This report does not claim that separate narrative review has completed.

The paths above are observer working paths; copying these artifacts for publication requires preserving the bytes and updating only the publication wrapper references, not rewriting the raw inputs.
