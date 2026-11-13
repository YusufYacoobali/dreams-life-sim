import React from 'react';
jest.mock('../../src/persistence/native', () => ({ openRepository: async () => { throw new Error('Unexpected native database access'); } }));
import { act, fireEvent, render, screen } from '../support/rendering';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersonPicker } from '../../src/ui/PersonPicker';
import { ThemeProvider } from '../../src/ui/theme';
import { pupil } from '../support/pupil';
import { newFinance } from '../../src/game/systems/schemas';
import { encodeWorld, fullName } from '../../src/game/model';
import { Button } from '../../src/ui/components';
const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 640 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>;

test('a long portrait selection searches every contact, requires confirmation and leaves the world untouched', async () => {
  const world = pupil(), template = world.people.person_parent1;
  const ids = Array.from({ length: 45 }, (_, index) => {
    const id = 'person_picker_' + index; world.people[id] = { ...structuredClone(template), id, householdId: null, employment: null, finance: newFinance('USD'), firstName: 'Contact' + index }; return id;
  });
  const before = encodeWorld(world), choose = jest.fn(), cancel = jest.fn();
  await render(frame(<PersonPicker world={world} title="Invite a Friend" personIds={[...ids, ids[0]]} onChoose={choose} onCancel={cancel} />));
  expect(screen.getAllByRole('radio')).toHaveLength(45);
  expect(screen.getByRole('button', { name: 'Choose' })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Search people'), 'Contact44');
  expect(screen.getAllByRole('radio')).toHaveLength(1);
  await fireEvent.press(screen.getByRole('radio', { name: /^Contact44 / }));
  expect(choose).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Choose' }));
  expect(choose).toHaveBeenCalledWith('person_picker_44'); expect(encodeWorld(world)).toBe(before);
});

test('eligibility is checked again after selecting, with deceased and absent contacts unavailable', async () => {
  const world = pupil(), id = 'person_parent1', choose = jest.fn(), cancel = jest.fn();
  let absent = false;
  const picker = () => frame(<PersonPicker world={world} title="Choose a Guest" personIds={[id, 'person_parent2', 'missing', world.activePersonId]} eligibility={personId => personId === id && absent ? 'Away from home' : undefined} onChoose={choose} onCancel={cancel} />);
  const view = await render(picker());
  await fireEvent.press(screen.getByRole('radio', { name: new RegExp('^' + fullName(world.people[id])) }));
  absent = true; await view.rerender(picker());
  expect(screen.getByRole('button', { name: 'Choose' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Choose' })); expect(choose).not.toHaveBeenCalled();
  world.people[id].died = { ...world.date }; await view.rerender(picker());
  expect(screen.getByRole('radio', { name: /Deceased/ })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Never mind' })); expect(cancel).toHaveBeenCalledTimes(1);
});

test('a cancelled picker rejects a queued native confirmation and supports an empty list', async () => {
  const world = pupil(), choose = jest.fn(), cancel = jest.fn(), id = 'person_parent1';
  const view = await render(frame(<PersonPicker world={world} title="Pick Someone" personIds={[id]} onChoose={choose} onCancel={cancel} />));
  await fireEvent.press(screen.getByRole('radio', { name: new RegExp('^' + fullName(world.people[id])) }));
  const queued = screen.UNSAFE_getAllByType(Button).find(node => node.props.label === 'Choose')!.props.onPress;
  await fireEvent.press(screen.getByRole('button', { name: 'Never mind' }));
  await act(async () => queued()); expect(choose).not.toHaveBeenCalled();
  await view.rerender(frame(<PersonPicker world={world} title="Nobody Available" personIds={[]} onChoose={choose} onCancel={cancel} />));
  expect(screen.getByText('No contacts are available for this activity.')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Choose' })).toBeDisabled();
});
