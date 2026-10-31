# Mobile performance evidence

Baseline `8ba6ba14`, final runtime/tests `ffc7d828`, branch `v2`.
The [implementation report](../../MOBILE_PERFORMANCE_OVERHAUL.md) describes the
selected optimisations and their risks. Native release-device acceptance remains
**open**; these are Node/real SQLite, React test-renderer and production-bundle checks.

- [Baseline audit](baseline.md) and [source manifest](baseline-manifest.json): captured before runtime edits.
- [Final results](after.md) and [machine-readable comparison](comparison.json): all matched cohorts, median/p95 and memory scope.
- [Verification](verification.json), [complete regression](regression.json.gz), [regression log](regression.log.gz), [120-life soak](soak.json) and [soak log](soak.log.gz).
- [Independent canonical and packed-byte checks](canonical.json), [protected-source comparison](preservation.json), and [final Hermes exports](hermes.json).
- [Reproduction commands](reproduction.md), [immutable inputs](inputs), [initial baseline reports](baseline), [controlled baseline rerun](controlled-before), and [final raw reports](after).

The initial five-sample [stage-B pairs](stage-b-pairs.json.gz),
[position allocation diagnostic](positioned-index.json.gz) and
[first stage-C load report](stage-c-operations.json.gz) are retained as development
evidence, separately from the final controlled comparisons. The earlier
[canonical report](canonical.json.gz) is superseded by the final-source JSON.
The [interrupted regression log](interrupted-review-run.log.gz) documents a
review-driven restart; its partial counts are never added to the completed run.

The small age-1 SQLite profile has one fixed eleven-sample reverse-process-order
follow-up; its original five-sample results remain in the comparison. See the
[final report](after.md#small-successor-follow-up) and the separately named raw
`generations-sqlite-followup.json.gz` files in both report folders.

Every raw `.json.gz` file is ordinary gzip-compressed JSON. Original historical
fixture contents, gameplay expectations and prior verification archives remain
unchanged. Command reports retain exact entire-world/RNG results; the pure-engine
soak additionally compares its scalar observations against the previous published
soak, which is a narrower check than complete-world equivalence.
