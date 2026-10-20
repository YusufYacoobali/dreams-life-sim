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

## Text and action contrast

Source colours and the actual opening captures exposed white normal-sized text
on blue at 4.146:1 and positive green at 3.234:1, white welcome Continue text at
4.238:1, muted text on inset at 4.379:1, and error text on the warm page at
4.253:1. The 12–17px labels need 4.5:1; the large bold Age Up label only needs
3:1. Its original normal state already passed that lower target.

Filled actions now have separate blue/green/red roles. Their pressed state uses
a darker background instead of fading the entire enabled control, which could
reduce contrast. This covers shared Button, welcome Start/Continue/Random,
Age Up, opening selected controls, shared filters, and the equivalent existing
Pets/Destinations tabs. No action, dimension, delay, stat value or artwork changes.
The grey More Life Options glyph's original solid background already exceeds
3:1. White/card death actions likewise need no change.

Error and positive-result text use appearance-specific foregrounds, independent
of white-labelled danger/positive buttons. Muted light text is slightly darker.
The shared active navigation label also gets a text role instead of the stat
blue; this matters for its small label in both appearances. Stat/illustration
blue and green stay unchanged.

| Actual role | Calculated contrast |
| --- | ---: |
| White on blue / pressed blue | 4.862 / 5.500 |
| White on green / pressed green | 4.815 / 6.436 |
| White on red / pressed red | 5.236 / 6.717 |
| Light muted, worst of page/card/inset/selected | 4.642 |
| Light error / positive text, worst of those surfaces | 4.633 / 4.916 |
| Dark muted / error / positive text, worst of those surfaces | 6.388 / 4.856 / 6.005 |
| Active navigation text, light / dark card | 5.424 / 6.410 |

The sRGB relative-luminance checks use rendered light/dark Button labels and
normal/pressed styles, selected/unselected filters, actual modal signed effects
and errors, muted text and navigation labels. The final focused run passes
25 tests across seven suites in 4.493 seconds, including saving feedback,
settings, failure/retry and real SQLite opening/cold-resume checks. The initial
contrast test used an unsupported composite-component lookup; changing the
lookup to the rendered control's ancestor fixed the test without a runtime
workaround. Application/test types and broad regression/export gates remain
the coordinating agent's integration checks.

These are opaque UI-role calculations, not a claim that every generated image,
hero pixel, disabled control or screen-reader interaction is accepted. Disabled
controls keep their existing subdued styling. Final native normal/130% review
and actual TalkBack/VoiceOver speech remain open.
