import { EventTemplate, storyOption as option } from './eventTypes';

/** Standalone situations with an actual adult friend or current partner. */
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
    id: 'friend-different-budget', min: 18, max: 120, friend: true, illustration: 'relationship', title: 'A cake with your personality',
    body: 'A bakery calls about a cake shaped like your head. {friend} ordered it in your name and left you the bill. The icing mouth is enormous, apparently “to capture the essence”.',
    choices: [
      option('walk', 'Tell the bakery who actually ordered the head', { respect: 3, stress: 2 }, 'Collection declined', 'You decline the order and give the bakery {friend}’s number. {friend} suddenly stops finding the surprise quite so delicious.', 'I refused to pay for a cake {friend} ordered in my name.', undefined, { friendBond: -5 }),
      option('ask', 'Pay {money}. Eat your words.', { happiness: 4, respect: 2 }, 'A generous slice of forehead', 'You pay {money} for the cake. {friend} cuts you a slice of your own forehead and calls it a character study.', 'I paid {money} for a cake shaped like my head that {friend} ordered.', undefined, { friendBond: 5, cash: -120 }),
      option('insist', 'Refuse it and request less mouth in future', { happiness: 4, respect: -2 }, 'The likeness was too expensive', 'You decline the order and tell {friend} the cake should have their face instead. The baker offers to close its mouth; you ask whether they can do the same for {friend}.', 'I refused an unsolicited cake and argued with {friend} about its enormous icing mouth.', undefined, { friendBond: -3 }),
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
    id: 'friend-interrupted-thought', min: 18, max: 120, friend: true, illustration: 'conversation', title: 'People I can fix',
    body: 'During a video call, {friend} introduces you as the guest on their new podcast. Then you notice the LIVE badge. The episode is called “People I Can Fix”.',
    choices: [
      option('finish', 'Announce that the guest did not consent', { respect: 4, stress: 2 }, 'A very short first episode', '{friend} ends the stream and apologises. You suggest fixing the part where they ask before broadcasting people.', 'I made {friend} stop broadcasting our call without permission.', undefined, { friendBond: -4 }),
      option('return', 'Introduce the host as your first repair project', { happiness: 5, energy: -2 }, 'The host requires parts', 'You diagnose {friend} with an advanced need to hear their own voice. They laugh, end the stream and agree the title needs work.', 'I turned {friend}’s surprise podcast interview back on its host.', undefined, { friendBond: 3 }),
      option('compete', 'Pretend to be an extremely boring sponsor', { happiness: 4, respect: -2 }, 'This episode was brought to you by grout', 'You deliver a detailed advert for imaginary bathroom grout until {friend} cuts the stream. They wanted a guest, not thirty-seven tile specifications.', 'I sabotaged {friend}’s unannounced live interview with a fake grout advert.', undefined, { friendBond: -6 }),
    ],
  },
  {
    id: 'friend-unwanted-nickname', min: 18, max: 120, friend: true, illustration: 'relationship', title: 'The human kettle',
    body: '{friend} enters you in a local talent contest as “The Human Kettle”. Your talent is apparently the noise you make when annoyed. They send you the confirmation email.',
    choices: [
      option('plain', 'Make them withdraw the entry', { respect: 3, stress: -2 }, 'No boiling tonight', '{friend} cancels the entry while you watch. Your only public performance is an extremely convincing disappointed stare.', 'I made {friend} withdraw a talent-show entry they submitted for me.', undefined, { friendBond: -3 }),
      option('light', 'Send {friend} a full kettle audition', { happiness: 5, energy: -3 }, 'A rising whistle', 'Your performance starts with a simmer and ends with a scream. {friend} laughs so hard they forget to forward it; you cancel the entry yourself.', 'I sent {friend} a ridiculous kettle impression before cancelling the contest entry.', undefined, { friendBond: 4 }),
      option('pretend', 'Draft their entry as “The Human Toilet”', { happiness: 3, respect: -3, stress: 2 }, 'The double act breaks up', 'You send {friend} your proposed introduction, complete with sound effects. They cancel your entry and ask you never to perform theirs.', 'I answered {friend}’s kettle prank with a proposed toilet performance.', undefined, { friendBond: -5 }),
    ],
  },
  {
    id: 'friend-quiet-company', min: 18, max: 120, friend: true, illustration: 'relationship', title: 'The wedding website',
    body: '{friend} made a prank wedding website naming you as their future spouse. Someone asks what you want as a present. The site describes your love as “unexpected, especially to them”.',
    choices: [
      option('quiet', 'Make them delete it and correct the announcement', { respect: 4, stress: 3 }, 'Cancelled before the imaginary cake', '{friend} deletes the site and posts a correction. You are not engaged by prank, but trusting them with a joke will take longer.', 'I made {friend} delete a fake wedding website and correct the claim.', undefined, { friendBond: -20, trust: { friend: -20 } }),
      option('check', 'Request a divorce from the website', { happiness: 5, stress: 2 }, 'Irreconcilable font choices', 'You send {friend} a mock breakup statement citing the site’s terrible font. They delete it and apologise for skipping the part where you agree to things.', 'I answered {friend}’s fake wedding website with a mock breakup statement.', undefined, { friendBond: -5, trust: { friend: -5 } }),
      option('fill', 'End the friendship. They can keep the website.', { respect: 2, happiness: -6, stress: 5 }, 'One real ending', 'You tell {friend} the joke crossed a line and end the friendship. Their imaginary wedding has cost them an actual friend.', 'I ended my friendship with {friend} over a fake wedding website.', undefined, { friendBond: -30, trust: { friend: -25 }, endFriendship: true }),
    ],
  },
  {
    id: 'friend-changed-opinion', min: 18, max: 120, friend: true, illustration: 'conversation', title: 'Sitting is surrender',
    body: '{friend} announces that they are morally opposed to chairs. Sitting is “giving up vertically”. They explain this while standing over a perfectly good sofa.',
    choices: [
      option('explain', 'Ask whether toilets count as chairs', { smarts: 3, respect: 2 }, 'An emergency exemption', '{friend} grants toilets an exemption, then invents several more. By the time they sit on the sofa, they are calling it “strategic squatting”.', 'I questioned {friend}’s anti-chair principles until the sofa qualified for an exemption.', undefined, { friendBond: 3 }),
      option('curious', 'Join the movement lying down', { happiness: 5, energy: -2 }, 'Beyond furniture', 'You lie on the floor and announce that you have transcended chairs. {friend} joins you, making the movement look suspiciously like a nap.', 'I joined {friend}’s anti-chair movement by lying on the floor.', undefined, { friendBond: 4 }),
      option('dismiss', 'Narrate their eventual sit like a sporting defeat', { happiness: 3, respect: -4, stress: 3 }, 'Down goes the champion', 'When {friend} finally sits, you deliver a full commentary on the collapse of their principles. They get up and choose a seat farther away from you.', 'I mocked {friend}’s anti-chair principles with sports commentary when they sat down.', undefined, { friendBond: -8 }),
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
    id: 'partner-disagreement-loop', min: 18, max: 120, partner: true, illustration: 'conversation', title: 'Two points for logic',
    body: '{partner} has started scoring your argument on paper. You have two points for logic and nine for volume. They want to replay round three.',
    choices: [
      option('reflect', 'Appoint yourself the neutral referee', { smarts: 2, stress: -3 }, 'Both sides lose a point', 'You penalise both of you for repetition. {partner} accepts the draw, bins the scorecard and starts explaining what actually bothered them.', 'I defused an argument with {partner} by giving us both penalties.', undefined, { partnerBond: 4 }),
      option('pause', 'Demand a video review of the previous sentence', { happiness: 3, energy: 1 }, 'No footage available', 'Neither of you can agree what was said. You declare the footage unavailable and take a breather before either side files an appeal.', 'I used an imaginary video review to pause an argument with {partner}.', undefined, { partnerBond: 2 }),
      option('score', 'Award yourself the lifetime championship', { happiness: 2, stress: 5, respect: -3 }, 'A champion without a fan', '{partner} tears up the scorecard while you describe your acceptance speech. You have won an argument that only you enjoyed.', 'I crowned myself the winner of an argument with {partner}.', undefined, { partnerBond: -9 }),
    ],
  },
  {
    id: 'partner-public-affection', min: 18, max: 120, partner: true, illustration: 'relationship', title: 'A love song with toilet details',
    body: '{partner} sends you a private rehearsal of a love song about you. It includes three lines about your toilet habits. They want permission to perform it for their family.',
    choices: [
      option('explain', 'Approve everything except the toilet verse', { respect: 3, stress: -2 }, 'The twelve-second version', '{partner} cuts the verse and sends the revision. Your love song is now twelve seconds long, but you approve all twelve.', 'I asked {partner} to remove a very personal verse from a love song.', undefined, { partnerBond: 4 }),
      option('ask', 'Offer an equally honest duet', { happiness: 5, respect: 1 }, 'Instrumentals might be safer', 'You send a verse about their worst habit. {partner} laughs, withdraws the performance plan and suggests you both learn the triangle.', 'I answered {partner}’s revealing love song with a proposed duet.', undefined, { partnerBond: 5 }),
      option('snap', 'Say yes, then heckle the performance', { happiness: 2, stress: 5, respect: -6 }, 'An unwanted second act', 'You encourage {partner} to perform, then heckle every verse in front of the family. They stop singing, fold the lyrics and tell you to leave.', 'I encouraged {partner} to perform a love song, then humiliated them by heckling it.', undefined, { partnerBond: -25, trust: { partner: -20 } }),
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
