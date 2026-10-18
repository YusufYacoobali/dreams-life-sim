import type { World } from '../model';
import { countries } from '../countries';
import { rules } from '../rules';
import { roundRatio } from '../money';
import { musicGenreRules } from '../content/music';
const compare = (a: World['date'], b: World['date']) => a.year - b.year || a.month - b.month || a.day - b.day;
export function validateMusic(world: World) {
    const month = world.date.year * 12 + world.date.month - 1, ids = new Set<string>(), recording = new Set<string>(), royalties = new Map<string, bigint>(), costs = new Map<string, bigint>();
    for (const release of world.musicReleases) {
        const person = world.people[release.personId], career = world.careers.find(item => item.id === release.careerId), unfinished = ['recording', 'paused'].includes(release.status), released = !!release.released, key = release.personId + ':' + release.currency, expectedQuality = release.scores.length ? Math.round(release.scores.reduce((sum, value) => sum + value, 0) / release.scores.length) : 0;
        if (ids.has(release.id) || !person || !career || career.kind !== 'musician' || career.personId !== person.id || !career.projects.some(item => item.status === 'completed' && item.ended && compare(item.ended, release.started) <= 0) || release.currency !== countries[release.country].currency || compare(release.started, person.born) < 0 || compare(release.started, world.date) > 0 || release.lastMonth > month || release.lastMonth < release.started.year * 12 + release.started.month - 1 || unfinished && (person.died || recording.has(person.id) || released || release.ended || release.lastMonth !== month) || release.status === 'paused' && !release.pauseReason || release.status !== 'paused' && release.pauseReason || release.requiredMonths !== (release.format === 'album' ? 6 : 3) || release.monthsRecorded > release.requiredMonths || release.monthsRecorded !== release.scores.length || release.paidProduction !== roundRatio(release.productionCost * BigInt(release.monthsRecorded), BigInt(release.requiredMonths)) || release.quality !== expectedQuality || release.unitPay !== (roundRatio(rules[release.country].baseWage, 2000000n) || 1n) || release.released && (release.monthsRecorded !== release.requiredMonths || compare(release.released, release.started) < 0 || compare(release.released, world.date) > 0) || ['released', 'ended'].includes(release.status) !== released || release.status === 'released' && (person.died || release.ended || release.monthsReleased >= 60) || ['ended', 'cancelled'].includes(release.status) && (!release.ended || compare(release.ended, release.started) < 0 || compare(release.ended, world.date) > 0) || !released && (release.initialMonthlyUnits || release.monthsReleased || release.totalUnits || release.royalties || release.milestone) || release.milestone && release.totalUnits < 1000000)
            throw new Error('Invalid recorded music release');
        if(released){const reception=Math.max(0,release.quality+Math.floor(release.launchFame/2)+Math.round((50-release.responseRoll)/2)),expected=Number(roundRatio(BigInt(reception*250*(release.format==='album'?3:1)*(release.responseRoll<=5?10:1))*BigInt(musicGenreRules[release.genre].audienceBps),10000n));if(release.initialMonthlyUnits!==expected)throw new Error('Music launch audience is inconsistent');}
        ids.add(release.id);
        if (unfinished)
            recording.add(person.id);
        let units = 0, paid = 0n;
        for (const [index, period] of release.periods.entries()) {
            if (!release.released || period.month <= release.released.year * 12 + release.released.month - 1 || period.month > month || index > 0 && period.month <= release.periods[index - 1].month || period.royalty !== BigInt(period.units) * release.unitPay)
                throw new Error('Invalid listening period');
            units += period.units;
            paid += period.royalty;
        }
        if (release.monthsReleased !== release.periods.length || release.totalUnits !== units || release.royalties !== paid)
            throw new Error('Music royalty history does not reconcile');
        royalties.set(key, (royalties.get(key) ?? 0n) + paid);
        costs.set(key, (costs.get(key) ?? 0n) + release.paidProduction);
    }
    const income = new Map<string, bigint>(), spend = new Map<string, bigint>();
    for (const entry of world.ledger) {
        const key = entry.personId + ':' + entry.currency;
        if (entry.category === 'career-royalties') {
            if (entry.cashDelta < 0n || entry.debtDelta)
                throw new Error('Invalid music income');
            income.set(key, (income.get(key) ?? 0n) + entry.cashDelta);
        }
        if (entry.category === 'music-production') {
            if (entry.cashDelta > 0n || entry.debtDelta)
                throw new Error('Invalid production payment');
            spend.set(key, (spend.get(key) ?? 0n) - entry.cashDelta);
        }
    }
    for (const key of new Set([...income.keys(), ...spend.keys(), ...royalties.keys(), ...costs.keys()]))
        if ((income.get(key) ?? 0n) !== (royalties.get(key) ?? 0n) || (spend.get(key) ?? 0n) !== (costs.get(key) ?? 0n))
            throw new Error('Music payments do not match actual personal accounts');
}
