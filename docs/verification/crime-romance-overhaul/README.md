# Crime, prison and romance verification

The baseline is remote `v2` commit `d8f3d99c31d2ef9fddacb9cf5ad0b9cc20172bd0`,
including the Actor/Model presentation correction made after the plan's
`98a8043` reference. Baseline sources were extracted with `git archive` into
an isolated directory before implementation.

## Baseline checks

The original creative-career compatibility, prospective-gameplay migration and
Time Machine suites passed: **3 suites, 18 cases**. These exercise published
pending decisions and genuine historical checkpoints, creative opt-in while
preserving legacy contracts, transactional failure and independent branches.
No fixture was regenerated.

## Performance method

Raw measurement reports use lossless `.json.gz` files to keep the repository and
review diff small. Decompress them before passing them to the JSON helpers.

`performance-before.json.gz` contains the complete baseline samples, source digest,
driver digest, exact input summaries, command traces and resulting world hashes.
The existing `tools/benchmark-final-performance.cjs` driver ran against the
published natural-life workloads in
`docs/verification/final-polish/performance-core/workloads.json.gz`.

Each workload uses one warm-up and five measured samples, with garbage collection
outside the measured command span. It opens real on-disk SQLite databases,
executes engine commands and commits, checks a cold reopen, and verifies the
previous backup and captured checkpoint. A full year includes its intervening
decisions and result acknowledgements. Its cost therefore includes more than the
initial Age Up command.

The final baseline, legacy, enabled and active-organisation runs were sequential,
after all regression, soak, typecheck and export workers finished. Source copies
were isolated; the driver's source digest check passed in each run. Node was
`v24.19.0` throughout.

| Age | People | Ledger rows | Journal rows |
| --- | ---: | ---: | ---: |
| 50 | 20 | 21,867 | 669 |
| 70 | 22 | 36,636 | 984 |
| 90 | 23 | 47,204 | 1,241 |

### Measured comparison

Legacy uses the exact existing saved world. Enabled uses the same world with
only the prospective capability and empty histories added; the preparation
tool asserts that no other field changes. All **nine legacy input, command and
complete outcome hashes match the baseline exactly**, including RNG and saved
state. [performance-comparison.json](performance-comparison.json) retains the
input/source digests, p95 values and ratios.

| Age | Command scope | Baseline median | Current legacy median | Current enabled median |
| --- | --- | ---: | ---: | ---: |
| 50 | Routine | 31.63 ms | 36.57 ms | 45.75 ms |
| 50 | Initial Age Up | 155.01 ms | 165.94 ms | 177.33 ms |
| 50 | Complete year | 188.28 ms | 203.28 ms | 190.84 ms |
| 70 | Routine | 46.79 ms | 62.18 ms | 53.50 ms |
| 70 | Initial Age Up | 252.37 ms | 256.93 ms | 262.08 ms |
| 70 | Complete year | 429.09 ms | 399.07 ms | 362.87 ms |
| 90 | Routine | 58.06 ms | 69.46 ms | 54.06 ms |
| 90 | Initial Age Up | 365.59 ms | 363.60 ms | 318.47 ms |
| 90 | Complete year | 762.03 ms | 809.84 ms | 784.06 ms |

The complete samples and phase measurements are in
[baseline](performance-before.json.gz), [current legacy](performance-after.json.gz)
and [enabled](performance-enabled.json.gz). The five-sample routine differences
are variable: the largest legacy difference was +33%, and the largest enabled
difference was +45%; other current measurements were faster than the baseline.
The largest legacy routine gap prompted the longer check below rather than a
claim that the additional simulation systems caused a persistent slowdown.

### Follow-up of the routine difference

An independent age-70 routine check used **eleven measured samples** per source.
It also tested a scratch-only parser change that conditionally assigns present
optional fields instead of assigning and deleting missing fields.

| Source | Median | p95 |
| --- | ---: | ---: |
| Baseline repeat | 56.21 ms | 61.43 ms |
| Current repeat | 54.74 ms | 62.93 ms |
| Scratch candidate | 54.06 ms | 58.09 ms |

All three produced the same complete outcome hash. The initial 46.79→62.18 ms
gap did not persist in this check. Most of its original difference was in
checkpoint packing; the new prison and romance validators together accounted
for about 0.02 ms. The scratch change improved the repeat median by only
0.68 ms (1.2%), within the observed variation, so it was **not applied**.
Raw [baseline-repeat](performance-routine-repeat-baseline.json.gz),
[current-repeat](performance-routine-repeat-current.json.gz) and
[scratch-candidate](performance-routine-scratch-candidate.json.gz) observations
retain the phase breakdowns and all eleven samples.

### Active criminal state

Three additional inputs use actual join and two cautious-assignment commands on
the same age-50/70/90 histories. Arrests use actual affordable bail. No money,
dates, outcomes or random streams are patched. The
[preparation proof](active-organisation-preparation.json) saves every command
and the resulting crew, jobs, incidents, cases, ledger entries and balances.

| Age | People after preparation | Ledger rows | Player cases | Routine median | p95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 50 | 25 | 21,869 | 1 | 41.61 ms | 42.29 ms |
| 70 | 26 | 36,638 | 0 | 57.69 ms | 57.76 ms |
| 90 | 27 | 47,208 | 2 | 61.43 ms | 61.59 ms |

Each input retains three named crew members, a named rival and two actual job
records. These are routine-command measurements with active criminal state,
not whole criminal-lifetime or prison-input latency claims. The
[active-state report](performance-active-organisation.json.gz) retains all samples.

These are cloud Node/SQLite synchronous command measurements. They do not measure
React rendering, native frame pacing, installed-device input latency or a signed
mobile build. Five samples and a shared cloud machine limit statistical
precision; even the longer check cannot establish a device latency guarantee
or a small stable percentage change. The JSON retains every observation.

### Reproduction

Extract `d8f3d99c` into a separate source directory and make the installed
`node_modules` available to it. Decompress the published workload archive to a
temporary input file. Run the existing driver against that baseline directory
and the final source directory, sequentially, with `--ages 50,70,90 --samples 5`.
Use the following helpers for the enabled and active inputs:

```sh
node tools/prepare-overhaul-performance.cjs --source /path/to/final/source --output /tmp/enabled-inputs.json
node tools/prepare-overhaul-performance.cjs --source /path/to/final/source --organised yes --output /tmp/active-inputs.json --proof /tmp/active-preparation.json
node tools/compare-overhaul-performance.cjs --before /tmp/baseline-report.json --after /tmp/legacy-report.json --opt-in /tmp/enabled-report.json --output /tmp/comparison.json
```

Run the active driver with `--ages 50,70,90 --kinds routine --samples 5`. Every
driver invocation uses `node --expose-gc tools/benchmark-final-performance.cjs`
with `--source`, `--inputs` and `--output` paths. Keep other test/export workers
stopped until the measurements finish. Historical workload and save fixtures
are read, never overwritten.

## Compatibility review

The baseline has two supported world capabilities: ordinary **49/51/28** and
enhanced Actor/Model **50/52/29**. A new feature cannot assume that all current
saves have the same tuple, nor silently discard the enhanced creative fields.
Existing saved choices own their bound prose, participant IDs, effects and random
outcomes. New feature state must be prospective.

Time Machine branching changes the root life ID while retaining saved participant
and historical record identities. An immutable origin-life field must not be
mistaken for the branch's current ID. Tests must exercise a branch containing
new feature state as well as ordinary historical checkpoints.

## Integrated results

The completed regression and final affected-suite rerun cover **all 369 test
files / 6,107 cases**, with **zero remaining failures or skipped cases**. This
is the union of the latest complete result for each file, not a single Jest
invocation: the full run covered 361 suites, and the final affected run covered
26 suites / 448 cases. [regression.json](regression.json) retains the exact
per-file provenance and counts. The original run's birth-journal digest test
was updated only to assert and remove the new empty prospective capability
fields before comparing its original historical digest; the original fixture
and digest remain unchanged. Runtime tests did not require a gameplay fix.

The complete persistence directory plus the conversation-save and
preferences-store reader suites passed: **43 suites / 298 cases**. The reader
expectations and injected marker-write failures now target reader 30, and
future-reader rejection uses 31. Historical fixture contents and payload hashes
were not regenerated. The run includes legacy ordinary and enhanced creative
capabilities, exact pending decisions, all supported historical archive formats,
atomic failures, cold retries and Time Machine independence.

The final new integrated persistence suite has **19 passing cases**, including actual
criminal proceeds and linked incidents, rollback and exactly-once retries,
secret affairs and branch-specific confession, and death followed by actual
child continuation without inheriting criminal membership or romantic
commitments. It also checks strict absent-field preservation on a cold reopen,
legacy opt-in through a new date, an NPC proposal through the actual wedding,
a genuinely purchased foreign-currency ring gift, and an actual divorce after
an NPC request and paid adoption, followed by custody and wage-funded support.
The ordinary-crime acceptance suite has **5 passing cases**:
conserved extortion/robbery transfers, a real violent injury, vehicle-theft/scam
payoffs through arrest/hearing/conviction and remand credit, and rejection of
invalid victims before any state is committed.

Production Android and iOS Hermes exports contain exact source matches for all
**54 changed or new runtime sources** in both platform maps. The
[export proof](hermes-exports.json) records each source hash. Bundle exports
establish source inclusion, not installed-device acceptance.

The complete **120-life soak passed**, covering every seed 0–119 across three
workers. Lives terminated at ages 22–95; the largest retained ledger had
**61,470 rows**. [soak.json](soak.json) records the actual completion and
per-life observations. This exercises ordinary seeded-life progression;
deliberate crime, prison and relationship journeys are covered separately by
the feature and integration suites.

Strict application and test TypeScript checks, the **563-module acyclic runtime
import graph**, and third-party notice checks passed. The completed performance
comparison and its limitations are recorded above.
A brief execution-session disconnection occurred after the completed
persistence run; the full regression process continued independently and its
completed JSON result is included above.

## Source-level self-review

The review checked the new engine entry points and imported schemas against the
actual legal, relationship, financial and persistence callers. Findings were
resolved or confirmed by focused checks:

- Ordinary and enhanced creative capabilities remain distinct. Legacy decode
  preserves the absence of prospective fields; immutable command results and
  cold reopen also match under strict object comparison.
- The assignment allowance is per person across organisations. The legacy job
  entry delegates to it, and one incident/payout cannot count as two assignments.
  Validation reuses the canonical ledger index instead of rescanning the entire
  transaction history for every retained job.
- Outside and prison affiliations coexist. Prison routines consult the actual
  sentence membership rather than treating the outside pointer as proof of
  prison membership; release preserves the outside history.
- An ended affair or unavailable/deceased lover cannot produce a witnessed
  discovery. Discovery, forgiveness and renewed affairs identify the actual
  most recent betrayal. Historical adult eligibility and date chronology are
  validated rather than inferred from present age.
- A new normal date opts a legacy life into partner autonomy. Temporary space
  and no-contact boundaries affect engine eligibility and can expire or be
  deliberately lifted through their actual actions.
- NPC proposals transfer an existing ring and create only an empty recipient
  currency account when needed. The original purchase remains the sole debit.
- A divorce request leaves marriage and finances intact until the canonical
  reviewed settlement. The complete journey preserves custody, previous
  marriage history and genuine subsequent support transfers.
- Saved organisation, prison and romance choices retain their bound people and
  rule/outcome snapshots. Death cancels unavailable scenes rather than naming
  replacement participants. A child continues with their own commitments.
- The expanded inmate action list reuses a precomputed unit-contact list for
  eligibility reads instead of multiplying full population scans per action.

The review does not substitute for an installed-device playthrough. Exact mobile
performance, touch feel and native store integration require their own device
evidence. Bounds are deliberate archive limits; exhausting a lifetime history
stops additional records rather than deleting earlier people or consequences.
