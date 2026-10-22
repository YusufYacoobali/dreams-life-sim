import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { ageOn, fullName } from '../../src/game/personHelpers';
import { campusClubReason, campusCourse, campusIntroductionReason, campusReason, currentCampus } from '../../src/game/systems/campus';
import { campusClubs, type CampusClub, type CampusCommand } from '../../src/game/systems/campusSchemas';
import { skillContent } from '../../src/game/content/careers';
import { SchoolArt } from '../../src/assets/SchoolArt';
import { ActionRow, Body, Button, Card, Header, Heading, Page, Portrait } from '../../src/ui/components';
import { EventModal, type EventPresentation } from '../../src/ui/EventModal';
import { SocialBusinessFacts, SocialBusinessIntro } from '../../src/ui/SocialBusinessPresentation';
import { useColors } from '../../src/ui/theme';

const clubs = {
  none: { label: 'No Club', body: 'Keep your timetable free of campus club practice.', skill: null },
  sport: { label: 'Sports Club', body: 'Practise athletics during attended study months.', skill: 'sport' },
  music: { label: 'Music Club', body: 'Make time for music during attended study months.', skill: 'music' },
  drama: { label: 'Drama Club', body: 'Practise acting during attended study months.', skill: 'acting' },
  science: { label: 'Science Club', body: 'Develop your science skill during attended study months.', skill: 'science' },
} as const;
type Review = { identity: string; command: CampusCommand; event: EventPresentation };
const dateLabel = (date: { year: number; month: number; day: number }) => date.year + '-' + String(date.month).padStart(2, '0') + '-' + String(date.day).padStart(2, '0');

export default function Campus() {
  const identity = useGame(s => s.world ? JSON.stringify([s.world.id, s.world.activePersonId]) : 'none');
  return <CampusDetails key={identity} />;
}

function CampusDetails() {
  const world = useGame(s => s.world)!, busy = useGame(s => s.busy), error = useGame(s => s.error), dispatch = useGame(s => s.dispatch), c = useColors();
  const person = world.people[world.activePersonId], course = world.studyCourses.find(item => item.personId === person.id && item.status === 'active');
  const availableCourse = campusCourse(world), community = currentCampus(world), reason = campusReason(world), introductionReason = campusIntroductionReason(world, course?.id);
  const identity = JSON.stringify([world.id, person.id, course?.id ?? null, community?.id ?? null]);
  const identityRef = useRef(identity), mounted = useRef(true), submitting = useRef(false), reviewRef = useRef<Review | null>(null);
  identityRef.current = identity;
  if (reviewRef.current && reviewRef.current.identity !== identity) reviewRef.current = null;
  const [review, setReview] = useState<Review | null>(null), [draft, setDraft] = useState<{ identity: string; club: CampusClub } | null>(null);
  const [shown, setShown] = useState<{ identity: string; count: number } | null>(null);
  const current = review?.identity === identity && reviewRef.current === review ? review : null;
  const selected = draft?.identity === identity ? draft.club : community?.club ?? 'none';
  const clubReason = community ? campusClubReason(world, community.id, selected) : undefined;
  const shownCount = shown?.identity === identity ? shown.count : 6;
  const earlier = world.campusCommunities.filter(item => item.personId === person.id && item.id !== community?.id).slice().reverse();
  const canAct = () => mounted.current && identityRef.current === identity && !busy && !submitting.current;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; reviewRef.current = null; }; }, []);
  useEffect(() => { setReview(saved => saved?.identity === identity ? saved : null); }, [identity]);
  const open = (command: CampusCommand, event: EventPresentation) => {
    if (!canAct()) return;
    const next = { identity, command, event }; reviewRef.current = next; setReview(next);
  };
  const selectClub = (club: CampusClub) => {
    if (!canAct() || !community || club !== community.club && campusClubReason(world, community.id, club)) return;
    reviewRef.current = null; setReview(null); setDraft({ identity, club });
  };
  const openPerson = (id: string) => {
    if (!canAct()) return;
    reviewRef.current = null; setReview(null);
    router.push({ pathname: '/person/[id]', params: { id, tab: 'activities' } });
  };
  const reviewClub = () => {
    if (!canAct() || !community || !course || clubReason) return;
    const choice = clubs[selected], skill = choice.skill && skillContent[choice.skill].title;
    open({ type: 'campus-club', communityId: community.id, club: selected }, {
      id: identity + ':club:' + selected, kind: 'confirmation', title: selected === 'none' ? 'Leave your campus club?' : 'Join the ' + choice.label + '?',
      body: selected === 'none' ? 'Future campus club practice stops. Your learned skills and attended club history stay yours.' : 'Join the ' + choice.label + ' while you study at ' + course.school + '. This free routine begins with your next attended study month.',
      illustration: <SchoolArt id="project" size={64} />,
      terms: [
        { id: 'course', label: 'Current course', value: course.school + ' · ' + course.field, tone: 'neutral' },
        { id: 'club', label: 'Club', value: choice.label, tone: 'neutral' },
        { id: 'fee', label: 'Club fee', value: 'Free', tone: 'neutral' },
        ...(skill ? [{ id: 'skill', label: 'Per attended study month', value: 'Up to +1 ' + skill, tone: 'neutral' as const }, { id: 'energy', label: 'Energy used', value: 'Up to 2 per attended study month', tone: 'neutral' as const }] : []),
      ], confirmLabel: selected === 'none' ? 'Leave Club' : 'Join Club',
    });
  };
  return <Page>
    <Header title="Campus Life" backDisabled={busy} onBack={() => {
      if (!canAct()) return;
      reviewRef.current = null; setReview(null); router.back();
    }} />
    <Card>
      <SocialBusinessIntro art={<SchoolArt id="study" size={76} />} title={course?.school ?? 'Your Campus Connections'} eyebrow={course ? course.field : 'Study and social life'} body={course ? 'Meet fellow students and make space for a club alongside your studies.' : 'Attend a university, trade or professional course to meet fellow students. Earlier introductions remain in your history.'} />
      {course && <SocialBusinessFacts items={[
        { label: 'Course status', value: person.education.paused ? 'Paused' : 'Enrolled', note: course.field },
        { label: 'Recorded study', value: course.months + ' of ' + course.requiredMonths + ' months' },
      ]} />}
      {reason && <Body muted>{reason}</Body>}
    </Card>
    {!community && <Card>
      <Heading size={20}>Meet Fellow Students</Heading>
      <Body>Meet two adult students starting the same programme today. Your relationships can grow through later interactions.</Body>
      <Body muted>Introductions are free and available once per course.</Body>
      {introductionReason && introductionReason !== reason && <Body muted>{introductionReason}</Body>}
      <Button label="Meet Fellow Students" disabled={busy || !availableCourse || !!introductionReason} onPress={() => {
        if (!canAct() || !availableCourse || introductionReason) return;
        open({ type: 'meet-campus', courseId: availableCourse.id }, {
          id: identity + ':meet', kind: 'confirmation', title: 'Meet fellow students?',
          body: 'Meet two adult students starting the same programme today at ' + availableCourse.school + '. They will appear in Relationships, where you can get to know them.',
          illustration: <SchoolArt id="project" size={64} />,
          terms: [{ id: 'school', label: 'School', value: availableCourse.school, tone: 'neutral' }, { id: 'course', label: 'Subject', value: availableCourse.field, tone: 'neutral' }, { id: 'fee', label: 'Introductions', value: 'Free · once per course', tone: 'neutral' }],
          confirmLabel: 'Meet Students',
        });
      }} />
    </Card>}
    {community && <>
      <Card>
        <Heading size={20}>People You Met</Heading>
        <Body muted>Introduced {dateLabel(community.started)}. Open a person to view your connection and their profile.</Body>
        {community.students.map(student => {
          const contact = world.people[student.personId];
          return <ActionRow key={contact.id} title={fullName(contact)} subtitle={contact.died ? 'Died in ' + contact.died.year : 'Age ' + ageOn(contact, world.date) + ' · Campus introduction'} icon={<Portrait personId={contact.id} appearance={contact.appearance} age={ageOn(contact, world.date)} name={fullName(contact)} size={48} />} disabled={busy} onPress={() => openPerson(contact.id)} />;
        })}
      </Card>
      <Card>
        <Heading size={20}>Campus Clubs</Heading>
        <SocialBusinessFacts items={[{ label: 'Current club', value: clubs[community.club].label }, { label: 'Club fee', value: 'Free' }]} />
        <Body muted>Choose a club, then review the change. Your current routine stays in place until you confirm.</Body>
        <View accessibilityRole="radiogroup" accessibilityLabel="Campus club" style={{ gap: 4 }}>
          {campusClubs.map(club => <ActionRow key={club} title={clubs[club].label} subtitle={clubs[club].body} accessibilityRole="radio" accessibilityState={{ checked: selected === club }} disabled={busy} disabledReason={club === community.club ? undefined : campusClubReason(world, community.id, club)} onPress={() => selectClub(club)} />)}
        </View>
        {selected !== 'none' && <Body muted>During each new attended study month: up to +1 {skillContent[clubs[selected].skill].title}, using up to 2 Energy.</Body>}
        {clubReason && <Body muted>{clubReason}</Body>}
        <Button label="Review Club" disabled={busy || !!clubReason} onPress={reviewClub} />
      </Card>
      <Card>
        <Heading size={20}>Attended Campus Months</Heading>
        {!community.periods.length && <Body muted>No campus months recorded since your introductions yet.</Body>}
        {[...community.periods].reverse().slice(0, shownCount).map(period => <View key={period.month} style={{ gap: 4, borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 12 }}>
          <Heading size={17}>{Math.floor(period.month / 12)}-{String(period.month % 12 + 1).padStart(2, '0')} · {clubs[period.club].label}</Heading>
          <Body muted>Study month {period.studyMonth}</Body>
          {period.club !== 'none' && <Body>+{period.skillGain} {skillContent[clubs[period.club].skill].title} · {period.energyBefore - period.energyAfter} Energy used</Body>}
        </View>)}
        {community.periods.length > shownCount && <Button label="Show Earlier Campus Months" tone="secondary" disabled={busy} onPress={() => { if (canAct()) setShown({ identity, count: shownCount + 6 }); }} />}
      </Card>
    </>}
    {!!earlier.length && <Card>
      <Heading size={20}>Earlier Campus Connections</Heading>
      {earlier.map(item => {
        const pastCourse = world.studyCourses.find(study => study.id === item.courseId);
        return <View key={item.id} style={{ gap: 6, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.line }}>
          <Heading size={18}>{pastCourse?.school ?? 'Earlier course'}</Heading>
          <Body muted>{pastCourse?.field} · Introduced {dateLabel(item.started)} · {item.periods.length} recorded campus months</Body>
          {item.students.map(student => {
            const contact = world.people[student.personId];
            return <ActionRow key={contact.id} title={fullName(contact)} subtitle={contact.died ? 'Died in ' + contact.died.year : 'Earlier campus introduction'} disabled={busy} onPress={() => openPerson(contact.id)} />;
          })}
        </View>;
      })}
    </Card>}
    {error && !current && !world.pending && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text>}
    <EventModal event={current?.event ?? null} busy={busy} error={error} onCancel={() => {
      if (!canAct() || !current || reviewRef.current !== current) return;
      reviewRef.current = null; setReview(saved => saved === current ? null : saved);
    }} onChoose={async () => {
      if (!canAct() || !current || reviewRef.current !== current || identityRef.current !== current.identity) return;
      submitting.current = true;
      try {
        if (await dispatch(current.command) && mounted.current && identityRef.current === current.identity && reviewRef.current === current) {
          reviewRef.current = null; setReview(saved => saved === current ? null : saved);
        }
      } finally { submitting.current = false; }
    }} />
  </Page>;
}
