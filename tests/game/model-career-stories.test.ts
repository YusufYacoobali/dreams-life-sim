import { modelActionStories, modelCareerStories } from '../../src/game/content/modelCareerStories';

const careerFields = ['reputation', 'quality', 'publicity', 'relationship', 'portfolio', 'payBps', 'commissionBps', 'agencyRisk', 'opportunity', 'obligation', 'leaveAgency'] as const;

test('model stories provide original, actionable choices with professional rather than body-perfection stakes', () => {
  expect(modelCareerStories.length).toBeGreaterThanOrEqual(24);
  expect(modelCareerStories.length).toBeLessThanOrEqual(30);
  expect(new Set(modelCareerStories.map(story => story.id)).size).toBe(modelCareerStories.length);
  expect(modelActionStories).toHaveLength(2);
  const all = [...modelCareerStories, ...modelActionStories];
  const payoffs = all.flatMap(story => story.choices.map(choice => choice.result));
  expect(new Set(payoffs).size).toBe(payoffs.length);
  for (const story of all) {
    expect(story.body).toContain('{contact}');
    expect(story.choices).toHaveLength(3);
    expect(story.choices.some(choice => (choice.impact.costBps ?? 0) === 0)).toBe(true);
    expect(new Set(story.choices.map(choice => choice.id)).size).toBe(3);
    expect(new Set(story.choices.map(choice => choice.label)).size).toBe(3);
    expect(new Set(story.choices.map(choice => JSON.stringify(choice.impact))).size).toBe(3);
    for (const choice of story.choices) {
      expect(choice.result.length).toBeGreaterThan(80);
      expect(choice.journal.length).toBeGreaterThan(35);
      expect(careerFields.some(field => Boolean(choice.impact[field]))).toBe(true);
      for (const amount of Object.values(choice.impact)) if (typeof amount === 'number') expect(Number.isInteger(amount)).toBe(true);
      expect(choice.impact.costBps ?? 0).toBeGreaterThanOrEqual(0);
    }
  }
});

test('fashion incidents support distinct editorial, commercial and independent decisions without fictional gross payouts', () => {
  const all = [...modelCareerStories, ...modelActionStories];
  expect(all.some(story => story.choices.some(choice => choice.impact.leaveAgency))).toBe(true);
  expect(all.some(story => story.choices.some(choice => (choice.impact.payBps ?? 0) > 0 && (choice.impact.obligation ?? 0) > 0))).toBe(true);
  expect(all.some(story => story.choices.some(choice => (choice.impact.costBps ?? 0) > 0 && (choice.impact.portfolio ?? 0) > 0))).toBe(true);
  expect(all.some(story => story.choices.some(choice => (choice.impact.commissionBps ?? 0) < 0 && (choice.impact.relationship ?? 0) < 0))).toBe(true);
  expect(all.filter(story => story.phase === 'between').length).toBeGreaterThanOrEqual(4);
  expect(all.filter(story => story.phase === 'working').length).toBeGreaterThanOrEqual(12);
  expect(all.find(story => story.id === 'model-representation-review')?.requiresAgency).toBe(true);
  expect(all.find(story => story.id === 'model-cover-escapes')?.minCredits).toBe(1);
});
