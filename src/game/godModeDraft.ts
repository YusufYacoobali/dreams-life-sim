import { type World } from './model';
import { type GodModeCommand, godModeAttributes, godModeSkills, godModeStats } from './godMode';
import { parseMoney } from './money';

export type GodModeDraft = {
  stats: Record<typeof godModeStats[number], string>;
  skills: Record<typeof godModeSkills[number], string>;
  attributes: Record<typeof godModeAttributes[number], string>;
  money: Record<string, { operation: 'set' | 'add' | 'subtract'; amount: string }>;
  relationships: Record<string, { strength: string; trust: string }>;
};
export function godModeDraft(world: World): GodModeDraft {
  const person = world.people[world.activePersonId];
  return {
    stats: Object.fromEntries(godModeStats.map(key => [key, String(person.stats[key])])) as GodModeDraft['stats'],
    skills: Object.fromEntries(godModeSkills.map(key => [key, String(person.skills[key])])) as GodModeDraft['skills'],
    attributes: { fertility: String(person.biology.fertility), grades: String(person.education.grades), publicImage: String(person.publicLife.image) },
    money: Object.fromEntries(world.accounts.filter(item => item.ownerId === person.id).map(item => [item.id, { operation: 'set', amount: '' }])),
    relationships: Object.fromEntries(world.relationships.filter(item => item.from === person.id || item.to === person.id).map(item => [item.id, { strength: String(item.strength), trust: String(item.trust) }])),
  };
}
export function draftCommands(world: World, draft: GodModeDraft): { commands: GodModeCommand[]; destructive: boolean } {
  const base = godModeDraft(world), commands: GodModeCommand[] = [];
  let destructive = false;
  const percent = (text: string) => {
    if (!/^\d{1,3}$/.test(text.trim()) || Number(text) > 100) throw new Error('Enter whole-number percentages from 0 to 100.');
    return Number(text);
  };
  for (const stat of godModeStats) {
    const value = percent(draft.stats[stat]);
    if (value === Number(base.stats[stat])) continue;
    commands.push({ type: 'stat', stat, value });
    destructive ||= stat === 'stress' ? value > Number(base.stats[stat]) : value < Number(base.stats[stat]);
  }
  for (const skill of godModeSkills) {
    const value = percent(draft.skills[skill]);
    if (value === Number(base.skills[skill])) continue;
    commands.push({ type: 'skill', skill, value }); destructive ||= value < Number(base.skills[skill]);
  }
  for (const attribute of godModeAttributes) {
    const value = percent(draft.attributes[attribute]);
    if (value === Number(base.attributes[attribute])) continue;
    commands.push({ type: 'attribute', attribute, value }); destructive ||= value < Number(base.attributes[attribute]);
  }
  for (const [accountId, edit] of Object.entries(draft.money)) {
    if (!edit.amount.trim()) continue;
    const account = world.accounts.find(item => item.id === accountId && item.ownerId === world.activePersonId);
    if (!account) throw new Error('This account is no longer available. Reload the values.');
    const amount = parseMoney(edit.amount, account.currency).minor;
    const balance = edit.operation === 'set' ? amount : account.cash + (edit.operation === 'subtract' ? -amount : amount);
    if (balance < account.lockedCash) throw new Error('The balance cannot be negative or fall below inheritance held in trust.');
    if (balance === account.cash) continue;
    commands.push({ type: 'money', accountId, ...edit }); destructive ||= balance < account.cash;
  }
  for (const [relationshipId, edit] of Object.entries(draft.relationships)) for (const field of ['strength', 'trust'] as const) {
    const value = percent(edit[field]), previous = base.relationships[relationshipId];
    if (!previous) throw new Error('This relationship is no longer available. Reload the values.');
    if (value === Number(previous[field])) continue;
    commands.push({ type: 'relationship', relationshipId, field, value }); destructive ||= value < Number(previous[field]);
  }
  return { commands, destructive };
}
