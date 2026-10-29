# Readable Mind & Body sections

The coordinator's actual Android24 ExpoGo capture at390×844 and130% text,
`/tmp/dreams-c38-native-captures/routine-unchanged-130/ui.png`, shows the
Meditation section label broken into “Meditat” and “ion”. The route gave all
three buttons one fixed third of the available width, including their padding.
The Lifestyle and Mind&Body panels in
`design/10-health-wellness-travel-pets.png` establish the existing three sections
and short, readable navigation labels.

`app/(game)/lifestyle.tsx` now lets each section take its actual content width
and share remaining space. The row wraps whole section buttons when their
combined measured widths exceed the available width. It keeps Diet, Sleep and
Meditation in their existing order and preserves the selected colour. Font
scaling stays enabled; no font reduction, truncation, fixed text height or
label abbreviation is introduced.

Only these two layout properties change: the container enables wrapping and
each child's `flex:1` becomes `flexGrow:1`, retaining its intrinsic basis instead
of forcing equal zero-basis thirds. Local section/routine state, every handler,
prices, eligibility, changed-routine guard, busy feedback, automatic saving,
engine and persistence stay unchanged. No new style-mirroring tests are added
for this reversible visual correction.

## Verification

The existing `health-flow` and `health-review-save-flow` suites pass9 checks
across2 suites in68.928seconds (actual wrapper exit0,69.710seconds). They retain
the unchanged/reverted routine's no-save guard and real receipt-failure,
rollback/draft-retention/retry, warm zero-unpack and exact cold-result flows.
The log and durable receipt are
`/tmp/dreams-lifestyle-tabs-focused.{out,receipt.json}`. Strict application typing
and all-test typing both actually close exit0 without diagnostics, sequentially
in15.277 and26.053seconds. Their log and durable receipt are
`/tmp/dreams-lifestyle-tabs-types.{out,receipt.json}`. The route's SHA256 remains
`954c00c3285ebc0a8ff7206d86e1af4d25a92eaa95a621b4dede527c65939a0c`
before and after both gates. `git diff --check` passes. No full regression,
export, native action or new fixture is part of this source-only slice.

These checks establish behavior and save durability, not native line measurement.
Fresh corrected-source normal/130% and narrow-device visual acceptance belongs
to the coordinator; this source patch alone is not a native-layout pass.
