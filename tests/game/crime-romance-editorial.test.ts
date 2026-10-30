import { writeConversation, type ConversationContext, type ConversationTopic } from '../../src/game/content/conversationWriting';
import { moneySupportBody, personActionBody, personReference } from '../../src/game/content/personInteractionWriting';

const base: ConversationContext = {
  targetName: 'Sam Carter', targetFirstName: 'Sam', actorAge: 30, targetAge: 32,
  actorStress: 20, targetStress: 20, trust: 80, setting: 'ordinary', familyRole: 'Sibling',
  interest: { person: 'both', label: 'reading' },
  school: { person: 'you', name: 'Riverside College', field: 'computing', status: 'current' },
  work: { person: 'them', title: 'Electrician', employer: 'Eastside Repairs', status: 'current' },
};
type Row = readonly [string, ConversationTopic, 'open' | 'reserved', Partial<ConversationContext>];
const conversations: Row[] = [
  ['C01', 'everyday', 'reserved', {}],
  ['C02', 'everyday', 'open', { actorAge: 4 }],
  ['C03', 'everyday', 'open', { targetAge: 4 }],
  ['C04', 'everyday', 'open', { actorAge: 15 }],
  ['C05', 'everyday', 'open', {}],
  ['C06', 'interests', 'reserved', {}],
  ['C07', 'interests', 'open', { actorAge: 9 }],
  ['C08', 'interests', 'open', {}],
  ['C09', 'interests', 'open', { interest: { person: 'you', label: 'reading' } }],
  ['C10', 'interests', 'open', { interest: { person: 'them', label: 'reading' } }],
  ['C11', 'interests', 'open', { interest: undefined }],
  ['C12', 'family', 'open', { familyRole: undefined }],
  ['C13', 'family', 'reserved', { familyRole: undefined }],
  ['C14', 'family', 'reserved', {}],
  ['C15', 'family', 'open', { actorAge: 9 }],
  ['C16', 'family', 'open', {}],
  ['C17', 'school', 'open', { school: undefined }],
  ['C18', 'school', 'reserved', { school: undefined }],
  ['C19', 'school', 'reserved', {}],
  ['C20', 'school', 'open', { school: { ...base.school!, status: 'paused' } }],
  ['C21', 'school', 'open', { school: { ...base.school!, status: 'completed' } }],
  ['C22', 'school', 'open', { actorAge: 9 }],
  ['C23', 'school', 'open', {}],
  ['C24', 'work', 'open', { work: undefined }],
  ['C25', 'work', 'reserved', { work: undefined }],
  ['C26', 'work', 'reserved', {}],
  ['C27', 'work', 'open', { work: { ...base.work!, status: 'past' } }],
  ['C28', 'work', 'open', { actorAge: 9 }],
  ['C29', 'work', 'open', {}],
  ['C30', 'feelings', 'reserved', {}],
  ['C31', 'feelings', 'open', { actorAge: 9 }],
  ['C32', 'feelings', 'open', { actorStress: 80, targetStress: 80 }],
  ['C33', 'feelings', 'open', { actorStress: 80 }],
  ['C34', 'feelings', 'open', { targetStress: 80 }],
  ['C35', 'feelings', 'open', {}],
  ['C36', 'feelings', 'open', { trust: 45 }],
];

function concise(body: string) {
  expect(body.match(/[.!?](?=\s|$)/g)).toHaveLength(2);
  expect(body.split(/\s+/).length).toBeLessThanOrEqual(60);
  expect(body).not.toMatch(/apparently|somehow|unexpectedly|Your relationship improved|good conversation|\{[^}]+\}/);
}

test('the editorial inventory covers 36 distinct conversation outcomes, retaining factual subjects and brief journals', () => {
  expect(conversations).toHaveLength(36);
  const bodies: string[] = [];
  const random = jest.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Writing must not draw'); });
  try {
    for (const [id, topic, outcome, patch] of conversations) {
      const context = Object.freeze({ ...base, ...patch }), before = JSON.stringify(context);
      const row = writeConversation(context, topic, outcome);
      concise(row.body); bodies.push(row.body);
      expect(row.body).toContain('Sam');
      expect(row.journal).toMatch(/^I /); expect(row.journal).toContain('Sam Carter');
      expect(row.body + row.journal).not.toMatch(/arrested|divorced|married|paid |earned |diagnosed|cured|promotion|new partner/);
      expect(JSON.stringify(context)).toBe(before);
      expect(id).toMatch(/^C\d\d$/);
    }
    expect(new Set(bodies).size).toBe(36);
    expect(random).not.toHaveBeenCalled();
  } finally { random.mockRestore(); }
});

const roles = ['Father', 'Mother', 'Partner', 'Sibling', 'Child', 'Guardian', 'Friend', 'Former partner'] as const;
test('40 support outcomes distinguish exact partial transfers, refusal and genuine lack of available funds', () => {
  const bodies: string[] = [];
  for (const role of roles) {
    for (const outcome of ['gift', 'partial', 'annoyed', 'refused', 'unavailable'] as const) {
      const body = moneySupportBody('Sam', role, outcome === 'unavailable' ? 'refused' : outcome, '$500', '$50', outcome !== 'unavailable');
      concise(body); bodies.push(body);
      if (outcome === 'gift' || outcome === 'partial') expect(body).toContain('gives you $50');
      else expect(body).not.toContain('$50.');
      if (outcome !== 'gift') expect(body).toContain('$500');
      if (outcome === 'unavailable') expect(body).toContain('cannot spare');
      if (outcome === 'refused') expect(body).toContain('says no');
      expect(body).not.toMatch(/you owe|interest-free|repay|loan|salary|deposit|visited|at home|married|affair/);
    }
  }
  expect(bodies).toHaveLength(40); expect(new Set(bodies).size).toBe(40);
});

test('13 action outcomes describe completed actions or refusals without adding settings, payments or romantic history', () => {
  const reference = personReference('Sam', 'Guardian');
  const bodies: string[] = [];
  for (const action of ['insult', 'distance', 'praise', 'scold', 'ask-activity'] as const) bodies.push(personActionBody(action, reference, false));
  for (const action of ['ask-permission', 'ask-advice', 'ask-help', 'request-gift'] as const) {
    bodies.push(personActionBody(action, reference, false));
    bodies.push(personActionBody(action, reference, true, { name: 'Mechanical Watch', price: '$100' }));
  }
  expect(bodies).toHaveLength(13); expect(new Set(bodies).size).toBe(13);
  for (const body of bodies) {
    concise(body); expect(body).toContain('Sam');
    expect(body).not.toMatch(/rain|restaurant|promotion|affair|divorce|prison|new friend/);
    if (body.includes('buys you')) expect(body).toContain('including its distinctly less romantic upkeep');
    else expect(body).not.toContain('$100');
  }
});
