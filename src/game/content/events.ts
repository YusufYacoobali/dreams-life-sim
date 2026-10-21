import { ageOn, fullName, World } from '../model';
import { BoundChoice, Pending } from '../runtime';

import { EventTemplate, StoryStat, storyOption as option } from './eventTypes';
import { childhoodTemplates } from './childhood';
import { workplaceTemplates } from './workplaceStories';
import { adultRelationshipTemplates } from './adultRelationshipStories';
import { currentWorkplace } from '../systems/workplaceSchemas';
import { countries } from '../countries';
import { jobs } from './jobs';
import { currentSchool } from '../systems/schoolSchemas';
import { activeTrip } from '../systems/travelSchemas';
import { hospitalized } from '../systems/healthSchemas';
import { isConfined } from '../systems/legalSchemas';
import { serviceAway } from '../systems/serviceSchemas';
import { partnerRelation, relationFor } from '../systems/relationships';
import { storyParent, storyPersonPresent } from '../systems/storyContext';
import { lifeStoryContexts, lifeStoryBinding, lifeStoryAvailable } from '../systems/lifeStoryContext';
import { destinations } from './travel';
import { hobbyContent } from './leisure';
import { conditions } from './health';
import { formatMoney } from '../money';
import { everydayLifeTemplates } from './everydayLifeStories';
import { rareAdultTemplates } from './rareAdultStories';
import { specialCareerDepthTemplates } from './specialCareerDepthStories';
import { storyContactNames } from '../storyNames';

/** Original situations, not random names placed in interchangeable success text. */
export const eventTemplates: readonly EventTemplate[] = [
  {
    id: 'first-cake', min: 1, max: 2, parent: true, illustration: 'birthday', title: 'A very small food critic',
    body: '{parent} puts a birthday cake in front of you. Everyone waits for a photograph. You have a different artistic vision.',
    choices: [
      option('smash', 'Apply cake directly to face', { happiness: 5 }, 'The photograph survives', 'The cake does not. {parent} laughs so hard the first photo is mostly ceiling.', 'I wore my birthday cake. {parent} kept the photograph.', 3),
      option('share', 'Offer {parent} a sticky handful', { happiness: 3, respect: 2 }, 'An unsolicited catering service', '{parent} accepts a handful of icing with impressive commitment.', 'I shared my cake with {parent}, mostly by hand.', 5),
      option('observe', 'Inspect this suspicious new object', { smarts: 3, happiness: 1 }, 'Peer review takes time', 'You investigate the icing while everyone makes increasingly desperate camera noises.', 'I studied my birthday cake before eating the evidence.'),
    ],
  },
  {
    id: 'shoe-principle', min: 2, max: 4, parent: true, illustration: 'relationship', title: 'A principled disagreement',
    body: '{parent} says shoes are necessary for going outside. You were not consulted during the drafting of this policy.',
    choices: [
      option('cooperate', 'Let {parent} help', { discipline: 3 }, 'Terms accepted', 'Both shoes make it onto the correct feet. A surprisingly productive morning.', 'I let {parent} help with my shoes.', 3),
      option('alone', 'Insist on doing it yourself', { discipline: 4, stress: 2 }, 'Independent, eventually', 'It takes a while. One shoe is backwards. You still did it.', 'I put on my own shoes. Accuracy will come later.'),
      option('protest', 'Present a floor-based protest', { happiness: -2, stress: -2 }, 'Negotiations stall', '{parent} waits beside you. The pavement remains unavailable until the shoes go on.', 'I objected to shoes. The shoes won.', -2),
    ],
  },
  {
    id: 'blanket-dragon', min: 3, max: 6, parent: true, illustration: 'journal', title: 'Something under the blanket',
    body: 'You tell {parent} there is a dragon under your blanket. {parent} asks whether it would like a bedtime story.',
    choices: [
      option('invite', 'Make room for one more listener', { happiness: 4, smarts: 2 }, 'A civilised dragon', 'The dragon listens very quietly. {parent} does all the voices.', 'My imaginary dragon joined bedtime stories.', 4),
      option('write', 'Invent the dragon’s entire biography', { smarts: 4, energy: -2 }, 'A complicated creature', 'Its name takes three attempts to pronounce. Its tax arrangements remain unclear.', 'I invented a dragon with a very long name.'),
      option('check', 'Ask {parent} to check properly', { stress: -4 }, 'Blanket inspection complete', 'No dragon. One missing sock. {parent} checks twice because you ask.', 'A thorough blanket search helped me sleep.', 3),
    ],
  },
  {
    id: 'library-card', min: 5, max: 10, local: true, illustration: 'education', title: 'Unlimited dragons, limited shelf space',
    body: 'At the library, you find a book so big you need both arms to carry it. The return desk suddenly looks very far away.',
    choices: [
      option('big', 'Commit to the enormous book', { smarts: 5, energy: -3 }, 'An ambitious loan', 'You finish some of it, skip a confusing chapter, and learn three words you immediately misuse.', 'I borrowed the largest book I could carry.'),
      option('small', 'Find a smaller story you love', { happiness: 4, smarts: 2 }, 'The right size of adventure', 'You read it twice. The ending works both times.', 'I found a library book worth reading twice.'),
      option('ask', 'Ask the librarian for a recommendation', { respect: 3, smarts: 3 }, 'Professional dragon advice', 'The recommendation is excellent. Asking turns out to be quicker than lifting.', 'A librarian helped me find my next favourite book.'),
    ],
  },
  {
    id: 'broken-mug', min: 6, max: 11, parent: true, illustration: 'relationship', title: 'The handle is no longer involved',
    body: 'You knock {parent}’s favourite mug off the table. The handle leaves the rest of the mug. Nobody saw.',
    choices: [
      option('tell', 'Tell {parent} what happened', { respect: 5, stress: -2 }, 'Bad news, delivered properly', '{parent} is disappointed about the mug and pleased you said something.', 'I admitted breaking {parent}’s mug.', 4),
      option('fix', 'Offer to help repair it', { discipline: 3, smarts: 2 }, 'A supervised repair', '{parent} handles the sharp pieces. You help find a safe new use for what remains.', 'We turned a broken mug into a pencil pot.', 3),
      option('hide', 'Slide the evidence behind a plant', { stress: 5, respect: -3 }, 'A remarkably bad hiding place', '{parent} finds it while watering the plant. Now there are two things to explain.', 'I hid a broken mug behind a plant. It was not a long-term solution.', -4),
    ],
  },
  {
    id: 'rainy-fort', min: 6, max: 12, illustration: 'property', title: 'Indoor architecture',
    body: 'Rain cancels your afternoon plans. Two chairs and a blanket suggest a career in questionable structural engineering.',
    choices: [
      option('build', 'Build an elaborate fort', { happiness: 5, smarts: 2, energy: -3 }, 'Approved for immediate occupancy', 'It collapses twice. The third version has a reading corner.', 'I built a blanket fort that almost met building regulations.'),
      option('read', 'Read by the window', { smarts: 4, stress: -3 }, 'The weather does the soundtrack', 'For once, being indoors feels like the plan.', 'I spent a rainy afternoon reading by the window.'),
      option('sulk', 'Declare the whole day ruined', { happiness: -3, energy: 2 }, 'A long afternoon', 'The rain ignores your review. So does the clock.', 'I let the rain spoil an afternoon.'),
    ],
  },
  {
    id: 'parent-old-music', min: 10, max: 17, parent: true, illustration: 'relationship', title: 'Apparently this was cool',
    body: '{parent} plays a song they loved at your age. There is a lengthy explanation of how nobody makes music properly anymore.',
    choices: [
      option('listen', 'Ask what it reminds them of', { happiness: 3, respect: 2 }, 'Before they were your parent', 'The story is better than expected. You learn something new about {parent}.', 'I listened to {parent}’s old music and the story behind it.', 6),
      option('swap', 'Trade one song each', { happiness: 4 }, 'An uneasy cultural exchange', 'Neither of you likes everything. Both of you pretend a little.', 'I swapped music recommendations with {parent}.', 4),
      option('roast', 'Give a brutally concise review', { happiness: 2, respect: -2 }, 'Critic, age: insufficient', '{parent} turns it up. This may have strengthened the opposition.', 'I insulted {parent}’s favourite song. It got louder.', -3),
    ],
  },
  {
    id: 'group-chat-rumour', min: 12, max: 18, illustration: 'journal', title: 'Forwarded with absolutely no evidence',
    body: 'A group chat is circulating an embarrassing rumour about someone your age. The source appears to be “everyone knows”.',
    choices: [
      option('question', 'Ask whether anyone actually knows', { respect: 5, stress: 2 }, 'An inconvenient question', 'Nobody produces evidence. The conversation changes topic with suspicious speed.', 'I challenged a rumour in a group chat.'),
      option('mute', 'Mute it and step away', { stress: -4, happiness: 1 }, 'A quieter evening', 'Your phone stays in your pocket. The rumour gets none of your attention.', 'I stepped away from a nasty group chat.'),
      option('forward', 'Forward it for a reaction', { respect: -5, stress: 3 }, 'Screenshots are patient', 'Someone asks why you helped spread it. “Just forwarding” sounds weaker out loud.', 'I passed on a rumour I had not checked.'),
    ],
  },
  {
    id: 'first-presentation', min: 12, max: 19, illustration: 'education', title: 'Thirty seconds feels quite long',
    body: 'You are asked to introduce yourself to a room full of people your age. Your mind supplies every fact except your name.',
    choices: [
      option('breathe', 'Take a breath and keep it simple', { discipline: 3, stress: -2 }, 'An adequate introduction', 'You say your name, add one true thing, and sit down. Adequate is underrated.', 'I got through an introduction without pretending to be interesting.'),
      option('joke', 'Open with a joke', { happiness: 3, stress: 2 }, 'Somebody laughs', 'It is enough. You remember your name on the second sentence.', 'A small joke got me through an awkward introduction.'),
      option('rush', 'Speak at emergency speed', { energy: -2, stress: 3 }, 'New personal speed record', 'Nobody quite catches the middle. You are already sitting down.', 'I rushed an introduction and wished I had slowed down.'),
    ],
  },
  {
    id: 'parent-boundary', min: 14, max: 20, parent: true, parentContact: true, illustration: 'relationship', title: 'Read at 10:42',
    body: '{parent} sends “Where are you?” You are somewhere perfectly ordinary, but the fourth message arrives before you finish typing.',
    choices: [
      option('explain', 'Reply, then talk about check-ins', { respect: 3, stress: -2 }, 'A workable arrangement', 'You agree on a check-in time. {parent} admits the silence worried them.', 'I agreed on clearer check-ins with {parent}.', 5),
      option('photo', 'Send a spectacularly boring photo', { happiness: 3 }, 'Proof of ordinary life', 'The photo contains a chair and half your shoe. It does the job.', 'I reassured {parent} with a very boring photo.', 2),
      option('ignore', 'Ignore all four', { stress: 4, respect: -2 }, 'Message five arrives', 'The next conversation is longer than a reply would have been.', 'I ignored {parent}’s messages and made things harder.', -4),
    ],
  },
  {
    id: 'comparison-scroll', min: 16, max: 45, illustration: 'wellbeing', title: 'Everyone else appears to be thriving',
    body: 'Your feed contains a promotion, a beach, and a suspiciously tidy kitchen. Your own evening contains laundry.',
    choices: [
      option('close', 'Close the app and finish one thing', { discipline: 4, stress: -4 }, 'One less pile', 'The laundry is still laundry. At least it is now folded.', 'I stopped comparing my evening to everyone else’s highlights.'),
      option('message', 'Send someone a proper message', { happiness: 4, energy: -2 }, 'A less edited conversation', 'It turns out their day was messier than the photograph suggested.', 'A real conversation helped more than scrolling.'),
      option('scroll', 'Investigate another hour of success', { happiness: -4, stress: 4, energy: -3 }, 'The kitchen remains immaculate', 'Your laundry does not fold itself during the investigation.', 'I lost an evening comparing myself to a feed.'),
    ],
  },
  {
    id: 'community-garden', min: 18, max: 85, local: true, illustration: 'wellbeing', title: 'The carrots have a committee',
    body: 'A notice in {city} asks for volunteers at a community garden. It promises fresh air and makes no promises about the weather.',
    choices: [
      option('join', 'Help for an afternoon', { happiness: 4, fitness: 3, energy: -4 }, 'Useful dirt', 'You weed a patch, meet a few people, and leave with very honest shoes.', 'I volunteered at a community garden in {city}.'),
      option('learn', 'Ask someone to teach you the basics', { smarts: 4, respect: 2, energy: -2 }, 'The weeds have names', 'So do the people. You remember most of both.', 'I learned a little gardening and met people nearby.'),
      option('pass', 'Keep your afternoon free', { energy: 3 }, 'No new obligations', 'You leave the notice for someone with more room in their week.', 'I decided against adding another commitment.'),
    ],
  },
  {
    id: 'bad-review', min: 18, max: 85, illustration: 'journal', title: 'A masterpiece in the comments',
    body: 'A stranger misunderstands something you wrote online and responds with a paragraph that has clearly had a difficult morning.',
    choices: [
      option('clarify', 'Clarify once, politely', { respect: 3, stress: 1 }, 'One reply is enough', 'You explain what you meant, then leave it there. The internet survives.', 'I clarified an online misunderstanding without turning it into a project.'),
      option('leave', 'Leave it alone', { stress: -3, discipline: 2 }, 'An argument without you', 'The paragraph remains online. Your afternoon remains yours.', 'I chose not to join an argument with a stranger.'),
      option('essay', 'Write a devastating response', { stress: 5, energy: -4, respect: -2 }, 'The afternoon disappears', 'You revise it three times. By the end, neither of you is discussing the original point.', 'I spent too long arguing online.'),
    ],
  },
  {
    id: 'rest-guilt', min: 20, max: 75, local: true, illustration: 'wellbeing', title: 'An aggressively empty afternoon',
    body: 'For once, nothing urgently needs you. Your brain suggests inventing a task so you can complain about having no free time.',
    choices: [
      option('rest', 'Rest without earning it first', { energy: 8, stress: -5 }, 'Nothing catches fire', 'You take a quiet afternoon. The world manages.', 'I let myself rest without turning it into another task.'),
      option('walk', 'Take a long, unhurried walk', { fitness: 4, happiness: 3, energy: -2 }, 'A different pace', 'You notice a street you normally hurry past.', 'I spent a free afternoon walking around {city}.'),
      option('fill', 'Fill every available minute', { discipline: 3, stress: 4, energy: -5 }, 'Productivity wins on points', 'You finish several things and feel strangely annoyed about it.', 'I filled a free afternoon with chores.'),
    ],
  },
  {
    id: 'old-photo', min: 22, max: 70, parent: true, parentContact: true, illustration: 'relationship', title: 'Evidence from a previous haircut',
    body: '{parent} sends you an old photograph. The haircut is difficult to defend. The memory attached to it is much better.',
    choices: [
      option('story', 'Ask for the whole story', { happiness: 5, stress: -2 }, 'A detail you had forgotten', '{parent} remembers something small that makes the photograph matter.', 'I heard the story behind an old photograph with {parent}.', 6),
      option('scan', 'Save a copy and label it', { discipline: 3, happiness: 2 }, 'Future evidence secured', 'You add names and a date while someone still remembers them.', 'I saved and labelled an old family photograph.', 4),
      option('joke', 'Focus entirely on the haircut', { happiness: 3 }, 'Fair criticism', '{parent} takes some responsibility. Not all of it.', 'We laughed at an old haircut.', 2),
    ],
  },
  {
    id: 'local-meeting', min: 25, max: 90, local: true, illustration: 'property', title: 'Public consultation, private impatience',
    body: 'A meeting in {city} is discussing a local public space. Someone has brought a seventeen-slide presentation about benches.',
    choices: [
      option('speak', 'Make one practical suggestion', { respect: 4, discipline: 2, energy: -3 }, 'Recorded in the minutes', 'Your point makes it into the discussion. It is not a promise, but it is a start.', 'I spoke at a local meeting about a public space.'),
      option('listen', 'Listen before forming an opinion', { smarts: 3, respect: 2 }, 'More complicated than it looked', 'You leave knowing why two reasonable people disagree about the same bench.', 'I listened to different views at a local meeting.'),
      option('leave', 'Leave before slide nine', { energy: 3, stress: -1 }, 'A strategic retreat', 'The benches will have to manage without you tonight.', 'I left a public meeting early.'),
    ],
  },
  {
    id: 'small-mistake', rarity: 'uncommon', min: 25, max: 90, illustration: 'journal', title: 'Reply all',
    body: 'You send a harmless but spectacularly unfinished message to more people than intended. It ends halfway through “as I was saying”.',
    choices: [
      option('own', 'Send a short correction', { respect: 3, stress: -2 }, 'Mystery resolved', 'One clear sentence does more work than your original three paragraphs.', 'I corrected a message I sent too soon.'),
      option('laugh', 'Acknowledge it with a joke', { happiness: 3, stress: -1 }, 'At least it was harmless', 'A few people admit they have done worse. One provides evidence.', 'I laughed off a harmless messaging mistake.'),
      option('reread', 'Reread it for the rest of the evening', { stress: 5, energy: -3 }, 'Still unfinished', 'The message does not improve after the ninth inspection.', 'I worried too long about a small mistake.'),
    ],
  },
  {
    id: 'birthday-number', min: 30, max: 90, illustration: 'birthday', title: 'Another year, another timetable',
    body: 'Another birthday makes you consider whether you are where you expected to be. Your younger self appears to have underestimated the cost of groceries.',
    choices: [
      option('notice', 'Notice what is actually going well', { happiness: 5, stress: -3 }, 'A fairer assessment', 'Your life contains things the old plan could not have predicted.', 'I measured my life more fairly on my birthday.'),
      option('plan', 'Choose one thing to work towards', { discipline: 5, happiness: 2 }, 'A smaller, useful plan', 'One concrete goal feels better than an imaginary deadline for everything.', 'I chose one practical goal for the year ahead.'),
      option('compare', 'Compare yourself to an impossible timetable', { happiness: -4, stress: 4 }, 'The timetable is unhelpful', 'It still has no entry for ordinary Tuesdays.', 'I was harder on myself than my birthday required.'),
    ],
  },
  {
    id: 'familiar-street', min: 40, max: 100, local: true, illustration: 'travel', title: 'A place that remembers differently',
    body: 'You return to a familiar part of {city}. A shop has changed, a wall has been painted, and one corner looks exactly as you remember.',
    choices: [
      option('walk', 'Take the longer way around', { happiness: 4, fitness: 2 }, 'Room for both versions', 'You find a few things you miss and a few things you like better.', 'I walked through a familiar neighbourhood and noticed its changes.'),
      option('write', 'Write down what you remember', { smarts: 3, happiness: 3 }, 'Before the details blur', 'A small memory becomes a paragraph worth keeping.', 'I wrote down a memory of {city}.'),
      option('rush', 'Keep going', { energy: 2 }, 'Another day, perhaps', 'The corner stays where it is. You have somewhere else to be.', 'I passed through an old neighbourhood without stopping.'),
    ],
  },
  {
    id: 'new-skill-late', min: 50, max: 100, illustration: 'education', title: 'Beginner is still an available setting',
    body: 'You find an introductory lesson in something you have always been curious about. Everyone begins with the same impressively basic exercise.',
    choices: [
      option('try', 'Be willing to be bad at it', { smarts: 5, happiness: 3, energy: -3 }, 'A proper beginning', 'You are not good yet. That is what the introductory bit was for.', 'I tried learning something new and let myself be a beginner.'),
      option('watch', 'Watch first and ask questions', { smarts: 3, respect: 2 }, 'Curiosity counts', 'You leave knowing enough to decide whether to return.', 'I asked questions at an introductory lesson.'),
      option('leave', 'Decide you are too old for this', { happiness: -2, stress: 1 }, 'A door left closed', 'Nobody asked your age. You supplied the objection yourself.', 'I talked myself out of trying something new.'),
    ],
  },
  {
    id: 'useful-advice', min: 60, max: 115, illustration: 'relationship', title: '“What would you do?”',
    body: 'A younger person asks for your advice about a difficult decision. It is tempting to answer a question they have not actually asked.',
    choices: [
      option('listen', 'Ask what matters most to them', { respect: 5, happiness: 3 }, 'Their decision, with company', 'You listen first. The advice you give is shorter and more useful.', 'I listened before giving advice to someone younger.'),
      option('story', 'Share a mistake of your own', { respect: 3, happiness: 3 }, 'Experience, honestly described', 'They seem relieved that you did not always know what you were doing either.', 'I shared an old mistake instead of pretending to have every answer.'),
      option('lecture', 'Deliver the complete life lecture', { respect: -3, energy: -2 }, 'A comprehensive answer', 'It covers several decades. Their original question gets a brief appearance near the end.', 'I gave more advice than anyone had requested.'),
    ],
  },
  {
    id: 'quiet-morning', min: 65, max: 120, illustration: 'wellbeing', title: 'An ordinary morning',
    body: 'Light comes through the window. For a while, there is no urgent news and nothing you need to prove.',
    choices: [
      option('savour', 'Enjoy it as it is', { happiness: 5, stress: -4, energy: 3 }, 'Enough for this morning', 'You let a good, ordinary moment be good and ordinary.', 'I enjoyed a quiet morning without wishing it were something else.'),
      option('reach', 'Get in touch with someone', { happiness: 4, energy: -1 }, 'A small conversation', 'You talk about very little. It still matters.', 'I used a quiet morning to get in touch with someone.'),
      option('worry', 'Look for something to worry about', { stress: 4, happiness: -2 }, 'Something turns up', 'Worry is rarely short of material. The light was nicer.', 'I found a worry to fill a peaceful morning.'),
    ],
  },
  ...childhoodTemplates,
  ...workplaceTemplates,
  ...adultRelationshipTemplates,
  ...everydayLifeTemplates,
  ...rareAdultTemplates,
  ...specialCareerDepthTemplates,
];

/** Read saved contacts only. Eligibility/binding never creates people or draws RNG. */
function schoolContext(world: World) {
  const player = world.people[world.activePersonId], school = currentSchool(world);
  const present = (id: string) => { const person = world.people[id]; return person && !person.died && person.country === player.country && person.city === player.city && !activeTrip(world, id) && !hospitalized(world, person) && !isConfined(world, person) && !person.legal.wanted && !serviceAway(world, id); };
  if (!school || school.stage !== player.education.stage || school.school !== player.education.school || school.country !== player.country || school.city !== player.city || !present(player.id)) return {};
  const peer = school.classmateIds.map(id => world.people[id]).find(person => present(person.id) && person.education.stage === school.stage && person.education.school === school.school);
  const candidate = world.people[school.currentTeacherId], teacher = present(candidate.id) && candidate.employment?.roleId === 'teacher' ? candidate : undefined;
  return { school, peer, teacher };
}
/** Read existing contracts and introductions only; selecting a story creates nobody. */
function workContext(world: World) {
  const player = world.people[world.activePersonId], place = currentWorkplace(world), job = player.employment;
  const role = jobs.find(item => item.id === job?.roleId);
  if (!place || !job || !role || role.specialCareer || job.companyId || !storyPersonPresent(world, player) || job.employer !== place.employer || job.employer !== player.city + ' ' + role.sector || job.currency !== countries[player.country].currency) return {};
  const available = place.members.filter(member => {
    const person = world.people[member.personId], contract = person?.employment;
    return !member.left && person && storyPersonPresent(world, person) && person.country === place.country && person.city === place.city && contract?.id === member.employmentId && contract.employer === place.employer && contract.currency === job.currency && !contract.companyId && relationFor(world, player.id, person.id);
  });
  const coworker = available.find(member => member.role === 'coworker'), supervisor = available.find(member => member.role === 'supervisor');
  return { place, coworker: coworker && world.people[coworker.personId], supervisor: supervisor && world.people[supervisor.personId] };
}
/** Local adult scenes use existing social roles, never a generated substitute. */
function socialContext(world: World) {
  const player = world.people[world.activePersonId];
  if (ageOn(player, world.date) < 18 || !storyPersonPresent(world, player)) return {};
  const contact = (edge?: World['relationships'][number]) => {
    const id = edge?.from === player.id ? edge.to : edge?.to === player.id ? edge.from : undefined;
    const person = id && world.people[id];
    return person && person.id !== player.id && ageOn(person, world.date) >= 18 && person.country === player.country && person.city === player.city && storyPersonPresent(world, person) ? person : undefined;
  };
  const friendEdge = world.relationships.find(edge => edge.roles.includes('friend') && !['dating', 'engaged', 'married'].includes(edge.romance) && contact(edge));
  return { friend: contact(friendEdge), partner: contact(partnerRelation(world)) };
}
/** Physical family scenes require the actual household; remote contact is explicit. */
function templateParent(world: World, template: EventTemplate) {
  if (!template.parent) return;
  const player = world.people[world.activePersonId];
  if (!template.parentContact) return storyPersonPresent(world, player) ? storyParent(world) : undefined;
  return world.relationships.find(edge => {
    const parent = world.people[edge.from];
    return edge.kind === 'parent' && edge.to === player.id && parent && !parent.died && !hospitalized(world, parent) && !isConfined(world, parent) && !parent.legal.wanted && !serviceAway(world, parent.id);
  });
}
export function eligibleTemplates(world: World): readonly EventTemplate[] {
  const player = world.people[world.activePersonId], age = ageOn(player, world.date);
  const context = schoolContext(world), work = workContext(world), social = socialContext(world), life = lifeStoryContexts(world);
  // Callback records remain authoritative even when an older history is sparse.
  // Never offer an origin ID that scheduleStory already considers recorded.
  const recordedOrigins = new Set(world.storyThreads.map(thread => thread.originEventId));
  return eventTemplates.filter(template => lifeStoryAvailable(life, template) && age >= template.min && age <= template.max && !recordedOrigins.has('event_' + world.date.year + '_' + template.id) && (!template.parent || templateParent(world, template)) && (!template.choices.some(choice => choice.followUp === 'arcade-invitation') || storyParent(world)) && (!template.school || context.school && (template.school === 'any' || template.school === context.school.stage)) && (!template.classmate || context.peer) && (!template.teacher || context.teacher) && (!template.workplace || work.place) && (!template.coworker || work.coworker) && (!template.supervisor || work.supervisor) && (!template.friend || social.friend) && (!template.partner || social.partner) && !world.eventHistory.some(history => history.templateId === template.id && world.date.year - history.year < 5));
}

export function bindEvent(world: World, template: EventTemplate): Extract<Pending, { kind: 'decision' }> {
  const player = world.people[world.activePersonId];
  const parent = templateParent(world, template);
  if (template.parent && !parent) throw new Error(template.parentContact ? 'This event needs a living parent who can be contacted' : 'This event needs a living parent at home');
  const person = parent ? world.people[parent.from] : null, context = schoolContext(world), work = workContext(world), social = socialContext(world), life = lifeStoryContexts(world);
  if (!lifeStoryAvailable(life, template)) throw new Error('This event needs its existing available life context');
  const binding = lifeStoryBinding(life, template);
  if (template.school && (!context.school || template.school !== 'any' && template.school !== context.school.stage) || template.classmate && !context.peer || template.teacher && !context.teacher) throw new Error('This event needs the current school contacts');
  if (template.workplace && !work.place || template.coworker && !work.coworker || template.supervisor && !work.supervisor) throw new Error('This event needs the current available workplace contacts');
  if (template.friend && !social.friend || template.partner && !social.partner) throw new Error('This event needs the existing available adult friend or partner');
  const peerRelation = context.peer && relationFor(world, player.id, context.peer.id), teacherRelation = context.teacher && relationFor(world, player.id, context.teacher.id);
  const coworkerRelation = work.coworker && relationFor(world, player.id, work.coworker.id), supervisorRelation = work.supervisor && relationFor(world, player.id, work.supervisor.id);
  const friendRelation = social.friend && relationFor(world, player.id, social.friend.id), romanticRelation = social.partner && relationFor(world, player.id, social.partner.id);
  const salary = player.employment ? formatMoney({ minor: player.employment.annualPay, currency: player.employment.currency }) : '';
  const names = {
    parent: person?.firstName ?? '', city: player.city, classmate: context.peer?.firstName ?? '',
    teacher: context.teacher?.firstName ?? '', school: context.school?.school ?? '', workplace: work.place?.employer ?? '',
    coworker: work.coworker ? fullName(work.coworker) : '', supervisor: work.supervisor ? fullName(work.supervisor) : '',
    friend: social.friend ? fullName(social.friend) : '', partner: social.partner ? fullName(social.partner) : '',
    child: binding.child ? fullName(binding.child.person) : '', pet: binding.pet?.name ?? '',
    hobby: binding.hobby ? hobbyContent[binding.hobby.kind].name.toLowerCase() : '',
    destination: life.visited ? destinations[life.visited.destinationId].city : '',
    condition: life.condition ? conditions[life.condition.type].name : '', salary,
  };
  const contacts = storyContactNames([
    ...(template.parent && person ? [{ token: 'parent', role: 'parent', person, display: names.parent }] : []),
    ...(template.classmate && context.peer ? [{ token: 'classmate', role: 'classmate', person: context.peer, display: names.classmate }] : []),
    ...(template.teacher && context.teacher ? [{ token: 'teacher', role: 'teacher', person: context.teacher, display: names.teacher }] : []),
    ...(template.coworker && work.coworker ? [{ token: 'coworker', role: 'coworker', person: work.coworker, display: names.coworker }] : []),
    ...(template.supervisor && work.supervisor ? [{ token: 'supervisor', role: 'supervisor', person: work.supervisor, display: names.supervisor }] : []),
    ...(template.friend && social.friend ? [{ token: 'friend', role: 'friend', person: social.friend, display: names.friend }] : []),
    ...(template.partner && social.partner ? [{ token: 'partner', role: 'partner', person: social.partner, display: names.partner }] : []),
    ...(binding.child ? [{ token: 'child', role: 'child', person: binding.child.person, display: names.child }] : []),
  ]);
  Object.assign(names, contacts.names);
  const relationshipLabels = [...contacts.consequenceNames].flatMap(([personId, label]) => {
    const relation = relationFor(world, player.id, personId);
    return relation ? [{ relationshipId: relation.id, label }] : [];
  });
  // A name is literal text, including dollar signs or text resembling another token.
  const text = (value: string) => value.replace(/\{(parent|city|classmate|teacher|school|workplace|coworker|supervisor|friend|partner|child|pet|hobby|destination|condition|salary)\}/g, (_match, key: keyof typeof names) => names[key]);
  const choices: BoundChoice[] = template.choices.map(choice => ({
    id: choice.id, label: text(choice.label),
    effects: [
      ...Object.entries(choice.changes).map(([stat, delta]) => ({ kind: 'stat' as const, personId: player.id, stat: stat as StoryStat, delta: delta! })),
      ...(choice.bond && parent ? [{ kind: 'relationship' as const, relationshipId: parent.id, delta: choice.bond }] : []),
      ...(choice.peerBond && peerRelation ? [{ kind: 'relationship' as const, relationshipId: peerRelation.id, delta: choice.peerBond }] : []),
      ...(choice.teacherBond && teacherRelation ? [{ kind: 'relationship' as const, relationshipId: teacherRelation.id, delta: choice.teacherBond }] : []),
      ...(choice.coworkerBond && coworkerRelation ? [{ kind: 'relationship' as const, relationshipId: coworkerRelation.id, delta: choice.coworkerBond }] : []),
      ...(choice.supervisorBond && supervisorRelation ? [{ kind: 'relationship' as const, relationshipId: supervisorRelation.id, delta: choice.supervisorBond }] : []),
      ...(choice.friendBond && friendRelation ? [{ kind: 'relationship' as const, relationshipId: friendRelation.id, delta: choice.friendBond }] : []),
      ...(choice.partnerBond && romanticRelation ? [{ kind: 'relationship' as const, relationshipId: romanticRelation.id, delta: choice.partnerBond }] : []),
      ...(choice.childBond && binding.child ? [{ kind: 'relationship' as const, relationshipId: binding.child.relationshipId, delta: choice.childBond }] : []),
      ...(choice.petBond && binding.pet ? [{ kind: 'pet-bond' as const, petId: binding.pet.id, personId: player.id, delta: choice.petBond }] : []),
      ...(choice.grades && context.school ? [{ kind: 'school-grade' as const, personId: player.id, communityId: context.school.id, delta: choice.grades }] : []),
      ...(choice.skill ? [{ kind: 'skill' as const, personId: player.id, skill: choice.skill.id, delta: choice.skill.delta }] : []),
      ...(choice.followUp && context.school && context.peer ? [{ kind: 'schedule-story' as const, storyKind: choice.followUp, personId: player.id, peerId: context.peer.id, communityId: context.school.id, teacherId: choice.followUp === 'project-promise' ? context.teacher!.id : null, parentId: choice.followUp === 'arcade-invitation' ? person!.id : null, originEventId: 'event_' + world.date.year + '_' + template.id, originTemplateId: template.id, originChoiceId: choice.id, ...(choice.followUp === 'project-promise' ? { rememberProject: true as const } : {}) }] : []),
    ],
    resultTitle: text(choice.title), resultBody: text(choice.result), journal: text(choice.journal),
  })).map(choice => {
    const labels = relationshipLabels.filter(row => choice.effects.some(effect => effect.kind === 'relationship' && effect.relationshipId === row.relationshipId));
    return labels.length ? { ...choice, relationshipLabels: labels } : choice;
  });
  return { kind: 'decision', id: 'event_' + world.date.year + '_' + template.id, templateId: template.id, title: text(template.title), body: text(template.body), illustration: template.illustration, personIds: [...new Set([player.id, ...(template.parent && person ? [person.id] : []), ...(template.classmate && context.peer ? [context.peer.id] : []), ...(template.teacher && context.teacher ? [context.teacher.id] : []), ...(template.coworker && work.coworker ? [work.coworker.id] : []), ...(template.supervisor && work.supervisor ? [work.supervisor.id] : []), ...(template.friend && social.friend ? [social.friend.id] : []), ...(template.partner && social.partner ? [social.partner.id] : []), ...(binding.child ? [binding.child.person.id] : [])])], choices };
}
