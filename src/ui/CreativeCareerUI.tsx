import React, { useMemo, useState } from 'react';
import { Text as NativeText, View } from 'react-native';
import { router } from 'expo-router';
import type { World } from '../game/model';
import { ageOn, fullName } from '../game/personHelpers';
import { formatMoney, roundRatio } from '../game/money';
import { creativeAgencyQuote } from '../game/systems/creativeCore';
import type { EffectRow } from './EventModal';
import type { CreativeOffer, IndustryState } from '../game/systems/creativeSchemas';
import { ActionRow, Body, Button, Card, Heading, Portrait, StatBar } from './components';
import { SocialBusinessFacts } from './SocialBusinessPresentation';
import type { CreativeCareerDialog } from './CreativeCareerDialog';
import { useColors } from './theme';
import { DisplayText as Text } from './DisplayText';

type Career = World['careers'][number];
export const creativeLabel = (id: string) => id.replace(/[-_]/g, ' ').replace(/^./, letter => letter.toUpperCase());
export const agencyNames = { independent: 'Independent', boutique: 'Boutique Agency', major: 'Major Talent Agency' } as const;
export const offerGross = (offer: CreativeOffer) => roundRatio(offer.annualPay * BigInt(offer.months), 12n);
export function creativeTotals(world: World, career: Career, industry: IndustryState) {
  const legacyIds = new Set([...career.projects, ...(career.creativeArchives ?? [])].filter(project => !project.creative).map(project => project.employmentId));
  const legacy = legacyIds.size ? world.workHistory.reduce((total, history) => total + (legacyIds.has(history.id) ? history.normalizedGross : 0n), 0n) : 0n;
  return { gross: legacy + industry.totalGross, commission: industry.totalCommission };
}
export const agencyRateText = (bps: number) => bps % 100 === 0 ? bps / 100 + '%' : bps.toLocaleString('en-GB') + ' basis points';
export function representationTerms(career: Career, tier: 'independent' | 'boutique' | 'major', negotiate: boolean): EffectRow[] {
  const quote = creativeAgencyQuote(career, tier, negotiate);
  return negotiate ? [
    { id: 'ordinary-rate', label: 'Rate if the request is declined', value: agencyRateText(quote.standardBps), tone: 'neutral' },
    { id: 'negotiated-rate', label: 'Rate if better terms are accepted', value: agencyRateText(quote.proposedBps), tone: 'positive' },
  ] : [{ id: 'commission-rate', label: 'Commission on future contracts', value: agencyRateText(quote.standardBps), tone: 'neutral' }];
}
/** Only cash repayments count; an estate debt write-off is not money the model paid. */
export function creativeSettlementPayments(ledger: World['ledger']): Map<string, bigint> {
  const paid = new Map<string, bigint>();
  for (const row of ledger) if (row.liabilityId && row.cashDelta < 0n && row.debtDelta < 0n) paid.set(row.liabilityId, (paid.get(row.liabilityId) ?? 0n) - row.cashDelta);
  return paid;
}
export function CreativeError({ error }: { error: string | null }) {
  const c = useColors();
  return error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: c.red, fontSize: 15, lineHeight: 22 }}>{error}</Text> : null;
}
export function CreativeAgency({ world, career, industry, busy, dialog, onChange, kind }: {
  world: World; career: Career; industry: IndustryState; busy: boolean; dialog: CreativeCareerDialog; kind: 'actor' | 'model';
  onChange: (tier: 'independent' | 'boutique' | 'major', negotiate: boolean) => void;
}) {
  const c = useColors(), agency = industry.representation, person = agency.agentId ? world.people[agency.agentId] : undefined;
  const quarter = Math.floor((world.date.year * 12 + world.date.month - 1) / 3);
  const quarterReason = world.actionCounts[career.personId + ':' + kind + ':agency:' + quarter] ? 'Review representation again next quarter' : undefined;
  const name = (tier: 'independent' | 'boutique' | 'major') => kind === 'model' && tier === 'major' ? 'Major International Agency' : kind === 'model' && tier === 'boutique' ? 'Boutique Fashion Agency' : agencyNames[tier];
  const reason = (tier: 'independent' | 'boutique' | 'major', negotiate = false) => { const quote = creativeAgencyQuote(career, tier, negotiate); return quarterReason ?? (tier === agency.tier && !negotiate ? 'Your current representation' : tier === 'major' && (career.reputation < 60 || industry.completed < 2) ? 'Requires reputation 60 and two completed contracts' : tier === 'boutique' && career.reputation < 30 ? 'Requires reputation 30' : negotiate && quote.proposedBps >= quote.standardBps ? 'Your current rate is already below the negotiable minimum' : undefined); };
  const descriptions = kind === 'actor' ? {
    independent: 'No agency commission. Keep creative freedom and find smaller productions yourself.',
    boutique: 'Industry connections and prestige work, with a moderate commission.',
    major: 'Major studio access and stronger fee discussions, with higher commission and expectations.',
  } : {
    independent: 'No agency commission. Build a portfolio and find your own clients.',
    boutique: 'Fashion contacts and stronger bookings, with a moderate commission.',
    major: 'International and luxury opportunities, with higher commission and expectations.',
  };
  return <Card><Heading size={20}>Agency & Representation</Heading>
    <SocialBusinessFacts items={[{ label: 'Representation', value: name(agency.tier) }]} />
    <View style={{ backgroundColor: c.inset, borderRadius: 12, padding: 12, gap: 5 }}><Body muted>Commission on future contracts</Body><NativeText accessibilityLabel={'Commission on future contracts: ' + agency.commissionBps / 100 + '%'} style={{ color: c.ink, fontSize: 19, fontWeight: '700' }}>{(agency.commissionBps / 100).toLocaleString('en-GB')}%</NativeText></View>
    {person && <ActionRow title={fullName(person)} subtitle={person.died ? 'Former agent · Deceased' : 'Your agent · Relationship history'} icon={<Portrait personId={person.id} name={fullName(person)} appearance={person.appearance} age={ageOn(person, world.date)} size={40} />} onPress={() => router.push({ pathname: '/person/[id]', params: { id: person.id } })} />}
    {agency.tier !== 'independent' && <StatBar label="Agent rapport" value={agency.rapport} color={c.green} />}
    <Body muted>Signed projects keep their agreed commission. Changing representation affects later contracts.</Body>
    <Button label="Review Representation" disabled={busy} onPress={() => dialog.select('Choose representation', 'Review the commission before signing. A successful negotiation lowers the shown rate; a refusal keeps the standard terms. Each 100 basis points equals 1% commission.', (['independent', 'boutique', 'major'] as const).flatMap(tier => (tier === 'independent' ? [false] : [false, true]).map(negotiate => {
      const quote = creativeAgencyQuote(career, tier, negotiate);
      return { id: tier + (negotiate ? ':negotiate' : ''), label: name(tier) + ' · ' + (negotiate ? 'Negotiate from ' + agencyRateText(quote.standardBps) + ' towards ' + agencyRateText(quote.proposedBps) : 'Standard commission ' + agencyRateText(quote.standardBps)) + ' · ' + descriptions[tier], disabledReason: reason(tier, negotiate) };
    })), id => { const [tier, mode] = id.split(':'); onChange(tier as 'independent' | 'boutique' | 'major', mode === 'negotiate'); })} />
    {agency.tier !== 'independent' && <><ActionRow title="Negotiate Representation" subtitle="Discuss the commission on future agreements" disabled={busy} disabledReason={reason(agency.tier, true)} onPress={() => onChange(agency.tier, true)} /><ActionRow title="Fire Your Agent" subtitle="Become independent; keep signed obligations and past work" disabled={busy} disabledReason={quarterReason} onPress={() => onChange('independent', false)} /></>}
    {agency.history.length > 0 && <ActionRow title="Agency History" subtitle={agency.history.length + ' retained agreements' + (agency.archived ? ' · ' + agency.archived + ' earlier changes summarised' : '')} disabled={busy} onPress={() => dialog.info('Your representation history', 'Earlier agreements and their commission rates remain recorded. Each 100 basis points equals 1% commission.', [...agency.history].reverse().map((entry, index) => ({ id: String(index), label: name(entry.tier) + ' · ' + entry.started.year + (entry.ended ? '–' + entry.ended.year : ' onwards'), value: agencyRateText(entry.commissionBps) + ' · ' + entry.reason, tone: 'neutral' })))} />}
  </Card>;
}
export function CreativeOfferCard({ offer, money, reason, busy, onReview, onNegotiate, onDecline, label }: {
  offer: CreativeOffer; money: (amount: bigint) => string; reason?: string; busy: boolean;
  onReview: () => void; onNegotiate?: () => void; onDecline: () => void; label: string;
}) {
  const [details, setDetails] = useState(false);
  return <Card><Heading size={19}>{offer.title}</Heading><Body>{creativeLabel(offer.category)} · {offer.role} · {offer.genre}</Body>
    <SocialBusinessFacts items={[{ label: 'Expected contractual gross', value: money(offerGross(offer)), note: offer.months + ' months · Before commission and tax' }, { label: 'Potential', value: 'Prestige ' + offer.prestige + ' · Popularity ' + offer.popularity }]} />
    {offer.exclusivity && <Body muted>Exclusive agreement: competing endorsements carry consequences.</Body>}
    <ActionRow title="Requirements & Risks" value={details ? 'Hide' : 'Show'} accessibilityState={{ expanded: details }} onPress={() => setDetails(!details)} />
    {details && <><Body muted>Skill {offer.minSkill}% · Reputation {offer.minReputation}% · {offer.minAgency === 2 ? 'Major agency' : offer.minAgency === 1 ? 'Agency representation' : 'Independent applications welcome'}</Body><Body muted>Competition {offer.difficulty}% · Career risk {offer.risk}%</Body></>}
    {offer.status !== 'open' ? <Body muted>{creativeLabel(offer.status)}</Body> : <>
      {reason && <Body muted>{reason}</Body>}
      <Button label={label} accessibilityLabel={label + ' for ' + offer.title} disabled={busy || !!reason} onPress={onReview} />
      {onNegotiate && <Button label="Negotiate & Audition" accessibilityLabel={'Negotiate and audition for ' + offer.title} tone="secondary" disabled={busy || !!reason} onPress={onNegotiate} />}
      <ActionRow title={'Decline ' + offer.title} subtitle="Keep your time for other work" disabled={busy} onPress={onDecline} />
    </>}
  </Card>;
}
export function CreativeBookingClause({ world, industry }: { world: World; industry: IndustryState }) {
  const month = world.date.year * 12 + world.date.month - 1;
  if (industry.bookingHoldUntil < month) return null;
  return <Body muted>A signed first-refusal clause holds new bookings through {Math.floor(industry.bookingHoldUntil / 12)}-{String(industry.bookingHoldUntil % 12 + 1).padStart(2, '0')}.</Body>;
}
export function CreativeContacts({ world, industry }: { world: World; industry: IndustryState }) {
  return <Card><Heading size={20}>Industry Contacts</Heading><Body muted>These are people in your life. Open a profile to build a friendship, discuss a conflict or explore the normal relationship choices.</Body>
    {Object.entries(industry.contacts).map(([role, id]) => {
      const person = world.people[id]; if (!person) return null;
      return <ActionRow key={role} title={fullName(person)} subtitle={(role === 'costar' ? 'Co-star' : creativeLabel(role)) + (person.died ? ' · Deceased' : '')} icon={<Portrait personId={id} name={fullName(person)} appearance={person.appearance} age={ageOn(person, world.date)} size={40} />} onPress={() => router.push({ pathname: '/person/[id]', params: { id } })} />;
    })}
  </Card>;
}
export function CreativeMilestones({ industry, title = 'Career Milestones' }: { industry: IndustryState; title?: string }) {
  return <Card><Heading size={20}>{title}</Heading>{industry.milestones.length ? industry.milestones.map(milestone => <Body key={milestone}>• {creativeLabel(milestone)}</Body>) : <Body muted>Your first credits, breakthroughs and recoveries will be recorded here.</Body>}</Card>;
}
export function CreativeHistory({ career, title }: { career: Career; title: string }) {
  const [page, setPage] = useState(0), history = useMemo(() => [...career.projects, ...(career.creativeArchives ?? [])].filter(project => project.status !== 'active').sort((a, b) => b.started.year - a.started.year || b.started.month - a.started.month || b.started.day - a.started.day || b.id.localeCompare(a.id)), [career.projects, career.creativeArchives]), maxPage = Math.max(0, Math.ceil(history.length / 4) - 1), currentPage = Math.min(page, maxPage);
  const money = (amount: bigint, currency: Career['currency']) => formatMoney({ minor: amount, currency });
  return <Card><Heading size={20}>{title}</Heading>{!history.length && <Body muted>Your completed and interrupted work will stay here.</Body>}
    {history.slice(currentPage * 4, currentPage * 4 + 4).map(project => <Card key={project.id}>
      <Heading size={18}>{project.name}</Heading><Body muted>{project.status === 'cancelled' ? career.kind === 'model' ? 'Unfinished booking' : 'Unfinished production' : 'Completed'} · {project.ended?.year} · {project.months} contract months</Body>
      {project.creative && <Body>{project.creative.role} · {creativeLabel(project.creative.category)}</Body>}
      <SocialBusinessFacts items={[{ label: 'Actual gross earnings', value: money(project.grossEarned, project.currency) }, ...(project.creative ? [{ label: 'Agency commission paid', value: money(project.creative.commissionPaid, project.currency) }] : [])]} />
      {project.creative?.cancellation && <Body>{project.creative.cancellation.summary}</Body>}
      {project.creative?.release && project.status === 'cancelled' && <><Body muted>Earlier saved outcome</Body><Body>{project.creative.release.summary}</Body></>}
      {project.creative?.release && project.status === 'completed' && <><Body>{project.creative.release.summary}</Body><Body muted>{project.creative.kind === 'model' ? 'Industry reception' : 'Critical reception'} {project.creative.release.critical}% · Audience reception {project.creative.release.audience}% · {project.creative.kind === 'model' && project.creative.release.commercial === 'blockbuster' ? 'Major success' : creativeLabel(project.creative.release.commercial)}</Body>{project.creative.release.nomination && <Body>Award nomination</Body>}</>}
      {project.award && <Body>{project.award}</Body>}
    </Card>)}
    {history.length > 4 && <><Body muted>Work {currentPage * 4 + 1}–{Math.min(history.length, currentPage * 4 + 4)} of {history.length}</Body><View style={{ gap: 8 }}><Button label="Newer Work" tone="secondary" disabled={currentPage === 0} onPress={() => setPage(Math.max(0, currentPage - 1))} /><Button label="Earlier Work" tone="secondary" disabled={currentPage === maxPage} onPress={() => setPage(currentPage + 1)} /></View></>}
  </Card>;
}
export function CreativeCurrentProject({ career }: { career: Career }) {
  const c = useColors(), project = career.projects.find(item => item.status === 'active');
  if (!project?.creative) return null;
  const money = (amount: bigint) => formatMoney({ minor: amount, currency: project.currency });
  return <Card><Heading size={20}>{project.name}</Heading><Body>{project.creative.role} · {project.creative.genre}</Body>
    <StatBar label="Production" value={Math.round(project.months * 100 / project.targetMonths)} color={c.blue} />
    <SocialBusinessFacts items={[{ label: 'Contract progress', value: project.months + ' / ' + project.targetMonths + ' months' }, { label: 'Gross earned', value: money(project.grossEarned) }, { label: 'Commission paid', value: money(project.creative.commissionPaid) }, { label: 'After commission, before tax', value: money(project.grossEarned - project.creative.commissionPaid) }]} />
    <Body muted>Pay arrives only during actual working months. Your decisions affect quality, relationships and the eventual response.</Body>
    <Body muted>Preparation {project.creative.preparation}% · Quality adjustment {project.creative.qualityBonus > 0 ? '+' : ''}{project.creative.qualityBonus} · Publicity {project.creative.publicity > 0 ? '+' : ''}{project.creative.publicity}</Body>
    {!!project.creative.choices.length && <Body muted>Recent choice: {project.creative.choices.at(-1)!.note}</Body>}
  </Card>;
}
