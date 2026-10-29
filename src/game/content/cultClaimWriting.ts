import type { CultClaimId } from './cultClaims';

/** These lines are bound into new offers; saved offers retain their own copy. */
export const cultClaimAdmissions: Record<CultClaimId, string> = {
  'green-moon': 'You own up to inventing the green moon. A follower holds the paint chart beside your face and asks if shame comes in this shade.',
  'future-letter': 'There is no letter from tomorrow. You confess, and someone suggests checking yesterday in case your genius is running late.',
  'world-reboot': 'Reality is staying. You admit you made up the reboot; a follower demands to speak to the universe’s manager.',
  'cosmic-refund': 'The fee relief never happened. You own the broken promise while a follower holds out a hand for the money.',
  'rain-receipt': 'Under a spotless sky, you concede that weather forecasting was not your gift. Someone offers to stand behind you with a watering can next time.',
  'last-picnic': 'You face the picnic crowd without the picnic you promised. An empty plate is passed forward for your apology.',
  'final-monday': '“There will be more Mondays,” you confess. A follower boos as if you personally invented them.',
  'hidden-answer': 'Your hidden answer turns out to be “I don’t know.” The inner circle looks relieved to stop pretending you are about to reveal it.',
  'quiet-answer': 'For once, you stop talking and acknowledge the discussions never happened. A follower starts answering you. You let them finish.',
  'animal-review': '“The animals haven’t endorsed me.” You point out that a pigeon relieving itself on your chair was not an official statement. A follower calls it your clearest feedback yet.',
  'kettle-oracle': 'Your oracle is a kettle. You come clean; someone nominates a toaster as your replacement.',
  'sleeping-talent': '“The workshop isn’t ready.” You offer an apology. Followers want an opening date you can keep.',
  'memory-garden': 'You apologise for failing to provide the memorial garden. Members ask what you intend to do for the people still waiting to use it.',
  'full-table': 'You apologise for failing to deliver the promised meal and help. A member asks what to tell the people waiting for dinner.',
  'dream-visitor': 'Nobody new stayed. You concede your dream got that part wrong. A follower suggests dreaming about someone with fewer escape plans.',
  'good-neighbour': 'The neighbours never got the gathering you promised. You apologise. One would still like to know whether enlightenment comes with parking.',
  'seven-signs': 'Counting the same sign twice was your idea. You acknowledge it while a follower holds up six fingers, then offers to go through it more slowly.',
  'perfect-weather': 'You abandon the perfect-weather claim under an umbrella held firmly over the organiser. They let you finish apologising before suggesting you move out of the rain.',
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
