import { publicRoyalDuty } from './royaltySchemas';
import { fullTimeCreator } from './creatorSchemas';
import { z } from 'zod';
import { World, ageOn } from '../model';
import { countries } from '../countries';
import { rules } from '../rules';
import { roundRatio, formatMoney } from '../money';
import { IneligibleAction } from '../errors';
import { musicFormats, musicGenres, recordingCommitment } from './musicSchemas';
import { campaignCommitment } from './politicsSchemas';
import { active, accountFor, availableCash, bounded, charge, draw, fact, post, result } from './common';
import { isConfined } from './legalSchemas';
import { hospitalized } from './healthSchemas';
import { offerPending } from '../pendingQueue';
import { fxMoney } from '../valuation';
import { gainPublicFame } from './social';
import { jobs } from '../content/jobs';
import { musicGenreRules } from '../content/music';
export const musicCommandSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('record-music'), title: z.string().trim().min(1).max(70).refine(value => !/[\u0000-\u001F]/.test(value)), genre: z.enum(musicGenres), format: z.enum(musicFormats), quotedCost: z.bigint().positive() }),
    z.object({ type: z.literal('resume-recording'), releaseId: z.string() }), z.object({ type: z.literal('cancel-recording'), releaseId: z.string() }),
]);
export type MusicCommand = z.infer<typeof musicCommandSchema>;
type Release = World['musicReleases'][number];
const absolute = (world: World) => world.date.year * 12 + world.date.month - 1;
export function recordingQuote(world: World, format: typeof musicFormats[number]) { const person = active(world), cost = roundRatio(rules[person.country].baseWage * BigInt(format === 'album' ? 1500 : 400), 10000n), months = format === 'album' ? 6 : 3; return { cost, months, currency: countries[person.country].currency, firstPayment: roundRatio(cost, BigInt(months)) }; }
export function recordingReason(world: World): string | undefined {
    const person = active(world), career = world.careers.find(item => item.personId === person.id && item.kind === 'musician');
    if (ageOn(person, world.date) < rules[person.country].adultAge)
        return 'Recording contracts are available to adults';
    if (isConfined(world) || person.legal.wanted)
        return 'Resolve custody or pursuit first';
    if (hospitalized(world, person) || person.stats.health < 25)
        return 'Recover before starting a production';
    if (!career?.projects.some(item => item.status === 'completed'))
        return 'Complete a live musician contract before self-producing a release';
    if (person.skills.music < 45)
        return 'Music skill of 45% is required';
    if (person.employment && !jobs.find(item => item.id === person.employment!.roleId)?.partTime || person.education.stage !== 'none')
        return 'Leave work or full-time study before recording';
    if(publicRoyalDuty(world))return 'Choose a private royal life before recording';
    if(fullTimeCreator(world))return 'Switch your studio to part-time before recording';
    if(campaignCommitment(world))return 'Finish or withdraw from your campaign before recording';
    if (recordingCommitment(world))
        return 'Finish or cancel your current recording first';
    if ((world.actionCounts[person.id + ':record-music:' + world.date.year] ?? 0) >= 4)
        return 'Four production starts are available per calendar year';
    if (world.musicReleases.filter(item => item.personId === person.id && item.status === 'released').length >= 12)
        return 'Twelve active release licences are the current catalogue limit';
}
function notify(world: World, release: Release, title: string, body: string) { if (release.personId !== world.activePersonId)
    return; offerPending(world, { kind: 'result', id: 'music_' + release.id + '_' + release.status + '_' + absolute(world), title, body, illustration: 'musician', effects: [] }, 52); if (world.annual?.stage === 'months')
    world.annual.pausedForPlanning = true; }
export function resolveMusic(world: World, command: MusicCommand) {
    const person = active(world);
    if (command.type === 'record-music') {
        const reason = recordingReason(world);
        if (reason)
            throw new IneligibleAction(reason);
        const quote = recordingQuote(world, command.format);
        if (command.quotedCost !== quote.cost)
            throw new IneligibleAction('Review the current production quote');
        if (availableCash(accountFor(world)) < quote.firstPayment)
            throw new IneligibleAction('Your available balance cannot cover the first production period');
        const countKey = person.id + ':record-music:' + world.date.year;
        world.actionCounts[countKey] = (world.actionCounts[countKey] ?? 0) + 1;
        const career = world.careers.find(item => item.personId === person.id && item.kind === 'musician')!;
        const release: Release = { id: 'music_' + person.id + '_' + world.revision, personId: person.id, careerId: career.id, title: command.title, genre: command.genre, format: command.format, country: person.country, currency: quote.currency, started: { ...world.date }, released: null, ended: null, status: 'recording', pauseReason: null, requiredMonths: quote.months, monthsRecorded: 0, productionCost: quote.cost, paidProduction: 0n, scores: [], quality: 0, responseRoll: draw(world, 'outcomes', 1, 100), initialMonthlyUnits: 0, launchFame: 0, decayPerMonth: musicGenreRules[command.genre].decay, unitPay: roundRatio(rules[person.country].baseWage, 2000000n) || 1n, lastMonth: absolute(world), monthsReleased: 0, totalUnits: 0, royalties: 0n, milestone: null, periods: [] };
        world.musicReleases.push(release);
        fact(world, 'I began recording ' + release.title + ', a ' + release.genre + ' ' + release.format + '.', 'music');
        result(world, 'Studio time booked', 'Recording takes actual funded monthly periods. The production budget is an expense; future royalties depend on the finished work and its audience.', 'musician', [{ id: 'budget', label: 'Total production budget', value: formatMoney({ minor: quote.cost, currency: quote.currency }), tone: 'negative' }, { id: 'periods', label: 'Production periods', value: String(quote.months), tone: 'neutral' }]);
        return;
    }
    const release = world.musicReleases.find(item => item.id === command.releaseId && item.personId === person.id);
    if (!release || !['recording', 'paused'].includes(release.status))
        throw new IneligibleAction('Choose your unfinished recording');
    if (command.type === 'cancel-recording') {
        release.status = 'cancelled';
        release.pauseReason = null;
        release.ended = { ...world.date };
        fact(world, 'I cancelled ' + release.title + ' after ' + release.monthsRecorded + ' recording periods.', 'music');
        result(world, 'Recording cancelled', 'Future production costs stop. Completed studio work and money already spent are not refunded.', 'musician');
    }
    else {
        if (release.status !== 'paused')
            throw new IneligibleAction('This recording is not paused');
        if (isConfined(world) || person.legal.wanted || hospitalized(world, person) || person.stats.health < 25 || person.employment && !jobs.find(item => item.id === person.employment!.roleId)?.partTime || person.education.stage !== 'none')
            throw new IneligibleAction('Resolve health, custody and full-time commitments first');
        const due = productionDue(release);
        if (availableCash(accountFor(world, person, release.currency)) < due)
            throw new IneligibleAction('Your available balance cannot cover the next production period');
        release.status = 'recording';
        release.pauseReason = null;
        release.lastMonth = absolute(world);
        result(world, 'Recording resumed', 'The saved work, production quote and audience response remain in place. The next funded period continues the same release.', 'musician');
    }
}
export function recordingBlockReason(world: World, release: Release): string | undefined {
    const person = world.people[release.personId];
    if (isConfined(world, person) || person.legal.wanted)
        return 'Recording is unavailable during custody or pursuit';
    if (hospitalized(world, person) || person.stats.health < 25)
        return 'Recording is paused for your health';
    if (person.employment && !jobs.find(item => item.id === person.employment!.roleId)?.partTime || person.education.stage !== 'none')
        return 'Another full-time commitment needs your time';
    if (availableCash(accountFor(world, person, release.currency)) < productionDue(release))
        return 'The next production period is not funded';
}
export const productionDue = (release: Release) => roundRatio(release.productionCost * BigInt(release.monthsRecorded + 1), BigInt(release.requiredMonths)) - release.paidProduction;
export function musicMonth(world: World) {
    const month = absolute(world);
    for (const release of world.musicReleases) {
        const person = world.people[release.personId];
        if (person.died || release.lastMonth >= month || ['cancelled', 'ended'].includes(release.status))
            continue;
        release.lastMonth = month;
        if (release.status === 'paused')
            continue;
        if (release.status === 'recording') {
            const due = productionDue(release), reason = recordingBlockReason(world, release);
            if (reason) {
                release.status = 'paused';
                release.pauseReason = reason;
                notify(world, release, 'The recording is on hold', release.title + ': ' + reason + '. Your existing work and saved response remain. Review funding or cancel before continuing.');
                continue;
            }
            charge(world, due, 'music-production', 'Recording ' + release.title, undefined, release.currency, person);
            release.paidProduction += due;
            release.monthsRecorded++;
            const score = bounded(Math.round((person.skills.music * 2 + person.stats.discipline) / 3) - (person.stats.energy < 20 ? 15 : 0) + draw(world, 'outcomes', -8, 8));
            release.scores.push(score);
            release.quality = Math.round(release.scores.reduce((sum, value) => sum + value, 0) / release.scores.length);
            person.stats.energy = bounded(person.stats.energy - 3);
            person.stats.stress = bounded(person.stats.stress + 1);
            if (release.monthsRecorded === release.requiredMonths) {
                release.status = 'released';
                release.released = { ...world.date };
                release.launchFame = person.stats.fame;
                const reception = Math.max(0, release.quality + Math.floor(release.launchFame / 2) + Math.round((50 - release.responseRoll) / 2));
                release.initialMonthlyUnits = Number(roundRatio(BigInt(reception * 250 * (release.format === 'album' ? 3 : 1) * (release.responseRoll <= 5 ? 10 : 1)) * BigInt(musicGenreRules[release.genre].audienceBps), 10000n));
                gainPublicFame(world, person, reception >= 80 ? 5 : reception >= 40 ? 2 : 0);
                fact(world, 'I released ' + release.title + '.', 'music', '', person.id);
                notify(world, release, 'Your music is released', release.title + ' is finished. The complete production cost has been paid. Actual listening periods begin next month; no projected royalties have been credited.');
            }
            continue;
        }
        const age = month - (release.released!.year * 12 + release.released!.month - 1);
        if (age <= 0)
            continue;
        const units = Number(roundRatio(BigInt(release.initialMonthlyUnits) * BigInt(Math.max(10, 100 - age * release.decayPerMonth)) * BigInt(draw(world, 'economy', 80, 120)), 10000n)), royalty = BigInt(units) * release.unitPay;
        if (royalty) {
            post(world, royalty, 0n, 'career-royalties', 'Listening royalties: ' + release.title, null, person, release.currency);
            person.finance.cycleGross += fxMoney(world, { minor: royalty, currency: release.currency }, countries[person.country].currency).minor;
        }
        release.periods.push({ month, units, royalty });
        release.monthsReleased++;
        release.totalUnits += units;
        release.royalties += royalty;
        if (!release.milestone && release.totalUnits >= 1000000) {
            release.milestone = 'One Million Listens';
            gainPublicFame(world, person, 5);
            fact(world, release.title + ' passed one million recorded listens.', 'music', '', person.id);
            notify(world, release, 'A million listens', release.title + ' has now recorded ' + release.totalUnits.toLocaleString('en-US') + ' listening units. The milestone reflects completed listening periods.');
        }
        if (release.monthsReleased >= 60) {
            release.status = 'ended';
            release.ended = { ...world.date };
            fact(world, 'The sixty-period listening licence for ' + release.title + ' ended.', 'music', '', person.id);
        }
    }
}
export function musicDeath(world: World, personId: string) { for (const release of world.musicReleases.filter(item => item.personId === personId && !['cancelled', 'ended'].includes(item.status))) {
    release.status = release.released ? 'ended' : 'cancelled';
    release.pauseReason = null;
    release.ended = { ...world.date };
} }
