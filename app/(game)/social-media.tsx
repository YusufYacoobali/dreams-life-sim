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
import { SocialBusinessChoice, SocialBusinessIntro } from '../../src/ui/SocialBusinessPresentation';
import { DisplayText as Text } from '../../src/ui/DisplayText';

export default function SocialMedia() {
  const params = useLocalSearchParams<{ platform?: string }>(), identity = useGame(s => s.world ? s.world.id + ':' + s.world.activePersonId : 'none');
  return <SocialMediaForm key={identity + ':' + (params.platform ?? '')} />;
}
function SocialMediaForm() {
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), person = world.people[world.activePersonId], c = useColors(), review = useSocialReview();
  const params=useLocalSearchParams<{platform?:string}>();
  const accounts = world.socialAccounts.filter(item => item.ownerId === person.id), [platform, setPlatform] = useState<PlatformId>(platforms.includes(params.platform as PlatformId)?params.platform as PlatformId:'photogram'), [handle, setHandle] = useState(''), [bio, setBio] = useState('');
  const invalidBio = /[\u0000-\u001F]/.test(bio.trim());
  const unavailable = ageOn(person, world.date) < 13 ? 'Profiles are available from age thirteen' : isConfined(world) ? 'Creating a new profile is unavailable in custody' : undefined;
  return <Page><Header title="Social Media" onBack={() => router.back()} />{error && !review.reviewing && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red }}>{error}</Text>}<Card><SocialBusinessIntro art={<FameBusinessArt id="social" size={76} />} title="Your life, your audience" body="Share original moments, build connections and see how people respond." /><Heading size={18}>Your profiles</Heading>{!accounts.length && <Body muted>No profiles yet. Choose a platform below; your first audience starts at zero.</Body>}{accounts.map(account => <ActionRow key={account.id} title={platformContent[account.platform].name} subtitle={'@' + account.handle + ' · ' + account.status} value={account.followers.toLocaleString('en-US') + ' followers'} icon={<FameBusinessArt id={platformContent[account.platform].art} size={36} />} onPress={() => router.push({ pathname: '/social-profile/[id]', params: { id: account.id } })} />)}</Card>
    {accounts.length < platforms.length && <Card><Heading size={20}>Create a Profile</Heading><Body muted>Choose a platform, handle and biography, then review your profile.</Body>{unavailable && <Body muted>{unavailable}</Body>}{platforms.map(id => <SocialBusinessChoice key={id} title={platformContent[id].name} subtitle={platformContent[id].description} selected={platform === id} disabled={busy} disabledReason={accounts.some(item => item.platform === id) ? 'Profile already exists' : undefined} icon={<FameBusinessArt id={platformContent[id].art} size={36} />} onPress={() => setPlatform(id)} />)}<Heading size={17}>Profile details</Heading><Body muted>Use 3–24 letters, numbers or underscores for your handle.</Body><TextInput accessibilityLabel="Social handle" accessibilityState={{ disabled: busy }} value={handle} editable={!busy} onChangeText={setHandle} autoCapitalize="none" autoCorrect={false} maxLength={24} placeholder="Handle (letters, numbers, underscores)" placeholderTextColor={c.muted} style={{ color: c.ink, backgroundColor: c.inset, borderRadius: 10, padding: 12 }} /><TextInput accessibilityLabel="Profile biography" accessibilityState={{ disabled: busy }} multiline submitBehavior="blurAndSubmit" returnKeyType="done" textAlignVertical="top" value={bio} editable={!busy} onChangeText={setBio} maxLength={120} placeholder="Tell people a little about yourself" placeholderTextColor={c.muted} style={{ color: c.ink, backgroundColor: c.inset, borderRadius: 10, minHeight: 92, padding: 12 }} />{invalidBio && <Body muted>Use one paragraph without line breaks or control characters.</Body>}<Button label="Review New Profile" disabled={busy || !!unavailable || invalidBio || !/^[a-zA-Z0-9_]{3,24}$/.test(handle.trim()) || accounts.some(item => item.platform === platform)} onPress={() => review.confirm({ type: 'create-social', platform, handle: handle.trim(), bio }, 'Create your profile?', 'Start with zero followers. Everybody starts somewhere.', [], platformContent[platform].art, 'Create Profile')} /></Card>}
    <Card><ActionRow title="Fame & Public Image" icon={<FameBusinessArt id="fame" size={36} />} onPress={() => router.push('/fame')} /></Card>{review.modal}</Page>;
}
