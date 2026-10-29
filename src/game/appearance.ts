import type { Person, World } from './model';
import { automaticArtworkPools, type ArtworkPresentation } from './appearanceArtwork';

/** Presentation identity only. Never advances a simulation random stream. */
function artworkHash(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  return hash >>> 0;
}
export const facialIdentity = (key: string): number => artworkHash(key) % 16;
export const presentationForGender = (gender: Person['gender']): ArtworkPresentation => gender === 'male' ? 'masculine' : gender === 'female' ? 'feminine' : 'neutral';
export const automaticAppearanceKey = (worldId: string, personId: string) => worldId + ':' + personId;
const pickArtwork = (key: string, values: readonly number[]) => values[artworkHash(key) % values.length];

/** Exact scalar fingerprint: a manual edit cannot collide with an old hash. */
export function appearanceFingerprint(appearance: Person['appearance'], presentation: ArtworkPresentation): string {
  return JSON.stringify([appearance.face,appearance.skin,appearance.hair,appearance.hairColor,appearance.identity ?? null,appearance.outfit ?? null,presentation]);
}
export function isAutomaticAppearance(appearance: Person['appearance']): boolean {
  const source = appearance.provenance;
  return source?.kind === 'automatic' && source.version === 1 && source.fingerprint === appearanceFingerprint(appearance,source.presentation);
}

/** Constructors and explicitly proven legacy compatibility only. Preserve the
 * original face/skin/colour draws and use no simulation randomness for artwork.
 * Never use this to replace user-selected or ambiguous saved appearances.
 */
export function automaticAppearance(appearance: Person['appearance'], gender: Person['gender'], key: string): Person['appearance'] {
  const presentation = presentationForGender(gender), pool = automaticArtworkPools[presentation];
  const hair = (pool.hair as readonly number[]).includes(appearance.hair) ? appearance.hair : pickArtwork(key + ':hair',pool.hair);
  const result: Person['appearance'] = { face:appearance.face,skin:appearance.skin,hair,hairColor:appearance.hairColor,
    identity:pickArtwork(key + ':identity',pool.identities),outfit:pickArtwork(key + ':outfit',pool.outfits) };
  result.provenance = { kind:'automatic',version:1,presentation,fingerprint:appearanceFingerprint(result,presentation) };
  return result;
}

/** Built-in pre-identity NPCs had exactly these four fields. Reserved IDs are
 * evidence only because the app never exposed an NPC appearance editor. Unknown
 * identities, explicit artwork, provenance and extra custom markers stay intact.
 */
export function hasLegacyAutomaticAppearance(appearance: Person['appearance'], personId: string): boolean {
  const keys = Object.keys(appearance);
  return /^(?:person_parent[12]|person_npc_\d+_\d+)$/.test(personId) && keys.length === 4 &&
    ['face','skin','hair','hairColor'].every(key => keys.includes(key));
}

export function legacyNPCDefaultGender(world: World | null, personId: string | undefined, appearance: Person['appearance']): Person['gender'] | undefined {
  if (!world || !personId || personId === 'person_player' || personId === world.activePersonId || world.legacies.some(row => row.fromId === personId || row.toId === personId)) return;
  const person = world.people[personId];
  if (!person || !hasLegacyAutomaticAppearance(appearance,personId) || !hasLegacyAutomaticAppearance(person.appearance,personId)) return;
  if ((['face','skin','hair','hairColor'] as const).some(key => appearance[key] !== person.appearance[key])) return;
  return person.gender;
}

/** Render-only compatibility. Loading an old save never rewrites its payload. */
export function legacyNPCPortraitAppearance(appearance: Person['appearance'], personId: string, gender: Person['gender']): Person['appearance'] {
  return hasLegacyAutomaticAppearance(appearance,personId) ? automaticAppearance(appearance,gender,'legacy:' + personId) : appearance;
}
