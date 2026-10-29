import type { World } from '../model';
import { rules } from '../rules';
import { cultHeadquarters } from '../content/cults';
import { bounded, draw } from './common';
import { isConfined } from './legalSchemas';
import { hospitalized } from './healthSchemas';
import { activeTrip } from './travelSchemas';
import { relationFor } from './relationshipQueries';
import { cultMonthNumber } from './cultSchemas';
import {
  cultBill,
  cultBook,
  cultCapacity,
  cultChangeFollowers,
  cultMemberTrust,
  cultModifiers,
  cultReport,
} from './cultCore';
import { closeCult } from './cultLifecycle';
import { cultMemberLeaves } from './cultThreads';
import { cultStoryMonth } from './cultEvents';
/** One accrual per processed calendar month. Dormant worlds consume no RNG. */
export function cultMonth(world: World) {
  const now = cultMonthNumber(world);
  for (const cult of world.cults) {
    if (cult.status !== 'active' || cult.lastMonth >= now) continue;
    const leader = world.people[cult.leaderId!];
    if (!leader || leader.died) {
      closeCult(world, cult, 'deceased');
      continue;
    }
    cultReport(world, cult);
    const openingCash = cult.cash,
      openingIncome = cult.income,
      openingExpenses = cult.expenses,
      openingGained = cult.report.gained,
      openingLost = cult.report.lost,
      mods = cultModifiers(cult),
      base = rules[cult.country].baseWage;
    const present =
      !isConfined(world, leader) &&
      !leader.legal.wanted &&
      !hospitalized(world, leader) &&
      !activeTrip(world, leader.id) &&
      leader.country === cult.country &&
      leader.city === cult.city;
    const named = cult.members.filter((row) => row.status === 'active').length,
      ordinary = Math.max(0, cult.followers - named),
      feePressure = Math.min(
        80,
        Number((cult.recurringFee * 10000n) / base) * 2,
      ),
      sizePressure = Math.min(4, Math.floor(cult.followers / 6000));
    cultBook(
      world,
      cult,
      BigInt(ordinary) * cult.recurringFee,
      'income',
      'dues',
      'Ordinary-member monthly dues',
    );
    const donation =
      (base *
        BigInt(ordinary) *
        BigInt(cult.loyalty) *
        BigInt(100 + mods.donations)) /
      (100000n * 100n * 100n);
    cultBook(
      world,
      cult,
      present ? donation : donation / 2n,
      'income',
      'donations',
      'Voluntary monthly donations',
    );
    if (cult.upgrades.includes('workshop') && present)
      cultBook(
        world,
        cult,
        (base * BigInt(ordinary)) / 150000n,
        'income',
        'merchandise',
        'Workshop merchandise sales',
      );
    const bill = cultBill(cult),
      owed = bill + cult.arrears,
      paid = cult.cash < owed ? cult.cash : owed;
    cultBook(
      world,
      cult,
      -paid,
      'expense',
      'running-costs',
      'Headquarters, administration and outstanding bills',
    );
    cult.arrears = owed - paid;
    cult.distressMonths = cult.arrears > 0n ? cult.distressMonths + 1 : 0;
    const recovery =
      cult.recovery &&
      cult.recovery.remaining > 0 &&
      now > cult.recovery.startedMonth;
    if (recovery) {
      cult.heat = bounded(
        cult.heat -
          (cult.recovery!.kind === 'transparent' &&
          cult.rules.includes('open-books')
            ? 3
            : 2),
      );
      cult.reputation = bounded(cult.reputation + 1);
      cult.recovery!.remaining--;
      if (!cult.recovery!.remaining) cult.recovery = null;
    }
    cult.loyalty = bounded(
      cult.loyalty +
        mods.loyalty -
        sizePressure -
        Math.floor(feePressure / 20) -
        Math.floor(cult.heat / 35) -
        (present ? 0 : 4) -
        (cult.arrears > 0n ? 5 : 0),
    );
    cult.satisfaction = bounded(
      cult.satisfaction +
        mods.satisfaction +
        (cult.upgrades.includes('garden') ? 1 : 0) +
        (cult.upgrades.includes('kitchen') ? 1 : 0) -
        sizePressure -
        Math.floor(feePressure / 15) -
        (cult.arrears > 0n ? 6 : 0),
    );
    cult.heat = bounded(
      cult.heat + mods.heat - 1 + (cult.upgrades.includes('monument') ? 1 : 0),
    );
    const hq = cultHeadquarters.find((row) => row.id === cult.headquarters)!,
      rate =
        80 +
        mods.growth +
        (cult.upgrades.includes('monument') ? 80 : 0) +
        Math.floor(hq.appeal / 2) +
        Math.floor(cult.reputation / 2) -
        cult.heat * 3 -
        feePressure * 3;
    const joins = present
      ? Math.max(
          0,
          2 +
            Math.floor((cult.followers * Math.max(0, rate)) / 10000) +
            draw(world, 'events', 0, 3),
        )
      : 0;
    const joined = cultChangeFollowers(cult, joins);
    cultBook(
      world,
      cult,
      cult.joiningFee * BigInt(joined),
      'income',
      'joining',
      'Joining fees from organic growth',
    );
    const departures = Math.max(
      0,
      Math.ceil(
        (cult.followers *
          (100 -
            cult.loyalty +
            (100 - cult.satisfaction) +
            cult.heat +
            feePressure +
            (present ? 0 : 80))) /
          16000,
      ),
    );
    cultChangeFollowers(cult, -departures);
    for (const member of cult.members) {
      if (member.status !== 'active') continue;
      const person = world.people[member.personId];
      if (person.died) {
        member.status = 'deceased';
        member.ended = { ...person.died };
        member.resident = false;
        cultChangeFollowers(cult, -1);
        continue;
      }
      if (
        person.country !== cult.country ||
        person.city !== cult.city ||
        isConfined(world, person)
      ) {
        cultMemberLeaves(world, cult, member, 'left', false);
        continue;
      }
      const relationship =
        relationFor(world, cult.founderId, person.id)?.strength ?? 45;
      cultMemberTrust(
        world,
        member,
        Math.max(
          -3,
          Math.min(
            2,
            Math.round(
              (cult.loyalty - member.loyalty) / 20 + (relationship - 50) / 25,
            ),
          ),
        ),
      );
      if (now % 6 === 0)
        member.ambition = bounded(
          member.ambition + (member.role === 'deputy' ? 2 : 1),
        );
      if (member.loyalty < 15 && member.grievance > 20)
        cultMemberLeaves(world, cult, member, 'left');
    }
    for (const rival of cult.rivals) {
      if (
        !['active', 'allied'].includes(rival.status) ||
        rival.lastMonth >= now
      )
        continue;
      rival.lastMonth = now;
      if (world.people[rival.leaderId].died) {
        rival.status = 'closed';
        continue;
      }
      rival.followers = Math.max(
        0,
        Math.min(
          50000,
          rival.followers +
            Math.floor((rival.followers * (rival.reputation - 35)) / 2500) +
            draw(world, 'events', -2, 3),
        ),
      );
      if (!rival.followers) rival.status = 'closed';
      if (rival.status === 'active' && rival.relationship < 30) {
        cultChangeFollowers(
          cult,
          -Math.min(20, Math.ceil(rival.followers / 100)),
        );
        cult.heat = bounded(cult.heat + 1);
      }
      if (rival.status === 'allied')
        cult.reputation = bounded(cult.reputation + 1);
    }
    cult.fragileMonths = cult.loyalty < 10 ? cult.fragileMonths + 1 : 0;
    cult.lastMonth = now;
    cult.monthsActive++;
    if (cult.followers >= 1000 && now % 6 === 0) {
      leader.stats.fame = bounded(leader.stats.fame + 1);
      leader.publicLife.earnedFame = bounded(leader.publicLife.earnedFame + 1);
    }
    for (const scandal of cult.scandals)
      if (
        scandal.resolvedMonth === null &&
        now - scandal.month >= 6 &&
        cult.heat < 35
      )
        scandal.resolvedMonth = now;
    if (cult.distressMonths >= 4 || cult.fragileMonths >= 6) {
      closeCult(world, cult, 'collapsed');
      continue;
    }
    cultStoryMonth(world, cult);
    cult.report.loyalty = cult.loyalty;
    cult.report.reputation = cult.reputation;
    cult.report.treasury = cult.cash;
    cult.months.push({
      month: now,
      followers: cult.followers,
      gained: cult.report.gained - openingGained,
      lost: cult.report.lost - openingLost,
      revenue: cult.income - openingIncome,
      expenses: cult.expenses - openingExpenses,
      openingCash,
      cash: cult.cash,
      loyalty: cult.loyalty,
      heat: cult.heat,
    });
    if (cult.months.length > 60) cult.months.shift();
    if (cult.followers > cultCapacity(cult))
      throw Error('Organisation exceeds its real capacity');
  }
}
