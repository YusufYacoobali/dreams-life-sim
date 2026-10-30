import { ageOn, fullName, World } from '../model';
import { BoundChoice, Pending } from '../runtime';

import { EventTemplate, StoryStat, storyOption as option } from './eventTypes';
import { refinedAnnualTemplate } from './annualStoryRefinements';
import { childhoodTemplates } from './childhood';
import { dramaticTemplates } from './dramaticEvents';
import { dramaticContext } from '../systems/dramaticContext';
import { bindDramaticEvent } from '../systems/dramaticOffers';
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
import { studyStoryContext } from '../systems/studyStoryContext';
import { laterLifeStoryContext } from '../systems/laterLifeStoryContext';
import { lifeStoryContexts, lifeStoryBinding, lifeStoryAvailable } from '../systems/lifeStoryContext';
import { destinations } from './travel';
import { hobbyContent } from './leisure';
import { conditions } from './health';
import { formatMoney } from '../money';
import { everydayLifeTemplates } from './everydayLifeStories';
import { rareAdultTemplates } from './rareAdultStories';
import { specialCareerDepthTemplates } from './specialCareerDepthStories';
import { legalTemplates } from './legalStories';
import { laterLifeFamilyTemplates } from './laterLifeFamilyStories';
import { studyLifeTemplates } from './studyLifeStories';
import { laterLifeRecordTemplates } from './laterLifeRecordStories';
import { legalStoryAvailable, legalStoryContexts } from '../systems/legalStoryContext';
import { offences } from './crime';
import { storyContactNames, storyParticipants } from '../storyNames';
import { bindStoryImmediate, storyImmediateWorkAvailable, storyMoneyText, type StoryImmediateTargets } from '../systems/storyImmediateContext';

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
    id: 'first-presentation', min: 12, max: 19, illustration: 'education', title: 'Fun fact about yourself',
    body: 'You must introduce yourself with one fun fact. The person before you announces they once swallowed a coin. Everyone turns to you expecting escalation.',
    choices: [
      option('breathe', 'Give your name and disappoint them', { discipline: 3, stress: -2 }, 'No coins were harmed', 'You say you like music. A perfectly ordinary fact survives in a room briefly obsessed with swallowing things.', 'I gave a simple introduction after someone set an alarming standard.'),
      option('joke', 'Claim you only eat paper money', { happiness: 4, stress: 2 }, 'An expensive diet', 'The room laughs. Someone asks whether you prefer coins for dessert. You have accidentally acquired a running joke.', 'I joked about eating money during an awkward introduction.'),
      option('rush', 'Recite your entire biography at speed', { energy: -2, stress: 3 }, 'Nobody stops you', 'You cover several years without breathing. At the end, someone asks your name.', 'I rushed through an introduction and forgot to give my name.'),
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
    id: 'community-garden', min: 18, max: 85, local: true, illustration: 'wellbeing', title: 'The naked gardener',
    body: 'The community garden in {city} needs volunteers. Its organiser is wearing a novelty apron printed with a naked torso and refuses to explain it.',
    choices: [
      option('join', 'Weed beside the alarming apron', { happiness: 4, fitness: 3, energy: -4 }, 'A productive misunderstanding', 'You clear a whole bed. Three passers-by stop to stare before realising the torso has pockets.', 'I volunteered beside a gardener in an alarming novelty apron in {city}.'),
      option('learn', 'Ask about the plants, very specifically', { smarts: 4, respect: 2, energy: -2 }, 'Excellent eye contact', 'You learn how to spot weeds while maintaining a heroic stare at the organiser’s forehead.', 'I learned gardening while trying to ignore a novelty apron.'),
      option('pass', 'Decide you have seen enough nature', { energy: 3 }, 'Fully clothed elsewhere', 'You leave before the organiser unveils the matching gardening gloves. Some mysteries can remain unsolved.', 'I declined a garden volunteering session with an unusual dress code.'),
    ],
  },
  {
    id: 'bad-review', min: 18, max: 85, illustration: 'journal', title: 'The soup tribunal',
    body: 'You describe a bowl of soup online as “fine”. A stranger accuses you of destroying local culture. They have posted eleven replies and a diagram.',
    choices: [
      option('clarify', 'Explain that you meant the soup', { respect: 3, stress: 1 }, 'A narrow defence', 'You clarify that your review concerns lunch rather than civilisation. The diagram receives no further comment.', 'I clarified a soup review after a stranger took it personally.'),
      option('leave', 'Leave the soup to its lawyers', { stress: -3, discipline: 2 }, 'A bowl without a spokesperson', 'You close the app. The stranger continues arguing with the word “fine” for the rest of the afternoon.', 'I walked away from an online argument about soup.'),
      option('essay', 'Publish a detailed attack on their diagram', { stress: 5, energy: -4, respect: -2 }, 'Nobody remembers lunch', 'You spend hours proving an arrow points the wrong way. The argument has become less about soup and more about both of you.', 'I wasted an afternoon arguing over a stranger’s diagram about soup.'),
    ],
  },
  {
    id: 'rest-guilt', min: 20, max: 75, local: true, illustration: 'wellbeing', title: 'Inner peace is on hold',
    body: 'At a free relaxation class, the instructor tells you to release your anger. Their phone rings. They spend the next minute shouting at a printer repair company.',
    choices: [
      option('rest', 'Close your eyes and let them finish', { energy: 8, stress: -5 }, 'A guided loss of temper', 'You breathe slowly through an argument about toner. By the time they hang up, you are considerably calmer than the professional.', 'I relaxed through my relaxation instructor’s furious printer call.'),
      option('walk', 'Find peace on a walk outside', { fitness: 4, happiness: 3, energy: -2 }, 'An advanced technique called leaving', 'You stroll through {city}. No one tells you how to breathe, and none of the trees wants a refund.', 'I left a chaotic relaxation class for a walk in {city}.'),
      option('fill', 'Offer to fix the printer problem', { discipline: 3, stress: 4, energy: -5 }, 'Customer support, spiritual division', 'You spend the class on hold. The instructor meditates while you explain that the paper tray is not the cartridge.', 'I spent a relaxation class sorting out the instructor’s printer complaint.'),
    ],
  },
  {
    id: 'old-photo', min: 22, max: 70, parent: true, parentContact: true, illustration: 'relationship', title: 'Evidence from a previous haircut',
    body: '{parent} sends you an old photograph. The haircut is difficult to defend. The memory attached to it is much better.',
    choices: [
      option('story', 'Ask for the whole story', { happiness: 5, stress: -2 }, 'An unreliable defence witness', '{parent} remembers the day fondly, then admits thinking the haircut was a good idea. You agree to preserve the memory and deny the hairstyle.', 'I heard the story behind an old photo. {parent} also confessed to approving the haircut.', 6),
      option('scan', 'Save a copy and label it', { discipline: 3, happiness: 2 }, 'For the historical record', 'You save the names and date. {parent} asks if the haircut needs its own warning label.', 'I saved an old family photograph, including its indefensible haircut.', 4),
      option('joke', 'Focus entirely on the haircut', { happiness: 3 }, 'The stylist pleads ignorance', '{parent} blames fashion. You point out that other people existed that year and had normal hair.', 'I teased {parent} about the haircut in an old photo.', 2),
    ],
  },
  {
    id: 'local-meeting', min: 25, max: 90, local: true, illustration: 'property', title: 'In loving memory of the wrong man',
    body: 'A public meeting in {city} unveils a proposed memorial bench. Its plaque honours a man who is alive, in the room, and asking whether this affects his parking permit.',
    choices: [
      option('speak', 'Suggest checking the plaque first', { respect: 4, discipline: 2, energy: -3 }, 'Death withdrawn from the proposal', 'You help redirect the discussion towards correcting the inscription. The man asks to keep “much loved” if possible.', 'I suggested correcting a memorial plaque for a living man in {city}.'),
      option('listen', 'Hear the allegedly deceased man out', { smarts: 3, respect: 2 }, 'An unusually reliable witness', 'He is touched by the tribute and offended by the date. Both positions seem reasonable.', 'I listened to a living man discuss his proposed memorial bench.'),
      option('leave', 'Leave before the eulogy', { energy: 3, stress: -1 }, 'Premature respects paid', 'The meeting begins arguing over whether to applaud. You decide that is enough local government for one evening.', 'I left a public meeting during an argument over a premature memorial.'),
    ],
  },
  {
    id: 'small-mistake', rarity: 'uncommon', min: 25, max: 90, illustration: 'journal', title: 'Reply all',
    body: 'You meant to send “Is that wig on backwards?” to one person. It lands in the whole public-meeting chat. The wig’s owner is typing.',
    choices: [
      option('own', 'Apologise before the typing stops', { respect: 3, stress: -2 }, 'An honest public disaster', 'You admit it was rude. The owner replies, “It is on correctly.” Nobody asks which part you meant to apologise for.', 'I apologised after sending a rude wig comment to a group chat.'),
      option('laugh', 'Claim you meant your own wig', { happiness: 3, respect: -2, stress: 2 }, 'New information about you', 'You save someone else’s dignity by destroying your own. The chat now wants to know how long you have worn a wig.', 'I pretended a rude group message was about my own hair.'),
      option('reread', 'Keep reopening the chat in horror', { stress: 5, energy: -3 }, 'Read by everyone', 'You inspect the message seventeen times. It remains both delivered and about the wig.', 'I spent the evening rereading an embarrassing group message.'),
    ],
  },
  {
    id: 'birthday-number', min: 30, max: 90, illustration: 'birthday', title: 'Happy statistical decline',
    body: 'For your birthday, someone sends a list of famous people who had achieved more by your age. They finish with “Hope this inspires you!”',
    choices: [
      option('notice', 'Celebrate without the comparison chart', { happiness: 5, stress: -3 }, 'Cake remains an achievement', 'You put the list aside. Your day improves immediately when it stops competing with a dead inventor.', 'I ignored an unhelpful achievement list on my birthday.'),
      option('plan', 'Choose one goal that is actually yours', { discipline: 5, happiness: 2 }, 'A private ambition', 'You pick something you want to do. Becoming internationally important by Thursday does not make the list.', 'I chose a personal goal instead of comparing birthday milestones.'),
      option('compare', 'Read every biography before bed', { happiness: -4, stress: 4 }, 'Prodigies everywhere', 'You discover several people peaked even earlier than the message suggested. This information improves absolutely nothing.', 'I spent my birthday comparing myself with famous people.'),
    ],
  },
  {
    id: 'familiar-street', min: 40, max: 100, local: true, illustration: 'travel', title: 'A very local tragedy',
    body: 'On a free history walk in {city}, the guide points at a laundrette: “A forbidden romance began here.” The owner leans out and asks whether this is about the washing-machine warranty.',
    choices: [
      option('walk', 'Stay for both versions', { happiness: 4, fitness: 2 }, 'Star-crossed and spin-dried', 'The guide describes a doomed affair. The owner describes a parts supplier. You finish the walk unsure which relationship suffered more.', 'I heard two competing tragedies outside a laundrette in {city}.'),
      option('write', 'Ask the owner for the real story', { smarts: 3, happiness: 3 }, 'The rinse cycle of betrayal', 'It was a faulty pump, six unanswered calls and a replacement that never arrived. You take notes. The guide starts taking them too.', 'I learned that a local romantic legend in {city} was a washing-machine dispute.'),
      option('rush', 'Leave before the historical reenactment', { energy: 2 }, 'Living history gets loud', 'The owner fetches the warranty. The guide unfolds a map as if it can hide them. You leave these two branches of history to settle it.', 'I left a history walk when the laundrette owner produced evidence.'),
    ],
  },
  {
    id: 'new-skill-late', min: 50, max: 100, illustration: 'education', title: 'Beginners’ self-defence',
    body: 'At a free beginner lesson, the instructor asks you to demonstrate a firm “No!” You give one so convincing that a passer-by apologises and leaves.',
    choices: [
      option('try', 'Practise the rest of the lesson', { smarts: 5, happiness: 3, energy: -3 }, 'A useful loud afternoon', 'You learn the basics and repeat the shout. The corridor remains unusually clear for the rest of the lesson.', 'I practised the basics at a free self-defence lesson.'),
      option('watch', 'Watch the demonstrations first', { smarts: 3, respect: 2 }, 'Research at a safe distance', 'You ask about the footwork. The instructor is delighted somebody has noticed the feet rather than the shouting.', 'I watched a beginner lesson and asked about its techniques.'),
      option('leave', 'Use your new “No!” on the whole lesson', { happiness: -2, stress: 1 }, 'An immediate practical application', 'You leave before learning anything beyond the first word. The instructor admits your delivery was excellent.', 'I left a beginner lesson after its first exercise.'),
    ],
  },
  {
    id: 'useful-advice', min: 60, max: 115, illustration: 'relationship', title: 'Wisdom has been requested',
    body: 'A younger person asks whether to get an ex’s name tattooed over another ex’s name. They say your life experience makes you qualified to judge.',
    choices: [
      option('listen', 'Ask why this needs to happen today', { respect: 5, happiness: 3 }, 'The appointment can wait', 'Talking reveals a fresh argument and a powerful urge to make it permanent. You suggest a decision that survives sleeping on it.', 'I listened before advising someone about an impulsive tattoo.'),
      option('story', 'Describe a bad decision of your own', { respect: 3, happiness: 3 }, 'Experience without a pedestal', 'You admit you have made choices you could not undo with soap. They stop treating the tattoo as an emergency.', 'I shared a past mistake while discussing an impulsive decision.'),
      option('lecture', 'Begin with everything wrong with their generation', { respect: -3, energy: -2 }, 'The wisdom window closes', 'You are still on your third complaint when they stop listening. Your strongest point never reaches its audience.', 'I spoiled a chance to give advice by delivering a generational lecture.'),
    ],
  },
  {
    id: 'quiet-morning', min: 65, max: 120, illustration: 'wellbeing', title: 'An ordinary morning',
    body: 'The morning is quiet. You finish your tea before anyone asks you for anything. This feels suspiciously well organised.',
    choices: [
      option('savour', 'Enjoy it as it is', { happiness: 5, stress: -4, energy: 3 }, 'A second cup, still no emergency', 'You make more tea and do absolutely nothing impressive. It is an excellent use of the morning.', 'I enjoyed a quiet morning and a second cup of tea.'),
      option('reach', 'Get in touch with someone', { happiness: 4, energy: -1 }, 'No news is still news', 'Neither of you has much to report. You manage a surprisingly long conversation about that.', 'I spent a quiet morning having a long conversation about very little.'),
      option('worry', 'Look for something to worry about', { stress: 4, happiness: -2 }, 'Management finds a problem', 'You inspect a perfectly innocent noise until it becomes a concern. The tea goes cold while you supervise it.', 'I interrupted a peaceful morning by investigating a noise that was not bothering me.'),
    ],
  },
  ...childhoodTemplates,
  ...workplaceTemplates,
  ...adultRelationshipTemplates,
  ...everydayLifeTemplates,
  ...rareAdultTemplates,
  ...specialCareerDepthTemplates,
  ...legalTemplates,
  ...laterLifeFamilyTemplates,
  ...studyLifeTemplates,
  ...laterLifeRecordTemplates,
  ...dramaticTemplates,
];
const hasStudyTemplates = eventTemplates.some(template => template.study !== undefined);
const hasLaterLifeTemplates = eventTemplates.some(template => template.retired || template.widowed);

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
  const context = schoolContext(world), work = workContext(world), social = socialContext(world), life = lifeStoryContexts(world), legal = legalStoryContexts(world);
  const study = hasStudyTemplates ? studyStoryContext(world) : undefined;
  const later = hasLaterLifeTemplates ? laterLifeStoryContext(world) : undefined;
  // Callback records remain authoritative even when an older history is sparse.
  // Never offer an origin ID that scheduleStory already considers recorded.
  const recordedOrigins = new Set(world.storyThreads.map(thread => thread.originEventId));
  return eventTemplates.filter(template => storyImmediateWorkAvailable(world, template.choices) && (!template.dramatic || !!dramaticContext(world, template.id)) && (!template.retired || later?.retired) && (!template.widowed || later?.lateSpouse) && (!template.study || template.study === study?.state) && lifeStoryAvailable(life, template) && legalStoryAvailable(legal, template) && age >= template.min && age <= template.max && !recordedOrigins.has('event_' + world.date.year + '_' + template.id) && (!template.parent || templateParent(world, template)) && (!template.choices.some(choice => choice.followUp === 'arcade-invitation') || storyParent(world)) && (!template.school || context.school && (template.school === 'any' || template.school === context.school.stage)) && (!template.classmate || context.peer) && (!template.teacher || context.teacher) && (!template.workplace || work.place) && (!template.coworker || work.coworker) && (!template.supervisor || work.supervisor) && (!template.friend || social.friend) && (!template.partner || social.partner) && !world.eventHistory.some(history => history.templateId === template.id && world.date.year - history.year < 5));
}

export function bindEvent(world: World, template: EventTemplate): Extract<Pending, { kind: 'decision' }> {
  template = refinedAnnualTemplate(template, world.overhaulVersion === 1);
  if (template.dramatic) return bindDramaticEvent(world, template);
  const player = world.people[world.activePersonId];
  const parent = templateParent(world, template);
  if (template.parent && !parent) throw new Error(template.parentContact ? 'This event needs a living parent who can be contacted' : 'This event needs a living parent at home');
  const person = parent ? world.people[parent.from] : null, context = schoolContext(world), work = workContext(world), social = socialContext(world), life = lifeStoryContexts(world), legal = legalStoryContexts(world);
  if (!lifeStoryAvailable(life, template)) throw new Error('This event needs its existing available life context');
  if (!legalStoryAvailable(legal, template)) throw new Error('This event needs its existing available legal context');
  const binding = lifeStoryBinding(life, template);
  const prisonPeer = template.legal === 'prison-peer' ? legal.peer : undefined;
  const study = template.study ? studyStoryContext(world) : undefined;
  if (template.study && template.study !== study?.state) throw new Error('This event needs its recorded current study context');
  const later = template.retired || template.widowed ? laterLifeStoryContext(world) : undefined;
  if (template.retired && !later?.retired || template.widowed && !later?.lateSpouse) throw new Error('This event needs its recorded current later-life context');
  const lateSpouse = template.widowed ? later?.lateSpouse : undefined;
  if (template.school && (!context.school || template.school !== 'any' && template.school !== context.school.stage) || template.classmate && !context.peer || template.teacher && !context.teacher) throw new Error('This event needs the current school contacts');
  if (template.workplace && !work.place || template.coworker && !work.coworker || template.supervisor && !work.supervisor) throw new Error('This event needs the current available workplace contacts');
  if (template.friend && !social.friend || template.partner && !social.partner) throw new Error('This event needs the existing available adult friend or partner');
  const peerRelation = context.peer && relationFor(world, player.id, context.peer.id), teacherRelation = context.teacher && relationFor(world, player.id, context.teacher.id);
  const coworkerRelation = work.coworker && relationFor(world, player.id, work.coworker.id), supervisorRelation = work.supervisor && relationFor(world, player.id, work.supervisor.id);
  const friendRelation = social.friend && relationFor(world, player.id, social.friend.id), romanticRelation = social.partner && relationFor(world, player.id, social.partner.id);
  const salary = player.employment ? formatMoney({ minor: player.employment.annualPay, currency: player.employment.currency }) : '';
  const names = {
    studySchool: study?.school ?? '', studyField: study?.field ?? '', lateSpouse: lateSpouse ? fullName(lateSpouse) : '',
    parent: person?.firstName ?? '', city: player.city, classmate: context.peer?.firstName ?? '',
    teacher: context.teacher?.firstName ?? '', school: context.school?.school ?? '', workplace: work.place?.employer ?? '',
    coworker: work.coworker ? fullName(work.coworker) : '', supervisor: work.supervisor ? fullName(work.supervisor) : '',
    friend: social.friend ? fullName(social.friend) : '', partner: social.partner ? fullName(social.partner) : '',
    child: binding.child ? fullName(binding.child.person) : '', pet: binding.pet?.name ?? '',
    hobby: binding.hobby ? hobbyContent[binding.hobby.kind].name.toLowerCase() : '',
    destination: life.visited ? destinations[life.visited.destinationId].city : '',
    condition: life.condition ? conditions[life.condition.type].name : '', salary,
    offence: legal.awaitingCase ? offences[legal.awaitingCase.offence].title.toLowerCase() : '', caseCity: legal.awaitingCase?.city ?? '',
    facility: (template.legal === 'prison-peer' ? legal.sentence : legal.released)?.facility ?? '', prisonPeer: prisonPeer ? fullName(prisonPeer.person) : '',
  };
  const namedContacts = [
    ...(lateSpouse ? [{ token: 'lateSpouse', role: 'late spouse', person: lateSpouse, display: names.lateSpouse }] : []),
    ...(template.parent && person ? [{ token: 'parent', role: 'parent', person, display: names.parent }] : []),
    ...(template.classmate && context.peer ? [{ token: 'classmate', role: 'classmate', person: context.peer, display: names.classmate }] : []),
    ...(template.teacher && context.teacher ? [{ token: 'teacher', role: 'teacher', person: context.teacher, display: names.teacher }] : []),
    ...(template.coworker && work.coworker ? [{ token: 'coworker', role: 'coworker', person: work.coworker, display: names.coworker }] : []),
    ...(template.supervisor && work.supervisor ? [{ token: 'supervisor', role: 'supervisor', person: work.supervisor, display: names.supervisor }] : []),
    ...(template.friend && social.friend ? [{ token: 'friend', role: 'friend', person: social.friend, display: names.friend }] : []),
    ...(template.partner && social.partner ? [{ token: 'partner', role: 'partner', person: social.partner, display: names.partner }] : []),
    ...(binding.child ? [{ token: 'child', role: 'child', person: binding.child.person, display: names.child }] : []),
    ...(prisonPeer ? [{ token: 'prisonPeer', role: 'prison contact', person: prisonPeer.person, display: names.prisonPeer }] : []),
  ];
  const contacts = storyContactNames(namedContacts);
  const roleOverrides = Object.fromEntries(namedContacts.filter(contact => contact.role !== 'parent' && contact.role !== 'child').map(contact => [contact.person.id,contact.role]));
  const participants = storyParticipants(world,namedContacts.map(contact => contact.person.id),roleOverrides);
  Object.assign(names, contacts.names);
  const relationshipLabels = [...contacts.consequenceNames].flatMap(([personId, label]) => {
    const relation = relationFor(world, player.id, personId);
    return relation ? [{ relationshipId: relation.id, label }] : [];
  });
  const trustTarget = (otherId?: string, relationshipId?: string, contextId?: string) => otherId && relationshipId
    ? { otherId, relationshipId, label: contacts.consequenceNames.get(otherId) ?? fullName(world.people[otherId]), ...(contextId ? { contextId } : {}) } : undefined;
  const immediateTargets: StoryImmediateTargets = {
    parent: template.parent ? trustTarget(person?.id, parent?.id) : undefined,
    peer: template.classmate ? trustTarget(context.peer?.id, peerRelation?.id, context.school?.id) : undefined,
    teacher: template.teacher ? trustTarget(context.teacher?.id, teacherRelation?.id, context.school?.id) : undefined,
    coworker: template.coworker ? trustTarget(work.coworker?.id, coworkerRelation?.id, work.place?.id) : undefined,
    supervisor: template.supervisor ? trustTarget(work.supervisor?.id, supervisorRelation?.id, work.place?.id) : undefined,
    friend: template.friend ? trustTarget(social.friend?.id, friendRelation?.id) : undefined,
    partner: template.partner ? trustTarget(social.partner?.id, romanticRelation?.id) : undefined,
    child: trustTarget(binding.child?.person.id, binding.child?.relationshipId),
  };
  // A name is literal text, including dollar signs or text resembling another token.
  const tokens = template.study || template.widowed ? /\{(parent|city|classmate|teacher|school|workplace|coworker|supervisor|friend|partner|child|pet|hobby|destination|condition|salary|offence|caseCity|facility|prisonPeer|studySchool|studyField|lateSpouse)\}/g : /\{(parent|city|classmate|teacher|school|workplace|coworker|supervisor|friend|partner|child|pet|hobby|destination|condition|salary|offence|caseCity|facility|prisonPeer)\}/g;
  const text = (value: string) => value.replace(tokens, (match, key: keyof typeof names) => {
    if (key === 'lateSpouse' && !template.widowed || (key === 'studySchool' || key === 'studyField') && !template.study) return match;
    return names[key];
  });
  const choices: BoundChoice[] = template.choices.map(choice => {
    const immediate = bindStoryImmediate(world, choice, immediateTargets), money = storyMoneyText(immediate);
    const choiceText = (value: string) => text(value.replace(/\{money\}/g, () => money ?? '{money}'));
    return {
    id: choice.id, label: choiceText(choice.label),
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
      ...(choice.prisonPeerBond && prisonPeer ? [{ kind: 'relationship' as const, relationshipId: prisonPeer.relationshipId, delta: choice.prisonPeerBond }] : []),
      ...(choice.grades && context.school ? [{ kind: 'school-grade' as const, personId: player.id, communityId: context.school.id, delta: choice.grades }] : []),
      ...(choice.skill ? [{ kind: 'skill' as const, personId: player.id, skill: choice.skill.id, delta: choice.skill.delta }] : []),
      ...(choice.followUp && context.school && context.peer ? [{ kind: 'schedule-story' as const, storyKind: choice.followUp, personId: player.id, peerId: context.peer.id, communityId: context.school.id, teacherId: choice.followUp === 'project-promise' ? context.teacher!.id : null, parentId: choice.followUp === 'arcade-invitation' ? person!.id : null, originEventId: 'event_' + world.date.year + '_' + template.id, originTemplateId: template.id, originChoiceId: choice.id, ...(choice.followUp === 'project-promise' ? { rememberProject: true as const } : {}) }] : []),
      ...(immediate ? [immediate] : []),
    ],
    resultTitle: choiceText(choice.title), resultBody: choiceText(choice.result), journal: choiceText(choice.journal),
  }; }).map(choice => {
    const labels = relationshipLabels.filter(row => choice.effects.some(effect => effect.kind === 'relationship' && effect.relationshipId === row.relationshipId));
    return labels.length ? { ...choice, relationshipLabels: labels } : choice;
  });
  // Participant IDs must stay living. A recorded late spouse supplies frozen
  // narrative text above, without becoming an actor in the pending decision.
  return { kind: 'decision', id: 'event_' + world.date.year + '_' + template.id, templateId: template.id, title: text(template.title), body: text(template.body), illustration: template.illustration, personIds: [...new Set([player.id, ...(template.parent && person ? [person.id] : []), ...(template.classmate && context.peer ? [context.peer.id] : []), ...(template.teacher && context.teacher ? [context.teacher.id] : []), ...(template.coworker && work.coworker ? [work.coworker.id] : []), ...(template.supervisor && work.supervisor ? [work.supervisor.id] : []), ...(template.friend && social.friend ? [social.friend.id] : []), ...(template.partner && social.partner ? [social.partner.id] : []), ...(binding.child ? [binding.child.person.id] : []), ...(prisonPeer ? [prisonPeer.person.id] : [])])], choices, ...(participants.length ? {participants} : {}) };
}
