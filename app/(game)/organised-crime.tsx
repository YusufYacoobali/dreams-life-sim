import React, { useState } from "react";
import { router } from "expo-router";
import { useGame } from "../../src/state/useGame";
import {
  ActionRow,
  Body,
  Card,
  Header,
  Heading,
  Page,
  Portrait,
  StatBar,
} from "../../src/ui/components";
import { HealthLegalArt } from "../../src/assets/HealthLegalArt";
import { useColors } from "../../src/ui/theme";
import { EventModal, type EventPresentation } from "../../src/ui/EventModal";
import { LegalReviewError, useLegalReview } from "../../src/ui/LegalReview";
import { ageOn, fullName } from "../../src/game/personHelpers";
import {
  organisations,
  organisedMissions,
} from "../../src/game/content/organisedCrime";
import {
  activeOrganisation,
  missionReason,
  organisationRank,
  organisationReason,
  promotionReason,
} from "../../src/game/systems/organisedCrime";
import {
  organisationStyles,
  type OrganisedCrimeCommand,
} from "../../src/game/systems/organisedCrimeSchemas";
import { relationFor } from "../../src/game/systems/relationshipQueries";
import { isConfined } from "../../src/game/systems/legalSchemas";
export default function OrganisedCrime() {
  const identity = useGame((s) => s.world?.id + ":" + s.world?.activePersonId);
  return <Dashboard key={identity} />;
}
function Dashboard() {
  const world = useGame((s) => s.world)!,
    busy = useGame((s) => s.busy),
    error = useGame((s) => s.error),
    c = useColors(),
    review = useLegalReview(),
    gang = activeOrganisation(world),
    s = gang?.organised;
  const [selection, setSelection] = useState<{
    event: EventPresentation;
    choose: (id: string) => void;
  } | null>(null);
  function confirm(
    command: OrganisedCrimeCommand,
    title: string,
    body: string,
    label = "Confirm",
  ) {
    review.confirm(command, title, body, [], "handcuffs", label);
  }
  const available = organisationReason(world, gang),
    person = world.people[world.activePersonId];
  function select(
    title: string,
    body: string,
    choices: { id: string; label: string; disabledReason?: string }[],
    choose: (id: string) => void,
  ) {
    setSelection({
      event: {
        kind: "selection",
        id: "organised-select-" + world.revision,
        title,
        body,
        choices,
        confirmLabel: "Choose",
      },
      choose,
    });
  }
  const contactIcon = (id: string) => {
    const target = world.people[id];
    return (
      <Portrait
        name={fullName(target)}
        personId={id}
        appearance={target.appearance}
        age={ageOn(target, world.date)}
        size={44}
      />
    );
  };
  return (
    <Page>
      <Header title="Organised Crime" onBack={() => router.back()} />
      <LegalReviewError error={review.isOpen ? null : error} />
      <Card>
        <HealthLegalArt id="handcuffs" size={64} />
        <Heading size={22}>{gang?.name ?? "A seat at the table"}</Heading>
        <Body muted>
          {s
            ? organisations[s.style].description
            : "Build trust, take risky assignments and decide who deserves your loyalty. Proceeds, evidence and old enemies follow you."}
        </Body>
        {s && (
          <>
            <Heading size={18}>{organisationRank(gang!)}</Heading>
            <StatBar label="Loyalty" value={s.loyalty} color={c.purple} />
            <StatBar label="Reputation" value={s.reputation} color={c.purple} />
            <Body muted>
              {s.completedJobs} completed assignments · {s.decisions} major
              decisions
              {isConfined(world)
                ? " · Outside activity suspended in custody"
                : ""}
            </Body>
            <Body>Leader: {fullName(world.people[s.leaderId])}</Body>
          </>
        )}
      </Card>
      {!gang ? (
        <Card>
          <Heading size={18}>Choose an organisation</Heading>
          {organisationStyles.map((style) => (
            <React.Fragment key={style}>
              <ActionRow
                title={organisations[style].title}
                subtitle={organisations[style].description}
                disabled={busy}
                disabledReason={available}
                onPress={() =>
                  confirm(
                    { type: "organised-join", style },
                    "Join " + organisations[style].name + "?",
                    "Meet the crew and enter as a recruit. Assignments carry real arrest risk; membership has no salary or joining charge.",
                    "Join Organisation",
                  )
                }
              />
              <ActionRow
                title={"Decline " + organisations[style].title}
                subtitle="Turn down the invitation"
                disabled={busy}
                disabledReason={available}
                onPress={() =>
                  confirm(
                    { type: "organised-refuse", style },
                    "Decline this invitation?",
                    "You decide whether to join.",
                    "Decline",
                  )
                }
              />
            </React.Fragment>
          ))}
        </Card>
      ) : !s ? (
        <Card>
          <Heading size={18}>Your existing affiliation</Heading>
          <Body>
            Your saved rank and contacts remain. Review the organisation before
            taking new assignments.
          </Body>
          {organisationStyles.map((style) => (
            <ActionRow
              key={style}
              title={"Continue as a " + organisations[style].title}
              disabled={busy}
              disabledReason={available}
              onPress={() =>
                confirm(
                  { type: "organised-upgrade", gangId: gang.id, style },
                  "Review this affiliation?",
                  "Retain your old rank, known contacts and history while opening the new organisation decisions.",
                  "Review Organisation",
                )
              }
            />
          ))}
        </Card>
      ) : (
        <>
          <Card>
            <Heading size={18}>Assignments</Heading>
            <Body muted>
              Two assignments per year. A cautious approach reduces reward and
              detection risk; bold work pays more and risks injury; a trusted
              crew can share the burden.
            </Body>
            {organisedMissions
              .filter(
                (m) =>
                  (m.styles as readonly string[]).includes(s.style) &&
                  m.rank <= s.rank,
              )
              .map((mission) => (
                <ActionRow
                  key={mission.id}
                  title={mission.title}
                  subtitle={mission.premise}
                  disabled={busy}
                  disabledReason={missionReason(
                    world,
                    gang,
                    mission.id,
                    "cautious",
                  )}
                  onPress={() =>
                    select(
                      mission.title,
                      "Choose how to approach this fictional assignment. Each approach creates a real incident; prosecution may follow later.",
                      [
                        {
                          id: "cautious",
                          label: "Cautious · smaller reward, less exposure",
                        },
                        { id: "bold", label: "Bold · more reward, more risk" },
                        {
                          id: "crew-led",
                          label: "Crew-led · share credit and responsibility",
                          disabledReason: missionReason(world, gang, mission.id, "crew-led"),
                        },
                      ],
                      (approach) =>
                        confirm(
                          {
                            type: "organised-mission",
                            gangId: gang.id,
                            mission: mission.id,
                            approach: approach as
                              | "cautious"
                              | "bold"
                              | "crew-led",
                          },
                          "Take this assignment?",
                          mission.premise +
                            " Evidence, arrest and injury can persist after the job.",
                          "Take Assignment",
                        ),
                    )
                  }
                />
              ))}
          </Card>
          <Card>
            <Heading size={18}>The organisation</Heading>
            <Body muted>
              One major decision per year. Promotions depend on completed work,
              criminal experience, loyalty and reputation.
            </Body>
            <ActionRow
              title="Ask for promotion"
              subtitle={"Current rank: " + organisationRank(gang)}
              disabled={busy}
              disabledReason={promotionReason(world, gang)}
              onPress={() =>
                confirm(
                  { type: "organised-promotion", gangId: gang.id },
                  "Ask for greater responsibility?",
                  "Your work and standing determine whether you qualify. This uses your major organisation decision this year.",
                  "Seek Promotion",
                )
              }
            />
            <ActionRow
              title="Hear the crew’s concerns"
              subtitle="A member, leader or rival brings you a decision"
              disabled={busy}
              disabledReason={
                available ??
                ((world.actionCounts[
                  person.id + ":organised:" + world.date.year + ":decision"
                ] ?? 0) >= 1
                  ? "Your major decision for this year is used"
                  : undefined)
              }
              onPress={() =>
                confirm(
                  { type: "organised-decision", gangId: gang.id },
                  "Hear the crew’s concern?",
                  "A real member or rival brings one immediate situation. This uses your major organisation decision this year.",
                  "Hear Them Out",
                )
              }
            />
            {s.rank >= 3 && s.rank < 4 && (
              <>
                <ActionRow
                  title="Challenge leadership"
                  subtitle="Eight jobs, 65 reputation and 60 loyalty; crew backing matters"
                  disabled={busy}
                  disabledReason={available}
                  onPress={() =>
                    confirm(
                      {
                        type: "organised-challenge",
                        gangId: gang.id,
                        action: "challenge",
                      },
                      "Challenge the leader?",
                      "The crew may support you or reject you. Failure can cost your rank or membership. Success changes the actual leader.",
                      "Challenge",
                    )
                  }
                />
                <ActionRow
                  title="Support the leader"
                  subtitle="Strengthen loyalty instead of seeking the chair"
                  disabled={busy}
                  disabledReason={available}
                  onPress={() =>
                    confirm(
                      {
                        type: "organised-challenge",
                        gangId: gang.id,
                        action: "support",
                      },
                      "Support the leader?",
                      "This public commitment uses your major organisation decision this year.",
                      "Offer Support",
                    )
                  }
                />
              </>
            )}
            {s.rank >= 2 && (
              <ActionRow
                title="Recruit a contact"
                subtitle="A trusted local adult may accept or refuse"
                disabled={busy}
                disabledReason={available}
                onPress={() => {
                  const contacts = Object.values(world.people).filter(
                    (p) =>
                      p.id !== person.id &&
                      !p.died &&
                      ageOn(p, world.date) >= 18 &&
                      p.country === s.country &&
                      p.city === s.city &&
                      !isConfined(world, p) &&
                      (relationFor(world, person.id, p.id)?.trust ?? 0) >= 55 &&
                      !s.members.some((m) => m.personId === p.id) &&
                      !s.rivals.some((r) => r.personId === p.id),
                  );
                  select(
                    "Recruit a contact",
                    "The invitation uses this year’s major decision. Your contact has the right to refuse.",
                    contacts.map((p) => ({ id: p.id, label: fullName(p) })),
                    (id) =>
                      confirm(
                        {
                          type: "organised-recruit",
                          gangId: gang.id,
                          personId: id,
                        },
                        "Invite this person?",
                        "Their existing trust and behaviour matter. Acceptance creates a real crew membership.",
                        "Invite Contact",
                      ),
                  );
                }}
              />
            )}
          </Card>
          <Card>
            <Heading size={18}>People in the crew</Heading>
            {s.members.map((member) => (
              <ActionRow
                key={member.personId}
                title={fullName(world.people[member.personId])}
                subtitle={
                  (world.people[member.personId].died
                    ? "Deceased"
                    : member.role) +
                  " · Loyalty " +
                  member.loyalty +
                  "% · Ambition " +
                  member.ambition +
                  "%"
                }
                icon={contactIcon(member.personId)}
                disabled={busy}
                disabledReason={
                  member.role === "former" || world.people[member.personId].died
                    ? "Their earlier membership remains in your history"
                    : available
                }
                onPress={() =>
                  select(
                    fullName(world.people[member.personId]),
                    "Talk and trust have a small annual limit. Confrontation or expulsion uses your major organisation decision.",
                    [
                      { id: "talk", label: "Talk privately" },
                      { id: "trust", label: "Place your trust in them" },
                      { id: "confront", label: "Confront their behaviour" },
                      ...(s.rank >= 3 && member.personId !== s.leaderId
                        ? [{ id: "expel", label: "Expel from the crew" }]
                        : []),
                    ],
                    (action) =>
                      confirm(
                        {
                          type: "organised-member",
                          gangId: gang.id,
                          personId: member.personId,
                          action: action as
                            | "talk"
                            | "trust"
                            | "confront"
                            | "expel",
                        },
                        "Speak with this member?",
                        "Their trust, loyalty and memories can change. Expelled members may become rivals.",
                        "Continue",
                      ),
                  )
                }
              />
            ))}
          </Card>
          <Card>
            <Heading size={18}>Rivals</Heading>
            {s.rivals.map((rival) => (
              <ActionRow
                key={rival.personId}
                title={fullName(world.people[rival.personId])}
                subtitle={
                  (rival.resolved
                    ? "Truce agreed"
                    : "Influence " + rival.influence + "%") +
                  " · Reputation " +
                  rival.reputation +
                  "%"
                }
                icon={contactIcon(rival.personId)}
                disabled={busy}
                disabledReason={
                  rival.resolved || world.people[rival.personId].died
                    ? "This rivalry has ended"
                    : available
                }
                onPress={() =>
                  select(
                    "Respond to your rival",
                    "Your response uses the year’s major decision. Betrayal can trigger an investigation or expulsion.",
                    [
                      { id: "negotiate", label: "Negotiate a truce" },
                      { id: "refuse", label: "Refuse their pressure" },
                      { id: "betray", label: "Betray their trust" },
                    ],
                    (action) =>
                      confirm(
                        {
                          type: "organised-rival",
                          gangId: gang.id,
                          personId: rival.personId,
                          action: action as "negotiate" | "refuse" | "betray",
                        },
                        "Respond to this rival?",
                        "This person remembers the response; influence and loyalty can change.",
                        "Respond",
                      ),
                  )
                }
              />
            ))}
          </Card>
          <Card>
            <Heading size={18}>Recent history</Heading>
            {s.history
              .slice(-8)
              .reverse()
              .map((h, i) => (
                <Body key={i}>
                  {h.date.year}: {h.text}
                </Body>
              ))}
          </Card>
        </>
      )}
      {gang && (
        <Card>
          <ActionRow
            title="Leave the organisation"
            subtitle="Keep your history and contacts; end your membership"
            disabled={busy}
            onPress={() =>
              gang.organised
                ? confirm(
                    { type: "organised-leave", gangId: gang.id },
                    "Leave this organisation?",
                    "Your criminal record, financial history and other people’s memories remain.",
                    "Leave Organisation",
                  )
                : review.confirm(
                    { type: "leave-gang" },
                    "Leave this group?",
                    "Your existing history remains.",
                    [],
                    "release",
                    "Leave Group",
                  )
            }
          />
        </Card>
      )}
      {review.modal}
      <EventModal
        event={selection?.event ?? null}
        busy={busy}
        onCancel={() => {
          if (!busy) setSelection(null);
        }}
        onChoose={(id) => {
          if (busy || !selection) return;
          const choose = selection.choose;
          setSelection(null);
          choose(id);
        }}
      />
    </Page>
  );
}
