# Immediate adoption details

Selecting a shelter pet previously appended its details below all six catalogue
rows. The viewport stayed in place, so a successful tap could appear to do
nothing. The actual Android check needed two swipes to find Review Adoption.

Selection now opens a separate detail view at its top. A stable key clears the
catalogue's old scroll position. The review action stays in a keyboard-aware
footer while the name, responsible adult and actual adoption/monthly care costs
remain readable in the scrollable content. Offer ages show “1 year” and
“6 months” accurately. Reference10 was reopened for this change.

The header, Close action and Android hardware Back return to the catalogue.
The hardware handler exists only while these details have focus, and does not
navigate away during a pending save. Cancelling the confirmation keeps the
name draft. Browsing, editing the draft, reviewing and cancelling do not submit
an adoption. The existing adoption/declined-consent and failed-save retry paths
keep their actual costs and atomic save-before-publish behavior.

Game, persistence, versions and the content catalogue remain unchanged from
77d1c6c: World30 / engine31 / content8 / reader10 / checkpointv4. The source and
final scoped checks are recorded in verification/pet-adoption-details-20261020.json.
The prior complete1,657-test and120-lifetime gates retain their original source
scope. This UI increment does not add a new whole-regression or distinct-seed total.

All106UI/state checks pass, plus the final typed-event pet flow check, strict
app/test types and both fresh Hermes exports. Actual Android normal/130%text,
keyboard, confirmation/cancel, scrolled selection and hardware Back pass with
every save table exact; original font1.0 is restored. This closes this screen's
interaction case, with broader physical/iOS/standalone/release gates still open.
