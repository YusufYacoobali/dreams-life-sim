import type { World } from '../model';
import { countries } from '../countries';
import { isConfined } from './legalSchemas';
const compare = (a: World['date'], b: World['date']) => a.year - b.year || a.month - b.month || a.day - b.day;
export function validateLegal(world: World) {
  const month = world.date.year * 12 + world.date.month - 1;
  const theftAssets = new Map(world.assets.filter(asset => asset.stolen).map(asset => [asset.id, asset]));
  const incidents = new Map(world.incidents.map(item => [item.id, item])), cases = new Map(world.cases.map(item => [item.id, item])), sentences = new Map(world.sentences.map(item => [item.id, item]));
  if (incidents.size !== world.incidents.length || cases.size !== world.cases.length || sentences.size !== world.sentences.length) throw new Error('Duplicate legal identity');
  const future = (date: World['date']) => compare(date, world.date) > 0;
  for (const item of incidents.values()) {
    const person = world.people[item.personId], linked = item.caseId && cases.get(item.caseId);
    if (!person || compare(item.date, person.born) < 0 || future(item.date) || item.victimId === person.id || item.victimId && !world.people[item.victimId] || item.victimKilled && (!item.victimId || !world.people[item.victimId].died || item.offence !== 'homicide') || item.gain.currency !== countries[item.country].currency || item.restitution.currency !== item.gain.currency || item.caseId && (!linked || linked.incidentId !== item.id) || item.stage === 'charged' && (!linked || linked.status !== 'awaiting-trial') || item.stage === 'hidden' && item.caseId) throw new Error('Invalid crime incident');
  }
  for (const item of incidents.values()) if (item.stolenVehicle && (world.overhaulVersion !== 1 || item.offence !== 'vehicle-theft' || item.gain.minor !== 0n || theftAssets.get(item.stolenVehicle.assetId)?.stolen?.incidentId !== item.id)) throw new Error('Vehicle theft has no matching inventory record');
  for (const item of cases.values()) {
    const person = world.people[item.personId], source = incidents.get(item.incidentId), sentence = item.sentenceId && sentences.get(item.sentenceId);
    if (!person || !source || source.caseId !== item.id || source.personId !== item.personId || source.offence !== item.offence || source.country !== item.country || source.city !== item.city || compare(item.opened, source.date) < 0 || future(item.opened) || compare(item.hearing, item.opened) < 0 || [item.bail, item.counselFee, item.quotedFine, item.fine].some(value => value.currency !== countries[item.country].currency) || !!item.resolved !== (item.status !== 'awaiting-trial') || item.resolved && (future(item.resolved) || compare(item.resolved, item.opened) < 0) || item.detained && (item.status !== 'awaiting-trial' || !!person.died || person.legal.wanted) || item.bailState === 'held' && (item.status !== 'awaiting-trial' || !!person.died) || item.counsel === 'private' && !item.counselPaid || item.status === 'convicted' && !sentence || item.sentenceId && (!sentence || !sentence.caseIds.includes(item.id) || sentence.personId !== person.id) || item.status === 'awaiting-trial' && (item.plea || item.sentenceId || item.fine.minor || item.sentenceMonths)) throw new Error('Invalid court case');
    const fineDebt = item.fineDebtId && world.liabilities.find(debt => debt.id === item.fineDebtId);
    if (item.fineDebtId && (!fineDebt || fineDebt.ownerId !== item.personId || fineDebt.kind !== 'fine' || fineDebt.currency !== item.fine.currency || fineDebt.principal > item.fine.minor) || item.fineRefunded && (item.status !== 'dismissed' || fineDebt && fineDebt.principal !== 0n)) throw new Error('Invalid court fine');
  }
  const currentPeople = new Set<string>();
  for (const item of sentences.values()) {
    const person = world.people[item.personId], live = item.state === 'active' || item.state === 'escaped';
    if (!person || future(item.started) || item.servedMonths + item.creditedMonths > item.totalMonths || item.lastServedMonth > month || new Set(item.caseIds).size !== item.caseIds.length || item.caseIds.some(id => { const court = cases.get(id); return !court || court.personId !== person.id || court.sentenceId !== item.id || !['convicted', 'dismissed'].includes(court.status); }) || item.caseIds.reduce((sum, id) => sum + cases.get(id)!.sentenceMonths, 0) !== item.totalMonths || live && (!!person.died || currentPeople.has(person.id) || item.ended || item.releaseReason) || !live && (!item.ended || !item.releaseReason || future(item.ended) || compare(item.ended, item.started) < 0) || item.state === 'escaped' && !person.legal.wanted || item.state === 'active' && person.legal.wanted) throw new Error('Invalid prison sentence');
    if (live) currentPeople.add(person.id);
  }
  const remandKeys = new Set<string>(), credits = new Map<string, number>();
  for (const item of world.remand) {
    const key = item.personId + ':' + item.month;
    if (!world.people[item.personId] || remandKeys.has(key) || item.month > month || new Set(item.caseIds).size !== item.caseIds.length || item.caseIds.some(id => cases.get(id)?.personId !== item.personId) || item.usedBySentenceId && sentences.get(item.usedBySentenceId)?.personId !== item.personId) throw new Error('Invalid remand credit');
    remandKeys.add(key); if (item.usedBySentenceId) credits.set(item.usedBySentenceId, (credits.get(item.usedBySentenceId) ?? 0) + 1);
  }
  for (const item of sentences.values()) if ((credits.get(item.id) ?? 0) < item.creditedMonths) throw new Error('Sentence credit has no remand history');
  const inventory = new Set<string>(), gangs = new Map(world.gangs.map(item => [item.id, item]));
  if (gangs.size !== world.gangs.length) throw new Error('Duplicate group identity');
  for (const item of world.contraband) {
    if (!world.people[item.personId] || inventory.has(item.id) || future(item.acquired) || item.pricePaid.currency !== item.value.currency || world.people[item.personId].died && item.status === 'owned' || (item.kind === 'false-id') !== !!item.alias) throw new Error('Invalid illicit inventory'); inventory.add(item.id);
  }
  const activeAffiliations = new Set<string>();
  for (const item of gangs.values()) {
    if (!item.left) { const key = item.personId + ':' + item.kind; if (activeAffiliations.has(key)) throw new Error('Duplicate active underground affiliation'); activeAffiliations.add(key); }
    if (!world.people[item.personId] || future(item.joined) || item.left && (future(item.left) || compare(item.left, item.joined) < 0) || item.contactIds.some(id => !world.people[id] || id === item.personId) || new Set(item.contactIds).size !== item.contactIds.length || item.lastIncomeMonth > month || item.kind === 'prison' && (!item.sentenceId || sentences.get(item.sentenceId)?.personId !== item.personId) || item.kind === 'street' && item.sentenceId || !item.left && world.people[item.personId].legal.gangId !== item.id && !(world.overhaulVersion === 1 && item.kind === 'street' && world.gangs.some(g => g.personId === item.personId && g.kind === 'prison' && !g.left && g.id === world.people[item.personId].legal.gangId)) && !(world.overhaulVersion === 1 && item.kind === 'prison' && world.gangs.some(g => g.personId === item.personId && g.kind === 'street' && !g.left))) throw new Error('Invalid underground affiliation');
  }
  for (const person of Object.values(world.people)) {
    if (person.legal.gangId && (!gangs.has(person.legal.gangId) || gangs.get(person.legal.gangId)!.personId !== person.id || gangs.get(person.legal.gangId)!.left) || person.died && person.legal.wanted) throw new Error('Invalid personal legal state');
    if (person.employment && world.sentences.some(item => item.personId === person.id && item.state === 'active')) throw new Error('Prison sentence retains ordinary employment');
  }
  for (const item of world.custody) if (!item.ended && (isConfined(world, item.primaryId) || item.arrangement === 'shared' && (isConfined(world, item.a) || isConfined(world, item.b)))) throw new Error('Custody requires an available caregiver');
}
