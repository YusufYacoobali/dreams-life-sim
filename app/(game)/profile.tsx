import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Redirect, router, type Href } from 'expo-router';
import { rentalResidence } from '../../src/game/systems/rentalSchemas';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName, type World } from '../../src/game/model';
import { countries } from '../../src/game/countries';
import { jobs } from '../../src/game/content/jobs';
import { creatorCatalog } from '../../src/game/content/creators';
import { serviceCatalog } from '../../src/game/content/services';
import { childrenOf } from '../../src/game/systems/family';
import { otherPerson, partnerRelation } from '../../src/game/systems/relationships';
import { activeSentence, isConfined } from '../../src/game/systems/legalSchemas';
import { publicRoyalDuty } from '../../src/game/systems/royaltySchemas';
import { royalTitle } from '../../src/game/systems/royaltyMath';
import { serviceCareer, serviceQualified } from '../../src/game/systems/serviceSchemas';
import { fullTimeCreator } from '../../src/game/systems/creatorSchemas';
import { fameLevel } from '../../src/game/systems/social';
import { netWorth } from '../../src/game/valuation';
import { formatMoney } from '../../src/game/money';
import { rules } from '../../src/game/rules';
import { ActionRow, Body, Button, Card, Header, Heading, Page, Portrait, StatBar } from '../../src/ui/components';
import { FamilyPreferences } from '../../src/ui/FamilyPreferences';
import { countryFlags, nationalityLabels } from '../../src/ui/CreationElements';
import { useColors } from '../../src/ui/theme';
import { Illustration } from '../../src/assets/Illustration';
import { FamilyArt } from '../../src/assets/FamilyArt';
import { FameBusinessArt } from '../../src/assets/FameBusinessArt';
import { GodModeShortcut } from '../../src/ui/GodModeAccess';
import { FinanceArt } from '../../src/assets/FinanceArt';
import { EmploymentArt } from '../../src/assets/EmploymentArt';

function occupation(world: World): { label: string; href: Href } {
  const person = world.people[world.activePersonId];
  if (activeSentence(world)) return { label: 'Prisoner', href: '/prison' };
  if (isConfined(world)) return { label: 'Held on remand', href: '/prison' };
  if (person.legal.wanted) return { label: 'Fugitive', href: '/criminal-record' };
  if (world.businesses.some(item => item.ownerId === person.id && item.status === 'active') && ageOn(person, world.date) >= 18) return { label: 'Business Owner', href: '/business' };
  if (world.musicReleases.some(item => item.personId === person.id && ['recording', 'paused'].includes(item.status))) return { label: 'Musician', href: '/music-studio' };
  if (world.elections.some(item => item.status === 'campaign' && item.candidates.some(candidate => candidate.personId === person.id && candidate.status === 'active'))) return { label: 'Political Candidate', href: '/politics' };
  const royal = publicRoyalDuty(world);
  if (royal) return { label: royalTitle(world, royal.house, person.id), href: '/royalty' };
  const service = serviceCareer(world);
  if (service) return { label: serviceCatalog[service.kind].title + (serviceQualified(service) ? '' : ' Trainee'), href: { pathname: '/service/[kind]', params: { kind: service.kind } } };
  const creator = fullTimeCreator(world);
  if (creator) return { label: creatorCatalog[creator.kind].title, href: { pathname: '/creator-studio/[kind]', params: { kind: creator.kind } } };
  if (person.employment) {
    const career = world.careers.find(item => item.personId === person.id && item.status === 'active');
    return { label: jobs.find(role => role.id === person.employment!.roleId)!.title, href: career ? { pathname: '/career/[kind]', params: { kind: career.kind } } : '/work' };
  }
  if (person.education.stage !== 'none') return { label: 'Student', href: ['primary', 'secondary'].includes(person.education.stage) ? '/school' : '/education' };
  return { label: ageOn(person, world.date) === 0 ? 'Newborn' : ageOn(person, world.date) < 18 ? 'Child' : person.finance.pensionAnnual > 0n ? 'Retired' : 'Unemployed', href: '/work' };
}

function educationLabel(world: World) {
  const education = world.people[world.activePersonId].education;
  if (education.stage !== 'none') return ({ primary: 'Primary school', secondary: 'Secondary school', trade: 'Trade school', university: 'University', graduate: 'Professional study' }[education.stage]) + (education.paused ? ' · Paused' : '');
  const qualification = education.qualifications.at(-1);
  return qualification ? ({ secondary: 'Secondary qualification', trade: 'Trade qualification', degree: 'Degree', medicine: 'Medical qualification', law: 'Law qualification' }[qualification.level]) : 'No completed qualifications';
}

export default function Profile() {
  const identity = useGame(state => state.world ? state.world.id + ':' + state.world.activePersonId : null);
  return identity ? <ProfileDetails key={identity} /> : <Redirect href="/" />;
}

function ProfileDetails() {
  const world = useGame(s => s.world)!, player = world.people[world.activePersonId], residence = rentalResidence(world);
  const dispatch = useGame(s => s.dispatch), busy = useGame(s => s.busy), error = useGame(s => s.error), c = useColors();
  const [preferences, setPreferences] = useState(() => ({ attractedTo: [...player.attractedTo], wantsChildren: player.wantsChildren })), [attempted, setAttempted] = useState(false);
  const changed = preferences.wantsChildren !== player.wantsChildren || preferences.attractedTo.length !== player.attractedTo.length || preferences.attractedTo.some(gender => !player.attractedTo.includes(gender));
  const work = occupation(world), education = player.education, qualification = education.qualifications.at(-1), children = childrenOf(world), partner = partnerRelation(world), lastMarriage = world.marriages.filter(item => item.a === player.id || item.b === player.id).at(-1);
  const maritalStatus = partner ? partner.romance === 'married' ? 'Married' : partner.romance === 'engaged' ? 'Engaged' : 'In a relationship' : lastMarriage?.endReason === 'death' ? 'Widowed' : lastMarriage?.endReason === 'divorce' ? 'Divorced' : 'Single';
  const schoolRoute = ['primary', 'secondary'].includes(education.stage) ? '/school' : '/education';
  return <Page><Header title="My Life" onBack={() => router.back()} /><GodModeShortcut />
    <Card><View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}><Portrait decorative name={fullName(player)} personId={player.id} appearance={player.appearance} age={ageOn(player, world.date)} size={88} /><View style={{ flex: 1, minWidth: 0, gap: 4 }}><Heading size={21}>{fullName(player)}</Heading><Body muted>{countryFlags[player.nationality]} {nationalityLabels[player.nationality]}</Body><Body>Age {ageOn(player, world.date)}</Body><Body muted>Born {player.born.year}-{String(player.born.month).padStart(2, '0')}-{String(player.born.day).padStart(2, '0')}</Body></View></View>
      <Body muted>{player.gender === 'nonbinary' ? 'Non-binary' : player.gender === 'male' ? 'Male' : 'Female'} · {player.traits.join(', ')}</Body>
    </Card>
    <Card style={{ gap: 0 }}>
      <ActionRow title="Education" value={educationLabel(world)} subtitle={education.stage !== 'none' ? education.school ?? undefined : qualification ? 'Latest qualification · ' + qualification.field : undefined} icon={<Illustration id="education" />} onPress={() => router.push(schoolRoute)} />
      <ActionRow title="Occupation" value={work.label} subtitle={player.employment?.employer} icon={<EmploymentArt roleId={player.employment?.roleId} />} onPress={() => router.push(work.href)} />
      <ActionRow title="Net Worth" value={formatMoney(netWorth(world), countries[player.country].locale)} icon={<FinanceArt id="net-worth" />} onPress={() => router.push('/assets')} />
      <ActionRow title="Residence" value={residence ? residence.name + ' (rented)' : player.city + ', ' + countries[player.country].name} icon={<Illustration id="property" />} onPress={() => router.push('/household')} />
      <ActionRow title="Marital Status" value={maritalStatus} subtitle={partner ? fullName(otherPerson(world, partner)) : undefined} icon={<FamilyArt id="hearts" size={40} />} onPress={() => router.push(partner ? { pathname: '/person/[id]', params: { id: otherPerson(world, partner).id } } : '/relationships')} />
      <ActionRow title="Children" value={children.length ? String(children.length) : 'None'} subtitle={children.some(child => child.died) ? children.filter(child => !child.died).length + ' living' : undefined} icon={<FamilyArt id="carriage" size={40} />} onPress={() => router.push('/family')} />
      <ActionRow title="Reputation" value={'Respect ' + player.stats.respect + '%'} subtitle={fameLevel(player.stats.fame) + ' · Public image ' + player.publicLife.image + '%'} icon={<FameBusinessArt id="fame" size={40} />} onPress={() => router.push('/fame')} />
    </Card>
    <Card><Heading size={18}>Core stats</Heading>
      <StatBar label="Happiness" value={player.stats.happiness} color={c.green} /><StatBar label="Health" value={player.stats.health} color={c.teal} /><StatBar label="Smarts" value={player.stats.smarts} color={c.blue} /><StatBar label="Looks" value={player.stats.looks} color={c.purple} /><StatBar label="Respect" value={player.stats.respect} color={c.amber} />
    </Card>
    <Card><Heading size={18}>Wellbeing & public life</Heading><StatBar label="Energy" value={player.stats.energy} color={c.blue} /><StatBar label="Fitness" value={player.stats.fitness} color={c.teal} /><StatBar label="Stress" value={player.stats.stress} color={c.red} /><StatBar label="Discipline" value={player.stats.discipline} color={c.purple} /><StatBar label="Fame" value={player.stats.fame} color={c.green} /></Card>
    {ageOn(player, world.date) >= rules[player.country].adultAge && <Card><Heading size={18}>Dating & family preferences</Heading><FamilyPreferences {...preferences} disabled={busy} onChange={next => { if (!busy) { setPreferences(next); setAttempted(false); } }} />{attempted && error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text>}{!changed && <Body muted>Your preferences are up to date.</Body>}<Button label="Save Preferences" busy={busy} disabled={!changed} onPress={async () => { if (busy || !changed) return; setAttempted(true); if (await dispatch({ type: 'relationship-preferences', attractedTo: [...preferences.attractedTo], wantsChildren: preferences.wantsChildren })) setAttempted(false); }} /></Card>}
  </Page>;
}
