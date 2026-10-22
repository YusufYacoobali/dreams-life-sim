import { ageOn, fullName, type World } from '../model';
import type { BoundChoice, Pending, RuntimeEffectRow } from '../runtime';
import type { EventTemplate } from '../content/eventTypes';
import { dramaticTemplates } from '../content/dramaticEvents';
import { EVENT_RARITY_WEIGHTS } from '../content/eventRarity';
import { offerPending } from '../pendingQueue';
import { IneligibleAction } from '../errors';
import { formatMoney } from '../money';
import { active, accountFor, availableCash, bounded, draw, post } from './common';
import { dramaticContext, type DramaticContext } from './dramaticContext';
import type { DramaticEffect, DramaticEventId } from './dramaticSchemas';
import { connectPerson, resolveSocial, relationFor } from './relationships';
import { createContact } from './npcs';
import { recordDopingUse } from './athleteDoping';
import { endFriendship } from './friendships';
import { hearCase, recordDramaticCorruption, resolveLegal } from './legal';
import { resolveBusiness } from './businesses';
import { completeAssetSale, saleQuote } from './assets';
import { brandDecision, gainPublicFame, resolveSocialMedia } from './social';
import { resolveCareer } from './careers';
export { dramaticContext } from './dramaticContext';

const sameBinding = (a: DramaticContext, b: DramaticEffect) => a.subjectId === b.subjectId && a.contextId === b.contextId && a.relatedId === b.relatedId && a.otherId === b.otherId && a.quote === b.quote;
function currentContext(world: World, effect: DramaticEffect) { const c = dramaticContext(world, effect.eventId, effect.subjectId); return c && sameBinding(c, effect) ? c : undefined; }
export function dramaticChoiceReason(world: World, effect: DramaticEffect): string | undefined {
  if (!currentContext(world, effect)) return; // A changed situation resolves honestly and clears its saved decision.
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
    const effect: DramaticEffect = { kind: 'dramatic-choice', ruleVersion, eventId: template.id as DramaticEventId, choiceId: choice.id, ...binding };
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

type Death = (world: World, personId: string, cause: string) => void;
export function resolveDramaticChoice(world: World, effect: DramaticEffect, death: Death) {
  const template = dramaticTemplates.find(row => row.id === effect.eventId);
  if (!template?.choices.some(row => row.id === effect.choiceId)) throw new IneligibleAction('Choose an available dramatic event option');
  const effects: RuntimeEffectRow[] = [], player = active(world), choice = effect.choiceId;
  const finish = (title: string, body: string) => ({ title, body, journal: title + ': ' + body, effects });
  const c = currentContext(world, effect);
  if (!c) return finish('The situation has changed', 'Too much has changed for this decision to go ahead. You make no payment or commitment.');
  const reason = dramaticChoiceReason(world, effect); if (reason) throw new IneligibleAction(reason);
  const row = (label: string, value: string, tone: RuntimeEffectRow['tone'] = 'neutral') => effects.push({ id: effect.eventId + '_' + effects.length, label, value, tone });
  const stat = (key: keyof typeof player.stats, delta: number, person = player) => { const before = person.stats[key]; person.stats[key] = bounded(before + delta); row((person.id === player.id ? '' : fullName(person) + ': ') + key, `${before} → ${person.stats[key]}`, person.stats[key] > before ? key === 'stress' ? 'negative' : 'positive' : key === 'stress' ? 'positive' : 'negative'); };
  const image = (delta: number) => { const before = player.publicLife.image; player.publicLife.image = bounded(before + delta); row('Public image', `${before} → ${player.publicLife.image}`, delta > 0 ? 'positive' : 'negative'); };
  const bond = (personId: string, strength: number, trust = 0) => { const edge = relationFor(world, player.id, personId)!; const before = edge.strength, beforeTrust = edge.trust; edge.strength = bounded(edge.strength + strength); edge.trust = bounded(edge.trust + trust); row(fullName(world.people[personId]) + ': bond / trust', `${before} / ${beforeTrust} → ${edge.strength} / ${edge.trust}`, strength + trust >= 0 ? 'positive' : 'negative'); };
  // Domain commands already journal their concrete actions. Consume their immediate
  // presentation result; genuine arrest/release decisions remain in the queue.
  const invoke = (action: () => void) => { action(); const pending = world.pending as Pending | null; if (pending?.kind === 'result') { effects.push(...pending.effects); world.pending = null; world.pendingPriority = 0; return pending; } };
  if (effect.eventId === 'dramatic-boss-criminal') {
    const boss = world.people[effect.subjectId];
    if (choice === 'report') {
      recordDramaticCorruption(world, boss.id, 0n, true); bond(boss.id, -35, -50); stat('respect', 8);
      return finish('The confession reaches the police', `${fullName(boss)} is arrested on a corruption charge. Your relationship collapses. The court will decide what the confession is worth.`);
    }
    const amount = effect.quote! * (choice === 'blackmail' ? 2n : 1n);
    post(world, -amount, 0n, 'corruption-payment', 'Paid for silence', null, boss); post(world, amount, 0n, 'crime-proceeds', 'Payment for silence');
    recordDramaticCorruption(world, player.id, amount, false, boss.id); bond(boss.id, choice === 'blackmail' ? -30 : -5, -20); stat('respect', -10); stat('stress', 12);
    row('Money received', formatMoney({ minor: amount, currency: accountFor(world).currency }), 'positive');
    return finish(choice === 'blackmail' ? 'A very expensive silence' : 'Your silence has a price', `${fullName(boss)} pays you. The balance looks better; your position looks worse. You are now involved in an unresolved corruption incident. An investigation could turn this windfall into evidence.`);
  }
  if (effect.eventId === 'dramatic-double-fiance' || effect.eventId === 'dramatic-dating-profile') {
    const partnerId = effect.contextId!, edge = relationFor(world, player.id, partnerId)!;
    if (effect.eventId === 'dramatic-double-fiance' && choice === 'dinner' && effect.ruleVersion === 2) {
      const partner = world.people[partnerId];
      const other = createContact(world, { age: ageOn(partner, world.date), gender: partner.attractedTo[draw(world, 'npcs', 0, partner.attractedTo.length - 1)], compatibleWith: partner.gender });
      connectPerson(world, other.id);
      const ally = relationFor(world, player.id, other.id)!;
      ally.kind = 'friend'; ally.roles = ['acquaintance', 'friend']; ally.strength = 60; ally.trust = 65;
      ally.memories.push('double-engagement-dinner:' + partner.id);
      connectPerson(world, other.id, partner.id);
      const betrayal = relationFor(world, partner.id, other.id)!;
      betrayal.romance = 'ex'; betrayal.strength = 10; betrayal.trust = 0;
      betrayal.memories.push('engagement-disclosed:' + world.date.year, 'engagement-ended-at-dinner:' + player.id);
      edge.memories.push('double-engagement-dinner:' + other.id);
      bond(partnerId, -40, -60); stat('stress', 12);
      invoke(() => resolveSocial(world, { type: 'breakup', personId: partnerId }));
      row('Engagement', 'Ended', 'negative'); row('New friend', fullName(other), 'positive');
      return finish('Two engagements end before dessert', `${fullName(other)} arrives wearing the matching ring. You compare dates. Your fiancé stops ordering. Both engagements end at the table; you and ${other.firstName} exchange numbers. They are now a friend you can contact, and their broken engagement stays in the relationship history.`);
    }
    if (choice === 'end') { invoke(() => resolveSocial(world, { type: 'breakup', personId: partnerId })); stat('happiness', -12); return finish('The engagement is over', `You ended your engagement to ${fullName(world.people[partnerId])}. Their ring can no longer reserve two futures.`); }
    const fiance = effect.eventId === 'dramatic-double-fiance';
    bond(partnerId, fiance ? choice === 'dinner' ? -30 : -20 : choice === 'admit' ? -15 : choice === 'old' ? -25 : -35, fiance ? -40 : choice === 'admit' ? -25 : choice === 'old' ? -40 : -45); stat('stress', fiance ? 10 : 8);
    const breakup = edge.romance !== 'married' && edge.strength <= 30;
    if (breakup) invoke(() => resolveSocial(world, { type: 'breakup', personId: partnerId }));
    return finish(fiance ? choice === 'dinner' ? 'A table for three, trust for none' : 'Two rings, fewer answers' : choice === 'admit' ? 'The truth lands badly' : choice === 'old' ? 'The profile is old. The argument is new.' : 'You blame the person holding the evidence', (fiance ? choice === 'dinner' ? 'The invitation is impossible to mistake for forgiveness. Your bond and trust take a severe hit.' : 'Your fiancé has answers for everything except why you should trust them. Your bond and trust fall.' : choice === 'admit' ? 'You tell the truth. Your partner believes this admission more readily than your previous promises. Bond and trust fall.' : choice === 'old' ? 'Your partner studies the recent photograph. The explanation costs you more bond and trust.' : 'You turn the accusation around. Your partner hears an answer anyway. Bond and trust fall sharply.') + (breakup ? ' The relationship has now ended.' : edge.romance === 'married' ? ' You remain married, with considerably less trust.' : ' You remain together, for now.'));
  }
  if (effect.eventId === 'dramatic-best-friend-secrets') {
    const friendId = effect.relatedId!, edge = relationFor(world, player.id, friendId)!;
    if (choice !== 'forgive') endFriendship(world, world.bestFriendships.find(row => row.id === effect.subjectId)!, 'choice', player.id);
    bond(friendId, choice === 'forgive' ? -15 : -80, choice === 'forgive' ? -35 : -100);
    if (choice !== 'forgive') {
      edge.roles = edge.roles.filter(role => role !== 'friend');
      if (!edge.roles.length) edge.roles.push('acquaintance');
      edge.kind = edge.roles.includes('parent') ? 'parent' : edge.roles.includes('guardian') ? 'guardian' : edge.roles.includes('sibling') ? 'sibling' : edge.roles.includes('coworker') ? 'coworker' : edge.roles.includes('classmate') ? 'classmate' : edge.roles.includes('teacher') ? 'teacher' : 'acquaintance';
    }
    if (choice === 'expose') image(-8); else stat('stress', choice === 'forgive' ? 5 : -3);
    return finish(choice === 'forgive' ? 'Still best friends, no longer trusted' : choice === 'expose' ? 'You become each other’s source' : 'The subscription has lost its subject', choice === 'forgive' ? 'The best-friend agreement remains active. Your forgiveness has not restored the lost bond or trust.' : 'You ended the best-friend agreement and ordinary friendship. The shared history remains.' + (choice === 'expose' ? ' Publicly retaliating also damaged your image.' : ''));
  }
  if (effect.eventId === 'dramatic-child-exam-scam') {
    const child = world.people[effect.subjectId];
    bond(child.id, choice === 'praise' ? 8 : choice === 'report' ? -15 : -5, choice === 'praise' ? 3 : -3);
    stat('discipline', choice === 'praise' ? -10 : choice === 'report' ? 10 : 7, child); stat('stress', choice === 'report' ? 10 : choice === 'stop' ? 4 : -3, child);
    return finish(choice === 'praise' ? 'The wrong lesson, enthusiastically learned' : choice === 'report' ? 'The school gets the message' : 'The business plan meets a parent', choice === 'praise' ? 'Your child beams. Apparently fraud runs in a supportive family. Your bond improves and their discipline falls; the spreadsheet is still only a projection.' : choice === 'report' ? 'You contact the school. Your child gains discipline and stress, loses trust in you, and suddenly stops leaving the spreadsheet open. There is no disciplinary ruling yet.' : 'You make them close the pitch. They gain discipline and stress, and your bond takes a small hit. For now, their empire fits inside a sulk.');
  }
  if (effect.eventId === 'dramatic-courtroom-defence') {
    const item = world.cases.find(row => row.id === effect.subjectId)!;
    effects.push(...hearCase(world, item.id, choice === 'advice' ? 'leniency' : choice === 'guilty' ? 'guilty' : 'not-guilty'));
    return finish(item.status === 'acquitted' ? 'The charge did not survive the hearing' : 'The court has decided', item.status === 'acquitted' ? 'The verdict is not guilty. You leave acquitted, with any held bail returned. For once, the room sounds better after someone else has finished speaking.' : `Guilty. The sentence is ${item.sentenceMonths} months and the fine is ${formatMoney(item.fine)}. Any remand credit is shown below; unpaid fines become debt. If you had a job, the conviction has ended it.`);
  }
  if (effect.eventId === 'dramatic-cellmate-escape') {
    const sentence = world.sentences.find(row => row.id === effect.subjectId)!;
    if (choice === 'join') { invoke(() => resolveLegal(world, { type: 'escape' }, death)); return finish(sentence.state === 'escaped' ? 'The napkin got one thing right' : 'The locked door had the stronger argument', sentence.state === 'escaped' ? 'You escaped. You are now wanted, your remaining sentence is paused, and the escape has its own legal record.' : 'The escape failed. Your prison behaviour fell and a new escape case is awaiting a hearing. Your original sentence continues.'); }
    bond(effect.contextId!, choice === 'report' ? -25 : -3, choice === 'report' ? -20 : 0);
    if (choice === 'report') { const before = sentence.behavior; sentence.behavior = bounded(sentence.behavior + 10); row('Prison behaviour', `${before} → ${sentence.behavior}`, 'positive'); } else stat('stress', -2);
    return finish(choice === 'report' ? 'The plan leaves through the proper door' : 'You decline the role of moving target', choice === 'report' ? 'Reporting the plan improved your prison behaviour record and damaged your relationship with the contact. Your sentence length did not change.' : 'You refused. No escape was attempted, and your sentence continues.');
  }
  if (effect.eventId === 'dramatic-accomplice-wire') {
    const source = world.incidents.find(row => row.id === effect.subjectId)!, gang = world.gangs.find(row => row.id === effect.contextId)!;
    if (choice === 'walk') { invoke(() => resolveLegal(world, { type: 'leave-gang' }, death)); return finish('You leave the conversation and the group', 'Your gang membership has ended. The unresolved robbery remains in your legal history and can still be investigated.'); }
    bond(effect.relatedId!, -20, -20);
    if (choice === 'confront') { gang.standing = bounded(gang.standing - 15); gang.rank = Math.min(3, Math.floor(gang.standing / 25)); row('Group standing', String(gang.standing), 'negative'); }
    else { source.evidence = bounded(source.evidence + 25); source.riskBps = Math.min(10000, source.riskBps + 2000); source.investigateMonth = Math.min(source.investigateMonth, world.date.year * 12 + world.date.month); row('Robbery evidence', String(source.evidence), 'negative'); }
    return finish(choice === 'confront' ? 'The buzzing stops being subtle' : 'You supply the missing details', choice === 'confront' ? 'They call you paranoid. You call the conversation finished. Your group standing and the contact’s trust fall; the robbery remains unresolved.' : 'You keep explaining. The robbery evidence grows stronger and its investigation moves closer. By the time you stop talking, the silence sounds expensive.');
  }
  if (effect.eventId === 'dramatic-unpaid-employees') {
    if (choice === 'invest') { invoke(() => resolveBusiness(world, { type: 'fund-business', businessId: effect.subjectId, amount: effect.quote! })); row('Capital contributed', formatMoney({ minor: effect.quote!, currency: accountFor(world).currency }), 'negative'); return finish('Your savings join the payroll queue', 'You transfer your savings into the company. It now has cash to meet its outstanding bills at the next monthly settlement. The wages remain owed until that payment goes through.'); }
    if (choice === 'cut') { invoke(() => resolveBusiness(world, { type: 'business-marketing', businessId: effect.subjectId, marketing: 'none' })); invoke(() => resolveBusiness(world, { type: 'business-payout-policy', businessId: effect.subjectId, payoutBps: 0 })); invoke(() => resolveBusiness(world, { type: 'dismiss-business-staff', businessId: effect.subjectId, employmentId: effect.relatedId! })); return finish('A smaller payroll, a real departure', 'You stopped marketing and owner payouts and dismissed one actual worker. Their contract ended; any severance is recorded in the company accounts. Existing unpaid wages remain owed.'); }
    stat('stress', 10); return finish('Another month on borrowed patience', 'You ask everyone to hold on. Your stress rises; company cash does not. The bills remain due, and three consecutive periods of unpaid obligations will close the business.');
  }
  if (effect.eventId === 'dramatic-suspicious-property') {
    if (choice === 'accept') { effects.push(...completeAssetSale(world, effect.subjectId, effect.quote!)); return finish('The strangest offer clears', 'The buyer pays twice your asking price. Fees and any mortgage take their share, and the property changes hands. You decide against asking one last question about the basement.'); }
    const asset = world.assets.find(row => row.id === effect.subjectId)!; asset.listing!.offer = null; asset.listing!.nextOfferMonth = world.date.year * 12 + world.date.month + 1;
    return finish(choice === 'explain' ? 'The buyer stops explaining' : 'The basement remains your problem', 'You declined this offer. You still own the listed property, and another buyer can appear after the normal waiting period. No sale proceeds were paid.');
  }
  if (effect.eventId === 'dramatic-dishonest-sponsor') {
    effects.push(...brandDecision(world, effect.subjectId, choice === 'accept'));
    if (choice === 'accept') image(-8); else if (choice === 'expose') { image(5); stat('respect', 5); }
    return finish(choice === 'accept' ? 'A contract with a miraculous lack of evidence' : choice === 'expose' ? 'You publish the script instead' : 'Your face stays off the bottle', choice === 'accept' ? 'You sign. Your public image falls before the first miracle has even been delivered. The deal requires two disclosed fitness posts a month for six months; payment follows delivery, with nothing upfront.' : choice === 'expose' ? 'You decline and share the pitch. Your public image and respect improve. The company will have to cure someone else’s imaginary divorce.' : 'You decline. Your face stays off the bottle, and no payment or posting obligation is created.');
  }
  if (effect.eventId === 'dramatic-funeral-stream') {
    const studio = world.creatorStudios.find(row => row.id === effect.subjectId)!, account = world.socialAccounts.find(row => row.id === studio.accountId)!;
    if (choice === 'end') { invoke(() => resolveSocialMedia(world, { type: 'social-routine', accountId: account.id, cadence: 'off', topic: account.topic, intent: account.intent })); bond(effect.otherId!, 8, 3); image(-3); return finish('You stop broadcasting', 'Your scheduled broadcasts are now off. The memorial post and its recorded income remain in history. Your family appreciates the response; sponsorship delivery obligations still apply unless you separately cancel the contract.'); }
    bond(effect.otherId!, choice === 'blame' ? -12 : -20, -15); image(choice === 'blame' ? -12 : -15);
    if (choice === 'blame') bond(effect.relatedId!, -30, -35);
    return finish(choice === 'blame' ? 'Your editor becomes the next casualty of the broadcast' : 'The advertisement outlives the silence', choice === 'blame' ? 'Your editor says they used the approved schedule. Your family hears you arguing about approvals at a memorial. Their bond and trust fall, your editor’s trust collapses, and your image suffers. The editor remains on your crew.' : 'You carry on. Your family notices you carrying on. Their bond and trust fall, along with your public image. The broadcasts and sponsorship continue.');
  }
  if (effect.eventId === 'dramatic-election-scandal') {
    image(choice === 'apologise' ? -8 : choice === 'deny' ? -18 : -25); stat('respect', choice === 'apologise' ? 3 : choice === 'deny' ? -8 : -12);
    return finish(choice === 'apologise' ? 'You ask the wallets to forgive you' : choice === 'deny' ? 'The recording remains inconveniently audible' : 'You give the campaign another recording', (choice === 'apologise' ? 'You apologise without trying to redefine “wallet”. Your image falls, but taking responsibility earns a little respect.' : choice === 'deny' ? 'You deny it. The recording plays again. Your image and respect fall.' : 'You attack the leaker. The insult gets a second news cycle, and your image and respect fall sharply.') + ' You remain in the race; those changed ratings will affect your final campaign period.');
  }
  const career = world.careers.find(row => row.id === effect.subjectId)!;
  if (effect.eventId === 'dramatic-athlete-doping') {
    if (choice === 'risk' && effect.ruleVersion === 2) {
      stat('health', -12);
      const beforeSkill = player.skills.sport; player.skills.sport = bounded(beforeSkill + 8);
      row('Sport skill', `${beforeSkill} → ${player.skills.sport}`, 'positive');
      recordDopingUse(world, career, effect.contextId!, effect.relatedId!);
      row('Drug check', 'Due next month');
      return finish('The shortcut has a laboratory waiting', 'Your sport skill rises and your health suffers. Nobody has exposed you, so your public image and athletic reputation are unchanged. A drug check is due next month. A positive result will cost you the contract and suspend you from professional athletics for twelve months.');
    }
    const before = career.reputation; career.reputation = bounded(before + (choice === 'refuse' ? 4 : choice === 'report' ? 8 : -15)); row('Career reputation', `${before} → ${career.reputation}`, choice === 'risk' ? 'negative' : 'positive');
    if (choice === 'risk') { stat('health', -12); const beforeSkill = player.skills.sport; player.skills.sport = bounded(beforeSkill + 8); row('Sport skill', `${beforeSkill} → ${player.skills.sport}`, 'positive'); image(-10); }
    else bond(effect.relatedId!, choice === 'report' ? -25 : -5, choice === 'report' ? -20 : 0);
    return finish(choice === 'risk' ? 'Your bloodstream pays the price' : choice === 'report' ? 'The offer reaches the organisation' : 'You leave the shortcut on the table', choice === 'risk' ? 'Your sport skill rises, but your health, career reputation and public image suffer. You keep your contract. The shortcut has already taken a payment you cannot put on expenses.' : choice === 'report' ? 'You report the offer. Your career reputation improves; the contact’s trust does not survive the gesture. Your contract and project continue.' : 'You refuse. Your career reputation improves and the contact cools towards you. You will have to get through the project using your own body.');
  }
  if (choice === 'walk') { invoke(() => resolveCareer(world, { type: 'leave-career', careerId: career.id })); return finish('You walk out of your own adaptation', 'You leave acting. Your employment ends and the active project is cancelled. The scandal remains in your history; at least you will not have to rehearse it.'); }
  invoke(() => resolveCareer(world, { type: 'career-focus', careerId: career.id, focus: choice === 'take' ? 'publicity' : 'craft' }));
  if (choice === 'take') { gainPublicFame(world, player, 3); image(-5); row('Public fame', String(player.stats.fame), 'positive'); } else { career.reputation = bounded(career.reputation - 5); row('Career reputation', String(career.reputation), 'negative'); }
  return finish(choice === 'take' ? 'You play the part you already researched' : 'The rewrite costs you goodwill', choice === 'take' ? 'You commit to the project and shift your career focus to publicity. Your fame rises and your public image falls. The audience may appreciate your research.' : 'You push back and shift your career focus to craft. The project continues, but your career reputation falls. Nobody has promised to remove the recognisable parts.');
}
