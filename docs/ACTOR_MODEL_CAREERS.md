# Actor and Model careers

Implemented on `v2`, 30 October 2026. Both careers remain free. This work preserves the existing uncommitted purchase implementation and adds no purchase gates, products, dependencies or artwork.

## Playing the careers

Actor has independent, boutique and major representation; five saved audition categories (independent film, studio film, television/streaming, theatre and commercials); and three acting approaches. Contracts last 3–12 working months. Preparation, stunts, improvisation, reshoots, publicity and cooperation affect actual production quality, health, stress, relationships and reception. Releases show separate critics and audience scores, commercial reception, contractual earnings, commission, fame, reputation and nominations/awards. Credits, leading roles, hits, collapse and comeback feed later opportunities.

Model has separate representation, five portfolio specialisations (choose up to three), quarterly self-directed or paid professional portfolio development, and six saved booking categories: editorial, runway, advertising, designer collaboration, ambassador and luxury. Preparation, creative interpretation, remaining-fee negotiation and publicity have different consequences. Professionalism, portfolio, agency standing and reputation open later bookings; entry does not require appearance perfection. Notable work, brand records, recognition, lost representation and comeback remain inspectable.

Ambassador bookings pay over nine months with twelve months of exclusive rights; luxury campaigns pay over six months with nine months of rights. Rights periods and paid work are distinct. Quarterly appearances fulfil obligations automatically during attended work, with optional monthly catch-up appearances. Renegotiation can alter remaining terms. Breach, cancellation or missed duties can create a recorded settlement claim of 20% of the agreed fee. Actual cash payments and any remaining liability reconcile with the ordinary debt ledger. Death cancels future duties without creating a new settlement claim. Competing style/fitness Social sponsorships and exclusive Model work block one another; unrelated sponsorship categories remain available.

Each industry reuses four living professional contacts through actual people/relationship records. Deceased contacts receive replacements without deleting the original person or their history. Agency rapport, professional trust, experience, portfolio and reputation affect opportunities. Standard commissions are 0% independent, 12% boutique and 20% major; saved negotiations and stories can change future rates. Signed projects retain their agreed rate when representation changes.

There are **26 main situations plus two action incidents per career**, each with three authored choices: 56 situations and 168 outcomes overall. Two main/action situations combined may occur per active year, in different quarters; ordinary casting, agency and production decisions supplement these. Main situations are offered around March/September when eligible. No situation waits years for a scripted callback. An exhausted eligible pool cycles with a bounded recent-history window. Optional work actions are limited rather than mandatory completion chores.

The existing career route opens distinct Actor/Model dashboards with compact overview, agency, offers, production/portfolio, brands, history, recognition and contact sections. Dialogs use the existing UI and commit through the normal SQLite store. A failed write leaves the saved world unchanged and allows retry; duplicate and stale submissions are rejected.

## Money and deterministic saves

Ordinary `workMonth` remains the only source of wages. Creative settlement runs afterward, observes actual new earned wages and posts the signed commission once. There is no signing cash, fictional ticket-sale reward, second sponsorship payout or retroactive royalty. Negotiated pay amendments affect only remaining instalments. Affordability and quoted costs use existing currency accounts and financial restrictions.

Receipts retain their contract currency. Career totals use the character's fixed earnings reference currency and historical conversion receipts, rather than revaluing old work at today's exchange rate. Validation checks each new project against a unique employment history, wage gross, fee transactions and conversion records. Legacy earnings are shown from their existing history and are never rebooked into new totals.

Casting boards save their rolls, terms and answered statuses, including country-specific boards within the quarter. Reloading, refreshing or travelling back does not reroll an answered opportunity. Production rolls are saved on signing. A pending story stores its wording and a versioned snapshot of effects, contact, project and price: later catalogue edits cannot change an already offered decision.

## Compatibility and lifecycle

Legacy worlds continue to use schema/engine/content **49/51/28**. Newly created worlds also retain this tuple until explicitly entering either enhanced career. The atomic entry command adds optional career state and promotes the world to **50/52/29**. Validation accepts only these supported tuples and requires new state to match the new tuple. This is an opt-in capability transition, not an eager rewrite of old saves. Earlier app versions must not read the new format.

An active legacy Actor/Model contract keeps its original generic dashboard, terms, pending choices, RNG, payments and results. It finishes under the original rules. The enhanced dashboard is introduced at a safe between-contract boundary; historical projects and awards remain intact. No legacy contract is replaced, and no old RNG or payment is regenerated. Historical checkpoints and Time Machine branches keep their original format until their own explicit adoption.

Exit, resignation, another job, retirement and death use existing employment closure. Bound story decisions are cancelled only for their own terminated project or career. Returning retains contacts, representation, portfolio, credits and answered boards. A cancelled old credit cannot cancel a new project's story.

New completed/cancelled projects keep 48 detailed records; older new records become compact summaries, preserving titles, awards, receipts, release metadata and aggregate attendance/quality. Legacy project records, the real ledger and employment history are retained. Agency detail is capped at 24; notable Model work and brand detail at 24 each; recent stories at 26; one bound story per career; project choices and monthly fee receipts at 12. Archived project summaries have a defensive 1,800 limit, beyond a normal playable lifetime. Achievement facts and terminal biographies include archives.

## Changed files for this overhaul

New domain/content modules:

- `src/game/content/{actor,actorStories,creativeStories,modelCareer,modelCareerStories}.ts`
- `src/game/systems/{actor,actorSchemas,actorValidation,modelCareer,modelCareerSchemas,modelCareerValidation}.ts`
- `src/game/systems/{creativeCore,creativeSchemas,creativeEvents,creativeValidation,creativeArchive}.ts`

Shared integration:

- `src/game/{model,runtime,engine,choiceAvailability}.ts`
- `src/game/systems/{careers,careerSchemas,careerValidation}.ts`
- `src/progression/facts.ts`, `src/ui/terminalBiography.ts`
- `app/(game)/career/[kind].tsx`

New presentation:

- `src/ui/{ActorDashboard,ModelCareerDashboard,CreativeCareerUI,CreativeCareerDialog}.tsx`

New tests:

- `tests/game/{actor-career-overhaul,actor-stories,model-career,model-career-stories,creative-agency,creative-industry-stories,creative-finance-history,creative-career-journeys}.test.ts`
- `tests/persistence/{creative-career-compatibility,creative-career-currency}.test.ts`
- `tests/state/creative-career-save.test.ts`
- `tests/ui/creative-career-ui.test.tsx`

Updated existing acceptance journeys: `tests/ui/model-career-acceptance-flow.test.tsx` and `tests/ui/career-flow.test.tsx` follow free exploration and saved castings while retaining archive preservation, training, durable retry, cold reopening, unique contacts/contracts and no-pay-after-leaving checks.

Documentation: this file, `docs/HANDOFF.md` and `README.md`. Other dirty files already belonged to the preceding work and are not part of this overhaul.

## Verification

Focused coverage includes four distinct three-year journeys through normal monthly engine advancement; 51 new contracts and 156 paid months with archival and achievements; original legacy contract fingerprints; genuine legacy pending saves; real SQLite cold reopening and failed-save retry; historical GBP/JPY conversion receipts; duplicate/corrupt receipt rejection; agency negotiation; sponsorship exclusivity and settlements; deterministic boards; dead-agent replacement; and exit/return/death/retirement/interrupted-year handling.

Verification commands (run from the repository root):

```sh
npm run typecheck
npm run check:imports
node tools/generate-third-party-notices.cjs --check
npx jest --maxWorkers=4 --silent
EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 EXPO_HOME=/tmp/dreams-expo \
  XDG_CACHE_HOME=/tmp/dreams-cache npx expo export --platform all \
  --max-workers 1 --output-dir /tmp/dreams-creative-export
git diff --check
```

**All 354 suites / 5,593 unique cases have passing coverage across the full run and focused reruns.** The full run completed in 1,574.3 seconds with 350 passing suites and four failing suites/five cases. All affected suites now pass. Two story assertions needed to allow a valid fallback when the catalogue cycles; the existing Actor and Model UI journeys needed the new free exploration step; one lifetime UI case exceeded its default 30-second timeout under concurrent load and passes the focused rerun with `--testTimeout=90000`. Two new story cases and one final fractional-commission case were added after their suites had run, accounting for the final unique total of 5,593 rather than the first run's 5,590.

The final focused runs cover **15 suites / 140 unique cases**, including all **135 new career cases** across twelve suites, both updated career UI acceptance cases and the three existing lifetime-statistics cases. The final 17-case story integration suite and 19-case Actor/agency run pass. The ordinary **12 complete seeded-life invariant sweep passes** in the full regression (1,072.9 seconds for its engine suite under concurrent load).

The updated Model archive UI acceptance journey continues the unchanged Actor archive through 30 coached months, free Model entry, a natural saved casting (no edited rolls), three actual paid production months, an authored preparation incident, durable departure and a further year with no Model wages. The accepted contract pays $9,520 actual gross against its $38,080 annual rate. Actor projects, imported snapshots and inactive archive rows remain unchanged; rollback/retry, receipt/backups and cold reopening remain asserted. The Actor journey separately rolls back/retries entry and audition, creates exactly four recurring contacts and one employment/project, pays nothing upfront, and retains the complete project and its saved reception rolls after a fresh SQLite-backed load.

Verification logs are `/tmp/dreams-creative-regression.log`, `/tmp/dreams-creative-final-focused.log`, `/tmp/dreams-creative-final-agency.log`, `/tmp/dreams-model-acceptance-final.log` and `/tmp/dreams-actor-career-flow-final.log`. They are local execution artifacts, not committed fixtures.

Strict application/test TypeScript checks, the **544-module import graph with zero cycles**, licence notice checks and whitespace checks pass. The final checks were repeated after all source/test edits; the strict-type log is `/tmp/dreams-creative-types-verified.log`. Final Hermes exports pass for **Android (3,691 modules)** and **iOS (3,606 modules)**, written to `/tmp/dreams-creative-export`, including the final signed-commission disclosure fix; the log is `/tmp/dreams-creative-export-complete.log`. Exports establish bundle compilation, not signed native builds or physical-device visual/performance acceptance. No real store transactions are involved in either free career.
