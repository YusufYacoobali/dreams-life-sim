# Durable Health confirmations

The Health vaccination, Doctor visit and condition-treatment confirmations used
to close before the command finished saving. A receipt-write failure discarded
the visible review and left its error behind the modal. They now share one
Health review helper which closes only after dispatch returns true.

The exact selected vaccination, clinical service or condition command and its
reviewed terms remain available after failure. One inline polite alert appears
inside that review; the background error is hidden while it is open. Immediate
submission guards block a second dispatch, cancel and hardware Back while the
first save is pending. A successful save closes the review and exposes the
already recorded production result. Retrying does not choose a different
clinician, charge twice, reroll a diagnosis or reroll a treatment response.

Reviews follow the actual life, patient and, for treatment, condition identity.
Changing those identities discards the old review. An unrelated saved revision
does not clear its selected action or replace its reviewed terms. Vaccination
selection also resets when the actual life or patient changes. Vaccination
confirmation explicitly names routine or seasonal protection and its period.

Read-only availability mirrors existing command restrictions: current protection,
actual yearly attempts, diagnosed/current treatment, custody, in-person absence
and elective-care age/health rules. One current vaccine does not block the other
available kind. Existing hospital visits, publicly funded care, caregiver funding
and remote stop-treatment actions keep their existing engine rules. The vaccine
fee and ongoing-treatment review now show the engine's existing zero patient
fees in custody.

The approved Health and clinic structure in design reference10 is retained.
No game, model, persistence, shared EventModal, version or immutable fixture is
changed. Costs, outcomes, treatment progression, provider selection and actual
payments still come from the same production commands.

Focused checks use the unchanged employed-graduate fixture, actual emergency
care and the remaining normal year from the genuine v8 medical archive. Separate
original native archive rows remain pinned in an on-disk SQLite database. Receipt
failure must roll back every row in all eight tables and the entire world;
retry must avoid full checkpoint unpack and match the complete expected command
world. Closing and reopening the database must resume that exact saved result;
acknowledgement must retain its actual protection, clinical records, treatment,
payments and RNG. Additional checks cover cancel/current-protection no-ops,
immediate duplicate submissions, unrelated revisions and actual identity changes.
These are scoped component and persistence checks, without a new native,
whole-life, country-rule or release acceptance claim.

All nine focused checks across two suites pass in 42.209 seconds, including the
existing clinic and routine flow checks. Strict application and focused test
types pass. Initial test diagnostics accessed a native host handler directly
and then bypassed the button's own pressed state; the final race check makes a
real first press followed immediately by the stale review callback, without
changing source behavior or relaxing the one-dispatch assertion.
