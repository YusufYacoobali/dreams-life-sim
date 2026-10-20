import React, { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColors } from '../src/ui/theme';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import { ageOn, fullName, World } from '../src/game/model';
import { decodeSave } from '../src/persistence/archive';
import { useGame } from '../src/state/useGame';
import { openRepository } from '../src/persistence/native';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../src/ui/components';
import { EventModal, EventPresentation } from '../src/ui/EventModal';

type Preview = { kind: 'import'; text: string; world: World; replace: boolean } | { kind: 'recover'; world: World };
class SaveFileError extends Error {}
let exportSequence = 0;
const exportFileName = () => 'Dreams-save-' + new Date().toISOString().replace(/[:.]/g, '-') + '-' + exportSequence++ + '.dreams.json';
const pickerCancelled = (error: unknown) => !!error && typeof error === 'object' && 'code' in error && ['ERR_PICKER_CANCELLED', 'ERR_FILE_PICKING_CANCELLED'].includes(String(error.code));
function writeNewArchive(file: File, text: string) {
  try { file.write(text); }
  catch (error) { try { file.delete(); } catch { /* Keep the original write error if cleanup is unavailable. */ } throw error; }
}
export default function SavedLives() {
  const c = useColors();
  const lives = useGame(s => s.lives);
  const busy = useGame(s => s.busy);
  const error = useGame(s => s.error);
  const select = useGame(s => s.selectLife);
  const importLife = useGame(s => s.importLife);
  const recover = useGame(s => s.recoverLife);
  const [working, setWorking] = useState(false);
  const operation = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const run = async (action: () => Promise<void>, failure: string) => {
    if (operation.current || busy) return;
    operation.current = true;
    setWorking(true); setMessage(null);
    try { await action(); } catch (error) { if (!pickerCancelled(error)) setMessage(error instanceof SaveFileError ? error.message : failure); }
    finally { operation.current = false; setWorking(false); }
  };
  const importFile = () => run(async () => {
    const picked = await File.pickFileAsync({ mimeTypes: ['application/json', 'text/plain', 'application/octet-stream'], multipleFiles: false });
    if (picked.canceled) return;
    const file = picked.result;
    if (file.size > 64_000_000) throw new SaveFileError('This archive is too large. Choose a Dreams save under 64 MB.');
    const text = await file.text();
    let world: World;
    try { world = decodeSave(text).world; } catch { throw new SaveFileError('This file is not a supported, valid Dreams save. Your lives have not changed.'); }
    setPreview({ kind: 'import', text, world, replace: lives.some(life => life.id === world.id) });
  }, 'Could not read the selected file. Choose another copy and try again.');
  const presentation: EventPresentation | null = preview ? {
    id: preview.kind + ':' + preview.world.id, kind: 'confirmation',
    title: preview.kind === 'recover' ? 'Restore previous checkpoint?' : preview.replace ? 'Replace this saved life?' : 'Import this life?',
    body: preview.kind === 'recover' ? 'Progress and checkpoints after this moment will be discarded. This checkpoint includes its saved event and exact outcomes.' : preview.replace ? 'A life with this ID already exists. Importing replaces its current progress and Time Machine history with this file’s contents. A previous checkpoint is kept for recovery.' : 'This adds a local saved life, including any historical checkpoints and branch record in its archive, and makes it active.',
    terms: [{ id: 'name', label: 'Person', value: fullName(preview.world.people[preview.world.activePersonId]), tone: 'neutral' }, { id: 'age', label: 'Age', value: ageOn(preview.world.people[preview.world.activePersonId], preview.world.date).toString(), tone: 'neutral' }, { id: 'revision', label: 'Checkpoint', value: preview.world.revision.toString(), tone: 'neutral' }],
    confirmLabel: preview.kind === 'recover' ? 'Restore Checkpoint' : preview.replace ? 'Replace and Import' : 'Import Life',
  } : null;
  return <Page bottomSafeArea><Header title="Saved Lives" onBack={() => router.back()} trailing={<Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="settings-outline" size={25} color={c.ink} /></Pressable>} /><Body muted>View a saved life’s story, or continue it from its latest checkpoint.</Body>
    {(message || error) && <Card><View accessible accessibilityLiveRegion="polite"><Body>{message ?? error}</Body></View></Card>}
    <Button label="Import a Save" onPress={() => { void importFile(); }} disabled={busy || working} />
    {lives.length === 0 && <Card><Body>No lives saved yet.</Body></Card>}
    {lives.map(life => <Card key={life.id}><Heading size={18}>{life.name}</Heading>{life.branch && <Body muted>Time Machine branch · {life.branch.name}, age {life.branch.age} in {life.branch.date.year}</Body>}
      <Button label="View Life Summary" accessibilityLabel={'View ' + life.name + ' life summary'} tone="secondary" disabled={busy || working} onPress={() => router.push({ pathname: '/saved-life/[id]', params: { id: life.id } })} />
      <Button label="Continue" accessibilityLabel={'Continue as ' + life.name} disabled={working} busy={busy} onPress={async () => { if (await select(life.id)) router.replace('/life'); }} />
      <ActionRow title="Export save file" subtitle="Save a copy to a folder you choose" disabled={busy || working} onPress={() => { void run(async () => {
        const folder = await Directory.pickDirectoryAsync();
        const text = await (await openRepository()).export(life.id), name = exportFileName();
        const file = folder.createFile(name, 'application/json');
        writeNewArchive(file, text);
        setMessage('Saved ' + name + ' to your selected folder.');
      }, 'Could not save a copy to that folder. Choose another folder and try again.'); }} />
      <ActionRow title="Share save file" subtitle="Share a copy with another app" disabled={busy || working} onPress={() => { void run(async () => {
        const repository = await openRepository();
        const text = await repository.export(life.id);
        if (!await Sharing.isAvailableAsync()) throw new SaveFileError('File sharing is unavailable on this device. Save a copy to a folder instead.');
        const file = new File(Paths.cache, exportFileName());
        writeNewArchive(file, text);
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Export Dreams life' });
      }, 'Could not share this life. Please try again.'); }} />
      <ActionRow title="Previous checkpoint" subtitle="Preview before restoring" disabled={busy || working} disabledReason={undefined} onPress={() => { void run(async () => {
        const world = await (await openRepository()).recoveryPreview(life.id);
        setPreview({ kind: 'recover', world });
      }, 'No previous checkpoint is available.'); }} />
    </Card>)}
    <EventModal event={presentation} busy={busy} error={error} onCancel={() => setPreview(null)} onChoose={async () => {
      if (!preview) return;
      const success = preview.kind === 'import' ? await importLife(preview.text, preview.replace) : await recover(preview.world.id);
      if (success) { setPreview(null); router.replace('/life'); }
    }} />
  </Page>;
}
