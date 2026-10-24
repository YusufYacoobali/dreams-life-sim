import React from 'react';
import { Linking, TextInput } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { platforms, platformContent, platformAccountLabel, socialPostJournal } from '../../src/game/content/social';
import { decodeSave } from '../../src/persistence/archive';
import { copyWorld, encodeWorld } from '../../src/game/model';
import { SaveRepository } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { database } from '../support/sqlite';
import { PlatformMark } from '../../src/assets/PlatformMark';
import { ThemeProvider } from '../../src/ui/theme';
import { DisplayText, displayText } from '../../src/ui/DisplayText';
import { PendingEvent } from '../../src/ui/PendingEvent';
import legacyCreator from '../fixtures/v10-creator-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockAccountId = '';
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => ({ id: mockAccountId, accountId: mockAccountId, kind: 'youtuber' }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import SocialMedia from '../../app/(game)/social-media';
import SocialProfile from '../../app/(game)/social-profile/[id]';
import CreatePost from '../../app/(game)/create-post';
import Sponsorships from '../../app/(game)/sponsorships';
import CreatorStudio from '../../app/(game)/creator-studio/[kind]';
import Help from '../../app/help';

const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 568 }, insets: { top: 20, bottom: 0, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>;

test('real names retain all four existing save IDs and platform-specific preferences', () => {
  expect(platforms).toEqual(['photogram', 'videowave', 'streamline', 'lifelink']);
  expect(platforms.map(id => platformContent[id].name)).toEqual(['Instagram', 'YouTube', 'Twitch', 'X']);
  expect(platforms.map(id => platformContent[id].preferred)).toEqual([
    ['photo', 'travel', 'food'], ['video', 'gaming', 'humour'], ['gaming', 'video', 'message'], ['message', 'humour', 'photo'],
  ]);
  expect(platforms.map(platformAccountLabel)).toEqual(['Instagram account', 'YouTube channel', 'Twitch channel', 'X account']);
});

test.each([
  ['I posted on Photogram.', 'I posted on Instagram.'],
  ['Your VideoWave channel earned £12.50.', 'Your YouTube channel earned £13.'],
  ['Your Streamline stream drew criticism.', 'Your Twitch stream drew criticism.'],
  ['Your LifeLink account is active.', 'Your X account is active.'],
  ['Create or reopen your streamline profile first', 'Create or reopen your Twitch profile first'],
  ['Photogram / VideoWave / Streamline / LifeLink', 'Instagram / YouTube / Twitch / X'],
])('saved prose displays current branding: %s', (saved, shown) => expect(displayText(saved)).toBe(shown));

test.each([
  ['Photogram', 'photogram', 'an Instagram account'],
  ['VideoWave', 'videowave', 'a YouTube channel'],
  ['Streamline', 'streamline', 'a Twitch channel'],
  ['LifeLink', 'lifelink', 'an X account'],
])('old %s creation journals display the correct article and account noun', (former, id, phrase) => {
  for (const name of [former, former.toLowerCase()]) {
    const saved = 'I created a ' + name + ' profile: @' + id + '.';
    expect(displayText(saved)).toBe('I created ' + phrase + ': @' + id + '.');
    const uri = 'dreams://journal?text=' + encodeURIComponent(saved);
    expect(displayText(uri)).toBe(uri);
    expect(saved).toBe('I created a ' + name + ' profile: @' + id + '.');
  }
});

test.each([
  'Streamline your workflow before work.', 'I want to streamline my routine.', 'Please streamline operations.',
  'Streamline production before your next upload.', 'Streamline editing with a better routine.', 'Please streamline payments.',
  '@Photogram @videowave @Streamline @lifelink', 'social_person_player_photogram_post_17',
  'Contact photogram@example.com', 'Contact photogram+work@example.com', 'Contact Streamline@example.com', 'dreams://social?platform=photogram',
  'https://photogram.example/@Streamline', 'https://example.test/?platform=Photogram', 'VideoWave.example/channel', 'my-photogram-handle',
])('ordinary verbs, handles, identifiers and URLs stay literal: %s', value => expect(displayText(value)).toBe(value));

test.each([
  ['photogram', 'photo', 0, 'I posted a photo on Instagram.'],
  ['videowave', 'video', 0, 'I uploaded a video to my YouTube channel.'],
  ['videowave', 'photo', 0, 'I shared a photo on my YouTube channel.'],
  ['streamline', 'gaming', 60, 'I streamed live on Twitch.'],
  ['streamline', 'gaming', 0, 'I posted a gaming post on Twitch.'],
  ['lifelink', 'message', 0, 'I posted an update on my X account.'],
] as const)('new %s writing uses the actual post and platform context', (platform, kind, minutes, words) => {
  expect(socialPostJournal(platform, kind, minutes)).toBe(words);
});

test('read-only labels update while editable handles and biographies retain their exact text', () => {
  const saved = Object.freeze({ body: 'Your Photogram photo is getting attention.', bio: 'My Streamline profile.', handle: 'photogram_daily' });
  const original = JSON.stringify(saved);
  render(<><DisplayText accessibilityLabel={saved.body}>{saved.body}</DisplayText><TextInput accessibilityLabel="Biography" value={saved.bio} /><TextInput accessibilityLabel="Handle" value={saved.handle} /></>);
  expect(screen.getByLabelText('Your Instagram photo is getting attention.')).toBeOnTheScreen();
  expect(screen.getByLabelText('Biography').props.value).toBe(saved.bio);
  expect(screen.getByLabelText('Handle').props.value).toBe(saved.handle);
  expect(JSON.stringify(saved)).toBe(original);
});

test('adjacent JSX text fragments retain handle, email and URI context', () => {
  render(<><DisplayText>Using @{'photogram'} on {'Streamline'}.</DisplayText><DisplayText>Contact {'photogram'}@example.com</DisplayText><DisplayText>dreams://social?platform={'videowave'}</DisplayText></>);
  expect(screen.getByText('Using @photogram on Twitch.')).toBeOnTheScreen();
  expect(screen.getByText('Contact photogram@example.com')).toBeOnTheScreen();
  expect(screen.getByText('dreams://social?platform=videowave')).toBeOnTheScreen();
});

test.each(platforms)('a real profile keeps the literal handle @%s', handle => {
  const world = copyWorld(decodeSave(JSON.stringify(legacyCreator)).world);
  world.socialAccounts[0].handle = handle; mockAccountId = world.socialAccounts[0].id;
  mockStore = createGameStore({ repository: async () => { throw new Error('Rendering a profile must not open storage'); }, date: () => world.date, id: () => 'life_render_unused' });
  mockStore.setState({ world });
  const view = render(frame(<SocialProfile />));
  expect(screen.getByText('@' + handle)).toBeOnTheScreen();
  expect(world.socialAccounts[0].handle).toBe(handle);
  view.unmount();
});

test.each(['light', 'dark'] as const)('%s platform marks share clean frames and independently named accessible images', appearance => {
  for (const platform of platforms) {
    const view = render(<ThemeProvider appearance={appearance}><PlatformMark platform={platform} size={36} decorative={false} /></ThemeProvider>);
    expect(screen.getByRole('image', { name: platformContent[platform].name })).toHaveStyle({ width: 36, height: 36 });
    expect(screen.UNSAFE_getByType(Svg).props.preserveAspectRatio).toBe('xMidYMid meet');
    expect(screen.UNSAFE_getByType(Path).props.d.length).toBeGreaterThan(100);
    view.unmount();
  }
});

test('the existing Help credits ship readable attribution and a working licence link', () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  const view = render(frame(<Help />));
  expect(screen.getByText(/Font Awesome Free 6.7.2 by Fonticons, Inc., licensed under CC BY 4.0/)).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('link', { name: 'Creative Commons licence' }));
  expect(open).toHaveBeenCalledWith('https://creativecommons.org/licenses/by/4.0/');
  view.unmount(); open.mockRestore();
});

test('a genuine old creator archive keeps its payload, accounts and wording through current screens, cold reload and export', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  await repository.import(JSON.stringify(legacyCreator));
  const before = await repository.active(); if (!before) throw new Error('Expected imported creator life');
  expect(before.socialAccounts[0].platform).toBe('photogram');
  expect(before.journal.some(entry => entry.text.includes('Photogram'))).toBe(true);
  expect(before.pending!.body).toContain('Photogram');
  mockAccountId = before.socialAccounts[0].id;
  mockStore = createGameStore({ repository: async () => repository, date: () => before.date, id: () => 'unused' }); await mockStore.getState().bootstrap();
  const encoded = encodeWorld(mockStore.getState().world!), stored = sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(before.id)!.payload;
  const view = render(frame(<SocialMedia />)); expect(screen.getAllByText('Instagram').length).toBeGreaterThan(0);
  view.rerender(frame(<SocialProfile />)); expect(screen.getByRole('header', { name: 'Instagram' })).toBeOnTheScreen(); expect(screen.getByText('Instagram account')).toBeOnTheScreen();
  view.rerender(frame(<CreatePost />)); expect(screen.getByText(/Your Instagram account/)).toBeOnTheScreen();
  view.rerender(frame(<Sponsorships />)); expect(screen.getAllByText(/Instagram/).length).toBeGreaterThan(0);
  view.rerender(frame(<CreatorStudio />)); expect(screen.getAllByText(/your YouTube channel/i).length).toBeGreaterThan(0);
  view.rerender(frame(<PendingEvent />)); expect(screen.getByText(displayText(before.pending!.body))).toBeOnTheScreen(); expect(screen.queryByText(/Photogram/)).toBeNull();
  view.unmount();
  expect(encodeWorld(mockStore.getState().world!)).toBe(encoded);
  expect(sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(before.id)!.payload).toBe(stored);
  const cold = new SaveRepository(driver); await cold.initialise();
  expect(encodeWorld(await cold.load(before.id))).toBe(encoded);
  const exported = decodeSave(await cold.export(before.id)).world;
  expect(exported.journal).toEqual(before.journal); expect(exported.socialAccounts).toEqual(before.socialAccounts);
  sqlite.close();
});
