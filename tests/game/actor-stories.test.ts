import { actorStories, actorActionStories } from '../../src/game/content/actorStories';

const all = [...actorStories, ...actorActionStories];
const careerEffects = ['reputation', 'quality', 'publicity', 'relationship', 'payBps', 'commissionBps', 'agencyRisk', 'opportunity', 'obligation', 'leaveAgency'] as const;

test('actor has 26 original substantial situations plus two separate action incidents', () => {
  expect(actorStories).toHaveLength(26);
  expect(actorActionStories).toHaveLength(2);
  for (const field of ['id', 'title', 'body'] as const) expect(new Set(all.map(story => story[field])).size).toBe(all.length);
  expect(actorStories.some(story => story.phase === 'working')).toBe(true);
  expect(actorStories.some(story => story.phase === 'between')).toBe(true);
});

test.each(all.map(story => [story.id, story] as const))('%s has three authored, materially different career decisions', (_id, story) => {
  expect(story.body.length).toBeGreaterThan(100);
  expect(story.choices).toHaveLength(3);
  for (const field of ['id', 'label', 'result', 'journal'] as const) expect(new Set(story.choices.map(choice => choice[field])).size).toBe(3);
  expect(new Set(story.choices.map(choice => JSON.stringify(choice.impact))).size).toBe(3);
  for (const choice of story.choices) {
    expect(choice.result.length).toBeGreaterThan(75);
    expect(choice.journal).toMatch(/^I /);
    expect(careerEffects.some(effect => !!choice.impact[effect])).toBe(true);
    for (const [key, value] of Object.entries(choice.impact)) {
      if (key === 'leaveAgency') expect(typeof value).toBe('boolean');
      else { expect(Number.isSafeInteger(value)).toBe(true); expect(Math.abs(Number(value))).toBeLessThanOrEqual(1000); }
    }
    if (choice.impact.costBps !== undefined) expect(choice.impact.costBps).toBeGreaterThanOrEqual(0);
    if (choice.impact.payBps !== undefined) expect(story.phase).toBe('working');
  }
});

test('representation incidents are gated and manufactured comeback copy requires actual completed credits', () => {
  for (const story of all.filter(story => story.contact === 'agent')) expect(story.requiresAgency).toBe(true);
  expect(actorStories.find(story => story.id === 'actor-comeback-label')!.minCredits).toBeGreaterThanOrEqual(2);
  expect(all.flatMap(story => story.choices).every(choice => !Object.keys(choice.impact).some(key => /income|gross|boxOffice|cashReward/.test(key)))).toBe(true);
});
