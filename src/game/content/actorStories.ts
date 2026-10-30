import type { CreativeStory } from './creativeStories';

/** Immediate, authored acting incidents. Rolls, payments and contacts belong to the recorded career. */
export const actorStories: readonly CreativeStory[] = [
  {
    id: 'actor-stolen-close-up', title: 'A very generous co-star', contact: 'costar', phase: 'working',
    body: '{contact} keeps coughing through your close-up, then gives a flawless performance when the camera turns around. The director calls this an exciting natural rhythm. Your exciting natural rhythm is beginning to sound like a lawsuit.',
    choices: [
      { id: 'rehearse', label: 'Rehearse the scene together, away from the camera', result: 'Without an audience, the coughing stops. You find a better rhythm together, although your extra rehearsal uses the evening you had promised yourself.', journal: 'I confronted the sabotaged close-up in rehearsal and improved the scene with my co-star.', impact: { quality: 6, relationship: 5, stress: 4 } },
      { id: 'document', label: 'Show the director the interrupted takes', result: 'The recordings make your case without a speech. You get a clean take and a new professional enemy who now remembers every line of your contract.', journal: 'I documented my co-star’s interruptions and secured a clean take at the cost of our working relationship.', impact: { quality: 9, reputation: 3, relationship: -12, publicity: -2 } },
      { id: 'steal', label: 'Turn the interruption into part of the performance', result: 'Your unscripted stare becomes the scene’s best moment. Your co-star recognises the exact expression and declines your invitation to lunch.', journal: 'I used my co-star’s interruption in the performance and won attention while deepening our rivalry.', impact: { quality: 3, publicity: 8, relationship: -9, reputation: -2 } },
    ],
  },
  {
    id: 'actor-furniture-method', title: 'Find the chair within', contact: 'director', phase: 'working',
    body: '{contact} wants you to spend the day behaving like the character’s childhood dining chair. Nobody is sure whether this is a preparation exercise or a funding condition. The crew has quietly put cushions on everything.',
    choices: [
      { id: 'commit', label: 'Commit completely to the director’s exercise', result: 'By evening you understand the character’s family and several new kinds of back pain. The director is delighted by your commitment; your spine is considering representation.', journal: 'I committed to an eccentric preparation exercise, improving the role while exhausting myself.', impact: { quality: 9, relationship: 6, health: -3, stress: 7 } },
      { id: 'translate', label: 'Translate the idea into a grounded performance', result: 'You bring the chair’s stillness into the scene and remain upright as a person. The performance works. The director complains that you have intellectualised the furniture.', journal: 'I adapted the director’s strange exercise into a grounded performance and defended my interpretation.', impact: { quality: 6, reputation: 4, relationship: -6 } },
      { id: 'coach', label: 'Pay a movement coach to help make it useful', result: 'The coach turns an absurd instruction into precise physical work. The scene improves, the director feels understood, and you have personally funded the most expensive chair in the room.', journal: 'I hired a movement coach to turn an absurd direction into useful physical preparation.', impact: { costBps: 110, quality: 7, relationship: 4, stress: -3 } },
    ],
  },
  {
    id: 'actor-tape-leak', title: 'The internet has seen the first take', contact: 'rival', phase: 'working',
    body: 'Your rough audition tape has escaped online, complete with a missed cue, a collapsing backdrop and a heartfelt declaration to a coat stand. {contact} has shared it with the caption “An important new voice”.',
    choices: [
      { id: 'own', label: 'Release a self-mocking commentary', result: 'You are funny about the disaster before anyone else can be cruel about it. People remember your name, although a few casting offices remember the coat stand first.', journal: 'I turned my leaked audition into a joke of my own and gained attention at a professional cost.', impact: { publicity: 12, reputation: -4, relationship: -4, stress: -2 } },
      { id: 'remove', label: 'Pay for a formal takedown request', result: 'The main upload disappears. Copies remain, because the internet has a pension plan for coat-stand performances. Casting teams appreciate your discretion more than the public does.', journal: 'I paid to challenge the unauthorised audition upload and limited its professional exposure.', impact: { costBps: 180, reputation: 5, publicity: -7, relationship: -7 } },
      { id: 'context', label: 'Share a polished scene and explain the rehearsal', result: 'The comparison gives people something better to watch. Preparing it takes time from your current role, but the tape begins to look like work in progress rather than a verdict.', journal: 'I answered the leaked tape with a finished scene and rebuilt confidence in my work.', impact: { reputation: 7, opportunity: 4, quality: -3, stress: 5 } },
    ],
  },
  {
    id: 'actor-commission-envelope', title: 'Administration, apparently', contact: 'agent', phase: 'working', requiresAgency: true,
    body: '{contact} sends an extra “administrative handling” invoice on top of the commission already agreed for your production. The accompanying message contains three smiley faces and no explanation of what has been handled.',
    choices: [
      { id: 'audit', label: 'Pay an accountant to negotiate commission on new contracts', result: 'The review secures lower representation commission on new contracts. Your signed production terms and past deductions remain unchanged. Your agent accepts with the warmth of a refrigerated sandwich.', journal: 'I paid for a commission review and secured lower commission on new contracts while damaging trust with my agent.', impact: { costBps: 160, commissionBps: -200, relationship: -10, reputation: 3 } },
      { id: 'settle', label: 'Pay a small settlement and preserve the relationship', result: 'You settle the disputed invoice for less than requested. Your agent is unusually attentive afterwards. It is possible that attention has always had an hourly rate.', journal: 'I settled a disputed agency invoice to preserve access to my agent’s contacts.', impact: { costBps: 90, relationship: 8, opportunity: 5, agencyRisk: -1 } },
      { id: 'fire', label: 'Fire the agent and handle the remaining work independently', result: 'You end the representation agreement. Signed production terms remain in force, and the agency keeps commission already earned. Your next opportunity will have to find you without its switchboard.', journal: 'I left my agency after an unexplained invoice and returned to independent representation.', impact: { leaveAgency: true, relationship: -16, reputation: 4, opportunity: -7 } },
    ],
  },
  {
    id: 'actor-awful-screenplay', title: 'The cheque has better dialogue', contact: 'director', phase: 'working',
    body: 'The revised script now includes a dream sequence in which your character explains a washing machine’s subscription options. {contact} admits the sponsor requested it. There is room in the production budget for someone who makes the scene work.',
    choices: [
      { id: 'sell', label: 'Accept the sponsor scene and negotiate higher remaining pay', result: 'Your future production pay rises under a written amendment. You deliver the appliance speech professionally, though nobody will confuse it with your artistic manifesto.', journal: 'I accepted a sponsor-driven rewrite in exchange for a higher rate on the production’s remaining work.', impact: { payBps: 500, quality: -6, reputation: -4, relationship: 5 } },
      { id: 'rewrite', label: 'Propose a version that serves the character', result: 'The sponsor still gets its washing machine. You give the character a reason to be near it. The director backs the rewrite, but your insistence costs rehearsal time.', journal: 'I reshaped a clumsy sponsor scene into part of the character’s story.', impact: { quality: 8, reputation: 5, relationship: 4, stress: 5 } },
      { id: 'refuse', label: 'Refuse the addition and accept a reduced fee', result: 'The scene is reassigned. Your remaining rate is reduced by agreement, and your performance keeps its dignity. Dignity does not contribute towards the electricity bill.', journal: 'I accepted a reduction in remaining pay to keep an unsuitable sponsor scene out of my role.', impact: { payBps: -400, quality: 4, reputation: 8, relationship: -7 } },
    ],
  },
  {
    id: 'actor-press-insult', title: 'Say something memorable', contact: 'rival', phase: 'working',
    body: 'A publicist suggests you insult {contact} during an interview. The proposed insult has been checked by three departments and is somehow less human after every revision. A provocation would certainly get the production mentioned.',
    choices: [
      { id: 'jab', label: 'Deliver a sharp, personal insult', result: 'The clip travels much further than the interview. Your production gets attention; your rival now regards every future casting as a competitive sport.', journal: 'I promoted my production by publicly insulting a rival and intensified our feud.', impact: { publicity: 13, relationship: -16, reputation: -5, publicImage: -4 } },
      { id: 'work', label: 'Talk about the work and praise their strengths', result: 'The interviewer has to ask an actual question. Your rival notices the generosity, while the publicity team quietly deletes its spreadsheet of approved feuds.', journal: 'I refused a manufactured feud and publicly acknowledged a rival’s strengths.', impact: { relationship: 10, reputation: 6, publicity: -3 } },
      { id: 'satire', label: 'Mock the manufactured rivalry instead', result: 'You describe the studio’s approved insult as if reading a menu. The joke lands, though the publicist would prefer it had landed on somebody else.', journal: 'I made a joke of the publicity team’s planned rivalry and drew attention without attacking my rival.', impact: { publicity: 7, reputation: 3, relationship: 2, opportunity: -3 } },
    ],
  },
  {
    id: 'actor-restrictive-deal', title: 'Your future, in small print', contact: 'agent', phase: 'working', requiresAgency: true,
    body: '{contact} brings a studio amendment that pays more now but gives the studio first refusal over your next opportunities. The document refers to your “future creative freedom” mostly in the section explaining where it will be stored.',
    choices: [
      { id: 'accept', label: 'Accept the restriction for a higher remaining rate', result: 'The signed amendment raises your remaining production rate. Your agent is pleased, but rival casting offices become less enthusiastic about keeping a place open for you.', journal: 'I accepted a studio first-refusal restriction in exchange for higher remaining production pay.', impact: { payBps: 700, opportunity: -10, relationship: 7, obligation: 1 } },
      { id: 'narrow', label: 'Pay for a lawyer to narrow the agreement', result: 'The final clause covers one defined commitment instead of your entire foreseeable career. You preserve more room to move, at the cost of an extremely well-formatted legal bill.', journal: 'I paid to narrow a studio restriction and preserve future casting flexibility.', impact: { costBps: 220, payBps: 200, opportunity: 4, relationship: -3 } },
      { id: 'decline', label: 'Keep the existing contract and decline the amendment', result: 'Your current production continues on its original terms. The studio’s grand plan for your future loses a page, and your agent loses an afternoon of commission arithmetic.', journal: 'I kept my existing contract rather than trading future freedom for a higher rate.', impact: { reputation: 6, opportunity: 7, relationship: -7, agencyRisk: 1 } },
    ],
  },
  {
    id: 'actor-hot-microphone', title: 'Still recording', contact: 'costar', phase: 'working',
    body: 'A backstage microphone catches you and {contact} describing the film’s promotional slogan as “a cry for adult supervision”. The recording is circulating. The studio asks which of you would like to be the misunderstanding.',
    choices: [
      { id: 'joint', label: 'Make a joint apology with your co-star', result: 'You apologise together for a private joke becoming public. The studio gets a usable statement, and your co-star knows you did not leave them to hold the microphone alone.', journal: 'I took shared responsibility for a leaked backstage joke and protected my co-star.', impact: { publicity: -4, publicImage: 6, relationship: 10, reputation: 2 } },
      { id: 'distance', label: 'Blame the co-star’s influence', result: 'Your statement satisfies the studio for an afternoon. Your co-star reads it during the next rehearsal, and the scene develops a convincing new atmosphere of betrayal.', journal: 'I distanced myself from a leaked joke by blaming my co-star and damaged our working relationship.', impact: { opportunity: 5, reputation: -4, relationship: -18, quality: -4 } },
      { id: 'defend', label: 'Defend the joke and improve the slogan publicly', result: 'Your alternative slogan is better, which does not make the studio less annoyed. Audiences enjoy the argument; the publicity department stops leaving its door open when you pass.', journal: 'I defended a leaked backstage joke and turned the publicity dispute into a public creative argument.', impact: { publicity: 11, reputation: 4, publicImage: -3, opportunity: -5 } },
    ],
  },
  {
    id: 'actor-dangerous-stunt', title: 'The insurance pause', contact: 'director', phase: 'working',
    body: '{contact} wants a practical stunt in your next scene. The coordinator says it can be done safely with extra rehearsal. The schedule says it can be done cheaply without it. These are being presented as equally qualified opinions.',
    choices: [
      { id: 'rehearse', label: 'Fund the additional rehearsal and do the stunt', result: 'The extra work produces a striking shot with controlled risks. You finish bruised and proud, with a personal contribution the studio has already called “collaborative spirit”.', journal: 'I funded extra preparation before performing a demanding practical stunt.', impact: { costBps: 160, quality: 10, reputation: 5, health: -2, stress: 4 } },
      { id: 'double', label: 'Insist on a qualified stunt double', result: 'The specialist makes the sequence look effortless. Your close-ups need careful editing, and the director is irritated by a perfectly reasonable limit on your job description.', journal: 'I insisted on a stunt double and protected my health while accepting a less distinctive close-up.', impact: { quality: 3, health: 2, relationship: -7, publicity: -2 } },
      { id: 'rush', label: 'Perform it on the existing schedule', result: 'The camera gets an intense take because your alarm is entirely authentic. Your commitment impresses the director, but recovery will be less cinematic.', journal: 'I performed a rushed stunt and gained the director’s approval at a real physical cost.', impact: { quality: 7, publicity: 5, relationship: 7, health: -8, stress: 9 } },
    ],
  },
  {
    id: 'actor-improvised-ending', title: 'One more ending', contact: 'director', phase: 'working',
    body: 'You have an idea for the ending. {contact} has an ending, a shot list and the exhausted confidence of someone who has already emailed both. There is time for one extra version before the location closes.',
    choices: [
      { id: 'improvise', label: 'Use the extra take for your improvised ending', result: 'Your version gives the character an unexpected edge. The director can use it, but is less delighted that the crew applauded before asking permission.', journal: 'I used a final take to improvise a stronger ending and strained my relationship with the director.', impact: { quality: 10, reputation: 4, relationship: -8, stress: 4 } },
      { id: 'collaborate', label: 'Build a combined version with the director', result: 'The compromise keeps the structure and changes the emotional landing. You lose some surprise and gain a collaborator who may remember you for the next production.', journal: 'I developed a new ending with the director and strengthened our professional relationship.', impact: { quality: 6, relationship: 8, opportunity: 4 } },
      { id: 'follow', label: 'Deliver the planned ending exactly', result: 'The production wraps on schedule. The director trusts your reliability, although the performance keeps the ending you already knew was merely adequate.', journal: 'I protected the shooting schedule by delivering the director’s planned ending.', impact: { relationship: 7, reputation: 3, quality: -3, stress: -4 } },
    ],
  },
  {
    id: 'actor-reshoot-rider', title: 'A better scene costs another day', contact: 'director', phase: 'working',
    body: 'The production’s pivotal scene technically exists. Nobody involved seems willing to describe it more warmly. {contact} will support reshooting it if you accept some of the burden rather than making the crew discover another week.',
    choices: [
      { id: 'contribute', label: 'Contribute to a tightly planned reshoot', result: 'The new scene gives the production an emotional centre. Your contribution is a real expense, and the director remembers that you paid for an improvement instead of merely pointing at the problem.', journal: 'I paid towards a planned reshoot that strengthened the production’s central scene.', impact: { costBps: 240, quality: 12, relationship: 7, stress: 4 } },
      { id: 'cut', label: 'Accept a lower remaining rate to fund the reshoot', result: 'A written fee amendment frees enough of the budget for another attempt. The work improves, while your payslip becomes a detailed record of artistic conviction.', journal: 'I accepted a reduced remaining fee to make an important reshoot possible.', impact: { payBps: -600, quality: 10, reputation: 6, relationship: 5 } },
      { id: 'edit', label: 'Make the existing footage work in the edit', result: 'You record a careful alternative reading and suggest a different cut. It is a smaller improvement, but the project keeps its budget and everyone keeps their planned day off.', journal: 'I helped repair a weak scene with editing and additional dialogue instead of funding a reshoot.', impact: { quality: 4, reputation: 3, relationship: 2, publicity: -2 } },
    ],
  },
  {
    id: 'actor-private-coaching', title: 'The accent has travelled', contact: 'costar', phase: 'working',
    body: '{contact} gently points out that your character’s accent changes countries whenever you raise your voice. The dialect coach is available privately. The production’s remaining coaching budget is apparently being played by an empty folder.',
    choices: [
      { id: 'coach', label: 'Book the private dialect sessions', result: 'You find a consistent voice and a new respect for the letter R. Your co-star has fewer distracting landmarks to listen for, although the lessons come from your account.', journal: 'I paid for dialect coaching and made my character’s voice consistent.', impact: { costBps: 120, quality: 9, relationship: 5, reputation: 3 } },
      { id: 'simplify', label: 'Agree on a simpler version of the accent', result: 'The director approves a less ambitious voice that you can sustain. You give up some texture and gain the ability to sound like the same person throughout a conversation.', journal: 'I simplified a difficult accent to protect the consistency of the performance.', impact: { quality: 4, reputation: 2, publicity: -3, stress: -5 } },
      { id: 'lean-in', label: 'Make the wandering accent a deliberate comic choice', result: 'The character becomes broader and more memorable. Your co-star helps sell it, but the production’s serious scenes now have to negotiate with a man who sounds internationally sponsored.', journal: 'I turned an inconsistent accent into a comic character choice with help from my co-star.', impact: { publicity: 8, relationship: 6, quality: -4, reputation: -3 } },
    ],
  },
  {
    id: 'actor-star-caravan', title: 'Someone else’s name on your door', contact: 'rival', phase: 'working',
    body: 'A visiting star has been given your dressing space, your rehearsal slot and a fruit basket addressed to “the talent”. {contact} says you should be grateful for the atmosphere. You have been preparing in a corridor with excellent acoustics for resentment.',
    choices: [
      { id: 'terms', label: 'Ask production to honour the agreed working arrangements', result: 'You get a usable rehearsal space and a written schedule. Some people call you difficult, mostly the people who were hoping you would quietly become furniture.', journal: 'I enforced my agreed working arrangements and protected preparation time.', impact: { quality: 7, reputation: 5, relationship: -8, stress: 3 } },
      { id: 'share', label: 'Offer a shared rehearsal with the visiting star', result: 'The shared session improves your scene and gives you a useful introduction. You still dress in a smaller room, but now the fruit basket occasionally visits.', journal: 'I turned a disagreement over facilities into a useful shared rehearsal.', impact: { quality: 5, opportunity: 7, relationship: 3, stress: 2 } },
      { id: 'public', label: 'Post an elegant photograph of your corridor dressing room', result: 'The caption never names anyone. This does not make it subtle. Public sympathy arrives quickly, along with a conversation about your future access to the set’s social accounts.', journal: 'I publicised poor treatment on set and attracted attention while worsening a professional rivalry.', impact: { publicity: 10, publicImage: 4, relationship: -13, opportunity: -5 } },
    ],
  },
  {
    id: 'actor-commercial-comparison', title: 'The heroic supermarket', contact: 'director', phase: 'working', categories: ['independent-film', 'studio-film', 'series'],
    body: 'A sponsor wants your dramatic speech recut into a cheerful commercial for sandwich wraps. {contact} asks whether you would approve the promotional use under a new fee rider. The sandwich now appears to have a more reliable motivation than your character.',
    choices: [
      { id: 'approve', label: 'Approve the promotional use for a higher remaining fee', result: 'The rider increases your remaining contracted rate. The sandwich campaign is cheerful, visible and destined to be mentioned whenever somebody calls you a serious actor.', journal: 'I licensed a promotional recut through a higher remaining production fee.', impact: { payBps: 500, publicity: 8, reputation: -6, relationship: 4 } },
      { id: 'alternate', label: 'Record a separate version without using the film scene', result: 'You protect the dramatic scene and give the sponsor usable new material. It takes work from your own preparation, but the director appreciates the separation.', journal: 'I recorded separate promotional material to protect the production’s dramatic scene.', impact: { quality: 3, reputation: 5, relationship: 7, stress: 6 } },
      { id: 'no', label: 'Keep the existing agreement and decline the recut', result: 'The sponsor finds another voice. Your fee stays as signed, and your character’s emotional climax remains unrelated to portable lunch.', journal: 'I declined a sponsor recut and kept the original production agreement intact.', impact: { reputation: 8, publicity: -5, relationship: -5, opportunity: -3 } },
    ],
  },
  {
    id: 'actor-emergency-understudy', title: 'An unexpectedly large scene', contact: 'director', phase: 'working',
    body: 'A visiting performer is unavailable, and {contact} asks you to take a larger share of the scene. It could be the most useful footage you have made, provided you can learn it before the lighting team stops believing in tomorrow.',
    choices: [
      { id: 'step-up', label: 'Take the larger scene and negotiate the extra work', result: 'You secure an increased rate for the production’s remaining work and give the scene everything you have. It is a valuable showcase with very little sleep around its edges.', journal: 'I accepted additional performance work under an improved remaining fee and used it as a showcase.', impact: { payBps: 400, quality: 6, opportunity: 6, stress: 9 } },
      { id: 'share', label: 'Share the scene with another supporting actor', result: 'The revised scene gives both of you something worth playing. You surrender the chance to dominate the moment and gain the director’s confidence in your judgement.', journal: 'I helped redistribute a missing lead’s scene and protected the production’s ensemble.', impact: { quality: 7, relationship: 8, reputation: 5, publicity: -2 } },
      { id: 'scope', label: 'Keep to the work you can prepare properly', result: 'The production rewrites around the absence. You perform your agreed role well, although the director will remember who volunteered when the schedule caught fire.', journal: 'I declined a rushed expansion of my role to protect the work I had already prepared.', impact: { quality: 4, stress: -5, relationship: -7, opportunity: -4 } },
    ],
  },
  {
    id: 'actor-food-fight', title: 'Method catering', contact: 'costar', phase: 'working',
    body: '{contact} refuses to break character between takes. The character is a nineteenth-century tyrant, and the catering team has now been ordered to invade the salad bar. The scene needs genuine tension, but lunch is not usually part of the rehearsal process.',
    choices: [
      { id: 'boundary', label: 'Set a firm boundary and back the crew', result: 'The tyrant is asked to use their normal voice around catering. The crew relaxes, your co-star does not, and the scene gains a different but quite usable tension.', journal: 'I challenged my co-star’s treatment of the crew and set a working boundary.', impact: { reputation: 8, quality: 4, relationship: -10, publicImage: 3 } },
      { id: 'private', label: 'Give the co-star a private way to climb down', result: 'You agree on a discreet signal for leaving the role. Lunch becomes lunch again, and your co-star knows you could have made the correction much more public.', journal: 'I helped my co-star separate the role from daily work without a public confrontation.', impact: { relationship: 10, quality: 6, stress: 3 } },
      { id: 'outdo', label: 'Answer the tyrant entirely in character', result: 'The exchange is excellent preparation for a hostile scene and terrible preparation for a quiet meal. Crew patience wears thin, even as your co-star becomes fascinated by the challenge.', journal: 'I matched a difficult co-star’s method approach and sharpened the scene at the crew’s expense.', impact: { quality: 9, relationship: 5, reputation: -6, stress: 7 } },
    ],
  },
  {
    id: 'actor-quiet-blacklist', title: 'A remarkably unavailable director', contact: 'director', phase: 'between',
    body: 'An upcoming casting would suit you, but {contact} keeps finding reasons that the introduction cannot happen. The casting office calls this a scheduling issue. The scheduling issue appears to have learned your name.',
    choices: [
      { id: 'repair', label: 'Arrange a private conversation and acknowledge your part', result: 'You do not agree about everything. You do agree that it would be exhausting to avoid each other professionally for the next twenty years. The next introduction becomes possible.', journal: 'I repaired a strained professional relationship and reopened a route to future casting.', impact: { relationship: 12, opportunity: 8, reputation: -2, stress: 4 } },
      { id: 'route-around', label: 'Invest in a showreel and approach other productions', result: 'The reel gives other casting teams a clear reason to consider you. You pay for a new route instead of paying social rent on an old disagreement.', journal: 'I funded a stronger showreel and sought opportunities beyond an obstructive director.', impact: { costBps: 190, opportunity: 12, reputation: 4, relationship: -3 } },
      { id: 'expose', label: 'Call out the obstruction in an industry interview', result: 'The interview is widely discussed. Some producers respect the candour; others decide that a candid discussion of their own behaviour sounds inconvenient.', journal: 'I publicly challenged an industry grudge and traded private access for wider attention.', impact: { publicity: 10, reputation: 3, opportunity: -8, relationship: -16 } },
    ],
  },
  {
    id: 'actor-agency-warning', title: 'A meeting with a very clear subject line', contact: 'agent', phase: 'between', requiresAgency: true,
    body: '{contact} requests a “quick career conversation” and attaches a spreadsheet with a column called Momentum. The column is mostly blank. You are offered a choice between a less prestigious route back to work and more time proving your preferred strategy.',
    choices: [
      { id: 'commercial', label: 'Commit to a more commercial approach', result: 'Your agent has a clearer pitch to make and puts more effort into introductions. The change helps access, although artistic casting teams will hear less about you for a while.', journal: 'I agreed on a commercial reset with my agent to rebuild access to work.', impact: { relationship: 9, opportunity: 9, agencyRisk: -2, reputation: -4 } },
      { id: 'materials', label: 'Pay to rebuild your materials around your strongest work', result: 'The new material gives your agent a more convincing argument without changing your direction. They agree to keep trying, provided the next argument contains an actual result.', journal: 'I invested in updated professional materials and persuaded my agent to keep backing my direction.', impact: { costBps: 240, opportunity: 7, reputation: 6, agencyRisk: -1, relationship: 3 } },
      { id: 'independent', label: 'End representation and take responsibility for the next step', result: 'The meeting ends with clear terms rather than another warning. You keep your history and contacts, but the next casting request will come from your own inbox.', journal: 'I left representation after a difficult career review and chose to rebuild independently.', impact: { leaveAgency: true, relationship: -8, opportunity: -5, reputation: 5 } },
    ],
  },
  {
    id: 'actor-reader-return', title: 'The old room, the other chair', contact: 'rival', phase: 'between',
    body: 'A casting office asks you to read opposite other actors for a workshop. {contact} is among those attending. The work is useful exposure, but the invitation is not an offer of a role and the office is careful to say so twice.',
    choices: [
      { id: 'support', label: 'Be the most generous scene partner in the room', result: 'People leave with better auditions because you were there. Casting staff notice the skill behind the generosity, while your rival discovers how annoying it is to owe you thanks.', journal: 'I supported other performers at a casting workshop and built professional goodwill.', impact: { reputation: 7, relationship: 8, opportunity: 5, stress: 3 } },
      { id: 'showcase', label: 'Use the workshop to demonstrate your own range', result: 'You give the material a memorable reading. Some participants wish you had remembered whose workshop it was; the casting office nevertheless has something concrete to remember you by.', journal: 'I used a reading workshop as a personal showcase and made a stronger impression than a friend.', impact: { opportunity: 10, publicity: 4, relationship: -10, reputation: -2 } },
      { id: 'decline', label: 'Decline and spend the time on targeted applications', result: 'You keep control of your search and send better applications elsewhere. The workshop’s introductions happen without you, along with an unexpectedly civil conversation you might have had with your rival.', journal: 'I prioritised targeted applications over an unpaid workshop and kept my search focused.', impact: { opportunity: 6, reputation: 2, relationship: -4, stress: -3 } },
    ],
  },
  {
    id: 'actor-intimacy-boundary', title: 'The scene that changed overnight', contact: 'director', phase: 'working',
    body: 'A revised scene adds intimate material that was never part of the agreed brief. {contact} calls it a brave opportunity. The coordinator calls it a change that needs proper agreement, which is less stirring but rather more useful.',
    choices: [
      { id: 'coordinate', label: 'Agree only after a coordinator-led rehearsal and clear limits', result: 'The team rewrites the scene around explicit boundaries. The preparation takes effort, but the work gains trust instead of borrowing it from people who cannot easily say no.', journal: 'I required clear boundaries and coordinated rehearsal before agreeing to revised intimate material.', impact: { quality: 8, reputation: 7, relationship: 4, stress: 4 } },
      { id: 'alternative', label: 'Propose a non-intimate version that carries the same story', result: 'The alternative gives the scene a different kind of tension. The director is frustrated by the rewrite and impressed, reluctantly, by the fact that it works.', journal: 'I proposed a different way to tell a revised scene and protected my agreed boundaries.', impact: { quality: 5, reputation: 6, relationship: -5, opportunity: 2 } },
      { id: 'refuse', label: 'Refuse the addition and keep the original terms', result: 'Your original agreement stands. The scene is reassigned around you. You have less showcase material and no obligation to convert discomfort into a career strategy.', journal: 'I refused material outside the agreed brief and kept the original production terms.', impact: { reputation: 5, quality: -2, relationship: -6, stress: -6 } },
    ],
  },
  {
    id: 'actor-review-war', title: 'One star and a personal invitation', contact: 'rival', phase: 'between',
    body: 'A trade-paper discussion about acting has become a public argument, and {contact} tags you into it as an example of “everything going wrong”. There is no casting offer attached to this invitation, which makes the enthusiasm rather suspicious.',
    choices: [
      { id: 'measured', label: 'Answer with a thoughtful account of your approach', result: 'Your response is less shareable than an insult and more useful to people considering hiring you. Your rival does not concede, but the discussion becomes harder to reduce to a punchline.', journal: 'I answered a rival’s public criticism with a clear account of my approach to acting.', impact: { reputation: 8, opportunity: 5, publicity: 2, relationship: -3 } },
      { id: 'attack', label: 'Reply with a devastating review of their latest work', result: 'The argument gets a second day of coverage. You win several excellent quotations and lose the possibility of either of you describing the dispute as professional.', journal: 'I answered professional criticism with a personal public attack and escalated the rivalry.', impact: { publicity: 14, reputation: -5, relationship: -18, opportunity: -3 } },
      { id: 'private', label: 'Invite them to discuss the disagreement privately', result: 'The public argument runs out of oxygen. In private you discover a specific grievance beneath the grand theory of artistic decline. It is repairable, although not especially flattering.', journal: 'I took a public dispute into a private conversation and began repairing the rivalry.', impact: { relationship: 12, reputation: 4, publicity: -6, stress: 4 } },
    ],
  },
  {
    id: 'actor-digital-double', title: 'The performance after the performance', contact: 'agent', phase: 'working', requiresAgency: true,
    body: 'The studio sends {contact} a broad digital-likeness rider that would make later promotional changes easier. The explanation is cheerful. The permission lasts rather longer than the explanation.',
    choices: [
      { id: 'limited', label: 'Pay for a narrow, production-specific licence', result: 'The final rider names this production and defined promotional uses. You keep meaningful control over later work, and your agent now understands why you read the attachments.', journal: 'I paid to limit a digital-likeness rider to defined uses for this production.', impact: { costBps: 210, reputation: 7, relationship: -3, opportunity: 3 } },
      { id: 'broad', label: 'Accept broader permission for a higher remaining fee', result: 'Your remaining contracted rate increases. The studio gains broader promotional flexibility, and future casting conversations become a little less straightforward about where your face might already appear.', journal: 'I accepted broader promotional likeness rights under a higher remaining production rate.', impact: { payBps: 650, opportunity: -7, publicity: 5, obligation: 1 } },
      { id: 'decline', label: 'Decline the rider and keep the existing licence', result: 'The studio works within the rights it already has. Your agent is irritated by the lost negotiation, but the next use of your performance will still need a proper conversation.', journal: 'I declined a broad likeness rider and kept the existing rights agreement.', impact: { reputation: 6, relationship: -8, opportunity: 5, publicity: -3 } },
    ],
  },
  {
    id: 'actor-festival-circuit', title: 'A queue for the important queue', contact: 'director', phase: 'between',
    body: '{contact} invites you to an industry festival programme. Travel and attendance are your responsibility. The schedule includes a panel called Finding Authentic Voices, moderated by somebody who has not answered an unsolicited email since last winter.',
    choices: [
      { id: 'attend', label: 'Pay to attend and pursue the industry meetings', result: 'You arrive prepared and leave with useful introductions. The conversations are not contracts, but more people can now place your work without checking the badge.', journal: 'I paid to attend an industry festival programme and built new routes to casting.', impact: { costBps: 260, opportunity: 12, reputation: 5, relationship: 6 } },
      { id: 'remote', label: 'Arrange a smaller remote discussion instead', result: 'The smaller session attracts fewer people and gives each of them time to hear you. The director helps make introductions, provided you do the work of following up.', journal: 'I arranged a focused remote industry discussion instead of funding festival travel.', impact: { opportunity: 6, reputation: 4, relationship: 3, stress: 2 } },
      { id: 'decline', label: 'Decline and concentrate on local work', result: 'You miss the festival’s circulation of business cards and keep your search practical. Local casting teams hear from you with material tailored to their projects.', journal: 'I chose practical local casting work over the expense of an industry festival.', impact: { opportunity: 4, reputation: 3, relationship: -5, stress: -4 } },
    ],
  },
  {
    id: 'actor-tiny-credit', title: 'Introducing Some Other Person', contact: 'director', phase: 'working',
    body: 'The draft credits spell your name incorrectly and describe your role as “Concerned Individual”. {contact} says the listing is provisional. The publicity graphics, which use the same mistake, seem rather confident about it.',
    choices: [
      { id: 'correct', label: 'Insist on correcting the materials before approval', result: 'The credit is corrected and the publicity team reissues its files. You have made more work for several people, but future casting offices will at least be able to find the person they watched.', journal: 'I insisted on correct production credits and protected the visibility of my work.', impact: { reputation: 6, opportunity: 7, relationship: -5, stress: 3 } },
      { id: 'package', label: 'Offer a clear credit line and an approved publicity photograph', result: 'The replacement package solves a practical problem without a prolonged argument. The new materials give you a little more visibility and the director a reason to appreciate your organisation.', journal: 'I supplied corrected credit and publicity material and improved how my work would be presented.', impact: { costBps: 70, publicity: 6, opportunity: 4, relationship: 5 } },
      { id: 'joke', label: 'Make Concerned Individual part of the publicity', result: 'The nickname becomes memorable. Your real name makes the revised credits too, although there is now a reasonable chance an interviewer will ask you to look concerned on command.', journal: 'I turned a poor draft credit into a memorable publicity joke.', impact: { publicity: 10, reputation: -3, opportunity: 3, relationship: 2 } },
    ],
  },
  {
    id: 'actor-room-without-you', title: 'The scene everyone rehearsed', contact: 'costar', phase: 'working',
    body: 'You discover that {contact} and the director have been rehearsing an important scene without you. They have decided how your character feels. They are now trying to fit your actual performance into a decision made by three people, one of whom has only read the first page.',
    choices: [
      { id: 'rebuild', label: 'Ask for a full rehearsal with everyone present', result: 'The extra session reveals a better scene than the private version. Your co-star resents the delay but cannot claim the result is worse without sounding remarkably committed to the chair.', journal: 'I secured a full rehearsal and helped rebuild a scene that had been planned without me.', impact: { quality: 9, reputation: 4, relationship: -5, stress: 5 } },
      { id: 'adapt', label: 'Adapt intelligently to the agreed blocking', result: 'You make the existing plan work and keep the production moving. Your co-star appreciates the flexibility, though some of the character’s interpretation remains somebody else’s furniture.', journal: 'I adapted to an existing rehearsal plan and kept the production on schedule.', impact: { quality: 3, relationship: 8, opportunity: 3, reputation: -2 } },
      { id: 'counter', label: 'Arrive with a radically different interpretation', result: 'The first take jolts everyone awake. It gives the scene an interesting instability, and your co-star an excellent new reason to request rehearsal rules in writing.', journal: 'I challenged a closed rehearsal process with a different interpretation of my character.', impact: { quality: 7, publicity: 4, relationship: -12, stress: 6 } },
    ],
  },
  {
    id: 'actor-comeback-label', title: 'Back from where, exactly?', contact: 'agent', phase: 'between', requiresAgency: true, minCredits: 2,
    body: '{contact} suggests pitching your next move as a comeback. The proposed biography makes your recent career sound as though rescuers found it under a collapsed bridge. It would give casting offices a clear story to tell about hiring you.',
    choices: [
      { id: 'embrace', label: 'Use the comeback story to reopen conversations', result: 'The pitch gives your agent a reason to call people again. It also invites questions about failure you would rather have left in the footnotes.', journal: 'I used a comeback narrative to reopen casting conversations and accepted the scrutiny that came with it.', impact: { opportunity: 12, publicity: 7, reputation: -3, stress: 5, agencyRisk: -1 } },
      { id: 'specific', label: 'Reframe it around the work you want to make next', result: 'The new pitch is quieter and more precise. Fewer people forward it as gossip; the people who do respond have a better idea of what they might hire you for.', journal: 'I built a practical career pitch around my next direction rather than a dramatic comeback label.', impact: { opportunity: 7, reputation: 7, relationship: 4, publicity: -3 } },
      { id: 'reject', label: 'Reject the label and approach casting offices independently', result: 'You keep control of your story and take on more of the search yourself. Your agent loses enthusiasm, while a few casting offices appreciate an application that reads like an application.', journal: 'I rejected a manufactured comeback story and took a more independent approach to finding work.', impact: { reputation: 5, opportunity: 4, relationship: -9, agencyRisk: 1, stress: 3 } },
    ],
  },
];

/** Optional action-triggered incidents use the same immediate-resolution contract. */
export const actorActionStories: readonly CreativeStory[] = [
  {
    id: 'actor-action-readthrough', title: 'The read-through has an audience', contact: 'costar', phase: 'working',
    body: 'A routine read-through is being recorded for the production team. {contact} suggests treating it as a rehearsal; the producer has already opened a notebook with the enthusiasm of someone who might mistake a first attempt for a final answer.',
    choices: [
      { id: 'polished', label: 'Give a controlled version of the performance', result: 'The recording is strong enough to reassure the team. You learn less from the rehearsal than you might have, but there is now a clear professional performance on the record.', journal: 'I gave a controlled read-through and strengthened confidence in the production.', impact: { quality: 5, reputation: 4, relationship: -2 } },
      { id: 'explore', label: 'Use the session to test a difficult interpretation', result: 'Some of the experiment fails in front of the people paying for it. The useful parts improve the eventual performance, and your co-star appreciates having something alive to respond to.', journal: 'I used a recorded read-through to test an interpretation and improve the eventual performance.', impact: { quality: 8, relationship: 6, reputation: -4, stress: 4 } },
      { id: 'pair', label: 'Rehearse the hardest section privately with your co-star first', result: 'The private work makes the public read-through more convincing. It costs additional preparation time, and gives both of you a scene that feels shared rather than merely scheduled.', journal: 'I prepared the hardest scene privately with my co-star before a recorded read-through.', impact: { quality: 6, relationship: 8, stress: 5, publicity: -2 } },
    ],
  },
  {
    id: 'actor-action-interview', title: 'The question after the question', contact: 'director', phase: 'working',
    body: 'During a publicity session, an interviewer asks whether {contact} actually knows what the production is about. The microphone is close enough to record the moment you decide what sort of professional you want to be.',
    choices: [
      { id: 'defend', label: 'Explain the director’s approach generously', result: 'You give the interviewer a useful answer instead of a feud. The director hears about it and recognises that you understood the intention behind the work.', journal: 'I defended the production’s direction during a difficult publicity interview.', impact: { relationship: 9, reputation: 5, publicity: -2 } },
      { id: 'honest', label: 'Describe your disagreement honestly and specifically', result: 'The answer is thoughtful enough to resist the shortest headline, though somebody writes it anyway. You gain respect for explaining the work and a strained conversation with the director.', journal: 'I discussed a creative disagreement honestly during publicity and accepted the professional fallout.', impact: { reputation: 7, publicity: 5, relationship: -8, opportunity: 2 } },
      { id: 'tease', label: 'Turn the question into a mischievous invitation to watch', result: 'You promise that the audience can decide for itself. The clip makes the production sound intriguing, and the director is relieved that you have found a way to be interesting without starting a tribunal.', journal: 'I turned a provocative publicity question into interest in the production.', impact: { publicity: 9, relationship: 3, reputation: 2, stress: 3 } },
    ],
  },
];
