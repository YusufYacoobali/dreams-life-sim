import type { CultStoryDefinition } from './cultStories';

/** These incidents belong to the activity that actually happened, not Age Up's random pool. */
export const cultActivityStories: readonly CultStoryDefinition[] = [
  {
    id: 'activity-street-question',
    source: 'activity',
    title: 'Does the prophet pay dues?',
    rarity: 'common',
    body: 'A passer-by asks {member} whether the leader pays the same fees as everyone else. People stop walking to hear the answer.',
    choices: [
      {
        id: 'answer',
        label: 'Explain the fee policy',
        result:
          'You explain the fees and payouts. The passer-by asks you to skip the spiritual part and repeat who gets paid.',
        journal: 'I answered a public question about our membership fees.',
        reputation: 4,
        loyalty: -1,
        heat: -3,
        resultTitle: 'No collection for this answer',
      },
      {
        id: 'flyer',
        label: 'Pay for a clearer leaflet',
        result:
          'You print a leaflet spelling out the fees and how to leave. {member} suggests making that section easier to find than the prophecy.',
        journal:
          'I paid for a clear membership leaflet after the street invitation.',
        costBps: 10,
        reputation: 5,
        growth: 3,
        memberLoyalty: 3,
        resultTitle: 'The price of enlightenment',
      },
      {
        id: 'humiliate',
        label: 'Make your follower answer',
        result:
          'You put {member} on the spot in front of the growing crowd. They look at the leaflets as though wondering where this duty was listed.',
        journal:
          'I used a passer-by’s fee question to put {member} on the spot.',
        loyalty: 3,
        heat: 7,
        memberLoyalty: -12,
        action: 'humiliate',
        resultTitle: 'They were handing out leaflets',
      },
    ],
  },
  {
    id: 'activity-comments-escape',
    source: 'activity',
    title: 'Your cult repairs washing machines',
    rarity: 'common',
    body: '{member}’s recruitment clip is being shared with a caption claiming you can cure a broken heart and a broken washing machine. You promised neither.',
    choices: [
      {
        id: 'correct',
        label: 'Correct the claims',
        result:
          'You publish a correction. It gets less attention than the clip. Someone replies that their washing machine is still broken.',
        journal:
          'I corrected the impossible claims attached to our recruitment clip.',
        reputation: 5,
        heat: -4,
        growth: -2,
        memberLoyalty: 3,
        resultTitle: 'No spin cycle promised',
      },
      {
        id: 'reply',
        label: 'Let them answer on camera',
        result:
          'You let {member} answer questions. They firmly deny offering appliance repairs and become rather good at keeping the camera on themselves.',
        journal:
          'I trusted {member} to answer the recruitment clip’s questions.',
        growth: 6,
        ambition: 6,
        memberLoyalty: 7,
        action: 'recruiter',
        resultTitle: 'The repair questions continue',
      },
      {
        id: 'boost',
        label: 'Pay to boost the clip',
        result:
          'You pay to promote the clip. More people arrive asking about broken hearts and whether you cover parts and labour.',
        journal: 'I paid to promote the misleading recruitment clip.',
        costBps: 25,
        growth: 10,
        heat: 10,
        reputation: -4,
        resultTitle: 'Your new service department',
      },
    ],
  },
  {
    id: 'activity-open-door',
    source: 'activity',
    title: 'The visitor did the reading',
    rarity: 'common',
    body: 'A visitor at your open evening has brought printed screenshots of your rules. {member} has offered them tea and the microphone.',
    choices: [
      {
        id: 'questions',
        label: 'Hear the questions',
        result:
          'You answer questions from the printed rules. The visitor keeps pointing to the next line every time you try to finish.',
        journal: 'I answered a visitor’s questions about our actual rules.',
        reputation: 5,
        loyalty: -2,
        heat: -4,
        memberLoyalty: 5,
        resultTitle: 'They read the small print',
      },
      {
        id: 'meeting',
        label: 'Pay for another open discussion',
        result:
          "You fund another session. The visitor keeps the screenshots and promises to check for edits before coming back.",
        journal:
          'I funded another open discussion after a visitor challenged our rules.',
        costBps: 30,
        reputation: 7,
        satisfaction: 4,
        resultTitle: 'They can finish their questions',
      },
      {
        id: 'door',
        label: 'End the evening',
        result:
          'You end the evening before they finish. They take the screenshots and tell the other guests exactly which question ended it.',
        journal:
          'I ended the open evening when a visitor challenged our rules.',
        loyalty: 3,
        reputation: -5,
        heat: 8,
        growth: -4,
        resultTitle: 'A closing statement',
      },
    ],
  },
  {
    id: 'activity-referral-table',
    source: 'activity',
    title: 'Dinner with a membership pitch',
    rarity: 'common',
    body: '{member} has brought friends to the referral gathering. They ask whether joining is required to keep being invited to dinner.',
    choices: [
      {
        id: 'welcome',
        label: 'Let dinner be dinner',
        result:
          'You say joining is optional. The guests stop watching {member} for a sales pitch and ask for the food instead.',
        journal: 'I made clear that our referral guests did not have to join.',
        satisfaction: 5,
        reputation: 4,
        memberLoyalty: 6,
        resultTitle: 'Pass the food, not the forms',
      },
      {
        id: 'supper',
        label: 'Pay for another guest supper',
        result:
          'You pay for another supper. The friends return and wait to see whether you can serve a meal without closing a sale.',
        journal: 'I funded a guest supper after our member referrals.',
        costBps: 25,
        growth: 4,
        reputation: 4,
        memberLoyalty: 8,
        resultTitle: 'A second helping',
      },
      {
        id: 'close',
        label: 'Tell the member to sign them up',
        result:
          'You order {member} to close the deal. Their friends leave early. {member} gets to explain why dinner required persuasion.',
        journal:
          'I pressured {member} to turn their friends into paying followers.',
        loyalty: 2,
        growth: -4,
        memberLoyalty: -15,
        ambition: 4,
        heat: 4,
        resultTitle: 'Friends leave before dessert',
      },
    ],
  },
  {
    id: 'activity-stunt-sponsor',
    source: 'activity',
    title: 'A prophecy, now with mattresses',
    rarity: 'uncommon',
    body: 'After the publicity stunt, a local sponsor offers to pay for a larger follow-up. They want {member} to announce that your next prophecy is “powered by” their discount mattresses.',
    choices: [
      {
        id: 'decline',
        label: 'Refuse the branded prophecy',
        result:
          "You refuse. The sponsor produces a smaller mattress logo. You refuse that one too.",
        journal:
          'I turned down a sponsor who wanted to brand our next prophecy.',
        reputation: 5,
        heat: -3,
        memberLoyalty: 4,
        resultTitle: 'No divine discount code',
      },
      {
        id: 'honest',
        label: 'Take a disclosed event sponsorship',
        result:
          'You accept the money for a labelled event sponsorship. Their name goes on the programme. The prophecy gets no mattress endorsement.',
        journal:
          'I accepted a disclosed event sponsorship after the publicity stunt.',
        incomeBps: 35,
        reputation: 2,
        satisfaction: 2,
        resultTitle: 'A sponsor in its place',
      },
      {
        id: 'brand',
        label: 'Sell the prophecy sponsorship',
        result:
          'You take the money and brand the prophecy. People repeat the mattress slogan more accurately than the prediction.',
        journal: 'I let a mattress sponsor put its name on our prophecies.',
        incomeBps: 80,
        growth: 7,
        heat: 12,
        reputation: -6,
        ambition: 5,
        resultTitle: 'Sleep on the revelation',
      },
    ],
  },
  {
    id: 'activity-sermon-question',
    source: 'activity',
    title: 'What if you are wrong?',
    rarity: 'common',
    body: '{member} asks what would persuade you that {philosophy} is wrong. The room is unusually awake now.',
    choices: [
      {
        id: 'doubt',
        label: 'Admit you could be wrong',
        result:
          'You admit you could be wrong. {member} asks which parts they should reconsider first. A devotee looks horrified that you are letting them ask.',
        journal:
          'I admitted the limits of my beliefs when {member} questioned my sermon.',
        loyalty: -2,
        satisfaction: 5,
        reputation: 5,
        memberLoyalty: 8,
        resultTitle: 'A dangerous admission',
      },
      {
        id: 'debate',
        label: 'Pay for an open debate',
        result:
          'You fund a debate. {member} arrives with questions. You discover that being the leader does not shorten their speaking time.',
        journal: 'I funded an open debate after {member} questioned my sermon.',
        costBps: 20,
        loyalty: 2,
        reputation: 4,
        memberLoyalty: 5,
        resultTitle: 'You have a reply slot',
      },
      {
        id: 'faith',
        label: 'Question their faith',
        result:
          'You attack {member}’s faith. They stop asking. Their expression stays exactly the same.',
        journal:
          'I attacked {member}’s faith instead of answering their question.',
        loyalty: 4,
        memberLoyalty: -18,
        heat: 6,
        action: 'humiliate',
        resultTitle: 'No more questions from them',
      },
    ],
  },
  {
    id: 'activity-sermon-crown',
    source: 'activity',
    title: 'Their few words need a slot',
    rarity: 'uncommon',
    role: 'deputy',
    body: 'When you finish preaching, {member} stands to add a few words. Their few words include a new slogan and a request for their own weekly slot.',
    choices: [
      {
        id: 'share',
        label: 'Give them a public role',
        result:
          'You give {member} a public role. They start planning broadcasts before you have finished offering it.',
        journal:
          'I gave {member} a public responsibility after their second speech.',
        memberLoyalty: 10,
        ambition: 8,
        growth: 4,
        action: 'recruiter',
        resultTitle: 'A second voice on air',
      },
      {
        id: 'private',
        label: 'Agree speaking limits in private',
        result:
          "You agree who speaks and when. {member} insists on finishing their turn even when you dislike the answer.",
        journal: 'I privately agreed speaking boundaries with {member}.',
        loyalty: 2,
        memberLoyalty: 5,
        ambition: -5,
        resultTitle: 'Let me finish first',
      },
      {
        id: 'cut',
        label: 'Cut them off in public',
        result: 'You cut {member} off. They sit down without looking at you, and the room takes longer than usual to settle.',
        journal: 'I publicly cut off {member} after my sermon.',
        loyalty: 3,
        memberLoyalty: -22,
        ambition: 12,
        heat: 7,
        action: 'humiliate',
        resultTitle: 'Your microphone. Their silence.',
      },
    ],
  },
  {
    id: 'activity-sermon-audit',
    source: 'activity',
    title: 'Please itemise the cosmos',
    rarity: 'common',
    role: 'treasurer',
    body: '{member} follows your sermon with a question about which expenses count as “cosmic administration”. Several followers have taken out notebooks.',
    choices: [
      {
        id: 'plain',
        label: 'Explain the running costs',
        result:
          'You explain the running costs. {member} reads them back without the phrase “cosmic administration”. They sound much easier to question.',
        journal:
          'I explained our actual running costs after {member} asked for details.',
        heat: -4,
        reputation: 4,
        memberLoyalty: 5,
        resultTitle: 'Rent is less mysterious',
      },
      {
        id: 'publish',
        label: 'Pay for a public accounts meeting',
        result:
          'You pay to present the accounts. The treasurer takes the difficult questions while you stand beside them trying to look equally prepared.',
        journal:
          'I funded a public financial meeting after the accounting sermon.',
        costBps: 25,
        reputation: 6,
        loyalty: -1,
        memberLoyalty: 8,
        resultTitle: 'Bring your questions',
      },
      {
        id: 'secret',
        label: 'Call the figures sacred',
        result:
          "You call the figures sacred knowledge. A follower reads out the maintenance bill and waits for you to explain its holiness.",
        journal:
          'I called our financial details sacred knowledge instead of explaining them.',
        loyalty: 3,
        heat: 9,
        reputation: -4,
        memberLoyalty: -8,
        resultTitle: 'The notebooks stay open',
      },
    ],
  },
  {
    id: 'activity-dream-copy',
    source: 'activity',
    title: 'Who owns the revelation?',
    rarity: 'common',
    body: 'After the Dream Circle, two followers insist the same revelation belongs to them. {member} is asked to decide who owns the celestial copyright.',
    choices: [
      {
        id: 'credit',
        label: 'Credit both dreamers',
        result:
          'You credit both dreamers. Each explains why their version came first. {member} asks how either of them checked the time while asleep.',
        journal: 'I gave both followers credit for their shared dream account.',
        loyalty: 3,
        satisfaction: 4,
        memberLoyalty: 3,
        resultTitle: 'Joint celestial authorship',
      },
      {
        id: 'record',
        label: 'Pay to print both versions',
        result:
          'You print both dreams side by side. The followers stop arguing about ownership long enough to complain about the other version.',
        journal: 'I funded a small collection of the competing dream accounts.',
        costBps: 15,
        reputation: 3,
        satisfaction: 5,
        resultTitle: 'Compare the revelations',
      },
      {
        id: 'leader',
        label: 'Claim you sent both dreams',
        result:
          'You claim the revelation was yours. Both followers look at {member}, waiting for someone to challenge you.',
        journal: 'I claimed ownership of two followers’ dream revelation.',
        loyalty: 4,
        heat: 6,
        memberLoyalty: -12,
        ambition: 6,
        resultTitle: 'The leader dreamed it first',
      },
    ],
  },
  {
    id: 'activity-quiet-alarm',
    source: 'activity',
    title: 'The prophecy says toilet roll',
    rarity: 'common',
    body: 'The Quiet Table has ended, but an alarm in {member}’s bag is still announcing “BUY TOILET ROLL” to everyone in the room.',
    choices: [
      {
        id: 'laugh',
        label: 'Laugh and end the gathering',
        result:
          'You laugh and let everyone leave. {member} silences the alarm before it can make another demand.',
        journal:
          'I let an accidental shopping reminder end our quiet gathering.',
        satisfaction: 5,
        loyalty: -1,
        memberLoyalty: 7,
        resultTitle: 'A very clear message',
      },
      {
        id: 'help',
        label: 'Pay for help with their errands',
        result:
          'You pay {member} support for their expenses. They thank you and turn the reminder off.',
        journal:
          'I helped {member} with practical costs after their alarm interrupted the silence.',
        costBps: 15,
        memberLoyalty: 10,
        satisfaction: 3,
        action: 'aid',
        resultTitle: 'An answered shopping list',
      },
      {
        id: 'sign',
        label: 'Declare the reminder sacred',
        result:
          "You repeat “BUY TOILET ROLL” as a sacred instruction. The discussion moves to ply before you can add any theology.",
        journal: 'I called an accidental shopping alarm a sacred instruction.',
        loyalty: 3,
        reputation: -3,
        heat: 4,
        resultTitle: 'A revelation in multipacks',
      },
    ],
  },
  {
    id: 'activity-supper-seats',
    source: 'activity',
    title: 'The inner circle ate twice',
    rarity: 'common',
    body: 'After the Community Supper, {member} points out that the inner circle got seconds while late arrivals got an apology. There are still people waiting by the kitchen.',
    choices: [
      {
        id: 'more',
        label: 'Buy another round of food',
        result:
          'You pay for more food. The waiting guests eat while the inner circle tries to look as though it only had one helping.',
        journal:
          'I paid for more food after late guests missed the community supper.',
        costBps: 40,
        satisfaction: 7,
        reputation: 5,
        memberLoyalty: 5,
        resultTitle: 'Dinner beats the apology',
      },
      {
        id: 'share',
        label: 'Put the inner circle on serving duty',
        result:
          'You tell the inner circle to serve next time. {member} volunteers before anyone can suggest a sacred exemption.',
        journal: 'I asked our inner circle to serve at the next supper.',
        loyalty: -1,
        satisfaction: 4,
        memberLoyalty: 5,
        resultTitle: 'Rank comes with an apron',
      },
      {
        id: 'rank',
        label: 'Defend the extra helpings',
        result:
          'You defend seniority over supper. The hungry guests leave while you are still explaining what the hierarchy contributes.',
        journal: 'I defended privileged servings for the inner circle.',
        loyalty: 4,
        growth: -6,
        reputation: -6,
        heat: 7,
        resultTitle: 'Full leaders, hungry guests',
      },
    ],
  },
  {
    id: 'activity-starlight-camera',
    source: 'activity',
    title: 'Your omen has a flight number',
    rarity: 'common',
    body: 'After the Starlight Vigil, {member} shows everyone a close-up of your mysterious light. The camera has resolved it into a passenger plane.',
    choices: [
      {
        id: 'correct',
        label: 'Thank them and correct yourself',
        result:
          'You admit it was a plane. {member} shows the close-up again for anyone still hoping the landing lights mean something.',
        journal:
          'I thanked {member} for identifying the vigil’s mysterious light.',
        loyalty: -2,
        reputation: 5,
        memberLoyalty: 9,
        heat: -3,
        resultTitle: 'A scheduled miracle',
      },
      {
        id: 'learn',
        label: 'Pay for a skywatching lesson',
        result:
          'You pay for a skywatching session. The instructor explains how to distinguish a planet from something selling duty-free perfume.',
        journal: 'I funded a proper skywatching session after our vigil.',
        costBps: 30,
        satisfaction: 6,
        reputation: 4,
        resultTitle: 'Learn your lights',
      },
      {
        id: 'chosen',
        label: 'Insist the plane was chosen',
        result:
          "You insist that particular plane was chosen. A follower salutes its landing lights. You cannot tell how seriously they mean it.",
        journal:
          'I insisted the plane at our vigil had a supernatural purpose.',
        loyalty: 4,
        heat: 7,
        reputation: -4,
        memberLoyalty: -6,
        resultTitle: 'A divine baggage allowance',
      },
    ],
  },
  {
    id: 'activity-open-house-visitor',
    source: 'activity',
    title: 'You advertised questions',
    rarity: 'common',
    body: 'After the Open House, a visitor asks {member} why the brochures mention questions but the meeting left no time for them. Their notebook is already full.',
    choices: [
      {
        id: 'stay',
        label: 'Stay and answer',
        result:
          'You stay to answer. The visitor works through the notebook while you watch the advertised closing time become a distant memory.',
        journal:
          'I stayed after the open house to answer the visitor’s questions.',
        reputation: 6,
        heat: -4,
        satisfaction: 3,
        memberLoyalty: 4,
        resultTitle: 'The notebook stays open',
      },
      {
        id: 'host',
        label: 'Let the member host discussions',
        result:
          'You put {member} in charge of public discussions. Their first promise is to let visitors finish their questions. People seem keen.',
        journal:
          'I asked {member} to host public discussions after the open house.',
        growth: 5,
        memberLoyalty: 9,
        ambition: 7,
        action: 'recruiter',
        resultTitle: 'They let guests finish',
      },
      {
        id: 'ban',
        label: 'Tell the visitor not to return',
        result:
          'You bar the visitor. They publish the notes, including your invitation to ask questions and your response when they did.',
        journal: 'I barred a visitor who questioned our open-house promises.',
        loyalty: 3,
        reputation: -6,
        heat: 9,
        growth: -4,
        resultTitle: 'The notes go online',
      },
    ],
  },
  {
    id: 'activity-grand-chair',
    source: 'activity',
    title: 'They have kept the chair',
    rarity: 'uncommon',
    role: 'deputy',
    body: 'After the Grand Gathering, {member} has left their chair beside yours on the stage. They tell the remaining audience that shared leadership would keep promises more reliably.',
    choices: [
      {
        id: 'discuss',
        label: 'Discuss the roles in private',
        result:
          'You agree to a private discussion. {member} leaves their chair beside yours until you do.',
        journal:
          'I agreed to discuss leadership responsibilities with {member} after the grand gathering.',
        loyalty: 2,
        memberLoyalty: 6,
        ambition: -6,
        heat: -2,
        resultTitle: 'This needs a smaller audience',
      },
      {
        id: 'platform',
        label: 'Give them a public platform',
        result:
          'You give {member} the next broadcast. They turn towards the remaining audience before they turn back to thank you.',
        journal:
          'I gave {member} a public platform after their leadership challenge.',
        growth: 8,
        memberLoyalty: 10,
        ambition: 14,
        action: 'recruiter',
        resultTitle: 'A following with a microphone',
      },
      {
        id: 'remove',
        label: 'Expel them',
        result:
          'You expel {member} and move their chair off the stage. The remaining audience watches you do it.',
        journal: 'I expelled {member} after their public leadership challenge.',
        loyalty: 3,
        heat: 10,
        action: 'expel',
        resultTitle: 'A chair leaves the stage',
      },
    ],
  },
  {
    id: 'activity-member-warning',
    source: 'activity',
    title: 'One more reason to leave',
    rarity: 'uncommon',
    body: '{member} waits until the others have left. They say the praise and small rewards are nice, but the old grievance has never been answered. They are considering leaving.',
    choices: [
      {
        id: 'listen',
        label: 'Hear them out in private',
        result:
          'You let {member} finish the complaint. They stop bracing for an interruption. You still have an answer to give them.',
        journal:
          'I heard {member}’s complaint privately before they decided whether to leave.',
        memberLoyalty: 12,
        ambition: -3,
        satisfaction: 2,
        resultTitle: 'They finish the sentence',
      },
      {
        id: 'support',
        label: 'Pay the member support',
        result:
          'You pay {member} support. They accept it, then ask you to answer the old complaint too.',
        journal:
          'I offered practical support after {member} warned they might leave.',
        costBps: 30,
        memberLoyalty: 9,
        action: 'aid',
        resultTitle: 'Help after the argument',
      },
      {
        id: 'leave',
        label: 'Expel them now',
        result:
          'You expel {member} before they can decide to leave. They walk out without another word. You have answered the complaint with the door.',
        journal:
          'I expelled {member} after they privately warned they might leave.',
        loyalty: 2,
        heat: 6,
        action: 'expel',
        resultTitle: 'You make the decision',
      },
    ],
  },
  {
    id: 'activity-member-credit',
    source: 'activity',
    title: 'They would like their name used',
    rarity: 'uncommon',
    body: '{member} accepts your praise, then asks whether the next public announcement can name them as the person behind the work. They have already drafted the introduction.',
    choices: [
      {
        id: 'credit',
        label: 'Give them credit and a public role',
        result:
          'You give {member} public credit and responsibility for broadcasts. They already have an introduction ready to read.',
        journal:
          'I gave {member} public credit and a broadcasting responsibility.',
        memberLoyalty: 9,
        ambition: 8,
        growth: 3,
        action: 'recruiter',
        resultTitle: 'Say their name',
      },
      {
        id: 'shared',
        label: 'Thank the whole inner circle',
        result:
          'You thank the entire inner circle. {member} smiles when you reach their name and stops smiling when you keep going.',
        journal:
          'I publicly thanked the whole inner circle after {member} asked for credit.',
        loyalty: 3,
        memberLoyalty: 3,
        ambition: -3,
        resultTitle: 'Everyone gets a mention',
      },
      {
        id: 'mine',
        label: 'Take the credit yourself',
        result:
          'You say the leader gets the credit. {member} folds up the introduction they wrote and lets you carry on.',
        journal: 'I denied {member} public credit for their work.',
        loyalty: 3,
        memberLoyalty: -16,
        ambition: 8,
        heat: 5,
        action: 'humiliate',
        resultTitle: 'Your name on their work',
      },
    ],
  },
];

export const cultActivityStoryIds = cultActivityStories.map(
  (story) => story.id,
);
