# Persistent gameplay and balance observations

Eight automated player policies passed in the complete regression at `5f51d2e8`.
Every command commits to real on-disk SQLite and physically reopens the connection;
selected commands exercise all-table rollback, cold retry and idempotency. These
are reproducible command policies, not human enjoyment or installed-device tests.
The final trade-in UI restriction does not change their game/persistence sources.
Full command traces and final subjects are in [journeys](journeys); derived
measurements are in [balance.json](balance.json).

| Policy | Years enabled | New situations | Per enabled year | Maximum in one calendar year | All decisions / results | Encoded save / checkpoint bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Young driver through 18 | 18 | 3 | 0.17 | 2 | 19 / 32 | 1,781,749 / 98,835 |
| Property investor | 5 | 4 | 0.80 | 2 | 8 / 30 | 564,574 / 46,502 |
| Vehicle enthusiast | Same-date actions | 0 | Not annualized | 0 | 0 / 9 | 89,179 / 11,675 |
| Hobby specialist | 2 | 1 | 0.50 | 1 | 3 / 9 | 172,515 / 20,528 |
| Pet/family succession | 3 | 2 | 0.67 | 2 | 5 / 14 | 339,072 / 30,493 |
| Multiple generations | 1 | 0 | 0 | 0 | 1 / 15 | 227,778 / 24,017 |
| Ordinary control through 90 | 70 | 0 | 0 | 0 | 69 / 147 | 14,868,389 / 811,589 |
| Paid-reading life, natural death 84 | 64 | 13 | 0.20 | 1 | 81 / 223 | 12,365,331 / 682,385 |

Decisions/results include ordinary life events and deliberately requested manual
activities; they are not all automatic lifestyle popups. New situations are the
separate saved lifestyle offers. The newborn driver's capability is enabled from
birth, while eligible vehicle ownership starts only at 17, so its 18-year average
must not be interpreted as an active driver's annual rate. The vehicle policy
performs same-date actions: the metric helper's minimum one-month denominator
is not evidence of an elapsed month. Family succession rows end with a younger
existing child, rather than claiming the original adult survived at that age.

There were 23 new situations in these policies. The reading-only policy repeats
its one eligible template 12 times after its initial appearance, at 5–6-year
intervals. Other observed templates did not repeat. This preserves the five-year
cooldown and quiet-year pacing; no policy exceeds two new situations in a year.
Narrow ownership/routine choices naturally expose a narrower set of situations.
The no-property/no-vehicle control has no eligible new subject and receives zero
new situations; ordinary decisions and free leisure still remain available.
The reading policy's 13 situations span 64 enabled years. These counts do not
establish a subjective entertainment rating or justify raising event frequency.

A narrow record-backed severity proxy counts actual new injury/incident/value
rows: one vandalism/loss result among 23 situations; the other 22 have no such
major row. No injury occurred naturally in these policies. Controlled all 120
choice checks separately exercise injuries, insured losses and their exact
records. Mood, bonds, condition, repairs and relationship changes are still real
consequences even when they fall outside this proxy.

## Money and progression

All figures below are actual USD charges/receipts, not cross-currency totals.
The young driver earns part-time wages, passes and buys a used scooter at 17,
drives 40 miles, pays $2.80 running cost and $28 service, and reaches 18. The separate
country tests exercise minimum-age 16/17/18 boundaries; the earned-money journey
does not claim to have afforded a vehicle on its sixteenth birthday.

The adult used compact completes 300 miles, pays $54 running cost,$72 service,
$216 repair and $360 brakes, then transfers the same vehicle through an accepted
gift. Its recorded mileage is 68,300. Neither a gift nor a new birthday creates
cash or a licence. The UI follow-up disables adult-only trade-ins for teens and
shows the same adult eligibility explanation as the engine.

The property policy collects $9,937.20 in scheduled rent and $2,839.20 in later
arrears collection: **$12,776.40 received**, with $851.76 still unpaid. Genuine
maintenance payments total $174.01, plus $48 for the leak situation. The kitchen
costs $1,960 and applicant checking $4. Deposits return in full and are excluded
from rental income. These figures are not net investment profit: mortgage,
purchase/sale fees, tax, insurance and ordinary ownership costs remain separate
ledger obligations. Inspection, disagreement, notice, ending/refund, sale and
an independent Time Machine branch are exercised.

The pet policy pays $32 per care month for 36 months,$40 for an infection vet visit
and $50 for additional companion treatment. Training is free; illness and its care
are real records. The policy remains able to pay, but this single employed-family
sample is not a general affordability guarantee for every household or species.
Explicit end-life and existing-child continuation retain the animal's two owner
histories, training, family bonds and care. They are not natural mortality tests.

The writing policy pays $4 monthly for 24 attended months, reaches 48 proficiency,
meets a real peer, pays a $24 competition entry and completes a project from later
attended months. The reading life pays $8 monthly for 756 attended months; its
recorded proficiency thresholds are 15 in June 2048,40 in June 2049,70 in
September 2050 and 90 in July 2051. It ends naturally at 84 with 100 proficiency.
No mortality, balance, date, random stream, title or qualification is patched.

A separate measured report covers all 16 hobbies in both paid modes; its cohorts
start from the unchanged employed-graduate save, use the two-routine limit,
actual payments, monthly practice records and real cold-reopened SQLite.
The report distinguishes observed attended months from elapsed months and any
missed sessions. It does not extrapolate every hobby's progress from one sample.

## Performance and native scope

Journey command timings were observed during concurrent verification and include
only cloud Node command resolution; they are not isolated benchmarks or native
frame timings. Use the separately retained age 50/70/90 benchmark trials for timing
comparisons. The large control retains 46,660 ledger rows and an uncompressed
save of 14,868,389 bytes; histories are not truncated to obtain these sizes.

The large-text modal test uses width 320/fontScale 2 and actual save failure/retry.
It verifies one first-person journal, real cost/condition rows, acknowledgement
and an unchanged read-only preview. No installed Android/iOS run or human
playtest was performed. Touch interaction, native Back behavior, spoken reader
output, physical wrapping and perceived Age Up responsiveness remain unverified.
