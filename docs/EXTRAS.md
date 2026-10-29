# Factual progress and Extras

Extras is reachable from Activities and the Life options menu. The first
catalogue contains twelve achievements and four challenges. It follows the
reconciled Extras, achievement filters and challenge-detail design without
inventing rewards, unlock dates, completed goals or a larger catalogue count.

Achievements offer All, Life, Career, Wealth and Special filters. Challenges
offer All, Easy, Medium and Hard filters. Details show actual recorded values,
targets and partial progress; their shortcuts open the existing relevant
gameplay page. They do not perform that gameplay action. Help is available
before creating a life, in Settings and in Extras.

## Meaning of the records

`src/progression/progress.ts` projects existing world history. It does not modify
the engine, schema, RNG, awards, save files or money. Counts belong to a specific
person and timeline. Restoring a prior moment or continuing as a child therefore
shows that history, rather than borrowing the previous actor's achievements.

School report goals require an actual report, including the 80% report goal;
current live grades alone do not count. Academic help must have been accepted.
School clubs count distinct attended school months. Working months come from
work history once. Hobby routine months require attended monthly practice,
rather than manual taps or paused plans. Pet care excludes unfunded periods and
belongs to the actual adopter. Completed trips count their actual participants
and destination countries. Debt repayment requires recorded cash/debt decreases
and counts distinct months, rather than repeated taps in one month. The project
goal explicitly covers the five careers represented by that project history.

Heirlooms lists currently owned possessions received through estate inheritance
or family legacy. It uses actual ownership/provenance and opens the existing
asset details. Empty collections stay empty; no free collectible is created.
Life Summary now displays recorded milestones and virtualises journal entries
with a bounded initial render, retaining access to every entry by scrolling.

## Verification and scope

All **70 checks / 37 suites** in `tests/ui` and `tests/progression` pass in
**82.193 seconds**, with strict application/test types and fresh Android/iOS
Hermes exports. This is an affected UI regression, not a new whole-game test
total. The complete 1,226-test / 80-suite baseline remains at `e5a4aaf`.

The new checks use genuine child, employed-graduate, family-trip and family
archives. Real commands verify resumed months, reports/help, repeated debt
repayments, asset purchase, will, estate settlement and child continuation.
Read-only connected browsing compares every row in every SQLite table and the
complete encoded world. Required decision Back still cannot acknowledge or
choose; a read-only milestone can close with Android Back.

[Projection diagnostics](verification/extras-projection-20261020.json) retain
the existing real age-30/60 two-routine inputs: 16,480/38,730 ledger rows and
462/939 journal entries. The 31-sample warm median is 0.234/0.649 ms. These are
cloud CPU measurements of the projection, not native navigation/startup timings.
The entire worlds remain exact. Screens memoise the projection and do not save
when browsing.

[Actual Android captures/comparison](verification/android24-extras-20261020/)
confirm Extras, All/Special achievements and detail/Back, All/Medium challenges,
Care and Craft details, View Pets, the empty inherited collection, Help and
scrolling Life Summary. Every row in all eight native SQLite tables stays exact:
three lives, twelve moments, seventeen receipts and active revision 53. Actual
earned milestones are four, with one completed challenge. The inherited-item
estate journey is automated; the native collection here is empty.

The initial catalogue is a production-plan increment, not the complete Extras
or game release. Broader catalogue/content review, complete reference and
accessibility acceptance, physical-device performance, standalone and iOS
journeys remain open. Import/export/sharing breadth remains deferred under the
user's current direction. Game/persistence source and versions remain unchanged
while the separate 1,000-seed lifetime run continues.
