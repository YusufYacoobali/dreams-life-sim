import { situation as s } from './lifeSituation';

/** Local older-parent/guardian scenes; age alone never supplies a family. */
export const laterLifeFamilyTemplates = [
  s('later-family-next-visit', 'Soon needs a date', '{child} says you should spend more time together. You agree. So far, the plan contains two enthusiastic people and the word “soon”.', [
    ['date', 'Choose a time together', { happiness: 3, discipline: 2 }, 'A plan with fewer missing details', 'You compare what would suit you both. Neither person has to guess whether “soon” means tomorrow or sometime this decade.', 'I talked with {child} about a workable time to meet again.', { childBond: 4 }],
    ['flexible', 'Keep it flexible, honestly', { respect: 2, stress: -2 }, 'An invitation without a deadline', 'You tell {child} you would enjoy the company without asking for a promise today. The invitation stays warm instead of becoming an obligation.', 'I left {child} an open invitation without demanding a date.', { childBond: 2 }],
    ['insist', 'Demand a standing appointment', { stress: 3, respect: -2 }, 'Company starts sounding compulsory', '{child} tries to explain what would work for them. You keep listing dates, and the enthusiasm drains out of the conversation.', 'I pressed {child} for regular visits without listening to what suited them.', { childBond: -3 }],
  ], { min: 55, child: 'adult', illustration: 'conversation' }),
  s('later-family-photo-permission', 'The picture has an audience', '{child} suggests a photograph together, then asks where you would be comfortable with it being shared. You had prepared a smile, not a distribution policy.', [
    ['private', 'Keep the picture between us', { happiness: 3, stress: -2 }, 'A picture for two people', 'You explain that you would like a copy without a wider audience. {child} agrees, and you can get back to deciding where to stand.', 'I asked {child} to keep our photograph private.', { childBond: 3 }],
    ['agree', 'Agree who may receive it', { respect: 2, discipline: 3 }, 'The audience is agreed first', 'You talk through who you would be happy to share it with. {child} checks the answer instead of treating a smile as permission for everything.', 'I agreed with {child} how our photograph could be shared.', { childBond: 3 }],
    ['snap', 'Tell them to stop fussing', { stress: 3, respect: -2 }, 'The camera lowers', '{child} lowers the camera. A straightforward question has become something they wish they had not asked.', 'I snapped when {child} asked where a photograph could be shared.', { childBond: -3 }],
  ], { min: 55, child: 'adult', illustration: 'relationship' }),
];
