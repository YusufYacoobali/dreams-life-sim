import type { World } from '../model';
import { ageOn } from '../personHelpers';
import { countries } from '../countries';
import { rules } from '../rules';
import { jobs } from '../content/jobs';
import {
  cultCeremonies,
  cultDoctrines,
  cultHeadquarters,
  cultPhilosophies,
  cultRecruitment,
  cultRules,
  cultUpgrades,
  type CultModifiers,
} from '../content/cults';
import { IneligibleAction } from '../errors';
import { formatMoney, roundRatio } from '../money';
import { fxMoney } from '../valuation';
import {
  accountFor,
  active,
  availableCash,
  bounded,
  fact,
  post,
} from './common';
import {
  activeCult,
  cultMonthNumber,
  type Cult,
  type CultMember,
} from './cultSchemas';
import { activeTrip } from './travelSchemas';
import { isConfined } from './legalSchemas';
import { hospitalized } from './healthSchemas';
import { publicRoyalDuty } from './royaltySchemas';
import { fullTimeCreator } from './creatorSchemas';
import { campaignCommitment } from './politicsSchemas';
import { recordingCommitment } from './musicSchemas';
import { relationFor } from './relationshipQueries';
import { refreshFriendship } from './relationships';
export const cultMoney = (cult: Cult, minor: bigint) =>
  formatMoney({ minor, currency: cult.currency });
export const cultAmount = (cult: Pick<Cult, 'country'>, bps: number) =>
  roundRatio(rules[cult.country].baseWage * BigInt(bps), 10000n);
export function cultModifiers(
  cult: Pick<Cult, 'philosophy' | 'doctrines' | 'rules'>,
): CultModifiers {
  const values: CultModifiers = {
    growth: 0,
    loyalty: 0,
    satisfaction: 0,
    expenses: 0,
    donations: 0,
    heat: 0,
  };
  const selected = [
    cultPhilosophies.find((row) => row.id === cult.philosophy)!,
    ...cultDoctrines.filter((row) => cult.doctrines.includes(row.id)),
    ...cultRules.filter((row) => cult.rules.includes(row.id)),
  ];
  for (const belief of selected)
    for (const [key, value] of Object.entries(belief.modifiers))
      values[key as keyof CultModifiers] += value;
  const bounds: CultModifiers = {
    growth: 300,
    loyalty: 3,
    satisfaction: 3,
    expenses: 40,
    donations: 50,
    heat: 2,
  };
  for (const key of Object.keys(values) as (keyof CultModifiers)[])
    values[key] = Math.max(-bounds[key], Math.min(bounds[key], values[key]));
  return values;
}
export function cultCapacity(cult: Pick<Cult, 'headquarters' | 'upgrades'>) {
  const base = cultHeadquarters.find(
    (row) => row.id === cult.headquarters,
  )!.capacity;
  return Math.min(
    50000,
    Math.floor(
      (base *
        (100 +
          (cult.upgrades.includes('hall') ? 20 : 0) +
          (cult.upgrades.includes('residences') ? 30 : 0))) /
        100,
    ),
  );
}
export function cultStartupQuote(
  world: World,
  headquarters: (typeof cultHeadquarters)[number]['id'],
) {
  const person = active(world),
    base = rules[person.country].baseWage,
    building = cultHeadquarters.find((row) => row.id === headquarters)!;
  const premises = roundRatio(base * BigInt(building.costBps), 10000n),
    registration = base / 200n,
    reserve = base / 20n;
  return {
    premises,
    registration,
    reserve,
    capital: premises + reserve,
    total: premises + reserve + registration,
    currency: countries[person.country].currency,
  };
}
export function cultFeeOptions(country: Cult['country']) {
  const base = rules[country].baseWage;
  return [
    { id: 'free', title: 'Free', joining: 0n, recurring: 0n },
    {
      id: 'modest',
      title: 'Modest',
      joining: base / 2000n,
      recurring: base / 20000n,
    },
    {
      id: 'standard',
      title: 'Standard',
      joining: base / 1000n,
      recurring: base / 10000n,
    },
    {
      id: 'premium',
      title: 'Premium',
      joining: base / 200n,
      recurring: base / 2000n,
    },
  ] as const;
}
export function cultFeesReason(
  country: Cult['country'],
  joining: bigint,
  recurring: bigint,
) {
  if (
    joining < 0n ||
    recurring < 0n ||
    joining > rules[country].baseWage / 20n ||
    recurring > rules[country].baseWage / 100n
  )
    return 'Choose fees within the local membership limits';
}
export function cultFoundingReason(
  world: World,
  headquarters: (typeof cultHeadquarters)[number]['id'] = 'meeting-room',
): string | undefined {
  const person = active(world);
  if (person.died) return 'This life has ended';
  if (ageOn(person, world.date) < rules[person.country].adultAge)
    return 'Cult leadership is available to adults';
  if (activeCult(world)) return 'You already lead an active cult';
  if (
    world.cults.some(
      (other) =>
        other.status === 'active' &&
        other.members.some(
          (member) =>
            member.personId === person.id && member.status === 'active',
        ),
    )
  )
    return 'Leave your current inner-circle responsibility before founding an organisation';
  if (
    world.cults.length >= 128 ||
    world.cults.filter((row) => row.founderId === person.id).length >= 8
  )
    return 'Your founding history is full';
  if (isConfined(world) || person.legal.wanted)
    return 'Resolve custody or pursuit before founding';
  if (
    hospitalized(world, person) ||
    person.stats.health < 20 ||
    person.stats.energy < 10
  )
    return 'Recover your health and energy first';
  if (activeTrip(world)) return 'Return from your trip before founding';
  if (
    person.education.stage !== 'none' ||
    (person.employment &&
      !jobs.find((row) => row.id === person.employment!.roleId)?.partTime) ||
    fullTimeCreator(world) ||
    publicRoyalDuty(world) ||
    campaignCommitment(world) ||
    recordingCommitment(world) ||
    world.careers.some(
      (row) => row.personId === person.id && row.status === 'active',
    ) ||
    world.serviceCareers.some(
      (row) =>
        row.personId === person.id &&
        ['training', 'active'].includes(row.status),
    ) ||
    world.businesses.some(
      (row) =>
        row.ownerId === person.id &&
        row.status === 'active' &&
        row.ownerOperated,
    )
  )
    return 'Finish or leave your other full-time commitment first';
  if (world.actionCounts[person.id + ':cult-founding:' + world.date.year])
    return 'One founding attempt is available each year';
  if (
    availableCash(accountFor(world)) <
    cultStartupQuote(world, headquarters).total
  )
    return 'Your available balance cannot cover the founding costs';
}
export function cultActionReason(world: World, cult: Cult): string | undefined {
  const person = world.people[cult.leaderId ?? ''];
  if (
    !person ||
    person.id !== world.activePersonId ||
    person.died ||
    cult.status !== 'active'
  )
    return 'You no longer lead this organisation';
  if (isConfined(world, person) || person.legal.wanted)
    return 'Leader actions are unavailable during custody or pursuit';
  if (hospitalized(world, person) || person.stats.health < 20)
    return 'Recover before returning to the organisation';
  if (
    activeTrip(world, person.id) ||
    person.country !== cult.country ||
    person.city !== cult.city
  )
    return 'Return to the headquarters city first';
}
export function ownedCult(world: World, id: string, allowUnavailable = false) {
  const cult = world.cults.find(
    (row) =>
      row.id === id &&
      row.leaderId === world.activePersonId &&
      row.status === 'active',
  );
  if (!cult || world.people[world.activePersonId].died)
    throw new IneligibleAction('You no longer lead this organisation');
  const reason = !allowUnavailable && cultActionReason(world, cult);
  if (reason) throw new IneligibleAction(reason);
  return cult;
}
export function cultLimit(
  world: World,
  cult: Cult,
  name: string,
  max = 1,
  period: 'month' | 'year' = 'month',
) {
  const key =
    cult.id +
    ':' +
    name +
    ':' +
    (period === 'year' ? world.date.year : cultMonthNumber(world));
  if ((world.actionCounts[key] ?? 0) >= max)
    throw new IneligibleAction(
      period === 'month'
        ? 'You have used this month’s action'
        : 'You have used this year’s action',
    );
  world.actionCounts[key] = (world.actionCounts[key] ?? 0) + 1;
}
export function cultNextId(cult: Cult, prefix: string) {
  return prefix + '_' + cult.id + '_' + cult.sequence++;
}
export function cultReport(world: World, cult: Cult) {
  if (cult.report.year === world.date.year) return;
  cult.report.followers = cult.followers;
  cult.report.loyalty = cult.loyalty;
  cult.report.reputation = cult.reputation;
  cult.report.treasury = cult.cash;
  cult.years.push({ ...cult.report, events: [...cult.report.events] });
  if (cult.years.length > 120) cult.years.shift();
  fact(
    world,
    'My ' +
      cult.name +
      ' report for ' +
      cult.report.year +
      ': ' +
      cult.report.gained +
      ' joined, ' +
      cult.report.lost +
      ' left. Revenue was ' +
      cultMoney(cult, cult.report.revenue) +
      ', expenses ' +
      cultMoney(cult, cult.report.expenses) +
      ', and the treasury held ' +
      cultMoney(cult, cult.cash) +
      '.',
    'cult',
    '',
    cult.founderId,
  );
  cult.report = {
    year: world.date.year,
    openingFollowers: cult.followers,
    gained: 0,
    lost: 0,
    followers: cult.followers,
    revenue: 0n,
    expenses: 0n,
    capital: 0n,
    payouts: 0n,
    treasury: cult.cash,
    loyaltyStart: cult.loyalty,
    loyalty: cult.loyalty,
    reputationStart: cult.reputation,
    reputation: cult.reputation,
    events: [],
  };
}
export function cultRecord(world: World, cult: Cult, text: string) {
  cultReport(world, cult);
  cult.report.events.push(text.slice(0, 240));
  if (cult.report.events.length > 12) cult.report.events.shift();
  fact(world, text, 'cult', '', cult.founderId);
}
function sumBook(totals: Cult['bookBase'], row: Cult['book'][number]) {
  totals.cashDelta += row.delta;
  totals.count++;
  if (row.kind === 'capital') totals.capital += row.delta;
  else if (row.kind === 'income') totals.income += row.delta;
  else if (row.kind === 'expense') totals.expenses -= row.delta;
  else if (row.kind === 'payout') totals.payouts -= row.delta;
  else if (row.kind === 'distribution') totals.distribution -= row.delta;
  else totals.misuse -= row.delta;
}
export function cultBook(
  world: World,
  cult: Cult,
  delta: bigint,
  kind: Cult['book'][number]['kind'],
  category: string,
  description: string,
  personId: string | null = null,
  personalTransactionId: string | null = null,
) {
  if (!delta) return;
  if (cult.cash + delta < 0n)
    throw new IneligibleAction('The treasury cannot cover this payment');
  if ((kind === 'capital' || kind === 'income') !== delta > 0n)
    throw Error('Invalid organisation transaction direction');
  cultReport(world, cult);
  cult.cash += delta;
  const row = {
    id: cultNextId(cult, 'cult_txn'),
    sequence: cult.sequence - 1,
    date: { ...world.date },
    kind,
    category,
    description: description.slice(0, 240),
    delta,
    personId,
    personalTransactionId,
  };
  cult.book.push(row);
  if (cult.book.length > 512) sumBook(cult.bookBase, cult.book.shift()!);
  if (kind === 'capital') {
    cult.capital += delta;
    cult.report.capital += delta;
  } else if (kind === 'income') {
    cult.income += delta;
    cult.report.revenue += delta;
  } else if (kind === 'expense') {
    cult.expenses -= delta;
    cult.report.expenses -= delta;
  } else if (kind === 'payout') {
    cult.payouts -= delta;
    cult.report.payouts -= delta;
  } else if (kind === 'distribution') cult.distribution -= delta;
  else cult.misuse -= delta;
  cult.report.treasury = cult.cash;
}
export function cultSpend(
  world: World,
  cult: Cult,
  amount: bigint,
  category: string,
  description: string,
) {
  if (amount < 0n) throw Error('Negative organisation payment');
  if (cult.cash < amount)
    throw new IneligibleAction('The treasury cannot cover this payment');
  cultBook(world, cult, -amount, 'expense', category, description);
}
export function cultContribute(world: World, cult: Cult, amount: bigint) {
  const person = active(world);
  if (availableCash(accountFor(world, person, cult.currency)) < amount)
    throw new IneligibleAction(
      'Your available balance cannot cover this contribution',
    );
  post(
    world,
    -amount,
    0n,
    'cult-capital',
    cult.id + ': contribution to ' + cult.name,
    null,
    person,
    cult.currency,
  );
  cultBook(
    world,
    cult,
    amount,
    'capital',
    'contribution',
    'Founder contribution',
    person.id,
    world.ledger.at(-1)!.id,
  );
}
export function cultBill(cult: Cult) {
  const hq = cultHeadquarters.find((row) => row.id === cult.headquarters)!,
    bps =
      hq.maintenanceBps +
      cultUpgrades
        .filter((row) => cult.upgrades.includes(row.id))
        .reduce((sum, row) => sum + row.maintenanceBps, 0);
  const base =
    cultAmount(cult, bps) +
    rules[cult.country].baseWage / 2500n +
    (rules[cult.country].baseWage * BigInt(cult.followers)) / 200000n;
  return roundRatio(
    base *
      BigInt(
        100 +
          cultModifiers(cult).expenses -
          (cult.upgrades.includes('kitchen') ? 10 : 0),
      ),
    100n,
  );
}
export function cultRecruitQuote(
  cult: Cult,
  method: (typeof cultRecruitment)[number]['id'],
) {
  return cultAmount(
    cult,
    cultRecruitment.find((row) => row.id === method)!.costBps +
      Math.floor(cult.followers / 500),
  );
}
export function cultCeremonyQuote(
  cult: Cult,
  id: (typeof cultCeremonies)[number]['id'],
) {
  return roundRatio(
    cultAmount(cult, cultCeremonies.find((row) => row.id === id)!.costBps) *
      BigInt(100 + Math.min(200, Math.floor(cult.followers / 50))),
    100n,
  );
}
export const cultRewardQuote = (cult: Cult) => cultAmount(cult, 20);
export function cultHeadquartersQuote(cult: Cult, id: Cult['headquarters']) {
  const old = cultHeadquarters.find((row) => row.id === cult.headquarters)!,
    next = cultHeadquarters.find((row) => row.id === id)!;
  return cultAmount(cult, Math.max(0, next.costBps - old.costBps));
}
export const cultUpgradeQuote = (cult: Cult, id: Cult['upgrades'][number]) =>
  cultAmount(cult, cultUpgrades.find((row) => row.id === id)!.costBps);
export function cultPayoutAvailable(cult: Cult) {
  if (cult.status !== 'active' || cult.monthsActive < 3 || cult.arrears > 0n)
    return 0n;
  const earned = cult.income - cult.expenses - cult.payouts - cult.misuse,
    free = cult.cash - cultBill(cult) * 2n,
    cap = cult.cash / 8n;
  return [earned, free, cap].reduce((a, b) => (a < b ? a : b)) > 0n
    ? [earned, free, cap].reduce((a, b) => (a < b ? a : b))
    : 0n;
}
export function cultMemberPayment(
  world: World,
  cult: Cult,
  member: CultMember,
  amount: bigint,
  description: string,
) {
  if (cult.cash < amount)
    throw new IneligibleAction('The treasury cannot cover this payment');
  const person = world.people[member.personId];
  if (person.died) throw new IneligibleAction('This person has died');
  if (
    !world.accounts.some(
      (row) => row.ownerId === person.id && row.currency === cult.currency,
    )
  )
    world.accounts.push({
      id: 'account_' + person.id + '_' + cult.currency,
      ownerId: person.id,
      currency: cult.currency,
      cash: 0n,
      openingCash: 0n,
      lockedCash: 0n,
    });
  post(
    world,
    amount,
    0n,
    'cult-member-reward',
    cult.id + ': ' + description,
    null,
    person,
    cult.currency,
  );
  person.finance.cycleGross += fxMoney(
    world,
    { minor: amount, currency: cult.currency },
    countries[person.country].currency,
  ).minor;
  cultBook(
    world,
    cult,
    -amount,
    'expense',
    'member-reward',
    description,
    person.id,
    world.ledger.at(-1)!.id,
  );
  cult.memberRewards += amount;
}
export function cultChangeFollowers(cult: Cult, change: number) {
  const next = Math.max(
      cult.members.filter((row) => row.status === 'active').length,
      Math.min(cultCapacity(cult), cult.followers + Math.round(change)),
    ),
    delta = next - cult.followers;
  cult.followers = next;
  if (delta >= 0) cult.report.gained += delta;
  else cult.report.lost -= delta;
  cult.report.followers = next;
  return delta;
}
export function cultMemory(
  world: World,
  cult: Cult,
  member: CultMember,
  kind: string,
  text: string,
) {
  member.memories.push({
    id: cultNextId(cult, 'cult_memory'),
    month: cultMonthNumber(world),
    kind,
    text: text.slice(0, 360),
  });
  if (member.memories.length > 16) member.memories.shift();
}
export function cultMemberTrust(
  world: World,
  member: CultMember,
  delta: number,
) {
  member.loyalty = bounded(member.loyalty + delta);
  const relation = relationFor(world, world.activePersonId, member.personId);
  if (relation) {
    relation.strength = bounded(relation.strength + Math.round(delta / 2));
    refreshFriendship(relation);
  }
}
export function cultScandal(
  world: World,
  cult: Cult,
  reason: string,
  severity: number,
) {
  cult.heat = bounded(cult.heat + severity);
  cult.reputation = bounded(cult.reputation - Math.ceil(severity / 3));
  cult.scandals.push({
    id: cultNextId(cult, 'cult_scandal'),
    month: cultMonthNumber(world),
    reason: reason.slice(0, 300),
    severity: bounded(severity),
    resolvedMonth: null,
  });
  if (cult.scandals.length > 32) {
    const old = cult.scandals.findIndex((row) => row.resolvedMonth !== null);
    if (old >= 0) cult.scandals.splice(old, 1);
    else cult.scandals.shift();
    cult.archivedScandals++;
  }
}
