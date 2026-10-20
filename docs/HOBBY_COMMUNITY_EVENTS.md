# Hobby community events

Each of the eight existing hobbies now has an optional local club event: open
mic, art display, photo exhibition, chess meet, reading circle, gaming meet,
cooking tasting or gardening display. These are small community occasions with
shared equipment and materials, not professional qualifications or prize income.
They do not increase the 250 annual-situation catalogue.

A current local routine, at least twelve actually attended monthly practices and
20 proficiency are required. Extra practice does not replace attended months.
Practice history remains useful after changing a routine. The participant must be
at the hobby's existing minimum age, locally available, healthy enough and able
to cover the selected approach's energy. The available payer must cover the
reviewed entry fee using spendable cash. Existing trust restrictions apply.

The detail page opens separately from the routine. It shows actual readiness,
payer, entry fee, energy, approach and conditional commendation chance. Reviewing,
changing an approach, opening history and returning save nothing and draw nothing.
The entry button stays in the keyboard-aware footer. Only the pressed submit
button can show delayed saving progress. A failed save preserves the approach
and shows an accessible alert beside the submit action. Shared confirmation
rows give labels and values equal space, correcting the reproduced cramped
practice label. Native review at 130% text confirms readable terms.

Adults pay from their own account without a parental draw. Minors use the
existing actual local parent/guardian selection and consent algorithm. A refused
request records no attendance, charge, outcome draw or stat effect. There is one
entry or permission request per hobby per calendar year, including refusals.

Accepted entries charge the exact reviewed country/currency fee and draw once.
The commendation chance is clamped to 15–95:

`40 + floor(proficiency / 2) + floor(discipline / 10) + approach adjustment`

| Approach | Chance adjustment | Energy | Actual consequences before stat caps |
| --- | ---: | ---: | --- |
| Familiar skills | +12 | 4 | Commended: Happiness +4, Respect +2; otherwise Happiness +1. Stress −1. |
| Ambitious attempt | −8 | 8 | Commended: Happiness +4, Respect +4, Stress +1; otherwise Happiness +1, Stress +3. |
| Enjoy taking part | 0 | 4 | Happiness +5, Stress −5. A commendation adds Respect +1. |

Results show the actual bounded changes, including zero at a limit. Entry does
not award practice, skill, service, employment, qualifications or prize money.
The journal and event history record actual attendance or refusal. Acknowledging
the saved result awards nothing again. Entry does not advance the calendar.

World31/engine32 stores event identity, participant/hobby/plan, date/location,
payer/permission, practice cursor/proficiency/discipline, chance/roll, payment
receipt and bounded effects. Validation uses the shared ledger index, checks
annual uniqueness, authority, recorded practice, exact receipts and outcomes.
World30 migration adds an empty event collection and updates version tags only;
old raw current, backup and historical payloads are not eagerly rewritten.
Database reader11 prevents older apps from dropping saved event history. Content8
and checkpointv4, their bounds and atomic save-before-publish remain unchanged.
