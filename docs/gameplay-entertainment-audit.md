# Gameplay entertainment audit

Audited source: `work` at `eeb989e6093eae4655c86d18909c92ab979b02ca` (274 original situations, 822 choices). Every setup, choice, result, journal, supported consequence, context and overlap was reviewed. No UI or navigation changes or new narrative framework were introduced.

The selected scope is 97 existing scenes: childhood 22, everyday/wellbeing/later life 22, workplace/special careers 20, relationships/family/study 19, legal/leisure/travel 14. The other 177 originals are retained. Priority goes to interchangeable polite choices, repeated administrative annoyances and results that explain a lesson instead of delivering a payoff. Each section lists every original event ID and its individual decision.

The 20-scene pilot (four in each section) passed editorial and focused regression review before the remaining rewrites. All 97 selected revisions and 30 original additions are implemented in content 18. Original event/choice identities and full eligibility/illustration metadata are verified against the immutable baseline. Historical narrative goldens now protect stable identities; literal old pending choices/results remain covered by real archived save tests.

All new scenes use the existing relative rarity weights, five-year cooldown and annual offer guard. There is no forced dramatic event each year. Direct relationship/grade/skill effects can make authored dilemmas significant; arrests, fines, job endings, transfers and business failures remain the responsibility of the existing systems below.

## System-generated decisions and outcomes

| Source / decision or result | Classification | Issue and implemented direction |
|---|---|---|
| `relationships.ts` / `meet-dating`, `meet-friendship` | KEEP | Real introductions with clear consent, actual contacts and age-specific settings. |
| `relationships.ts` / breakup, rejected proposal | ENHANCE | Replace accounting-style result prose with personal fallout; retain actual romance/ring state changes. |
| `work.ts` / `job-interview` | ENHANCE | Preserve contextual question, sector feedback and hourly contract terms; sharpen rejection and successful hire payoffs. An optional `copyVersion: 18` marker on newly bound existing interview effects preserves exact dynamic result prose for all older saved interviews, including those already carrying experience evidence. |
| `work.ts` / resignation | ENHANCE | Give real job loss emotional weight; preserve earned wages and cessation of future pay. |
| `social.ts`, `socialCriticism.ts` / `public-controversy` | REWRITE | Five nearly identical criticism setups and a single generic result. Use sharper platform/media-specific writing and response-specific outcomes from the existing saved response roll, with actual image/stress effects. |
| `social.ts` / `brand-offer` | ENHANCE | Preserve the six-month/two-post/monthly delivery contract and full financial terms; make the acceptance result acknowledge the new obligation. |
| `social.ts` / `creator-introduction` | KEEP | Clear actual contacts without fictitious collaboration or income. |
| `social.ts` / viral, quiet, controversial posts; public interview | ENHANCE | Distinguish audience reactions and actual fame/image/fee outcomes with punchier writing. |
| `legal.ts` / `arrest` | ENHANCE | Immediate arrest stakes, escrow and remand consequences; keep choices/IDs and all custody rules. |
| `legal.ts` / `court-hearing` | ENHANCE | Clarify shorter-term versus lower-fine versus acquittal gamble. Each plea has its own result prose; verdict, fine, remand credit and custody rows remain authoritative. |
| `legal.ts` / crime, counsel, dismissed appeal, escape | ENHANCE | Replace repeated storage/RNG explanations with real risk, self-representation, spent appeal fee and fugitive consequences. No new crime or punishment rules. |
| `assets.ts` / `property-sale-offer` | ENHANCE | Make holding out versus selling concrete; mortgage, fees, proceeds and ongoing costs still follow actual property settlement. |
| `health.ts` / `medical-emergency` | KEEP | Clear symptoms, care cost, possible stay and informed refusal are more useful than a forced joke. |
| `stories.ts` / `story-arcade-invitation`, `story-project-promise` | KEEP | Existing linked payments, permission and project consequences already work. Preserve this framework. |
| `projectRecall.ts` / `story-project-recall` | KEEP | Existing actual peer/history callbacks are contextual; no new callback machinery. |
| `careers.ts` / selection, completed/cancelled projects, contract ending | ENHANCE | Replace generic status prose with rejection, reception and career-specific stakes, retaining real contracts, awards, pay and attendance. |
| `businessMonth.ts` / cash warning, business failure | ENHANCE | Make impending insolvency and actual liquidation dramatic while retaining precise three-period trigger and creditor settlement. |

## Deferred mechanics

Authored templates cannot directly alter cash, employment, offences, sentence length, fame, marriage or property ownership. New authored scenes therefore never claim those changes. Standalone theft/arrest, affair/breakup, surprise inheritance, fraudulent degree, business loss or scandal-fame mechanics that would require a new command/effect framework are deferred. Existing crime, court, public-image, property, career and business commands already provide major consequences and have received writing improvements instead.


## Childhood original inventory

| Event ID | Classification | Issue and implemented change |
|---|---|---|
| `first-echo` | KEEP | Clear baby curiosity with three playful approaches; preserve quiet early-life contrast. |
| `first-sock-escape` | KEEP | Strong age-specific discovery and concise physical comedy. |
| `first-mirror-guest` | KEEP | Distinct reflection premise with charming baby logic. |
| `toddler-wall-gallery` | KEEP | Already outrageous toddler lie, real parent bonds and cleanup cost. |
| `toddler-grocery-microphone` | KEEP | Sharp public embarrassment with a real parent relationship trade-off. |
| `toddler-cardboard-rocket` | KEEP | Good parent-child absurdity and immediate conflicting priorities. |
| `toddler-suspicious-haircut` | KEEP | Funny cape premise balanced by a credible comforting response. |
| `child-lost-button` | KEEP | Memorable teddy emergency with playful and compassionate responses. |
| `child-first-sleepover-plan` | KEEP | Warm family moment and clear energy-versus-bond alternatives. |
| `school-arcade-invitation` | KEEP | Existing paid follow-up and permission flow work; preserve compatibility-sensitive copy. |
| `school-project-promise` | KEEP | Supported delayed project flow already has clear stakes; preserve existing follow-up semantics. |
| `school-volcano-breach` | KEEP | Already vivid accident, reckless sequel and real science/teacher effects. |
| `school-tree-audition` | KEEP | Strong tiny role joke with actual acting practice. |
| `school-mascot-petition` | KEEP | Original absurd campaign; political skill and school relationships match. |
| `school-recorder-solo` | KEEP | Sharp sound joke and meaningful peer/music trade-off. |
| `school-lunch-trade` | ENHANCE | Three decent snack responses; add a selfish bargaining option and sharper fallout. |
| `school-name-joke` | KEEP | Serious bullying contrast with distinct support, private care and cruelty. |
| `school-homework-soap` | KEEP | Good concrete disaster with genuine grade and teacher changes. |
| `school-bench-reserve` | KEEP | Useful emotionally quiet inclusion moment amid comic school scenes. |
| `school-race-false-start` | KEEP | Clear ridiculous advantage, selfish medal demand and real sports practice. |
| `school-tiny-editor` | REWRITE | Soup newsletter is mild and all responses are safe; give it a ridiculous headline and distinct editorial risks. |
| `school-glitter-border` | KEEP | Memorable classroom mess with a reckless worsening option. |
| `teen-homework-leak` | KEEP | Cheating, copying error and real grades already deliver consequences. |
| `teen-group-project-credit` | KEEP | Credible betrayal and an impulsive public response with actual bonds. |
| `teen-mic-still-live` | KEEP | Already embarrassing broadcast with a reckless duet and teacher fallout. |
| `teen-solo-rehearsal` | REPLACE | Another gentle practice-and-listen scene; replace with an embarrassing diss-track rehearsal using the same peer/music effects. |
| `teen-exam-freeze` | ENHANCE | Recognisable nerves but generic responses; sharpen the embarrassing blank-paper stakes and teacher exchange. |
| `teen-canteen-review` | KEEP | Specific structural-pasta joke, public disruption and real teacher response. |
| `first-bubble-catch` | KEEP | Distinct baby-scale disappointment, no invented family and clear responses. |
| `first-tower-demolition` | KEEP | Good age-specific pleasure in intentional destruction. |
| `first-camera-closeup` | KEEP | Concise physical camera comedy and real parent binding. |
| `first-nap-negotiation` | KEEP | Recognisable toddler defiance with energy and parent trade-offs. |
| `toddler-parent-name` | KEEP | Small original family power discovery with playful responses. |
| `toddler-ice-cube` | KEEP | Quiet sensory discovery offsets louder toddler comedy. |
| `toddler-lift-button` | KEEP | Reckless scenic-route option already causes plausible parent friction. |
| `toddler-caterpillar-crossing` | KEEP | Charming race against an unaware opponent; suitable quiet outdoor scene. |
| `toddler-why-machine` | ENHANCE | Good curiosity premise; let persistent questioning expose an adult bluff without losing warmth. |
| `child-first-loose-tooth` | REWRITE | Observation only and little conflict; turn wobbling tooth into a ridiculous public demonstration. |
| `child-pocket-museum` | KEEP | Original tiny museum and Lord Pebble gag; keep imaginative contrast. |
| `school-wrong-jacket` | KEEP | Immediate physical embarrassment and a knowingly implausible denial. |
| `school-empty-lunchbox` | KEEP | Keep serious child dignity and practical teacher help; avoid making deprivation a punchline. |
| `school-answer-blurt` | ENHANCE | Correct-answer manners lesson; make confidence and being wrong collide. |
| `school-slide-queue` | KEEP | Clear selfish action and peer conflict with genuine bond damage. |
| `school-show-tell-prop` | REWRITE | Forgotten-object setup lacks pressure; add peer hype and an outrageous invisible exhibit. |
| `child-boardgame-rules` | KEEP | Self-serving invented rule already supplies mischief and parent consequences. |
| `child-shop-separation` | KEEP | Keep rare, serious safety dilemma with plausible parent response. |
| `school-practice-alarm` | KEEP | Realistic safety contrast with an obviously poor packing decision. |
| `school-mysterious-noise` | KEEP | Punchy bodily humour and a risky public accusation. |
| `toddler-stairwell-echo` | KEEP | Original waiting-for-the-wall response fits very young age. |
| `toddler-zipper-puzzle` | REPLACE | Fine-motor instruction repeats other quiet learning scenes; replace with an absurd zip predicament at the same ages. |
| `toddler-shadow-race` | KEEP | Distinct physical play, experimentation and rest choices. |
| `toddler-cardboard-postbox` | KEEP | Good bottomless-box premise and delight in repetition. |
| `toddler-biscuit-halves` | KEEP | Strong toddler arithmetic joke with different learning/play responses. |
| `school-inverted-map` | KEEP | Concrete absurd scale error and submarine option. |
| `school-library-whisper` | KEEP | Recognisable forbidden laughter with peer benefit and grade cost. |
| `school-relay-handover` | ENHANCE | Plain dropped baton; add competitive blame and memorable spectacle. |
| `school-bean-monitor` | REWRITE | Progress-chart diligence is dry; confront a dead bean plant described as thriving. |
| `school-secret-language` | KEEP | Original shared secret collapses under its own complexity. |
| `school-microphone-rehearsal` | KEEP | Monster-noise option and acting/teacher consequences are already distinct. |
| `school-rainy-break` | KEEP | Existing silly-rule premise gives negotiation, play and accusation. |
| `school-label-swap` | KEEP | Strong potato credit joke with a damaging false accusation. |
| `teen-unit-confusion` | KEEP | Specific mountain-sized desk joke and actual grade/science effects. |
| `teen-debate-draw` | ENHANCE | Generic assigned-side dilemma; use a concrete ridiculous motion and stronger disagreement. |
| `teen-yearbook-proof` | ENHANCE | Placeholder typo is safe; offer vanity, embarrassment and an honest correction. |
| `teen-study-soundtrack` | KEEP | Useful everyday friend-versus-grades trade-off. |
| `teen-family-interview` | ENHANCE | Long parent story repeats listening lesson; uncover age-appropriate family embarrassment while preserving actual parent binding. |
| `teen-volunteer-roster` | REWRITE | Tidying confusion lacks drama; expose a forged volunteer signature and useful trade-offs. |
| `teen-marking-correction` | ENHANCE | Balanced errors make every response sensible; add self-serving selective honesty with factual grade effects. |
| `teen-old-recording` | KEEP | Original embarrassing childhood theory with a privacy choice. |
| `teen-shrinking-sleeves` | REWRITE | Height-comparison lesson is flat; make wardrobe embarrassment immediate without inventing money or purchases. |
| `teen-family-game-timer` | ENHANCE | Routine screen-time lesson; make the parent an awkwardly informed opponent. |
| `teen-phone-at-dinner` | KEEP | Parent hypocrisy and scorekeeping already create a credible conflict. |
| `teen-notification-loop` | REPLACE | Repeated checking duplicates adult scrolling scenes; replace with a disastrous group-chat message using the existing stat-only choices. |
| `teen-borrowed-charger` | ENHANCE | Returned-item lesson; escalate a blatantly guilty denial and bargaining. |
| `teen-old-interest-box` | KEEP | Quiet emotional contrast about growing out of interests. |
| `teen-household-small-meal` | REWRITE | Reading-a-recipe lesson lacks stakes; use a visibly disastrous meal and parent comedy. |
| `teen-parent-voice-note` | KEEP | Clear comic wind message and existing remote-parent context. |
| `teen-sunday-list` | REWRITE | Task-management advice is generic; let procrastination produce an absurd emergency planning session. |

## Everyday original inventory

| Event ID | Classification | Issue and implemented change |
|---|---|---|
| `first-cake` | KEEP | Strong physical comedy with affectionate contrast and distinct child responses. |
| `shoe-principle` | KEEP | Recognisable toddler conflict and strong protest payoff. |
| `blanket-dragon` | KEEP | Imaginative child premise and warm parent bond consequences. |
| `library-card` | KEEP | Gentle childhood contrast with distinct learning costs. |
| `broken-mug` | KEEP | Concealment actually damages the bound parent relationship. |
| `rainy-fort` | KEEP | Physical comedy and quieter reading option already work. |
| `parent-old-music` | KEEP | Generational humour with real bound parent tradeoffs. |
| `group-chat-rumour` | KEEP | Age-appropriate moral conflict with meaningful respect cost. |
| `first-presentation` | REWRITE | Generic introduction panic; use a wildly misleading introduction and an awkward live correction. |
| `parent-boundary` | KEEP | Clear parent-contact context and actual bond consequences. |
| `comparison-scroll` | KEEP | Familiar short everyday contrast; retain rather than repeat a rewrite. |
| `community-garden` | ENHANCE | Only pleasant volunteering; add a ridiculous novelty-apron encounter and a selfish refusal. |
| `bad-review` | ENHANCE | Generic internet disagreement; make the accusation specific, petty and hard to disengage from. |
| `rest-guilt` | KEEP | Strong existing joke and substantial rest/energy tradeoff. |
| `old-photo` | KEEP | Family warmth and an effective haircut joke; preserve emotional range. |
| `local-meeting` | REWRITE | Bench slideshow has little conflict; turn the meeting into a feud over an embarrassing memorial. |
| `small-mistake` | REWRITE | Harmless half-message has no comic stakes; send a rude wig comment to its intended victim. |
| `birthday-number` | REWRITE | Three self-assessment responses; replace the pep talk with a tactless birthday prediction. |
| `familiar-street` | KEEP | Quiet location-bound memory scene supplies needed tonal contrast. |
| `new-skill-late` | ENHANCE | Moral about learning dominates the scene; give the beginner lesson a recognisable public embarrassment. |
| `useful-advice` | REWRITE | Generic advice workshop; introduce a younger person considering a visibly terrible life choice. |
| `quiet-morning` | KEEP | Deliberately ordinary older-life respite; preserve the contrast. |
| `adult-wrong-name-badge` | KEEP | Memorable accidental authority with an effective mop-cupboard payoff. |
| `adult-wave-behind` | KEEP | Distinct social embarrassment and absurd balloon response. |
| `adult-free-lecture-question` | ENHANCE | Vague disputed claim; expose a speaker whose expertise is a transparent bluff. |
| `adult-queue-merge` | KEEP | Specific petty dispute with an amusing historical-legitimacy joke. |
| `adult-community-map` | KEEP | Concrete visual absurdity; sticker argument is already memorable. |
| `adult-open-mic-list` | KEEP | Clear public stakes and three different social responses. |
| `adult-borrowed-pen` | KEEP | Petty possessiveness and attempted theft suit minor effects. |
| `adult-weather-expert` | REWRITE | Predictable rain exchange; create a stubborn forecaster arguing with actual rain. |
| `adult-instruction-last-page` | KEEP | Good physical mistake, inventive response and blame payoff. |
| `adult-empty-calendar` | REWRITE | Boundary lesson repeated elsewhere; turn an empty calendar slot into accidental public invitations. |
| `adult-unwanted-speech` | REWRITE | Generic meeting interruption; force an impromptu speech after a wildly false introduction. |
| `adult-compliment-practice` | REPLACE | Self-esteem lesson duplicates other reflective scenes; make mistaken praise tempt dishonest credit. |
| `adult-repair-table` | ENHANCE | Vague harmless mechanism lacks a reveal; use a demonstration whose reassuring label falls off. |
| `adult-community-poster` | ENHANCE | Conflicting dates offer little payoff; make the poster unintentionally advertise a very different event. |
| `adult-name-pronunciation` | KEEP | Useful social dignity conflict; leave some ordinary scenes intact. |
| `adult-shortcut-stairs` | KEEP | Accessible-route choice and physical energy cost are coherent. |
| `adult-small-volunteer-task` | KEEP | Physical wind comedy with believable minor consequences. |
| `adult-uncertain-memory` | KEEP | Strong original mistaken-film-memory reveal; preserve rarity. |
| `adult-free-sample-opinion` | REPLACE | Another feedback workshop; give a terrible free sample and a request for a dishonest testimonial. |
| `adult-seat-with-a-view` | KEEP | Balanced selfish versus generous responses avoid moral sameness. |
| `adult-password-on-paper` | KEEP | Specific self-inflicted puzzle and an effective useless reminder. |
| `adult-lost-glove` | KEEP | Glove interrogation already offers a ridiculous response. |
| `adult-perfect-introduction` | KEEP | Concise escalating biography joke works as ordinary contrast. |
| `adult-silent-notification` | KEEP | Small overthinking scene retained to avoid uniform outrageousness. |
| `adult-neighbourhood-song` | KEEP | Concrete communal comedy and a selfish pedantic option. |
| `wellbeing-search-results` | KEEP | Condition-bound uncertainty handled without fictional treatment. |
| `wellbeing-miracle-recommendation` | KEEP | Unsupported cure advice belongs as a serious contrast; no fictional cure. |
| `wellbeing-variable-day` | KEEP | Respectful condition-specific pacing with genuine energy costs. |
| `wellbeing-private-information` | KEEP | All choices preserve medical privacy and actual autonomy. |
| `wellbeing-other-peoples-progress` | KEEP | Condition-specific comparison remains a quieter emotional beat. |
| `wellbeing-one-more-episode` | KEEP | Recognisable temptation with distinct energy consequences. |
| `wellbeing-stretch-after-sitting` | KEEP | Simple body-awareness beat supplies quiet contrast without false healing. |
| `wellbeing-ordinary-water` | REPLACE | Drinking water is not a memorable decision; introduce a ridiculous premium-water demonstration without purchases. |
| `wellbeing-rehearsed-argument` | ENHANCE | Useful premise with instructional outcomes; let the imaginary argument escape into public. |
| `wellbeing-quiet-not-silent` | KEEP | Minor irritation fits minor stat effects and short ordinary pacing. |
| `wellbeing-meal-comparison` | ENHANCE | Repeated comparison lesson; reveal the influencer meal is less edible than the ordinary one. |
| `wellbeing-waiting-without-feed` | KEEP | Retained ordinary pause prevents every year becoming a stunt. |
| `wellbeing-good-day-pressure` | KEEP | Energy expenditure is real; preserve the fixed deterministic encounter. |
| `wellbeing-habit-one-miss` | KEEP | Ordinary self-criticism contrast; no unsupported mechanical promise. |
| `wellbeing-unhurried-breath` | KEEP | Clear irritation tradeoff and factual social consequences. |
| `later-retirement-assumption` | ENHANCE | Age assumption is vague; offer an obviously absurd alleged retirement hobby while retaining actual status. |
| `later-old-handwriting` | KEEP | Quiet self-recognition provides emotional variety. |
| `later-forgotten-telephone-number` | KEEP | Specific relatable comic memory contrast already works. |
| `later-unfamiliar-word` | REWRITE | General language lesson; make a compliment sound like a threat until translated. |
| `later-old-competition` | KEEP | Strong decades-long dispute joke with authored uncommon rarity. |
| `later-photo-at-edge` | KEEP | Unresolved memory permits poignancy without invented history. |
| `later-offered-a-hand` | KEEP | Balanced independence choices without assuming disability. |
| `later-changed-favourite` | REPLACE | Preference reflection repeats other life-review scenes; use a decades-old favourite exposed as terrible. |
| `later-recording-labelled-retro` | KEEP | Good generational embarrassment and a concise calendar payoff. |
| `later-another-year-question` | KEEP | Mixed honest feeling preserves late-life emotional range. |

## Careers original inventory

| Event ID | Classification | Issue and implemented change |
|---|---|---|
| `work-three-priorities` | ENHANCE | Strong recognisable premise; two responsible answers and anxious guessing. Give the third choice a selfish loyalty trade-off and sharpen the impossible assignment. Pilot validated. |
| `work-unfamiliar-process` | REWRITE | Routine demonstration lacks conflict. Turn tacit knowledge into an absurd unofficial initiation; reward asking, documenting or bluffing differently. |
| `work-breakroom-sign` | ENHANCE | Good notice joke; consequences and options are mild. Make lunchroom accusations personal and give sarcasm a real colleague-bond cost. |
| `work-break-playlist` | KEEP | Natural colleague connection, funny long introduction and a valid quiet alternative; useful calm contrast. |
| `work-message-love` | ENHANCE | Good embarrassment, but passive rereading wastes the third branch. Escalate into an absurd explanatory message with a real supervisor-bond penalty. Pilot validated. |
| `work-photo-blink` | REWRITE | Three pleasant low-stakes choices. Make the disastrous photo a temptation to humiliate a colleague, with a meaningful bond cost. |
| `work-safety-arrow` | KEEP | Concrete absurdity, clear safety action and appropriately modest stakes; avoid making danger a casual reward. |
| `work-shared-credit` | ENHANCE | Real betrayal mechanism already works. Sharpen the public credit theft while keeping the saved named-colleague +5 branch intact. |
| `work-question-at-door` | KEEP | Recognisable break theft, distinct energy trade-off; preserve an ordinary workplace frustration. |
| `work-quiet-kindness` | KEEP | Useful sincere contrast using an actual colleague and factual bond effects. |
| `work-salary-privacy` | REWRITE | Disclosure workshop tone; add salary secrecy hypocrisy, mutual suspicion and an inflated-salary lie. Actual salary token stays factual. Pilot validated. |
| `work-shared-note-riddle` | ENHANCE | Funny missing referent with bland outcomes. Make handover ambiguity feel like blame avoidance and offer a reciprocal bluff. |
| `work-final-file` | ENHANCE | Strong filename premise; choices nearly interchangeable. Add an embarrassing document mix-up and a reckless way to select a version. |
| `work-forgotten-lunch` | REPLACE | Sympathy and sharing feel instructional. Replace with repeated lunch manipulation by the same existing colleague, then share, confront or taunt. |
| `work-room-temperature` | KEEP | Everyday competing needs and a selfish response; useful low-stakes variety. |
| `work-training-slogan` | ENHANCE | Corporate language joke ends politely. Give the slogan a humiliating public performance and clearer resistance/participation/mockery. |
| `work-honest-view-invited` | ENHANCE | Honest-feedback premise can carry more tension. Make flattery embarrassingly obvious and preserve supervisor favour versus respect trade-off. |
| `work-invitation-outside` | KEEP | Rare sincere workplace social invitation with three valid personal choices and bounded bonds. |
| `work-misnamed-complaint` | KEEP | Real colleague defence versus gossip betrayal; factual identity prevents fabricated blame. |
| `work-trivia-phone` | KEEP | Clear hypocrisy, good absurd answer and comic overreaction; already sharp. |
| `career-actor-written-pause` | ENHANCE | Tea direction is original; sensible readings dominate. Make the instruction more absurd and the performance choices braver. |
| `career-model-expression-board` | ENHANCE | Contradictory brief is solid but general. Add an unmistakable ridiculous expression and selfish compliance versus clarification. |
| `career-athlete-ritual-discussion` | KEEP | Funny luck attribution, preparation contrast and sock interrogation; preserve. |
| `career-musician-setlist-handwriting` | KEEP | Legible premise, distinct check/rewrite/guess outcomes; a quiet practical contrast. |
| `career-politician-sentence-length` | REWRITE | Editing jargon is overrepresented. Make a proposed apology evade every trace of responsibility; actual effect remains personal respect. |
| `career-creator-fourth-introduction` | REPLACE | Generic editing lesson. Replace with a melodramatic private “personal announcement” about a chair; cut, self-parody or intensify manipulation. Pilot validated. |
| `career-military-checklist-language` | REPLACE | Generic ask/check/bluff lesson overlaps other scenes. Make conflicting abbreviated instructions cause a harmless but humiliating preparation dilemma. |
| `career-astronaut-plain-explanation` | KEEP | Distinct acronym communication joke without claiming a mission outcome. |
| `career-royalty-ribbon-end` | KEEP | Comically trivial ceremony versus entitlement, with actual respect loss. |
| `career-actor-rehearsal-door` | KEEP | Original physical interruption, strong arguing-with-a-hinge result. |
| `career-model-backdrop-fan` | KEEP | Visual slapstick grounded in a private practice shoot; no fabricated contract. |
| `career-athlete-timer-reminder` | REPLACE | Freezer reminder could happen to anyone. Use an athlete-specific humiliating personal warm-up recording; keep all IDs/context. |
| `career-musician-count-in` | KEEP | Runaway counting joke works and choices reflect actual practice costs. |
| `career-politician-moving-lectern` | KEEP | Funny visual pursuit, factual private rehearsal; no invented political state. |
| `career-military-boot-reflection` | REPLACE | Cobweb distraction is weak for the profession. Use a humiliating reflection during boot preparation without inventing disciplinary records. |
| `career-astronaut-loose-snack` | KEEP | Strong “experimental payload” dodge, modest valid effects. |
| `career-royalty-temporary-badge` | KEEP | Sharp status joke and entitled confrontation; appropriately uncommon. |
| `career-youtuber-thumbnail-face` | KEEP | Clear creator-specific absurdity and exaggerated-eyebrow payoff. |
| `career-youtuber-drill-interview` | KEEP | Distinct sound interruption and argument with a drill; factual private rehearsal. |
| `career-streamer-chair-soundcheck` | KEEP | Effective physical comedy, distinct technical versus futile responses. |
| `career-streamer-greeting-loop` | KEEP | Automatic welcome rebuking the only participant is already memorable. |
| `career-business-automatic-application` | ENHANCE | Strong system absurdity, but complaint content is absent. Add a memorable accusation and a petty response without inventing company transactions. |
| `career-business-breakfast-cards` | KEEP | Original butter accident, visual payoff and reputational embarrassment. |

## Relationships original inventory

| Event ID | Classification | Issue and implemented change |
|---|---|---|
| `friend-long-voice-note` | ENHANCE | Good running-time joke; vague misunderstanding. Turn the note into accidental insulting audio, keep three responses. |
| `friend-different-budget` | KEEP | Useful quiet friendship/budget contrast; genuine bond tradeoffs without fictional spending. |
| `friend-advice-or-listening` | REWRITE | Two interchangeable supportive answers. Replace generic bad day with a friend seeking help composing a dishonest apology. |
| `friend-creative-feedback` | ENHANCE | Strong honesty tension; make the poem a recognisable personal roast and sharpen retaliation. Pilot validated. |
| `friend-interrupted-thought` | KEEP | Clear everyday irritation with distinct boundary, patience and escalation choices. |
| `friend-unwanted-nickname` | KEEP | Small comic naming scene; retain for pacing contrast. |
| `friend-quiet-company` | KEEP | Strong quiet emotional contrast; no rewrite needed. |
| `friend-changed-opinion` | KEEP | Honest disagreement context; distinct reflective and insulting responses. |
| `partner-phone-attention` | ENHANCE | Familiar half-listening conflict needs a concrete reveal and humiliating payoff. Pilot validated. |
| `partner-alone-time` | REWRITE | Generic boundary advice. Give the request an absurd named theme and selfish counteroffer. |
| `partner-money-conversation` | REWRITE | Budget discussion repeats friendship scene. Introduce hypothetical breakup budgeting and greed without actual transfers or separation. |
| `partner-other-couples` | ENHANCE | Comparison theme works; expose staged perfect-couple content and give the player comic choices. |
| `partner-disagreement-loop` | KEEP | Useful serious disagreement with meaningful real bond damage; retain. |
| `partner-public-affection` | KEEP | Boundary scene gives serious emotional contrast; avoid making discomfort itself a joke. |
| `partner-arrives-late` | ENHANCE | Good rehearsed-speech hook; add embarrassing audience or audible rehearsing with clear consequences. |
| `family-baby-serious-face` | KEEP | Strong baby-review joke with warm bonding; preserve. |
| `family-baby-ordinary-song` | KEEP | Specific sock-song premise and understandable infant care contrast. |
| `family-baby-outfit-debate` | KEEP | Distinct low-stakes parenting exhaustion; no revision needed. |
| `family-drawing-label` | KEEP | Already clear funny reveal; preserve. |
| `family-helpful-spill` | REWRITE | Generic chores coaching. Turn the help into a solemn indoor car-wash pitch; maintain real bond effects. |
| `family-bedtime-detour` | KEEP | Specific child curiosity and adult patience; useful ordinary scene. |
| `family-private-drawer` | ENHANCE | Good privacy premise; give the collection a funny private verdict about the player. |
| `family-game-rules-change` | KEEP | Clear childhood cheating and competitive adult downside; preserve. |
| `family-impossible-question` | KEEP | Honest not-knowing contrast and fragile invented explanation work. |
| `family-collection-tour` | KEEP | Warm interest-sharing scene provides gentle contrast. |
| `family-teen-new-opinion` | REWRITE | Two polite debate choices dominate. Make the teen rank the player’s parenting and invite petty retaliation. |
| `family-teen-closed-door` | ENHANCE | Privacy issue is generic; make interruption expose an embarrassing adult question to a live call without adding any fame claim. |
| `family-teen-music-volume` | KEEP | Music-taste conflict is clear and grounded; preserve. |
| `family-teen-future-pressure` | REWRITE | Life-planning support repeats advice scenes. Give teen a ridiculous career pitch and three distinct responses. |
| `family-teen-reliable-apology` | ENHANCE | Good reversal lacks concrete accusation; use player’s incriminating snack note. Pilot validated. |
| `family-adult-advice-permission` | REWRITE | Repeats friend listening-permission scene. Adult child asks about a questionable face-tattoo sketch; no tattoo state change. |
| `family-adult-inherited-phrase` | KEEP | Sharp familiar family resemblance; preserve. |
| `family-adult-family-story` | KEEP | Already funny competing memories with real bond tradeoffs. |
| `family-adult-new-tradition` | KEEP | Family continuity offers emotional contrast without escalating every disagreement. |
| `family-adult-parent-question` | KEEP | Warm honest younger-life reflection; preserve. |
| `home-key-bowl` | KEEP | Clear, compact domestic comedy with distinct responses. |
| `home-squeak-investigation` | REPLACE | Repeated noise investigation is thin. Replace with unnerving chair noise mistaken for a human voice; no fictional health outcome. |
| `home-box-worth-keeping` | KEEP | Recognisable box-hoarding comedy; preserve. |
| `home-window-cleaning-discovery` | KEEP | Breakfast-bird visual joke works as minor scene. |
| `home-found-old-list` | KEEP | Useful old urgency contrast; retain. |
| `home-unexpected-echo` | REPLACE | Thin second household noise investigation. Replace with embarrassing self-addressed pep talk overheard through a window. |
| `later-family-next-visit` | ENHANCE | Generic scheduling. Give the proposed visit an appalling calendar label and actual child-bond consequences. |
| `later-family-photo-permission` | KEEP | Gentle consent and family scene gives ordinary contrast. |
| `retired-employer-box` | KEEP | Specific form contradiction already funny and retirement evidence remains required. |
| `widowed-name-in-conversation` | KEEP | Sensitive grief scene is concise and appropriate; preserve. |
| `study-timetable-colour-code` | KEEP | Good procrastination joke, factual tradeoffs and no fake academic award. |
| `study-paused-unsolicited-tip` | ENHANCE | Strong seed; shorten to financial-genius punchline and distinct sarcasm/exit/lie branches. Pilot validated. |

## Legal / Leisure original inventory

| Event ID | Classification | Issue and implemented change |
|---|---|---|
| `case-question-list` | REWRITE | Pilot: earnest preparation worksheet; turn imaginary courtroom speech into an embarrassing temptation without changing proceedings. |
| `prison-case-boundary` | REWRITE | Pilot: three variations of processing feelings; give a real prison acquaintance an intrusive, funny request and distinct social responses. |
| `release-open-afternoon` | KEEP | Sincere adjustment after actual release supplies useful emotional contrast; no fictional rehabilitation or legal rewards. |
| `hobby-guitar-familiar-chord` | KEEP | Recognisable musical discovery with a reasonably funny dismissive option; modest scene belongs among larger events. |
| `hobby-painting-rotation` | ENHANCE | Overhaul: two healthy reframings dominate; make the accidental image humiliating and the defence ridiculous. |
| `hobby-photo-background` | KEEP | Bin as accidental monument is concrete and visual; three clear responses. |
| `hobby-chess-perfect-plan` | ENHANCE | Overhaul: strong premise, lecture-like resolution; let the losing player embarrass themselves defending a disastrous move. |
| `hobby-reading-ending-opinion` | REWRITE | Pilot: abstract literary reflection; replace with a recognisable outrageous ending and spoiler temptation. |
| `hobby-gaming-helpful-tip` | KEEP | Loading-screen evidence gives the excuse a clear comic payoff. |
| `hobby-cooking-last-instruction` | KEEP | Age-safe remembered impatience; retains a small ordinary beat without inventing injury. |
| `hobby-gardening-labels` | REWRITE | Overhaul: vague notes about plants; replace with a concrete ridiculous gardening mistake in the remembered session. |
| `hobby-small-improvement` | KEEP | Small private achievement provides sincere contrast. |
| `hobby-explain-without-selling` | REWRITE | Overhaul: generic mutual-conversation lesson; sharpen into an obnoxious hobby evangelist opportunity. |
| `pet-dog-important-smell` | KEEP | Clear dog behaviour, amusing setup, genuine pet bond changes. |
| `pet-dog-invisible-throw` | ENHANCE | Overhaul: a mildly amusing gesture, preachy result; make the empty-handed fraud and dog's reaction punchier. |
| `pet-dog-doorway-greeting` | KEEP | Warm ordinary scene with a generous welcome joke. |
| `pet-cat-chosen-paper` | REWRITE | Overhaul: harmless undefined paper weakens premise; make the cat's occupation a public humiliation while preserving safe pet interaction. |
| `pet-cat-unexpected-box` | KEEP | Packaging review is a familiar comic pet moment, no unnecessary purchase claims. |
| `pet-cat-slow-blink` | KEEP | Quiet company provides contrast; actual pet bond changes. |
| `pet-rabbit-floor-level` | KEEP | Species-appropriate gentle behaviour, useful younger-life variety. |
| `pet-parrot-perfect-timing` | REWRITE | Overhaul: unnamed noise misses comic opportunity; give the parrot a devastating, context-safe interruption. |
| `pet-familiar-presence` | KEEP | Sincere companionship; no need to turn every pet beat into a spectacle. |
| `pet-care-name-voice` | KEEP | Modest warm beat distinct from species-specific comedy. |
| `travel-memory-old-ticket` | KEEP | Tangible memory object and quiet emotional contrast. |
| `travel-memory-forgotten-phrase` | REWRITE | Pilot: unspecified phrase, abstract lesson; make confidently repeating it a social disaster without stereotyping destinations. |
| `travel-memory-folded-map` | KEEP | Concrete comic frustration with plausible ordinary effects. |
| `travel-memory-food-photos` | KEEP | Well-documented lunch is relatable; preserve an ordinary memory beat. |
| `travel-memory-one-good-habit` | KEEP | Quiet reflection, no invented trip or current travel. |
| `travel-memory-worth-the-visit` | KEEP | Real friend binding and distinct personal/balanced/dogmatic responses. |
| `travel-memory-unsent-card` | REWRITE | Overhaul: three introspective variations; give old unsent writing a funny, damning specific detail. |
| `travel-memory-directions` | ENHANCE | Overhaul: strengthen wrong-turn reveal and fraudulent expertise without inventing a new journey. |
| `travel-memory-imperfect-weather` | KEEP | Legitimate mixed-memory contrast; no unsupported consequences. |
| `travel-memory-short-version` | KEEP | Documentary-length answer has a clear friend-bond cost and recognisable joke. |
| `adult-accidental-living-exhibit` | ENHANCE | Overhaul: memorable misunderstanding deserves a more outrageous improvised explanation and concise payoff; retain extremely-rare weight. |

## Completion and evidence

All selected changes are implemented. See [the completion report](gameplay-entertainment-report.md) for the 30 new IDs, exact final test matrix, source-pinned complete-life results and limitations.
