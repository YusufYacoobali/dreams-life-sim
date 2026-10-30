import type { PrisonScene } from '../systems/prisonSchemas';

type Changes = PrisonScene['choices'][number]['changes'];
type Choice = { id: string; label: string; body: string; journal: string; changes: Changes };
export type PrisonStory = { id: string; title: string; body: string; context: 'inmate' | 'family' | 'work' | 'study' | 'late' | 'any' | 'high'; choices: Choice[] };
const c = (id: string, label: string, body: string, journal: string, changes: Partial<Changes>): Choice => ({ id, label, body, journal, changes: { conduct: 0, bond: 0, trust: 0, stress: 0, standing: 0, health: 0, ...changes } });

/** Authored situations, not action-result variants. Every participant is bound before display. */
export const prisonStories: readonly PrisonStory[] = [
  { id: 'prison-invisible-border', title: 'A Very Small Country', context: 'inmate', body: '{name} has declared a personal-space border across the cell floor. Your shoes now require permission to enter a territory approximately the size of a bathmat.', choices: [
    c('agree', 'Agree on shared space', 'You work out where things can go without declaring either bunk a sovereign nation.', 'I agreed on shared space with {name}.', { bond: 6, trust: 4, stress: -4 }),
    c('mock', 'Request a visitor visa', 'You ask for a visa to reach your shoes. {name} does not recognise your diplomatic credentials.', 'I mocked {name} over a dispute about shared space.', { bond: -8, trust: -5, standing: 3, stress: 3 }),
    c('move', 'Move your things for now', 'You rearrange your belongings and avoid another argument. The cramped space still wears on you.', 'I moved my belongings to avoid an argument with {name}.', { conduct: 3, stress: 3 }),
  ] },
  { id: 'prison-motivational-enterprise', title: 'Never Give Up', context: 'inmate', body: '{name} is rehearsing motivational speeches for a business that has no customers. Every speech ends with “never give up”. The locked door makes this ambitious.', choices: [
    c('listen', 'Be the rehearsal audience', 'You hear the entire speech. {name} thanks you for staying, then notices the locked door.', 'I listened while {name} rehearsed a motivational speech.', { bond: 7, trust: 3, stress: -3 }),
    c('feedback', 'Suggest a shorter speech', 'You cut the speech from twenty minutes to two. Even {name} looks relieved.', 'I helped {name} shorten a motivational speech.', { bond: 3, trust: 6, standing: 2 }),
    c('refuse', 'Decline the seminar', 'You decline politely. For once, an inspirational speaker accepts a boundary.', 'I declined {name}’s rehearsal.', { stress: -2, conduct: 2 }),
  ] },
  { id: 'prison-guard-name', title: 'Officially Incorrect', context: 'any', body: 'A guard keeps calling you by the wrong name. Today you were reprimanded for answering to your actual one.', choices: [
    c('formal', 'Request a record check', 'You ask for the name on your file to be checked. The conversation stays civil, at considerable personal effort.', 'I asked staff to check the name on my file.', { conduct: 5, stress: 2 }),
    c('shout', 'Correct the entire corridor', 'The corridor learns your name. Staff record your shouting rather than the useful part.', 'I shouted at a guard over my name and lost conduct standing.', { conduct: -12, standing: 4, stress: 6 }),
    c('wait', 'Save your energy', 'You let this one pass. Hearing the wrong name still grates.', 'I chose not to argue with a guard over my name.', { stress: 3 }),
  ] },
  { id: 'prison-library-margin', title: 'Margin of Error', context: 'study', body: 'Someone has annotated your study book with extremely confident wrong answers. One margin simply says “trust me”.', choices: [
    c('correct', 'Work through the answers', 'You check each answer yourself. It takes longer, but you leave the book less dangerous to education.', 'I worked through a badly annotated prison study book.', { conduct: 4, stress: -3, standing: 1 }),
    c('complain', 'Demand another book', 'You argue about the book until the study period ends. The wrong answers remain undefeated.', 'I spent my study period arguing about a damaged book.', { conduct: -4, stress: 5 }),
    c('ignore', 'Ignore the margins', 'You cover the notes with a blank page and carry on. “Trust me” receives no further attention.', 'I ignored misleading notes and continued studying.', { stress: -2 }),
  ] },
  { id: 'prison-letter-ordinary', title: 'Nothing Much Happened', context: 'family', body: '{name} writes about an ordinary day outside. Shopping. Rain. A meal that was not served through a hatch. You read it twice.', choices: [
    c('reply', 'Ask about the small things', 'You write back with questions about that ordinary day. Neither of you pretends this is easy.', 'I wrote to {name} about ordinary life outside.', { bond: 8, trust: 5, stress: -5 }),
    c('honest', 'Explain how hard this feels', 'You describe the part you usually leave out. {name} now has a more honest letter from you.', 'I wrote honestly to {name} about prison life.', { bond: 4, trust: 8, stress: -2 }),
    c('keep', 'Keep the letter close', 'You keep the letter and take a little comfort from its ordinary details.', 'I kept {name}’s letter close.', { stress: -3 }),
  ] },
  { id: 'prison-visiting-clock', title: 'Five Minute Warning', context: 'family', body: 'You and {name} disagree over what to discuss during a possible visit. The argument about wasting visiting time is already using most of the conversation.', choices: [
    c('listen', 'Let them choose the subject', 'You stop arguing and listen. There is finally room for something besides the argument.', 'I listened to {name} instead of arguing about a visit.', { bond: 6, trust: 5, stress: -4 }),
    c('blame', 'List their previous failures', 'You produce a very organised list of grievances. {name} feels less welcome after hearing it.', 'I blamed {name} during a conversation about visiting.', { bond: -12, trust: -8, stress: 5 }),
    c('pause', 'Suggest talking another day', 'You end the conversation before either of you says something harder to take back.', 'I paused a difficult conversation with {name}.', { trust: 1, stress: -2 }),
  ] },
  { id: 'prison-missing-mug', title: 'Mug Shot', context: 'inmate', body: '{name} thinks you took a favourite mug. You did not. This has not prevented a surprisingly detailed prosecution.', choices: [
    c('explain', 'Hear the accusation out', 'You let {name} finish, then deny taking it. Being heard takes some heat out of the accusation.', 'I discussed {name}’s missing mug without admitting something I had not done.', { bond: 2, trust: 5, stress: 2 }),
    c('insult', 'Settle it with a punch', 'You hit {name} over an accusation about a mug. They were wrong about the mug; they are right about reporting the assault.', 'I assaulted {name} over a missing mug accusation.', { conduct: -15, bond: -10, trust: -8, standing: 3 }),
    c('staff', 'Ask staff to mediate', 'You ask for mediation. The disagreement becomes a staff matter, and {name} resents the audience.', 'I asked staff to mediate an accusation from {name}.', { conduct: 5, bond: -5, trust: -3 }),
  ] },
  { id: 'prison-job-trophy', title: 'Employee of the Month', context: 'work', body: 'Your prison work supervisor praises your reliability. The certificate has a clip-art beach and the words “the world is yours”.', choices: [
    c('accept', 'Accept the praise', 'You accept a compliment without endorsing the certificate’s geography.', 'I accepted praise for my prison work routine.', { conduct: 6, stress: -4, standing: 2 }),
    c('sarcasm', 'Ask about annual leave', 'The supervisor does not enjoy the question. You return to work under closer scrutiny.', 'I irritated a prison work supervisor by asking about annual leave.', { conduct: -5, stress: 3 }),
    c('quiet', 'Get on with the shift', 'You finish the shift. Reliability requires less ceremony than the certificate suggests.', 'I quietly finished my prison work shift.', { conduct: 4, stress: -1 }),
  ] },
  { id: 'prison-favour-interest', title: 'Terms and Conditions', context: 'inmate', body: '{name} wants your support in an argument and calls it “a tiny favour”. The explanation of the favour has three chapters.', choices: [
    c('boundary', 'Offer a fair hearing only', 'You agree to listen without promising allegiance. {name} accepts the smaller promise.', 'I set a boundary on a favour requested by {name}.', { trust: 5, bond: 2, standing: 3 }),
    c('promise', 'Promise your support', 'You make a promise before hearing both sides. {name} likes your loyalty more than your judgement.', 'I promised to support {name} in a dispute.', { bond: 9, trust: 3, conduct: -5, stress: 4 }),
    c('refuse', 'Refuse the obligation', 'You refuse clearly. {name} is annoyed, but you make no promises.', 'I refused an open-ended favour for {name}.', { bond: -4, stress: -3 }),
  ] },
  { id: 'prison-hearing-chair', title: 'The Plastic Tribunal', context: 'any', body: 'A staff review of your conduct starts with a broken plastic chair. You are asked why you look uncomfortable.', choices: [
    c('factual', 'Answer calmly', 'You keep your answers factual. Staff record your cooperation rather than your opinion of the chair.', 'I cooperated calmly during a prison conduct review.', { conduct: 8, stress: 1 }),
    c('angry', 'Let the frustration out', 'You turn the review into an argument. The conduct note is longer than the meeting.', 'I argued during a prison conduct review.', { conduct: -15, stress: 7, standing: 2 }),
    c('brief', 'Keep it brief', 'You answer what is asked and stop there. The meeting ends without a fresh dispute.', 'I kept my prison conduct review brief.', { conduct: 3, stress: -1 }),
  ] },
  { id: 'prison-cardboard-empire', title: 'Cardboard Holdings', context: 'inmate', body: '{name} has appointed a chief executive for a cardboard city built in the common room. You have been offered responsibility for transport. There are no roads.', choices: [
    c('play', 'Accept the imaginary office', 'You spend an hour arguing about imaginary buses. For an hour, that is the whole problem.', 'I joined {name}’s cardboard-city game.', { bond: 7, stress: -6, standing: 1 }),
    c('roads', 'Ask about the roads', 'Your first policy question destabilises the government. {name} respects the attention to detail.', 'I questioned the transport policy of {name}’s cardboard city.', { bond: 3, trust: 4, stress: -3 }),
    c('decline', 'Remain a private citizen', 'You decline office. The cardboard city survives this constitutional crisis.', 'I declined an imaginary job in {name}’s cardboard city.', { stress: -1 }),
  ] },
  { id: 'prison-yard-warning', title: 'Quiet in the Yard', context: 'high', body: 'An argument spreads across the yard. A guard orders everyone away from the doors. Nobody seems eager to be the first person to move.', choices: [
    c('comply', 'Follow the instruction', 'You move away from the disturbance. Staff note your cooperation; the tension takes longer to leave you.', 'I moved away from a prison-yard disturbance.', { conduct: 8, stress: 5 }),
    c('watch', 'Stay to watch', 'You stay too close. In the confusion you are shoved hard enough to leave bruises, and staff record your refusal to move.', 'I stayed near a yard disturbance and was bruised.', { health: -5, conduct: -10, stress: 8 }),
    c('call', 'Urge others to step back', 'You call for space without joining the argument. A few people listen.', 'I urged people to step away from a yard disturbance.', { conduct: 4, standing: 6, stress: 4 }),
  ] },
  { id: 'prison-release-envelope', title: 'The Outside List', context: 'late', body: 'You start listing what you will need after release. The list gets longer. The remaining sentence gets shorter. Neither development feels reassuring.', choices: [
    c('plan', 'Break it into small steps', 'You write down the first few practical steps. You still feel anxious, but the whole future no longer has to happen on one morning.', 'I made a practical plan for release.', { stress: -7, conduct: 4 }),
    c('avoid', 'Put the list away', 'You put it aside for now. The uncertainty stays with you.', 'I put aside my release plans for now.', { stress: 4 }),
    c('routine', 'Focus on the next day', 'You return to your routine and give yourself one manageable day.', 'I focused on my daily routine while approaching release.', { conduct: 6, stress: -3 }),
  ] },
  { id: 'prison-family-boundary', title: 'No Easy Promise', context: 'family', body: '{name} asks you to stop promising that everything will be normal after release. They want an honest conversation instead.', choices: [
    c('honest', 'Admit you cannot promise that', 'You admit what you cannot control. It is a smaller promise, and a more credible one.', 'I spoke honestly to {name} about life after release.', { trust: 10, bond: 4, stress: 3 }),
    c('insist', 'Insist they should trust you', 'You demand trust instead of answering the concern. {name} has less of it afterwards.', 'I demanded trust from {name} instead of discussing their concern.', { trust: -12, bond: -7, stress: 4 }),
    c('listen', 'Ask what they need from you', 'You listen without negotiating away their answer. The conversation feels less like a sales pitch.', 'I asked {name} what they needed from me.', { trust: 7, bond: 6, stress: -2 }),
  ] },
  { id: 'prison-contraband-denial', title: 'Not Your Sock', context: 'any', body: 'A search turns up a suspicious sock near your bunk. A guard asks whether it belongs to you. It does not. You have never been this certain about hosiery.', choices: [
    c('cooperate', 'Give a factual account', 'You state what you know and cooperate with the search. Staff note your cooperation. The sock remains unexplained.', 'I cooperated with a search involving property that was not mine.', { conduct: 6, stress: 4 }),
    c('shout', 'Demand an apology now', 'You demand an apology at considerable volume. Staff record your conduct during the search.', 'I argued loudly during a prison search.', { conduct: -12, stress: 6 }),
    c('brief', 'Deny ownership and wait', 'You deny ownership and wait for the search to finish. Waiting is not pleasant.', 'I denied owning a suspicious item and waited for the search to finish.', { stress: 5 }),
  ] },
  { id: 'prison-rival-rumour', title: 'Excellent Sources', context: 'inmate', body: '{name} says people are talking about you. Asked who, they say “people”. Their source protection is impeccable.', choices: [
    c('specific', 'Ask for something specific', 'You ask for facts rather than a crowd that cannot be named. The rumour loses momentum.', 'I asked {name} for facts behind a rumour.', { trust: 3, standing: 5, stress: -2 }),
    c('threat', 'Threaten the unnamed people', 'You issue a threat to an entirely theoretical audience. {name} finds you less trustworthy.', 'I reacted aggressively to a rumour from {name}.', { trust: -7, bond: -3, conduct: -6, standing: 3 }),
    c('ignore', 'Do not feed it', 'You refuse to spend the afternoon defending yourself against a pronoun.', 'I ignored an unsubstantiated prison rumour.', { stress: -3, conduct: 2 }),
  ] },
  { id: 'prison-study-shame', title: 'Start at the Beginning', context: 'study', body: 'Your study exercise is harder than you expected. Asking for help feels worse than getting the answers wrong.', choices: [
    c('ask', 'Ask the tutor for help', 'You ask. The explanation helps, and nobody makes the speech you feared.', 'I asked for help with my prison study work.', { conduct: 5, stress: -5 }),
    c('pretend', 'Pretend you understand', 'You nod through the explanation. The next page is still unreadable.', 'I hid my difficulty with a study exercise.', { stress: 5 }),
    c('retry', 'Work through it slowly', 'You take the exercise one step at a time. You understand one part that defeated you earlier.', 'I worked patiently through a difficult study exercise.', { conduct: 3, stress: -2 }),
  ] },
  { id: 'prison-meal-election', title: 'A Mandate for Gravy', context: 'inmate', body: '{name} is campaigning to represent the table in complaints about dinner. The manifesto contains one word: gravy.', choices: [
    c('help', 'Help write a civil complaint', 'You turn the manifesto into a specific, civil complaint. {name} appreciates the help; nobody promises better dinner.', 'I helped {name} write a complaint about meals.', { bond: 5, trust: 4, conduct: 3 }),
    c('heckle', 'Heckle the candidate', 'Your heckling gets a laugh and costs you {name}’s goodwill.', 'I mocked {name}’s campaign about prison meals.', { bond: -8, trust: -4, standing: 4 }),
    c('abstain', 'Abstain from the election', 'You eat without taking a position on the gravy question.', 'I stayed out of a dispute about prison meals.', { conduct: 2 }),
  ] },
  { id: 'prison-birthday-silence', title: 'Another Birthday', context: 'family', body: '{name}’s next birthday will come whether or not you are home for it. Today the distance is harder to explain away.', choices: [
    c('write', 'Write down what you would say', 'You write the words down without pretending that a page closes the distance.', 'I wrote down my feelings about missing a birthday outside.', { stress: -3 }),
    c('routine', 'Keep to your routine', 'You get through the day a task at a time. It still matters that you missed it.', 'I kept to my routine through a difficult day.', { conduct: 4, stress: 1 }),
    c('anger', 'Take it out on the staff', 'You snap at a guard who had nothing to do with the birthday. The conduct record is yours.', 'I snapped at prison staff on a difficult day.', { conduct: -8, stress: 5 }),
  ] },
  { id: 'prison-quiet-friend', title: 'No Advice Today', context: 'inmate', body: '{name} is sitting alone after a difficult call. They ask you not to offer advice. For once, the instruction is very clear.', choices: [
    c('sit', 'Sit quietly with them', 'You sit without trying to fix the call. {name} lets you stay.', 'I sat quietly with {name} after a difficult call.', { bond: 9, trust: 8, stress: -2 }),
    c('advice', 'Explain what they should do', 'You deliver the advice they explicitly declined. {name} would prefer the empty chair.', 'I ignored {name}’s request and gave unwanted advice.', { bond: -7, trust: -8 }),
    c('space', 'Give them some space', 'You give {name} the quiet they asked for and check that they want to be alone.', 'I respected {name}’s request for quiet.', { trust: 5, bond: 2 }),
  ] },
  { id: 'prison-priority-queue', title: 'The Queue Committee', context: 'any', body: 'Three people disagree about whose turn it is at the phone. A fourth has appointed themself chair of the queue committee.', choices: [
    c('wait', 'Keep your place calmly', 'You wait without contributing a fifth opinion. Staff notice you staying out of the dispute.', 'I waited calmly during an argument about the prison phone.', { conduct: 4, stress: 2 }),
    c('push', 'Push to the front', 'You push into the argument and catch an elbow. Staff record your part in the disruption.', 'I pushed into a phone-queue dispute and was bruised.', { health: -3, conduct: -9, standing: -3, stress: 4 }),
    c('later', 'Try again later', 'You leave the committee to its constitutional work and return to your routine.', 'I walked away from a dispute over the prison phone.', { stress: -3, conduct: 2 }),
  ] },
  { id: 'prison-boasting-contest', title: 'Unverified Achievements', context: 'inmate', body: '{name} describes a life so glamorous that even the contradictions have personal assistants. You are asked to confirm you are impressed.', choices: [
    c('kind', 'Ask about something real', 'You ask about an ordinary part of their life. For a moment, {name} stops performing.', 'I asked {name} about life beyond their boasts.', { trust: 7, bond: 4 }),
    c('expose', 'Count the contradictions', 'You list the contradictions. Accuracy wins the argument and loses the afternoon’s goodwill.', 'I challenged {name}’s exaggerated stories.', { bond: -8, trust: -4, standing: 4 }),
    c('listen', 'Let the story finish', 'You listen until the imaginary yacht returns to port. {name} appreciates the audience.', 'I let {name} finish a boastful story.', { bond: 4, stress: 1 }),
  ] },
  { id: 'prison-shift-pressure', title: 'Cover the Shift', context: 'work', body: 'A prison work supervisor wants a volunteer for an unpleasant task. Everyone suddenly develops a deep interest in the floor.', choices: [
    c('volunteer', 'Volunteer without bargaining', 'You do the task. The supervisor records your cooperation; your stress rises with the extra work.', 'I volunteered for an unpleasant prison work task.', { conduct: 9, stress: 5, standing: 2 }),
    c('decline', 'Decline politely', 'You decline without insulting the task, the supervisor or the floor.', 'I politely declined an extra prison work task.', { stress: -1 }),
    c('joke', 'Nominate the supervisor', 'You suggest leadership by example. The supervisor records your refusal with enthusiasm.', 'I antagonised a prison work supervisor over an extra task.', { conduct: -7, stress: 3, standing: 4 }),
  ] },
  { id: 'prison-inspection-dignity', title: 'Everything on Display', context: 'any', body: 'Another inspection leaves your small space in disarray. There is nothing funny about having so little privacy.', choices: [
    c('restore', 'Put things back carefully', 'You restore the small amount of order you control. It helps a little.', 'I restored my space after an upsetting prison inspection.', { stress: -4, conduct: 3 }),
    c('complain', 'Make a calm complaint', 'You describe the problem without raising your voice. Staff note your cooperation; the lack of privacy remains.', 'I calmly raised a concern about a prison inspection.', { conduct: 5, stress: 1 }),
    c('rage', 'Refuse the next instruction', 'You refuse the next instruction. Staff penalise your conduct, and the inspection does not become less intrusive.', 'I refused an instruction after a prison inspection.', { conduct: -12, stress: 7 }),
  ] },
  { id: 'prison-release-friend', title: 'The Gate Between', context: 'inmate', body: 'You and {name} talk about the future. You do not know whether you will leave together, or what the friendship will look like outside.', choices: [
    c('honest', 'Avoid making impossible promises', 'You talk about staying in touch without promising a future neither of you can guarantee.', 'I talked honestly with {name} about friendship after prison.', { trust: 9, bond: 5, stress: 2 }),
    c('dismiss', 'Say it was only prison', 'You dismiss the friendship as part of the sentence. {name} hears you clearly.', 'I dismissed my friendship with {name} as temporary.', { bond: -13, trust: -10, stress: 3 }),
    c('today', 'Value the time you have now', 'You spend the conversation on the friendship that exists today.', 'I spent time with {name} without making promises about release.', { bond: 7, trust: 3, stress: -3 }),
  ] },
];
