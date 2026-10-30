import type { World } from '../model';
import { compareDates } from '../personHelpers';
import { prisonStories } from '../content/prisonStories';
import { indexLedger, type LedgerIndex } from '../ledgerIndex';

/** Cross-record checks retain historical people and saved story revisions verbatim. */
export function validatePrison(world: World, ledgerIndex?: LedgerIndex): void {
  const lives = world.prisonLives ?? [], ids = new Set<string>(), sentences = new Set<string>();
  if (!lives.length) {
    for (const event of [world.pending, ...world.deferred.map(item => item.event)]) if (event?.kind === 'decision' && event.choices.some(choice => choice.effects.some(effect => effect.kind === 'prison-story'))) throw new Error('Prison pending decision lost its original situation');
    return;
  }
  const pending = [world.pending, ...world.deferred.map(item => item.event)].filter(item => item?.kind === 'decision');
  const ledger = lives.some(life => life.familyContacts.some(item => item.amount > 0n)) ? (ledgerIndex ?? indexLedger(world.ledger)).transactions : new Map();
  const future = (date: World['date']) => compareDates(date, world.date) > 0;
  for (const life of lives) {
    const actor = world.people[life.personId], sentence = world.sentences.find(item => item.id === life.sentenceId);
    if (!actor || !sentence || sentence.personId !== actor.id || ids.has(life.id) || sentences.has(sentence.id) || life.lastStoryYear > world.date.year) throw new Error('Invalid prison-life identity');
    ids.add(life.id); sentences.add(sentence.id);
    const contacts = new Set<string>(), records = new Set<string>(), stories = new Set<string>();
    for (const contact of life.contacts) {
      if (!world.people[contact.personId] || contact.personId === actor.id || contacts.has(contact.personId)) throw new Error('Invalid saved prison contact');
      contacts.add(contact.personId);
    }
    for (const item of life.interactions) {
      if (records.has(item.id) || !contacts.has(item.personId) || future(item.date) || compareDates(item.date, sentence.started) < 0) throw new Error('Invalid prison interaction');
      records.add(item.id);
    }
    for (const item of life.familyContacts) {
      if (records.has(item.id) || !world.people[item.personId] || item.personId === actor.id || future(item.date) || compareDates(item.date, sentence.started) < 0 || item.amount > 0n && (item.action !== 'support' || !item.accepted || item.transactionIds.length !== 2) || item.amount === 0n && item.transactionIds.length) throw new Error('Invalid prison family contact');
      records.add(item.id);
      if (item.amount > 0n) {
        const debit = ledger.get(item.transactionIds[0]), credit = ledger.get(item.transactionIds[1]);
        if (!debit || !credit || debit.id === credit.id || debit.personId !== item.personId || credit.personId !== actor.id || debit.cashDelta !== -item.amount || credit.cashDelta !== item.amount || debit.currency !== credit.currency || debit.category !== 'prison-support-given' || credit.category !== 'prison-support-received' || debit.year !== item.date.year || debit.month !== item.date.month || credit.year !== item.date.year || credit.month !== item.date.month) throw new Error('Prison support has no conserved financial transfer');
      }
    }
    for (const scene of life.scenes) {
      if (scene.ruleVersion === 1 && (scene.context || scene.relationshipId || scene.participantRole || scene.choices.some(choice => choice.consequence)) || scene.ruleVersion === 2 && (!scene.context || scene.participantId && (!scene.relationshipId || !scene.participantRole))) throw new Error('Prison situation has incompatible versioned rules');
      if (scene.relationshipId) {
        const relation = world.relationships.find(item => item.id === scene.relationshipId);
        if (!relation || ![relation.from, relation.to].includes(actor.id) || !scene.participantId || ![relation.from, relation.to].includes(scene.participantId)) throw new Error('Prison situation lost its bound relationship');
      }
      for (const choice of scene.choices) if (choice.consequence && (['rivalry', 'repair', 'pledge-protection', 'assault'].includes(choice.consequence) && scene.context !== 'inmate' || ['pause-visits', 'restore-contact', 'send-letter'].includes(choice.consequence) && scene.context !== 'family')) throw new Error('Prison consequence has no eligible bound participant');
      if (records.has(scene.id) || stories.has(scene.templateId) || scene.personId !== actor.id || scene.sentenceId !== sentence.id || !prisonStories.some(item => item.id === scene.templateId) || !life.seenStoryIds.includes(scene.templateId) || scene.participantId && (!world.people[scene.participantId] || scene.participantId === actor.id) || future(scene.offered) || compareDates(scene.offered, sentence.started) < 0 || scene.resolved && (future(scene.resolved) || compareDates(scene.resolved, scene.offered) < 0) || scene.status === 'offered' && (scene.resolved || scene.choiceId) || scene.status === 'resolved' && (!scene.resolved || !scene.choiceId || !scene.choices.some(choice => choice.id === scene.choiceId)) || new Set(scene.choices.map(choice => choice.id)).size !== scene.choices.length) throw new Error('Invalid saved prison situation');
      records.add(scene.id); stories.add(scene.templateId);
      const offer = pending.find(item => item?.id === scene.id);
      if (scene.status === 'offered' && !offer) throw new Error('Prison situation lost its pending decision');
      if (offer?.kind === 'decision') {
        const liveIds = [actor.id, ...(scene.participantId ? [scene.participantId] : [])].filter(id => world.people[id] && !world.people[id].died);
        if (scene.status !== 'offered' || offer.templateId !== scene.templateId || offer.title !== scene.title || offer.body !== scene.body || offer.personIds.join('|') !== liveIds.join('|') || offer.choices.length !== scene.choices.length) throw new Error('Prison offer no longer matches its saved situation');
        for (const choice of offer.choices) {
          const saved = scene.choices.find(item => item.id === choice.id), effect = choice.effects[0];
          if (!saved || choice.effects.length !== 1 || effect.kind !== 'prison-story' || effect.prisonLifeId !== life.id || effect.sceneId !== scene.id || effect.choiceId !== choice.id || choice.label !== saved.label || choice.resultTitle !== scene.title || choice.resultBody !== saved.body || choice.journal !== saved.journal) throw new Error('Prison choice no longer matches its saved rule snapshot');
        }
      }
    }
    if (new Set(life.seenStoryIds).size !== life.seenStoryIds.length || life.seenStoryIds.some(id => !prisonStories.some(item => item.id === id))) throw new Error('Invalid prison story cooldown history');
  }
  for (const offer of pending) if (offer?.kind === 'decision') for (const choice of offer.choices) for (const effect of choice.effects) if (effect.kind === 'prison-story' && !lives.some(life => life.id === effect.prisonLifeId && life.scenes.some(scene => scene.id === effect.sceneId && scene.status === 'offered'))) throw new Error('Prison pending decision lost its original situation');
}
