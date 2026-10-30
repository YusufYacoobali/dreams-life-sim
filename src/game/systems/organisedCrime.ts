import type { World } from "../model";
import { indexLedger, type LedgerIndex } from "../ledgerIndex";
import { ageOn, fullName } from "../personHelpers";
import { IneligibleAction } from "../errors";
import { rules } from "../rules";
import { countries } from "../countries";
import { formatMoney } from "../money";
import type { RuntimeEffectRow } from "../runtime";
import { offerPending } from "../pendingQueue";
import { organisedMissions, organisations } from "../content/organisedCrime";
import { organisedCrimeStories } from "../content/organisedCrimeStories";
import {
  organisedRanks,
  type OrganisedCrimeCommand,
  type OrganisedCrimeChoice,
  type OrganisedCrimeState,
  type organisationStyles,
} from "./organisedCrimeSchemas";
import { active, bounded, draw, fact, post, result } from "./common";
import { isConfined } from "./legalSchemas";
import { recordOrganisedCrime } from "./legal";
import { connectPerson, relationFor } from "./relationships";
import { createContact } from "./npcs";
import { addCondition } from "./health";
import { activeTrip } from "./travelSchemas";
import { serviceAway } from "./serviceSchemas";
export { organisedRanks } from "./organisedCrimeSchemas";
type Gang = World["gangs"][number];
type Style = (typeof organisationStyles)[number];
const monthOf = (world: World) => world.date.year * 12 + world.date.month - 1;
const row = (
  id: string,
  label: string,
  value: string,
  tone: RuntimeEffectRow["tone"] = "neutral",
): RuntimeEffectRow => ({ id, label, value, tone });
export function activeOrganisation(
  world: World,
  personId = world.activePersonId,
) {
  return world.gangs.find(
    (g) => g.personId === personId && g.kind === "street" && !g.left,
  );
}
export function organisationRank(gang: Gang) {
  return organisedRanks[gang.organised?.rank ?? [0, 1, 2, 3][gang.rank]];
}
const stateOf = (gang: Gang): OrganisedCrimeState => {
  if (!gang.organised)
    throw new IneligibleAction(
      "Review this existing affiliation before taking new organisation actions",
    );
  return gang.organised;
};
function addHistory(
  world: World,
  gang: Gang,
  kind: string,
  text: string,
  personId: string | null = null,
) {
  const state = stateOf(gang);
  state.history.push({ date: { ...world.date }, kind, personId, text });
  if (state.history.length > 64) state.history.shift();
}
function memory(list: string[], value: string, max = 16) {
  list.push(value);
  if (list.length > max) list.shift();
}
function syncRank(gang: Gang) {
  gang.rank = Math.min(3, stateOf(gang).rank);
}
function countKey(world: World, gang: Gang, kind: string) {
  return gang.personId + ":organised:" + world.date.year + ":" + kind;
}
function use(world: World, gang: Gang, kind: string, maximum: number) {
  const key = countKey(world, gang, kind),
    used = world.actionCounts[key] ?? 0;
  if (used >= maximum)
    throw new IneligibleAction(
      kind === "job"
        ? "Two criminal assignments are available each year"
        : kind === "decision"
          ? "You have already made a major organisation decision this year"
          : "Give this contact some time before another approach",
    );
  world.actionCounts[key] = used + 1;
}
function selected(world: World, id: string) {
  const gang = activeOrganisation(world);
  if (!gang || gang.id !== id)
    throw new IneligibleAction("This is not your active outside organisation");
  stateOf(gang);
  return gang;
}
export function organisationReason(
  world: World,
  gang?: Gang,
): string | undefined {
  const person = active(world);
  if (person.died) return "This life has ended";
  if (ageOn(person, world.date) < Math.max(18, rules[person.country].adultAge))
    return "Available to adults";
  if (isConfined(world))
    return "Outside assignments pause while you are in custody";
  if (person.legal.wanted) return "Resolve your outstanding arrest first";
  if (person.health.hospitalizedUntil !== null || person.stats.health < 20)
    return "Recover your health first";
  if (activeTrip(world) || serviceAway(world, person.id))
    return "Return from your trip or assignment first";
  if (
    gang?.organised &&
    (gang.organised.country !== person.country ||
      gang.organised.city !== person.city)
  )
    return "Return to your organisation’s home city or leave the organisation";
}
function assertOutside(world: World, gang?: Gang) {
  const reason = organisationReason(world, gang);
  if (reason) throw new IneligibleAction(reason);
}
function close(
  world: World,
  gang: Gang,
  kind: "left" | "expelled" | "death",
  text: string,
) {
  gang.left = { ...world.date };
  const person = world.people[gang.personId];
  if (person.legal.gangId === gang.id)
    person.legal.gangId =
      world.gangs.find(
        (g) => g.personId === person.id && g.kind === "prison" && !g.left,
      )?.id ?? null;
  const state = stateOf(gang);
  state.activeStory = null;
  addHistory(world, gang, kind, text);
  person.stats.stress = bounded(
    person.stats.stress + (kind === "expelled" ? 12 : 4),
  );
  fact(world, text, "crime", "", person.id);
}
function newState(world: World, gang: Gang, style: Style): OrganisedCrimeState {
  const contacts = gang.contactIds
    .filter(
      (id) =>
        world.people[id] &&
        !world.people[id].died &&
        ageOn(world.people[id], world.date) >= 18,
    )
    .slice(0, 3);
  while (contacts.length < 3) {
    const person = createContact(world, {
      age: draw(world, "npcs", 25, 52),
      country: active(world).country,
      city: active(world).city,
    });
    contacts.push(person.id);
  }
  for (const id of contacts) connectPerson(world, id);
  const rival = createContact(world, {
    age: draw(world, "npcs", 28, 55),
    country: active(world).country,
    city: active(world).city,
  });
  connectPerson(world, rival.id);
  gang.contactIds = [...new Set([...gang.contactIds, ...contacts, rival.id])];
  return {
    rulesVersion: 1,
    worldId: world.id,
    style,
    country: active(world).country,
    city: active(world).city,
    rank: gang.rank,
    loyalty: gang.standing,
    reputation: Math.min(50, gang.standing),
    completedJobs: 0,
    decisions: 0,
    leaderId: contacts[0],
    suspended: false,
    lastProcessedMonth: monthOf(world),
    members: contacts.map((personId, index) => ({
      personId,
      loyalty: index ? 50 : 60,
      ambition: draw(world, "npcs", 20, 85),
      role: index === 0 ? "leader" : index === 1 ? "lieutenant" : "member",
      memories: [],
    })),
    rivals: [
      {
        personId: rival.id,
        influence: 45,
        reputation: 45,
        resolved: false,
        memories: [],
      },
    ],
    jobs: [],
    archivedJobs: 0,
    archivedCompleted: 0,
    archivedProceeds: 0n,
    history: [],
    seenStories: [],
    lastStoryYear: world.date.year - 1,
    activeStory: null,
  };
}
export function promotionReason(world: World, gang: Gang): string | undefined {
  const outside = organisationReason(world, gang);
  if (outside) return outside;
  const s = gang.organised;
  if (!s) return "Review your existing affiliation first";
  if (s.rank >= 3)
    return s.rank === 3
      ? "An underboss must challenge leadership to become boss"
      : "You already lead this organisation";
  const next = s.rank + 1;
  if (s.completedJobs < next * 2)
    return "Complete " + next * 2 + " assignments first";
  if (
    s.loyalty < 40 + next * 7 ||
    s.reputation < 25 + next * 10 ||
    active(world).legal.crimeSkill < next * 10
  )
    return "Build more loyalty, reputation and criminal experience";
}
export function missionReason(
  world: World,
  gang: Gang,
  missionId: string,
  approach: "cautious" | "bold" | "crew-led",
): string | undefined {
  const outside = organisationReason(world, gang);
  if (outside) return outside;
  const s = gang.organised,
    mission = organisedMissions.find((item) => item.id === missionId);
  if (
    !s ||
    !mission ||
    !(mission.styles as readonly string[]).includes(s.style) ||
    mission.rank > s.rank
  )
    return "This assignment is not available to your organisation and rank";
  if ((world.actionCounts[countKey(world, gang, "job")] ?? 0) >= 2)
    return "Two criminal assignments are available each year";
  if (active(world).stats.energy < 12) return "Recover your energy first";
  if (
    approach === "crew-led" &&
    !s.members.some(
      (m) =>
        m.role !== "former" &&
        m.loyalty >= 45 &&
        m.personId !== s.leaderId &&
        !world.people[m.personId].died &&
        !isConfined(world, m.personId) &&
        !activeTrip(world, m.personId) &&
        !serviceAway(world, m.personId) &&
        world.people[m.personId].country === s.country &&
        world.people[m.personId].city === s.city,
    )
  )
    return "You need a trusted, available crew member";
}
function offerStory(world: World, gang: Gang) {
  const s = stateOf(gang);
  if (s.activeStory)
    throw new IneligibleAction(
      "Resolve your current organisation decision first",
    );
  const here = (id: string) => {
    const p = world.people[id];
    return (
      !!p &&
      !p.died &&
      !isConfined(world, p) &&
      !activeTrip(world, id) &&
      !serviceAway(world, id) &&
      p.country === s.country &&
      p.city === s.city
    );
  };
  const eligible = organisedCrimeStories.filter(
    (story) =>
      (story.id !== "crew-memory" || s.completedJobs > 0) &&
      !s.seenStories.includes(story.id) &&
      story.minRank <= s.rank &&
      (story.target === "rival"
        ? s.rivals.some((r) => !r.resolved && here(r.personId))
        : story.target === "leader"
          ? s.leaderId !== gang.personId && here(s.leaderId)
          : s.members.some(
              (m) =>
                m.role !== "former" &&
                m.personId !== s.leaderId &&
                here(m.personId),
            )),
  );
  if (!eligible.length)
    throw new IneligibleAction(
      "The crew has no new major decision to bring you",
    );
  use(world, gang, "decision", 1);
  const story = eligible[draw(world, "events", 0, eligible.length - 1)];
  const personId =
    story.target === "rival"
      ? s.rivals.find((r) => !r.resolved && here(r.personId))!.personId
      : story.target === "leader"
        ? s.leaderId
        : s.members.find(
            (m) =>
              m.role !== "former" &&
              m.personId !== s.leaderId &&
              here(m.personId),
          )!.personId;
  const name = fullName(world.people[personId]),
    offerId =
      "organised_story_" + gang.id + "_" + story.id + "_" + world.revision;
  const choices = [
    ...story.choices,
    ...(!story.choices.some((c) => c.action === "leave")
      ? [
          {
            action: "leave" as const,
            label: "Leave the organisation",
            outcome:
              "You leave the organisation. The people you knew keep their memories of you.",
            journal: "I left the organisation after a dispute.",
            loyalty: 0,
            reputation: 0,
            member: 0,
          },
        ]
      : []),
  ];
  s.activeStory = {
    rulesVersion: 1,
    choices: choices.map(
      ({
        action,
        journal,
        outcome,
        loyalty,
        reputation,
        member,
        evidence,
        rival,
        expel,
      }) => ({
        action,
        journal: journal.replaceAll("{name}", name),
        title: story.title,
        body: outcome,
        loyalty,
        reputation,
        member,
        evidence,
        rival,
        expel,
      }),
    ),
    id: story.id,
    offerId,
    personId,
    roll: draw(world, "outcomes", 1, 100),
    year: world.date.year,
  };
  s.seenStories.push(story.id);
  s.lastStoryYear = world.date.year;
  offerPending(world, {
    kind: "decision",
    id: offerId,
    templateId: "organised:" + story.id,
    title: story.title,
    body: story.body.replaceAll("{name}", name),
    illustration: "handcuffs",
    personIds: [gang.personId, personId],
    participants: [{ personId, name, role: story.target }],
    choices: choices.map((choice) => ({
      id: choice.action,
      label: choice.label,
      effects: [
        {
          kind: "organised-choice",
          gangId: gang.id,
          offerId,
          storyId: story.id,
          action: choice.action,
        },
      ],
      resultTitle: story.title,
      resultBody: choice.outcome,
      journal: choice.journal.replaceAll("{name}", name),
    })),
  });
}
export function organisedCrimeChoiceReason(
  world: World,
  effect: OrganisedCrimeChoice,
): string | undefined {
  const gang = world.gangs.find(
      (g) => g.id === effect.gangId && g.personId === world.activePersonId,
    ),
    story = gang?.organised?.activeStory;
  if (
    !gang ||
    gang.left ||
    !story ||
    story.offerId !== effect.offerId ||
    story.id !== effect.storyId
  )
    return "This organisation decision has already ended";
  if (effect.action === "leave") return;
  if (!world.people[story.personId] || world.people[story.personId].died)
    return "This person is no longer alive; leave the decision behind";
  const target = world.people[story.personId];
  if (
    isConfined(world, target) ||
    activeTrip(world, target.id) ||
    serviceAway(world, target.id) ||
    target.country !== gang.organised!.country ||
    target.city !== gang.organised!.city
  )
    return "This person is unavailable; you can leave the organisation";
  return organisationReason(world, gang);
}
export function resolveOrganisedCrimeChoice(
  world: World,
  effect: OrganisedCrimeChoice,
): RuntimeEffectRow[] {
  const reason = organisedCrimeChoiceReason(world, effect);
  if (reason) throw new IneligibleAction(reason);
  const gang = selected(world, effect.gangId),
    s = stateOf(gang),
    saved = s.activeStory!,
    choice = saved.choices.find((item) => item.action === effect.action);
  if (!choice) throw new IneligibleAction("This response was not offered");
  s.activeStory = null;
  s.decisions++;
  if (choice.action === "leave") {
    close(world, gang, "left", "I left " + gang.name + " after a dispute.");
    return [row("membership", "Organisation", "Left")];
  }
  const member = s.members.find((m) => m.personId === saved.personId),
    rival = s.rivals.find((r) => r.personId === saved.personId),
    relation = relationFor(world, gang.personId, saved.personId);
  s.loyalty = bounded(s.loyalty + choice.loyalty);
  s.reputation = bounded(s.reputation + choice.reputation);
  gang.standing = s.reputation;
  if (member) {
    member.loyalty = bounded(member.loyalty + choice.member);
    memory(
      member.memories,
      saved.id + ":" + choice.action + ":" + world.date.year,
    );
    if (choice.expel && saved.personId !== s.leaderId) member.role = "former";
  }
  if (relation) {
    relation.trust = bounded(relation.trust + choice.member);
    relation.strength = bounded(
      relation.strength + Math.trunc(choice.member / 2),
    );
    memory(
      relation.memories,
      "organised:" + saved.id + ":" + choice.action,
      32,
    );
  }
  if (rival) {
    rival.influence = bounded(rival.influence + (choice.rival ?? 0));
    if (choice.action === "expose")
      rival.reputation = bounded(rival.reputation - 12);
    rival.resolved = rival.influence === 0;
    memory(rival.memories, saved.id + ":" + choice.action, 12);
  }
  addHistory(
    world,
    gang,
    "decision:" + saved.id,
    choice.journal.replaceAll("{name}", fullName(world.people[saved.personId])),
    saved.personId,
  );
  if (choice.evidence)
    recordOrganisedCrime(world, gang.personId, 0n, {
      riskDeltaBps: 500,
      evidenceDelta: 15,
    });
  const rows = [
    row(
      "loyalty",
      "Loyalty",
      s.loyalty + "%",
      choice.loyalty >= 0 ? "positive" : "negative",
    ),
    row("reputation", "Reputation", s.reputation + "%"),
  ];
  if (s.loyalty < 15 && s.rank < 4) {
    close(
      world,
      gang,
      "expelled",
      "I was expelled from " + gang.name + " after losing the crew’s trust.",
    );
    rows.push(row("membership", "Organisation", "Expelled", "negative"));
  }
  return rows;
}
/** Frozen offer prose plus factual consequences produced during this resolution. */
export function resolveOrganisedCrimeOutcome(
  world: World,
  effect: OrganisedCrimeChoice,
) {
  const gang = world.gangs.find((g) => g.id === effect.gangId),
    saved = gang?.organised?.activeStory,
    choice = saved?.choices.find((c) => c.action === effect.action);
  if (!choice) throw new IneligibleAction("This response was not offered");
  const incidentsBefore = world.incidents.length,
    wasMember = !gang!.left,
    effects = resolveOrganisedCrimeChoice(world, effect);
  let body = choice.body;
  if (wasMember && gang!.left && effect.action !== "leave")
    body += " The crew expels you after losing trust in you.";
  const incident =
    world.incidents.length > incidentsBefore ? world.incidents.at(-1) : null;
  if (incident?.personId === world.activePersonId)
    body +=
      incident.stage === "charged"
        ? " The police charge you; the case and hearing are recorded."
        : " The incident leaves evidence for a possible investigation.";
  return { title: choice.title, body, journal: choice.journal, effects };
}
export function handleOrganisedCrime(
  world: World,
  command: OrganisedCrimeCommand,
) {
  const person = active(world);
  if (command.type === "organised-refuse") {
    assertOutside(world);
    const key =
      person.id + ":organised-refuse:" + command.style + ":" + world.date.year;
    if (world.actionCounts[key])
      throw new IneligibleAction(
        "You already declined this invitation this year",
      );
    world.actionCounts[key] = 1;
    fact(
      world,
      "I declined an invitation to a " +
        organisations[command.style].title.toLowerCase() +
        ".",
      "crime",
    );
    result(
      world,
      "Invitation declined",
      "You decline the invitation. Nobody joins an organisation on your behalf.",
      "handcuffs",
    );
    return;
  }
  if (command.type === "organised-join") {
    assertOutside(world);
    if (activeOrganisation(world))
      throw new IneligibleAction(
        "Leave your current outside organisation first",
      );
    const old = world.gangs.find(
      (g) =>
        g.personId === person.id &&
        g.kind === "street" &&
        g.left &&
        g.organised?.style === command.style,
    );
    if (old) {
      const s = stateOf(old);
      if (
        s.country !== person.country ||
        s.city !== person.city ||
        s.loyalty < 30 ||
        s.history.some((h) => h.kind === "expelled")
      )
        throw new IneligibleAction(
          "This former organisation will not accept your return",
        );
      if (
        s.members.every(
          (m) => m.role === "former" || world.people[m.personId].died,
        )
      )
        throw new IneligibleAction(
          "This former crew has nobody left to accept your return",
        );
      use(world, old, "decision", 1);
      old.left = null;
      s.decisions++;
      s.suspended = false;
      if (!person.legal.gangId) person.legal.gangId = old.id;
      addHistory(world, old, "rejoined", "I rejoined " + old.name + ".");
      fact(
        world,
        "I rejoined " + old.name + " with my earlier history intact.",
        "crime",
      );
      result(
        world,
        "Old faces",
        "The crew remembers your departure. Your rank, previous jobs and relationships have not been replaced.",
        "handcuffs",
      );
      return;
    }
    if (
      world.gangs.length >= 128 ||
      world.gangs.filter((g) => g.personId === person.id && g.kind === "street")
        .length >= 8
    )
      throw new IneligibleAction("Your organisation history is full");
    const gang: Gang = {
      id: "gang_" + person.id + "_" + world.revision + "_" + world.gangs.length,
      personId: person.id,
      name: organisations[command.style].name,
      kind: "street",
      sentenceId: null,
      joined: { ...world.date },
      left: null,
      rank: 0,
      standing: 40,
      contactIds: [],
      lastIncomeMonth: monthOf(world),
    };
    gang.organised = newState(world, gang, command.style);
    world.gangs.push(gang);
    if (!person.legal.gangId) person.legal.gangId = gang.id;
    addHistory(world, gang, "joined", "I joined " + gang.name + ".");
    fact(world, "I joined " + gang.name + " as a recruit.", "crime");
    result(
      world,
      "A place at the table",
      "The leader learns your name. You have contacts and obligations, with no automatic salary.",
      "handcuffs",
      [row("rank", "Rank", "Recruit")],
    );
    return;
  }
  if (command.type === "organised-upgrade") {
    const gang = activeOrganisation(world);
    if (!gang || gang.id !== command.gangId || gang.organised)
      throw new IneligibleAction(
        "Choose an existing affiliation that has not been reviewed",
      );
    assertOutside(world, gang);
    gang.organised = newState(world, gang, command.style);
    addHistory(
      world,
      gang,
      "reviewed",
      "I reviewed my existing affiliation with " + gang.name + ".",
    );
    result(
      world,
      "Existing history retained",
      "Your old rank and contacts remain. New assignments now use the reviewed organisation rules.",
      "handcuffs",
    );
    return;
  }
  const gang = selected(world, command.gangId),
    s = stateOf(gang);
  if (command.type === "organised-leave") {
    close(world, gang, "left", "I left " + gang.name + ".");
    result(
      world,
      "The door behind you",
      "You leave the organisation. People, criminal incidents, proceeds and shared memories remain.",
      "release",
    );
    return;
  }
  assertOutside(world, gang);
  if (command.type === "organised-mission") {
    const reason = missionReason(
      world,
      gang,
      command.mission,
      command.approach,
    );
    if (reason) throw new IneligibleAction(reason);
    use(world, gang, "job", 2);
    const mission = organisedMissions.find((m) => m.id === command.mission)!,
      crew = s.members.filter(
        (m) =>
          m.role !== "former" &&
          m.personId !== s.leaderId &&
          !world.people[m.personId].died &&
          !isConfined(world, m.personId) &&
          !activeTrip(world, m.personId) &&
          !serviceAway(world, m.personId) &&
          world.people[m.personId].country === s.country &&
          world.people[m.personId].city === s.city,
      ),
      loyalty = crew.length
        ? crew.reduce((sum, m) => sum + m.loyalty, 0) / crew.length
        : 0;
    const successChance = Math.max(
      20,
      Math.min(
        90,
        50 +
          Math.floor(person.legal.crimeSkill / 5) +
          (command.approach === "cautious"
            ? 15
            : command.approach === "bold"
              ? -7
              : Math.floor(loyalty / 8)),
      ),
    );
    const success = draw(world, "outcomes", 1, 100) <= successChance,
      rewardBps =
        mission.reward *
        (command.approach === "bold"
          ? 145
          : command.approach === "crew-led"
            ? 85
            : 70),
      gain = success
        ? (rules[person.country].baseWage * BigInt(rewardBps)) / 1000000n
        : 0n;
    const transactionId = gain
      ? "txn_" + world.revision + "_" + world.ledger.length
      : null;
    if (gain)
      post(
        world,
        gain,
        0n,
        "crime-proceeds",
        gang.name + ": " + mission.title + " (" + command.approach + ")",
      );
    const source = recordOrganisedCrime(world, person.id, gain, {
      riskDeltaBps:
        mission.risk +
        (command.approach === "cautious"
          ? -2000
          : command.approach === "bold"
            ? 1200
            : -700),
      evidenceDelta:
        command.approach === "bold"
          ? 12
          : command.approach === "cautious"
            ? -12
            : 0,
    });
    const injury =
      command.approach === "bold" &&
      draw(world, "outcomes", 1, 100) <= mission.injury;
    if (injury) {
      person.stats.health = bounded(person.stats.health - 8);
      addCondition(world, person, "sprain", 35);
    }
    person.stats.energy = bounded(person.stats.energy - 12);
    person.stats.stress = bounded(
      person.stats.stress + (command.approach === "cautious" ? 4 : 8),
    );
    person.legal.crimeSkill = bounded(
      person.legal.crimeSkill + (success ? 7 : 3),
    );
    s.loyalty = bounded(
      s.loyalty + (success ? (command.approach === "crew-led" ? 9 : 6) : -7),
    );
    s.reputation = bounded(
      s.reputation + (success ? (command.approach === "bold" ? 12 : 8) : -4),
    );
    gang.standing = s.reputation;
    if (success) {
      s.completedJobs++;
      if (command.approach === "crew-led")
        for (const m of crew) m.loyalty = bounded(m.loyalty + 4);
    }
    s.jobs.push({
      id: "organised_job_" + source.id,
      category: mission.id,
      approach: command.approach,
      participantIds: [
        person.id,
        ...(command.approach === "crew-led" ? crew.map((m) => m.personId) : []),
      ],
      date: { ...world.date },
      incidentId: source.id,
      transactionId,
      proceeds: gain,
      success,
    });
    if (s.jobs.length > 32) {
      const archived = s.jobs.shift()!;
      s.archivedJobs++;
      if (archived.success) s.archivedCompleted++;
      s.archivedProceeds += archived.proceeds;
    }
    gang.lastIncomeMonth = monthOf(world);
    addHistory(
      world,
      gang,
      "job",
      "I " +
        (success ? "completed " : "failed ") +
        mission.title +
        " for " +
        gang.name +
        ".",
    );
    fact(
      world,
      "I " +
        (success ? "completed " : "failed ") +
        mission.title +
        " for " +
        gang.name +
        (gain
          ? ", receiving " +
            formatMoney({
              minor: gain,
              currency: countries[person.country].currency,
            }) +
            " in recorded proceeds."
          : " without receiving proceeds."),
      "crime",
    );
    if (isConfined(world, person)) {
      s.suspended = true;
      if (s.rank === 4) loseLeadership(world, gang, "custody");
    }
    if (source.stage !== "charged")
      result(
        world,
        success ? "A paid complication" : "An unpaid complication",
        success
          ? command.approach === "bold"
            ? "The job pays. Your name carries further, and so does the evidence."
            : command.approach === "crew-led"
              ? "The crew delivers. You keep your agreed proceeds and share the credit."
              : "You finish carefully. The smaller reward comes with less immediate exposure; an investigation remains possible."
          : "The assignment fails. The crew remembers the failure, and the evidence does not disappear because you made no money.",
        "handcuffs",
        [
          row(
            "proceeds",
            "Recorded proceeds",
            formatMoney({ minor: gain, currency: source.gain.currency }),
            gain ? "positive" : "neutral",
          ),
          row("evidence", "Evidence", source.evidence + "%", "negative"),
          row("reputation", "Reputation", s.reputation + "%"),
          ...(injury
            ? [row("injury", "Injury", "Sprain recorded", "negative")]
            : []),
        ],
      );
    return;
  }
  if (command.type === "organised-promotion") {
    const reason = promotionReason(world, gang);
    if (reason) throw new IneligibleAction(reason);
    use(world, gang, "decision", 1);
    s.rank++;
    s.decisions++;
    syncRank(gang);
    addHistory(
      world,
      gang,
      "promotion",
      "I became " + organisedRanks[s.rank] + " in " + gang.name + ".",
    );
    fact(
      world,
      "I became " + organisedRanks[s.rank] + " in " + gang.name + ".",
      "crime",
    );
    result(
      world,
      "More than seniority",
      "Your completed work, reputation and loyalty earned more responsibility. The crew expects you to use it.",
      "handcuffs",
      [row("rank", "Rank", organisedRanks[s.rank], "positive")],
    );
    return;
  }
  if (command.type === "organised-decision") {
    offerStory(world, gang);
    return;
  }
  if (command.type === "organised-member") {
    const m = s.members.find(
        (m) => m.personId === command.personId && m.role !== "former",
      ),
      target = world.people[command.personId];
    if (
      !m ||
      !target ||
      target.died ||
      isConfined(world, target) ||
      activeTrip(world, target.id) ||
      serviceAway(world, target.id) ||
      target.country !== s.country ||
      target.city !== s.city
    )
      throw new IneligibleAction(
        "Choose a living, available member of this crew",
      );
    if (command.action === "expel" && (s.rank < 3 || m.personId === s.leaderId))
      throw new IneligibleAction(
        "Only senior members can expel someone other than the leader",
      );
    if (command.action === "confront" || command.action === "expel") {
      use(world, gang, "decision", 1);
      s.decisions++;
    } else use(world, gang, "contact:" + target.id, 2);
    const relation = relationFor(world, person.id, target.id)!,
      change =
        command.action === "talk"
          ? target.traits.includes("reserved")
            ? 3
            : 6
          : command.action === "trust"
            ? m.ambition > 70
              ? 3
              : 9
            : command.action === "confront"
              ? m.loyalty < 30
                ? -12
                : -4
              : -20;
    m.loyalty = bounded(m.loyalty + change);
    relation.trust = bounded(relation.trust + change);
    relation.strength = bounded(relation.strength + Math.trunc(change / 2));
    memory(m.memories, command.action + ":" + world.date.year);
    if (command.action === "expel") {
      m.role = "former";
      const prior = s.rivals.find((r) => r.personId === m.personId);
      if (prior) {
        prior.resolved = false;
        prior.influence = Math.max(30, prior.influence);
      } else if (s.rivals.length < 3)
        s.rivals.push({
          personId: m.personId,
          influence: Math.max(30, m.ambition),
          reputation: 40,
          resolved: false,
          memories: ["expelled:" + world.date.year],
        });
    }
    addHistory(
      world,
      gang,
      command.action,
      "I " +
        {
          talk: "spoke with ",
          trust: "trusted ",
          confront: "confronted ",
          expel: "expelled ",
        }[command.action] +
        fullName(target) +
        ".",
      target.id,
    );
    fact(
      world,
      "I " +
        {
          talk: "spoke privately with ",
          trust: "placed my trust in ",
          confront: "confronted ",
          expel: "expelled ",
        }[command.action] +
        fullName(target) +
        " in " +
        gang.name +
        ".",
      "crime",
    );
    result(
      world,
      command.action === "expel"
        ? "A former member"
        : "A conversation remembered",
      command.action === "expel"
        ? "Their seat is empty. Their identity, ambition and resentment remain; a former member may become a rival."
        : change > 0
          ? target.traits.includes("reserved")
            ? "They say little. They remember that you made the effort."
            : "The conversation gives you a little more trust to spend. It is not an unlimited account."
          : "They hear the criticism. Whether they deserved it or not, they remember who delivered it.",
      "handcuffs",
      [
        row(
          "member-loyalty",
          "Their loyalty",
          m.loyalty + "%",
          change >= 0 ? "positive" : "negative",
        ),
      ],
    );
    return;
  }
  if (command.type === "organised-recruit") {
    if (
      s.rank < 2 ||
      s.members.filter((m) => m.role !== "former").length >= 5 ||
      s.members.length >= 8
    )
      throw new IneligibleAction(
        "Crew leaders can recruit into a vacant seat; lifetime member history is bounded",
      );
    const target = world.people[command.personId],
      relation = target && relationFor(world, person.id, target.id);
    if (
      !target ||
      target.id === person.id ||
      target.died ||
      ageOn(target, world.date) <
        Math.max(18, rules[target.country].adultAge) ||
      isConfined(world, target) ||
      target.legal.wanted ||
      activeTrip(world, target.id) ||
      serviceAway(world, target.id) ||
      target.country !== s.country ||
      target.city !== s.city ||
      !relation ||
      relation.trust < 55 ||
      s.members.some((m) => m.personId === target.id) ||
      s.rivals.some((r) => r.personId === target.id) ||
      world.gangs.some(
        (g) =>
          !g.left &&
          (g.personId === target.id ||
            g.organised?.members.some(
              (m) => m.personId === target.id && m.role !== "former",
            )),
      )
    )
      throw new IneligibleAction(
        "Choose a trusted, local adult contact without another active criminal affiliation",
      );
    use(world, gang, "decision", 1);
    s.decisions++;
    const willing =
      target.traits.includes("impulsive") ||
      target.traits.includes("ambitious") ||
      target.legal.crimeSkill >= 10;
    if (willing) {
      s.members.push({
        personId: target.id,
        loyalty: Math.min(80, relation.trust),
        ambition: target.traits.includes("ambitious") ? 80 : 40,
        role: "member",
        memories: ["recruited:" + world.date.year],
      });
      if (!gang.contactIds.includes(target.id)) gang.contactIds.push(target.id);
    } else {
      relation.trust = bounded(relation.trust - 5);
      memory(
        relation.memories,
        "refused-criminal-recruitment:" + world.date.year,
        32,
      );
    }
    fact(
      world,
      "I invited " +
        fullName(target) +
        " into " +
        gang.name +
        ". They " +
        (willing ? "accepted." : "refused."),
      "crime",
    );
    addHistory(
      world,
      gang,
      willing ? "recruited" : "refused-recruitment",
      fullName(target) + (willing ? " joined the crew." : " declined to join."),
      target.id,
    );
    result(
      world,
      willing ? "A new responsibility" : "An ordinary ambition",
      willing
        ? "Your actual contact joins the crew. Their loyalty starts with the trust you already built."
        : "They want no part of this. Knowing you does not oblige them to become a criminal.",
      "handcuffs",
    );
    return;
  }
  if (command.type === "organised-rival") {
    const rival = s.rivals.find(
      (r) => r.personId === command.personId && !r.resolved,
    );
    if (!rival || world.people[rival.personId].died)
      throw new IneligibleAction("Choose a living, unresolved rival");
    use(world, gang, "decision", 1);
    s.decisions++;
    const success =
      draw(world, "outcomes", 1, 100) <=
      Math.min(85, 35 + Math.floor(s.reputation / 2));
    if (command.action === "negotiate") {
      rival.influence = bounded(rival.influence - (success ? 30 : 5));
      s.loyalty = bounded(s.loyalty + 4);
    } else if (command.action === "refuse") {
      rival.influence = bounded(rival.influence + 10);
      s.reputation = bounded(s.reputation + 7);
    } else {
      rival.influence = bounded(rival.influence + (success ? -35 : 25));
      s.loyalty = bounded(s.loyalty - 12);
      recordOrganisedCrime(world, person.id, 0n, {
        riskDeltaBps: 800,
        evidenceDelta: 15,
      });
      if (!success && s.rank < 4)
        close(
          world,
          gang,
          "expelled",
          "I was expelled from " + gang.name + " after a failed betrayal.",
        );
    }
    rival.resolved = rival.influence === 0;
    memory(
      rival.memories,
      command.action +
        ":" +
        (success ? "held" : "failed") +
        ":" +
        world.date.year,
      12,
    );
    addHistory(
      world,
      gang,
      "rival:" + command.action,
      "I " +
        (command.action === "negotiate"
          ? "negotiated with "
          : command.action === "refuse"
            ? "refused "
            : "betrayed ") +
        fullName(world.people[rival.personId]) +
        ".",
      rival.personId,
    );
    fact(
      world,
      "I " +
        (command.action === "negotiate"
          ? "negotiated with "
          : command.action === "refuse"
            ? "refused "
            : "betrayed ") +
        fullName(world.people[rival.personId]) +
        ".",
      "crime",
    );
    if (!world.pending || world.pending.kind === "result")
      result(
        world,
        rival.resolved
          ? "A truce that counts"
          : gang.left
            ? "Outside the circle"
            : "Names remembered",
        rival.resolved
          ? "The rival’s influence falls to zero. The truce is recorded with the person who agreed it."
          : gang.left
            ? "The betrayal fails and your crew expels you. The rival remains a lasting enemy; the investigation is real."
            : command.action === "betray"
              ? "The betrayal changes the balance of influence and leaves a real incident for investigators."
              : "The rival keeps their identity and remembers your response. The pressure has changed; the history stays.",
        "handcuffs",
        [row("rival", "Rival influence", rival.influence + "%")],
      );
    return;
  }
  if (command.type === "organised-challenge") {
    if (s.rank !== 3 && s.rank !== 4)
      throw new IneligibleAction("Only an underboss can challenge leadership");
    use(world, gang, "decision", 1);
    s.decisions++;
    if (command.action === "support") {
      if (s.rank === 4)
        throw new IneligibleAction("You already lead the organisation");
      s.loyalty = bounded(s.loyalty + 12);
      s.reputation = bounded(s.reputation + 4);
      fact(world, "I supported the leader of " + gang.name + ".", "crime");
      result(
        world,
        "The existing chair",
        "You support the current leader. The promise adds loyalty, without changing who holds power.",
        "handcuffs",
      );
      return;
    }
    if (
      s.rank === 4 ||
      s.completedJobs < 8 ||
      s.reputation < 65 ||
      s.loyalty < 60
    )
      throw new IneligibleAction(
        "Leadership needs eight completed jobs, 65 reputation and 60 loyalty",
      );
    const crew = s.members.filter(
        (m) =>
          m.role !== "former" &&
          m.personId !== s.leaderId &&
          !world.people[m.personId].died,
      ),
      backing = crew.length
        ? crew.reduce((sum, m) => sum + m.loyalty, 0) / crew.length
        : 0,
      success =
        draw(world, "outcomes", 1, 100) <=
        Math.min(
          90,
          20 + Math.floor(backing / 2) + Math.floor(s.reputation / 4),
        );
    const previous = s.leaderId;
    if (success) {
      const oldLeader = s.members.find((m) => m.personId === previous);
      if (oldLeader) {
        oldLeader.role = "member";
        oldLeader.loyalty = bounded(oldLeader.loyalty - 30);
        memory(oldLeader.memories, "replaced-by:" + person.id);
      }
      s.leaderId = person.id;
      s.rank = 4;
      syncRank(gang);
    } else {
      s.rank = 2;
      s.loyalty = bounded(s.loyalty - 25);
      syncRank(gang);
      const leader = s.members.find((m) => m.personId === previous);
      if (leader) {
        leader.loyalty = bounded(leader.loyalty - 25);
        memory(leader.memories, "failed-challenge:" + person.id);
      }
      if (s.loyalty < 35)
        close(
          world,
          gang,
          "expelled",
          "I was expelled from " +
            gang.name +
            " after a failed leadership challenge.",
        );
    }
    addHistory(
      world,
      gang,
      success ? "became-boss" : "failed-takeover",
      "I " +
        (success ? "became the boss of " : "failed to take control of ") +
        gang.name +
        ".",
      previous,
    );
    fact(
      world,
      "I " +
        (success
          ? "replaced " + fullName(world.people[previous]) + " as leader of "
          : "failed to take control of ") +
        gang.name +
        ".",
      "crime",
    );
    result(
      world,
      success ? "Your name on the chair" : "The chair stays occupied",
      success
        ? "The crew backs your challenge. You now lead the organisation; the former leader remains a real person with a reason to resent you."
        : gang.left
          ? "The crew rejects your challenge and the leader expels you. Your old rank is history, not a second chance at this year’s vote."
          : "The crew rejects your challenge. You lose the underboss position and some of the trust that made it possible.",
      "handcuffs",
      [
        row(
          "rank",
          "Rank",
          gang.left ? "Expelled" : organisedRanks[s.rank],
          success ? "positive" : "negative",
        ),
      ],
    );
    return;
  }
}
function loseLeadership(world: World, gang: Gang, cause: string) {
  const s = stateOf(gang),
    candidates = s.members
      .filter(
        (m) =>
          m.role !== "former" &&
          !world.people[m.personId].died &&
          !isConfined(world, m.personId),
      )
      .sort(
        (a, b) =>
          b.ambition - a.ambition || a.personId.localeCompare(b.personId),
      );
  if (!candidates.length) return;
  const next = candidates[0];
  for (const m of s.members) if (m.role === "leader") m.role = "member";
  next.role = "leader";
  s.leaderId = next.personId;
  s.rank = 3;
  s.loyalty = bounded(s.loyalty - 12);
  syncRank(gang);
  memory(next.memories, "assumed-leadership:" + cause + ":" + world.date.year);
  addHistory(
    world,
    gang,
    "lost-leadership",
    "I lost leadership of " +
      gang.name +
      " to " +
      fullName(world.people[next.personId]) +
      " during " +
      cause +
      ".",
    next.personId,
  );
  fact(
    world,
    "I lost leadership of " +
      gang.name +
      " to " +
      fullName(world.people[next.personId]) +
      " during " +
      cause +
      ".",
    "crime",
    "",
    gang.personId,
  );
}
export function organisedCrimeMonth(world: World) {
  for (const gang of world.gangs) {
    if (gang.kind !== "street" || !gang.organised || gang.left) continue;
    const s = gang.organised,
      person = world.people[gang.personId],
      month = monthOf(world);
    if (s.lastProcessedMonth >= month) continue;
    s.lastProcessedMonth = month;
    if (person.died) {
      close(
        world,
        gang,
        "death",
        "My membership in " + gang.name + " ended with my death.",
      );
      continue;
    }
    const confined = isConfined(world, person);
    if (confined && !s.suspended) {
      s.suspended = true;
      s.loyalty = bounded(s.loyalty - 5);
      if (s.rank === 4) loseLeadership(world, gang, "custody");
      addHistory(
        world,
        gang,
        "suspended",
        "My outside assignments paused during custody.",
      );
    }
    if (!confined && s.suspended) {
      s.suspended = false;
      addHistory(
        world,
        gang,
        "returned",
        "My custody ended; my outside crew history remained.",
      );
    }
    for (const m of s.members)
      if (world.people[m.personId].died && m.role !== "former")
        m.role = "former";
    if (s.leaderId !== gang.personId && world.people[s.leaderId].died) {
      const next = s.members
        .filter((m) => m.role !== "former")
        .sort((a, b) => b.ambition - a.ambition)[0];
      if (next) {
        next.role = "leader";
        s.leaderId = next.personId;
        addHistory(
          world,
          gang,
          "succession",
          fullName(world.people[next.personId]) +
            " took leadership after the previous leader died.",
          next.personId,
        );
      } else {
        close(
          world,
          gang,
          "left",
          "I left " + gang.name + " after the crew ceased operating.",
        );
        continue;
      }
    }
    if (
      confined ||
      person.id !== world.activePersonId ||
      organisationReason(world, gang)
    )
      continue;
    if (s.rank === 4 && s.loyalty < 35) {
      loseLeadership(world, gang, "a crew revolt");
      continue;
    }
    if (
      s.lastStoryYear === world.date.year ||
      s.activeStory ||
      world.pending ||
      (world.actionCounts[countKey(world, gang, "decision")] ?? 0) >= 1
    )
      continue;
    s.lastStoryYear = world.date.year;
    if (draw(world, "events", 1, 100) <= 28) {
      try {
        offerStory(world, gang);
      } catch (error) {
        if (!(error instanceof IneligibleAction)) throw error;
      }
    }
  }
}
/** Immediate reconciliation after actual deaths; no random draws or financial effects. */
export function refreshOrganisedCrime(world: World) {
  for (const gang of world.gangs) {
    if (!gang.organised || gang.kind !== "street") continue;
    const s = gang.organised,
      owner = world.people[gang.personId];
    if (owner.died) {
      s.activeStory = null;
      continue;
    }
    if (s.activeStory && world.people[s.activeStory.personId].died) {
      const saved = s.activeStory,
        cancelled = {
          kind: "result" as const,
          id: saved.offerId,
          title: "A conversation left unfinished",
          body:
            fullName(world.people[saved.personId]) +
            " has died. The organisation decision ends without a response.",
          illustration: "handcuffs",
          effects: [],
        };
      if (world.pending?.id === saved.offerId) world.pending = cancelled;
      for (const queued of world.deferred)
        if (queued.event.id === saved.offerId) queued.event = cancelled;
      s.activeStory = null;
      addHistory(
        world,
        gang,
        "cancelled-decision",
        "The organisation decision ended after " +
          fullName(world.people[saved.personId]) +
          " died.",
        saved.personId,
      );
    }
    if (gang.left) continue;
    for (const member of s.members)
      if (world.people[member.personId].died) member.role = "former";
    if (
      gang.left ||
      s.leaderId === gang.personId ||
      !world.people[s.leaderId].died
    )
      continue;
    const successor = s.members
      .filter((m) => m.role !== "former")
      .sort(
        (a, b) =>
          b.ambition - a.ambition || a.personId.localeCompare(b.personId),
      )[0];
    if (successor) {
      successor.role = "leader";
      s.leaderId = successor.personId;
      addHistory(
        world,
        gang,
        "succession",
        fullName(world.people[successor.personId]) +
          " took leadership after the previous leader died.",
        successor.personId,
      );
    } else {
      close(
        world,
        gang,
        "left",
        "I left " + gang.name + " after the crew ceased operating.",
      );
    }
  }
}
export function validateOrganisedCrime(world: World, suppliedLedger?: LedgerIndex) {
  if (!world.gangs.some(gang => gang.organised)) return;
  const incidentIndex = new Map(world.incidents.map(incident => [incident.id, incident]));
  const ledger = suppliedLedger ?? indexLedger(world.ledger);
  const assignmentIncidents = new Set<string>(), assignmentTransactions = new Set<string>();
  const activeOwners = new Set<string>(),
    events = [world.pending, ...world.deferred.map((e) => e.event)].filter(
      Boolean,
    );
  const at = (date: World["date"]) =>
    date.year * 372 + date.month * 31 + date.day;
  for (const gang of world.gangs) {
    const s = gang.organised;
    if (!s) continue;
    if (
      world.overhaulVersion !== 1 ||
      gang.kind !== "street" ||
      !/^life_[a-zA-Z0-9_-]+$/.test(s.worldId) ||
      !(s.country in countries) ||
      !s.city ||
      s.lastProcessedMonth > monthOf(world) ||
      s.lastStoryYear > world.date.year ||
      gang.rank !== Math.min(3, s.rank)
    )
      throw new Error("Invalid organised crime capability");
    if (!gang.left) {
      if (activeOwners.has(gang.personId) || world.people[gang.personId].died)
        throw new Error("Duplicate active outside organisation");
      activeOwners.add(gang.personId);
    }
    if (
      new Set(s.members.map((m) => m.personId)).size !== s.members.length ||
      new Set(s.rivals.map((r) => r.personId)).size !== s.rivals.length ||
      s.members.filter((m) => m.role !== "former").length > 5 ||
      s.members.some(
        (m) =>
          !world.people[m.personId] ||
          m.personId === gang.personId ||
          !gang.contactIds.includes(m.personId),
      ) ||
      s.rivals.some(
        (r) =>
          !world.people[r.personId] ||
          r.personId === gang.personId ||
          !gang.contactIds.includes(r.personId) ||
          r.resolved !== (r.influence === 0),
      )
    )
      throw new Error("Invalid organised crime participants");
    const leader = s.members.find((m) => m.personId === s.leaderId);
    if (
      !world.people[s.leaderId] ||
      (s.rank === 4) !== (s.leaderId === gang.personId) ||
      (s.rank === 4 && s.members.some((m) => m.role === "leader")) ||
      (s.rank !== 4 && (!leader || (!gang.left && leader.role !== "leader"))) ||
      s.members.filter((m) => m.role === "leader").length > 1
    )
      throw new Error("Invalid organised crime leadership");
    const ids = new Set<string>();
    for (const job of s.jobs) {
      const incident = incidentIndex.get(job.incidentId),
        transaction =
          job.transactionId &&
          ledger.transactions.get(job.transactionId);
      if (
        new Set(job.participantIds).size !== job.participantIds.length ||
        !job.participantIds.includes(gang.personId) ||
        job.participantIds.some(
          (id) =>
            !world.people[id] ||
            (id !== gang.personId && !s.members.some((m) => m.personId === id)),
        ) ||
        ids.has(job.id) ||
        assignmentIncidents.has(job.incidentId) ||
        (job.transactionId !== null && assignmentTransactions.has(job.transactionId)) ||
        !organisedMissions.some((m) => m.id === job.category) ||
        at(job.date) > at(world.date) ||
        !incident ||
        incident.personId !== gang.personId ||
        incident.gain.minor !== job.proceeds ||
        at(job.date) !== at(incident.date) ||
        incident.offence !== "organized-job" ||
        (!job.success && job.proceeds !== 0n) ||
        job.proceeds > 0n !== !!job.transactionId ||
        (job.transactionId &&
          (!transaction ||
            transaction.personId !== gang.personId ||
            transaction.cashDelta !== job.proceeds ||
            transaction.category !== "crime-proceeds" ||
            transaction.year !== job.date.year || transaction.month !== job.date.month ||
            transaction.currency !== incident.gain.currency))
      )
        throw new Error("Invalid organised assignment proceeds");
      ids.add(job.id);
      assignmentIncidents.add(job.incidentId);
      if (job.transactionId) assignmentTransactions.add(job.transactionId);
    }
    if (
      s.archivedCompleted > s.archivedJobs ||
      s.completedJobs !==
        s.archivedCompleted + s.jobs.filter((j) => j.success).length ||
      new Set(s.seenStories).size !== s.seenStories.length ||
      s.seenStories.some(
        (id) => !organisedCrimeStories.some((story) => story.id === id),
      ) ||
      s.history.some(
        (h) =>
          at(h.date) > at(world.date) ||
          (h.personId && !world.people[h.personId]),
      )
    )
      throw new Error("Invalid organised crime history");
    if (s.activeStory) {
      const story = s.activeStory;
      if (
        gang.left ||
        !world.people[story.personId] ||
        !gang.contactIds.includes(story.personId) ||
        story.year > world.date.year ||
        new Set(story.choices.map(choice => choice.action)).size !== story.choices.length ||
        !s.seenStories.includes(story.id) ||
        !events.some(
          (e) =>
            e?.kind === "decision" &&
            e.id === story.offerId &&
            e.personIds.includes(story.personId) &&
            e.personIds.includes(gang.personId) &&
            e.choices.length === story.choices.length &&
            e.choices.every((c) => {
              const frozen = story.choices.find(choice => choice.action === c.id);
              const effect = c.effects[0];
              return !!frozen && c.resultTitle === frozen.title && c.resultBody === frozen.body && c.journal === frozen.journal && c.effects.length === 1 && effect.kind === "organised-choice" && effect.action === c.id && effect.gangId === gang.id && effect.storyId === story.id && effect.offerId === story.offerId;
            }),
        )
      )
        throw new Error("Invalid saved organisation decision");
    }
  }
}
