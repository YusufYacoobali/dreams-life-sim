import type { CrimeStoryConsequence, PrisonStoryConsequence, RomanceStoryConsequence } from '../systems/storyConsequenceSchemas';

/** Prospective only: binding copies these values; resolution never consults this map. */
export const crimeStoryConsequences: Readonly<Record<string, Readonly<Record<string, CrimeStoryConsequence>>>> = {
  'confidential-bio': { expose: 'investigation' },
  'informant-rumour': { expose: 'named-rival' },
  'lieutenant-campaign': { support: 'lieutenant', expose: 'withdraw-role' },
  'missing-member': { refuse: 'withdraw-role' },
  'member-exit': { refuse: 'named-rival' },
  'boss-accounting': { expose: 'leadership-objection' },
  'boss-favourite': { support: 'leadership-backing' },
  'loyalty-test': { refuse: 'leadership-objection' },
  'leadership-pressure': { expose: 'withdraw-role' },
};
export const prisonStoryConsequences: Readonly<Record<string, Readonly<Record<string, PrisonStoryConsequence>>>> = {
  'prison-invisible-border': { agree: 'repair', mock: 'rivalry' },
  'prison-letter-ordinary': { reply: 'send-letter' },
  'prison-visiting-clock': { listen: 'restore-contact', blame: 'pause-visits' },
  'prison-missing-mug': { explain: 'repair', insult: 'assault', staff: 'rivalry' },
  'prison-favour-interest': { promise: 'pledge-protection' },
  'prison-family-boundary': { honest: 'restore-contact', insist: 'pause-visits', listen: 'restore-contact' },
  'prison-rival-rumour': { specific: 'repair', threat: 'rivalry' },
  'prison-hearing-chair': { angry: 'work-suspension' },
  'prison-inspection-dignity': { rage: 'work-suspension' },
};
export const romanceStoryConsequences: Readonly<Record<string, Readonly<Record<string, RomanceStoryConsequence>>>> = {
  'romance-phone-face-down': { trust: 'repair-boundary', inspect: 'jealousy' },
  'romance-argument-footnotes': { read: 'repair-boundary', mine: 'repair-boundary', bin: 'marriage-discussion' },
  'romance-unfinished-apology': { own: 'repair-boundary', but: 'jealousy' },
  'romance-public-status': { clarify: 'affair-discussion', reassure: 'affair-discussion', evade: 'temporary-space' },
  'romance-museum-silence': { listen: 'repair-boundary', reopen: 'temporary-space' },
  'romance-wedding-album': { quiet: 'marriage-discussion', blame: 'marriage-discussion' },
  'romance-hobby-envy': { listen: 'repair-boundary', rank: 'temporary-space' },
  'romance-perfect-couple': { real: 'repair-boundary', perform: 'jealousy' },
  'romance-ex-accountability': { own: 'repair-boundary', deny: 'no-contact' },
  'romance-ex-closure': { boundary: 'no-contact' },
  'romance-ex-what-if': { real: 'repair-boundary', blame: 'no-contact' },
  'romance-ex-friendship': { slow: 'reconcile-request', no: 'no-contact' },
};
