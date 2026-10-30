# Historical refinement compatibility

The starting executable, `fc2294b476fec72a77a9a863c7994b025ebe241f`, was
extracted with `git archive` into an isolated source directory. Before refinement
was applied to that source, its existing ordinary/enhanced compatibility,
prospective migration, Time Machine and overhaul integration suites passed:
**4 suites / 37 cases**, zero failures or skipped cases. The exact command,
per-suite results and log/result digests are in `baseline-compatibility.json`.

The new `tests/fixtures/v1-refinement-compatibility.json` was then captured from
that unmodified starting executable. These are new historical fixtures for this
refinement; no previously published fixture was regenerated. Each row contains a
compressed checkpoint, literal commands and SHA-256 hashes of the complete
encoded input and resolved world, including prose, people, incidents, financial
state, outcomes and random streams.

The twelve captured journeys are:

- A newly reserved v1 escape completed successfully under its original rules.
- The same attempt forfeited, creating the original genuine escape charge.
- A partially entered, paused v1 attempt resumed and completed.
- All three choices of `confidential-bio` in an organised crime membership.
- All three choices of `prison-invisible-border` during an actual sentence.
- All three choices of `romance-private-nickname` with a bound adult partner.

Prison entry and sentencing, organisation entry and escape input use actual
baseline commands. Story contexts use declared fixture controls, including the
seen-story list and selection seed; they do not modify resolved effects or
expected outputs. The dating scene uses an actual generated adult contact and
the existing relationship record.

`tests/persistence/refinement-compatibility.test.ts` checks every complete
historical hash after cold decoding at each command boundary. Four journeys
also run through a real on-disk SQLite database, inject a receipt-write failure,
check rollback and deterministic retry, commit the same receipt twice, physically
close/reopen the database, and inspect the previous backup and captured
checkpoint. Three bound stories are independently restored through Time Machine
and resolve identically while their source future remains unchanged.

These checks establish compatibility for the recorded journeys. The broader
historical fixture catalogue remains covered by its existing regression suites;
the twelve new captures are not a claim of exhaustive old-state coverage.
