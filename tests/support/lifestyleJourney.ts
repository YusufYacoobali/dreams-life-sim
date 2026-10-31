import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { moneyJSON, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { SaveRepository } from '../../src/persistence/repository';
import { diskDatabase } from './refinementSqlite';
export async function lifestyleJourney(initial: World) {
    const folder = mkdtempSync(join(tmpdir(), 'dreams-lifestyle-journey-')), file = join(folder, 'life.db');
    let { sqlite, driver } = diskDatabase(file), repository = new SaveRepository(driver), world = initial;
    const trace: {
        command: GameCommand;
        date: World['date'];
        revision: number;
    }[] = [];
    await repository.initialise();
    await repository.create(world);
    const run = { get world() { return world; }, trace,
        async command(command: GameCommand, failReceipt = false) {
            const before = world, expected = resolveCommand(before, command, true), receipt = 'lifestyle:journey:' + before.revision;
            if (failReceipt) {
                const receipts = sqlite.prepare('SELECT * FROM receipts ORDER BY 1,2').all();
                sqlite.exec("CREATE TRIGGER reject_lifestyle_receipt BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'controlled lifestyle save failure'); END");
                await expect(repository.commit(expected, before.revision, receipt, command.type === 'advance')).rejects.toThrow('controlled lifestyle save failure');
                expect(await repository.load(before.id)).toEqual(before);
                expect(sqlite.prepare('SELECT * FROM receipts ORDER BY 1,2').all()).toEqual(receipts);
                sqlite.exec('DROP TRIGGER reject_lifestyle_receipt');
                expect(resolveCommand(before, command, true)).toEqual(expected);
            }
            await repository.commit(expected, before.revision, receipt, command.type === 'advance');
            if (failReceipt)
                expect(await repository.commit(expected, before.revision, receipt, command.type === 'advance')).toEqual(expected);
            sqlite.close();
            ({ sqlite, driver } = diskDatabase(file));
            repository = new SaveRepository(driver);
            await repository.initialise();
            world = await repository.load(before.id);
            expect(world).toEqual(expected);
            trace.push({ command, date: { ...world.date }, revision: world.revision });
        },
        async settle(onPause?: () => Promise<boolean>) { let guard = 0; while ((world.pending || world.annual) && guard++ < 200) {
            const event = world.pending;
            if (event?.kind === 'decision') {
                const choices = event.choices.filter(choice => !choiceUnavailable(world, choice));
                if (!choices.length)
                    throw Error('No eligible choice at ' + event.templateId);
                const choice = event.templateId === 'property-sale-offer' ? choices.find(choice => choice.id === 'accept') ?? choices[0] : choices[0];
                await run.command({ type: 'choose', eventId: event.id, choiceId: choice.id });
            }
            else if (event)
                await run.command({ type: 'acknowledge', resultId: event.id });
            else if (onPause && await onPause())
                continue;
            else
                await run.command({ type: 'resume' });
        } expect(guard).toBeLessThan(200); },
        async act(command: GameCommand, failReceipt = false) { await run.command(command, failReceipt); await run.settle(); },
        async year(onPause?: () => Promise<boolean>) { await run.command({ type: 'advance' }); await run.settle(onPause); },
        async branch() { const snapshots = await repository.snapshots(world.id); if (!snapshots.length)
            throw Error('Expected a real pre-year snapshot'); const before = world, branch = await repository.restoreBranch(world.id, snapshots[0].id, world.revision, 'life_lifestyle_branch', 'lifestyle-restore'); expect(branch.id).toBe('life_lifestyle_branch'); expect(await repository.load(before.id)).toEqual(before); return branch; },
        evidence(label: string) { const record = { label, date: world.date, commands: trace, final: { generation: world.generation, activePersonId: world.activePersonId, people: Object.keys(world.people).length, ledgerRows: world.ledger.length, assets: world.assets, pets: world.pets, hobbies: world.hobbies.map(hobby => ({ ...hobby, practices: hobby.practices.length })), lifestyle: world.lifestyle } }; if (process.env.DREAMS_LIFESTYLE_JOURNEY_DIR)
            writeFileSync(join(process.env.DREAMS_LIFESTYLE_JOURNEY_DIR, label + '.json'), JSON.stringify(record, moneyJSON, 2)); return record; },
        close() { sqlite.close(); rmSync(folder, { recursive: true, force: true }); },
    };
    return run;
}
