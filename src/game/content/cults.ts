/** Original fictional beliefs. All modifiers are bounded by cultModifiers. */
export type CultModifiers = {
  growth: number;
  loyalty: number;
  satisfaction: number;
  expenses: number;
  donations: number;
  heat: number;
};
export type CultBelief = {
  id: string;
  title: string;
  description: string;
  modifiers: Partial<CultModifiers>;
};
export const cultPhilosophies = [
  {
    id: 'dream-archive',
    title: 'The Dream Archive',
    description: 'Your dreams are leaks from lives you nearly lived. Even the one where you married a traffic cone.',
    modifiers: { growth: 35, loyalty: 1 },
  },
  {
    id: 'final-update',
    title: 'The Final Update',
    description: 'Reality is broken. You claim to know when the replacement arrives.',
    modifiers: { growth: 55, heat: 1 },
  },
  {
    id: 'cosmic-accounting',
    title: 'Cosmic Accounting',
    description: 'The universe owes you. You intend to collect.',
    modifiers: { donations: 18, heat: 1 },
  },
  {
    id: 'last-picnic',
    title: 'The Last Picnic',
    description: 'The world is ending. Nobody should face it on an empty stomach.',
    modifiers: { satisfaction: 2, expenses: 8 },
  },
  {
    id: 'chosen-lost',
    title: 'The Selectively Chosen',
    description:
      'Only a handful of people know the truth. Conveniently, you get to choose them.',
    modifiers: { loyalty: 2, growth: -25 },
  },
  {
    id: 'eternal-self',
    title: 'The Eternal Self',
    description:
      'You can become your perfect self. Your current self will need to attend meetings.',
    modifiers: { satisfaction: 1, loyalty: 1 },
  },
  {
    id: 'quiet-orbit',
    title: 'The Quiet Orbit',
    description:
      'The universe speaks when everyone shuts up. Getting them to shut up is your first challenge.',
    modifiers: { heat: -1, growth: -15, loyalty: 1 },
  },
  {
    id: 'ordinary-miracles',
    title: 'Ordinary Miracles',
    description:
      'Miracles are hiding in plain sight. Start with the kettle and work outwards.',
    modifiers: { growth: 30, donations: 8 },
  },
] as const satisfies readonly CultBelief[];
export const cultDoctrineIds = [
  'borrowed-dreams',
  'reality-stutters',
  'moon-lessons',
  'wealth-receipts',
  'future-mail',
  'animal-observers',
  'sacred-kettle',
  'lost-hours',
  'recycled-souls',
  'cosmic-refunds',
  'invisible-committee',
  'chosen-mistakes',
  'silent-wisdom',
  'good-omens',
  'endless-monday',
  'parallel-council',
  'weather-moods',
  'sacred-leftovers',
  'shared-fortune',
  'golden-aura',
  'unfinished-world',
  'sleeping-genius',
  'kindness-interest',
  'number-seven',
  'outsider-tests',
  'memory-garden',
  'public-answers',
  'leader-fallible',
] as const;
export type CultDoctrineId = (typeof cultDoctrineIds)[number];
export const cultDoctrines: readonly (CultBelief & { id: CultDoctrineId })[] = [
  {
    id: 'borrowed-dreams',
    title: 'Borrowed Dreams',
    description: 'Dreams belong to your other selves. Someone out there really did go shopping naked.',
    modifiers: { loyalty: 1 },
  },
  {
    id: 'reality-stutters',
    title: 'Reality Stutters',
    description: 'Déjà vu means reality has glitched. Repeating yourself counts as evidence.',
    modifiers: { growth: 25 },
  },
  {
    id: 'moon-lessons',
    title: 'Lunar Intelligence',
    description: 'The moon makes people clever. A bad idea may be blamed on its current phase.',
    modifiers: { loyalty: 1, heat: 1 },
  },
  {
    id: 'wealth-receipts',
    title: 'Wealth Is a Receipt',
    description: 'Money proves the cosmos favours you. Poverty will require a longer explanation.',
    modifiers: { donations: 12, heat: 1 },
  },
  {
    id: 'future-mail',
    title: 'Tomorrow Writes Back',
    description: 'You receive messages from next year. Followers must take your word for the postmark.',
    modifiers: { growth: 35, heat: 1 },
  },
  {
    id: 'animal-observers',
    title: 'The Observers Have Paws',
    description: 'Animals are judging humanity. Cats have already made up their minds.',
    modifiers: { growth: 20, satisfaction: 1 },
  },
  {
    id: 'sacred-kettle',
    title: 'The Kettle Knows',
    description: 'A household object knows more than any of you. Consult it before making decisions.',
    modifiers: { donations: 7, heat: 1 },
  },
  {
    id: 'lost-hours',
    title: 'The Missing Hour',
    description: 'Missing time has been saved for later. Nobody can explain how to withdraw it.',
    modifiers: { loyalty: 1 },
  },
  {
    id: 'recycled-souls',
    title: 'Previously Loved Souls',
    description: 'You have lived before. Your old self may owe several people an apology.',
    modifiers: { growth: 20 },
  },
  {
    id: 'cosmic-refunds',
    title: 'Cosmic Refunds',
    description: 'Good deeds buy credit against bad luck. Refund claims go directly to the universe.',
    modifiers: { donations: 8, satisfaction: 1 },
  },
  {
    id: 'invisible-committee',
    title: 'The Invisible Committee',
    description: 'An invisible committee approves your decisions. Its attendance record is impeccable.',
    modifiers: { loyalty: 1, growth: -15 },
  },
  {
    id: 'chosen-mistakes',
    title: 'Sacred Mistakes',
    description: 'Your mistakes serve a higher plan. Followers may ask whose plan, at their own risk.',
    modifiers: { loyalty: 1, heat: 1 },
  },
  {
    id: 'silent-wisdom',
    title: 'Silence Has Answers',
    description:
      'Answers come through silence. Resist the urge to help them along with a speech.',
    modifiers: { satisfaction: 1 },
  },
  {
    id: 'good-omens',
    title: 'Small Good Omens',
    description: 'A lucky coincidence may be a sign. Keep your eyes open without letting go of the steering wheel.',
    modifiers: { growth: 15, satisfaction: 1 },
  },
  {
    id: 'endless-monday',
    title: 'The Last Monday',
    description: 'One final Monday will reset the working week. You are still working on which Monday.',
    modifiers: { growth: 25, heat: 1 },
  },
  {
    id: 'parallel-council',
    title: 'The Parallel Council',
    description: 'Another version of your group makes perfect decisions. You advise copying them.',
    modifiers: { growth: 20, loyalty: 1 },
  },
  {
    id: 'weather-moods',
    title: 'Emotional Weather',
    description: 'The universe expresses its feelings through the weather. Storms are best taken personally.',
    modifiers: { growth: 15 },
  },
  {
    id: 'sacred-leftovers',
    title: 'Nothing Is Wasted',
    description: 'Nothing deserves to be thrown away. This includes dinner and people who have made a mess of their lives.',
    modifiers: { expenses: -5, satisfaction: 1 },
  },
  {
    id: 'shared-fortune',
    title: 'Shared Fortune',
    description: 'If everyone built the fortune, everyone should benefit from it. The treasurer may ask you to go first.',
    modifiers: { donations: 5, expenses: 5, loyalty: 1 },
  },
  {
    id: 'golden-aura',
    title: 'The Golden Aura',
    description: 'You glow with spiritual power. Larger donors are particularly good at seeing it.',
    modifiers: { donations: 15, heat: 2, growth: -15 },
  },
  {
    id: 'unfinished-world',
    title: 'An Unfinished World',
    description: 'The world is unfinished. You claim to know what should go in the next version.',
    modifiers: { growth: 25 },
  },
  {
    id: 'sleeping-genius',
    title: 'Sleeping Genius',
    description: 'Everyone has a hidden genius. Give it somewhere to wake up.',
    modifiers: { satisfaction: 1, growth: 20 },
  },
  {
    id: 'kindness-interest',
    title: 'Kindness Pays Interest',
    description: 'Help someone now and the world will owe you one. Do not expect a receipt.',
    modifiers: { donations: 6, heat: -1 },
  },
  {
    id: 'number-seven',
    title: 'Seven Means Something',
    description:
      'Seven is everywhere. Count enthusiastically until you find it.',
    modifiers: { loyalty: 1 },
  },
  {
    id: 'outsider-tests',
    title: 'The Outsider Test',
    description: 'Critics have been sent to test your faith. Passing rarely involves agreeing with them.',
    modifiers: { loyalty: 2, growth: -35, heat: 1 },
  },
  {
    id: 'memory-garden',
    title: 'Memories Take Root',
    description: 'Give people a place to remember those they have lost. Leave room for silence.',
    modifiers: { loyalty: 1, satisfaction: 1 },
  },
  {
    id: 'public-answers',
    title: 'Questions Are Welcome',
    description: 'Beliefs must stand up to questions. Including the ones you would prefer nobody asked.',
    modifiers: { growth: 25, heat: -1 },
  },
  {
    id: 'leader-fallible',
    title: 'Even Leaders Get It Wrong',
    description:
      'The leader can be wrong. Saying so should not require a resignation.',
    modifiers: { heat: -1, loyalty: -1, growth: 25 },
  },
];
export const cultRuleIds = [
  'friday-blue',
  'no-phones',
  'dream-journal',
  'minute-silence',
  'monthly-dinner',
  'sacred-object',
  'monthly-attendance',
  'open-books',
  'uniform-robes',
  'early-rising',
  'guest-night',
  'vegetable-day',
  'no-titles',
  'leader-first',
  'questions-after',
  'mutual-aid',
  'quiet-hour',
  'walking-meetings',
  'no-gossip',
  'family-day',
  'volunteer-day',
  'weekly-letter',
  'no-luxury',
  'public-rituals',
  'private-rituals',
  'shared-chores',
  'annual-retreat',
  'opt-out',
] as const;
export type CultRuleId = (typeof cultRuleIds)[number];
export const cultRules: readonly (CultBelief & { id: CultRuleId })[] = [
  {
    id: 'friday-blue',
    title: 'Blue on Fridays',
    description: 'Wear blue to Friday meetings. Prepare to argue about turquoise.',
    modifiers: { loyalty: 1 },
  },
  {
    id: 'no-phones',
    title: 'No Phones at Ceremonies',
    description: 'Leave phones outside ceremonies. Revelations must wait to be posted.',
    modifiers: { loyalty: 1, growth: -15 },
  },
  {
    id: 'dream-journal',
    title: 'Daily Dream Journal',
    description: 'Write down every morning’s dreams. “I forgot” makes a very short revelation.',
    modifiers: { loyalty: 1 },
  },
  {
    id: 'minute-silence',
    title: 'One Quiet Minute',
    description: 'Start each gathering with a full minute of silence. The leader too.',
    modifiers: { satisfaction: 1 },
  },
  {
    id: 'monthly-dinner',
    title: 'Monthly Group Dinner',
    description: 'Help fund a shared dinner each month. Feed the followers as well as the inner circle.',
    modifiers: { satisfaction: 2, expenses: 8 },
  },
  {
    id: 'sacred-object',
    title: 'Consult the Sacred Object',
    description: 'Consult the sacred object before major decisions. Wait for an answer with conviction.',
    modifiers: { loyalty: 1, growth: -20, heat: 1 },
  },
  {
    id: 'monthly-attendance',
    title: 'Compulsory Attendance',
    description: 'Everyone must attend the monthly meeting. Expect excuses, then arguments about the excuses.',
    modifiers: { loyalty: 2, growth: -35, satisfaction: -1 },
  },
  {
    id: 'open-books',
    title: 'Open the Accounts',
    description: 'Let members inspect the spending. Be ready to explain your name beside a payout.',
    modifiers: { heat: -1, donations: 6 },
  },
  {
    id: 'uniform-robes',
    title: 'Matching Robes',
    description: 'Wear matching robes. Enlightenment now comes in sizes.',
    modifiers: { loyalty: 1, expenses: 6, growth: -15 },
  },
  {
    id: 'early-rising',
    title: 'Dawn Reflection',
    description: 'Reflect at dawn. Try not to convert the whole street through an alarm.',
    modifiers: { loyalty: 1, satisfaction: -1 },
  },
  {
    id: 'guest-night',
    title: 'Bring a Guest',
    description: 'Welcome outsiders once a month. Let them ask what they have walked into.',
    modifiers: { growth: 35, expenses: 4 },
  },
  {
    id: 'vegetable-day',
    title: 'Vegetable Wednesday',
    description: 'Wednesday meals are vegetarian. The vegetables need no further ceremony.',
    modifiers: { expenses: -3, satisfaction: 1 },
  },
  {
    id: 'no-titles',
    title: 'First Names Only',
    description: 'Use first names, even for the leader. Practise hearing yours without a prefix.',
    modifiers: { growth: 20, loyalty: -1 },
  },
  {
    id: 'leader-first',
    title: 'The Leader Speaks First',
    description: 'The leader speaks first. Everyone else practises waiting.',
    modifiers: { loyalty: 2, heat: 1, growth: -25 },
  },
  {
    id: 'questions-after',
    title: 'Questions After the Bell',
    description: 'Hold questions until the speech ends. This gives the speech a powerful reason to end.',
    modifiers: { loyalty: 1, satisfaction: -1 },
  },
  {
    id: 'mutual-aid',
    title: 'Help a Member',
    description: 'Keep a fund for members in need. Requests may arrive before your next sermon about generosity.',
    modifiers: { loyalty: 1, expenses: 7 },
  },
  {
    id: 'quiet-hour',
    title: 'Evening Quiet Hour',
    description: 'Keep an evening hour free of noise. This includes explaining the benefits of silence.',
    modifiers: { satisfaction: 1, growth: -10 },
  },
  {
    id: 'walking-meetings',
    title: 'Meetings on Foot',
    description: 'Discuss group business on foot. The pace may depend on the argument.',
    modifiers: { expenses: -3, satisfaction: 1 },
  },
  {
    id: 'no-gossip',
    title: 'No Internal Gossip',
    description: 'Take complaints to the adviser before telling the group chat. Yes, that complaint too.',
    modifiers: { loyalty: 1, heat: 1 },
  },
  {
    id: 'family-day',
    title: 'Keep a Family Day',
    description: 'Keep one day a week for life outside the group. Families may check that you mean it.',
    modifiers: { satisfaction: 2, heat: -1 },
  },
  {
    id: 'volunteer-day',
    title: 'A Day of Service',
    description: 'Volunteer locally each month. Being seen helping is optional; helping is the point.',
    modifiers: { growth: 20, expenses: 3, heat: -1 },
  },
  {
    id: 'weekly-letter',
    title: 'The Weekly Letter',
    description: 'Print a weekly update. Members can read the news without waiting for you to finish it aloud.',
    modifiers: { loyalty: 1, expenses: 4 },
  },
  {
    id: 'no-luxury',
    title: 'Plain Living',
    description: 'Leave showy luxuries outside meetings. The leader’s chair may come under scrutiny.',
    modifiers: { expenses: -4, donations: -5 },
  },
  {
    id: 'public-rituals',
    title: 'Open Ceremonies',
    description: 'Let outsiders watch your gatherings. Behave as though they might describe them later.',
    modifiers: { growth: 30, heat: -1 },
  },
  {
    id: 'private-rituals',
    title: 'Members Only',
    description: 'Keep ceremonies closed to outsiders. Expect questions from the people left at the gate.',
    modifiers: { loyalty: 2, growth: -30, heat: 1 },
  },
  {
    id: 'shared-chores',
    title: 'Everyone Takes a Turn',
    description: 'Rotate the cleaning and serving. Rank does not empty the bins.',
    modifiers: { expenses: -6, satisfaction: -1 },
  },
  {
    id: 'annual-retreat',
    title: 'An Annual Retreat',
    description: 'Put money aside for a yearly retreat. Announcing it will not pay for it.',
    modifiers: { loyalty: 1, expenses: 9 },
  },
  {
    id: 'opt-out',
    title: 'Let People Sit It Out',
    description: 'Let members skip a ritual without explaining themselves. Do not turn opting out into another ritual.',
    modifiers: { growth: 25, satisfaction: 1, loyalty: -1 },
  },
];
export const cultHeadquartersIds = [
  'meeting-room',
  'woodland',
  'farmhouse',
  'compound',
  'sanctuary',
] as const;
export const cultHeadquarters = [
  {
    id: 'meeting-room',
    title: 'Small Meeting Room',
    description: 'A rented room and folding chairs. You will need to sound convincing at close range.',
    capacity: 40,
    costBps: 400,
    maintenanceBps: 8,
    appeal: 0,
  },
  {
    id: 'woodland',
    title: 'Woodland Retreat',
    description: 'Cabins in the woods. Ideal for revelations, less ideal for anyone who needs directions.',
    capacity: 180,
    costBps: 1400,
    maintenanceBps: 22,
    appeal: 15,
  },
  {
    id: 'farmhouse',
    title: 'Converted Farmhouse',
    description: 'A farmhouse with room for a crowd. Leave the mud at the door, whatever the prophecy says.',
    capacity: 800,
    costBps: 4500,
    maintenanceBps: 60,
    appeal: 30,
  },
  {
    id: 'compound',
    title: 'Large Rural Compound',
    description: 'A rural compound big enough to unsettle the neighbours. Plenty of space; plenty to maintain.',
    capacity: 5000,
    costBps: 15000,
    maintenanceBps: 180,
    appeal: 45,
  },
  {
    id: 'sanctuary',
    title: 'Grand Sanctuary',
    description: 'A vast sanctuary built to impress. You still have to persuade people to fill it.',
    capacity: 25000,
    costBps: 50000,
    maintenanceBps: 500,
    appeal: 60,
  },
] as const;
export const cultUpgradeIds = [
  'hall',
  'residences',
  'garden',
  'kitchen',
  'workshop',
  'monument',
] as const;
export const cultUpgrades = [
  {
    id: 'hall',
    title: 'Gathering Hall',
    description: 'Twenty per cent more capacity and better gatherings.',
    costBps: 500,
    maintenanceBps: 8,
  },
  {
    id: 'residences',
    title: 'Residential Quarters',
    description:
      'Thirty per cent more capacity; inner-circle members may stay.',
    costBps: 700,
    maintenanceBps: 12,
  },
  {
    id: 'garden',
    title: 'Meditation Garden',
    description: 'A place to sit, remember and think. Improves member satisfaction.',
    costBps: 200,
    maintenanceBps: 3,
  },
  {
    id: 'kitchen',
    title: 'Communal Kitchen',
    description: 'Lower running costs and better shared meals.',
    costBps: 300,
    maintenanceBps: 4,
  },
  {
    id: 'workshop',
    title: 'Workshop',
    description: 'Give followers somewhere to make things. Merchandise sales can bring in money each month.',
    costBps: 400,
    maintenanceBps: 6,
  },
  {
    id: 'monument',
    title: 'Grand Monument',
    description:
      'Raise a monument big enough to attract recruits and critics. Both will want to know why it is so big.',
    costBps: 1000,
    maintenanceBps: 10,
  },
] as const;
export const cultRecruitmentIds = [
  'street',
  'social',
  'open-evening',
  'referral',
  'publicity',
] as const;
export const cultRecruitment = [
  {
    id: 'street',
    title: 'Street Invitations',
    description: 'Pitch your beliefs to strangers. Try to finish before their bus arrives.',
    costBps: 12,
    reach: 8,
    heat: 0,
  },
  {
    id: 'social',
    title: 'Social Media',
    description: 'Post an invitation. The comments section is open to nonbelievers.',
    costBps: 20,
    reach: 15,
    heat: 2,
  },
  {
    id: 'open-evening',
    title: 'Open Evening',
    description: 'Open the doors, serve refreshments and answer the awkward questions.',
    costBps: 35,
    reach: 20,
    heat: -1,
  },
  {
    id: 'referral',
    title: 'Member Referrals',
    description: 'Ask followers to bring friends. They will have to face those friends afterwards.',
    costBps: 10,
    reach: 6,
    heat: -1,
  },
  {
    id: 'publicity',
    title: 'Publicity Stunt',
    description: 'Pull a stunt in public. Attention and admiration are sold separately.',
    costBps: 60,
    reach: 30,
    heat: 6,
  },
] as const;
export const cultCeremonyIds = [
  'dream-circle',
  'quiet-table',
  'community-supper',
  'starlight',
  'open-house',
  'grand-promise',
] as const;
export const cultCeremonies = [
  {
    id: 'dream-circle',
    title: 'Dream Circle',
    description:
      'Compare dreams and argue over the revelations. Even the naked shopping dream gets a turn.',
    costBps: 20,
    loyalty: 5,
    satisfaction: 2,
    reputation: 0,
  },
  {
    id: 'quiet-table',
    title: 'The Quiet Table',
    description: 'Sit together in silence. Resist the urge to explain how well it is going.',
    costBps: 15,
    loyalty: 3,
    satisfaction: 5,
    reputation: 1,
  },
  {
    id: 'community-supper',
    title: 'Community Supper',
    description: 'Feed members and neighbours. Empty plates make a stronger pitch than an empty promise.',
    costBps: 45,
    loyalty: 4,
    satisfaction: 7,
    reputation: 4,
  },
  {
    id: 'starlight',
    title: 'Starlight Vigil',
    description: 'Watch the sky for signs. Bring warm clothes and check for landing lights.',
    costBps: 30,
    loyalty: 6,
    satisfaction: 2,
    reputation: 0,
  },
  {
    id: 'open-house',
    title: 'Open House',
    description: 'Invite people inside and let them look around. Expect follow-up questions.',
    costBps: 55,
    loyalty: 2,
    satisfaction: 4,
    reputation: 7,
  },
  {
    id: 'grand-promise',
    title: 'Grand Gathering',
    description: 'Hold the big gathering you advertised. This time the promise needs chairs, food and a plan.',
    costBps: 120,
    loyalty: 8,
    satisfaction: 6,
    reputation: 5,
  },
] as const;
export const cultMemberRoles = [
  'deputy',
  'treasurer',
  'recruiter',
  'organiser',
  'adviser',
] as const;
export const cultRoleTitles = {
  deputy: 'Second-in-command',
  treasurer: 'Treasurer',
  recruiter: 'Recruitment leader',
  organiser: 'Ceremony organiser',
  adviser: 'Trusted adviser',
} as const;
export const cultFoundingMethods = [
  'announcement',
  'social',
  'gathering',
] as const;
export const cultLeaderTitles = [
  'The Enlightened One',
  'Supreme Visionary',
  'Keeper of the Final Answer',
  'First Among Equals',
  'Your Future Excellency',
  'The Almost Infallible',
] as const;
export const cultRandomNames = [
  'The Church of the Second Chance',
  'The Fellowship of the Last Biscuit',
  'The Order of the Glowing Kettle',
  'The Almost Chosen',
  'The Society for a Better Apocalypse',
  'The Children of Next Thursday',
] as const;
