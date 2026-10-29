import { indexLedger } from '../ledgerIndex';
import type { World } from '../model';
import { ageOn } from '../personHelpers';
import { countries } from '../countries';
import { jobs } from '../content/jobs';
import { electionOutcome } from './politicsMath';
const compare = (a: World['date'], b: World['date']) => a.year - b.year || a.month - b.month || a.day - b.day;
export function validatePolitics(world: World, ledger = indexLedger(world.ledger)) {
    const month = world.date.year * 12 + world.date.month - 1, ids = new Set<string>(), activeCandidates = new Set<string>(), appointments = new Set<string>(), spent = new Map<string, bigint>(), histories = new Map(world.workHistory.map(item => [item.id, item]));
    for (const election of world.elections) {
        const start = election.started.year * 12 + election.started.month - 1, ongoing = election.status === 'campaign', outcome = electionOutcome(election);
        if (ids.has(election.id) || election.currency !== countries[election.country].currency || compare(election.started, world.date) > 0 || election.electionMonth !== start + 6 || election.lastMonth > month || election.lastMonth < start || election.months !== election.lastMonth - start || election.months > 6 || new Set(election.candidates.map(item => item.personId)).size !== 2 || ongoing && (election.resolved || election.winnerId || election.winningEmploymentId || election.months >= 6 || election.lastMonth !== month) || !ongoing && (!election.resolved || compare(election.resolved, election.started) < 0 || compare(election.resolved, world.date) > 0 || election.months !== 6 || election.winnerId !== outcome.winnerId || election.resolved.year * 12 + election.resolved.month - 1 !== election.electionMonth))
            throw new Error('Invalid election history');
        ids.add(election.id);
        for (const [index, candidate] of election.candidates.entries()) {
            const person = world.people[candidate.personId], key = candidate.personId + ':' + election.currency;
            if (!person || ageOn({ ...person, died: null }, election.started) < 21 || candidate.periods.length !== election.months || candidate.spent !== candidate.registration + candidate.periods.reduce((sum, item) => sum + item.spent, 0n) || ongoing && candidate.votesBps || !ongoing && candidate.votesBps !== outcome.shares[index] || ongoing && candidate.status === 'active' && (person.died || activeCandidates.has(person.id) || person.country !== election.country || person.city !== election.city || person.education.stage !== 'none' || person.employment && !jobs.find(item => item.id === person.employment!.roleId)?.partTime) || candidate.periods.some((period, i) => period.month !== start + i + 1 || period.spent !== (period.funded ? candidate.monthlyBudget : 0n)))
                throw new Error('Invalid actual election candidate');
            if (ongoing && candidate.status === 'active')
                activeCandidates.add(person.id);
            spent.set(key, (spent.get(key) ?? 0n) + candidate.spent);
        }
        if (election.winnerId) {
            const job = election.winningEmploymentId && histories.get(election.winningEmploymentId);
            if (!job || job.personId !== election.winnerId || job.roleId !== 'elected-councillor' || !election.resolved || compare(job.started, election.resolved) !== 0 || appointments.has(job.id))
                throw new Error('Election winner has no actual appointment');
            appointments.add(job.id);
        }
        else if (election.winningEmploymentId)
            throw new Error('Vacant seat has an appointment');
    }
    const paid = new Map<string, bigint>();
    for (const entry of ledger.categories('campaign-spend')) {
        if (entry.cashDelta > 0n || entry.debtDelta)
            throw new Error('Invalid campaign payment');
        const key = entry.personId + ':' + entry.currency;
        paid.set(key, (paid.get(key) ?? 0n) - entry.cashDelta);
    }
    for (const key of new Set([...paid.keys(), ...spent.keys()]))
        if ((paid.get(key) ?? 0n) !== (spent.get(key) ?? 0n))
            throw new Error('Campaign spending is not funded by actual personal accounts');
    for (const history of histories.values())
        if (history.roleId === 'elected-councillor' && !appointments.has(history.id))
            throw new Error('Public office bypassed its actual election');
}
