import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Body, Card, Header, Heading, Page } from '../src/ui/components';
import { Illustration, type IllustrationId } from '../src/assets/Illustration';

export default function Help() {
  return <Page bottomSafeArea><Header title="Help" onBack={() => router.back()} />
    <HelpSection title="A year at a time" art="birthday"><Body>Age Up starts your next year. Decisions and results can pause it partway through. After reading them, use Continue This Year to finish the remaining months.</Body></HelpSection>
    <HelpSection title="Routines and care" art="wellbeing"><Body>School, work, hobby routines and funded pet care continue as months pass. Extra practice, walks and other personal actions are optional. Review the payer and price before agreeing to paid plans.</Body></HelpSection>
    <HelpSection title="Milestones and goals" art="education"><Body>Achievements and challenges follow this person’s life history. Past reports, completed work and attended practice count. Changing lives or restoring an earlier timeline changes which history appears.</Body></HelpSection>
    <HelpSection title="Your progress" art="journal"><Body>Your lives stay on this device. Successful actions save your progress. If a save fails, use the visible error and retry before continuing. Saved Lives lets you return to another life; Time Machine previews earlier moments before creating a separate branch.</Body></HelpSection>
    <HelpSection title="About Dreams" art="relationship"><Body>Dreams: Life Simulator</Body><Body muted>Original illustrations created for Dreams. Interface icons by Ionicons.</Body></HelpSection>
  </Page>;
}

function HelpSection({ title, art, children }: React.PropsWithChildren<{ title: string; art: IllustrationId }>) {
  return <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Illustration id={art} size={38} /><View style={{ flex: 1, minWidth: 0 }}><Heading size={19}>{title}</Heading></View></View>{children}</Card>;
}
