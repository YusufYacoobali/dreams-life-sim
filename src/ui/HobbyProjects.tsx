import React, { useState } from 'react';
import { TextInput } from 'react-native';
import type { HobbyKind } from '../game/content/leisure';
import { activeHobbyPlan, personHobbies } from '../game/systems/leisureSchemas';
import { projectEnergy, projectWorkReason } from '../game/systems/hobbyAccomplishments';
import { hobbyPauseReason } from '../game/systems/leisure';
import { lifestyleReason } from '../game/systems/lifestyleCommon';
import { HobbyArt } from '../assets/HobbyArt';
import { ActionRow, Body, Button, Card, Heading, StatBar } from './components';
import { useLifestyleReview } from './LifestyleReview';
import { useLifestyleWorld } from './useLifestyleWorld';
import { useColors } from './theme';

export function HobbyProjects({ kind }: { kind: HobbyKind }) {
  const world = useLifestyleWorld()!, c = useColors(), { ask, modal, busy } = useLifestyleReview('projects:' + kind);
  const [title, setTitle] = useState(''), [historyLimit, setHistoryLimit] = useState(0);
  const profile = personHobbies(world).find(row => row.kind === kind);
  const projects = world.lifestyle?.projects.filter(row => row.personId === world.activePersonId && row.hobbyId === profile?.id) ?? [];
  const current = projects.find(row => !row.completed), completed = projects.filter(row => row.completed).reverse();
  const startReason = lifestyleReason(world, false, 0) ?? (!profile || !activeHobbyPlan(profile) ? 'Arrange a current routine first' : hobbyPauseReason(world, profile, activeHobbyPlan(profile)!, true) ? 'Choose an available current hobby routine' : profile.proficiency < 20 ? 'Build 20 proficiency to start a project' : (world.lifestyle?.projects.length ?? 0) >= 512 ? 'Your project history is full' : undefined);
  const workReason = current ? projectWorkReason(world, current.id) : undefined;
  return <Card><Heading size={18}>Personal Projects</Heading>
    {current ? <><Heading size={17}>{current.title}</Heading><StatBar label="Project progress" value={current.progress * 25} color={c.green} /><Body>{current.progress}/4 parts complete</Body><Body muted>{workReason ?? 'Your later practice is ready to use.'}</Body>
      <ActionRow title="Work on This Project" icon={<HobbyArt kind={kind} />} subtitle={projectEnergy(world, kind) + ' energy'} disabled={busy} disabledReason={workReason} onPress={() => {
        if (!projectWorkReason(world, current.id)) ask({ type: 'work-hobby-project', projectId: current.id }, 'Work on “' + current.title + '”?', 'Bring your practice back to your project.', [{ id: 'energy', label: 'Energy', value: String(projectEnergy(world, kind)), tone: 'neutral' }], <HobbyArt kind={kind} size={64} />);
      }} /></> : <><Body muted>{startReason ?? 'Give your next project a title. Later attended practice builds four parts towards completion.'}</Body><TextInput accessibilityLabel="Personal project title" value={title} maxLength={70} editable={!busy && !startReason} onChangeText={setTitle} placeholder="Project title" placeholderTextColor={c.muted} style={{ color: c.ink, backgroundColor: c.inset, borderRadius: 10, padding: 14, fontSize: 16 }} /><Button label="Review New Project" disabled={busy || !!startReason || !title.trim() || /[\u0000-\u001f]/.test(title)} onPress={() => {
        if (profile && !startReason && title.trim()) ask({ type: 'start-hobby-project', hobbyId: profile.id, title: title.trim() }, 'Start “' + title.trim() + '”?', 'Make something of your own. Later attended practice will help you finish it.', [], <HobbyArt kind={kind} size={64} />);
      }} /></>}
    {completed.length > 0 && <><ActionRow title="Completed Projects" value={String(completed.length)} onPress={() => setHistoryLimit(historyLimit ? 0 : 5)} />{completed.slice(0, historyLimit).map(project => <Body key={project.id}>{project.title} · {project.completed!.year}</Body>)}{historyLimit > 0 && historyLimit < completed.length && <Button label="Show Earlier Projects" tone="secondary" onPress={() => setHistoryLimit(historyLimit + 5)} />}</>}{modal}
  </Card>;
}
