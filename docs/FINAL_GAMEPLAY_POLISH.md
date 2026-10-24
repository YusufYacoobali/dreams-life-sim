# Final gameplay and performance polish

Baseline: `work` at `3c797e2253c98714c79d73191a09889774afccd5`.

## Medical episodes

Meaningful persistent symptoms now offer a real assessment, with the illness
named only after diagnosis. Visits use the existing clinician, payer, cost and
diagnosis rolls. Each actual diagnosis has its own treatment choice; programmes
still improve, fail or cause side effects through the monthly health system.
Minor self-resolving illnesses do not start this popup sequence.

Critical illness can cause a real urgent admission, with treatment, bills,
possible arrears and the existing work/study interruption rules. An admission
latch survives saving and loading; an unchanged severe condition no longer
creates another hospital assessment each calendar year. A genuinely stabilized
condition can later have another crisis. Medical results take priority while
retaining queued stories.

World49 / engine51 / content28 and database reader29 add per-condition episode
metadata. Existing database rows are retained during the reader upgrade. Genuine
old medical decisions keep their original choices, quotes, results and records.
See [medical episode details](MEDICAL_EPISODES.md).

## Partner, eligibility and purchases

Adult romantic partner profiles group Date, Spend Time and baby planning.
Trying uses the original conception rules. A separate discussion may change an
actual persisted preference, or produce delay, refusal or annoyance. Agreement
is never guaranteed and creates no pregnancy. Discussions are limited per
partner and calendar year. Existing manual preferences remain intact until a
genuine agreement. Family keeps children, pregnancy, adoption, household and
legacy information, with a link to the partner profile.

Ordinary eligibility explanations use inline secondary text, including disabled
medical decisions. Decorative blue notices were removed; real selections,
pressed states, charts and result indicators retain their colours. The
[screen audit](FINAL_POLISH_UI_AUDIT.md) records those distinctions.

Purchases and signed leases return to Assets after a successful durable commit
and confirmation dismissal. The saved result remains pending for one normal
acknowledgement. Cancellation, insufficient funds, failed saves, old callbacks
and leaving the screen cannot cause a redirect or duplicate purchase.

## Audience criticism

A source-post controversy starts a seven-calendar-year cooldown for that person
across all profiles. Afterwards, the first published post of an eligible year
has an 8% ordinary / 25% provocative chance, halved by moderation. Later posts
cannot repeatedly reroll it. Existing posts, archives, deleted profiles and
controversies supply the history; no new save field or extra response draw is
needed. Blocking controversy happens before its penalties, not just its popup.
See [cooldown rationale and cases](verification/final-social-cooldown/README.md).

## Performance and verification

The performance work keeps every journal fact, person, transaction and restore
point. It targets measured schema/serialization and journal rendering costs;
unchanged data can be reused only with private validation certificates and exact
content/key-order checks. Cross-world monetary, date and reference validators
still execute. The checkpoint format and durable commit boundary are unchanged.
The complete journal stays in the Life list, with stable old rows, scroll-follow
behaviour and Android clipping safeguards retained.

The core and UI reports below contain the five-age workloads, before/after
medians, p95s, source/input hashes and mixed results. They isolate optimisation
from gameplay changes; they are not measurements of a phone's frame rate.

The final integrated check also compares identical **World49** gameplay with
and without the optimisations, alternating execution order across eleven pairs
per case. Full resulting worlds, RNG and command counts match. The reference is
`9253a1b`; the candidate contains the integrated medical and performance changes.

Cloud Node elapsed milliseconds, **median / p95**:

| Age | Routine action, before → after | Complete year, before → after |
| --- | --- | --- |
| 50 | 52.83 / 63.51 → 38.54 / 44.82 | 119.76 / 143.72 → 111.53 / 125.89 |
| 70 | 63.43 / 82.29 → 53.42 / 61.62 | 330.25 / 438.83 → 283.46 / 461.47 |
| 90 | 80.51 / 87.91 → 63.49 / 67.80 | 747.37 / 798.38 → 693.98 / 774.45 |

The routine switches an existing health habit. A complete year includes all
normal simulation and intervening decisions/results: two, four and six commands
in these three saved contexts. Packing follows each command. This paired check
does not include SQLite or React; those have separate measurements below.
Median paired routine ratios are 0.748, 0.842 and 0.791. Individual first Age Up
steps remain mixed: paired ratios are 0.953, 1.044 and 1.036. The age-70 yearly
p95 also increases, and the isolated age-90 UI median is slightly worse. These
tails are retained in the [complete integrated comparison](verification/final-polish/integrated-performance.json),
not hidden behind a universal speed claim.

- [Core simulation, checkpoint and SQLite benchmarks](verification/final-polish/performance-core/README.md)
- [Life journal and React measurements](verification/final-polish/performance-ui/README.md)
- [Integrated checks and source boundaries](verification/final-polish/verification.json)
- [Before/after browser layout evidence](verification/final-polish/visuals/browser-checks.json)
- [Capture provenance and original tree comparison](verification/final-polish/visuals/capture-provenance.json)
- [Visual review index](verification/final-polish/visuals/README.md)

Final verification covers **329 suites / 5,288 passing tests**, with no pending
tests, plus the **120-life soak** across 120 distinct seeds. Application and test
TypeScript checks pass; the import check reports 506 modules and zero cycles.
Android and iOS production Hermes exports pass, and their source maps contain
all 23 changed runtime files with the verified source hashes.

The first full regression completed with 10 failing suites / 53 assertions that
still expected old medical prompts, removed Family text, mutable appearance
copies or pre-episode comparison envelopes. After correcting those expectations,
all ten affected suites pass their 171 tests on the same application runtime.
The combined count above replaces those suites rather than counting them twice;
it includes three new cases. The original full-run output and all passing reruns
are retained, compressed, alongside the [verification record](verification/final-polish/verification.json).
No frozen fixture bytes or historical canonical hashes were restamped.

The soak completed every seed from 0 through 119, with factual deaths at ages
22–95 and up to 61,470 retained ledger rows. All application runtime files were
unchanged throughout the final full regression, soak and focused reruns.

Browser pictures render production React Native trees through a CSS/SVG
adapter. Connected component tests use real SQLite with mocked navigation;
they verify the committed destination and inventory, not a native navigation
stack. No Android/iOS device or simulator is attached here. Native release tap
latency, GPU/frame stalls, native text shaping and physical-device routing remain
unverified. Production exports establish bundling, not those device behaviours.
