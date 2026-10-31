# Codex Implementation Plan — Dreams v2: Lifestyle Overhaul Final Polish

**Branch:** `v2`  
**Baseline:** `439aa14`  
**Target:** Improve property, vehicles, pets and hobbies from approximately 8.6/10 towards 9+/10.

Implement all changes, test them, self-review, commit and push to `v2`.

## Non-negotiable requirements

- Preserve the existing UI, navigation, artwork and feature boxes.
- Do not add new major gameplay systems or catalogue items.
- Preserve existing saves, Time Machine, financial transactions and generational continuation.
- Keep all lifestyle features free; do not touch RevenueCat.
- Maintain the Dreams writing tone: grounded, outrageous, humorous and occasionally dark.
- Preserve existing events and their saved wording when already offered.

---

## Phase 1 — Fix Duplicate Journals and Incorrect Narrative Voice

### Confirmed problem

In `src/game/systems/lifestyleStories.ts`, `resolveLifestyleChoice()` calls `recordLifestyle()`, which already writes a journal fact.

Then `src/game/engine.ts` writes another journal entry when the player chooses an event outcome.

Both can use the same second-person result text.

### Implementation

1. Ensure each new lifestyle story decision creates exactly **one player-facing journal entry**.
2. Preserve the corresponding `lifestyle.records` activity entry for validation and history.
3. Allow `recordLifestyle()` to skip generating a separate journal fact for newly versioned lifestyle story resolutions only.
4. Give every lifestyle story choice a separately authored, first-person journal sentence.
5. Freeze that journal sentence when the event is offered.
6. Keep old saved pending decisions and their existing settlement semantics unchanged.

### Writing rules

**Event setup and result:** Second person.

> You discover your tenant has been running a pottery class in the living room. The furniture has acquired several new shapes.

**Journal:** First person.

> I discovered my tenant was running pottery classes in my rental property.

No duplicated diary entries, generic stat commentary or second-person journals.

### Files

- `src/game/systems/lifestyleStories.ts`
- `src/game/systems/lifestyleCommon.ts`
- `src/game/content/lifestyleEvents.ts`
- `src/game/systems/lifestyleSchemas.ts`
- `src/game/engine.ts`
- `src/game/systems/lifestyleValidation.ts`

Add a prospective journal-rule revision for new offers. Missing revision means the previously published behaviour remains unchanged.

**Acceptance:** One resolved new lifestyle event produces one first-person journal entry, one valid activity record and one result. Reloading or acknowledging the result never creates duplicates.

---

## Phase 2 — Show Actual Consequences in Event Results

### Confirmed problem

`resolveLifestyleChoice()` applies gameplay consequences but returns `effects: []`.

This means the result modal often doesn't clearly communicate what happened mechanically.

### Implementation

Use the existing `RuntimeEffectRow` format and `EventModal` presentation.

For every new lifestyle event, capture relevant state before and after applying the saved choice.

Display actual changes, including:

- Property condition, value and maintenance
- Money spent and insurance received
- Tenant relationship and satisfaction
- Vehicle condition and damage
- Pet happiness, bonding and training
- Hobby proficiency, discipline or competition results
- Health injuries and real legal incidents

Only show values that genuinely changed.

### Example

A tenant damages the property and the player chooses to pay for repairs.

The result should show the appropriate values, such as:

| Effect | Example |
|---|---|
| Repair cost | -£250 |
| Property condition | 62% → 70% |
| Tenant relationship | +4 |

These are illustrative values, not amounts to hardcode.

### Requirements

- Calculate effects from **actual resolved state**, not simply the requested operation amount.
- Respect 0–100 caps.
- Distinguish a new cost from an insurance reimbursement.
- Do not display a payment unless a real ledger transaction exists.
- Do not claim an injury, legal case, ownership transfer or medical recovery unless the corresponding record exists.
- Avoid displaying irrelevant or repetitive effect rows.
- Do not consume extra RNG or create additional state changes while preparing display values.

**Acceptance:** All 120 choices across the 60 lifestyle situations are tested for truthful, useful effect rows. Previously saved outcome snapshots continue to resolve under their original rules.

---

## Phase 3 — Fix Driving Licence and Driving-Age Rules

### Confirmed problem

`src/game/systems/vehicleLicences.ts` allows road licences from age 16 in the US/Canada and 17 in the UK.

However, `src/game/systems/vehicleActivities.ts` uses `lifestyleReason()` and `requireLifestyle()` with the general adult restriction of 18.

A properly licensed 16- or 17-year-old therefore cannot use a legally owned road vehicle.

### Implementation

Create one authoritative age policy shared by vehicle eligibility and licence eligibility.

### Rules

- Road driving: country-specific minimum age.
- Boats and aircraft: age 18 unless a separately authored, explicitly supported policy says otherwise.
- Road licence required for driving.
- Boating/pilot licence required for the corresponding vehicle.
- No bypass through direct engine commands.
- General adult restrictions remain in place for unrelated activities.

Make appropriate road-vehicle ownership accessible at the authorised driving age, using legitimate cash purchases or pre-existing lawful ownership.

Do not allow the purchase to spend inherited money held in trust, create debt or silently transfer a family member's property.

Do not automatically grant vehicles or licences at a birthday.

### Tests

Test eligible and ineligible ages across all 12 countries, including:

- US: 15 fails, 16 with licence succeeds.
- Canada: 16 with licence succeeds.
- UK: 16 fails, 17 with licence succeeds.
- Countries with an age-18 policy remain restricted until 18.
- Under-18 boating/pilot use remains restricted.
- Existing adults, historical vehicle saves and legitimate inherited vehicles continue working.

**Acceptance:** Passing a licence has a meaningful gameplay use at the age the game permits it.

---

## Phase 4 — Editorial Polish of Lifestyle Writing

### Problem

The 60 new situations are varied, but some choices are too mild, and many ordinary action responses use implementation terminology rather than entertaining prose.

Examples of wording to remove from player-facing stories:

- "The payment is recorded."
- "No money was invented."
- "Your shared memory grew."
- "The actual outcome draw..."
- "The recorded ownership remains unchanged."

These details belong in effect rows, history or technical documentation, not ordinary storytelling.

### Implementation

Audit all 60 authored lifestyle situations and the regular result messages in:

- `src/game/content/lifestyleEvents.ts`
- `src/game/systems/landlordTenancies.ts`
- `src/game/systems/vehicleActivities.ts`
- `src/game/systems/petTraining.ts`
- `src/game/systems/hobbyAccomplishments.ts`

Rewrite weak text while preserving existing eligibility, decisions and real outcomes.

### Tone targets

**Property:** Absurd tenants, awkward neighbours, family disagreements, terrible home improvements and occasional landlord disasters.

**Vehicles:** Embarrassing breakdowns, awful road trips, mechanical disasters, family arguments and expensive decisions.

**Pets:** Charming personalities, ridiculous animal behaviour, emotional bonds and occasional dark humour.

**Hobbies:** Friendly rivalries, absurd competitions, humiliating failures and satisfying achievements.

### Example: Vehicle breakdown

Weak:

> You experienced a vehicle breakdown. Your vehicle's condition decreased, and the incident was recorded.

Better:

> Your car gives up halfway through the journey. The mechanic listens to the engine for three seconds, sighs deeply and asks whether you've considered public transport.

Only use this outcome when an actual breakdown occurred.

### Example: Home improvement

Weak:

> You installed a kitchen upgrade. The estimated property value increased.

Better:

> Your new kitchen is finally finished. It looks magnificent. The contractor sends an invoice that makes you briefly reconsider eating.

### Editorial rules

- Keep the jokes specific and natural.
- Use character personality and actual context.
- Avoid repetitive narrator sarcasm.
- Remove generic motivational language.
- Give different decisions distinctly different reactions.
- Make damaging or selfish choices feel consequential.
- Allow genuinely happy, wholesome and sentimental moments.
- Preserve the factual distinction between a small embarrassment and a serious incident.
- Do not add events just to increase the count.

Separately review any operation names that imply a different effect from what the resolver actually applies. For example, a pet-health operation should not be presented as medical healing if it only improves happiness.

**Acceptance:** All 60 events and major lifestyle action responses receive an editorial review. Rewrite weak examples, keep strong existing writing, and document at least 20 representative before/after improvements.

---

## Phase 5 — Actual Gameplay and Balance Verification

Automated correctness is already strong. The remaining question is whether these activities feel enjoyable across actual lives.

### Run realistic gameplay journeys

Test at least these scenarios:

1. **Young driver:** Obtain a licence at the permitted age, lawfully acquire/use a car, drive, maintain it and progress into adulthood.
2. **Property investor:** Buy, improve, find tenants, collect rent, handle a disagreement and sell.
3. **Pet owner:** Adopt, train, experience events, handle illness and preserve family bonds.
4. **Hobby enthusiast:** Attend lessons, build skill, meet people, enter competitions and complete projects.
5. **Ordinary life:** Play without expensive properties or vehicles, ensuring the game remains entertaining.
6. **Long life:** Progress through ages 20–90 with lifestyle features enabled.

### Measure

- Average lifestyle events per year
- Repeated event frequency
- Number of decisions and popups
- Time required to develop each hobby
- Vehicle repair and running costs
- Property income versus genuine maintenance costs
- Pet care affordability
- Frequency of major versus small consequences
- Save size and Age Up performance

Preserve the existing quiet-year pacing and at-most-two optional lifestyle decisions per year. Do not increase event frequency merely to showcase the new writing.

### Native testing

Where actual Android/iOS environments are available, check:

- Asset and pet details
- Confirmation dialogs
- Longer text wrapping
- Large accessibility font settings
- Licence quiz interactions
- Navigation and Back behaviour
- Screen-reader labels
- Modal/result presentation
- Perceived Age Up responsiveness

If no device or simulator is available, explicitly mark installed-device acceptance as unverified.

---

## Phase 6 — Regression and Save Compatibility

Preserve:

- Ordinary World 49 / engine 51 / content 28
- Enhanced creative World 50 / engine 52 / content 29
- Crime/romance overhaul histories
- Existing lifestyle capability records
- Reader 32 compatibility and the archive formats
- The original first-stage lifestyle decision fixtures
- Existing Time Machine checkpoints, receipts and backups

New prospective event journal/output revisions must not change how older saved decisions resolve.

### Required verification

- Full Jest regression with zero remaining failures
- Strict TypeScript checks
- Import-cycle checks
- All 120 lifestyle event choice tests
- Journal duplication and first-person voice tests
- All country-specific driving age tests
- Correct event-effect row tests
- SQLite failure, rollback, retry and cold reopening
- Time Machine branch independence
- 120-life soak
- Age 50/70/90 performance benchmarks
- Android/iOS Hermes exports
- Historical complete-world replay compatibility

Do not combine earlier failing runs and later focused reruns into a claim that a single full regression passed cleanly. Report the provenance accurately.

---

## Delivery

Implement in this order:

1. Journal duplication and voice fixes.
2. Truthful event consequence rows.
3. Age-appropriate driving and ownership.
4. Full lifestyle writing polish.
5. Gameplay balance review.
6. Regression, compatibility and performance verification.

Update `docs/LIFESTYLE_OVERHAUL.md`, `docs/LIFESTYLE_WRITING_AUDIT.md`, `docs/HANDOFF.md` and create `docs/LIFESTYLE_FINAL_POLISH.md`.

Commit and push completed changes to `v2`.

## Final acceptance criteria

The work is complete when:

- Lifestyle journals contain no new duplicate events and use the correct narrative voice.
- Every meaningful event choice visibly communicates its actual consequences.
- Driving eligibility matches the game's licence-age policies.
- Property, vehicle, pet and hobby writing feels distinctly entertaining rather than mechanically generated.
- Existing saved lives and historical decisions remain compatible.
- Performance and verification are documented honestly.

**Do not expand the catalogues or redesign the UI. Focus entirely on making the already implemented systems feel polished, consistent and enjoyable.**