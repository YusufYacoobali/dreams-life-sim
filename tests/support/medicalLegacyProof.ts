/** A comparison view for frozen pre-episode proofs only. The returned JSON is
 * NOT a valid current World49 after stripping required metadata. Never use it
 * for validation, replay, input setup or current-world roundtrip assertions.
 * Parse into a fresh object and remove only the newly introduced condition
 * metadata; keep the tuple and every pre-existing field, including history,
 * funds, identifiers and random streams. No live migration acts as an oracle. */
export function withoutMedicalEpisodeMetadata(encodedWorld: string): string {
  const world = JSON.parse(encodedWorld) as { people?: Record<string, { health?: { conditions?: Record<string, unknown>[] } }> };
  for (const person of Object.values(world.people ?? {})) for (const condition of person.health?.conditions ?? []) delete condition.episode;
  return JSON.stringify(world);
}
