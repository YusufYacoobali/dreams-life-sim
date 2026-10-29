# Retirement move runtime union

This next integration targets World37 / engine38 / content12 / reader17 /
checkpointv4. The accepted C37 source remains separate and unchanged.

`npcMoves` is required for a current world. New lives explicitly create an empty
array. The exact legacy World36/engine37 bridge adds only that empty collection
and advances the root schema/engine tags. Existing Best Friends, teenage
relationships, university applications, study observations and NPC separations
are preserved. No move, money, pension period, journal fact, identity, pending
choice, historical outcome or random draw is reconstructed. The existing content11
to12 bridge still runs first for its supported older source; content remains12.

Complete reader13/14/15/16 databases already have all eight required tables and
metadata. Initialisation changes only the reader marker to17 in its existing
transaction, permitting rollback without rewriting rows. Reader17 is a no-op;
reader18 and newer are refused before mutation. Existing older-reader setup and
metadata backfill behavior remain intact, and checkpointv4 is unchanged.

This runtime-only commit does not refresh any historical producer tags, fixture
bytes, source hashes, saved payloads or existing test expectations. School owns
the bounded current expectation adapters; Purchase owns new genuine migration
and marker-only rollback acceptance. Root owns consolidated gates/native and
the final runtime freeze. No full/cohort/export/native checks are claimed here.

Scoped strict runtime check passed: `tsc --noEmit` with the dedicated
`/tmp/dreams-c38-runtime-union-tsconfig.json`, rooted only at model/createLife/
repository and their transitive dependencies; session74999 CLOSED0 and empty
`/tmp/dreams-c38-runtime-union-types.out`. The first temporary config failed
TS2688 because `/tmp` could not locate Node type definitions; its exact diagnostic
is retained at `/tmp/dreams-c38-runtime-union-types-initial.out`. Adding the actual
workspace type root corrected the config without changing runtime source.
No test, engine journey, SQLite gate, full application/test compile, export,
cohort or native action was run for this runtime-only check.
