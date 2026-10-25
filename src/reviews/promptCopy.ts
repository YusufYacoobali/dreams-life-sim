/** Sequence-based copy stays unchanged while a saved offer is awaiting an answer. */
export const reviewPromptMessages = [
  'Enjoying your story? A quick store review helps more people discover Dreams. Thank you for playing!',
  "Thanks for spending time in Dreams. If you'd like to share what you think, a store review would mean a lot.",
  'Every life takes a different turn. Want to tell other players about yours? You can leave a store review.',
  "I'm building Dreams solo, and your thoughts help me keep improving it. Would you like to leave a store review?",
  'Your experience could help someone decide whether Dreams is their kind of game. Would you like to write a review?',
  'How has Dreams been treating you? If you feel like sharing, you can leave a review in the store.',
  'Thanks for making Dreams part of your day. Would you like to share your thoughts in a store review?',
  'A few words about your experience can help someone find their next game. Would you like to review Dreams?',
] as const;

export function reviewPromptMessage(offerSequence: number): string {
  const sequence = Number.isFinite(offerSequence) ? Math.max(1, Math.floor(offerSequence)) : 1;
  return reviewPromptMessages[(sequence - 1) % reviewPromptMessages.length];
}
