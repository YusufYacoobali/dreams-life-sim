import React from 'react';
import * as Native from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { jobs } from '../../src/game/content/jobs';
import { jobInterviews } from '../../src/game/content/jobInterviews';
import { encodeWorld, type World } from '../../src/game/model';
import { EmploymentArt } from '../../src/assets/EmploymentArt';
import { isJobArtId, jobArtIds } from '../../src/assets/JobArt';
import { jobImages } from '../../src/assets/jobImages';
import { CareerArt } from '../../src/assets/CareerArt';
import { ThemeProvider } from '../../src/ui/theme';
import { ordinaryApplicant, experiencedApplicant, hireOrdinary } from '../support/ordinaryJobs';

let mockWorld: World;
const mockDispatch = jest.fn();
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: (state: unknown) => unknown) => selector({ world: mockWorld, busy: false, error: null, dispatch: mockDispatch }) }));
import Jobs from '../../app/(game)/jobs';
import Work from '../../app/(game)/work';

const ordinary = jobs.filter(role => !role.specialCareer);
const frame = (child: React.ReactNode, dark = false) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: dark ? 320 : 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}>{child}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => act(async () => fireEvent.press(screen.getByRole('button', { name })));
function expectRoleArt(id: string, size: number) {
  if (!isJobArtId(id)) throw new Error('Role has no bundled job artwork: ' + id);
  // Inspect the rendered native image, independent of React.memo wrapper fibers.
  const source = jobImages[id];
  const matching = screen.UNSAFE_getAllByType(Native.Image).filter(node => JSON.stringify(node.props.source) === JSON.stringify(source));
  expect(matching).toHaveLength(1);
  expect(Native.StyleSheet.flatten(matching[0].props.style)).toMatchObject({ width: size, height: size });
}
afterEach(() => { jest.restoreAllMocks(); mockDispatch.mockReset(); });

test('every ordinary job has registered art, while all special careers retain their own existing artwork', () => {
  expect(new Set(jobArtIds)).toEqual(new Set(ordinary.map(role => role.id)));
  const view = render(frame(<EmploymentArt roleId={ordinary[0].id} />));
  for (const role of ordinary) {
    expect(isJobArtId(role.id)).toBe(true);
    view.rerender(frame(<EmploymentArt roleId={role.id} size={52} />));
    expectRoleArt(role.id, 52);
    expect(screen.UNSAFE_getAllByType(Native.Image).length).toBeGreaterThan(0);
  }
  for (const role of jobs.filter(item => item.specialCareer)) {
    view.rerender(frame(<EmploymentArt roleId={role.id} />));
    expect(screen.UNSAFE_getByType(CareerArt)).toBeTruthy();
  }
  view.unmount();
});

test.each([false, true])('the virtualized board opens every role-specific detail without applying or changing the save (dark=%s)', async dark => {
  mockWorld = ordinaryApplicant(ordinary[0]); const before = encodeWorld(mockWorld);
  jest.spyOn(Native, 'useWindowDimensions').mockReturnValue({ width: dark ? 320 : 390, height: 844, scale: 2, fontScale: dark ? 1.6 : 1 });
  const view = render(frame(<Jobs />, dark));
  await press('Show All Requirements');
  expect(screen.UNSAFE_getByType(Native.FlatList).props.data).toHaveLength(ordinary.length);
  expect(screen.UNSAFE_getByType(Native.FlatList).props.initialNumToRender).toBeLessThan(ordinary.length);
  for (const role of ordinary) {
    fireEvent.changeText(screen.getByLabelText('Search jobs'), role.title);
    await press(new RegExp('^' + role.title + '[.]'));
    expect(screen.getByRole('header', { name: role.title })).toBeOnTheScreen();
    expect(screen.getByText(jobInterviews[role.id].duties)).toBeOnTheScreen();
    expectRoleArt(role.id, 64);
    if (role.partTime) expect(screen.getByRole('radio', { name: '12 hours per week' })).toBeOnTheScreen();
    if (role.experienceMonths) expect(screen.getByText('Experience: ' + role.experienceMonths + ' recorded paid months in ' + role.sector)).toBeOnTheScreen();
    await press('Back');
  }
  expect(encodeWorld(mockWorld)).toBe(before); expect(mockDispatch).not.toHaveBeenCalled();
  view.unmount();
}, 60000);

test('each saved ordinary occupation uses the same assigned art after a successful real interview', () => {
  mockWorld = ordinaryApplicant(ordinary[0]);
  const view = render(frame(<Work />));
  for (const role of ordinary) {
    mockWorld = hireOrdinary(experiencedApplicant(role), role);
    const before = encodeWorld(mockWorld);
    view.rerender(frame(<Work />));
    expect(screen.getByRole('header', { name: 'Junior ' + role.title })).toBeOnTheScreen();
    expectRoleArt(role.id, 64);
    expect(encodeWorld(mockWorld)).toBe(before);
  }
  expect(mockDispatch).not.toHaveBeenCalled(); view.unmount();
}, 60000);
