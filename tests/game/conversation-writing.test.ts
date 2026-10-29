import { ConversationContext, ConversationTopic, writeConversation } from '../../src/game/content/conversationWriting';

const adult: ConversationContext = {
  targetName: 'Sam Carter', targetFirstName: 'Sam', actorAge: 30, targetAge: 32,
  actorStress: 20, targetStress: 25, trust: 75, setting: 'ordinary', familyRole: 'Sibling',
  interest: { person: 'both', label: 'reading' },
  school: { person: 'you', name: 'Riverside College', field: 'computing', status: 'paused' },
  work: { person: 'them', title: 'Electrician', employer: 'Eastside Repairs', status: 'current' },
};
const topics: ConversationTopic[] = ['everyday', 'interests', 'family', 'school', 'work', 'feelings'];

test('six explicit topics produce distinct conversations and factual first-person journals', () => {
  for (const outcome of ['open', 'reserved'] as const) {
    const writing = topics.map(topic => writeConversation(adult, topic, outcome));
    expect(new Set(writing.map(row => row.body)).size).toBe(6);
    expect(new Set(writing.map(row => row.journal)).size).toBe(6);
    for (const row of writing) {
      expect(row.title.trim().split(/\s+/).length).toBeGreaterThanOrEqual(2);
      expect(row.title.trim().split(/\s+/).length).toBeLessThanOrEqual(6);
      expect(row.body).toContain('Sam');
      expect(row.journal).toMatch(/^I /);
      expect(row.journal).toContain('Sam Carter');
      expect(row.body).not.toMatch(/discussion about food|put their phone away/);
    }
  }
});

test('writing is deterministic and does not mutate its supplied facts or draw randomness', () => {
  const context = Object.freeze({ ...adult, interest: Object.freeze({ ...adult.interest! }), school: Object.freeze({ ...adult.school! }), work: Object.freeze({ ...adult.work! }) });
  const before = JSON.stringify(context), random = jest.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Writing must not draw'); });
  try {
    for (const topic of topics) {
      expect(writeConversation(context, topic, 'open')).toEqual(writeConversation(context, topic, 'open'));
      expect(writeConversation(context, topic, 'reserved')).toEqual(writeConversation(context, topic, 'reserved'));
    }
    expect(JSON.stringify(context)).toBe(before);
    expect(random).not.toHaveBeenCalled();
  } finally { random.mockRestore(); }
});

test('interest ownership never turns one person’s actual interest into a shared hobby', () => {
  const yours = writeConversation({ ...adult, interest: { person: 'you', label: 'piano' } }, 'interests', 'open');
  const theirs = writeConversation({ ...adult, interest: { person: 'them', label: 'piano' } }, 'interests', 'open');
  const both = writeConversation({ ...adult, interest: { person: 'both', label: 'piano' } }, 'interests', 'open');
  expect(yours.journal).toContain('my interest in piano');
  expect(theirs.journal).toContain("Sam Carter's interest in piano");
  expect(both.journal).toContain('our shared interest in piano');
  expect(yours.body + theirs.body).not.toMatch(/shared|both enjoy|practised together/);
  const unknown = writeConversation({ ...adult, interest: undefined }, 'interests', 'open');
  expect(unknown.body + unknown.journal).not.toMatch(/piano|reading|new hobby|joined|lesson/);
});

test('school copy distinguishes current, paused and earlier study without inventing a qualification', () => {
  const current = writeConversation({ ...adult, school: { person: 'you', name: 'North School', field: 'general', status: 'current' } }, 'school', 'open');
  const paused = writeConversation(adult, 'school', 'open');
  const completed = writeConversation({ ...adult, school: { person: 'them', name: 'South College', field: 'business', status: 'completed' } }, 'school', 'open');
  expect(current.journal).toContain('my studies at North School');
  expect(current.body).not.toContain('in general');
  expect(paused.body).toContain('paused studies at Riverside College');
  expect(paused.journal).toContain('my paused studies');
  expect(completed.journal).toContain('their earlier studies at South College');
  for (const row of [current, paused, completed]) expect(row.body + row.journal).not.toMatch(/graduated|qualification|diploma|passed|tuition|\d+%/);
  const unknown = writeConversation({ ...adult, school: undefined }, 'school', 'open');
  expect(unknown.body + unknown.journal).not.toMatch(/North School|Riverside College|South College|enrolled|degree/);
});

test('current and former work retain the actual owner, role and employer without inventing pay or success', () => {
  const current = writeConversation(adult, 'work', 'open');
  const past = writeConversation({ ...adult, work: { person: 'you', title: 'Barista', employer: 'Harbour Cafe', status: 'past' } }, 'work', 'reserved');
  expect(current.body).toContain("Sam's Electrician role at Eastside Repairs");
  expect(current.journal).toContain('their Electrician role at Eastside Repairs');
  expect(past.body).toContain('your former Barista role at Harbour Cafe');
  expect(past.journal).toContain('my former Barista role at Harbour Cafe');
  expect(current.body + current.journal + past.body + past.journal).not.toMatch(/salary|promotion|pay rise|bonus|\$|successful|excellent/);
  const unknown = writeConversation({ ...adult, work: undefined }, 'work', 'open');
  expect(unknown.body + unknown.journal).not.toMatch(/Electrician|Eastside|employed|new job|contract/);
});

test('a small child can speak or be listened to without adult-phone or adult-work assumptions', () => {
  const childSpeaking = writeConversation({ ...adult, actorAge: 4 }, 'everyday', 'open');
  const adultListening = writeConversation({ ...adult, targetAge: 4 }, 'everyday', 'open');
  expect(childSpeaking.body).toMatch(/^You tell Sam /);
  expect(adultListening.body).toMatch(/^Sam tells you /);
  expect(childSpeaking.body + adultListening.body).not.toMatch(/phone|commute|salary|deadline|dating/);
  expect(writeConversation({ ...adult, actorAge: 15 }, 'everyday', 'open').body).not.toEqual(childSpeaking.body);
  const family = writeConversation({ ...adult, familyRole: 'Guardian', actorAge: 8 }, 'family', 'open');
  expect(family.body).toContain('your guardian, Sam,');
  expect(family.body + family.journal).not.toMatch(/mother|father|pregnan|gave birth|biological/);
  const noFamilyFact = writeConversation({ ...adult, familyRole: undefined }, 'family', 'open');
  expect(noFamilyFact.body + noFamilyFact.journal).not.toMatch(/your sibling|your guardian|being family|being your|being a parent/);
});

test('hospital, custody and apart contexts do not invent an in-person visit or a method of contact', () => {
  for (const setting of ['hospital', 'custody', 'apart'] as const) for (const topic of topics) for (const outcome of ['open', 'reserved'] as const) {
    const row = writeConversation({ ...adult, setting }, topic, outcome);
    expect(row.body).not.toMatch(/visited|sat beside|met at|phone|video call|hospital bed|cell door|at home/);
    expect(row.journal).not.toMatch(/visited|travelled|went to the hospital|entered prison/);
  }
});

test('feelings use supplied stress and trust without inventing a diagnosis, cure or disclosed secret', () => {
  const mine = writeConversation({ ...adult, actorStress: 80 }, 'feelings', 'open');
  const theirs = writeConversation({ ...adult, targetStress: 80 }, 'feelings', 'open');
  const neither = writeConversation(adult, 'feelings', 'open');
  expect(mine.body).toContain('You tell Sam that things feel strained');
  expect(theirs.body).toContain('You ask Sam how they are holding up');
  expect(neither.body).not.toContain('feel strained');
  const cautious = writeConversation({ ...adult, trust: 45 }, 'feelings', 'open');
  expect(cautious.body).not.toEqual(neither.body);
  const reserved = writeConversation({ ...adult, actorStress: 90, targetStress: 95 }, 'feelings', 'reserved');
  expect(reserved.journal).toContain('respected their privacy');
  for (const row of [mine, theirs, neither, cautious, reserved]) expect(row.body + row.journal).not.toMatch(/diagnos|depression|anxiety disorder|cured|stress fell|shared a secret|therap/);
});
