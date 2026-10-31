/** Authored venue/access policies, not national legal or certification rules. */
export const legacyHobbyKinds = ['guitar', 'painting', 'photography', 'chess', 'reading', 'gaming', 'cooking', 'gardening'] as const;
export const hobbyKinds = ['guitar', 'painting', 'photography', 'chess', 'reading', 'gaming', 'cooking', 'gardening', 'running', 'swimming', 'writing', 'pottery', 'singing', 'coding', 'fishing', 'dancing'] as const;
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
  running: { name: 'Running', minAge: 6, feeBps: 1, description: 'A community running group, sensible pacing and borrowed bright vests.' },
  swimming: { name: 'Swimming', minAge: 6, feeBps: 4, description: 'Supervised pool sessions. Leave the heroic rescue scenes to trained people.' },
  writing: { name: 'Writing', minAge: 8, feeBps: 1, description: 'Library workshops, shared notebooks and a reason to finish the paragraph.' },
  pottery: { name: 'Pottery', minAge: 8, feeBps: 6, description: 'Shared clay, tools and kiln access. Uneven bowls remain perfectly valid bowls.' },
  singing: { name: 'Singing', minAge: 6, feeBps: 3, description: 'A local choir and practical lessons in finding the same note as everybody else.' },
  coding: { name: 'Coding', minAge: 8, feeBps: 2, description: 'Library computers and a small club for solving problems you may have created.' },
  fishing: { name: 'Fishing', minAge: 8, feeBps: 3, description: 'Supervised local sessions with shared tackle. The fish have made no promises.' },
  dancing: { name: 'Dancing', minAge: 6, feeBps: 3, description: 'An age-appropriate community dance class. Shared space, individual elbows.' },
} as const;
export const legacyOutingKinds = ['cinema', 'concert', 'museum', 'nightclub'] as const;
export const outingKinds = ['cinema', 'concert', 'museum', 'nightclub', 'theatre', 'comedy', 'park', 'aquarium', 'sports', 'festival'] as const;
export type OutingKind = typeof outingKinds[number];
export const outingContent = {
  cinema: { name: 'Go to the Movies', minAge: 6, feeBps: 4, energy: 1, description: 'A local screening and a seat away from ordinary errands.' },
  concert: { name: 'Go to a Concert', minAge: 10, feeBps: 15, energy: 3, description: 'Live music, a ticket and an evening out.' },
  museum: { name: 'Visit a Museum', minAge: 6, feeBps: 3, energy: 2, description: 'Exhibitions, objects and something worth asking about.' },
  nightclub: { name: 'Go Dancing', minAge: 18, feeBps: 10, energy: 8, description: 'An adults-only dance venue. Your admission does not buy drinks.' },
  theatre: { name: 'See a Play', minAge: 8, feeBps: 12, energy: 2, description: 'A local production, a shared gasp and an interval that matters.' },
  comedy: { name: 'See a Comedy Show', minAge: 18, feeBps: 8, energy: 2, description: 'An adult comedy room with a very confident person holding the microphone.' },
  park: { name: 'Spend Time at the Park', minAge: 6, feeBps: 0, energy: 2, description: 'Free local paths, a bench and something other than a screen.' },
  aquarium: { name: 'Visit an Aquarium', minAge: 6, feeBps: 6, energy: 2, description: 'Habitats, conservation exhibits and a fish that appears to recognise you.' },
  sports: { name: 'Watch a Sports Match', minAge: 8, feeBps: 8, energy: 3, description: 'A local match. Someone nearby has strong tactical opinions.' },
  festival: { name: 'Visit a Festival', minAge: 8, feeBps: 5, energy: 4, description: 'A community festival with performers and enough bunting to slow the wind.' },
} as const;
