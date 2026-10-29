# Birth journal

Newly created lives receive three to five chronological Age 0 entries: birthplace and birthday, name and gender, actual parents with ages and occupations, and family circumstances. Two-parent openings have five entries; single-parent openings have four. The composer can also handle a missing parent record without inventing anyone.

`src/game/birthJournal.ts` reads the generated relationships, household, employment and royal membership after creation finishes. Job titles come from the existing job catalogue. Unemployed parents are described as not currently working; a missing job title has an explicit fallback. Royal parents use their actual titles, and the newborn's actual title and house appear once. The separate old royal-birth journal line is suppressed only for new-life composition.

The 30 original anecdotes in `src/game/content/birthStories.ts` have explicit eligibility rules for actual mothers, fathers, single/two-parent families, working parents and royal membership. They add narrative history without creating people, pets, possessions, relationships, income or stat changes.

The first draw from `forkRandom(seed, 'birth-journal-v1')` selects no anecdote at 50%, funny at 35%, unusual at 12%, or bizarre/dryly dark at 3%. A second draw selects from eligible writing in that tier. The separate stream never reads or advances saved gameplay RNG. Finished text is stored in the existing journal, with stable IDs and the actual birthday. Loading, importing, viewing and continuing a life never regenerate it. No schema or version migration is introduced, and existing journals remain intact.

## Presentation

The existing Birth screen and Begin Life flow, journal cards, fonts, colours, age headers and controls remain unchanged. The Life screen recognizes the new opening by its identity entry, birthday and birth-only journal. Native layout/content callbacks keep it at offset zero until the player scrolls. Subsequent events and later years resume the existing automatic follow-to-end behavior. Retained saves without the new identity entry preserve their previous scrolling behavior.

## Sample review

Run `node tools/review-birth-journals.cjs` to create a reproducible 512-world review under the system temporary directory, or pass a destination directory. The tool creates sample worlds only in memory and writes `samples.json`, `samples.txt` and `summary.json`; it does not access saved lives.

The reviewed seeds 0–511 cover all 12 countries and three genders, 110 single-parent and 402 two-parent households, including 31 royal births. Every authored anecdote appears. This sample contains 265 ordinary, 187 funny, 44 unusual and 16 bizarre openings; these are finite-sample observations, not revised probability weights.

Review included every distinct selected anecdote and the ordinary/royal family templates, plus automated checks across every sample for parent identities and ages, catalogue-backed jobs, family eligibility, duplicate entries, missing substitutions and valid journal lengths. Parent names come from the existing generation catalogue, including any shared names; family generation itself is preserved.

A pre-change comparison captured from `d253718` confirms all 512 complete worlds are identical outside `journal`, including every parent, job history, marriage, account, stat and gameplay RNG stream. The aggregate SHA-256 is pinned by the dedicated domain test. No old golden fixture is replaced.

## Verification

- `tests/game/birth-journal.test.ts`: countries, genders, birthday boundaries, actual jobs/ages, royal and single-parent contexts, fallback wording, all anecdotes, deterministic weights and the 512-world generation comparison.
- `tests/persistence/birth-journal.test.ts`: Begin Life acknowledgement, cold store/repository reload, export/import and unchanged existing newborn/royal save writing and bytes.
- `tests/ui/birth-journal-flow.test.tsx`: unchanged Begin Life navigation, small-screen/large-text Age 0 grouping, initial top position across layout callbacks, manual scrolling, later automatic following and retained-save behavior.

The full regression run completed all 246 suites and 3,257 cases in 1,136.169 seconds: 3,256 passed, with one stale current-work source assertion in `editorial-policy.test.ts` from before End This Life. Only the current store/state hashes were refreshed; the historical C35 reference and rejection checks remain exact. Its corrected suite and the two portrait suites affected by the latest upstream change then passed all 19 cases.

Final strict app/test TypeScript checks pass; the runtime import check covers 399 modules with no cycles. Production Android/iOS exports both exit successfully and have verified Hermes headers (7,299,151 / 6,992,937 bytes). These are bundle checks; component tests do not establish physical-device scroll or spoken screen-reader acceptance.

The generated asset inventory was refreshed against the latest portrait assets; only project-art hashes and sizes changed. Package and notice inputs are unchanged, and the inventory check passes.
