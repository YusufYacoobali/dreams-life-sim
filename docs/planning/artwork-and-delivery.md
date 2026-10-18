# Artwork, implementation roadmap, and acceptance

Part of the [Phase 0 master plan](MASTER_PLAN.md). No artwork has been generated, package added, game screen implemented, or gameplay test executed during this planning task.

## G. Artwork plan

### Direction and constraints

The written art brief is colourful, clean, rounded, friendly, lightly dimensional cartoon illustration, readable at mobile icon sizes. Match the actual reference art when supplied; this description cannot establish a particular artist's lighting, line weight, or portrait proportions.

Use the available image-generation tool for original custom illustrations and illustrated icons. Do not use emoji, Unicode stand-ins, unrelated stock styles, or full screenshots as UI. Simple system arrows, chevrons, close controls, and similar controls may be native/vector shapes. Whether bottom-tab icons are vector or illustrated follows the references.

Text, names, numbers, labels, stat bars, and buttons remain React Native components. Generated art contains no UI labels or embedded text. Use transparent backgrounds for portrait layers, freestanding item art, and icons that need them. Keep deliberate illustrated backgrounds only where the approved reference calls for them.

### Asset-family manifest

All entries are **planned / not generated**. Final filenames and quantities are frozen only after reference reconciliation and the portrait-layer feasibility check.

| Family / stable ID namespace | Required coverage | Reuse and production strategy |
| --- | --- | --- |
| portrait.player.* | Birth/infancy, child, teen, young adult, adult, older adult; selectable face/hair/appearance | Generated compatible layers; one stored appearance identity throughout ageing |
| portrait.npc.* | Parents, siblings, friends, partners, children, classmates, teachers, coworkers, doctors, police, legal/business contacts | Same portrait system and registry as the player; roles use badges/clothing where justified |
| activity.* | School, university, standard job, part-time job, actor, musician, athlete, politician, model, video creator, streamer, business | Reuse across list, career dashboard, and related events |
| activity.* | Bank, investment, property, vehicle, possessions, relationships, family | Shared wealth/family categories rather than one image per transaction |
| activity.* | Health, fitness, meditation, crime, court, prison, travel, pets, hobbies, entertainment, fame, social media, extras | Consistent icon scale, perspective, lighting, and framing |
| event.* | Birthday, newborn, graduation, promotion, firing, marriage, breakup, pregnancy, success, setback | Reuse category illustrations or the relevant person's portrait wherever suitable |
| event.* | Illness, injury, arrest, verdict, release, income, expense, warning, inheritance, memorial | Distinct semantics where needed; do not duplicate an existing suitable illustration |
| item.property.* | Modest flat, family house, larger home, premium residence, business premises | A small tiered catalogue with market/owned detail reuse |
| item.vehicle.* | Economy car, family car, premium car, motorcycle, other approved referenced classes | Reuse per model; condition is UI/state, not an unrelated picture |
| item.pet.* | Dog, cat, and approved small-animal/bird species, with some visual variety | Reuse portraits on adoption, owned profile, and pet events |
| item.possession.* | Jewellery, instruments, devices, collectibles, heirlooms | One art family per catalogue type; ownership/provenance shown natively |
| investment.* | Fictional stock sectors, funds, crypto categories | Limited illustrated category set; prices/tickers are native text |
| location.* | Supported destination thumbnails, local/international travel, study/work abroad | Reuse destination thumbnails; no need for a new painting per holiday |
| achievement.* / challenge.* | Education, career, wealth, family, fame, crime, longevity, travel, rare milestones | Reusable trophy/badge families with native labels and locked/unlocked states |
| special.welcome.* | Approved welcome/creation hero illustration | Generate after the composition is reconciled |
| special.death.* | Tombstone and required approved death-screen illustration | Must fit death screen.png; do not invent the final composition before viewing it |
| special.rare.* | Only exceptional events whose approved layout needs unique art | Explicitly budgeted exceptions; ordinary text events reuse assets |
| branding.* | Original application icon, adaptive layers, launch artwork, store artwork if requested | Replace Expo starter branding late enough to use the approved game style |

The activity manifest lists 32 semantic uses, not a commitment to generate 32 separate pictures: several can share an approved illustration. The event manifest similarly lists uses, with reuse decided explicitly in the registry. Asset counts cannot be marked complete from a prompt list.

### Persistent appearance

Store appearance traits with the person: face family, skin palette, eye/feature choices, hairstyle, hair palette, accessories, and distinctive identity anchors. Derive the age-stage rendering from these traits; do not choose a fresh random face at 18 or 60.

Proposed initial customisation coverage: six age rigs, at least six skin palettes, four face families, eight suitable hairstyle families, five hair palettes, and a modest accessory set. These are target options, not a claim that all combinations already exist or are visually compatible. Identity and gender do not force one appearance preset.

First validate layers for alignment, lighting, alpha edges, hair/face overlap, age continuity, and small-size readability. Some hairstyles can have age-specific versions; infant choices preserve a latent appearance preference rather than displaying an adult haircut. NPCs use the same coherent system with seeded appearance choices.

Generate reusable layer catalogues, not the entire Cartesian product of options. Test all individual layers and representative pairwise combinations. If the generation pipeline cannot produce consistent layers, stop the portrait batch, present an alternative family of coherent reference-conditioned portraits, and obtain approval for any resulting customisation change. Do not silently drop the feature.

### Production sequence after approval

1. Extract an art brief from the actual reference winners: palette, contour, texture, lighting, viewpoint, framing, and relative size.
2. Generate a representative sample set: one character across ages, a second distinct character, school/heart/crime icons, one property, one pet, and the death illustration only when its authority is available.
3. Review samples together at actual UI sizes. Resolve major style disagreements before a large batch.
4. Freeze asset IDs, family prompts, reference images, layer anchors, transparent-background rules, and export sizes.
5. Produce small, reviewed batches. Reuse existing generated references to preserve identity and style. Record prompt/reference provenance and output paths.
6. Export production images with mobile-appropriate dimensions/encoding; preserve alpha and avoid visible compression damage. Bundle locally for offline play.
7. Populate a typed asset registry. Validate every content asset ID and every portrait combination the UI permits.
8. Check the actual app on light, dimmed-modal, and death backgrounds. Replace rejected/missing art rather than leave permanent placeholders.

Illustrative source sizes: 1024px generation masters; typically 128–256px delivered row/event icons and 256–512px portrait/detail art, subject to actual displayed sizes. These are pipeline starting points, not measured reference dimensions.

Proposed bundled-art budget: about 30 MB after optimisation, to be profiled rather than met through visibly degraded assets. Keep masters outside the runtime bundle. Check icon clarity at roughly 40–64 logical pixels and event art at its approved measured size.

Asset status transitions: required → generated → reviewed → exported → integrated → device-verified. A family is complete only when all required assets have reached the final state.

## H. Delivery roadmap

Follow the user's phases, but include engine and content validation throughout. Design-system work must not consume the entire project before a life can run. Later feature screens must not ship as disconnected demonstrations.

| Phase | Main deliverables | Concrete exit gate |
| --- | --- | --- |
| 0 — Plan/reconcile | This review pack; actual screenshot catalogue; winners/conflicts; confirmed adult audience and wider launch direction; country baseline | Overall direction approved; screenshot reconciliation remains required before code/art |
| 1 — Technical/visual foundation | Router, theme, safe areas, shared rows/buttons/stats/portraits, four-tab shell, Life layout, Activities, modal state machine, engine command contracts | App still builds on both native targets; navigation/back/modal flow works; core reference composition checked when native captures are available |
| 2 — Artwork and creation | Approved generated asset families, appearance rig, random/custom creation, birth/family generation, profile components | Several distinct seeded people retain identity across ages; creation produces a valid saveable world; required initial art exists and is reviewed |
| 3 — Core playable life | Pure seeded engine, resumable Age Up, journal, modest reviewed event set, NPC ageing, basic money/health, save/load, death/new life | One complete ordinary life is playable; interruption/reload preserves decisions/results; no duplicated years or income; terminal death and New Life work |
| 4 — Core life systems | Education/applications/funding; jobs/interviews/raises/retirement; relationships/marriage/children/divorce; assets, loans, property, vehicles, investments; full approved country roster | Scenario A and relevant failure cases work through actual commands under every approved launch pack; screens show derived current state, and saved lives resume correctly |
| 5 — Expanded gameplay | Health/lifestyle, crime/court/prison/release, travel/emigration/abroad, pets, social/fame, business, all eight special careers, hobbies/entertainment | Scenarios B and C work; every listed special path has its own progression and exit; country-specific eligibility, cross-system restrictions, and finances are enforced |
| 6 — Content/depth | At least 250 approved templates, callbacks, richer NPCs, achievements/challenges/heirlooms, inheritance/legacy, Time Machine, balance | Coverage report passes; multiple generations and restored timelines retain valid world/economy state; repeated play shows meaningful variety |
| 7 — Polish/release candidate | Reference comparisons, device flows, accessibility, performance, writing pass, regression fixes, original branding | All release gates below pass; outstanding issues are explicit; no claim of complete visual fidelity without real captures |

Internal development may use labelled, unfinished layouts before Phase 2. Those are never represented as final generated artwork or shipped functional features. Keep incomplete menu entries out of a release build until their behavior and art pass acceptance.

### Suggested implementation slices

- Phase 1: shell and tokens → reusable interactions → modal navigation/back behavior → persistence and engine boundary scaffolding.
- Phase 2: portrait feasibility → representative art approval → creation/appearance → seeded family/birth → initial asset integration.
- Phase 3: one year → interrupted year → childhood-to-adulthood → full lifespan → restore/death/new life.
- Phase 4: school-to-work → dating/family → cash/debt/ownership → investments → integration and country-pack comparison.
- Phase 5: health/crime/prison → social/fame → companies → special-career groups → travel/pets/hobbies → integrated life tests.
- Phase 6: authored content batches in parallel with system work, then coverage/sequence review → legacy → snapshots/restore → balance.
- Phase 7: native-device comparisons and defects, then performance and full regression.

Content authoring starts as each relevant system stabilises, even though its final breadth gate is Phase 6. Do not leave all 250 events to the end.

### Effort and dependencies

This is a substantial game, not a single-screen task. The earlier **32–50 person-week** allowance assumed a two-country launch and is superseded by the user's wider-launch choice. Do not present it as the estimate for twelve country packs.

Add an explicit international workstream: research and document the approved country matrix; implement configurable rules/currencies; author and review applicable content; validate every pack; then test migration between them. This work runs through Phases 2–7. Establish a revised effort range after the roster, regional approximation policy, and representative pack tests are agreed; do not invent a fixed per-country multiplier before that evidence exists.

Re-estimate after the Phase 3 vertical slice and native performance baseline. Reference quantity, approved country count, art revision workload, desired career depth, device access, and editorial throughput materially change the estimate. No phase is complete simply because its estimated time has elapsed.

### Dependencies and external needs

| Need | When it matters | Current position |
| --- | --- | --- |
| Actual design screenshots including death screen.png | Phase 0 visual reconciliation | Missing |
| Audience | Content/editorial direction | Confirmed: adults, non-graphic mature themes |
| Launch-country scope | Content/rules freeze | Confirmed: wider international selection; twelve-country candidate roster proposed, exact roster pending review |
| Implementation authorisation | Before Phase 1 code or any generation | Granted subject to reconciling screenshots first; that prerequisite remains blocked |
| Image-generation capability | Phase 2 samples and batches | Available, not used |
| SDK-compatible packages | Phase 1 onward | To be selected/installed after approval |
| Android device/emulator with supported native tooling | UI and end-to-end acceptance | No configured Android SDK/emulator established in this cloud instance |
| iOS device/macOS runner | iOS UI and native-build acceptance | Linux Metro export does not provide it |
| Store signing/distribution configuration | Release candidate/build handoff | Not required for planning; account/access requirements must be checked when needed |

No backend, paid API, external game service, ads, IAP, or account system is required by this plan. Store submission/publication is a separate later action; this plan does not claim it has occurred.

### Milestone discipline

Maintain [the progress document](../PROGRESS.md) as work proceeds. For each implementation milestone, complete its behavior, run the relevant gameplay/build/device checks, fix failures, record exactly what is verified and what remains, and commit working code before advancing. Documentation or a passing starter build does not count as an implemented gameplay milestone. The user's conditional approval authorises continued work through the full release scope once reference reconciliation is complete.

## Automated verification

Use tests that exercise actual rules and can fail for the defects they target. Mock platform storage failures where needed; do not mock the engine into returning desired scenario outcomes.

| Area | Required evidence |
| --- | --- |
| Engine primitives | Seed vectors, stat bounds, date/age boundaries, action eligibility |
| Event engine | Correct pools/bindings, cooldowns, rarity fallback, outcome branches, delayed chains, no reroll on restore |
| Relationships/NPCs | Ageing, multiple roles, memories, marriage/separation, birth/death, no dangling person IDs |
| Education/careers | Admission, fees/loans, completion/dropout, prerequisites, interview, salary periods, promotion, retirement |
| Finance/ownership | Tax/debt/rounding, purchases/sales, stock/fund/crypto valuation, FX, mortgages, business separation |
| Health/legal | Persistent conditions, treatments, mortality, evidence/court, prison restrictions, release |
| Social/business/special paths | Bounded audience/revenue, real contracts, profitability/cash/equity, distinctive progression and exit |
| Persistence | Exact round-trip, transaction failure, interrupted cursor, duplicates/stale commands, migrations, invalid import |
| Death/legacy/Time Machine | Estate conservation, living-child identity, guardianship, branch isolation, old snapshot compatibility |
| Content | Referential integrity, context fixtures, authored/approved counts, coverage gaps, repeated/generic text flags |

Run a focused suite for each slice, then relevant integration scenarios. Broaden regression when a change affects several systems or an invariant remains uncertain. Compilation alone is not gameplay verification.

## Full-life scenarios

### A — Successful professional

Birth → primary/high school → university funding/admission/completion → qualified job → performance/raise/promotion → real partner/marriage → children → mortgage/home → investments → retirement → death.

Assertions include age/degree gating, tuition/debt, correctly paid contracts, household costs, mortgage equity, portfolio valuation, pension eligibility, factual obituary, and conserved estate.

### B — Criminal life

Birth → school → leaving/dropout with country-appropriate consequences → offence → investigation/arrest → counsel/hearing → conviction/prison → restricted life → release → actual record affects work/travel → death.

Check evidence continuity, fees, money recovery/confiscation, sentence progress, suspended employment income, NPC relationships during confinement, release, and no bypass via direct engine commands.

### C — Famous entrepreneur

Birth → school/skills → actual social account/content → variable reach → earned fame → funded business → sponsorship obligations → company performance → personal investments → family → death.

Check that viral success is not automatic, sponsorship income exists only when earned, company and personal funds remain separate, publicity affects demand, and bad business decisions can fail.

### D — Unpredictable lives

Run varied seeds and decisions, including poor/rich starting worlds, different family arrangements, unemployment, rejected applications, illness, broken relationships, moving countries, bankruptcy, pets, late parenthood, no children, and early death.

Use fixed regression seeds for discovered bugs plus an initial 1,000-seed multi-year invariant sweep. This count is a proposed implementation gate, not a claim these simulations have run. Failures keep their seed, command sequence, engine/content versions, and last valid save.

### Additional critical paths

- At least three generations, switching into an existing child with their own education, partner, assets, and relevant restrictions.
- A minor heir and a family with no living eligible children.
- Restore before/after a purchase, conviction, birth, illness, sponsorship, and death; abandoned-future facts must disappear from the active timeline.
- Force-close at each annual stage, while a decision is open, after outcome commit but before Continue, and during an attempted storage failure.
- Repeat the core economy/education/family path under every approved launch country pack. Exercise country-specific health, legal, retirement, inheritance, and special-career eligibility as those systems arrive.
- Test representative cross-country moves covering USD, GBP, CAD, AUD, EUR, BRL, INR, JPY, and ZAR for the proposed roster; include shared-EUR moves, JPY rounding, qualification recognition, retained assets/debt, and pending restrictions. Validate every supported currency pair mathematically even where full UI scenarios use representative routes.
- Exercise every special career's entry, ordinary progression, failure, and exit rather than considering Scenario C sufficient coverage for all eight.

## UI and device acceptance

Compare each major screen to its actual approved source at matched viewport size. Record device, OS, app/build revision, reference filename, screenshot path, discrepancies, and status. Do not approve a visual feature from a bundled JavaScript file.

Cover:

- Four tabs, back stack, source-screen return after an action, and scroll restoration.
- Safe areas/status bar; compact phones, larger phones, and supported portrait tablets.
- Readable large text, accessible focus order, labelled controls, contrast, and effect signs as well as colour.
- Minimum useful touch targets: aim for 44pt on iOS and 48dp on Android; preserve reference appearance through padding rather than tiny controls.
- Long names, large/negative values, many journal entries, keyboard behavior, scrolling choices, and large-font modals.
- Android hardware Back, rapid taps, application background/foreground, and process termination.
- Correct age-gated/empty/declined/expired/unaffordable states, not just success screens.
- Full-screen death and all three specified actions, including the no-child state.
- No emoji final art, missing registry IDs, clipped portraits, inconsistent icon sizes, permanent placeholders, or decorative primary buttons.

Current tooling can check types and native bundles. Real iOS and Android screen fidelity and interactions still need suitable native execution; unavailable tooling must be recorded rather than counted as a pass.

## Performance and durability budgets

Initial targets to benchmark in release/Hermes builds on named baseline devices:

| Metric | Proposed target |
| --- | --- |
| Ordinary command engine work | p95 below 50ms, excluding storage and animation |
| Automatic yearly engine work | p95 below 300ms for a typical developed world |
| Committed ordinary year | p95 below 500ms excluding the player's decisions |
| Cold restore to usable dashboard | About 2–3 seconds on the agreed baseline device |
| Art bundle | About 30 MB, reviewed for quality and actual package size |
| Typical 120-year history/snapshots | Aim below 50 MB; measure and improve representation without silently removing years |
| UI scrolling | Smooth journal/list interaction with virtualisation and stable selectors |

These are provisional budgets, not measurements. Profile typical worlds and a stress world of at least 1,000 known people. Avoid unnecessary whole-world rendering, re-decoding large assets, or synchronous long work on the UI thread. Pause/resume work in bounded stages where required.

## Release gate

The initial complete release requires all requested systems, all eight special careers, the approved countries, reviewed artwork, at least 250 approved distinct event templates, full-life scenarios, death/legacy/Time Machine, migration/recovery checks, native builds, and actual UI/device acceptance.

Keep outcomes separate: passed, failed, skipped, blocked, and unrun. A reported app bug remains a bug even if the TypeScript build passes. An unavailable simulator is an unrun device check. A generated picture is not an integrated asset. A finite roadmap is not an implemented game.

Before calling the game complete, play the first minute, a continuous 30-minute session, and several entire lives. Confirm fast comprehension, useful choices, consequences that return, enough variety, and a reason to play again. Any remaining release blocker stays explicit.
