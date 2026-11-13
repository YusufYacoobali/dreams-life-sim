# Organised Crime risk comparison

Baseline gameplay source: `736e1857`. After: checkpoint 7's prospective v3 mission policy. Reproduce with `node tools/profile-organised-risk.cjs SOURCE OUTPUT.json`; the shared test driver is `tests/game/organised-risk-profile.test.ts`. To reproduce the baseline, extract `src` and `tests/fixtures/v3-employed-graduate.json` from that commit into a separate directory and make the installed dependencies available there. Neither source tree is changed by the profiler.

Both runs completed 25,344 independent mission trials (256 deterministic seeds per mission/style, rank cohort and approach) plus 768 career progressions (128 seeds per style/approach, up to six actual annual cycles). Progressions earn promotions through normal commands, choose available annual decisions and stop at their first assignment-related arrest. Independent rank cohorts explicitly set rank and skill to isolate risk; they are not claims of naturally earned careers. This is Node gameplay evidence, not device performance or a prediction of every player's experience.

The baseline's detection rates were high even on the introductory Missing Envelope assignment. Reports/confiscations also forced immediate arrest regardless of detection. The prospective policy now scales detection with the assignment's required rank, stakes, approach, organisation and player skill. Reports in new v3 missions raise evidence to at least 70 and can lead to an immediate detection arrest or a later investigation. Existing v2 reported incidents retain their required cases; no saved rolls or evidence are recalculated. No additional simulation RNG draw is introduced.

Introductory assignment, rank 0, 256 seeds per cell; percentages are immediate / eventual arrest (including the saved investigation roll):

| Style | Cautious before | Cautious after | Bold before | Bold after |
| --- | --- | --- | --- | --- |
| Street | 35.9 / 50.8 | 7.8 / 23.0 | 67.2 / 80.9 | 35.9 / 62.1 |
| Fraud | 40.6 / 54.3 | 9.0 / 27.3 | 84.8 / 91.4 | 36.7 / 64.5 |
| Smuggling | 62.5 / 71.5 | 10.9 / 28.9 | 88.3 / 94.1 | 38.7 / 64.8 |

Cautious careers reaching the first / second promotion, out of 128 seeds:

| Style | Before | After |
| --- | --- | --- |
| Street | 25 / 3 | 71 / 31 |
| Fraud | 28 / 3 | 70 / 29 |
| Smuggling | 19 / 1 | 63 / 24 |

Arrests remain substantial: 116–123 of 128 cautious careers and all 128 bold careers in each style were eventually arrested within the driver window. It is easier to develop a crew, while bold decisions, evidence and reports still carry consequences. Full cohort counts and earned progression are stored in the adjacent compressed before/after JSON files.

The first larger Jest profiling attempt completed mission trials but failed in its driver when an annual event had already used the promotion decision; its incomplete run is not the evidence above. The corrected driver checks that allowance and runs against both source trees. Focused CI tests retain the smaller deterministic sample and comparative risk assertions.

Compatibility: `tests/fixtures/v2-polish-crime-risk-before.json.gz` was captured before the policy change. Its pinned SHA-256 is `21b3c305ac3f3a0b26c6bd46d6e3699feb1fa405f9d3879dafbf65e9e1d4838d`. Tests retain literal old pending text, cases, money and follow-up outcomes. A real new reported mission also exercises later arrest, SQLite rollback/retry, actual closed-connection reopening and an independent pre-arrest checkpoint.
