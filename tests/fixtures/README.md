# Save migration fixtures

- `v1-newborn.json`: created with the actual model and creation resolver from commit `44d8bc3`, seed 42, date 18 October 2026.
- `v2-birthday-result.json`: created with the actual model, creation and annual resolver from commit `1ca6d94`, seed 42. The first birthday choice is already committed, while its result awaits acknowledgement.
- `v3-employed-graduate.json`: created with the actual engine from `0c93e75`, seed 16, a US character with fixture-initialised Smarts/Discipline of 90/80. Eighteen years of school, a funded computing degree, an accepted developer application and a year of work produce actual qualifications, debt, tax, work history and 213 ledger rows.

These fixtures preserve the old encoded formats, exact money, random streams and bound narrative. Tests migrate them through the current codec and verify their continuation without rerolling or reapplying effects. Do not regenerate old fixtures using the current model.
