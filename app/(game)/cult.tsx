import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import {
  ActionRow,
  Body,
  Button,
  Card,
  Header,
  Heading,
  Page,
  Portrait,
  StatBar,
} from '../../src/ui/components';
import { useColors } from '../../src/ui/theme';
import { useCultDialog } from '../../src/ui/CultDialog';
import { CultArt, type CultArtId } from '../../src/assets/CultArt';
import {
  SocialBusinessFacts,
  SocialBusinessIntro,
} from '../../src/ui/SocialBusinessPresentation';
import { ageOn, fullName } from '../../src/game/personHelpers';
import { formatMoney } from '../../src/game/money';
import { rules as countryRules } from '../../src/game/rules';
import { accountFor, availableCash } from '../../src/game/systems/common';
import {
  activeCult,
  type Cult,
  type CultCommand,
} from '../../src/game/systems/cultSchemas';
import {
  cultAmount,
  cultBill,
  cultCapacity,
  cultCeremonyQuote,
  cultFeeOptions,
  cultFoundingReason,
  cultMoney,
  cultPayoutAvailable,
  cultRecruitQuote,
  cultRewardQuote,
  cultStartupQuote,
} from '../../src/game/systems/cultCore';
import {
  cultClaimReason,
  cultRecoveryQuote,
  cultRivalQuote,
} from '../../src/game/systems/cults';
import {
  cultCeremonies,
  cultDoctrines,
  cultHeadquarters,
  cultLeaderTitles,
  cultPhilosophies,
  cultRandomNames,
  cultRecruitment,
  cultRoleTitles,
  cultRules,
} from '../../src/game/content/cults';
import { cultClaims } from '../../src/game/content/cultClaims';
import {
  cultVacancyRoles,
  cultReplacementCandidates,
  cultReplacementQuote,
  cultReplacementReason,
  cultRoleChangeReason,
} from '../../src/game/systems/cultRoster';
import type { EffectRow } from '../../src/ui/EventModal';

type Config = {
  title: string;
  philosophy: Cult['philosophy'];
  doctrines: Cult['doctrines'];
  rules: Cult['rules'];
};
export default function CultCareer() {
  const identity = useGame((state) => {
    const world = state.world;
    return world
      ? world.id +
          ':' +
          world.activePersonId +
          ':' +
          (activeCult(world)?.id ?? 'new')
      : 'none';
  });
  return <CultDashboard key={identity} />;
}
function CultDashboard() {
  const world = useGame((state) => state.world)!,
    busy = useGame((state) => state.busy),
    error = useGame((state) => state.error),
    cult = activeCult(world),
    dialog = useCultDialog(cult?.id),
    c = useColors();
  const [name, setName] = useState(''),
    [config, setConfig] = useState<Config>({
      title: cult?.leaderTitle ?? cultLeaderTitles[0],
      philosophy: cult?.philosophy ?? 'dream-archive',
      doctrines: cult?.doctrines ?? ['borrowed-dreams', 'public-answers'],
      rules: cult?.rules ?? ['family-day', 'open-books'],
    }),
    [headquarters, setHeadquarters] =
      useState<Cult['headquarters']>('meeting-room'),
    [method, setMethod] = useState<'announcement' | 'social' | 'gathering'>(
      'gathering',
    ),
    [joining, setJoining] = useState(
      cultFeeOptions(world.people[world.activePersonId].country)[2].joining,
    ),
    [recurring, setRecurring] = useState(
      cultFeeOptions(world.people[world.activePersonId].country)[2].recurring,
    ),
    [editing, setEditing] = useState(false),
    [rebrand, setRebrand] = useState(false);
  const country = world.people[world.activePersonId].country,
    money = (minor: bigint) =>
      formatMoney({ minor, currency: accountFor(world).currency });
  const field = {
    color: c.ink,
    backgroundColor: c.inset,
    borderRadius: 10,
    padding: 12,
    minHeight: 48,
  };
  const options = (
    rows: readonly { id: string; title: string; description?: string }[],
  ) =>
    rows.map((row) => ({
      id: row.id,
      label: row.title + (row.description ? ' · ' + row.description : ''),
    }));
  function choosePhilosophy() {
    dialog.select(
      'Choose a philosophy',
      'Your philosophy affects recruitment, loyalty, donations and eligible stories.',
      options(cultPhilosophies),
      (id) =>
        setConfig((value) => ({
          ...value,
          philosophy: id as Cult['philosophy'],
        })),
      'philosophy',
    );
  }
  function chooseBelief(kind: 'doctrines' | 'rules', index: number) {
    const catalog = kind === 'doctrines' ? cultDoctrines : cultRules,
      selected = config[kind];
    dialog.select(
      kind === 'doctrines' ? 'Choose a doctrine' : 'Choose a rule',
      'Every selection changes how the organisation behaves.',
      catalog
        .filter(
          (row) =>
            row.id === selected[index] || !selected.includes(row.id as never),
        )
        .sort(
          (a, b) =>
            Number(b.id === selected[index]) - Number(a.id === selected[index]),
        )
        .map((row) => ({
          id: row.id,
          label: row.title + ' · ' + row.description,
        })),
      (id) =>
        setConfig((value) => ({
          ...value,
          [kind]: value[kind].map((old, i) => (i === index ? id : old)),
        })) as void,
      kind,
      undefined,
      {
        label: kind === 'doctrines' ? 'Search doctrines' : 'Search rules',
        selectedId: selected[index],
      },
    );
  }
  function addBelief(kind: 'doctrines' | 'rules') {
    const catalog = kind === 'doctrines' ? cultDoctrines : cultRules;
    dialog.select(
      'Add a ' + (kind === 'doctrines' ? 'doctrine' : 'rule'),
      'Up to six of each. Frequent changes can upset members.',
      catalog
        .filter((row) => !config[kind].includes(row.id as never))
        .map((row) => ({
          id: row.id,
          label: row.title + ' · ' + row.description,
        })),
      (id) =>
        setConfig((value) => ({
          ...value,
          [kind]: [...value[kind], id],
        })) as void,
      kind,
      undefined,
      { label: kind === 'doctrines' ? 'Search doctrines' : 'Search rules' },
    );
  }
  function titleOptions() {
    dialog.select(
      'Leader title',
      'Use a title here, or type a custom title below.',
      cultLeaderTitles.map((label, i) => ({ id: String(i), label })),
      (id) =>
        setConfig((value) => ({
          ...value,
          title: cultLeaderTitles[Number(id)],
        })),
      'cult',
    );
  }
  function fees(onDone?: (joining: bigint, recurring: bigint) => void) {
    const selections = cultFeeOptions(cult?.country ?? country);
    dialog.select(
      'Membership fees',
      'Joining fees apply to later recruits. Recurring fees apply once each month. High fees can drive members away.',
      selections.map((row) => ({
        id: row.id,
        label:
          row.title +
          ' · join ' +
          money(row.joining) +
          ' · monthly ' +
          money(row.recurring),
      })),
      (id) => {
        const value = selections.find((row) => row.id === id)!;
        if (onDone) onDone(value.joining, value.recurring);
        else {
          setJoining(value.joining);
          setRecurring(value.recurring);
        }
      },
      'treasury',
    );
  }
  function review(
    command: CultCommand,
    title: string,
    body: string,
    id: CultArtId = 'cult',
    terms: EffectRow[] = [],
  ) {
    dialog.confirm(command, title, body, terms, id);
  }
  const costRow = (cult: Cult, amount: bigint): EffectRow => ({
    id: 'cost',
    label: 'From communal treasury',
    value: cultMoney(cult, amount),
    tone: 'negative',
  });
  function recruit() {
    if (!cult) return;
    dialog.select(
      'Recruit followers',
      'Beliefs, fees, public image and heat affect who stays.',
      cultRecruitment.map((row) => ({
        id: row.id,
        label:
          row.title + ' · ' + cultMoney(cult, cultRecruitQuote(cult, row.id)),
        disabledReason:
          cult.cash < cultRecruitQuote(cult, row.id)
            ? 'The treasury cannot cover this method'
            : undefined,
      })),
      (id) => {
        const method = cultRecruitment.find((row) => row.id === id)!,
          cost = cultRecruitQuote(cult, method.id);
        review(
          {
            type: 'cult-recruit',
            cultId: cult.id,
            method: method.id,
            quotedCost: cost,
          },
          method.title + '?',
          method.description,
          'recruitment',
          [costRow(cult, cost)],
        );
      },
      'recruitment',
    );
  }
  function ceremony() {
    if (!cult) return;
    dialog.select(
      'Hold a ceremony',
      'Costs, member satisfaction and public heat affect the gathering.',
      cultCeremonies.map((row) => ({
        id: row.id,
        label:
          row.title + ' · ' + cultMoney(cult, cultCeremonyQuote(cult, row.id)),
        disabledReason:
          cult.cash < cultCeremonyQuote(cult, row.id)
            ? 'The treasury cannot cover this ceremony'
            : undefined,
      })),
      (id) => {
        const chosen = cultCeremonies.find((row) => row.id === id)!,
          cost = cultCeremonyQuote(cult, chosen.id);
        review(
          {
            type: 'cult-ceremony',
            cultId: cult.id,
            ceremony: chosen.id,
            quotedCost: cost,
          },
          chosen.title + '?',
          chosen.description,
          'ceremony',
          [costRow(cult, cost)],
        );
      },
      'ceremony',
    );
  }
  function wildClaim() {
    if (!cult) return;
    dialog.select(
      'Make a wild claim',
      'One new claim each year. Promises return at their recorded deadlines.',
      cultClaims.map((row) => ({
        id: row.id,
        label: row.title + ' · due in ' + row.months + ' months',
        disabledReason: cultClaimReason(cult, row.id),
      })),
      (id) => {
        const claim = cultClaims.find((row) => row.id === id)!;
        dialog.select(
          claim.title,
          claim.announcement,
          [
            {
              id: 'double-down',
              label:
                'Double down · stronger initial devotion, more public attention',
            },
            {
              id: 'explain',
              label: 'Explain cautiously · a smaller initial response',
            },
            {
              id: 'viewing',
              label:
                'Arrange a viewing · ' + cultMoney(cult, cultAmount(cult, 30)),
            },
          ],
          (approach) =>
            review(
              {
                type: 'cult-claim',
                cultId: cult.id,
                claim: claim.id,
                approach: approach as 'double-down' | 'explain' | 'viewing',
              },
              'Make this promise?',
              claim.announcement +
                ' It will return in ' +
                claim.months +
                ' months.',
              'claim',
              approach === 'viewing'
                ? [costRow(cult, cultAmount(cult, 30))]
                : [],
            ),
          'claim',
        );
      },
      'claim',
    );
  }
  function follower(personId: string) {
    if (!cult) return;
    const member = cult.members.find((row) => row.personId === personId)!,
      person = world.people[personId],
      portrait = (
        <Portrait
          personId={person.id}
          appearance={person.appearance}
          age={ageOn(person, world.date)}
          name={fullName(person)}
          size={64}
        />
      );
    dialog.select(
      fullName(person),
      cultRoleTitles[member.role] +
        ' · ' +
        member.status +
        ' · Loyalty ' +
        member.loyalty +
        '% · Ambition ' +
        member.ambition +
        '%\n' +
        member.memories
          .slice(-3)
          .map((row) => row.text)
          .join('\n'),
      (
        [
          'talk',
          'praise',
          'promote',
          'assign',
          'reward',
          'confront',
          'expel',
        ] as const
      ).map((id) => ({
        id,
        label: {
          talk: 'Talk',
          praise: 'Praise',
          promote: 'Promote to second-in-command',
          assign: 'Assign responsibility',
          reward: 'Reward · ' + cultMoney(cult, cultRewardQuote(cult)),
          confront: 'Confront publicly',
          expel: 'Expel from the organisation',
        }[id],
        disabledReason: person.died
          ? 'This person has died'
          : member.status !== 'active' && id !== 'talk'
            ? 'They have left the organisation'
            : id === 'promote'
              ? cultRoleChangeReason(cult, personId, 'deputy')
              : undefined,
      })),
      (id) => {
        const action = id as Extract<
          CultCommand,
          { type: 'cult-member' }
        >['action'];
        if (action === 'assign') {
          dialog.select(
            'Assign responsibility',
            'Replacing someone changes their loyalty and leaves a memory.',
            Object.entries(cultRoleTitles).map(([id, label]) => ({
              id,
              label,
              disabledReason: cultRoleChangeReason(
                cult,
                personId,
                id as typeof member.role,
              ),
            })),
            (role) =>
              review(
                {
                  type: 'cult-member',
                  cultId: cult.id,
                  personId,
                  action,
                  role: role as typeof member.role,
                },
                'Assign ' + fullName(person) + '?',
                cultRoleTitles[role as typeof member.role] +
                  ' becomes their actual responsibility.',
                'followers',
              ),
            'followers',
            portrait,
          );
          return;
        }
        review(
          {
            type: 'cult-member',
            cultId: cult.id,
            personId,
            action,
            ...(action === 'reward'
              ? { quotedCost: cultRewardQuote(cult) }
              : {}),
          },
          {
            talk: 'Talk with ',
            praise: 'Praise ',
            promote: 'Promote ',
            reward: 'Reward ',
            confront: 'Confront ',
            expel: 'Expel ',
            assign: 'Assign ',
          }[action] +
            fullName(person) +
            '?',
          action === 'expel'
            ? 'They may leave with supporters. Past grievances can return later.'
            : action === 'confront'
              ? 'Public humiliation can damage your relationship and return as an accusation.'
              : 'This affects the real person and their memory of your leadership.',
          'followers',
          action === 'reward' ? [costRow(cult, cultRewardQuote(cult))] : [],
        );
      },
      'followers',
      portrait,
    );
  }
  function followers() {
    if (!cult) return;
    const current = cult.members.filter((row) => row.status === 'active'),
      former = cult.members.filter((row) => row.status !== 'active'),
      vacancies = cultVacancyRoles(cult);
    dialog.select(
      'Your inner circle',
      current.length +
        ' active members. Ordinary followers are counted together; your inner circle keeps its own memories.',
      [
        ...current.map((row) => ({
          id: row.personId,
          label:
            fullName(world.people[row.personId]) +
            ' · ' +
            cultRoleTitles[row.role] +
            ' · ' +
            row.status,
        })),
        {
          id: 'vacancy',
          label:
            'Fill a vacancy · ' +
            vacancies.length +
            ' available ' +
            (vacancies.length === 1 ? 'role' : 'roles'),
          disabledReason: cultReplacementReason(world, cult),
        },
        ...(former.length
          ? [{ id: 'former', label: 'Former members · ' + former.length }]
          : []),
      ],
      (id) => {
        if (id === 'vacancy') {
          fillVacancy();
          return;
        }
        if (id === 'former') {
          dialog.select(
            'Former inner-circle members',
            'Earlier roles, disputes and memories stay on record.',
            former.map((row) => ({
              id: row.personId,
              label:
                fullName(world.people[row.personId]) +
                ' · ' +
                cultRoleTitles[row.role] +
                ' · ' +
                row.status,
            })),
            follower,
            'followers',
            undefined,
            former.length > 6 ? { label: 'Search former members' } : undefined,
          );
          return;
        }
        follower(id);
      },
      'followers',
    );
  }
  function fillVacancy() {
    if (!cult) return;
    const roles = cultVacancyRoles(cult),
      quote = cultReplacementQuote(cult);
    dialog.select(
      'Fill an inner-circle vacancy',
      'Offer a real local contact a responsibility. Up to two invitations each year.',
      roles.map((role) => ({ id: role, label: cultRoleTitles[role] })),
      (id) => {
        const role = id as Cult['members'][number]['role'],
          candidates = cultReplacementCandidates(world, cult);
        if (!candidates.length) {
          dialog.info(
            'No eligible local contacts',
            'Get to know an adult in the headquarters city before inviting them. Former members need a repaired relationship, and active rival leaders must reconcile first.',
            [],
            'followers',
          );
          return;
        }
        dialog.select(
          'Choose your ' + cultRoleTitles[role].toLowerCase(),
          'Choose someone you already know. Their existing identity and memories stay with them.',
          candidates.map((person) => ({
            id: person.id,
            label:
              fullName(person) +
              (cult.members.some((member) => member.personId === person.id)
                ? ' · Former inner-circle member'
                : ''),
            disabledReason: cultReplacementReason(world, cult, person.id, role),
          })),
          (personId) => {
            const person = world.people[personId];
            review(
              {
                type: 'cult-fill-vacancy',
                cultId: cult.id,
                personId,
                role,
                quotedCost: quote,
              },
              'Invite ' + fullName(person) + '?',
              cultRoleTitles[role] +
                ' will become their actual responsibility. Invitation and induction costs come from the communal treasury.',
              'followers',
              [costRow(cult, quote)],
            );
          },
          'followers',
          undefined,
          candidates.length > 6
            ? { label: 'Search local contacts' }
            : undefined,
        );
      },
      'followers',
    );
  }
  function treasury() {
    if (!cult) return;
    dialog.select(
      'Treasury',
      cultMoney(cult, cult.cash) +
        ' available · ' +
        cultMoney(cult, cult.arrears) +
        ' unpaid bills. These funds belong to the organisation.',
      [
        { id: 'records', label: 'Financial records' },
        { id: 'fees', label: 'Change membership fees' },
        { id: 'contribute', label: 'Contribute personal funds' },
        {
          id: 'payout',
          label: 'Take a permitted leader payout',
          disabledReason:
            cultPayoutAvailable(cult) <= 0n
              ? 'Requires earned profit, three operating months and two months of reserves'
              : undefined,
        },
        { id: 'annual', label: 'Annual reports' },
      ],
      (id) => {
        if (id === 'fees') {
          fees((joiningFee, recurringFee) =>
            review(
              { type: 'cult-fees', cultId: cult.id, joiningFee, recurringFee },
              'Change membership fees?',
              'New rates apply to future joins and monthly dues. Higher fees can reduce satisfaction.',
              'treasury',
            ),
          );
          return;
        }
        if (id === 'contribute') {
          const amounts = [
            countryRules[cult.country].baseWage / 100n,
            countryRules[cult.country].baseWage / 20n,
            countryRules[cult.country].baseWage / 5n,
          ];
          dialog.select(
            'Contribute personal funds',
            'Contributions become communal and do not create a personal ownership claim.',
            amounts.map((amount, i) => ({
              id: String(i),
              label: cultMoney(cult, amount),
              disabledReason:
                availableCash(accountFor(world, undefined, cult.currency)) <
                amount
                  ? 'Your available balance cannot cover this'
                  : undefined,
            })),
            (index) =>
              review(
                {
                  type: 'cult-contribute',
                  cultId: cult.id,
                  amount: amounts[Number(index)],
                },
                'Contribute these funds?',
                'This is a personal payment into the communal treasury.',
                'treasury',
                [
                  {
                    id: 'amount',
                    label: 'Your payment',
                    value: cultMoney(cult, amounts[Number(index)]),
                    tone: 'negative',
                  },
                ],
              ),
            'treasury',
          );
          return;
        }
        if (id === 'payout') {
          const amount = cultPayoutAvailable(cult);
          review(
            { type: 'cult-payout', cultId: cult.id, amount },
            'Take a leader payout?',
            'Only recorded earned profit above reserves is available. This is taxable personal income; large payments can damage trust.',
            'treasury',
            [
              {
                id: 'amount',
                label: 'Permitted payment',
                value: cultMoney(cult, amount),
                tone: 'positive',
              },
            ],
          );
          return;
        }
        if (id === 'annual') {
          dialog.info(
            'Annual reports',
            cult.years.length
              ? cult.years
                  .slice(-5)
                  .map(
                    (row) =>
                      row.year +
                      ': ' +
                      row.gained +
                      ' joined, ' +
                      row.lost +
                      ' left. Revenue ' +
                      cultMoney(cult, row.revenue) +
                      ', costs ' +
                      cultMoney(cult, row.expenses) +
                      ', treasury ' +
                      cultMoney(cult, row.treasury) +
                      '. Loyalty ' +
                      row.loyaltyStart +
                      '% → ' +
                      row.loyalty +
                      '%. Reputation ' +
                      row.reputationStart +
                      '% → ' +
                      row.reputation +
                      '%.\n' +
                      row.events.slice(-2).join(' '),
                  )
                  .join('\n\n')
              : 'Your first report arrives when the calendar year closes.',
            [],
            'treasury',
          );
          return;
        }
        dialog.info(
          'Recorded finances',
          'Personal funds and the communal treasury remain separate.\n' +
            cult.book
              .slice(-8)
              .reverse()
              .map((row) => row.description + ': ' + cultMoney(cult, row.delta))
              .join('\n'),
          [
            {
              id: 'income',
              label: 'Lifetime revenue',
              value: cultMoney(cult, cult.income),
              tone: 'positive',
            },
            {
              id: 'expenses',
              label: 'Recorded expenses',
              value: cultMoney(cult, cult.expenses),
              tone: 'negative',
            },
            {
              id: 'payouts',
              label: 'Leader payouts',
              value: cultMoney(cult, cult.payouts),
              tone: 'neutral',
            },
            {
              id: 'running',
              label: 'Current monthly running costs',
              value: cultMoney(cult, cultBill(cult)),
              tone: 'neutral',
            },
          ],
          'treasury',
        );
      },
      'treasury',
    );
  }
  function rivalries() {
    if (!cult) return;
    const rivals = cult.rivals.filter((row) =>
      ['active', 'allied'].includes(row.status),
    );
    if (!rivals.length) {
      dialog.info(
        'Rival organisations',
        'No active rivals. Old disputes can develop over time.',
        [],
        'rivalry',
      );
      return;
    }
    dialog.select(
      'Rival organisations',
      'Rivals retain their actual leaders and shared history.',
      rivals.map((row) => ({
        id: row.id,
        label: row.name + ' · ' + row.followers + ' followers',
      })),
      (id) => {
        const rival = rivals.find((row) => row.id === id)!;
        dialog.select(
          rival.name,
          fullName(world.people[rival.leaderId]) +
            ' · Reputation ' +
            rival.reputation +
            '% · Relationship ' +
            rival.relationship +
            '%\n' +
            rival.history.slice(-2).join('\n'),
          (
            [
              'challenge',
              'publicity',
              'alliance',
              'reconcile',
              'ignore',
            ] as const
          ).map((action) => ({
            id: action,
            label:
              {
                challenge: 'Challenge rival',
                publicity: 'Spread publicity',
                alliance: 'Offer alliance',
                reconcile: 'Attempt reconciliation',
                ignore: 'Ignore rival',
              }[action] +
              ' · ' +
              cultMoney(cult, cultRivalQuote(cult, action)),
          })),
          (action) =>
            review(
              {
                type: 'cult-rival',
                cultId: cult.id,
                rivalId: rival.id,
                action: action as
                  | 'challenge'
                  | 'publicity'
                  | 'alliance'
                  | 'reconcile'
                  | 'ignore',
                quotedCost: cultRivalQuote(cult, action as 'challenge'),
              },
              'Respond to ' + rival.name + '?',
              'Competition can draw attention. Reconciliation takes time.',
              'rivalry',
              [costRow(cult, cultRivalQuote(cult, action as 'challenge'))],
            ),
          'rivalry',
        );
      },
      'rivalry',
    );
  }
  function recovery() {
    if (!cult) return;
    dialog.select(
      'Public criticism',
      'Heat ' +
        cult.heat +
        '%. Earlier incidents and legal cases survive a change of name.',
      (
        [
          'apologise',
          'transparent',
          'open-gathering',
          'replace-deputy',
          'rebrand',
          'ignore',
        ] as const
      ).map((id) => ({
        id,
        label:
          {
            apologise: 'Apologise publicly',
            transparent: 'Open the accounts',
            'open-gathering': 'Host an open gathering',
            'replace-deputy': 'Replace the second-in-command',
            rebrand: 'Rebrand the organisation',
            ignore: 'Ignore the criticism',
          }[id] +
          ' · ' +
          cultMoney(cult, cultRecoveryQuote(cult, id)),
      })),
      (id) => {
        if (id === 'rebrand') {
          setRebrand(true);
          setName(cult.name);
          return;
        }
        const action = id as
          | 'apologise'
          | 'transparent'
          | 'open-gathering'
          | 'replace-deputy'
          | 'ignore';
        review(
          {
            type: 'cult-recovery',
            cultId: cult.id,
            action,
            quotedCost: cultRecoveryQuote(cult, action),
          },
          'Respond to the criticism?',
          'Recovery is gradual over six months. Existing scandals and legal consequences remain.',
          'scandal',
          [costRow(cult, cultRecoveryQuote(cult, action))],
        );
      },
      'scandal',
    );
  }
  const beliefs = (
    <Card>
      <Heading size={18}>
        {cult ? 'Manage Beliefs' : 'Your organisation'}
      </Heading>
      {!cult && (
        <>
          <TextInput
            accessibilityLabel="Cult name"
            editable={!busy}
            maxLength={60}
            value={name}
            onChangeText={setName}
            placeholder="Name your organisation"
            placeholderTextColor={c.muted}
            style={field}
          />
          <Button
            label="Suggest a Name"
            tone="secondary"
            disabled={busy}
            onPress={() =>
              setName(
                cultRandomNames[
                  (name.length + world.revision) % cultRandomNames.length
                ],
              )
            }
          />
        </>
      )}
      <TextInput
        accessibilityLabel="Leader title"
        editable={!busy}
        maxLength={60}
        value={config.title}
        onChangeText={(title) => setConfig((value) => ({ ...value, title }))}
        style={field}
      />
      <ActionRow
        title="Choose Leader Title"
        value={config.title}
        onPress={titleOptions}
        disabled={busy}
      />
      <ActionRow
        title="Philosophy"
        value={
          cultPhilosophies.find((row) => row.id === config.philosophy)!.title
        }
        icon={<CultArt id="philosophy" size={36} />}
        onPress={choosePhilosophy}
        disabled={busy}
      />
      {(['doctrines', 'rules'] as const).map((kind) => (
        <React.Fragment key={kind}>
          <Heading size={17}>
            {kind === 'doctrines' ? 'Doctrines' : 'Rules'}
          </Heading>
          {config[kind].map((id, index) => (
            <ActionRow
              key={kind + index}
              title={
                (kind === 'doctrines' ? cultDoctrines : cultRules).find(
                  (row) => row.id === id,
                )!.title
              }
              icon={<CultArt id={kind} size={32} />}
              disabled={busy}
              onPress={() => chooseBelief(kind, index)}
            />
          ))}
          {cult && config[kind].length < 6 && (
            <Button
              label={kind === 'doctrines' ? 'Add Doctrine' : 'Add Rule'}
              tone="secondary"
              disabled={busy}
              onPress={() => addBelief(kind)}
            />
          )}{' '}
          {cult && config[kind].length > 2 && (
            <Button
              label={kind === 'doctrines' ? 'Remove Doctrine' : 'Remove Rule'}
              tone="secondary"
              disabled={busy}
              onPress={() =>
                dialog.select(
                  'Remove a ' + (kind === 'doctrines' ? 'doctrine' : 'rule'),
                  'Keep at least two.',
                  config[kind].map((id) => ({
                    id,
                    label: (kind === 'doctrines'
                      ? cultDoctrines
                      : cultRules
                    ).find((row) => row.id === id)!.title,
                  })),
                  (id) =>
                    setConfig((value) => ({
                      ...value,
                      [kind]: value[kind].filter((old) => old !== id),
                    })),
                  kind,
                )
              }
            />
          )}
        </React.Fragment>
      ))}
      {cult && (
        <>
          <Button
            label="Review Belief Changes"
            disabled={busy || !config.title.trim()}
            onPress={() =>
              review(
                {
                  type: 'cult-beliefs',
                  cultId: cult.id,
                  leaderTitle: config.title.trim(),
                  philosophy: config.philosophy,
                  doctrines: config.doctrines,
                  rules: config.rules,
                },
                'Change the organisation’s beliefs?',
                'Members notice changes. Previous promises and disputes remain on record.',
                'doctrines',
              )
            }
          />
          <Button
            label="Close Belief Editor"
            tone="secondary"
            onPress={() => setEditing(false)}
          />
        </>
      )}
    </Card>
  );
  const archived = world.cults.filter(
    (row) => row.founderId === world.activePersonId && row.status !== 'active',
  );
  return (
    <Page>
      <Header
        title="Cult Leader"
        onBack={() => router.back()}
        backDisabled={busy}
      />
      {error && !dialog.open && (
        <Text accessibilityRole="alert" style={{ color: c.red }}>
          {error}
        </Text>
      )}
      <Card style={cult ? { gap: 8 } : undefined}>
        {cult ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <CultArt size={48} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Heading size={20}>{cult.name}</Heading>
              <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18 }}>
                {cult.leaderTitle}
              </Text>
            </View>
          </View>
        ) : (
          <SocialBusinessIntro
            art={<CultArt size={78} />}
            title="Start something people will remember"
            eyebrow="Independent career"
            body="Choose what you believe, find your people and remember what you promised."
          />
        )}
        {cult && (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {[
                {
                  label: 'Followers',
                  value: cult.followers.toLocaleString('en-US'),
                },
                { label: 'Treasury', value: cultMoney(cult, cult.cash) },
              ].map((item) => (
                <View
                  key={item.label}
                  accessible
                  accessibilityLabel={item.label + ': ' + item.value}
                  style={{ flexGrow: 1, flexBasis: 100, minWidth: 0, gap: 2 }}
                >
                  <Text
                    style={{ color: c.muted, fontSize: 13, lineHeight: 18 }}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={{ color: c.ink, fontSize: 18, fontWeight: '700' }}
                  >
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18 }}>
              Headquarters:{' '}
              {
                cultHeadquarters.find((row) => row.id === cult.headquarters)!
                  .title
              }
            </Text>
            <StatBar label="Loyalty" value={cult.loyalty} color={c.blue} />
            <StatBar label="Public Heat" value={cult.heat} color={c.red} />
            <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18 }}>
              Capacity {cult.followers.toLocaleString('en-US')} /{' '}
              {cultCapacity(cult).toLocaleString('en-US')} · Satisfaction{' '}
              {cult.satisfaction}% · Reputation {cult.reputation}%
            </Text>
          </>
        )}
      </Card>
      {!cult ? (
        <>
          {beliefs}
          <Card>
            <Heading size={18}>Founding plans</Heading>
            <ActionRow
              title="Starting Headquarters"
              value={
                cultHeadquarters.find((row) => row.id === headquarters)!.title
              }
              icon={<CultArt id="headquarters" size={36} />}
              disabled={busy}
              onPress={() =>
                dialog.select(
                  'Starting headquarters',
                  'Choose a place you can afford. Running costs are paid from the communal treasury.',
                  cultHeadquarters.map((row) => ({
                    id: row.id,
                    label:
                      row.title +
                      ' · personal payment ' +
                      money(cultStartupQuote(world, row.id).total) +
                      ' · capacity ' +
                      row.capacity,
                    disabledReason: cultFoundingReason(world, row.id),
                  })),
                  (id) => setHeadquarters(id as Cult['headquarters']),
                  'headquarters',
                )
              }
            />
            <ActionRow
              title="Founding Strategy"
              value={
                {
                  announcement: 'Mysterious announcement',
                  social: 'Social media',
                  gathering: 'An opening gathering',
                }[method]
              }
              disabled={busy}
              onPress={() =>
                dialog.select(
                  'Founding strategy',
                  'Each begins with different follower numbers, loyalty and public attention.',
                  [
                    { id: 'announcement', label: 'A mysterious announcement' },
                    { id: 'social', label: 'Recruit through social media' },
                    { id: 'gathering', label: 'Hold an opening gathering' },
                  ],
                  (id) => setMethod(id as typeof method),
                  'recruitment',
                )
              }
            />
            <ActionRow
              title="Membership Fees"
              value={
                money(joining) + ' joining · ' + money(recurring) + ' monthly'
              }
              onPress={() => fees()}
              disabled={busy}
            />
            <SocialBusinessFacts
              items={[
                {
                  label: 'Headquarters',
                  value: money(cultStartupQuote(world, headquarters).premises),
                },
                {
                  label: 'Registration',
                  value: money(
                    cultStartupQuote(world, headquarters).registration,
                  ),
                },
                {
                  label: 'Starting reserve',
                  value: money(cultStartupQuote(world, headquarters).reserve),
                },
              ]}
            />
            {cultFoundingReason(world, headquarters) && (
              <Body muted>{cultFoundingReason(world, headquarters)}</Body>
            )}
            <Button
              label="Review Founding"
              disabled={
                busy ||
                !!cultFoundingReason(world, headquarters) ||
                !name.trim() ||
                !config.title.trim()
              }
              onPress={() =>
                review(
                  {
                    type: 'found-cult',
                    name: name.trim(),
                    leaderTitle: config.title.trim(),
                    philosophy: config.philosophy,
                    doctrines: config.doctrines,
                    rules: config.rules,
                    headquarters,
                    method,
                    joiningFee: joining,
                    recurringFee: recurring,
                    quotedCost: cultStartupQuote(world, headquarters).total,
                  },
                  'Found ' + name.trim() + '?',
                  'Your contribution and headquarters become communal property. Leadership is a full-time commitment. They are not personal assets or inheritance.',
                  'cult',
                  [
                    {
                      id: 'payment',
                      label: 'Your actual payment',
                      value: money(cultStartupQuote(world, headquarters).total),
                      tone: 'negative',
                    },
                  ],
                )
              }
            />
          </Card>
        </>
      ) : (
        <>
          <Card>
            <ActionRow
              title="Recruit Followers"
              subtitle="Choose a method and pay its actual cost"
              icon={<CultArt id="recruitment" />}
              disabled={busy}
              onPress={recruit}
            />
            <ActionRow
              title="Preach to Followers"
              subtitle={
                cultPhilosophies.find((row) => row.id === cult.philosophy)!
                  .title
              }
              icon={<CultArt id="philosophy" />}
              disabled={busy}
              onPress={() =>
                review(
                  { type: 'cult-preach', cultId: cult.id },
                  'Address your followers?',
                  'Speak about the group’s actual philosophy.',
                  'philosophy',
                )
              }
            />
            <ActionRow
              title="Hold Ceremony"
              subtitle="Gatherings with real costs and outcomes"
              icon={<CultArt id="ceremony" />}
              disabled={busy}
              onPress={ceremony}
            />
            <ActionRow
              title="Manage Beliefs"
              subtitle="Philosophy, doctrines, rules and leadership title"
              icon={<CultArt id="doctrines" />}
              disabled={busy}
              onPress={() => {
                setConfig({
                  title: cult.leaderTitle,
                  philosophy: cult.philosophy,
                  doctrines: [...cult.doctrines],
                  rules: [...cult.rules],
                });
                setEditing((value) => !value);
              }}
            />
            <ActionRow
              title="Make a Wild Claim"
              subtitle="Some promises return years later"
              icon={<CultArt id="claim" />}
              disabled={busy}
              onPress={wildClaim}
            />
            <ActionRow
              title="Manage Followers"
              subtitle="Your inner circle remembers your decisions"
              icon={<CultArt id="followers" />}
              disabled={busy}
              onPress={followers}
            />
            <ActionRow
              title="Manage Headquarters"
              subtitle="Capacity, upgrades and residents"
              icon={<CultArt id="headquarters" />}
              disabled={busy}
              onPress={() => router.push('/cult/headquarters')}
            />
            <ActionRow
              title="Treasury"
              subtitle="Fees, records, contributions and permitted payouts"
              icon={<CultArt id="treasury" />}
              disabled={busy}
              onPress={treasury}
            />
            <ActionRow
              title="Rival Organisations"
              subtitle={
                cult.rivals.filter((row) => row.status === 'active').length +
                ' active rivals'
              }
              icon={<CultArt id="rivalry" />}
              disabled={busy}
              onPress={rivalries}
            />
            <ActionRow
              title="Public Criticism"
              subtitle="Respond without erasing history"
              icon={<CultArt id="scandal" />}
              disabled={busy}
              onPress={recovery}
            />
          </Card>
          {editing && beliefs}
          {rebrand && (
            <Card>
              <Heading size={18}>A new name</Heading>
              <TextInput
                accessibilityLabel="New cult name"
                value={name}
                onChangeText={setName}
                editable={!busy}
                maxLength={60}
                style={field}
              />
              <Button
                label="Review Rebrand"
                disabled={busy || !name.trim() || name.trim() === cult.name}
                onPress={() =>
                  review(
                    {
                      type: 'cult-recovery',
                      cultId: cult.id,
                      action: 'rebrand',
                      name: name.trim(),
                      quotedCost: cultRecoveryQuote(cult, 'rebrand'),
                    },
                    'Change the name?',
                    'Claims, follower memories, scandals and legal cases keep their original identity.',
                    'scandal',
                    [costRow(cult, cultRecoveryQuote(cult, 'rebrand'))],
                  )
                }
              />
              <Button
                label="Cancel Rebrand"
                tone="secondary"
                onPress={() => setRebrand(false)}
              />
            </Card>
          )}
          <Card>
            <ActionRow
              title="Disband Cult"
              subtitle="Settle communal funds and preserve the history"
              disabled={busy}
              onPress={() =>
                review(
                  { type: 'cult-disband', cultId: cult.id },
                  'Disband ' + cult.name + '?',
                  'Communal funds settle bills and go to the community. You do not receive them as a personal payout. Followers and history remain.',
                  'cult',
                )
              }
            />
          </Card>
        </>
      )}
      {archived.length > 0 && (
        <Card>
          <Heading size={18}>Past organisations</Heading>
          {archived.map((row) => (
            <ActionRow
              key={row.id}
              title={row.name}
              subtitle={
                row.status +
                ' · ' +
                row.followers +
                ' final followers · ' +
                row.ended?.year
              }
              onPress={() =>
                dialog.info(
                  row.name,
                  row.status +
                    ' · founded ' +
                    row.started.year +
                    ' · ended ' +
                    row.ended?.year +
                    '\n' +
                    row.report.events.slice(-4).join('\n'),
                  [
                    {
                      id: 'income',
                      label: 'Lifetime revenue',
                      value: cultMoney(row, row.income),
                      tone: 'neutral',
                    },
                    {
                      id: 'payouts',
                      label: 'Recorded leader payouts',
                      value: cultMoney(row, row.payouts),
                      tone: 'neutral',
                    },
                  ],
                  'cult',
                )
              }
            />
          ))}
        </Card>
      )}
      {dialog.modal}
    </Page>
  );
}
