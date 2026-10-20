# Healthcare availability and prison hospital periods

This increment fixes two reproduced consistency defects. Fees, treatment chances,
hospital length, sentencing, prison stipend rates and country profiles remain the
existing authored game rules.

A patient could retain a cached doctor who had since been admitted to hospital.
`providerFor` excluded dead, travelling and confined doctors, but missed hospital
admission and other existing presence restrictions. Its fallback search had the
same gap. In a production-command scenario based on the immutable employed
graduate, the doctor is admitted through actual emergency care. The next tests
consultation then pays that admitted doctor another 36,000 USD minor units.

Cached and searched clinicians now use the same existing presence predicate,
alongside the existing patient/payer exclusion, location and current doctor-role
checks. The next actual consultation can use another available qualified doctor.
Earlier receipts and medical records retain their original clinician identity.
The reproduced admitted doctor now receives zero from that next consultation;
the available substitute receives its exact fee. Reusing a known available
clinician adds no people or random draws. Quoting remains read-only.

Ordinary prison work, study and exercise also continued during hospital stays.
The configured custody scenario is vandalism, remand, the normal hearing,
guilty plea, a work/study/exercise routine, actual urgent care and continuation of
the interrupted year. A February admission covers the March and April periods.
Before this correction, release in May included three work stipends and three
study months. It now includes only May's 1,666-unit stipend and one study month.
The same three served months, one remand credit, conduct and May release remain.
A separate complete command flow lets the normal March observation offer the
saved medical decision, then chooses care and cold-resumes its result. March's
pre-admission work stays earned; April and May hospital periods add no activity
before the same May release. Acknowledgement continues that interrupted year
without a second care award.
Newly quoted necessary care still costs zero in custody and uses an available
outside clinician. A bill quoted before arrest retains its recorded price.

A plain hospital check inside prison processing would miss the final period:
monthly medical finance already clears the hospital marker before legal
processing. Moving the systems would change economic and arrest ordering.
Instead, medical finance returns the IDs whose final hospital period just ended,
using its existing loop. The engine passes that transient set to legal processing,
which also checks current hospital admission. Work, study and exercise require
attendance; custody time, conduct, stress and release continue as before. An
overdue cleanup is not labelled a new hospital period.

The set is not part of the world or any checkpoint. A production monthly step is
resolved within the existing command before its atomic commit; it cannot publish
a checkpoint between discharge and legal processing. Failed saves therefore retry
the same whole period. No schema or database fields are added, and old earned
study or stipend records are not reduced or recalculated. A later admission cannot
erase work already completed.

Focused verification includes:

- Cached and uncached searches after a real clinician admission, exact payment,
  retained medical history, no extra people/draws and read-only quotes.
- A former clinician's actual conviction and escape, retaining their earlier
  care identity while selecting another available doctor.
- The complete three-period custody/admission boundary, ordinary prison periods,
  the final discharge period, exercise/study restrictions and once-only processing.
- Already-earned study and wages surviving a save, later admission and release.
- On-disk SQLite failure rollback across all eight tables, warm retry with zero
  full checkpoint unpacking, exact original backup bytes, closed/reopened cold
  results and once-only acknowledgement for consultation and year continuation.

All **207 focused tests / five suites** pass in **15.079 seconds**, covering the
new availability/transaction cases and existing health, legal, service and foreign
earnings tests. Strict application and test types pass. Full integration gates
remain with the coordinator.

Scenarios use immutable prior fixtures plus production commands and explicitly
configured legal test seeds; they are not native birth-to-prison journeys. No
fixture was regenerated. The coordinating branch owns the future engine34 tag
and complete integration gates; this branch changes no model, schema or reader
version. The same existing annual-policy seed set remains an integration gate,
not an additional distinct-seed or physical-performance claim.
