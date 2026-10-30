import { FeaturePaywall } from '../purchases/PurchaseUI';
import React, { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { fullName, type World } from '../game/model';
import { countries } from '../game/countries';
import { currencyDigits, formatMoney, parseMoney } from '../game/money';
import { godModeAttributes, godModeSkills, godModeStats } from '../game/godMode';
import { draftCommands, godModeDraft, type GodModeDraft } from '../game/godModeDraft';
import { useGame } from '../state/useGame';
import { useGodModeAccess, useInternalGodModeAccess } from './GodModeAccess';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from './components';
import { FilterTabs } from './FilterTabs';
import { EventModal } from './EventModal';
import { useColors } from './theme';
import { DisplayText as Text, displayText } from './DisplayText';

const tabs = [{ id: 'money', label: 'Money' }, { id: 'stats', label: 'Stats' }, { id: 'skills', label: 'Skills & Attributes' }, { id: 'relationships', label: 'Relationships' }] as const;
const title = (key: string) => key === 'publicImage' ? 'Public image' : key.charAt(0).toUpperCase() + key.slice(1);

export function GodModeEditor() {
  const allowed = useGodModeAccess(), world = useGame(s => s.world);
  if (!allowed) return <FeaturePaywall feature="god_mode" trigger="open-god-mode" onDismiss={() => router.back()} onUnlocked={() => {}} />;
  if (!world || world.people[world.activePersonId].died || !world.birthAcknowledged) return <Page bottomSafeArea><Header title="God Mode" onBack={() => router.back()} /><Card><Body>Open a living character before using God Mode.</Body><Button label="Back" onPress={() => router.back()} /></Card></Page>;
  return <Editor key={world.id + ':' + world.activePersonId} world={world} />;
}

function Editor({ world }: { world: World }) {
  const internal = useInternalGodModeAccess();
  const [base, setBase] = useState(world), [draft, setDraft] = useState(() => godModeDraft(world));
  const [tab, setTab] = useState<typeof tabs[number]['id']>('money'), [selectedRelation, setSelectedRelation] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'save' | 'cancel' | null>(null), [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0), reload = useGame(s => s.bootstrap);
  const busy = useGame(s => s.busy), save = useGame(s => s.editGodMode), saveError = useGame(s => s.error), clearError = useGame(s => s.clearError), c = useColors();
  useEffect(() => { clearError(); }, [clearError]);
  useEffect(() => {
    if (reloadToken) { setBase(world); setDraft(godModeDraft(world)); setError(null); setConfirm(null); setReloadToken(0); }
  }, [reloadToken, world]);
  const stale = world.revision !== base.revision, disabled = busy || stale, person = base.people[base.activePersonId], locale = countries[person.country].locale;
  const original = godModeDraft(base), dirty = JSON.stringify(draft) !== JSON.stringify(original);
  const message = error ?? saveError;
  const update = <K extends 'stats' | 'skills' | 'attributes'>(group: K, key: keyof GodModeDraft[K], value: string) => { setError(null); setDraft(previous => ({ ...previous, [group]: { ...previous[group], [key]: value } })); };
  const reset = () => { setDraft(godModeDraft(world)); setBase(world); setError(null); clearError(); setConfirm(null); };
  const close = () => { if (dirty) setConfirm('cancel'); else router.back(); };
  const commit = async () => {
    try {
      const { commands } = draftCommands(base, draft);
      if (!commands.length) { setError('Make a change before saving.'); return; }
      if (await save({ lifeId: base.id, personId: base.activePersonId, expectedRevision: base.revision, commands })) { setConfirm(null); router.back(); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Check your changes.'); }
  };
  const requestSave = () => {
    setError(null); clearError();
    try {
      const { commands, destructive } = draftCommands(base, draft);
      if (!commands.length) { setError('Make a change before saving.'); return; }
      if (destructive) setConfirm('save'); else void commit();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Check your changes.'); }
  };
  const presetStats = (mode: 'max' | 'min' | 'perfect') => setDraft(previous => ({ ...previous, stats: Object.fromEntries(godModeStats.map(key => [key, String(mode === 'min' || mode === 'perfect' && key === 'stress' ? 0 : 100)])) as GodModeDraft['stats'] }));
  const accounts = base.accounts.filter(item => item.ownerId === person.id), relationships = base.relationships.filter(item => item.from === person.id || item.to === person.id);
  const relation = relationships.find(item => item.id === selectedRelation);
  return <Page bottomSafeArea footer={<>
    {message && !confirm && <Text accessibilityRole="alert" style={{ color: c.red }}>{message}</Text>}
    <Button label="Save Changes" busy={busy} disabled={disabled || !dirty} onPress={requestSave} />
    <Button label="Cancel" tone="secondary" disabled={busy} onPress={close} />
  </>}><Header title="God Mode Editor" onBack={busy ? undefined : close} />
    {internal && <Card><ActionRow title="Mini-Game Playground" subtitle="Practice all three challenges without changing this life" onPress={() => router.push('/mini-game-playground')} /></Card>}
    <Card><Heading size={20}>{fullName(person)}</Heading><Body muted>Changes apply together when saved. A checkpoint is kept before each edit.</Body>
      <Body muted>Normal gameplay continues to change these values. Fame can rise to the level supported by an existing audience. Health at 0 can cause death on the next Age Up.</Body>
      <Button label="Reset Changes" tone="secondary" disabled={disabled || !dirty} onPress={reset} />
    </Card>
    {(stale || saveError && /changed|reload/i.test(saveError)) && <Card><Text accessibilityRole="alert" style={{ color: c.red }}>This life changed while the editor was open. Reload values to continue; unsaved changes will be discarded.</Text><Button label="Reload Values" disabled={busy} onPress={() => { void reload().then(ok => { if (ok) setReloadToken(value => value + 1); }); }} /></Card>}
    <FilterTabs values={tabs} selected={tab} onSelect={setTab} />
    {tab === 'money' && accounts.map(account => {
      const edit = draft.money[account.id];
      let preview = '', invalid = '';
      if (edit.amount.trim()) try {
        const amount = parseMoney(edit.amount, account.currency).minor, balance = edit.operation === 'set' ? amount : account.cash + (edit.operation === 'subtract' ? -amount : amount);
        if (balance < account.lockedCash) invalid = 'Keep the balance at or above funds held in trust and zero.';
        else preview = formatMoney({ minor: balance, currency: account.currency }, locale);
      } catch (cause) { invalid = cause instanceof Error ? cause.message : 'Enter a valid amount.'; }
      const moneyChange = (value: Partial<typeof edit>) => { setError(null); setDraft(previous => ({ ...previous, money: { ...previous.money, [account.id]: { ...previous.money[account.id], ...value } } })); };
      return <Card key={account.id}><Heading size={19}>{account.currency} account</Heading><Body>Current balance: {formatMoney({ minor: account.cash, currency: account.currency }, locale)}</Body>
        {account.lockedCash > 0n && <Body muted>Held in trust: {formatMoney({ minor: account.lockedCash, currency: account.currency }, locale)}. These funds remain locked.</Body>}
        {(['set', 'add', 'subtract'] as const).map(operation => <Button key={operation} label={operation === 'set' ? 'Set exact balance' : operation === 'add' ? 'Add money' : 'Subtract money'} accessibilityLabel={displayText(title(operation) + ' ' + account.currency + ' money')} accessibilityRole="radio" accessibilityState={{ checked: edit.operation === operation }} tone={edit.operation === operation ? 'primary' : 'secondary'} disabled={disabled} onPress={() => moneyChange({ operation })} />)}
        <TextInput accessibilityLabel={displayText(account.currency + ' amount')} editable={!disabled} value={edit.amount} onChangeText={amount => moneyChange({ amount })} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={c.muted} maxLength={40} style={{ color: c.ink, borderColor: c.line, borderWidth: 1, borderRadius: 10, minHeight: 48, padding: 12, fontSize: 16 }} />
        <Body muted>Presets use the selected operation.</Body><View style={{ gap: 8 }}>{[10000, 100000, 1000000, 10000000, 1000000000].map(amount => <Button key={amount} label={formatMoney({ minor: BigInt(amount) * 10n ** BigInt(currencyDigits[account.currency]), currency: account.currency }, locale)} tone="secondary" disabled={disabled} onPress={() => moneyChange({ amount: String(amount) })} />)}</View>
        {!!preview && <Body>After saving: {preview}</Body>}{!!invalid && <Text accessibilityRole="alert" style={{ color: c.red }}>{invalid}</Text>}
      </Card>;
    })}
    {tab === 'stats' && <><Card><Button label="Perfect Stats" disabled={disabled} onPress={() => presetStats('perfect')} /><Body muted>All core stats at 100 with stress at 0.</Body><Button label="Max All Stats" tone="secondary" disabled={disabled} onPress={() => presetStats('max')} /><Body muted>Includes stress at 100.</Body><Button label="Min All Stats" tone="secondary" disabled={disabled} onPress={() => presetStats('min')} /></Card>
      <Card>{godModeStats.map(key => <Percentage key={key} label={title(key)} value={draft.stats[key]} disabled={disabled} onChange={value => update('stats', key, value)} />)}</Card></>}
    {tab === 'skills' && <><Card><Heading size={19}>Career skills</Heading>{godModeSkills.map(key => <Percentage key={key} label={title(key)} value={draft.skills[key]} disabled={disabled} onChange={value => update('skills', key, value)} />)}</Card><Card><Heading size={19}>Additional attributes</Heading>{godModeAttributes.map(key => <Percentage key={key} label={title(key)} value={draft.attributes[key]} disabled={disabled} onChange={value => update('attributes', key, value)} />)}</Card></>}
    {tab === 'relationships' && <><Card><Heading size={19}>Select a relationship</Heading>{!relationships.length && <Body muted>No relationships available.</Body>}{relationships.map(item => <ActionRow key={item.id} title={fullName(base.people[item.from === person.id ? item.to : item.from])} subtitle={item.kind + (item.id === selectedRelation ? ' · Selected' : '')} disabled={disabled} onPress={() => setSelectedRelation(item.id)} />)}</Card>{relation && <Card><Heading size={19}>Relationship values</Heading>{(['strength', 'trust'] as const).map(field => <Percentage key={field} label={field === 'strength' ? 'Relationship strength' : 'Trust'} value={draft.relationships[relation.id][field]} disabled={disabled} onChange={value => setDraft(previous => ({ ...previous, relationships: { ...previous.relationships, [relation.id]: { ...previous.relationships[relation.id], [field]: value } } }))} />)}<Body muted>Family links, marriage and custody stay intact.</Body></Card>}</>}
    <EventModal event={confirm ? { id: 'god-mode-' + confirm, kind: 'confirmation', title: confirm === 'save' ? 'Save these changes?' : 'Discard unsaved changes?', body: confirm === 'save' ? 'Some balances or attributes will decrease, or stress will increase. Health at 0 can cause death during normal gameplay. A pre-edit checkpoint will be saved.' : 'Your saved life will keep its current values.', terms: [], confirmLabel: confirm === 'save' ? 'Confirm Save Changes' : 'Discard Changes' } : null} busy={busy} error={message} onCancel={() => { setConfirm(null); setError(null); }} onChoose={() => { if (confirm === 'save') void commit(); else router.back(); }} />
  </Page>;
}

/** A native responder slider with screen-reader actions and an exact input. */
function Percentage({ label, value, disabled, onChange }: { label: string; value: string; disabled: boolean; onChange: (value: string) => void }) {
  const c = useColors(), [width, setWidth] = useState(1), numeric = Number(value), valid = /^\d{1,3}$/.test(value.trim()) && numeric <= 100, current = valid ? numeric : 0;
  const slide = (x: number) => { if (!disabled) onChange(String(Math.round(Math.max(0, Math.min(1, (x - 12) / Math.max(1, width - 24))) * 100))); };
  return <View style={{ gap: 6, paddingVertical: 10 }}><Body>{label}: {valid ? numeric : '—'}/100</Body>
    <View accessible accessibilityRole="adjustable" accessibilityLabel={displayText(label + ' slider')} accessibilityValue={{ min: 0, max: 100, now: current }} accessibilityState={{ disabled }} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={event => { if (!disabled && ['increment', 'decrement'].includes(event.nativeEvent.actionName)) onChange(String(Math.max(0, Math.min(100, current + (event.nativeEvent.actionName === 'increment' ? 1 : -1))))); }}
      onLayout={event => setWidth(event.nativeEvent.layout.width)} onStartShouldSetResponder={() => !disabled} onMoveShouldSetResponder={() => !disabled} onResponderGrant={event => slide(event.nativeEvent.locationX)} onResponderMove={event => slide(event.nativeEvent.locationX)} style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, opacity: disabled ? 0.5 : 1 }}>
      <View pointerEvents="none" style={{ height: 6, borderRadius: 4, backgroundColor: c.track }}><View style={{ width: current + '%' as `${number}%`, height: 6, backgroundColor: c.actionBlue, borderRadius: 4 }} /><View style={{ position: 'absolute', left: current + '%' as `${number}%`, marginLeft: -10, top: -7, height: 20, width: 20, borderRadius: 10, backgroundColor: c.actionBlue }} /></View>
    </View>
    <TextInput accessibilityLabel={displayText(label + ' value')} value={value} editable={!disabled} onChangeText={onChange} keyboardType="number-pad" maxLength={4} style={{ minHeight: 48, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: valid ? c.line : c.red, color: c.ink, fontSize: 16 }} />
    {!valid && <Text accessibilityRole="alert" style={{ color: c.red }}>Enter a whole number from 0 to 100.</Text>}
  </View>;
}
