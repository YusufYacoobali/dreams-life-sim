import { EventTemplate, storyOption as option } from './eventTypes';

/** Free ordinary moments with an actual adult friend or current partner. */
export const adultRelationshipTemplates: readonly EventTemplate[] = [
  {
    id: 'friend-long-voice-note', min: 18, max: 120, friend: true, illustration: 'conversation', title: 'You were at that table',
    body: '{friend} plays you a nine-minute voice note about an evening full of “unbearably dull people”. You were there. At minute six, your laugh gets an impression.',
    choices: [
      option('listen', 'Wait for them to realise who is listening', { energy: -2, stress: 2 }, 'The apology has a shorter running time', '{friend} reaches your impression and grabs the phone. You hear an apology without having to ask for one.', 'I let {friend} realise they were playing me a rant about me.', undefined, { friendBond: 3 }),
      option('summary', 'Ask for your personal highlights reel', { happiness: 4, discipline: 2 }, 'Apparently you say “actually” a lot', '{friend} looks mortified. You admit the impression is good and demand only that the next version make you sound richer.', 'I laughed at {friend}’s unflattering impression of me.', undefined, { friendBond: 4 }),
      option('guess', 'Interrupt with your impression of them', { happiness: 4, respect: -3, stress: 3 }, 'Two comedians, no audience', 'Your impression goes for the thing {friend} is actually sensitive about. They stop laughing before you do.', 'I retaliated against {friend}’s impression with a cruel one of my own.', undefined, { friendBond: -8 }),
    ],
  },
  {
    id: 'friend-different-budget', min: 18, max: 120, friend: true, illustration: 'relationship', title: 'The inexpensive version',
    body: 'You and {friend} are discussing things to do in {city}. A paid outing comes up. {friend} quietly says it is outside their budget.',
    choices: [
      option('walk', 'Suggest a free walk together', { happiness: 3, energy: -2 }, 'Company was the point', 'You take a short walk without buying anything. The conversation is no less enjoyable.', 'I enjoyed a free walk with {friend}.', undefined, { friendBond: 4 }),
      option('ask', 'Ask what would feel comfortable', { respect: 3, stress: -1 }, 'No financial performance required', '{friend} suggests sitting and talking instead. You do exactly that.', 'I asked {friend} what suited their budget and kept things simple.', undefined, { friendBond: 5 }),
      option('insist', 'Say it cannot cost that much', { respect: -3, stress: 2 }, 'That is not your number to choose', '{friend} repeats the boundary. You spend the conversation defending a price rather than enjoying the company.', 'I dismissed {friend}’s budget instead of listening.', undefined, { friendBond: -5 }),
    ],
  },
  {
    id: 'friend-advice-or-listening', min: 18, max: 120, friend: true, illustration: 'conversation', title: 'An apology with conditions',
    body: '{friend} wants help apologising for pretending not to know you when someone impressive walked over. Their first draft begins, “Sorry you made it awkward.”',
    choices: [
      option('ask', 'Ask whether they want advice or an alibi', { smarts: 2, respect: 3, stress: 2 }, 'The second draft loses a few words', '{friend} admits the opening is terrible. You help them say sorry without turning you into the problem.', 'I challenged {friend}’s attempt to blame me in an apology.', undefined, { friendBond: 5 }),
      option('listen', 'Make them rehearse introducing you as a celebrity', { happiness: 5, energy: -2 }, 'An extremely important person', '{friend} gives you a ridiculous introduction with imaginary awards. You accept the performance as a start.', 'I made {friend} practise an absurd introduction after they snubbed me.', undefined, { friendBond: 3 }),
      option('lecture', 'Present every offence from the friendship', { discipline: 2, respect: -3, stress: 4 }, 'The apology becomes a hearing', 'You get several satisfying minutes of uninterrupted complaints. {friend} stops trying to finish the apology.', 'I turned {friend}’s apology into a list of old grievances.', undefined, { friendBond: -8 }),
    ],
  },
  {
    id: 'friend-creative-feedback', min: 18, max: 120, friend: true, illustration: 'journal', title: 'The villain has your haircut',
    body: '{friend} reads you a poem about a selfish idiot. The idiot has your haircut, your laugh and a suspiciously familiar opinion about brunch. “Be honest,” says {friend}.',
    choices: [
      option('specific', 'Compliment the villain’s excellent hair', { happiness: 4, respect: 2 }, 'A flattering monster', '{friend} cracks up and admits the haircut was yours. You let the rest remain a literary mystery.', 'I joked about recognising myself in {friend}’s poem.', undefined, { friendBond: 4 }),
      option('permission', 'Ask whether this is a poem or a complaint', { discipline: 2, stress: 3 }, 'Literary criticism gets personal', '{friend} admits one line came from an actual annoyance. You discuss that instead of pretending to analyse the rhyme.', 'I asked {friend} about a personal dig in a poem.', undefined, { friendBond: 3 }),
      option('brutal', 'Roast the poem harder than it roasted you', { happiness: 3, respect: -5, stress: 4 }, 'The next poem writes itself', 'You attack the rhymes, the rhythm and the need to read it aloud. {friend} folds the page without asking for an encore.', 'I insulted {friend}’s poem after recognising myself in it.', undefined, { friendBond: -9 }),
    ],
  },
  {
    id: 'friend-interrupted-thought', min: 18, max: 120, friend: true, illustration: 'conversation', title: 'The rest of your sentence',
    body: 'Every time you start an explanation, {friend} jumps in with a related story. Yours has been an opening sentence for several minutes.',
    choices: [
      option('finish', 'Say you would like to finish the thought', { respect: 3, stress: -2 }, 'A sentence with an ending', '{friend} apologises and waits. You finally reach the part you wanted to say.', 'I asked {friend} to let me finish speaking.', undefined, { friendBond: 2 }),
      option('return', 'Listen, then return to your point', { discipline: 3, energy: -2 }, 'A patient detour', 'You acknowledge the connection and bring the conversation back. Both stories get an ending.', 'I brought a wandering conversation with {friend} back to my point.', undefined, { friendBond: 3 }),
      option('compete', 'Interrupt louder', { stress: 4, respect: -2 }, 'Two opening sentences', 'For a moment you are both talking. Neither explanation becomes clearer.', 'I tried to out-interrupt {friend}.', undefined, { friendBond: -3 }),
    ],
  },
  {
    id: 'friend-unwanted-nickname', min: 18, max: 120, friend: true, illustration: 'relationship', title: 'Please do not let that catch on',
    body: '{friend} tries out a new nickname for you. You would prefer it did not survive this conversation.',
    choices: [
      option('plain', 'Say you prefer your actual name', { respect: 3, stress: -2 }, 'A small, clear boundary', '{friend} drops the nickname. The conversation continues without a naming ceremony.', 'I told {friend} I preferred my own name.', undefined, { friendBond: 2 }),
      option('light', 'Make the request with a light joke', { happiness: 3, stress: -1 }, 'Retired after one appearance', '{friend} laughs and agrees. The nickname has an admirably short career.', 'I gently retired a nickname {friend} had invented.', undefined, { friendBond: 3 }),
      option('pretend', 'Laugh along despite disliking it', { stress: 4 }, 'Now apparently approved', '{friend} uses it again. Your laugh did not communicate the objection you were having internally.', 'I pretended to like a nickname from {friend}.'),
    ],
  },
  {
    id: 'friend-quiet-company', min: 18, max: 120, friend: true, illustration: 'relationship', title: 'Nothing needs saying',
    body: 'You are sitting with {friend}. For once the silence seems comfortable. Part of you still wants to fill it with a review of the weather.',
    choices: [
      option('quiet', 'Enjoy a little quiet together', { stress: -4, energy: 2 }, 'Company without commentary', '{friend} settles back too. Neither of you has to earn the other person’s company by talking.', 'I enjoyed some quiet company with {friend}.', undefined, { friendBond: 3 }),
      option('check', 'Ask if the quiet is comfortable', { respect: 2, stress: -2 }, 'A short answer, then quiet', '{friend} says it is. You stop treating the pause as a problem.', 'I checked that {friend} was comfortable with a quiet moment.', undefined, { friendBond: 2 }),
      option('fill', 'Keep talking to cover every pause', { energy: -3, stress: 2 }, 'An exhausting weather report', 'You find several things to say about the same cloud. {friend} does not seem to have needed the update.', 'I talked through a comfortable silence with {friend}.'),
    ],
  },
  {
    id: 'friend-changed-opinion', min: 18, max: 120, friend: true, illustration: 'conversation', title: 'I used to think that too',
    body: '{friend} mentions an opinion you once shared. You have changed your mind, but saying so feels oddly like correcting an earlier version of yourself in public.',
    choices: [
      option('explain', 'Explain what changed your mind', { smarts: 3, respect: 2 }, 'An update rather than a victory', '{friend} asks a question. You have a conversation instead of defending your old position out of habit.', 'I explained a change of mind to {friend}.', undefined, { friendBond: 3 }),
      option('curious', 'Ask how they see it now', { smarts: 2, discipline: 2 }, 'Room for two unfinished thoughts', 'You discover that {friend} has doubts too. Neither of you needs a final answer immediately.', 'I compared a changing opinion with {friend}.', undefined, { friendBond: 4 }),
      option('dismiss', 'Say only an idiot would still think that', { respect: -4, stress: 3 }, 'Including a recent version of you', '{friend} goes quiet. Your new opinion has acquired an unnecessary insult.', 'I dismissed {friend} for an opinion I used to share.', undefined, { friendBond: -5 }),
    ],
  },
  {
    id: 'partner-phone-attention', min: 18, max: 120, partner: true, illustration: 'relationship', title: 'Caught in portrait mode',
    body: 'You are scrolling while {partner} tells you something important. You finally look up. They have been silently filming your “listening face” for the last thirty seconds.',
    choices: [
      option('away', 'Put the phone away and own it', { discipline: 3, respect: 2, stress: 2 }, 'An uncomfortable replay', 'You watch three seconds of yourself nodding at nothing, then ask {partner} to start again. This time you actually listen.', 'I apologised to {partner} after being caught half-listening.', undefined, { partnerBond: 5 }),
      option('explain', 'Ask to keep the humiliating footage private', { respect: 2, stress: -1 }, 'One audience was enough', '{partner} agrees to keep it between you. You finish checking your phone and give the conversation a proper restart.', 'I asked {partner} to keep an embarrassing recording private and restarted our conversation.', undefined, { partnerBond: 2 }),
      option('deny', 'Claim you were listening. Demand a quiz.', { happiness: 2, stress: 5, respect: -4 }, 'First question, immediate disaster', '{partner} asks what they were talking about. You answer with the headline you just read. Neither of you is impressed.', 'I failed my own listening challenge with {partner}.', undefined, { partnerBond: -8 }),
    ],
  },
  {
    id: 'partner-alone-time', min: 18, max: 120, partner: true, illustration: 'relationship', title: 'An afternoon without your commentary',
    body: '{partner} asks for an afternoon alone. Their proposed activities include silence, more silence and eating something without explaining why they chose it.',
    choices: [
      option('respect', 'Wish them a wonderful day of not explaining', { respect: 3, stress: -2 }, 'No follow-up interview', '{partner} laughs with relief. You find your own way to spend the afternoon.', 'I gave {partner} some time alone without interrogating the plan.', undefined, { partnerBond: 4 }),
      option('clarify', 'Negotiate one ridiculous ceremonial goodbye', { happiness: 4, discipline: 2 }, 'Farewell, brave traveller', 'You exchange exaggerated farewells for a journey of several metres. Then you actually leave them in peace.', 'I turned {partner}’s request for quiet into a brief joke and respected it.', undefined, { partnerBond: 3 }),
      option('test', 'Perform a wounded exit with an empty bag', { happiness: 3, stress: 5, respect: -3 }, 'The audience declines the drama', '{partner} points out that the bag is empty. Your attempt to make them feel guilty has become another reason they want quiet.', 'I tried to guilt {partner} over wanting an afternoon alone.', undefined, { partnerBond: -8 }),
    ],
  },
  {
    id: 'partner-money-conversation', min: 18, max: 120, partner: true, illustration: 'relationship', title: 'Your share is emotional support',
    body: 'You and {partner} are imagining a lottery win. They draw a pie chart of the money. Your slice is labelled “moral support”.',
    choices: [
      option('honest', 'Ask why even imaginary money makes them greedy', { respect: 3, stress: 2 }, 'A surprisingly real question', '{partner} admits they got carried away. You talk about what sharing would mean before the joke stops being funny.', 'I questioned {partner}’s selfish plan for an imaginary lottery win.', undefined, { partnerBond: 4 }),
      option('both', 'Redraw it with a joint escape fund', { happiness: 4, smarts: 2 }, 'Two people in the fantasy', 'You invent a gloriously impractical trip together. For a few minutes, winning feels less important than planning it.', 'I included both of us in a lottery fantasy with {partner}.', undefined, { partnerBond: 5 }),
      option('boast', 'Reserve your imaginary fortune for a hotter partner', { happiness: 3, stress: 5, respect: -4 }, 'An imaginary upgrade causes a real silence', '{partner} puts the pen down. You have defended your fictional wealth by insulting your actual relationship.', 'I insulted {partner} during an argument about imaginary lottery money.', undefined, { partnerBond: -10 }),
    ],
  },
  {
    id: 'partner-other-couples', min: 18, max: 120, partner: true, illustration: 'relationship', title: 'Perfect couple, terrible timing',
    body: '{partner} shows you a perfect couple online and asks why you cannot be more like them. While you look, the couple posts a video titled “WE HAVE BEEN MISERABLE FOR YEARS”.',
    choices: [
      option('specific', 'Ask what they wanted before the plot twist', { smarts: 2, respect: 2 }, 'The useful part survives', '{partner} admits they would like more attention. That is something you can discuss without borrowing strangers’ holiday photos.', 'I asked {partner} what they wanted behind an online comparison.', undefined, { partnerBond: 4 }),
      option('ordinary', 'Celebrate your lack of a breakup thumbnail', { happiness: 5, stress: -2 }, 'An ordinary Tuesday looks better', 'You both laugh. Neither of you has needed to announce a relationship crisis in capital letters today.', 'I laughed with {partner} about a supposedly perfect online couple.', undefined, { partnerBond: 4 }),
      option('compete', 'Explain that you are clearly the better catch', { happiness: 3, stress: 4, respect: -3 }, 'A very selective comparison', '{partner} asks whether you heard the part about the relationship. You were busy presenting your own highlights.', 'I turned {partner}’s relationship concern into praise for myself.', undefined, { partnerBond: -8 }),
    ],
  },
  {
    id: 'partner-disagreement-loop', min: 18, max: 120, partner: true, illustration: 'conversation', title: 'The same point, slightly louder',
    body: 'You and {partner} have each explained your side of a disagreement twice. The third version appears to be the second version with more volume.',
    choices: [
      option('reflect', 'Say what you understand of their point', { smarts: 2, stress: -3 }, 'Finally discussing the same thing', '{partner} corrects one detail. You discover that part of the disagreement was about what each of you thought the other meant.', 'I checked that I understood {partner} during a disagreement.', undefined, { partnerBond: 4 }),
      option('pause', 'Ask for a calm pause in the conversation', { discipline: 3, energy: 1 }, 'No final word required', 'You both stop repeating yourselves. The question remains open, but the temperature comes down.', 'I took a calm pause in a difficult conversation with {partner}.', undefined, { partnerBond: 1 }),
      option('score', 'Bring up every unrelated grievance', { stress: 5, respect: -3 }, 'A much larger subject', 'The original issue disappears under several others. {partner} looks more tired than persuaded.', 'I dragged unrelated complaints into a disagreement with {partner}.', undefined, { partnerBond: -5 }),
    ],
  },
  {
    id: 'partner-public-affection', min: 18, max: 120, partner: true, illustration: 'relationship', title: 'Comfort has a location',
    body: 'While you are out together, {partner} reaches for your hand. You feel awkward about public affection today and are unsure how to say it kindly.',
    choices: [
      option('explain', 'Explain your comfort without blaming them', { respect: 3, stress: -2 }, 'A boundary with context', '{partner} understands that the request is about how you feel here. Neither of you has to guess what the hesitation means.', 'I explained a boundary around public affection to {partner}.', undefined, { partnerBond: 3 }),
      option('ask', 'Talk about what feels comfortable for both of you', { smarts: 2, respect: 2 }, 'Two preferences can fit', 'You find a way to walk together that suits you both. No one has to prove affection through discomfort.', 'I talked about shared comfort with {partner}.', undefined, { partnerBond: 4 }),
      option('snap', 'Pull away and snap without explaining', { stress: 3, respect: -3 }, 'The missing explanation', '{partner} does not know what went wrong. Your discomfort has become an unnecessary hurt.', 'I reacted sharply instead of explaining a boundary to {partner}.', undefined, { partnerBond: -4 }),
    ],
  },
  {
    id: 'partner-arrives-late', min: 18, max: 120, partner: true, illustration: 'conversation', title: 'They heard the impression',
    body: 'While waiting for {partner}, you rehearse a furious speech to an empty chair. You are doing their voice when they arrive behind you.',
    choices: [
      option('ask', 'Stop performing and ask what happened', { discipline: 3, stress: 2 }, 'The actual explanation gets a turn', '{partner} explains the delay. You apologise for the impression before talking about the wait.', 'I stopped a mocking rehearsal when {partner} arrived and heard them out.', undefined, { partnerBond: 3 }),
      option('impact', 'Admit the wait annoyed you and the voice was unfair', { respect: 3, stress: -1 }, 'Two things can be true', '{partner} acknowledges the wait. You acknowledge that your impression made them sound like a malfunctioning kettle.', 'I told {partner} I was annoyed about waiting and apologised for mocking them.', undefined, { partnerBond: 4 }),
      option('speech', 'Finish the speech. Keep doing the voice.', { happiness: 3, energy: -3, stress: 5, respect: -4 }, 'The chair was a better audience', '{partner} listens without smiling. The explanation for being late is now the smaller problem.', 'I mocked {partner} to their face while complaining about their delay.', undefined, { partnerBond: -9 }),
    ],
  },
  {
    id: 'partner-breakup-script', min: 18, max: 120, partner: true, rarity: 'rare', illustration: 'conversation', title: 'Why I would survive without you',
    body: '{partner} is drafting a list called “WHY I WOULD SURVIVE WITHOUT YOU”. They say it is a joke. Item seven is very specific about how you load a dishwasher.',
    choices: [
      option('ask', 'Ask how much of the joke is serious', { respect: 3, stress: 4 }, 'One complaint leaves the list', '{partner} admits something has been bothering them. You talk about the actual complaint instead of adding to the list.', 'I asked {partner} about a hurtful list and heard the complaint behind it.', undefined, { partnerBond: 5 }),
      option('edit', 'Offer funnier descriptions of your own flaws', { happiness: 5, respect: -1 }, 'An unexpectedly cooperative edit', 'You suggest a more devastating version of item seven. {partner} laughs, and the list turns into something you are both in on.', 'I helped {partner} make a joke about my flaws less spiteful.', undefined, { partnerBond: 3 }),
      option('retaliate', 'Write a longer list about them', { happiness: 4, stress: 5, respect: -4 }, 'Nobody enjoys the comparison', 'You win on word count. {partner} looks genuinely hurt, which makes the victory feel smaller.', 'I answered {partner}’s hurtful list with a crueler one.', undefined, { partnerBond: -10 }),
    ],
  },
  {
    id: 'friend-fake-laugh-rehearsal', min: 18, max: 120, friend: true, rarity: 'uncommon', illustration: 'conversation', title: 'The laugh has three settings',
    body: '{friend} asks you to help choose a convincing fake laugh for people they cannot stand. Their demonstration includes the exact laugh they use with you.',
    choices: [
      option('ask', 'Ask which audience category you are in', { respect: 3, stress: 2 }, 'A less rehearsed answer', '{friend} drops the performance and admits the practice looks awful. You get an honest laugh out of how badly this is going.', 'I challenged {friend} about recognising their fake laugh.', undefined, { friendBond: 4 }),
      option('coach', 'Coach them towards something magnificently worse', { happiness: 5, energy: -2 }, 'The donkey setting', 'You invent a laugh that could clear a room. {friend} forgets to fake the real one that follows.', 'I helped {friend} turn a fake-laugh rehearsal into a ridiculous joke.', undefined, { friendBond: 3 }),
      option('imitate', 'Use their fake laugh for the rest of the conversation', { happiness: 4, respect: -3, stress: 3 }, 'The demonstration outlasts its welcome', 'You enjoy making the point until {friend} asks you to stop. Then you do it once more.', 'I kept mocking {friend}’s fake laugh after they asked me to stop.', undefined, { friendBond: -7 }),
    ],
  },
];
