import { publicRoyalDuty } from './royaltySchemas';
import { fullTimeCreator } from './creatorSchemas';
import { z } from 'zod';
import { ageOn, fullName, Person, World } from '../model';
import { countries } from '../countries';
import { rules } from '../rules';
import { roundRatio, formatMoney } from '../money';
import { IneligibleAction } from '../errors';
import { agendaIds, campaignEfforts, campaignCommitment } from './politicsSchemas';
import { recordingCommitment } from './musicSchemas';
import { active, availableCash, accountFor, bounded, charge, draw, fact, result } from './common';
import { isConfined } from './legalSchemas';
import { visibleConvictions } from './legal';
import { hospitalized } from './healthSchemas';
import { careerPayQuote, startCareerContract } from './careers';
import { endEmployment } from './work';
import { createContact } from './npcs';
import { connectPerson, relationFor } from './relationships';
import { offerPending } from '../pendingQueue';
import { gainPublicFame } from './social';
import { RuntimeEffectRow } from '../runtime';
import { jobs } from '../content/jobs';
import { electionOutcome } from './politicsMath';
export const politicsCommandSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('start-campaign'), platform: z.enum(agendaIds), effort: z.enum(campaignEfforts), quotedBudget: z.bigint().positive(), quotedAnnualPay: z.bigint().positive() }),
    z.object({ type: z.literal('campaign-plan'), electionId: z.string(), platform: z.enum(agendaIds), effort: z.enum(campaignEfforts) }),
    z.object({ type: z.literal('withdraw-campaign'), electionId: z.string() }), z.object({ type: z.literal('constituent-meeting') }),
]);
export type PoliticsCommand = z.infer<typeof politicsCommandSchema>;
type Election = World['elections'][number];
const absolute = (world: World) => world.date.year * 12 + world.date.month - 1;
export const constituentMeetingCost = (world: World) => roundRatio(rules[active(world).country].baseWage * 25n, 10000n);
export function constituentMeetingReason(world:World):string|undefined {
  const person=active(world);if(!world.careers.some(item=>item.personId===person.id&&item.kind==='politician'&&item.status==='active'))return 'You need to be serving a term in office';
  if(isConfined(world)||person.legal.wanted||hospitalized(world,person))return 'You are unavailable for a public meeting';
  if(world.actionCounts[person.id+':constituent-meeting:'+world.date.year])return 'You have already held this year’s constituency meeting';
  if(availableCash(accountFor(world))<constituentMeetingCost(world))return 'Your available balance cannot cover the venue';
}
export function campaignQuote(world: World, person = active(world)) { const base = rules[person.country].baseWage, registration = roundRatio(base * 200n, 10000n), monthly = roundRatio(base * 100n, 10000n); return { registration, monthly, total: registration + monthly * 6n, annualPay: careerPayQuote(world, 'politician', person), currency: countries[person.country].currency }; }
export function campaignReason(world: World): string | undefined {
    const person = active(world), age = ageOn(person, world.date);
    if (age < 21 || age > 80)
        return 'Local office is available at ages 21–80';
    if (isConfined(world) || person.legal.wanted || visibleConvictions(world, person).length)
        return 'A clear current background and freedom from custody are required';
    if (hospitalized(world, person) || person.stats.health < 40)
        return 'Recover before beginning a campaign';
    if (person.skills.politics < 50 || person.stats.smarts < 45 || person.stats.respect < 40 || person.publicLife.image < 35)
        return 'Requires Public Speaking 50%, Smarts 45%, Respect 40% and Public Image 35%';
    if (!person.education.qualifications.some(item => item.level === 'secondary'))
        return 'A secondary qualification is required';
    if (person.employment && !jobs.find(item => item.id === person.employment!.roleId)?.partTime || person.education.stage !== 'none' || recordingCommitment(world) || world.careers.some(item => item.personId === person.id && item.status === 'active'))
        return 'Finish or leave other full-time commitments before campaigning';
    if(publicRoyalDuty(world))return 'Choose a private royal life before campaigning';
    if(fullTimeCreator(world))return 'Switch your studio to part-time before campaigning';
    if (campaignCommitment(world))
        return 'Your current campaign is still running';
    if ((world.actionCounts[person.id + ':campaign:' + world.date.year] ?? 0) >= 2)
        return 'Two campaign starts are available per calendar year';
    if (availableCash(accountFor(world)) < campaignQuote(world).registration + campaignQuote(world).monthly)
        return 'Your available balance cannot cover registration and the first campaign period';
}
function notice(world: World, election: Election, title: string, body: string, effects: RuntimeEffectRow[] = []) { if (!election.candidates.some(item => item.personId === world.activePersonId))
    return; offerPending(world, { kind: 'result', id: 'election_' + election.id + '_' + election.months + '_' + election.status + '_' + world.revision, title, body, illustration: 'politician', effects }, 60); if (world.annual?.stage === 'months')
    world.annual.pausedForPlanning = true; }
export function resolvePolitics(world: World, command: PoliticsCommand) {
    const person = active(world);
    if (command.type === 'start-campaign') {
        const reason = campaignReason(world);
        if (reason)
            throw new IneligibleAction(reason);
        const quote = campaignQuote(world);
        if (command.quotedBudget !== quote.total || command.quotedAnnualPay !== quote.annualPay)
            throw new IneligibleAction('Review the current campaign and office-pay quote');
        const rival = createContact(world, { age: draw(world, 'npcs', 35, 55), country: person.country, city: person.city, qualifiedRole: 'administrator' });
        endEmployment(world, rival.id);
        rival.skills.politics = draw(world, 'npcs', 50, 85);
        rival.stats.smarts = Math.max(55, rival.stats.smarts);
        rival.stats.health = Math.max(70, rival.stats.health);
        rival.stats.respect = draw(world, 'npcs', 50, 80);
        rival.publicLife.image = draw(world, 'npcs', 45, 75);
        connectPerson(world, rival.id);
        const priorities = { education: draw(world, 'events', 20, 60), health: draw(world, 'events', 20, 60), housing: draw(world, 'events', 20, 60) };
        const election: Election = { id: 'election_' + person.id + '_' + world.revision, country: person.country, city: person.city, currency: quote.currency, started: { ...world.date }, resolved: null, electionMonth: absolute(world) + 6, lastMonth: absolute(world), months: 0, status: 'campaign', responseRoll: draw(world, 'outcomes', 1, 100), priorities, winnerId: null, winningEmploymentId: null, candidates: [] };
        for (const candidate of [person, rival]) {
            const terms = campaignQuote(world, candidate), platform = candidate.id === person.id ? command.platform : agendaIds[draw(world, 'npcs', 0, agendaIds.length - 1)];
            charge(world, terms.registration, 'campaign-spend', 'Election registration', undefined, election.currency, candidate);
            election.candidates.push({ personId: candidate.id, platform, effort: candidate.id === person.id ? command.effort : 'balanced', status: 'active', registration: terms.registration, monthlyBudget: terms.monthly, spent: terms.registration, quotedAnnualPay: terms.annualPay, votesBps: 0, periods: [] });
            fact(world, 'I began a local council campaign focused on ' + platform + '.', 'politics', '', candidate.id);
        }
        world.elections.push(election);
        const key = person.id + ':campaign:' + world.date.year;
        world.actionCounts[key] = (world.actionCounts[key] ?? 0) + 1;
        result(world, 'Your campaign has begun', 'You and ' + fullName(rival) + ' are contesting a local seat. The election is six months away. Your campaign budget and ordinary living costs need real funds. Running for office pays no salary.', 'politician', [{ id: 'registration', label: 'Registration paid', value: formatMoney({ minor: quote.registration, currency: quote.currency }), tone: 'negative' }, { id: 'monthly', label: 'Monthly campaign plan', value: formatMoney({ minor: quote.monthly, currency: quote.currency }), tone: 'neutral' }]);
        return;
    }
    if (command.type === 'constituent-meeting') {
        const career = world.careers.find(item => item.personId === person.id && item.kind === 'politician' && item.status === 'active');
        const unavailable=constituentMeetingReason(world);
        if(unavailable||!career)throw new IneligibleAction(unavailable??'An available serving councillor is required');
        const key = person.id + ':constituent-meeting:' + world.date.year;
        if (world.actionCounts[key])
            throw new IneligibleAction('You have already held this year’s constituency meeting');
        const cost = constituentMeetingCost(world);
        charge(world, cost, 'community-meeting', 'Constituent meeting venue');
        world.actionCounts[key] = 1;
        career.reputation = bounded(career.reputation + 3);
        person.stats.respect = bounded(person.stats.respect + 3);
        person.stats.stress = bounded(person.stats.stress + 3);
        person.publicLife.image = bounded(person.publicLife.image + 2);
        for (const contact of career.contacts) {
            if (world.people[contact].died)
                continue;
            const relation = relationFor(world, person.id, contact);
            if (relation)
                relation.strength = bounded(relation.strength + 2);
        }
        fact(world, 'I held a constituency meeting and listened to local casework.', 'politics');
        result(world, 'The meeting is over', 'Residents brought their concerns. You listened, paid the venue bill and made a plan for the local casework.', 'politician');
        return;
    }
    const election = world.elections.find(item => item.id === command.electionId && item.status === 'campaign'), candidate = election?.candidates.find(item => item.personId === person.id && item.status === 'active');
    if (!election || !candidate)
        throw new IneligibleAction('Choose your active campaign');
    if (command.type === 'withdraw-campaign') {
        candidate.status = 'withdrawn';
        fact(world, 'I withdrew from the local election.', 'politics');
        result(world, 'You withdrew', 'Your future campaign spending stops. The election remains scheduled and the other real candidate can continue. Registration and completed campaign costs are not refunded.', 'politician');
    }
    else {
        const changed = candidate.platform !== command.platform;
        candidate.platform = command.platform;
        candidate.effort = command.effort;
        if (changed)
            person.publicLife.image = bounded(person.publicLife.image - 3);
        result(world, 'Campaign plan updated', changed ? 'You changed your platform. The switch cost public image; future campaigning follows your new plan.' : 'Your effort plan will shape the remaining campaign periods.', 'politician');
    }
}
export function politicsMonth(world: World) {
    const month = absolute(world);
    for (const election of world.elections.filter(item => item.status === 'campaign')) {
        if (election.lastMonth >= month)
            continue;
        if (election.lastMonth !== month - 1)
            throw new Error('An election must process each calendar campaign period');
        election.lastMonth = month;
        election.months++;
        for (const candidate of election.candidates) {
            const person = world.people[candidate.personId];
            if (candidate.status === 'active' && (person.died || visibleConvictions(world, person).length)) {
                candidate.status = person.died ? 'deceased' : 'disqualified';
            }
            if (candidate.status !== 'active') {
                candidate.periods.push({ month, funded: false, spent: 0n, score: 0 });
                continue;
            }
            const present = !isConfined(world, person) && !person.legal.wanted && !hospitalized(world, person) && person.country === election.country && person.city === election.city, funded = present && availableCash(accountFor(world, person, election.currency)) >= candidate.monthlyBudget, spent = funded ? candidate.monthlyBudget : 0n;
            if (spent) {
                charge(world, spent, 'campaign-spend', 'Campaign outreach', undefined, election.currency, person);
                candidate.spent += spent;
            }
            const prioritiesTotal = election.priorities.education + election.priorities.health + election.priorities.housing, agenda = Math.round(election.priorities[candidate.platform] * 30 / prioritiesTotal), base = Math.round((person.skills.politics * 2 + person.stats.smarts + person.stats.respect + person.publicLife.image) / 5), score = present ? bounded(base + agenda + (funded ? 5 : -20) + (candidate.effort === 'focused' ? 5 : candidate.effort === 'publicity' ? 1 : 0) + Math.floor(person.stats.fame / 15)) : 0;
            candidate.periods.push({ month, funded, spent, score });
            if (present) {
                person.skills.politics = bounded(person.skills.politics + 1);
                person.stats.energy = bounded(person.stats.energy - (candidate.effort === 'focused' ? 3 : 1));
                person.stats.stress = bounded(person.stats.stress + (candidate.effort === 'focused' ? 2 : 1));
                if (candidate.effort === 'publicity')
                    gainPublicFame(world, person, 1);
            }
            if (month < election.electionMonth && !funded && candidate.periods.every((item, index) => index === candidate.periods.length - 1 || item.funded) && person.id === world.activePersonId)
                notice(world, election, 'Campaign funds are short', 'This campaign period could not be funded or attended. The fixed election date remains; you can review your plan before continuing.');
        }
        if (month < election.electionMonth)
            continue;
        election.status = 'completed';
        election.resolved = { ...world.date };
        const outcome = electionOutcome(election);
        election.winnerId = outcome.winnerId;
        election.candidates.forEach((candidate, index) => candidate.votesBps = outcome.shares[index]);
        const winner = election.winnerId && world.people[election.winnerId];
        if (winner) {
            const candidate = election.candidates.find(item => item.personId === winner.id)!;
            if (winner.employment)
                endEmployment(world, winner.id);
            const career = startCareerContract(world, 'politician', candidate.quotedAnnualPay, winner, false);
            election.winningEmploymentId = career.employmentId;
            winner.stats.respect = bounded(winner.stats.respect + 4);
            winner.publicLife.image = bounded(winner.publicLife.image + 3);
            gainPublicFame(world, winner, 2);
            fact(world, 'I won the local council election.', 'politics', '', winner.id);
        }
        const player = election.candidates.find(item => item.personId === world.activePersonId);
        if (player) {
            const won = election.winnerId === world.activePersonId;
            if (!won && player.status === 'active') {
                const actor = active(world);
                actor.stats.happiness = bounded(actor.stats.happiness - 3);
                actor.stats.stress = bounded(actor.stats.stress + 3);
            }
            fact(world, won ? 'I was elected to local office.' : 'I did not take the local seat.', 'politics');
            notice(world, election, won ? 'You were elected' : 'The election is over', winner ? fullName(winner) + ' won the local seat. ' + (won ? 'Your actual four-year office contract starts paying next period.' : 'Your campaign has ended. The winner’s actual term, employment and pay remain part of this world.') : 'No eligible candidate remained. The seat is vacant.', [{ id: 'votes', label: 'Your vote share', value: (player.votesBps / 100).toFixed(2) + '%', tone: won ? 'positive' : 'neutral' }, { id: 'spend', label: 'Actual campaign spending', value: formatMoney({ minor: player.spent, currency: election.currency }), tone: 'negative' }]);
        }
    }
}
export function politicsDeath(world: World, personId: string) { for (const election of world.elections.filter(item => item.status === 'campaign')) {
    const candidate = election.candidates.find(item => item.personId === personId);
    if (candidate && candidate.status === 'active')
        candidate.status = 'deceased';
} }
