import React from 'react';
import type { World } from '../game/model';
import { ageOn, fullName } from '../game/personHelpers';
import { relationFor, relationLabel } from '../game/systems/relationships';
import { EventModal } from './EventModal';
import { Portrait } from './components';

export type PersonPickerProps = {
  world: World;
  title: string;
  personIds: readonly string[];
  eligibility?: (personId: string) => string | undefined | null;
  onChoose: (personId: string) => void;
  onCancel: () => void;
  busy?: boolean;
  selectedId?: string;
  confirmLabel?: string;
};

/** A read-only selection; the caller still reviews and resolves the real action. */
export function PersonPicker({ world, title, personIds, eligibility, onChoose, onCancel, busy = false, selectedId, confirmLabel = 'Choose' }: PersonPickerProps) {
  const choices = [...new Set(personIds)].flatMap(id => {
    const person = world.people[id];
    if (!person || id === world.activePersonId) return [];
    const edge = relationFor(world, world.activePersonId, id);
    const role = edge ? relationLabel(world, edge) : 'Contact';
    const age = ageOn(person, person.died ?? world.date);
    return [{ id, label: fullName(person) + ' · ' + role + ' · ' + (person.died ? 'Deceased' : 'Age ' + age),
      disabledReason: person.died ? 'This person has died' : eligibility?.(id) ?? undefined,
      illustration: <Portrait decorative personId={id} name={fullName(person)} appearance={person.appearance} age={age} size={36} /> }];
  });
  return <EventModal event={{ id: 'people:' + world.id + ':' + world.activePersonId + ':' + title, kind: 'selection', title,
    body: choices.length ? 'Choose someone to join you.' : 'No contacts are available for this activity.', choices, confirmLabel }}
    busy={busy} selectionSearch={choices.length > 8 ? { label: 'Search people', placeholder: 'Search by name or relationship', selectedId } : { label: 'Search people', selectedId }}
    onCancel={onCancel} onChoose={id => { if (!busy && choices.some(choice => choice.id === id && !choice.disabledReason)) onChoose(id); }} />;
}
