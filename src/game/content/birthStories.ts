export type BirthStoryTone = 'funny' | 'unusual' | 'bizarre';
export type BirthStoryContext = {
  mother: boolean; father: boolean; twoParents: boolean; singleParent: boolean;
  motherWorking: boolean; fatherWorking: boolean; royal: boolean;
};
type BirthStory = { id: string; tone: BirthStoryTone; requires?: readonly (keyof BirthStoryContext)[]; text: string };

/** Past anecdotes establish flavour only; they never create people, assets or effects. */
export const birthStories: readonly BirthStory[] = [
  { id: 'dad-suitcase', tone: 'funny', requires: ['father'], text: 'My father packed three shirts for himself and nothing for me. Apparently he expected the longer stay.' },
  { id: 'new-manager', tone: 'funny', requires: ['fatherWorking'], text: 'My father set his work email to say he was dealing with a small new manager. I had already started shouting.' },
  { id: 'bracelet-spelling', tone: 'funny', requires: ['mother'], text: 'My mother corrected the spelling on my hospital bracelet. The mistake was in her own name.' },
  { id: 'instructions', tone: 'funny', requires: ['mother'], text: 'My mother asked whether I came with instructions. She was handed another form.' },
  { id: 'name-spelling', tone: 'funny', requires: ['twoParents'], text: 'My parents agreed on my name straight away. They then spent an hour arguing about the spelling.' },
  { id: 'two-bags', tone: 'funny', requires: ['twoParents'], text: 'My parents each packed a bag for me. Both contained socks and neither contained a nappy.' },
  { id: 'one-parent-paperwork', tone: 'funny', requires: ['singleParent', 'mother'], text: 'My mother handled my arrival and all the paperwork. I contributed a footprint and went to sleep.' },
  { id: 'first-photo', tone: 'funny', text: 'My first photograph caught me mid-yawn. Nobody asked for a retake.' },
  { id: 'printer-jam', tone: 'funny', text: 'The printer jammed on my paperwork. I held up a queue before I could hold up my head.' },
  { id: 'wrong-units', tone: 'funny', requires: ['father', 'twoParents'], text: 'My father sent out my birth weight using the wrong units. There were several worried replies.' },
  { id: 'colleagues-card', tone: 'funny', requires: ['motherWorking'], text: 'My mother’s colleagues sent a card for their newest supervisor. I had not yet learned to supervise my own hands.' },
  { id: 'oversized-bracelet', tone: 'funny', text: 'My hospital bracelet slid off before my first photograph. Even the smallest size was optimistic.' },
  { id: 'family-resemblance', tone: 'funny', requires: ['twoParents'], text: 'My parents took turns saying I looked like them. I mostly looked annoyed.' },
  { id: 'birth-plan', tone: 'funny', requires: ['mother'], text: 'My mother brought a birth plan. I brought my own schedule.' },
  { id: 'rehearsed-introduction', tone: 'funny', requires: ['father'], text: 'My father practised introducing me before I arrived. He still got my name wrong on the first try.' },
  { id: 'wrong-footprint', tone: 'funny', text: 'My footprints ended up on the wrong form. My first signature was rejected.' },
  { id: 'emergency-contact', tone: 'funny', requires: ['singleParent', 'mother'], text: 'My mother put herself down as my emergency contact. I had already tested the arrangement.' },
  { id: 'autocorrect', tone: 'funny', text: 'Autocorrect changed my birth announcement. For a few minutes, I was introduced as a household appliance.' },
  { id: 'stuck-lift', tone: 'unusual', requires: ['mother'], text: 'The lift stopped on the way to the maternity ward. My mother started discussing the stairs with surprising enthusiasm.' },
  { id: 'wrong-bus', tone: 'unusual', requires: ['father'], text: 'My father boarded the wrong bus on his way to meet me. He got a city tour before a family introduction.' },
  { id: 'news-crew', tone: 'unusual', text: 'A news crew filmed the hospital entrance as I arrived. My first public appearance was mostly a blanket.' },
  { id: 'competing-names', tone: 'unusual', requires: ['twoParents'], text: 'My parents each tried to surprise the other with my name. The paperwork required a third round of negotiations.' },
  { id: 'evacuation-drill', tone: 'unusual', text: 'The hospital held a practice evacuation just after I arrived. I attended my first drill without opening my eyes.' },
  { id: 'old-interview', tone: 'unusual', requires: ['mother'], text: 'My mother appeared on the hospital television in an old street interview. She had forgotten it existed.' },
  { id: 'royal-photograph', tone: 'unusual', requires: ['royal'], text: 'My official birth announcement went out before anyone checked the photograph. It showed an empty blanket.' },
  { id: 'royal-drafts', tone: 'unusual', requires: ['royal'], text: 'My royal birth announcement needed three drafts. The final version still spelt congratulations wrong.' },
  { id: 'retirement-age', tone: 'bizarre', text: 'My paperwork briefly listed my age as ninety. I reached retirement before my first feed.' },
  { id: 'own-next-of-kin', tone: 'bizarre', requires: ['mother'], text: 'A hospital computer listed my mother as her own next of kin. She was asked to confirm she knew herself.' },
  { id: 'sympathy-envelope', tone: 'bizarre', text: 'My welcome card arrived in a sympathy envelope. The message inside was cheerful enough.' },
  { id: 'missing-patient', tone: 'bizarre', text: 'The hospital marked me as discharged before registering my birth. I was briefly the only person on the ward who officially wasn’t there.' },
];

export function eligibleBirthStories(context: BirthStoryContext, tone: BirthStoryTone) {
  return birthStories.filter(story => story.tone === tone && (story.requires ?? []).every(key => context[key]));
}
