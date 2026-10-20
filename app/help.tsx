import React from 'react';
import { router } from 'expo-router';
import { Body, Card, Header, Heading, Page } from '../src/ui/components';

export default function Help() {
  return <Page bottomSafeArea><Header title="Help" onBack={() => router.back()} />
    <Card><Heading size={19}>A year at a time</Heading><Body>Age Up starts your next year. Decisions and results can pause it partway through. After reading them, use Continue This Year to finish the remaining months.</Body></Card>
    <Card><Heading size={19}>Routines and care</Heading><Body>School, work, hobby routines and funded pet care continue as months pass. Extra practice, walks and other personal actions are optional. Review the payer and price before agreeing to paid plans.</Body></Card>
    <Card><Heading size={19}>Milestones and goals</Heading><Body>Achievements and challenges follow this person’s life history. Past reports, completed work and attended practice count. Changing lives or restoring an earlier timeline changes which history appears.</Body></Card>
    <Card><Heading size={19}>Your progress</Heading><Body>Your lives stay on this device. Successful actions save your progress. If a save fails, use the visible error and retry before continuing. Saved Lives lets you return to another life; Time Machine previews earlier moments before creating a separate branch.</Body></Card>
    <Card><Heading size={19}>About Dreams</Heading><Body>Dreams: Life Simulator</Body><Body muted>Original illustrations created for Dreams. Interface icons by Ionicons.</Body></Card>
  </Page>;
}
