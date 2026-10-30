import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { SharedValue } from 'react-native-reanimated';
import { EscapeGame } from '../../src/minigames/escape/EscapeGame';
import { escapeSequence } from '../../src/minigames/escape/escapeLogic';
import type { MiniGameSession } from '../../src/minigames/core/types';

function fixture(assisted = true): MiniGameSession {
  return { id: 'practice_escape', lifeId: 'practice', personId: 'practice', kind: 'escape', ownerId: 'practice', contextId: 'practice', started: { year: 2026, month: 1, day: 1 }, startedRevision: 0, difficulty: 5, seed: 413, assisted, status: 'active', paused: false, elapsedMs: 0, inputs: [], score: null, rating: null, settled: null, appliedMonth: null };
}
const clock = { value: 1400 } as SharedValue<number>;

test('assisted escape uses named gates and a visible ordered sequence; persisted choices advance without timing or colour cues', () => {
  let session = fixture();
  const input = jest.fn();
  const view = render(<EscapeGame session={session} clock={clock} enabled onInput={input} />);
  const sequence = escapeSequence(session);
  for (let index = 0; index < sequence.length; index++) {
    const symbol = sequence[index];
    expect(screen.getByLabelText(`Stamp ${index + 1}: ${symbol}, next`)).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: `Choose ${symbol} gate` }));
    expect(input).toHaveBeenLastCalledWith({ type: 'stamp', symbol }, (index + 1) * 500);
    const at = (index + 1) * 500;
    session = { ...session, elapsedMs: at, inputs: [...session.inputs, { at, action: { type: 'stamp', symbol } }] };
    view.rerender(<EscapeGame session={session} clock={clock} enabled onInput={input} />);
  }
  expect(screen.getByText('The exit is open.')).toBeOnTheScreen();
  for (const symbol of ['sun', 'moon', 'star', 'bird']) expect(screen.getByRole('button', { name: `Choose ${symbol} gate` })).toBeDisabled();
});

test('timed gates use the challenge clock and cannot submit while a move is saving or controls are hidden', () => {
  const session = fixture(false), input = jest.fn();
  const view = render(<EscapeGame session={session} clock={clock} enabled onInput={input} />);
  fireEvent.press(screen.getByRole('button', { name: 'Choose sun gate' }));
  expect(input).toHaveBeenCalledWith({ type: 'stamp', symbol: 'sun' }, 1400);
  view.rerender(<EscapeGame session={session} clock={clock} enabled={false} onInput={input} />);
  fireEvent.press(screen.getByRole('button', { name: 'Choose moon gate' }));
  expect(input).toHaveBeenCalledTimes(1);
  view.rerender(<EscapeGame session={session} clock={clock} enabled controlsVisible={false} onInput={input} />);
  expect(screen.queryByRole('button', { name: 'Choose moon gate' })).toBeNull();
});

test('v2 separates preview and recall in both visual and screen-reader trees, including cold remount', () => {
  let session = { ...fixture(), escapeVersion: 2 as const };
  const input = jest.fn();
  const view = render(<EscapeGame session={session} clock={clock} enabled reducedMotion onInput={input} />);
  const sequence = escapeSequence(session);
  expect(screen.getByLabelText(`Stamp 1: ${sequence[0]}`)).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: /Choose .* gate/ })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Hide pattern and begin' }));
  expect(input).toHaveBeenLastCalledWith({ type: 'escape-recall' }, 100);
  session = { ...session, elapsedMs: 100, inputs: [{ at: 100, action: { type: 'escape-recall' } }] };
  view.rerender(<EscapeGame session={session} clock={clock} enabled reducedMotion onInput={input} />);
  for (let index = 0; index < sequence.length; index++) expect(screen.queryByLabelText(`Stamp ${index + 1}: ${sequence[index]}`)).toBeNull();
  expect(screen.queryByLabelText('Pattern preview')).toBeNull();
  expect(screen.getAllByRole('button', { name: /Choose .* gate/ })).toHaveLength(4);
  expect(screen.getByLabelText(`0 of ${sequence.length} stamps recalled`)).toBeOnTheScreen();
  view.unmount();
  render(<EscapeGame session={JSON.parse(JSON.stringify(session))} clock={clock} enabled reducedMotion onInput={input} />);
  expect(screen.queryByRole('button', { name: 'Hide pattern and begin' })).toBeNull();
  expect(screen.queryByLabelText('Pattern preview')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: `Choose ${sequence[0]} gate` }));
  expect(input).toHaveBeenLastCalledWith({ type: 'stamp', symbol: sequence[0] }, 200);
});

test('assisted hints reveal only one stamp, remove input gates and require saved dismissal', () => {
  const session: MiniGameSession = { ...fixture(), escapeVersion: 2, elapsedMs: 200, inputs: [{ at: 100, action: { type: 'escape-recall' } }, { at: 200, action: { type: 'escape-hint' } }] };
  const input = jest.fn(), view = render(<EscapeGame session={session} clock={clock} enabled onInput={input} />);
  expect(screen.getByLabelText(`Next stamp: ${escapeSequence(session)[0]}`)).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: /Choose .* gate/ })).toBeNull();
  expect(screen.queryByLabelText('Pattern preview')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Hide hint and continue' }));
  expect(input).toHaveBeenLastCalledWith({ type: 'escape-recall' }, 300);
  view.rerender(<EscapeGame session={session} clock={clock} enabled={false} controlsVisible={false} onInput={input} />);
  expect(screen.queryByLabelText(`Next stamp: ${escapeSequence(session)[0]}`)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Hide hint and continue' })).toBeNull();
});

test('memory feedback describes correct and incorrect moves and gates cannot submit during a save', () => {
  const initial: MiniGameSession = { ...fixture(false), escapeVersion: 2, elapsedMs: 100, inputs: [{ at: 100, action: { type: 'escape-recall' } }] };
  const input = jest.fn(), view = render(<EscapeGame session={initial} clock={clock} enabled={false} onInput={input} />);
  expect(screen.queryByRole('button', { name: /Hint: next/ })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Choose sun gate' }));
  expect(input).not.toHaveBeenCalled();
  const symbol = escapeSequence(initial)[0];
  const correct: MiniGameSession = { ...initial, elapsedMs: 200, inputs: [...initial.inputs, { at: 200, action: { type: 'stamp', symbol } }] };
  view.rerender(<EscapeGame session={correct} clock={clock} enabled onInput={input} />);
  expect(screen.getByText('Correct stamp.')).toBeOnTheScreen();
  const wrong: MiniGameSession = { ...initial, difficulty: 1, elapsedMs: 200, inputs: [...initial.inputs, { at: 200, action: { type: 'stamp', symbol: escapeSequence({ ...initial, difficulty: 1 })[0] === 'sun' ? 'moon' : 'sun' } }] };
  view.rerender(<EscapeGame session={wrong} clock={clock} enabled onInput={input} />);
  expect(screen.getByText('Wrong stamp. Try the same position again. 2 mistakes left.')).toBeOnTheScreen();
});
