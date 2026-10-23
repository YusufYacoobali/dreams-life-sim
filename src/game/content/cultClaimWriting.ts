import type { CultClaimId } from './cultClaims';

/** These lines are bound into new offers; saved offers retain their own copy. */
export const cultClaimAdmissions: Record<CultClaimId, string> = {
  'green-moon': 'You admit the moon was never going to turn green. A follower slowly puts away the paint chart and asks what else you guessed.',
  'future-letter': "You admit there is no letter from the future. A follower suggests asking someone from the present to answer them.",
  'world-reboot': 'You admit reality will not reboot on your instructions. Followers ask what they should do with the emergency backups.',
  'cosmic-refund': 'You admit the promised fee relief never arrived. A follower asks when they will see their money again.',
  'rain-receipt': 'You admit you could not make it rain. A follower points out that the forecast did not require a membership fee.',
  'last-picnic': "You admit you missed the picnic deadline. A follower holds out an empty plate for the apology.",
  'final-monday': 'You admit there will be more Mondays. The follower who booked Tuesday off would like you to stop predicting their working week.',
  'hidden-answer': "You admit there is no hidden answer. The inner circle looks relieved to stop pretending they are about to find it.",
  'quiet-answer': 'You admit you never held the promised discussions. A follower starts answering you. You let them finish.',
  'animal-review': "You admit the animals have not endorsed you. A follower points to the mess the pigeon left on your chair. “We did get one review.”",
  'kettle-oracle': 'You admit the kettle only makes tea. Someone asks how long you have suspected this.',
  'sleeping-talent': 'You admit you failed to provide the workshop. Followers still need somewhere to work. They ask you for an opening date you can keep.',
  'memory-garden': 'You apologise for failing to provide the memorial garden. Members ask what you intend to do for the people still waiting to use it.',
  'full-table': 'You admit you failed to provide the promised meal and help. A member asks what they should tell the people waiting for dinner.',
  'dream-visitor': "You admit nobody new has stayed. A follower suggests you watch the exit more closely in your next dream.",
  'good-neighbour': 'You admit you never held the gathering. The neighbours would still like an invitation and an answer about the parking.',
  'seven-signs': "You admit the seventh sign was a duplicate. A follower counts the remaining six out loud for you.",
  'perfect-weather': 'You admit the weather ignored your promise. The organiser holds the umbrella over themselves while you explain.',
};

/** Quiet failures go straight to the journal, so they need the player's voice. */
export const cultClaimFailureJournals: Record<CultClaimId, string> = {
  'green-moon': 'I reached my green-moon deadline with the moon unchanged.',
  'future-letter': 'I reached the deadline without the promised letter from the future.',
  'world-reboot': 'I missed the promised reality reboot. Followers questioned my claim.',
  'cosmic-refund': 'I failed to deliver the promised fee relief.',
  'rain-receipt': 'I predicted rain for our review and got a dry day.',
  'last-picnic': 'I missed the deadline for our promised picnic.',
  'final-monday': 'I reached another Monday after predicting the last one.',
  'hidden-answer': 'I reached the deadline without the hidden answer I promised.',
  'quiet-answer': 'I failed to hold the discussions I promised.',
  'animal-review': 'I failed to produce the animal endorsement I predicted.',
  'kettle-oracle': 'I reached the deadline without a revelation from the sacred kettle.',
  'sleeping-talent': 'I failed to provide the promised workshop by the deadline.',
  'memory-garden': 'I missed the deadline for the memorial garden members were waiting for.',
  'full-table': 'I failed to provide the shared meal and support I promised.',
  'dream-visitor': 'I reached my dream-visitor deadline without anyone new staying.',
  'good-neighbour': 'I failed to hold the gathering I promised the neighbours.',
  'seven-signs': 'I promised seven signs and ended up with six and a duplicate.',
  'perfect-weather': 'I failed to deliver the perfect weather I promised.',
};
