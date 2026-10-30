import { organisedCrimeStories } from '../../src/game/content/organisedCrimeStories';
import { prisonStories } from '../../src/game/content/prisonStories';
import { romanceDramaStories } from '../../src/game/content/romanceDramaStories';

const stories = [
  ...organisedCrimeStories.map(story => ({ ...story, choices: story.choices.map(choice => ({ id: choice.action, label: choice.label, body: choice.outcome, journal: choice.journal })) })),
  ...prisonStories,
  ...romanceDramaStories,
];

test('the new annual library has 80 distinct authored premises separate from mission and interaction results', () => {
  expect(organisedCrimeStories).toHaveLength(20);
  expect(prisonStories).toHaveLength(25);
  expect(romanceDramaStories.filter(story => story.group === 'partner')).toHaveLength(25);
  expect(romanceDramaStories.filter(story => story.group === 'ex')).toHaveLength(10);
  expect(stories).toHaveLength(80);
  expect(new Set(stories.map(story => story.id)).size).toBe(80);
  expect(new Set(stories.map(story => story.body)).size).toBe(80);
  // Similarity flags still need an editorial review: unique strings alone do
  // not make a renamed snoring scene into a new premise.
  expect(new Set(stories.map(story => story.title.toLowerCase())).size).toBe(80);
});

test.each(stories)('$id has distinct decisions, concrete outcomes and first-person factual journals', story => {
  expect(story.title.trim().split(/\s+/).length).toBeGreaterThanOrEqual(2);
  expect(story.title.trim().split(/\s+/).length).toBeLessThanOrEqual(6);
  expect(story.body.split(/\s+/).length).toBeLessThanOrEqual(65);
  expect(story.choices.length).toBeGreaterThanOrEqual(2);
  expect(story.choices.length).toBeLessThanOrEqual(4);
  for (const field of ['id', 'label', 'body', 'journal'] as const) expect(new Set(story.choices.map(choice => choice[field])).size).toBe(story.choices.length);
  for (const choice of story.choices) {
    expect(choice.label.trim().split(/\s+/).length).toBeLessThanOrEqual(9);
    expect(choice.journal).toMatch(/^I /);
    expect(choice.body.trim().length).toBeGreaterThan(20);
    expect(choice.body + choice.journal).not.toMatch(/Your relationship improved|You had a good conversation|no invented|manufactur(?:e|ed|ing) (?:a|an|the|money|purchase|new)|off the books|actually happened, not/);
    expect((story.body + choice.label + choice.body + choice.journal).replaceAll('{name}', '')).not.toMatch(/\{[^}]+\}/);
  }
});
