# Keep ActionRow facts readable at large text sizes

The coordinator's actual C38 Android24/Expo Go capture at 390×844 and 130%
text showed Profile Education breaking into `Edu` / `cati` / `on`, with the
subtitle reduced to small letter groups. The unconstrained “Secondary
qualification” value consumed the label's width. The normal capture remained
readable. Both original captures stay unchanged:
`/tmp/dreams-c38-native-captures/profile-normal/ui.png` and
`/tmp/dreams-c38-native-captures/profile-130-ready/ui.png`.

This isolated UI follow-up starts from pushed source
`9ad6330b005e26ed0760c6f29343c5d686680b05`. It retains design02's ordinary
label/value rows while bounding a normal value to 45% of the available text
body. At font scale 1.2 or greater, or window width below 360, the complete value
stacks beneath the title/subtitle. The text body has a shrinkable width and the
stacked label retains its natural height. All facts can wrap; no line limit,
ellipsis, smaller font or lost value is introduced.

ActionRow's actual label, disabled reason/state, onPress, icon, chevron and
pressed styling are unchanged. The layout reads only window dimensions; it
does not query a world, ledger, repository or save. Existing Profile facts,
shortcuts, no-save browsing and durable preference interactions remain the
relevant connected checks, alongside existing shared-control/appearance checks.
No new style-mirroring test or gameplay/version/fixture/tool change is made.

Existing focused checks pass: 21 tests /3 suites in 22.125 seconds,
`/tmp/dreams-action-row-responsive-focused.out` (actual session76321 closed0).
Full application/all-test strict types also pass,
`/tmp/dreams-action-row-responsive-types.out` (session99924 closed0); the log
contains both successful compiler invocations and no diagnostics.
`git diff --check` passes. No further runtime edit followed those checks.

The coordinator owns independent review and actual corrected normal/130% recaptures
from a fresh bundle. React Native test-renderer checks do not establish Yoga
layout or native visual acceptance. No old C38/C39 native source is relabelled
as containing this fix.
