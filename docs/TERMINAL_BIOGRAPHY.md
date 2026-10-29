# Factual terminal biography and recorded decisions

Part11 of `docs/planning/source-specification.md` requires a short personalised
death summary grounded in actual career and accomplishment records. The dedicated
`design/death screen.png` remains the full-screen visual authority; its illustrative
"Legendary" rating is not evidence of a title earned by the selected person.

The former death paragraph counted every journal row whose category was `event`
and described that number as choices. Actual job-interview answers are accepted
decisions recorded under `work`, so they were omitted. Event-template history is
not a substitute: it tracks offered templates without the chosen person's ID.

`src/ui/terminalBiography.ts` counts distinct retained journal identities ending
`_choice` for only the selected person. This is the identity written by the
engine's accepted-decision path, including job interviews. Result acknowledgement,
routine, ordinary fact and offered-event records add no decision. The label is
"recorded decisions" rather than a claim of complete lifetime choice coverage.

The same read-only selector names the longest actual retained employment record,
its real employer and recorded employment-months. It does not convert overlapping
jobs to calendar years, reconstruct earnings, infer a lifetime rank, or turn an
empty older history into a claim that the person never worked. At most two
highlights come from completed career projects and recorded awards, businesses
actually founded by this person, completed service assignments or retained
qualifications. Current ownership and inherited wealth are not founding evidence.
Cancelled/uncompleted projects and assignments are not completed accomplishments.
Qualification records retain their original historical/background scope.

The death route memoizes this projection by immutable world and actual active
person, and only computes it for a deceased actor. It reads no money ledger,
accounts, estate valuation or offered-event history. Original net worth at death,
estate settlement, children, generation, summary/new-life/legacy navigation and
death presentation remain in place. Earlier unrecorded activity is explicitly
not reconstructed. The full retained history remains in the existing Life Summary.

## Focused checks

New data cases use genuine original v32 native hourly interview/hiring snapshots,
v12 actor, v11 company, v16 service, v6 family and sparse v1 newborn fixtures.
They check an actual work-category interview answer adding exactly one decision,
result acknowledgements and a real effort save adding none, actual accomplishment
records, child/person isolation, sparse-history wording, bounded highlights and
no account/estate/income/event-history scan.

Two connected on-disk route cases use the original native hourly and family
worlds. Mortality is explicitly arranged through the existing `recordDeath`
helper for UI coverage; it is not a new natural-death or full-life claim. They
check all eight tables, full canonical state, original estate/generation, one
memoized selector read, zero checkpoint unpack during local viewing/navigation,
all three original routes, and a genuinely closed/reopened SQLite connection.

After the coordinator's serial gate handoff, all **eight tests / two suites**
pass in **4.942 seconds**. Raw output:
`/tmp/dreams-terminal-biography-tests-final.out`. The first run preserved in
`/tmp/dreams-terminal-biography-tests.out` caught a test-instrumentation issue:
Babel evaluated a deliberately throwing guard getter during object-spread setup.
Defining the guard after copying fixed that check; production behavior was unchanged.

Affected strict TypeScript checks pass with exit zero and empty output at
`/tmp/dreams-terminal-biography-types.out`, using
`/tmp/dreams-terminal-biography-tsconfig.json`. No other/full gate is claimed.
No fixture, schema, engine, persistence or gameplay policy is changed. Native,
full regression, release and physical-device acceptance remain separate.
