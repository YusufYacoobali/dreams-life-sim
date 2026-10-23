import type { CultDoctrineId } from './cults';
export const cultClaimIds = [
  'green-moon',
  'future-letter',
  'world-reboot',
  'cosmic-refund',
  'rain-receipt',
  'last-picnic',
  'final-monday',
  'hidden-answer',
  'quiet-answer',
  'animal-review',
  'kettle-oracle',
  'sleeping-talent',
  'memory-garden',
  'full-table',
  'dream-visitor',
  'good-neighbour',
  'seven-signs',
  'perfect-weather',
] as const;
export type CultClaimId = (typeof cultClaimIds)[number];
export type CultClaimDefinition = {
  id: CultClaimId;
  title: string;
  announcement: string;
  followup: string;
  successText: string;
  philosophy: string;
  doctrine: CultDoctrineId;
  months: number;
  quiet: boolean;
  test:
    | 'impossible'
    | 'chance'
    | 'ceremony'
    | 'workshop'
    | 'garden'
    | 'recruitment'
    | 'preach'
    | 'fee-cut'
    | 'support';
  chance?: number;
};
export const cultClaims: readonly CultClaimDefinition[] = [
  {
    id: 'green-moon',
    title: 'A Green Moon',
    announcement:
      'You promise the moon will turn green within a year. Someone asks which shade.',
    followup:
      'The moon is still its usual colour. Your followers have brought the paint chart.',
    successText: '',
    philosophy: 'dream-archive',
    doctrine: 'moon-lessons',
    months: 12,
    quiet: false,
    test: 'impossible',
  },
  {
    id: 'future-letter',
    title: 'A Letter from Tomorrow',
    announcement:
      'You predict that a message will arrive with useful knowledge about the future.',
    followup:
      'The promised letter has not arrived. The treasurer asks whether the future paid for postage.',
    successText:
      'An old letter turns up with a detail nobody expected. It is not proof, but it makes a good story.',
    philosophy: 'final-update',
    doctrine: 'future-mail',
    months: 8,
    quiet: false,
    test: 'chance',
    chance: 35,
  },
  {
    id: 'world-reboot',
    title: 'The Great Reboot',
    announcement:
      'You announce an approaching reboot of reality. Members start backing up their photos.',
    followup:
      'Reality has carried on without restarting. The group would like to discuss your technical expertise.',
    successText: '',
    philosophy: 'final-update',
    doctrine: 'reality-stutters',
    months: 10,
    quiet: true,
    test: 'impossible',
  },
  {
    id: 'cosmic-refund',
    title: 'A Cosmic Refund',
    announcement:
      'You promise members a break from fees. The universe has apparently authorised a refund.',
    followup:
      'Members are still paying the old fees. Cosmic authorisation is not an account credit.',
    successText:
      'The fee reduction you promised reached the members. Nobody needed to contact the universe.',
    philosophy: 'cosmic-accounting',
    doctrine: 'cosmic-refunds',
    months: 6,
    quiet: false,
    test: 'fee-cut',
  },
  {
    id: 'rain-receipt',
    title: 'The Sky Will Acknowledge Us',
    announcement:
      'You predict rain on the day of your next quarterly review. You call it a receipt from above.',
    followup:
      'The quarterly review stayed dry. Your celestial accounting needs work.',
    successText:
      'Rain arrives during the review. Members applaud; the caretaker brings a bucket.',
    philosophy: 'cosmic-accounting',
    doctrine: 'wealth-receipts',
    months: 3,
    quiet: true,
    test: 'chance',
    chance: 45,
  },
  {
    id: 'last-picnic',
    title: 'The Picnic Before Everything',
    announcement:
      'You promise a proper gathering before the world gets any stranger.',
    followup:
      'The promised picnic has not happened. Members are tired of bringing emergency sandwiches.',
    successText:
      'You held the gathering you promised. The world survived long enough for seconds.',
    philosophy: 'last-picnic',
    doctrine: 'sacred-leftovers',
    months: 6,
    quiet: false,
    test: 'ceremony',
  },
  {
    id: 'final-monday',
    title: 'The Final Monday',
    announcement:
      'You predict the last Monday anyone will ever experience. One member immediately books Tuesday off.',
    followup:
      'Another Monday has arrived. The member who booked Tuesday off is waiting outside your door.',
    successText: '',
    philosophy: 'last-picnic',
    doctrine: 'endless-monday',
    months: 12,
    quiet: false,
    test: 'impossible',
  },
  {
    id: 'hidden-answer',
    title: 'An Answer Worth Waiting For',
    announcement:
      'You announce that the inner circle will uncover something useful by next year.',
    followup:
      'The inner circle has found three missing keys and no hidden answer.',
    successText:
      'A member’s patient investigation produces a genuinely useful discovery. You let them take the credit.',
    philosophy: 'chosen-lost',
    doctrine: 'chosen-mistakes',
    months: 12,
    quiet: true,
    test: 'chance',
    chance: 45,
  },
  {
    id: 'quiet-answer',
    title: 'A Season of Listening',
    announcement:
      'You promise to guide several thoughtful discussions instead of making another speech about yourself.',
    followup:
      'The promised discussions never happened. Even the silence feels disappointed.',
    successText:
      'Your discussions gave quieter members a voice. It was a promise you could actually keep.',
    philosophy: 'quiet-orbit',
    doctrine: 'silent-wisdom',
    months: 6,
    quiet: true,
    test: 'preach',
  },
  {
    id: 'animal-review',
    title: 'The Animals Will Judge Us',
    announcement:
      'You predict that an animal will deliver an unmistakable verdict on the group.',
    followup:
      'The animals have declined to issue a statement. One pigeon did make a mess of your chair.',
    successText:
      'A local cat sleeps through your entire ceremony. Members interpret this as an excellent review.',
    philosophy: 'ordinary-miracles',
    doctrine: 'animal-observers',
    months: 5,
    quiet: true,
    test: 'chance',
    chance: 50,
  },
  {
    id: 'kettle-oracle',
    title: 'The Kettle Will Speak',
    announcement:
      'You announce that the ceremonial kettle will reveal something no person could know.',
    followup:
      'The kettle has made tea. It has not offered an opinion. Members want to know what happens next.',
    successText: '',
    philosophy: 'ordinary-miracles',
    doctrine: 'sacred-kettle',
    months: 7,
    quiet: false,
    test: 'impossible',
  },
  {
    id: 'sleeping-talent',
    title: 'Wake a Hidden Talent',
    announcement:
      'You promise members a place to practise a talent rather than merely hearing that they have one.',
    followup:
      'The promised workshop is still an empty corner. Hidden talents remain well hidden.',
    successText:
      'The workshop gives members somewhere to make things. One discovers a talent for fixing your chairs.',
    philosophy: 'eternal-self',
    doctrine: 'sleeping-genius',
    months: 9,
    quiet: false,
    test: 'workshop',
  },
  {
    id: 'memory-garden',
    title: 'A Place to Remember',
    announcement:
      'You promise a garden where members can remember people they have lost.',
    followup:
      'There is still no garden. This is not a good occasion for a clever explanation.',
    successText:
      'The memorial garden opens. Members leave names, flowers and a few things they had needed to say.',
    philosophy: 'eternal-self',
    doctrine: 'memory-garden',
    months: 12,
    quiet: true,
    test: 'garden',
  },
  {
    id: 'full-table',
    title: 'A Seat for Everyone',
    announcement:
      'You promise a shared meal and practical support for struggling members.',
    followup:
      'The promised meal and support never arrived. Members needed help, not a slogan.',
    successText:
      'The meal happened and the support fund stayed open. Members notice the difference.',
    philosophy: 'last-picnic',
    doctrine: 'shared-fortune',
    months: 6,
    quiet: false,
    test: 'support',
  },
  {
    id: 'dream-visitor',
    title: 'The Visitor You Dreamed About',
    announcement:
      'You announce that someone new will join after appearing in your dreams.',
    followup:
      'Nobody new has stayed. Your dream visitor may have found the wrong address.',
    successText:
      'New members join before your deadline. They do not remember appearing in a dream.',
    philosophy: 'dream-archive',
    doctrine: 'borrowed-dreams',
    months: 6,
    quiet: true,
    test: 'recruitment',
  },
  {
    id: 'good-neighbour',
    title: 'Win Over the Street',
    announcement:
      'You promise neighbours will have a reason to appreciate the organisation.',
    followup:
      'Neighbours still know the group mainly for the parking. They have not forgotten your promise.',
    successText:
      'Your open gathering gave neighbours a reason to come inside. Some left liking the place.',
    philosophy: 'ordinary-miracles',
    doctrine: 'kindness-interest',
    months: 8,
    quiet: false,
    test: 'ceremony',
  },
  {
    id: 'seven-signs',
    title: 'Seven Signs',
    announcement:
      'You predict seven remarkable coincidences. Members begin counting with considerable enthusiasm.',
    followup: 'The list contains six coincidences and a duplicated bus ticket.',
    successText:
      'Members assemble seven coincidences and a very crowded noticeboard. It makes them happy.',
    philosophy: 'chosen-lost',
    doctrine: 'number-seven',
    months: 7,
    quiet: true,
    test: 'chance',
    chance: 60,
  },
  {
    id: 'perfect-weather',
    title: 'Perfect Weather',
    announcement:
      'You promise the skies will cooperate with the next seasonal gathering.',
    followup:
      'The weather has ignored your instructions. The organiser would like an umbrella and an explanation.',
    successText:
      'The weather happens to cooperate. The organiser wisely keeps the umbrellas.',
    philosophy: 'quiet-orbit',
    doctrine: 'weather-moods',
    months: 4,
    quiet: false,
    test: 'chance',
    chance: 55,
  },
];
