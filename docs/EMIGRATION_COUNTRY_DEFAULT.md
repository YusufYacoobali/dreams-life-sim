# Emigration country selection

A French resident previously opened the application form with Paris selected
internally, even though France was removed from the visible foreign-country
list. No visible country was selected, the application described Paris, and
review was blocked with “Choose a country outside your current residence”.
This also happened after the same player moved to France because the local form
was scoped to life/person/entry route without its changed residence.

The form now initially selects London for a French resident and keeps Paris as
the existing default elsewhere. This uses actual residence, independently of
nationality. Local form identity also includes the home country and city, so a
real move reinitialises the plan. Ordinary revisions and failed saves in the
same residence retain their reviewed destination and fee.

The approved specification requires foreign travel/emigration and consistent
country/currency use. The supplied travel reference and reconciliation were
reopened. No layout, destination catalogue, country rule, application chance,
fee, qualification, consent, job contract or currency conversion was changed.

The completed twelve-country professional and criminal policy reports were
audited for blocked transitions and native monetary terms. Their ordinary
affordability, consent and early-death outcomes did not establish a reason to
tune prices or waive requirements. The French criminal strategy explicitly
chooses London; the player-facing default failed to make that valid choice.

The [new connected checks](../tests/ui/emigration-country-default.test.tsx)
reproduce four failures before the fix. Three create and acknowledge an actual
French birth through the store, then check the work/study/emigration form's
foreign selection without bypassing its age-eighteen restriction. These are
initial-state route checks, not a claim of a playable childhood move.

The other check imports the original v20 archive, whose existing Japanese work,
accounts and documented historically funded setup remain intact. Real UI
application and departure commands move this US national from Japan to France,
using the original RNG and actual reviewed Japanese/euro conversion. No saved
funds, date, nationality, residence, qualifications or outcome is edited to
prepare the French state. Its next London application checks local cancellation,
the exact euro fee, rollback of all eight tables/current world, a retained single
modal alert, warm retry with zero full checkpoint unpacks, exact cold recovery
through a newly opened database/store and acknowledgement without a repeated
charge. Original snapshot payloads remain byte-identical.

All eighteen affected checks across four suites pass in 15.861 seconds with a
30-second test timeout, including the existing travel and relocation suites.
Strict application and test type checks also pass.
These are component/SQLite checks, not native timing or whole-game balance
acceptance. Game, persistence, progression and immutable fixtures remain exact
to base 532a7ce; final integration gates belong to the coordinating workstream.
