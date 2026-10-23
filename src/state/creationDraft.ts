import { create } from 'zustand';
import type { Creation } from '../game/createLife';
import { countries } from '../game/countries';
import { royalCountries } from '../game/content/royalty';
import { newCreationDefaults, suggestedCreationAppearance, suggestedFirstName, suggestedLastName, suitableSuggestedFirstName } from '../game/creationDefaults';

type ArtworkChoice = 'identity' | 'hair' | 'outfit';
type Draft = {
  seed: number; input: Creation; mode: 'custom' | 'random';
  edited: { firstName: boolean; lastName: boolean; artwork: Record<ArtworkChoice, boolean> };
};
type CreationChange = Omit<Partial<Creation>, 'appearance'> & { appearance?: Partial<Creation['appearance']> };
type CreationDraft = {
  draft: Draft | null;
  begin: (seed: number, mode: Draft['mode']) => void;
  /** Replace a complete custom input; edit individual fields with edit. */
  update: (input: Creation) => void;
  edit: (change: CreationChange) => void;
  randomise: (seed: number) => void;
  customise: () => void;
};
const artworkChoices = ['identity', 'hair', 'outfit'] as const;
const newDraft = (seed: number, mode: Draft['mode']): Draft => ({
  seed, mode, input: newCreationDefaults(seed),
  edited: { firstName: false, lastName: false, artwork: { identity: false, hair: false, outfit: false } },
});

function editDraft(draft: Draft, change: CreationChange): Draft {
  const previous = draft.input;
  const input = { ...previous, ...change, appearance: change.appearance ? { ...previous.appearance, ...change.appearance } : previous.appearance };
  const edited = {
    firstName: draft.edited.firstName || change.firstName !== undefined,
    lastName: draft.edited.lastName || change.lastName !== undefined,
    artwork: { ...draft.edited.artwork },
  };
  for (const key of artworkChoices) if (change.appearance?.[key] !== undefined) edited.artwork[key] = true;
  if (input.country !== previous.country) {
    if (!edited.firstName) input.firstName = suggestedFirstName(draft.seed, input.country, input.gender);
    if (!edited.lastName) input.lastName = suggestedLastName(draft.seed, input.country);
    input.city = change.city && countries[input.country].cities.includes(change.city) ? change.city : countries[input.country].cities[0];
    if (!(royalCountries as readonly string[]).includes(input.country)) input.background = 'ordinary';
  } else if (input.gender !== previous.gender && !edited.firstName && !suitableSuggestedFirstName(input.firstName, input.country, input.gender)) {
    input.firstName = suggestedFirstName(draft.seed, input.country, input.gender);
  }
  if (input.gender !== previous.gender) {
    const suggested = suggestedCreationAppearance(draft.seed, input.gender, input.appearance);
    input.appearance = { ...input.appearance };
    if (!edited.artwork.identity) input.appearance.identity = suggested.identity;
    if (!edited.artwork.hair) input.appearance.hair = suggested.hair;
    if (!edited.artwork.outfit) input.appearance.outfit = suggested.outfit;
  }
  return { ...draft, input, edited };
}

/** A navigation draft, separate from saved lives and simulation randomness. */
export const useCreationDraft = create<CreationDraft>((set, get) => ({
  draft: null,
  begin: (seed, mode) => { if (get().draft?.seed !== seed || get().draft?.mode !== mode) set({ draft: newDraft(seed, mode) }); },
  update: input => set(state => ({ draft: state.draft ? { ...state.draft, input,
    edited: { firstName: true, lastName: true, artwork: { identity: true, hair: true, outfit: true } },
  } : null })),
  edit: change => set(state => ({ draft: state.draft ? editDraft(state.draft, change) : null })),
  randomise: seed => set({ draft: newDraft(seed, 'random') }),
  customise: () => set(state => ({ draft: state.draft ? { ...state.draft, mode: 'custom' } : null })),
}));
