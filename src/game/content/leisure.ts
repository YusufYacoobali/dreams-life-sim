/** Authored venue/access policies, not national legal or certification rules. */
export const hobbyKinds = ['guitar', 'painting', 'photography', 'chess', 'reading', 'gaming', 'cooking', 'gardening'] as const;
export type HobbyKind = typeof hobbyKinds[number];
export const hobbyModes = ['community', 'lessons'] as const;
export const hobbyContent = {
  guitar: { name: 'Guitar', minAge: 6, feeBps: 6, description: 'Shared instruments and practice space. Build your own repertoire.' },
  painting: { name: 'Painting', minAge: 6, feeBps: 5, description: 'Workshop materials and room to make a colourful mistake.' },
  photography: { name: 'Photography', minAge: 8, feeBps: 7, description: 'Shared cameras, practical sessions and a different way of looking.' },
  chess: { name: 'Chess', minAge: 6, feeBps: 3, description: 'Community boards, practice games and enough time to think.' },
  reading: { name: 'Reading', minAge: 6, feeBps: 2, description: 'Borrowed books, a reading group and time to explore new ideas.' },
  gaming: { name: 'Video Games', minAge: 6, feeBps: 4, description: 'Shared controllers, age-appropriate games and a local gaming club.' },
  cooking: { name: 'Cooking', minAge: 8, feeBps: 7, description: 'Supervised cooking sessions with ingredients and shared equipment.' },
  gardening: { name: 'Gardening', minAge: 6, feeBps: 4, description: 'Shared growing space, tools and materials to learn how plants grow.' },
} as const;
export const outingKinds = ['cinema', 'concert', 'museum', 'nightclub'] as const;
export type OutingKind = typeof outingKinds[number];
export const outingContent = {
  cinema: { name: 'Go to the Movies', minAge: 6, feeBps: 4, energy: 1, description: 'A local screening and a seat away from ordinary errands.' },
  concert: { name: 'Go to a Concert', minAge: 10, feeBps: 15, energy: 3, description: 'Live music, a ticket and an evening out.' },
  museum: { name: 'Visit a Museum', minAge: 6, feeBps: 3, energy: 2, description: 'Exhibitions, objects and something worth asking about.' },
  nightclub: { name: 'Go Dancing', minAge: 18, feeBps: 10, energy: 8, description: 'An adults-only dance venue. Your admission does not buy drinks.' },
} as const;
