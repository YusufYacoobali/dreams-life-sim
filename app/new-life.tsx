import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { royalCountries } from '../src/game/content/royalty';
import { countries, countryCodes, CountryCode } from '../src/game/countries';
import { Creation, creationSchema } from '../src/game/createLife';
import { freshSeed, useGame } from '../src/state/useGame';
import { useCreationDraft } from '../src/state/creationDraft';
import { ActionRow, Body, Button, Card, Header, Heading, Page, Portrait } from '../src/ui/components';
import { avatarPresets, countryFlags, CreationProgress, SectionLabel } from '../src/ui/CreationElements';
import { EventModal, EventPresentation } from '../src/ui/EventModal';
import { useColors } from '../src/ui/theme';
import { FamilyPreferences } from '../src/ui/FamilyPreferences';
import { genders } from '../src/game/systems/familySchemas';
import { useFeedbackPress } from '../src/ui/feedback';
import { useCinematicTransition } from '../src/ui/cinematic/CinematicContext';

export default function NewLife() {
  const firstNameInput = useRef<TextInput>(null), lastNameInput = useRef<TextInput>(null);
  const submitting = useRef(false);
  const { play } = useCinematicTransition();
  const params = useLocalSearchParams<{ seed?: string; mode?: string }>(), parsedSeed = Number(params.seed);
  const seed = Number.isInteger(parsedSeed) && parsedSeed >= 0 && parsedSeed <= 0xFFFFFFFF ? parsedSeed : 0;
  const draft = useCreationDraft(s => s.draft), begin = useCreationDraft(s => s.begin), changeDraft = useCreationDraft(s => s.edit), randomise = useCreationDraft(s => s.randomise), customise = useCreationDraft(s => s.customise);
  const [field, setField] = useState<'country' | 'city' | null>(null), [message, setMessage] = useState<string | null>(null), [confirm, setConfirm] = useState<{ input: Creation; seed: number } | null>(null), [advanced, setAdvanced] = useState(false);
  const world = useGame(s => s.world), start = useGame(s => s.startLife), busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors();
  const tap = useFeedbackPress((action: () => unknown) => action(), busy);
  useFocusEffect(useCallback(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => busy || submitting.current);
    return () => listener.remove();
  }, [busy]));
  useEffect(() => { begin(seed, params.mode === 'random' ? 'random' : 'custom'); }, [seed, params.mode, begin]);
  if (!draft) return <Page bottomSafeArea><ActivityIndicator accessibilityLabel="Preparing your new life" /></Page>;
  const { input, mode } = draft, edit = (change: Partial<Creation>) => {
    const current = useCreationDraft.getState().draft;
    if (busy || submitting.current || !current || current.seed !== draft.seed) return false;
    if (Object.entries(change).every(([key, value]) => JSON.stringify(current.input[key as keyof Creation]) === JSON.stringify(value))) return false;
    changeDraft(change); setMessage(null); return true;
  };
  const chooseLocation = (next: 'country' | 'city') => { Keyboard.dismiss(); setField(next); };
  const reroll = () => { const candidate = freshSeed(), next = candidate === draft.seed ? (candidate + 0x9e3779b9) >>> 0 : candidate; randomise(next); router.setParams?.({ seed: String(next), mode: 'random' }); };
  const cycleAvatar = (direction: number) => { const current = input.appearance.identity ?? 0, index = (current + direction + avatarPresets.length) % avatarPresets.length; return edit({ appearance: { ...avatarPresets[index] } }); };
  const validated = () => {
    const parsed = creationSchema.safeParse(input);
    if (parsed.success) return parsed.data;
    const field = parsed.error.issues[0].path[0];
    setMessage(field === 'firstName' ? 'Enter a first name.' : field === 'lastName' ? 'Enter a last name.' : 'Check your life details and try again.');
    if (field === 'firstName') firstNameInput.current?.focus();
    else if (field === 'lastName') lastNameInput.current?.focus();
    return null;
  };
  const submit = async (creation = validated(), selectedSeed = draft.seed) => {
    if (!creation || busy || submitting.current) return false;
    submitting.current = true;
    let saved = false;
    try {
      saved = await start(creation, selectedSeed);
      if (saved) play('birth', '/birth', () => { try { router.replace('/birth'); } finally { submitting.current = false; } });
      return saved;
    } finally { if (!saved) submitting.current = false; }
  };
  const selection: EventPresentation | null = field ? { id: 'creation:' + field, kind: 'selection', title: field === 'country' ? 'Choose a country' : 'Choose a city', body: 'Where will your life begin?', confirmLabel: 'Choose', choices: field === 'country' ? countryCodes.map(id => ({ id, label: countries[id].name })) : countries[input.country].cities.map(id => ({ id, label: id })) } : null;
  return <Page bottomSafeArea footer={<>
    {!confirm && (message || error) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, lineHeight: 21 }}>{message ?? error}</Text>}
    <Button label="Start My Life" tone="positive" busy={busy} onPress={() => { if (busy || submitting.current) return false; Keyboard.dismiss(); const creation = validated(); if (!creation) return false; if (world) setConfirm({ input: creation, seed: draft.seed }); else return submit(creation); }} />
  </>}><Header title="New Life" backDisabled={busy} onBack={() => { if (busy || submitting.current) return false; router.back(); }} /><CreationProgress step={1} />
    <View style={{ alignItems: 'center', gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 28 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous avatar" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => tap(() => cycleAvatar(-1))} style={{ padding: 10, minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: c.surface }}><Ionicons name="chevron-back" size={22} color={c.ink} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose Appearance" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => tap(() => router.push('/appearance'))}><Portrait decorative name="Your adult appearance" appearance={input.appearance} age={25} size={118} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Next avatar" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => tap(() => cycleAvatar(1))} style={{ padding: 10, minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: c.surface }}><Ionicons name="chevron-forward" size={22} color={c.ink} /></Pressable>
      </View>
      <Heading centered size={27}>{mode === 'random' ? 'Let Fate Decide' : 'A New Beginning'}</Heading><Body muted centered>{mode === 'random' ? 'Meet your next life. Keep it, or roll again.' : 'Every life has a story. What’s yours?'}</Body>
    </View>
    {mode === 'random' ? <><Card><Heading size={21}>{input.firstName} {input.lastName}</Heading><Body>{input.gender === 'nonbinary' ? 'Non-binary' : input.gender === 'male' ? 'Male' : 'Female'}</Body><Body>{countryFlags[input.country]} {input.city}, {countries[input.country].name}</Body><Body muted>Your family and starting circumstances unfold when your life begins.</Body></Card><Button label="Roll Again" tone="secondary" disabled={busy} onPress={reroll} /><Button label="Customise This Life" tone="secondary" disabled={busy} onPress={() => { customise(); router.setParams?.({ mode: 'custom' }); }} /></> : <>
      <SectionLabel>YOUR IDENTITY</SectionLabel><Card style={{ gap: 0 }}>
        {(['firstName', 'lastName'] as const).map(key => <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 55, borderBottomWidth: 1, borderBottomColor: c.line }}><Ionicons name="person" color={c.muted} size={22} /><Text style={{ flex: 1, color: c.muted, fontSize: 15 }}>{key === 'firstName' ? 'First Name' : 'Last Name'}</Text><TextInput ref={key === 'lastName' ? lastNameInput : firstNameInput} accessibilityLabel={key === 'firstName' ? 'First name' : 'Last name'} accessibilityState={{ disabled: busy }} value={input[key]} maxLength={40} editable={!busy} autoCapitalize="words" autoCorrect={false} returnKeyType={key === 'firstName' ? 'next' : 'done'} submitBehavior={key === 'firstName' ? 'submit' : 'blurAndSubmit'} onSubmitEditing={() => { if (busy) return; if (key === 'firstName') lastNameInput.current?.focus(); else Keyboard.dismiss(); }} onChangeText={value => edit({ [key]: value })} style={{ maxWidth: '55%', minWidth: 90, minHeight: 48, color: c.ink, fontWeight: '600', textAlign: 'right', fontSize: 16 }} /></View>)}
        <View accessibilityRole="radiogroup" accessibilityLabel="Gender" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 12 }}>{genders.map(gender => <Pressable key={gender} accessibilityRole="radio" accessibilityLabel={gender === 'nonbinary' ? 'Non-binary' : gender === 'male' ? 'Male' : 'Female'} accessibilityState={{ checked: input.gender === gender, disabled: busy }} disabled={busy} onPress={() => tap(() => edit({ gender }))} style={{ flexGrow: 1, flexBasis: 'auto', minWidth: 90, maxWidth: '100%', minHeight: 48, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: input.gender === gender ? c.actionBlue : c.inset }}><Text style={{ color: input.gender === gender ? '#FFFFFF' : c.ink, fontWeight: '600', fontSize: 13, textAlign: 'center', flexShrink: 1 }}>{gender === 'nonbinary' ? 'Non-binary' : gender === 'male' ? 'Male' : 'Female'}</Text></Pressable>)}</View>
        <ActionRow title="Appearance" value="Customise" icon={<Ionicons name="color-palette" color={c.purple} size={25} />} disabled={busy} disabledReason={undefined} onPress={() => router.push('/appearance')} />
      </Card>
      <SectionLabel>WHERE WILL YOU BE BORN?</SectionLabel><Card style={{ gap: 0 }}><ActionRow title="Country" value={countryFlags[input.country] + ' ' + countries[input.country].name} icon={<Ionicons name="earth" color={c.muted} size={24} />} disabled={busy} disabledReason={undefined} onPress={() => chooseLocation('country')} /><ActionRow title="City" value={input.city} icon={<Ionicons name="location" color={c.muted} size={24} />} disabled={busy} disabledReason={undefined} onPress={() => chooseLocation('city')} /></Card>
      <ActionRow accessibilityState={{ expanded: advanced }} title="More Options" subtitle="Family background and future preferences" value={advanced ? 'Open' : input.background === 'royal' ? 'Royal family' : undefined} disabled={busy} disabledReason={undefined} onPress={() => setAdvanced(!advanced)} />
      {advanced && <><SectionLabel>FAMILY BACKGROUND</SectionLabel><Card style={{ gap: 0 }}><ActionRow accessibilityRole="radio" accessibilityState={{ checked: input.background !== 'royal' }} title="Ordinary Family" subtitle="Make your own way through life" value={input.background !== 'royal' ? 'Selected' : undefined} disabled={busy} onPress={() => edit({ background: 'ordinary' })} /><ActionRow accessibilityRole="radio" accessibilityState={{ checked: input.background === 'royal' }} title="Royal Family" subtitle="A title and a real family succession" value={input.background === 'royal' ? 'Selected' : undefined} disabled={busy} disabledReason={(royalCountries as readonly string[]).includes(input.country) ? undefined : 'Choose the United Kingdom, Japan or Spain'} onPress={() => edit({ background: 'royal' })} /></Card><Card><Body muted>These choices are independent of appearance and gender. Dating preferences can change in My Life when you are an adult.</Body><FamilyPreferences attractedTo={input.attractedTo ?? [...genders]} wantsChildren={input.wantsChildren ?? true} disabled={busy} onChange={preferences => { if (preferences.wantsChildren !== (useCreationDraft.getState().draft?.input.wantsChildren ?? true)) tap(() => edit(preferences)); else edit(preferences); }} /><Body>Reproductive capacity</Body><View accessibilityRole="radiogroup" accessibilityLabel="Reproductive capacity" style={{ gap: 12 }}>{(['carry', 'contribute', 'neither'] as const).map(role => <Button key={role} accessibilityRole="radio" accessibilityState={{ checked: (input.reproductiveRole ?? (input.gender === 'female' ? 'carry' : input.gender === 'male' ? 'contribute' : 'neither')) === role }} label={role === 'carry' ? 'Can carry a pregnancy' : role === 'contribute' ? 'Can contribute to conception' : 'Neither'} tone={(input.reproductiveRole ?? (input.gender === 'female' ? 'carry' : input.gender === 'male' ? 'contribute' : 'neither')) === role ? 'primary' : 'secondary'} disabled={busy} onPress={() => edit({ reproductiveRole: role })} />)}</View></Card></>}
      <SectionLabel>YOUR START</SectionLabel><Card style={{ gap: 0 }}><ActionRow title="Random Life" subtitle="Let fate decide everything" icon={<Ionicons name="dice" color={c.muted} size={28} />} disabled={busy} disabledReason={undefined} onPress={reroll} /></Card>
    </>}
    <EventModal event={selection} busy={busy} onCancel={() => setField(null)} onChoose={id => { if (field === 'country') { const country = id as CountryCode; if (country !== input.country) edit({ country }); } else if (id !== input.city) edit({ city: id }); setField(null); }} />
    <EventModal event={confirm ? { id: 'new-life-confirm', kind: 'confirmation', title: 'Start another life?', body: 'Your current life will stay in Saved Lives. You can return to it later.', terms: [{ id: 'person', label: 'New life', value: confirm.input.firstName + ' ' + confirm.input.lastName, tone: 'neutral' }, { id: 'birthplace', label: 'Birthplace', value: confirm.input.city + ', ' + countries[confirm.input.country].name, tone: 'neutral' }], confirmLabel: 'Start a New Life' } : null} busy={busy} error={error} onCancel={() => setConfirm(null)} onChoose={async () => { if (confirm && await submit(confirm.input, confirm.seed)) setConfirm(null); }} />
  </Page>;
}
