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
    description: 'Every dream is a report from a life you nearly lived.',
    modifiers: { growth: 35, loyalty: 1 },
  },
  {
    id: 'final-update',
    title: 'The Final Update',
    description: 'Reality is running old software. You have the patch notes.',
    modifiers: { growth: 55, heat: 1 },
  },
  {
    id: 'cosmic-accounting',
    title: 'Cosmic Accounting',
    description: 'The universe keeps receipts. Especially yours.',
    modifiers: { donations: 18, heat: 1 },
  },
  {
    id: 'last-picnic',
    title: 'The Last Picnic',
    description: 'Civilisation may end. Bring something for the table.',
    modifiers: { satisfaction: 2, expenses: 8 },
  },
  {
    id: 'chosen-lost',
    title: 'The Selectively Chosen',
    description:
      'A tiny group knows the truth. Nobody agrees who invited the others.',
    modifiers: { loyalty: 2, growth: -25 },
  },
  {
    id: 'eternal-self',
    title: 'The Eternal Self',
    description:
      'Enlightenment begins with knowing yourself. Meetings still start at seven.',
    modifiers: { satisfaction: 1, loyalty: 1 },
  },
  {
    id: 'quiet-orbit',
    title: 'The Quiet Orbit',
    description:
      'The cosmos is talking. It is apparently using a very quiet voice.',
    modifiers: { heat: -1, growth: -15, loyalty: 1 },
  },
  {
    id: 'ordinary-miracles',
    title: 'Ordinary Miracles',
    description:
      'Everyday objects contain extraordinary wisdom. Some also contain batteries.',
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
    description: 'Dreams are postcards from alternate selves.',
    modifiers: { loyalty: 1 },
  },
  {
    id: 'reality-stutters',
    title: 'Reality Stutters',
    description: 'Déjà vu is a fault in the universe.',
    modifiers: { growth: 25 },
  },
  {
    id: 'moon-lessons',
    title: 'Lunar Intelligence',
    description: 'The moon changes how clever people feel.',
    modifiers: { loyalty: 1, heat: 1 },
  },
  {
    id: 'wealth-receipts',
    title: 'Wealth Is a Receipt',
    description: 'Money proves the cosmos approved the purchase.',
    modifiers: { donations: 12, heat: 1 },
  },
  {
    id: 'future-mail',
    title: 'Tomorrow Writes Back',
    description: 'The leader occasionally receives messages from next year.',
    modifiers: { growth: 35, heat: 1 },
  },
  {
    id: 'animal-observers',
    title: 'The Observers Have Paws',
    description: 'Certain animals are quietly reviewing humanity.',
    modifiers: { growth: 20, satisfaction: 1 },
  },
  {
    id: 'sacred-kettle',
    title: 'The Kettle Knows',
    description: 'A household object holds exceptional wisdom.',
    modifiers: { donations: 7, heat: 1 },
  },
  {
    id: 'lost-hours',
    title: 'The Missing Hour',
    description: 'Lost time is being saved for a better occasion.',
    modifiers: { loyalty: 1 },
  },
  {
    id: 'recycled-souls',
    title: 'Previously Loved Souls',
    description: 'Everyone has been someone else. Some were better organised.',
    modifiers: { growth: 20 },
  },
  {
    id: 'cosmic-refunds',
    title: 'Cosmic Refunds',
    description: 'Good deeds earn credit against future bad luck.',
    modifiers: { donations: 8, satisfaction: 1 },
  },
  {
    id: 'invisible-committee',
    title: 'The Invisible Committee',
    description: 'An unseen committee approves important decisions.',
    modifiers: { loyalty: 1, growth: -15 },
  },
  {
    id: 'chosen-mistakes',
    title: 'Sacred Mistakes',
    description: 'Errors can be evidence of a larger plan.',
    modifiers: { loyalty: 1, heat: 1 },
  },
  {
    id: 'silent-wisdom',
    title: 'Silence Has Answers',
    description:
      'Silence can contain useful answers and several awkward pauses.',
    modifiers: { satisfaction: 1 },
  },
  {
    id: 'good-omens',
    title: 'Small Good Omens',
    description: 'Ordinary coincidences can be encouraging.',
    modifiers: { growth: 15, satisfaction: 1 },
  },
  {
    id: 'endless-monday',
    title: 'The Last Monday',
    description: 'One final Monday will reset the working week.',
    modifiers: { growth: 25, heat: 1 },
  },
  {
    id: 'parallel-council',
    title: 'The Parallel Council',
    description: 'Another version of the group is making better decisions.',
    modifiers: { growth: 20, loyalty: 1 },
  },
  {
    id: 'weather-moods',
    title: 'Emotional Weather',
    description: 'The weather is the universe working through something.',
    modifiers: { growth: 15 },
  },
  {
    id: 'sacred-leftovers',
    title: 'Nothing Is Wasted',
    description: 'Leftovers deserve a second chance, including people.',
    modifiers: { expenses: -5, satisfaction: 1 },
  },
  {
    id: 'shared-fortune',
    title: 'Shared Fortune',
    description: 'Prosperity should reach the people who made it possible.',
    modifiers: { donations: 5, expenses: 5, loyalty: 1 },
  },
  {
    id: 'golden-aura',
    title: 'The Golden Aura',
    description: 'The leader has an aura that is easier to see after donating.',
    modifiers: { donations: 15, heat: 2, growth: -15 },
  },
  {
    id: 'unfinished-world',
    title: 'An Unfinished World',
    description: 'Existence is a draft. Complaints go to the next edition.',
    modifiers: { growth: 25 },
  },
  {
    id: 'sleeping-genius',
    title: 'Sleeping Genius',
    description: 'Everyone holds a hidden talent, possibly still asleep.',
    modifiers: { satisfaction: 1, growth: 20 },
  },
  {
    id: 'kindness-interest',
    title: 'Kindness Pays Interest',
    description: 'Helping others improves the balance of the world.',
    modifiers: { donations: 6, heat: -1 },
  },
  {
    id: 'number-seven',
    title: 'Seven Means Something',
    description:
      'The number seven appears suspiciously often if you look for it.',
    modifiers: { loyalty: 1 },
  },
  {
    id: 'outsider-tests',
    title: 'The Outsider Test',
    description: 'Critics are unknowingly testing the group’s resolve.',
    modifiers: { loyalty: 2, growth: -35, heat: 1 },
  },
  {
    id: 'memory-garden',
    title: 'Memories Take Root',
    description: 'Remembering someone is a way of keeping them present.',
    modifiers: { loyalty: 1, satisfaction: 1 },
  },
  {
    id: 'public-answers',
    title: 'Questions Are Welcome',
    description: 'A belief should survive being asked about.',
    modifiers: { growth: 25, heat: -1 },
  },
  {
    id: 'leader-fallible',
    title: 'Even Leaders Get It Wrong',
    description:
      'The leader is allowed to admit mistakes before someone posts them.',
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
    description: 'Friday meetings require something blue.',
    modifiers: { loyalty: 1 },
  },
  {
    id: 'no-phones',
    title: 'No Phones at Ceremonies',
    description: 'Phones stay outside the gathering.',
    modifiers: { loyalty: 1, growth: -15 },
  },
  {
    id: 'dream-journal',
    title: 'Daily Dream Journal',
    description: 'Members write down their dreams each morning.',
    modifiers: { loyalty: 1 },
  },
  {
    id: 'minute-silence',
    title: 'One Quiet Minute',
    description: 'Every gathering starts with silence.',
    modifiers: { satisfaction: 1 },
  },
  {
    id: 'monthly-dinner',
    title: 'Monthly Group Dinner',
    description: 'The organisation helps pay for a shared meal.',
    modifiers: { satisfaction: 2, expenses: 8 },
  },
  {
    id: 'sacred-object',
    title: 'Consult the Sacred Object',
    description: 'Major decisions wait for the object’s opinion.',
    modifiers: { loyalty: 1, growth: -20, heat: 1 },
  },
  {
    id: 'monthly-attendance',
    title: 'Compulsory Attendance',
    description: 'Every member is expected at the monthly meeting.',
    modifiers: { loyalty: 2, growth: -35, satisfaction: -1 },
  },
  {
    id: 'open-books',
    title: 'Open the Accounts',
    description: 'Members can inspect the organisation’s spending.',
    modifiers: { heat: -1, donations: 6 },
  },
  {
    id: 'uniform-robes',
    title: 'Matching Robes',
    description: 'Members wear the same robe. Alterations cost extra.',
    modifiers: { loyalty: 1, expenses: 6, growth: -15 },
  },
  {
    id: 'early-rising',
    title: 'Dawn Reflection',
    description: 'The day begins with a short reflection.',
    modifiers: { loyalty: 1, satisfaction: -1 },
  },
  {
    id: 'guest-night',
    title: 'Bring a Guest',
    description: 'One meeting a month welcomes outsiders.',
    modifiers: { growth: 35, expenses: 4 },
  },
  {
    id: 'vegetable-day',
    title: 'Vegetable Wednesday',
    description: 'Wednesday meals are vegetarian.',
    modifiers: { expenses: -3, satisfaction: 1 },
  },
  {
    id: 'no-titles',
    title: 'First Names Only',
    description: 'Members address one another without titles.',
    modifiers: { growth: 20, loyalty: -1 },
  },
  {
    id: 'leader-first',
    title: 'The Leader Speaks First',
    description: 'Nobody opens proceedings before the leader.',
    modifiers: { loyalty: 2, heat: 1, growth: -25 },
  },
  {
    id: 'questions-after',
    title: 'Questions After the Bell',
    description: 'Questions wait until the speech has finished.',
    modifiers: { loyalty: 1, satisfaction: -1 },
  },
  {
    id: 'mutual-aid',
    title: 'Help a Member',
    description: 'A small support fund assists members in need.',
    modifiers: { loyalty: 1, expenses: 7 },
  },
  {
    id: 'quiet-hour',
    title: 'Evening Quiet Hour',
    description: 'Members keep one quiet hour in the evening.',
    modifiers: { satisfaction: 1, growth: -10 },
  },
  {
    id: 'walking-meetings',
    title: 'Meetings on Foot',
    description: 'Small meetings happen on a walk.',
    modifiers: { expenses: -3, satisfaction: 1 },
  },
  {
    id: 'no-gossip',
    title: 'No Internal Gossip',
    description: 'Complaints go to the adviser before the group chat.',
    modifiers: { loyalty: 1, heat: 1 },
  },
  {
    id: 'family-day',
    title: 'Keep a Family Day',
    description: 'One day a week belongs to life outside the group.',
    modifiers: { satisfaction: 2, heat: -1 },
  },
  {
    id: 'volunteer-day',
    title: 'A Day of Service',
    description: 'Members volunteer locally each month.',
    modifiers: { growth: 20, expenses: 3, heat: -1 },
  },
  {
    id: 'weekly-letter',
    title: 'The Weekly Letter',
    description: 'Members receive a printed update.',
    modifiers: { loyalty: 1, expenses: 4 },
  },
  {
    id: 'no-luxury',
    title: 'Plain Living',
    description: 'Members avoid conspicuous luxury at meetings.',
    modifiers: { expenses: -4, donations: -5 },
  },
  {
    id: 'public-rituals',
    title: 'Open Ceremonies',
    description: 'The public may observe ordinary gatherings.',
    modifiers: { growth: 30, heat: -1 },
  },
  {
    id: 'private-rituals',
    title: 'Members Only',
    description: 'Ceremonies are closed to outsiders.',
    modifiers: { loyalty: 2, growth: -30, heat: 1 },
  },
  {
    id: 'shared-chores',
    title: 'Everyone Takes a Turn',
    description: 'Cleaning and serving duties rotate.',
    modifiers: { expenses: -6, satisfaction: -1 },
  },
  {
    id: 'annual-retreat',
    title: 'An Annual Retreat',
    description: 'The group sets aside money for a yearly retreat.',
    modifiers: { loyalty: 1, expenses: 9 },
  },
  {
    id: 'opt-out',
    title: 'Let People Sit It Out',
    description: 'Members may skip a ritual without explaining why.',
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
    description: 'A rented room. The folding chairs are not prophetic.',
    capacity: 40,
    costBps: 400,
    maintenanceBps: 8,
    appeal: 0,
  },
  {
    id: 'woodland',
    title: 'Woodland Retreat',
    description: 'Cabins, a clearing and a surprisingly firm noise limit.',
    capacity: 180,
    costBps: 1400,
    maintenanceBps: 22,
    appeal: 15,
  },
  {
    id: 'farmhouse',
    title: 'Converted Farmhouse',
    description: 'Enough room for a movement, assuming it wipes its feet.',
    capacity: 800,
    costBps: 4500,
    maintenanceBps: 60,
    appeal: 30,
  },
  {
    id: 'compound',
    title: 'Large Rural Compound',
    description: 'A growing community with very visible maintenance bills.',
    capacity: 5000,
    costBps: 15000,
    maintenanceBps: 180,
    appeal: 45,
  },
  {
    id: 'sanctuary',
    title: 'Grand Sanctuary',
    description: 'A major gathering place. The roof has its own budget.',
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
    description: 'A calm place that improves member satisfaction.',
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
    description: 'Members can make modest merchandise sales each month.',
    costBps: 400,
    maintenanceBps: 6,
  },
  {
    id: 'monument',
    title: 'Grand Monument',
    description:
      'More attention and recruitment appeal, including from critics.',
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
    description: 'Talk to people who have not yet crossed the road.',
    costBps: 12,
    reach: 8,
    heat: 0,
  },
  {
    id: 'social',
    title: 'Social Media',
    description: 'A short invitation. Comments will have opinions.',
    costBps: 20,
    reach: 15,
    heat: 2,
  },
  {
    id: 'open-evening',
    title: 'Open Evening',
    description: 'A welcome talk with actual refreshments.',
    costBps: 35,
    reach: 20,
    heat: -1,
  },
  {
    id: 'referral',
    title: 'Member Referrals',
    description: 'Ask members to invite someone they actually know.',
    costBps: 10,
    reach: 6,
    heat: -1,
  },
  {
    id: 'publicity',
    title: 'Publicity Stunt',
    description: 'Be memorable. Being respected is a separate question.',
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
      'Discuss the night’s revelations. Leave room for the one about teeth.',
    costBps: 20,
    loyalty: 5,
    satisfaction: 2,
    reputation: 0,
  },
  {
    id: 'quiet-table',
    title: 'The Quiet Table',
    description: 'A thoughtful gathering without a two-hour speech.',
    costBps: 15,
    loyalty: 3,
    satisfaction: 5,
    reputation: 1,
  },
  {
    id: 'community-supper',
    title: 'Community Supper',
    description: 'Serve dinner to members and neighbours.',
    costBps: 45,
    loyalty: 4,
    satisfaction: 7,
    reputation: 4,
  },
  {
    id: 'starlight',
    title: 'Starlight Vigil',
    description: 'Watch the sky. Warm clothing remains scientifically useful.',
    costBps: 30,
    loyalty: 6,
    satisfaction: 2,
    reputation: 0,
  },
  {
    id: 'open-house',
    title: 'Open House',
    description: 'Let visitors see what the group actually does.',
    costBps: 55,
    loyalty: 2,
    satisfaction: 4,
    reputation: 7,
  },
  {
    id: 'grand-promise',
    title: 'Grand Gathering',
    description: 'Make the ambitious event you advertised happen.',
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
  'Keeper of Truth',
  'First Among Equals',
  'Chief Listener',
  'Custodian of Tomorrow',
] as const;
export const cultRandomNames = [
  'The Society of Unfinished Tuesdays',
  'The Lantern Beneath the Stairs',
  'The Order of the Patient Teapot',
  'The Institute of Nearly Everything',
  'The Fellowship of the Other Door',
  'The Department of Cosmic Queries',
] as const;
