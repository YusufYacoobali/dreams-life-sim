import type { LifestyleTemplate } from './lifestyleEvents';

/** Prospective prose. Published templates and bound wording remain literal. */
export const lifestyleCopyV2: Record<string, { body: string; choices: readonly { label: string; body: string; journal: string }[] }> = {
  "home-ceiling-map": {
    "body": "{person} sends a photograph of the damp patch at {subject}. Yesterday it was an island. Today it has annexed the landing.",
    "choices": [
      {
        "label": "Send a plumber",
        "body": "The plumber stops the leak. You pay the bill, and {person} retires the bucket from active service.",
        "journal": "I paid a plumber to fix the leak at {subject} and put {person}’s bucket out of work."
      },
      {
        "label": "Arrange an inspection first",
        "body": "You arrange an inspection. {person} asks whether the damp patch will be paying rent while everyone waits.",
        "journal": "I arranged an inspection of the damp patch at {subject} while {person} waited for a repair."
      }
    ]
  },
  "home-bass": {
    "body": "{person} says a neighbour’s bass reaches {subject} through the cutlery. Their spoon drawer now has a rhythm section.",
    "choices": [
      {
        "label": "Listen and mediate",
        "body": "You listen without making a joke. By the time you leave, {person} is less angry with you. The spoon drawer is still performing.",
        "journal": "I listened to {person}’s complaint about the neighbour’s bass."
      },
      {
        "label": "Call it free entertainment",
        "body": "You call it free entertainment. {person} asks whether you would like to sleep beside the subwoofer. The conversation deteriorates.",
        "journal": "I called {person}’s noise complaint free entertainment. They did not find it funny."
      }
    ]
  },
  "home-rent-cake": {
    "body": "{person} has cleaned the shared entry and brought a cake. You inspect it for a rent-reduction message. It is simply cake.",
    "choices": [
      {
        "label": "Thank them without a catch",
        "body": "You thank {person} and share the cake. For once, being a landlord involves a decent conversation.",
        "journal": "I shared {person}’s cake and thanked them for looking after the entry."
      },
      {
        "label": "Ask what they want",
        "body": "You ask what the cake is supposed to achieve. {person} says “a nice afternoon”, very slowly. You have managed to make cake awkward.",
        "journal": "I treated {person}’s cake as a negotiating tactic and spoiled a kind gesture."
      }
    ]
  },
  "home-inspection-shoes": {
    "body": "During an agreed inspection of {subject}, you find {person}’s shoes by the door. The property is, alarmingly, being used as a home.",
    "choices": [
      {
        "label": "Respect their space",
        "body": "You keep the agreed visit brief. {person} relaxes when it becomes clear you understand what a home is for.",
        "journal": "I kept my inspection of {subject} brief and respected {person}’s home."
      },
      {
        "label": "Deliver a lecture about shoes",
        "body": "You deliver your lecture about shoes. {person} listens with the expression of someone mentally reviewing every rent payment they have ever made.",
        "journal": "I lectured {person} about shoes in their own hallway."
      }
    ]
  },
  "home-window-herb": {
    "body": "{person} wants permission to keep herbs on the sill at {subject}. They have prepared a much longer explanation than basil deserves.",
    "choices": [
      {
        "label": "Allow removable pots",
        "body": "You agree to removable pots. {person} looks absurdly relieved about the basil.",
        "journal": "I agreed to {person}’s removable herb pots at {subject}."
      },
      {
        "label": "Refuse the basil",
        "body": "You refuse the basil. {person} puts away the little pots. It is a remarkably efficient way to make a home feel less welcoming.",
        "journal": "I refused {person}’s request for basil on the windowsill."
      }
    ]
  },
  "home-investment-argument": {
    "body": "{person} asks why {subject} gets new fittings before the household gets a quiet weekend.",
    "choices": [
      {
        "label": "Talk about the shared priorities",
        "body": "You close the spreadsheet and listen. The fittings are still there tomorrow; this conversation needed you today.",
        "journal": "I listened to {person} about the time I was spending on {subject}."
      },
      {
        "label": "Explain that the spreadsheet loves you",
        "body": "You explain the numbers again. {person} points out that the spreadsheet has never once asked how their day went.",
        "journal": "I defended my property spreadsheet instead of listening to {person}."
      }
    ]
  },
  "home-first-dinner": {
    "body": "You eat at {subject} without balancing a plate on a box. The room is still mostly empty. It already feels different.",
    "choices": [
      {
        "label": "Take your time over dinner",
        "body": "You take your time. The room is still mostly empty, but it has stopped feeling temporary.",
        "journal": "I enjoyed an unhurried dinner at {subject}. The place felt like home."
      },
      {
        "label": "Spend dinner measuring for improvements",
        "body": "By dessert you have measured the same wall three times. The improvements remain plans for another day.",
        "journal": "I spent dinner at {subject} measuring walls for improvements I had not started."
      }
    ]
  },
  "home-garden-invasion": {
    "body": "One weed in {subject}’s garden has grown taller than the chair beside it. You briefly consider charging it rent.",
    "choices": [
      {
        "label": "Tend the garden",
        "body": "You spend the afternoon tending the grounds. The weed comes out with enough root attached to suggest a second property underground.",
        "journal": "I tended the garden at {subject} and wrestled with a remarkably determined weed."
      },
      {
        "label": "Declare a wild corner",
        "body": "You leave a small wild corner. Watching it move in the breeze turns out to be a good use of the chair.",
        "journal": "I left a wild corner in the garden at {subject} and enjoyed the view."
      }
    ]
  },
  "home-pool-silence": {
    "body": "For once, the pool at {subject} is quiet. No inflatable has wedged itself into a bush. Nobody is shouting about a missing sandal.",
    "choices": [
      {
        "label": "Enjoy the quiet water",
        "body": "You enjoy the quiet water. Even the missing sandals have agreed to take the afternoon off.",
        "journal": "I enjoyed a rare quiet afternoon by the pool at {subject}."
      },
      {
        "label": "Book proper pool maintenance",
        "body": "You pay for proper maintenance. The pool looks better, and you can stop pretending the filter will sort itself out.",
        "journal": "I paid for pool maintenance at {subject} instead of relying on optimism."
      }
    ]
  },
  "home-lock-trouble": {
    "body": "The front door at {subject} has decided only one particular wrist movement deserves entry.",
    "choices": [
      {
        "label": "Pay a locksmith",
        "body": "You pay the locksmith. The door begins accepting ordinary human wrists again.",
        "journal": "I paid a locksmith to make the front door at {subject} cooperative again."
      },
      {
        "label": "Keep practising the wrist movement",
        "body": "You keep using the wrist movement. The repair remains outstanding, and the door grows less cooperative.",
        "journal": "I put off fixing the door at {subject} and kept practising the wrist movement."
      }
    ]
  },
  "home-covered-damage": {
    "body": "A storm has lifted a section of gutter at {subject}. Your insurance policy is about to become less theoretical.",
    "choices": [
      {
        "label": "Record the loss and claim",
        "body": "Your insurer covers part of the storm damage. It is welcome help, although the gutter has left you with a share of the loss.",
        "journal": "I claimed for storm damage at {subject} and received a partial insurance reimbursement."
      },
      {
        "label": "Pay for a direct repair",
        "body": "You pay for a direct repair. The gutter resumes its modest career of keeping water away from the walls.",
        "journal": "I paid to repair the storm-damaged gutter at {subject}."
      }
    ]
  },
  "home-damage-report": {
    "body": "Your tenant, {person}, admits breaking the gate at {subject} during an argument. They insist a gate should be able to take criticism.",
    "choices": [
      {
        "label": "Record the damage and report it",
        "body": "You report the damage and {person}’s admission. There is now a vandalism incident to investigate. The gate has had enough arguments.",
        "journal": "I reported {person}’s damage to the gate at {subject}."
      },
      {
        "label": "Pay for the gate and keep it civil",
        "body": "You pay for the gate and discuss the damage with {person}. It is a better conversation than the one they had with the gate.",
        "journal": "I paid to repair the gate at {subject} and talked the damage through with {person}."
      }
    ]
  },
  "vehicle-warning-light": {
    "body": "{subject} lights up a symbol that looks expensive in every language.",
    "choices": [
      {
        "label": "Pay for a diagnostic repair",
        "body": "You pay for diagnostic repairs. The warning light finally goes out, allowing you to worry about something without a dashboard symbol.",
        "journal": "I paid for diagnostic repairs to {subject}."
      },
      {
        "label": "Hope it is seasonal",
        "body": "You decide it is probably seasonal. The condition worsens. The light appears to be enjoying the arrangement.",
        "journal": "I ignored the warning light on {subject}, and its condition worsened."
      }
    ]
  },
  "vehicle-roadtrip-sandwich": {
    "body": "After a trip in {subject}, you discover the sandwich you packed before leaving. It has developed its own weather.",
    "choices": [
      {
        "label": "Pay for a proper interior clean",
        "body": "You pay for a thorough interior clean. The cleaner looks at the former sandwich, then looks at you. Neither of you asks a follow-up question.",
        "journal": "I paid to have the forgotten sandwich’s influence removed from {subject}."
      },
      {
        "label": "Dispose of it with dignity",
        "body": "You dispose of the sandwich. The memory remains longer than the smell.",
        "journal": "I disposed of a forgotten sandwich from {subject} with what dignity I could manage."
      }
    ]
  },
  "vehicle-parking-dispute": {
    "body": "{person} says {subject} occupies two parking spaces. You say it occupies one space and a small emotional buffer.",
    "choices": [
      {
        "label": "Park considerately",
        "body": "You move within the parking area. {person} appreciates the gesture more than your explanation.",
        "journal": "I parked {subject} considerately after {person} complained."
      },
      {
        "label": "Defend the emotional buffer",
        "body": "You defend the emotional buffer. {person} suggests buying a smaller ego. Neither of you enjoys the rest of the conversation.",
        "journal": "I defended my parking to {person} instead of moving {subject}."
      }
    ]
  },
  "vehicle-mechanic-opera": {
    "body": "The mechanic looks at {subject}, inhales through their teeth and begins speaking in tragic paragraphs.",
    "choices": [
      {
        "label": "Pay for an independent inspection",
        "body": "You pay for a second inspection and practical work. This mechanic uses actual nouns instead of tragic pauses.",
        "journal": "I paid for a second inspection and practical work on {subject}."
      },
      {
        "label": "Leave and review a normal service",
        "body": "You leave with the quote. “Investigate later” is considerably cheaper than agreeing while frightened.",
        "journal": "I took the mechanic’s alarming quote for {subject} away to consider."
      }
    ]
  },
  "vehicle-family-borrow": {
    "body": "{person} asks to borrow {subject}. Their definition of “just around the corner” has previously been elastic.",
    "choices": [
      {
        "label": "Decline politely",
        "body": "You decline politely. {person} is disappointed, but the keys stay where you left them.",
        "journal": "I declined {person}’s request to borrow {subject}."
      },
      {
        "label": "Suggest a drive together instead",
        "body": "You suggest going together another time. {person} warms to the idea. For now, the keys remain with you.",
        "journal": "I suggested arranging a drive in {subject} with {person} instead of lending it."
      }
    ]
  },
  "vehicle-covered-scrape": {
    "body": "A scrape on {subject} makes a concrete pillar’s position in the argument very clear.",
    "choices": [
      {
        "label": "Record the loss under your cover",
        "body": "Your insurer reimburses part of the loss. The pillar remains offensively intact.",
        "journal": "I claimed for the scrape on {subject} and received a partial insurance reimbursement."
      },
      {
        "label": "Pay for a cosmetic repair",
        "body": "You pay for a cosmetic repair. The pillar declines to contribute.",
        "journal": "I paid for cosmetic repairs to {subject} after its encounter with a pillar."
      }
    ]
  },
  "vehicle-damaged-trip": {
    "body": "{subject} is in poor condition. The journey plan is optimistic; the sound from the engine is not.",
    "choices": [
      {
        "label": "Pay for a repair first",
        "body": "You pay for repairs before arranging another outing. The vehicle sounds less like it has a personal grievance.",
        "journal": "I paid for repairs to {subject} before arranging another outing."
      },
      {
        "label": "Cancel the outing",
        "body": "You postpone the outing. Staying home is disappointing, but it is considerably quieter than the engine.",
        "journal": "I postponed an outing because {subject} was in poor condition."
      }
    ]
  },
  "vehicle-vintage-admirer": {
    "body": "An enthusiast admires {subject} and correctly identifies three noises you thought were unique to yours.",
    "choices": [
      {
        "label": "Enjoy the conversation",
        "body": "You enjoy a conversation with someone who understands the noises. Admiration turns out to be pleasant even without an offer.",
        "journal": "I enjoyed talking to someone who appreciated {subject}’s familiar noises."
      },
      {
        "label": "Pay for careful restoration work",
        "body": "You pay for careful restoration. The condition improves, and one of the familiar noises finally retires.",
        "journal": "I paid for careful restoration work on {subject}."
      }
    ]
  },
  "vehicle-repair-invoice": {
    "body": "The repair quote for {subject} includes “investigative contemplation”. You suspect this means staring at it.",
    "choices": [
      {
        "label": "Approve only practical work",
        "body": "You pay for practical, itemised work. “Investigative contemplation” does not survive your reading of the invoice.",
        "journal": "I paid for practical, itemised repairs to {subject}."
      },
      {
        "label": "Take the quote home",
        "body": "You take the quote home. Staring at it in your own kitchen turns out to be free.",
        "journal": "I took the repair quote for {subject} home without approving the work."
      }
    ]
  },
  "vehicle-small-injury": {
    "body": "While unloading {subject}, a loose bag catches your ankle. This was not the dramatic travel story you had imagined.",
    "choices": [
      {
        "label": "Stop and care for the ankle",
        "body": "You stop and give the ankle a rest. It settles before the afternoon develops a second plot.",
        "journal": "I stopped unloading {subject} and rested my ankle."
      },
      {
        "label": "Push through it",
        "body": "You keep lifting. Your ankle responds with a sprain, bringing a rather firm end to the discussion.",
        "journal": "I kept lifting luggage from {subject} and sprained my ankle."
      }
    ]
  },
  "vehicle-wrong-song": {
    "body": "Your triumphant arrival in {subject} is accompanied by a children’s counting song you do not remember selecting.",
    "choices": [
      {
        "label": "Commit to the chorus",
        "body": "You commit to the chorus. By seven you have lost your dignity and improved your afternoon.",
        "journal": "I sang along to the counting song accompanying my arrival in {subject}."
      },
      {
        "label": "Turn it off very carefully",
        "body": "You restore silence. The number seven remains in your head for the rest of the day.",
        "journal": "I switched off the counting song in {subject}, although seven stayed with me."
      }
    ]
  },
  "vehicle-weather-window": {
    "body": "You consider taking {subject} out. The forecast suggests that staying home has excellent visibility.",
    "choices": [
      {
        "label": "Wait for better conditions",
        "body": "You leave the vehicle where it is. The first heavy drops make the decision look extremely wise.",
        "journal": "I left {subject} parked and waited for better weather."
      },
      {
        "label": "Use the time to plan carefully",
        "body": "You plan a future outing from somewhere dry. For once, preparation involves a comfortable chair.",
        "journal": "I planned a future outing in {subject} from somewhere comfortably dry."
      }
    ]
  },
  "pet-witness": {
    "body": "{subject} has learned the phrase “absolutely not”. Guests now believe every invitation is being personally rejected.",
    "choices": [
      {
        "label": "Teach a more welcoming cue",
        "body": "You patiently practise a friendlier cue with {subject}. “Absolutely not” finally faces some competition.",
        "journal": "I practised a more welcoming cue with {subject}."
      },
      {
        "label": "Laugh every single time",
        "body": "{subject} enjoys the reaction. Your bond grows more than their manners.",
        "journal": "I kept laughing at {subject}’s emphatic objections."
      }
    ]
  },
  "pet-certificate": {
    "body": "{subject} has made real training progress. You print a little certificate. They immediately try to eat it.",
    "choices": [
      {
        "label": "Practise the leave-it cue",
        "body": "You redirect {subject} and build on their training. The certificate survives in a less accessible position.",
        "journal": "I practised the leave-it cue with {subject} and rescued the training certificate."
      },
      {
        "label": "Remember the occasion",
        "body": "You remember the occasion: a promising student, a proud owner and a certificate with one damp corner.",
        "journal": "I enjoyed {subject}’s training milestone, including the attempt to eat the certificate."
      }
    ]
  },
  "pet-election": {
    "body": "{subject} chooses {person}’s lap, again. The rest of the household appears to have lost an election nobody announced.",
    "choices": [
      {
        "label": "Respect the chosen lap",
        "body": "You give {subject} and {person} their quiet space. Losing this election has produced a rather peaceful room.",
        "journal": "I gave {subject} and {person} time together on the chosen lap."
      },
      {
        "label": "Compete for the cat’s attention",
        "body": "You campaign for {subject}’s attention. The cat moves further away. Your polling has become worse than your dignity.",
        "journal": "I competed for {subject}’s attention and made myself less appealing."
      }
    ]
  },
  "pet-night-builder": {
    "body": "{subject} has rearranged the habitat while you slept. The wheel is apparently load-bearing.",
    "choices": [
      {
        "label": "Pay for safe enrichment",
        "body": "You pay for safe enrichment. {subject} investigates the additions as if they have been expecting the delivery.",
        "journal": "I bought safe enrichment for {subject}’s nocturnal building projects."
      },
      {
        "label": "Watch the tiny architect work",
        "body": "You watch the tiny architect work. The habitat has a strong design direction and absolutely no committee.",
        "journal": "I watched {subject} rearrange their tiny world."
      }
    ]
  },
  "pet-vegetable-alarm": {
    "body": "{subject} hears the fridge and announces a nutritional emergency. You were looking for mustard.",
    "choices": [
      {
        "label": "Keep them company at normal feeding time",
        "body": "You keep {subject} company at their normal mealtime. The mustard turns out not to be relevant to this emergency.",
        "journal": "I kept {subject} company at their normal mealtime."
      },
      {
        "label": "Wait until the chorus settles",
        "body": "You wait for the chorus to settle. Eventually the fridge can be opened without an announcement.",
        "journal": "I waited for {subject}’s fridge announcement to subside."
      }
    ]
  },
  "pet-turtle-arrival": {
    "body": "{subject} comes towards you at a pace that suggests an appointment made several days ago.",
    "choices": [
      {
        "label": "Give them all the time they need",
        "body": "You wait. The slow approach becomes a small, real moment of trust.",
        "journal": "I waited patiently for {subject} to come closer."
      },
      {
        "label": "Check the habitat instead",
        "body": "You care for the familiar habitat. {subject} watches with the air of someone who has appointed a competent assistant.",
        "journal": "I checked {subject}’s familiar habitat while they supervised."
      }
    ]
  },
  "pet-fish-audience": {
    "body": "{subject} follows you along the tank. Either you have bonded or you look exactly like a food dispenser.",
    "choices": [
      {
        "label": "Spend quiet time by the tank",
        "body": "You spend quiet time beside the tank. Whatever {subject} thinks you are, they seem pleased to see you.",
        "journal": "I spent a peaceful spell beside {subject}’s tank."
      },
      {
        "label": "Pay for habitat supplies",
        "body": "You pay for suitable habitat supplies. {subject} investigates the cleaner, more comfortable surroundings.",
        "journal": "I bought suitable habitat supplies for {subject}."
      }
    ]
  },
  "pet-horse-gate": {
    "body": "{subject} studies the gate with the patient confidence of someone who has seen you operate it.",
    "choices": [
      {
        "label": "Pay for a safer latch",
        "body": "You pay for a safer latch. {subject} studies the revised arrangement with undiminished interest.",
        "journal": "I paid for a safer latch on {subject}’s gate."
      },
      {
        "label": "Practise a calm gate routine",
        "body": "You practise a calm, supervised gate routine on your grounds. {subject} begins to wait for your cue.",
        "journal": "I practised a calm gate routine with {subject} on the grounds."
      }
    ]
  },
  "pet-rabbit-floor": {
    "body": "{subject} investigates your socks, decides they are suspicious and returns for a second opinion.",
    "choices": [
      {
        "label": "Sit quietly on the floor",
        "body": "You wait at {subject}’s level. Eventually your socks receive a less suspicious inspection.",
        "journal": "I sat on the floor and let {subject} inspect my suspicious socks."
      },
      {
        "label": "Give them a quiet corner",
        "body": "You give {subject} a quiet corner. They settle without needing to explain themselves.",
        "journal": "I gave {subject} a quiet corner to settle in."
      }
    ]
  },
  "pet-stubborn-school": {
    "body": "You ask {subject} to move. They look at the destination, then lie down exactly where they are.",
    "choices": [
      {
        "label": "Break the task into smaller steps",
        "body": "You break the task into smaller steps. {subject} accepts a modest revision to their counterproposal.",
        "journal": "I broke {subject}’s training task into smaller steps."
      },
      {
        "label": "Stop while you still like each other",
        "body": "You end the session while you still like each other. {subject} appears happy with the agreement.",
        "journal": "I ended {subject}’s session before patience became an argument."
      }
    ]
  },
  "pet-nervous-door": {
    "body": "{subject} hears the bell and retreats. The visitor is less frightening than the sound announcing them.",
    "choices": [
      {
        "label": "Offer a quiet retreat",
        "body": "You offer a quiet retreat. {subject} settles when nobody insists on an introduction.",
        "journal": "I let {subject} retreat somewhere quiet after the doorbell rang."
      },
      {
        "label": "Practise gently at a distance",
        "body": "You practise gently at a distance and stop before it becomes too much. A small improvement is enough for today.",
        "journal": "I practised gently with {subject} at a comfortable distance from the door."
      }
    ]
  },
  "pet-affectionate-shadow": {
    "body": "Every time you change rooms, {subject} appears as though they also urgently needed to be there.",
    "choices": [
      {
        "label": "Stay in one room together",
        "body": "You stay in one room together. {subject} can finally stop managing your itinerary.",
        "journal": "I stayed in one room with {subject} and enjoyed the company."
      },
      {
        "label": "Keep a reassuring routine",
        "body": "You keep the day reassuringly familiar. {subject} settles into the parts they recognise.",
        "journal": "I kept {subject}’s day reassuringly familiar."
      }
    ]
  },
  "pet-mischief-sock": {
    "body": "{subject} is unusually pleased with themselves. A small household object is conspicuously elsewhere.",
    "choices": [
      {
        "label": "Redirect the curiosity safely",
        "body": "You redirect the curiosity safely. {subject} finds a less disruptive use for all that interest.",
        "journal": "I redirected {subject}’s curiosity towards something safer."
      },
      {
        "label": "Enjoy the harmless nonsense",
        "body": "You laugh and retrieve your things. {subject} seems delighted that the expedition has been appreciated.",
        "journal": "I retrieved my things and enjoyed {subject}’s harmless mischief."
      }
    ]
  },
  "pet-loyal-wait": {
    "body": "{subject} settles in their usual spot near you. You have not done anything interesting. That seems to be the point.",
    "choices": [
      {
        "label": "Keep them company",
        "body": "You make room for familiar company. Neither of you needs the afternoon to become more interesting.",
        "journal": "I made time for {subject}’s familiar company."
      },
      {
        "label": "Offer a gentle, familiar cue",
        "body": "You practise a gentle familiar cue. {subject} settles, then stays a little closer.",
        "journal": "I practised a gentle cue with {subject}, who stayed close afterwards."
      }
    ]
  },
  "pet-curious-box": {
    "body": "{subject} regards a safe empty container with the concentration usually reserved for a major scientific grant.",
    "choices": [
      {
        "label": "Supervise an exploration",
        "body": "You supervise the exploration. {subject} makes a thorough examination of the small new universe.",
        "journal": "I supervised {subject}’s exploration of a safe empty container."
      },
      {
        "label": "Pay for suitable enrichment",
        "body": "You pay for suitable enrichment. {subject} begins a fresh investigation.",
        "journal": "I bought suitable enrichment for {subject}’s next investigation."
      }
    ]
  },
  "pet-energetic-circuit": {
    "body": "{subject} has finished the previous activity and is now offering several urgent proposals for the next one.",
    "choices": [
      {
        "label": "Practise settling down",
        "body": "You practise a short settling cue. For a few beautiful moments, the urgent proposals stop.",
        "journal": "I practised settling down with {subject}."
      },
      {
        "label": "Make a quiet end to the session",
        "body": "You make a calm end to the session. {subject} finally finds a comfortable place for all those limbs.",
        "journal": "I brought {subject}’s activity to a calm finish."
      }
    ]
  },
  "pet-health-patience": {
    "body": "{subject} is unwell. Today they want the familiar room and your company.",
    "choices": [
      {
        "label": "Stay nearby",
        "body": "You stay nearby. {subject} is still unwell, but the afternoon becomes a little easier to bear.",
        "journal": "I stayed beside {subject} during an unwell afternoon."
      },
      {
        "label": "Pay for suitable comfort supplies",
        "body": "You buy suitable comfort supplies. {subject} settles more easily, although the illness still needs its own care.",
        "journal": "I bought comfort supplies to help {subject} rest while they were unwell."
      }
    ]
  },
  "pet-family-memory": {
    "body": "{person} tells you about a small habit {subject} has when you are not in the room. You realise this is their friendship as well.",
    "choices": [
      {
        "label": "Make time for their quiet moment",
        "body": "You give {person} and {subject} their own quiet moment. It is lovely to see a friendship that belongs to them.",
        "journal": "I made room for {person} and {subject} to enjoy their own friendship."
      },
      {
        "label": "Join them gently",
        "body": "You join gently. For a while, the whole room seems to have found the same pace.",
        "journal": "I joined {person} and {subject} for a quiet moment together."
      }
    ]
  },
  "hobby-chess-prodigy": {
    "body": "{person}, your acquaintance from chess practice, sits opposite you with two notebooks and the air of someone about to mark your homework.",
    "choices": [
      {
        "label": "Play a careful positional game",
        "body": "You study the position and give each move your full attention.",
        "journal": "I played a careful informal chess game with {person}."
      },
      {
        "label": "Try a reckless opening",
        "body": "You launch an opening of tremendous ambition and uncertain structural integrity.",
        "journal": "I tried a reckless opening in an informal chess game with {person}."
      }
    ]
  },
  "hobby-guitar-two-chords": {
    "body": "Your guitar practice has produced a furious little tune about a bus. It is the most emotionally honest thing you have played.",
    "choices": [
      {
        "label": "Work carefully on the ending",
        "body": "You work on the ending, then test the phrase in practice.",
        "journal": "I worked on the ending of my furious little guitar tune."
      },
      {
        "label": "Play it just for yourself",
        "body": "You play the ridiculous little tune for yourself. The bus has never inspired such commitment.",
        "journal": "I played my ridiculous guitar tune for my own enjoyment."
      }
    ]
  },
  "hobby-painting-bowl": {
    "body": "The fruit in your painting appears to be waiting for bad news. You had intended a cheerful still life.",
    "choices": [
      {
        "label": "Study the light again",
        "body": "You study the light and work patiently at the next brushstroke. The fruit begins to look less recently bereaved.",
        "journal": "I studied the light in my unexpectedly mournful still life."
      },
      {
        "label": "Enjoy the uneasy fruit",
        "body": "You enjoy the uneasy fruit. It is the most interesting mistake you have made all week.",
        "journal": "I enjoyed the uneasy fruit in my painting."
      }
    ]
  },
  "hobby-photo-bin": {
    "body": "Your most carefully composed practice photograph features a wheelie bin in a position of immense emotional significance.",
    "choices": [
      {
        "label": "Study why the composition works",
        "body": "You study why the composition works. The bin has been doing excellent visual work without any recognition.",
        "journal": "I studied the composition of my surprisingly expressive wheelie-bin photograph."
      },
      {
        "label": "Accept your new subject",
        "body": "You enjoy finding something strange in an ordinary street. You start noticing the edges of things again.",
        "journal": "I enjoyed noticing the strange beauty of an ordinary street."
      }
    ]
  },
  "hobby-reading-character": {
    "body": "You disagree with a fictional character so strongly that you have started pacing between chapters.",
    "choices": [
      {
        "label": "Write down why it works",
        "body": "You make notes about why the character bothers you. The pacing gives way to a rather good discussion with yourself.",
        "journal": "I made notes about the fictional character who had me pacing."
      },
      {
        "label": "Let the argument be enjoyable",
        "body": "You enjoy the argument. It is a relief to care about someone who cannot send a message afterwards.",
        "journal": "I let myself enjoy an argument with a fictional character."
      }
    ]
  },
  "hobby-gaming-save": {
    "body": "Your practice game’s heroic final move has trapped the main character in a cupboard. The soundtrack remains extremely confident.",
    "choices": [
      {
        "label": "Review the move patiently",
        "body": "You work patiently through the move. The cupboard becomes a lesson instead of the ending.",
        "journal": "I reviewed the move that had trapped my heroic character in a cupboard."
      },
      {
        "label": "Enjoy the accidental ending",
        "body": "You enjoy the accidental finale. The heroic soundtrack has never worked harder.",
        "journal": "I enjoyed my game’s accidental cupboard finale."
      }
    ]
  },
  "hobby-cooking-soup": {
    "body": "Your supervised practice soup has become thick enough to remember the shape of the spoon.",
    "choices": [
      {
        "label": "Adjust it carefully",
        "body": "You adjust the soup carefully with the ingredients from the session. Eventually the spoon can leave without assistance.",
        "journal": "I adjusted my practice soup until the spoon could escape."
      },
      {
        "label": "Enjoy an unexpectedly hearty lesson",
        "body": "You accept an unusually hearty lesson. Next time you will recognise the moment before soup becomes architecture.",
        "journal": "I enjoyed a cooking lesson in the limits of structural soup."
      }
    ]
  },
  "hobby-gardening-one-leaf": {
    "body": "One new leaf has appeared in your shared growing space. You inspect it with the intensity of a parent at a graduation.",
    "choices": [
      {
        "label": "Keep to the actual care routine",
        "body": "You keep to the shared growing space’s care routine. The new leaf survives the intensity of your interest.",
        "journal": "I kept to the shared garden’s care routine after spotting a new leaf."
      },
      {
        "label": "Enjoy the small success",
        "body": "You enjoy the small success. The leaf does not need to be a metaphor for anything.",
        "journal": "I enjoyed one small success in the shared growing space."
      }
    ]
  },
  "hobby-running-hill": {
    "body": "You have just announced that running feels easier when the route introduces a hill.",
    "choices": [
      {
        "label": "Slow down and keep a sensible pace",
        "body": "You slow down and keep a sensible pace. The hill remains steep, but it stops being a personal argument.",
        "journal": "I slowed to a sensible pace on an unexpectedly persuasive hill."
      },
      {
        "label": "Walk the hill and enjoy the view",
        "body": "You walk the hill and enjoy the view. There is quite a lot to see when you are not glaring at the ground.",
        "journal": "I walked the hill and enjoyed the view."
      }
    ]
  },
  "hobby-swimming-lane": {
    "body": "During supervised swimming practice, you arrive at the lane rope with far more affection than intended.",
    "choices": [
      {
        "label": "Work on sighting carefully",
        "body": "You work carefully on sighting under supervision. The rope receives fewer surprise visits.",
        "journal": "I worked on sighting during supervised swimming practice."
      },
      {
        "label": "Take a sensible break",
        "body": "You take a sensible break at the side. It is easier to learn when you are ready to listen again.",
        "journal": "I took a sensible break after meeting the lane rope too closely."
      }
    ]
  },
  "hobby-writing-adverb": {
    "body": "A sentence in your writing practice has acquired three subordinate clauses and a deeply unnecessary weather report.",
    "choices": [
      {
        "label": "Cut it down to the thing you mean",
        "body": "You cut the weather report, two clauses and a phrase you had been quietly showing off about. The paragraph gets a fairer test.",
        "journal": "I cut my sprawling practice sentence down to what I meant."
      },
      {
        "label": "Save the ridiculous draft for yourself",
        "body": "You save the ridiculous draft for yourself. One day the weather report may be funny for the right reasons.",
        "journal": "I kept my ridiculous draft, unnecessary weather report and all."
      }
    ]
  },
  "hobby-pottery-handle": {
    "body": "The handle on your practice mug has ambitions far beyond the mug. It looks ready to pull a door.",
    "choices": [
      {
        "label": "Work on the join under supervision",
        "body": "Under supervision, you revise the join. For a moment it looks as though the handle and mug might finally agree on their relationship.",
        "journal": "I worked on the join of my ambitious mug handle under supervision."
      },
      {
        "label": "Appreciate an exceptionally grippable mistake",
        "body": "You enjoy an exceptionally grippable mistake. It has been a good afternoon to make something with your hands.",
        "journal": "I enjoyed making an exceptionally grippable pottery mistake."
      }
    ]
  },
  "hobby-singing-note": {
    "body": "You and the choir arrive at two different notes. Yours seems to have travelled further.",
    "choices": [
      {
        "label": "Listen and find the shared pitch",
        "body": "You listen to the shared pitch and try the phrase again. This time you give the choir a chance to find you.",
        "journal": "I listened carefully and tried to find the choir’s shared pitch."
      },
      {
        "label": "Smile and start the phrase again",
        "body": "You smile and start again. It feels good to belong to a group that leaves room for another attempt.",
        "journal": "I smiled and started the choir’s phrase again."
      }
    ]
  },
  "hobby-coding-button": {
    "body": "Your practice button now closes the very thing it was meant to open. At least it is decisive.",
    "choices": [
      {
        "label": "Read the error and fix one thing",
        "body": "You work through the error one piece at a time. The button eventually opens what it should. You resist congratulating it for the bare minimum.",
        "journal": "I debugged my practice button one problem at a time."
      },
      {
        "label": "Leave a note and take a break",
        "body": "You leave a useful note and take a break. Tomorrow’s version of you deserves a clue.",
        "journal": "I left a useful note in my coding practice and took a break."
      }
    ]
  },
  "hobby-fishing-reed": {
    "body": "Your supervised fishing session produces a convincing bite. You have caught the same reed twice.",
    "choices": [
      {
        "label": "Ask for help with the cast",
        "body": "You ask for help with the supervised cast. The reed is spared a third encounter.",
        "journal": "I asked for help with my cast during supervised fishing practice."
      },
      {
        "label": "Enjoy sitting by the water",
        "body": "You enjoy sitting by the water. The fish are under no obligation to improve the afternoon.",
        "journal": "I enjoyed sitting beside the water, whether the fish cooperated or not."
      }
    ]
  },
  "hobby-dancing-elbow": {
    "body": "Your feet follow the routine. Your elbow appears to have accepted a different booking.",
    "choices": [
      {
        "label": "Slow the movement down",
        "body": "You slow the movement down, then try the phrase in practice.",
        "journal": "I slowed my dance movement down and tried the phrase again."
      },
      {
        "label": "Enjoy being imperfect in company",
        "body": "You enjoy being imperfect in company. Your elbow is eventually persuaded to rejoin the routine.",
        "journal": "I enjoyed dancing imperfectly in company."
      }
    ]
  },
  "hobby-project-half": {
    "body": "Your project, “{project}”, has reached the part where the first excitement has worn off and the ending is still a rumour.",
    "choices": [
      {
        "label": "Choose one manageable next step",
        "body": "You choose one small next step. The project is still unfinished, but it no longer feels like a room you cannot find the door to.",
        "journal": "I chose a manageable next step for “{project}”."
      },
      {
        "label": "Take an evening off without abandoning it",
        "body": "You take the evening off. The work you have already done will still be there when you come back.",
        "journal": "I took an evening away from “{project}” without abandoning it."
      }
    ]
  },
  "hobby-friendly-rival": {
    "body": "{person} asks how your {subject} is going. Their own enthusiasm makes the question feel dangerously competitive.",
    "choices": [
      {
        "label": "Share the awkward bits, too",
        "body": "You share the awkward bits as well as the progress. {person} is easier to talk to when neither of you is keeping score.",
        "journal": "I shared the awkward parts of my hobby progress with {person}."
      },
      {
        "label": "Make your progress sound effortless",
        "body": "You explain how naturally it all comes to you. {person} stops sharing their own difficulties. You have won a conversation nobody was competing in.",
        "journal": "I made my hobby progress sound effortless and put distance between myself and {person}."
      }
    ]
  }
};

export function polishedLifestyleTemplate(template: LifestyleTemplate) {
  const copy = lifestyleCopyV2[template.id];
  const choice = (index: 0 | 1) => ({ ...template.choices[index], ...copy.choices[index], operations: template.choices[index].operations.map(operation => ({ ...operation, kind: operation.kind === 'pet-health' ? 'pet-comfort' as const : operation.kind === 'competition' ? 'discipline' as const : operation.kind })) });
  return { ...template, body: copy.body, choices: [choice(0), choice(1)] as const };
}
