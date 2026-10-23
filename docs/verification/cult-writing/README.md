# Cult Leader editorial review

This records the original editorial pass at 94c5020. See the later [voice refinement](../cult-writing-refinement/README.md) for varied claim openings, sharper routine scenes and personality-specific named reactions. The original examples and verification below retain their source boundaries.

All 56 situations and 168 choice payoffs were reviewed. The rewrite covers the eight philosophies, 28 doctrines, 28 rules, 18 claims, five recruitment methods, eight sermon themes, six ceremonies, inner-circle reactions, rival/recovery results and cult-screen microcopy.

The benchmark was the current original writing in ordinaryAdultStories, workingLifeStories, adultRelationshipStories, specialCareerDepthStories and dramaticEvents, with the voice rules in docs/planning/writing-and-events.md. The common thread is a concrete problem, a direct choice and a consequence worth reading.

## What changed

The opening situation and the result are treated as one scene. Sermons leave numerical loyalty and satisfaction changes in the existing effect rows, keeping the payoff itself about the room. Betrayals show who walks out. A failed sermon shows the interruption. A failed claim gets its own admission and remedy, instead of another explanation that the promise is on record. All 168 story choices now have their own result title.

First-person journal entries remain brief and factual; good existing journal lines were retained. Event titles are quoted when inserted into a journal, avoiding sentences such as “I left your … for the group to handle”.

Grief and financial distress are left plain where a joke would trivialise the loss. New payment prose describes only the existing payment. Requests for refunds do not imply a refund was paid. Impossible claims still cannot succeed; their four unreachable success strings remain empty.

## Preservation and integration

This editorial change adds no gameplay, probabilities, costs, event IDs, choice IDs, eligibility, random draws, navigation, layout or artwork. The content-only result-title fields do not change saved schemas. World 48 / engine 50 / content 27 / reader 28 remain current.

Old pending decisions keep their bound labels, result bodies and journals. Resolution now passes those saved bindings through to cult memories, scandal text and remedy transaction labels, rather than fetching new catalogue wording. Existing journal entries, reports, NPC memories, names, thread descriptions and archives are never rewritten on load. New announcements, outcomes and follow-ups use the revised catalogue.

The original comparison producer is 512d3ac. The independent popup/collapse-notification and committed-audio work at 5e25344 was merged during this task. Full-career comparisons use that upstream gameplay baseline so its additional collapse notification is not attributed to the prose rewrite. The cult-screen syntax trees are identical after neutralising text; numeric values, structure, identifiers and colours match.

## Representative before/after examples

### 1. cultPhilosophies / quiet-orbit

**Before:** The cosmos is talking. It is apparently using a very quiet voice.

**After:** The universe speaks when everyone shuts up. Getting them to shut up is your first challenge.

### 2. cultPhilosophies / chosen-lost

**Before:** A tiny group knows the truth. Nobody agrees who invited the others.

**After:** Only a handful of people know the truth. Conveniently, you get to choose them.

### 3. cultDoctrines / sleeping-genius

**Before:** Everyone holds a hidden talent, possibly still asleep.

**After:** Everyone has a hidden genius. Give it somewhere to wake up.

### 4. cultDoctrines / shared-fortune

**Before:** Prosperity should reach the people who made it possible.

**After:** If everyone built the fortune, everyone should benefit from it. The treasurer may ask you to go first.

### 5. cultRules / monthly-attendance

**Before:** Every member is expected at the monthly meeting.

**After:** Everyone must attend the monthly meeting. Expect excuses, then arguments about the excuses.

### 6. cultRules / open-books

**Before:** Members can inspect the organisation’s spending.

**After:** Let members inspect the spending. Be ready to explain your name beside a payout.

### 7. cultHeadquarters / compound

**Before:** A growing community with very visible maintenance bills.

**After:** A rural compound big enough to unsettle the neighbours. Plenty of space; plenty to maintain.

### 8. cultRecruitment / open-evening

**Before:** A welcome talk with actual refreshments.

**After:** Open the doors, serve refreshments and answer the awkward questions.

### 9. cultCeremonies / starlight

**Before:** Watch the sky. Warm clothing remains scientifically useful.

**After:** Watch the sky for signs. Bring warm clothes and check for landing lights.

### 10. recruit:street:strong

**Before:** People stop to ask questions rather than pretending to take a phone call. Your invitation travels further than the leaflets. 6 new followers joined; $240.00 in joining fees reached the treasury.

**After:** You get people to stop and listen. One wants to know about dental care. You steer the conversation back to your beliefs. 6 new followers joined; $240.00 in joining fees reached the treasury.

Both lines come from the same declared context and command. Counts, actual money and effects match.

### 11. recruit:social:empty

**Before:** The comments grow faster than the guest list. Nobody who clicks the invitation actually joins. 0 new followers joined; $0.00 in joining fees reached the treasury.

**After:** Your clip gets comments, arguments and an unsolicited haircut suggestion. It gets no recruits. 0 new followers joined; $0.00 in joining fees reached the treasury.

Both lines come from the same declared context and command. Counts, actual money and effects match.

### 12. recruit:open-evening:modest

**Before:** Some visitors return the membership forms. Others thank you for the refreshments and leave without inventing an excuse. 4 new followers joined; $160.00 in joining fees reached the treasury.

**After:** You get a signed form. Other visitors thank you for the refreshments with the firm politeness of people refusing a second date. 4 new followers joined; $160.00 in joining fees reached the treasury.

Both lines come from the same declared context and command. Counts, actual money and effects match.

### 13. recruit:referral:strong

**Before:** Members invite people who actually trust them. The gathering feels like friends introducing friends. 5 new followers joined; $200.00 in joining fees reached the treasury.

**After:** Your followers’ friends join. You deliver the welcome while the people who invited them look relieved that you are behaving yourself. 5 new followers joined; $200.00 in joining fees reached the treasury.

Both lines come from the same declared context and command. Counts, actual money and effects match.

### 14. recruit:publicity:empty

**Before:** The stunt attracts cameras and spectators. The spectators leave with their photographs rather than membership forms. 0 new followers joined; $0.00 in joining fees reached the treasury.

**After:** You attract cameras, spectators and no recruits. People enjoy watching you without wanting to become your responsibility. 0 new followers joined; $0.00 in joining fees reached the treasury.

Both lines come from the same declared context and command. Counts, actual money and effects match.

### 15. preach:dream-archive:engaged

**Before:** Members compare their dream accounts and find a detail worth discussing. Nobody needs to borrow your conclusion. Loyalty is now 72%; satisfaction is 68%.

**After:** You describe a life hidden in a dream. Followers start comparing their own, talking over you to explain which alternate self had the worst marriage.

Both lines come from the same declared context and command. Counts, actual money and effects match.

### 16. preach:final-update:pushback

**Before:** A member asks why reality needs an update when the microphone still does not work. The room sides with the microphone. Loyalty is now 66%; satisfaction is 64%.

**After:** You explain how reality will improve. Someone asks why your microphone still sounds like that. The room wants that answered first.

Both lines come from the same declared context and command. Counts, actual money and effects match.

### 17. preach:eternal-self:pushback

**Before:** The talk becomes a catalogue of your own achievements. The room has heard this particular journey inward before. Loyalty is now 66%; satisfaction is 64%.

**After:** You describe your own journey towards perfection. A follower asks how far you still have to go.

Both lines come from the same declared context and command. Counts, actual money and effects match.

### 18. ceremony:dream-circle:failure

**Before:** Several people are talked over while you explain their own dreams to them. The circle ends with more notes than agreement. The event cost $80.00; voluntary contributions were $0.00.

**After:** You keep explaining what followers’ dreams meant. They start explaining why you are wrong. The circle breaks up before you can settle it. The event cost $80.00; voluntary contributions were $0.00.

Both lines come from the same declared context and command. Counts, actual money and effects match.

### 19. ceremony:quiet-table:outstanding

**Before:** The quiet gathering gives tired members room to breathe. Nobody feels obliged to turn the silence into a performance. The event cost $60.00; voluntary contributions were $8.00.

**After:** You let the silence hold. Shoulders drop around the table. Someone starts to thank you, then thinks better of it. The event cost $60.00; voluntary contributions were $8.00.

Both lines come from the same declared context and command. Counts, actual money and effects match.

### 20. ceremony:community-supper:failure

**Before:** The supper runs short and late. An apology is offered much more efficiently than a second helping. The event cost $180.00; voluntary contributions were $0.00.

**After:** You run late and short of food. Guests ask for a second helping and receive your increasingly careful apology. The event cost $180.00; voluntary contributions were $0.00.

Both lines come from the same declared context and command. Counts, actual money and effects match.

### 21. ceremony:grand-promise:outstanding

**Before:** The advertised gathering actually comes together. Responsibilities are shared, guests find seats and the promises meet an audience. The event cost $480.00; voluntary contributions were $8.00.

**After:** You deliver the big gathering you advertised. Guests find seats, the programme holds together and followers cheer without waiting for your cue. The event cost $480.00; voluntary contributions were $8.00.

Both lines come from the same declared context and command. Counts, actual money and effects match.

### 22. phone-in-the-bell / broadcast

**Before:** You let {member} run the broadcasts. Whether that was wise will take a while to discover.

**After:** You give {member} the broadcasts. They immediately move you into better light and start directing the revelation.

### 23. attendance-letter / enforce

**Before:** Some members choose their wages. You cannot blame them for needing groceries.

**After:** You demand commitment. Members point at the rota, then at the door. Several choose the job with wages.

### 24. help-fund / listen

**Before:** The answer is smaller than hoped, but it is honest.

**After:** You talk through the fund’s limits with {member}. They leave without a payment, but you let them finish explaining what they need.

### 25. garden-names / quiet

**Before:** They stay for a while. Nobody interrupts.

**After:** You leave {member} alone to remember the person they lost. Your speech stays in your pocket.

### 26. second-microphone / expel

**Before:** {member} is expelled and followers leave with them. The challenger is still the same person, with the same contacts and a fresh reason to remember this.

**After:** You expel {member}. Followers get up and leave with them. You keep talking into the microphone until the door closes.

### 27. payout-on-projector / punish

**Before:** {member} leaves with their records and some followers. Throwing out the treasurer does not delete your payout history.

**After:** You expel {member}. They leave with the records and followers who have just read them. Your payouts are still on the wall.

### 28. red-tagged-exit / make-safe

**Before:** The chair moves. The safety contractor is actually paid. Members can leave by a route that does not require enlightenment.

**After:** You drag your chair away and pay for the safety work. {member} has to find a new place for you to look important.

### 29. treasurer-last-warning / expel

**Before:** The treasurer is expelled. Their history, memories and possible future grievances remain, and followers leave with them.

**After:** You take the keys and expel {member}. Followers walk out with them. The accounts are now your problem.

### 30. list-of-doubters / back

**Before:** Devoted members applaud. Others leave the organisation, and the accusations create a public scandal.

**After:** You back the list. Devotees applaud while the accused stand facing you. The story of your blacklist spreads outside the room.

### 31. parents-at-the-gates / guard

**Before:** {member} takes the public humiliation while the recording keeps running. You have given both the families and your follower a lasting grievance.

**After:** You make {member} explain the locked gate to {relative}. The camera stays on them while you stay behind it.

### 32. blackout-countdown / explain

**Before:** The safe exit and electrical work are paid for. You tell members it was a fault, which is less thrilling and much more useful.

**After:** You stop the countdown, pay for safe exits and electrical work, and explain the fault. Someone asks if the electrician outranks you now.

### 33. activity-sermon-crown / cut

**Before:** You keep the microphone. {member} keeps the memory.

**After:** You cut {member} off. They sit down without looking at you, and the room takes longer than usual to settle.

### 34. activity-member-warning / support

**Before:** The support reaches {member}’s actual account. They can accept help without pretending the old dispute never happened.

**After:** You pay {member} support. They accept it, then ask you to answer the old complaint too.

### 35. activity-starlight-camera / chosen

**Before:** A few followers accept the explanation. Others ask whether the universe also picked the baggage allowance.

**After:** You insist that particular plane was chosen. A follower salutes its landing lights. You cannot tell how seriously they mean it.

### 36. Claim remedy / cosmic-refund

**Before:** An actual month of dues leaves the treasury and goes back to ordinary members. Nobody mistakes it for a message from the universe.

**After:** You refund a month of ordinary members’ dues from the treasury. They count it. Your explanation of the cosmos can wait.

### 37. Claim remedy / memory-garden

**Before:** The actual garden upgrade is paid for and installed. Members have a place to remember people. You let them use it without making this about your comeback.

**After:** You pay for the garden and let the members use it. You leave the opening speech out.

### 38. Claim remedy / kettle-oracle

**Before:** The kettle sells as a kettle. The proceeds enter the communal treasury; its doctrine is replaced by an admission of fallibility. Devotees of the whistle are furious.

**After:** You sell the kettle and put the proceeds in the treasury. You replace its doctrine with admitting mistakes. Devotees are furious that you sold their oracle as kitchenware.

### 39. Claim remedy / perfect-weather

**Before:** The gathering hall is actually purchased. It raises capacity and running costs, and the next indoor gathering will not need your cooperation with the clouds.

**After:** You buy the hall. It adds capacity and running costs. The organiser puts far more faith in its roof than your next forecast.

### 40. Claim failure / memory-garden

**Before:** There is still no garden. This is not a good occasion for a clever explanation.

**After:** The garden deadline passes with nowhere to leave flowers. Bereaved members ask you for a straight answer.

### 41. Dashboard introduction

**Before:** Choose what you believe, find your people and remember what you promised.

**After:** Choose your beliefs, gather followers and try to stay ahead of your promises.

### 42. Inner-circle praise / ambition

**Before:** They accept the thanks and ask whether the next public announcement can name them.

**After:** “Could you say that in front of everyone?” They already know which announcement would suit.

### 43. Inner-circle reward / grievance

**Before:** The support reaches their real account. It helps with practical needs without erasing the old argument.

**After:** They accept the payment. “Thank you. We still need to talk about what happened.”

## All eighteen failed-claim admissions

Previously every claim used: “You gave a plain answer. The failed promise remains on record.” New offers bind the following claim-specific payoff.

| Claim | New admission |
| --- | --- |
| A Green Moon | You admit the moon was never going to turn green. A follower slowly puts away the paint chart and asks what else you guessed. |
| A Letter from Tomorrow | You admit there is no letter from the future. A follower suggests asking someone from the present to answer them. |
| The Great Reboot | You admit reality will not reboot on your instructions. Followers ask what they should do with the emergency backups. |
| A Cosmic Refund | You admit the promised fee relief never arrived. A follower asks when they will see their money again. |
| The Sky Will Acknowledge Us | You admit you could not make it rain. A follower points out that the forecast did not require a membership fee. |
| The Picnic Before Everything | You admit you missed the picnic deadline. A follower holds out an empty plate for the apology. |
| The Final Monday | You admit there will be more Mondays. The follower who booked Tuesday off would like you to stop predicting their working week. |
| An Answer Worth Waiting For | You admit there is no hidden answer. The inner circle looks relieved to stop pretending they are about to find it. |
| A Season of Listening | You admit you never held the promised discussions. A follower starts answering you. You let them finish. |
| The Animals Will Judge Us | You admit the animals have not endorsed you. A follower points to the mess the pigeon left on your chair. “We did get one review.” |
| The Kettle Will Speak | You admit the kettle only makes tea. Someone asks how long you have suspected this. |
| Wake a Hidden Talent | You admit you failed to provide the workshop. Followers still need somewhere to work. They ask you for an opening date you can keep. |
| A Place to Remember | You apologise for failing to provide the memorial garden. Members ask what you intend to do for the people still waiting to use it. |
| A Seat for Everyone | You admit you failed to provide the promised meal and help. A member asks what they should tell the people waiting for dinner. |
| The Visitor You Dreamed About | You admit nobody new has stayed. A follower suggests you watch the exit more closely in your next dream. |
| Win Over the Street | You admit you never held the gathering. The neighbours would still like an invitation and an answer about the parking. |
| Seven Signs | You admit the seventh sign was a duplicate. A follower counts the remaining six out loud for you. |
| Perfect Weather | You admit the weather ignored your promise. The organiser holds the umbrella over themselves while you explain. |

## Dramatic and everyday review

The second-microphone challenge, treasurer’s ultimatum, payout projection, blacklist and guarded family visit were read as actual confrontations. Expulsion stays expulsion: the result shows the named person leaving and their followers leaving with them. It does not promise a guaranteed rival, prosecution or future betrayal.

Routine recruitment has separate strong, modest and empty outcomes for each method. Sermons have engaged, ordinary and pushback responses for every philosophy. Ceremonies retain their three outcome tiers and all sixteen existing activity interruptions. Every one of these 57 routine branches is exercised by the recorded contexts.

The inner-circle wording uses existing personality, role, ambition, loyalty and grievance conditions. No new roll decides a reaction. A sceptic presses for an answer, an opportunist checks their prospects, a practical member asks for tasks, an earnest member talks about people, and a showy member wants an audience.

## Repetition pass

The first editorial draft leaned too heavily on “asks whether” punchlines. A second pass replaced 44 lines across stories, claims and routine activity writing, using actions, direct speech, interruptions and serious reactions instead. This was a sentence-by-sentence pass, not a banned-word substitution. “Actually” as reassurance and “useful” as generic praise no longer appear in the story setups/payoffs.

Numeric dues terminology, ledger descriptions, eligibility errors, financial confirmations and historical binding labels were retained where they communicate a real constraint or must remain literal. Not every administrative fact needs a punchline.

A separate one-place-left recruitment test also checks singular wording in both the result and the journal.

## Financial and population boundaries

Three additional command tests cover a celebration at full capacity, expulsion from a three-person group and an income-only mug run. The prose no longer invents recruits, additional departing supporters or an outgoing payment in those cases. The actual costs, proceeds and follower changes stay unchanged.

The nine full-career comparisons cover three countries and three declared starting scenarios: a free-fee group that collapses after four years, a stressed low-standing leader with high-heat beliefs, and a growing group that reaches 799 followers before voluntary closure. Command traces, financial state and RNG match the upstream pre-editorial version. See [career comparisons](career-comparisons.json).

## Verification

See [verification results](verification.json), [catalogue review](catalogue-review.json), [routine branches](routine-branches.json), [UI structure comparison](ui-structure.json) and [runtime source hashes](runtime-source-hashes.json). The fixture covers 74 genuine pre-rewrite offers and all 296 bound choices, including withdrawal. Their resolved whole-world hashes must match exactly. Another 358 original command contexts compare the full state after removing only presentation text.

| Check | Result |
| --- | --- |
| Full regression plus affected/final focused reruns | 316 suites, 5,091 passing tests, deduplicated |
| Final focused writing suite | 512 passing tests |
| Core-life soak | 120 unique seeded lives passed |
| Complete cult-career comparisons | Nine declared scenarios across US, GB and JP; matching command traces and non-prose state |
| TypeScript and runtime imports | Passed; 503 modules, no cycles |
| Android and iOS Hermes exports | Passed; all 22 changed runtime files and 12 cult illustrations verified |
| Browser popup review | 34 screens; no overflow, failed images or unreachable final actions |

The long regression and soak source boundaries are recorded in [verification results](verification.json). The final focused writing suite and both platform exports cover the final editorial runtime.

The connected UI checks save new decisions, choose their results, reopen the SQLite save and retain the exact payoff. Browser captures use production React Native trees at 390px and 320px with larger text; these are browser layout evidence, not native device captures.

The integrated regression exposed a stale assertion for the current store/state source hashes after upstream gameplay feedback was merged. Both hashes match the untouched upstream checkout. The two current-source observations were updated and all five tests in that suite passed again; the historical C35 registration and its source-rejection checks remain unchanged. The verification record retains the initial failure and deduplicates the passing rerun.

No remaining editorial lines have been flagged for manual rewriting. The intentionally retained factual/history strings and unreachable impossible-claim success strings are documented above.


## Selected popup captures

Production component trees rendered in the browser, with real saved names and outcomes. Light uses 390px; dark uses 320px with 1.4× text. All 34 reviewed screens pass image, overflow and action-reachability checks. The eight selected captures are retained here; the full capture list is recorded in [browser checks](browser-checks.json).

| Payoff | Light | Dark / larger text |
| --- | --- | --- |
| Failed green-moon claim | [View](cult-writing-green-moon-result-light.png) | [View](cult-writing-green-moon-result-dark-large.png) |
| Public leadership challenge | [View](cult-writing-second-microphone-result-light.png) | [View](cult-writing-second-microphone-result-dark-large.png) |
| Recruitment question | [View](cult-writing-activity-street-question-result-light.png) | [View](cult-writing-activity-street-question-result-dark-large.png) |

Initial decisions: [leadership challenge](cult-writing-second-microphone-decision-light.png), [failed claim with larger text](cult-writing-green-moon-decision-dark-large.png).
