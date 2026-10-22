# Entertainment overhaul verification

The baseline is `work/eeb989e6093eae4655c86d18909c92ab979b02ca`: 274 authored situations and 822 choices. `tests/support/entertainmentBaseline.ts` records every original event and choice identity independently of the edited catalogue.

`tests/game/entertainment-overhaul.test.ts` checks all original IDs and choice order, and a baseline hash of original age ranges, contextual eligibility, rarity and illustrations. For every new event it uses an existing domain context factory, verifies actual eligibility and the five-year cooldown, and resolves all three choices after production checkpoint save/resume. It checks exact stat, relationship, grade, skill and pet effects at their upper and lower limits, preserves real financial/legal/family/employment state for ordinary choices, rejects duplicate commands, and checks factual real death if a health loss reaches zero. Separate genuine historical fixtures verify that already-bound choices, outcomes and journals retain their stored text through migration. These are controlled domain tests, not claims about natural encounter frequency.

## Generated-decision inventory

Reviewed the decision definitions identified by `templateId` in `src/game/systems/`. The authored annual catalogue is audited separately.

| System | Decision IDs | Editorial assessment / supported consequences |
|---|---|---|
| `relationships.ts` | `meet-dating`, `meet-friendship` | KEEP: real selectable people and an optional introduction. Avoid inventing romance before a connection exists. |
| `work.ts` and `jobInterviews.ts` | `job-interview` | ENHANCE where weak: interviews already have genuine offer/rejection, employment and withdrawal outcomes; preserve the role-specific assessment and IDs. |
| `social.ts`, `socialCriticism.ts` | `public-controversy` | REWRITE weak incident/response copy: actual public-image and audience changes support dramatic fallout. Do not claim suspension, lost contracts or money unless applied. |
| `social.ts` | `brand-offer` | KEEP the precise monthly delivery, posting, payment and termination terms. The agreement applies actual sponsorship state; no upfront or guaranteed payment claim. |
| `social.ts` | `creator-introduction` | KEEP functional introductions. Meeting an existing creator promises no collaboration. |
| `legal.ts` | `arrest` | ENHANCE: actual charges, detention/bail and case creation support direct dramatic copy. Preserve the financial/legal terms of each choice. |
| `legal.ts` | `court-hearing` | ENHANCE: actual verdict, sentence, fine and custody effects support the consequences. Retain the visible evidence, counsel, baseline term and plea distinctions. |
| `assets.ts` | `property-sale-offer` | KEEP actionable offer/settlement terms. Only acceptance may describe an actual sale; refusal retains ownership. |
| `health.ts` | `medical-emergency` | KEEP quoted care cost, real billing and diagnosis/short-stay qualifications. The urgent-care choice must remain understandable. |
| `stories.ts` | `story-arcade-invitation`, `story-project-promise` | KEEP existing recorded permission/payment/deadline context and save compatibility; no replacement callback system. |
| `projectRecall.ts` | `story-project-recall` | KEEP existing actual historical project binding; no new delayed-consequence framework. |

`businessMonth.ts`, `careers.ts` and other career/finance modules also generate resolved results without `templateId` decisions. Their existing real business, pay, project and employment mechanisms are the appropriate places to describe major outcomes. An annual stat-only scene must not manufacture those outcomes in prose.

## Continuation tool

Run after production content stops changing:

```sh
node tools/run-entertainment-sweep.cjs --output /tmp/dreams-entertainment-full-lives
```

The tool continues the untouched recorded family, criminal-court, actor, creator and business archives until actual natural death at its default 150-year bound. It rotates available authored choices, uses explicit visible urgent-care/guilty-plea selections, and otherwise submits ordinary advance/resume/choose/acknowledge commands. It records all encountered setups, offered choices, selected results, actual journals, command traces, production cold-resume proofs and final checkpoints. Each chosen command is independently resolved from its original and restored boundary and compared as a whole canonical world. Source hashes reject mixed-version evidence.

These are complete **remaining** lives from recorded adult contexts. They do not establish newly attained birth-to-death business/fame/family progression, all-catalogue natural coverage, native rendering, SQLite use throughout, human playtesting, or subjective first-30-minute quality. The separate natural life, criminal-policy and professional-policy tools remain useful complements. Frozen historical source registrations must remain unchanged.

Useful current-source commands:

```sh
npm test -- --runTestsByPath tests/game/entertainment-overhaul.test.ts
npm test -- --runTestsByPath tests/game/editorial-context-acceptance.test.ts tests/game/editorial-policy.test.ts
node tools/run-life-sweep.cjs 12 0 --immutable
node tools/run-criminal-policy.cjs --country US --max-years 150
node tools/run-professional-policy.cjs --country US --max-years 150
```

The final focused overhaul suite passed 93 tests with 30 new events: all 90 new choices were resolved at both stat boundaries, alongside 30 context/cooldown checks, the catalogue/history checks and an exact tag-only content-17-to-18 migration check. TypeScript checks and the continuation tool's syntax check passed.

The final five-path continuation pass completed on the fixed game/persistence source hash `ca7cdabff8af765bb0fb4bcc9db0a7a79c4eab00facafb6dfb805faab8971521`. Evidence is in `/tmp/dreams-entertainment-final-lives/result.json`, with complete decisions, results, command traces and cold proofs beside each scenario.

| Archived starting context | Additional Age Ups | Decisions | Commands | Cold checks | Actual age at death |
|---|---:|---:|---:|---:|---:|
| Family and completed trip | 53 | 44 | 153 | 152 | 77 |
| Criminal case | 54 | 104 | 293 | 291 | 77 |
| Actor between projects | 52 | 87 | 253 | 252 | 75 |
| Creator studio | 55 | 54 | 844 | 545 | 78 |
| Business owner | 48 | 37 | 137 | 135 | 71 |
| Total | 262 | 326 | 1,680 | 1,375 | — |

The five continuations encountered 71 distinct catalogue situations. Reviewed examples include a child's proposed celebrity-apology-writing career with a real child-bond cost, an overheard insulting partner impression with a real nine-point partner-bond loss, a business replying to its owner's complaint as a job application, and an older person discovering that a photograph about existential loneliness actually captured them avoiding pigeon mess. Existing quiet family and travel memories provided contrast. The captured court verdict imposed a real four-month sentence and fine. A real business later failed and liquidated after three consecutive unpaid periods. Brand agreements recorded zero upfront payment, with subsequent payment conditional on actual delivery. A failed public response at an already-zero public image now describes its poor reception without claiming another impossible decrease.

The actor archive begins between projects and this advance-only policy does not apply for another role, so no actor-specific scene encounter is claimed. The short historical court sentence also produced no authored legal-scene encounter; all new legal choices are covered by controlled domain tests instead. These limitations and the absence of visual/human playtesting remain explicit.
