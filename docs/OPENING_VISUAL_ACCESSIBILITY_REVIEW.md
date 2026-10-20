# Opening visual and accessibility review

This review compares the actual 390×844 Android 24 captures under
`verification/android24-opening-actions-20261020/`, the later saved-life welcome
capture, and the earlier normal-text newborn capture with supplied design
01/02/04 and `birth.png`. Contact-sheet phone panels are compared by their inner
content structure, not by their full image dimensions. These historical captures
predate the retained-review/location fixes and the changes below.

The welcome hero/native actions, four-column selected-avatar grid, fixed opening
actions, newborn facts, compact life header, five stats, green Age Up and four
tabs preserve the reconciled reference structures. Scrolling longer newborn
content at 130% text is expected; the fixed Begin Life action remains reachable.
The recorded Expo gear overlay is development chrome, not an application defect.

## Portrait focus targets

The native `04-appearance.xml` exposes sixteen selectable Avatar radio controls
and sixteen additional focusable child ImageViews with the same labels.
`01-standard-creation.xml` similarly exposes both Choose Appearance and its child
portrait. The shared portrait previously always created an accessible image.

An optional `decorative` prop now hides the portrait accessibility subtree only
inside named opening controls: Choose Appearance, Avatar radios and Hair Style
radios. Their parent names and selected states remain available. Standalone
portraits keep their existing image role and name, including the separate
appearance preview. Artwork, dimensions and gameplay are unchanged.

Focused component/connected onboarding verification passes six tests across two
suites. It covers default image semantics, a single named selectable parent,
all sixteen actual Avatar controls, Hair Style's retained standalone preview,
and the real SQLite creation/first-year/cold-resume journey. This does not claim
new native accessibility-tree, TalkBack/VoiceOver speech or visual acceptance.

## Remaining acceptance

Fresh normal/130% captures and native accessibility trees must cover the final
integrated source; the historical images cannot accept newer changes. Actual
screen-reader speech, supported additional viewports, physical performance,
standalone packaging and iOS acceptance remain separate open gates.
