import type { CultStoryDefinition } from './cultStories';

/** Rare pressure points with actual people, costs and consequences. */
export const cultDramaticStories: readonly CultStoryDefinition[] = [
  {
    id: 'red-tagged-exit',
    source: 'dramatic',
    title: 'Your throne blocks the exit',
    role: 'organiser',
    need: 'headquarters',
    minFollowers: 80,
    rarity: 'uncommon',
    body: 'An inspector finds your ceremonial chair blocking the fire exit. {member} calls moving it a theological problem. The inspector asks whether theology is flammable.',
    choices: [
      {
        id: 'make-safe',
        label: 'Move it and pay for repairs',
        costBps: 120,
        loyalty: -2,
        satisfaction: 7,
        reputation: 6,
        heat: -4,
        memberLoyalty: 5,
        result:
          'You drag your chair away and pay for the safety work. {member} has to find a new place for you to look important.',
        journal:
          'I paid for safety work after our ceremonial chair blocked the emergency exit.',
        resultTitle: 'A less fatal throne',
      },
      {
        id: 'cancel',
        label: 'Cancel the gathering',
        growth: -15,
        satisfaction: -4,
        reputation: 3,
        heat: 3,
        result:
          'You cancel the gathering. Followers leave, several for good. Your empty throne gets the whole unsafe room to itself.',
        journal:
          'I cancelled a gathering because our emergency exit was blocked.',
        resultTitle: 'No one takes a seat',
      },
      {
        id: 'blame',
        label: 'Blame the organiser',
        loyalty: 2,
        heat: 12,
        memberLoyalty: -25,
        action: 'humiliate',
        result:
          'You blame {member}. They look at your chair, then at you, while you explain how little this has to do with you.',
        journal:
          'I publicly blamed {member} for the chair blocking our emergency exit.',
        resultTitle: 'Your chair, their fault',
      },
    ],
  },
  {
    id: 'payout-on-projector',
    source: 'dramatic',
    title: 'Your payout on the wall',
    role: 'treasurer',
    need: 'payout',
    rarity: 'rare',
    body: '{member} projects your leader payouts onto the wall during a ceremony. People outside can read the amounts. You had planned to discuss sacrifice.',
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
          'You fund an independent review. Members ask the reviewer to start with the figures currently illuminating the wall.',
        journal:
          'I funded an independent review after {member} projected my actual payouts during a ceremony.',
        resultTitle: 'Now show your working',
      },
      {
        id: 'punish',
        label: 'Expel the treasurer',
        loyalty: -6,
        reputation: -8,
        heat: 16,
        action: 'expel',
        result:
          'You expel {member}. They leave with the records and followers who have just read them. Your payouts are still on the wall.',
        journal:
          'I expelled {member} after they displayed my recorded leader payouts.',
        resultTitle: 'They take the evidence',
      },
      {
        id: 'envelope',
        label: 'Move more funds to your account',
        loyalty: -5,
        heat: 18,
        memberLoyalty: -20,
        action: 'misuse',
        result:
          'You transfer more communal money to yourself during the argument about your payouts. Investigators now have another transfer to follow.',
        journal:
          'I diverted real communal funds while members were questioning my leader payouts.',
        resultTitle: 'One more transfer',
      },
    ],
  },
  {
    id: 'second-microphone',
    source: 'dramatic',
    title: 'They rehearsed the coup',
    role: 'deputy',
    need: 'ambition',
    minFollowers: 60,
    rarity: 'rare',
    body: '{member} has brought a second microphone and a speech explaining why the movement has outgrown you. Several members start moving their chairs toward them. They have rehearsed this.',
    choices: [
      {
        id: 'listen',
        label: 'Let them make their case',
        loyalty: -4,
        satisfaction: 7,
        reputation: 4,
        memberLoyalty: 10,
        ambition: 12,
        result:
          'You let {member} finish. They get applause and look at you while accepting it. You are still the leader when the room empties.',
        journal:
          'I let {member} publicly challenge my leadership instead of silencing them.',
        resultTitle: 'Still your stage. For now.',
      },
      {
        id: 'expel',
        label: 'Expel the challenger',
        loyalty: -7,
        heat: 12,
        action: 'expel',
        result:
          'You expel {member}. Followers get up and leave with them. You keep talking into the microphone until the door closes.',
        journal: 'I expelled {member} after their public leadership challenge.',
        resultTitle: 'A following walks out',
      },
      {
        id: 'ridicule',
        label: 'Make the room laugh at them',
        loyalty: 4,
        heat: 9,
        memberLoyalty: -30,
        ambition: 8,
        action: 'humiliate',
        result:
          'You turn {member}’s challenge into a joke. They wait through the laughter without smiling. Then they put down the microphone.',
        journal:
          'I humiliated {member} during their public leadership challenge.',
        resultTitle: 'A laugh they will remember',
      },
    ],
  },
  {
    id: 'last-bus-out',
    source: 'dramatic',
    title: 'Your followers packed bags',
    rule: 'monthly-attendance',
    role: 'organiser',
    minFollowers: 40,
    rarity: 'uncommon',
    body: 'Your compulsory late meeting is still going. {member} is waiting beside the last bus with members carrying packed bags. They are leaving more than the meeting.',
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
          "You drop compulsory attendance. Members wait for you to say it again before picking up their bags.",
        journal:
          'I dropped compulsory attendance when members started leaving the late meeting with packed bags.',
        resultTitle: 'They can catch the bus',
      },
      {
        id: 'transport',
        label: 'Pay to get everyone home',
        costBps: 140,
        loyalty: 4,
        satisfaction: 8,
        memberLoyalty: 6,
        result:
          "You pay for transport and shorten the programme. {member} checks next month’s attendance rule. It is still compulsory.",
        journal:
          'I paid for transport after compulsory meetings left members stranded.',
        resultTitle: 'A lift without a pardon',
      },
      {
        id: 'loyal',
        label: 'Call the bus a loyalty test',
        loyalty: 5,
        satisfaction: -12,
        growth: -28,
        heat: 10,
        result:
          'You call it a test of devotion. Members board the bus and leave the organisation. You finish the test with a smaller congregation.',
        journal:
          'I called the last bus a test of devotion and lost followers over it.',
        resultTitle: 'The bus wins',
      },
    ],
  },
  {
    id: 'donor-wants-the-altar',
    source: 'dramatic',
    title: 'Your revelation has a sponsor',
    doctrine: 'wealth-receipts',
    role: 'treasurer',
    minFollowers: 80,
    rarity: 'rare',
    body: 'A wealthy visitor offers a large donation if every future gathering thanks them by name. {member} holds the proposed banner. It is larger than your actual altar.',
    choices: [
      {
        id: 'accept',
        label: 'Take the donation',
        incomeBps: 900,
        loyalty: -8,
        reputation: -6,
        heat: 12,
        ambition: 5,
        result:
          'You take the donation. {member} holds up the banner while you explain why the sponsor’s name now belongs in every gathering.',
        journal:
          'I accepted a large conditional donation and the sponsor’s oversized ceremony banner.',
        resultTitle: 'Please thank your sponsor',
      },
      {
        id: 'small',
        label: 'Pay for a smaller fundraiser',
        costBps: 70,
        incomeBps: 180,
        loyalty: 4,
        reputation: 5,
        memberLoyalty: 6,
        result:
          'You pay for a fundraiser and collect its proceeds. It raises less than the offer. {member} can put down the banner.',
        journal:
          'I held a smaller fundraiser after refusing to sell control of our ceremonies.',
        resultTitle: 'A smaller cheque',
      },
      {
        id: 'refuse',
        label: 'Refuse the deal',
        loyalty: 6,
        reputation: 4,
        satisfaction: -2,
        result:
          'You refuse. The visitor takes back the donation offer. {member} looks relieved; your treasurer looks at the bills.',
        journal:
          'I refused a donation that would have turned our gatherings into advertising.',
        resultTitle: 'The donor keeps the money',
      },
    ],
  },
  {
    id: 'rival-buys-the-breakfast',
    source: 'dramatic',
    title: 'Your rival offers breakfast',
    need: 'rival',
    role: 'organiser',
    minFollowers: 60,
    rarity: 'uncommon',
    body: '{rival} has invited {member} to breakfast and offered them a better chair, free meals and "a leader who listens". Your organiser has brought the offer to you instead of quietly accepting it.',
    choices: [
      {
        id: 'support',
        label: 'Pay them support and thank them',
        costBps: 100,
        memberLoyalty: 16,
        ambition: 5,
        loyalty: 3,
        action: 'aid',
        result:
          'You pay {member} support and thank them for showing you the offer. They look relieved that breakfast has not become a loyalty hearing.',
        journal:
          'I paid {member} practical support after they showed me the rival’s recruitment offer.',
        resultTitle: 'Thanks with a payment',
      },
      {
        id: 'reconcile',
        label: 'Ask the rival to talk',
        action: 'reconcile',
        loyalty: -2,
        reputation: 5,
        heat: -3,
        memberLoyalty: 8,
        result:
          'You use the invitation to reopen talks with {rival}. Neither leader wants to admit how much of this argument concerns a chair.',
        journal:
          'I used the rival’s offer to {member} as a reason to reopen reconciliation.',
        resultTitle: 'An opening over breakfast',
      },
      {
        id: 'traitor',
        label: 'Expel them for considering it',
        action: 'expel',
        loyalty: -5,
        heat: 11,
        result:
          'You expel the person who warned you. Followers leave with {member}. Your rival has barely had to butter the toast.',
        journal: 'I expelled {member} for bringing me a rival’s offer.',
        resultTitle: 'You finish the recruitment',
      },
    ],
  },
  {
    id: 'parents-at-the-gates',
    source: 'dramatic',
    title: 'Families at your locked gate',
    need: 'family',
    rule: 'private-rituals',
    minFollowers: 40,
    rarity: 'rare',
    body: '{relative} arrives with worried families. Your private-ceremony rule keeps them outside. {member} guards the entrance while someone films you refusing to let them see in.',
    choices: [
      {
        id: 'open',
        label: 'End the private-ceremony rule',
        action: 'relax',
        loyalty: -6,
        satisfaction: 8,
        reputation: 8,
        heat: -6,
        result:
          'You open the meeting to the families. Devoted members object to losing the secrecy while {relative} looks around the room.',
        journal:
          'I opened our meetings after {relative} arrived with worried families.',
        resultTitle: 'The families come inside',
      },
      {
        id: 'host',
        label: 'Pay for a family gathering',
        costBps: 110,
        reputation: 5,
        satisfaction: 5,
        heat: -2,
        result:
          'You fund a separate gathering. {relative} asks why a special invitation is needed to see what the usual meetings are like.',
        journal:
          'I funded a family gathering after {relative} challenged our guarded entrance.',
        resultTitle: 'Visitors on your terms',
      },
      {
        id: 'guard',
        label: 'Make the member defend the gate',
        memberLoyalty: -24,
        heat: 15,
        reputation: -9,
        action: 'humiliate',
        result:
          'You make {member} explain the locked gate to {relative}. The camera stays on them while you stay behind it.',
        journal:
          'I made {member} publicly defend our closed gate against {relative} and the other families.',
        resultTitle: 'Your follower takes the heat',
      },
    ],
  },
  {
    id: 'kettle-ownership-war',
    source: 'dramatic',
    title: 'Two kettles. One true faith.',
    doctrine: 'sacred-kettle',
    role: 'treasurer',
    rarity: 'uncommon',
    body: 'Two groups claim to own the authentic ceremonial kettle. {member} has brought purchase receipts, a solicitor’s estimate and a third kettle nobody will admit buying. The argument is splitting the room.',
    choices: [
      {
        id: 'settle',
        label: 'Pay for mediation',
        costBps: 130,
        satisfaction: 7,
        reputation: 4,
        loyalty: -2,
        memberLoyalty: 8,
        result:
          'You pay for mediation and show the receipts. Both sides accept the settlement while insisting their kettle boils with greater authority.',
        journal:
          'I paid for mediation when competing sacred kettles divided the members.',
        resultTitle: 'The kettles keep their counsel',
      },
      {
        id: 'broadcast',
        label: 'Let the treasurer explain on camera',
        action: 'recruiter',
        memberLoyalty: 9,
        ambition: 8,
        growth: 8,
        heat: 3,
        result:
          'You give {member} the camera and the receipts. They begin explaining the evidence. The room watches them instead of you.',
        journal:
          'I gave {member} a public platform to explain the sacred-kettle receipts.',
        resultTitle: 'A new voice in the dispute',
      },
      {
        id: 'purge',
        label: 'Expel the treasurer',
        action: 'expel',
        loyalty: 3,
        reputation: -7,
        heat: 12,
        result:
          'You expel {member} for bringing evidence. They take the receipts with them. The kettles are still sitting there, equally unable to explain you.',
        journal:
          'I expelled {member} for bringing receipts to the sacred-kettle dispute.',
        resultTitle: 'The receipts leave with them',
      },
    ],
  },
  {
    id: 'blackout-countdown',
    source: 'dramatic',
    title: 'Your apocalypse blew a fuse',
    doctrine: 'reality-stutters',
    role: 'organiser',
    minFollowers: 80,
    rarity: 'rare',
    body: 'During a public reality-reboot countdown, the lights go out. {member} finds an ordinary electrical fault. Members outside are calling it the beginning of the end. You can hear people running.',
    choices: [
      {
        id: 'explain',
        label: 'Stop it and pay for safety work',
        costBps: 160,
        loyalty: -5,
        satisfaction: 7,
        reputation: 6,
        heat: -4,
        result:
          'You stop the countdown, pay for safe exits and electrical work, and explain the fault. Someone asks if the electrician outranks you now.',
        journal:
          'I stopped a reboot countdown and funded a safe exit after an electrical fault frightened the members.',
        resultTitle: 'An electrician ends the world',
      },
      {
        id: 'cancel',
        label: 'Cancel and send everyone home',
        growth: -18,
        loyalty: -4,
        reputation: 2,
        heat: 4,
        result:
          'You cancel and send everyone home. Followers leave for good after spending the countdown frightened in the dark.',
        journal:
          'I cancelled the countdown after a blackout and sent the members home.',
        resultTitle: 'The end is postponed',
      },
      {
        id: 'miracle',
        label: 'Call it proof of the reboot',
        loyalty: 6,
        heat: 17,
        reputation: -10,
        satisfaction: -5,
        result:
          'You announce that the fault proves your prophecy. Devoted followers cheer. People outside ask why a reboot of reality needs an electrician.',
        journal: 'I called an electrical blackout proof of a reality reboot.',
        resultTitle: 'A very public power cut',
      },
    ],
  },
  {
    id: 'treasurer-last-warning',
    source: 'dramatic',
    title: 'Your treasurer has had enough',
    role: 'treasurer',
    rule: 'no-luxury',
    minFollowers: 60,
    rarity: 'uncommon',
    body: '{member} says the plain-living rule has become an excuse to expect unpaid work from them. They have brought a list of hours and an envelope for their keys. The treasury is open in front of you.',
    choices: [
      {
        id: 'pay',
        label: 'Pay the member support',
        costBps: 160,
        action: 'aid',
        memberLoyalty: 18,
        loyalty: 3,
        satisfaction: 5,
        result:
          'You pay {member} support. They put the key envelope down but leave the list of unpaid hours in front of you.',
        journal:
          'I paid {member} recorded support after their final warning about unpaid work.',
        resultTitle: 'They keep the keys',
      },
      {
        id: 'change',
        label: 'Drop the plain-living rule',
        action: 'relax',
        loyalty: -3,
        satisfaction: 8,
        memberLoyalty: 10,
        reputation: 3,
        result:
          'You drop the rule and acknowledge the work. {member} asks you to remember this conversation before volunteering their evenings again.',
        journal:
          'I relaxed the plain-living rule after {member} challenged our expectation of unpaid work.',
        resultTitle: 'Poverty is not the job',
      },
      {
        id: 'expel',
        label: 'Take the keys and expel them',
        action: 'expel',
        loyalty: -6,
        satisfaction: -6,
        heat: 10,
        result:
          'You take the keys and expel {member}. Followers walk out with them. The accounts are now your problem.',
        journal:
          'I expelled {member} after their warning about unpaid treasury work.',
        resultTitle: 'Find your own treasurer',
      },
    ],
  },
  {
    id: 'list-of-doubters',
    source: 'dramatic',
    title: 'They made a list',
    doctrine: 'outsider-tests',
    role: 'deputy',
    rarity: 'rare',
    body: '{member} has made a list of supposedly disloyal followers. It includes anyone who asked about the accounts, one visiting parent and the person who repaired the boiler. They want you to read it aloud.',
    choices: [
      {
        id: 'destroy',
        label: 'Reject it and fund open questions',
        costBps: 60,
        loyalty: -4,
        satisfaction: 9,
        reputation: 6,
        heat: -4,
        memberLoyalty: -5,
        result:
          "You reject the list and pay for an open discussion. {member} objects so fiercely that a follower points out they now qualify for their own list.",
        journal:
          'I rejected {member}’s list of doubters and funded an open discussion.',
        resultTitle: 'Questions without a blacklist',
      },
      {
        id: 'challenge',
        label: 'Make them defend the list',
        action: 'humiliate',
        loyalty: 2,
        memberLoyalty: -25,
        ambition: 6,
        heat: 8,
        result:
          'You ask {member} to explain each name aloud. The accusations collapse. They have to stand there while the room hears it happen.',
        journal:
          'I publicly challenged {member} over their list of supposed doubters.',
        resultTitle: 'Read the names back',
      },
      {
        id: 'back',
        label: 'Back the accusations',
        loyalty: 6,
        satisfaction: -12,
        growth: -24,
        heat: 16,
        reputation: -9,
        memberLoyalty: 12,
        result:
          'You back the list. Devotees applaud while the accused stand facing you. The story of your blacklist spreads outside the room.',
        journal:
          'I backed {member}’s accusations against followers who questioned us.',
        resultTitle: 'Your congregation splits',
      },
    ],
  },
  {
    id: 'opening-deposit',
    source: 'dramatic',
    title: 'You promised food and revelation',
    need: 'headquarters',
    role: 'organiser',
    minFollowers: 100,
    rarity: 'rare',
    body: '{member} has advertised an enormous headquarters celebration before checking the budget. The invitations promise free food and a revelation. Suppliers would prefer money.',
    choices: [
      {
        id: 'fund',
        label: 'Pay for the full celebration',
        costBps: 700,
        loyalty: 5,
        satisfaction: 10,
        growth: 18,
        reputation: 5,
        result:
          'You pay the suppliers and hold the celebration. When the revelation slot arrives, you direct everyone towards the food.',
        journal:
          'I funded the large headquarters celebration after {member} advertised more than the budget covered.',
        resultTitle: 'At least the food arrives',
      },
      {
        id: 'scale',
        label: 'Pay for a smaller event',
        costBps: 100,
        loyalty: -3,
        satisfaction: 4,
        reputation: 6,
        memberLoyalty: 4,
        result:
          'You fund a smaller event and publish the budget. Guests grumble about the invitation, then ask what is still being served.',
        journal:
          'I scaled back the headquarters celebration and published what we could really afford.',
        resultTitle: 'A smaller serving of destiny',
      },
      {
        id: 'blame',
        label: 'Blame the organiser in the update',
        action: 'humiliate',
        loyalty: -4,
        memberLoyalty: -24,
        heat: 12,
        reputation: -5,
        result:
          'You cancel the promises and blame {member}. Guests ask why the invitation carried your name if none of it was your responsibility.',
        journal:
          'I publicly blamed {member} for the overpromised headquarters celebration.',
        resultTitle: 'Your apology names someone else',
      },
    ],
  },
];
