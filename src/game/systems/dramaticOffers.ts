import type { World } from '../model';
import type { BoundChoice, Pending } from '../runtime';
import type { EventTemplate } from '../content/eventTypes';
import { dramaticTemplates } from '../content/dramaticEvents';
import { EVENT_RARITY_WEIGHTS } from '../content/eventRarity';
import { offerPending } from '../pendingQueue';
import { IneligibleAction } from '../errors';
import { active, accountFor, availableCash, draw } from './common';
import { dramaticContext, type DramaticContext } from './dramaticContext';
import type { DramaticEffect, DramaticEventId } from './dramaticSchemas';
import { saleQuote } from './assetQuotes';

// Offering a choice must not import the command handlers that resolve it.
const sameBinding = (a: DramaticContext, b: DramaticEffect) => a.subjectId === b.subjectId && a.contextId === b.contextId && a.relatedId === b.relatedId && a.otherId === b.otherId && a.quote === b.quote;
export function currentDramaticContext(world: World, effect: DramaticEffect) { const c = dramaticContext(world, effect.eventId, effect.subjectId); return c && sameBinding(c, effect) ? c : undefined; }
export function dramaticChoiceReason(world: World, effect: DramaticEffect): string | undefined {
  if (!currentDramaticContext(world, effect)) return; // A changed situation resolves honestly and clears its saved decision.
  if (effect.eventId === 'dramatic-boss-criminal' && effect.choiceId === 'blackmail' && availableCash(accountFor(world, world.people[effect.subjectId])) < effect.quote! * 2n) return 'Your boss cannot pay that amount';
  if (effect.eventId === 'dramatic-unpaid-employees' && effect.choiceId === 'invest' && availableCash(accountFor(world)) < effect.quote!) return 'Insufficient available savings';
  if (effect.eventId === 'dramatic-cellmate-escape' && effect.choiceId === 'join' && world.actionCounts[world.activePersonId + ':legal:' + world.date.year + ':escape']) return 'You already attempted an escape this year';
  if (effect.eventId === 'dramatic-suspicious-property' && effect.choiceId === 'accept') {
    const asset = world.assets.find(row => row.id === effect.subjectId)!;
    if (availableCash(accountFor(world, active(world), asset.currency)) + saleQuote(world, asset, effect.quote).proceeds < 0n) return 'The sale cannot cover the mortgage and fees';
  }
}
export function bindDramaticEvent(world: World, template: EventTemplate, subjectId?: string): Extract<Pending, { kind: 'decision' }> {
  const c = dramaticContext(world, template.id, subjectId);
  if (!c) throw new IneligibleAction('The people or circumstances for this event are unavailable');
  const text = (s: string) => s.replace(/\{([A-Za-z]+)\}/g, (token, name: string) => c.names[name] ?? token);
  const { names: _names, personIds, ...binding } = c;
  const choices: BoundChoice[] = template.choices.map(choice => {
    const ruleVersion = ['dramatic-double-fiance', 'dramatic-athlete-doping'].includes(template.id) ? 2 : 1;
    const effect: DramaticEffect = { kind: 'dramatic-choice', ruleVersion, copyVersion: 25, eventId: template.id as DramaticEventId, choiceId: choice.id, ...binding };
    const disabledReason = dramaticChoiceReason(world, effect);
    return { id: choice.id, label: text(choice.label), effects: [effect], resultTitle: choice.title, resultBody: choice.result, journal: choice.journal, ...(disabledReason ? { disabledReason } : {}) };
  });
  return { kind: 'decision', id: 'event_' + world.date.year + '_' + template.id, templateId: template.id, title: text(template.title), body: text(template.body), illustration: template.illustration, personIds, choices };
}

/** Transient opportunities enter the existing queue at their normal priority. */
export function offerDramaticEvent(world: World, id: DramaticEventId, priority: number, opportunityId?: string, subjectId?: string): boolean {
  if (world.eventHistory.some(row => row.templateId === id && world.date.year - row.year < 5) || [world.pending, ...world.deferred.map(row => row.event)].some(row => row?.kind === 'decision' && row.templateId === id) || !dramaticContext(world, id, subjectId)) return false;
  const template = dramaticTemplates.find(row => row.id === id)!;
  if (draw(world, 'events', 1, 100) > EVENT_RARITY_WEIGHTS[template.rarity ?? 'common']) return false;
  const event = bindDramaticEvent(world, template, subjectId); if (opportunityId) event.id = opportunityId;
  offerPending(world, event, priority); world.eventHistory.push({ templateId: id, year: world.date.year });
  if (world.annual?.stage === 'months') world.annual.pausedForPlanning = true;
  return true;
}
