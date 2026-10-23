import type { World } from '../model';
import type { LedgerIndex } from '../ledgerIndex';
import { ageOn, compareDates } from '../personHelpers';
import { countries } from '../countries';
import { rules } from '../rules';
import { jobs } from '../content/jobs';
import { cultClaims } from '../content/cultClaims';
import { cultStories } from '../content/cultStories';
import {
  cultHeadquarters,
  cultRoleTitles,
  cultUpgradeIds,
} from '../content/cults';
import { cultCapacity, cultAmount } from './cultCore';
import { cultMonthNumber, type Cult } from './cultSchemas';
import { fullTimeCreator } from './creatorSchemas';
import { publicRoyalDuty } from './royaltySchemas';
import { campaignCommitment } from './politicsSchemas';
import { recordingCommitment } from './musicSchemas';
const unique = (rows: readonly unknown[]) => new Set(rows).size === rows.length;
function requireCult(condition: unknown, message: string): asserts condition {
  if (!condition) throw Error('Invalid cult: ' + message);
}
/** Reconcile bounded organisation books, personal receipts and saved story bindings. */
export function validateCults(world: World, ledger: LedgerIndex) {
  const usedIncidents = new Set<string>();
  if (!world.cults.length) {
    requireCult(
      !world.incidents.some((row) => row.offence === 'cult-fraud'),
      'unbound communal-funds offence',
    );
    return;
  }
  const now = cultMonthNumber(world),
    ids = new Set<string>(),
    leaders = new Set<string>(),
    receiptIds = new Set<string>(),
    allMembers = new Set<string>();
  const pending = [
    ...(world.pending ? [world.pending] : []),
    ...world.deferred.map((row) => row.event),
  ];
  for (const cult of world.cults) {
    const founder = world.people[cult.founderId],
      start = cult.started.year * 12 + cult.started.month - 1;
    requireCult(
      founder &&
        !ids.has(cult.id) &&
        cult.id.startsWith('cult_' + founder.id + '_'),
      'identity',
    );
    ids.add(cult.id);
    requireCult(
      cult.currency === countries[cult.country].currency &&
        countries[cult.country].cities.includes(cult.city) &&
        ageOn({ ...founder, died: null }, cult.started) >=
          rules[cult.country].adultAge,
      'founding country or age',
    );
    requireCult(
      compareDates(cult.started, world.date) <= 0 &&
        cult.lastMonth >= start &&
        cult.lastMonth <= now &&
        cult.monthsActive === cult.lastMonth - start,
      'monthly accrual boundary',
    );
    requireCult(
      unique(cult.doctrines) &&
        unique(cult.rules) &&
        unique(cult.upgrades) &&
        unique(cult.claimsMade) &&
        unique(cult.legalIncidents),
      'duplicate configuration',
    );
    requireCult(
      cult.names[0].date.year === cult.started.year &&
        compareDates(cult.names[0].date, cult.started) === 0 &&
        cult.names.at(-1)!.name === cult.name,
      'name history',
    );
    for (let i = 0; i < cult.names.length; i++)
      requireCult(
        compareDates(cult.names[i].date, cult.started) >= 0 &&
          compareDates(cult.names[i].date, world.date) <= 0 &&
          (!i || compareDates(cult.names[i].date, cult.names[i - 1].date) >= 0),
        'name chronology',
      );
    if (cult.status === 'active') {
      requireCult(
        cult.leaderId === cult.founderId &&
          !founder.died &&
          !cult.ended &&
          !leaders.has(founder.id),
        'active leadership',
      );
      leaders.add(founder.id);
      requireCult(
        cult.followers <= cultCapacity(cult) &&
          cult.followers >=
            cult.members.filter((row) => row.status === 'active').length,
        'real member capacity',
      );
      requireCult(
        founder.education.stage === 'none' &&
          (!founder.employment ||
            jobs.find((row) => row.id === founder.employment!.roleId)
              ?.partTime) &&
          !fullTimeCreator(world, founder.id) &&
          !publicRoyalDuty(world, founder.id) &&
          !campaignCommitment(world, founder.id) &&
          !recordingCommitment(world, founder.id) &&
          !world.businesses.some(
            (row) =>
              row.ownerId === founder.id &&
              row.status === 'active' &&
              row.ownerOperated,
          ) &&
          !world.careers.some(
            (row) => row.personId === founder.id && row.status === 'active',
          ) &&
          !world.serviceCareers.some(
            (row) =>
              row.personId === founder.id &&
              ['training', 'active'].includes(row.status),
          ),
        'conflicting full-time commitment',
      );
    } else
      requireCult(
        cult.leaderId === null &&
          cult.ended &&
          compareDates(cult.ended, cult.started) >= 0 &&
          compareDates(cult.ended, world.date) <= 0 &&
          cult.cash === 0n &&
          cult.arrears === 0n &&
          !cult.recovery,
        'closure settlement',
      );
    if (cult.status === 'deceased')
      requireCult(
        founder.died && compareDates(cult.ended!, founder.died) === 0,
        'founder death',
      );
    requireCult(
      cult.lastSceneMonth === null ||
        (cult.lastSceneMonth >= start && cult.lastSceneMonth <= now),
      'scene date',
    );
    requireCult(
      unique(cult.members.map((row) => row.personId)),
      'inner-circle identity',
    );
    const roles = new Set<string>(),
      memoryIds = new Set<string>();
    for (const member of cult.members) {
      const person = world.people[member.personId];
      requireCult(
        person &&
          person.id !== founder.id &&
          !allMembers.has(person.id) &&
          compareDates(member.joined, cult.started) >= 0 &&
          compareDates(member.joined, world.date) <= 0,
        'named follower',
      );
      allMembers.add(person.id);
      requireCult(
        world.relationships.some(
          (row) =>
            (row.from === founder.id && row.to === person.id) ||
            (row.to === founder.id && row.from === person.id),
        ),
        'real follower relationship',
      );
      if (member.status === 'active') {
        requireCult(
          cult.status === 'active' && !person.died && !member.ended,
          'active follower',
        );
        if (member.role !== 'adviser') {
          requireCult(
            !roles.has(member.role),
            'duplicate leadership responsibility',
          );
          roles.add(member.role);
        }
      } else
        requireCult(
          member.ended &&
            compareDates(member.ended, member.joined) >= 0 &&
            compareDates(member.ended, world.date) <= 0,
          'former follower date',
        );
      if (member.status === 'deceased')
        requireCult(
          person.died && compareDates(member.ended!, person.died) === 0,
          'follower death',
        );
      requireCult(
        !member.resident ||
          (member.status === 'active' && cult.upgrades.includes('residences')),
        'residential quarters',
      );
      for (const memory of member.memories) {
        requireCult(
          !memoryIds.has(memory.id) &&
            memory.id.startsWith('cult_memory_' + cult.id + '_') &&
            memory.month >= member.joined.year * 12 + member.joined.month - 1 &&
            memory.month <= now,
          'follower memory',
        );
        memoryIds.add(memory.id);
      }
    }
    let previousTier = -1,
      paidForHeadquarters = 0n;
    for (const hq of cult.headquartersHistory) {
      const tier = cultHeadquarters.findIndex(
        (row) => row.id === hq.headquarters,
      );
      requireCult(
        tier > previousTier &&
          compareDates(hq.date, cult.started) >= 0 &&
          compareDates(hq.date, world.date) <= 0,
        'headquarters chronology',
      );
      const prior =
        previousTier < 0 ? 0 : cultHeadquarters[previousTier].costBps;
      requireCult(
        hq.paid === cultAmount(cult, cultHeadquarters[tier].costBps - prior),
        'headquarters purchase',
      );
      paidForHeadquarters += hq.paid;
      previousTier = tier;
    }
    requireCult(
      cult.headquartersHistory.at(-1)!.headquarters === cult.headquarters &&
        paidForHeadquarters <= cult.expenses &&
        cult.upgrades.every((id) => cultUpgradeIds.includes(id)),
      'headquarters accounting',
    );
    const totals = { ...cult.bookBase },
      bookIds = new Set<string>();
    let lastSequence = -1;
    requireCult(
      totals.cashDelta ===
        totals.capital +
          totals.income -
          totals.expenses -
          totals.payouts -
          totals.distribution -
          totals.misuse,
      'archived book balance',
    );
    for (const row of cult.book) {
      requireCult(
        !bookIds.has(row.id) &&
          row.id === 'cult_txn_' + cult.id + '_' + row.sequence &&
          row.sequence > lastSequence &&
          row.sequence < cult.sequence &&
          compareDates(row.date, cult.started) >= 0 &&
          compareDates(row.date, world.date) <= 0,
        'book identity or date',
      );
      bookIds.add(row.id);
      lastSequence = row.sequence;
      requireCult(
        row.kind === 'capital' || row.kind === 'income'
          ? row.delta > 0n
          : row.delta < 0n,
        'book direction',
      );
      totals.cashDelta += row.delta;
      totals.count++;
      if (row.kind === 'capital') totals.capital += row.delta;
      else if (row.kind === 'income') totals.income += row.delta;
      else if (row.kind === 'expense') totals.expenses -= row.delta;
      else if (row.kind === 'payout') totals.payouts -= row.delta;
      else if (row.kind === 'distribution') totals.distribution -= row.delta;
      else totals.misuse -= row.delta;
      const transfer =
        row.kind === 'capital' ||
        row.kind === 'payout' ||
        row.kind === 'misuse' ||
        row.category === 'member-reward';
      if (transfer) {
        const receipt =
          row.personalTransactionId &&
          ledger.transactions.get(row.personalTransactionId);
        requireCult(
          receipt &&
            row.personId === receipt.personId &&
            receipt.currency === cult.currency &&
            receipt.cashDelta === -row.delta &&
            receipt.debtDelta === 0n &&
            receipt.liabilityId === null &&
            receipt.year === row.date.year &&
            receipt.month === row.date.month,
          'two-sided transfer receipt',
        );
      } else
        requireCult(
          row.personId === null && row.personalTransactionId === null,
          'external receipt must not invent a person',
        );
    }
    requireCult(
      totals.cashDelta === cult.cash &&
        totals.capital === cult.capital &&
        totals.income === cult.income &&
        totals.expenses === cult.expenses &&
        totals.payouts === cult.payouts &&
        totals.distribution === cult.distribution &&
        totals.misuse === cult.misuse &&
        totals.count <= cult.sequence,
      'full financial reconciliation',
    );
    for (const [category, total, sign, founderOnly] of [
      ['cult-capital', cult.capital, -1, true],
      ['cult-leader-income', cult.payouts, 1, true],
      ['cult-misuse', cult.misuse, 1, true],
      ['cult-member-reward', cult.memberRewards, 1, false],
    ] as const) {
      const rows = ledger
        .categories(category)
        .filter((row) => row.description.startsWith(cult.id + ':'));
      let sum = 0n;
      for (const row of rows) {
        requireCult(
          !receiptIds.has(row.id) &&
            row.currency === cult.currency &&
            row.debtDelta === 0n &&
            row.liabilityId === null &&
            (sign === 1 ? row.cashDelta > 0n : row.cashDelta < 0n) &&
            (founderOnly
              ? row.personId === founder.id
              : cult.members.some(
                  (member) => member.personId === row.personId,
                )),
          'personal transfer identity',
        );
        receiptIds.add(row.id);
        sum += row.cashDelta * BigInt(sign);
      }
      requireCult(sum === total, 'personal transfer totals');
    }
    const registration = ledger
      .categories('cult-registration')
      .filter((row) => row.description.startsWith(cult.id + ':'));
    requireCult(
      registration.length === 1 &&
        registration[0].personId === founder.id &&
        registration[0].currency === cult.currency &&
        registration[0].cashDelta === -rules[cult.country].baseWage / 200n,
      'actual founding registration',
    );
    requireCult(
      cult.memberRewards <= cult.expenses && cult.payouts <= cult.income,
      'earned payout bounds',
    );
    let illegal = 0n;
    for (const id of cult.legalIncidents) {
      const incident = world.incidents.find((row) => row.id === id);
      requireCult(
        incident &&
          !usedIncidents.has(id) &&
          incident.offence === 'cult-fraud' &&
          incident.personId === founder.id &&
          incident.gain.currency === cult.currency &&
          incident.gain.minor > 0n,
        'actual financial offence',
      );
      usedIncidents.add(id);
      illegal += incident.gain.minor;
    }
    requireCult(illegal === cult.misuse, 'financial offence amount');
    requireCult(
      cult.report.year <= world.date.year &&
        cult.report.year >= cult.started.year &&
        cult.report.followers ===
          cult.report.openingFollowers +
            cult.report.gained -
            cult.report.lost &&
        cult.report.followers === cult.followers,
      'current membership report',
    );
    for (let i = 0; i < cult.years.length; i++)
      requireCult(
        cult.years[i].year < cult.report.year &&
          (!i || cult.years[i].year > cult.years[i - 1].year) &&
          cult.years[i].followers ===
            cult.years[i].openingFollowers +
              cult.years[i].gained -
              cult.years[i].lost,
        'annual reports',
      );
    for (let i = 0; i < cult.months.length; i++)
      requireCult(
        cult.months[i].month > start &&
          cult.months[i].month <= cult.lastMonth &&
          (!i || cult.months[i].month > cult.months[i - 1].month),
        'monthly history',
      );
    const threadIds = new Set<string>();
    let activeClaims = 0,
      activeCallbacks = 0;
    for (const thread of cult.threads) {
      requireCult(
        !threadIds.has(thread.id) &&
          thread.id.startsWith('cult_thread_' + cult.id + '_') &&
          compareDates(thread.created, cult.started) >= 0 &&
          compareDates(thread.created, world.date) <= 0 &&
          thread.dueMonth >=
            thread.created.year * 12 + thread.created.month - 1 &&
          unique(thread.participantIds) &&
          thread.participantIds.every(
            (id) => id !== founder.id && !!world.people[id],
          ),
        'thread identity or participants',
      );
      threadIds.add(thread.id);
      if (thread.fulfilledMonth !== null)
        requireCult(
          thread.kind === 'claim' &&
            thread.fulfilledMonth >=
              thread.created.year * 12 + thread.created.month - 1 &&
            thread.fulfilledMonth <= now &&
            ['ceremony', 'support'].includes(
              cultClaims.find((row) => row.id === thread.templateId)?.test ??
                '',
            ),
          'recorded kept promise',
        );
      if (thread.kind === 'claim') {
        const definition = cultClaims.find(
          (row) => row.id === thread.templateId,
        );
        requireCult(
          definition &&
            cult.claimsMade.includes(definition.id) &&
            definition.doctrine === thread.doctrineId &&
            thread.approach !== 'none',
          'claim definition',
        );
        if (thread.status === 'scheduled' || thread.status === 'offered')
          activeClaims++;
      } else if (thread.kind === 'story') {
        const definition = cultStories.find(
          (row) => row.id === thread.templateId,
        );
        requireCult(
          definition &&
            thread.approach === 'none' &&
            thread.doctrineId === (definition.doctrine ?? null) &&
            thread.ruleId === (definition.rule ?? null),
          'authored story definition',
        );
      } else {
        requireCult(
          ['rival-return', 'recruiter-return', 'accusation-return'].includes(
            thread.templateId,
          ) &&
            thread.participantIds.length === 1 &&
            cult.members.some(
              (member) => member.personId === thread.participantIds[0],
            ),
          'callback identity',
        );
        if (thread.status === 'scheduled') activeCallbacks++;
      }
      if (thread.status === 'offered') {
        const event = pending.find(
          (row) => row.kind === 'decision' && row.id === thread.offerId,
        );
        requireCult(
          cult.status === 'active' &&
            thread.offerId === thread.id + '_offer_' + thread.postponements &&
            thread.settledMonth === null &&
            event?.kind === 'decision' &&
            event.templateId === 'cult-' + thread.templateId &&
            event.title === thread.title &&
            event.body === thread.body &&
            event.personIds.includes(founder.id) &&
            thread.participantIds.every((id) => event.personIds.includes(id)),
          'saved offer binding',
        );
        const choices =
          thread.kind === 'claim'
            ? ['admit', 'postpone', 'blame', 'withdraw']
            : [
                ...cultStories
                  .find((row) => row.id === thread.templateId)!
                  .choices.map((row) => row.id),
                'withdraw',
              ];
        requireCult(
          event.choices.length === choices.length &&
            unique(event.choices.map((row) => row.id)) &&
            event.choices.every(
              (choice) =>
                choices.includes(choice.id) &&
                choice.effects.length === 1 &&
                choice.effects[0].kind === 'cult-choice' &&
                choice.effects[0].cultId === cult.id &&
                choice.effects[0].threadId === thread.id &&
                choice.effects[0].offerId === thread.offerId &&
                choice.effects[0].choiceId === choice.id,
            ),
          'choice binding',
        );
      } else if (thread.status === 'scheduled')
        requireCult(
          cult.status === 'active' &&
            thread.settledMonth === null &&
            thread.offerId === null &&
            (thread.outcome === null ||
              (thread.outcome === 'postponed' && thread.postponements === 1)),
          'scheduled follow-up',
        );
      else
        requireCult(
          thread.offerId === null &&
            thread.settledMonth !== null &&
            thread.settledMonth >=
              thread.created.year * 12 + thread.created.month - 1 &&
            thread.settledMonth <= now &&
            (thread.status === 'cancelled'
              ? thread.outcome === 'cancelled'
              : ['success', 'failure'].includes(thread.outcome!)),
          'resolved follow-up',
        );
      requireCult(
        thread.baseline.followers <= 50000 &&
          thread.baseline.ceremonies <= cult.ceremonies &&
          thread.baseline.sermons <= cult.sermons,
        'promise baseline',
      );
    }
    requireCult(
      activeClaims <= 3 && activeCallbacks <= 8,
      'bounded outstanding stories',
    );
    for (const [id, month] of Object.entries(cult.storyLast))
      requireCult(
        cultStories.some((row) => row.id === id) &&
          month >= start &&
          month <= now,
        'story cooldown',
      );
    requireCult(unique(cult.rivals.map((row) => row.id)), 'rival identities');
    for (const rival of cult.rivals)
      requireCult(
        world.people[rival.leaderId] &&
          rival.leaderId !== founder.id &&
          (!rival.sourceMemberId ||
            (rival.sourceMemberId === rival.leaderId &&
              cult.members.some(
                (row) => row.personId === rival.sourceMemberId,
              ))) &&
          rival.history.length > 0 &&
          compareDates(rival.started, cult.started) >= 0 &&
          compareDates(rival.started, world.date) <= 0 &&
          rival.lastMonth >=
            rival.started.year * 12 + rival.started.month - 1 &&
          rival.lastMonth <= now &&
          (!world.people[rival.leaderId].died || rival.status === 'closed'),
        'persistent rival',
      );
    requireCult(
      unique(cult.scandals.map((row) => row.id)),
      'scandal identities',
    );
    for (const scandal of cult.scandals)
      requireCult(
        scandal.month >= start &&
          scandal.month <= now &&
          (scandal.resolvedMonth === null ||
            (scandal.resolvedMonth >= scandal.month &&
              scandal.resolvedMonth <= now)),
        'scandal history',
      );
  }
  for (const event of pending)
    if (event.kind === 'decision')
      for (const choice of event.choices)
        for (const effect of choice.effects)
          if (effect.kind === 'cult-choice')
            requireCult(
              world.cults.some(
                (cult) =>
                  cult.id === effect.cultId &&
                  cult.threads.some(
                    (thread) =>
                      thread.id === effect.threadId &&
                      thread.status === 'offered' &&
                      thread.offerId === event.id,
                  ),
              ),
              'orphan cult decision',
            );
  requireCult(
    world.incidents
      .filter((row) => row.offence === 'cult-fraud')
      .every((row) => usedIncidents.has(row.id)),
    'unbound financial offence',
  );
}
