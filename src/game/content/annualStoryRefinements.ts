import type { EventTemplate, StoryOption } from './eventTypes';

/** Copy revision 2 is prospective: original catalogues and already-bound decisions
 * remain literal. Only these prose fields can be overlaid; authored rules cannot
 * accidentally change with an editorial patch. IDs and all effects stay intact. */
type ChoiceCopy = Partial<Pick<StoryOption, 'label' | 'title' | 'result' | 'journal'>>;
type AnnualCopy = {
  revision: 2;
  reason: string;
  title?: string;
  body?: string;
  choices: Readonly<Record<string, ChoiceCopy>>;
};
export const annualStoryRefinements: Readonly<Record<string, AnnualCopy>> = {
  'first-cake': { revision: 2, reason: 'Replace an abstract response with the parent attempting the photograph.', choices: {
    share: { result: '{parent} eats the icing from your hand. You offer the hand again, now empty. They kiss it, and you immediately reload it with cake.' },
    observe: { result: 'You poke one hole in the icing and inspect your finger. {parent} says your name for the photograph. You show the camera the finger instead.' },
  } },
  'shoe-principle': { revision: 2, reason: 'Stage the three decisions through recognisable toddler behaviour.', body: '{parent} holds out your shoes. You hold out one bare foot, then withdraw it as soon as the shoe approaches. Outside is getting farther away.', choices: {
    cooperate: { result: 'You lean on {parent} while they fasten the shoes. At the door, you lift both feet to demonstrate the finished work. This makes walking difficult.' },
    alone: { result: 'You pull hard, sit down twice and finally get both shoes on. The toes point away from each other. You insist this is how you meant to do it.' },
    protest: { label: 'Lie down until the shoe policy changes', result: 'You lie across the floor. {parent} sits beside the shoes and waits. Eventually you slide one foot towards them without making eye contact.' },
  } },
  'blanket-dragon': { revision: 2, reason: 'Keep the imaginary dragon age-appropriate and give each branch a physical payoff.', choices: {
    invite: { result: 'You leave a gap beside you for the dragon. {parent} gives it a squeaky voice. You explain that it is enormous and make them start again.' },
    write: { result: 'You give it seven names and a strict bedtime later than yours. {parent} asks why it is already under the blanket. You invent an emergency.' },
    check: { result: '{parent} lifts every corner. One sock turns up. You ask them to check inside the sock before accepting that the room is safe.' },
  } },
  'library-card': { revision: 2, reason: 'Replace general praise with specific reading and librarian responses.', choices: {
    big: { result: 'You rest the book on your knees and work through it in instalments. You learn the word enormous, which finally gives you a useful way to complain about carrying it.' },
    small: { result: 'You finish the story, turn straight back to page one and read it again. This time you warn the main character before the bad decision. They still make it.' },
    ask: { result: 'The librarian asks what you like and finds a book you can lift with one hand. You reach the best bit before reaching the exit.' },
  } },
  'broken-mug': { revision: 2, reason: 'Show disappointment, repair and concealment rather than summarising approval.', choices: {
    tell: { result: '{parent} looks at the broken handle, takes a breath and thanks you for telling them. You stay nearby while they clear up, pointing out pieces you can see.' },
    fix: { result: '{parent} handles the sharp edges. You test pencils in the remaining cup and declare it repaired. They point out that the pencils are now covered in old tea.' },
    hide: { result: '{parent} waters the plant and notices the handle beside the pot. They hold it up. You begin explaining why a plant might need a mug.' },
  } },
  'rainy-fort': { revision: 2, reason: 'Give a quiet choice texture and the failed choices specific endings.', choices: {
    build: { result: 'The first roof slides off. The second takes a chair with it. You crawl into the third design with a book and keep one hand on the roof while reading.' },
    read: { result: 'You settle beside the window and read until the rain slows. When you finally look up, you have lost your place and stopped caring what the weather is doing.' },
    sulk: { result: 'You watch a raindrop run down the window, then another. Your grand protest eventually consists of sitting comfortably and refusing to admit it.' },
  } },
  'parent-old-music': { revision: 2, reason: 'Replace generic bonding with recognisable parent and teen reactions.', title: 'Turn it down, history', choices: {
    listen: { result: '{parent} tells you where they used to hear it and demonstrates a dance you wish they had only described. You ask another question before the chorus can bring it back.' },
    swap: { result: 'You each listen to one full song without interrupting. {parent} calls yours noisy, then asks for the title. You quietly save theirs too.' },
    roast: { result: '{parent} turns it up and sings directly at you. You try to escape before the second chorus. They know there is a second chorus.' },
  } },
  'group-chat-rumour': { revision: 2, reason: 'Make the challenge and embarrassment concrete without inventing a saved victim.', choices: {
    question: { result: 'You ask for the original source. Three people type at once, then stop. A photograph of somebody’s dinner arrives with unusual urgency.' },
    mute: { result: 'You mute the chat and put the phone away. When you check later, there are dozens of messages. You leave them unread and finish what you were doing.' },
    forward: { result: 'Your own forwarded message comes back as a screenshot with a question: “Why are you spreading this?” You type “I only forwarded it”, read it once and delete the reply.' },
  } },
  'parent-boundary': { revision: 2, reason: 'Keep remote contact explicit and replace vague tension with actual message behaviour.', choices: {
    explain: { result: 'You answer, then agree when to check in. {parent} sends a relieved thumbs-up. A fifth message begins “Also” but turns out to be about dinner.' },
    photo: { result: 'You send a picture of a chair and half your shoe. {parent} asks whether the chair is comfortable. You have successfully reduced the investigation to furniture.' },
    ignore: { result: 'Message five says “Just answer when you can.” When you finally reply, {parent} wants to discuss all five messages. You had hoped to avoid one conversation.' },
  } },
  'comparison-scroll': { revision: 2, reason: 'Ground comparison in small behaviour; avoid invented employment or success.', choices: {
    close: { result: 'You close the feed and fold the laundry. One sock is missing. You deal with the remaining socks without requiring a beach or an inspirational caption.' },
    message: { result: 'You ask someone how their day actually went. The reply is a long complaint about a tiny inconvenience. You contribute one of your own and forget to reopen the feed.' },
    scroll: { result: 'An hour later, you have inspected three more kitchens. Your laundry has fallen off the chair. You pick it up without photographing the achievement.' },
  } },
  'toddler-stairwell-echo': { revision: 2, reason: 'Differentiate loud, experimental and patient play.', choices: {
    hello: { result: 'You stretch hello until you run out of breath. The stairwell finishes it for you. You gasp, laugh and start again before it is ready.' },
    quiet: { result: 'Your whispered word vanishes. You try a normal voice, then a shout. The shout returns so clearly that you look behind you.' },
    wait: { result: 'You stand very still. The walls say nothing. Finally you whisper “Your turn”, which gives them something to say.' },
  } },
  'toddler-zipper-puzzle': { revision: 2, reason: 'Replace inventor commentary with observable experimentation.', choices: {
    align: { result: 'You follow the zip down and pull the jackets apart. For a moment you admire the two ordinary jackets. Then you start wondering whether you can do it again.' },
    inspect: { result: 'You try joining another edge. The teeth refuse to fit. You inspect them close to your nose, then settle for a creature with four sleeves.' },
    break: { result: 'You spread all four sleeves across the floor and sit beside your invention. It looks comfortable. You lie down to check.' },
  } },
  'toddler-shadow-race': { revision: 2, reason: 'Make shadow play a scene instead of a summary.', body: 'Your shadow reaches the wall before you. You stop. It stops. You take one careful step sideways. It is still cheating.', choices: {
    dance: { result: 'You raise one arm, then both, then wobble your knees. The shadow obeys everything. You finish by bowing to an audience that bows back.' },
    light: { result: 'You step nearer the light and become enormous on the wall. Stepping back makes you small again. You repeat this until growing up looks very easy.' },
    rest: { result: 'You sit down. Your shadow settles beside you with exactly the same idea. You stay there together until you feel like moving.' },
  } },
  'toddler-cardboard-postbox': { revision: 2, reason: 'Give repeated play an escalating payoff.', choices: {
    repair: { result: 'You fold the flaps underneath and post the letter again. Nothing comes out. You tip the box upside down to check that your repair has not eaten it.' },
    sort: { result: 'You sort the drawings into piles. The mostly brown one goes by itself. You move it farther away after deciding it is an important letter.' },
    express: { result: 'You post the same letter again. It falls onto your toes. You put it straight back in, delighted that this service delivers to exactly the right person.' },
  } },
  'toddler-lift-button': { revision: 2, reason: 'Stage the parent response and different uses of curiosity.', choices: {
    one: { result: 'You press the chosen button. It lights up. You point at the light all the way to the floor so {parent} cannot miss your contribution.' },
    check: { result: '{parent} explains the floor numbers. You ask about the alarm. They give a much longer explanation of why that one is not part of today’s tour.' },
    more: { result: 'The lift stops. Nobody gets out. It stops again. {parent} watches your hands for the rest of the journey while you admire how much lift you are getting.' },
  } },
  'school-microphone-rehearsal': { revision: 2, reason: 'Give three rehearsal choices distinct spoken and physical endings.', choices: {
    read: { result: 'You read the announcement slowly. The hall repeats the final word after you. You wait for it to finish before taking a small, unnecessary bow.' },
    breathe: { result: '{teacher} marks places to breathe. You get through the sentence without squeaking at the end. The announcement is about lunch, which makes the improvement easier to appreciate.' },
    noise: { result: 'Your noise fills the entire hall. {teacher} lowers the volume, then moves the microphone. You try the noise once more without amplification. It loses some authority.' },
  } },
  'school-label-swap': { revision: 2, reason: 'Replace generic peer reactions with a precise mistake and embarrassment.', choices: {
    quiet: { result: 'You point to the names. {teacher} swaps the labels before showing the class. Your drawing is yours again; the potato no longer has your signature.' },
    joke: { result: 'You ask {classmate} whether the potato has been practising. They laugh and help put the names back. You congratulate the potato on its brief artistic career.' },
    accuse: { result: 'You accuse {classmate} in front of {teacher}. They explain that the labels fell off, then show you another pair still on the floor. You lower your accusing finger.' },
  } },
  'work-break-playlist': { revision: 2, reason: 'Replace interchangeable music-club endings with specific listening behaviour.', choices: {
    trade: { result: 'You swap recommendations. {coworker} plays your choice, nods too carefully and asks when the good bit starts. You point out that they have just talked over it.' },
    quiet: { result: 'You ask for a quiet break. {coworker} puts the phone away, then catches themselves humming the chorus. They stop before you have to ask twice.' },
  } },
  'work-honest-view-invited': { revision: 2, reason: 'Replace process narration and somehow filler with actual edits and reactions.', title: 'Everyone loved it. Pending feedback.', choices: {
    specific: { result: 'You point to one part that cannot work as written. {supervisor} crosses out “Everyone” and writes “Most people”. You point at the same part until they start fixing it.' },
    goal: { result: '{supervisor} reads the plan aloud again. You ask what would be different when it worked. They turn the page over and finally write something that is not in the plan.' },
    flatter: { result: '{supervisor} underlines “Everyone loved it” and asks you to explain your favourite part. You open the document for the first time with unusually careful enthusiasm.' },
  } },
  'work-misnamed-complaint': { revision: 2, reason: 'Turn three abstract complaint responses into a specific mixed-up wait.', title: 'The queue has a suspect', body: 'A visitor says {coworker} made them wait forty minutes. They point at a clock that has stopped. When you ask when they arrived, they say “Just now, but that is not the point.”', choices: {
    facts: { label: 'Separate the waiting time from the stopped clock', result: 'You check the actual wait and explain the broken clock. The visitor reduces forty minutes to “a while”. {coworker} thanks you for establishing that time was not their personal decision.' },
    name: { label: 'Give {coworker}’s correct name and hear them out', result: 'You correct the name and listen. Under the forty-minute theory is a reasonable question about when they will be seen. You answer that question; the clock remains wrong.' },
    gossip: { result: 'You agree that {coworker} is always the problem. They arrive halfway through the verdict and point at the stopped clock. The visitor now has a question for you.' },
  } },
  'work-trivia-phone': { revision: 2, reason: 'Give the ridiculous answer actual content and make escalation visible.', title: 'The pub quiz has no pub', body: '{coworker} asks which animal has three hearts, bans looking it up, then checks their phone beneath the table. Their own answer appears to need technical support.', choices: {
    rules: { result: 'You ask whether both players can consult a phone. {coworker} puts theirs down and guesses. You keep guessing too, with nobody pretending to be the referee.' },
    absurd: { label: 'Answer “three very committed worms”', result: '{coworker} starts explaining why this is wrong, stops and laughs. You demand half a point for getting the number of hearts right.' },
    disqualify: { result: 'You declare the question void and announce a penalty. {coworker} asks what competition you think this is. You have spent more of the break on regulations than animals.' },
  } },
  'work-mutual-embellishment': { revision: 2, reason: 'Make the truthful and dishonest rehearsals concrete without creating an employment offer.', choices: {
    refuse: { result: 'You ask which department they ran. {coworker} revises ran to “influenced”. You ask how. They stop asking you to be a reference.' },
    coach: { result: 'You ask for one task they actually finished and practise explaining it clearly. The answer is shorter. For the first time, {coworker} can answer “What did you do?” without starting over.' },
    bargain: { result: 'You promote each other several times during a private rehearsal. By the end, both of you are running the company. You agree to stop before either imaginary executive needs a reference.' },
  } },
  'study-confident-fake-source': { revision: 2, reason: 'Make verification specific while leaving course progress untouched.', choices: {
    verify: { result: 'You compare the explanation with your {studyField} material. One point holds up. The next two rely entirely on the missing reference. You keep the useful bit and cross out the confident nonsense.' },
    discard: { result: 'You close the tab before the paragraph can introduce another expert with no surname. After a short break, you can return to studying without also defending a stranger’s formatting.' },
    defend: { result: 'You practise the answer aloud, including “insert credible reference here”. You try saying that part faster. It remains the least convincing sentence in your revision.' },
  } },
  'later-retirement-assumption': { revision: 2, reason: 'Show the stranger reacting instead of giving a lesson about assumptions.', choices: {
    accurate: { result: 'You describe a few ordinary things you actually do. The stranger says that sounds tiring. You ask whether they would like to apologise to the birds as well.' },
    humour: { result: 'You explain that the birds know what they did. The stranger laughs, then looks at a pigeon before asking what you actually enjoy.' },
    lecture: { result: 'You begin listing things. The stranger checks the time. You add checking the time to your list and continue until they stop doing it.' },
  } },
  'family-adult-parent-question': { revision: 2, reason: 'Keep memories factual in scope and give the child a distinct reaction to each answer.', choices: {
    honest: { result: 'You describe not knowing what came next. {child} asks why you never mentioned that part before. You admit it made a poor introduction to your usual advice.' },
    funny: { result: 'You tell a harmless story in which you were very sure and very wrong. {child} asks you to repeat the part where you were sure. They are enjoying that detail.' },
    lesson: { result: 'You begin “What you need to understand”. {child} nods, puts away their question and lets you finish. You never get around to saying what you were like.' },
  } },
  'prison-snoring-review': { revision: 2, reason: 'Give the serious boundary a practical response while preserving the comic alternatives.', choices: {
    honest: { result: 'You ask {prisonPeer} to stop treating your lost sleep as a compliment. They look embarrassed and agree to take the complaint seriously. Nobody promises a silent night.' },
    joke: { result: '{prisonPeer} starts laughing at the oil-change suggestion and makes almost exactly the same noise. You point. They laugh harder, proving your case much too well.' },
    imitate: { result: 'You deliver the whole performance, including a final choking snort. {prisonPeer} asks you to stop. You repeat the best bit and receive no applause.' },
  } },
};

/** A copy revision never mutates a catalogue entry or recalculates a saved choice. */
export function refinedAnnualTemplate(template: EventTemplate, enabled: boolean): EventTemplate {
  const patch = enabled ? annualStoryRefinements[template.id] : undefined;
  if (!patch) return template;
  return {
    ...template,
    ...(patch.title ? { title: patch.title } : {}),
    ...(patch.body ? { body: patch.body } : {}),
    choices: template.choices.map(choice => ({ ...choice, ...patch.choices[choice.id] })),
  };
}
