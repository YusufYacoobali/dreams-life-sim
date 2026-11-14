import React from 'react';
import { Animated, Image, Pressable, StyleSheet } from 'react-native';
import { render, screen } from '../support/rendering';
import { CellEscapeGame } from '../../src/minigames/escape/CellEscapeGame';
import { cellBoard } from '../../src/minigames/escape/cellEscapeLogic';
import type { MiniGameSession } from '../../src/minigames/core/types';

const fixture = (): MiniGameSession => ({
  id: 'cell-presentation', lifeId: 'practice', personId: 'practice', kind: 'escape',
  ownerId: 'practice', contextId: 'practice', started: { year: 2026, month: 1, day: 1 },
  startedRevision: 0, escapeVersion: 3, difficulty: 5, seed: 413, assisted: false,
  status: 'active', paused: false, elapsedMs: 0, inputs: [], score: null,
  rating: null, settled: null, appliedMonth: null,
});
const completed = (session: MiniGameSession): MiniGameSession => ({ ...session,
  inputs: cellBoard(session).locks.map((lock, index) => ({ at: (index + 1) * 100,
    action: { type: 'escape-fit', keyId: lock.keyId, lockId: lock.id },
  })),
});

afterEach(() => jest.restoreAllMocks());

test('separate bundled scene layers leave puzzle controls labelled, native and large enough to tap', async () => {
  const session = fixture();
  await render(<CellEscapeGame session={session} enabled reducedMotion onInput={jest.fn()} />);
  const sources = screen.UNSAFE_getAllByType(Image).map(image => {
    expect(image.props.accessible).toBe(false);
    return String(image.props.source.testUri);
  });
  expect(sources.some(source => source.endsWith('/cell-escape-background.png'))).toBe(true);
  expect(sources.some(source => source.endsWith('/cell-escape-objects.png'))).toBe(true);
  expect(screen.queryAllByRole('image')).toHaveLength(0);
  expect(screen.getAllByRole('radio', { name: /^Key: .*, [123] notch(?:es)?$/ })).toHaveLength(6);
  expect(screen.getAllByRole('button', { name: /^Lock \d: .*, [123] notch(?:es)?, locked$/ })).toHaveLength(6);
  for (const control of screen.UNSAFE_getAllByType(Pressable)) {
    const style = StyleSheet.flatten(control.props.style);
    expect(style.width ?? style.minWidth).toBeGreaterThanOrEqual(44);
    expect(style.height ?? style.minHeight).toBeGreaterThanOrEqual(44);
    expect(control.props.accessibilityLabel).toMatch(/^(Key:|Lock \d:)/);
  }
});

test('saved correct, incorrect and completed transcripts animate their separate objects without submitting another move', async () => {
  // Keep each native animation in progress: saved feedback and controls must
  // never depend on an animation callback or emit another gameplay command.
  const run = () => ({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() });
  const timing = jest.spyOn(Animated, 'timing').mockImplementation(run);
  const spring = jest.spyOn(Animated, 'spring').mockImplementation(run);
  const input = jest.fn(), session = fixture(), board = cellBoard(session);
  const view = await render(<CellEscapeGame session={session} enabled onInput={input} />);
  timing.mockClear(); spring.mockClear();
  const first = board.locks[0], second = board.locks[1];
  const correct: MiniGameSession = { ...session, inputs: [{ at: 100,
    action: { type: 'escape-fit', keyId: first.keyId, lockId: first.id },
  }] };
  await view.rerender(<CellEscapeGame session={correct} enabled onInput={input} />);
  expect(screen.getByRole('button', { name: /^Lock 1:.*open$/ })).toBeDisabled();
  expect(screen.getByText('Another lock opens.')).toBeOnTheScreen();
  expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ toValue: 1.12, useNativeDriver: true }));
  expect(spring).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ toValue: 1, useNativeDriver: true }));
  timing.mockClear();
  const wrongKey = board.keys.find(key => key.id !== first.keyId && key.id !== second.keyId)!;
  const incorrect: MiniGameSession = { ...correct, inputs: [...correct.inputs, { at: 200,
    action: { type: 'escape-fit', keyId: wrongKey.id, lockId: second.id },
  }] };
  await view.rerender(<CellEscapeGame session={incorrect} enabled onInput={input} />);
  expect(screen.getByText('That key does not fit. Try another.')).toBeOnTheScreen();
  for (const toValue of [-7, 7, -4, 4, 0]) expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ toValue, duration: 45, useNativeDriver: true }));
  expect(screen.getAllByRole('radio').filter(key => !key.props.accessibilityState.disabled)).toHaveLength(5);
  timing.mockClear();
  await view.rerender(<CellEscapeGame session={completed(session)} enabled onInput={input} />);
  expect(screen.getByText('The door is open!')).toBeOnTheScreen();
  expect(screen.queryAllByRole('radio')).toHaveLength(0);
  expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ toValue: 1, duration: 550, useNativeDriver: true }));
  expect(input).not.toHaveBeenCalled();
});

test('cold-opened completion respects reduced motion and needs no animation or extra input to show the result', async () => {
  const timing = jest.spyOn(Animated, 'timing'), spring = jest.spyOn(Animated, 'spring');
  const input = jest.fn(), session = JSON.parse(JSON.stringify(completed(fixture()))) as MiniGameSession;
  await render(<CellEscapeGame session={session} enabled reducedMotion onInput={input} />);
  expect(screen.getByText('The door is open!')).toBeOnTheScreen();
  expect(screen.queryAllByRole('radio')).toHaveLength(0);
  expect(screen.getAllByRole('button', { name: /^Lock \d:.*open$/ })).toHaveLength(6);
  expect(timing).not.toHaveBeenCalled();
  expect(spring).not.toHaveBeenCalled();
  expect(input).not.toHaveBeenCalled();
});
