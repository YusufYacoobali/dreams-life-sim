# Medical episodes

New symptoms and hospital admissions no longer share an annual severity prompt.
A persistent significant concern can produce one **Feeling Unwell** decision.
Minor colds, flu, chickenpox and sprains do not create that sequence. The notice
shows symptoms, never an unearned diagnosis.

**Visit the Doctor** charges the real consultation price to the existing payer,
uses the recorded clinician and the existing 80% symptom-assessment roll. A
missed assessment remains a missed assessment. An actual diagnosis offers
**Start Treatment** or **Leave It for Now**. One assessment can cover several
concerns: covered notices are withdrawn, their records remain, and every actual
new diagnosis receives its own treatment choice. Existing manually booked clinic
visits retain their established confirmation/result flow and Conditions access.

Starting care uses the existing treatment method, price, response roll, monthly
payments, funding pauses, improvement and recovery rules. Leaving or ignoring
care records the decision without producing treatment. Routine visits still
cannot be tapped for instant recovery.

A genuinely critical condition can require immediate admission. Explicit
thresholds cover serious chronic physical conditions and substance dependence,
as well as severe measles and fractures. High severity alone never sends an
ordinary cold, flu, chickenpox, sprain, anxiety or depression to hospital. Real
urgent care creates the existing bill (including unpaid arrears), clinician
record, treatment and two-month hospital interval before the saved **Rushed to
Hospital** result. That result has priority 140 over ordinary stories. Current
work/study are interrupted immediately; existing monthly pay and absence rules
perform the accounting. Unavoidable urgent care cannot deadlock a minor's Age
Up because no adult payer is recorded; the existing arrears engine retains the
real obligation. The original optional legacy care choices keep their original
payer restrictions.

Each condition has durable notification/assessment/admission state. A continuing
high score cannot create another annual prompt or repeat the same admission.
A later genuine relapse can require a new admission only after recorded
stabilization below severity 35. All earlier records and bills remain. New
episode offers superseded by real assessment/admission are reconciled; old
`medical-emergency` decisions and their bound quotes, copy and choices stay
literal.

World 49 / engine 51 / content 28 and database reader 29 cover the state and new
typed effects. The migration adds prospective episode metadata without changing
saved events, outcomes, diagnosis dates, history, balances or RNG. Only an actual
old hospital record can seed an admission latch. Current admission metadata must
match a real dated hospital record; forged latches and malformed medical offers
are rejected. Reader upgrades change the database marker without rewriting old
current/backup/snapshot payloads.

`tests/fixtures/v48-medical-before-episodes.json` was captured independently from
commit `3c797e2` with `tools/capture-medical-episodes-before.cjs`. Its two genuine
pre-feature decisions and four choice outcomes are compared as complete worlds,
normalizing only the new tuple and episode fields. Existing archived fixtures
remain unchanged. Tests also cover missed diagnoses, multiple concerns, repeated
severe months, relapse, priority/deferred preservation, actual fees, failed atomic
saves, exact retries, cold restarts and duplicate taps.

`tests/support/medicalEpisodes.ts` provides controlled scenarios for UI review.
They use an old graduate fixture, an explicitly added concern/care budget and a
seeded real diagnosis roll. They are not natural-play, native-device or clinical
probability evidence.
