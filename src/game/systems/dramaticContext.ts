import type { World } from '../model';
import { ageOn, compareDates, fullName } from '../personHelpers';
import { countries } from '../countries';
import { currencyDigits, formatMoney } from '../money';
import { jobs } from '../content/jobs';
import { offences } from '../content/crime';
import { currentWorkplace } from './workplaceSchemas';
import { currentBestFriendship } from './friendshipSchemas';
import { storyPersonPresent, storyMonthNumber } from './storyContext';
import { legalStoryContexts } from './legalStoryContext';
import { hospitalized } from './healthSchemas';
import { activeTrip } from './travelSchemas';
import { serviceAway } from './serviceSchemas';
import type { DramaticEffect } from './dramaticSchemas';

export type DramaticContext = Pick<DramaticEffect, 'subjectId' | 'contextId' | 'relatedId' | 'otherId' | 'quote'> & { names: Record<string, string>; personIds: string[] };

/** Pure observations only. Supplying a saved subject never substitutes a new one. */
export function dramaticContext(world: World, id: string, subjectId?: string): DramaticContext | undefined {
  const player = world.people[world.activePersonId], month = storyMonthNumber(world.date);
  if (player.died || ageOn(player, world.date) < 18 || ageOn(player, world.date) > 120) return;
  const currency = countries[player.country].currency;
  const cash = (personId: string) => { const a = world.accounts.find(row => row.ownerId === personId && row.currency === currency); return a ? a.cash - a.lockedCash : 0n; };
  const money = (minor: bigint) => formatMoney({ minor, currency });
  const local = (personId: string) => { const p = world.people[personId]; return !!p && p.id !== player.id && ageOn(p, world.date) >= 18 && p.country === player.country && p.city === player.city && storyPersonPresent(world, p); };
  const relation = (personId: string) => world.relationships.find(row => row.from === player.id && row.to === personId || row.to === player.id && row.from === personId);
  const matches = (value: string) => !subjectId || value === subjectId;
  const context = (binding: Omit<DramaticContext, 'personIds'>, people: string[] = []): DramaticContext => ({ ...binding, personIds: [...new Set([player.id, ...people])] });
  if (id === 'dramatic-cellmate-escape') {
    const { sentence, peer } = legalStoryContexts(world);
    if (sentence && peer && matches(sentence.id)) return context({ subjectId: sentence.id, contextId: peer.person.id, relatedId: peer.relationshipId, names: { facility: sentence.facility, prisonPeer: fullName(peer.person) } }, [peer.person.id]);
    return;
  }
  if (id === 'dramatic-courtroom-defence') {
    const item = world.cases.find(row => matches(row.id) && row.personId === player.id && row.status === 'awaiting-trial' && !row.juvenile && row.country === player.country && row.city === player.city && row.baseMonths >= 18 && row.evidence >= 60 && row.counsel !== 'self' && compareDates(row.hearing, world.date) <= 0);
    if (item && !player.legal.wanted && !hospitalized(world, player) && !activeTrip(world, player.id) && !serviceAway(world, player.id)) return context({ subjectId: item.id, names: { offence: offences[item.offence].title.toLowerCase(), city: item.city } });
    return;
  }
  if (!storyPersonPresent(world, player)) return;
  if (id === 'dramatic-boss-criminal') {
    const place = currentWorkplace(world), job = player.employment, role = jobs.find(row => row.id === job?.roleId);
    if (!place || !job || !role || role.specialCareer || job.companyId || place.employer !== job.employer || job.employer !== player.city + ' ' + role.sector || job.currency !== currency) return;
    const quote = 20_000n * 10n ** BigInt(currencyDigits[currency]);
    const member = place.members.find(row => row.role === 'supervisor' && !row.left && matches(row.personId) && local(row.personId) && relation(row.personId) && world.people[row.personId].employment?.id === row.employmentId && world.people[row.personId].employment?.employer === job.employer && world.people[row.personId].employment?.currency === currency && cash(row.personId) >= quote);
    if (member) return context({ subjectId: member.personId, contextId: job.id, quote, names: { boss: fullName(world.people[member.personId]), money: money(quote) } }, [member.personId]);
  } else if (id === 'dramatic-double-fiance' || id === 'dramatic-dating-profile') {
    const edge = world.relationships.find(row => matches(row.id) && (row.from === player.id || row.to === player.id) && (id === 'dramatic-double-fiance' ? row.romance === 'engaged' : ['dating', 'engaged', 'married'].includes(row.romance)) && local(row.from === player.id ? row.to : row.from));
    if (edge) { const partner = edge.from === player.id ? edge.to : edge.from; return context({ subjectId: edge.id, contextId: partner, names: { partner: fullName(world.people[partner]) } }, [partner]); }
  } else if (id === 'dramatic-best-friend-secrets') {
    const friendship = currentBestFriendship(world);
    if (!friendship || !matches(friendship.id)) return;
    const friend = friendship.proposerId === player.id ? friendship.friendId : friendship.proposerId, edge = relation(friend);
    if (local(friend) && edge?.id === friendship.relationshipId && edge.roles.includes('friend') && !['dating', 'engaged', 'married'].includes(edge.romance)) return context({ subjectId: friendship.id, contextId: edge.id, relatedId: friend, names: { friend: fullName(world.people[friend]) } }, [friend]);
  } else if (id === 'dramatic-child-exam-scam') {
    const edge = world.relationships.find(row => { const p = world.people[row.to]; return row.from === player.id && row.roles.some(role => role === 'parent' || role === 'guardian') && p && matches(p.id) && !p.died && storyPersonPresent(world, p) && p.country === player.country && p.city === player.city && !!player.householdId && p.householdId === player.householdId && ageOn(p, world.date) >= 13 && ageOn(p, world.date) < 18 && p.education.stage === 'secondary' && !!p.education.school && !p.education.paused; });
    if (edge) return context({ subjectId: edge.to, contextId: edge.id, names: { child: fullName(world.people[edge.to]), school: world.people[edge.to].education.school } }, [edge.to]);
  } else if (id === 'dramatic-accomplice-wire') {
    const source = world.incidents.find(row => matches(row.id) && row.personId === player.id && row.offence === 'robbery' && row.stage === 'hidden' && row.country === player.country && row.city === player.city);
    const gang = world.gangs.find(row => row.id === player.legal.gangId && row.personId === player.id && row.kind === 'street' && !row.left);
    const contact = gang?.contactIds.find(personId => local(personId) && relation(personId));
    if (source && gang && contact) return context({ subjectId: source.id, contextId: gang.id, relatedId: contact, names: { contact: fullName(world.people[contact]), gang: gang.name } }, [contact]);
  } else if (id === 'dramatic-unpaid-employees') {
    for (const business of world.businesses) {
      if (!matches(business.id) || business.ownerId !== player.id || business.status !== 'active' || business.country !== player.country || business.city !== player.city || business.currency !== currency || business.distressMonths < 1 || business.distressMonths >= 3) continue;
      const staff = business.staff.filter(row => !row.ended && local(row.personId) && world.people[row.personId].employment?.id === row.employmentId);
      const manager = staff.find(row => row.role === 'manager'), worker = staff.find(row => row.role === 'worker');
      const bills = world.businessPayables.filter(row => row.businessId === business.id && row.principal > 0n), wages = bills.filter(row => row.kind === 'wages').reduce((n, row) => n + row.principal, 0n), owed = bills.reduce((n, row) => n + row.principal, 0n), quote = owed - business.cash;
      if (manager && worker && wages > 0n && owed > wages && quote > 0n) return context({ subjectId: business.id, contextId: manager.personId, relatedId: worker.employmentId, quote, names: { business: business.name, manager: fullName(world.people[manager.personId]), wages: money(wages), money: money(quote) } }, [manager.personId, worker.personId]);
    }
  } else if (id === 'dramatic-suspicious-property') {
    const asset = world.assets.find(row => matches(row.id) && row.kind === 'property' && row.ownerId === player.id && row.country === player.country && row.city === player.city && row.currency === currency && row.listing && row.listing.offer === row.listing.askingPrice * 2n);
    if (asset?.listing?.offer) return context({ subjectId: asset.id, quote: asset.listing.offer, names: { property: asset.name, money: money(asset.listing.offer) } });
  } else if (id === 'dramatic-dishonest-sponsor') {
    const sponsor = world.sponsorships.find(row => matches(row.id) && row.ownerId === player.id && row.status === 'offered' && row.topic === 'fitness' && row.expiresMonth >= month && row.monthlyPay.currency === currency && row.termMonths === 6 && row.requiredPosts === 2);
    const account = sponsor && world.socialAccounts.find(row => row.id === sponsor.accountId && row.ownerId === player.id && row.status === 'active' && row.followers >= 5000);
    if (sponsor && account && player.publicLife.image >= 45 && (player.health.routine.exercise !== 'none' || world.actionCounts[player.id + ':health:' + world.date.year + ':exercise'])) return context({ subjectId: sponsor.id, contextId: account.id, quote: sponsor.monthlyPay.minor, names: { brand: sponsor.brand, money: money(sponsor.monthlyPay.minor) } });
  } else if (id === 'dramatic-funeral-stream') {
    const familyEdges = world.relationships.filter(row => (row.from === player.id || row.to === player.id) && row.roles.some(role => ['parent', 'guardian', 'sibling', 'spouse', 'partner'].includes(role)));
    const relatives = familyEdges.map(row => world.people[row.from === player.id ? row.to : row.from]);
    const deceased = relatives.find(p => p?.died && month - storyMonthNumber(p.died) >= 0 && month - storyMonthNumber(p.died) <= 12), family = relatives.find(p => p && local(p.id));
    if (!deceased || !family) return;
    for (const studio of world.creatorStudios) {
      if (!matches(studio.id) || studio.personId !== player.id || studio.kind !== 'streamer' || studio.status !== 'active' || studio.country !== player.country || studio.city !== player.city) continue;
      const account = world.socialAccounts.find(row => row.id === studio.accountId && row.ownerId === player.id && row.platform === 'streamline' && row.status === 'active' && row.cadence !== 'off');
      const editor = studio.crew.find(row => row.role === 'editor' && !row.ended && local(row.personId) && relation(row.personId));
      const post = account?.posts.find(row => row.studioId === studio.id && row.liveMinutes > 0 && row.sponsored && row.caption.includes(fullName(deceased)) && /memorial|funeral|in memory/i.test(row.caption) && row.periodMonth >= storyMonthNumber(deceased.died!) && month - row.periodMonth <= 1 && world.sponsorships.some(s => s.id === row.sponsorId && s.status === 'active'));
      if (account && editor && post) return context({ subjectId: studio.id, contextId: deceased.id, relatedId: editor.personId, otherId: family.id, names: { deceased: fullName(deceased), editor: fullName(world.people[editor.personId]), family: fullName(family) } }, [editor.personId, family.id]);
    }
  } else if (id === 'dramatic-election-scandal') {
    const election = world.elections.find(row => matches(row.id) && row.status === 'campaign' && row.country === player.country && row.city === player.city && row.electionMonth - month === 1 && row.candidates.some(c => c.personId === player.id && c.status === 'active'));
    if (election) return context({ subjectId: election.id, names: {} });
  } else if (id === 'dramatic-athlete-doping' || id === 'dramatic-scandal-movie') {
    const kind = id === 'dramatic-athlete-doping' ? 'athlete' : 'actor';
    const career = world.careers.find(row => matches(row.id) && row.personId === player.id && row.kind === kind && row.status === 'active' && row.employmentId === player.employment?.id && row.country === player.country);
    const project = career?.projects.find(row => row.status === 'active' && row.employmentId === career.employmentId);
    if (!career || !project) return;
    if (kind === 'actor') { const scandal = world.controversies.find(row => row.personId === player.id && row.impact > 0); if (scandal) return context({ subjectId: career.id, contextId: project.id, relatedId: scandal.id, names: { project: project.name } }); }
    else { const contact = career.contacts.find(personId => local(personId) && relation(personId) && world.people[personId].employment?.roleId === 'professional-athlete' && world.people[personId].employment?.employer === career.employer); if (contact) return context({ subjectId: career.id, contextId: project.id, relatedId: contact, names: { project: project.name, contact: fullName(world.people[contact]) } }, [contact]); }
  }
}
