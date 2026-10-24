# Before/after layout review

These 60 PNGs show actual production React Native component trees rendered with
a browser CSS/SVG adapter. They are layout evidence, not native screenshots or
measurements of navigation, native text shaping or device performance. Before
uses `3c797e2`; after uses the integrated application source from `2f872bf`.

| Flow | Light | Dark, narrow, large text |
| --- | --- | --- |
| Symptoms | [Popup](medical-symptoms-light-bottom.png) | [Popup](medical-symptoms-dark-large-bottom.png) |
| Diagnosis | [Treatment choices](medical-diagnosis-light-bottom.png) | [Treatment choices](medical-diagnosis-dark-large-bottom.png) |
| Critical admission | [Saved result](medical-urgent-light-bottom.png) | [Saved result](medical-urgent-dark-large-bottom.png) |
| Partner discussion | [Date, time and baby actions](partner-discuss-light-baby-actions.png) | [Date, time and baby actions](partner-discuss-dark-large-baby-actions.png) |
| Family | [Overview](family-light.png) | [Overview](family-dark-large.png) |
| Astronaut requirement | [Inline requirement](astronaut-requirement-light-bottom.png) | [Inline requirement](astronaut-requirement-dark-large-bottom.png) |
| Purchase | [Confirmation](purchase-confirm-light-bottom.png) | [Confirmation](purchase-confirm-dark-large-bottom.png) |
| Saved purchase in Assets | [Committed context](purchase-saved-context-light-bottom.png) | [Committed context](purchase-saved-context-dark-large-bottom.png) |

The prepared partner-ready fixture wants children but has incompatible
reproductive roles, so its disabled reason is intentional. Eligible conception
is covered by the connected tests, not claimed from that picture. Purchase
captures use the real SQLite/store with a mocked router handoff to Assets.

[Browser checks](browser-checks.json) retain viewport, modal-action visibility,
font/image decoding, overflow and request checks. [Provenance](capture-provenance.json)
retains original and portable tree digests, source/world hashes, PNG digests and
38 actual artwork-file hashes. Only Jest asset paths were normalized; text,
values, nodes and styles are unchanged. Original trees are retained alongside
the images in `trees-before/` and `trees-after/`.

Reproduction uses `tests/ui/final-polish-capture.test.tsx` and
`tests/ui/final-medical-capture.test.tsx`, then
`tools/build-product-polish-review.cjs`, `tools/capture-final-polish-review.cjs`
and `tools/verify-final-polish-evidence.cjs`. The main verification report records
the original capture-test and browser-log hashes.
