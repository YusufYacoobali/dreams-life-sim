import type { World } from '../game/model';
import { destinations } from '../game/content/travel';
import type { ProgressFacts } from './types';

/** Retained gameplay records only. Reading progress never awards or saves anything. */
export function progressFacts(world: World, personId = world.activePersonId): ProgressFacts | null {
  const person = world.people[personId];
  if (!person) return null;
  const schools = world.schoolCommunities.filter(item => item.personId === personId);
  const reports = schools.flatMap(item => item.exams);
  const hobbies = world.hobbies.filter(item => item.personId === personId);
  const trips = world.trips.filter(item => item.status === 'completed' && item.participantIds.includes(personId));
  const scholarships = world.scholarships.filter(item => item.personId === personId);
  const places = world.workplaces.filter(item => item.personId === personId);
  const projects = { actor: 0, model: 0, athlete: 0, musician: 0, politician: 0 };
  let awardedProjects = 0;
  for (const career of world.careers) if (career.personId === personId) {
    for (const project of [...career.projects, ...(career.creativeArchives ?? [])]) if (project.status === 'completed') {
      projects[career.kind]++; if (project.award) awardedProjects++;
    }
  }

  const repaymentMonths = new Set<number>(), profitMonths = new Set<number>(), repaidLoans = new Set<string>();
  const dividendMonths = new Set<number>(), purchasedProperties = new Set<string>(), repaidMortgages = new Set<string>();
  let investmentPurchases = 0;
  // Asset/action IDs retain the original acquisition even after sale or inheritance.
  // Names or current ownership alone do not prove that this person bought a home.
  const properties = new Map(world.assets.filter(item => item.kind === 'property' && /^asset_\d+$/.test(item.id)).map(item => [item.id, item]));
  const mortgageProperties = new Map(world.liabilities.flatMap(debt => {
    const assetId = /^mortgage_(asset_\d+)_\d+$/.exec(debt.id)?.[1];
    return assetId && properties.has(assetId) ? [[debt.id, assetId] as const] : [];
  }));
  const mortgages = new Map<string, { balance: bigint; ownBorrowing: boolean; ownRepayments: boolean }>();
  const personalLoans = new Set(world.liabilities.filter(item => item.kind === 'personal').map(item => item.id));
  const balances = new Map<string, { balance: bigint; ownBorrowing: boolean; ownRepayments: boolean }>();
  // One ledger pass. A zero balance alone could be forgiveness or estate settlement.
  // Preserve a real earlier payoff even if the same credit line is borrowed again.
  for (const row of world.ledger) {
    if (row.personId === personId) {
      const month = row.year * 12 + row.month - 1;
      if (row.category === 'repayment' && row.liabilityId && row.cashDelta < 0n && row.debtDelta < 0n) repaymentMonths.add(month);
      if (row.category === 'business-owner-income' && row.cashDelta > 0n) profitMonths.add(month);
      if (row.category === 'investment' && row.cashDelta < 0n && row.debtDelta === 0n) investmentPurchases++;
      if (row.category === 'dividend' && row.cashDelta > 0n && row.debtDelta === 0n) dividendMonths.add(month);
      if (row.category === 'purchase' && row.cashDelta < 0n && row.debtDelta === 0n) {
        const revision = /^txn_(\d+)_\d+$/.exec(row.id)?.[1], asset = revision ? properties.get('asset_' + revision) : undefined;
        if (asset && row.year === asset.acquired.year && row.month === asset.acquired.month && row.currency === asset.currency && -row.cashDelta >= asset.pricePaid && row.description === 'Purchased ' + asset.name) purchasedProperties.add(asset.id);
      }
    }
    if (row.liabilityId && row.debtDelta && mortgageProperties.has(row.liabilityId)) {
      const asset = properties.get(mortgageProperties.get(row.liabilityId)!)!;
      const state = mortgages.get(row.liabilityId) ?? { balance: 0n, ownBorrowing: false, ownRepayments: true };
      const ownDraw = row.category === 'borrowing' && row.personId === personId && row.currency === asset.currency && row.cashDelta === row.debtDelta && row.cashDelta > 0n && row.description === 'Mortgage funding: ' + asset.name;
      const ownPayment = row.category === 'repayment' && row.personId === personId && row.currency === asset.currency && row.cashDelta === row.debtDelta && row.cashDelta < 0n && (row.description === 'Debt repayment' || row.description === 'Monthly mortgage payment');
      if (row.debtDelta > 0n) {
        if (state.balance === 0n) { state.ownBorrowing = ownDraw; state.ownRepayments = true; }
        else if (row.category !== 'interest' || row.personId !== personId || row.cashDelta !== 0n) state.ownBorrowing = false;
      } else if (!ownPayment) state.ownRepayments = false;
      state.balance += row.debtDelta;
      // Sale proceeds, refinancing and estate settlement also close balances.
      // Only the person's own regular/extra repayments can earn this milestone.
      if (state.balance === 0n && state.ownBorrowing && state.ownRepayments && ownPayment) repaidMortgages.add(row.liabilityId);
      mortgages.set(row.liabilityId, state);
    }
    if (!row.liabilityId || !personalLoans.has(row.liabilityId) || !row.debtDelta) continue;
    const state = balances.get(row.liabilityId) ?? { balance: 0n, ownBorrowing: false, ownRepayments: true };
    if (row.debtDelta > 0n) {
      const ownDraw = row.category === 'borrowing' && row.personId === personId && row.cashDelta > 0n;
      if (state.balance === 0n) { state.ownBorrowing = ownDraw; state.ownRepayments = true; }
      else if (row.category !== 'interest' && !ownDraw) state.ownBorrowing = false;
    } else if (row.category !== 'repayment' || row.personId !== personId || row.cashDelta >= 0n) state.ownRepayments = false;
    state.balance += row.debtDelta;
    if (state.balance === 0n && state.ownBorrowing && state.ownRepayments && row.debtDelta < 0n && row.category === 'repayment' && row.personId === personId) repaidLoans.add(row.liabilityId);
    balances.set(row.liabilityId, state);
  }

  const studios = new Map(world.creatorStudios.filter(item => item.personId === personId).map(item => [item.id, item]));
  let youtuberPosts = 0, streamerPosts = 0, streamerBroadcasts = 0, liveMinutes = 0;
  for (const account of world.socialAccounts.filter(item => item.ownerId === personId)) {
    for (const post of account.posts) {
      const studio = post.studioId ? studios.get(post.studioId) : undefined;
      if (!studio || studio.accountId !== account.id) continue;
      if (studio.kind === 'youtuber') youtuberPosts++; else {
        streamerPosts++;
        if (post.liveMinutes > 0) { streamerBroadcasts++; liveMinutes += post.liveMinutes; }
      }
    }
    const hasStreamer = [...studios.values()].some(studio => studio.accountId === account.id && studio.kind === 'streamer');
    for (const archive of account.archived) {
      for (const [id, count] of Object.entries(archive.studioPosts)) {
        const studio = studios.get(id); if (!studio || studio.accountId !== account.id) continue;
        if (studio.kind === 'youtuber') youtuberPosts += count; else streamerPosts += count;
      }
      if (hasStreamer) { streamerBroadcasts += archive.livePosts; liveMinutes += archive.liveMinutes; }
    }
  }
  let royalEngagements = 0;
  for (const house of world.royalHouses) {
    royalEngagements += house.records.filter(item => item.personId === personId && item.attended).reduce((sum, item) => sum + item.engagements, 0);
    royalEngagements += house.archives.filter(item => item.personId === personId && item.attended > 0).reduce((sum, item) => sum + item.engagements, 0);
  }
  const serviceAssignments = (kind: 'military' | 'astronaut') => world.serviceCareers.filter(item => item.personId === personId && item.kind === kind).reduce((sum, item) => sum + item.assignments.filter(assignment => assignment.status === 'completed').length, 0);
  const attendedMonths = (hobby: World['hobbies'][number]) => hobby.practices.filter(row => row.source === 'monthly' && row.attended).length;
  const lastLifeMonth = person.died ? person.died.year * 12 + person.died.month - 1 : Infinity;
  return {
    schoolReports: reports.length,
    highReports: reports.filter(item => item.grade >= 80).length,
    acceptedHelp: schools.reduce((sum, school) => sum + school.help.filter(item => item.accepted).length, 0),
    clubMonths: new Set(schools.flatMap(school => school.periods.filter(item => item.club !== 'none').map(item => item.month))).size,
    secondaryQualifications: person.education.qualifications.filter(item => item.level === 'secondary').length,
    furtherQualifications: person.education.qualifications.filter(item => item.level !== 'secondary').length,
    workMonths: world.workHistory.filter(item => item.personId === personId).reduce((sum, item) => sum + item.monthsWorked, 0),
    hobbyMonths: Math.max(0, ...hobbies.map(attendedMonths)),
    hobbyProficiency: Math.max(0, ...hobbies.map(item => item.proficiency)),
    petCareMonths: Math.max(0, ...world.pets.filter(item => item.adoptedById === personId).map(item => item.periods.filter(period => period.care !== 'unfunded' && period.month <= lastLifeMonth).length)),
    marriages: world.marriages.filter(item => item.a === personId || item.b === personId).length,
    completedTrips: trips.length,
    destinationCountries: new Set(trips.map(item => destinations[item.destinationId].country)).size,
    repaymentMonths: repaymentMonths.size,
    completedProjects: Object.values(projects).reduce((sum, count) => sum + count, 0),
    tuitionWaivers: scholarships.reduce((sum, item) => sum + item.periods.length, 0),
    completedScholarships: scholarships.filter(item => item.status === 'completed').length,
    acceptedFeedback: places.reduce((sum, item) => sum + item.feedback.filter(feedback => feedback.accepted).length, 0),
    acceptedRaises: world.workRaises.filter(item => item.personId === personId && item.accepted).length,
    pensionPeriods: person.finance.pensionReceipts.filter(item => item.gross > 0n).reduce((sum, item) => sum + item.periods, 0),
    hobbyKindsPractised: new Set(hobbies.filter(item => attendedMonths(item) >= 12).map(item => item.kind)).size,
    children: new Set(world.relationships.filter(item => item.from === personId && item.roles.includes('parent') && item.parentType !== 'guardian').map(item => item.to)).size,
    foundedBusinesses: world.businesses.filter(item => item.founderId === personId).length,
    profitMonths: profitMonths.size,
    profitableBusinesses: new Set(world.businessLedger.filter(item => item.personId === personId && item.category === 'owner-distribution' && item.cashDelta < 0n).map(item => item.businessId)).size,
    repaidPersonalLoans: repaidLoans.size,
    investmentPurchases, dividendMonths: dividendMonths.size, purchasedProperties: purchasedProperties.size,
    repaidMortgages: [...repaidMortgages].filter(id => purchasedProperties.has(mortgageProperties.get(id)!)).length,
    actorProjects: projects.actor, modelProjects: projects.model, athleteProjects: projects.athlete,
    musicianProjects: projects.musician, politicianProjects: projects.politician,
    militaryAssignments: serviceAssignments('military'), spaceAssignments: serviceAssignments('astronaut'),
    youtuberPosts, streamerBroadcasts, creatorPosts: youtuberPosts + streamerPosts, liveMinutes, royalEngagements, awardedProjects,
  };
}
