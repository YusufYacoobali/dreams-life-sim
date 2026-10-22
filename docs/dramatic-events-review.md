# Requested dramatic situations

This follow-up adds exactly fifteen situations and forty-five choices. They use the existing event card and decision/result flow. There are no new screens, hubs, ongoing story arcs or new simulated professions.

Each situation binds existing saved records before it can appear. A boss, partner, child, prisoner, employee, property, brand offer, election or career contact cannot be supplied by a generic fallback. Binding and browsing do not create people, change a record or draw randomness. A saved choice retains its situation identities and quote; choosing rechecks those identities before applying the existing domain rules. If the bound situation has changed, its decision clears with a truthful result and no financial or relationship consequence; it never substitutes a different person or contract.

| Situation | Required recorded context |
| --- | --- |
| Criminal boss | Current employment, its actual current supervisor and their available account |
| Double fiancé | Current engaged romantic relationship with an available adult partner |
| Sold private messages | Actual active best-friend agreement and available friend |
| Exam-paper scam | Actual local teen child enrolled in secondary education |
| Courtroom defence | Real serious open case at its hearing, with appointed counsel |
| Escape plan | Active adult sentence and a known prisoner serving at the same facility |
| Hidden wire | Unresolved player robbery, current street gang and its saved contact |
| Unpaid employees | Owned active local business in its first two distress periods, current manager and worker, outstanding wages and other bills |
| Suspicious property offer | Owned local property already listed for sale with a recorded doubled offer |
| Dishonest sponsorship | Unexpired offered fitness sponsorship and its active profile |
| Funeral stream | Real family death within twelve months, available living family, active local Streamer studio and editor, active advertiser, and a recent actual sponsored live memorial post naming the deceased |
| Dating profile | Actual current partner |
| Election scandal | Current active candidate in an election close to its scheduled date |
| Doping dilemma | Active professional athlete contract/project and saved professional contact |
| Scandal film | Active actor contract/project and an existing public controversy |

The crime model records gang membership and a player's robbery, but does not record a shared robbery with a named accomplice. The wire scene therefore says “contact.” Sports contacts do not have a saved coach profession, so the doping offer comes from an actual professional sports contact. The school model does not support an invented expulsion or police investigation for the exam-paper premise; its responses affect the actual child and relationship. Fictional disclosures introduce the dramatic premise; their consequences are restricted to systems that exist.

## Verification scope

`tests/support/dramaticEvents.ts` creates controlled domain contexts. It uses actual employment introductions, paid proposals, best-friend consent, child/contact creation, crime and sentencing, gang membership, staff contracts, payable creation, property purchase/listing, sponsor offers, creator crew, family death, sponsored memorial publication, campaign periods and career/post actions. Funding, qualifying abilities/audience, fixed response streams, a first-distress boundary, a doubled recorded property offer and isolated calendar boundaries are explicitly arranged. These fixtures are not natural birth-to-adulthood playthroughs, encounter-frequency measurements or native visual evidence.

`tests/game/dramatic-events.test.ts` checks the exact additions, actual binding identities, every authored choice, unchanged browse/bind state and random streams, checkpoint/codec equality, deterministic live/cold/checkpoint continuation, bounded stats and refusal to replay a resolved decision. Targeted checks inspect actual account transfers, romance and friendship endings, verdicts/sentences, escape incidents, wage claims, property ownership and sponsorship terms/payment timing.

Seven brief opportunities enter the existing priority queue directly from the ordinary robbery, court, business, property, sponsor, memorial-post and election operations. Tests exercise each operation once with declared event seed 7 (rare roll 2), then with seed 1 to check its ordinary fallback. They assert one event draw, the saved encounter history and unchanged normal records where no dramatic card is offered. Separate checks cover duplicate queue refusal, a five-year cooldown, unavailable-context refusal without a draw and the content18-to19 migration, which changes only the content tag.

The criminal-boss payoff moves real savings between accounts. Funding an insolvent business contributes real capital; it does not erase its arrears before the normal monthly settlement. Signing the fitness deal creates six monthly delivery obligations with two disclosed posts per month and no upfront payment. A prison escape can create an urgent arrest decision; its dramatic result stays in the existing deferred queue until that higher-priority decision is handled.

Negative selector tests deliberately construct missing or contradictory read-only views. They check refusal for absent, dead, away, unavailable or incorrect roles and for removed prerequisite records. Those views are never presented as valid saved worlds or passed through domain actions.

Verified on 2026-10-22:

- `npm test -- --runTestsByPath tests/game/dramatic-events.test.ts`: 112 tests passed, including all forty-five authored choices and seven generator/fallback pairs.
- `npx tsc --noEmit -p tests/tsconfig.json`: passed.

The targeted multiple-property test also verifies that an opportunity binds its own saved asset and quote when another property qualifies, and that an unknown target cannot fall back to another asset.

## Integration verification

`npm run typecheck` passed for production and tests. Across the regression run, corrected targeted rerun and focused suite, all **230 distinct suites / 3,083 tests** passed. This is a combined matrix, not a claim that one uninterrupted invocation passed: the first 228-suite regression run passed 224 suites and exposed four old catalogue-count, eligibility-pool or current-version expectations. Those were corrected; all ten suites in the targeted rerun passed (377 tests). The separate engine suite passed all seven tests, including twelve complete seeded lives. The new 112-test suite verifies the changed behaviour directly.

After the last production changes, `node tools/run-life-sweep.cjs 12 0 --immutable` completed all twelve lives at ages 40–92, with full validation and factual death records. Its source guard confirmed unchanged final game source hash `8208996b9ece2e594ff262d8de80068fa79f13834373a175ace4507509e37e65`. This is a pure-engine Node check with the tool's explicitly arranged newborn acknowledgement flag, not a native-device playtest or a measurement of dramatic encounter rates.

Content version 19 migrates prior content by changing its tag only. Saved choices, results, balances, people, annual cursors and random streams remain literal. The previous 304 situations and their 912 choice identities remain; these additions bring the catalogue to 319 situations and 957 choices.
