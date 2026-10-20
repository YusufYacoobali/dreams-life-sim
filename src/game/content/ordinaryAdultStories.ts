import { situation as s } from './lifeSituation';

export const ordinaryAdultTemplates = [
  s('adult-wrong-name-badge', 'Apparently you are the expert', 'At a free community event, someone gives you a badge marked “Organiser”. A stranger immediately asks where the spare chairs are.', [
    ['correct', 'Explain the badge mix-up', { respect: 3, stress: -2 }, 'Authority returned', 'The actual organiser takes the question. You hand over the badge with a surprising amount of relief.', 'I corrected a mistaken badge before becoming responsible for a room.'],
    ['help', 'Help find chairs anyway', { happiness: 3, energy: -3 }, 'A short unofficial appointment', 'You find the chairs, then the organiser. Your entire term of office lasts seven minutes.', 'I helped at a community event after being mistaken for its organiser.'],
    ['invent', 'Point confidently at a cupboard', { respect: -3, stress: 3 }, 'Several mops, no chairs', 'Your instructions lead to a cleaning cupboard. The badge has not supplied any relevant knowledge.', 'I gave confident directions to chairs I had never seen.'],
  ], { rarity: 'uncommon' }),
  s('adult-wave-behind', 'A wave with another destination', 'Someone across the square waves enthusiastically. You wave back before noticing the person directly behind you carrying an enormous reunion balloon.', [
    ['laugh', 'Laugh and lower your hand', { happiness: 3, stress: -2 }, 'A brief public misunderstanding', 'The stranger smiles back. The balloon receives the reunion it was dressed for.', 'I survived waving at someone who was waving past me.'],
    ['commit', 'Give the balloon a wave too', { happiness: 5, respect: 1 }, 'Everyone is included', 'The balloon’s owner waves back. You have accidentally made the exchange less awkward.', 'I included a reunion balloon in an accidental greeting.'],
    ['freeze', 'Pretend you were stretching', { stress: 3, energy: -1 }, 'A highly specific stretch', 'You extend the performance longer than any sensible shoulder exercise requires.', 'I turned an accidental wave into an unconvincing stretch.'],
  ]),
  s('adult-free-lecture-question', 'Any final questions?', 'At the end of a public talk, the speaker asks for questions. The person beside you has been whispering that the explanation was completely wrong.', [
    ['ask', 'Ask about the disputed point', { smarts: 3, respect: 2 }, 'A useful distinction', 'The speaker explains what the claim does and does not cover. The whispering becomes interested listening.', 'I asked a specific question at a public talk.'],
    ['listen', 'Let someone else speak first', { smarts: 2, stress: -1 }, 'Another angle', 'Someone asks a question you had not considered. Listening turns out to be a contribution to your own understanding.', 'I listened to other questions before deciding what I thought.'],
    ['announce', 'Announce that everyone is wrong', { respect: -4, stress: 4 }, 'A statement, technically', 'The speaker asks which part you mean. You discover that volume was your only prepared detail.', 'I challenged a whole talk without preparing a specific objection.'],
  ]),
  s('adult-queue-merge', 'Two queues, one doorway', 'Two short queues reach the same narrow doorway. Both groups seem certain they arrived first. Neither has appointed a historian.', [
    ['alternate', 'Suggest taking alternate turns', { respect: 4, stress: -1 }, 'A workable treaty', 'People begin moving again. The debate loses its audience one person at a time.', 'I suggested alternating two queues at a narrow doorway.'],
    ['wait', 'Step back and let it settle', { discipline: 2, stress: -3 }, 'A little more waiting', 'You lose a few places and keep your calm. Eventually the doorway becomes a doorway again.', 'I waited out an argument about who reached a queue first.'],
    ['push', 'Declare your queue the original', { respect: -3, stress: 4 }, 'A disputed founding document', 'Someone disputes your account immediately. You are now part of the delay you wanted to end.', 'I joined an argument about a queue’s historical legitimacy.'],
  ]),
  s('adult-community-map', 'You are here, allegedly', 'A neighbourhood noticeboard has a map of {city}. Its “You are here” sticker points confidently to a patch of water.', [
    ['report', 'Mention it to the caretaker', { respect: 3, discipline: 2 }, 'Dry land restored', 'The caretaker checks the orientation and moves the sticker. No rescue boat is required.', 'I reported a misleading neighbourhood map in {city}.'],
    ['orient', 'Work out the map’s orientation', { smarts: 4, energy: -1 }, 'A small navigation puzzle', 'Once you turn your viewpoint around, the streets line up. The sticker remains unusually aquatic.', 'I figured out a confusing neighbourhood map.'],
    ['follow', 'Argue with the sticker', { happiness: 2, stress: 2 }, 'The sticker declines to answer', 'A passer-by watches you explain that you are plainly not underwater. The map offers no rebuttal.', 'I held a brief argument with an incorrect map sticker.'],
  ]),
  s('adult-open-mic-list', 'Your name is on the list', 'At a free open-mic afternoon, the host reads out a name very close to yours. People turn towards you. You came to listen.', [
    ['correct', 'Point out the mistaken name', { respect: 2, stress: -3 }, 'The intended performer appears', 'Someone else stands up, clutching a poem. You applaud with the enthusiasm of a person narrowly spared a stage.', 'I corrected an open-mic mix-up and stayed in the audience.'],
    ['joke', 'Offer one very short joke', { happiness: 5, stress: 3 }, 'An unexpected guest appearance', 'The host gives you a moment. Your joke gets a laugh, and you hand the microphone back.', 'I made an unplanned joke at an open mic.'],
    ['hide', 'Study the floor intensely', { stress: 4, happiness: -1 }, 'An unhelpful carpet', 'The host repeats the name. The carpet supplies neither an escape route nor a convincing answer.', 'I tried to disappear into the floor during an open-mic mix-up.'],
  ]),
  s('adult-borrowed-pen', 'The ceremonial pen', 'At a community signing-in desk, someone lends you a pen and then watches as though it has been in their family for several generations.', [
    ['return', 'Sign and return it promptly', { discipline: 2, respect: 2 }, 'Custody transferred safely', 'They test the pen immediately. It appears to have survived writing your name.', 'I returned a very carefully supervised borrowed pen.'],
    ['ask', 'Ask whether it is special', { happiness: 3, respect: 2 }, 'A perfectly ordinary favourite', 'It is their only pen that works. The explanation makes the supervision easier to understand.', 'I asked why a borrowed pen was receiving such close attention.'],
    ['pocket', 'Pocket it without thinking', { respect: -4, stress: 3 }, 'A swift reminder', 'They ask for it back before you reach the door. You return it under considerably closer supervision.', 'I nearly walked away with someone’s favourite pen.'],
  ]),
  s('adult-weather-expert', 'The local weather department', 'A stranger asks whether the dark clouds mean rain. You look up. The clouds seem unwilling to publish a timetable.', [
    ['honest', 'Say you are not sure', { respect: 2, stress: -1 }, 'An accurate forecast of uncertainty', 'You both look at the sky for another moment. Nobody mistakes you for a weather service.', 'I admitted I could not predict the weather.'],
    ['shelter', 'Point out somewhere to shelter', { respect: 3, happiness: 2 }, 'Useful without a forecast', 'The stranger thanks you for an answer that works even if the clouds change their minds.', 'I helped someone find shelter instead of guessing about rain.'],
    ['predict', 'Promise sunshine with great authority', { stress: 3, respect: -2 }, 'A bold unofficial bulletin', 'A few drops arrive while you are still explaining. Your meteorological career is unusually short.', 'I made an overconfident weather prediction under a dark cloud.'],
  ]),
  s('adult-instruction-last-page', 'The important page is last', 'You are trying a small paper-folding project at a free workshop. The final instruction says to begin with the paper the other way up.', [
    ['restart', 'Unfold it and begin again', { discipline: 4, energy: -2 }, 'Now the instructions agree', 'The second attempt takes less time. You have learned both the shape and the location of the important warning.', 'I restarted a paper project after finding the crucial instruction last.'],
    ['adapt', 'Turn the mistake into another shape', { happiness: 4, smarts: 2 }, 'A new species of paper object', 'It is not the example on the table. It does stand up, which feels like a defensible design goal.', 'I turned a paper-folding mistake into my own design.'],
    ['blame', 'Explain why the paper is defective', { stress: 4, respect: -2 }, 'A difficult case to prove', 'The person beside you folds the same paper correctly. Your argument loses a useful witness.', 'I blamed the paper for not reading the instructions.'],
  ]),
  s('adult-empty-calendar', 'The appointment with yourself', 'You leave a free hour in your calendar. When someone sees the gap, they immediately offer several useful things you could do with it.', [
    ['keep', 'Keep the hour free', { energy: 5, stress: -3 }, 'A gap with a purpose', 'You explain that being available to rest is still a plan. The hour remains yours.', 'I kept a free hour instead of filling it on request.'],
    ['choose', 'Choose one small useful task', { discipline: 3, energy: -2 }, 'A deliberately short list', 'You finish one thing and stop there. The remaining suggestions do not become obligations.', 'I used part of a free hour for one manageable task.'],
    ['fill', 'Accept every suggestion', { discipline: 2, stress: 5, energy: -5 }, 'The gap closes completely', 'Your calendar looks efficient. You begin to miss the blank space almost immediately.', 'I filled a free hour with more tasks than it could hold.'],
  ]),
  s('adult-unwanted-speech', 'A few words from you', 'A neighbourhood meeting is running late when the host asks you to give a quick view. The microphone is already coming towards you.', [
    ['brief', 'Make one clear point', { respect: 4, discipline: 2 }, 'Quick really can mean quick', 'You say the useful part and pass the microphone on. Several people look visibly grateful.', 'I made a short contribution at a neighbourhood meeting.'],
    ['pass', 'Politely pass this time', { stress: -3, respect: 1 }, 'No emergency opinion required', 'The host moves on. Having nothing to add turns out to be an acceptable answer.', 'I passed on speaking when I had nothing useful to add.'],
    ['ramble', 'Begin with some background', { energy: -3, stress: 3, respect: -2 }, 'An extended historical preface', 'By the time you reach your point, the host is studying the clock with personal interest.', 'I gave a neighbourhood meeting more background than it needed.'],
  ]),
  s('adult-compliment-practice', 'A compliment without an invoice', 'Someone compliments the way you explained a small problem. Your first instinct is to supply a list of reasons the compliment is inaccurate.', [
    ['thanks', 'Say thank you', { happiness: 4, stress: -2 }, 'The exchange is complete', 'They meant it kindly. You let the kind thing stand without cross-examination.', 'I accepted a compliment without arguing against it.'],
    ['share', 'Mention who helped you understand', { respect: 3, happiness: 2 }, 'Credit has room for company', 'You acknowledge useful help without erasing your own part in the explanation.', 'I accepted a compliment and credited the help behind it.'],
    ['reject', 'Explain all your shortcomings', { stress: 3, happiness: -2 }, 'An unexpected rebuttal', 'The other person now has to defend a nice thing they said. The small exchange becomes surprisingly tiring.', 'I argued against a compliment until it became awkward.'],
  ]),
  s('adult-repair-table', 'The expert is also guessing', 'At a free repair demonstration, the volunteer studies a harmless practice mechanism and says, “Well, that is interesting,” three times.', [
    ['ask', 'Ask what they are checking', { smarts: 4, respect: 1 }, 'The thinking becomes visible', 'They explain the possibilities and rule one out. Not knowing immediately is part of the demonstration.', 'I learned how a repair volunteer worked through uncertainty.'],
    ['observe', 'Watch without rushing them', { discipline: 3, stress: -1 }, 'A patient audience', 'The volunteer finds the snag. You see more of the process by allowing it to take time.', 'I watched a repair demonstration without demanding an instant answer.'],
    ['heckle', 'Ask whether there is a real expert', { respect: -4, stress: 2 }, 'An audience of one less ally', 'The volunteer continues explaining to the rest of the group. You have made waiting more uncomfortable.', 'I heckled someone who was volunteering to explain a repair.'],
  ]),
  s('adult-community-poster', 'Three dates for one event', 'A community poster gives one date in the heading, another in the small print and a third beside the illustration. The illustration looks very confident.', [
    ['check', 'Ask the organiser to confirm', { respect: 3, discipline: 2 }, 'One date survives', 'The organiser checks the booking and corrects the poster. The illustration is allowed to keep its confidence.', 'I helped clarify three conflicting dates on a community poster.'],
    ['note', 'Note the uncertainty and move on', { smarts: 2, stress: -1 }, 'An unconfirmed possibility', 'You keep the event in mind without rearranging your week around an unresolved poster.', 'I left a confusing event date unconfirmed.'],
    ['announce', 'Tell everyone the biggest date is right', { respect: -3, stress: 3 }, 'Typography is not evidence', 'Someone asks where you checked. You are forced to identify the size of the lettering as your main source.', 'I treated large lettering as proof of an event date.'],
  ]),
  s('adult-name-pronunciation', 'One more attempt at your name', 'At a local discussion group, the host mispronounces your name twice and then suggests a nickname you have never used.', [
    ['correct', 'Say your name clearly once more', { respect: 3, discipline: 2 }, 'A manageable correction', 'The host repeats it correctly and moves on. The proposed nickname retires before its first appearance.', 'I corrected my name instead of accepting an unwanted nickname.'],
    ['light', 'Turn the correction into a light joke', { happiness: 3, respect: 2 }, 'The right name gets a laugh', 'The host laughs, tries again and gets it right. You keep both your name and the conversation moving.', 'I made a gentle joke while correcting my name.'],
    ['accept', 'Use the nickname for the afternoon', { stress: -1, happiness: -2 }, 'An unexpectedly long afternoon', 'People keep using it. You begin to understand why small corrections are easier when made early.', 'I accepted a nickname I did not actually like.'],
  ]),
  s('adult-shortcut-stairs', 'The shortcut has several stairs', 'A sign promises a shortcut across a public building. Around the next corner, the route becomes a staircase with ambitious ideas about height.', [
    ['return', 'Take the familiar accessible route', { discipline: 2, stress: -2 }, 'A more predictable journey', 'You return to the route you understand. The sign keeps its optimistic definition of short.', 'I chose a familiar route over a questionable shortcut.'],
    ['explore', 'Explore at a comfortable pace', { smarts: 2, energy: -3 }, 'The building has another side', 'You learn where the stairs lead and take your time. It is a discovery rather than a race.', 'I explored a public building’s unexpectedly elaborate shortcut.'],
    ['race', 'Hurry to prove the sign right', { stress: 4, energy: -5 }, 'The shortcut wins the argument', 'You arrive tired and mildly offended. The sign has no mechanism for receiving your complaint.', 'I rushed through a shortcut that did not feel shorter.'],
  ]),
  s('adult-small-volunteer-task', 'A very small responsibility', 'A community volunteer asks you to hold one end of a banner for a minute. The wind immediately applies for the other end.', [
    ['help', 'Hold it while they secure it', { respect: 3, energy: -2 }, 'A cooperative wind problem', 'You work out a steadier angle together. The banner eventually becomes readable rather than airborne.', 'I helped secure a wind-blown community banner.'],
    ['suggest', 'Suggest waiting for the gust to pass', { smarts: 2, discipline: 2 }, 'A temporary ceasefire', 'A calmer moment arrives. The same task becomes much easier without an argument with the weather.', 'I suggested waiting for calmer weather before lifting a banner.'],
    ['release', 'Let go without warning', { respect: -4, stress: 3 }, 'A sudden solo performance', 'The volunteer catches the loose end. Their expression explains the value of giving notice.', 'I let go of a banner before warning the person beside me.'],
  ]),
  s('adult-uncertain-memory', 'Did that actually happen?', 'During a public reminiscence session, you start telling a vivid story and realise halfway through that part of it might be from a film.', [
    ['admit', 'Admit you may be mixing memories', { respect: 3, stress: -2 }, 'The audience understands', 'Someone else recognises the film. Your actual memory survives with a much smaller car chase.', 'I corrected a memory that had borrowed a scene from a film.'],
    ['separate', 'Stick to the part you remember clearly', { discipline: 3, smarts: 2 }, 'A shorter true story', 'You leave out the uncertain details. The story becomes less spectacular and easier to believe.', 'I separated a clear memory from uncertain embellishment.'],
    ['continue', 'Continue towards the dramatic ending', { stress: 4, respect: -3 }, 'A familiar screenplay', 'A listener supplies the next line. You discover that your memory has an unusually recognisable cast.', 'I continued a doubtful memory until someone recognised the film.'],
  ], { rarity: 'uncommon' }),
  s('adult-free-sample-opinion', 'The very honest feedback form', 'After a free public demonstration, a volunteer asks for honest feedback. The form has space for one sentence, which seems a sensible limit.', [
    ['specific', 'Offer one useful improvement', { respect: 3, smarts: 2 }, 'Something they can actually use', 'You describe the confusing step and what would clarify it. The volunteer writes it down.', 'I gave specific feedback after a free demonstration.'],
    ['kind', 'Say what worked well', { happiness: 3, respect: 2 }, 'A useful bit of encouragement', 'The volunteer is relieved to hear which explanation landed. Praise can contain information too.', 'I told a volunteer which part of their demonstration worked.'],
    ['essay', 'Request several additional pages', { energy: -3, stress: 2 }, 'A review with appendices', 'You develop opinions well beyond the demonstration. The volunteer had been hoping to stack the chairs.', 'I turned a short feedback form into a lengthy review.'],
  ]),
  s('adult-seat-with-a-view', 'The best seat in the room', 'You arrive early for a free event and find the seat with the clearest view. Someone asks whether you could move so their group can sit together.', [
    ['move', 'Move to another available seat', { respect: 3, happiness: 2 }, 'A small rearrangement', 'They thank you and make room. Your new seat has a slightly worse view and a much quieter neighbour.', 'I moved seats so a group could sit together.'],
    ['decline', 'Politely keep the seat', { discipline: 3, stress: -1 }, 'A reasonable answer', 'You explain that you chose it carefully. They look for another arrangement without a scene.', 'I politely kept a seat I had arrived early to choose.'],
    ['lecture', 'Explain the principles of arriving early', { respect: -3, stress: 3 }, 'More than a seating answer', 'The group moves elsewhere before you finish your argument about punctuality.', 'I gave a lecture when a simple answer about a seat would have done.'],
  ]),
  s('adult-password-on-paper', 'A reminder that needs reminding', 'You find a note you wrote to help remember something important. It says only, “The usual one, but different.”', [
    ['rewrite', 'Write a clearer private reminder', { discipline: 4, stress: -2 }, 'Future you gets better information', 'You replace the riddle with a useful explanation and keep it somewhere appropriate.', 'I replaced an unhelpful private reminder with a clear one.'],
    ['reconstruct', 'Work backwards from the context', { smarts: 4, energy: -2 }, 'An investigation into your own shorthand', 'The surrounding notes help you understand what you meant. You remain an unreliable witness to your own abbreviation.', 'I reconstructed the meaning of an obscure note to myself.'],
    ['trust', 'Assume it will make sense later', { stress: 3, discipline: -2 }, 'A message forwarded to the future', 'The note remains exactly as informative as before. You have postponed the same puzzle.', 'I left a confusing reminder for my future self to solve.'],
  ]),
  s('adult-lost-glove', 'One glove, several possibilities', 'You spot a single glove on a public bench. A nearby notice asks people to leave found items at the building’s reception desk.', [
    ['desk', 'Take it to reception', { respect: 3, energy: -1 }, 'A findable lost item', 'The receptionist adds it to the found-items box. Its owner now has somewhere sensible to ask.', 'I took a lost glove to the nearby reception desk.'],
    ['visible', 'Leave it visible on the bench', { discipline: 1, stress: -1 }, 'Ready for a retraced route', 'You make sure it is easy to see. Someone returning along the same path may still spot it.', 'I left a lost glove where its owner might retrace their steps.'],
    ['detective', 'Question everybody about the glove', { energy: -4, stress: 2 }, 'A small unnecessary investigation', 'Several strangers confirm that they have hands. Reception is still the most promising lead.', 'I made a lost glove into a larger investigation than necessary.'],
  ]),
  s('adult-perfect-introduction', 'A biography of thirty seconds', 'Before a discussion circle begins, the host asks everyone for a very short introduction. The first person has already described three previous homes.', [
    ['brief', 'Give your name and one interest', { respect: 3, stress: -2 }, 'Plenty to begin with', 'Someone asks about the interest later. Your introduction leaves room for an actual conversation.', 'I kept a group introduction short enough to start a conversation.'],
    ['question', 'Add a question for the group', { smarts: 2, respect: 2 }, 'An invitation instead of a résumé', 'Other people begin answering. You learn more by making room for them.', 'I used an introduction to ask other people about themselves.'],
    ['compete', 'Attempt the most impressive biography', { stress: 4, energy: -2 }, 'An introduction with several chapters', 'You run past the time limit while explaining that you are usually very concise.', 'I overprepared my own introduction and forgot to stop.'],
  ]),
  s('adult-silent-notification', 'The message before the message', 'You begin writing a reply, delete it, write another and then notice that you have spent longer on the greeting than the conversation deserves.', [
    ['send', 'Send a simple, clear reply', { discipline: 3, stress: -3 }, 'A perfectly ordinary message', 'The reply communicates what you meant. Nobody requests a more elegant opening.', 'I stopped polishing a message and sent a clear reply.'],
    ['pause', 'Put it aside and return later', { energy: 3, stress: -2 }, 'A little distance helps', 'When you return, the sentence looks much less important. You find the words more easily.', 'I took a break from overthinking a short message.'],
    ['polish', 'Continue refining every word', { energy: -4, stress: 4 }, 'A greeting with a full workday', 'You produce several excellent versions of hello. The actual reply remains unwritten.', 'I spent too long editing the beginning of a simple message.'],
  ]),
  s('adult-neighbourhood-song', 'A chorus everyone almost knows', 'At a free neighbourhood singalong, everyone confidently starts the chorus and then disagrees about the second line.', [
    ['laugh', 'Laugh and follow the group', { happiness: 5, stress: -2 }, 'Several versions, one chorus', 'The song keeps going. Accuracy becomes less important than the effort everyone is making together.', 'I joined a singalong whose lyrics had several local editions.'],
    ['listen', 'Listen until the next familiar line', { happiness: 3, discipline: 2 }, 'An honest musical pause', 'You return when you know the words. Listening does not disqualify you from the afternoon.', 'I enjoyed a singalong without pretending to know every lyric.'],
    ['correct', 'Stop to correct every version', { respect: -3, stress: 3 }, 'A rehearsal nobody booked', 'The group loses its place while you establish the official wording. The chorus never asked for an editor.', 'I interrupted a singalong to argue about its words.'],
  ], { illustration: 'music' }),
].map(template => ({ ...template, max: 65 }));
