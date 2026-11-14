# Preserve the original size boundary

A controlled valid world with 26,005 journal facts has a v4 frame size of **31,999,936 bytes**. Independent v5 history blocks add enough framing to exceed the v5 combined-size guard. The first v5 prototype rejected this previously supported world; the final writer falls back to v4 when history framing would exceed combined, expanded or wire limits. It keeps every original limit and runs the same validation. No history is removed.

`node tools/verify-scaling-boundary.cjs SOURCE_DIRECTORY OUTPUT_JSON` constructs this explicit synthetic boundary fixture. It is **not** a natural-life benchmark. The final default writer produces byte-identical v4 output and exact canonical round-trip equality. See `boundary.json`. Existing v1–v4 writers/readers remain; ordinary measured workloads continue to use v5.

The final regression refresh changes only internal test contracts: read-only `get`/`has` lookup interfaces, current reader 33/future reader 34, deliberate new codec versions, and current-source observations. Draft spies capture facts while a transaction is live, because retained drafts are revoked. Original scheduling/revision expectations and historical C35 registrations/fixtures remain unchanged. Earlier interrupted invocations are excluded from final counts.
