import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '../support/rendering';
import { createGameStore } from '../../src/state/gameStore';
import { useScopedGameAction } from '../../src/ui/useScopedGameAction';
import { Button, Body } from '../../src/ui/components';
import { ThemeProvider } from '../../src/ui/theme';
import { pupil } from '../support/pupil';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('../../src/state/useGame', () => ({ useGame: (select: unknown) => require('zustand').useStore(mockStore, select) }));
function Workflow() {
  const { dispatch, error } = useScopedGameAction('property');
  return <><Button label="Save action" onPress={() => void dispatch({ type: 'advance' })} />{error && <Body>{error}</Body>}</>;
}
test('leaving a workflow while its action fails discards its late error without mutating the life', async () => {
  let reject!: (error: Error) => void;
  const held = new Promise<void>((_resolve, fail) => { reject = fail; });
  const repository = jest.fn();
  mockStore = createGameStore({ repository, yieldToUI: () => held, date: () => ({ year: 2026, month: 1, day: 1 }), id: () => 'unused' });
  const world = pupil(); mockStore.setState({ world });
  const view = await render(<ThemeProvider><Workflow /></ThemeProvider>);
  await fireEvent.press(screen.getByRole('button', { name: 'Save action' }));
  expect(mockStore.getState().busy).toBe(true);
  await view.unmount();
  await act(async () => { reject(new Error('storage unavailable')); });
  await waitFor(() => expect(mockStore.getState().busy).toBe(false));
  expect(mockStore.getState().error).toBeNull(); expect(mockStore.getState().errorScope).toBeNull();
  expect(mockStore.getState().world).toBe(world); expect(repository).not.toHaveBeenCalled();
});
test('a retired workflow cannot clear the error belonging to a newer workflow', async () => {
  mockStore = createGameStore({ repository: jest.fn(), date: () => ({ year: 2026, month: 1, day: 1 }), id: () => 'unused' });
  mockStore.setState({ error: 'Current operation failed', errorScope: 'new-workflow' });
  mockStore.getState().clearError('retired-workflow');
  expect(mockStore.getState().error).toBe('Current operation failed');
  mockStore.getState().clearError('new-workflow'); expect(mockStore.getState().error).toBeNull();
});
