import React, { useState } from 'react';
import type { World } from '../game/model';
import { fullName } from '../game/personHelpers';
import { countries } from '../game/countries';
import { formatMoney } from '../game/money';
import { licenceFee, licenceQuiz, licenceReason, hasLicence } from '../game/systems/vehicleLicences';
import { vehicleActivityCost, vehicleActivityReason, vehicleTripDistance, type vehicleActivities } from '../game/systems/vehicleActivities';
import { lifestyleReason, localContactReason } from '../game/systems/lifestyleCommon';
import { CatalogArt } from '../assets/CatalogArt';
import { FameBusinessArt } from '../assets/FameBusinessArt';
import { JobArt } from '../assets/JobArt';
import { PersonActionArt } from '../assets/PersonActionArt';
import { SimpleSymbolArt } from '../assets/SimpleSymbolArt';
import { ActionRow, Body, Card, Heading } from './components';
import { useLifestyleReview } from './LifestyleReview';
import { useScopedGameAction } from './useScopedGameAction';
import { useLifestyleWorld } from './useLifestyleWorld';
import { EventModal } from './EventModal';
import { PersonPicker } from './PersonPicker';

type Activity = typeof vehicleActivities[number];
type Trip = 'drive' | 'road-trip' | 'gift';
export function LicenceControls() {
  const world = useLifestyleWorld()!, { busy, error, dispatch, clear } = useScopedGameAction('driving-test');
  const identity = world.id + ':' + world.activePersonId;
  const [quiz, setQuiz] = useState<{ identity: string; step: number; answers: number[] } | null>(null);
  const current = quiz?.identity === identity ? quiz : null;
  const fee = licenceFee(world, 'road'), money = formatMoney({ minor: fee, currency: countries[world.people[world.activePersonId].country].currency });
  const reason = lifestyleReason(world, false) ?? licenceReason(world, 'road');
  const attempts = world.lifestyle?.licences.filter(row => row.personId === world.activePersonId && row.kind === 'road') ?? [];
  return <><Card>
    <ActionRow title="Driving Licence" subtitle={hasLicence(world, 'road') ? 'Your saved driving licence' : 'Three questions'} value={hasLicence(world, 'road') ? 'Passed' : money} icon={<CatalogArt id="city-car" size={40} />} disabled={busy || hasLicence(world, 'road')} disabledReason={hasLicence(world, 'road') ? undefined : reason} onPress={() => { clear(); setQuiz({ identity, step: 0, answers: [] }); }} />
    {attempts.slice(-1).map(row => <Body key={row.id} muted>{row.score}/3 · {row.passed ? 'Passed' : 'Try again next month'}</Body>)}
  </Card><EventModal event={current ? { id: 'road-test:' + identity + ':' + current.step, kind: 'selection', illustration: <CatalogArt id="city-car" size={64} />, title: 'Driving Test · ' + (current.step + 1) + ' of 3', body: licenceQuiz.road[current.step].prompt + (current.step === 2 ? '\nTest fee: ' + money + '. You need 3/3 to pass.' : ''), choices: licenceQuiz.road[current.step].answers.map((label, id) => ({ id: String(id), label })), confirmLabel: current.step === 2 ? 'Submit Driving Test' : 'Next' } : null}
    busy={busy} error={error} onCancel={() => { if (!busy) { setQuiz(null); clear(); } }} onChoose={async id => {
      if (!current || busy || current.identity !== identity) return;
      const answer = Number(id); if (!Number.isInteger(answer) || answer < 0 || answer > 2) return;
      const answers = [...current.answers.slice(0, current.step), answer];
      if (current.step < 2) { setQuiz({ ...current, answers, step: current.step + 1 }); return; }
      setQuiz({ ...current, answers });
      if (await dispatch({ type: 'take-licence-test', kind: 'road', answers, quotedFee: fee })) setQuiz(null);
    }} /></>;
}

const activityNames: Record<Activity, string> = { drive: 'Go for a Drive', 'road-trip': 'Take a Road Trip', service: 'Service Vehicle', repair: 'Repair Vehicle', customise: 'Customise Appearance', brakes: 'Upgrade Brakes', suspension: 'Upgrade Suspension', navigation: 'Upgrade Navigation', gift: 'Gift This Vehicle', scrap: 'Scrap This Vehicle' };
const groups = [
  { id: 'driving', title: 'Driving & Trips', icon: 'vehicle', actions: ['drive', 'road-trip'] },
  { id: 'care', title: 'Care & Maintenance', icon: 'care', actions: ['service', 'repair'] },
  { id: 'upgrades', title: 'Upgrades', icon: 'upgrades', actions: ['customise', 'brakes', 'suspension', 'navigation'] },
  { id: 'ownership', title: 'Ownership', icon: 'ownership', actions: ['gift', 'scrap'] },
] as const;
export function VehicleLifestyle({ asset: savedAsset, ownershipActions }: { asset: World['assets'][number]; ownershipActions?: React.ReactNode }) {
  const world = useLifestyleWorld()!, { ask, modal, busy } = useLifestyleReview('vehicle:' + savedAsset.id);
  const [section, setSection] = useState<typeof groups[number]['id'] | null>(null), [invite, setInvite] = useState<Trip | null>(null);
  const asset = world.assets.find(row => row.id === savedAsset.id) ?? savedAsset;
  if (asset.stolen?.status === 'held' || !asset.vehicleLife) return null;
  const life = asset.vehicleLife, money = (minor: bigint) => formatMoney({ minor, currency: asset.currency });
  const art = (id: typeof groups[number]['icon']) => id === 'vehicle' ? <CatalogArt id={asset.catalogId} size={40} /> : id === 'ownership' ? <FameBusinessArt id="contract" size={40} /> : <JobArt id={id === 'care' ? 'mechanic' : 'engineer'} size={40} />;
  const activityArt = (activity: Activity) => activity === 'gift' ? <PersonActionArt id="request-gift" /> : activity === 'customise' ? <JobArt id="designer" /> : activity === 'road-trip' ? <SimpleSymbolArt id="suitcase" /> : activity === 'drive' ? art('vehicle') : ['service', 'repair', 'scrap'].includes(activity) ? art('care') : art('upgrades');
  const action = (activity: Activity, contactId: string | null = null) => ask({ type: 'vehicle-activity', assetId: asset.id, activity, contactId, quotedCost: vehicleActivityCost(world, asset, activity) }, activityNames[activity],
    activity === 'drive' || activity === 'road-trip' ? (contactId ? 'Invite ' + fullName(world.people[contactId]) + ' for a trip. A declined invitation costs nothing.' : activity === 'road-trip' ? 'Take a return road trip.' : 'Take a local return trip.')
      : activity === 'gift' ? 'Ownership and future costs transfer if your contact accepts.' : activity === 'scrap' ? 'Give up this damaged vehicle for its salvage value.' : 'Pay for this work on your vehicle.',
    [{ id: 'cost', label: 'Cost', value: money(vehicleActivityCost(world, asset, activity)), tone: 'negative' }, ...((activity === 'drive' || activity === 'road-trip') ? [{ id: 'distance', label: 'Distance', value: vehicleTripDistance(asset, activity) + ' miles', tone: 'neutral' as const }] : [])], <CatalogArt id={asset.catalogId} size={64} />);
  const contactIds = world.relationships.filter(edge => edge.from === world.activePersonId || edge.to === world.activePersonId).map(edge => edge.from === world.activePersonId ? edge.to : edge.from);
  return <><Card><Heading size={18}>Your Vehicle</Heading><Body>{life.mileage.toLocaleString()} miles · {life.appearance} finish</Body>
    {life.upgrades.length > 0 && <Body muted>Fitted: {life.upgrades.map(id => id.charAt(0).toUpperCase() + id.slice(1)).join(', ')}</Body>}
    {groups.map(group => <ActionRow key={group.id} title={group.title} icon={art(group.icon)} accessibilityState={{ expanded: section === group.id }} onPress={() => setSection(section === group.id ? null : group.id)} />)}
  </Card>{groups.filter(group => group.id === section).map(group => <Card key={group.id}><Heading size={18}>{group.title}</Heading>{group.id === 'ownership' && ownershipActions}
    {group.actions.filter(activity => activity !== 'scrap' || asset.condition <= 30).filter(activity => !['brakes', 'suspension', 'navigation'].includes(activity) || !life.upgrades.includes(activity as 'brakes' | 'suspension' | 'navigation')).map(activity => <ActionRow key={activity} title={activityNames[activity]} icon={activityArt(activity)} value={activity === 'gift' ? undefined : money(vehicleActivityCost(world, asset, activity))} disabled={busy} disabledReason={activity === 'gift' ? lifestyleReason(world) : vehicleActivityReason(world, asset, activity)} onPress={() => activity === 'gift' ? setInvite('gift') : action(activity)} />)}
    {group.id === 'driving' && <><ActionRow title="Invite Someone for a Drive" icon={<PersonActionArt id="ask-activity" />} disabled={busy} onPress={() => setInvite('drive')} /><ActionRow title="Invite Someone on a Road Trip" icon={<SimpleSymbolArt id="suitcase" />} disabled={busy} onPress={() => setInvite('road-trip')} /></>}
  </Card>)}
    {invite && <PersonPicker world={world} title={invite === 'gift' ? 'Give Your Vehicle' : 'Choose a Passenger'} personIds={contactIds} busy={busy} eligibility={id => localContactReason(world, id, invite !== 'gift') ?? vehicleActivityReason(world, asset, invite, id)} onCancel={() => setInvite(null)} onChoose={id => { const activity = invite; setInvite(null); action(activity, id); }} />}
    {world.lifestyle!.records.filter(row => row.subjectId === asset.id && row.kind.startsWith('vehicle-')).slice(-3).reverse().map(row => <Card key={row.id}><Body muted>{row.date.year} · {row.body}</Body></Card>)}{modal}</>;
}
