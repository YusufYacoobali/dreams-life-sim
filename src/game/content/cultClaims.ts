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

export type CultClaimImpact = {
  loyalty?: number;
  satisfaction?: number;
  reputation?: number;
  heat?: number;
  growth?: number;
  memberLoyalty?: number;
  ambition?: number;
};
export type CultClaimRemedy = {
  id: string;
  label: string;
  result: string;
  journal: string;
  action:
    | 'science-night'
    | 'open-records'
    | 'retire-reboot'
    | 'refund-dues'
    | 'repair-venue'
    | 'late-picnic'
    | 'reimburse-witness'
    | 'independent-study'
    | 'delegate-answer'
    | 'animal-shelter'
    | 'auction-kettle'
    | 'build-workshop'
    | 'plant-garden'
    | 'aid-supper'
    | 'free-membership'
    | 'neighbour-gathering'
    | 'publish-six'
    | 'covered-hall';
  impact: CultClaimImpact;
};
/** Remedies keep the failed deadline on record and change something tangible. */
export const cultClaimRemedies: Record<CultClaimId, CultClaimRemedy> = {
  'green-moon': {
    id: 'invite-astronomer',
    label: 'Hire an astronomer and retire the prophecy',
    result:
      'The astronomer explains the moon without charging extra for colours. You make fallibility part of the doctrine. Some devotees leave; others finally trust the meeting.',
    journal:
      'I paid for an astronomy evening and made fallibility official after the green-moon fiasco.',
    action: 'science-night',
    impact: { loyalty: -4, reputation: 7, heat: -7, growth: -2 },
  },
  'future-letter': {
    id: 'unseal-postbag',
    label: 'Open the records to the members',
    result:
      'Members inspect the actual correspondence. There is no message from tomorrow. There is a very overdue electricity reminder. Open books become a rule.',
    journal: 'I opened our records after the future letter failed to arrive.',
    action: 'open-records',
    impact: { loyalty: -2, reputation: 5, heat: -5, memberLoyalty: 8 },
  },
  'world-reboot': {
    id: 'cancel-countdown',
    label: 'End the countdown and retire the reboot doctrine',
    result:
      'You dismantle the countdown display and replace the reboot doctrine with an admission that leaders can be wrong. Members can stop backing up their souls.',
    journal:
      'I cancelled the reality countdown and retired our reboot doctrine.',
    action: 'retire-reboot',
    impact: { loyalty: -6, satisfaction: 8, reputation: 4, heat: -6 },
  },
  'cosmic-refund': {
    id: 'refund-members',
    label: 'Refund one month of ordinary members’ fees',
    result:
      'An actual month of dues leaves the treasury and goes back to ordinary members. Nobody mistakes it for a message from the universe.',
    journal:
      'I refunded a real month of ordinary members’ dues after promising a cosmic refund.',
    action: 'refund-dues',
    impact: { loyalty: 4, satisfaction: 10, reputation: 3, heat: -6 },
  },
  'rain-receipt': {
    id: 'pay-roof-bill',
    label: 'Settle the venue bills instead of blaming the sky',
    result:
      'You pay the recorded arrears and a practical maintenance bill. The next committee meeting concerns gutters. This is a measurable improvement.',
    journal:
      'I settled the venue arrears and maintenance bill after my rain prediction failed.',
    action: 'repair-venue',
    impact: { satisfaction: 7, reputation: 3, heat: -3 },
  },
  'last-picnic': {
    id: 'hold-late-picnic',
    label: 'Pay for the picnic now, late and ordinary',
    result:
      'The promised deadline stays missed. A real community supper finally happens, with enough food and absolutely no apocalypse announcement.',
    journal:
      'I paid for a late community picnic instead of inventing another deadline.',
    action: 'late-picnic',
    impact: { loyalty: 3, satisfaction: 9, heat: -4 },
  },
  'final-monday': {
    id: 'repay-lost-shift',
    label: 'Compensate the witness for their wasted time',
    result:
      'The named witness receives an actual support payment. Monday remains in circulation. At least someone can afford their groceries.',
    journal:
      'I paid {member} compensation for acting on my final-Monday prediction.',
    action: 'reimburse-witness',
    impact: { loyalty: -3, reputation: 2, memberLoyalty: 12, heat: -3 },
  },
  'hidden-answer': {
    id: 'commission-study',
    label: 'Commission an independent investigation',
    result:
      'You pay an outside investigator and let members inspect the resulting accounts. Their first useful discovery is that your claims needed checking.',
    journal:
      'I funded an independent investigation and opened its accounts after our hidden-answer promise failed.',
    action: 'independent-study',
    impact: { loyalty: -3, reputation: 8, heat: -5, ambition: 6 },
  },
  'quiet-answer': {
    id: 'hand-over-lectern',
    label: 'Give the witness the adviser’s seat',
    result:
      '{member} takes the adviser’s seat and a real share of the responsibility. Their first answer is that the leader should listen more often.',
    journal:
      'I gave {member} the adviser’s seat after failing to produce our promised answer.',
    action: 'delegate-answer',
    impact: { satisfaction: 6, memberLoyalty: 14, ambition: 12, heat: -2 },
  },
  'animal-review': {
    id: 'fund-animal-care',
    label: 'Fund animal care without claiming endorsement',
    result:
      'The treasury pays for practical animal care. The animals still offer no endorsement, but the donation does something more useful than your prediction.',
    journal:
      'I funded practical animal care after our supposed animal endorsement failed.',
    action: 'animal-shelter',
    impact: { satisfaction: 6, reputation: 6, heat: -3 },
  },
  'kettle-oracle': {
    id: 'auction-kettle',
    label: 'Auction the kettle and retire its doctrine',
    result:
      'The kettle sells as a kettle. The proceeds enter the communal treasury; its doctrine is replaced by an admission of fallibility. Devotees of the whistle are furious.',
    journal:
      'I auctioned the silent kettle for the communal treasury and retired its doctrine.',
    action: 'auction-kettle',
    impact: { loyalty: -9, reputation: 4, heat: -5, growth: -3 },
  },
  'sleeping-talent': {
    id: 'build-workshop-now',
    label: 'Buy the promised workshop now',
    result:
      'The treasury pays the actual workshop price. Members can finally make things there, and workshop sales can begin. The missed opening date stays in your record.',
    journal:
      'I bought the overdue workshop after failing to provide the talent space I promised.',
    action: 'build-workshop',
    impact: { loyalty: 2, satisfaction: 8, reputation: 2, heat: -3 },
  },
  'memory-garden': {
    id: 'plant-garden-now',
    label: 'Fund the memorial garden without another speech',
    result:
      'The actual garden upgrade is paid for and installed. Members have a place to remember people. You let them use it without making this about your comeback.',
    journal:
      'I funded the overdue memorial garden and left the opening to the members.',
    action: 'plant-garden',
    impact: { satisfaction: 9, memberLoyalty: 10, heat: -3 },
  },
  'full-table': {
    id: 'fund-real-support',
    label: 'Hold the meal and pay real member support',
    result:
      'A community supper is funded, the witness receives an actual support payment and mutual aid becomes a rule. This costs considerably more than printing the slogan.',
    journal:
      'I funded a late community supper and paid {member} real support after the empty-table promise.',
    action: 'aid-supper',
    impact: {
      loyalty: 6,
      satisfaction: 9,
      reputation: 4,
      heat: -5,
      memberLoyalty: 10,
    },
  },
  'dream-visitor': {
    id: 'open-membership',
    label: 'Drop both fees and let actual guests decide',
    result:
      'Joining and monthly fees become zero. Guest night becomes a rule. Future recruitment gets easier; future dues disappear until you change the fees again.',
    journal:
      'I opened free membership and guest nights after my dream visitor failed to appear.',
    action: 'free-membership',
    impact: { loyalty: -2, satisfaction: 6, reputation: 4, heat: -3 },
  },
  'good-neighbour': {
    id: 'host-neighbours',
    label: 'Pay for a real open-house gathering',
    result:
      'The treasury funds an actual open house. Neighbours get a visit instead of another promise. You also hear a detailed account of your parking arrangements.',
    journal:
      'I paid for a late open house and listened to the neighbours’ complaints.',
    action: 'neighbour-gathering',
    impact: { loyalty: -2, satisfaction: 4, reputation: 8, heat: -7 },
  },
  'seven-signs': {
    id: 'publish-six',
    label: 'Publish the six signs and drop the sacred number',
    result:
      'The duplicate bus ticket is removed. An admission of fallibility replaces the sacred-number doctrine. Several members dislike the correction; the noticeboard is at least accurate.',
    journal:
      'I published the six genuine coincidences and retired the sacred-number doctrine.',
    action: 'publish-six',
    impact: { loyalty: -6, reputation: 7, heat: -5, memberLoyalty: 5 },
  },
  'perfect-weather': {
    id: 'buy-covered-hall',
    label: 'Buy the gathering hall instead of commanding the weather',
    result:
      'The gathering hall is actually purchased. It raises capacity and running costs, and the next indoor gathering will not need your cooperation with the clouds.',
    journal:
      'I paid for a covered gathering hall after promising perfect weather.',
    action: 'covered-hall',
    impact: { satisfaction: 7, reputation: 4, heat: -4 },
  },
};
const claimSuccess: Record<CultClaimId, CultClaimImpact> = {
  'green-moon': {},
  'future-letter': { loyalty: 4, reputation: 4, memberLoyalty: 5 },
  'world-reboot': {},
  'cosmic-refund': { loyalty: 3, satisfaction: 6, reputation: 2 },
  'rain-receipt': { loyalty: 3, satisfaction: 2, heat: -1 },
  'last-picnic': { loyalty: 5, satisfaction: 8, reputation: 2 },
  'final-monday': {},
  'hidden-answer': { reputation: 6, memberLoyalty: 7, ambition: 6 },
  'quiet-answer': { loyalty: 3, memberLoyalty: 8, ambition: 3 },
  'animal-review': { loyalty: 2, satisfaction: 4, heat: -1 },
  'kettle-oracle': {},
  'sleeping-talent': { loyalty: 3, satisfaction: 6, reputation: 3 },
  'memory-garden': { satisfaction: 9, memberLoyalty: 6, reputation: 2 },
  'full-table': { loyalty: 8, satisfaction: 8, reputation: 4 },
  'dream-visitor': { loyalty: 4, reputation: 6 },
  'good-neighbour': { satisfaction: 3, reputation: 8, heat: -5 },
  'seven-signs': { loyalty: 4, ambition: 6, heat: 2 },
  'perfect-weather': { loyalty: 4, satisfaction: 3, heat: -1 },
};
const claimFailure: Record<CultClaimId, CultClaimImpact> = {
  'green-moon': { loyalty: -6, reputation: -3, heat: 9 },
  'future-letter': { loyalty: -4, reputation: -4, memberLoyalty: -3, heat: 6 },
  'world-reboot': { loyalty: -8, satisfaction: -5, growth: -3, heat: 10 },
  'cosmic-refund': { loyalty: -7, satisfaction: -8, heat: 7 },
  'rain-receipt': { loyalty: -2, satisfaction: -4, heat: 4 },
  'last-picnic': { loyalty: -4, satisfaction: -7, heat: 5 },
  'final-monday': { loyalty: -7, satisfaction: -4, memberLoyalty: -8, heat: 8 },
  'hidden-answer': { loyalty: -5, reputation: -5, ambition: 5, heat: 6 },
  'quiet-answer': { loyalty: -4, memberLoyalty: -6, ambition: 4, heat: 4 },
  'animal-review': { reputation: -3, satisfaction: -3, growth: -1, heat: 2 },
  'kettle-oracle': { loyalty: -6, reputation: -4, heat: 8 },
  'sleeping-talent': { loyalty: -5, satisfaction: -8, heat: 6 },
  'memory-garden': {
    loyalty: -9,
    satisfaction: -10,
    memberLoyalty: -12,
    heat: 5,
  },
  'full-table': { loyalty: -8, satisfaction: -9, memberLoyalty: -7, heat: 8 },
  'dream-visitor': { loyalty: -3, reputation: -3, satisfaction: -1, heat: 4 },
  'good-neighbour': { reputation: -8, satisfaction: -3, heat: 7 },
  'seven-signs': { loyalty: -5, ambition: 5, heat: 6 },
  'perfect-weather': {
    loyalty: -3,
    satisfaction: -6,
    memberLoyalty: -4,
    heat: 5,
  },
};
export function cultClaimOutcome(
  id: CultClaimId,
  success: boolean,
): CultClaimImpact {
  return success ? claimSuccess[id] : claimFailure[id];
}
export function cultClaimChoiceIds(id: string): string[] {
  const remedy = cultClaimRemedies[id as CultClaimId];
  return [
    'admit',
    'postpone',
    'blame',
    ...(remedy ? [remedy.id] : []),
    'withdraw',
  ];
}
export function cultClaimChoiceSetValid(id: string, ids: readonly string[]) {
  if (ids.length !== 4 || new Set(ids).size !== 4) return false;
  const remedy = cultClaimRemedies[id as CultClaimId];
  return (
    ['admit', 'postpone', 'withdraw'].every((choice) => ids.includes(choice)) &&
    (ids.includes('blame') || (!!remedy && ids.includes(remedy.id)))
  );
}
