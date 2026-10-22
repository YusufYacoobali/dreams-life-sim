import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Body, Card, Header, Heading, Page } from '../src/ui/components';
import { Illustration, type IllustrationId } from '../src/assets/Illustration';

export default function Help() {
  return <Page bottomSafeArea><Header title="Help" onBack={() => router.back()} />
    <HelpSection title="A year at a time" art="birthday"><Body>Tap Age Up to start a year. Answer decisions and tap Continue to carry on. If the year pauses for planning, make your changes, then tap Continue This Year on Life.</Body></HelpSection>
    <HelpSection title="Routines and care" art="wellbeing"><Body>Browsing menus and taking everyday actions do not advance the calendar. School, work, hobby routines and funded pet care continue as months pass. Extra practice, walks and other personal actions are optional. Review the payer and price before agreeing to paid plans.</Body></HelpSection>
    <HelpSection title="Campus life" art="education"><Body>In an eligible course, your first attended month pauses the year for planning. Visit Education → Campus for free introductions, then get to know your course peers. Clubs use energy and can build skills in future attended months. Joining gives no instant skill gain; paused or interrupted study earns no club progress.</Body></HelpSection>
    <HelpSection title="Milestones and goals" art="education"><Body>Achievements and challenges follow the current person’s history, including school, work and practice. Switching lives or restoring a timeline changes the progress shown.</Body></HelpSection>
    <HelpSection title="Your progress" art="journal"><Body>Your lives are saved on this device. Your device’s backup settings may include saved lives. Successful actions save your progress. If a save fails, use the visible error and retry before continuing. Saved Lives lets you return to another life; Time Machine previews earlier moments before creating a separate branch.</Body></HelpSection>
    <HelpSection title="About Dreams" art="relationship"><Body>Dreams: Life Simulator</Body><Body muted>Original illustrations created for Dreams. Interface icons by Ionicons.</Body></HelpSection>
  </Page>;
}

function HelpSection({ title, art, children }: React.PropsWithChildren<{ title: string; art: IllustrationId }>) {
  return <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Illustration id={art} size={38} /><View style={{ flex: 1, minWidth: 0 }}><Heading size={19}>{title}</Heading></View></View>{children}</Card>;
}
