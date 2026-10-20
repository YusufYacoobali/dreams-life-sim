# Emergency context and first diagnosis dates

New emergency decisions show the affected condition's existing authored symptoms. They name the condition only when its diagnosis is already recorded. The hospital explanation, quoted price, choices, effects and random draws are unchanged. This text is bound when a new decision is created; already saved decisions, results, journal entries and historical snapshots retain their original text.

Emergency care and background NPC treatment now set `diagnosed` only when it is null. A later admission or treatment still records its own actual date, provider, outcome and bill. Existing overwritten diagnosis dates are left as saved; this change does not infer an earlier date from old records.

## Observed defects

The completed, source-pinned C35 varied-choice observation (`73cedc7643fa3cbcd0ad32dfa27abfb59dac8aaa`, World 34 / engine 35 / content 10) contained 201 medical decisions. Of these, 161 followed earlier accepted care for the same condition, but every prompt used generic symptoms text. For example, `US/result.json#/decisions/20` concerns known asthma, while decision 26 concerns a distinct anxiety condition; both displayed the same generic $360 assessment copy. The bound condition IDs were correct.

Fourteen actual condition histories retained an earlier care record than their final `diagnosed` date. The US asthma condition `condition_person_player_59_0` had hospital record `medical_63_person_player_0` dated 2021-11-01, but its final diagnosis date was 2049-01-01. Both the emergency path and NPC treatment path assigned the current date unconditionally. Ordinary consultations already kept first diagnosis dates by considering only undiagnosed conditions.

This evidence is from pure engine observation after an ordinary stored birth, with production checkpoint round trips. It is not native or full-lifetime SQLite acceptance. The independent report and exact raw-input hashes are frozen in `/tmp/dreams-editorial-varied-choice-audit-20261020`; the earlier 991 first-choice observations remain separate and unchanged.

## Focused verification

- The genuine immutable v8 medical archive retains its exact old generic pending decision, both choices, $360 quote and journal prefix through a production-codec cold round trip and ordinary acceptance. Its first actual diagnosis and admission are recorded on its saved date.
- The same saved life completes ordinary years, stops treatment through the existing command and encounters a later actual emergency. New copy names the already diagnosed asthma; repeat care preserves the first diagnosis while recording a later treatment and admission. Earlier records and journal entries remain exact.
- Declining the genuine old assessment leaves the next actual emergency undiagnosed. New text shows wheezing and shortness of breath without revealing asthma; subsequent accepted care records that actual first diagnosis date.
- A declared paired unit illness setup differs only in diagnosis knowledge. Ordinary annual advancement produces identical world state after normalizing only that knowledge and new disclosure text. Care retains identical random streams, bound terms, response and payment.
- A declared adult-parent illness setup takes existing monthly NPC care gates without random-state, budget, provider or response overrides. Known and unknown cases have identical care timing and complete state after normalizing only the diagnosis date. The known first date survives a cold round trip.

The new five cases and existing health and health/legal availability suites pass: 37 tests in three suites, 10.791 seconds (`/tmp/dreams-health-emergency-context-focused.out`). Strict application and test type checks are recorded separately in `/tmp/dreams-health-emergency-context-types.out`.

No fixture, version, schema, migration, UI, cost, availability or health-balance values change in this branch. The coordinator owns the next content-version consolidation together with the separate story display and World 35 / engine 36 / reader 15 changes.
