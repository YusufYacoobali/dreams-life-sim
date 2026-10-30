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
