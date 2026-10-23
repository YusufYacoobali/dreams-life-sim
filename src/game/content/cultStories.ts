import type { CultDoctrineId, CultRuleId, cultMemberRoles } from './cults';
export type CultStoryChoice = {
  id: string;
  label: string;
  result: string;
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
    title: 'You Are Live',
    rule: 'no-phones',
    rarity: 'common',
    body: '{member} has been streaming your phone-free ceremony from inside a ceremonial bell. The bell has six thousand followers.',
    choices: [
      {
        id: 'punish',
        label: 'Call them out in front of everyone',
        result: 'The stream ends. The recording of your outburst does not.',
        journal: 'I humiliated {member} for streaming a phone-free ceremony.',
        loyalty: 2,
        heat: 6,
        memberLoyalty: -20,
        action: 'humiliate',
      },
      {
        id: 'relax',
        label: 'Drop the phone ban',
        result: 'Phones come out. So do a few relieved smiles.',
        journal: 'I dropped the phone ban after {member}’s hidden livestream.',
        satisfaction: 5,
        heat: -2,
        action: 'relax',
      },
      {
        id: 'broadcast',
        label: 'Give them the official account',
        result:
          'You let {member} run the broadcasts. Whether that was wise will take a while to discover.',
        journal: 'I put {member} in charge of our broadcasts.',
        growth: 8,
        memberLoyalty: 10,
        ambition: 8,
        action: 'recruiter',
      },
    ],
  },
  {
    id: 'attendance-letter',
    title: 'A Letter from the Night Shift',
    rule: 'monthly-attendance',
    rarity: 'common',
    body: 'Members working nights say your compulsory meetings are costing them wages. {member} has brought their rota.',
    choices: [
      {
        id: 'relax',
        label: 'Make attendance voluntary',
        result:
          'They can keep their shifts without explaining themselves to you.',
        journal:
          'I made attendance voluntary after seeing the night-shift rota.',
        loyalty: -2,
        satisfaction: 8,
        reputation: 3,
        action: 'relax',
      },
      {
        id: 'help',
        label: 'Pay for a second meeting time',
        result:
          'A later gathering costs money. It also gives working members somewhere to sit.',
        journal: 'I funded another meeting time for members on night shifts.',
        costBps: 35,
        loyalty: 5,
        memberLoyalty: 8,
      },
      {
        id: 'enforce',
        label: 'Insist on the original time',
        result:
          'Some members choose their wages. You cannot blame them for needing groceries.',
        journal:
          'I enforced meeting attendance despite members’ work commitments.',
        loyalty: 3,
        satisfaction: -9,
        growth: -8,
        heat: 4,
      },
    ],
  },
  {
    id: 'wrong-blue',
    title: 'The Wrong Blue',
    rule: 'friday-blue',
    rarity: 'common',
    body: '{member} has stopped a Friday ceremony to argue that someone’s shirt is turquoise. The accused has brought a receipt saying blue.',
    choices: [
      {
        id: 'allow',
        label: 'Accept the shirt',
        result:
          'The ceremony resumes. The receipt goes into the complaints folder.',
        journal: 'I accepted a turquoise shirt at our blue-Friday meeting.',
        satisfaction: 5,
        memberLoyalty: -2,
      },
      {
        id: 'committee',
        label: 'Let members choose the colour',
        result: 'The vote includes eleven shades and one vote for trousers.',
        journal: 'I let members settle the Friday colour dispute.',
        loyalty: 3,
        satisfaction: 3,
      },
      {
        id: 'purity',
        label: 'Lecture them on correct blue',
        result: 'You win the argument. Several guests quietly stop coming.',
        journal: 'I gave a lecture about the correct shade of blue.',
        loyalty: 3,
        growth: -5,
        heat: 2,
        memberLoyalty: 4,
      },
    ],
  },
  {
    id: 'borrowed-dream-diary',
    title: 'A Suspicious Dream',
    rule: 'dream-journal',
    doctrine: 'borrowed-dreams',
    rarity: 'common',
    body: '{member} has submitted the same dream as last week, including the spelling mistake. They say the alternate self is also tired.',
    choices: [
      {
        id: 'accept',
        label: 'Accept that explanation',
        result: 'The diary is accepted. Standards have become flexible.',
        journal: 'I accepted {member}’s repeated dream diary.',
        loyalty: 3,
        reputation: -2,
        memberLoyalty: 5,
      },
      {
        id: 'rest',
        label: 'Tell them to take a morning off',
        result: 'They look more grateful than enlightened.',
        journal:
          'I told {member} to rest instead of filling another dream diary.',
        satisfaction: 6,
        memberLoyalty: 10,
      },
      {
        id: 'show',
        label: 'Read it out as a lesson',
        result: 'The room laughs. {member} does not.',
        journal: 'I used {member}’s copied dream as a public lesson.',
        loyalty: 2,
        heat: 2,
        memberLoyalty: -18,
        action: 'humiliate',
      },
    ],
  },
  {
    id: 'kettle-stuck',
    title: 'The Oracle Needs Descaling',
    doctrine: 'sacred-kettle',
    rarity: 'common',
    body: 'The sacred kettle is making a terrible noise. {member} says it is a warning. The caretaker says it is limescale.',
    choices: [
      {
        id: 'repair',
        label: 'Pay for a repair',
        result:
          'The kettle returns to making tea. Members appreciate being given an ordinary answer.',
        journal: 'I had the ceremonial kettle repaired.',
        costBps: 8,
        satisfaction: 5,
        reputation: 3,
      },
      {
        id: 'tickets',
        label: 'Charge admission to hear it',
        result:
          'People pay once. Their recordings make the group look ridiculous.',
        journal: 'I sold tickets to hear our broken ceremonial kettle.',
        incomeBps: 20,
        heat: 8,
        reputation: -5,
      },
      {
        id: 'retire',
        label: 'Retire it with a small ceremony',
        result:
          'The kettle gets a shelf. A new, less important kettle does the work.',
        journal: 'I retired the sacred kettle before it boiled dry.',
        costBps: 10,
        loyalty: 4,
        satisfaction: 3,
      },
    ],
  },
  {
    id: 'lunar-exam',
    title: 'The Moon Has an Exam',
    doctrine: 'moon-lessons',
    rarity: 'uncommon',
    body: '{member} has blamed a failed driving test on the moon. Their instructor has supplied footage of the roundabout.',
    choices: [
      {
        id: 'lesson',
        label: 'Offer practical lessons',
        result: 'The extra lessons help. Nobody asks the moon for a reference.',
        journal:
          'I helped {member} pay for practical lessons after the failed test.',
        costBps: 15,
        reputation: 4,
        memberLoyalty: 10,
      },
      {
        id: 'defend',
        label: 'Defend the lunar explanation',
        result: 'The instructor posts the footage. The moon remains silent.',
        journal:
          'I defended {member}’s lunar explanation for a failed driving test.',
        loyalty: 3,
        heat: 7,
        reputation: -4,
      },
      {
        id: 'own',
        label: 'Say the test was their responsibility',
        result: 'The answer stings, but it is at least an answer.',
        journal: 'I told {member} the moon had not been driving.',
        reputation: 3,
        memberLoyalty: -5,
      },
    ],
  },
  {
    id: 'aura-invoice',
    title: 'An Itemised Aura',
    doctrine: 'golden-aura',
    role: 'treasurer',
    rarity: 'uncommon',
    body: '{member} has been asked to explain exactly how a larger donation makes your aura brighter. The donor wants an itemised invoice.',
    choices: [
      {
        id: 'refund',
        label: 'Offer a goodwill refund',
        result:
          'The donor takes the refund. The treasurer takes the promise seriously.',
        journal:
          'I paid a goodwill refund after questions about my golden aura.',
        costBps: 50,
        heat: -5,
        memberLoyalty: 8,
      },
      {
        id: 'explain',
        label: 'Admit it was a metaphor',
        result: 'Some members are disappointed. Fewer are suspicious.',
        journal: 'I admitted the golden aura was a metaphor.',
        loyalty: -3,
        heat: -4,
        reputation: 4,
      },
      {
        id: 'sell',
        label: 'Introduce a premium aura tier',
        result:
          'The new tier raises money and several very specific questions.',
        journal: 'I sold a premium tier of my supposed aura.',
        incomeBps: 35,
        heat: 10,
        reputation: -6,
      },
    ],
  },
  {
    id: 'open-books-transfer',
    title: 'The Transfer Everyone Can See',
    rule: 'open-books',
    need: 'payout',
    role: 'treasurer',
    rarity: 'uncommon',
    body: '{member} has circled one of your recorded leader payouts in the public accounts. Members ask how it fits with the group’s needs.',
    choices: [
      {
        id: 'explain',
        label: 'Show the actual payout policy',
        result: 'Not everyone likes it. At least the figures are real.',
        journal:
          'I explained a recorded leader payout at an open accounts meeting.',
        heat: -3,
        reputation: 4,
        memberLoyalty: 5,
      },
      {
        id: 'fund',
        label: 'Fund additional member support',
        result:
          'The extra support costs the organisation. Members can see where it goes.',
        journal:
          'I funded extra member support after questions about my payout.',
        costBps: 60,
        loyalty: 6,
        heat: -3,
        action: 'aid',
      },
      {
        id: 'silence',
        label: 'Humiliate the treasurer for asking',
        result:
          'The question disappears from the meeting. It does not disappear from memory.',
        journal: 'I humiliated {member} for questioning my leader payout.',
        heat: 7,
        memberLoyalty: -25,
        action: 'humiliate',
      },
    ],
  },
  {
    id: 'double-door-rule',
    title: 'Open to Everyone. Members Only.',
    need: 'contradiction',
    rarity: 'common',
    body: 'Your rules say ceremonies are both open to the public and private. {member} is standing in a doorway trying to enforce both.',
    choices: [
      {
        id: 'open',
        label: 'Remove the members-only rule',
        result: 'The door opens and stays open.',
        journal: 'I removed our contradictory members-only rule.',
        satisfaction: 5,
        reputation: 3,
        action: 'relax',
      },
      {
        id: 'closed',
        label: 'Remove the public-ceremonies rule',
        result: 'Visitors go home. Members stop arguing at the door.',
        journal:
          'I made ceremonies private and removed the conflicting public rule.',
        loyalty: 5,
        growth: -4,
      },
      {
        id: 'mystery',
        label: 'Call the contradiction a mystery',
        result: 'It is a mystery why anyone keeps volunteering for the door.',
        journal: 'I called our contradictory door rules a sacred mystery.',
        heat: 5,
        memberLoyalty: -8,
      },
    ],
  },
  {
    id: 'retreat-roof',
    title: 'The Roof Has a View',
    need: 'headquarters',
    rarity: 'common',
    body: 'A leak has appeared directly above the leader’s chair. {member} has moved a bucket there. It is receiving more contributions than you.',
    choices: [
      {
        id: 'repair',
        label: 'Pay for repairs',
        result: 'The roof is fixed. The bucket returns to ordinary duties.',
        journal: 'I paid for repairs to the headquarters roof.',
        costBps: 65,
        satisfaction: 6,
        reputation: 2,
      },
      {
        id: 'move',
        label: 'Move the meeting into the dry room',
        result:
          'The meeting continues in a smaller room. The leak still needs attention.',
        journal: 'I moved a meeting away from the leaking roof.',
        satisfaction: -3,
        loyalty: 1,
      },
      {
        id: 'sign',
        label: 'Call it a sign from above',
        result: 'A guest asks whether the sign has public liability insurance.',
        journal: 'I described a leaking roof as a spiritual sign.',
        heat: 5,
        reputation: -4,
      },
    ],
  },
  {
    id: 'second-chair',
    title: 'A Second Leader’s Chair',
    role: 'deputy',
    need: 'ambition',
    rarity: 'rare',
    body: '{member} has placed a second large chair beside yours and started answering questions before you speak.',
    choices: [
      {
        id: 'share',
        label: 'Give them a defined responsibility',
        result: 'The role is real now. So is the limit you put around it.',
        journal:
          'I gave {member} a defined role after their challenge to my authority.',
        memberLoyalty: 12,
        ambition: -8,
        loyalty: 4,
      },
      {
        id: 'confront',
        label: 'Challenge them in public',
        result:
          'You keep the main chair. The argument will travel further than the room.',
        journal:
          'I challenged {member} in public over the second leader’s chair.',
        loyalty: -5,
        memberLoyalty: -25,
        heat: 6,
        action: 'humiliate',
      },
      {
        id: 'expel',
        label: 'Remove them from the organisation',
        result: 'They leave. Their supporters remember who they followed in.',
        journal: 'I expelled {member} after their leadership challenge.',
        heat: 4,
        action: 'expel',
      },
    ],
  },
  {
    id: 'treasurer-envelope',
    title: 'The Unlabelled Envelope',
    role: 'treasurer',
    rarity: 'rare',
    body: '{member} asks you to approve an unlabelled discretionary fund. They say records would spoil the discretion.',
    choices: [
      {
        id: 'audit',
        label: 'Require proper records',
        result:
          'The envelope acquires receipts. The money stays in the treasury.',
        journal: 'I required proper records for {member}’s discretionary fund.',
        reputation: 5,
        heat: -3,
        memberLoyalty: -3,
      },
      {
        id: 'reward',
        label: 'Give a recorded member bonus',
        result:
          'A real bonus is paid to {member}, with a receipt both accounts can explain.',
        journal:
          'I paid {member} a recorded bonus instead of an unlabelled fund.',
        costBps: 40,
        memberLoyalty: 12,
        action: 'aid',
      },
      {
        id: 'divert',
        label: 'Divert communal funds to yourself',
        result:
          'You take money that belongs to the organisation. The transfer leaves evidence and can lead to prosecution.',
        journal: 'I diverted communal funds into my own account.',
        heat: 18,
        memberLoyalty: -20,
        action: 'misuse',
      },
    ],
  },
  {
    id: 'invisible-seat',
    title: 'A Place for the Committee',
    doctrine: 'invisible-committee',
    rarity: 'common',
    body: '{member} has reserved six seats for the invisible committee. Six visible people are standing at the back.',
    choices: [
      {
        id: 'share',
        label: 'Let visible people sit down',
        result: 'The committee is offered standing room. No complaint arrives.',
        journal: 'I gave the invisible committee’s seats to actual members.',
        satisfaction: 6,
        reputation: 2,
      },
      {
        id: 'respect',
        label: 'Keep the seats reserved',
        result:
          'The standing members discover their feet have strong theological opinions.',
        journal: 'I kept seats empty for the invisible committee.',
        loyalty: 3,
        satisfaction: -7,
      },
      {
        id: 'chairs',
        label: 'Buy more chairs',
        result:
          'Both the visible and invisible committees have somewhere to sit.',
        journal:
          'I bought more chairs rather than settle the invisible committee dispute.',
        costBps: 20,
        satisfaction: 4,
        loyalty: 2,
      },
    ],
  },
  {
    id: 'silent-snoring',
    title: 'The Quietest Sermon',
    rule: 'minute-silence',
    rarity: 'common',
    body: 'During your minute of silence, {member} falls asleep and starts snoring. Several members say it is your clearest message yet.',
    choices: [
      {
        id: 'rest',
        label: 'Let them sleep',
        result: 'The silence continues with a soundtrack.',
        journal: 'I let {member} sleep through our quiet minute.',
        satisfaction: 5,
        memberLoyalty: 5,
      },
      {
        id: 'laugh',
        label: 'Laugh with the room',
        result: 'Even {member} laughs after waking up.',
        journal:
          'I laughed with the room when {member} snored through the silence.',
        satisfaction: 6,
        reputation: 2,
      },
      {
        id: 'shame',
        label: 'Make an example of them',
        result: 'They are awake now. They also remember every word.',
        journal: 'I shamed {member} for falling asleep during a meeting.',
        loyalty: 2,
        memberLoyalty: -18,
        action: 'humiliate',
      },
    ],
  },
  {
    id: 'family-at-the-gate',
    title: 'Someone Who Knew You Before',
    need: 'family',
    rarity: 'uncommon',
    body: '{relative} comes to the headquarters and asks {member} why everyone is using your new title. They have a few older names for you.',
    choices: [
      {
        id: 'welcome',
        label: 'Introduce them properly',
        result:
          'Your family member meets the group. It becomes harder to pretend your life began with the cult.',
        journal: 'I welcomed {relative} at the headquarters.',
        reputation: 4,
        satisfaction: 3,
      },
      {
        id: 'private',
        label: 'Talk privately',
        result: 'You have a difficult conversation away from an audience.',
        journal: 'I spoke privately with {relative} about the organisation.',
        heat: -2,
        loyalty: -1,
      },
      {
        id: 'deny',
        label: 'Tell them they do not understand',
        result:
          'The visit ends badly. {member} watches someone who knows you leave.',
        journal: 'I turned away {relative} after they questioned my new role.',
        heat: 4,
        memberLoyalty: -5,
      },
    ],
  },
  {
    id: 'rival-breakfast',
    title: 'Breakfast Across the Road',
    need: 'rival',
    rarity: 'uncommon',
    body: '{rival} is offering free breakfast with its next gathering. {member} has brought you a menu and a recruitment leaflet.',
    choices: [
      {
        id: 'compete',
        label: 'Hold an open supper',
        result: 'Your own event gives people a reason to come back.',
        journal:
          'I held an open supper after {rival} advertised free breakfast.',
        costBps: 55,
        growth: 10,
        reputation: 3,
      },
      {
        id: 'talk',
        label: 'Ask the rival to stop trading insults',
        result:
          'You offer a quieter relationship. Their leader hears the request.',
        journal: 'I asked {rival} to stop competing through public insults.',
        heat: -3,
        action: 'reconcile',
      },
      {
        id: 'sneer',
        label: 'Publicly criticise their breakfast',
        result: 'The clip is shared much more than the next sermon.',
        journal: 'I publicly attacked {rival}’s breakfast promotion.',
        heat: 7,
        reputation: -3,
        loyalty: 3,
      },
    ],
  },
  {
    id: 'documentary-clipboard',
    title: 'The Crew Has Questions',
    minFollowers: 100,
    rarity: 'uncommon',
    body: 'A documentary crew wants to visit. {member} has seen their research notes. There are more question marks than compliments.',
    choices: [
      {
        id: 'open',
        label: 'Allow an ordinary day of filming',
        result:
          'The film shows people, bills and a meeting that runs long. It is less dramatic than expected.',
        journal: 'I allowed a documentary crew to film an ordinary day.',
        reputation: 6,
        heat: -4,
        growth: 8,
      },
      {
        id: 'stage',
        label: 'Stage a perfect day',
        result:
          'Someone forgets the cameras are still running during the rehearsal.',
        journal: 'I staged an ideal day for a documentary crew.',
        heat: 8,
        reputation: -4,
      },
      {
        id: 'decline',
        label: 'Decline the visit',
        result: 'The crew leaves. Their questions remain theirs.',
        journal: 'I declined a documentary visit.',
        loyalty: 2,
        growth: -2,
      },
    ],
  },
  {
    id: 'soup-number',
    title: 'Seven Bowls',
    doctrine: 'number-seven',
    rarity: 'common',
    body: '{member} insists the kitchen must serve exactly seven bowls at a time. There are eight people in the queue.',
    choices: [
      {
        id: 'serve',
        label: 'Serve the eighth person',
        result: 'Eight people eat. The universe survives the discrepancy.',
        journal: 'I served an eighth bowl despite our fixation on seven.',
        satisfaction: 6,
        reputation: 2,
      },
      {
        id: 'wait',
        label: 'Make them wait for the next seven',
        result: 'The eighth person goes home. They tell several people why.',
        journal: 'I made a member wait for a sacred set of seven bowls.',
        loyalty: 2,
        growth: -5,
        heat: 3,
      },
      {
        id: 'help',
        label: 'Let the kitchen decide',
        result: 'The kitchen settles on feeding people.',
        journal: 'I let the kitchen choose how many people to feed.',
        memberLoyalty: 5,
        satisfaction: 4,
      },
    ],
  },
  {
    id: 'outsider-child',
    title: 'The Critic Has a Point',
    doctrine: 'outsider-tests',
    rarity: 'uncommon',
    body: 'An outsider notices the same spelling mistake on every leaflet. {member} says it is a test of faith. It is still a spelling mistake.',
    choices: [
      {
        id: 'correct',
        label: 'Correct the leaflets',
        result: 'The next batch makes a better first impression.',
        journal:
          'I corrected our leaflets instead of calling criticism a test.',
        costBps: 10,
        reputation: 4,
        growth: 4,
      },
      {
        id: 'test',
        label: 'Declare that the critic failed',
        result:
          'The group applauds. The misspelt leaflets circulate outside it.',
        journal: 'I called a spelling correction a failed test of faith.',
        loyalty: 4,
        heat: 5,
      },
      {
        id: 'invite',
        label: 'Invite the critic to help',
        result:
          'They improve the leaflets and find the invitation less strange than expected.',
        journal: 'I invited a critic to help improve our leaflets.',
        costBps: 8,
        growth: 6,
        heat: -2,
      },
    ],
  },
  {
    id: 'robes-receipt',
    title: 'One Size Fits Nobody',
    rule: 'uniform-robes',
    rarity: 'common',
    body: 'The new robe shipment fits {member} and nobody else. Members ask whether spiritual growth was meant to be this literal.',
    choices: [
      {
        id: 'alter',
        label: 'Pay for alterations',
        result: 'The robes fit the people, rather than the other way around.',
        journal: 'I paid to alter the group’s badly fitting robes.',
        costBps: 30,
        satisfaction: 6,
      },
      {
        id: 'optional',
        label: 'Drop the matching robe rule',
        result:
          'Members return in their own clothes and look considerably more comfortable.',
        journal: 'I dropped the matching robe rule after a failed shipment.',
        satisfaction: 7,
        loyalty: -2,
        action: 'relax',
      },
      {
        id: 'blame',
        label: 'Blame their lack of commitment',
        result:
          'The robes still do not fit. The complaint now has a second reason.',
        journal: 'I blamed members for the badly fitting robes.',
        heat: 5,
        satisfaction: -8,
        memberLoyalty: -8,
      },
    ],
  },
  {
    id: 'help-fund',
    title: 'The Support Fund Is Needed',
    rule: 'mutual-aid',
    rarity: 'uncommon',
    body: '{member} has brought a genuine request for temporary help. Members remember the support fund you promised.',
    choices: [
      {
        id: 'pay',
        label: 'Pay recorded support',
        result:
          'The support reaches {member}. It is a concrete use of the group’s money.',
        journal: 'I approved recorded support for {member}.',
        costBps: 50,
        loyalty: 7,
        memberLoyalty: 12,
        action: 'aid',
      },
      {
        id: 'listen',
        label: 'Discuss what the group can afford',
        result: 'The answer is smaller than hoped, but it is honest.',
        journal: 'I discussed the limits of the support fund with {member}.',
        memberLoyalty: 3,
        reputation: 2,
      },
      {
        id: 'deny',
        label: 'Call hardship a spiritual lesson',
        result:
          'Members notice that the fund pays for very little when someone needs it.',
        journal:
          'I dismissed {member}’s request for help as a spiritual lesson.',
        heat: 6,
        loyalty: -7,
        memberLoyalty: -15,
      },
    ],
  },
  {
    id: 'garden-names',
    title: 'A Name in the Garden',
    doctrine: 'memory-garden',
    rarity: 'rare',
    body: '{member} asks for a quiet place to remember someone who died. They do not want a speech or a photograph for your publicity.',
    choices: [
      {
        id: 'quiet',
        label: 'Give them time and privacy',
        result: 'They stay for a while. Nobody interrupts.',
        journal: 'I gave {member} privacy to remember someone they lost.',
        memberLoyalty: 15,
        satisfaction: 3,
      },
      {
        id: 'support',
        label: 'Offer practical support',
        result: 'The help is accepted without turning grief into a ceremony.',
        journal:
          'I approved practical support for {member} during bereavement.',
        costBps: 25,
        memberLoyalty: 12,
        action: 'aid',
      },
      {
        id: 'public',
        label: 'Make it a public teaching moment',
        result: 'They did not ask to become an example. Other members notice.',
        journal: 'I made {member}’s grief part of a public speech.',
        heat: 8,
        memberLoyalty: -25,
        action: 'humiliate',
      },
    ],
  },
  {
    id: 'early-alarm',
    title: 'The Dawn Alarm',
    rule: 'early-rising',
    rarity: 'common',
    body: '{member} has set the dawn reflection alarm for an hour before dawn, just to be safe. The neighbours are now awake enough to complain.',
    choices: [
      {
        id: 'reset',
        label: 'Reset it to a sensible hour',
        result: 'The neighbours get some sleep. So do the members.',
        journal: 'I reset an overenthusiastic dawn alarm.',
        satisfaction: 5,
        heat: -3,
      },
      {
        id: 'silent',
        label: 'Make dawn reflection silent',
        result: 'Members can keep the practice without waking the street.',
        journal: 'I made dawn reflection a silent practice.',
        loyalty: 3,
        reputation: 3,
      },
      {
        id: 'louder',
        label: 'Treat the complaints as publicity',
        result: 'People know your name. Most do not say it kindly.',
        journal: 'I used complaints about our dawn alarm as publicity.',
        growth: 5,
        heat: 8,
        reputation: -5,
      },
    ],
  },
  {
    id: 'future-message',
    title: 'Tomorrow Has Sent a Bill',
    doctrine: 'future-mail',
    rarity: 'uncommon',
    body: '{member} claims a message from the future says the group must buy a very expensive projector. The message looks like a shop catalogue.',
    choices: [
      {
        id: 'decline',
        label: 'Decline the prophecy',
        result: 'The future will have to manage with the current projector.',
        journal:
          'I declined a supposed message from the future about a projector.',
        reputation: 3,
        memberLoyalty: -3,
      },
      {
        id: 'buy',
        label: 'Pay for useful equipment',
        result:
          'The projector is bought as ordinary equipment, with an ordinary receipt.',
        journal:
          'I approved a projector purchase without pretending it was foretold.',
        costBps: 70,
        satisfaction: 5,
      },
      {
        id: 'shame',
        label: 'Mock the message in public',
        result:
          'The room laughs at the catalogue. {member} remembers being the joke.',
        journal: 'I publicly mocked {member}’s supposed future message.',
        heat: 2,
        memberLoyalty: -18,
        action: 'humiliate',
      },
    ],
  },
  {
    id: 'merchandise-star',
    title: 'The Accidental Bestseller',
    minFollowers: 80,
    rarity: 'rare',
    body: '{member} has sold a batch of badly printed group mugs. People think the spelling is deliberate. Orders keep coming.',
    choices: [
      {
        id: 'modest',
        label: 'Make a small recorded run',
        result:
          'The modest run makes a little money without taking over the organisation.',
        journal: 'I approved a modest run of our accidentally popular mugs.',
        incomeBps: 65,
        reputation: 3,
        memberLoyalty: 6,
      },
      {
        id: 'credit',
        label: 'Let the member lead it',
        result: '{member} gets credit and a useful responsibility.',
        journal: 'I gave {member} credit for the popular mugs.',
        incomeBps: 40,
        memberLoyalty: 12,
        ambition: 5,
        action: 'recruiter',
      },
      {
        id: 'reject',
        label: 'Keep the group out of merchandise',
        result: 'The mugs become a brief local curiosity.',
        journal:
          'I kept our mugs from becoming the organisation’s main purpose.',
        loyalty: 3,
      },
    ],
  },
  {
    id: 'plain-living-photo',
    title: 'A Rather Comfortable Chair',
    rule: 'no-luxury',
    rarity: 'uncommon',
    body: 'Someone has photographed the new padded chair in your office. {member} asks how it fits with the plain-living rule.',
    choices: [
      {
        id: 'share',
        label: 'Put it in the common room',
        result: 'The comfortable chair becomes everyone’s favourite seat.',
        journal: 'I moved the padded chair into the common room.',
        loyalty: 5,
        heat: -3,
      },
      {
        id: 'relax',
        label: 'Admit the rule was too rigid',
        result:
          'Members appreciate hearing that comfort is not a moral failing.',
        journal: 'I dropped the rigid plain-living rule.',
        satisfaction: 6,
        action: 'relax',
      },
      {
        id: 'rank',
        label: 'Say leadership requires padding',
        result: 'The phrase becomes more famous than your last speech.',
        journal: 'I defended my comfortable chair as a leadership requirement.',
        heat: 8,
        reputation: -5,
      },
    ],
  },
  {
    id: 'seven-second-silence',
    title: 'A Moment That Worked',
    doctrine: 'leader-fallible',
    rarity: 'rare',
    body: 'You lose your place in a speech and admit you have forgotten what comes next. {member} says it is the first time the whole room has relaxed.',
    choices: [
      {
        id: 'honest',
        label: 'Carry on honestly',
        result: 'The meeting becomes a conversation rather than a performance.',
        journal: 'I carried on honestly after losing my place in a speech.',
        loyalty: 5,
        reputation: 5,
        memberLoyalty: 6,
      },
      {
        id: 'credit',
        label: 'Let someone else finish',
        result: 'Another member has something worth hearing.',
        journal: 'I let someone else finish a speech when I lost my place.',
        satisfaction: 6,
        memberLoyalty: 10,
      },
      {
        id: 'planned',
        label: 'Claim the mistake was planned',
        result:
          'A few members laugh. Others wish you had stopped while it was honest.',
        journal: 'I claimed my forgotten speech had been planned.',
        loyalty: 1,
        reputation: -4,
        heat: 3,
      },
    ],
  },
  {
    id: 'unexpected-crowd',
    title: 'More Guests Than Chairs',
    minFollowers: 30,
    rarity: 'uncommon',
    body: 'A guest night brings more visitors than expected. {member} is trying to explain the philosophy beside a queue for the only toilet.',
    choices: [
      {
        id: 'practical',
        label: 'Pay for a practical overflow space',
        result: 'The guests have room. You also have a real bill.',
        journal: 'I hired overflow space for an unexpectedly busy guest night.',
        costBps: 45,
        growth: 12,
        reputation: 4,
      },
      {
        id: 'later',
        label: 'Invite people back in smaller groups',
        result:
          'Fewer people stay tonight, but the next visit will work better.',
        journal: 'I offered smaller return visits after a crowded guest night.',
        growth: 5,
        satisfaction: 3,
      },
      {
        id: 'miracle',
        label: 'Declare overcrowding a miracle',
        result: 'The queue remains a queue, however you describe it.',
        journal: 'I called an overcrowded guest night a miracle.',
        loyalty: 3,
        heat: 5,
        satisfaction: -4,
      },
    ],
  },
];
