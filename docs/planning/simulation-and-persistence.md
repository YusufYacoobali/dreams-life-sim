# Simulation, architecture, and persistence

Part of the [Phase 0 master plan](MASTER_PLAN.md). Everything here is proposed design, not implemented functionality or measured balance.

## Core contracts

1. **One world, real identities.** Player, relatives, classmates, coworkers, partners, and future heirs are people linked by IDs. A person can have multiple roles without duplicated records.
2. **One authoritative command path.** Every action, decision, year advance, restore, and legacy transition validates eligibility, resolves once, checks invariants, persists, then exposes its result.
3. **Consequences belong to the engine.** UI components display selectors and dispatch intent. They do not calculate salaries, invent journal entries, choose outcomes, or mutate unrelated stats.
4. **A complete life works offline.** No account, remote AI, backend, or network time is part of gameplay.
5. **Saved progress includes unfinished business.** A paused year, open decision, unacknowledged result, future consequence, and RNG state survive restarting the app.

## Architecture proposal

| Layer | Responsibility | Must not do |
| --- | --- | --- |
| Expo Router screens | Route by IDs; render eligible actions and current projections | Own business rules or duplicate feature state |
| Shared native UI/theme | Headers, rows, portraits, stats, cards, modals, feedback, accessibility | Render screenshots as UI or invent balances |
| Zustand application store | Expose committed world, transient loading, selectors, command status | Be a second persistence model |
| Command coordinator | Serialize actions, reject stale/double submissions, orchestrate commits | Resolve outcomes differently from the engine |
| Pure TypeScript engine | Eligibility, seeded outcomes, annual stages, effects, invariants | Import React Native, SQLite, network, or system clock |
| Authored content/data | Events, careers, country rules, items, illnesses, progression tables | Execute arbitrary scripts or depend on runtime generation |
| Persistence adapter | SQLite transactions, codecs, schema validation, migrations, recovery | Silently discard an invalid save |
| Asset registry | Stable typed IDs to bundled illustrations and portrait layers | Store huge image data inside saves |

Proposed additions after approval: Expo Router with its SDK-compatible prerequisites, Zustand, expo-sqlite, a runtime validation library such as Zod, and a focused TypeScript test runner such as Vitest for the platform-independent engine. Select versions against Expo SDK 57 at implementation time; do not assume today's unverified latest packages are compatible.

Keep the current strict TypeScript configuration. Suggested boundaries: app/ for routes; src/ui/, src/features/, src/game/engine/, src/game/systems/, src/game/content/, src/game/selectors/, src/persistence/, src/assets/, and tests/engine/. Route filenames remain thin. No service framework, ECS, remote database, or plugin architecture is required.

## Authoritative world model

| Record | Required contents |
| --- | --- |
| Save envelope | Schema, engine, and content versions; world/timeline IDs; revision; integrity metadata |
| World | Annual observation date, origin year, economic conditions, country-rule versions, active player ID |
| People by ID | Identity, date of birth, living/deceased state, nationality, residence, appearance traits, personality, stats, skills, education, employment, health |
| Relationships | Person endpoints, role(s), strength, trust/conflict, relevant memories, guardianship/family links |
| Household | Members, housing, parental resources, dependants; separate from the child's personal cash |
| Finance | Currency-tagged accounts, liabilities, ownership, transactions, annual settlement IDs |
| Assets | Unique property, vehicle, possession, investment, and business positions with owners and valuations |
| Legal | Offences, evidence, cases, counsel, convictions, active restrictions, sentences, release dates |
| Public life | Social accounts, followers, reputation, fame, sponsorships, special-career contracts |
| Animals | Pet identity, species, owner, birth year, bond, health, living/deceased state |
| History | Structured significant facts and first-person journal projections, linked to actual command/event IDs |
| Consequences | Due year/date, origin action, typed payload, referenced entities, revalidation and cancellation rules |
| Event runtime | Bound context, active decision, queued events, selected outcome, acknowledged/unacknowledged results |
| Annual frame | Year ID, stage cursor, processed stages, effective contracts, pending decisions, accumulated summaries |
| Randomness | Master seed and separate persistent streams/counters for events, NPCs, economy, and outcomes |
| Progression | Challenge progress, achievements, per-year action counters, event cooldowns, recent topic/family history |

Store appearance and biological/reproductive traits separately from gender identity and relationship roles. Neither a portrait nor a display name determines a person's eligibility. Nationality and current residence are separate fields.

Age is derived from birth date and the annual observation date, never independently editable in two places. One Age Up advances that date by one calendar year. Use a defined leap-day convention. The world's annual anchor remains unchanged when switching to a child, avoiding an accidental extra economic year.

Core percentages use 0–100 bounds. Happiness, Health, Smarts, and Looks are the proposed dashboard quartet. Fitness, Energy, Stress, Discipline, Respect, skills, Fame, and per-person relationships appear contextually. Money, school grades, job performance, and portfolio value retain their own units.

Respect is context-specific: a teacher, employer, family, or public audience can evaluate the player differently. Fame measures reach; reputation measures public approval. High fame does not imply good relationships or a positive reputation.

## Commands and determinism

A command carries a unique ID, expected world revision, actor ID, action type, and validated input. The coordinator:

1. Confirms the life is playable and no incompatible decision/year operation is pending.
2. Rechecks age, location, qualifications, custody, ownership, money, restrictions, and any quoted terms.
3. Calls a pure resolver with current state, immutable content version, and the relevant RNG stream.
4. Produces the next state plus an explicit effect list, journal facts, scheduled consequences, and presentation data.
5. Validates invariants, then commits the checkpoint and command receipt together in SQLite.
6. Publishes the committed revision to selectors and shows the result.

Reusing a command ID returns its existing receipt; it cannot spend, pay, or award twice. A stale quote is rejected or refreshed before confirmation. An outcome is stored before presentation; reopening a result does not consume another random draw.

Use a specified, versioned PRNG algorithm with fixed test vectors and independent streams. UI renders, screen visits, animations, and sound never draw gameplay randomness. Store resolved outcomes as well as seeds: a seed alone cannot replay an old life after content tables or engine algorithms change.

## Age Up pipeline and interruption

The annual operation is resumable. A guard disables Age Up while it is already advancing or a required choice is unresolved.

| Stage | Work | Possible decision pause |
| --- | --- | --- |
| 1. Open year | Create annual frame, take historical snapshot, advance observation date/ages, reset annual allowances | Stage-transition information |
| 2. World and NPCs | Economic climate, ageing, relationships, moves, births, health/deaths, pet ageing | Relevant family development |
| 3. Education and work | Attendance, performance, course progression, exams, contracts, promotion/termination, retirement | Graduation, offer, important conflict |
| 4. Annual finance | Earn eligible income, settle taxes/expenses/debt, value assets and investments, settle businesses | Required debt or business decision |
| 5. Health and restrictions | Conditions, lifestyle, stress, injury recovery, sentence progression, mortality | Treatment, emergency, release |
| 6. Due consequences | Resolve eligible delayed chains in stable priority order | Prior decision returns |
| 7. Situational events | Select a paced, eligible, varied set of optional events | Usually zero to two decisions |
| 8. Close year | Recompute derived values, achievements/challenges, write factual summary, commit completed frame | Return to Life |

At a decision boundary, persist both the cursor and its bound event. The selected option commits once, then processing resumes at that cursor. Already-completed stages never run again after a restart.

Cross-system urgent events have explicit priority. A fatal outcome finalises death, makes remaining incompatible choices unreachable, settles outstanding obligations once, and replaces navigation with the death screen. Do not finish unrelated queued promotions after the player has died.

Annual economy is intentionally a game abstraction: work and policy changes between age-ups take effect for the upcoming interval. Changes arising after a stage has settled take effect next interval unless an authored transaction explicitly states otherwise. Each income source has an effective period; no retroactive salary or duplicated annual settlement. If a terminal event interrupts an unsettled interval, its elapsed-period rule determines settlement once; persist that rule/result in the frame.

### Between-year freedom without chores

Manual actions are quick: study, talk, date, apply, invest, exercise, travel, commit a crime. Routines such as study effort, work effort, diet, and sleep remain in force until changed. Players need not repeat them yearly to remain functional.

Energy and diminishing returns constrain spamming, not basic navigation or mandatory decisions. An annual raise request, repeated studying, and repeated posting have documented limits or declining returns. Low energy never prevents Age Up, viewing a save, or resolving a required event. There are no real-time regeneration timers.

## Life stages

| Stage | Opportunities and restrictions | Important links |
| --- | --- | --- |
| 0–4 | Caregiver-led events, family bonds, early health/development | Household conditions influence childhood; no adult actions |
| 5–12 | Primary school, friendships, teachers, play, child hobbies | Study/discipline/social history affect secondary education |
| 13–17 | High school, exams, age-appropriate relationships, limited work | Qualifications, family conflict, skills, and records affect adulthood |
| 18–29 | University, careers, housing, adult finances, marriage/parenthood | Earlier choices change admissions and access to work |
| 30–59 | Career ladders, business, family care, assets, long-term health | Tradeoffs between work/stress, relationships, wealth, and wellbeing |
| 60+ | Retirement, family, health, inheritance, later-life opportunities | Pension eligibility is country data; retirement is not forced at 60 |

These are content bands. Legal ages, school dates, work restrictions, and immigration rules belong to country packs and can vary. Do not gate every adult action on one generic age check.

## System mechanics and integration

### Identity, family, and NPC life

Generate a seeded family, household, starting finances, traits, and local contacts. Random lives vary circumstances without guaranteeing a dramatic backstory. Customisation selects supported identity/location/appearance; it does not quietly grant exceptional stats.

Maintain active, relevant NPCs in more detail; keep distant people lightweight and simulate their elapsed years deterministically when needed. Preserve named people and all family/history references, including deceased relatives. NPCs can change jobs, date, move, become ill, have children, and die through bounded rules. Do not create a spouse or child solely to satisfy a random event.

Memories such as support, betrayal, prior rejection, shared school, and unresolved debt influence future actions. Relationships can drift, recover, or end. NPC autonomy remains legible through occasional journal entries and relevant decisions.

### Education

Country rules determine school entry, transitions, leaving age, exams, fees, and qualifications. Performance depends on Smarts, Discipline, effort, attendance, stress, and support. Studying helps but cannot create a degree instantly.

Admissions check prerequisites and actual records. Applications can be accepted, rejected, waitlisted, or withdrawn. Tuition and living expenses have real funding sources: savings, eligible scholarships, explicit loans, or supported household contributions. Loans become liabilities. Graduation requires completed years and performance; dropout preserves the incomplete record and debt.

Classmates and teachers are persistent people. Bullying, cheating, clubs, friendships, and illness affect school, wellbeing, relationships, and later admissions/careers.

### Employment and standard careers

Job listings specify qualifications, legal age, hours, wage basis, and relevant record/skill requirements. Interviews consider actual suitability, employment history, interview choice, and bounded chance.

Hourly annual gross = wage × contracted weekly hours × paid weeks, adjusted for recorded unpaid periods. Salaried gross comes from the effective contract and eligible period. Work performance, tenure, skill, manager relationship, stress, and company conditions affect raises, promotion, and dismissal.

Part-time work can coexist with study only within a defined workload. Full-time employment is restricted by school/prison rules. Resigning or being fired ends the contract; job history remains. Retirement ends employment income and starts only earned/eligible pension income. Long-term reputation and a criminal record can alter future listings.

### Special careers

| Path | Distinct progression | Main costs, risks, and connections |
| --- | --- | --- |
| Actor | Auditions → credits → larger roles → awards | Training, rejection, reputation, contracts, publicity |
| Musician | Instrument/vocal skill → performances → releases → audience | Practice, production cost, royalties, collaborators, touring stress |
| Athlete | Training → trials → team contracts → competition → retirement | Fitness, age windows, injuries, discipline, school/team links |
| Politician | Eligibility → campaign → election → terms/public decisions | Campaign money, public support, record, controversies, country rules |
| Model | Portfolio → agency → bookings → high-profile contracts | Appearance/skills, rejection, stress, reputation, industry relationships |
| YouTuber | Topic/production → videos → audience → eligible revenue | Skills, equipment costs, burnout, sponsors, variable reach |
| Streamer | Content/schedule → broadcasts → community → partnerships | Energy, audience retention, conduct, sponsorships, wellbeing |
| Business owner | Capital/type → operating firm → growth/sale/failure | Uses the same business entities and financial rules as the business feature |

None is a guaranteed fame button. Each needs meaningful failure, plateau, success, and career-exit paths. Shared screens remain simple, with path-specific action sets and progress indicators.

### Relationships, romance, and children

Talk, compliment, gift, argue, apologise, spend time, date, propose, marry, separate, and parent are engine actions. Personality, memories, compatibility, current strength, age, and consent determine availability and outcomes.

Dating never selects close family or an unavailable/deceased person. Partnership state and relationship strength are distinct: a positive bar is not marriage. Weddings spend an approved budget. Divorce settles actual joint rights, debt, support, and custody according to documented game rules; it cannot duplicate property.

Pregnancy, childbirth, and adoption create or link a real child with parents/guardians and a birth date. Existing children grow and eventually live their own lives. Pregnancy persists across applicable boundaries; impossible duplicate pregnancies or births are prevented. Childcare costs, family time, work pressure, illness, and custody affect multiple systems.

### Money, borrowing, investments, and ownership

Use integer minor currency units, represented with bigint in the engine and explicit decimal-string codecs in saves. Apply documented rounding to rates and taxes. Currency belongs to each amount; a dollar sign is never added to a GBP balance by a presentation shortcut.

Maintain an auditable transaction ledger. Summaries derive from accounts and ownership:

**Net worth = personal cash/accounts + investment market values + owned physical-asset market values + business equity − personal liabilities**, with a single valuation convention and FX snapshot where needed.

- Salary, tax, tuition, upkeep, travel, gifts, treatment, legal fees, support, and pensions produce explicit ledger entries.
- A purchase removes cash once and creates ownership once. Selling requires ownership and removes it once.
- Borrowing creates cash and an equal liability; repayment separates principal from interest.
- Mortgage principal reduces debt; it is not also treated as lost net worth.
- Count property at its owned share of gross market value and subtract the associated personal mortgage once. Business equity is already net of company liabilities; do not subtract company debt again from the player's personal net worth.
- Investment purchases move cash into positions. Price changes alter holdings value; unrealised gains are not also credited to cash.
- Stocks, crypto, and funds have distinct volatility/diversification; market conditions are seeded, not promised returns.
- Prices, quantities, fees, lot size, and sale proceeds are checked before execution. No negative holdings or unlimited borrowing.
- Property may appreciate and require maintenance/insurance; vehicles typically depreciate and deteriorate; possessions have rarity/condition/provenance.
- Mandatory unaffordable costs create explicit arrears, a permitted debt process, or a required hardship decision. Never silently clamp money to zero.
- Company money is separate from personal money. Draws/dividends transfer value; business equity and company cash are not counted twice.

The user confirmed a wider country selection for the initial complete release. The proposed twelve-country roster is below; the exact list remains subject to plan review. Every included pack defines cities, schooling, legal ages, job/salary tables, simplified taxes, pensions, healthcare costs, family/estate rules, and immigration conditions.

| Proposed launch country | Currency | Particular rule/data differences to investigate |
| --- | --- | --- |
| United States | USD | School/degree routes, healthcare costs, state-dependent legal/family/tax rules |
| Canada | CAD | Provincial education, healthcare, employment, and legal/family differences |
| United Kingdom | GBP | Constituent-nation education/legal differences, qualifications, healthcare, pensions |
| Australia | AUD | State/territory rules, qualifications, healthcare, retirement savings |
| France | EUR | Education pathways, employment, healthcare, tax and estate model |
| Germany | EUR | Academic/vocational pathways, regional schooling, employment, insurance |
| Spain | EUR | Education, employment, regional differences, healthcare and family rules |
| Italy | EUR | Education, employment, healthcare, retirement and inheritance |
| Brazil | BRL | School/work progression, local economy, healthcare, tax and legal model |
| India | INR | Education/qualification pathways, state differences, employment, family and estate model |
| Japan | JPY | Education/career progression, healthcare, pensions, zero-minor-unit currency |
| South Africa | ZAR | Education, employment, healthcare, local economy, legal and family model |

These are research requirements, not verified legal facts or implemented packs. Country models are intentionally simplified game rules. Record a source, verification date, and any regional baseline/approximation for each consequential rule; country labels must not imply that every state, province, or constituent jurisdiction has been exhaustively simulated.

Shared code may use configurable rule profiles; it must not apply US school ages, dollar salary tables, healthcare charges, or legal outcomes to every country. Shared EUR currency does not imply identical country rules. Money formatting must respect JPY's zero minor units as well as the other proposed currencies' two.

Country selection remains separate from language localisation: the initial proposed interface and authored content are English, with names and local terms supported correctly. A wider country roster does not silently promise twelve translated interfaces.

Cross-country moves need stored FX rates, eligibility, relocation cost, and consistent conversion/valuation. Preserve qualification history, people, assets, debt, pending cases, and citizenship/residence separately; a move must not erase restrictions or regenerate the family. Test source and destination rules, including moves between countries that share EUR.

All approved launch countries must meet the same functional gate before the initial complete release. Implementing two representative packs first is an internal validation strategy, not a reduction of the confirmed wider-launch direction.

### Health and lifestyle

Conditions have onset, severity, symptoms, treatment history, recovery/progression, and mortality effects. Health percentage is a summary, not the sole disease model. Doctor visits may diagnose, miss a condition, or recommend treatment based on authored rules and plausible odds.

Exercise, diet, sleep, stress, fitness, and wellbeing accumulate effects over time. Treatment can work, fail, or cause a defined side effect. Avoid instant cures through repeated tapping. Healthcare cost/access is country data; ignored illness can affect study, work, finances, relationships, and later mortality. Serious illness and death are written with appropriate restraint.

### Crime, justice, and prison

Crime choices remain high-level game actions. Eligibility, skill, circumstance, evidence, witnesses, and prior conduct determine gain, detection, investigation, and arrest. A crime creates persistent facts; an unresolved investigation can return later.

Counsel, defence choices, evidence, and history influence trial results. Store the evidence and relevant rolls so court outcomes are not a fresh arbitrary coin flip. Conviction changes the record and sentence. Bribery/corruption can worsen a case.

Prison changes the action set and prevents incompatible employment, free travel, and normal dating. Education, constrained exercise, visits, conflicts, applications, sentence progression, and release remain available where rules allow. Release restores eligible actions; conviction-related consequences remain.

### Social media and fame

Posts use theme, skill, audience, history, personality, platform conditions, and chance. Most are ordinary; viral outcomes are uncommon. Frequency and repetition can cause fatigue. Followers, fame, reputation, and revenue are distinct values.

Sponsorships, collaborations, controversies, and special-career opportunities use actual thresholds and contracts. Paid opportunities credit real income and can create obligations. Public conduct can affect work, relationships, businesses, and legal exposure.

### Businesses

Creation requires type, name, startup budget, and funding. A single dashboard offers pricing, staffing, marketing, expansion, owner draw, and sale/closure. Annual revenue and expenses depend on product/service demand, capacity, staffing, quality, marketing, price, economic climate, and decisions.

Underperformance can consume capital and lead to debt, sale, or closure. Growth has costs and limits. The player sees clear annual profit/cash/equity distinctions. Staff and business partners can become persistent contacts. Fame may improve demand and scandals may damage it.

### Travel, pets, hobbies, and entertainment

Holiday choices have real prices, health/relationship effects, and contextual events. Emigration requires eligibility, cost, housing/work/education consequences, and currency handling. Study/work abroad connects to real enrolment or contracts, not a fake location flag.

Pets are persistent animals with age, bond, care costs, health, and death. Adoption creates ownership once; rehoming updates it. Hobbies build specific skills and contacts; those can support careers and wellbeing. Entertainment offers meaningful short-term enjoyment and expense without becoming compulsory.

### Achievements, challenges, heirlooms, and statistics

Achievements evaluate recorded facts. Challenges have explicit goals and track actual progress. Heirlooms are possessions with provenance and ownership across generations. Lifetime statistics derive from history and the ledger, not manufactured totals.

The specification does not define extra unlisted special features; add those only when references establish them or the user approves them. No monetisation, ads, real-money currency, or paywalls are planned.

## Persistence, migration, and recovery

Use SQLite in WAL mode with a serialized writer. A compact canonical checkpoint contains the normalised world. Separate indexed tables hold world/timeline metadata, command receipts, journal/history, year snapshots, and completed-life archives. IDs and revisions link them; database foreign keys protect relational metadata, and runtime validation checks references inside the world document.

An action transaction updates the checkpoint and its receipt/effects/history together. Only a successful commit updates the visible state. A write failure keeps the prior committed world available and offers retry; it cannot present a successful purchase that vanishes after restart.

On load: read version → decode → migrate a copy transactionally → validate shape, IDs, money, state-machine cursor, and invariants → select playable/pending/death route. Keep a last-known-good checkpoint/recovery copy. An unknown newer schema is an explicit recovery state, not a reason to erase the save.

Test migrations with real saved fixtures for each shipped version. Engine/content versions are recorded separately from storage schema versions. Existing bound decisions keep their resolved context and compatible content; a content update cannot silently change their selected outcome.

Export/import is local and validated. Import previews the life and confirms replacement/archive behavior. Malformed, oversized, incompatible, or inconsistent data is refused with an actionable explanation.

## Historical snapshots and Time Machine

Capture a restorable checkpoint before each Age Up, plus the necessary year/revision metadata. Each snapshot includes all world state, NPCs, currencies/ownership, event runtime, delayed consequences, and RNG state. Content/assets are referenced by stable IDs rather than embedded repeatedly.

Restoring a year previews age, year, and affected progress, then creates a new timeline branch from the selected checkpoint. The abandoned future is not merged into the restored present. Awards, money, children, sentences, and relationships from that future do not leak back. Timeline-specific achievements/challenges are recomputed; any global collection markers are idempotent and grant no duplicate financial reward.

No paywall is attached to restore. Store the content/engine compatibility needed to interpret old snapshots. Measure storage on a 120-year life before choosing compression or delta snapshots; do not delete advertised historical years silently to meet a size target.

## Death and legacy

Death records cause, date, final state, lifetime facts, and estate settlement identity. The summary selects actual career milestones, relationships/children, major assets, wealth, and notable acts. It never invents a successful career, home, or child.

Eligible heirs are existing, living children. Preview the selected child's current age, circumstances, and inherited share. Settle debt and the estate once under the relevant country rule pack, transfer eligible ownership, preserve siblings and other heirs, then switch activePlayerId to that same child ID.

The child's existing education, relationships, appearance, health, and legal state remain. A minor retains guardianship and restricted/trust-held inheritance rather than unrestricted spending. A child already imprisoned remains imprisoned. Deceased children are unavailable. With no eligible child, show the reason and offer New Life and Life Summary.

Inheritance never copies the parent's whole cash balance to several children or ignores outstanding mortgages. Estate and legacy transitions are idempotent commands with recovery tests.

## Invariants and required tests

| Invariant | Test that must fail when broken |
| --- | --- |
| Age/date never regress outside an explicit restore | Boundaries, leap day, legacy change, restored snapshot |
| Stats stay within their defined ranges | Extreme effects, multiple modifiers, illness and recovery |
| Names/roles in events refer to actual matching people | Single, orphaned, childless, widowed, deceased/moved target fixtures |
| Money and ownership conserve value across transfers | Purchase/sale/fees, mortgage, debt, FX, portfolios, business draws |
| No salary without a valid eligible employment period | Fired/resigned/retired/prisoner cases and resumed years |
| Education and careers require their prerequisites | Invalid enrolment, unpaid tuition, degree-dependent job attempts |
| Restricted players cannot bypass action gating | Direct engine commands while infant, imprisoned, deceased, or pending decision |
| A choice or year cannot resolve twice | Double-tap, repeated command ID, kill/reload at every cursor |
| NPCs/pets age and die without dangling references | Long seeded worlds with family changes and delayed events |
| Save/restore retains exact effects and RNG | Round-trip, interrupted commit, migration, snapshot and legacy fixtures |
| Death is terminal until New Life/legacy/restore | Fatal events with remaining queued offers and finances |
| Achievements describe actual history | Restore/fork, imported save, repeated awards, challenge completion |

Use deterministic unit, integration, state-transition, and generated multi-year tests. Keep golden seed cases for regressions, plus broad seed sweeps that check invariants rather than force every life to be successful. Full-life scenarios and device acceptance are defined in [Artwork and delivery](artwork-and-delivery.md).
