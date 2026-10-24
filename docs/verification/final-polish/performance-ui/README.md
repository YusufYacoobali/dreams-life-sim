# Full journal projection and rendering

The Life list keeps every recorded fact for the active person, in the original order and with the original persistent key. Other people's facts remain in the saved world and their existing views. There is no display limit, journal deletion, abbreviated history, new save field or changed gameplay.

The projection now scopes historical ages to life/person/birthday, rather than the current date. It reuses unchanged row objects across appends, changed dates and equal cold-loaded data. Memoised fact components and stable list callbacks avoid rendering unchanged visible facts. A journal array is trusted for an identity shortcut only when the model's private certified-world set recognises its owning world. A shallow frozen envelope is insufficient. Mutable previews use frozen display snapshots and compare all displayed fields, so same-ID text/date/person edits invalidate correctly. One mounted view retains one previous projection and journal reference; it never caches a World or a global history of revisions.

Existing individual-fact virtualisation, native-content-end following, animation-frame coalescing, manual drag cancellation, passive follow effect and Android `removeClippedSubviews={false}` are retained. Busy/disabled/pressed feedback is unchanged and no command is shown as successful before storage confirms it.

## Measurements

The five real saved-life workloads are retained once in [core performance inputs](../performance-core/workloads.json.gz). Both UI runs consumed the exact same raw input SHA-256 (recorded in comparison.json), exact checkpoint payloads and identical driver/game-model sources. Commands were resolved before timing the UI. The before Life source is commit `3c797e2`, pinned in [baseline source](baseline-source.json); its exact projection callback is retained in [baseline body](baseline-projection-body.txt).

This isolates UI behaviour using the baseline game model plus the same [read-only certificate query](certificate-query.patch) in both runs. The core optimisation commit supplies that query during integration. These are cloud Node/Jest React-test-renderer observations at 390×844, not native Android/iOS rendering, frame stalls, tap latency, GPU work, SQLite or end-to-end Age Up timing. Each case uses 3 warmups and 31 measured transitions. Shared cloud scheduling and JIT create substantial timing noise. Actual native scroll/layout is not measured by a test renderer.

Age Up first-step presentation (all timings milliseconds):

| Age | Whole-world / active-person journal facts | Projection median before → after | React render/commit median before → after | React render/commit p95 before → after | Visible old fact Body renders |
| --- | --- | --- | --- | --- | --- |
| 10 | 94 / 22 | 0.021 → 0.012 | 48.120 → 15.970 | 152.183 → 36.554 | 12 → 0 |
| 25 | 293 / 81 | 0.052 → 0.018 | 57.196 → 12.160 | 95.197 → 42.950 | 12 → 0 |
| 50 | 669 / 168 | 0.109 → 0.041 | 66.536 → 16.524 | 107.754 → 36.856 | 12 → 0 |
| 70 | 984 / 231 | 0.163 → 0.061 | 63.152 → 37.804 | 100.849 → 81.254 | 12 → 0 |
| 90 | 1241 / 316 | 0.144 → 0.063 | 28.079 → 30.507 | 116.882 → 53.308 | 12 → 0 |

The structural improvement is consistent: older row objects are reused and the 12 unchanged facts in the initial virtualised window stop rendering. The list still contains every active-person fact, including appended facts outside that initial window. Separate component checks verify that a newly visible appended fact actually renders once. Projection medians improve in all ten routine/Age-Up cases. Full-render medians are noisy: the age-90 routine rises 1.38→2.93 ms and its Age-Up first step rises 28.08→30.51 ms, even though their p95 timings improve. This does not establish a universal device-speed improvement at 90. All cases, including routine results and tails, are retained in [before](before.json), [after](after.json) and [comparison](comparison.json).

## Verification and reproduction

49 checks in 5 suites pass: new full-history/certificate/mutation/render guards plus existing connected SQLite onboarding/retry, newborn positioning and Life contexts. The stress guard retains 7,070 facts through age 100 with original ordering and correct headings; it is explicitly a constructed correctness case, not the measured lifetime workload. Exact source/test hashes and result counts are in comparison.json. Application/test TypeScript checks pass. Root integration runs the full suite and production exports separately. No physical-device performance or native list-layout acceptance is claimed here.

To reproduce, decompress the core workload to a local path and use the benchmark file with Jest's testMatch extended to bench files:

```sh
DREAMS_JOURNAL_PHASE=after DREAMS_JOURNAL_INPUTS=/tmp/dreams-final-perf-inputs.json DREAMS_JOURNAL_OUTPUT=/tmp/dreams-journal-after.json npm test -- --testMatch '**/tests/performance/*.bench.tsx' --runTestsByPath tests/performance/life-journal-render.bench.tsx --silent
```

For the original React baseline, use Life from `3c797e2` with the identical benchmark driver, retained projection callback and read-only certificate query; set `DREAMS_JOURNAL_PHASE=baseline`. The driver refuses a baseline whose full Life source hash differs. The normal test command does not collect the opt-in bench file.
