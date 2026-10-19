import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { royalCountries } from '../src/game/content/royalty';
import { CareerArt } from '../src/assets/CareerArt';
import { countries, countryCodes, CountryCode } from '../src/game/countries';
import { creationSchema, randomCreation } from '../src/game/createLife';
import { useGame } from '../src/state/useGame';
import { ActionRow, Body, Button, Card, Header, Page, Portrait } from '../src/ui/components';
import { EventModal, EventPresentation } from '../src/ui/EventModal';
import { useColors } from '../src/ui/theme';
import { faceLabels, hairColors, hairLabels, skinTones } from '../src/assets/portraitLayout';
import { FamilyPreferences } from '../src/ui/FamilyPreferences';
import { genders } from '../src/game/systems/familySchemas';

export default function NewLife() {
  const params = useLocalSearchParams<{ seed?: string }>();
  const parsedSeed = Number(params.seed);
  const seed = Number.isInteger(parsedSeed) && parsedSeed >= 0 && parsedSeed <= 0xFFFFFFFF ? parsedSeed : 0;
  const [input, setInput] = useState(() => randomCreation(seed));
  const [field, setField] = useState<'country' | 'city' | 'hair' | 'face' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const world = useGame(s => s.world);
  const start = useGame(s => s.startLife);
  const busy = useGame(s => s.busy);
  const error = useGame(s => s.error);
  const c = useColors();
  const submit = async () => {
    const result = creationSchema.safeParse(input);
    if (!result.success) { setMessage(result.error.issues[0].message); return; }
    if (await start(result.data, seed)) router.replace('/birth');
  };
  const selection: EventPresentation | null = field ? {
    id: 'creation:' + field, kind: 'selection', title: field === 'country' ? 'Choose a country' : field === 'city' ? 'Choose a city' : field === 'face' ? 'Face shape' : 'Hairstyle',
    body: field === 'country' || field === 'city' ? 'Where will your life begin?' : 'What feels like you?', confirmLabel: 'Choose',
    choices: field === 'country' ? countryCodes.map(id => ({ id, label: countries[id].name })) : field === 'city' ? countries[input.country].cities.map(id => ({ id, label: id })) : (field === 'face' ? faceLabels : hairLabels).map((label, index) => ({ id: index.toString(), label })),
  } : null;
  return <Page>
    <Header title="New Life" onBack={() => router.back()} />
    <View style={{ alignItems: 'center', gap: 12 }}>
      <Portrait name={input.firstName + ' ' + input.lastName} appearance={input.appearance} age={25} size={110} />
      <Body muted centered>Adult appearance</Body>
      <Body muted centered>Meet your next questionable decision-maker.</Body>
    </View>
    <Card>
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600' }}>YOUR IDENTITY</Text>
      <Text style={{ color: c.ink }}>First name</Text>
      <TextInput accessibilityLabel="First name" value={input.firstName} maxLength={40} onChangeText={firstName => setInput({ ...input, firstName })} style={{ borderBottomWidth: 1, borderBottomColor: c.line, paddingVertical: 10, color: c.ink, fontSize: 17 }} />
      <Text style={{ color: c.ink }}>Last name</Text>
      <TextInput accessibilityLabel="Last name" value={input.lastName} maxLength={40} onChangeText={lastName => setInput({ ...input, lastName })} style={{ borderBottomWidth: 1, borderBottomColor: c.line, paddingVertical: 10, color: c.ink, fontSize: 17 }} />
      <View accessibilityRole="radiogroup" accessibilityLabel="Gender" style={{ flexDirection: 'row', gap: 6 }}>
        {(['male', 'female', 'nonbinary'] as const).map(gender => <Pressable key={gender} accessibilityRole="radio" accessibilityState={{ checked: input.gender === gender }} onPress={() => setInput({ ...input, gender })} style={{ flex: 1, minHeight: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: input.gender === gender ? c.blue : c.background }}><Text style={{ color: input.gender === gender ? '#FFFFFF' : c.ink, fontWeight: '600' }}>{gender === 'nonbinary' ? 'Non-binary' : gender === 'male' ? 'Male' : 'Female'}</Text></Pressable>)}
      </View>
    </Card>
    <Card>
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600' }}>APPEARANCE</Text>
      <ActionRow title="Face shape" value={faceLabels[input.appearance.face]} onPress={() => setField('face')} />
      <Body muted>Skin tone</Body>
      <View accessibilityRole="radiogroup" accessibilityLabel="Skin tone" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{skinTones.map((tone, skin) => <Pressable key={tone} accessibilityRole="radio" accessibilityLabel={'Skin tone ' + (skin + 1)} accessibilityState={{ checked: input.appearance.skin === skin }} onPress={() => setInput({ ...input, appearance: { ...input.appearance, skin } })} style={{ width: 44, height: 44, borderRadius: 22, borderColor: input.appearance.skin === skin ? c.blue : c.line, borderWidth: input.appearance.skin === skin ? 3 : 1, padding: 4 }}><View style={{ flex: 1, borderRadius: 18, backgroundColor: tone }} /></Pressable>)}</View>
      <ActionRow title="Hairstyle" value={hairLabels[input.appearance.hair]} onPress={() => setField('hair')} />
      <Body muted>Hair colour</Body>
      <View accessibilityRole="radiogroup" accessibilityLabel="Hair colour" style={{ flexDirection: 'row', gap: 8 }}>{hairColors.map((tone, hairColor) => <Pressable key={tone} accessibilityRole="radio" accessibilityLabel={['Black', 'Brown', 'Chestnut', 'Blond', 'Auburn'][hairColor]} accessibilityState={{ checked: input.appearance.hairColor === hairColor }} onPress={() => setInput({ ...input, appearance: { ...input.appearance, hairColor } })} style={{ width: 44, height: 44, borderRadius: 22, borderColor: input.appearance.hairColor === hairColor ? c.blue : c.line, borderWidth: input.appearance.hairColor === hairColor ? 3 : 1, padding: 4 }}><View style={{ flex: 1, borderRadius: 18, backgroundColor: tone }} /></Pressable>)}</View>
    </Card>
    <Card>
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600' }}>WHERE WILL YOU BE BORN?</Text>
      <ActionRow title="Country" value={countries[input.country].name} onPress={() => setField('country')} />
      <ActionRow title="City" value={input.city} onPress={() => setField('city')} />
    </Card>
    <Card><Text style={{color:c.muted,fontSize:12,fontWeight:'600'}}>FAMILY BACKGROUND</Text><ActionRow title="Ordinary Family" subtitle="Your family makes its own way through life" value={input.background!=='royal'?'Selected':undefined} onPress={()=>setInput({...input,background:'ordinary'})}/><ActionRow title="Royal Family" subtitle="A title, public duties and an actual family succession" value={input.background==='royal'?'Selected':undefined} icon={<CareerArt id="royalty"/>} disabledReason={(royalCountries as readonly string[]).includes(input.country)?undefined:'Choose Great Britain, Japan or Spain'} onPress={()=>setInput({...input,background:'royal'})}/></Card>
    <Card><Text style={{ color: c.muted, fontSize: 12, fontWeight: '600' }}>FUTURE FAMILY OPTIONS</Text>
      <Body muted>These choices are independent of gender and appearance. Dating preferences can change in My Life when you are an adult.</Body>
      <FamilyPreferences attractedTo={input.attractedTo ?? [...genders]} wantsChildren={input.wantsChildren ?? true} onChange={preferences => setInput({ ...input, ...preferences })} />
      <Body>Reproductive capacity</Body>{(['carry', 'contribute', 'neither'] as const).map(role => <Button key={role} label={role === 'carry' ? 'Can carry a pregnancy' : role === 'contribute' ? 'Can contribute to conception' : 'Neither'} tone={(input.reproductiveRole ?? (input.gender === 'female' ? 'carry' : input.gender === 'male' ? 'contribute' : 'neither')) === role ? 'primary' : 'secondary'} onPress={() => setInput({ ...input, reproductiveRole: role })} />)}
    </Card>
    {(message || error) && <Body>{message ?? error}</Body>}
    <Button label="Start My Life" tone="positive" busy={busy} onPress={() => { if (world) setConfirm(true); else void submit(); }} />
    <EventModal event={selection} onCancel={() => setField(null)} onChoose={id => {
      if (field === 'country') { const country = id as CountryCode; setInput({ ...input, country, city: countries[country].cities[0], background:(royalCountries as readonly string[]).includes(country)?input.background:'ordinary' }); }
      else if (field === 'city') setInput({ ...input, city: id });
      else if (field === 'hair' || field === 'face') setInput({ ...input, appearance: { ...input.appearance, [field]: Number(id) } });
      setField(null);
    }} />
    <EventModal event={confirm ? { id: 'new-life-confirm', kind: 'confirmation', title: 'Start another life?', body: 'Your current life will stay in Saved Lives. You can return to it later.', terms: [], confirmLabel: 'Start a New Life' } : null} busy={busy} onCancel={() => setConfirm(false)} onChoose={() => { setConfirm(false); void submit(); }} />
  </Page>;
}
