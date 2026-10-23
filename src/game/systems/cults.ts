import type { World } from '../model';
import { fullName } from '../personHelpers';
import { countries } from '../countries';
import { rules } from '../rules';
import { formatMoney } from '../money';
import { fxMoney } from '../valuation';
import {
  cultCeremonies,
  cultHeadquarters,
  cultMemberRoles,
  cultPhilosophies,
  cultRecruitment,
  cultRoleTitles,
  cultUpgrades,
} from '../content/cults';
import { cultClaims } from '../content/cultClaims';
import { IneligibleAction } from '../errors';
import {
  accountFor,
  active,
  availableCash,
  bounded,
  charge,
  draw,
  post,
  result,
} from './common';
import { createContact } from './npcs';
import { connectPerson } from './relationships';
import { relationFor } from './relationshipQueries';
import {
  cultMonthNumber,
  type Cult,
  type CultCommand,
  type CultMember,
} from './cultSchemas';
import {
  cultActionReason,
  cultAmount,
  cultBill,
  cultBook,
  cultCapacity,
  cultCeremonyQuote,
  cultChangeFollowers,
  cultContribute,
  cultFeesReason,
  cultFoundingReason,
  cultHeadquartersQuote,
  cultLimit,
  cultMemberPayment,
  cultMemberTrust,
  cultMemory,
  cultMoney,
  cultModifiers,
  cultPayoutAvailable,
  cultRecord,
  cultRecruitQuote,
  cultRewardQuote,
  cultScandal,
  cultSpend,
  cultStartupQuote,
  cultUpgradeQuote,
  ownedCult,
} from './cultCore';
import { closeCult } from './cultLifecycle';
import {
  cultMemberLeaves,
  newCultThread,
  recordCultCeremonyPromises,
  scheduleCultCallback,
} from './cultThreads';
export { cultCommandSchema, type CultCommand } from './cultSchemas';
export {
  cultFoundingReason,
  cultStartupQuote,
  cultActionReason,
  cultCapacity,
  cultPayoutAvailable,
  cultFeeOptions,
  cultRecruitQuote,
  cultCeremonyQuote,
  cultHeadquartersQuote,
  cultUpgradeQuote,
  cultRewardQuote,
} from './cultCore';
export function addCultMember(
  world: World,
  cult: Cult,
  role: CultMember['role'],
) {
  if (
    cult.members.length >= 5 ||
    cult.members.some((row) => row.status === 'active' && row.role === role)
  )
    return;
  const person = createContact(world, {
    age: draw(world, 'npcs', 22, 48),
    country: cult.country,
    city: cult.city,
  });
  connectPerson(world, person.id);
  const member: CultMember = {
    personId: person.id,
    role,
    joined: { ...world.date },
    ended: null,
    status: 'active',
    personality: (
      ['earnest', 'practical', 'showy', 'sceptic', 'opportunist'] as const
    )[draw(world, 'npcs', 0, 4)],
    loyalty: draw(world, 'events', 50, 75),
    ambition: draw(world, 'events', 15, 65),
    grievance: 0,
    resident: cult.upgrades.includes('residences'),
    memories: [],
  };
  cult.members.push(member);
  const relation = relationFor(world, cult.founderId, person.id);
  if (relation) relation.strength = Math.max(45, relation.strength);
  cultMemory(
    world,
    cult,
    member,
    'joined',
    'I joined ' + cult.name + ' as ' + cultRoleTitles[role].toLowerCase() + '.',
  );
  return member;
}
export function cultClaimReason(
  cult: Cult,
  id: (typeof cultClaims)[number]['id'],
) {
  const definition = cultClaims.find((row) => row.id === id)!;
  if (
    cult.philosophy !== definition.philosophy &&
    !cult.doctrines.includes(definition.doctrine)
  )
    return (
      'Requires ' +
      cultPhilosophies.find((row) => row.id === definition.philosophy)!.title +
      ' or its related doctrine'
    );
  if (
    cult.threads.filter(
      (row) =>
        row.kind === 'claim' && ['scheduled', 'offered'].includes(row.status),
    ).length >= 3
  )
    return 'Resolve a current promise first';
  if (cult.claimsMade.includes(id)) return 'You have already made this claim';
}
export const cultRivalQuote = (
  cult: Cult,
  action: 'challenge' | 'publicity' | 'alliance' | 'reconcile' | 'ignore',
) =>
  cultAmount(
    cult,
    { challenge: 40, publicity: 60, alliance: 35, reconcile: 15, ignore: 0 }[
      action
    ],
  );
export const cultRecoveryQuote = (
  cult: Cult,
  action:
    | 'apologise'
    | 'transparent'
    | 'open-gathering'
    | 'replace-deputy'
    | 'ignore'
    | 'rebrand',
) =>
  cultAmount(
    cult,
    {
      apologise: 10,
      transparent: 40,
      'open-gathering': 65,
      'replace-deputy': 10,
      ignore: 0,
      rebrand: 100,
    }[action],
  );
const sermons: Record<Cult['philosophy'], string> = {
  'dream-archive':
    'I spoke about our dreams and the lives they might have belonged to.',
  'final-update':
    'I discussed the supposed update to reality. We also agreed to update the meeting calendar.',
  'cosmic-accounting':
    'I spoke about what we owed one another, rather than what the universe owed me.',
  'last-picnic':
    'I spoke about looking after one another before worrying about the end of the world.',
  'chosen-lost':
    'I asked what made our hidden knowledge useful to anyone outside the room.',
  'eternal-self':
    'I spoke about knowing ourselves without expecting everyone else to do the work.',
  'quiet-orbit':
    'I left space for the quiet members to speak about what they had noticed.',
  'ordinary-miracles':
    'I asked members to describe an ordinary thing that had mattered to them.',
};
export function resolveCult(world: World, command: CultCommand) {
  const person = active(world);
  if (command.type === 'found-cult') {
    const reason =
      cultFoundingReason(world, command.headquarters) ||
      cultFeesReason(person.country, command.joiningFee, command.recurringFee);
    if (reason) throw new IneligibleAction(reason);
    if (
      new Set(command.doctrines).size !== 2 ||
      new Set(command.rules).size !== 2
    )
      throw new IneligibleAction(
        'Choose two different doctrines and two different rules',
      );
    const quote = cultStartupQuote(world, command.headquarters);
    if (command.quotedCost !== quote.total)
      throw new IneligibleAction('The founding quote changed');
    const start =
        command.method === 'social'
          ? 12
          : command.method === 'gathering'
            ? 9
            : 6,
      followers = start + draw(world, 'events', 0, 4),
      loyalty =
        command.method === 'gathering'
          ? 68
          : command.method === 'social'
            ? 52
            : 60;
    const cult: Cult = {
      id: 'cult_' + person.id + '_' + world.revision,
      founderId: person.id,
      leaderId: person.id,
      name: command.name,
      leaderTitle: command.leaderTitle,
      country: person.country,
      city: person.city,
      currency: quote.currency,
      started: { ...world.date },
      ended: null,
      status: 'active',
      lastMonth: cultMonthNumber(world),
      lastSceneMonth: null,
      monthsActive: 0,
      sequence: 0,
      philosophy: command.philosophy,
      doctrines: command.doctrines,
      rules: command.rules,
      foundingMethod: command.method,
      names: [{ name: command.name, date: { ...world.date } }],
      followers,
      loyalty,
      satisfaction: 65,
      reputation: command.method === 'gathering' ? 48 : 40,
      heat:
        command.method === 'social'
          ? 14
          : command.method === 'announcement'
            ? 8
            : 4,
      headquarters: command.headquarters,
      upgrades: [],
      headquartersHistory: [
        {
          headquarters: command.headquarters,
          date: { ...world.date },
          paid: quote.premises,
        },
      ],
      joiningFee: command.joiningFee,
      recurringFee: command.recurringFee,
      cash: 0n,
      capital: 0n,
      income: 0n,
      expenses: 0n,
      payouts: 0n,
      distribution: 0n,
      misuse: 0n,
      memberRewards: 0n,
      arrears: 0n,
      writtenOff: 0n,
      distressMonths: 0,
      fragileMonths: 0,
      book: [],
      bookBase: {
        cashDelta: 0n,
        capital: 0n,
        income: 0n,
        expenses: 0n,
        payouts: 0n,
        distribution: 0n,
        misuse: 0n,
        count: 0,
      },
      members: [],
      claimsMade: [],
      legalIncidents: [],
      threads: [],
      threadArchive: { resolved: 0, cancelled: 0 },
      storyLast: {},
      rivals: [],
      scandals: [],
      archivedScandals: 0,
      recovery: null,
      ceremonies: 0,
      sermons: 0,
      lastCeremony: null,
      months: [],
      report: {
        year: world.date.year,
        openingFollowers: 0,
        gained: followers,
        lost: 0,
        followers,
        revenue: 0n,
        expenses: 0n,
        capital: 0n,
        payouts: 0n,
        treasury: 0n,
        loyaltyStart: loyalty,
        loyalty,
        reputationStart: command.method === 'gathering' ? 48 : 40,
        reputation: command.method === 'gathering' ? 48 : 40,
        events: [],
      },
      years: [],
    };
    world.cults.push(cult);
    world.actionCounts[person.id + ':cult-founding:' + world.date.year] = 1;
    charge(
      world,
      quote.registration,
      'cult-registration',
      cult.id + ': registration',
    );
    cultContribute(world, cult, quote.capital);
    cultSpend(
      world,
      cult,
      quote.premises,
      'headquarters',
      'Starting headquarters',
    );
    for (const role of ['deputy', 'treasurer', 'organiser'] as const)
      addCultMember(world, cult, role);
    cultBook(
      world,
      cult,
      command.joiningFee * BigInt(followers - cult.members.length),
      'income',
      'joining',
      'Initial ordinary-member joining fees',
    );
    cultRecord(
      world,
      cult,
      'I founded ' +
        cult.name +
        ' as ' +
        cult.leaderTitle +
        '. ' +
        followers +
        ' followers joined us in ' +
        cult.city +
        '.',
    );
    result(
      world,
      'Your organisation is founded',
      cult.name + ' has ' + followers + ' followers and a small inner circle.',
      'cult',
      [
        {
          id: 'payment',
          label: 'Your payment',
          value: formatMoney({ minor: quote.total, currency: quote.currency }),
          tone: 'negative',
        },
        {
          id: 'treasury',
          label: 'Communal treasury',
          value: cultMoney(cult, cult.cash),
          tone: 'neutral',
        },
      ],
    );
    return;
  }
  const cult = ownedCult(
    world,
    command.cultId,
    command.type === 'cult-disband',
  );
  if (command.type === 'cult-disband') {
    closeCult(world, cult, 'disbanded');
    result(
      world,
      'Organisation disbanded',
      'Communal funds were settled. Your history and former followers remain.',
      'cult',
    );
    return;
  }
  if (command.type === 'cult-contribute') {
    cultLimit(world, cult, 'contribute', 3);
    cultContribute(world, cult, command.amount);
    cultRecord(
      world,
      cult,
      'I contributed ' +
        cultMoney(cult, command.amount) +
        ' to ' +
        cult.name +
        '.',
    );
    result(
      world,
      'Contribution recorded',
      'The money is now communal, not personal.',
      'cult-treasury',
    );
    return;
  }
  if (command.type === 'cult-payout') {
    cultLimit(world, cult, 'payout');
    if (command.amount > cultPayoutAvailable(cult))
      throw new IneligibleAction(
        'This exceeds the permitted payout after earned profit and reserves',
      );
    post(
      world,
      command.amount,
      0n,
      'cult-leader-income',
      cult.id + ': leader payout',
      null,
      person,
      cult.currency,
    );
    person.finance.cycleGross += fxMoney(
      world,
      { minor: command.amount, currency: cult.currency },
      countries[person.country].currency,
    ).minor;
    cultBook(
      world,
      cult,
      -command.amount,
      'payout',
      'leader-payout',
      'Recorded leader payout',
      person.id,
      world.ledger.at(-1)!.id,
    );
    const large = command.amount > cultAmount(cult, 200);
    cult.loyalty = bounded(cult.loyalty - (large ? 5 : 1));
    if (large)
      cultScandal(world, cult, 'A large leader payout drew criticism.', 6);
    cultRecord(
      world,
      cult,
      'I received a recorded leader payout of ' +
        cultMoney(cult, command.amount) +
        ' from ' +
        cult.name +
        '.',
    );
    result(
      world,
      'Leader payout recorded',
      'The payment is personal taxable income. The communal treasury fell by the same amount.',
      'cult-treasury',
      [
        {
          id: 'payout',
          label: 'Received',
          value: cultMoney(cult, command.amount),
          tone: 'positive',
        },
      ],
    );
    return;
  }
  if (command.type === 'cult-fees') {
    const reason = cultFeesReason(
      cult.country,
      command.joiningFee,
      command.recurringFee,
    );
    if (reason) throw new IneligibleAction(reason);
    cultLimit(world, cult, 'fees', 2, 'year');
    const higher = command.recurringFee > cult.recurringFee;
    cult.joiningFee = command.joiningFee;
    cult.recurringFee = command.recurringFee;
    cult.satisfaction = bounded(cult.satisfaction + (higher ? -5 : 3));
    cultRecord(
      world,
      cult,
      'I set ' +
        cult.name +
        '’s joining fee to ' +
        cultMoney(cult, cult.joiningFee) +
        ' and monthly fee to ' +
        cultMoney(cult, cult.recurringFee) +
        '.',
    );
    result(
      world,
      'Membership fees updated',
      'New fees apply to later joins and actual monthly dues.',
      'cult-treasury',
    );
    return;
  }
  if (command.type === 'cult-beliefs') {
    if (
      new Set(command.doctrines).size !== command.doctrines.length ||
      new Set(command.rules).size !== command.rules.length
    )
      throw new IneligibleAction(
        'Each belief and rule can be selected only once',
      );
    cultLimit(world, cult, 'beliefs', 2, 'year');
    const changed =
      cult.philosophy !== command.philosophy ||
      JSON.stringify(cult.doctrines) !== JSON.stringify(command.doctrines) ||
      JSON.stringify(cult.rules) !== JSON.stringify(command.rules);
    if (!changed && cult.leaderTitle === command.leaderTitle)
      throw new IneligibleAction('Choose a change first');
    cult.philosophy = command.philosophy;
    cult.doctrines = command.doctrines;
    cult.rules = command.rules;
    cult.leaderTitle = command.leaderTitle;
    if (changed) {
      cult.loyalty = bounded(cult.loyalty - 5);
      cult.satisfaction = bounded(cult.satisfaction - 2);
      for (const member of cult.members.filter(
        (row) => row.status === 'active',
      )) {
        cultMemberTrust(world, member, -3);
        cultMemory(
          world,
          cult,
          member,
          'belief-change',
          'The leader changed the group’s beliefs and rules.',
        );
      }
    }
    cultRecord(
      world,
      cult,
      'I changed ' +
        cult.name +
        '’s beliefs and leadership title. Earlier promises remained on the record.',
    );
    result(
      world,
      'Beliefs updated',
      'The new beliefs affect future months. Members will need time to adjust.',
      'cult-doctrines',
    );
    return;
  }
  if (command.type === 'cult-recruit') {
    cultLimit(world, cult, 'recruit', 2, 'year');
    const quote = cultRecruitQuote(cult, command.method);
    if (quote !== command.quotedCost)
      throw new IneligibleAction('The recruitment quote changed');
    cultSpend(
      world,
      cult,
      quote,
      'recruitment',
      'Recruitment: ' + command.method,
    );
    const definition = cultRecruitment.find(
        (row) => row.id === command.method,
      )!,
      mods = cultModifiers(cult),
      pressure = Number(
        (cult.joiningFee * 10000n) / rules[cult.country].baseWage,
      ),
      appeal = bounded(
        (person.stats.respect +
          person.skills.politics +
          person.publicLife.image) /
          3 +
          mods.growth / 10 +
          (cult.upgrades.includes('monument') ? 8 : 0) -
          cult.heat / 2 -
          pressure / 2,
      );
    const joined = cultChangeFollowers(
      cult,
      Math.max(
        0,
        Math.floor(
          ((definition.reach + Math.min(50, Math.floor(cult.followers / 100))) *
            (appeal + draw(world, 'events', 0, 45))) /
            100,
        ),
      ),
    );
    cultBook(
      world,
      cult,
      cult.joiningFee * BigInt(joined),
      'income',
      'joining',
      'Joining fees after recruitment',
    );
    cult.heat = bounded(cult.heat + definition.heat);
    cult.reputation = bounded(cult.reputation + (joined > 0 ? 2 : -1));
    if (cult.followers >= 80 && cult.members.length < 5)
      addCultMember(
        world,
        cult,
        cult.members.length === 3 ? 'recruiter' : 'adviser',
      );
    cultRecord(
      world,
      cult,
      'I recruited through ' +
        definition.title.toLowerCase() +
        '. ' +
        joined +
        ' new followers joined ' +
        cult.name +
        '.',
    );
    result(
      world,
      joined ? 'New followers joined' : 'A quiet recruitment drive',
      joined +
        ' joined. ' +
        (cult.followers >= cultCapacity(cult)
          ? 'The headquarters is at capacity.'
          : 'The campaign costs are recorded.'),
      'cult-recruitment',
    );
    return;
  }
  if (command.type === 'cult-preach') {
    cultLimit(world, cult, 'preach');
    cult.sermons++;
    person.stats.energy = bounded(person.stats.energy - 5);
    cult.loyalty = bounded(cult.loyalty + 3);
    cult.satisfaction = bounded(cult.satisfaction + 2);
    for (const member of cult.members.filter((row) => row.status === 'active'))
      cultMemberTrust(world, member, 1);
    cultRecord(world, cult, sermons[cult.philosophy]);
    result(
      world,
      'Your gathering heard you',
      sermons[cult.philosophy].replace(/^I /, 'You '),
      'cult-philosophy',
    );
    return;
  }
  if (command.type === 'cult-ceremony') {
    cultLimit(world, cult, 'ceremony');
    const quote = cultCeremonyQuote(cult, command.ceremony);
    if (quote !== command.quotedCost)
      throw new IneligibleAction('The ceremony quote changed');
    cultSpend(world, cult, quote, 'ceremony', 'Ceremony: ' + command.ceremony);
    const definition = cultCeremonies.find(
        (row) => row.id === command.ceremony,
      )!,
      quality =
        draw(world, 'events', 20, 90) +
        Math.floor(cult.satisfaction / 4) +
        (cult.upgrades.includes('hall') ? 8 : 0) +
        (cult.upgrades.includes('kitchen') ? 6 : 0) -
        Math.floor(cult.heat / 3),
      success = quality >= 45;
    cult.ceremonies++;
    cult.lastCeremony = {
      id: command.ceremony,
      month: cultMonthNumber(world),
      success,
    };
    recordCultCeremonyPromises(world, cult, command.ceremony, success);
    cult.loyalty = bounded(cult.loyalty + (success ? definition.loyalty : -5));
    cult.satisfaction = bounded(
      cult.satisfaction + (success ? definition.satisfaction : -6),
    );
    cult.reputation = bounded(
      cult.reputation + (success ? definition.reputation : -3),
    );
    const proceeds = success
      ? (rules[cult.country].baseWage *
          BigInt(
            Math.max(
              0,
              cult.followers -
                cult.members.filter((row) => row.status === 'active').length,
            ),
          )) /
        50000n
      : 0n;
    cultBook(
      world,
      cult,
      proceeds,
      'income',
      'ceremony',
      'Voluntary ceremony contributions',
    );
    if (!success)
      cultScandal(world, cult, definition.title + ' went badly.', 6);
    cultRecord(
      world,
      cult,
      'I held ' +
        definition.title.toLowerCase() +
        '. ' +
        (success ? 'Members left pleased.' : 'The gathering went badly.'),
    );
    result(
      world,
      success ? 'A gathering worth attending' : 'The gathering went badly',
      success
        ? 'Members enjoyed ' + definition.title.toLowerCase() + '.'
        : 'The costs are paid. Members will remember the disappointing event.',
      'cult-ceremony',
    );
    return;
  }
  if (command.type === 'cult-claim') {
    const reason = cultClaimReason(cult, command.claim);
    if (reason) throw new IneligibleAction(reason);
    cultLimit(world, cult, 'claim', 1, 'year');
    cult.claimsMade.push(command.claim);
    const definition = cultClaims.find((row) => row.id === command.claim)!,
      participant =
        cult.members.find(
          (row) => row.status === 'active' && row.role === 'deputy',
        ) ?? cult.members.find((row) => row.status === 'active');
    if (command.approach === 'viewing')
      cultSpend(
        world,
        cult,
        cultAmount(cult, 30),
        'claim-gathering',
        'Preparations for a promised viewing',
      );
    const thread = newCultThread(
      world,
      cult,
      'claim',
      definition.id,
      cultMonthNumber(world) + definition.months,
      participant ? [participant.personId] : [],
    );
    thread.doctrineId = definition.doctrine;
    thread.approach = command.approach;
    thread.title = definition.title;
    thread.body = definition.announcement;
    cult.loyalty = bounded(
      cult.loyalty + (command.approach === 'double-down' ? 5 : 3),
    );
    if (command.approach === 'double-down') cult.heat = bounded(cult.heat + 3);
    cultRecord(
      world,
      cult,
      'I announced ' +
        definition.title.toLowerCase() +
        ' to ' +
        cult.name +
        '. I gave it ' +
        definition.months +
        ' months.',
    );
    result(
      world,
      'The promise is on record',
      definition.announcement +
        ' It comes due in ' +
        definition.months +
        ' months.',
      'cult-claim',
    );
    return;
  }
  if (command.type === 'cult-headquarters') {
    const old = cultHeadquarters.findIndex(
        (row) => row.id === cult.headquarters,
      ),
      next = cultHeadquarters.findIndex(
        (row) => row.id === command.headquarters,
      );
    if (next <= old) throw new IneligibleAction('Choose a larger headquarters');
    const quote = cultHeadquartersQuote(cult, command.headquarters);
    if (quote !== command.quotedCost)
      throw new IneligibleAction('The headquarters quote changed');
    cultLimit(world, cult, 'headquarters', 1, 'year');
    cultSpend(world, cult, quote, 'headquarters', 'Headquarters expansion');
    cult.headquarters = command.headquarters;
    cult.headquartersHistory.push({
      headquarters: command.headquarters,
      date: { ...world.date },
      paid: quote,
    });
    cult.satisfaction = bounded(cult.satisfaction + 5);
    cult.reputation = bounded(cult.reputation + 4);
    cultRecord(
      world,
      cult,
      'I moved ' +
        cult.name +
        ' into ' +
        cultHeadquarters[next].title.toLowerCase() +
        '.',
    );
    result(
      world,
      'A larger headquarters',
      'The new capacity and running costs apply to future months.',
      'cult-headquarters',
    );
    return;
  }
  if (command.type === 'cult-upgrade') {
    if (cult.upgrades.includes(command.upgrade))
      throw new IneligibleAction('This upgrade is already installed');
    const quote = cultUpgradeQuote(cult, command.upgrade);
    if (quote !== command.quotedCost)
      throw new IneligibleAction('The upgrade quote changed');
    cultLimit(world, cult, 'upgrade', 2, 'year');
    cultSpend(
      world,
      cult,
      quote,
      'upgrade',
      cultUpgrades.find((row) => row.id === command.upgrade)!.title,
    );
    cult.upgrades.push(command.upgrade);
    if (command.upgrade === 'residences')
      for (const member of cult.members.filter(
        (row) => row.status === 'active',
      ))
        member.resident = true;
    cultRecord(
      world,
      cult,
      'I added ' +
        cultUpgrades
          .find((row) => row.id === command.upgrade)!
          .title.toLowerCase() +
        ' to ' +
        cult.name +
        '.',
    );
    result(
      world,
      'Headquarters upgraded',
      cultUpgrades.find((row) => row.id === command.upgrade)!.description,
      'cult-headquarters',
    );
    return;
  }
  if (command.type === 'cult-member') {
    const member = cult.members.find(
        (row) => row.personId === command.personId,
      ),
      target = member && world.people[member.personId];
    if (!member || !target || target.died)
      throw new IneligibleAction('Choose a living inner-circle member');
    if (member.status !== 'active' && command.action !== 'talk')
      throw new IneligibleAction(
        'This person no longer belongs to the organisation',
      );
    cultLimit(
      world,
      cult,
      'member:' + member.personId + ':' + command.action,
      1,
      'year',
    );
    let delta =
      command.action === 'talk'
        ? 4
        : command.action === 'praise'
          ? 7
          : command.action === 'promote'
            ? 10
            : command.action === 'assign'
              ? 5
              : command.action === 'reward'
                ? 10
                : command.action === 'confront'
                  ? -20
                  : -30;
    if (command.action === 'reward') {
      const quote = cultRewardQuote(cult);
      if (command.quotedCost !== quote)
        throw new IneligibleAction('The reward quote changed');
      cultMemberPayment(world, cult, member, quote, 'Inner-circle reward');
    }
    if (command.action === 'promote' || command.action === 'assign') {
      const role = command.action === 'promote' ? 'deputy' : command.role;
      if (!role || !cultMemberRoles.includes(role))
        throw new IneligibleAction('Choose a responsibility');
      for (const other of cult.members.filter(
        (row) => row !== member && row.status === 'active' && row.role === role,
      )) {
        other.role = 'adviser';
        cultMemberTrust(world, other, -8);
        cultMemory(
          world,
          cult,
          other,
          'replaced',
          'I was replaced as ' + cultRoleTitles[role].toLowerCase() + '.',
        );
      }
      member.role = role;
      member.ambition = bounded(member.ambition + 5);
    }
    if (command.action === 'confront') {
      member.grievance = bounded(member.grievance + 25);
      member.ambition = bounded(member.ambition + 8);
      cult.heat = bounded(cult.heat + 3);
      scheduleCultCallback(world, cult, member, 'accusation-return', 12);
    }
    if (command.action === 'expel') {
      member.grievance = bounded(member.grievance + 30);
      cultMemberTrust(world, member, delta);
      cultMemberLeaves(world, cult, member, 'expelled');
    } else cultMemberTrust(world, member, delta);
    const text =
      'I ' +
      (
        {
          talk: 'talked with',
          praise: 'praised',
          promote: 'promoted',
          assign: 'assigned a responsibility to',
          reward: 'rewarded',
          confront: 'confronted publicly',
          expel: 'expelled',
        } as const
      )[command.action] +
      ' ' +
      fullName(target) +
      '.';
    cultMemory(world, cult, member, command.action, text);
    cultRecord(world, cult, text);
    result(
      world,
      'Your follower remembers',
      text.replace(/^I /, 'You '),
      'cult-followers',
    );
    return;
  }
  if (command.type === 'cult-rival') {
    const rival = cult.rivals.find(
      (row) =>
        row.id === command.rivalId && ['active', 'allied'].includes(row.status),
    );
    if (!rival || world.people[rival.leaderId].died)
      throw new IneligibleAction('This rival is no longer active');
    cultLimit(world, cult, 'rival:' + rival.id, 2, 'year');
    const quote = cultRivalQuote(cult, command.action);
    if (quote !== command.quotedCost)
      throw new IneligibleAction('The rival-action quote changed');
    cultSpend(world, cult, quote, 'rivalry', 'Rival action: ' + command.action);
    const roll = draw(world, 'events', 1, 100);
    let outcome = 'You let the rivalry cool.';
    if (command.action === 'challenge') {
      const win = roll <= 50 + (cult.reputation - rival.reputation) / 2;
      cult.reputation = bounded(cult.reputation + (win ? 5 : -4));
      rival.reputation = bounded(rival.reputation + (win ? -3 : 4));
      rival.relationship = bounded(rival.relationship - 10);
      cult.heat = bounded(cult.heat + 5);
      outcome = win
        ? 'Your public challenge went well.'
        : 'The rival got the better response.';
    }
    if (command.action === 'publicity') {
      const joined = cultChangeFollowers(
        cult,
        Math.min(25, Math.max(2, Math.floor(cult.reputation / 5))),
      );
      cultBook(
        world,
        cult,
        cult.joiningFee * BigInt(joined),
        'income',
        'joining',
        'Joining fees after rivalry publicity',
      );
      cult.heat = bounded(cult.heat + 6);
      rival.relationship = bounded(rival.relationship - 8);
      outcome = 'Your publicity brought attention and irritated the rival.';
    }
    if (command.action === 'alliance') {
      if (roll <= 30 + rival.relationship / 2 + cult.reputation / 5) {
        rival.status = 'allied';
        rival.relationship = bounded(rival.relationship + 20);
        cult.reputation = bounded(cult.reputation + 4);
        outcome = 'The rival accepted an alliance.';
      } else {
        rival.relationship = bounded(rival.relationship + 4);
        outcome = 'The rival declined for now.';
      }
    }
    if (command.action === 'reconcile') {
      rival.relationship = bounded(rival.relationship + 25);
      const member = cult.members.find(
        (row) => row.personId === rival.sourceMemberId,
      );
      if (member) cultMemberTrust(world, member, 12);
      if (rival.relationship >= 60) rival.status = 'reconciled';
      cult.heat = bounded(cult.heat - 3);
      outcome =
        rival.status === 'reconciled'
          ? 'You settled the old dispute.'
          : 'The conversation eased the dispute.';
    }
    if (command.action === 'ignore') {
      cult.heat = bounded(cult.heat - 2);
      rival.relationship = bounded(rival.relationship + 2);
    }
    rival.history.push(outcome);
    if (rival.history.length > 12) rival.history.shift();
    cultRecord(world, cult, 'I approached ' + rival.name + ': ' + outcome);
    result(world, 'A response from your rival', outcome, 'cult-rivalry');
    return;
  }
  if (command.type === 'cult-recovery') {
    cultLimit(world, cult, 'recovery', 2, 'year');
    const quote = cultRecoveryQuote(cult, command.action);
    if (quote !== command.quotedCost)
      throw new IneligibleAction('The recovery quote changed');
    if (
      command.action === 'rebrand' &&
      (!command.name || command.name === cult.name || cult.names.length >= 12)
    )
      throw new IneligibleAction('Choose a new name within your rebrand limit');
    cultSpend(
      world,
      cult,
      quote,
      'recovery',
      'Public response: ' + command.action,
    );
    if (command.action === 'rebrand') {
      cult.name = command.name!;
      cult.names.push({ name: cult.name, date: { ...world.date } });
      cult.loyalty = bounded(cult.loyalty - 3);
    }
    if (
      command.action === 'transparent' &&
      !cult.rules.includes('open-books')
    ) {
      if (cult.rules.length >= 6)
        throw new IneligibleAction(
          'Make room for the open-accounts rule first',
        );
      cult.rules.push('open-books');
    }
    if (command.action === 'replace-deputy') {
      const old = cult.members.find(
          (row) => row.status === 'active' && row.role === 'deputy',
        ),
        next = cult.members
          .filter((row) => row.status === 'active' && row !== old)
          .sort((a, b) => b.loyalty - a.loyalty)[0];
      if (!next) throw new IneligibleAction('No available replacement');
      if (old) {
        old.role = next.role;
        cultMemberTrust(world, old, -10);
        cultMemory(
          world,
          cult,
          old,
          'replaced',
          'I was replaced as second-in-command after public criticism.',
        );
      }
      next.role = 'deputy';
      cultMemberTrust(world, next, 8);
    }
    if (command.action === 'ignore') {
      cult.heat = bounded(cult.heat + 2);
      cult.loyalty = bounded(cult.loyalty + 1);
    } else
      cult.recovery = {
        kind: command.action,
        startedMonth: cultMonthNumber(world),
        remaining: 6,
      };
    cultRecord(
      world,
      cult,
      'I responded to criticism of ' +
        cult.name +
        ' by ' +
        command.action.replace(/-/g, ' ') +
        '. The old incidents stayed on record.',
    );
    result(
      world,
      'Your response is on record',
      command.action === 'ignore'
        ? 'You left the criticism unanswered.'
        : 'Recovery takes several months. Earlier claims, scandals and legal cases remain.',
      'cult-scandal',
    );
    return;
  }
}
