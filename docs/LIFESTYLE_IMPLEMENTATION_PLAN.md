# Codex Implementation Plan — Dreams v2: Property, Vehicles, Pets & Hobbies

## Objective

Expand four existing gameplay areas to approximately BitLife-level depth, with stronger personality, memorable situations, genuine consequences and improved replayability.

**Repository:** `dreams-life-sim`  
**Branch:** `v2`  
**Starting commit:** `2d602ba`  
**Target:** 9/10 gameplay quality across these four areas.

Implement the complete changes, tests and documentation. Commit and push completed work to `v2`.

### Non-negotiable rules

- **Preserve Dreams' existing visual design.** No tab redesigns, mismatched artwork, overly complex dashboards or AI-looking UI.
- Keep all existing property, vehicle, pet, hobby, finance and estate functionality.
- Preserve historical saves, pending choices, purchases, Time Machine and generational continuation.
- All new gameplay is free. Do not add premium purchases or alter RevenueCat.
- Use the established outrageous, witty and occasionally dark Dreams writing style.
- Gameplay must be enjoyable without constant management or excessive popups.
- Do not copy BitLife's specific dialogue, scenarios or assets.
- Prefer expanding existing systems instead of building disconnected replacements.

Read `docs/HANDOFF.md`, `docs/PETS.md`, `docs/LEISURE.md`, `docs/HOBBY_COMMUNITY_EVENTS.md` and the current code before changing anything.

---

# Phase 1 — Property & Landlord Overhaul

## 1.1 Expand property management

The current game already offers 20 property types, mortgages, sales, refinancing, renovation, insurance, primary residences and basic rental income.

**Retain all of this.**

The main gap is that properties are mostly financial assets rather than places where interesting things happen.

Add a proper property management experience through the existing `/asset/[id]` screen.

Include:

- View property condition, value, mortgage and ownership history.
- Improve and upgrade the home.
- Maintain or repair damage.
- Rent to actual named tenants.
- Interact with tenants.
- Host gatherings.
- Experience property-related incidents.
- Manage and sell investment properties.

Keep the existing compact card layout, feature boxes and ActionRow style.

## 1.2 Property improvements and amenities

Add approximately 10–12 improvements, such as:

- Renovated kitchen
- Upgraded bathroom
- Home gym
- Garden
- Gaming room
- Music studio
- Swimming pool
- Garage
- Home cinema
- Home office
- Workshop
- Stable or animal-friendly grounds, only on suitable properties

Each improvement should have:

- Real purchase and installation cost
- Appropriate property eligibility
- Potential added value
- Optional maintenance cost
- A genuine gameplay benefit where relevant
- A permanent, saved record

For example, a home gym could improve access to fitness activities; a workshop could support woodworking; a music studio could benefit guitar or singing practice.

**Avoid passive stat farming.** Benefits should require appropriate gameplay and should not duplicate rewards from the existing health and hobby systems.

Upgrades must not create infinite profit through unrealistic property appreciation or repeated refinancing.

Existing properties with built-in features, such as Modern Pool Villa, must not receive duplicate amenities by default.

## 1.3 Real landlord gameplay

Replace the shallow anonymous tenant experience for newly enabled properties with a more engaging system.

### Tenants

A rental property can attract applications from actual named adult NPCs.

Each applicant should have grounded characteristics:

- Employment or recorded source of funds
- Available finances
- Reliability
- Relevant temperament
- Personal history where available

The player can:

1. Review an application.
2. Perform a background check.
3. Accept or reject an applicant.
4. Set a reasonable rental price.
5. Inspect the property.
6. Respond to maintenance requests.
7. Discuss rent problems.
8. Renew or end a tenancy.
9. Pursue an eviction through an appropriate reviewed process.

Tenants remain actual people with stable identities, not anonymous monthly income generators.

### Rental finances

Tenant rent must be a genuine financial transfer where the NPC's finances are modelled.

- Debit tenant, credit landlord.
- Collect rent only when due and payable.
- Track arrears.
- Record deposits separately from income.
- Handle vacancies.
- Handle damage and maintenance costs.
- Prevent duplicate collection and invented money.

Preserve existing anonymous rental arrangements on old saves until an explicitly reviewed transition is implemented.

Do not confuse landlord tenancies with `src/game/systems/rentalHomes.ts`, which manages the player's own rented residence.

### Tenant behaviour

Create situations involving:

- Late rent
- Property damage
- Unexpected tenant requests
- Problem neighbours
- Suspicious inspections
- Unreasonable landlord behaviour
- Unexpectedly excellent tenants
- Family disagreements over investment properties

Tenant actions should have real effects on property condition, rent, relationships, money and tenancy state.

Avoid unlimited eviction, rent increases or guaranteed tenant exploitation.

## 1.4 House activities

Add a small number of meaningful property actions:

- Host a house party
- Invite family for dinner
- Celebrate an occasion
- Inspect the property
- Improve the home

House parties should feature actual contacts where relevant.

A gathering can improve friendships, become embarrassingly chaotic, cause paid damage or create a memorable story.

Do not require a homeowner to host every year. These are optional activities.

## 1.5 Housing and family integration

Property decisions should interact with:

- Marriage
- Divorce and settlement
- Children and household size
- Pets
- Relocation
- Inheritance
- Mortgage debt
- Existing rental homes

Housing suitability should matter for future decisions without breaking existing families or removing existing pets.

**Property acceptance journey**

Buy a modest house → Improve it → Rent it to a real tenant → Handle rent and maintenance → Experience tenant conflict → Sell or keep it → Preserve correct finances and ownership history.

---

# Phase 2 — Vehicles Overhaul

## 2.1 Make vehicle ownership meaningful

Dreams already has 20 vehicles, condition, insurance, maintenance, depreciation and buying/selling.

The biggest missing feature is actually doing things with vehicles.

Expand the existing asset system and `/asset/[id]` route.

## 2.2 Driving licences

Introduce a simplified driving-licence system.

- Age eligibility comes from authored country game rules.
- Small, original road-awareness quiz.
- Limited retry rules.
- Persistent pass/fail records.
- Optional costs where applicable.
- No real-world legal certification claims.

Players should need the appropriate licence to use newly supported road vehicles.

Preserve existing ownership and compatibility for older saves. Do not suddenly invalidate previously purchased cars or invent historical licences.

## 2.3 Vehicle interactions

Add:

- Go for a drive
- Take a road trip
- Drive with a friend or partner
- Service the vehicle
- Repair damage
- Customise appearance
- Upgrade selected performance features
- Gift a lawfully owned vehicle
- Sell or trade in a vehicle
- Scrap a severely damaged vehicle

Some activities can be linked to existing outings and travel rather than creating duplicate travel records.

### Real mileage and condition

Add mileage progression from actual recorded usage.

Use appropriate values from the existing vehicle catalogue.

Condition should respond to:

- Age
- Distance driven
- Maintenance
- Damage
- Repair quality
- Occasional incidents

Maintenance should improve reliability without completely resetting the vehicle's age.

Preserve the existing asset feature-box design. Do not reintroduce prominent MPG/range boxes that were deliberately removed from the UI.

## 2.4 Vehicle incidents

Add 10–15 varied situations:

- Car breakdowns
- Unfortunate road trips
- Parking disputes
- Mechanic scams
- Unexpected repair bills
- Family requests to borrow a car
- Vehicle theft
- Traffic-related consequences
- Embarrassing driving experiences
- Accidents
- Unexpectedly valuable vintage cars

Do not make driving disproportionately lethal or expensive.

Actual incidents should affect condition, insurance, repair costs, health or legal state as appropriate.

Continue using the recently implemented stolen-vehicle provenance system. Stolen vehicles must not be sold, gifted, insured or inherited as legitimate property.

## 2.5 Luxury and specialty vehicles

To approach BitLife's asset breadth, add a small collection of additional vehicle categories:

- Boats
- Small aircraft
- Helicopters or comparable luxury aircraft

Implement a corresponding simplified boating/pilot licence where appropriate.

Start with a compact catalogue rather than dozens of nearly identical models.

Provide meaningful leisure interactions and higher ownership costs.

Do not build an entire aviation or racing career as part of this task.

An optional amateur racing event can be considered if it fits the current mechanics, but the core vehicle ownership improvements take priority.

**Vehicle acceptance journey**

Obtain a licence → Buy a used car → Drive it → Experience wear or a breakdown → Service it → Upgrade it → Sell it or pass it to a family member.

Every change must be real and persisted.

---

# Phase 3 — Pets Overhaul

## 3.1 Expand the available animals

Current pets include dogs, cats, rabbits and parrots, with six adoption offers.

Keep those animals and all existing pet histories.

Expand to approximately 8–10 sensible species, potentially including:

- Hamsters
- Guinea pigs
- Turtles
- Fish
- Horses, subject to suitable housing

Expand dog and cat breeds, ages and adoption personalities.

Use fictional shelter/breeder offerings that suit the game's tone; do not introduce illegal wildlife trade.

### Adoption routes

Offer several distinct options:

- Animal shelter
- Rescue organisation
- Breeder for appropriate domestic species
- Specialist domestic-animal adoption
- Horse adoption or purchase with suitable property

Each should offer meaningful differences in cost, age, breed and temperament.

Animals should not simply be interchangeable icons with different names.

## 3.2 Individual pet personalities

The current temperament system is a good base.

Expand personalities with a small number of additional traits, such as:

- Loyal
- Mischievous
- Nervous
- Affectionate
- Stubborn
- Curious
- Energetic

Use these to affect actual interactions and event outcomes.

Example: A stubborn dog might struggle with training but form a very strong attachment to its owner.

Keep personalities consistent across years rather than rerolling behaviour for every action.

## 3.3 Pet training and activities

Add appropriate species-specific interactions:

- Train
- Teach a trick
- Groom
- Take on an outing
- Play together
- Spend quiet time
- Introduce to another pet
- Attend a small pet competition

Training should have persistent progress and realistic limits.

A trained pet can gain genuine benefits, including improved behaviour and better chances in appropriate events.

Do not require players to repeatedly tap Feed, Groom or Train every year to prevent arbitrary punishment.

Existing automatic monthly food/basic care remains the default.

## 3.4 Pet health and behaviour

Expand beyond the current single infection/recovery model, while remaining approachable.

Possible developments:

- Minor injuries
- Age-related illness
- Anxiety or behavioural problems
- Recovery after treatment
- Routine preventive care

Veterinary treatment needs actual costs and outcomes.

Do not introduce excessive medical complexity.

Pet wellbeing should depend on age, health, environment, care and temperament.

Preserve existing automatic feeding, boarding, grief, ageing, rehoming and owner succession.

## 3.5 Household interactions

Pets should interact meaningfully with:

- Children
- Spouses
- Other pets
- Property suitability
- Family moves
- Temporary absence
- Owner death

Example: A child may become especially attached to the family dog, and a divorce or relocation may require a reviewed pet-care decision.

Use existing family relationships and household structures.

Never automatically discard a pet simply because a new property rule is introduced.

## 3.6 Pet situations

Add approximately 15–20 genuinely varied authored situations.

Examples:

**The Witness**

Your parrot has learned one sentence you would prefer it forget. Unfortunately, it has discovered that guests produce the biggest reaction.

Only reference a particular secret if the simulation has an actual recorded reason for the pet to know it.

**The Professional Dog**

Your dog has completed its first training course. The instructor calls it an excellent student. Your dog immediately eats the certificate.

**The Household Election**

Your cat has decided one family member is the only acceptable human in the house. Everyone else appears to have been placed on probation.

Not every pet event should be a joke. Include affectionate, serious and emotionally meaningful moments.

**Pet acceptance journey**

Adopt → Build bond → Train → Experience personality-specific situations → Deal with illness or ageing → Preserve ownership history and family memories.

---

# Phase 4 — Hobbies and Leisure Overhaul

## 4.1 Expand hobby variety

Current hobbies:

- Guitar
- Painting
- Photography
- Chess
- Reading
- Video games
- Cooking
- Gardening

Retain all eight with their existing proficiency and practice history.

Add approximately eight complementary hobbies:

- Running
- Swimming
- Writing
- Pottery
- Singing
- Coding
- Fishing
- Dancing

Use sensible age, location, health and equipment requirements.

Do not unnecessarily lock hobbies behind purchases.

## 4.2 More satisfying proficiency progression

Keep the existing 0–100 proficiency model.

Introduce meaningful milestones such as:

- Beginner
- Developing
- Skilled
- Expert
- Master

These labels should reflect actual earned proficiency and records.

Progress should unlock different activities, competitions or interactions.

Do not grant invented qualifications or money merely because a player reaches a threshold.

Preserve both existing practice modes and paid attendance mechanics.

Consider allowing a third active routine if balancing and performance tests support it. Existing two-routine saves must remain unchanged.

## 4.3 Competitions and accomplishments

Give hobbies a reason to exist beyond improving statistics.

Examples:

- Chess tournaments
- Local photography competitions
- Art exhibitions
- Cooking competitions
- Amateur running events
- Writing contests
- Gaming tournaments
- Singing performances

Competitions should have:

- Eligibility from actual practice/proficiency
- Different choices or approaches
- Genuine chance of failure
- Named participants where appropriate
- Persistent accomplishments
- Appropriate reputation or relationship effects
- Actual recorded prize money only where awarded

Use one meaningful competition opportunity per hobby per year rather than constant event spam.

## 4.4 Creative projects

Introduce selected long-term hobby accomplishments without scripted multi-year event chains.

For example:

- Write a short story.
- Produce a painting.
- Complete a photography project.
- Prepare a cooking speciality.
- Build a small programming project.
- Learn an original song.

These can create persistent project records or achievements.

A completed work must not automatically become a physical item with resale value unless it is actually added to the asset system through a valid transaction.

Projects should make the character's personal life feel distinctive.

## 4.5 Hobby relationships

Expand the existing hobby introductions and community events.

Allow players to:

- Meet hobby friends
- Attend club gatherings
- Invite existing contacts to practise
- Build friendly rivalries
- Participate with partners or children
- Form meaningful shared memories

Reuse real NPC identities and the established relationship system.

Hobbies should sometimes become the reason two people know each other.

## 4.6 Expand local leisure

The current four outing types are cinema, concert, museum and dancing.

Expand to approximately 8–10 with activities such as:

- Theatre
- Comedy show
- Park outing
- Aquarium
- Sports event
- Festival
- Outdoor adventure

Where appropriate, let the player invite a real friend, partner or family member.

Costs and consent must be genuine. Do not claim an NPC attended unless they actually did.

## 4.7 Hobby situations

Add 15–20 original events involving talent, rivalry, embarrassment, achievements and unexpected outcomes.

Example:

**The Chess Prodigy**

You entered a chess tournament expecting a relaxed afternoon. Your first opponent is nine years old and has brought a coach, two notebooks and a look of profound disappointment.

Possible decisions:

- Take the match seriously.
- Make a reckless opening move.
- Admit you are outmatched.

Outcomes should depend on actual proficiency and the selected strategy.

**Hobby acceptance journey**

Start a hobby → Build genuine proficiency → Meet peers → Enter competitions → Earn accomplishments → Carry a meaningful hobby history into later life.

---

# Phase 5 — Connect All Four Systems

This is how Dreams can become more engaging than four disconnected feature packs.

Implement cross-system interactions where they add genuine depth:

| Connection | Gameplay example |
|---|---|
| Property + Pets | Suitable grounds enable horse ownership or certain pet activities |
| Property + Hobbies | A music room supports practice; a garden supports gardening |
| Vehicles + Family | Take an existing family member on an actual outing |
| Vehicles + Property | A garage can improve vehicle maintenance options |
| Pets + Relationships | Family members develop distinct bonds with the same pet |
| Hobbies + Careers | Relevant hobbies contribute bounded skills to existing career systems |
| Hobbies + Relationships | Shared activities build actual friendships and romantic memories |
| Property + Crime | Theft or damage can create real insurance/legal consequences |

Avoid turning these connections into mandatory requirements for ordinary life.

A player with no owned property, no vehicle and little money must still have enjoyable hobby and relationship options.

---

# Phase 6 — Writing and Event Quality

Add approximately 50–65 high-quality new situations across the four areas.

Suggested distribution:

- Property: 10–15
- Vehicles: 10–15
- Pets: 15–20
- Hobbies/leisure: 15–20

Treat these as editorial targets, not filler quotas.

Every event needs:

- An original, interesting premise
- Specific contextual eligibility
- Distinct choices
- Strongly differentiated outcomes
- Factual journals
- Real consequences where appropriate
- Appropriate rarity and cooldown
- Saved participant and asset identities
- No phantom spending, qualifications, injuries, ownership or relationships

### Tone

Maintain Dreams' established voice:

- Outrageous and witty
- Occasionally dark
- Grounded in real consequences
- Natural, concise sentences
- Character-specific reactions
- No corporate motivational prose
- No endless generic sarcasm
- No forced multi-year story arcs

Some experiences should be comforting or emotionally sincere.

Do not overuse disaster, death, theft or betrayal simply to make content memorable.

---

# Phase 7 — Architecture and Save Compatibility

## Suggested architecture

Extend these existing systems:

- `src/game/systems/assets.ts`
- `src/game/systems/rentalHomes.ts`
- `src/game/systems/pets.ts`
- `src/game/systems/leisure.ts`
- `src/game/systems/hobbyEvents.ts`
- `src/game/content/assets.ts`
- `src/game/content/pets.ts`
- `src/game/content/leisure.ts`

Add focused modules where needed:

- `landlordTenancies.ts`
- `landlordSchemas.ts`
- `propertyAmenities.ts`
- `vehicleActivities.ts`
- `vehicleLicences.ts`
- `petTraining.ts`
- `hobbyCompetitions.ts`
- `hobbyAccomplishments.ts`

These are proposed modules, not an instruction to duplicate existing engines.

### Critical compatibility requirements

1. Preserve the current ordinary and enhanced creative-career world capabilities.
2. Preserve the existing overhaul and escape-session records.
3. Add any required new state prospectively through explicit versioned capabilities.
4. Preserve the current stolen-vehicle identity/provenance model.
5. Do not rewrite existing asset titles, mortgage balances, leases, care payments or hobby practices.
6. Freeze accepted terms and outcomes before presenting decisions.
7. Keep rendering and preview queries read-only.
8. Keep player rental leases separate from landlord tenant agreements.
9. Do not silently add costs, obligations or new restrictions to legacy worlds.
10. Maintain bounded histories and efficient lookups for long-lived characters.

Every action must be validated by the engine, not merely disabled in the UI.

---

# Phase 8 — Testing and Acceptance

## Property

Test buying, mortgages, amenities, tenant selection, deposits, rent payments, arrears, eviction, maintenance, sale, divorce, ownership changes and inheritance.

Ensure landlord finances conserve money and existing tenants remain identifiable.

## Vehicles

Test licences, purchases, mileage, maintenance, damage, repairs, gifts, resale, theft, recovery, insurance, death and inheritance.

Ensure stolen property never accidentally becomes legitimate property.

## Pets

Test species-specific care, adoption, consent, housing suitability, training, vet treatment, illness, boarding, moves, grief, owner death and family succession.

Never allow care charges to continue after the pet has died or been rehomed.

## Hobbies

Test proficiency, payments, new kinds, competitions, accomplishments, shared activities, parental consent, holidays, illness, custody, career overlap and retirement.

Ensure no double skill rewards or fabricated prizes.

## Integrated journeys

Create real persistent test journeys including:

1. **Property investor:** Buy → Upgrade → Rent → Tenant conflict → Sell → Inherit.
2. **Vehicle enthusiast:** Licence → Purchase → Drive → Damage → Repair → Gift or sell.
3. **Pet owner:** Adopt → Bond → Train → Treat illness → Family succession.
4. **Hobby specialist:** Practise → Meet peers → Compete → Earn accomplishment.
5. **Ordinary life:** Enjoy modest housing, inexpensive leisure and stable family life without heavy management.
6. **Multi-generation:** Preserve the correct property, vehicle, pet and hobby history after death and child continuation.

Run the full regression, strict TypeScript checks, import-cycle checks, 120-life soak, SQLite rollback/retry/cold-resume tests, Time Machine branch tests, 12-country financial checks, large-life performance benchmarks and Android/iOS Hermes exports.

Do not claim installed-device acceptance unless actually performed.

---

# Implementation Order

1. **Property:** Landlord gameplay, named tenants, amenities and house interactions.
2. **Vehicles:** Licences, driving, mileage, maintenance and meaningful incidents.
3. **Pets:** More animals, personality, training and family interactions.
4. **Hobbies:** New kinds, competitions, accomplishments and shared activities.
5. **Cross-system integration:** Connect real property, vehicles, pets, hobbies, family and career state.
6. **Writing and polishing:** Expand events, remove repetition, check consequences and preserve the UI.
7. **Integrated QA:** Balance, performance, backwards compatibility and final review.

Commit and push each coherent implementation stage.

## Final deliverables

- Implemented source on `v2`
- All new and updated tests
- `docs/LIFESTYLE_OVERHAUL.md`
- `docs/LIFESTYLE_WRITING_AUDIT.md`
- Verification report with real gameplay journeys and test evidence
- Any remaining limitations, particularly native-device and human playtesting

## Final success criteria

A player should be able to become a successful landlord, a car enthusiast, a devoted pet owner or a skilled hobbyist, with each lifestyle producing **different decisions, characters, events and lasting consequences**.

These systems should also combine naturally within an ordinary life.

The benchmark is not merely the number of BitLife features implemented. It is whether owning a house, buying a car, caring for a pet or mastering a hobby actually makes a life more interesting.

**Implement the complete plan on `v2`, thoroughly self-review the gameplay, run verification and push the finished work. Do not stop after planning or completing only the catalogue additions.**