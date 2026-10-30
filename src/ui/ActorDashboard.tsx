import React from 'react';
import { router } from 'expo-router';
import { useGame } from '../state/useGame';
import { countries } from '../game/countries';
import { formatMoney } from '../game/money';
import { actorCareer, actorEntryReason, actorOffers, actorOfferReason, actorProductionActions, actorProductionCost, actorProductionReason } from '../game/systems/actor';
import { actingStyles } from '../game/systems/actorSchemas';
import { CareerArt } from '../assets/CareerArt';
import { ActionRow, Body, Button, Card, Header, Heading, Page, StatBar } from './components';
import { SocialBusinessFacts, SocialBusinessIntro } from './SocialBusinessPresentation';
import { useCreativeCareerDialog } from './CreativeCareerDialog';
import { CreativeAgency, CreativeBookingClause, CreativeContacts, CreativeCurrentProject, CreativeError, CreativeHistory, CreativeMilestones, CreativeOfferCard, agencyNames, creativeLabel, creativeTotals, offerGross, representationTerms } from './CreativeCareerUI';
import { useColors } from './theme';

const styleCopy = {
  versatile: { title: 'Versatile Performer', body: 'Keep prestige and popular work open. Let the role shape your approach.' },
  craft: { title: 'Character & Craft', body: 'Pursue challenging performances and stronger critical recognition.' },
  popular: { title: 'Audience Favourite', body: 'Give public appeal and wider recognition more attention.' },
} as const;

export function ActorDashboard() {
  const world = useGame(state => state.world), busy = useGame(state => state.busy), error = useGame(state => state.error), dialog = useCreativeCareerDialog('actor'), c = useColors();
  if (!world) return <Page><Header title="Actor" onBack={() => router.back()} /><Card><Body>Open a life to explore acting.</Body></Card></Page>;
  const person = world.people[world.activePersonId], career = actorCareer(world), state = career?.actor;
  const entryReason = actorEntryReason(world);
  if (!career || !state) return <Page><Header title="Actor" onBack={() => router.back()} /><CreativeError error={!dialog.open ? error : null} />
    <Card><SocialBusinessIntro art={<CareerArt id="actor" size={72} />} title="Build an Acting Career" eyebrow="Representation · Auditions · Productions" body="Find your own roles, negotiate representation and shape performances before critics and audiences have their say." />
      <Body>Acting remains free. Skills & Training is available before your first professional role.</Body>
      {entryReason && <Body muted>{entryReason}</Body>}<Button label="Explore Acting Opportunities" disabled={busy || !!entryReason} onPress={() => dialog.confirm({ type: 'actor-enter' }, 'Explore the acting industry?', 'Meet recurring industry contacts and review a saved selection of casting opportunities. Joining the industry pays no salary and signs no production contract.', [], 'Explore Acting')} />
      <ActionRow title="Skills & Training" subtitle="Build acting skill through self-directed practice or coaching" icon={<CareerArt id="training" size={36} />} onPress={() => router.push('/career-training')} />
    </Card>{career && <><Card><Body muted>Existing contracts and their recorded outcomes stay intact. Finish your current project before moving into the new industry choices.</Body></Card><CreativeHistory career={career} title="Your Existing Filmography" />{career.status === 'between' && <Card><ActionRow title="Leave This Career" subtitle="Retain your recorded work and pursue something else" disabled={busy} onPress={() => dialog.confirm({ type: 'leave-career', careerId: career.id }, 'Leave this career?', 'Keep your past projects, payments and professional contacts.', [], 'Leave Career')} /></Card>}</>}{dialog.modal}
  </Page>;
  const boardMoney = (minor: bigint) => formatMoney({ minor, currency: countries[state.boardCountry].currency });
  const costMoney = (minor: bigint) => formatMoney({ minor, currency: career.currency });
  const referenceMoney = (minor: bigint) => formatMoney({ minor, currency: person.finance.earningsCurrency });
  const industry = state.industry, totals = creativeTotals(world, career, industry), project = career.projects.find(item => item.status === 'active'), active = career.status === 'active';
  const quarter = Math.floor((world.date.year * 12 + world.date.month - 1) / 3), refreshReason = active ? 'Finish your current production first' : industry.boardSeason === quarter && state.boardCountry === person.country ? 'New casting opportunities arrive next quarter' : undefined;
  const agency = (tier: 'independent' | 'boutique' | 'major', negotiate: boolean) => dialog.confirm({ type: 'actor-agency', tier, negotiate }, negotiate ? 'Negotiate your representation?' : tier === 'independent' ? 'Become independent?' : 'Sign with a ' + agencyNames[tier].toLowerCase() + '?', negotiate ? 'Ask for a lower commission on future contracts. Your standing and agent relationship affect the response; the result is recorded.' : 'Agency connections change the work available to you. Signed productions keep their existing payment and commission terms.', representationTerms(career, tier, negotiate), negotiate ? 'Negotiate Agreement' : tier === 'independent' ? 'Become Independent' : 'Sign Representation');
  return <Page><Header title="Actor" onBack={() => router.back()} /><CreativeError error={!dialog.open ? error : null} />
    <Card><SocialBusinessIntro art={<CareerArt id="actor" size={72} />} title="Your Acting Career" eyebrow={active ? 'In production · ' + project?.name : career.status === 'between' ? 'Between productions' : creativeLabel(career.status)} body="An acclaimed role and a crowd-pleasing hit can take very different routes. Your credits, choices and professional relationships open the next door." />
      <StatBar label="Acting" value={person.skills.acting} color={c.blue} /><StatBar label="Reputation" value={career.reputation} color={c.green} />
      <SocialBusinessFacts items={[{ label: 'Professional credits', value: String(state.credits) }, { label: 'Leading roles', value: String(state.leadingCredits) }, { label: 'Commercial hits', value: String(state.hits) }, { label: 'Recorded gross earnings', value: referenceMoney(totals.gross), note: 'Before commission and tax' }]} />
      <ActionRow title="Skills & Training" subtitle="Keep developing your acting craft" icon={<CareerArt id="training" size={36} />} onPress={() => router.push('/career-training')} />
    </Card>
    {['left', 'retired'].includes(career.status) && <Card><Heading size={20}>Return to Acting</Heading>{entryReason && <Body muted>{entryReason}</Body>}<Button label="Review Career Return" disabled={busy || !!entryReason} onPress={() => dialog.confirm({ type: 'actor-enter' }, 'Return to the industry?', 'Keep your past credits and contacts. Review new opportunities before signing another production.', [], 'Return to Acting')} /></Card>}
    <CreativeAgency world={world} career={career} industry={industry} busy={busy} dialog={dialog} kind="actor" onChange={agency} />
    <Card><Heading size={20}>Your Acting Identity</Heading><Body muted>Choose a direction for future casting and performances. Your current approach is selected.</Body>
      {actingStyles.map(style => <ActionRow key={style} title={styleCopy[style].title} subtitle={styleCopy[style].body} accessibilityRole="radio" accessibilityState={{ checked: state.style === style }} disabled={busy} disabledReason={state.style === style ? 'Your current acting approach' : undefined} onPress={() => dialog.confirm({ type: 'actor-style', style }, 'Shape your acting approach?', styleCopy[style].body, [], 'Set Acting Approach')} />)}
    </Card>
    {active && project?.creative && <><CreativeCurrentProject career={career} /><Card><Heading size={20}>Shape This Performance</Heading><Body muted>These are optional choices with real trade-offs. Production advances through ordinary working months.</Body>
      {actorProductionActions.map(action => {
        const reason = actorProductionReason(world, action.id), cost = actorProductionCost(world, action.id);
        return <ActionRow key={action.id} title={action.label} subtitle={action.description + (cost ? ' · Cost ' + costMoney(cost) : '')} disabled={busy} disabledReason={reason} onPress={() => dialog.confirm({ type: 'actor-production', action: action.id }, action.label + '?', action.description, cost ? [{ id: 'cost', label: 'Actual cost', value: costMoney(cost), tone: 'negative' }] : [], 'Choose This Approach')} />;
      })}
    </Card></>}
    <Card><Heading size={20}>Auditions & Offers</Heading><CreativeBookingClause world={world} industry={industry} /><Body muted>Choose your next role. Prestige, popularity, competition and agency access matter alongside the fee. Casting decisions are recorded when you audition.</Body>
      {refreshReason && <Body muted>{refreshReason}</Body>}<Button label="Review New Casting List" tone="secondary" disabled={busy || !!refreshReason} onPress={() => dialog.confirm({ type: 'actor-refresh-offers' }, 'Review this quarter’s casting list?', 'New opportunities become available as the calendar moves. Reopening the list does not reroll an audition or replace a signed production.', [], 'Review Casting List')} />
    </Card>
    {actorOffers(world).map(offer => {
      const reason = actorOfferReason(world, offer);
      const audition = (negotiate: boolean) => dialog.confirm({ type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate }, 'Audition for ' + offer.title + '?', negotiate ? 'Propose better terms and attend the audition. The saved negotiation and casting responses determine whether an agreement is possible. No salary is paid upfront.' : 'Attend the audition for this specific role. Selection is not guaranteed. If selected, pay arrives during the contracted production months.', [{ id: 'role', label: 'Role', value: offer.role, tone: 'neutral' }, { id: 'gross', label: 'Expected contractual gross', value: boardMoney(offerGross(offer)), tone: 'positive' }, { id: 'duration', label: 'Production', value: offer.months + ' months', tone: 'neutral' }], negotiate ? 'Negotiate & Audition' : 'Attend Audition');
      return <CreativeOfferCard key={offer.id} offer={offer} money={boardMoney} reason={reason} busy={busy} label="Review Audition" onReview={() => audition(false)} onNegotiate={() => audition(true)} onDecline={() => dialog.confirm({ type: 'actor-decline', offerId: offer.id }, 'Decline ' + offer.title + '?', 'Pass on this casting opportunity. The rest of the list stays available.', [], 'Decline Opportunity')} />;
    })}
    <Card><Heading size={20}>Awards & Recognition</Heading><SocialBusinessFacts items={[{ label: 'Nominations', value: String(state.nominations) }, { label: 'Acting awards', value: String(state.awards) }, { label: 'Career setbacks', value: String(state.collapseCount) }]} />{state.comeback && <Body>Your comeback is part of your recorded career.</Body>}<Body muted>Critical recognition and popular success are tracked separately. Production results show actual pay, reviews and audience response.</Body></Card>
    <CreativeMilestones industry={industry} /><CreativeHistory career={career} title="Filmography" /><CreativeContacts world={world} industry={industry} />
    {['active', 'between'].includes(career.status) && <Card><ActionRow title="Leave This Acting Career" subtitle="Stop future contract pay; retain credits, earnings and relationships" disabled={busy} onPress={() => dialog.confirm({ type: 'leave-career', careerId: career.id }, 'Leave your acting career?', 'Unfinished work stops. Past payments, completed productions, nominations and professional relationships remain recorded.', [], 'Leave Acting')} /></Card>}
    {dialog.modal}
  </Page>;
}
