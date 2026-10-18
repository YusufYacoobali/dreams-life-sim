import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn } from '../../src/game/model';
import { platforms, platformContent, PlatformId } from '../../src/game/content/social';
import { isConfined } from '../../src/game/systems/legalSchemas';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../../src/ui/components';
import { FameBusinessArt } from '../../src/assets/FameBusinessArt';
import { useColors } from '../../src/ui/theme';
import { useSocialReview } from '../../src/ui/SocialReview';
export default function SocialMedia() {
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), person = world.people[world.activePersonId], c = useColors(), review = useSocialReview();
  const params=useLocalSearchParams<{platform?:string}>();
  const accounts = world.socialAccounts.filter(item => item.ownerId === person.id), [platform, setPlatform] = useState<PlatformId>(platforms.includes(params.platform as PlatformId)?params.platform as PlatformId:'photogram'), [handle, setHandle] = useState(''), [bio, setBio] = useState('');
  const unavailable = ageOn(person, world.date) < 13 ? 'Profiles are available from age thirteen' : isConfined(world) ? 'Creating a new profile is unavailable in custody' : undefined;
  return <Page><Header title="Social Media" onBack={() => router.back()} />{error && <Body>{error}</Body>}<Card><FameBusinessArt id="social" size={80} /><Heading size={20}>Your life, your audience</Heading><Body muted>Share original moments, build connections and see how people respond.</Body>{accounts.map(account => <ActionRow key={account.id} title={platformContent[account.platform].name} subtitle={'@' + account.handle + ' · ' + account.status} value={account.followers.toLocaleString('en-US') + ' followers'} icon={<FameBusinessArt id={platformContent[account.platform].art} size={36} />} onPress={() => router.push({ pathname: '/social-profile/[id]', params: { id: account.id } })} />)}</Card>
    {accounts.length < platforms.length && <Card><Heading size={18}>Create a Profile</Heading>{unavailable && <Body muted>{unavailable}</Body>}{platforms.map(id => <ActionRow key={id} title={platformContent[id].name} subtitle={platformContent[id].description} value={platform === id ? 'Selected' : undefined} disabledReason={accounts.some(item => item.platform === id) ? 'Profile already exists' : undefined} icon={<FameBusinessArt id={platformContent[id].art} size={36} />} onPress={() => setPlatform(id)} />)}<TextInput accessibilityLabel="Social handle" value={handle} onChangeText={setHandle} autoCapitalize="none" maxLength={24} placeholder="Handle (letters, numbers, underscores)" placeholderTextColor={c.muted} style={{ color: c.ink, backgroundColor: c.inset, borderRadius: 10, padding: 12 }} /><TextInput accessibilityLabel="Profile biography" value={bio} onChangeText={setBio} maxLength={120} placeholder="Tell people a little about yourself" placeholderTextColor={c.muted} style={{ color: c.ink, backgroundColor: c.inset, borderRadius: 10, padding: 12 }} /><Button label="Review New Profile" disabled={busy || !!unavailable || !/^[a-zA-Z0-9_]{3,24}$/.test(handle.trim()) || accounts.some(item => item.platform === platform)} onPress={() => review.confirm({ type: 'create-social', platform, handle: handle.trim(), bio }, 'Create your profile?', 'Your audience starts with zero followers. Posts, collaborations and responses will belong to this identity.', [], platformContent[platform].art, 'Create Profile')} /></Card>}
    <Card><ActionRow title="Fame & Public Image" icon={<FameBusinessArt id="fame" size={36} />} onPress={() => router.push('/fame')} /></Card>{review.modal}</Page>;
}
