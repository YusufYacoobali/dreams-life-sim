import React from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import {
  ActionRow,
  Body,
  Card,
  Header,
  Heading,
  Page,
  Portrait,
  StatBar,
} from '../../../src/ui/components';
import { useColors } from '../../../src/ui/theme';
import { useCultDialog } from '../../../src/ui/CultDialog';
import { CultArt } from '../../../src/assets/CultArt';
import { ageOn, fullName } from '../../../src/game/personHelpers';
import {
  cultHeadquarters,
  cultRoleTitles,
  cultUpgrades,
} from '../../../src/game/content/cults';
import { activeCult } from '../../../src/game/systems/cultSchemas';
import {
  cultActionReason,
  cultBill,
  cultCapacity,
  cultHeadquartersQuote,
  cultMoney,
  cultUpgradeQuote,
} from '../../../src/game/systems/cultCore';
export default function CultHeadquarters() {
  const world = useGame((state) => state.world)!,
    busy = useGame((state) => state.busy),
    error = useGame((state) => state.error),
    cult = activeCult(world),
    dialog = useCultDialog(cult?.id),
    c = useColors();
  if (!cult)
    return (
      <Page>
        <Header
          title="Headquarters"
          onBack={() => router.back()}
          backDisabled={busy}
        />
        <Card>
          <Body>You do not lead an active cult.</Body>
          <ActionRow
            title="Cult Leader"
            onPress={() => router.replace('/cult')}
          />
        </Card>
      </Page>
    );
  const current = cultHeadquarters.findIndex(
      (row) => row.id === cult.headquarters,
    ),
    unavailable = cultActionReason(world, cult);
  return (
    <Page>
      <Header
        title="Cult Headquarters"
        onBack={() => router.back()}
        backDisabled={busy}
      />
      {error && !dialog.open && (
        <Text accessibilityRole="alert" style={{ color: c.red }}>
          {error}
        </Text>
      )}
      <Card>
        <Heading size={22}>{cultHeadquarters[current].title}</Heading>
        <Body>
          {cult.city} · {cult.name}
        </Body>
        <StatBar
          label="Capacity used"
          value={Math.round((cult.followers / cultCapacity(cult)) * 100)}
          color={c.blue}
        />
        <Body>
          {cult.followers} / {cultCapacity(cult)} followers
        </Body>
        <Body muted>
          Current monthly running costs: {cultMoney(cult, cultBill(cult))}.
          Communal funds pay for headquarters and upgrades.
        </Body>
      </Card>
      <Card>
        <Heading size={18}>Larger headquarters</Heading>
        {cultHeadquarters.map((row, index) => {
          const quote = cultHeadquartersQuote(cult, row.id);
          return (
            <ActionRow
              key={row.id}
              title={row.title}
              subtitle={row.description + ' · base capacity ' + row.capacity}
              value={
                index === current
                  ? 'Current'
                  : index > current
                    ? cultMoney(cult, quote)
                    : 'Earlier size'
              }
              icon={<CultArt id="headquarters" size={40} />}
              disabled={busy}
              disabledReason={
                unavailable ??
                (index <= current
                  ? 'Choose a larger headquarters'
                  : cult.cash < quote
                    ? 'The treasury cannot cover this expansion'
                    : undefined)
              }
              onPress={() =>
                dialog.confirm(
                  {
                    type: 'cult-headquarters',
                    cultId: cult.id,
                    headquarters: row.id,
                    quotedCost: quote,
                  },
                  'Move to ' + row.title + '?',
                  'Pay for the additional communal premises. Capacity and monthly maintenance will change.',
                  [
                    {
                      id: 'cost',
                      label: 'From communal treasury',
                      value: cultMoney(cult, quote),
                      tone: 'negative',
                    },
                  ],
                  'headquarters',
                )
              }
            />
          );
        })}
      </Card>
      <Card>
        <Heading size={18}>Upgrades</Heading>
        {cultUpgrades.map((row) => {
          const installed = cult.upgrades.includes(row.id),
            quote = cultUpgradeQuote(cult, row.id);
          return (
            <ActionRow
              key={row.id}
              title={row.title}
              subtitle={row.description}
              value={installed ? 'Installed' : cultMoney(cult, quote)}
              icon={<CultArt id="headquarters" size={36} />}
              disabled={busy}
              disabledReason={
                unavailable ??
                (installed
                  ? 'This upgrade is already installed'
                  : cult.cash < quote
                    ? 'The treasury cannot cover this upgrade'
                    : undefined)
              }
              onPress={() =>
                dialog.confirm(
                  {
                    type: 'cult-upgrade',
                    cultId: cult.id,
                    upgrade: row.id,
                    quotedCost: quote,
                  },
                  'Add ' + row.title + '?',
                  row.description +
                    ' Its running costs apply to future months.',
                  [
                    {
                      id: 'cost',
                      label: 'From communal treasury',
                      value: cultMoney(cult, quote),
                      tone: 'negative',
                    },
                  ],
                  'headquarters',
                )
              }
            />
          );
        })}
      </Card>
      <Card>
        <Heading size={18}>
          {cult.upgrades.includes('residences')
            ? 'Residents and visitors'
            : 'Inner-circle visitors'}
        </Heading>
        {cult.members
          .filter(
            (member) =>
              member.status === 'active' && !world.people[member.personId].died,
          )
          .map((member) => {
            const person = world.people[member.personId];
            return (
              <ActionRow
                key={person.id}
                title={fullName(person)}
                subtitle={
                  cultRoleTitles[member.role] +
                  ' · ' +
                  (member.resident ? 'Resident' : 'Visitor')
                }
                icon={
                  <Portrait
                    personId={person.id}
                    appearance={person.appearance}
                    age={ageOn(person, world.date)}
                    name={fullName(person)}
                    size={44}
                  />
                }
                onPress={() =>
                  dialog.info(
                    fullName(person),
                    cultRoleTitles[member.role] +
                      ' · Loyalty ' +
                      member.loyalty +
                      '%\n' +
                      member.memories
                        .slice(-3)
                        .map((row) => row.text)
                        .join('\n'),
                    [],
                    'followers',
                  )
                }
              />
            );
          })}
        <Body muted>
          Manage responsibilities and relationships from the Cult dashboard.
        </Body>
      </Card>
      {dialog.modal}
    </Page>
  );
}
