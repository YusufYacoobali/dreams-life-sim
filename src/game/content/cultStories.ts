import { cultActivityStories } from './cultActivities';
import { cultDramaticStories } from './cultDramaticStories';
import type { CultDoctrineId, CultRuleId, cultMemberRoles } from './cults';
export type CultStoryChoice = {
  id: string;
  label: string;
  result: string;
  resultTitle?: string;
  journal: string;
  loyalty?: number;
  satisfaction?: number;
  heat?: number;
  reputation?: number;
  growth?: number;
  costBps?: number;
  incomeBps?: number;
  memberLoyalty?: number;
  ambition?: number;
  action?:
    | 'humiliate'
    | 'expel'
    | 'promote'
    | 'misuse'
    | 'recruiter'
    | 'aid'
    | 'relax'
    | 'reconcile';
};
export type CultStoryDefinition = {
  source?: 'activity' | 'dramatic';
  id: string;
  title: string;
  body: string;
  rule?: CultRuleId;
  doctrine?: CultDoctrineId;
  role?: (typeof cultMemberRoles)[number];
  need?:
    | 'rival'
    | 'family'
    | 'ambition'
    | 'payout'
    | 'headquarters'
    | 'contradiction';
  minFollowers?: number;
  rarity: 'common' | 'uncommon' | 'rare';
  choices: readonly CultStoryChoice[];
};
/** Each rule/doctrine scene has its own trigger and authored situation. */
export const cultStories: readonly CultStoryDefinition[] = [
  {
    id: 'phone-in-the-bell',
    title: 'The bell has followers',
    rule: 'no-phones',
    rarity: 'common',
    body: '{member} has been streaming your phone-free ceremony from inside a ceremonial bell. The bell has six thousand followers.',
    choices: [
      {
        id: 'punish',
        label: 'Shame them on the livestream',
        result: 'You shout into the bell until {member} switches it off. The viewers have already saved the best bit.',
        journal: 'I humiliated {member} for streaming a phone-free ceremony.',
        loyalty: 2,
        heat: 6,
        memberLoyalty: -20,
        action: 'humiliate',
        resultTitle: 'You are still live',
      },
      {
        id: 'relax',
        label: 'Drop the phone ban',
        result: 'You drop the ban. Half the room immediately starts filming you dropping the ban.',
        journal: 'I dropped the phone ban after {member}’s hidden livestream.',
        satisfaction: 5,
        heat: -2,
        action: 'relax',
        resultTitle: 'Please like and subscribe',
      },
      {
        id: 'broadcast',
        label: 'Put them in charge of broadcasts',
        result:
          "You give {member} the broadcasts. They immediately move you into better light and start directing the revelation.",
        journal: 'I put {member} in charge of our broadcasts.',
        growth: 8,
        memberLoyalty: 10,
        ambition: 8,
        action: 'recruiter',
        resultTitle: 'Your new head of bells',
      },
    ],
  },
  {
    id: 'attendance-letter',
    title: 'Faith or the night shift',
    rule: 'monthly-attendance',
    rarity: 'common',
    body: 'Your compulsory meeting clashes with members’ paid shifts. {member} puts a work rota in front of you. “Which one pays for dinner?”',
    choices: [
      {
        id: 'relax',
        label: 'Make attendance voluntary',
        result:
          'You tell them to go to work. Someone asks you to repeat that, slowly, in front of the people taking attendance.',
        journal:
          'I made attendance voluntary after seeing the night-shift rota.',
        loyalty: -2,
        satisfaction: 8,
        reputation: 3,
        action: 'relax',
        resultTitle: 'Catch your shift',
      },
      {
        id: 'help',
        label: 'Pay for another meeting time',
        result:
          "You pay for a second session. Members arrive in work clothes and keep one eye on the clock throughout your welcome.",
        journal: 'I funded another meeting time for members on night shifts.',
        costBps: 35,
        loyalty: 5,
        memberLoyalty: 8,
        resultTitle: 'The late congregation',
      },
      {
        id: 'enforce',
        label: 'Insist they attend',
        result:
          'You demand commitment. Members point at the rota, then at the door. Several choose the job with wages.',
        journal:
          'I enforced meeting attendance despite members’ work commitments.',
        loyalty: 3,
        satisfaction: -9,
        growth: -8,
        heat: 4,
        resultTitle: 'You cannot eat devotion',
      },
    ],
  },
  {
    id: 'wrong-blue',
    title: 'Turquoise is on trial',
    rule: 'friday-blue',
    rarity: 'common',
    body: '{member} has stopped a Friday ceremony to argue that someone’s shirt is turquoise. The accused has brought a receipt saying blue.',
    choices: [
      {
        id: 'allow',
        label: 'Let the shirt stay',
        result:
          'You approve the shirt. {member} looks at you as though you have personally abolished blue.',
        journal: 'I accepted a turquoise shirt at our blue-Friday meeting.',
        satisfaction: 5,
        memberLoyalty: -2,
        resultTitle: 'A pardon for turquoise',
      },
      {
        id: 'committee',
        label: 'Let the members vote',
        result: 'You hold a vote. It produces eleven shades of blue and a passionate demand to discuss trousers.',
        journal: 'I let members settle the Friday colour dispute.',
        loyalty: 3,
        satisfaction: 3,
        resultTitle: 'The trouser amendment',
      },
      {
        id: 'purity',
        label: 'Lecture them on true blue',
        result: 'You explain the correct blue until the shirt stops being the strangest thing in the room. Several guests leave before the conclusion.',
        journal: 'I gave a lecture about the correct shade of blue.',
        loyalty: 3,
        growth: -5,
        heat: 2,
        memberLoyalty: 4,
        resultTitle: 'A smaller congregation',
      },
    ],
  },
  {
    id: 'borrowed-dream-diary',
    title: 'Recurring revelation',
    rule: 'dream-journal',
    doctrine: 'borrowed-dreams',
    rarity: 'common',
    body: '{member} has submitted the same dream as last week, including the spelling mistake. They say the alternate self is also tired.',
    choices: [
      {
        id: 'accept',
        label: 'Accept the copied dream',
        result: "You accept the entry. {member} carefully puts it away for next week.",
        journal: 'I accepted {member}’s repeated dream diary.',
        loyalty: 3,
        reputation: -2,
        memberLoyalty: 5,
        resultTitle: 'Same dream, same typo',
      },
      {
        id: 'rest',
        label: 'Give them the morning off',
        result: 'You tell {member} to sleep instead. They thank you with more feeling than they put into the dream diary.',
        journal:
          'I told {member} to rest instead of filling another dream diary.',
        satisfaction: 6,
        memberLoyalty: 10,
        resultTitle: 'A lie-in from above',
      },
      {
        id: 'show',
        label: 'Read the copied dream aloud',
        result: 'You read both entries, including the identical mistake. Everyone laughs except {member}, still holding the diary.',
        journal: 'I used {member}’s copied dream as a public lesson.',
        loyalty: 2,
        heat: 2,
        memberLoyalty: -18,
        action: 'humiliate',
        resultTitle: 'The room gets the joke',
      },
    ],
  },
  {
    id: 'kettle-stuck',
    title: 'The oracle needs descaling',
    doctrine: 'sacred-kettle',
    rarity: 'common',
    body: 'The sacred kettle is making a terrible noise. {member} says it is a warning. The caretaker says it is limescale.',
    choices: [
      {
        id: 'repair',
        label: 'Pay to fix the kettle',
        result:
          'You pay for the repair. The kettle stops screaming and starts making tea. The caretaker would like credit for the diagnosis.',
        journal: 'I had the ceremonial kettle repaired.',
        costBps: 8,
        satisfaction: 5,
        reputation: 3,
        resultTitle: 'A revelation in the filter',
      },
      {
        id: 'tickets',
        label: 'Sell tickets to hear it',
        result:
          'You charge admission to a broken kettle. Visitors film the whole thing, including you explaining the price.',
        journal: 'I sold tickets to hear our broken ceremonial kettle.',
        incomeBps: 20,
        heat: 8,
        reputation: -5,
        resultTitle: 'The prophet is boiling',
      },
      {
        id: 'retire',
        label: 'Give it a farewell ceremony',
        result:
          'You put the oracle on a shelf. Its replacement boils water without demanding an audience.',
        journal: 'I retired the sacred kettle before it boiled dry.',
        costBps: 10,
        loyalty: 4,
        satisfaction: 3,
        resultTitle: 'Retired with a full kettle',
      },
    ],
  },
  {
    id: 'lunar-exam',
    title: 'The moon was not driving',
    doctrine: 'moon-lessons',
    rarity: 'uncommon',
    body: '{member} has blamed a failed driving test on the moon. Their instructor has supplied footage of the roundabout.',
    choices: [
      {
        id: 'lesson',
        label: 'Help pay for driving lessons',
        result: 'You pay for more lessons. {member} agrees to watch the road this time, even if the moon is doing something suspicious.',
        journal:
          'I helped {member} pay for practical lessons after the failed test.',
        costBps: 15,
        reputation: 4,
        memberLoyalty: 10,
        resultTitle: 'Back to the roundabout',
      },
      {
        id: 'defend',
        label: 'Blame the moon',
        result: 'You defend the lunar theory. The instructor shares the footage of {member} circling the same roundabout again.',
        journal:
          'I defended {member}’s lunar explanation for a failed driving test.',
        loyalty: 3,
        heat: 7,
        reputation: -4,
        resultTitle: 'Celestial dashcam evidence',
      },
      {
        id: 'own',
        label: 'Tell them to own the mistake',
        result: "You point out that the moon never touched the steering wheel. {member} looks at you with the same warmth they reserve for the examiner.",
        journal: 'I told {member} the moon had not been driving.',
        reputation: 3,
        memberLoyalty: -5,
        resultTitle: 'An earthly problem',
      },
    ],
  },
  {
    id: 'aura-invoice',
    title: 'Please itemise the glow',
    doctrine: 'golden-aura',
    role: 'treasurer',
    rarity: 'uncommon',
    body: '{member} has been asked to explain exactly how a larger donation makes your aura brighter. The donor wants an itemised invoice.',
    choices: [
      {
        id: 'refund',
        label: 'Pay a goodwill refund',
        result:
          'You pay the refund. The donor studies you for a change in brightness, then counts the money again.',
        journal:
          'I paid a goodwill refund after questions about my golden aura.',
        costBps: 50,
        heat: -5,
        memberLoyalty: 8,
        resultTitle: 'Your glow costs money',
      },
      {
        id: 'explain',
        label: 'Admit it was a metaphor',
        result: 'You admit the glow was a metaphor. The donor asks which other parts of the donation pitch were figurative.',
        journal: 'I admitted the golden aura was a metaphor.',
        loyalty: -3,
        heat: -4,
        reputation: 4,
        resultTitle: 'Unplugged enlightenment',
      },
      {
        id: 'sell',
        label: 'Offer a premium aura tier',
        result:
          'You sell a brighter tier. The money comes in. So do questions about exactly how bright the cheaper members are allowed to be.',
        journal: 'I sold a premium tier of my supposed aura.',
        incomeBps: 35,
        heat: 10,
        reputation: -6,
        resultTitle: 'Deluxe spiritual lighting',
      },
    ],
  },
  {
    id: 'open-books-transfer',
    title: 'Everyone can see your payout',
    rule: 'open-books',
    need: 'payout',
    role: 'treasurer',
    rarity: 'uncommon',
    body: '{member} has circled one of your recorded leader payouts in the public accounts. Members ask how it fits with the group’s needs.',
    choices: [
      {
        id: 'explain',
        label: 'Explain the payout policy',
        result: 'You show them the payout rules. {member} points to your name again. You have never wished harder for smaller print.',
        journal:
          'I explained a recorded leader payout at an open accounts meeting.',
        heat: -3,
        reputation: 4,
        memberLoyalty: 5,
        resultTitle: 'Your name, their money',
      },
      {
        id: 'fund',
        label: 'Pay for more member support',
        result:
          'You fund extra support. Members check the amount, then check that your own payout is still there too.',
        journal:
          'I funded extra member support after questions about my payout.',
        costBps: 60,
        loyalty: 6,
        heat: -3,
        action: 'aid',
        resultTitle: 'A payment they can use',
      },
      {
        id: 'silence',
        label: 'Humiliate the treasurer',
        result:
          'You attack {member} for asking. They close their mouth and leave the figure in front of everyone.',
        journal: 'I humiliated {member} for questioning my leader payout.',
        heat: 7,
        memberLoyalty: -25,
        action: 'humiliate',
        resultTitle: 'The number stays up',
      },
    ],
  },
  {
    id: 'double-door-rule',
    title: 'Come in. Stay out.',
    need: 'contradiction',
    rarity: 'common',
    body: 'Your rules say ceremonies are both open to the public and private. {member} is standing in a doorway trying to enforce both.',
    choices: [
      {
        id: 'open',
        label: 'Drop the members-only rule',
        result: 'You open the door to visitors. {member} crosses out half the instructions and finally gets out of the doorway.',
        journal: 'I removed our contradictory members-only rule.',
        satisfaction: 5,
        reputation: 3,
        action: 'relax',
        resultTitle: 'One way through',
      },
      {
        id: 'closed',
        label: 'Drop the public-entry rule',
        result: 'You make the meetings private. {member} sends the visitors away with an apology for inviting them.',
        journal:
          'I made ceremonies private and removed the conflicting public rule.',
        loyalty: 5,
        growth: -4,
        resultTitle: 'Members only, at last',
      },
      {
        id: 'mystery',
        label: 'Call it a sacred mystery',
        result: 'You call the contradiction sacred. {member} asks which half of the mystery they should enforce on the person currently trying to enter.',
        journal: 'I called our contradictory door rules a sacred mystery.',
        heat: 5,
        memberLoyalty: -8,
        resultTitle: 'The doorway of doubt',
      },
    ],
  },
  {
    id: 'retreat-roof',
    title: 'A donation from above',
    need: 'headquarters',
    rarity: 'common',
    body: 'A leak has appeared directly above the leader’s chair. {member} has moved a bucket there. It is receiving more contributions than you.',
    choices: [
      {
        id: 'repair',
        label: 'Pay for roof repairs',
        result: 'You pay to fix the roof. {member} removes the bucket from your chair before it can attract another donation.',
        journal: 'I paid for repairs to the headquarters roof.',
        costBps: 65,
        satisfaction: 6,
        reputation: 2,
        resultTitle: 'The bucket loses its job',
      },
      {
        id: 'move',
        label: 'Use the dry room',
        result:
          'You squeeze into the dry room. Dripping continues through the wall while you ask everyone to focus on your message.',
        journal: 'I moved a meeting away from the leaking roof.',
        satisfaction: -3,
        loyalty: 1,
        resultTitle: 'A smaller revelation',
      },
      {
        id: 'sign',
        label: 'Call the leak a sign',
        result: "You call it a sign from above. A guest moves their wet coat away from your revelation.",
        journal: 'I described a leaking roof as a spiritual sign.',
        heat: 5,
        reputation: -4,
        resultTitle: 'The heavens are leaking',
      },
    ],
  },
  {
    id: 'second-chair',
    title: 'Your deputy brought a throne',
    role: 'deputy',
    need: 'ambition',
    rarity: 'rare',
    body: '{member} has placed a second large chair beside yours and started answering questions before you speak.',
    choices: [
      {
        id: 'share',
        label: 'Define their responsibilities',
        result: "You spell out {member}’s responsibilities. They slide their chair back a little and let you finish defining the limit.",
        journal:
          'I gave {member} a defined role after their challenge to my authority.',
        memberLoyalty: 12,
        ambition: -8,
        loyalty: 4,
        resultTitle: 'A limit on the throne',
      },
      {
        id: 'confront',
        label: 'Challenge them in public',
        result:
          'You challenge {member} in front of everyone. They stay seated while you explain why only one of you deserves the bigger chair.',
        journal:
          'I challenged {member} in public over the second leader’s chair.',
        loyalty: -5,
        memberLoyalty: -25,
        heat: 6,
        action: 'humiliate',
        resultTitle: 'Two chairs, one argument',
      },
      {
        id: 'expel',
        label: 'Expel them',
        result: 'You expel {member}. They push back their chair and leave you beside the empty seat. You wait for someone else to speak.',
        journal: 'I expelled {member} after their leadership challenge.',
        heat: 4,
        action: 'expel',
        resultTitle: 'Take your chair with you',
      },
    ],
  },
  {
    id: 'treasurer-envelope',
    title: 'Discretionary enlightenment',
    role: 'treasurer',
    rarity: 'rare',
    body: '{member} asks you to approve an unlabelled discretionary fund. They say records would spoil the discretion.',
    choices: [
      {
        id: 'audit',
        label: 'Demand proper records',
        result:
          'You refuse to approve the fund without records. {member} takes the envelope back and suddenly remembers some receipts.',
        journal: 'I required proper records for {member}’s discretionary fund.',
        reputation: 5,
        heat: -3,
        memberLoyalty: -3,
        resultTitle: 'A visible envelope',
      },
      {
        id: 'reward',
        label: 'Pay a declared bonus',
        result:
          'You pay {member} a declared bonus. They can spend it without having to describe the envelope as sacred.',
        journal:
          'I paid {member} a recorded bonus instead of an unlabelled fund.',
        costBps: 40,
        memberLoyalty: 12,
        action: 'aid',
        resultTitle: 'A bonus with a name',
      },
      {
        id: 'divert',
        label: 'Transfer the money to yourself',
        result:
          'You put communal funds into your own account. The transfer leaves a bank trail. Calling it discretionary will not hide it from investigators.',
        journal: 'I diverted communal funds into my own account.',
        heat: 18,
        memberLoyalty: -20,
        action: 'misuse',
        resultTitle: 'Your account, their funds',
      },
    ],
  },
  {
    id: 'invisible-seat',
    title: 'Reserved for nobody',
    doctrine: 'invisible-committee',
    rarity: 'common',
    body: '{member} has reserved six seats for the invisible committee. Six visible people are standing at the back.',
    choices: [
      {
        id: 'share',
        label: 'Seat the people who exist',
        result: 'You give the seats to visible members. You invite the invisible committee to complain in person.',
        journal: 'I gave the invisible committee’s seats to actual members.',
        satisfaction: 6,
        reputation: 2,
        resultTitle: 'The committee can stand',
      },
      {
        id: 'respect',
        label: 'Keep the empty seats',
        result:
          'You protect the empty seats. The people at the back spend the meeting staring at them, then at you.',
        journal: 'I kept seats empty for the invisible committee.',
        loyalty: 3,
        satisfaction: -7,
        resultTitle: 'Six very important absences',
      },
      {
        id: 'chairs',
        label: 'Buy more chairs',
        result:
          "You pay for extra chairs. {member} starts calculating refreshments for the invisible guests. You stop them there.",
        journal:
          'I bought more chairs for the people left standing by our invisible committee.',
        costBps: 20,
        satisfaction: 4,
        loyalty: 2,
        resultTitle: 'Room for the unseen',
      },
    ],
  },
  {
    id: 'silent-snoring',
    title: 'The silence has a soundtrack',
    rule: 'minute-silence',
    rarity: 'common',
    body: 'During your minute of silence, {member} falls asleep and starts snoring. Several members say it is your clearest message yet.',
    choices: [
      {
        id: 'rest',
        label: 'Let them sleep',
        result: 'You let {member} sleep. The snoring rises and falls while everyone pretends this is still a minute of silence.',
        journal: 'I let {member} sleep through our quiet minute.',
        satisfaction: 5,
        memberLoyalty: 5,
        resultTitle: 'A powerful nose',
      },
      {
        id: 'laugh',
        label: 'Laugh with the room',
        result: 'You laugh. {member} wakes up, hears the imitation and laughs too. The next attempt at silence does not last long.',
        journal:
          'I laughed with the room when {member} snored through the silence.',
        satisfaction: 6,
        reputation: 2,
        resultTitle: 'A snore worth sharing',
      },
      {
        id: 'shame',
        label: 'Wake them with a lecture',
        result: 'You lecture {member} in front of the room. They stay wide awake through every word, staring straight at you.',
        journal: 'I shamed {member} for falling asleep during a meeting.',
        loyalty: 2,
        memberLoyalty: -18,
        action: 'humiliate',
        resultTitle: 'Wide awake now',
      },
    ],
  },
  {
    id: 'family-at-the-gate',
    title: 'Before you were enlightened',
    need: 'family',
    rarity: 'uncommon',
    body: '{relative} comes to the headquarters and asks {member} why everyone is using your new title. They have a few older names for you.',
    choices: [
      {
        id: 'welcome',
        label: 'Introduce your relative',
        result:
          'You introduce {relative}. They use your old name. The room enjoys it enough to make you nervous.',
        journal: 'I welcomed {relative} at the headquarters.',
        reputation: 4,
        satisfaction: 3,
        resultTitle: 'A less sacred introduction',
      },
      {
        id: 'private',
        label: 'Take the conversation outside',
        result: 'You speak with {relative} in private. Without the title or an audience, the questions are harder to dodge.',
        journal: 'I spoke privately with {relative} about the organisation.',
        heat: -2,
        loyalty: -1,
        resultTitle: 'No audience for this',
      },
      {
        id: 'deny',
        label: 'Tell them they do not understand',
        result:
          'You dismiss {relative}. They leave without using your title. {member} watches you wait for an apology that never comes.',
        journal: 'I turned away {relative} after they questioned my new role.',
        heat: 4,
        memberLoyalty: -5,
        resultTitle: 'They knew you before',
      },
    ],
  },
  {
    id: 'rival-breakfast',
    title: 'They have free breakfast',
    need: 'rival',
    rarity: 'uncommon',
    body: '{rival} is offering free breakfast with its next gathering. {member} has brought you a menu and a recruitment leaflet.',
    choices: [
      {
        id: 'compete',
        label: 'Pay for an open supper',
        result: "You fund a supper. A guest congratulates you on standing up to breakfast, then asks for another helping.",
        journal:
          'I held an open supper after {rival} advertised free breakfast.',
        costBps: 55,
        growth: 10,
        reputation: 3,
        resultTitle: 'The dinner offensive',
      },
      {
        id: 'talk',
        label: 'Ask for a truce',
        result:
          'You ask {rival} to stop the public insults. Their leader hears you out. The breakfast menu remains a separate negotiating problem.',
        journal: 'I asked {rival} to stop competing through public insults.',
        heat: -3,
        action: 'reconcile',
        resultTitle: 'Peace over breakfast',
      },
      {
        id: 'sneer',
        label: 'Attack their breakfast in public',
        result: 'You deliver a public attack on {rival}’s breakfast. The clip spreads further than your last sermon, under a much less flattering title.',
        journal: 'I publicly attacked {rival}’s breakfast promotion.',
        heat: 7,
        reputation: -3,
        loyalty: 3,
        resultTitle: 'A sermon about toast',
      },
    ],
  },
  {
    id: 'documentary-clipboard',
    title: 'They brought follow-up questions',
    minFollowers: 100,
    rarity: 'uncommon',
    body: 'A documentary crew wants to visit. {member} has seen their research notes. There are more question marks than compliments.',
    choices: [
      {
        id: 'open',
        label: 'Let them film a normal day',
        result:
          'You let the cameras follow a normal day. They capture a long meeting, bills and someone asking when lunch is.',
        journal: 'I allowed a documentary crew to film an ordinary day.',
        reputation: 6,
        heat: -4,
        growth: 8,
        resultTitle: 'Very little to censor',
      },
      {
        id: 'stage',
        label: 'Rehearse the perfect day',
        result:
          'You rehearse the welcome until everyone smiles on cue. The crew films you telling them to look spontaneous.',
        journal: 'I staged an ideal day for a documentary crew.',
        heat: 8,
        reputation: -4,
        resultTitle: 'Keep rolling',
      },
      {
        id: 'decline',
        label: 'Turn the crew away',
        result: 'You decline the visit. The crew leaves with footage of the door and all the questions you declined to answer.',
        journal: 'I declined a documentary visit.',
        loyalty: 2,
        growth: -2,
        resultTitle: 'Outside looking in',
      },
    ],
  },
  {
    id: 'soup-number',
    title: 'The eighth bowl',
    doctrine: 'number-seven',
    rarity: 'common',
    body: '{member} insists the kitchen must serve exactly seven bowls at a time. There are eight people in the queue.',
    choices: [
      {
        id: 'serve',
        label: 'Feed the eighth person',
        result: 'You serve the eighth person. They eat. {member} watches the ceiling for a response.',
        journal: 'I served an eighth bowl despite our fixation on seven.',
        satisfaction: 6,
        reputation: 2,
        resultTitle: 'Eight bowls. No lightning.',
      },
      {
        id: 'wait',
        label: 'Wait for seven more diners',
        result: 'You make the eighth person wait. They leave hungry and tell people exactly why.',
        journal: 'I made a member wait for a sacred set of seven bowls.',
        loyalty: 2,
        growth: -5,
        heat: 3,
        resultTitle: 'Hungry for a different cult',
      },
      {
        id: 'help',
        label: 'Let the kitchen decide',
        result: 'You leave it to the kitchen. They serve another bowl before you finish explaining the theological problem.',
        journal: 'I let the kitchen choose how many people to feed.',
        memberLoyalty: 5,
        satisfaction: 4,
        resultTitle: 'Soup wins',
      },
    ],
  },
  {
    id: 'outsider-child',
    title: 'A sacred spelling mistake',
    doctrine: 'outsider-tests',
    rarity: 'uncommon',
    body: 'An outsider notices the same spelling mistake on every leaflet. {member} says it is a test of faith. It is still a spelling mistake.',
    choices: [
      {
        id: 'correct',
        label: 'Correct the spelling',
        result: 'You correct the leaflets. {member} has to stop explaining why the universe cannot spell.',
        journal:
          'I corrected our leaflets instead of calling criticism a test.',
        costBps: 10,
        reputation: 4,
        growth: 4,
        resultTitle: 'A smaller miracle',
      },
      {
        id: 'test',
        label: 'Declare the critic faithless',
        result:
          'You announce that the critic failed the test. They hold up the leaflet so everyone else can try it.',
        journal: 'I called a spelling correction a failed test of faith.',
        loyalty: 4,
        heat: 5,
        resultTitle: 'Your typo goes public',
      },
      {
        id: 'invite',
        label: 'Ask the critic to help',
        result:
          'You invite them to help. They fix the mistake and find another one before the kettle boils.',
        journal: 'I invited a critic to help improve our leaflets.',
        costBps: 8,
        growth: 6,
        heat: -2,
        resultTitle: 'The critic gets a pen',
      },
    ],
  },
  {
    id: 'robes-receipt',
    title: 'One size fits nobody',
    rule: 'uniform-robes',
    rarity: 'common',
    body: 'The new robe shipment fits {member} and nobody else. Members ask whether spiritual growth was meant to be this literal.',
    choices: [
      {
        id: 'alter',
        label: 'Pay for alterations',
        result: 'You pay for alterations. Members can lift their arms again without looking as though they are breaking free of the cult.',
        journal: 'I paid to alter the group’s badly fitting robes.',
        costBps: 30,
        satisfaction: 6,
        resultTitle: 'Room to believe',
      },
      {
        id: 'optional',
        label: 'Drop the matching robes',
        result:
          'You drop the robe rule. Members return in clothes they can sit down in. {member} misses being the only one dressed correctly.',
        journal: 'I dropped the matching robe rule after a failed shipment.',
        satisfaction: 7,
        loyalty: -2,
        action: 'relax',
        resultTitle: 'Normal clothes return',
      },
      {
        id: 'blame',
        label: 'Demand they fit the robes',
        result:
          'You blame their commitment. A member tries to sit down and splits a seam during your explanation.',
        journal: 'I blamed members for the badly fitting robes.',
        heat: 5,
        satisfaction: -8,
        memberLoyalty: -8,
        resultTitle: 'Tailored disappointment',
      },
    ],
  },
  {
    id: 'help-fund',
    title: 'Time to use the support fund',
    rule: 'mutual-aid',
    rarity: 'uncommon',
    body: '{member} asks for temporary financial help. The support fund you keep mentioning is about to face its first difficult question: will you use it?',
    choices: [
      {
        id: 'pay',
        label: 'Pay the member support',
        result:
          'You pay {member} the support. They thank you, then ask why asking felt harder than the bills.',
        journal: 'I approved recorded support for {member}.',
        costBps: 50,
        loyalty: 7,
        memberLoyalty: 12,
        action: 'aid',
        resultTitle: 'The money reaches them',
      },
      {
        id: 'listen',
        label: 'Explain what you can afford',
        result: 'You talk through the fund’s limits with {member}. They leave without a payment, but you let them finish explaining what they need.',
        journal: 'I discussed the limits of the support fund with {member}.',
        memberLoyalty: 3,
        reputation: 2,
        resultTitle: 'No miracle promised',
      },
      {
        id: 'deny',
        label: 'Call hardship a spiritual lesson',
        result:
          "You call it a lesson in resilience. {member} offers to pass your explanation directly to their landlord.",
        journal:
          'I dismissed {member}’s request for help as a spiritual lesson.',
        heat: 6,
        loyalty: -7,
        memberLoyalty: -15,
        resultTitle: 'An expensive lesson',
      },
    ],
  },
  {
    id: 'garden-names',
    title: 'Leave the speech out',
    doctrine: 'memory-garden',
    rarity: 'rare',
    body: '{member} asks for a quiet place to remember someone who died. They do not want a speech or a photograph for your publicity.',
    choices: [
      {
        id: 'quiet',
        label: 'Give them privacy',
        result: 'You leave {member} alone to remember the person they lost. Your speech stays in your pocket.',
        journal: 'I gave {member} privacy to remember someone they lost.',
        memberLoyalty: 15,
        satisfaction: 3,
        resultTitle: 'Time to remember',
      },
      {
        id: 'support',
        label: 'Pay some bereavement support',
        result: 'You arrange support for {member} and leave them to grieve. They do not have to thank you in front of anyone.',
        journal:
          'I approved practical support for {member} during bereavement.',
        costBps: 25,
        memberLoyalty: 12,
        action: 'aid',
        resultTitle: 'Help without an audience',
      },
      {
        id: 'public',
        label: 'Use their grief in a speech',
        result: 'You make {member}’s loss the subject of your speech. They look away. You keep speaking.',
        journal: 'I made {member}’s grief part of a public speech.',
        heat: 8,
        memberLoyalty: -25,
        action: 'humiliate',
        resultTitle: 'They asked for privacy',
      },
    ],
  },
  {
    id: 'early-alarm',
    title: 'Awake against their will',
    rule: 'early-rising',
    rarity: 'common',
    body: '{member} has set the dawn reflection alarm for an hour before dawn, just to be safe. The neighbours are now awake enough to complain.',
    choices: [
      {
        id: 'reset',
        label: 'Set a later alarm',
        result: 'You reset the alarm. The neighbours stop appearing at their windows in dressing gowns.',
        journal: 'I reset an overenthusiastic dawn alarm.',
        satisfaction: 5,
        heat: -3,
        resultTitle: 'A later awakening',
      },
      {
        id: 'silent',
        label: 'Make dawn reflection silent',
        result: 'You keep the reflection and lose the alarm. Members discover that a profound thought can stay inside a head.',
        journal: 'I made dawn reflection a silent practice.',
        loyalty: 3,
        reputation: 3,
        resultTitle: 'Enlightenment on mute',
      },
      {
        id: 'louder',
        label: 'Welcome the angry attention',
        result: 'You treat the complaints as publicity. The neighbours start using your name loudly enough to return the favour.',
        journal: 'I used complaints about our dawn alarm as publicity.',
        growth: 5,
        heat: 8,
        reputation: -5,
        resultTitle: 'Your name carries',
      },
    ],
  },
  {
    id: 'future-message',
    title: 'The future wants a projector',
    doctrine: 'future-mail',
    rarity: 'uncommon',
    body: '{member} claims a message from the future says the group must buy a very expensive projector. The message looks like a shop catalogue.',
    choices: [
      {
        id: 'decline',
        label: 'Reject the shopping prophecy',
        result: 'You reject the message. {member} folds up the catalogue with the wounded care of a disappointed prophet.',
        journal:
          'I declined a supposed message from the future about a projector.',
        reputation: 3,
        memberLoyalty: -3,
        resultTitle: 'Tomorrow can wait',
      },
      {
        id: 'buy',
        label: 'Buy it as equipment',
        result:
          "You buy the projector as equipment. {member} studies the warranty for anything resembling divine protection.",
        journal:
          'I approved a projector purchase without pretending it was foretold.',
        costBps: 70,
        satisfaction: 5,
        resultTitle: 'A vision in high definition',
      },
      {
        id: 'shame',
        label: 'Mock the message in public',
        result:
          'You read the catalogue aloud as a revelation. The room laughs. {member} takes it back before you reach the accessories.',
        journal: 'I publicly mocked {member}’s supposed future message.',
        heat: 2,
        memberLoyalty: -18,
        action: 'humiliate',
        resultTitle: 'A prophecy at their expense',
      },
    ],
  },
  {
    id: 'merchandise-star',
    title: 'Your misspelling is selling',
    minFollowers: 80,
    rarity: 'rare',
    body: '{member} has sold a batch of badly printed group mugs. People think the spelling is deliberate. Orders keep coming.',
    choices: [
      {
        id: 'modest',
        label: 'Pay for a small mug run',
        result:
          'You approve a small batch of misspelt mugs. Customers pay for the mistake you are now carefully refusing to correct.',
        journal: 'I approved a modest run of our accidentally popular mugs.',
        incomeBps: 65,
        reputation: 3,
        memberLoyalty: 6,
        resultTitle: 'A limited revelation',
      },
      {
        id: 'credit',
        label: 'Let them run the mug operation',
        result: 'You put {member} in charge and give them the credit. People begin asking for them by name.',
        journal: 'I gave {member} credit for the popular mugs.',
        incomeBps: 40,
        memberLoyalty: 12,
        ambition: 5,
        action: 'recruiter',
        resultTitle: 'The face behind the mugs',
      },
      {
        id: 'reject',
        label: 'Stop making the mugs',
        result: 'You stop making the mugs. Your most popular message remains the one you never meant to print.',
        journal:
          'I kept our mugs from becoming the organisation’s main purpose.',
        loyalty: 3,
        resultTitle: 'The final edition',
      },
    ],
  },
  {
    id: 'plain-living-photo',
    title: 'Padding for the prophet',
    rule: 'no-luxury',
    rarity: 'uncommon',
    body: 'Someone has photographed the new padded chair in your office. {member} asks how it fits with the plain-living rule.',
    choices: [
      {
        id: 'share',
        label: 'Move it to the common room',
        result: 'You move the padded chair to the common room. It is occupied before you finish explaining your generosity.',
        journal: 'I moved the padded chair into the common room.',
        loyalty: 5,
        heat: -3,
        resultTitle: 'A seat for the people',
      },
      {
        id: 'relax',
        label: 'Drop the plain-living rule',
        result:
          "You relax the rule. Members start discussing their own comfortable chairs before you finish defending yours.",
        journal: 'I dropped the rigid plain-living rule.',
        satisfaction: 6,
        action: 'relax',
        resultTitle: 'Comfort is permitted',
      },
      {
        id: 'rank',
        label: 'Declare padding a leadership need',
        result: 'You announce that leadership requires padding. Someone posts the phrase beside the photograph. Your chair has become a campaign against you.',
        journal: 'I defended my comfortable chair as a leadership requirement.',
        heat: 8,
        reputation: -5,
        resultTitle: 'A well-cushioned argument',
      },
    ],
  },
  {
    id: 'seven-second-silence',
    title: 'You forgot the revelation',
    doctrine: 'leader-fallible',
    rarity: 'rare',
    body: 'You lose your place in a speech and admit you have forgotten what comes next. {member} says it is the first time the whole room has relaxed.',
    choices: [
      {
        id: 'honest',
        label: 'Admit you lost your place',
        result: 'You admit you forgot the next bit. People start asking questions while you are still looking for it.',
        journal: 'I carried on honestly after losing my place in a speech.',
        loyalty: 5,
        reputation: 5,
        memberLoyalty: 6,
        resultTitle: 'Off the script',
      },
      {
        id: 'credit',
        label: 'Let someone else finish',
        result: 'You invite someone else to finish. {member} looks surprised by how willingly the room listens.',
        journal: 'I let someone else finish a speech when I lost my place.',
        satisfaction: 6,
        memberLoyalty: 10,
        resultTitle: 'A different voice',
      },
      {
        id: 'planned',
        label: 'Claim you planned the silence',
        result:
          'You announce that forgetting was part of the lesson. Someone asks what the next forgotten part will teach them.',
        journal: 'I claimed my forgotten speech had been planned.',
        loyalty: 1,
        reputation: -4,
        heat: 3,
        resultTitle: 'A very convenient revelation',
      },
    ],
  },
  {
    id: 'unexpected-crowd',
    title: 'The queue for enlightenment',
    minFollowers: 30,
    rarity: 'uncommon',
    body: 'A guest night brings more visitors than expected. {member} is trying to explain the philosophy beside a queue for the only toilet.',
    choices: [
      {
        id: 'practical',
        label: 'Pay for overflow space',
        result: 'You hire more space. {member} can finish a sentence without being asked where the toilet is.',
        journal: 'I hired overflow space for an unexpectedly busy guest night.',
        costBps: 45,
        growth: 12,
        reputation: 4,
        resultTitle: 'Room for the believers',
      },
      {
        id: 'later',
        label: 'Offer smaller return visits',
        result:
          'You arrange smaller return visits. Some guests leave; the rest can finally hear the explanation.',
        journal: 'I offered smaller return visits after a crowded guest night.',
        growth: 5,
        satisfaction: 3,
        resultTitle: 'Come back in smaller numbers',
      },
      {
        id: 'miracle',
        label: 'Declare the crush a miracle',
        result: "You call the crowd a miracle. A guest points you towards the toilet queue and requests another one.",
        journal: 'I called an overcrowded guest night a miracle.',
        loyalty: 3,
        heat: 5,
        satisfaction: -4,
        resultTitle: 'Blessed are the bursting',
      },
    ],
  },
  ...cultDramaticStories,
  ...cultActivityStories,
];
