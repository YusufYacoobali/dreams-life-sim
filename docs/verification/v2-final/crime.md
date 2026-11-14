# Final V2 Organised Crime balancing

Checkpoint 2 revises **new assignment results to rules version 4**. Old v2/v3 incidents, evidence, rolls, investigations, cases, money and saved result text retain their recorded values. No migration, extra random draw or change to ordinary crime/court rules is introduced.

The remaining problem was delayed exposure. A quiet cautious v3 assignment still left roughly 30 evidence on average before complications. Every unsuccessful solo smuggling assignment produced a confiscation report with at least 70 evidence. Applying the ordinary saved investigation roll to that evidence after each assignment made arrests accumulate even when immediate detection was low.

V4 scales detection and evidence with the assignment's required rank and stakes, the character's rank and criminal experience, and approach. Organisation style adds detection exposure and retains its distinct outcomes. Caution leaves fewer traces; experience reduces exposure without erasing it. Seniority and larger assignments add exposure. Reports remain stronger leads, starting at 32 evidence for cautious introductory work and increasing with stakes; bold reports start at 70. A betrayed assignment retains at least 65 evidence. A reported complication does not force an arrest: the existing detection and later investigation rolls determine whether it becomes a case.

Promotion requirements and yearly limits were reviewed and retained: two successful jobs for the first promotion, four for the second, appropriate loyalty/reputation/experience, two assignments per year and one major decision per year. The earned-career comparison below assesses those actual constraints. Changing them alongside legal exposure would obscure which bottleneck improved.

## Reproducible comparison

The unchanged gameplay methodology runs 25,344 independent assignment trials (256 seeds per mission/style/rank/approach cohort) and 768 earned career progressions (128 seeds per style/approach, up to six actual annual cycles). Independent cohorts set rank and skill only to isolate exposure. Career progressions earn promotions through commands, resolve available annual choices, and stop at their first assignment-related arrest.

Run `node tools/profile-organised-risk.cjs SOURCE OUTPUT.json`. The common driver is `tests/game/organised-risk-profile.test.ts`. For the baseline, extract `src` and `tests/fixtures/v3-employed-graduate.json` from `7231fbc64dca7c2960285f69caa38dc6d37ae372` into a separate directory with installed dependencies available. The baseline rerun's complete aggregate rows and careers match the prior committed v3 results exactly. Added per-seed career records and complete final-world hashes do not change commands, seeds or sampling.

The adjacent compressed JSON reports contain every cohort total, every career summary, source/driver hashes, and hashes of the ordered streams of complete encoded final worlds for all mission trials and careers. These are gameplay comparisons under Node, not device performance measurements or promises about an individual life.

Introductory Missing Envelope, rank 0, 256 seeds per approach. Cells show immediate / eventual arrest, including the saved investigation roll.

| Style | Cautious v3 | Cautious v4 | Bold v4 |
| --- | --- | --- | --- |
| Street | 7.8% / 23.0% | 4.3% / 7.8% | 35.2% / 53.5% |
| Fraud | 9.0% / 27.3% | 5.1% / 9.8% | 36.3% / 59.0% |
| Smuggling | 10.9% / 28.9% | 8.6% / 16.0% | 37.1% / 57.4% |

Earned cautious careers, 128 seeds per style, up to six years. Promotions are earned through the unchanged requirements. Reaching a fourth assignment is distinct from completing all six years without arrest.

| Style | Arrests v3 → v4 | First / second promotion v3 → v4 | Reached fourth assignment v3 → v4 | Total attempts v3 → v4 |
| --- | --- | --- | --- | --- |
| Street | 116 → 79 (90.6% → 61.7%) | 71 / 31 → 91 / 58 | 75 → 105 | 656 → 1020 |
| Fraud | 118 → 92 (92.2% → 71.9%) | 70 / 29 → 95 / 61 | 64 → 100 | 566 → 907 |
| Smuggling | 123 → 106 (96.1% → 82.8%) | 63 / 24 → 77 / 49 | 62 → 88 | 498 → 787 |

Cautious six-year arrests decrease from 357/384 (93.0%) to 277/384 (72.1%), a 20.8 percentage-point reduction. Across styles, 68.8–82.0% reach a fourth assignment, and roughly twice as many earn the second promotion. Bold careers still arrest all 128/128 characters in each style during this driver window. Smuggling remains the harshest cautious career at 106/128 arrests (82.8%); the change materially improves its introductions and promotions but does not make a six-year criminal career safe. These provisional balancing results merit playtesting rather than a hardcoded survival guarantee.

Complete final-world hash streams are SHA-256 of each `encodeWorld(finalWorld)` followed by a newline, in driver loop order. Source hashes cover sorted `src/game` paths/bytes and the starting fixture; driver hashes cover the shared TypeScript driver. Outcome and source hashes differ between rules revisions; the common driver hash is identical.

| Evidence | Before v3 | After v4 |
| --- | --- | --- |
| Gameplay source + starting fixture | `e70190f9a72abd92a0e0015683ecd7ff2ec17c5e10e0436cf3b60308d4cbef43` | `e3161b8128c233f29b1b65734a566c2df20d4e95755ea80932dc328d936db488` |
| Common driver | `4a5aea4f9f944988bc93a791813fa345ec89cfd17365fa164bd4b341849a1c7c` | `4a5aea4f9f944988bc93a791813fa345ec89cfd17365fa164bd4b341849a1c7c` |
| 25,344 complete mission worlds | `21dc2874fc8c70c8c241d8329bbccd8387511ebbd2182ae945e78d487eb0b3e6` | `123efc6a5db304cf0fed713355b87e5d461dcc63f8239df51a18f43632cd135f` |
| 768 complete career worlds | `b754ee02b92dd28c77ccbe1e771919e23a749957f837c966523f9c82e16a5f89` | `e83574472c75dad6af59427fcec5c98bfb846ff6cdc2891a6002d2fffd3806fb` |

## Compatibility and validation

`tests/fixtures/v2-final-crime-v3-before.json.gz` contains nine actual worlds produced by the frozen starting executable: all three organisation styles, each with an immediate arrest, later arrest or closed investigation. Tests pin the archive SHA-256 `4a41dae479b531b2f2b22e1b719efa92e0d2a8ff2e7f8ccf31d338c0cc54dd53`, compare complete checkpoint round trips and exact six-month legal follow-up worlds, and compare new v4 raw rolls/RNG states with the original v3 execution. The existing genuine v2 archive remains independently pinned and unchanged.

New v4 reported assignments exercise both a closed investigation and a later genuine arrest. The arrest test injects a SQLite failure, checks unchanged store/database state, retries the command, closes/reopens the real database after commands, verifies exactly one case, and restores the independent pre-arrest checkpoint. Forged reported evidence is rejected on decode. Crew betrayal, conserved payments, frozen result text, promotion allowances and the three actual organisation journeys remain covered.

Validation passed: six regression suites / 118 tests (`organised-risk-profile`, `organised-crime`, `organised-crew-refinement`, `refinement-seeded-journeys`, `organised-risk-compatibility`, `organised-crime-flow`), followed by three targeted suites / 32 tests after the final compatibility and evidence assertions (`organised-mission-refinement`, `organised-risk-policy`, `organised-risk-compatibility`). These runs overlap in the compatibility suite. Application/test TypeScript checks pass, as does the 616-module runtime import check with no cycles. `git diff --check` is clean.

Native device acceptance, full regression and the 120-life simulation are recorded by the integrated final verification. No device result is claimed by this checkpoint.
