import { ageOn, compareDates, fullName, type Person, type World } from '../model';
import { monthFrom } from '../calendar';
import { countries } from '../countries';
import { rules } from '../rules';
import { netWorth } from '../valuation';
import { accountFor, availableCash, charge, draw, fact } from './common';
import { activeTrip } from './travelSchemas';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { serviceAway } from './serviceSchemas';
import { activeRomance, recordMarriage, romanceReason, weddingBudgets, type Relationship, type RomanceLookups } from './relationships';
import { settleBackground } from './npcBudget';
import { npcWeddingChance, type NpcCourtship } from './npcCourtshipSchemas';

export const npcCourtshipLimits = { couples: 12, waitingMonths: 24, proposals: 1, pregnancies: 1 } as const;

/** One relationship pass, then bounded candidate checks; never search every pair of people. */
function context(world: World) {
  const known = new Set<string>(), partners = new Map<string, Relationship>(), parents = new Map<string, string[]>(), family = new Map<string, Set<string>>(), dependents = new Set<string>();
  for (const row of world.relationships) {
    if (row.from === world.activePersonId) known.add(row.to); else if (row.to === world.activePersonId) known.add(row.from);
    if (activeRomance(row)) { partners.set(row.from, row); partners.set(row.to, row); }
    if (row.roles.includes('parent')) { const ids = parents.get(row.to) ?? []; ids.push(row.from); parents.set(row.to, ids); }
    if (row.roles.some(role => role === 'parent' || role === 'guardian' || role === 'sibling')) {
      for (const [a, b] of [[row.from, row.to], [row.to, row.from]]) { const ids = family.get(a) ?? new Set<string>(); ids.add(b); family.set(a, ids); }
    }
    if (row.roles.some(role => role === 'parent' || role === 'guardian')) {
      const child = world.people[row.to];
      if (child && !child.died && ageOn(child, world.date) < rules[child.country].adultAge) dependents.add(row.from);
    }
  }
  for (const row of world.custody) if (!row.ended) { dependents.add(row.a); dependents.add(row.b); }
  const ancestry = new Map<string, Set<string>>();
  const ancestors = (id: string) => {
    const cached = ancestry.get(id); if (cached) return cached;
    const ids = new Set([id]); let frontier = [id];
    for (let depth = 0; depth < 4; depth++) { const next: string[] = []; for (const child of frontier) for (const parent of parents.get(child) ?? []) if (!ids.has(parent)) { ids.add(parent); next.push(parent); } frontier = next; }
    ancestry.set(id, ids); return ids;
  };
  const lookups: RomanceLookups = { partner: id => partners.get(id), closeFamily: (a, b) => family.get(a)?.has(b) || [...ancestors(a)].some(id => ancestors(b).has(id)) };
  return { known, partners, dependents, lookups };
}
type Context = ReturnType<typeof context>;
function pairCurrent(world: World, row: Relationship, ctx: Context) {
  const playerPartner = ctx.partners.get(world.activePersonId);
  return (row.romance === 'dating' || row.romance === 'engaged') && ctx.partners.get(row.from)?.id === row.id && ctx.partners.get(row.to)?.id === row.id && row.from !== world.activePersonId && row.to !== world.activePersonId && (!playerPartner || ![playerPartner.from, playerPartner.to].some(id => id === row.from || id === row.to)) && !world.people[row.from].died && !world.people[row.to].died;
}
function eligible(world: World, row: Relationship, ctx: Context) {
  if (!pairCurrent(world, row, ctx) || !ctx.known.has(row.from) || !ctx.known.has(row.to)) return false;
  const a = world.people[row.from], b = world.people[row.to];
  return !ctx.dependents.has(a.id) && !ctx.dependents.has(b.id) && [a, b].every(person => !person.legal.wanted && person.stats.health >= 25 && !activeTrip(world, person.id) && !hospitalized(world, person) && !isConfined(world, person) && !serviceAway(world, person.id)) && !romanceReason(world, b, a.id, ctx.lookups);
}
/** Read-only actual simple-ceremony quote: no settlement, random draws or account creation. */
export function npcWeddingQuote(world: World, a: Person, b: Person) {
  const fee = weddingBudgets(world, a)[0].amount, shareA = (fee + 1n) / 2n, shareB = fee / 2n;
  return { fee, shareA, shareB, currency: countries[a.country].currency, availableA: availableCash(accountFor(world, a)), availableB: availableCash(accountFor(world, b)) };
}

/** Observe real dating time, then at most one mutually chosen, fully paid wedding per year. */
export function npcCourtshipsYear(world: World) {
  const key = 'npc-courtships:' + world.date.year;
  if (world.actionCounts[key]) return;
  world.actionCounts[key] = 1;
  const ctx = context(world), relations = new Map(world.relationships.map(row => [row.id, row])), open = new Map<string, NpcCourtship>();
  for (const courtship of world.npcCourtships) {
    if (courtship.ended || courtship.marriageId) continue;
    const row = relations.get(courtship.relationshipId);
    if (!row || !pairCurrent(world, row, ctx)) {
      courtship.ended = { ...world.date };
      courtship.endReason = [courtship.a, courtship.b].some(id => world.people[id].died) ? 'death' : [courtship.a, courtship.b].includes(world.activePersonId) ? 'player-controlled' : 'separated';
    } else open.set(row.id, courtship);
  }
  const candidates = world.relationships.filter(row => pairCurrent(world, row, ctx) && ctx.known.has(row.from) && ctx.known.has(row.to)).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const offset = candidates.length ? ((world.date.year % candidates.length) + candidates.length) % candidates.length : 0;
  let proposed = world.npcCourtships.some(row => row.proposals.some(proposal => proposal.date.year === world.date.year));
  for (let index = 0; index < Math.min(candidates.length, npcCourtshipLimits.couples); index++) {
    const row = candidates[(offset + index) % candidates.length], a = world.people[row.from], b = world.people[row.to];
    if (ageOn(a, world.date) < rules[a.country].adultAge || ageOn(b, world.date) < rules[b.country].adultAge) continue;
    let courtship = open.get(row.id);
    if (!courtship) {
      courtship = { id: 'courtship_' + world.revision + '_' + world.npcCourtships.length, relationshipId: row.id, a: a.id, b: b.id, observedSince: { ...world.date }, lastChecked: { ...world.date }, observedCountryA: a.country, observedCountryB: b.country, ended: null, endReason: null, marriageId: null, proposals: [] };
      world.npcCourtships.push(courtship); open.set(row.id, courtship);
    }
    courtship.lastChecked = { ...world.date };
    if (proposed || compareDates(monthFrom(courtship.observedSince, npcCourtshipLimits.waitingMonths, courtship.observedSince.day), world.date) > 0 || !eligible(world, row, ctx)) continue;
    const through = world.date.year * 12 + world.date.month - 1;
    // Company pay must use its real monthly payroll. Existing company savings
    // remain spendable; this path never invents its employer's back wages.
    for (const person of [a, b]) if (!person.employment?.companyId) settleBackground(world, person, through);
    if (!eligible(world, row, ctx)) continue;
    const quote = npcWeddingQuote(world, a, b);
    if (quote.availableA < quote.shareA || quote.availableB < quote.shareB) continue;
    const chance = npcWeddingChance(row.trust), rollA = draw(world, 'npcs', 1, 100), rollB = draw(world, 'npcs', 1, 100), accepted = rollA <= chance && rollB <= chance;
    const proposal: NpcCourtship['proposals'][number] = { date: { ...world.date }, country: a.country, city: a.city, ...quote, wealthA: netWorth(world, a.id), wealthB: netWorth(world, b.id), trust: row.trust, chance, rollA, rollB, accepted, ledgerCursor: world.ledger.length, paymentAId: null, paymentBId: null, marriageId: null };
    courtship.proposals.push(proposal); proposed = true;
    if (!accepted) continue;
    charge(world, quote.shareA, 'npc-wedding', 'Wedding with ' + fullName(b), undefined, quote.currency, a); proposal.paymentAId = world.ledger.at(-1)!.id;
    charge(world, quote.shareB, 'npc-wedding', 'Wedding with ' + fullName(a), undefined, quote.currency, b); proposal.paymentBId = world.ledger.at(-1)!.id;
    const id = 'marriage_npc_' + world.revision + '_' + world.marriages.length;
    recordMarriage(world, a, b, row, id, quote.fee); proposal.marriageId = id; courtship.marriageId = id;
    fact(world, fullName(a) + ' and ' + fullName(b) + ' married after paying for their ceremony together.', 'relationships');
  }
}
