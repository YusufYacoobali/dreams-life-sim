import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { SaveRepository } from '../../src/persistence/repository';
import { activeOrganisation, eligibleMissionCrew, missionReason } from '../../src/game/systems/organisedCrime';
import { isConfined } from '../../src/game/systems/legalSchemas';
import { createContact } from '../../src/game/systems/npcs';
import { connectPerson } from '../../src/game/systems/relationshipContacts';
import { partnerRelation, relationFor } from '../../src/game/systems/relationshipQueries';
import { enableOverhaul } from '../../src/game/systems/overhaul';
import { romanceActionReason } from '../../src/game/systems/romanceDrama';
import { diskDatabase } from '../support/refinementSqlite';
import graduate from '../fixtures/v3-employed-graduate.json';

/** Every command is committed, physically closed and read through a fresh connection. */
async function journey(initial: World) {
  const folder = mkdtempSync(join(tmpdir(), 'dreams-refinement-journey-'));
  const file = join(folder, 'life.db');
  let { sqlite, driver } = diskDatabase(file), repository = new SaveRepository(driver), world = initial;
  const trace: GameCommand[] = [];
  await repository.initialise(); await repository.create(world);
  return {
    get world() { return world; }, trace,
    async act(command: GameCommand, rollback = false) {
      const before = world, expected = resolveCommand(before, command, true);
      const receipt = 'refinement:journey:' + before.revision;
      if (rollback) {
        const receipts = sqlite.prepare('SELECT count(*) AS n FROM receipts').get();
        sqlite.exec("CREATE TRIGGER reject_journey_receipt BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'journey storage failure'); END");
        await expect(repository.commit(expected, before.revision, receipt, command.type === 'advance')).rejects.toThrow('journey storage failure');
        expect(await repository.load(before.id)).toStrictEqual(before);
        expect(sqlite.prepare('SELECT count(*) AS n FROM receipts').get()).toEqual(receipts);
        expect(resolveCommand(await repository.load(before.id), command, true)).toStrictEqual(expected);
        sqlite.exec('DROP TRIGGER reject_journey_receipt');
      }
      await repository.commit(expected, before.revision, receipt, command.type === 'advance');
      if (rollback) expect(await repository.commit(expected, before.revision, receipt, command.type === 'advance')).toStrictEqual(expected);
      sqlite.close(); ({ sqlite, driver } = diskDatabase(file));
      repository = new SaveRepository(driver); await repository.initialise();
      world = await repository.load(before.id);
      expect(world).toStrictEqual(expected);
      trace.push(command);
      return world;
    },
    close() { sqlite.close(); rmSync(folder, { recursive: true, force: true }); },
  };
}

type Journey = Awaited<ReturnType<typeof journey>>;
async function settle(run: Journey) {
  let guard = 0;
  while ((run.world.pending || run.world.annual) && guard++ < 120) {
    const world = run.world, event = world.pending;
    if (event?.kind === 'decision') {
      const available = event.choices.filter(choice => !choiceUnavailable(world, choice));
      const choice = event.templateId === 'arrest'
        ? available.find(item => item.id === 'bail') ?? available.find(item => item.id === 'remand')
        : event.templateId === 'court-hearing'
          ? available.find(item => item.id === 'not-guilty')
          : available[0];
      if (!choice) throw new Error('No actual available response to ' + event.templateId);
      await run.act({ type: 'choose', eventId: event.id, choiceId: choice.id });
    } else if (event) await run.act({ type: 'acknowledge', resultId: event.id });
    else await run.act({ type: 'resume' });
  }
  expect(guard).toBeLessThan(120);
}

const styleJourneys = [
  { style: 'street-syndicate', mission: 'territory-dispute', seed: 42 },
  { style: 'fraud-network', mission: 'counterfeit-gala', seed: 314159 },
  { style: 'smuggling-ring', mission: 'unreliable-cargo', seed: 271828 },
] as const;

test.each(styleJourneys)('$style persists a seeded criminal career over at least three actual assignment years with named crew, rivals and genuine legal/financial consequences', async ({ style, mission, seed }) => {
  const initial = decodeWorld(JSON.stringify(graduate));
  initial.random.outcomes = seed;
  // Declared initial boundary fixture: an experienced adult, not patched results.
  initial.people[initial.activePersonId].legal.crimeSkill = 100;
  const run = await journey(initial);
  try {
    await run.act({ type: 'organised-join', style }); await settle(run);
    const gang = activeOrganisation(run.world)!, gangId = gang.id;
    const crewIds = gang.organised!.members.map(member => member.personId);
    const rivalId = gang.organised!.rivals[0].personId;
    const years = new Set<number>();
    let firstAssignment = true;
    for (let elapsed = 0; elapsed < 20 && years.size < 3; elapsed++) {
      for (let slot = 0; slot < 2; slot++) {
        const current = run.world, organisation = current.gangs.find(item => item.id === gangId)!;
        const approach = slot === 0 && eligibleMissionCrew(current, organisation).length ? 'crew-led' : 'cautious';
        if (missionReason(current, organisation, mission, approach)) break;
        const bank = current.accounts.map(account => ({ ...account })), ledgerStart = current.ledger.length;
        const eligible = eligibleMissionCrew(current, organisation).map(member => member.personId);
        await run.act({ type: 'organised-mission', gangId, mission, approach }, firstAssignment);
        firstAssignment = false;
        const saved = run.world.gangs.find(item => item.id === gangId)!.organised!.jobs.at(-1)!;
        const incident = run.world.incidents.find(item => item.id === saved.incidentId)!;
        years.add(saved.date.year);
        expect(saved.mission?.rulesVersion).toBe(2);
        expect(incident.organisedMission).toMatchObject({ rulesVersion: 2, style, gangId, jobId: saved.id, outcome: saved.mission!.outcome, participantIds: saved.participantIds });
        expect(saved.participantIds).toEqual(approach === 'crew-led' ? [current.activePersonId, ...eligible] : [current.activePersonId]);
        expect(incident.gain.minor).toBe(saved.proceeds);
        if (saved.transactionId) expect(run.world.ledger.find(row => row.id === saved.transactionId)).toMatchObject({ cashDelta: saved.proceeds, category: 'crime-proceeds' });
        if (saved.mission!.lossTransactionId) expect(run.world.ledger.find(row => row.id === saved.mission!.lossTransactionId)?.cashDelta).toBe(-saved.mission!.loss);
        for (const previous of bank) {
          const now = run.world.accounts.find(item => item.id === previous.id)!;
          const actual = run.world.ledger.slice(ledgerStart).filter(row => row.personId === previous.ownerId && row.currency === previous.currency).reduce((sum, row) => sum + row.cashDelta, 0n);
          expect(now.cash - previous.cash).toBe(actual);
        }
        await settle(run);
      }
      const current = run.world.gangs.find(item => item.id === gangId)!;
      const thisYear = current.organised!.jobs.filter(job => job.date.year === run.world.date.year);
      if (thisYear.length === 2 && !isConfined(run.world)) expect(() => resolveCommand(run.world, { type: 'organised-mission', gangId, mission, approach: 'cautious' })).toThrow(/Two criminal assignments/);
      if (years.size < 3) { await run.act({ type: 'advance' }); await settle(run); }
    }
    if (process.env.DREAMS_REFINEMENT_TRACE && years.size !== 3) process.stdout.write(JSON.stringify({ journey: style, initialOutcomeSeed: seed, assignedYears: [...years], end: run.world.date, lastReason: missionReason(run.world, run.world.gangs.find(item => item.id === gangId)!, mission, 'cautious'), actorHealth: run.world.people[initial.activePersonId].stats.health, playerCases: run.world.cases.filter(item => item.personId === initial.activePersonId).map(item => ({ offence: item.offence, status: item.status, sentenceMonths: item.sentenceMonths })) }) + '\n');
    expect(years.size).toBe(3);
    const final = run.world.gangs.find(item => item.id === gangId)!.organised!;
    expect([...years].at(-1)! - [...years][0]).toBeGreaterThanOrEqual(2);
    expect(final.members.map(member => member.personId)).toEqual(crewIds);
    expect(final.rivals.some(rival => rival.personId === rivalId)).toBe(true);
    expect(final.members.some(member => member.memories.some(memory => memory.startsWith('mission:')))).toBe(true);
    if (style === 'fraud-network') {
      expect(final.jobs.some(job => job.mission?.victimId && relationFor(run.world, initial.activePersonId, job.mission.victimId)?.memories.includes('crime-victim:' + job.incidentId))).toBe(true);
    } else expect(final.rivals.some(rival => rival.memories.length > 0) || final.jobs.some(job => job.mission?.rivalId === rivalId)).toBe(true);
    expect(final.jobs.every(job => final.jobs.filter(other => other.date.year === job.date.year).length <= 2)).toBe(true);
    for (const saved of final.jobs) {
      const incident = run.world.incidents.find(item => item.id === saved.incidentId)!;
      if (incident.caseId) expect(run.world.cases.find(item => item.id === incident.caseId)).toMatchObject({ incidentId: incident.id, offence: incident.offence, personId: initial.activePersonId });
    }
    validateWorld(run.world);
    if (process.env.DREAMS_REFINEMENT_TRACE) process.stdout.write(JSON.stringify({ journey: style, initialOutcomeSeed: seed, assignedYears: [...years], end: run.world.date, commands: run.trace.length, jobs: final.jobs.map(job => ({ id: job.id, year: job.date.year, outcome: job.mission!.outcome, participants: job.participantIds })), playerCases: run.world.cases.filter(item => item.personId === initial.activePersonId).map(item => ({ offence: item.offence, status: item.status })) }) + '\n');
  } finally { run.close(); }
}, 60000);

function couple(conflict = false) {
  const world = decodeWorld(JSON.stringify(graduate)); enableOverhaul(world);
  world.random.outcomes = conflict ? 0 : 421;
  const actor = world.people[world.activePersonId];
  actor.attractedTo = ['male', 'female', 'nonbinary'];
  const partner = createContact(world, { age: 25, gender: 'female', compatibleWith: actor.gender, country: actor.country, city: actor.city });
  partner.attractedTo = ['male', 'female', 'nonbinary']; partner.traits = conflict ? ['practical'] : ['kind'];
  connectPerson(world, partner.id);
  const relationship = relationFor(world, actor.id, partner.id)!;
  relationship.romance = 'dating'; relationship.kind = 'partner'; relationship.roles.push('partner');
  relationship.strength = 95; relationship.trust = conflict ? 25 : 95;
  return { world: validateWorld(world), partnerId: partner.id, relationshipId: relationship.id };
}

test('a happy seeded couple remains together through three genuine years, ordinary dates, bound scenes and cold SQLite reopening', async () => {
  const initial = couple(), run = await journey(initial.world);
  try {
    const firstYear = run.world.date.year;
    for (let year = 0; year < 3; year++) {
      await run.act({ type: 'ask-date', personId: initial.partnerId, activity: 'walk' }); await settle(run);
      await run.act({ type: 'advance' }); await settle(run);
      expect(partnerRelation(run.world)?.id).toBe(initial.relationshipId);
      expect(['dating', 'engaged', 'married']).toContain(partnerRelation(run.world)!.romance);
      expect(run.world.affairs).toEqual([]);
      expect(run.world.romanceOffers!.every(offer => !['breakup', 'divorce', 'discovery'].includes(offer.kind))).toBe(true);
    }
    expect(run.world.date.year - firstYear).toBe(3);
    const offers = run.world.romanceOffers!.filter(offer => offer.kind === 'story');
    expect(offers.every(offer => offers.filter(other => other.offered.year === offer.offered.year).length <= 1)).toBe(true);
    if (process.env.DREAMS_REFINEMENT_TRACE) process.stdout.write(JSON.stringify({ journey: 'happy-couple', initialOutcomeSeed: 421, years: 3, end: run.world.date, commands: run.trace.length, relation: partnerRelation(run.world)!.romance, affairs: run.world.affairs!.length, offers: offers.map(offer => ({ kind: offer.kind, date: offer.offered, choice: offer.choiceId })) }) + '\n');
  } finally { run.close(); }
}, 60000);

test('an actual affair, confession and breakup remain history while an ex considers reconciliation after two genuine years', async () => {
  const initial = couple(true), before = decodeWorld(encodeWorld(initial.world)), actor = before.people[before.activePersonId];
  const lover = createContact(before, { age: 26, gender: 'female', compatibleWith: actor.gender, country: actor.country, city: actor.city });
  lover.attractedTo = ['male', 'female', 'nonbinary']; lover.traits = ['impulsive'];
  connectPerson(before, lover.id); const bond = relationFor(before, actor.id, lover.id)!; bond.strength = bond.trust = 95;
  const run = await journey(validateWorld(before));
  try {
    const firstYear = run.world.date.year;
    await run.act({ type: 'romance-action', personId: lover.id, action: 'affair' }, true); await settle(run);
    const affair = run.world.affairs!.at(-1)!;
    expect(affair).toMatchObject({ actorId: actor.id, partnerId: initial.partnerId, loverId: lover.id, discovered: null });
    expect(affair.knownBy).not.toContain(initial.partnerId);
    await run.act({ type: 'romance-action', personId: initial.partnerId, action: 'confess' }); await settle(run);
    expect(relationFor(run.world, actor.id, initial.partnerId)?.romance).toBe('ex');
    expect(run.world.affairs!.find(item => item.id === affair.id)).toMatchObject({ discoveryReason: 'confession', endReason: 'confessed' });
    for (let year = 0; year < 2; year++) {
      for (const action of ['reach-out', 'discuss', 'apologise-ex'] as const) {
        if (!romanceActionReason(run.world, initial.partnerId, action)) { await run.act({ type: 'romance-action', personId: initial.partnerId, action }); await settle(run); }
      }
      await run.act({ type: 'advance' }); await settle(run);
    }
    expect(run.world.date.year - firstYear).toBe(2);
    if (romanceActionReason(run.world, initial.partnerId, 'reconcile')?.includes('no contact')) { await run.act({ type: 'romance-action', personId: initial.partnerId, action: 'allow-contact' }); await settle(run); }
    expect(romanceActionReason(run.world, initial.partnerId, 'reconcile')).toBeUndefined();
    await run.act({ type: 'romance-action', personId: initial.partnerId, action: 'reconcile' });
    const relation = relationFor(run.world, actor.id, initial.partnerId)!;
    expect(['ex', 'dating']).toContain(relation.romance);
    expect(relation.memories).toContain((relation.romance === 'dating' ? 'reconciled:' : 'reconciliation-refused:') + run.world.date.year);
    expect(run.world.affairs!.find(item => item.id === affair.id)).toMatchObject({ actorId: actor.id, partnerId: initial.partnerId, loverId: lover.id, discoveryReason: 'confession', endReason: 'confessed' });
    expect(run.world.marriages).toEqual(before.marriages);
    validateWorld(run.world);
    if (process.env.DREAMS_REFINEMENT_TRACE) process.stdout.write(JSON.stringify({ journey: 'affair-and-ex', initialOutcomeSeed: 0, years: 2, end: run.world.date, commands: run.trace.length, affairId: affair.id, relationship: relation.romance, history: relation.memories }) + '\n');
  } finally { run.close(); }
}, 60000);
