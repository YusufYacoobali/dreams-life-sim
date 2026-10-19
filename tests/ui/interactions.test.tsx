import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { ActionRow, Button, StatBar } from '../../src/ui/components';
import { ThemeProvider } from '../../src/ui/theme';
import { GameShell } from '../../src/ui/GameShell';

function frame(child: React.ReactNode) {
  return render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>);
}

test('a busy action cannot be submitted again', () => {
  const submit = jest.fn();
  frame(<Button label="Buy property" busy onPress={submit} />);
  fireEvent.press(screen.getByRole('button', { name: 'Buy property' }));
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Buy property' })).toBeDisabled();
});

test('only the submitted button shows progress while other controls keep their useful text', () => {
  jest.useFakeTimers();
  let finish!: () => void;
  function Controls() {
    const [busy, setBusy] = React.useState(false); finish = () => setBusy(false);
    return <><Button label="Practise" busy={busy} onPress={() => setBusy(true)} />
      <Button label="Something Else" busy={busy} onPress={() => {}} />
      <ActionRow title="Routine" subtitle="Community access" disabled={busy} onPress={() => {}} /></>;
  }
  frame(<Controls />);
  fireEvent.press(screen.getByRole('button', { name: 'Practise' }));
  expect(screen.queryByLabelText('Saving')).toBeNull();
  act(() => jest.advanceTimersByTime(150));
  expect(screen.getAllByLabelText('Saving')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Practise' }).props.accessibilityState).toEqual({ busy: true, disabled: true });
  expect(screen.getByRole('button', { name: 'Something Else' }).props.accessibilityState).toEqual({ busy: false, disabled: true });
  expect(screen.getByRole('button', { name: 'Routine. Community access' })).toBeDisabled();
  expect(screen.getByText('Community access')).toBeTruthy();
  // Finish through an actual React update, then submit the other control.
  act(finish);
  expect(screen.queryByLabelText('Saving')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Something Else' }));
  expect(screen.queryByLabelText('Saving')).toBeNull();
  jest.useRealTimers();
});

test('selection requires an eligible option and submits its actual stable ID', () => {
  const choose = jest.fn();
  const event: EventPresentation = { id: 'heir:1', kind: 'selection', title: 'Choose an heir', body: 'Select an existing child.', confirmLabel: 'Continue as heir', choices: [
    { id: 'child-dead', label: 'Sam', disabledReason: 'Deceased' }, { id: 'child-living', label: 'Alex' },
  ] };
  frame(<EventModal event={event} onChoose={choose} />);
  expect(screen.getByRole('button', { name: 'Continue as heir' })).toBeDisabled();
  fireEvent.press(screen.getByRole('radio', { name: 'Sam. Deceased' }));
  expect(screen.getByRole('button', { name: 'Continue as heir' })).toBeDisabled();
  fireEvent.press(screen.getByRole('radio', { name: 'Alex' }));
  expect(screen.getByRole('radio', { name: 'Alex', checked: true })).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Continue as heir' }));
  expect(choose).toHaveBeenCalledWith('child-living');
});

test('required decisions have no cancel action and preserve stable choice IDs', () => {
  const choose = jest.fn();
  frame(<EventModal event={{ id: 'offer:4', kind: 'decision', title: 'Job offer', body: 'The terms are ready.', choices: [{ id: 'accept', label: 'Accept offer' }, { id: 'decline', label: 'Decline' }] }} onChoose={choose} />);
  expect(screen.queryByRole('button', { name: 'Never mind' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Accept offer' }));
  expect(choose).toHaveBeenCalledWith('accept');
});

test('results show committed values without recalculating money from narrative', () => {
  const choose = jest.fn();
  frame(<EventModal event={{ id: 'receipt:5', kind: 'result', title: 'Sale completed', body: 'The sale settled after fees.', effects: [{ id: 'net', label: 'Net proceeds', value: '+£17,500', tone: 'positive' }] }} onChoose={choose} />);
  expect(screen.getByText('+£17,500')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(choose).toHaveBeenCalledWith('continue');
});

test('a failed save is visible inside a required decision and its choices remain retryable', () => {
  const choose = jest.fn();
  frame(<EventModal event={{ id: 'retry', kind: 'decision', title: 'Decision', body: 'Choose.', choices: [{ id: 'a', label: 'Try this' }, { id: 'b', label: 'Try that' }] }} error="Could not save. Please try again." onChoose={choose} />);
  expect(screen.getByRole('alert')).toHaveTextContent(/Could not save/);
  fireEvent.press(screen.getByRole('button', { name: 'Try this' }));
  expect(choose).toHaveBeenCalledWith('a');
});

test('stat accessibility values remain valid even for corrupt presentation input', () => {
  frame(<StatBar label="Health" value={150} color="green" />);
  expect(screen.getByRole('progressbar', { name: 'Health' })).toHaveAccessibilityValue({ min: 0, max: 100, now: 100 });
});

test('four tabs retain selection semantics and return stable route IDs', () => {
  const navigate = jest.fn();
  frame(<GameShell activeTab="life" onSelectTab={navigate}><Button label="Open profile" onPress={() => {}} /></GameShell>);
  expect(screen.getAllByRole('tab')).toHaveLength(4);
  expect(screen.getByRole('tab', { name: 'Life', selected: true })).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('tab', { name: 'Life' }));
  expect(navigate).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('tab', { name: 'Relationships' }));
  expect(navigate).toHaveBeenCalledWith('relationships');
});
