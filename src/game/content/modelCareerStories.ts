import type { CreativeStory } from './creativeStories';

/** Fashion work is about authorship, contracts and professional relationships, not body perfection. */
export const modelCareerStories: readonly CreativeStory[] = [
  {
    id: 'model-cut-thread', title: 'One Very Convenient Loose Thread', contact: 'rival', phase: 'working',
    body: 'A seam opens during the final fitting for {project}. {contact} is holding the emergency sewing kit and an expression usually found on children beside broken vases. There is time to fix the look, confront them, or make the damage part of the presentation.',
    choices: [
      { id: 'repair', label: 'Pay the wardrobe team for a proper repair', result: 'The wardrobe team saves the look. You thank them by name instead of pretending the fabric obeyed your aura. The work improves; the repair is a real expense.', journal: 'I paid for an urgent wardrobe repair and credited the people who rescued the look.', impact: { costBps: 35, quality: 7, reputation: 3, relationship: -2 } },
      { id: 'confront', label: 'Ask the rival to explain it in front of the team', result: 'Their explanation contains three different timelines. You recover some professional standing, but rehearsing the argument has stolen time from rehearsing the job.', journal: 'I confronted a rival over a suspicious wardrobe accident in front of the team.', impact: { reputation: 6, quality: -3, relationship: -12, stress: 4 } },
      { id: 'adapt', label: 'Turn the damaged look into a deliberate creative choice', result: 'You present the torn detail as a study in unfinished luxury. The designer calls it brave, which is the industry word for nobody agreeing yet. The stronger creative identity comes with a less polished performance.', journal: 'I incorporated a wardrobe accident into the presentation instead of hiding it.', impact: { portfolio: 6, publicity: 5, quality: -2, opportunity: 3 } },
    ],
  },
  {
    id: 'model-clear-the-calendar', title: 'Their Brand, Your Entire Calendar', contact: 'designer', phase: 'working',
    body: '{contact} brings a client proposal for {project}: a stronger fee if you reserve the rest of your current commitment for their brand. They want fewer competing appearances and more control over your availability. Their email uses the phrase “a family”, immediately above the restrictions.',
    choices: [
      { id: 'exclusive', label: 'Accept the higher fee and tighter obligations', result: 'The remaining work now pays more, and the client has firmer claims on your time. Your next opportunity will have to fit around the promise you actually made.', journal: 'I accepted a better-paid amendment with tighter brand obligations.', impact: { payBps: 1200, obligation: 2, opportunity: -5, relationship: 6 } },
      { id: 'limited', label: 'Trade part of the increase for narrower obligations', result: 'You agree to a smaller increase and keep some room for other work. The client crosses out “family” and sends a perfectly serviceable contract.', journal: 'I negotiated a limited brand amendment instead of handing over my whole calendar.', impact: { payBps: 450, obligation: 1, reputation: 3, relationship: 2 } },
      { id: 'decline', label: 'Keep the original terms and your independence', result: 'The original fee remains. The client is disappointed to discover that hiring your work did not include owning your next six conversations.', journal: 'I kept my original contract rather than accept a broad availability restriction.', impact: { reputation: 4, opportunity: 5, relationship: -7, publicity: -2 } },
    ],
  },
  {
    id: 'model-authorised-by-nobody', title: 'Apparently You Approved This', contact: 'agent', phase: 'working',
    body: '{contact} circulates a cheap additional-use proposal for {project} with “model approved” beside your name. You have approved a sandwich today. Nothing else. The client wants an answer before the extra photographs are used.',
    choices: [
      { id: 'correct', label: 'Correct the record and renegotiate the extra work', result: 'You send a polite correction with the original terms attached. The remaining contracted work gets a modest fee improvement; the representative learns that your inbox has a search function.', journal: 'I corrected an unauthorised usage proposal and negotiated the remaining work properly.', impact: { payBps: 600, relationship: -8, reputation: 5, stress: 2 } },
      { id: 'refuse', label: 'Refuse the proposal and end that representation', result: 'The additional proposal is withdrawn. You retain your current work under its existing terms and stop letting that representative speak for you. Finding the next opening becomes your problem.', journal: 'I refused unauthorised terms and ended my representation.', impact: { leaveAgency: true, reputation: 5, opportunity: -6, relationship: -15 } },
      { id: 'repair', label: 'Accept a small amendment in exchange for better future representation terms', result: 'You agree to limited extra cooperation rather than unlimited image use. The representative accepts a lower future commission to keep the relationship. Nobody gets to call the first email consent.', journal: 'I settled an unauthorised proposal with clearer limits and a lower future representation commission.', impact: { payBps: 150, commissionBps: -150, relationship: 3, agencyRisk: 1 } },
    ],
  },
  {
    id: 'model-fastening-time', title: 'The Fastener Has Other Plans', contact: 'designer', phase: 'working',
    body: 'Moments before the public presentation for {project}, a fastening gives up. {contact} is staring at it as though betrayal can be disciplined. A replacement look exists, but it is not the look you rehearsed.',
    choices: [
      { id: 'replace', label: 'Switch looks and take a little more preparation time', result: 'You request the replacement and walk through its movement with the team. The interruption costs some exposure, but the finished work looks intentional.', journal: 'I switched to a reliable replacement look and prepared it with the designer.', impact: { quality: 8, publicity: -3, relationship: 5, stress: 2 } },
      { id: 'secure', label: 'Fund an urgent professional alteration', result: 'A wardrobe specialist secures the original look. You pay for the rush instead of asking someone to perform unpaid heroics beneath a folding table.', journal: 'I paid for a professional last-minute alteration so the original presentation could continue.', impact: { costBps: 45, quality: 10, reputation: 3, health: -1 } },
      { id: 'reframe', label: 'Propose a simpler presentation without the unreliable piece', result: 'You remove the troublesome detail and explain the change openly. The client loses some spectacle and gains a model who can make a practical creative decision under pressure.', journal: 'I proposed a simpler presentation after a fastening failed.', impact: { portfolio: 5, reputation: 5, quality: 2, relationship: -3 } },
    ],
  },
  {
    id: 'model-portfolio-roast', title: 'A Review Nobody Ordered', contact: 'designer', phase: 'any',
    body: '{contact} calls your portfolio “commercially serviceable” in a public discussion, pronouncing both words as if they have been found in a drain. People are watching for your response.',
    choices: [
      { id: 'answer-work', label: 'Commission a focused test shoot that answers the criticism', result: 'You spend money on a specific creative gap instead of buying a general promise to become iconic. The new portfolio work gives future clients something concrete to judge.', journal: 'I answered a public portfolio criticism with a focused professional test shoot.', impact: { costBps: 110, portfolio: 9, opportunity: 4, relationship: -2 } },
      { id: 'own-commercial', label: 'Defend commercial craft without apologising for paying the bills', result: 'You explain what reliable advertising work actually demands. Some industry prestige drifts away, but clients who need a professional remember the answer.', journal: 'I defended my commercial modelling work rather than treating useful work as an embarrassment.', impact: { reputation: 5, publicity: 4, opportunity: 5, relationship: -8 } },
      { id: 'ask-notes', label: 'Invite the designer to give specific, private feedback', result: 'Away from the audience, the designer produces two useful observations and one opinion about chairs. You keep the useful parts and the contact improves.', journal: 'I turned a public portfolio insult into specific private feedback.', impact: { portfolio: 5, relationship: 9, stress: -2, publicity: -3 } },
    ],
  },
  {
    id: 'model-campaign-backlash', title: 'The Brief Meets the Internet', contact: 'designer', phase: 'working',
    body: 'A preview of {project} is criticised for borrowing an image without understanding its context. {contact} passes on the client’s request that everyone post the same cheerful sentence. Your name is already in the comments.',
    choices: [
      { id: 'change-brief', label: 'Push for a corrected creative brief and a clear explanation', result: 'The client agrees to revise the remaining work. You lose some immediate publicity and gain a less indefensible portfolio piece. The designer would have preferred a smaller meeting.', journal: 'I pressed for a corrected campaign brief after criticism of its imagery.', impact: { publicImage: 8, quality: 5, publicity: -5, relationship: -5, obligation: 1 } },
      { id: 'statement', label: 'Publish a factual account of your involvement', result: 'You explain what you did, what you were told and what you are asking to change. The statement earns attention and strains the client relationship without pretending you controlled every decision.', journal: 'I gave a factual public account of my role in a criticised campaign.', impact: { publicImage: 5, publicity: 8, reputation: 2, relationship: -10 } },
      { id: 'client-line', label: 'Use the client’s statement and concentrate on delivery', result: 'The client appreciates the cooperation and improves the remaining fee. Your public image pays for the smoother commercial relationship.', journal: 'I followed the client’s response during a controversial campaign.', impact: { payBps: 400, relationship: 7, publicImage: -9, reputation: -3 } },
    ],
  },
  {
    id: 'model-unknown-collection', title: 'The Collection in the Kitchen', contact: 'designer', phase: 'between',
    body: '{contact} introduces an emerging collection in a kitchen because that is where the only good light is. The clothes are inventive. The launch budget could fit inside a sensible shoe.',
    choices: [
      { id: 'collaborate', label: 'Fund a small, properly agreed collaborative shoot', result: 'You pay for a modest shoot with clear image-use terms. The collaboration adds a distinctive portfolio piece and an ally, without inventing a fee the designer cannot pay.', journal: 'I funded a small, written-agreement collaboration with an emerging designer.', impact: { costBps: 90, portfolio: 10, relationship: 10, opportunity: 4 } },
      { id: 'introduce', label: 'Introduce the designer to your professional contacts', result: 'You make a careful introduction instead of guaranteeing success. Your contacts notice useful judgement; the designer gets a door to knock on rather than a promise you cannot honour.', journal: 'I introduced an emerging designer to suitable professional contacts.', impact: { reputation: 5, relationship: 7, opportunity: 5, publicity: -2 } },
      { id: 'commercial', label: 'Decline and reserve your time for paid commercial work', result: 'You wish them luck and keep your budget intact. The next commercial pitch benefits from your attention; the designer will remember that luck was the whole contribution.', journal: 'I declined a speculative fashion collaboration to focus on paid commercial opportunities.', impact: { opportunity: 7, portfolio: -2, relationship: -7, stress: -2 } },
    ],
  },
  {
    id: 'model-cover-escapes', minCredits: 1, categories: ['editorial'], title: 'The Cover Escapes Its Magazine', contact: 'photographer', phase: 'working',
    body: 'A portrait from {project} is picked up by a small magazine and suddenly shared far beyond its usual readers. {contact} wants the next image to be stranger. A commercial client wants it to be much more normal.',
    choices: [
      { id: 'editorial', label: 'Build on the original editorial idea', result: 'You support the photographer’s next experiment. The work becomes more distinctive, though it gives some ordinary advertisers a perfectly ordinary fright.', journal: 'I developed an unexpectedly popular portrait into a more ambitious editorial direction.', impact: { portfolio: 9, publicity: 6, relationship: 6, opportunity: -2 } },
      { id: 'commercial', label: 'Make the follow-up accessible to commercial clients', result: 'The follow-up is easy to pitch and easy to understand. Future commercial opportunities improve; the photographer files your phrase “broader appeal” under personal injuries.', journal: 'I steered a popular portrait’s follow-up toward commercial work.', impact: { opportunity: 9, publicity: 4, portfolio: 2, relationship: -6 } },
      { id: 'protect-rights', label: 'Pay for a careful rights and credit review first', result: 'You establish who may use the pictures and how everyone is credited. Some momentum passes while you read, but the portfolio grows on terms you can actually defend.', journal: 'I paid to clarify image rights and credits after a portrait unexpectedly spread.', impact: { costBps: 55, reputation: 6, portfolio: 5, publicity: -4 } },
    ],
  },
  {
    id: 'model-poaching-letter', title: 'You Have Always Been Our First Choice', contact: 'agent', phase: 'any',
    body: '{contact} forwards an approach from a competing representative who claims to have followed your career for years. Their message still contains “[insert admired campaign]”. They offer introductions if you make a clean break with your present arrangements.',
    choices: [
      { id: 'leverage', label: 'Use the approach to negotiate your future commission', result: 'You ask for better terms without promising a move. Your current professional network gives a little ground and becomes a little less warm.', journal: 'I used a competing representation approach to negotiate a lower future commission.', impact: { commissionBps: -150, relationship: -6, agencyRisk: 1, reputation: 2 } },
      { id: 'independent', label: 'Leave representation and rebuild on your own terms', result: 'You decline to trade one sweeping promise for another. Independence keeps future commission out of your earnings, but access to the next opening is harder work.', journal: 'I became independent after competing representatives tried to recruit me.', impact: { leaveAgency: true, opportunity: -7, reputation: 4, stress: 3 } },
      { id: 'stay', label: 'Stay and ask for a concrete introduction instead of a speech', result: 'You put the poaching letter aside and ask your own contact for an actual meeting. The relationship improves, and so does your position for the next booking.', journal: 'I stayed with my professional network and asked for a concrete new introduction.', impact: { relationship: 9, opportunity: 6, commissionBps: 50, stress: -2 } },
    ],
  },
  {
    id: 'model-deal-before-ink', title: 'The Deal Before the Ink', contact: 'agent', phase: 'between',
    body: 'A promising brand pitch that {contact} helped develop collapses before anyone signs. The client has “reallocated its ambition”. Your representative wants to announce that you walked away, which would be tidier than the truth.',
    choices: [
      { id: 'honest', label: 'Keep the explanation factual and reuse the work in your portfolio', result: 'You explain that the proposal did not become a contract. With permission, the useful development work becomes a portfolio update. No fee is claimed for a job that never existed.', journal: 'I handled a collapsed brand proposal honestly and salvaged permitted portfolio work.', impact: { reputation: 6, portfolio: 5, relationship: -3, publicity: -2 } },
      { id: 'replacement', label: 'Invest in a practical replacement pitch', result: 'You pay for a smaller presentation aimed at clients who still have budgets. It lacks the glamour of the lost proposal and has the considerable advantage of being usable.', journal: 'I funded a practical replacement pitch after a prospective brand deal collapsed.', impact: { costBps: 70, opportunity: 10, portfolio: 3, stress: 3 } },
      { id: 'spin', label: 'Let the representative describe it as your principled withdrawal', result: 'The story attracts attention and preserves the representative’s pride. Industry contacts who know the timeline become less certain they can trust yours.', journal: 'I allowed a failed brand proposal to be presented as a deliberate withdrawal.', impact: { publicity: 9, relationship: 7, reputation: -7, agencyRisk: 1 } },
    ],
  },
  {
    id: 'model-buyout-page', title: 'The Paragraph That Owns Everything', contact: 'agent', phase: 'working',
    body: '{contact} sends a proposed amendment to {project}: more money for broader image use during the remaining work. The paragraph is short enough to look harmless and broad enough to include a billboard on the moon.',
    choices: [
      { id: 'buyout', label: 'Accept the broader usage and the higher contracted fee', result: 'The remaining fee rises. Your cooperation obligations become stricter, and some future opportunities become harder to fit around the enlarged agreement.', journal: 'I accepted a better-paid amendment with broader image-use obligations.', impact: { payBps: 1000, obligation: 2, opportunity: -6, relationship: 5 } },
      { id: 'narrow', label: 'Pay to narrow the usage wording before agreeing', result: 'A professional review turns the moon billboard into a defined set of uses. You pay the review cost and secure a smaller improvement to the remaining fee.', journal: 'I paid for a limited image-use amendment instead of accepting an unrestricted buyout.', impact: { costBps: 65, payBps: 300, reputation: 5, obligation: 1 } },
      { id: 'original', label: 'Keep the original agreement', result: 'The amendment goes back unsigned. You keep the original fee and more room for later work; the client must find another way to colonise the moon.', journal: 'I declined a broad image-use amendment and kept my original agreement.', impact: { opportunity: 5, reputation: 3, relationship: -5, publicity: -2 } },
    ],
  },
  {
    id: 'model-plastic-portrait', title: 'They Have Retouched Your Elbows Into Fiction', contact: 'photographer', phase: 'working',
    body: 'The first edited images from {project} look less like a person and more like a household appliance with excellent lighting. {contact} says the client asked for “timeless”. You would like to retain the decade in which elbows existed.',
    choices: [
      { id: 'natural', label: 'Ask for an edit that keeps the actual creative work visible', result: 'The photographer restores texture, movement and the original expression. Some client enthusiasm cools; your portfolio gains work you can explain without diagrams.', journal: 'I requested an honest edit that preserved the creative work in the photographs.', impact: { portfolio: 8, quality: 6, publicImage: 4, relationship: 3 } },
      { id: 'client', label: 'Accept the client’s polished commercial style', result: 'The client is delighted by an image that has never once waited for a bus. You deliver their brief efficiently and sacrifice a little distinctiveness.', journal: 'I accepted a heavily polished commercial edit to deliver the client’s brief.', impact: { opportunity: 7, quality: 3, portfolio: -3, publicity: 4 } },
      { id: 'two-cuts', label: 'Fund a separate, approved portfolio cut', result: 'You pay for an additional edit with clear permission to use it. The client receives their version and your portfolio retains a version with recognisable joints.', journal: 'I paid for a permitted portfolio edit alongside the client’s commercial images.', impact: { costBps: 50, portfolio: 9, reputation: 3, relationship: 5 } },
    ],
  },
  {
    id: 'model-location-budget', title: 'Luxury, Economy Class', contact: 'designer', phase: 'working',
    body: '{contact} relays a proposal for {project}: a grander location, but the client expects you to absorb the extra preparation and travel cost. The mood board includes a private jet. The reimbursement email includes a bus timetable.',
    choices: [
      { id: 'invest', label: 'Pay the reviewed cost to make the stronger location work', result: 'You fund the agreed extra preparation. The work gains polish and a stronger portfolio setting; the invoice remains yours rather than becoming imaginary exposure income.', journal: 'I paid agreed additional preparation costs for a stronger campaign location.', impact: { costBps: 95, quality: 8, portfolio: 6, relationship: 4 } },
      { id: 'local', label: 'Propose a convincing local alternative', result: 'You help find a local setting that serves the brief. It is less extravagant and more practical. The designer respects the judgement, even while mourning the private-jet photograph.', journal: 'I proposed a practical local alternative to an unfunded campaign location.', impact: { reputation: 6, quality: 4, publicity: -3, relationship: 5 } },
      { id: 'terms', label: 'Require a better remaining fee before accepting the extra obligations', result: 'You secure a modest increase for the additional work. The client agrees, with the warmth of a hotel minibar bill.', journal: 'I negotiated a fee amendment before accepting extra location obligations.', impact: { payBps: 550, obligation: 1, relationship: -6, stress: 3 } },
    ],
  },
  {
    id: 'model-boundary-meeting', title: 'The Meeting After the Meeting', contact: 'photographer', phase: 'any',
    body: '{contact} suggests a late private meeting to discuss “career chemistry”. You ask whether the agenda could survive being sent by email. Suddenly there appears to be no agenda.',
    choices: [
      { id: 'formal', label: 'Insist on a normal professional meeting with a written brief', result: 'The meeting returns to working hours and useful subjects. The photographer is less friendly; your professional boundaries become considerably easier to understand.', journal: 'I insisted on a written brief and normal professional meeting arrangements.', impact: { reputation: 7, relationship: -8, opportunity: 2, stress: -2 } },
      { id: 'report', label: 'Raise the conduct with the professional network', result: 'You record what happened and make a factual complaint. Some immediate opportunities cool, while other colleagues become more willing to work with you.', journal: 'I raised an inappropriate professional approach through the industry network.', impact: { publicImage: 7, reputation: 5, relationship: -15, opportunity: -4 } },
      { id: 'replace', label: 'Pay for a different collaborator and move the work on', result: 'You spend money on a professional alternative. The portfolio work improves and the old photographer loses access to your time.', journal: 'I paid for a different collaborator after an unprofessional approach.', impact: { costBps: 75, portfolio: 7, relationship: -10, opportunity: 4 } },
    ],
  },
  {
    id: 'model-missing-credit', title: 'An Entire Person Omitted for Space', contact: 'photographer', phase: 'working',
    body: 'A preview of {project} credits {contact}, the stylist, the florist and a chair supplier. Your name has apparently exceeded the available space. The chair receives two lines.',
    choices: [
      { id: 'private', label: 'Ask the photographer to secure a corrected credit', result: 'The corrected credit appears without a public argument. You gain a useful portfolio reference and the photographer appreciates a direct conversation.', journal: 'I secured a corrected modelling credit through a private professional request.', impact: { portfolio: 5, reputation: 3, relationship: 7, publicity: 2 } },
      { id: 'public', label: 'Credit the whole team publicly, including yourself', result: 'Your complete team list becomes more widely shared than the original preview. The missing name is noticed, along with your capacity to make a point politely and very visibly.', journal: 'I published a full team credit after my name was omitted from campaign material.', impact: { publicity: 8, publicImage: 4, relationship: -6, portfolio: 3 } },
      { id: 'terms', label: 'Tie future cooperation to a clearer credit clause', result: 'You keep the present dispute small and demand a concrete future condition. The representative accepts firmer obligations, though the current preview remains less useful to your portfolio.', journal: 'I negotiated a clearer credit condition for future cooperation.', impact: { reputation: 6, opportunity: 4, obligation: -1, relationship: -3 } },
    ],
  },
  {
    id: 'model-competing-colours', title: 'Apparently Beige Is Exclusive', contact: 'agent', phase: 'working',
    body: '{contact} brings a client proposal interpreting your current availability obligations on {project} broadly enough to discourage even a future conversation with a rival brand. Your representative says the disputed categories include “beige-adjacent lifestyle”.',
    choices: [
      { id: 'honour', label: 'Accept the stricter interpretation for a fee improvement', result: 'The remaining fee improves and your future options narrow. Beige-adjacent lifestyle has acquired an effective legal department.', journal: 'I accepted stricter brand cooperation obligations in return for a higher remaining fee.', impact: { payBps: 650, obligation: 2, opportunity: -7, relationship: 7 } },
      { id: 'clarify', label: 'Pay to define exactly which restrictions apply', result: 'A proper review separates real promises from ambitious emails. You pay the cost and recover some freedom without pretending existing obligations disappear.', journal: 'I paid to clarify the limits of a client’s competing-brand restrictions.', impact: { costBps: 70, obligation: -1, reputation: 5, relationship: -4 } },
      { id: 'challenge', label: 'Reject the new demand and cultivate different future clients', result: 'You keep the original agreement and refuse the expanded demand. The present client dislikes the answer; future clients hear that you read before agreeing.', journal: 'I refused an expanded competing-brand demand while retaining my original obligations.', impact: { opportunity: 8, reputation: 3, relationship: -10, agencyRisk: 1 } },
    ],
  },
  {
    id: 'model-more-than-one-season', title: 'The Image They Want Forever', contact: 'designer', phase: 'working',
    body: '{contact} says the client likes a test image from {project} so much that they ask for more planned uses during the remaining contract. They call it timeless. You call it additional scope.',
    choices: [
      { id: 'paid-scope', label: 'Negotiate a better remaining fee for defined additional work', result: 'The amendment records the extra cooperation and improves future contracted pay. Nobody books imaginary royalties against an imaginary worldwide sales figure.', journal: 'I negotiated a paid, defined amendment for additional campaign scope.', impact: { payBps: 850, obligation: 1, reputation: 4, relationship: 2 } },
      { id: 'portfolio-scope', label: 'Trade a smaller increase for stronger portfolio rights', result: 'You accept a smaller fee improvement and clearer permission to show the work. The portfolio becomes more useful to future clients.', journal: 'I traded part of a campaign amendment’s fee increase for stronger portfolio use.', impact: { payBps: 250, portfolio: 8, opportunity: 4, relationship: 4 } },
      { id: 'original-scope', label: 'Finish the original brief without expanding it', result: 'You keep the existing commitment manageable. The client must purchase its timelessness elsewhere, and your work receives your full attention.', journal: 'I kept a campaign within its original agreed scope.', impact: { quality: 7, stress: -3, relationship: -5, opportunity: 2 } },
    ],
  },
  {
    id: 'model-collective-letter', title: 'Everyone Was Waiting for Everyone Else', contact: 'rival', phase: 'any',
    body: '{contact} asks you to sign a factual joint letter about unpaid preparation expectations. They say it would mean more coming from you. This is the nicest thing they have said while requiring something.',
    choices: [
      { id: 'sign', label: 'Sign and help organise the practical demands', result: 'You help turn complaints into specific working conditions. Some contacts become cautious; the rival begins behaving like a colleague with occasional dramatic pauses.', journal: 'I worked with a professional rival on a joint request for fair preparation terms.', impact: { reputation: 7, relationship: 12, publicImage: 5, opportunity: -3 } },
      { id: 'private-help', label: 'Offer private help without becoming the public face', result: 'You help edit the terms and introduce a useful contact. The campaign gains practical support, although your rival notices the careful distance.', journal: 'I supported a professional working-conditions letter privately.', impact: { reputation: 4, relationship: 4, opportunity: 3, publicity: -3 } },
      { id: 'decline', label: 'Decline and concentrate on your own clients', result: 'You avoid the public dispute and preserve some commercial access. Your rival stops mistaking occasional agreement for solidarity.', journal: 'I declined to join a collective request over preparation terms.', impact: { opportunity: 7, relationship: -12, publicImage: -5, stress: -2 } },
    ],
  },
  {
    id: 'model-archive-room', minCredits: 1, title: 'Prestige With No Catering Budget', contact: 'photographer', phase: 'between',
    body: '{contact} forwards an invitation from a small exhibition to feature a new collaborative portrait alongside work from your portfolio. The curator has excellent ideas and a catering budget consisting of optimism.',
    choices: [
      { id: 'exhibit', label: 'Pay for a modest exhibition-quality collaboration', result: 'You agree clear image rights and fund the limited production. The work earns professional attention rather than pretending exhibition prestige is a wage.', journal: 'I funded a small exhibition collaboration to develop my editorial portfolio.', impact: { costBps: 100, portfolio: 10, reputation: 6, opportunity: 2 } },
      { id: 'existing', label: 'Offer approved existing work instead of funding a new shoot', result: 'The exhibition receives useful work and you keep the budget intact. The photographer appreciates the practical answer, though the portfolio gains less new material.', journal: 'I contributed approved existing work to an exhibition without commissioning a new shoot.', impact: { portfolio: 3, relationship: 6, reputation: 4, publicity: 2 } },
      { id: 'commercial-pitch', label: 'Use the invitation to pitch a paying commercial client', result: 'You turn the attention into a commercial presentation. It opens different doors and disappoints people who believed you had finally developed an allergy to advertising.', journal: 'I used an exhibition invitation to develop a commercial client pitch.', impact: { opportunity: 9, publicity: 3, relationship: -6, reputation: -2 } },
    ],
  },
  {
    id: 'model-comeback-table', minCredits: 1, title: 'Your Comeback Has Folding Chairs', contact: 'designer', phase: 'between',
    body: 'After a quiet patch, {contact} invites you to a small industry showcase. There is no grand comeback announcement, just a fitting room, a workable concept and chairs that make hostile noises.',
    choices: [
      { id: 'craft', label: 'Put a reviewed budget into a distinctive presentation', result: 'You spend carefully on preparation and produce work people can discuss. The chairs remain terrible; your portfolio becomes a better argument for the next booking.', journal: 'I invested in a small industry showcase to rebuild my portfolio and standing.', impact: { costBps: 85, portfolio: 9, reputation: 7, opportunity: 5 } },
      { id: 'network', label: 'Make the showcase about reconnecting with reliable professionals', result: 'You arrive prepared and spend the spare time rebuilding useful relationships. There is less spectacle and more prospect of someone answering the next email.', journal: 'I used a modest showcase to rebuild professional relationships and future access.', impact: { relationship: 10, opportunity: 8, reputation: 3, publicity: -2 } },
      { id: 'grand-return', label: 'Promote it as a major return to the industry', result: 'The announcement attracts attention and raises expectations beyond the folding-chair budget. Some future opportunities improve, while established contacts become wary of the performance around the performance.', journal: 'I promoted a small showcase as a major modelling comeback.', impact: { publicity: 10, opportunity: 5, reputation: -5, relationship: -4 } },
    ],
  },
  {
    id: 'model-representation-review', requiresAgency: true, title: 'The Encouraging Termination Email', contact: 'agent', phase: 'any',
    body: '{contact} says your recent prospects no longer fit their representation plans. The message ends with four exclamation marks, because apparently professional disappointment needs confetti. You can negotiate, ask for a practical introduction, or make a clean independent start.',
    choices: [
      { id: 'probation', label: 'Offer a concrete improvement plan and accept tougher future terms', result: 'The representative agrees to keep working with you on less generous future commission terms. You retain access, but the relationship now has measurable expectations instead of reassuring adjectives.', journal: 'I kept a representation relationship by agreeing a practical improvement plan and tougher future terms.', impact: { commissionBps: 200, agencyRisk: -2, opportunity: 4, relationship: 3 } },
      { id: 'referral', label: 'Accept the break and ask for a useful professional referral', result: 'You leave without a public feud and obtain a practical introduction. The representation ends; your reputation survives the departure better than your immediate access does.', journal: 'I accepted the end of representation and asked for a professional referral.', impact: { leaveAgency: true, reputation: 6, opportunity: -2, relationship: 4 } },
      { id: 'clean-break', label: 'End the arrangement and invest in your own presentation', result: 'You pay for a focused independent presentation. The old relationship ends badly, but your next pitch belongs to you rather than to someone politely managing your exit.', journal: 'I ended an unhelpful representation relationship and funded an independent portfolio presentation.', impact: { leaveAgency: true, costBps: 80, portfolio: 8, opportunity: 3, relationship: -12 } },
    ],
  },
  {
    id: 'model-assistant-credit', title: 'The Person Behind the Famous Person', contact: 'photographer', phase: 'working',
    body: 'An assistant quietly fixes the lighting and saves a shoot for {project}. {contact} is preparing a post about instinct. You have a clear view of whose instinct involved carrying three heavy lamps.',
    choices: [
      { id: 'credit', label: 'Make sure the assistant receives an accurate public credit', result: 'The assistant’s contribution is recorded. Your professional standing improves with the team, while the photographer becomes less certain that you understand how celebrity works.', journal: 'I ensured an assistant received public credit for work that saved a shoot.', impact: { reputation: 7, publicImage: 4, relationship: -6, portfolio: 3 } },
      { id: 'support', label: 'Pay for some additional team preparation and thank them privately', result: 'You contribute to the practical work rather than the myth. The shoot improves and the photographer remains cooperative, although the public credit still centres the famous name.', journal: 'I funded additional team preparation and privately recognised an assistant’s contribution.', impact: { costBps: 40, quality: 8, relationship: 4, reputation: 2 } },
      { id: 'legend', label: 'Keep the celebrated photographer’s version of events', result: 'The photographer appreciates your discretion and opens another professional door. People who actually carried the lamps become less impressed by your judgement.', journal: 'I backed a photographer’s polished account of a shoot instead of challenging its missing credit.', impact: { relationship: 9, opportunity: 5, reputation: -6, publicImage: -3 } },
    ],
  },
  {
    id: 'model-weather-brief', title: 'The Forecast Was Not in the Mood Board', contact: 'photographer', phase: 'working',
    body: 'The outdoor shoot for {project} meets weather that has not read the creative brief. The client wants the original sunny concept. {contact} sees a much better picture in the rain, along with several expensive electrical problems.',
    choices: [
      { id: 'safe-rain', label: 'Fund safe equipment cover and develop the rainy concept', result: 'The team protects the equipment and changes the visual idea. You pay the reviewed extra cost and produce more distinctive work without asking anyone to gamble with safety.', journal: 'I funded safe weather preparation and helped develop a new concept for a rainy shoot.', impact: { costBps: 65, portfolio: 8, quality: 6, relationship: 5 } },
      { id: 'indoor', label: 'Move to a practical indoor version of the original brief', result: 'The client gets an understandable campaign and the team keeps its equipment dry. The work is less adventurous and reliably deliverable.', journal: 'I helped move a disrupted outdoor shoot to a practical indoor setting.', impact: { quality: 7, reputation: 5, publicity: -3, opportunity: 2 } },
      { id: 'amend', label: 'Negotiate reduced scope and protect the remaining fee', result: 'You document what can realistically be delivered and agree a modest fee reduction for less remaining work. It is less lucrative than the original plan and much clearer than pretending the weather is a breach of etiquette.', journal: 'I agreed a smaller, documented scope after weather disrupted a shoot.', impact: { payBps: -350, obligation: -1, stress: -5, reputation: 4 } },
    ],
  },
  {
    id: 'model-pigeon-direction', title: 'An Uncredited Bird Enters the Industry', contact: 'designer', phase: 'working',
    body: 'A pigeon lands during the presentation for {project}, inspects the collection and refuses to leave. {contact} thinks it ruins the concept. Half the room thinks it is the concept. Your rival has already photographed it.',
    choices: [
      { id: 'pause', label: 'Ask for a brief reset and finish the planned presentation', result: 'The team clears the space without turning the bird into a moral opponent. The work stays polished, though the most shareable moment belongs to someone with claws.', journal: 'I asked for a practical reset after a bird interrupted a fashion presentation.', impact: { quality: 7, reputation: 4, publicity: -4, relationship: 4 } },
      { id: 'improvise', label: 'Work the interruption into the presentation', result: 'You adapt without chasing the pigeon or demanding its professionalism. The presentation becomes memorable and less controlled. The designer admires it after checking the reaction.', journal: 'I improvised through a bird’s interruption of a fashion presentation.', impact: { publicity: 9, portfolio: 5, quality: -2, relationship: -2 } },
      { id: 'team-credit', label: 'Let the team handle the reset and credit their work openly', result: 'You keep the mood calm while the crew restores the presentation. The finished work benefits from better cooperation, and the public account includes the people who did the actual chasing.', journal: 'I supported and credited the crew during an unexpected presentation interruption.', impact: { reputation: 6, quality: 4, publicImage: 4, relationship: 6 } },
    ],
  },
  {
    id: 'model-silence-clause', title: 'The Approved Personality', contact: 'agent', phase: 'working',
    body: 'The client proposes tighter approval over public comments connected to {project}. {contact} calls this brand consistency. The first draft would require approval before describing a sandwich as disappointing.',
    choices: [
      { id: 'accept', label: 'Accept a defined approval obligation for a better fee', result: 'You accept more controlled campaign communications in exchange for improved remaining pay. Future publicity becomes harder to improvise, including sandwiches with campaign logos.', journal: 'I accepted defined campaign communication approvals for a higher remaining fee.', impact: { payBps: 700, obligation: 2, publicity: -4, relationship: 7 } },
      { id: 'narrow', label: 'Negotiate approvals limited to actual campaign statements', result: 'The clause becomes a workable professional obligation rather than a rented personality. The fee barely improves; your reputation for reading the details does.', journal: 'I narrowed a proposed communications clause to actual campaign statements.', impact: { payBps: 100, obligation: 1, reputation: 6, relationship: -3 } },
      { id: 'refuse', label: 'Refuse the amendment and keep the existing contract', result: 'You retain the original terms and your normal public voice. The representative must explain that the client hired modelling work rather than a fully supervised human weather report.', journal: 'I declined expanded control over my public comments while retaining the original agreement.', impact: { opportunity: 5, publicity: 4, relationship: -9, publicImage: 3 } },
    ],
  },
  {
    id: 'model-international-room', title: 'An Invitation With a Very Real Invoice', contact: 'agent', phase: 'between',
    body: '{contact} brings an invitation to a professional showcase with access to international clients. Attendance does not relocate you or guarantee a booking. It does require a properly funded presentation, and the organiser has placed the price above the word opportunity in unusually clear type.',
    choices: [
      { id: 'attend', label: 'Pay for a focused professional presentation', result: 'You fund the reviewed preparation and make a credible pitch. Internationally connected contacts can now assess the work; the invitation itself has paid no wages and promised no job.', journal: 'I paid for a focused presentation to internationally connected fashion clients.', impact: { costBps: 125, opportunity: 11, portfolio: 6, relationship: 4 } },
      { id: 'remote', label: 'Propose a smaller remote portfolio review', result: 'You pay less for a more limited review. It is less glamorous and still produces useful feedback and a professional introduction.', journal: 'I chose a modest remote portfolio review instead of an expensive showcase presentation.', impact: { costBps: 35, opportunity: 5, portfolio: 4, reputation: 3 } },
      { id: 'home', label: 'Decline and strengthen the work you can reliably deliver now', result: 'You keep the budget and focus on existing professional strengths. Local access improves, while the representative files away the international introduction for somebody else.', journal: 'I declined an expensive showcase invitation and focused on reliable current-market work.', impact: { opportunity: 6, reputation: 4, relationship: -5, stress: -3 } },
    ],
  },
];

/** Optional incidents for portfolio shoots and presentation preparation, separate from the annual story cadence. */
export const modelActionStories: readonly CreativeStory[] = [
  {
    id: 'model-action-lost-files', title: 'The Backup Was a Feeling', contact: 'photographer', phase: 'working',
    body: 'During preparation for {project}, {contact} discovers that the backup drive contains a folder called BACKUP and very little else. Some useful files can be recovered, or the team can rebuild the idea.',
    choices: [
      { id: 'recover', label: 'Pay for professional recovery of the usable files', result: 'The recoverable material returns and the portfolio work improves. You pay the reviewed recovery cost rather than accepting confidence as a storage medium.', journal: 'I paid to recover usable preparation files after a failed backup.', impact: { costBps: 45, portfolio: 7, quality: 4, relationship: -3 } },
      { id: 'rebuild', label: 'Rebuild a simpler concept with the available material', result: 'The team creates a leaner presentation. It is less elaborate and more coherent, which may be the nicest thing anyone has said about a failed hard drive.', journal: 'I rebuilt a practical concept after preparation files were lost.', impact: { quality: 5, reputation: 4, portfolio: 3, stress: 3 } },
      { id: 'replace', label: 'Reduce the deliverable and renegotiate the remaining scope', result: 'You document a smaller deliverable and a modest reduction in the remaining fee. The client gets a clear answer rather than a disappearing file followed by a disappearing model.', journal: 'I renegotiated a smaller documented scope after preparation files were lost.', impact: { payBps: -250, obligation: -1, reputation: 5, relationship: -5 } },
    ],
  },
  {
    id: 'model-action-double-brief', title: 'Two Briefs, One Model', contact: 'designer', phase: 'working',
    body: '{contact} and the client have sent different presentation instructions for {project}. Both are marked FINAL. One is marked FINAL_FINAL, which apparently makes it the constitutional authority.',
    choices: [
      { id: 'clarify', label: 'Pause preparation until both parties approve one brief', result: 'You secure one written brief. Preparation loses a little momentum, but the actual work gains a much better chance of satisfying the people paying for it.', journal: 'I secured a single approved brief before continuing presentation preparation.', impact: { quality: 7, reputation: 4, relationship: -3, publicity: -2 } },
      { id: 'prototype', label: 'Pay to prepare a small comparison of both directions', result: 'You fund a practical comparison and let the decision-makers choose from evidence. The portfolio benefits from the experiment, and the designer appreciates being understood.', journal: 'I paid for a small comparison to resolve contradictory creative briefs.', impact: { costBps: 40, portfolio: 6, quality: 5, relationship: 6 } },
      { id: 'client', label: 'Follow the client’s signed brief and document why', result: 'You deliver the agreed commercial direction. The designer is disappointed, but the client now knows that FINAL_FINAL does not silently amend a signed agreement.', journal: 'I followed the signed client brief and documented the conflicting instructions.', impact: { reputation: 5, opportunity: 5, relationship: -7, quality: 2 } },
    ],
  },
];
