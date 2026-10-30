# Annual-story refinement audit — revision 2

This refinement starts at `fc2294b4`. It inspects **121 existing authored annual situations** and their **363 choices**, across childhood, school, study, adult life, work, friendship, romance, parenting, crime/legal proceedings, custody, release and later life. These are catalogue situations, not interaction-response variants. The previous 89-response audit is retained below as historical work.

**26 situations receive copy revisions; 95 are retained.** The revised scenes contain 76 revised choice payoffs. Four setups and several titles/labels are tightened. No event is removed and no annual mechanical effect is changed in this editorial pass. Major new-story consequences are audited separately in the refinement review; inventing injuries, wealth, people or legal results would make these smaller scenes worse.

Each inspection considered the premise, concision, humour, distinct decisions, payoff, bound character fit, truthful effects, repetition and replay value. The row-level disposition explains the strongest reason to keep or revise it. Ordinary quiet, release-adjustment and healthy relationship scenes remain in the mix.

## Prospective publication and save compatibility

`content/annualStoryRefinements.ts` holds explicit `revision: 2` patches whose type permits only prose fields. Original catalogue objects, event IDs, choice IDs, context requirements, rarity, five-year repeat protection, stats and all immediate effects remain unchanged. `bindEvent` applies a patch only when binding a **new** decision for an overhaul-enabled world (`overhaulVersion: 1`). Ordinary legacy and enhanced-creative worlds without that opt-in still bind their original copy. This does not introduce a new world tuple or a mandatory story arc.

Already-bound decisions own literal titles, bodies, labels, result wording, journals, participant IDs and effect snapshots. Resolving, decoding or branching those decisions never calls the revision overlay. A pending original offer therefore keeps its exact wording after opt-in and cold reopen. Old historical journals are never re-rendered from today’s catalogue.

## Complete reviewed annual inventory

The [machine-readable inventory](verification/crime-romance-refinement/annual-editorial-inventory.json) retains the exact original copy, revised copy and classification for each reviewed ID.

| Existing annual ID | Source under `src/game/content/` | Disposition | Reason |
| --- | --- | --- | --- |
| `first-cake` | `events.ts` | Rewrite copy | Replace an abstract response with the parent attempting the photograph. |
| `shoe-principle` | `events.ts` | Rewrite copy | Stage the three decisions through recognisable toddler behaviour. |
| `blanket-dragon` | `events.ts` | Rewrite copy | Keep the imaginary dragon age-appropriate and give each branch a physical payoff. |
| `library-card` | `events.ts` | Rewrite copy | Replace general praise with specific reading and librarian responses. |
| `broken-mug` | `events.ts` | Rewrite copy | Show disappointment, repair and concealment rather than summarising approval. |
| `rainy-fort` | `events.ts` | Rewrite copy | Give a quiet choice texture and the failed choices specific endings. |
| `parent-old-music` | `events.ts` | Rewrite copy | Replace generic bonding with recognisable parent and teen reactions. |
| `group-chat-rumour` | `events.ts` | Rewrite copy | Make the challenge and embarrassment concrete without inventing a saved victim. |
| `first-presentation` | `events.ts` | Retain | Coin-swallowing escalation and forgotten name already give three distinct payoffs. |
| `parent-boundary` | `events.ts` | Rewrite copy | Keep remote contact explicit and replace vague tension with actual message behaviour. |
| `comparison-scroll` | `events.ts` | Rewrite copy | Ground comparison in small behaviour; avoid invented employment or success. |
| `community-garden` | `events.ts` | Retain | Novelty torso apron drives specific volunteering, learning and refusal branches. |
| `bad-review` | `events.ts` | Retain | Soup, diagram and online escalation already form a concise comic dispute. |
| `rest-guilt` | `events.ts` | Retain | Printer argument punctures the relaxation class; leaving and helping differ. |
| `old-photo` | `events.ts` | Retain | Haircut denial stays gentle and names the actual contacted parent. |
| `local-meeting` | `events.ts` | Retain | Living memorial subject supplies specific reactions without a false death. |
| `small-mistake` | `events.ts` | Retain | Public wig message has an immediate, embarrassing reply-all payoff. |
| `birthday-number` | `events.ts` | Retain | Dead-inventor comparisons give the birthday premise a distinctive target. |
| `familiar-street` | `events.ts` | Retain | Guide and laundrette owner supply competing versions of the same romance. |
| `new-skill-late` | `events.ts` | Retain | Forceful No drives lesson, observation and refusal without a qualification claim. |
| `useful-advice` | `events.ts` | Retain | Tattoo urgency allows listening, shared fallibility and an alienating lecture. |
| `quiet-morning` | `events.ts` | Retain | Tea and an unnecessary noise investigation make a small restorative scene. |
| `first-bubble-catch` | `earlyHomeStories.ts` | Retain | Disappearing bubble supports chasing, observing and frustration without adult satire. |
| `first-tower-demolition` | `earlyHomeStories.ts` | Retain | Rebuilding, deliberate crashing and lining up blocks are different play styles. |
| `first-camera-closeup` | `earlyHomeStories.ts` | Retain | Nostril, screen wave and back-of-head photos have specific parent reactions. |
| `first-nap-negotiation` | `earlyHomeStories.ts` | Retain | Sleep, reassurance and yawning protest preserve age-appropriate warmth. |
| `toddler-parent-name` | `earlyHomeStories.ts` | Retain | No Stop wordplay is specific to the parent-child interaction. |
| `toddler-ice-cube` | `earlyHomeStories.ts` | Retain | One sock, two socks and freezer request escalate the same innocent mistake. |
| `toddler-lift-button` | `earlyHomeStories.ts` | Rewrite copy | Stage the parent response and different uses of curiosity. |
| `toddler-caterpillar-crossing` | `earlyHomeStories.ts` | Retain | Watching, care and an unentered race preserve a small observational moment. |
| `toddler-why-machine` | `earlyHomeStories.ts` | Retain | Watermelon joke gets questions, a drawing and absurd fruit-salad ambition. |
| `child-first-loose-tooth` | `earlyHomeStories.ts` | Retain | Clicking tooth turns private curiosity into a recognisable lunch disruption. |
| `toddler-stairwell-echo` | `schoolDayStories.ts` | Rewrite copy | Differentiate loud, experimental and patient play. |
| `toddler-zipper-puzzle` | `schoolDayStories.ts` | Rewrite copy | Replace inventor commentary with observable experimentation. |
| `toddler-shadow-race` | `schoolDayStories.ts` | Rewrite copy | Make shadow play a scene instead of a summary. |
| `toddler-cardboard-postbox` | `schoolDayStories.ts` | Rewrite copy | Give repeated play an escalating payoff. |
| `toddler-biscuit-halves` | `schoolDayStories.ts` | Retain | Joining, celebrating and counting crumbs differ without fake extra food. |
| `school-inverted-map` | `schoolDayStories.ts` | Retain | Final-boss staffroom and treasure toilets give marked work specific comedy. |
| `school-library-whisper` | `schoolDayStories.ts` | Retain | One-page insult invites criticism, a boundary or retaliatory authorship. |
| `school-relay-handover` | `schoolDayStories.ts` | Retain | Baton left behind supports practice, instruction and unfair blame. |
| `school-bean-monitor` | `schoolDayStories.ts` | Retain | Thriving chart versus dead bean rewards evidence over invented achievement. |
| `school-secret-language` | `schoolDayStories.ts` | Retain | Banana codebook and firing signal give the breached secret concrete payoffs. |
| `school-label-swap` | `schoolDayStories.ts` | Rewrite copy | Replace generic peer reactions with a precise mistake and embarrassment. |
| `teen-old-recording` | `teenHomeStories.ts` | Retain | Bath-in-the-clouds explanation balances affection, privacy and playful defence. |
| `teen-shrinking-sleeves` | `teenHomeStories.ts` | Retain | Little Star photo offers cropping, celebrity play and self-defeating comparison. |
| `teen-family-game-timer` | `teenHomeStories.ts` | Retain | Competent parent changes the expected power dynamic and stopping choices. |
| `teen-phone-at-dinner` | `teenHomeStories.ts` | Retain | Private draft joke has actual trust damage when deliberately circulated. |
| `teen-notification-loop` | `teenHomeStories.ts` | Retain | Admin reply and implausible autocorrect excuse already land cleanly. |
| `teen-borrowed-charger` | `teenHomeStories.ts` | Retain | Cable in hand makes denial immediately and visibly ridiculous. |
| `teen-old-interest-box` | `teenHomeStories.ts` | Retain | Dinosaur demand, sock tail and rejection letter distinguish all decisions. |
| `teen-household-small-meal` | `teenHomeStories.ts` | Retain | Ceiling pancake, spatula and repeated toss have specific physical payoffs. |
| `teen-parent-voice-note` | `teenHomeStories.ts` | Retain | Goose impression keeps remote communication explicit and chores limited. |
| `teen-sunday-list` | `teenHomeStories.ts` | Retain | Dummy and second dummy escalate without allowing the actual chore to disappear. |
| `work-three-priorities` | `workplaceStories.ts` | Retain | Impossible deadlines meet actual performance and trust consequences. |
| `work-unfamiliar-process` | `workplaceStories.ts` | Retain | Forged check signature has grounded responsibility and job-performance stakes. |
| `work-breakroom-sign` | `workplaceStories.ts` | Retain | Mother sign offers quiet contribution, clear wording or petty escalation. |
| `work-break-playlist` | `workplaceStories.ts` | Rewrite copy | Replace interchangeable music-club endings with specific listening behaviour. |
| `work-message-love` | `workplaceStories.ts` | Retain | Typing indicator and formal sign-off deliver a concise professional embarrassment. |
| `work-photo-blink` | `workplaceStories.ts` | Retain | Dead-looking portrait and selective crop give specific social payoffs. |
| `work-safety-arrow` | `workplaceStories.ts` | Retain | Blocked exit choices alter real performance and health without a fake legal case. |
| `work-shared-credit` | `workplaceStories.ts` | Retain | Original draft proves authorship; taking credit affects actual performance/trust. |
| `work-question-at-door` | `workplaceStories.ts` | Retain | Apology authorship and urgent appointment produce three distinct responses. |
| `work-quiet-kindness` | `workplaceStories.ts` | Retain | Returned phone has a specific unsolicited selfie exhibition and reactions. |
| `work-anonymous-survey` | `workplaceStories.ts` | Retain | Watching supervisor makes the privacy contradiction immediately playable. |
| `work-salary-privacy` | `workingLifeStories.ts` | Retain | Real salary token and invented extra zero distinguish honesty, privacy and lying. |
| `work-shared-note-riddle` | `workingLifeStories.ts` | Retain | Firing spreadsheet already has specific conflict, performance and trust effects. |
| `work-final-file` | `workingLifeStories.ts` | Retain | Unsigned resignation can actually end the current job if the player signs. |
| `work-forgotten-lunch` | `workingLifeStories.ts` | Retain | Fork prepared for repeated emergencies reveals the colleague through behaviour. |
| `work-room-temperature` | `workingLifeStories.ts` | Retain | Wet poster and cooling choices link the joke to actual health/performance costs. |
| `work-training-slogan` | `workingLifeStories.ts` | Retain | Resistant potato classification and eagle confession already produce sharp choices. |
| `work-honest-view-invited` | `workingLifeStories.ts` | Rewrite copy | Replace process narration and somehow filler with actual edits and reactions. |
| `work-invitation-outside` | `workingLifeStories.ts` | Retain | False serial-killer rumour is corrected as a rumour, never an invented record. |
| `work-misnamed-complaint` | `workingLifeStories.ts` | Rewrite copy | Turn three abstract complaint responses into a specific mixed-up wait. |
| `work-trivia-phone` | `workingLifeStories.ts` | Rewrite copy | Give the ridiculous answer actual content and make escalation visible. |
| `work-mutual-embellishment` | `workingLifeStories.ts` | Rewrite copy | Make the truthful and dishonest rehearsals concrete without creating an employment offer. |
| `friend-long-voice-note` | `adultRelationshipStories.ts` | Retain | Impression is overheard by its subject, giving an immediate social reversal. |
| `friend-different-budget` | `adultRelationshipStories.ts` | Retain | Cake-head order uses a real quoted debit only on the paid choice. |
| `friend-advice-or-listening` | `adultRelationshipStories.ts` | Retain | Apology/alibi distinction reveals a friend through specific demands. |
| `friend-creative-feedback` | `adultRelationshipStories.ts` | Retain | Haircut-identifiable villain makes feedback genuinely personal. |
| `friend-interrupted-thought` | `adultRelationshipStories.ts` | Retain | Unannounced LIVE badge permits a boundary, reversal or grout advert sabotage. |
| `friend-unwanted-nickname` | `adultRelationshipStories.ts` | Retain | Kettle contest entry and toilet counter-pitch have distinct comic outcomes. |
| `friend-quiet-company` | `adultRelationshipStories.ts` | Retain | Fake wedding site explicitly remains fake; ending friendship is a real effect. |
| `friend-changed-opinion` | `adultRelationshipStories.ts` | Retain | Anti-chair principles collapse through toilet exemption and strategic squatting. |
| `partner-phone-attention` | `adultRelationshipStories.ts` | Retain | Listening-face recording and failed quiz show behaviour rather than stat commentary. |
| `partner-alone-time` | `adultRelationshipStories.ts` | Retain | Ordinary space remains healthy; an empty-bag exit exposes guilt tactics. |
| `partner-money-conversation` | `adultRelationshipStories.ts` | Retain | Lottery pie remains imaginary and changes no actual financial ownership. |
| `partner-other-couples` | `adultRelationshipStories.ts` | Retain | Breakup thumbnail undercuts comparison without inventing a player breakup. |
| `partner-disagreement-loop` | `adultRelationshipStories.ts` | Retain | Scorecard, unavailable footage and solo championship give distinct argument payoffs. |
| `partner-public-affection` | `adultRelationshipStories.ts` | Retain | Toilet verse can be revised or cruelly heckled with actual trust consequences. |
| `partner-arrives-late` | `adultRelationshipStories.ts` | Retain | Overheard impression gives the partner a concrete response without inventing an excuse. |
| `partner-breakup-script` | `adultRelationshipStories.ts` | Retain | Dishwasher grievance allows serious discussion, shared joke or genuine hurt. |
| `friend-fake-laugh-rehearsal` | `adultRelationshipStories.ts` | Retain | Recognised fake laugh and donkey coaching reveal the friend through performance. |
| `study-timetable-colour-code` | `studyLifeStories.ts` | Retain | Understand Everything timetable ties the joke to actual course and grades. |
| `study-paused-unsolicited-tip` | `studyLifeStories.ts` | Retain | Tuition pause is genuine; rejecting advice does not resume or fund study. |
| `study-confident-fake-source` | `studyLifeStories.ts` | Rewrite copy | Make verification specific while leaving course progress untouched. |
| `later-retirement-assumption` | `laterLifeStories.ts` | Rewrite copy | Show the stranger reacting instead of giving a lesson about assumptions. |
| `later-old-handwriting` | `laterLifeStories.ts` | Retain | Fitted-sheet demand gives retrospective ambition a specific, ordinary failure. |
| `later-forgotten-telephone-number` | `laterLifeStories.ts` | Retain | Jingle number and scissors supply three concrete search outcomes. |
| `later-unfamiliar-word` | `laterLifeStories.ts` | Retain | You ate/no crumbs misunderstanding offers learning, play and overreaction. |
| `later-old-competition` | `laterLifeStories.ts` | Retain | App rulebook and technically correct loss distinguish learning from stubbornness. |
| `later-photo-at-edge` | `laterLifeStories.ts` | Retain | Last-cake reveal resolves the mystery without an invented historical achievement. |
| `later-offered-a-hand` | `laterLifeStories.ts` | Retain | Stubborn jar permits cooperation, independence or alienating defensiveness. |
| `later-changed-favourite` | `laterLifeStories.ts` | Retain | Repeated bucket gag distinguishes nostalgia from continued enjoyment. |
| `later-recording-labelled-retro` | `laterLifeStories.ts` | Retain | Remote-control archaeology keeps the age joke observational. |
| `later-another-year-question` | `laterLifeStories.ts` | Retain | Extra-zero cake gives playful choices without changing the saved birth date. |
| `later-unwilling-exhibition` | `laterLifeStories.ts` | Retain | Pigeon-poo context punctures solemn interpretation without a financial contract. |
| `later-bingo-rebel` | `laterLifeStories.ts` | Retain | Empty-card rebellion stays a free social game, without invented gambling proceeds. |
| `later-family-next-visit` | `laterLifeFamilyStories.ts` | Retain | Check Still Alive calendar title creates family warmth or pressure, not a scheduled visit claim. |
| `later-family-photo-permission` | `laterLifeFamilyStories.ts` | Retain | Six-finger filter ties consent and revenge to a concrete family photograph. |
| `later-family-premature-tribute` | `laterLifeFamilyStories.ts` | Retain | Still-living tribute is clearly a draft, never a false death record. |
| `case-question-list` | `legalStories.ts` | Retain | Shampoo rehearsal is absurd while the genuine hearing and evidence remain intact. |
| `prison-case-boundary` | `legalStories.ts` | Retain | Crime-drama casting exposes bravado; fear can be expressed without legal consequences. |
| `release-open-afternoon` | `legalStories.ts` | Retain | Plain adjustment scene preserves emotional weight and unstructured freedom. |
| `case-internet-defence` | `legalStories.ts` | Retain | Wolf-avatar legal expert is funny without changing the actual hearing rules. |
| `case-heroic-sketch` | `legalStories.ts` | Retain | Courtroom posing never claims to alter evidence or the judgment. |
| `prison-nickname-audition` | `legalStories.ts` | Retain | Cupboard Professor nickname offers friendly play, refusal and a hurtful insult. |
| `prison-paper-mastermind` | `legalStories.ts` | Retain | Helicopter cartoon is confined to paper and creates no escape attempt. |
| `prison-snoring-review` | `legalStories.ts` | Rewrite copy | Give the serious boundary a practical response while preserving the comic alternatives. |
| `release-automatic-permission` | `legalStories.ts` | Retain | Serious unfamiliar freedom needs no extra joke or forced major consequence. |
| `family-adult-parent-question` | `parentingStories.ts` | Rewrite copy | Keep memories factual in scope and give the child a distinct reaction to each answer. |
| `school-microphone-rehearsal` | `schoolDayStories.ts` | Rewrite copy | Give three rehearsal choices distinct spoken and physical endings. |

## Before and after: actual existing choice payoffs

The following 26 pairs quote the original `fc2294b4` catalogue payoff and the prospective revision. Tokens stand for bound saved people or genuine course context. Effects and factual journal meaning are unchanged.

### `first-cake` / `share`

**Before:** {parent} accepts a handful of icing with impressive commitment.

**After:** {parent} eats the icing from your hand. You offer the hand again, now empty. They kiss it, and you immediately reload it with cake.

### `shoe-principle` / `cooperate`

**Before:** Both shoes make it onto the correct feet. A surprisingly productive morning.

**After:** You lean on {parent} while they fasten the shoes. At the door, you lift both feet to demonstrate the finished work. This makes walking difficult.

### `blanket-dragon` / `invite`

**Before:** The dragon listens very quietly. {parent} does all the voices.

**After:** You leave a gap beside you for the dragon. {parent} gives it a squeaky voice. You explain that it is enormous and make them start again.

### `library-card` / `big`

**Before:** You finish some of it, skip a confusing chapter, and learn three words you immediately misuse.

**After:** You rest the book on your knees and work through it in instalments. You learn the word enormous, which finally gives you a useful way to complain about carrying it.

### `broken-mug` / `tell`

**Before:** {parent} is disappointed about the mug and pleased you said something.

**After:** {parent} looks at the broken handle, takes a breath and thanks you for telling them. You stay nearby while they clear up, pointing out pieces you can see.

### `rainy-fort` / `build`

**Before:** It collapses twice. The third version has a reading corner.

**After:** The first roof slides off. The second takes a chair with it. You crawl into the third design with a book and keep one hand on the roof while reading.

### `parent-old-music` / `listen`

**Before:** The story is better than expected. You learn something new about {parent}.

**After:** {parent} tells you where they used to hear it and demonstrates a dance you wish they had only described. You ask another question before the chorus can bring it back.

### `group-chat-rumour` / `question`

**Before:** Nobody produces evidence. The conversation changes topic with suspicious speed.

**After:** You ask for the original source. Three people type at once, then stop. A photograph of somebody’s dinner arrives with unusual urgency.

### `parent-boundary` / `explain`

**Before:** You agree on a check-in time. {parent} admits the silence worried them.

**After:** You answer, then agree when to check in. {parent} sends a relieved thumbs-up. A fifth message begins “Also” but turns out to be about dinner.

### `comparison-scroll` / `close`

**Before:** The laundry is still laundry. At least it is now folded.

**After:** You close the feed and fold the laundry. One sock is missing. You deal with the remaining socks without requiring a beach or an inspirational caption.

### `toddler-stairwell-echo` / `hello`

**Before:** The walls return most of your hello. You start again before they finish.

**After:** You stretch hello until you run out of breath. The stairwell finishes it for you. You gasp, laugh and start again before it is ready.

### `toddler-zipper-puzzle` / `align`

**Before:** You work out which zip goes where. Both jackets survive the experiment.

**After:** You follow the zip down and pull the jackets apart. For a moment you admire the two ordinary jackets. Then you start wondering whether you can do it again.

### `toddler-shadow-race` / `dance`

**Before:** You stop trying to beat the shadow and give it increasingly ridiculous instructions.

**After:** You raise one arm, then both, then wobble your knees. The shadow obeys everything. You finish by bowing to an audience that bows back.

### `toddler-cardboard-postbox` / `repair`

**Before:** The letter stays inside this time. You open the box to make sure it arrived.

**After:** You fold the flaps underneath and post the letter again. Nothing comes out. You tip the box upside down to check that your repair has not eaten it.

### `toddler-lift-button` / `one`

**Before:** The lift takes you where you meant to go. You have performed a valuable public service.

**After:** You press the chosen button. It lights up. You point at the light all the way to the floor so {parent} cannot miss your contribution.

### `school-microphone-rehearsal` / `read`

**Before:** You slow down and read it through. {teacher} asks you to keep that pace.

**After:** You read the announcement slowly. The hall repeats the final word after you. You wait for it to finish before taking a small, unnecessary bow.

### `school-label-swap` / `quiet`

**Before:** {teacher} swaps the labels before the display. The potato keeps its anonymity.

**After:** You point to the names. {teacher} swaps the labels before showing the class. Your drawing is yours again; the potato no longer has your signature.

### `work-break-playlist` / `trade`

**Before:** You disagree about the best part. Neither of you needs to win.

**After:** You swap recommendations. {coworker} plays your choice, nods too carefully and asks when the good bit starts. You point out that they have just talked over it.

### `work-honest-view-invited` / `specific`

**Before:** {supervisor} listens, then crosses out “Everyone”. The discussion becomes more useful immediately.

**After:** You point to one part that cannot work as written. {supervisor} crosses out “Everyone” and writes “Most people”. You point at the same part until they start fixing it.

### `work-misnamed-complaint` / `facts`

**Before:** You separate what the visitor observed from what they assumed. A clearer account is more useful than an instant verdict.

**After:** You check the actual wait and explain the broken clock. The visitor reduces forty minutes to “a while”. {coworker} thanks you for establishing that time was not their personal decision.

### `work-trivia-phone` / `rules`

**Before:** {coworker} laughs and puts the phone away. The question becomes a fairer guessing game.

**After:** You ask whether both players can consult a phone. {coworker} puts theirs down and guesses. You keep guessing too, with nobody pretending to be the referee.

### `work-mutual-embellishment` / `refuse`

**Before:** {coworker} says you are taking it too literally. You explain that references are supposed to contain things that happened.

**After:** You ask which department they ran. {coworker} revises ran to “influenced”. You ask how. They stop asking you to be a reference.

### `study-confident-fake-source` / `verify`

**Before:** The explanation mixed one useful point with two inventions. You keep the real point and work through it properly.

**After:** You compare the explanation with your {studyField} material. One point holds up. The next two rely entirely on the missing reference. You keep the useful bit and cross out the confident nonsense.

### `later-retirement-assumption` / `accurate`

**Before:** You give a short answer. They apologise for inventing your schedule before learning your name.

**After:** You describe a few ordinary things you actually do. The stranger says that sounds tiring. You ask whether they would like to apologise to the birds as well.

### `family-adult-parent-question` / `honest`

**Before:** {child} asks another question. An honest uncertainty gives them more to recognise than a polished example.

**After:** You describe not knowing what came next. {child} asks why you never mentioned that part before. You admit it made a poor introduction to your usual advice.

### `prison-snoring-review` / `honest`

**Before:** {prisonPeer} is embarrassed, but listens. There is no instant cure; at least they stop calling it a gift.

**After:** You ask {prisonPeer} to stop treating your lost sleep as a compliment. They look embarrassed and agree to take the complaint seriously. Nobody promises a silent night.

## Weak choices corrected

| Existing choice | Revised choice and payoff | What improves |
| --- | --- | --- |
| `work-trivia-phone/absurd`: “Offer a deliberately ridiculous guess” | “Answer ‘three very committed worms’”; the colleague laughs and the player asks for half a point. | The player gets the actual joke when choosing, followed by a specific response. |
| `work-misnamed-complaint/facts`: “Clarify what happened without assigning blame” | “Separate the waiting time from the stopped clock”; the visitor revises forty minutes to “a while”. | The procedural choice becomes an identifiable incident with a visible correction. |
| `work-misnamed-complaint/name`: “Correct the name and listen calmly” | Give the actual colleague’s name and hear the visitor out; the useful question concerns when they will be seen. | Listening has a distinct payoff from proving the clock wrong. |
| `shoe-principle/protest`: “Present a floor-based protest” | “Lie down until the shoe policy changes”; a foot eventually slides towards the waiting parent. | Age-appropriate action replaces detached narrator phrasing. |

## Duplicate, repetition and truthfulness checks

The reviewed 121 IDs and 363 choice IDs are inventoried individually. New revision payoffs contain no repeated full sentences or duplicate complete results. The overlay introduces no `apparently`, `somehow`, invented second marriage, paid contract, unrecorded arrest, financial reward, purchase, permanent injury or asset ownership. Names remain literal token replacements, including dollar signs and text resembling another token. All revised branches retain the exact original effect snapshots and participants.

Several related premises deliberately remain: the toddler echo versus the early first echo, family voice impressions versus friend impressions, and online comparison versus illness-influencer comparison. Their age, context and decisions differ. One source of repetition that this pass directly reduces is interchangeable “you learn something / they listen / this is useful” payoffs: named people now interrupt, demonstrate, revise, hesitate or object.

## Verification and remaining weaknesses

`tests/game/annual-story-refinement.test.ts` checks all 26 targets, the copy-only rule boundary, unchanged eligibility/effect/participant identities, every revised branch, actual named binding, literal unusual names, cold checkpoint equivalence and exact historical pending preservation across opt-in/reopen/resolution. Fixtures declare their controlled contexts; these are not natural encounter-rate or native-device claims. Full integrated regression and performance evidence are recorded by the final refinement verification. The completed focused run passed **5 suites / 141 cases**, including the new **28-case** refinement suite and the existing adult, school, relationship and work-writing suites. Strict test TypeScript checks also passed.

The wider library still has more situations than this 121-event inspection. Rare specialist careers, travel, pets, hobbies and some secondary-school stories remain outside this review; the inventory makes that boundary explicit. Several serious scenes are intentionally plain. Replay frequency still uses the existing five-year cooldown, so a very long life can revisit a premise; this copy pass does not claim to solve catalogue exhaustion. Actual-device reading, large-text layout and personal comic taste still need human playthrough evidence.

---

# Previous overhaul audit (historical)

# Crime, prison and romance writing audit

This pass starts from `d8f3d99c31d2ef9fddacb9cf5ad0b9cc20172bd0` on `v2`.
The prior content passes already made many annual stories specific and funny.
The most persistent weakness was the language players encounter between those
stories: repeated conversations, requests for support and ordinary person actions.

The editorial change revises **89 existing interaction outcome variants**:
36 conversation contexts, 40 support responses and 13 person-action responses.
These are **not 89 annual situations**, and are not counted toward the overhaul's
80-new-situation target. Seven conversation contexts are defensive rendering
fallbacks which the ordinary topic selector does not offer without the required
facts; 82 inventory entries therefore correspond to ordinary supported action
outcomes. New organised-crime, prison and romance situations belong to their
respective gameplay modules and are counted separately in the overhaul guide.

## Scope and classification

| Reviewed source | Classification | Disposition |
| --- | --- | --- |
| `content/conversationWriting.ts` | Generic payoff; repetitive open/reserved endings | Revise the 36 contexts below; retain factual ownership, setting, journal and outcome inputs |
| `content/personInteractionWriting.ts`, support | Generic payoff; every relationship sounded like a bank | Revise 40 responses; distinguish a refusal from an actual shortage and exact partial support |
| `content/personInteractionWriting.ts`, actions | Generic payoff; repeated reassurance and commentary about stat changes | Revise 13 responses around the actual action, refusal or committed purchase |
| `content/legalStories.ts`, nine annual situations | Already good; serious release scenes should remain plain | Retain every premise, choice and effect; especially release anxiety and unfamiliar freedom |
| `content/adultRelationshipStories.ts` | Already good; bound friends/partners and distinctly unpleasant choices | Retain its existing situations and immediate consequences |
| `content/workingLifeStories.ts` | Already good overall | Retain the firing spreadsheet, coerced resignation, workplace heat and genuine employment consequences |
| `content/ordinaryAdultStories.ts` | Already good after the previous audit | Retain the paid chicken mascot, donkey charity, ghost-tour and friendship-invoice situations |
| `content/teenHomeStories.ts` | Already good; age-appropriate family absurdity | Retain the dinosaur letter, phone draft, pancakes, voice notes and chore dummy |
| `content/hobbyLifeStories.ts` and `travelMemoryStories.ts` | Already good; recognisable incidents with distinct decisions | Retain existing premises; do not count a new name or destination as new content |
| `content/wellbeingStories.ts` | Mixed humour and necessary plain writing | Retain serious rest, information boundaries and grief; retain the clearly bogus paid cure's actual debit |
| `systems/relationships.ts` | Some ordinary direct-action payoffs remain generic | Refer the direct talk/compliment/argument/apology copy to romance integration; excluded from this 89-entry count |
| `systems/personInteractions.ts` | Correct separation of action outcomes and writing | Retain command validation, one saved draw, gifts/ownership, real energy and relationship effects |
| `systems/legal.ts` | Literal legal outcomes are necessary | Retain hearing, conviction, bail, parole, escape and release facts; new gameplay adds its own authored consequences |
| `systems/dateActivities.ts` | Four old activities lacked enough variety | Date expansion belongs to the romance phase, not this interaction-copy count |
| `content/cultStories.ts` and `cultDramaticStories.ts` | Existing voice reference, not a rewrite target | Retain the Cult Leader feature and its already-authored consequences |

No annual story is rewritten just to meet a number. The unchanged event IDs,
choice IDs, eligibility, rarity, five-year repeat protection, stat effects, money
quotes and bound participant rules continue to apply to the retained library.

## Rewritten conversation inventory

`C` IDs are audit references, not new saved event IDs. Each row corresponds to a
named fixture in `tests/game/crime-romance-editorial.test.ts`. All rows are
classified **generic payoff — improve outcome**. The inputs already supplied
age, ownership, recorded study/employment, stress and trust; the writer does not
invent any of those facts.

| Audit ID | Existing context | Revised payoff focus |
| --- | --- | --- |
| C01 | Everyday, reserved | Headline update without an interrogation |
| C02 | Everyday, young actor | The small story needs its own lengthy introduction |
| C03 | Everyday, young contact | Asking a child one question gets the director's cut |
| C04 | Everyday, teen | Minor disasters ranked by discussion length |
| C05 | Everyday, adult | Tiny annoyances receive a disproportionate hearing |
| C06 | Interest, reserved | Retire the subject before trying to rescue it |
| C07 | Interest, child | One question multiplies into five |
| C08 | Interest, shared | Shared enthusiasm does not imply identical favourites |
| C09 | Interest, actor-owned | Stop the advanced lecture and explain the useful part |
| C10 | Interest, contact-owned | Understanding one detail invites the longer explanation |
| C11 | Interest, unknown fallback | Compare attention without inventing a shared hobby |
| C12 | Family, no family-role fallback, open | Discuss the idea without asserting kinship |
| C13 | Family, no family-role fallback, reserved | A subject can stay unpacked |
| C14 | Family, relative reserved | A short answer is not permission to repeat the question |
| C15 | Family, child | Small rules, fully grown objections |
| C16 | Family, adult | Helping versus taking over; examples cut both ways |
| C17 | Study, no-record fallback, open | Admit difficulty without claiming enrolment |
| C18 | Study, no-record fallback, reserved | Do not set conversational homework |
| C19 | Study, recorded course, reserved | Spare both people the progress report |
| C20 | Study, paused | Discuss uncertainty without claiming a decision or return |
| C21 | Study, completed | The omitted parts make a better conversation |
| C22 | Study, current, child | A lesson may be interesting and take forever |
| C23 | Study, current, adult | Get beyond the standard study update |
| C24 | Work, no-record fallback, open | Discuss a bearable day without inventing employment |
| C25 | Work, no-record fallback, reserved | Let the subject clock off |
| C26 | Work, actual role, reserved | Do not turn a chat into an interview |
| C27 | Work, former role | Old concerns can take less explaining now |
| C28 | Work, child | The title needs explaining; no job is awarded |
| C29 | Work, adult | Explaining the people takes longer than the job description |
| C30 | Feelings, reserved | Accept the answer without prising it open |
| C31 | Feelings, child | “Fine” fails its first follow-up question |
| C32 | Feelings, both stressed | Compare notes without competing over distress |
| C33 | Feelings, actor stressed | Listening without a plan for somebody's entire life |
| C34 | Feelings, contact stressed | Let the contact choose what to disclose |
| C35 | Feelings, high trust | A difficult sentence can stand without a joke |
| C36 | Feelings, lower trust | Some honesty without demanding everything |

The seven fallback rows are C11–13, C17–18 and C24–25. They are included for
complete renderer review, not counted as new playable opportunities.
Hospital, custody and distance prefixes remain method-neutral: none claims a
visit, transport, phone, guard permission or shared physical location.

## Rewritten support inventory

All 40 rows are **generic payoff — improve outcome**. Gift/partial responses
render only the real offered amount; partial responses also retain the original
requested amount. “Refused” means funds could be available but consent was not;
“unavailable” means the caller established an actual budget constraint. Neither
refusal invents a debt, punishment, payment, trip or broken relationship.

| Audit ID | Actual role group | Saved outcome | Revised emphasis |
| --- | --- | --- | --- |
| S01 | Father / adoptive father | Gift | Practical help is not a new income stream |
| S02 | Father / adoptive father | Partial | What he can spare, not the imagined budget |
| S03 | Father / adoptive father | Refused | No right to audit the answer |
| S04 | Father / adoptive father | Unavailable | His own budget cannot stretch |
| S05 | Father / adoptive father | Annoyed | Stop the pitch and let him finish |
| S06 | Mother / adoptive mother | Gift | Thanks without gratitude in instalments |
| S07 | Mother / adoptive mother | Partial | Do not pretend the amount covers everything |
| S08 | Mother / adoptive mother | Refused | The hopeful silence does not change no |
| S09 | Mother / adoptive mother | Unavailable | Her own costs need covering |
| S10 | Mother / adoptive mother | Annoyed | End the presentation |
| S11 | Partner / spouse / engaged | Gift | A money conversation can simply finish |
| S12 | Partner / spouse / engaged | Partial | Help does not promise the remainder |
| S13 | Partner / spouse / engaged | Refused | Being together does not merge every budget |
| S14 | Partner / spouse / engaged | Unavailable | Their own bills remain real |
| S15 | Partner / spouse / engaged | Annoyed | Do not treat a partner as the next cash source |
| S16 | Brother / sister / sibling | Gift | Accept without competing |
| S17 | Brother / sister / sibling | Partial | Part of the request, however inconvenient |
| S18 | Brother / sister / sibling | Refused | Kinship is not financial authorisation |
| S19 | Brother / sister / sibling | Unavailable | Their expenses come from their own money |
| S20 | Brother / sister / sibling | Annoyed | The family does not have a spare wallet |
| S21 | Adult child / adopted child | Gift | Admit that asking can be difficult |
| S22 | Adult child / adopted child | Partial | Accept without demanding an expense audit |
| S23 | Adult child / adopted child | Refused | Childhood is not an invoice |
| S24 | Adult child / adopted child | Unavailable | They need money for their life too |
| S25 | Adult child / adopted child | Annoyed | The help is not something owed |
| S26 | Parent / guardian | Gift | Practical help without a speech |
| S27 | Parent / guardian | Partial | Smaller help is still real |
| S28 | Parent / guardian | Refused | Let the answer stand |
| S29 | Parent / guardian | Unavailable | Their own budget has no room |
| S30 | Parent / guardian | Annoyed | End the repeated request |
| S31 | Friend / best friend | Gift | Thank a friend without treating them as a service |
| S32 | Friend / best friend | Partial | Do not imply a promise beyond the offer |
| S33 | Friend / best friend | Refused | An unwanted answer need not destroy friendship |
| S34 | Friend / best friend | Unavailable | The other budget has problems too |
| S35 | Friend / best friend | Annoyed | Let the next conversation begin elsewhere |
| S36 | Other contact, including ex | Gift | Keep the thank-you shorter than the request |
| S37 | Other contact, including ex | Partial | Exact smaller amount, no invented remainder |
| S38 | Other contact, including ex | Refused | Repetition is not a different question |
| S39 | Other contact, including ex | Unavailable | Available funds do not cover the request |
| S40 | Other contact, including ex | Annoyed | The second pitch never begins |

These are eight role voices, not eight fictional personalities added to the
simulation. Consent, generosity, annoyance, affordability and the transfer are
still decided by `personSupport.ts` using actual people and accounts. The renderer
uses the recorded relationship label; nonbinary parent/child labels keep `they`.

## Rewritten person-action inventory

All 13 rows are **generic payoff — improve outcome**. Existing engine eligibility
still limits child-specific actions, permission, outings and partner gifts.

| Audit ID | Existing action / outcome | Revised payoff focus |
| --- | --- | --- |
| A01 | Insult | The insult makes the actual point harder to like |
| A02 | Distance | A requested gap becomes more than a feeling |
| A03 | Praise | Specific approval without a concealed “but” |
| A04 | Scold | The boundary lands without pretending it felt pleasant |
| A05 | Free outing | Shared time outside a request for something |
| A06 | Permission accepted | Permission is for one real free outing this year |
| A07 | Permission declined | A hopeful pause is not consent |
| A08 | Advice accepted | A useful answer can identify what the player avoided |
| A09 | Advice declined | Do not repeat the question more desperately |
| A10 | Chore help accepted | Accept real help instead of proving independence |
| A11 | Chore help declined | Chores are not a family loyalty test |
| A12 | Gift accepted | Exact paid item, ownership and continuing upkeep |
| A13 | Gift declined | No new purchase or obligation is implied |

## Representative before and after

Names and money below illustrate bound inputs. They are not hardcoded game
participants or prices.

| Existing response | Before | After |
| --- | --- | --- |
| Child tells an adult about their day | “Sam tells you about one tiny thing from the day. You ask a question and get the extended version.” | “Sam tells you about one tiny part of the day. You ask what happened next and receive the director’s cut.” |
| Adult everyday chat | “You and Sam compare the day's tiny annoyances. One of them gets a much longer hearing than it deserves.” | “You and Sam put the day’s small annoyances on trial. Neither of you can explain why the smallest one needs so many witnesses.” |
| Private family subject | “Sam keeps the family conversation brief. You respect the limit.” | “Sam does not want to unpack the family subject today. You leave it packed.” |
| Paused study | “You leave the next step open.” | “You discuss the uncertainty without demanding a decision before the conversation ends.” |
| Current work | “The job sounds simpler before you get to the people.” | “The job description is short; explaining the people takes longer.” |
| High-trust feelings | “Neither of you has to add ‘only joking’ afterwards.” | “You can leave a difficult sentence standing without disguising it as a joke.” |
| Father's support | “Your dad comes through with $500. The Bank of Dad is open.” | “Your dad gives you $500. He adds a brief reminder that this is help, not a new income stream.” |
| Friend's refusal | “Sam says no to $500. Friendship has its limits, apparently.” | “Sam says no to $500. A good friendship can survive an answer you did not want.” |
| Partner cannot afford support | “Your partner cannot spare $500. Love has a budget too.” | “Your partner cannot spare $500. Their own bills still need paying.” |
| Praise | “You praised your child, Sam. A little encouragement went a long way.” | “You tell your child, Sam, what they did well. For once, the explanation contains no hidden ‘but’.” |
| Accepted advice | “Your guardian, Sam, helped you think things through. Annoyingly, they made sense.” | “Your guardian, Sam, listens, then points out the part you have been avoiding. You dislike how useful that turns out to be.” |
| Gift | “Your partner, Sam, bought you a mechanical watch for $100. It is yours; ongoing upkeep applies.” | “Your partner, Sam, buys you a mechanical watch for $100. You own the gift, including its distinctly less romantic upkeep.” |

The first-person factual journals stay intact. The writers still do not decide
when an insult, transfer, reconciliation, arrest, divorce or purchase occurs.
Existing pending decisions and results already contain their original bound
words, effect rows and journals; decoding does not regenerate them from either
writing helper.

## New authored-content review

The new catalog contains 20 organised-crime situations, 25 prison situations,
25 partner situations and 10 ex-partner situations: **80 annual premises and
240 authored choices**. Ten criminal assignment premises are a separate action
catalog. The 89 revised ordinary interaction variants are another separate count.

All 80 annual premises were read alongside their resolution and participant
selection code. The following review findings produced concrete changes before
the final integration checks:

| Review finding | Implemented correction |
| --- | --- |
| Crew spending story implied unrecorded missing money | Treat the boss's claim as a boast; do not assert an actual treasury debit |
| Larger-share story promised an unsaved responsibility | Praise the associate's contribution instead of awarding a fictional office |
| Rival exposure claimed reputation damage | Update the actual rival's saved reputation |
| Crew-memory story could precede any completed assignment | Require a completed job |
| In-person crew scenes could bind unavailable members | Require living, local members outside custody, travel and service |
| Crime pending effects were looked up from current content | Freeze rule version and choice consequences with the bound offer |
| New snoring situation repeated an existing prison premise | Replace it with a cell-floor personal-space border and absurd visitor visa |
| Prison letters could describe another confined contact as outside | Bind an available, living outside contact |
| Release-friendship story asserted different release dates | Admit uncertainty rather than invent a release schedule |
| Prison birthday had no named outside person | Bind the existing outside contact and discuss their next birthday |
| Jealous photograph invented a graduation | Use a group picnic instead of assigning an educational milestone |
| Date-review and conflict scenes lacked historical prerequisites | Require actual date or argument memories |
| Physical partner scenes could appear across incompatible locations | Require both participants to be available together |
| Ex's birthday greeting could occur in any month | Restrict it to the actor's actual birth month |
| Ex stories could state a boundary with no persistent consequence | Save the no-contact boundary and respect it in future approaches |
| Two new events shared the same generic title | Rename the argument story to distinguish it from the prison favour |
| Proposal/discovery prose explained engine safeguards | Replace it with the person's proposal and the witnessed betrayal |
| Accepted prison visit journal started with an NPC name | Journal the visit from the player's first-person perspective |

The 81-case authored-writing suite passes after these corrections. Its count
and language checks are structural validation, not a substitute for each
feature's eligibility, state-resolution and persistence tests. Editorial review
is complete for this catalog; shipped status and the full integration result
must follow the final commit/export verification in the overhaul report.

## Verification and final editorial self-review

The integrated editorial, conversation and person-writing suites pass **26 cases
across three suites**, including actual engine actions, exact money, gift
ownership, one-draw preservation, school help, age-aware language and read-only
contexts. The dedicated matrix exercises all 89 revised outcomes, including
funds versus consent, exact partial amounts, unique writing and concise results.

The additional `crime-romance-writing-contracts.test.ts` inventories the 80 new
annual premises separately from missions and action results, and checks all 240
authored choices for unique decisions, complete outcomes, first-person journals,
known binding tokens and readable lengths. It complements each feature owner's
state-resolution tests; static wording checks cannot prove actual effects.
Final integrated results belong in the overhaul verification report.

Source review checked every branch against its caller: successful support is
rendered after the genuine transfer; denied support does not imply a transfer;
gift ownership and ongoing upkeep are explicit; actual subjects retain their
owner; former work is still former work; paused study does not become graduation;
reserved answers do not reveal secrets. Serious high-stress conversation and
financial shortage receive space without diagnoses, instant recovery or ridicule.
No navigation, artwork, purchases, mechanics, RNG consumption, old fixtures or
historical saves were edited by this editorial pass.

The matrix is a rendering and source-contract check. It does not establish
natural encounter rates, long-life balance, installed-device presentation or
native acceptance; those require the integration phase's separate evidence.
