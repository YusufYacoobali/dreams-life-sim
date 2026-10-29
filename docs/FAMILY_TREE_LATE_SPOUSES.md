# Retained late spouses in Family Tree

The family-tree reference (`design/family tree.png`, navigation reference R06)
connects real parents, the player, spouse and children. Source specification
Part 11 requires legacy transitions to maintain actual family relationships.
The existing tree followed parent/guardian edges and the current active romance.
After death, the actual marriage becomes death-ended and the romance becomes
widowed. A childless deceased spouse consequently disappeared from the tree.

The route now also seeds the active person's real death-ended marriages when
the other saved person is deceased. These rows say **Late spouse**, keep the
existing age-at-death/year marker, and open the same person's existing profile.
All such marriage records are considered; person IDs are deduplicated with the
existing connected-person Set. Current living romances, parent/guardian branches,
children and navigation retain their existing behavior. A divorce followed by
death does not become a late marriage. No relationship is inferred from a name,
shared household, a widowed romance alone or an unrelated person's marriage.

This changes only the read-only Family Tree route. No people, marriage/history
rows, money, dates, RNG, core rules, schemas, versions or persistence are changed.
The existing eight-pass parent/guardian traversal is retained; this is not a
redesign of distant-family traversal or the reference's complete visual layout.

The focused component/codec regression uses unchanged genuine v5 paid-marriage
and v6 birth worlds, then calls the real `recordDeath` transition on their actual
existing spouse. That mortality boundary is explicitly arranged, not a natural
death or native lifetime claim. Original v5 cash/trust and v6 fertility/outcome
preparation remain the historical fixture scope described in the fixture README;
this test introduces none. It checks a childless late spouse, one copy when a
real child also connects both parents, real parents, exact deceased identity,
person/profile/Back navigation, and a full canonical codec reopen. A real divorce
command before death checks the negative historical case. The unchanged v17
pension archive supplies an already deceased parent and actual death-ended
parent marriage, without claiming the player is that widow.

Rendered worlds are frozen. Complete canonical worlds remain exact through
browsing/navigation and the codec reopen; persistence, command dispatch and
checkpoint unpack spies remain unused by the route. This focused scope is
read-only component and codec evidence, not new SQLite, process-cold or native
acceptance. Existing connected family persistence tests cover those separate
boundaries. No fixture is regenerated or edited.

Verification: four focused cases / one suite pass in 2.158 seconds; strict
affected route/test types pass with no diagnostics, and the diff check passes.
The initial run remains a separate failed diagnostic: three passed and one
query failed because the genuine v17 world contains two different people called
Sora Romano. The corrected query uses the recorded age/death label, then checks
the exact person-ID destination. No source or fixture was changed for that
query fix. Earlier and final counts are overlapping, not additive.

No broad regression, export, cohort, native or additional SQLite gate was run.
Multiple historical marriages are handled by the route's actual-record loop and
person-ID Set; a natural repeated-marriage lifetime was not newly exercised.
