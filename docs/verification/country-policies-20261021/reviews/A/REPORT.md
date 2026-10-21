# C39 Professional A3 — actual 12-country outcomes

Read-only artifact reconciliation, 2026-10-21. The coordinator process actually closed exit 0 after 529.213 seconds, 07:55:51.609643–08:04:40.823106 UTC. This is a completed technical cohort with observed omissions: **5 of 12 lives reached all 20 requested goals**, so the aggregate `everyRequestedMilestoneReachedInEveryObservedLife` remains **false**. It is not a game-completion percentage.

## Exact source and evidence

- Source `33b6a5fcb0aae73dfc235a15394b34d8afda00cc`; World 38 / engine 39 / content 13 / reader 18 / checkpoint v4. Main publication `9ad6330` is a later source checkpoint; this cohort is attributed to the executed source above.
- Accepted prelaunch snapshot `/tmp/dreams-production-finish-accepted-source.json`, SHA256 `2e08fd925c673437ff7de7c76c0fd79d02832617d0014efc1c3e471782fe9b56`. The execution receipt reports all **688 source files exact both before and after**.
- Game SHA256 `7de215076995f7dbe7c76eceb080ba00b6de6f1783c12340d1e82677c996245b`; combined game/persistence `d72d52f3d6a6e312e490a525c0638638af6c5bb27449ffb8a0dd5833e10acbc0`.
- Receipt `/tmp/dreams-production-finish-accepted-professional-v3-receipt.json`, SHA256 `63747fa9a3101e25a645d7de8539534a9dc32e397771506b314eddecbbcc66cb`.
- Original output `/tmp/dreams-production-finish-accepted-professional-v3.out`: 8,154,923 bytes, SHA256 `cb91675f8b610b3a0f3af4427b9a87a42c3c81c21b157232ef522e260cdca3a8`; independently rehashed during this read-only summary.
- Results/commands/final checkpoints: `/workspace/.cache/dreams-current-c39-policies/professional-v3`. All per-file byte hashes, exact report pointers, all reached/unreached goal records, application/course histories and refusal counts are in `/tmp/dreams-c39-professional-v3-country-outcomes-20261021.json`.
- All 183 reported loaded-module hashes equal the accepted 688-file snapshot. Node v24.19.0 / TypeScript 6.0.3 / Zustand 5.0.15 are recorded; dependency versions match the pinned lock, not an independent reproducible-build attestation.
- The 12 fixed assignments reuse US900, CA901, GB902, AU903, FR904, DE905, ES906, IT907, BR908, IN909, JP910, ZA911. `additionalAnnualSeeds` is 0. Do not count these as 12 additional seeds beyond historical A/B/C/D reuse.

## Observed goals and deaths

| Country / seed | Natural death age / cause | Degree age / qualified role | Goals | Unreached at natural death | Commands / codec cold checks |
| --- | --- | --- | --- | --- | --- |
| US 900 | 57 / natural causes | 23 / accountant | 18/20 | retirement, pensionPayment | 462 / 72 |
| CA 901 | 96 / declining health | 22 / accountant | 19/20 | child | 584 / 78 |
| GB 902 | 72 / natural causes | 23 / accountant | 19/20 | child | 569 / 82 |
| AU 903 | 98 / natural causes | 22 / accountant | 19/20 | child | 595 / 79 |
| FR 904 | 82 / natural causes | 22 / teacher | 20/20 | None | 555 / 80 |
| DE 905 | 72 / natural causes | 22 / accountant | 19/20 | child | 515 / 77 |
| ES 906 | 86 / natural causes | 22 / accountant | 20/20 | None | 563 / 81 |
| IT 907 | 62 / natural causes | 23 / teacher | 18/20 | retirement, pensionPayment | 501 / 75 |
| BR 908 | 76 / natural causes | 23 / accountant | 20/20 | None | 547 / 81 |
| IN 909 | 92 / declining health | 22 / accountant | 19/20 | child | 548 / 71 |
| JP 910 | 93 / natural causes | 22 / teacher | 20/20 | None | 583 / 81 |
| ZA 911 | 86 / declining health | 22 / accountant | 20/20 | None | 571 / 82 |

**Reached in all 12:** primary and secondary school attendance; secondary qualification; actual offered-place enrolment; Business degree; degree-qualified job and recorded positive pay; accepted supervisor feedback; a raise; promotion; partner; marriage; a mortgage-backed primary home; investment; dividend receipt; natural death; conserved estate. The qualified job was Accountant in nine lives and Teacher in FR/IT/JP after an actual declined Accountant interview. Existing qualification rules permit the observed Teacher route; this is not evidence of a national teaching-licence rule.

**Reached in fewer:** child 7/12; retirement and a positive pension receipt 10/12. FR/ES/BR/JP/ZA reached all 20. CA/GB/AU/DE/IN never reached parenthood: the retained restriction is “Both partners need to want a child”, not a technical failure to save. US died at 57 and IT at 62 before their retirement/pension goals; these outcomes are retained rather than replaced. Natural-death cause is “declining health” in CA/IN/ZA and “natural causes” in the other nine.

**Totals:** 6,593 attempted post-birth commands, all 6,593 committed; 939 complete production-codec equality round trips. The recorded 984 `yearsAdvanced` are annual-advance loop iterations, not a claimed 984 complete lived calendar years. All 12 reached a real natural-death boundary under the 150-iteration policy bound; none was forced dead, extended, reseeded or continued as a descendant.

## Saved admissions, aid, course and payment histories

Each life made exactly **one free `apply-university` command**, one separate `apply-scholarship` (Merit) and one separate `accept-university-place`. All applications were Business, with chance 95 and a committed accepted roll. Each saved history contains `accepted → enrolled` on the same day; **0 waitlisted, 0 waitlist reviews, 0 rejected, 0 withdrawn, 0 expired**. The current adapter has waitlist handling, but this run supplies no natural waitlist/negative-admission acceptance. Italy applied at 19; the other eleven at 18. No outcomes were selected or searched to reach these figures.

Every initial enrolment used cash, with an actual linked tuition transaction. Eleven used the offered Merit scholarship with a 75% first-year waiver; US had a real Scholarship declined result and no award used. “Cash at enrolment” must not hide the later US/GB/BR loan-funded resumptions. Each completed `studyCourses` row is origin `enrolment`, linked to that actual admission and first payment, with 48/48 study months and 48 paid tuition months. The receipt slice has four real annual tuition charges per life.

Amounts below are **native currency minor units**, with no FX aggregation. JPY has exponent 0; the other currencies shown have exponent 2. They are authored game quotes, not current-law tuition or aid certification.

| Country | Applied → completed | Committed admission roll /95 | Annual quote minor | First billed / waived minor | Four tuition charges paid minor | Final course funding / resumed |
| --- | --- | --- | --- | --- | --- | --- |
| US USD | 2018-01-01 → 2023-01-01 | 21 | 1400000 | 1400000 / 0 | 5600000 | loan / 2020-01-01 |
| CA CAD | 2018-01-01 → 2022-01-01 | 1 | 750000 | 187500 / 562500 | 750000 | cash / no resumption |
| GB GBP | 2018-01-01 → 2023-01-01 | 90 | 950000 | 237500 / 712500 | 950000 | loan / 2022-01-01 |
| AU AUD | 2018-01-01 → 2022-01-01 | 27 | 900000 | 225000 / 675000 | 900000 | cash / no resumption |
| FR EUR | 2018-01-01 → 2022-01-01 | 42 | 60000 | 15000 / 45000 | 60000 | cash / no resumption |
| DE EUR | 2018-01-01 → 2022-01-01 | 25 | 60000 | 15000 / 45000 | 60000 | cash / no resumption |
| ES EUR | 2018-01-01 → 2022-01-01 | 20 | 150000 | 37500 / 112500 | 150000 | cash / no resumption |
| IT EUR | 2019-01-01 → 2023-01-01 | 60 | 200000 | 50000 / 150000 | 200000 | cash / no resumption |
| BR BRL | 2018-01-01 → 2023-01-01 | 53 | 600000 | 150000 / 450000 | 600000 | loan / 2021-01-01 |
| IN INR | 2018-01-01 → 2022-01-01 | 15 | 7000000 | 1750000 / 5250000 | 7000000 | cash / no resumption |
| JP JPY | 2018-01-01 → 2022-01-01 | 45 | 600000 | 150000 / 450000 | 600000 | cash / no resumption |
| ZA ZAR | 2018-01-01 → 2022-01-01 | 47 | 4500000 | 1125000 / 3375000 | 4500000 | cash / no resumption |

US/GB/BR each took one ordinary `fund-studies` resumption after an unpaid-tuition interruption. Their completed 48-month course spans five calendar years instead of four; the other nine spans are four years. The saved first-payment funding remains cash even where the final factual course funding is loan.

| Subsequent student loan | Borrowed minor | Accrued interest minor | Repaid minor | Recorded rate | End principal |
| --- | --- | --- | --- | --- | --- |
| US USD | 4200000 | 723316 | 4923316 | 500 bps | 0 |
| GB GBP | 237500 | 19747 | 257247 | 400 bps | 0 |
| BR BRL | 300000 | 35736 | 335736 | 450 bps | 0 |

The three student borrowing + accrued-interest totals reconcile exactly to their repayment receipts; all three student principals are 0 at death. No student liability is recorded in the other nine reports. This is the report’s actual ledger/history slice, not a claim of any additional SQL persistence during those later payments.

## Refusals and negative outcomes retained

- Each life records the ordinary under-age cafe/shop eligibility messages before age 16. These read-only preflight refusals are not included in the 6,593 engine command attempts, and observations are deduplicated by stage/year/reason rather than a raw click count.
- Actual committed negative outcomes: Scholarship declined US1; proposal declined CA/GB/FR/JP once each; date declined GB/AU/DE/ES/JP once and IT/ZA twice; Accountant interview declined FR/IT/JP once; no pregnancy this year ES1/ZA3. These remain in the raw records and sidecar counts.
- Child-consent preflight refusals occurred CA64, GB48, AU67, DE52, IN64. US2 and JP1 explicitly indicated incompatible reproductive capacities with adoption available; these two lives later used real adoption, and the other five reached biological parenthood. No willingness, fertility, reproductive capacity, or refusal was overridden.
- Home purchase was initially unaffordable in US2, GB1, FR1, BR1, JP1. The policy’s own three-month reserve blocked CA1 and ZA1; a live investment price/fee/reserve check blocked US1. These policy reserve checks are separate from engine law/eligibility rules. All later home/investment milestones came from ordinary successful commands.
- No `failure.json` exists in the 38 output artifacts. A successful coordinator exit does not turn the nine unreached goal cells into successes; both aggregate and per-life status flags remain unchanged.

## What this does and does not establish

Birth alone uses the actual `createGameStore.startLife` + `acknowledgeBirth` and real **in-memory SQLite** repository, creating an acknowledged age-zero immutable world at revision 1, then closing that connection. All 6,593 later changes use immutable pure-engine `resolveCommand`; the 939 cold checks pack/unpack with the production codec and compare the complete canonical world. They are **not** later SQLite transactions, new DB connections, eight-table rollback, on-disk full-life resume, app UI/native, device latency, national-law, every-choice, or multigeneration acceptance.

The final checkpoint files are pinned as recorded bytes. Their canonical world SHA values are the coordinator’s actual `encodeWorld` hashes, distinct from compressed file hashes. This summary rehashed the recorded files, independently recomputed all 12 canonical tagged command-trace hashes and checked each per-country report equals its aggregate record. It did not load TypeScript, execute game code or perform another codec/SQLite run.

**Current interview experience and busy-year pacing:** actual loaded-source provenance includes `interviewExperience.ts` and `annualPacing.ts`, with hashes equal to the accepted source. The observations record 27 interview results (24 accepted, 3 declined), but they do not retain the experience quotes/bonus/chance. Likewise, no per-year pacing load/chance or per-step world snapshots are exported. Therefore no positive experience-bonus count or observed 50/25/10 busy-year-chance count can be certified from these reports/command lists. Those counts are **unmeasured here**, not zero. This task performs no replay or hidden-state reconstruction to obtain them.

The output `manifest.json` is the static input-manifest format and retains `cohortRun:false`; it is not the execution receipt. The independently pinned completed coordinator receipt, authorized registration, 12 result/command/checkpoint sets and aggregate result are the evidence that this actual run occurred. No original artifact was rewritten to hide that distinction.

## Fixed Canada 901 narrative-review handoff

- `/workspace/.cache/dreams-current-c39-policies/professional-v3/CA-result.json` — 257 stage observations, 78 complete codec checks; `/records/1` in aggregate `result.json` is byte-content-equivalent JSON.
- `/workspace/.cache/dreams-current-c39-policies/professional-v3/CA-commands.json` — exactly 584 supplied post-birth commands, trace SHA256 `83605814f02af9e5809108584b3a6bbdff11329fb8a68f58eaa62b632f9712ad`.
- `/workspace/.cache/dreams-current-c39-policies/professional-v3/CA-final.checkpoint.json` — recorded final checkpoint bytes; coordinator canonical final-world SHA256 `1a741bccdc3af71fbad06b7c230de873ccb1c077ddc758e78f59ea119e30ab5b`.
- These fixed record paths were sent to Story before any narrative sequence review. The observation report does not itself contain every resolved story body; further exact-sequence presentation analysis must keep its existing separate authorization/scope and must not select another seed or outcome.

Detailed read-only reconciliation and file pins: `/tmp/dreams-c39-professional-v3-country-outcomes-20261021.json`, SHA256 `45ce111f0ca8e75c796aeff568998ce77ec7d608d8f80abb27902848701e055e`.
