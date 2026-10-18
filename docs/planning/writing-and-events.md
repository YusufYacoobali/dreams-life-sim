# Writing, events, and original samples

Part of the [Phase 0 master plan](MASTER_PLAN.md). All samples below are original planning material. They are not implemented events and do not establish that a content library exists.

## Voice and editorial rules

The user confirmed an adult audience with non-graphic mature themes. Write what happened, why it matters, and what the player can do. Use short, ordinary sentences. Humour comes from specific behaviour, bad timing, awkward people, escalating consequences, and occasionally absurd luck. Never explain the joke afterwards.

Event narration addresses **you**. Journal entries use **I**. Characters differ in temperament and motives; the narrator does not describe everybody as supportive, inspiring, or malicious. Serious illness, grief, and death need room to be serious. Money and names come from bound state.

Use the requested rough lengths: titles 2–6 words, setups 15–55 words, choices 2–8 words, results 10–45 words. Depart only when clarity benefits. Normally offer 2–4 meaningfully different choices.

No repeated inspirational lines, corporate prose, generic destiny language, interchangeable jokes, copied BitLife text, or runtime-generated dialogue. Keep stat deltas in separate effect rows. The prose describes the actual incident; it does not say that an attribute was modified.

Examples of the intended contrast:

- Prefer “Your interview lasted four minutes. Three of them were about parking.”
- Prefer “I paid off my student loan.” as the journal entry.
- Reject “You navigated an enriching professional encounter.”
- Reject “Your choices have positively affected your financial journey.”

## Event definition contract

| Field | Purpose |
| --- | --- |
| Stable ID and revision | Identify the authored template across saves and editorial revisions |
| Primary category / secondary tags | Coverage accounting and relevant selection |
| Title / setup / asset ID | Native text and a reusable illustration or relevant portrait |
| Ages / stage / location | Explicit eligibility including country and legal restrictions |
| Preconditions / exclusions | Required job, relationship, ownership, health, legal state, money, memories |
| Context bindings | Specific person, contract, case, asset, account, amounts, pronouns, and historical facts |
| Frequency / rarity / cooldown | Selection control; global and per-person limits where needed |
| Repeat family / maximum occurrences | Prevent a different name or prop from disguising the same event |
| Choices | Stable choice ID, label, input/eligibility, optional cost or terms |
| Outcome rules | Deterministic branches or bounded probability modified by relevant state |
| Effects | Typed financial, stat, relationship, legal, ownership, health, and progression changes |
| Follow-ups | Due period, required entities, expiration, fallback/cancellation behavior |
| Journal variants | Short first-person text tied to actual effects |
| Editorial metadata | Author/review status, content tone, coverage, test fixtures |

Use declarative, typed predicates/effects and bounded calculations, not arbitrary embedded scripts. Named roles bind before display. Rendering a template cannot silently create a spouse, boss, child, or millionaire status.

The UI displays a resolved effect list from the engine. It does not substitute a template's “+$500” if the actual transaction was a smaller amount, refused, or offset by a fee.

## Selection, pacing, and agency

For a normal year, start tuning at **45% no optional event, 40% one, 15% two**. These are proposed playtest values, not verified BitLife probabilities. Mandatory milestones, urgent health/legal events, and due consequences are scheduled separately; a year already carrying important decisions receives fewer optional events.

An introductory first-year event guarantees the first-minute choice. Provide several eligible variants for different family arrangements, including no living parent. Do not solve eligibility by inventing a dad.

Select a rarity tier, then eligible candidates. Initial tier weights: common 70%, uncommon 24%, rare 5%, extraordinary 1%. If a tier has no candidates, use an ordinary eligible fallback or a quiet year; do not promote a rare event to certainty. Weight and cooldown values are versioned content data.

Filter before weighting: age, life state, country, school/job, people, assets, affordability where required, recent topics, event family, cooldown, and due chains. Prevent contradictory events in the same year. Prioritise meaningful callbacks without making every past choice produce a popup.

Persist an event's bound context and any outcome already drawn. Revalidate choice eligibility at resolution. If a bound person dies or the prerequisite disappears, use an authored fallback or cancel with the correct factual journal explanation. Never swap in an unrelated person under the old story.

Probability must reward relevant preparation. For example, a raise request can combine work performance, tenure, manager trust, company conditions, and stress, with tested bounds and a once-per-year request rule. Good performance improves odds without guaranteeing success. UI may explain “Strong performance; company struggling” rather than expose a complex formula.

Consequences have origins and memories. A friend helped at school might later recommend a job **only if** they remained a real contact and acquired a relevant opportunity. A criminal investigation references the actual case. A broken promise can return through the same person. No callback is decorative history with no rule behind it.

## Original sample events

All named people are illustrative bound examples, not hardcoded characters. Monetary examples below assume a US life. Effects are proposed tuning values; final deltas must be calculated and displayed from actual effects.

### 1. Director's Cut

**Context:** Age 1–3; living, co-resident father; family-filming event eligible. Use another authored introduction for other households.

Your dad is filming you for the family chat. He's on take fourteen. You haven't said a word, but he's already thanked the academy.

| Choice | Example result | Effects / memory |
| --- | --- | --- |
| Say “banana” | You said “banana”. Your dad cried. Your grandmother asked why he was filming a banana. | Small Smarts gain; father bond improves; first-word memory |
| Grab the phone | You filmed eleven minutes of carpet. Your family agreed it was your dad's best work. | Happiness gain; family anecdote; no invented social account |
| Fall asleep | You fell asleep halfway through his speech. The director has requested a reshoot. | Small Energy gain; no adult action or financial reward |

**Journal example:** “I said my first word. It was banana.”

### 2. Assembly Entrance

**Context:** Primary school; named school and teacher; player selected for an assembly.

You've been picked to carry the school's new trophy into assembly. It's taller than you. Your teacher has asked for a dramatic entrance.

| Choice | Example result | Effects / memory |
| --- | --- | --- |
| Ask for help | Your friend carried the other end. You both got applause. The headteacher took all the credit. | Friend bond and school respect improve; binds a real friend |
| Carry it carefully | You got it to the stage. The assembly ran twelve minutes late. Nobody complained. | Small Discipline gain; modest school-performance benefit |
| Make an entrance | You slid through the doors. The trophy kept going. The school now has two trophies, technically. | School respect falls; accident memory; no automatic personal debt for a child |

**Journal example:** “I broke the school trophy during assembly.”

### 3. Group Work, Apparently

**Context:** Age 14–17; active school project; existing classmate Mia.

Mia submitted your project under her name. She thanked you in the acknowledgements. There aren't any acknowledgements.

| Choice | Example result | Effects / memory |
| --- | --- | --- |
| Tell the teacher | You showed your teacher the drafts. Mia has suddenly remembered that it was a group project. | Credit corrected if evidence exists; Mia trust decreases; teacher relationship can improve |
| Confront Mia | Mia called it a misunderstanding. You asked her to misunderstand her way into doing the next project. | Response depends on her temperament; records confrontation/support obligation |
| Let it go | Mia got the credit. You got a very useful lesson about Mia. | Lower happiness; betrayal memory; no false academic award |

**Follow-up:** The next project can test whether Mia kept her promise. Eligibility binds the same person and the recorded obligation.

**Journal example:** “Mia took credit for my project. I showed my teacher the drafts.”

### 4. The Leaving Collection

**Context:** Adult employee; actual manager; company state is bound before selecting an outcome.

Your manager is collecting money for your leaving present. You haven't resigned. HR has already signed the card.

| Choice | Example result | Effects / memory |
| --- | --- | --- |
| Ask what's going on | HR checked the name. The card was for somebody else. Your manager had signed “finally”. | Misunderstanding branch; manager trust falls; employment stays active |
| Contribute $5 | You donated to your own leaving present. Your manager said the team would miss your generosity. | Requires $5; actual debit; can reveal a real pending redundancy rather than invent one |
| Start packing | You packed your desk. HR asked why you were taking the printer. | Can cause a workplace argument; no dismissal unless that outcome explicitly ends the contract |

**Outcome variation:** A real redundancy flag can instead reveal a scheduled termination and settlement. A healthy company does not fire the player merely because an unrelated random roll chose that paragraph.

**Journal example:** “My manager thought I was leaving. Apparently, he'd been looking forward to it.”

### 5. Dinner and a Pitch

**Context:** Adults on a real date with Sam; a $180 bill; Sam has an entrepreneurial trait. Choices recheck cash.

Sam ordered the tasting menu, then asked the waiter whether dinner counts as research for a restaurant they haven't opened. The bill is $180.

| Choice | Example result | Effects / memory |
| --- | --- | --- |
| Split the bill | You paid your half. Sam wrote “potential investor” beside your name in their notes. | $90 debit; compatibility-dependent relationship effect |
| Pay for both | Sam thanked you for believing in the business. You thought you were buying dinner. | $180 debit; generosity memory; no accidental equity or guaranteed affection |
| Question the business plan | You asked how rent would be paid. Sam ordered another glass of tap water. | $90 share paid; honest/defensive reaction depends on temperament |

**Follow-up:** A later investment request requires a real proposal with terms, eligibility, and risk. Dating somebody does not silently transfer business ownership.

**Journal example:** “I went on a date with Sam. Dinner came with a business pitch.”

### 6. Special Delivery

**Context:** Immediate consequence of an actual parcel-theft command; case/evidence and physical custody are already linked to that command.

The parcel you stole contains a singing doorbell. It has played the same chorus six times. A neighbour is now filming you.

| Choice | Example result | Effects / memory |
| --- | --- | --- |
| Give it back | You put the parcel back. The doorbell sang one last chorus. The neighbour kept filming. | Custody returned; mitigation recorded; evidence is not erased |
| Keep walking | You left with the parcel. Your performance is now on the neighbourhood group chat. | Evidence/reputation risk rises; no instant cash from an unsold item |
| Claim you're delivering it | You said you were the courier. The neighbour asked why you'd opened it. The doorbell provided backing vocals. | Credibility/evidence-based branch; can escalate the actual case |

**Follow-up:** Investigation timing uses this offence and evidence. Arrest cannot be an unrelated arbitrary punishment, and the same stolen item cannot pay twice.

**Journal example:** “I stole a parcel. A neighbour filmed me carrying it away.”

### 7. Five-Star Auntie

**Context:** Player owns a café; a living aunt and her support history exist; a local review opportunity is eligible.

Your café has received forty-seven five-star reviews from your aunt. She used her full name every time. A food blogger would like a comment.

| Choice | Example result | Effects / memory |
| --- | --- | --- |
| Ask her to stop | Your aunt deleted the reviews. She left one more explaining why she had deleted the other forty-seven. | Family trust may dip; controversy can ease |
| Invite the blogger | The blogger liked the coffee. The headline was “One Woman, Forty-Seven Opinions”. | $75 company marketing cost; bounded demand/reputation result based on actual quality |
| Blame the Wi-Fi | The blogger published your explanation in full. Your aunt says she can leave more reviews if it helps. | Reputation risk; family-support memory remains |

**Journal example:** “My aunt tried to help my café. The internet noticed.”

### 8. Wrong Group Chat

**Context:** Later life; at least two living adult children; player actually owns a car.

Your children added you to a group chat called “Inheritance Plans”. They haven't noticed you're in it. Someone has already claimed your car.

| Choice | Example result | Effects / memory |
| --- | --- | --- |
| Ask about the car | Nobody replied for twenty minutes. Then one of your children asked how your day was going. | Trust/conflict recorded with the relevant children |
| Send a thumbs-up | Three typing bubbles appeared. All three disappeared. | Smaller relationship disruption; awkward-family memory |
| Rename the chat | You renamed it “Still Alive, Thanks”. Your children have started a different group chat. | Happiness/temperament-dependent reaction; actual ownership stays unchanged |

**Journal example:** “My children started planning their inheritance. I reminded them I was still here.”

### 9. His Lead Is There

**Context:** A real pet named Milo has just died; use pronouns from that animal. Offer only actions compatible with current restrictions and living contacts.

Milo died in his sleep last night. His lead is still hanging by the door.

| Choice | Example result | Effects / memory |
| --- | --- | --- |
| Call someone | You called a friend and talked about Milo. They remembered how he used to steal their seat. | Grief persists; an eligible friend's bond can improve |
| Visit his favourite park | You went to the park without him. You stayed for a while. | Records the activity; no instant happiness reset |
| Stay home | You stayed home today. You weren't ready to put his lead away. | Respectful acknowledgement; no moral penalty for this choice |

**Journal example:** “Milo died. I called a friend and talked about him.”

This event has no punchline. Its death fact is written once; the chosen response adds a separate factual entry.

## Content coverage target

Count each situational template once by its primary category, even when it has several tags or branches. Routine action results, milestones, and renamed/reskinned copies do not count toward the 250.

| Primary category | Initial complete-release target |
| --- | ---: |
| Birth and early childhood | 16 |
| School and teenage life | 34 |
| University and early independence | 18 |
| Employment and special careers | 34 |
| Relationships and family | 36 |
| Money, assets, and investments | 22 |
| Health and later life | 22 |
| Crime, court, and prison | 24 |
| Fame and social media | 14 |
| Businesses | 12 |
| Travel, pets, hobbies, entertainment | 14 |
| Rare and cross-life callbacks | 10 |
| **Total distinct templates** | **256** |

Every special-career path requires at least two path-specific situational templates within the employment allocation, plus its routine action/offer outcomes. Reconciliation adds Royalty, Astronaut and Military, increasing the allocation by six templates and the initial total to 256. These minimums do not substitute for coverage of success, failure, exit, and relevant milestones. Add further content when coverage or playtesting demonstrates a gap.

Review coverage by life stage, system, rarity, financial circumstance, household arrangement, relationship status, country, and follow-up depth. Track coverage of ordinary, struggling, and successful lives; a library that only serves married millionaires is incomplete.

The confirmed wider international launch requires an eligibility and narrative-fixture pass for every approved country. Global events may be shared when genuinely appropriate; local school, work, money, health, family, political, and legal references must use the selected pack. A renamed city or currency is not a distinct template and cannot inflate the 250-template minimum. Expand that minimum if country/path coverage cannot otherwise meet the quality gate. Avoid treating national stereotypes as character personalities or jokes.

## Editorial production and checks

1. Plan a scenario with eligibility, choices, effects, and future connections before polishing prose.
2. Write the short setup, distinct choices, and genuinely different results.
3. Review legality of state changes and bind people, money, and objects to real records.
4. Run structural checks: duplicate IDs, missing assets, unresolved tokens, missing outcomes, impossible costs, empty eligible pools, and invalid follow-up references.
5. Flag banned/generic phrases, identical titles, repeated openings, similar wording, and conspicuously reused joke structures. Automated similarity flags require human review; they cannot prove originality or good humour.
6. Preview the event against eligible and ineligible fixtures: child/adult, single/married, poor/rich, employed/unemployed, living/dead target, prison/free.
7. Review narrative, results, effect rows, and journal together for contradictions, incorrect pronouns/relationships, wrong amounts, and invented facts.
8. Play through sequences. Review the same character at several ages so the writing remembers their actual past.
9. Mark approved content explicitly. Draft/unreviewed content is excluded from release bundles.

The coverage report must list authored, validated, editorially approved, and shipped counts separately; uncovered cells and frequent quiet-pool fallbacks remain visible. “250 rows exist” is not the release test.

## Journal and life-summary generation

Generate concise first-person journal lines from committed facts and authored variants. Group them under actual age; keep names and money correct. Routine actions can be summarised without losing significant decisions. Do not narrate a date, promotion, purchase, or birth unless that action occurred.

Death summaries select factual milestones and a few short authored connecting lines. A penniless life does not become “a successful entrepreneur” merely because the player once opened a company. Legacy summaries preserve family continuity; Time Machine rewinds visible history to the selected branch.
