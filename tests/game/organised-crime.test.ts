import {
  decodeWorld,
  encodeWorld,
  validateWorld,
  type World,
} from "../../src/game/model";
import { resolveCommand, recordDeath } from "../../src/game/engine";
import { accountFor } from "../../src/game/systems/common";
import {
  activeOrganisation,
  organisedCrimeMonth,
  refreshOrganisedCrime,
  organisationRank,
} from "../../src/game/systems/organisedCrime";
import { organisedCrimeStories } from "../../src/game/content/organisedCrimeStories";
import { organisedMissions } from "../../src/game/content/organisedCrime";
import { relationFor } from "../../src/game/systems/relationshipQueries";
import { isConfined } from "../../src/game/systems/legalSchemas";
import graduate from "../fixtures/v3-employed-graduate.json";
function fixture() {
  const w = decodeWorld(JSON.stringify(graduate));
  w.people[w.activePersonId].stats.energy = 100;
  w.people[w.activePersonId].stats.health = 100;
  return w;
}
function ack(w: World) {
  if (w.pending?.kind !== "result")
    throw new Error("Expected result: " + w.pending?.kind);
  return resolveCommand(w, { type: "acknowledge", resultId: w.pending.id });
}
function joined(
  style:
    | "street-syndicate"
    | "fraud-network"
    | "smuggling-ring" = "street-syndicate",
) {
  return ack(resolveCommand(fixture(), { type: "organised-join", style }));
}
function mission(
  input: World,
  approach: "cautious" | "bold" | "crew-led" = "cautious",
) {
  for (let seed = 1; seed <= 300; seed++) {
    const w = decodeWorld(encodeWorld(input));
    w.random.outcomes = seed;
    w.people[w.activePersonId].stats.energy = 100;
    const next = resolveCommand(w, {
      type: "organised-mission",
      gangId: activeOrganisation(w)!.id,
      mission: "missing-envelope",
      approach,
    });
    if (
      !isConfined(next) &&
      activeOrganisation(next)!.organised!.jobs.at(-1)!.success
    )
      return ack(next);
  }
  throw new Error("No successful unarrested seed");
}
function later(w: World) {
  w.date.year++;
  w.people[w.activePersonId].stats.energy = 100;
  return w;
}
function underboss() {
  let w = joined();
  for (let rank = 0; rank < 3; rank++) {
    if (rank) later(w);
    w = mission(mission(w));
    w = ack(
      resolveCommand(w, {
        type: "organised-promotion",
        gangId: activeOrganisation(w)!.id,
      }),
    );
  }
  return w;
}
function bossCandidate() {
  let w = underboss();
  later(w);
  w = mission(mission(w));
  return w;
}
test.each(["street-syndicate", "fraud-network", "smuggling-ring"] as const)(
  "joins %s with stable named participants, origin and no fictional income",
  (style) => {
    const initial = fixture(),
      cash = accountFor(initial).cash,
      w = ack(resolveCommand(initial, { type: "organised-join", style })),
      g = activeOrganisation(w)!;
    expect(g.organised!.members).toHaveLength(3);
    expect(g.organised!.rivals).toHaveLength(1);
    expect(g.organised!.leaderId).toBe(g.contactIds[0]);
    expect(accountFor(w).cash).toBe(cash);
    expect(decodeWorld(encodeWorld(w))).toEqual(w);
    expect(w.people[initial.activePersonId].employment).toEqual(
      initial.people[initial.activePersonId].employment,
    );
  },
);
test("decline, leave and rejoin preserve history, identity, rank and participants", () => {
  const initial = fixture(),
    refused = ack(
      resolveCommand(initial, {
        type: "organised-refuse",
        style: "street-syndicate",
      }),
    );
  expect(refused.gangs).toHaveLength(0);
  expect(refused.ledger).toEqual(initial.ledger);
  let w = joined();
  const g = activeOrganisation(w)!,
    ids = g.contactIds,
    size = Object.keys(w.people).length;
  w = ack(resolveCommand(w, { type: "organised-leave", gangId: g.id }));
  w = ack(
    resolveCommand(w, { type: "organised-join", style: "street-syndicate" }),
  );
  expect(activeOrganisation(w)!.id).toBe(g.id);
  expect(activeOrganisation(w)!.contactIds).toEqual(ids);
  expect(Object.keys(w.people)).toHaveLength(size);
  expect(activeOrganisation(w)!.organised!.history.map((h) => h.kind)).toEqual([
    "joined",
    "left",
    "rejoined",
  ]);
});
test("mission payouts are real, source-linked and credited once", () => {
  const initial = joined(),
    before = accountFor(initial).cash,
    w = mission(initial),
    job = activeOrganisation(w)!.organised!.jobs[0],
    incident = w.incidents.find((i) => i.id === job.incidentId)!;
  expect(job.proceeds).toBeGreaterThan(0n);
  expect(accountFor(w).cash - before).toBe(job.proceeds);
  expect(w.ledger.find((t) => t.id === job.transactionId)!.cashDelta).toBe(
    job.proceeds,
  );
  expect(incident.gain.minor).toBe(job.proceeds);
  expect(incident.offence).toBe("organized-job");
  expect(decodeWorld(encodeWorld(w))).toEqual(w);
});
test("bold assignments pay more with greater evidence than cautious assignments", () => {
  const w = joined(),
    careful = mission(w),
    bold = mission(w, "bold");
  expect(activeOrganisation(bold)!.organised!.jobs[0].proceeds).toBeGreaterThan(
    activeOrganisation(careful)!.organised!.jobs[0].proceeds,
  );
  const a = careful.incidents.at(-1)!,
    b = bold.incidents.at(-1)!;
  expect(b.riskBps).toBeGreaterThan(a.riskBps);
});
test("two yearly jobs cannot be bypassed using another category or reload", () => {
  const w = mission(mission(joined())),
    g = activeOrganisation(w)!;
  expect(() =>
    resolveCommand(decodeWorld(encodeWorld(w)), {
      type: "organised-mission",
      gangId: g.id,
      mission: "territory-dispute",
      approach: "cautious",
    }),
  ).toThrow(/Two criminal assignments/);
  expect(g.organised!.jobs).toHaveLength(2);
});
test("promotion requires actual jobs, loyalty, experience and a major decision", () => {
  let w = joined(),
    g = activeOrganisation(w)!;
  expect(() =>
    resolveCommand(w, { type: "organised-promotion", gangId: g.id }),
  ).toThrow(/Complete 2/);
  w = mission(mission(w));
  w = ack(resolveCommand(w, { type: "organised-promotion", gangId: g.id }));
  expect(organisationRank(activeOrganisation(w)!)).toBe("Trusted Member");
  expect(() =>
    resolveCommand(w, { type: "organised-decision", gangId: g.id }),
  ).toThrow(/major organisation decision/);
  expect(decodeWorld(encodeWorld(w))).toEqual(w);
});
test("a natural eight-job journey reaches underboss then changes the saved leader", () => {
  const initial = bossCandidate(),
    g = activeOrganisation(initial)!;
  expect(g.organised!.rank).toBe(3);
  const previous = g.organised!.leaderId;
  let won: World | undefined;
  for (let seed = 1; seed < 300; seed++) {
    const w = decodeWorld(encodeWorld(initial));
    w.random.outcomes = seed;
    const next = resolveCommand(w, {
      type: "organised-challenge",
      gangId: g.id,
      action: "challenge",
    });
    if (activeOrganisation(next)?.organised!.rank === 4) {
      won = ack(next);
      break;
    }
  }
  expect(won).toBeDefined();
  const state = activeOrganisation(won!)!.organised!;
  expect(state.leaderId).toBe(won!.activePersonId);
  expect(state.members.find((m) => m.personId === previous)!.role).toBe(
    "member",
  );
  expect(
    state.members.find((m) => m.personId === previous)!.memories,
  ).toContain("replaced-by:" + won!.activePersonId);
  expect(decodeWorld(encodeWorld(won!))).toEqual(won);
});
test("a failed challenge causes an actual demotion or expulsion and preserves the leader", () => {
  const initial = bossCandidate(),
    g = activeOrganisation(initial)!,
    previous = g.organised!.leaderId;
  let failed: World | undefined;
  for (let seed = 1; seed < 500; seed++) {
    const w = decodeWorld(encodeWorld(initial));
    for (const m of activeOrganisation(w)!.organised!.members)
      if (m.personId !== previous) m.loyalty = 0;
    w.random.outcomes = seed;
    const next = resolveCommand(w, {
      type: "organised-challenge",
      gangId: g.id,
      action: "challenge",
    });
    if (next.gangs[0].organised!.rank < 3) {
      failed = ack(next);
      break;
    }
  }
  expect(failed!.gangs[0].organised!.leaderId).toBe(previous);
  expect(failed!.gangs[0].organised!.history.at(-1)!.kind).toBe(
    "failed-takeover",
  );
});
test("expelling a senior member makes a persistent rival with the same identity", () => {
  let w = underboss(),
    g = activeOrganisation(w)!,
    member = g.organised!.members.find((m) => m.role === "member")!;
  later(w);
  w = ack(
    resolveCommand(w, {
      type: "organised-member",
      gangId: g.id,
      personId: member.personId,
      action: "expel",
    }),
  );
  expect(
    activeOrganisation(w)!.organised!.members.find(
      (m) => m.personId === member.personId,
    )!.role,
  ).toBe("former");
  expect(
    activeOrganisation(w)!.organised!.rivals.some(
      (r) => r.personId === member.personId,
    ),
  ).toBe(true);
  expect(decodeWorld(encodeWorld(w))).toEqual(w);
});
test("refusing a rival and negotiating a truce change real influence with a yearly decision cap", () => {
  let w = joined(),
    g = activeOrganisation(w)!,
    rivalId = g.organised!.rivals[0].personId;
  w = ack(
    resolveCommand(w, {
      type: "organised-rival",
      gangId: g.id,
      personId: rivalId,
      action: "refuse",
    }),
  );
  expect(activeOrganisation(w)!.organised!.rivals[0].influence).toBe(55);
  expect(() =>
    resolveCommand(w, {
      type: "organised-rival",
      gangId: g.id,
      personId: rivalId,
      action: "negotiate",
    }),
  ).toThrow(/major organisation decision/);
  later(w);
  w = ack(
    resolveCommand(w, {
      type: "organised-rival",
      gangId: g.id,
      personId: rivalId,
      action: "negotiate",
    }),
  );
  expect(activeOrganisation(w)!.organised!.rivals[0].influence).toBeLessThan(
    55,
  );
});
test("custody suspends assignments without income or replacing outside membership", () => {
  let w = joined();
  w.people[w.activePersonId].legal.crimeSkill = 100;
  let arrested: World | undefined;
  for (let seed = 1; seed < 500; seed++) {
    const initial = decodeWorld(encodeWorld(w));
    initial.random.outcomes = seed;
    const next = resolveCommand(initial, {
      type: "organised-mission",
      gangId: activeOrganisation(w)!.id,
      mission: "missing-envelope",
      approach: "bold",
    });
    if (isConfined(next)) {
      arrested = next;
      break;
    }
  }
  expect(arrested).toBeDefined();
  const g = activeOrganisation(arrested!)!;
  expect(g.organised!.suspended).toBe(true);
  expect(() =>
    resolveCommand(arrested!, { type: "organised-promotion", gangId: g.id }),
  ).toThrow(/custody/);
  const cash = accountFor(arrested!).cash;
  arrested!.date.month++;
  organisedCrimeMonth(arrested!);
  expect(accountFor(arrested!).cash).toBe(cash);
  expect(activeOrganisation(arrested!)!.id).toBe(g.id);
  validateWorld(arrested!);
});
test("death closes the actual owner affiliation without creating a successor career", () => {
  const w = joined(),
    id = w.activePersonId;
  recordDeath(w, id, "test");
  expect(w.gangs[0].left).toEqual(w.date);
  expect(w.people[id].legal.gangId).toBeNull();
  expect(w.gangs[0].organised!.members).toHaveLength(3);
  expect(w.gangs[0].organised!.jobs).toHaveLength(0);
  validateWorld(w);
});
test("deceased leaders are replaced by an existing member, without creating a person", () => {
  const w = joined(),
    g = activeOrganisation(w)!,
    leaderId = g.organised!.leaderId,
    size = Object.keys(w.people).length;
  recordDeath(w, leaderId, "test");
  expect(g.organised!.leaderId).not.toBe(leaderId);
  expect(g.contactIds).toContain(g.organised!.leaderId);
  expect(Object.keys(w.people)).toHaveLength(size);
  validateWorld(w);
});
test("historical origin survives a Time Machine world identity change", () => {
  const w = mission(joined()),
    origin = activeOrganisation(w)!.organised!.worldId;
  w.id = "life_time_machine_branch";
  validateWorld(w);
  expect(activeOrganisation(w)!.organised!.worldId).toBe(origin);
});
test("all mission categories are distinct and applicable to at least one style", () => {
  expect(organisedMissions).toHaveLength(10);
  expect(new Set(organisedMissions.map((m) => m.id)).size).toBe(10);
  expect(
    organisedMissions.every(
      (m) => m.styles.length > 0 && m.premise.length > 30,
    ),
  ).toBe(true);
});
function storyWorld(id: string) {
  let w = mission(joined());
  const g = activeOrganisation(w)!;
  g.organised!.rank = 3;
  g.rank = 3;
  g.organised!.seenStories = organisedCrimeStories
    .filter((s) => s.id !== id)
    .map((s) => s.id);
  return resolveCommand(w, { type: "organised-decision", gangId: g.id });
}
for (const story of organisedCrimeStories)
  for (const choice of story.choices)
    test(
      story.id +
        " / " +
        choice.action +
        " resolves bound identity, effects and cold save",
      () => {
        const w = storyWorld(story.id),
          saved = decodeWorld(encodeWorld(w));
        expect(
          saved.pending?.kind === "decision" && saved.pending.templateId,
        ).toBe("organised:" + story.id);
        const event = saved.pending!;
        const next = resolveCommand(saved, {
          type: "choose",
          eventId: event.id,
          choiceId: choice.action,
        });
        expect(next.gangs[0].organised!.activeStory).toBeNull();
        expect(decodeWorld(encodeWorld(next))).toEqual(next);
      },
    );
test("saved scene freezes effect rules instead of consulting later catalogue edits", () => {
  const w = storyWorld("confidential-bio"),
    g = activeOrganisation(w)!,
    loyalty = g.organised!.loyalty;
  g.organised!.activeStory!.choices.find(
    (c) => c.action === "negotiate",
  )!.loyalty = 17;
  const next = resolveCommand(decodeWorld(encodeWorld(w)), {
    type: "choose",
    eventId: w.pending!.id,
    choiceId: "negotiate",
  });
  expect(activeOrganisation(next)!.organised!.loyalty).toBe(
    Math.min(100, loyalty + 17),
  );
});
test("a death cancels the bound story factually rather than substituting another contact", () => {
  const w = storyWorld("confidential-bio"),
    s = activeOrganisation(w)!.organised!,
    target = s.activeStory!.personId;
  recordDeath(w, target, "test");
  refreshOrganisedCrime(w);
  expect(s.activeStory).toBeNull();
  expect(w.pending?.kind).toBe("result");
  expect(w.pending?.kind === "result" && w.pending.body).toContain("has died");
  validateWorld(w);
});
test("dead or absent members cannot be recruited, used for jobs or substituted into a scene", () => {
  const w = joined(),
    g = activeOrganisation(w)!,
    member = g.organised!.members[1];
  worldMove();
  function worldMove() {
    w.people[member.personId].city = "A different city";
  }
  expect(() =>
    resolveCommand(w, {
      type: "organised-member",
      gangId: g.id,
      personId: member.personId,
      action: "talk",
    }),
  ).toThrow(/available member/);
  expect(relationFor(w, w.activePersonId, member.personId)).toBeDefined();
});
test("legacy organised-job cannot bypass the new yearly assignment cap", () => {
  const w = mission(mission(joined()));
  expect(() =>
    resolveCommand(w, { type: "crime", offence: "organized-job" }),
  ).toThrow(/Two criminal assignments/);
});
test("legacy join-gang cannot create a second active outside membership", () => {
  const w = joined();
  expect(() =>
    resolveCommand(w, { type: "join-gang", kind: "street" }),
  ).toThrow(/Leave|already|current/i);
  expect(w.gangs).toHaveLength(1);
});
test("legacy leave-gang closes new organised membership and retains its saved history", () => {
  const w = joined(),
    left = ack(resolveCommand(w, { type: "leave-gang" }));
  expect(activeOrganisation(left)).toBeUndefined();
  expect(left.gangs[0].organised!.history.at(-1)!.kind).toBe("left");
  expect(left.gangs[0].organised!.members).toEqual(
    w.gangs[0].organised!.members,
  );
});
test("joining and leaving another style cannot duplicate a completed assignment reward", () => {
  let w = mission(joined()),
    original = w.gangs[0],
    received = original.organised!.jobs[0].proceeds;
  w = ack(resolveCommand(w, { type: "organised-leave", gangId: original.id }));
  w = ack(
    resolveCommand(w, { type: "organised-join", style: "fraud-network" }),
  );
  w = ack(
    resolveCommand(w, {
      type: "organised-leave",
      gangId: activeOrganisation(w)!.id,
    }),
  );
  w = ack(
    resolveCommand(w, { type: "organised-join", style: "street-syndicate" }),
  );
  expect(activeOrganisation(w)!.organised!.jobs).toEqual(
    original.organised!.jobs,
  );
  expect(
    w.ledger
      .filter((t) => t.category === "crime-proceeds")
      .reduce((n, t) => n + t.cashDelta, 0n),
  ).toBe(received);
});
test("switching organisation styles cannot evade the two-job yearly cap", () => {
  let w = mission(mission(joined()));
  w = ack(
    resolveCommand(w, {
      type: "organised-leave",
      gangId: activeOrganisation(w)!.id,
    }),
  );
  w = ack(
    resolveCommand(w, { type: "organised-join", style: "fraud-network" }),
  );
  expect(() =>
    resolveCommand(w, {
      type: "organised-mission",
      gangId: activeOrganisation(w)!.id,
      mission: "missing-envelope",
      approach: "cautious",
    }),
  ).toThrow(/Two criminal assignments/);
});

test('corrupt saved organisation action bindings or prose cannot silently change an offered choice', () => {
  const world = storyWorld('confidential-bio');
  const prose = JSON.parse(encodeWorld(world));
  prose.pending.choices[0].resultBody = 'A different outcome';
  expect(() => decodeWorld(JSON.stringify(prose))).toThrow(/saved organisation decision/);
  const action = JSON.parse(encodeWorld(world));
  action.pending.choices[0].effects[0].action = 'betray';
  expect(() => decodeWorld(JSON.stringify(action))).toThrow(/saved organisation decision/);
});

test.each([true, false])('recruitment respects an actual trusted adult contact’s acceptance=%s', accepted => {
  const { createContact } = require('../../src/game/systems/npcs') as typeof import('../../src/game/systems/npcs');
  const { connectPerson } = require('../../src/game/systems/relationships') as typeof import('../../src/game/systems/relationships');
  const world = underboss(); later(world);
  const target = createContact(world, { age: 30 }); target.traits = accepted ? ['impulsive'] : ['kind'];
  connectPerson(world, target.id); relationFor(world, world.activePersonId, target.id)!.trust = 65;
  const gangId = activeOrganisation(world)!.id;
  const next = ack(resolveCommand(world, { type: 'organised-recruit', gangId, personId: target.id }));
  expect(activeOrganisation(next)!.organised!.members.some(member => member.personId === target.id)).toBe(accepted);
  expect(next.people[target.id].firstName).toBe(target.firstName);
  expect(activeOrganisation(next)!.organised!.history.at(-1)!.kind).toBe(accepted ? 'recruited' : 'refused-recruitment');
  expect(decodeWorld(encodeWorld(next))).toEqual(next);
});

test('crew-led work cannot use absent associates as substitutes', () => {
  const world = joined(), gang = activeOrganisation(world)!;
  for (const member of gang.organised!.members) if (member.personId !== gang.organised!.leaderId) world.people[member.personId].city = 'Away';
  expect(() => resolveCommand(world, { type: 'organised-mission', gangId: gang.id, mission: 'missing-envelope', approach: 'crew-led' })).toThrow(/trusted, available crew member/);
});

test('a boss arrested on an actual assignment loses power to a saved crew member', () => {
  const candidate = bossCandidate(), gangId = activeOrganisation(candidate)!.id;
  let boss: World | undefined;
  for (let seed = 1; seed < 300; seed++) {
    const input = decodeWorld(encodeWorld(candidate)); input.random.outcomes = seed;
    const next = resolveCommand(input, { type: 'organised-challenge', gangId, action: 'challenge' });
    if (activeOrganisation(next)?.organised!.rank === 4) { boss = ack(next); break; }
  }
  if (!boss) throw new Error('No boss seed'); later(boss);
  const names = activeOrganisation(boss)!.contactIds;
  let arrested: World | undefined;
  for (let seed = 1; seed < 500; seed++) {
    const input = decodeWorld(encodeWorld(boss)); input.random.outcomes = seed;
    const next = resolveCommand(input, { type: 'organised-mission', gangId, mission: 'missing-envelope', approach: 'bold' });
    if (isConfined(next)) { arrested = next; break; }
  }
  expect(arrested).toBeDefined();
  const state = activeOrganisation(arrested!)!.organised!;
  expect(state.rank).toBe(3); expect(names).toContain(state.leaderId); expect(state.leaderId).not.toBe(arrested!.activePersonId);
  expect(state.history.some(entry => entry.kind === 'lost-leadership')).toBe(true);
  expect(decodeWorld(encodeWorld(arrested!))).toEqual(arrested);
});

test('two assignment records cannot reuse one incident even under distinct job identities', () => {
  const world = mission(joined()), state = activeOrganisation(world)!.organised!;
  state.jobs.push({ ...state.jobs[0], id: 'organised_job_duplicate' }); state.completedJobs++;
  expect(() => decodeWorld(encodeWorld(world))).toThrow(/assignment proceeds/);
});

test('separate incidents cannot both claim the same proceeds transaction', () => {
  const world = mission(mission(joined())), state = activeOrganisation(world)!.organised!;
  expect(state.jobs[0].incidentId).not.toBe(state.jobs[1].incidentId);
  state.jobs[1].transactionId = state.jobs[0].transactionId;
  expect(() => decodeWorld(encodeWorld(world))).toThrow(/assignment proceeds/);
});

test('a second organisation cannot claim an assignment already credited to a former crew', () => {
  let world = mission(joined());
  const oldJob = activeOrganisation(world)!.organised!.jobs[0];
  world = ack(resolveCommand(world, { type: 'organised-leave', gangId: activeOrganisation(world)!.id }));
  world = ack(resolveCommand(world, { type: 'organised-join', style: 'fraud-network' }));
  const state = activeOrganisation(world)!.organised!;
  state.jobs.push({ ...oldJob, id: 'organised_job_cross_crew_duplicate' }); state.completedJobs++;
  expect(() => decodeWorld(encodeWorld(world))).toThrow(/assignment proceeds/);
});

test('a payout must belong to the actual assignment calendar month', () => {
  const world = mission(joined()), job = activeOrganisation(world)!.organised!.jobs[0];
  world.ledger.find(transaction => transaction.id === job.transactionId)!.year--;
  expect(() => decodeWorld(encodeWorld(world))).toThrow(/assignment proceeds/);
});
