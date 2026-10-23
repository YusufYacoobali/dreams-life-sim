# Cult Leader verification — 23 October 2026

The implementation is described in [CULT_LEADER.md](../../CULT_LEADER.md).
It retains the integrated Polish 3 baseline `da0b0e5` on `work` and adds
the requested independent career, headquarters, stories and persistent
consequences. No runtime dependency was added.

## Automated checks

Focused domain checks pass 155 cases, including all 84 story choices and all 18
claim deadlines, real member/payout transfers, actual prosecution across a
rebrand, relationship repair, arrears collapse, 15 years of accounting and
natural growth beyond 1,200 followers. Integration adds five checks for career
conflicts, custody, closure and the engine's monthly hook. Twelve persistence
checks cover old World 44 and genuine Polish 3 World 45 lives, archives, checkpoints, Time Machine and an
interrupted Age Up with write rollback, lost commit acknowledgement, retry and
cold reopening. Twelve connected SQLite/store UI cases cover actual commands,
review cancellation, save failure, retry, duplicate taps and stale identity.

Strict application/test types and the 484-module runtime import graph pass
without cycles. The complete `npm test` invocation passed **291 suites and
3,919 tests**. The **120-life soak** passed all three shards with each seed
0–119 completed once. Exact commands, counts and log hashes are recorded in
[test-summary.json](test-summary.json); [soak-results.json](soak-results.json)
contains every life result. Runtime stayed frozen at `4b65c3a`.

## Browser layout review

The 32 PNG captures show 16 production React Native component trees at the top and
at their last actions. Light uses 390×844; dark uses 320×844 with 1.4× text. The
adapter reproduces the native Modal portal and Yoga's intrinsic `flex:0` text
height. These are browser CSS/SVG captures, not Android/iOS screenshots.

All 192 rendered images decode, no phone overflows horizontally, the final
actions remain reachable in every capture, no browser error occurs and no
external image request is made. See [browser-checks.json](browser-checks.json).
Source/derivative inspection removed neighbouring atlas fragments before
these captures. Representative screens:

- [Dashboard](cult-dashboard-light.png)
- [Founding review, dark/large text](cult-founding-review-dark-large.png)
- [Named member](cult-member-light.png)
- [Headquarters](cult-headquarters-light.png)
- [Treasury records](cult-treasury-records-dark-large.png)

Reproduce the trees with `DREAMS_CULT_REVIEW_TREES=/tmp/dreams-cult-review-trees
npx jest --runInBand tests/ui/cult-flow.test.tsx`, then run
`node tools/build-cult-review.cjs` against the archived `trees-after/`.
`PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` may point the capture tool at an external
Playwright install and Chromium. Browser tooling is not an app dependency.

## Production exports

`npx expo export --platform all --max-workers 1 --source-maps` exits 0 for the
configured Android and iOS platforms. Both outputs have the Hermes magic
header, all 41 changed runtime source files match their source maps exactly,
and all 12 new runtime images match their manifest hashes in the exported assets.
Bundle sizes and hashes are in [platform-checks.json](platform-checks.json);
source hashes are in [runtime-source-hashes.json](runtime-source-hashes.json).

No installed Android/iOS app, emulator or physical phone was available in this
execution environment. Export and component/browser checks do not establish
native-device rendering, touch behavior or performance. Those remain device
acceptance work; no native pass is claimed.
