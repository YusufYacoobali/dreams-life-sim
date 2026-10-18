# Save migration fixtures

- `v1-newborn.json`: created with the actual model and creation resolver from commit `44d8bc3`, seed 42, date 18 October 2026.
- `v2-birthday-result.json`: created with the actual model, creation and annual resolver from commit `1ca6d94`, seed 42. The first birthday choice is already committed, while its result awaits acknowledgement.
- `v3-employed-graduate.json`: created with the actual engine from `0c93e75`, seed 16, a US character with fixture-initialised Smarts/Discipline of 90/80. Eighteen years of school, a funded computing degree, an accepted developer application and a year of work produce actual qualifications, debt, tax, work history and 213 ledger rows.
- `v4-property-offer.json`: continued with the actual `4fd9bca` engine from the v3 graduate (fixture opening cash increased by 10 million minor units), with a studio mortgage and ten GROVE shares. The property is listed and annual progression is paused at month two with a persisted buyer offer, actual mortgage/holdings, prices and FX.
- `v5-marriage-result.json`: generated with the actual `45f2024` model/engine. The v3 graduate has fixture-initialised cash and a known high-trust partner; real proposal and wedding commands pay for/give a ring and form the shared household. The committed marriage result awaits acknowledgement. Existing accounts, 215 ledger rows and RNG streams are retained.

These fixtures preserve the old encoded formats, exact money, random streams and bound narrative. Tests migrate them through the current codec and verify their continuation without rerolling or reapplying effects. Do not regenerate old fixtures using the current model.
