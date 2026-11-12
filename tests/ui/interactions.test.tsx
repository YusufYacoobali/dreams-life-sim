import React from 'react';
// Shared portraits can import the game store; device persistence is outside this UI fixture.
jest.mock('../../src/persistence/native', () => ({ openRepository: async () => { throw new Error('Unexpected device database access in UI fixture'); } }));
import { act, fireEvent, render, screen } from '../support/rendering';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Modal, StyleSheet } from 'react-native';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { ActionRow, Button, StatBar } from '../../src/ui/components';
import { ThemeProvider } from '../../src/ui/theme';
import { GameShell } from '../../src/ui/GameShell';
import { FilterTabs } from '../../src/ui/FilterTabs';

async function frame(child: React.ReactNode) {
  return await render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>);
}

test('a busy action cannot be submitted again', async () => {
  const submit = jest.fn();
  await frame(<Button label="Buy property" busy onPress={submit} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Buy property' }));
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Buy property' })).toBeDisabled();
});

test('a local action invokes its callback without entering and resetting save tracking', async () => {
  const press = jest.fn(), commits = jest.fn();
  await frame(<React.Profiler id="local-action" onRender={commits}><Button label="Show All Jobs" onPress={press} /></React.Profiler>);
  expect(commits).toHaveBeenCalled(); commits.mockClear();
  await fireEvent.press(screen.getByRole('button', { name: 'Show All Jobs' }));
  expect(press).toHaveBeenCalledTimes(1); expect(commits).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Show All Jobs' })).toBeEnabled(); expect(screen.queryByLabelText('Saving')).toBeNull();
});

test('only the submitted button shows progress while other controls keep their useful text', async () => {
  jest.useFakeTimers();
  let finish!: () => void;
  function Controls() {
    const [busy, setBusy] = React.useState(false); finish = () => setBusy(false);
    return <><Button label="Practise" busy={busy} onPress={() => setBusy(true)} />
      <Button label="Something Else" busy={busy} onPress={() => {}} />
      <ActionRow title="Routine" subtitle="Community access" disabled={busy} onPress={() => {}} /></>;
  }
  await frame(<Controls />);
  await fireEvent.press(screen.getByRole('button', { name: 'Practise' }));
  expect(screen.queryByLabelText('Saving')).toBeNull();
  await act(() => jest.advanceTimersByTime(150));
  expect(screen.getAllByLabelText('Saving')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Practise' }).props.accessibilityState).toEqual({ busy: true, disabled: true });
  expect(screen.getByRole('button', { name: 'Something Else' }).props.accessibilityState).toEqual({ busy: false, disabled: true });
  expect(screen.getByRole('button', { name: 'Routine. Community access' })).toBeDisabled();
  expect(screen.getByText('Community access')).toBeTruthy();
  // Finish through an actual React update, then submit the other control.
  await act(finish);
  expect(screen.queryByLabelText('Saving')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Something Else' }));
  expect(screen.queryByLabelText('Saving')).toBeNull();
  jest.useRealTimers();
});

test('choice buttons expose checked roles while their own saving state keeps them disabled', async () => {
  const submit = jest.fn();
  function Choice() {
    const [busy, setBusy] = React.useState(false);
    return <Button label="Family" accessibilityRole="checkbox" accessibilityState={{ checked: true, busy: false, disabled: false }}
      busy={busy} onPress={() => { submit(); setBusy(true); }} />;
  }
  await frame(<Choice />);
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Family', checked: true }));
  expect(screen.getByRole('checkbox', { name: 'Family', checked: true }).props.accessibilityState).toEqual({ checked: true, busy: true, disabled: true });
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Family' }));
  expect(submit).toHaveBeenCalledTimes(1);
});

test('selection requires an eligible option and submits its actual stable ID', async () => {
  const choose = jest.fn();
  const event: EventPresentation = { id: 'heir:1', kind: 'selection', title: 'Choose an heir', body: 'Select an existing child.', confirmLabel: 'Continue as heir', choices: [
    { id: 'child-dead', label: 'Sam', disabledReason: 'Deceased' }, { id: 'child-living', label: 'Alex' },
  ] };
  await frame(<EventModal event={event} onChoose={choose} />);
  expect(screen.getByRole('button', { name: 'Continue as heir' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('radio', { name: 'Sam. Deceased' }));
  expect(screen.getByRole('button', { name: 'Continue as heir' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('radio', { name: 'Alex' }));
  expect(screen.getByRole('radio', { name: 'Alex', checked: true })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Continue as heir' }));
  expect(choose).toHaveBeenCalledWith('child-living');
});

test('required decisions have no cancel action and preserve stable choice IDs', async () => {
  const choose = jest.fn();
  await frame(<EventModal event={{ id: 'offer:4', kind: 'decision', title: 'Job offer', body: 'The terms are ready.', choices: [{ id: 'accept', label: 'Accept offer' }, { id: 'decline', label: 'Decline' }] }} onChoose={choose} />);
  expect(screen.queryByRole('button', { name: 'Never mind' })).toBeNull();
  await fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
  expect(choose).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Accept offer' }));
  expect(choose).toHaveBeenCalledWith('accept');
});

test('results show committed values without recalculating money from narrative', async () => {
  const choose = jest.fn();
  await frame(<EventModal event={{ id: 'receipt:5', kind: 'result', title: 'Sale completed', body: 'The sale settled after fees.', effects: [{ id: 'net', label: 'Net proceeds', value: '+£17,500', tone: 'positive' }] }} onChoose={choose} />);
  expect(screen.getByText('+£17,500')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(choose).toHaveBeenCalledWith('continue');
});

test('a failed save is visible inside a required decision and its choices remain retryable', async () => {
  const choose = jest.fn();
  await frame(<EventModal event={{ id: 'retry', kind: 'decision', title: 'Decision', body: 'Choose.', choices: [{ id: 'a', label: 'Try this' }, { id: 'b', label: 'Try that' }] }} error="Could not save. Please try again." onChoose={choose} />);
  expect(screen.getByRole('alert')).toHaveTextContent(/Could not save/);
  await fireEvent.press(screen.getByRole('button', { name: 'Try this' }));
  expect(choose).toHaveBeenCalledWith('a');
});

test('stat accessibility values remain valid even for corrupt presentation input', async () => {
  await frame(<StatBar label="Health" value={150} color="green" />);
  expect(screen.getByRole('progressbar', { name: 'Health' })).toHaveAccessibilityValue({ min: 0, max: 100, now: 100 });
});

test('four tabs retain selection semantics and return stable route IDs', async () => {
  const navigate = jest.fn();
  await frame(<GameShell activeTab="life" onSelectTab={navigate}><Button label="Open profile" onPress={() => {}} /></GameShell>);
  expect(screen.getAllByRole('tab')).toHaveLength(4);
  expect(screen.getByRole('tab', { name: 'Life', selected: true })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('tab', { name: 'Life' }));
  expect(navigate).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('tab', { name: 'Relationships' }));
  expect(navigate).toHaveBeenCalledWith('relationships');
});

test('a selected filter does not repeat its list reset while changing filters still returns the real ID', async () => {
  const select = jest.fn();
  function Filters() {
    const [selected, setSelected] = React.useState<'all' | 'family'>('all');
    return <FilterTabs values={[{ id: 'all', label: 'All' }, { id: 'family', label: 'Family' }]} selected={selected} onSelect={id => { select(id); setSelected(id); }} />;
  }
  await frame(<Filters />);
  expect(StyleSheet.flatten(screen.UNSAFE_getByProps({ accessibilityRole: 'tablist' }).props.style).flexWrap).toBe('wrap');
  expect(StyleSheet.flatten(screen.getByRole('tab', { name: 'All' }).props.style).flexGrow).toBe(1);
  await fireEvent.press(screen.getByRole('tab', { name: 'All', selected: true })); expect(select).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('tab', { name: 'Family' })); expect(select).toHaveBeenCalledTimes(1); expect(select).toHaveBeenLastCalledWith('family');
  await fireEvent.press(screen.getByRole('tab', { name: 'Family', selected: true })); expect(select).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByRole('tab', { name: 'All' })); expect(select).toHaveBeenCalledTimes(2); expect(select).toHaveBeenLastCalledWith('all');
});
