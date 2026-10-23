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
      "You promise the moon will turn green within a year. A follower writes down the date while looking straight at you.",
    followup:
      'The moon has stayed its usual colour. A follower holds up a green paint chart and asks you to point to the promised shade.',
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
      'You predict a letter from the future. Followers ask you to request next year’s winning lottery numbers.',
    followup:
      'No letter has arrived. A follower asks whether the future could at least send a text.',
    successText:
      'I saw an old letter turn up with an unexpected detail. Followers called it proof of my prediction; I had promised rather more than an old letter.',
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
      'You announce that reality will reboot. Followers start backing up their photographs and asking which memories will survive.',
    followup:
      'Your deadline passes. Reality still works as badly as before. Followers ask whether you have tried turning yourself off and on again.',
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
      'You promise a break from membership fees and say the universe has approved it. The treasurer asks when you intend to tell the treasury.',
    followup:
      'Members are still paying the old fees. They ask whether the universe needs their bank details or just your permission.',
    successText:
      'I cut the membership fee as promised. Members checked the new amount before celebrating the cosmic refund.',
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
      'You predict rain during the next quarterly review. You tell followers the sky will acknowledge your work.',
    followup:
      'The review stays dry. A follower asks whether the sky rejected your work or simply forgot the meeting.',
    successText:
      'I got rain at the promised review. Followers applauded while the caretaker reached for a bucket.',
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
      'You promise a shared gathering before the world ends. A follower asks whether bringing dessert counts as optimism.',
    followup:
      'The picnic deadline has passed. Followers are still waiting to be fed before the end of civilisation.',
    successText:
      'I held the promised gathering. The world lasted long enough for another helping.',
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
      'You predict the last Monday anyone will experience. A follower immediately books Tuesday off.',
    followup:
      'Monday returns. The follower who booked Tuesday off waits outside your door, asking how your prediction will cover the wasted time.',
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
      'You promise that your inner circle will uncover a hidden truth within a year. Followers suggest starting with what the leader actually knows.',
    followup:
      'Your inner circle has no hidden truth to offer. They ask whether looking busy counted towards the prophecy.',
    successText:
      'I reached the deadline with a member’s unexpected discovery. They explained it while I worked out how much credit I could reasonably claim.',
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
      'You promise to guide at least two discussions about listening. A follower asks whether they will be allowed to speak in both.',
    followup:
      'You have not held the promised discussions. A follower points out that waiting for you has provided plenty of silence.',
    successText:
      'I led the discussions I promised. Followers had enough to say that I had to wait my turn.',
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
      'You predict an animal will deliver a clear verdict on your movement. Followers start watching the pigeons with uncomfortable intensity.',
    followup:
      'No animal has delivered a verdict. A pigeon has soiled your chair, and the room is divided over whether that counts.',
    successText:
      'I watched followers claim a sleeping cat had endorsed us. The cat declined to wake up for questions.',
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
      'You announce that the sacred kettle will reveal knowledge beyond human understanding. A follower puts a very difficult question beside it.',
    followup:
      'The kettle has boiled. It has not answered the question. Followers ask whether you intend to interpret the clicking noise.',
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
      "You promise a workshop where followers can wake their hidden talents. They want an opening date before another speech about potential.",
    followup:
      'The workshop is still missing. Followers have brought things they wanted to make and nowhere to make them.',
    successText:
      'I provided the promised workshop. A member started fixing the chairs before I finished explaining the hidden potential.',
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
      'You promise a garden where followers can remember people they have lost. They ask you to keep a place free for their names.',
    followup:
      'The garden deadline passes with nowhere to leave flowers. Bereaved members ask you for a straight answer.',
    successText:
      'I provided the memorial garden. Members left flowers and names, and I gave them privacy.',
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
      'You promise a shared meal and support for struggling members. They ask when, because they need more than a reassuring speech.',
    followup:
      'The promised meal and help have not arrived. Members ask why you could announce it in minutes but still cannot provide it.',
    successText:
      'I held the promised meal with mutual aid in place. Members ate together and had a fund to turn to.',
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
      "You predict a new follower will arrive after appearing in your dreams. Followers start comparing the guests with your description.",
    followup:
      "Nobody new has stayed. A follower suggests warning your next dream visitor about the joining fee.",
    successText:
      'I welcomed new followers before the deadline. They did not remember appearing in my dreams.',
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
      'You promise to win over the neighbours with a gathering. One follower suggests starting by letting them finish a complaint.',
    followup:
      'The promised gathering has not happened. The neighbours still want to discuss your parking.',
    successText:
      'I held a gathering for the neighbours as promised. They came inside and had plenty to say.',
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
      'You predict seven unmistakable signs. Followers begin counting before you have explained what counts.',
    followup: 'The list has six coincidences and the same bus ticket twice. A follower has crossed out the duplicate in front of everyone.',
    successText:
      'I watched followers assemble seven coincidences on the noticeboard. They were excited enough to explain every one twice.',
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
      "You promise perfect weather for the seasonal gathering. The organiser makes a point of keeping the umbrellas.",
    followup:
      'The weather ruins your prediction. The organiser stands in front of you, holding an umbrella and waiting for an answer.',
    successText:
      'I reached the deadline with weather that matched my promise. The organiser kept the umbrellas within reach.',
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
  resultTitle?: string;
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
    resultTitle: 'An expert on actual moons',
    id: 'invite-astronomer',
    label: 'Hire an astronomer; retire the prophecy',
    result:
      'You pay for an astronomy evening and make admitting mistakes part of the doctrine. The astronomer explains why green was ambitious. Devotees leave during the explanation.',
    journal:
      'I funded an astronomy evening and retired my green-moon prophecy.',
    action: 'science-night',
    impact: { loyalty: -4, reputation: 7, heat: -7, growth: -2 },
  },
  'future-letter': {
    resultTitle: 'No letter from tomorrow',
    id: 'unseal-postbag',
    label: 'Open the accounts to members',
    result:
      'You open the records to inspection. Members find no message from the future and several questions they would like you to answer today.',
    journal: 'I opened our accounts after the promised future letter failed to arrive.',
    action: 'open-records',
    impact: { loyalty: -2, reputation: 5, heat: -5, memberLoyalty: 8 },
  },
  'world-reboot': {
    resultTitle: 'Reality carries on',
    id: 'cancel-countdown',
    label: 'End the countdown; retire the doctrine',
    result:
      "You dismantle the countdown and replace the reboot doctrine with admitting mistakes. Followers start deleting the emergency backups in front of you.",
    journal:
      'I cancelled the reality countdown and retired the reboot doctrine.',
    action: 'retire-reboot',
    impact: { loyalty: -6, satisfaction: 8, reputation: 4, heat: -6 },
  },
  'cosmic-refund': {
    resultTitle: 'A refund from this universe',
    id: 'refund-members',
    label: 'Refund one month of members’ dues',
    result:
      'You refund a month of ordinary members’ dues from the treasury. They count it. Your explanation of the cosmos can wait.',
    journal:
      'I refunded one month of ordinary members’ dues after my cosmic-refund promise failed.',
    action: 'refund-dues',
    impact: { loyalty: 4, satisfaction: 10, reputation: 3, heat: -6 },
  },
  'rain-receipt': {
    resultTitle: 'You settle with the venue',
    id: 'pay-roof-bill',
    label: 'Pay the arrears and maintenance bill',
    result:
      'You clear the arrears and pay for maintenance. The caretaker accepts this gesture far more readily than your instructions to the sky.',
    journal:
      'I paid our venue arrears and maintenance bill after the rain prediction failed.',
    action: 'repair-venue',
    impact: { satisfaction: 7, reputation: 3, heat: -3 },
  },
  'last-picnic': {
    resultTitle: 'Late to the end of the world',
    id: 'hold-late-picnic',
    label: 'Pay for the late picnic',
    result:
      "You pay for the overdue supper. A follower proposes serving dessert before you predict anything else.",
    journal:
      'I funded the overdue community picnic after missing the promised date.',
    action: 'late-picnic',
    impact: { loyalty: 3, satisfaction: 9, heat: -4 },
  },
  'final-monday': {
    resultTitle: 'Monday owes them nothing',
    id: 'repay-lost-shift',
    label: 'Compensate the follower',
    result:
      'You pay {member} compensation. They check the amount and ask you to leave the rest of the working week alone.',
    journal:
      'I paid {member} compensation after my final-Monday prediction failed.',
    action: 'reimburse-witness',
    impact: { loyalty: -3, reputation: 2, memberLoyalty: 12, heat: -3 },
  },
  'hidden-answer': {
    resultTitle: 'Someone else checks your work',
    id: 'commission-study',
    label: 'Pay for an independent investigation',
    result:
      "You pay an investigator and open the accounts to inspection. Members direct them straight to your promise to know things.",
    journal:
      'I funded an independent investigation and opened its accounts after the hidden-answer promise failed.',
    action: 'independent-study',
    impact: { loyalty: -3, reputation: 8, heat: -5, ambition: 6 },
  },
  'quiet-answer': {
    resultTitle: 'Take the seat. Give advice.',
    id: 'hand-over-lectern',
    label: 'Make the witness your adviser',
    result:
      'You give {member} the adviser’s role. They begin by advising you to stop interrupting their answer.',
    journal:
      'I appointed {member} adviser after failing to hold the promised discussions.',
    action: 'delegate-answer',
    impact: { satisfaction: 6, memberLoyalty: 14, ambition: 12, heat: -2 },
  },
  'animal-review': {
    resultTitle: 'No endorsement purchased',
    id: 'fund-animal-care',
    label: 'Donate towards animal care',
    result:
      'You pay for animal care. The animals still offer no verdict on your leadership. Members seem happier with this use of the money.',
    journal:
      'I funded animal care after the promised animal endorsement failed.',
    action: 'animal-shelter',
    impact: { satisfaction: 6, reputation: 6, heat: -3 },
  },
  'kettle-oracle': {
    resultTitle: 'Sold. Still silent.',
    id: 'auction-kettle',
    label: 'Auction the kettle; retire its doctrine',
    result:
      'You sell the kettle and put the proceeds in the treasury. You replace its doctrine with admitting mistakes. Devotees are furious that you sold their oracle as kitchenware.',
    journal:
      'I auctioned the kettle for the treasury and retired its doctrine.',
    action: 'auction-kettle',
    impact: { loyalty: -9, reputation: 4, heat: -5, growth: -3 },
  },
  'sleeping-talent': {
    resultTitle: 'The workshop finally exists',
    id: 'build-workshop-now',
    label: 'Buy the overdue workshop',
    result:
      'You pay for the workshop. Followers bring their unfinished projects while asking whether the opening speech will delay them again.',
    journal:
      'I bought the overdue workshop after missing the talent-space deadline.',
    action: 'build-workshop',
    impact: { loyalty: 2, satisfaction: 8, reputation: 2, heat: -3 },
  },
  'memory-garden': {
    resultTitle: 'A place for their names',
    id: 'plant-garden-now',
    label: 'Pay for the memorial garden',
    result:
      'You pay for the garden and let the members use it. You leave the opening speech out.',
    journal:
      'I funded the overdue memorial garden and left the opening to members.',
    action: 'plant-garden',
    impact: { satisfaction: 9, memberLoyalty: 10, heat: -3 },
  },
  'full-table': {
    resultTitle: 'Food and help arrive',
    id: 'fund-real-support',
    label: 'Pay for supper and member support',
    result:
      'You fund the supper, pay {member} support and make mutual aid a rule. They can finally use something from the promise.',
    journal:
      'I funded the late supper, paid {member} support and adopted mutual aid.',
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
    resultTitle: 'No fee for the dream visitor',
    id: 'open-membership',
    label: 'Drop both fees; add guest nights',
    result:
      'You set joining and monthly fees to zero and add guest nights. Members ask why your dream needed a payment barrier in the first place.',
    journal:
      'I made membership free and added guest nights after my dream-visitor prediction failed.',
    action: 'free-membership',
    impact: { loyalty: -2, satisfaction: 6, reputation: 4, heat: -3 },
  },
  'good-neighbour': {
    resultTitle: 'The neighbours come inside',
    id: 'host-neighbours',
    label: 'Pay for the overdue open house',
    result:
      'You pay for an open house. The neighbours come in and start with the parking complaint. You let them finish.',
    journal:
      'I funded the late open house and heard the neighbours’ complaints.',
    action: 'neighbour-gathering',
    impact: { loyalty: -2, satisfaction: 4, reputation: 8, heat: -7 },
  },
  'seven-signs': {
    resultTitle: 'Six is the honest number',
    id: 'publish-six',
    label: 'Publish six; retire the sacred number',
    result:
      'You remove the duplicate and replace the sacred-seven doctrine with admitting mistakes. A devotee asks you to count the remaining signs one more time.',
    journal:
      'I published the six coincidences and retired the sacred-seven doctrine.',
    action: 'publish-six',
    impact: { loyalty: -6, reputation: 7, heat: -5, memberLoyalty: 5 },
  },
  'perfect-weather': {
    resultTitle: 'A roof outranks a forecast',
    id: 'buy-covered-hall',
    label: 'Buy the covered gathering hall',
    result:
      "You buy the hall. It adds capacity and running costs. The organiser puts far more faith in its roof than your next forecast.",
    journal:
      'I bought a covered hall after failing to deliver perfect weather.',
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
