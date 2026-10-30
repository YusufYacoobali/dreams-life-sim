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
