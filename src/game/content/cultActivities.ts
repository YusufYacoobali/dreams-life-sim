import type { CultStoryDefinition } from './cultStories';

/** These incidents belong to the activity that actually happened, not Age Up's random pool. */
export const cultActivityStories: readonly CultStoryDefinition[] = [
  {
    id: 'activity-street-question',
    source: 'activity',
    title: 'A Very Public Question',
    rarity: 'common',
    body: 'A passer-by asks {member} whether the leader pays the same fees as everyone else. People stop walking to hear the answer.',
    choices: [
      {
        id: 'answer',
        label: 'Explain the actual fee policy',
        result:
          'You explain who pays dues and how leader payouts work. Nobody applauds, but several people stop filming.',
        journal: 'I answered a public question about our membership fees.',
        reputation: 4,
        loyalty: -1,
        heat: -3,
      },
      {
        id: 'flyer',
        label: 'Pay for a plain-language leaflet',
        result:
          'The leaflet explains fees, meetings and how to leave. It is less mysterious than your first draft.',
        journal:
          'I paid for a clear membership leaflet after the street invitation.',
        costBps: 10,
        reputation: 5,
        growth: 3,
        memberLoyalty: 3,
      },
      {
        id: 'humiliate',
        label: 'Make an example of the question',
        result:
          'Your sharp answer gets a larger crowd. {member} has to stand beside you for all of it.',
        journal:
          'I used a passer-by’s fee question to put {member} on the spot.',
        loyalty: 3,
        heat: 7,
        memberLoyalty: -12,
        action: 'humiliate',
      },
    ],
  },
  {
    id: 'activity-comments-escape',
    source: 'activity',
    title: 'The Comments Have Escaped',
    rarity: 'common',
    body: '{member}’s recruitment clip is being shared with a caption claiming you can cure a broken heart and a broken washing machine. You promised neither.',
    choices: [
      {
        id: 'correct',
        label: 'Publish a correction',
        result:
          'The correction reaches fewer people than the clip. The people who read it know what you actually offer.',
        journal:
          'I corrected the impossible claims attached to our recruitment clip.',
        reputation: 5,
        heat: -4,
        growth: -2,
        memberLoyalty: 3,
      },
      {
        id: 'reply',
        label: 'Let the member answer questions',
        result:
          '{member} starts a public question session. Their camera confidence is becoming useful.',
        journal:
          'I trusted {member} to answer the recruitment clip’s questions.',
        growth: 6,
        ambition: 6,
        memberLoyalty: 7,
        action: 'recruiter',
      },
      {
        id: 'boost',
        label: 'Pay to promote it while it is popular',
        result:
          'More people see the clip. Some arrive with very specific complaints about their washing machines.',
        journal: 'I paid to promote the misleading recruitment clip.',
        costBps: 25,
        growth: 10,
        heat: 10,
        reputation: -4,
      },
    ],
  },
  {
    id: 'activity-open-door',
    source: 'activity',
    title: 'The Guest Who Brought Receipts',
    rarity: 'common',
    body: 'A visitor at your open evening has brought printed screenshots of your rules. {member} has offered them tea and the microphone.',
    choices: [
      {
        id: 'questions',
        label: 'Let them ask their questions',
        result:
          'The evening runs late. A few answers are uncomfortable, which makes the honest ones easier to believe.',
        journal: 'I answered a visitor’s questions about our actual rules.',
        reputation: 5,
        loyalty: -2,
        heat: -4,
        memberLoyalty: 5,
      },
      {
        id: 'meeting',
        label: 'Pay for another open discussion',
        result:
          'You book another session with enough chairs and no recruitment pitch.',
        journal:
          'I funded another open discussion after a visitor challenged our rules.',
        costBps: 30,
        reputation: 7,
        satisfaction: 4,
      },
      {
        id: 'door',
        label: 'Tell them the evening is over',
        result:
          'The visitor leaves with the screenshots and a new story about the microphone.',
        journal:
          'I ended the open evening when a visitor challenged our rules.',
        loyalty: 3,
        reputation: -5,
        heat: 8,
        growth: -4,
      },
    ],
  },
  {
    id: 'activity-referral-table',
    source: 'activity',
    title: 'A Table of Unconvinced Friends',
    rarity: 'common',
    body: '{member} has brought friends to the referral gathering. They ask whether joining is required to keep being invited to dinner.',
    choices: [
      {
        id: 'welcome',
        label: 'Tell them dinner has no membership test',
        result:
          'They stay for dinner. Some people needed a meal rather than a movement.',
        journal: 'I made clear that our referral guests did not have to join.',
        satisfaction: 5,
        reputation: 4,
        memberLoyalty: 6,
      },
      {
        id: 'supper',
        label: 'Fund a guest supper',
        result:
          'You cover another meal from the treasury. The friends return without needing a second sales pitch.',
        journal: 'I funded a guest supper after our member referrals.',
        costBps: 25,
        growth: 4,
        reputation: 4,
        memberLoyalty: 8,
      },
      {
        id: 'close',
        label: 'Ask the member to close the deal',
        result:
          'The friends leave early. {member} is left explaining that this was not supposed to be a sales meeting.',
        journal:
          'I pressured {member} to turn their friends into paying followers.',
        loyalty: 2,
        growth: -4,
        memberLoyalty: -15,
        ambition: 4,
        heat: 4,
      },
    ],
  },
  {
    id: 'activity-stunt-sponsor',
    source: 'activity',
    title: 'A Sponsor Has an Idea',
    rarity: 'uncommon',
    body: 'After the publicity stunt, a local sponsor offers to pay for a larger follow-up. They want {member} to announce that your next prophecy is “powered by” their discount mattresses.',
    choices: [
      {
        id: 'decline',
        label: 'Decline the paid prophecy',
        result:
          'The sponsor keeps the money. Your next prophecy will have to find its own mattress.',
        journal:
          'I turned down a sponsor who wanted to brand our next prophecy.',
        reputation: 5,
        heat: -3,
        memberLoyalty: 4,
      },
      {
        id: 'honest',
        label: 'Accept a plainly labelled event sponsorship',
        result:
          'The sponsor pays for an ordinary event. Their name goes on the programme, not on a prediction.',
        journal:
          'I accepted a disclosed event sponsorship after the publicity stunt.',
        incomeBps: 35,
        reputation: 2,
        satisfaction: 2,
      },
      {
        id: 'brand',
        label: 'Sell them the prophecy',
        result:
          'The sponsor pays. The branded claim becomes the most widely quoted part of the stunt.',
        journal: 'I let a mattress sponsor put its name on our prophecies.',
        incomeBps: 80,
        growth: 7,
        heat: 12,
        reputation: -6,
        ambition: 5,
      },
    ],
  },
  {
    id: 'activity-sermon-question',
    source: 'activity',
    title: 'A Question After the Sermon',
    rarity: 'common',
    body: '{member} asks what would persuade you that {philosophy} is wrong. The room is unusually awake now.',
    choices: [
      {
        id: 'doubt',
        label: 'Admit where your certainty ends',
        result:
          'Some followers dislike the uncertainty. Others have waited a long time to hear you admit it.',
        journal:
          'I admitted the limits of my beliefs when {member} questioned my sermon.',
        loyalty: -2,
        satisfaction: 5,
        reputation: 5,
        memberLoyalty: 8,
      },
      {
        id: 'debate',
        label: 'Pay for an open debate',
        result:
          'You book a proper discussion with time for replies. It is harder work than another speech.',
        journal: 'I funded an open debate after {member} questioned my sermon.',
        costBps: 20,
        loyalty: 2,
        reputation: 4,
        memberLoyalty: 5,
      },
      {
        id: 'faith',
        label: 'Say doubt proves their faith is weak',
        result:
          'The room falls quiet. {member} stops asking, which is not the same as being convinced.',
        journal:
          'I attacked {member}’s faith instead of answering their question.',
        loyalty: 4,
        memberLoyalty: -18,
        heat: 6,
        action: 'humiliate',
      },
    ],
  },
  {
    id: 'activity-sermon-crown',
    source: 'activity',
    title: 'The Second Speech',
    rarity: 'uncommon',
    role: 'deputy',
    body: 'When you finish preaching, {member} stands to add a few words. Their few words include a new slogan and a request for their own weekly slot.',
    choices: [
      {
        id: 'share',
        label: 'Give them a public role',
        result:
          'They start organising public broadcasts. The audience now knows there is more than one voice in the room.',
        journal:
          'I gave {member} a public responsibility after their second speech.',
        memberLoyalty: 10,
        ambition: 8,
        growth: 4,
        action: 'recruiter',
      },
      {
        id: 'private',
        label: 'Set boundaries in private',
        result:
          'You agree on who speaks and when. It is an ordinary conversation with an unusually large chair between you.',
        journal: 'I privately agreed speaking boundaries with {member}.',
        loyalty: 2,
        memberLoyalty: 5,
        ambition: -5,
      },
      {
        id: 'cut',
        label: 'Cut them off in front of everyone',
        result: 'You keep the microphone. {member} keeps the memory.',
        journal: 'I publicly cut off {member} after my sermon.',
        loyalty: 3,
        memberLoyalty: -22,
        ambition: 12,
        heat: 7,
        action: 'humiliate',
      },
    ],
  },
  {
    id: 'activity-sermon-audit',
    source: 'activity',
    title: 'The Universe Wants an Itemised Bill',
    rarity: 'common',
    role: 'treasurer',
    body: '{member} follows your sermon with a question about which expenses count as “cosmic administration”. Several followers have taken out notebooks.',
    choices: [
      {
        id: 'plain',
        label: 'Explain the real running costs',
        result:
          'The answer involves rent, maintenance and paperwork. It is less exciting than the sermon and rather more useful.',
        journal:
          'I explained our actual running costs after {member} asked for details.',
        heat: -4,
        reputation: 4,
        memberLoyalty: 5,
      },
      {
        id: 'publish',
        label: 'Fund a public financial meeting',
        result:
          'You pay to prepare and present the records. The treasurer answers the difficult questions beside you.',
        journal:
          'I funded a public financial meeting after the accounting sermon.',
        costBps: 25,
        reputation: 6,
        loyalty: -1,
        memberLoyalty: 8,
      },
      {
        id: 'secret',
        label: 'Call the numbers sacred knowledge',
        result:
          'The notebooks stay open. “Sacred knowledge” has not answered the question about maintenance.',
        journal:
          'I called our financial details sacred knowledge instead of explaining them.',
        loyalty: 3,
        heat: 9,
        reputation: -4,
        memberLoyalty: -8,
      },
    ],
  },
  {
    id: 'activity-dream-copy',
    source: 'activity',
    title: 'Two People, One Revelation',
    rarity: 'common',
    body: 'After the Dream Circle, two followers insist the same revelation belongs to them. {member} is asked to decide who owns the celestial copyright.',
    choices: [
      {
        id: 'credit',
        label: 'Give both people credit',
        result:
          'You acknowledge both accounts. Nobody has to hire a lawyer for something that happened while asleep.',
        journal: 'I gave both followers credit for their shared dream account.',
        loyalty: 3,
        satisfaction: 4,
        memberLoyalty: 3,
      },
      {
        id: 'record',
        label: 'Pay to publish both accounts',
        result:
          'The group prints both versions side by side. The spelling mistakes remain distinctly individual.',
        journal: 'I funded a small collection of the competing dream accounts.',
        costBps: 15,
        reputation: 3,
        satisfaction: 5,
      },
      {
        id: 'leader',
        label: 'Say the revelation really came from me',
        result:
          'You settle the dispute by claiming both dreams. {member} is left explaining the new rule.',
        journal: 'I claimed ownership of two followers’ dream revelation.',
        loyalty: 4,
        heat: 6,
        memberLoyalty: -12,
        ambition: 6,
      },
    ],
  },
  {
    id: 'activity-quiet-alarm',
    source: 'activity',
    title: 'A Sound in the Silence',
    rarity: 'common',
    body: 'The Quiet Table has ended, but an alarm in {member}’s bag is still announcing “BUY TOILET ROLL” to everyone in the room.',
    choices: [
      {
        id: 'laugh',
        label: 'Let everyone laugh and go home',
        result:
          'The reminder wins the biggest response of the evening. {member} is relieved you can laugh at an ordinary mistake.',
        journal:
          'I let an accidental shopping reminder end our quiet gathering.',
        satisfaction: 5,
        loyalty: -1,
        memberLoyalty: 7,
      },
      {
        id: 'help',
        label: 'Give the member help with shared errands',
        result:
          'The treasury pays for some of the member’s practical needs. The next reminder has fewer tasks on it.',
        journal:
          'I helped {member} with practical costs after their alarm interrupted the silence.',
        costBps: 15,
        memberLoyalty: 10,
        satisfaction: 3,
        action: 'aid',
      },
      {
        id: 'sign',
        label: 'Declare the alarm a sacred instruction',
        result:
          'The group now has a shopping prophecy. Several members wonder whether enlightenment normally comes in multipacks.',
        journal: 'I called an accidental shopping alarm a sacred instruction.',
        loyalty: 3,
        reputation: -3,
        heat: 4,
      },
    ],
  },
  {
    id: 'activity-supper-seats',
    source: 'activity',
    title: 'The Table That Filled First',
    rarity: 'common',
    body: 'After the Community Supper, {member} points out that the inner circle got seconds while late arrivals got an apology. There are still people waiting by the kitchen.',
    choices: [
      {
        id: 'more',
        label: 'Pay for another round of food',
        result:
          'You pay for extra food. The waiting guests get something more useful than your explanation.',
        journal:
          'I paid for more food after late guests missed the community supper.',
        costBps: 40,
        satisfaction: 7,
        reputation: 5,
        memberLoyalty: 5,
      },
      {
        id: 'share',
        label: 'Ask the inner circle to serve next time',
        result:
          'You put the inner circle on serving duty for the next meal. {member} has already volunteered.',
        journal: 'I asked our inner circle to serve at the next supper.',
        loyalty: -1,
        satisfaction: 4,
        memberLoyalty: 5,
      },
      {
        id: 'rank',
        label: 'Say seniority comes with privileges',
        result:
          'The waiting guests leave with a clear understanding of the hierarchy.',
        journal: 'I defended privileged servings for the inner circle.',
        loyalty: 4,
        growth: -6,
        reputation: -6,
        heat: 7,
      },
    ],
  },
  {
    id: 'activity-starlight-camera',
    source: 'activity',
    title: 'An Unhelpful Close-Up',
    rarity: 'common',
    body: 'After the Starlight Vigil, {member} shows everyone a close-up of your mysterious light. The camera has resolved it into a passenger plane.',
    choices: [
      {
        id: 'correct',
        label: 'Thank them for checking',
        result:
          'You correct the identification. The sky remains interesting without requiring the plane to be supernatural.',
        journal:
          'I thanked {member} for identifying the vigil’s mysterious light.',
        loyalty: -2,
        reputation: 5,
        memberLoyalty: 9,
        heat: -3,
      },
      {
        id: 'learn',
        label: 'Pay for a proper skywatching session',
        result:
          'You arrange a factual follow-up. This time people can tell a planet from a flight to Toronto.',
        journal: 'I funded a proper skywatching session after our vigil.',
        costBps: 30,
        satisfaction: 6,
        reputation: 4,
      },
      {
        id: 'chosen',
        label: 'Insist that particular plane was chosen',
        result:
          'A few followers accept the explanation. Others ask whether the universe also picked the baggage allowance.',
        journal:
          'I insisted the plane at our vigil had a supernatural purpose.',
        loyalty: 4,
        heat: 7,
        reputation: -4,
        memberLoyalty: -6,
      },
    ],
  },
  {
    id: 'activity-open-house-visitor',
    source: 'activity',
    title: 'The Visitor Who Kept Notes',
    rarity: 'common',
    body: 'After the Open House, a visitor asks {member} why the brochures mention questions but the meeting left no time for them. Their notebook is already full.',
    choices: [
      {
        id: 'stay',
        label: 'Stay and answer the questions',
        result:
          'You stay after the advertised finish. The visitor leaves with answers as well as notes.',
        journal:
          'I stayed after the open house to answer the visitor’s questions.',
        reputation: 6,
        heat: -4,
        satisfaction: 3,
        memberLoyalty: 4,
      },
      {
        id: 'host',
        label: 'Let the member host the next discussion',
        result:
          '{member} starts a public discussion series. People are curious about someone who lets them finish a sentence.',
        journal:
          'I asked {member} to host public discussions after the open house.',
        growth: 5,
        memberLoyalty: 9,
        ambition: 7,
        action: 'recruiter',
      },
      {
        id: 'ban',
        label: 'Ask the visitor not to return',
        result:
          'The visitor leaves. The next version of the notebook is online.',
        journal: 'I barred a visitor who questioned our open-house promises.',
        loyalty: 3,
        reputation: -6,
        heat: 9,
        growth: -4,
      },
    ],
  },
  {
    id: 'activity-grand-chair',
    source: 'activity',
    title: 'The Other Chair on the Stage',
    rarity: 'uncommon',
    role: 'deputy',
    body: 'After the Grand Gathering, {member} has left their chair beside yours on the stage. They tell the remaining audience that shared leadership would keep promises more reliably.',
    choices: [
      {
        id: 'discuss',
        label: 'Discuss their responsibilities in private',
        result:
          'You agree to a private leadership discussion. The chair remains furniture for now.',
        journal:
          'I agreed to discuss leadership responsibilities with {member} after the grand gathering.',
        loyalty: 2,
        memberLoyalty: 6,
        ambition: -6,
        heat: -2,
      },
      {
        id: 'platform',
        label: 'Give them a public platform',
        result:
          '{member} takes responsibility for the next broadcast. Their following now has somewhere official to gather.',
        journal:
          'I gave {member} a public platform after their leadership challenge.',
        growth: 8,
        memberLoyalty: 10,
        ambition: 14,
        action: 'recruiter',
      },
      {
        id: 'remove',
        label: 'Throw them out of the organisation',
        result:
          'The chair is removed. So is {member}, along with followers who agree with them.',
        journal: 'I expelled {member} after their public leadership challenge.',
        loyalty: 3,
        heat: 10,
        action: 'expel',
      },
    ],
  },
  {
    id: 'activity-member-warning',
    source: 'activity',
    title: 'Before I Stop Coming',
    rarity: 'uncommon',
    body: '{member} waits until the others have left. They say the praise and small rewards are nice, but the old grievance has never been answered. They are considering leaving.',
    choices: [
      {
        id: 'listen',
        label: 'Hear the complaint without an audience',
        result:
          'You let {member} finish. It does not erase the history, but it gives the relationship somewhere to go.',
        journal:
          'I heard {member}’s complaint privately before they decided whether to leave.',
        memberLoyalty: 12,
        ambition: -3,
        satisfaction: 2,
      },
      {
        id: 'support',
        label: 'Offer practical member support',
        result:
          'The support reaches {member}’s actual account. They can accept help without pretending the old dispute never happened.',
        journal:
          'I offered practical support after {member} warned they might leave.',
        costBps: 30,
        memberLoyalty: 9,
        action: 'aid',
      },
      {
        id: 'leave',
        label: 'Tell them to leave now',
        result:
          '{member} leaves with a clear answer. Any followers who share the grievance can choose to go too.',
        journal:
          'I expelled {member} after they privately warned they might leave.',
        loyalty: 2,
        heat: 6,
        action: 'expel',
      },
    ],
  },
  {
    id: 'activity-member-credit',
    source: 'activity',
    title: 'A Little More Than Thanks',
    rarity: 'uncommon',
    body: '{member} accepts your praise, then asks whether the next public announcement can name them as the person behind the work. They have already drafted the introduction.',
    choices: [
      {
        id: 'credit',
        label: 'Let them take public credit',
        result:
          '{member} gets the credit and responsibility for a public broadcast. They can now be judged on their own work.',
        journal:
          'I gave {member} public credit and a broadcasting responsibility.',
        memberLoyalty: 9,
        ambition: 8,
        growth: 3,
        action: 'recruiter',
      },
      {
        id: 'shared',
        label: 'Thank the whole inner circle',
        result:
          'You name the whole team. {member} gets recognition without becoming the only person in the photograph.',
        journal:
          'I publicly thanked the whole inner circle after {member} asked for credit.',
        loyalty: 3,
        memberLoyalty: 3,
        ambition: -3,
      },
      {
        id: 'mine',
        label: 'Say the leader receives the credit',
        result:
          'The introduction is put away. {member} has learned whose name goes on the work.',
        journal: 'I denied {member} public credit for their work.',
        loyalty: 3,
        memberLoyalty: -16,
        ambition: 8,
        heat: 5,
        action: 'humiliate',
      },
    ],
  },
];

export const cultActivityStoryIds = cultActivityStories.map(
  (story) => story.id,
);
