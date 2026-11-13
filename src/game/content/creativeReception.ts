/** Public wording for the existing saved result tiers; outcomes remain unchanged. */
export function creativeReceptionLabel(category: string, tier: 'flop' | 'modest' | 'hit' | 'blockbuster'): string {
  if (category === 'independent-film' || category === 'studio-film') return { flop: 'Limited interest', modest: 'Modest release', hit: 'Box-office hit', blockbuster: 'Blockbuster' }[tier];
  if (category === 'series') return { flop: 'Limited audience', modest: 'Modest audience', hit: 'Popular series', blockbuster: 'Breakout series' }[tier];
  if (category === 'theatre') return { flop: 'Quiet run', modest: 'Modest run', hit: 'Successful run', blockbuster: 'Standout production' }[tier];
  if (category === 'commercial' || category === 'advertising') return { flop: 'Limited reach', modest: 'Modest response', hit: 'Successful campaign', blockbuster: 'Major campaign success' }[tier];
  return { flop: 'Limited interest', modest: 'Modest response', hit: 'Successful booking', blockbuster: 'Major success' }[tier];
}
