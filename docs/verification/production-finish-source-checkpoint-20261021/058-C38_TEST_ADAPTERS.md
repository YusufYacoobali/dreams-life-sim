# C38 test adapter scope

This test-only candidate starts from frozen C37 source
`a4be96ee1e60ab073fbbd2ae95d0ee2d0ee6f361`. It prepares the existing checks for
World37 / engine38 / content12 / reader17 and required `World.npcMoves`.

- Current-runtime expectations advance to those tags. Historical producer
  versions, payloads, hashes, source pins and policy driver bytes stay exact.
  In particular, the entrepreneur driver remains pinned to World34 / engine35 /
  content10; its current-runtime refusal test expects the new current tuple.
- Every existing canonical normalizer proves `npcMoves` is empty before
  stripping it. The four C37 histories retain their individual empty checks;
  genuine nonempty best-friend history remains in the native canonical proof.
- Exact legacy-to-current object comparisons include `npcMoves: []`. Required
  history omission checks append it without removing any prior history case.
- Reader metadata expectations target17, and unsupported-reader checks use18.
  Original reader inputs stay unchanged; the existing13/14/15 positive matrix
  also covers16. Marker-write failure injection follows the actual new marker.

No runtime, product, fixture, producer or driver is changed. This does not alter
the frozen C37 evidence or establish C38 gameplay, migration or native acceptance.
Only static syntax and diff checks are authorized here before the runtime union;
strict types and actual test execution remain pending integration.

Static verification: all45 edited TypeScript files parse without syntax errors
(`/tmp/dreams-c38-test-adapters-syntax.out`), and `git diff --check` passes. This
loads only the TypeScript parser, with no application or domain imports.
