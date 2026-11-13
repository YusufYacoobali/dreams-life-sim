# Dreams: Life Simulator — Master V2 Polish & Gameplay Implementation Plan

**Branch:** `v2`

**Baseline audited:** `ecab72ac`

**Goal:** Bring all newly introduced systems up to the visual, usability and performance standard of the established Dreams gameplay.

## Non-negotiable requirements

- Preserve the existing four-tab design, overall visual identity and established UI components.
- Keep gameplay depth. Simplify how systems are presented, not their underlying mechanics.
- Prefer existing cards, illustrated icons, character portraits and EventModal patterns.
- No generic AI-looking artwork, emoji replacements or inconsistent line icons.
- Remove unnecessary explanations, repeated confirmations, duplicate actions and technical language.
- Preserve existing lives, historic events, finances, purchases, checkpoints and Time Machine.
- Never introduce changes to simulation randomness, save schemas or migrations without corresponding compatibility tests.
- Implement in separate, verifiable stages. Commit completed stages to `v2`.

---

## Phase 1 — Shared UI foundation and error handling

**Priority: Critical**

Before redesigning individual screens, fix the recurring patterns across the app.

### 1.1 Reusable action presentation

Use the existing `ActionRow`, `Card`, `EventModal` and artwork components to create consistent, compact action layouts.

Each actionable row should ideally contain an illustrated icon, clear action title, brief subtitle where useful, and price or status when applicable.

Group related actions rather than displaying large uninterrupted lists. Keep important actions visible and make secondary information expandable.

### 1.2 Universal character picker

Create one reusable portrait-based person selector, following the existing Relationships tab's presentation.

It should support:

- Character portrait, name and relationship.
- Optional age/status information where useful.
- Search or filtering for longer lists.
- A clear selected state and confirmation when needed.
- Eligibility checks, including deceased, unavailable, absent or otherwise restricted contacts.
- Proper cancellation without modifying gameplay.

Use this component throughout vehicle invitations, property gatherings, hobby activities, prison contacts, organised crime recruitment and other person-selection flows.

Never append a long contact list underneath an action.

### 1.3 Fix error leakage between screens

The current `gameStore.error` is shared globally. `app/(game)/pet/[id].tsx` can therefore display an unrelated tenancy error in its footer.

Scope errors to the operation, modal or screen that caused them. Clear stale errors when opening another workflow.

Failed actions should show a concise, accurate explanation in context, without leaving obsolete warnings visible elsewhere.

### 1.4 Improve popup presentation

- Properly constrain long modals to available screen height.
- Keep primary buttons reachable without content overlapping them.
- Use concise confirmation titles and one or two short sentences.
- Use structured financial rows instead of large paragraphs.
- Avoid extra confirmation dialogs for harmless read-only navigation.
- Test at normal and enlarged text sizes.

**Key files:** `src/ui/components.tsx`, `EventModal.tsx`, `LifestyleReview.tsx`, `CreativeCareerDialog.tsx`, `LegalReview.tsx`, `src/state/gameStore.ts`, relevant screen components.

---

## Phase 2 — Actor and Model career UI overhaul

**Priority: High**

**Files:** `src/ui/CreativeCareerUI.tsx`, `ActorDashboard.tsx`, `ModelCareerDashboard.tsx`, `CreativeCareerDialog.tsx`, `src/game/systems/actor.ts`, `modelCareer.ts`, `creativeCore.ts`.

### 2.1 Agency representation

Currently, the representation picker shows each agency multiple times because standard and negotiated contracts are separate options.

Change this to three selectable representations:

- Independent
- Boutique Agency
- Major Talent Agency

Show the standard commission, key advantage and requirements for each.

Keep the existing **Negotiate Representation** action on the main career dashboard. Do not duplicate negotiation options in the representation picker.

Remove unnecessary basis-point explanations. Display commission as percentages.

### 2.2 Automatic casting opportunities

Remove:

- Review New Casting List
- Review New Bookings
- Associated refresh confirmation popups
- Decline Opportunity / Decline Booking buttons

Instead, automatically maintain the correct opportunities when the in-game quarter changes or the character relocates.

Use the existing deterministic board-generation logic. Do not refresh on every render, regenerate previously answered offers or reroll saved opportunities.

When a round ends, show only currently relevant opportunities. Preserve completed casting decisions in career history.

An ignored offer simply expires normally.

### 2.3 Casting card redesign

Make each offer compact:

- Production or booking title.
- Role/category.
- Expected pay and duration.
- Prestige/popularity.
- One clear primary action.

Keep detailed requirements and contract risks available on request.

Move negotiation into the relevant audition/review flow rather than cluttering the card with repetitive buttons.

### 2.4 Model brand obligations

Move active brand obligations near the top of the Model dashboard, particularly when appearances remain outstanding.

Show a concise summary with client name, remaining obligations, end date and a prominent **Fulfil Agreement** action.

Move completed and historical agreements lower down.

Keep exclusivity penalties, financial liabilities and existing contractual behaviour unchanged.

### 2.5 Results and writing

- Correct the lowercase “featured appearance” text and similar formatting issues.
- Make success classifications appropriate for commercials, films, theatre and modelling. An advert should not be described as a blockbuster.
- Investigate whether major successes producing zero fame are correct gameplay outcomes or calculation defects.
- Shorten casting, agency, contract and results popups.
- Remove generic journal filler such as “Another year passed. The ordinary days were part of my life too.”

Apply writing changes prospectively. Preserve the meaning and results of existing saved events.

---

## Phase 3 — Remove manual lifestyle activation

**Priority: High**

**Files:** `src/ui/PropertyLifestyle.tsx`, `VehicleLifestyle.tsx`, `HobbyLifestyle.tsx`, `PetLifestyle.tsx`, relevant game systems and `src/game/engine.ts`.

Remove the visible prompts for:

- Enable Lifestyle Features
- Enable Property Management
- Enable Vehicle Activities
- Enable Expanded Pet Activities

These features should simply be available as part of gameplay.

For new lives, initialise the appropriate systems automatically.

For older saves, implement safe, one-time, idempotent activation at an appropriate gameplay/save boundary. Do not silently change historical state merely by decoding a save.

Preserve older rental agreements, existing vehicle mileage, pet histories and all frozen outcomes.

Test legacy saves with missing optional lifestyle state, partially enabled features, interrupted saves and Time Machine restores.

---

## Phase 4 — Vehicles and driving licence overhaul

**Priority: High**

**Files:** `src/ui/VehicleLifestyle.tsx`, `app/(game)/asset/[id].tsx`, `app/(game)/(tabs)/assets.tsx`, `src/game/systems/vehicleActivities.ts`, `vehicleLicences.ts`, `assetPricing.ts`, `src/ui/AssetCatalogue.tsx`.

### 4.1 Vehicle management

Replace the excessively long activity list with logical groups:

- Driving & Trips
- Care & Maintenance
- Upgrades
- Ownership

Add matching illustrated icons throughout.

Remove the **Trade In for Another Vehicle** option from the UI. Preserve the existing command and historical records for compatibility.

Remove duplicated repair/upgrade entry points. Use one canonical management flow.

Show scrapping only when genuinely relevant.

Remove licence information from the individual vehicle detail page.

### 4.2 Licence experience

Put the Driving Licence in one logical location, accessible from Assets.

Present its three questions as three polished, sequential popup steps, with a clear final result.

Remove the awkward expandable quiz embedded in the screen.

Increase the road test cost from the current approximately $8 to around $80 in the US, with appropriate country-specific pricing.

Replace the technical success message with a short natural response, for example:

**Driving Test Passed!**

“You scored 3/3 and earned your driving licence.”

Remove the unnecessary explanation about real-world certification from normal gameplay.

### 4.3 Boats and aircraft

The catalogue currently defines three boats and three aircraft, although they are not consistently visible before lifestyle activation.

Audit their actual availability.

For the current scope, remove the Boating and Pilot Licence controls from the public UI and avoid exposing boat/aircraft purchases that cannot be used properly.

Do not delete existing owned vehicles, licences or historical records. Keep those systems compatible until they receive a complete dedicated gameplay flow.

### 4.4 Driving invitations and costs

Use the universal character picker for passengers and invited contacts.

Rebalance running costs, servicing, repairs and customisation using vehicle type, value, age, condition and country.

Avoid unrealistically cheap upgrades and maintenance, but don't apply arbitrary flat prices to every country.

Preserve financial quote verification and actual transaction accounting.

---

## Phase 5 — Properties and landlord management

**Priority: Critical**

**Files:** `src/ui/PropertyLifestyle.tsx`, `app/(game)/asset/[id].tsx`, `src/game/systems/landlordTenancies.ts`, `landlordState.ts`, `propertyAmenities.ts`.

This needs a substantial UX restructure.

### 5.1 Clear landlord dashboard

Replace the current extensive inline action list with a clean tenancy overview.

Show the current tenant's portrait, name, monthly rent, arrears, deposit, tenancy status and relevant next action.

Group management into:

- Tenants & Applications
- Rent & Payments
- Maintenance
- End Tenancy

Only show actions relevant to the current tenancy state.

### 5.2 Fix eviction flow

Investigate every eviction condition and reproduce failures using genuine saved tenancies.

Create a clear, guided process that displays what is required and what has already been completed.

The current game requires notice, unpaid rent thresholds, completed repairs, an independent review and a further waiting period.

Keep those financial and gameplay protections, but make the sequence understandable.

Do not offer an actionable **Complete Eviction** confirmation when the resolver would reject it.

Use shared eligibility logic in both the UI and command resolver, rather than duplicating incomplete checks.

### 5.3 Rent reviews and maintenance

- Correct annual rent-review availability checks.
- Prevent invalid 90%/100%/110% choices from opening misleading confirmation popups.
- Show precisely why an action is unavailable.
- Hide irrelevant actions rather than filling the screen with disabled options.
- Keep the exact agreed rent, escrow, deposit returns and payment history intact.
- Review unusually cheap administration and maintenance prices.

### 5.4 Home activities

Reduce home-activity clutter.

Use a compact activity picker for gatherings and the universal character picker for invitations.

Avoid repeating the same explanatory paragraphs throughout the property screen.

---

## Phase 6 — Hobbies and pets

**Priority: Medium–High**

**Files:** `src/ui/HobbyLifestyle.tsx`, `PetLifestyle.tsx`, `app/(game)/hobby/[kind].tsx`, `app/(game)/pets.tsx`, `src/assets/HobbyArt.tsx`.

### Hobbies

- Remove duplicated Personal Projects presentation.
- Use one clearly defined projects flow.
- Show current progress, requirements and the next action.
- Reduce long descriptions explaining internal mechanics.
- Use the shared portrait selector for practising with someone.
- Keep competitions, earned proficiency, practice requirements and project progress intact.

### Pets

- Remove activation prompts.
- Ensure pet pages never display errors from property or landlord workflows.
- Improve action hierarchy and icon consistency.
- Preserve automatic feeding, health, training, bonds, ownership and historical data.

---

## Phase 7 — Organised Crime and Prison

**Priority: High**

**Files:** `app/(game)/special-careers.tsx`, `organised-crime.tsx`, `prison-activities.tsx`, `prison.tsx`, `src/game/systems/organisedCrime.ts`, `organisedAssignments.ts`, `legal.ts`.

### 7.1 Organised Crime

Move Organised Crime **below Cult Leader** on the Special Careers page.

Rework organisation selection into three illustrated choices, removing the unnecessary Decline rows.

The Back button is sufficient when the player does not want to join.

Use better icons throughout the crime dashboard, assignments, rank progression and crew interactions.

Remove unnecessary meta wording such as “fictional assignment”, “game system” and repeated explanations about the simulation.

Present events naturally within the game's world.

### 7.2 Arrest balancing

The current assignment pipeline can immediately arrest the player through detection risk or reported outcomes, with subsequent investigations also possible.

Profile the real arrest rate across different missions, approaches and ranks.

Reduce excessive early-career arrests so players can meaningfully develop their organisation.

Cautious approaches should genuinely reduce risk. Bold decisions must remain riskier, and reports, evidence, betrayal and investigation must still matter.

Run substantial seeded progression tests before choosing new probabilities. Do not simply disable arrests.

### 7.3 Prison presentation

Replace long inmate and outside-contact lists with the shared portrait-based picker.

Group prison activities more clearly:

- Daily Routine
- Prison Relationships
- Prison Group
- Family & Outside Contacts
- Legal Options
- Escape

Add appropriate illustrated icons, reduce repetitive descriptions and keep existing prison mechanics.

---

## Phase 8 — Complete prison escape mini-game replacement

**Priority: High — dedicated implementation stage**

**Files:** `src/minigames/escape/EscapeGame.tsx`, `escapeLogic.ts`, `src/minigames/core/types.ts`, `session.ts`, `evaluation.ts`, `validation.ts`, `MiniGameEntry.tsx`, relevant prison systems.

Replace **Exit Shuffle** with a prison-themed **Cell Escape** puzzle.

### Concept

The player sees a stylised prison cell door containing several locks, with a collection of differently shaped keys.

They must identify and place the correct keys into matching lock slots. Each successful placement unlocks part of the door, with satisfying visual feedback.

Increase the challenge through additional locks, visual complexity and limited mistakes.

The interaction should be about matching fictional keys and mechanisms, not memory recall or realistic lockpicking instructions.

### Presentation

- Full-screen immersive prison-cell environment.
- Original artwork generated in the existing Dreams illustration style.
- Native interactive key and lock elements layered over the artwork.
- Smooth animations for movement, successful unlocking, incorrect choices and opening the cell door.
- Haptics and sound where enabled.
- No generic text-only gameplay.
- No unnecessary opening popup.
- No visible assisted-mode controls or separate hint system.
- One brief instruction embedded in the game itself.
- Keep accessible controls and reduced-motion alternatives.

Rename the action to **Attempt Prison Escape**, with concise supporting text such as “Play a lock-and-key challenge for a chance to escape.”

### Save compatibility

Introduce a new version of escape sessions and their input transcripts.

Previously started v1/v2 Exit Shuffle sessions must remain completable under their original rules. New attempts use only the replacement game.

Preserve existing attempt limits, sentence context, actual escape outcomes, once-only settlement and pause/reopen behaviour.

Tests must cover successful and failed attempts, interruption, relaunch, saved inputs and Time Machine restoration.

---

## Phase 9 — Artwork generation and integration

**Priority: High**

Use `docs/planning/artwork-and-delivery.md`, the existing artwork atlases and the approved Dreams references as the style source.

### Image-generation workflow

1. Inventory missing illustrated icons and mismatched placeholder assets.
2. Reuse existing suitable artwork before generating duplicates.
3. Generate original illustrations in small, consistent batches using the image-generation workflow.
4. Match the game's colourful, softly dimensional cartoon style, lighting, framing and proportions.
5. Use transparent backgrounds for icons and interactive foreground elements.
6. Optimise images and integrate them through typed artwork registries and atlases.
7. Verify actual appearance on iPhone and Android.

Prioritise newly added hobbies currently using generic vector icons, then landlord management, vehicle activities, organised crime and prison.

For the prison game, generate illustrated background and object layers separately. Do not generate an entire flattened game screen with baked-in buttons or text.

If image generation is unavailable within the implementation environment, produce an explicit asset manifest and integration locations instead of substituting generic icons.

---

## Phase 10 — Continue This Year performance overhaul

**Priority: Critical**

The user experiences approximately two-second delays during **Continue This Year**, already around age 23.

Existing Node performance improvements do not prove that real mobile responsiveness is solved.

### Investigation

Instrument the entire action:

1. Button press → busy/loading feedback.
2. Simulation command execution.
3. World validation.
4. Checkpoint encoding.
5. SQLite transaction and save.
6. State publication, selectors and React rendering.

Profile representative lives at ages 18, 23, 30, 50 and 70 on actual release-mode iOS and Android builds.

Investigate excessive re-rendering, unvirtualised lists, repeated full-world scans, large derived projections and unnecessary work on the main JS thread.

Split large UI components and expensive computations where profiling demonstrates a benefit.

Avoid weakening world integrity checks, save atomicity, RNG determinism or checkpoint compatibility for speed.

**Acceptance:** Record before/after median and p95 timings, visual responsiveness and any remaining bottlenecks. The button must show immediate feedback, and ordinary annual advancement should be substantially faster without changing results.

---

## Phase 11 — Global writing and UX cleanup

Perform a final audit across all newly introduced gameplay.

Writing rules:

- Use natural, concise English.
- Start complete sentences and headings with correct capitalisation.
- Remove repeated instructions and unnecessary mechanical disclaimers.
- Avoid generic filler, awkward AI-sounding jokes and excessive use of em dashes.
- Show numbers, risks and requirements only where relevant to a decision.
- Keep humour occasional and appropriate.
- Present actual consequences accurately.
- Never describe saved outcomes as changed when the underlying game state did not change.

Use versioned prospective copy changes where necessary so historical pending decisions retain their original meaning.

---

## Phase 12 — Verification and release acceptance

After each implementation stage:

- Run relevant focused unit, gameplay and UI tests.
- Test success, failure, cancellation and repeated actions.
- Verify actual SQLite persistence and cold reopening.
- Test older lives and historical fixtures.
- Verify failed-save rollback and retry.
- Preserve Time Machine branching and child continuation.
- Confirm deterministic outcomes and financial receipts.
- Check no new import cycles or TypeScript errors.

Relevant existing suites include Actor/Model career tests, lifestyle journeys, landlord/property/vehicle tests, organised crime progression, prison flow and escape-session compatibility.

Final checks:

- `npm run typecheck`
- `npm run check:imports`
- `npm test`
- `npm run test:soak`
- Android and iOS Hermes production exports
- Actual iOS and Android device playthroughs
- Light/dark appearance, enlarged text and reduced motion
- Long-term performance and save/load tests

Do not claim device acceptance from unit tests or Hermes exports alone.

## Implementation order and delivery

Implement in these independent checkpoints:

1. Shared UI, person picker and error isolation.
2. Actor/Model cleanup and automatic casting.
3. Lifestyle activation and legacy compatibility.
4. Vehicle and licence overhaul.
5. Landlord and property overhaul.
6. Hobbies/pets and illustrated artwork.
7. Organised Crime balancing and prison UI.
8. Complete escape mini-game replacement.
9. Global writing polish and performance optimisation.
10. Full regression, native playtesting and final fixes.

Every checkpoint should include its own code, tests, documentation and commit. Do not leave all regression testing until the end.

### Final definition of done

The new features should feel as intuitive and visually consistent as the established Dreams systems.

Players should encounter no duplicate agency choices, manual casting refreshes, unnecessary decline buttons, activation prompts, unrelated screen errors, sprawling contact lists or walls of explanatory text.

Landlord controls must work reliably, careers and organised crime must allow meaningful progression, illustrations must match the game, and annual advancement must feel responsive.

**Preserve the complexity behind the scenes. Make the experience simple, polished and enjoyable.**