# DREAMS: LIFE SIMULATOR — MASTER DEVELOPMENT SPECIFICATION

## YOUR ROLE

You are an elite mobile game developer, game designer, narrative designer, UI/UX engineer and software architect.

Your task is to build **Dreams: Life Simulator**, a complete, highly polished, choice-driven life simulation game using:

- React Native
- Expo
- TypeScript
- Locally generated artwork and illustrated icons
- A robust, persistent life simulation engine

This must become a real, commercially viable mobile game, not a prototype or a collection of attractive screens.

There are TWO equally important references:

1. **Visual design:** The supplied screenshots. Recreate their UI as faithfully as possible.
2. **Gameplay and writing:** BitLife. Follow its fundamental gameplay approach, pacing, simplicity, humour, decision structure and replayability.

The final experience should feel like a modern, visually polished, original alternative to BitLife.

**CRITICAL: YOU MUST PLAN FIRST. DO NOT START IMPLEMENTING UNTIL I HAVE APPROVED YOUR DESIGN AND GAMEPLAY PLAN.**

---

# PART 1 — UNDERSTAND THE PROJECT BEFORE CODING

## 1.1 Analyse every supplied design

All reference screenshots will be available in the `design-references/` folder or attached to this task.

Examine every image closely.

The references cover:

- Welcome screen and character creation
- Avatar and appearance customisation
- Newborn and childhood
- Main Life screen, Age Up, journal and personal profile
- Activities navigation
- Primary school, high school and university
- Jobs, promotions, coworkers and special careers
- Finances, investments, properties, vehicles and possessions
- Relationships, dating, marriage, divorce and children
- Health, lifestyle, exercise, illness and treatment
- Crime, arrest, trials, prison and release
- Fame, social media, businesses and hobbies
- Travel, holidays and pets
- Achievements, challenges, special features and settings
- Event popups, choices, confirmations and results
- Death and continuing as a child

Some reference images depict different versions of the same screen. Others show screens that overlap in functionality.

Some important screens and transitions may be missing.

**DO NOT blindly implement every screenshot as a separate screen.**

Instead:

1. Catalogue every unique screen.
2. Identify duplicate and overlapping screens.
3. Select the best design for each screen.
4. Combine compatible ideas from alternative versions where beneficial.
5. Identify missing screens and necessary gameplay flows.
6. Design missing screens consistently with the supplied references.
7. Create a coherent navigation structure.
8. Present the resulting plan for my approval.

For trivial differences, make sensible decisions yourself.

For major visual or gameplay decisions, ask me before implementing.

Do not invent an entirely different UI direction.

## 1.2 Design reference priority

Use the most recent, detailed designs for feature-specific screens.

For the core game layout, prioritise the references showing:

- The Life dashboard with the journal and green Age Up button
- Four bottom navigation tabs
- White activity-list screens
- Rounded white event popups with circular illustrated icons
- Dark navy typography and blue action buttons
- Consistent character portraits and colourful illustrated icons

For the final death screen, use `death screen.png` as the authoritative design.

Death must be full-screen, not a popup.

For event layouts, use the later consolidated modal references rather than implementing multiple inconsistent variants.

Where visual references conflict, record the proposed resolution in the planning document.

## 1.3 Planning deliverables

Before writing application code, produce:

**A. Screen inventory**

A complete list of unique screens, their purpose, their reference images and their expected navigation flow.

**B. Overlap resolution**

Identify duplicate designs and explain which version you recommend and why.

**C. Missing-screen audit**

List missing screens, transitions and gameplay flows. Propose how each should look using the established design system.

**D. Final navigation map**

Show how the entire app is organised, including tabs, feature screens, detail screens and modals.

**E. Game mechanics blueprint**

Describe each gameplay system, its progression, its interactions with other systems and how it affects the player's life.

**F. Writing and event blueprint**

Define the game's narrative voice, event structure, content categories and quality standards. Include representative example events.

**G. Artwork generation plan**

Identify every required artwork family, which assets can be reused, and which assets need generation.

**H. Implementation roadmap**

Divide the work into clear, realistic, testable phases.

After presenting these documents, **STOP AND WAIT FOR MY APPROVAL**.

Once approved, begin implementation without repeatedly asking permission for ordinary technical decisions.

---

# PART 2 — THE MOST IMPORTANT RULE: BITLIFE-STYLE GAMEPLAY

## 2.1 Gameplay philosophy

This is a text-driven, choice-based life simulator.

It should be extremely similar to BitLife in how the player interacts with the game.

The core loop is:

**Be Born → Age Up → Experience Events → Make Choices → Develop Your Life → Face Consequences → Die → Start Again or Continue Your Legacy.**

The experience must be:

- Immediately understandable
- Quick to play
- Easy to navigate
- Highly replayable
- Frequently funny and surprising
- Driven by player decisions
- Capable of producing wildly different lives

The player should be able to live a reasonably ordinary life, become extremely successful, turn to crime, become famous, lose everything, or experience a ridiculous chain of unexpected events.

Do not turn this into an RPG, strategy game, management dashboard or complicated menu simulator.

**The complexity belongs in the simulation engine, not in the interface.**

## 2.2 Age Up is the heart of the game

The main gameplay loop must revolve around the Age Up button, exactly as in the references.

When the player taps Age Up:

1. Increase their age by one year.
2. Advance the world by one year.
3. Update NPCs and relationships.
4. Progress school or career.
5. Process finances and investments.
6. Update health and ongoing conditions.
7. Resolve delayed consequences from earlier decisions.
8. Generate interesting, context-sensitive random events.
9. Record significant developments in the journal.
10. Save the updated game state.

Events can appear during the age-up sequence, requiring decisions before the year finishes.

The number of events should be paced intelligently.

Do not bombard players with five boring popups every year.

Some years should be quiet. Others should be chaotic.

The event system must support rare, memorable moments as well as ordinary life developments.

## 2.3 The player should have real freedom

The player must be able to actively make decisions between age-ups.

Examples:

- Study harder
- Insult a classmate
- Ask someone out
- Break up with a partner
- Apply for a job
- Ask for a raise
- Buy a house
- Invest in stocks
- Start a business
- Commit a crime
- Go to the doctor
- Emigrate
- Adopt a pet
- Build a social media following

These actions should lead to immediate outcomes when appropriate.

They should also affect the future.

For example:

Studying regularly improves academic performance, which affects university admission, which affects career opportunities and potentially lifetime earnings.

A criminal record can affect employment, relationships, immigration and reputation.

Becoming wealthy can unlock opportunities while also introducing new risks.

**Every major game system must influence other systems.**

## 2.4 Simplicity is essential

Avoid unnecessary menu depth.

The preferred structure is:

**Main Tab → Feature Screen → Action or Detail → Decision → Result.**

Do not introduce complicated nested submenus, multi-step configuration wizards or excessive screens for simple actions.

If the player wants to ask for a raise, they should be able to do so with a few taps.

If the player wants to compliment someone, it should be quick.

Do not make players perform repetitive administrative actions just to progress through the game.

BitLife is engaging because the game is extremely simple on the surface while supporting many possible lives.

Follow that philosophy.

## 2.5 Life progression and age restrictions

The game must have distinct life stages:

**Birth and infancy (0–4)**

Family relationships, health, early childhood and occasional parent-driven events.

**Childhood (5–12)**

Primary school, classmates, friendships, family decisions, childhood activities and age-appropriate events.

**Teenage years (13–17)**

High school, exams, friendships, first relationships, part-time jobs, teenage conflict and greater independence.

**Young adulthood (18–29)**

University, full-time employment, relationships, moving out, finances, marriage and early career development.

**Adulthood (30–59)**

Career progression, raising children, major purchases, business opportunities, family complications, wealth and health.

**Later life (60+)**

Retirement, grandchildren, health challenges, inheritance, life achievements and death.

These are gameplay guidelines rather than rigid restrictions.

The engine should account for unusual circumstances and edge cases.

---

# PART 3 — WRITING STYLE: EXTREMELY IMPORTANT

**This is one of the highest-priority requirements in the entire project.**

Do not write like an AI assistant.

Do not write like a corporate training simulation.

Do not use vague, sentimental, pretentious or overly descriptive dialogue.

The writing must be inspired by BitLife's direct, humorous, sometimes outrageous approach.

It should sound like an actual human game writer created it.

## 3.1 The narrative voice

Use:

- Short sentences
- Everyday language
- Direct descriptions
- Natural humour
- Unexpected twists
- Sarcasm when appropriate
- Absurd situations
- Embarrassing encounters
- Dark humour when suitable
- Occasional outrageous decisions
- Clear and immediate consequences

The tone should be playful, cheeky and sometimes chaotic.

Not every event should be a joke.

Ordinary situations should sound natural. Serious events should be treated appropriately.

But the game should regularly surprise the player.

Avoid repetitive inspirational language.

## 3.2 Examples of GOOD writing

These examples establish the intended voice. Create original events of comparable quality, rather than endlessly reusing these scenarios.

### Example A — Workplace

**Your Boss Is an Idiot**

Your boss just took credit for your work and got a $10,000 bonus.

What will you do?

- Call him out
- Demand a raise
- Steal his lunch
- Keep your mouth shut

Possible result:

**You're Fired!**

You called your boss a fraud in front of the entire office.

He fired you on the spot.

Your coworkers gave you a standing ovation.

### Example B — Dating

**An Awkward Date**

You're on a date with Olivia.

Halfway through dinner, she tells you that her ex still lives with her.

Apparently, he sleeps on the sofa.

What will you do?

- Ask more questions
- Pretend you didn't hear that
- Leave immediately
- Invite him on your next date

### Example C — Crime

**Easy Money?**

You spot a drunk millionaire leaving a nightclub.

He drops his wallet. There's $4,200 inside.

Nobody seems to have noticed.

What will you do?

- Keep the money
- Return the wallet
- Take the cash and ditch the wallet
- Ignore it

### Example D — Result

**Well, That Backfired**

You tried to impress your crush by doing a backflip.

You landed on your face.

She called an ambulance.

Your dignity didn't survive.

Health: -8%

Happiness: -12%

### Example E — Family

**Family Drama**

Your mother has announced she's getting married again.

This will be her fourth wedding.

She's asked you to pay for the cake.

What will you do?

- Pay for it
- Refuse
- Ask if there's a loyalty discount
- Skip the wedding

These examples demonstrate the desired humour, brevity and straightforward choices.

## 3.3 Examples of BAD writing

Never write things like:

"During a meaningful encounter with your workplace supervisor, you find yourself presented with an opportunity to navigate a challenging interpersonal situation."

Instead:

"Your boss blamed you for his mistake. He's threatening to fire you."

Never write:

"You embark upon an enriching educational journey that promises to enhance your intellectual capabilities."

Instead:

"You started university."

Never write:

"Your decision has positively influenced your interpersonal relationship dynamics."

Instead:

"Olivia loved the gift. Your relationship improved."

Never write:

"Your entrepreneurial endeavours have yielded favourable financial outcomes."

Instead:

"Your business made $12,000 this month."

Avoid phrases such as:

- Embark on a journey
- Navigate life's challenges
- Meaningful connections
- Cherished memories
- Exciting new chapter, repeated everywhere
- Unlock your full potential
- Your choices shape your destiny
- A remarkable opportunity has presented itself
- A sense of fulfilment
- In the vibrant world of
- Delve into
- Foster relationships

These phrases are generic, artificial and boring.

## 3.4 Event writing rules

Every event should answer:

1. What happened?
2. Why does it matter?
3. What can the player do?

Get to the point immediately.

For most event popups:

- Titles: approximately 2–6 words.
- Descriptions: approximately 15–55 words.
- Choices: approximately 2–8 words.
- Results: approximately 10–45 words.

These are guidelines, not rigid limits.

Do not add unnecessary paragraphs.

Avoid repeating the same information in the title, body and button labels.

A typical event should have 2–4 choices.

Choose actions that are distinctive rather than offering four versions of the same decision.

## 3.5 Consequences must be written naturally

Bad:

"Your recent action has resulted in a decrease in the relationship attribute."

Good:

"Olivia didn't appreciate your joke. She's refusing to speak to you."

Bad:

"Your decision to engage in physical exercise has yielded positive health outcomes."

Good:

"You went for a run. Your legs are killing you, but you're getting fitter."

The numerical stat changes should be displayed separately in the existing UI.

The narrative should focus on what actually happened.

## 3.6 Different contexts need different writing

**Childhood:** Simple, playful and age-appropriate.

**Teenage years:** Awkward school moments, friendships, rebellion and first relationships.

**Adulthood:** Careers, money, crime, romantic disasters, parenthood and surprising opportunities.

**Old age:** Family, retirement, health, inheritance and reflection, with occasional humour.

**Crime:** Risky, tense, sometimes absurd.

**Relationships:** Personal, funny, awkward, romantic or dramatic depending on the context.

**Death:** Respectful when appropriate, with a concise summary reflecting the actual life lived.

Avoid making every character speak in the same voice.

## 3.7 Journal writing

The Life dashboard journal should use short, first-person diary-style entries, similar to BitLife.

For example:

**Age 18**

I graduated from high school.

I got a job as a barista at Brew & Bean.

I asked Olivia out, and she said yes!

**Age 19**

I started university.

I failed my driving test.

My girlfriend broke up with me after I forgot her birthday.

**Age 20**

I got promoted at work.

I bought my first car.

I accidentally reversed it into my neighbour's fence.

Do not write lengthy prose in the journal.

Keep it concise, varied and readable.

Journal entries must reflect actual events and decisions.

Do not invent diary entries disconnected from game state.

## 3.8 No repetitive AI-generated content

Do not produce 300 events that all sound the same.

Build a writing system with:

- Diverse scenarios
- Distinct setups
- Varied outcomes
- Different personalities
- Situational humour
- Rare surprises
- Multi-step events
- Consequences that return years later

Prioritise quality over raw event count.

Create a content review process that detects and rewrites overly generic, unnatural or repetitive event text.

The game must not feel as though each event was independently generated by an AI that doesn't remember the player's past.

**All shipped event text should be authored and reviewable, not dependent on live AI generation at runtime.**

---

# PART 4 — EVENT SYSTEM AND STORYTELLING

## 4.1 Build a proper event engine

Every event should support structured data:

- Unique ID
- Category
- Title
- Narrative
- Event icon
- Eligible ages
- Eligibility conditions
- Appearance probability or weighting
- Cooldown
- Available decisions
- Outcome definitions
- Potential follow-up events
- Stat and financial consequences
- Relationship/NPC consequences
- Journal text

Events must be context-aware.

If the player is single, do not generate an event about their spouse.

If the player is unemployed, do not reference their boss.

If the player has no children, do not invent a child for a school event.

If the player has $200, don't casually describe them as a millionaire.

## 4.2 Make events interconnected

Example:

Age 16: You get caught cheating on an exam.

Possible consequences:

- Reduced school performance
- Parents become angry
- Teacher relationship deteriorates
- University prospects suffer

Age 18: A university rejects your application because of your academic record.

Age 21: You pursue a different career.

The engine should support chains like this without scripting every possible life manually.

## 4.3 Delayed consequences

Choices should sometimes matter years later.

Examples:

- An old friend offers you a job.
- An abandoned child confronts you as an adult.
- A previous crime is investigated.
- A business partner betrays you.
- An investment pays off.
- A former classmate becomes famous.
- An unhealthy habit causes long-term health problems.

Store persistent flags and relationships in game state.

## 4.4 Different event frequencies

Use weighted event pools:

- Common everyday events
- Uncommon interesting events
- Rare dramatic events
- Extremely rare outrageous events

Not every year should be absurd.

Ordinary life should make the ridiculous moments more memorable.

Add appropriate cooldowns and prevent obvious repetition.

## 4.5 Meaningful outcome variation

Choices should have different results based on:

- Character stats
- Relationships
- Wealth
- Skills
- Personality
- Education
- Career
- Previous decisions
- Random chance

Do not make every action succeed.

Do not make every failure identical.

A high-smarts character should generally have better odds in academic situations.

A respected employee with strong performance should be more likely to get promoted.

A reckless criminal should face greater risks.

Probabilities should be internally consistent and testable.

---

# PART 5 — MAIN GAME SYSTEMS

Implement every major feature represented in the designs.

The following systems must be functional and interconnected.

## 5.1 Character creation and identity

Support:

- Custom and random lives
- Name
- Gender
- Nationality
- Country and city
- Avatar customisation
- Family generation
- Starting stats
- Birthday and age
- Basic personality traits

Characters must have persistent identities.

Newborn gameplay should connect naturally to the childhood dashboard and subsequent life stages.

## 5.2 Core character stats

Implement a consistent statistics model covering:

- Happiness
- Health
- Smarts
- Looks
- Respect
- Energy
- Fitness
- Stress
- Discipline
- Fame
- Relationships
- Financial state

Use context-specific displays so the UI isn't overloaded.

Most percentage-based attributes should use a consistent 0–100 range.

Actions and events must update stats realistically.

Stats should affect gameplay, not exist purely for decoration.

## 5.3 Education

Implement:

- Primary school
- High school
- College/university
- School performance
- Studying
- Classmates
- Teachers
- Extracurricular activities
- Exams
- Applications
- Tuition
- Scholarships/loans
- Graduation
- Dropping out
- Degree progression

University admission must consider actual eligibility.

Education must affect job opportunities.

The UI must follow the supplied education, university and application designs.

## 5.4 Jobs and careers

Implement:

- Job listings
- Part-time employment
- Full-time employment
- Job interviews
- Qualifications
- Salaries and hourly wages
- Workplace performance
- Coworkers
- Promotions
- Asking for raises
- Workplace conflicts
- Firing and unemployment
- Resigning
- Retirement

Jobs must provide real recurring income.

Work performance should affect promotion and dismissal chances.

The player shouldn't be able to become a doctor without the required education, unless a specifically authored exceptional scenario supports it.

Use believable salary progression and career ladders.

### Special careers

Support the illustrated special-career paths:

- Actor
- Musician
- Athlete
- Politician
- Model
- YouTuber
- Streamer
- Business owner

These should have distinctive progression mechanics, events and success conditions.

However, keep their interfaces simple.

Do not create unnecessarily deep management simulators.

## 5.5 Relationships

Implement persistent NPCs with:

- Name
- Age
- Appearance
- Gender
- Relationship type
- Personality
- Relationship strength
- Relevant attributes
- Employment and life circumstances
- Family connections

Support:

- Parents
- Siblings
- Friends
- Best friends
- Romantic interests
- Partners
- Spouses
- Children
- Coworkers
- Classmates

Allow conversations, compliments, gifts, arguments, dates, marriage proposals, breakups and other activities.

NPCs must remember relevant events.

Relationships must develop, deteriorate and sometimes end.

NPCs must age, form relationships, move, become ill and die when appropriate.

### Romance and family

Implement dating, proposals, weddings, pregnancy, childbirth, parenting, divorce, settlements and custody.

Relationship actions must have appropriate eligibility rules and consequences.

Children must become persistent characters who can eventually be played through the legacy system.

## 5.6 Assets and finances

Implement:

- Cash/bank balance
- Income
- Expenses
- Taxes
- Loans
- Investments
- Property ownership
- Vehicles
- Possessions
- Insurance and upkeep where relevant
- Net worth

Money must be calculated, not fabricated.

Hourly jobs must use consistent hours and pay periods.

Annual salary must be processed correctly.

Major purchases must deduct actual funds.

Assets may appreciate or depreciate.

Investment gains and losses must affect portfolio value and net worth without double-counting.

Use the selected country and currency consistently.

The game's default examples can use USD when the character lives in the United States.

### Investments

Support stocks, crypto, funds and relevant investment categories from the references.

Include buying, selling, portfolio tracking and changing valuations.

Keep the gameplay engaging and understandable rather than building a professional trading simulator.

## 5.7 Properties, vehicles and possessions

Players should be able to:

- Browse listings
- View details
- Purchase items
- Sell owned items
- Manage ownership
- Experience appreciation/depreciation
- Encounter related events

Use the generated artwork and the visual layouts shown in the references.

## 5.8 Health and lifestyle

Implement:

- Overall health
- Illnesses
- Injuries
- Doctor visits
- Diagnosis and treatment
- Exercise
- Diet
- Sleep
- Mental wellbeing
- Meditation
- Self-improvement

Conditions must persist properly.

Treatment may succeed, fail or have side effects depending on circumstances.

Lifestyle decisions should influence health over time.

## 5.9 Crime and legal system

Implement:

- Petty crime
- Major crime
- Cybercrime
- Organised crime
- Bribery and corruption
- Arrest
- Criminal records
- Lawyers
- Court proceedings
- Sentencing
- Prison
- Prison activities
- Release
- Long-term consequences

Crime must be genuinely risky.

The legal system should respect previous actions and evidence rather than choosing arbitrary outcomes.

Prison should alter available gameplay and restrict freedom appropriately.

Maintain opportunities for funny and dramatic events.

## 5.10 Social media and fame

Implement:

- Social profiles
- Posts
- Follower growth
- Viral outcomes
- Collaborations
- Sponsorships
- Income
- Fame levels
- Public reputation
- Controversies
- Special opportunities

Popularity should affect other systems, including careers, relationships and finances.

Posts must have varied results.

Not every post should go viral.

## 5.11 Businesses

Implement:

- Starting a business
- Selecting business types
- Revenue and expenses
- Pricing
- Staff
- Marketing
- Expansion
- Business performance
- Selling a business
- Business failure

Keep business gameplay relatively light and easy to understand.

A simple business screen with a handful of meaningful actions is preferable to a complex management interface.

## 5.12 Travel, pets and hobbies

Implement:

- Holidays
- Destination browsing
- International travel
- Emigration
- Study/work abroad
- Pets
- Pet health and happiness
- Hobbies
- Entertainment
- Fitness activities

Travel must deduct costs and support appropriate events.

Pets should persist, age and have their own relevant stats.

## 5.13 Extras

Implement the features illustrated in the designs:

- Achievements
- Challenges
- Heirlooms
- Journal
- Statistics
- Time Machine
- Settings
- Other approved special features

Achievements require actual completion conditions.

Challenges should track genuine progress.

The Time Machine should restore a selected historical state using saved snapshots, with clear confirmation and consistent consequences.

Do not add monetisation or paywalls unless requested.

---

# PART 6 — UI DESIGN AND NAVIGATION

## 6.1 Visual fidelity is mandatory

The supplied screenshots are the visual specification.

Do not treat them as loose inspiration.

Match:

- Colours
- Typography
- Spacing
- Icon sizes
- Header layouts
- Navigation structure
- List density
- Cards
- Stat bars
- Modal dimensions
- Button hierarchy
- Rounded corners
- Background colours

The interface should look recognisably like the references.

Do not substitute a generic component-library appearance.

## 6.2 Four main tabs

Use:

1. **Life**
2. **Assets**
3. **Relationships**
4. **Activities**

### Life

Main character dashboard, stats, chronological journal, Age Up button and character overview.

### Assets

Finances, investments, properties, vehicles, possessions and related wealth-management features.

### Relationships

Family, friends, dating, partners, children, conversations and relationship actions.

### Activities

Education, employment, health, mind and body, crime, travel, pets, fame, social media, businesses and extras.

Where a feature appears in more than one reference section, choose one canonical implementation.

For example, a business can be reached from Assets or Activities where sensible, but it should not have two unrelated implementations.

## 6.3 Shared UI components

Implement reusable components for:

- Headers and back navigation
- Bottom tabs
- Activity rows
- Character portraits
- Profile cards
- Stat bars
- Segmented filters
- Financial summaries
- Property/vehicle cards
- Action lists
- Primary/secondary buttons
- Event modals
- Outcome screens
- Achievement indicators
- Journal entries

Keep the design system consistent.

Use real React Native components for text, buttons, lists and interactions.

Never render an entire reference screenshot as a static background to imitate the UI.

## 6.4 Screen completeness

Every important design must become a functional screen or event flow.

Every primary button must have real behaviour.

No fake screens, placeholder menus, hardcoded balances or decorative actions presented as working features.

If a feature requires an additional screen not provided in the references, design it in the same visual language.

Avoid duplicate features and unnecessary navigation depth.

---

# PART 7 — EVENT MODAL DESIGN

The reusable event system must closely reproduce the supplied modal designs.

## 7.1 Common appearance

- Darkened game background
- Blur where appropriate and supported
- Centred rounded white popup
- Circular illustrated icon overlapping the top of the popup
- Navy heading
- Short narrative
- Large blue choice buttons
- Grey cancellation buttons where appropriate
- Compact result summaries
- Green positive effects
- Red negative effects

Different event types can share components while having different layouts.

## 7.2 Supported modal types

Implement reusable templates for:

- Multi-choice decisions
- Simple yes/no decisions
- Confirmations
- Selection lists
- Positive results
- Negative results
- Financial transactions
- Relationship events
- Romantic events
- Crime decisions
- Arrest and legal outcomes
- Health events
- Career offers and promotions
- Education milestones
- Age-up milestones
- Major life events

Modals should appear above the current game screen without destroying its navigation state.

A choice must actually resolve through the game engine.

The result screen must display the resulting state changes accurately.

## 7.3 Event flow

Example:

Player selects **Ask for a Raise**.

The engine considers their work performance, tenure, salary and manager relationship.

A decision or outcome modal appears.

Possible results:

- Raise approved
- Small raise offered
- Request rejected
- Manager becomes annoyed
- Rare unexpected outcome

After continuing, the career screen must immediately display the correct new state.

This same approach applies to purchases, dates, crimes, education and other systems.

---

# PART 8 — ARTWORK GENERATION

## 8.1 Use image-generation tools

Use the available image-generation tools to create all original custom game illustrations and illustrated icons.

Do not use emojis as the final artwork.

Do not mix unrelated icon styles.

Do not manually approximate illustrated icons with random Unicode symbols.

If artwork tools are unavailable, report that limitation clearly during planning. Do not falsely claim artwork was generated. Do not mark the art phase complete until the required assets exist.

## 8.2 Match the reference art style

The style should be:

- Colourful
- Clean
- Rounded
- Friendly
- Consistent
- Lightly dimensional/cartoon-like
- Suitable for mobile UI
- Readable at small sizes

Generate assets with transparent backgrounds when applicable.

Do not include labels or UI text inside generated artwork.

All text belongs in React Native components.

## 8.3 Artwork categories

Generate:

**Character avatars**

Reusable portraits across genders, ages, hairstyles and appearances, with consistent character identity throughout the game.

**NPC portraits**

Family, partners, classmates, coworkers, teachers, doctors, police, business contacts and other characters.

**Activity icons**

School, university, briefcase, money, house, car, relationship heart, health, fitness, crime, travel, pets, fame and more.

**Event icons**

Birthday, graduation, promotion, marriage, baby, success, failure, illness, arrest, money, warning, death and similar events.

**Item artwork**

Properties, vehicles, pets, possessions, jewellery, collectibles and investments.

**Location artwork**

Travel destinations and other screens requiring thumbnail imagery.

**Special artwork**

Welcome/onboarding illustration, rare dramatic events and the approved death-screen illustration.

## 8.4 Reuse assets intelligently

Most of the UI should be native components plus reusable illustrated assets.

Do not generate a separate picture for every text event.

For example, a relationship event can reuse the relevant character avatar or heart icon.

Generate enough artwork to create visual variety without bloating the app.

Create a central asset registry with stable, typed references.

Optimise images for mobile storage and performance.

For straightforward system controls such as chevrons or back arrows, native/vector UI icons are acceptable. Custom game illustrations must follow the generated art style.

## 8.5 Asset production process

1. Define the required asset list.
2. Define a consistent visual style.
3. Generate and review representative samples.
4. Produce batches.
5. Remove backgrounds where necessary.
6. Optimise and export images.
7. Integrate into the game.
8. Verify appearance at actual UI sizes.

Do not silently replace missing custom images with low-quality placeholders.

---

# PART 9 — UNDERLYING GAME ARCHITECTURE

## 9.1 Technology

Use:

- Expo
- React Native
- TypeScript with strict typing
- Expo Router or the existing navigation system
- Zustand or an appropriate lightweight state solution
- SQLite or AsyncStorage for persistence
- An offline-first architecture

Do not introduce unnecessary backend services.

The gameplay should work without an internet connection.

## 9.2 Separation of concerns

Separate:

- UI rendering
- Game state
- Age progression
- Event generation
- Event resolution
- Content definitions
- Financial calculations
- NPC simulation
- Persistence
- Asset management

The UI must not contain duplicated business logic.

## 9.3 Game state

Create a central, typed game state containing:

- Player identity and stats
- Current age and life stage
- Education
- Employment
- NPCs and relationships
- Family
- Finances
- Assets
- Health conditions
- Criminal record
- Fame
- Businesses
- Achievements
- Journal history
- Pending events
- World flags and delayed consequences
- Historical snapshots

Use IDs to link entities.

Avoid storing inconsistent copies of the same data in multiple places.

## 9.4 Deterministic game engine

Create a seedable random-number generator.

Use pure functions where practical for:

- Age-up processing
- Event eligibility
- Decision resolution
- Financial updates
- Relationship updates
- Health changes
- Death and inheritance

This makes testing and debugging easier.

An event should not change unrelated stats without a defined reason.

## 9.5 Persistence

Save automatically after meaningful actions.

Implement:

- Persistent saves
- Game restoration
- Save validation
- Schema versioning/migrations
- Historical snapshots
- New game
- Death and legacy transitions

The application must not lose a player's life when restarted.

## 9.6 Consistency and invariants

Prevent contradictions such as:

- Being both unemployed and receiving a current job salary
- Spending money the player doesn't have without an explicit loan/debt mechanic
- Selling an asset they don't own
- Dating someone who died
- Becoming a parent before an appropriate in-game event
- Being both in prison and freely travelling abroad
- Having a negative age
- Graduating without meeting course requirements
- Showing false balances or fabricated investment gains

Business logic must enforce eligibility and state consistency.

---

# PART 10 — GAME BALANCE AND REPLAYABILITY

## 10.1 Progression

The game should allow multiple viable life paths.

Possible playstyles include:

- Academic success
- Corporate career
- Entrepreneurship
- Celebrity
- Social media influencer
- Professional athlete
- Criminal
- Wealthy investor
- Family-focused life
- World traveller
- Chaotic, unpredictable life

Not every path should be equally easy.

Not every life should be successful.

## 10.2 Risk and reward

High-risk actions should offer meaningful rewards or dramatic consequences.

Examples:

- Crime may bring large money gains but risk imprisonment.
- Investing may build wealth but also lose money.
- Starting a business may create great success or bankruptcy.
- Asking for a promotion might increase income or annoy the manager.
- Fame may create opportunities but also controversies.

Randomness must be balanced against player agency.

## 10.3 Replayability

Every new life should feel different.

Vary:

- Family circumstances
- Starting wealth
- Personal attributes
- Friends and romantic opportunities
- Career paths
- Random events
- Long-term consequences
- Rare scenarios

Do not use the same rigid story sequence every playthrough.

## 10.4 Ongoing content quality

Build the event library as structured, extensible content.

Target at least **250 distinct, high-quality event templates** for the initial complete release, distributed across life stages and gameplay systems.

This is a quality-controlled target, not permission to generate filler.

Support conditional variations and branching outcomes that meaningfully expand the number of possible experiences.

Create a coverage report identifying areas with insufficient content.

---

# PART 11 — DEATH AND LEGACY

The death screen must follow `death screen.png`.

It is a full-screen experience with a dark background, tombstone illustration and lifetime summary.

Show:

- Character name
- Age at death
- Cause of death
- Short, personalised life summary
- Final net worth
- Children
- Career achievements
- Properties
- Major accomplishments
- Final statistics

Buttons:

- View Life Summary
- Start a New Life
- Continue as Child

The life summary must be based on actual gameplay history.

Do not display generic paragraphs unrelated to the player's choices.

Continuing as a child must transfer control to a real existing child NPC.

Apply appropriate inheritance and maintain family relationships and the world state.

Handle edge cases, including characters without eligible children.

This must work as a genuine legacy system, not merely rename a new character.

---

# PART 12 — IMPLEMENTATION ROADMAP

**IMPORTANT: The following phases only begin after the Phase 0 plan is approved.**

## Phase 0 — Planning and design reconciliation

- Inspect the repository.
- Review every supplied reference image.
- Create the complete screen inventory.
- Resolve overlaps.
- Identify missing designs.
- Plan navigation.
- Plan event flows.
- Plan game mechanics.
- Establish the writing style guide.
- Create the artwork manifest.
- Define architecture and milestones.
- Present everything for approval.

**Stop here until I approve.**

## Phase 1 — Technical and visual foundation

Implement:

- Expo project architecture
- Theme and design system
- Shared UI components
- Four-tab navigation
- Core screen layout
- Main Life dashboard
- Activities navigation
- Reusable modal system
- Reusable character and stat components

Match the supplied visual references closely.

## Phase 2 — Artwork and character creation

Implement:

- Image-generated asset library
- Avatar customisation
- Character creation
- Random life generation
- Newborn flow
- Initial family generation
- Character profiles

Validate artwork consistency and UI fidelity.

## Phase 3 — Core playable life

Implement:

- Central game state
- Age Up
- Life stages
- Journal
- Random events
- Decision resolution
- Consequences
- Save/load
- Basic NPC simulation
- Death
- Starting another life

By the end of this phase, a basic complete life must be playable.

## Phase 4 — Core life systems

Implement the full designed flows for:

- Education
- Jobs and careers
- Relationships and romance
- Marriage and children
- Finances
- Properties
- Vehicles
- Investments

Every system must integrate with Age Up and the event engine.

## Phase 5 — Expanded gameplay

Implement:

- Health and lifestyle
- Crime and legal system
- Prison
- Travel
- Pets
- Social media
- Fame
- Businesses
- Special careers
- Hobbies
- Entertainment

Do not build disconnected feature demos.

## Phase 6 — Content, progression and depth

- Expand the event library.
- Add branching narratives.
- Add delayed consequences.
- Improve NPC simulation.
- Add achievements and challenges.
- Add legacy mechanics.
- Add Time Machine.
- Balance progression and probabilities.
- Improve writing quality and variety.

## Phase 7 — Visual polish and gameplay testing

- Compare every major implemented screen against its reference.
- Fix spacing and visual differences.
- Fix awkward navigation.
- Fix inconsistent icon sizes.
- Improve feedback and transitions.
- Test real gameplay.
- Tune event frequency.
- Review narrative quality.
- Resolve bugs.
- Optimise iOS and Android performance.

Do not consider the game complete until the functionality and visual fidelity have been verified.

---

# PART 13 — TESTING REQUIREMENTS

## 13.1 Automated testing

Test:

- Age Up
- Stats
- Event eligibility
- Decision consequences
- Relationships
- NPC aging
- Education
- Career progression
- Financial calculations
- Investments
- Purchases
- Crime outcomes
- Prison
- Health
- Death
- Inheritance
- Persistence
- Historical snapshots

Use deterministic game seeds when testing randomised outcomes.

## 13.2 Full-life simulation tests

Run at least these complete gameplay scenarios:

**Scenario A — Successful professional**

Birth → School → University → Career → Promotion → Marriage → Children → Home Ownership → Investments → Retirement → Death.

**Scenario B — Criminal life**

Birth → School → Dropout → Crime → Arrest → Court → Prison → Release → Criminal Record Consequences → Death.

**Scenario C — Famous entrepreneur**

Birth → School → Social Media → Fame → Business → Brand Deals → Investments → Family → Death.

**Scenario D — Unpredictable life**

Use varying decisions and random events to verify that the simulation supports unusual situations without breaking.

## 13.3 Writing quality testing

Review event content for:

- Artificial language
- Unnecessary verbosity
- Generic descriptions
- Repeated jokes
- Repeated scenarios
- Awkward choice labels
- Contradictory event text
- Wrong character names
- Incorrect genders or relationships
- Incorrect amounts of money
- Illogical outcomes
- Excessive exposition

Rewrite failing events.

A technically valid event with poor writing is not complete.

## 13.4 UI acceptance testing

Verify:

- Correct screen layout
- Readable text
- Good touch targets
- Working back navigation
- Correct bottom navigation
- Proper scrolling
- Functional popups
- Correct status/safe-area spacing
- Good iPhone and Android layouts
- No overlapping or clipped elements

Use actual screenshots from the running application to check fidelity where tooling permits.

Do not claim that a screen was visually verified if it was not.

---

# PART 14 — ABSOLUTE RULES

1. **Plan first and obtain approval before coding.**
2. **Follow the supplied UI designs faithfully.**
3. **Use BitLife as the primary gameplay and writing-style reference.**
4. **Keep gameplay extremely simple to interact with.**
5. **Write short, direct, natural and frequently entertaining text.**
6. **Do not use generic, verbose AI-generated prose.**
7. **Use original events, dialogue, characters and artwork. Do not copy BitLife's proprietary content.**
8. **Generate all custom illustrated artwork using image-generation tools.**
9. **Do not create duplicate screens from overlapping reference images.**
10. **Identify and sensibly design missing screens.**
11. **Build genuine mechanics, not superficial buttons and menus.**
12. **Ensure systems affect each other.**
13. **Make choices have meaningful consequences.**
14. **Preserve player state across age-ups and app restarts.**
15. **Prevent repetitive events and impossible game states.**
16. **Use reusable components and maintainable TypeScript architecture.**
17. **Keep the application working throughout development.**
18. **Do not replace functionality with permanent placeholders.**
19. **Do not add unnecessary navigation depth or complexity.**
20. **Test actual gameplay, not merely TypeScript compilation.**

Avoid spending all your effort polishing screens while neglecting the simulation engine.

Avoid spending all your effort creating complex architecture while neglecting the user experience.

Both must be excellent.

---

# PART 15 — FINAL QUALITY STANDARD

Imagine a player has just downloaded Dreams: Life Simulator.

Within the first minute, they should:

- Understand the game.
- Create or randomise a character.
- Begin their life.
- Tap Age Up.
- Experience an interesting event.
- Make a meaningful decision.
- See the consequence.
- Want to keep playing.

After 30 minutes, they should have experienced enough variety, humour, drama and progression to feel invested in the character.

After completing one life, they should want to start another because they know it can turn out completely differently.

The UI should feel polished, but the gameplay should remain fast and effortless.

**The objective is not to create a visually attractive checklist of BitLife features. It is to create an actual, deeply replayable life simulator with simple mechanics, excellent writing, meaningful consequences and the exact visual style of the supplied designs.**

---

# YOUR FIRST TASK — DO THIS NOW

Do not start coding.

First:

1. Inspect the project and all available reference images.
2. Study the fundamental gameplay patterns and writing conventions of BitLife, using accessible reference material where possible. Do not pretend to have verified anything you cannot access.
3. Identify every unique screen, overlap and missing flow.
4. Create a definitive UI and navigation plan.
5. Design the underlying gameplay architecture.
6. Explain how the writing and event system will achieve the required style.
7. Provide several original sample events demonstrating the exact intended humour and narrative quality.
8. Plan the artwork generation and implementation phases.
9. Clearly mark decisions you've made and any significant questions for me.

Present a well-organised master implementation plan.

**WAIT FOR MY APPROVAL BEFORE GENERATING ARTWORK OR WRITING APPLICATION CODE.**