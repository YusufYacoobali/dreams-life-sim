import type { CultStoryDefinition } from './cultStories';

/** Rare pressure points with actual people, costs and consequences. */
export const cultDramaticStories: readonly CultStoryDefinition[] = [
  {
    id: 'red-tagged-exit',
    source: 'dramatic',
    title: 'The Throne in the Fire Exit',
    role: 'organiser',
    need: 'headquarters',
    minFollowers: 80,
    rarity: 'uncommon',
    body: 'A venue inspector finds the emergency exit blocked by your ceremonial chair. {member} says moving the chair has become a theological issue. The inspector is not interested in theology.',
    choices: [
      {
        id: 'make-safe',
        label: 'Move it and pay for the safety work',
        costBps: 120,
        loyalty: -2,
        satisfaction: 7,
        reputation: 6,
        heat: -4,
        memberLoyalty: 5,
        result:
          'The chair moves. The safety contractor is actually paid. Members can leave by a route that does not require enlightenment.',
        journal:
          'I paid for safety work after our ceremonial chair blocked the emergency exit.',
      },
      {
        id: 'cancel',
        label: 'Cancel the gathering and explain why',
        growth: -15,
        satisfaction: -4,
        reputation: 3,
        heat: 3,
        result:
          'The event is cancelled. Some followers leave, but nobody has to squeeze past the throne in an emergency.',
        journal:
          'I cancelled a gathering because our emergency exit was blocked.',
      },
      {
        id: 'blame',
        label: 'Make the organiser take the blame',
        loyalty: 2,
        heat: 12,
        memberLoyalty: -25,
        action: 'humiliate',
        result:
          '{member} is publicly blamed for a chair everybody knew was yours. The grievance has a long memory.',
        journal:
          'I publicly blamed {member} for the chair blocking our emergency exit.',
      },
    ],
  },
  {
    id: 'payout-on-projector',
    source: 'dramatic',
    title: 'Your Payout, Forty Feet High',
    role: 'treasurer',
    need: 'payout',
    rarity: 'rare',
    body: '{member} projects your recorded leader payouts onto the wall during a ceremony. The numbers are real. The projector is so large that people outside can read them.',
    choices: [
      {
        id: 'answer',
        label: 'Pay for an independent review',
        costBps: 150,
        loyalty: -3,
        reputation: 8,
        heat: -5,
        memberLoyalty: 8,
        result:
          'An independent review is funded from the treasury. Your past payouts remain in the accounts, exactly where the members can find them.',
        journal:
          'I funded an independent review after {member} projected my actual payouts during a ceremony.',
      },
      {
        id: 'punish',
        label: 'Expel the treasurer for making a scene',
        loyalty: -6,
        reputation: -8,
        heat: 16,
        action: 'expel',
        result:
          '{member} leaves with their records and some followers. Throwing out the treasurer does not delete your payout history.',
        journal:
          'I expelled {member} after they displayed my recorded leader payouts.',
      },
      {
        id: 'envelope',
        label: 'Quietly move more money before the meeting ends',
        loyalty: -5,
        heat: 18,
        memberLoyalty: -20,
        action: 'misuse',
        result:
          'You move communal money into your own account. The bank trail gives investigators something solid to follow.',
        journal:
          'I diverted real communal funds while members were questioning my leader payouts.',
      },
    ],
  },
  {
    id: 'second-microphone',
    source: 'dramatic',
    title: 'Two Microphones, One Leader',
    role: 'deputy',
    need: 'ambition',
    minFollowers: 60,
    rarity: 'rare',
    body: '{member} has brought a second microphone and a speech explaining why the movement has outgrown you. Several members start moving their chairs toward them. They have rehearsed this.',
    choices: [
      {
        id: 'listen',
        label: 'Let the challenge be heard',
        loyalty: -4,
        satisfaction: 7,
        reputation: 4,
        memberLoyalty: 10,
        ambition: 12,
        result:
          'You remain in charge, but the challenger now has a louder voice and greater ambition. The room sees that disagreement is possible.',
        journal:
          'I let {member} publicly challenge my leadership instead of silencing them.',
      },
      {
        id: 'expel',
        label: 'Expel the challenger',
        loyalty: -7,
        heat: 12,
        action: 'expel',
        result:
          '{member} is expelled and followers leave with them. The challenger is still the same person, with the same contacts and a fresh reason to remember this.',
        journal: 'I expelled {member} after their public leadership challenge.',
      },
      {
        id: 'ridicule',
        label: 'Make a joke of them in front of everyone',
        loyalty: 4,
        heat: 9,
        memberLoyalty: -30,
        ambition: 8,
        action: 'humiliate',
        result:
          'You get a laugh. {member} gets a grievance and a reason to tell this story later.',
        journal:
          'I humiliated {member} during their public leadership challenge.',
      },
    ],
  },
  {
    id: 'last-bus-out',
    source: 'dramatic',
    title: 'The Last Bus Is Leaving',
    rule: 'monthly-attendance',
    role: 'organiser',
    minFollowers: 40,
    rarity: 'uncommon',
    body: 'Members have packed their bags after another compulsory late meeting. {member} is standing beside the last bus. This time the complaints are turning into departures.',
    choices: [
      {
        id: 'release',
        label: 'End compulsory attendance',
        action: 'relax',
        loyalty: -4,
        satisfaction: 10,
        reputation: 5,
        memberLoyalty: 8,
        result:
          'The compulsory-attendance rule is removed. Members can catch the bus without being asked to prove their loyalty.',
        journal:
          'I dropped compulsory attendance when members started leaving the late meeting with packed bags.',
      },
      {
        id: 'transport',
        label: 'Pay for transport and a shorter programme',
        costBps: 140,
        loyalty: 4,
        satisfaction: 8,
        memberLoyalty: 6,
        result:
          'The treasury pays a real transport bill. People get home, although the attendance rule still exists and may cause another argument.',
        journal:
          'I paid for transport after compulsory meetings left members stranded.',
      },
      {
        id: 'loyal',
        label: 'Say the bus is a test of devotion',
        loyalty: 5,
        satisfaction: -12,
        growth: -28,
        heat: 10,
        result:
          'Several members decide they have passed enough tests. They leave, and the follower count falls.',
        journal:
          'I called the last bus a test of devotion and lost followers over it.',
      },
    ],
  },
  {
    id: 'donor-wants-the-altar',
    source: 'dramatic',
    title: 'Sponsored Enlightenment',
    doctrine: 'wealth-receipts',
    role: 'treasurer',
    minFollowers: 80,
    rarity: 'rare',
    body: 'A wealthy visitor offers a large donation if every future gathering thanks them by name. {member} holds the proposed banner. It is larger than your actual altar.',
    choices: [
      {
        id: 'accept',
        label: 'Accept the sponsored future',
        incomeBps: 900,
        loyalty: -8,
        reputation: -6,
        heat: 12,
        ambition: 5,
        result:
          'The donation enters the communal treasury. Members notice how quickly your sacred principles acquired a sponsor.',
        journal:
          'I accepted a large conditional donation and the sponsor’s oversized ceremony banner.',
      },
      {
        id: 'small',
        label: 'Offer a smaller, ordinary fundraiser',
        costBps: 70,
        incomeBps: 180,
        loyalty: 4,
        reputation: 5,
        memberLoyalty: 6,
        result:
          'The fundraiser has an actual bill and actual proceeds. It raises less than the donor offered, but nobody buys the altar.',
        journal:
          'I held a smaller ordinary fundraiser instead of selling control of our ceremonies.',
      },
      {
        id: 'refuse',
        label: 'Refuse the donation',
        loyalty: 6,
        reputation: 4,
        satisfaction: -2,
        result:
          'The money never enters the treasury. Some members respect the decision; the treasurer still has bills to pay.',
        journal:
          'I refused a donation that would have turned our gatherings into advertising.',
      },
    ],
  },
  {
    id: 'rival-buys-the-breakfast',
    source: 'dramatic',
    title: 'Breakfast With Your Organiser',
    need: 'rival',
    role: 'organiser',
    minFollowers: 60,
    rarity: 'uncommon',
    body: '{rival} has invited {member} to breakfast and offered them a better chair, free meals and "a leader who listens". Your organiser has brought the offer to you instead of quietly accepting it.',
    choices: [
      {
        id: 'support',
        label: 'Pay practical support and thank them',
        costBps: 100,
        memberLoyalty: 16,
        ambition: 5,
        loyalty: 3,
        action: 'aid',
        result:
          '{member} receives a real support payment. They also remember that bringing you an awkward truth did not get them punished.',
        journal:
          'I paid {member} practical support after they showed me the rival’s recruitment offer.',
      },
      {
        id: 'reconcile',
        label: 'Use the invitation to reopen talks',
        action: 'reconcile',
        loyalty: -2,
        reputation: 5,
        heat: -3,
        memberLoyalty: 8,
        result:
          'Relations with the active rival improve. The offer remains part of your shared history instead of becoming an immediate feud.',
        journal:
          'I used the rival’s offer to {member} as a reason to reopen reconciliation.',
      },
      {
        id: 'traitor',
        label: 'Expel them for considering it',
        action: 'expel',
        loyalty: -5,
        heat: 11,
        result:
          'You expel the organiser who actually warned you. Some followers leave too. Your rival barely had to finish breakfast.',
        journal: 'I expelled {member} for bringing me a rival’s offer.',
      },
    ],
  },
  {
    id: 'parents-at-the-gates',
    source: 'dramatic',
    title: 'The Family Meeting You Did Not Arrange',
    need: 'family',
    rule: 'private-rituals',
    minFollowers: 40,
    rarity: 'rare',
    body: '{relative} arrives with other worried families. {member} is trying to guard the entrance. The families want to see the ordinary meetings behind your private-ritual rule, and someone is filming the gate.',
    choices: [
      {
        id: 'open',
        label: 'Drop the secrecy and open the meeting',
        action: 'relax',
        loyalty: -6,
        satisfaction: 8,
        reputation: 8,
        heat: -6,
        result:
          'The private-ritual rule is removed. Families can see a meeting instead of a guarded door. Some devoted members dislike the loss of secrecy.',
        journal:
          'I opened our meetings after {relative} arrived with worried families.',
      },
      {
        id: 'host',
        label: 'Pay for a separate family gathering',
        costBps: 110,
        reputation: 5,
        satisfaction: 5,
        heat: -2,
        result:
          'A real family gathering is funded. The secrecy rule stays in place, so the underlying argument is not magically settled.',
        journal:
          'I funded a family gathering after {relative} challenged our guarded entrance.',
      },
      {
        id: 'guard',
        label: 'Make the follower publicly defend the gate',
        memberLoyalty: -24,
        heat: 15,
        reputation: -9,
        action: 'humiliate',
        result:
          '{member} takes the public humiliation while the recording keeps running. You have given both the families and your follower a lasting grievance.',
        journal:
          'I made {member} publicly defend our closed gate against {relative} and the other families.',
      },
    ],
  },
  {
    id: 'kettle-ownership-war',
    source: 'dramatic',
    title: 'The Kettle Has Lawyers Now',
    doctrine: 'sacred-kettle',
    role: 'treasurer',
    rarity: 'uncommon',
    body: 'Two groups claim to own the authentic ceremonial kettle. {member} has brought purchase receipts, a solicitor’s estimate and a third kettle nobody will admit buying. The argument is splitting the room.',
    choices: [
      {
        id: 'settle',
        label: 'Pay for mediation and keep the receipts public',
        costBps: 130,
        satisfaction: 7,
        reputation: 4,
        loyalty: -2,
        memberLoyalty: 8,
        result:
          'The treasury pays for actual mediation. The ownership argument is settled without pretending that a whistle can identify a rightful prophet.',
        journal:
          'I paid for mediation when competing sacred kettles divided the members.',
      },
      {
        id: 'broadcast',
        label: 'Let the treasurer explain the receipts on camera',
        action: 'recruiter',
        memberLoyalty: 9,
        ambition: 8,
        growth: 8,
        heat: 3,
        result:
          '{member} gets a public voice and a chance to build a future audience. You may not control what that audience learns to admire.',
        journal:
          'I gave {member} a public platform to explain the sacred-kettle receipts.',
      },
      {
        id: 'purge',
        label: 'Expel the treasurer for bringing evidence',
        action: 'expel',
        loyalty: 3,
        reputation: -7,
        heat: 12,
        result:
          '{member} leaves with the receipts and some followers. The remaining kettle does not become more convincing.',
        journal:
          'I expelled {member} for bringing receipts to the sacred-kettle dispute.',
      },
    ],
  },
  {
    id: 'blackout-countdown',
    source: 'dramatic',
    title: 'The Countdown Goes Dark',
    doctrine: 'reality-stutters',
    role: 'organiser',
    minFollowers: 80,
    rarity: 'rare',
    body: 'During a public reality-reboot countdown, the lights go out. {member} finds an ordinary electrical fault. Members outside are calling it the beginning of the end. You can hear people running.',
    choices: [
      {
        id: 'explain',
        label: 'Stop the countdown and fund a safe exit',
        costBps: 160,
        loyalty: -5,
        satisfaction: 7,
        reputation: 6,
        heat: -4,
        result:
          'The safe exit and electrical work are paid for. You tell members it was a fault, which is less thrilling and much more useful.',
        journal:
          'I stopped a reboot countdown and funded a safe exit after an electrical fault frightened the members.',
      },
      {
        id: 'cancel',
        label: 'Cancel and send everyone home',
        growth: -18,
        loyalty: -4,
        reputation: 2,
        heat: 4,
        result:
          'The gathering ends and some followers do not return. You resist the temptation to call an electrical fault cosmic evidence.',
        journal:
          'I cancelled the countdown after a blackout and sent the members home.',
      },
      {
        id: 'miracle',
        label: 'Declare the fault proof of the reboot',
        loyalty: 6,
        heat: 17,
        reputation: -10,
        satisfaction: -5,
        result:
          'The claim excites devoted members and makes the wider scrutiny worse. The actual fault remains an ordinary fault.',
        journal: 'I called an electrical blackout proof of a reality reboot.',
      },
    ],
  },
  {
    id: 'treasurer-last-warning',
    source: 'dramatic',
    title: 'The Treasurer’s Last Warning',
    role: 'treasurer',
    rule: 'no-luxury',
    minFollowers: 60,
    rarity: 'uncommon',
    body: '{member} says the plain-living rule has become an excuse to expect unpaid work from them. They have brought a list of hours and an envelope for their keys. The treasury is open in front of you.',
    choices: [
      {
        id: 'pay',
        label: 'Pay recorded member support',
        costBps: 160,
        action: 'aid',
        memberLoyalty: 18,
        loyalty: 3,
        satisfaction: 5,
        result:
          'Actual support reaches {member}’s account. They keep their responsibility, and the payment remains visible in both sides of the records.',
        journal:
          'I paid {member} recorded support after their final warning about unpaid work.',
      },
      {
        id: 'change',
        label: 'Relax the rule and acknowledge the work',
        action: 'relax',
        loyalty: -3,
        satisfaction: 8,
        memberLoyalty: 10,
        reputation: 3,
        result:
          'The plain-living rule is removed. You acknowledge that financial hardship is not a qualification for doing the accounts.',
        journal:
          'I relaxed the plain-living rule after {member} challenged our expectation of unpaid work.',
      },
      {
        id: 'expel',
        label: 'Take the keys and expel them',
        action: 'expel',
        loyalty: -6,
        satisfaction: -6,
        heat: 10,
        result:
          'The treasurer is expelled. Their history, memories and possible future grievances remain, and followers leave with them.',
        journal:
          'I expelled {member} after their warning about unpaid treasury work.',
      },
    ],
  },
  {
    id: 'list-of-doubters',
    source: 'dramatic',
    title: 'The List of Doubters',
    doctrine: 'outsider-tests',
    role: 'deputy',
    rarity: 'rare',
    body: '{member} has made a list of supposedly disloyal followers. It includes anyone who asked about the accounts, one visiting parent and the person who repaired the boiler. They want you to read it aloud.',
    choices: [
      {
        id: 'destroy',
        label: 'Reject the list and fund an open discussion',
        costBps: 60,
        loyalty: -4,
        satisfaction: 9,
        reputation: 6,
        heat: -4,
        memberLoyalty: -5,
        result:
          'The public accusation is stopped and an open discussion is actually funded. Your deputy dislikes losing that authority; ordinary members can ask a question without joining a list.',
        journal:
          'I rejected {member}’s list of doubters and funded an open discussion.',
      },
      {
        id: 'challenge',
        label: 'Make the deputy defend the list publicly',
        action: 'humiliate',
        loyalty: 2,
        memberLoyalty: -25,
        ambition: 6,
        heat: 8,
        result:
          'The list falls apart under questions. Your deputy remembers being made the public example and may tell their own version later.',
        journal:
          'I publicly challenged {member} over their list of supposed doubters.',
      },
      {
        id: 'back',
        label: 'Back the deputy’s accusations',
        loyalty: 6,
        satisfaction: -12,
        growth: -24,
        heat: 16,
        reputation: -9,
        memberLoyalty: 12,
        result:
          'Devoted members applaud. Others leave the organisation, and the accusations create a public scandal.',
        journal:
          'I backed {member}’s accusations against followers who questioned us.',
      },
    ],
  },
  {
    id: 'opening-deposit',
    source: 'dramatic',
    title: 'The Deposit Has Cleared',
    need: 'headquarters',
    role: 'organiser',
    minFollowers: 100,
    rarity: 'rare',
    body: '{member} has advertised an enormous headquarters celebration before checking the budget. The invitations promise free food and a revelation. Suppliers would prefer money.',
    choices: [
      {
        id: 'fund',
        label: 'Fund a proper community celebration',
        costBps: 700,
        loyalty: 5,
        satisfaction: 10,
        growth: 18,
        reputation: 5,
        result:
          'The suppliers are actually paid from the communal treasury. A well-funded celebration brings new followers who pay their joining fees. There is no invented revelation.',
        journal:
          'I funded the large headquarters celebration after {member} advertised more than the budget covered.',
      },
      {
        id: 'scale',
        label: 'Scale it down and publish the budget',
        costBps: 100,
        loyalty: -3,
        satisfaction: 4,
        reputation: 6,
        memberLoyalty: 4,
        result:
          'A smaller real event is funded. Some guests are disappointed, but the budget can support what you actually offer.',
        journal:
          'I scaled back the headquarters celebration and published what we could really afford.',
      },
      {
        id: 'blame',
        label: 'Blame the organiser in the invitation update',
        action: 'humiliate',
        loyalty: -4,
        memberLoyalty: -24,
        heat: 12,
        reputation: -5,
        result:
          'The promises are cancelled and your organiser gets the public blame. The people who received your invitations are not impressed by the distinction.',
        journal:
          'I publicly blamed {member} for the overpromised headquarters celebration.',
      },
    ],
  },
];
