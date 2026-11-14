import React from 'react';
import { router } from 'expo-router';
import { useGame } from '../state/useGame';
import { countries } from '../game/countries';
import { formatMoney, roundRatio } from '../game/money';
import { actorCareer, actorStyleReason, actorEntryReason, actorOffers, actorOfferReason, actorProductionActions, actorProductionCost, actorProductionReason } from '../game/systems/actor';
import { creativeMonthLabel, creativeMonthNumber } from '../game/systems/creativeSchemas';
import { actingStyles } from '../game/systems/actorSchemas';
import { CareerArt } from '../assets/CareerArt';
import { FameBusinessArt } from '../assets/FameBusinessArt';
import { PersonActionArt } from '../assets/PersonActionArt';
import { ActionRow, Body, Button, Card, Header, Heading, Page, StatBar } from './components';
import { SocialBusinessFacts, SocialBusinessIntro } from './SocialBusinessPresentation';
import { useCreativeCareerDialog } from './CreativeCareerDialog';
import { CreativeAgency, CreativeBookingClause, CreativeContacts, CreativeCurrentProject, CreativeError, CreativeHistory, CreativeMilestones, CreativeOfferCard, agencyNames, agencyRateText, creativeLabel, creativeTotals, offerGross, representationTerms } from './CreativeCareerUI';
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
      {entryReason && <Body muted>{entryReason}</Body>}<Button label="Explore Acting Opportunities" disabled={busy || !!entryReason} onPress={() => dialog.confirm({ type: 'actor-enter' }, 'Explore the acting industry?', 'Meet industry contacts and explore auditions. Review each role before signing; entry is free and pays no salary.', [], 'Explore Acting')} />
      <ActionRow title="Skills & Training" subtitle="Build acting skill through self-directed practice or coaching" icon={<CareerArt id="training" size={36} />} onPress={() => router.push('/career-training')} />
    </Card>{career && <><Card><Body muted>Existing contracts and their recorded outcomes stay intact. Finish your current project before moving into the new industry choices.</Body></Card><CreativeHistory career={career} title="Your Existing Filmography" />{career.status === 'between' && <Card><ActionRow title="Leave This Career" subtitle="Retain your recorded work and pursue something else" disabled={busy} onPress={() => dialog.confirm({ type: 'leave-career', careerId: career.id }, 'Leave this career?', 'Keep your past projects, payments and professional contacts.', [], 'Leave Career')} /></Card>}</>}{dialog.modal}
  </Page>;
  const boardMoney = (minor: bigint) => formatMoney({ minor, currency: countries[state.boardCountry].currency });
  const costMoney = (minor: bigint) => formatMoney({ minor, currency: career.currency });
  const referenceMoney = (minor: bigint) => formatMoney({ minor, currency: person.finance.earningsCurrency });
  const industry = state.industry, totals = creativeTotals(world, career, industry), project = career.projects.find(item => item.status === 'active'), active = career.status === 'active';

  const agency = (tier: 'independent' | 'boutique' | 'major', negotiate: boolean) => dialog.confirm({ type: 'actor-agency', tier, negotiate }, negotiate ? 'Negotiate your representation?' : tier === 'independent' ? 'Become independent?' : 'Sign with a ' + agencyNames[tier].toLowerCase() + '?', negotiate ? 'Ask for a lower commission on future contracts. Your standing and agent relationship affect the response.' : 'Agency connections change the work available to you. Signed productions keep their payment and commission terms.', representationTerms(career, tier, negotiate), negotiate ? 'Negotiate Agreement' : tier === 'independent' ? 'Become Independent' : 'Sign Representation');
  return <Page><Header title="Actor" onBack={() => router.back()} /><CreativeError error={!dialog.open ? error : null} />
    <Card><SocialBusinessIntro art={<CareerArt id="actor" size={72} />} title="Your Acting Career" eyebrow={active ? 'In production · ' + project?.name : career.status === 'between' ? 'Between productions' : creativeLabel(career.status)} body="An acclaimed role and a crowd-pleasing hit can take very different routes. Your credits, choices and professional relationships open the next door." />
      <StatBar label="Acting" value={person.skills.acting} color={c.blue} /><StatBar label="Reputation" value={career.reputation} color={c.green} />
      <SocialBusinessFacts items={[{ label: 'Professional credits', value: String(state.credits) }, { label: 'Leading roles', value: String(state.leadingCredits) }, { label: 'Commercial hits', value: String(state.hits) }, { label: 'Recorded gross earnings', value: referenceMoney(totals.gross), note: 'Before commission and tax' }]} />
      <ActionRow title="Skills & Training" subtitle="Keep developing your acting craft" icon={<CareerArt id="training" size={36} />} onPress={() => router.push('/career-training')} />
    </Card>
    {active && project?.creative && <><CreativeCurrentProject career={career} /><Card><Heading size={20}>Shape This Performance</Heading><Body muted>These are optional choices with real trade-offs. Production advances through ordinary working months.</Body>
      {actorProductionActions.map(action => {
        const reason = actorProductionReason(world, action.id), cost = actorProductionCost(world, action.id);
        const icon = action.id === 'prepare' ? <PersonActionArt id="academic-help" /> : action.id === 'cooperate' ? <PersonActionArt id="talk" /> : action.id === 'publicity' ? <FameBusinessArt id="publicity" size={40} /> : <CareerArt id={action.id === 'stunt' ? 'training' : action.id === 'reshoot' ? 'film' : 'actor'} size={40} />;
        return <ActionRow key={action.id} title={action.label} icon={icon} subtitle={action.description + (cost ? ' · Cost ' + costMoney(cost) : '')} disabled={busy} disabledReason={reason} onPress={() => dialog.confirm({ type: 'actor-production', action: action.id }, action.label + '?', action.description, cost ? [{ id: 'cost', label: 'Actual cost', value: costMoney(cost), tone: 'negative' }] : [], 'Choose This Approach')} />;
      })}
    </Card></>}
    {['left', 'retired'].includes(career.status) && <Card><Heading size={20}>Return to Acting</Heading>{entryReason && <Body muted>{entryReason}</Body>}<Button label="Review Career Return" disabled={busy || !!entryReason} onPress={() => dialog.confirm({ type: 'actor-enter' }, 'Return to the industry?', 'Keep your past credits and contacts. Review new opportunities before signing another production.', [], 'Return to Acting')} /></Card>}
    <CreativeAgency world={world} career={career} industry={industry} busy={busy} dialog={dialog} kind="actor" onChange={agency} />
    <Card><Heading size={20}>Your Acting Identity</Heading><Body muted>Choose a direction for future performances. A change commits you for twelve months; finish any current production first.</Body>
      {state.lastStyleMonth !== undefined && <Body muted>{creativeMonthNumber(world) < state.lastStyleMonth + 12 ? 'Next style change: ' + creativeMonthLabel(state.lastStyleMonth + 12) + '.' : active ? 'You can change style after this production.' : 'You can choose a new acting style now.'}</Body>}
      {actingStyles.map(style => <ActionRow key={style} title={styleCopy[style].title} subtitle={styleCopy[style].body} accessibilityRole="radio" accessibilityState={{ checked: state.style === style }} disabled={busy || !!actorStyleReason(world, style)} disabledReason={state.style === style ? 'Your current acting approach' : undefined} onPress={() => dialog.confirm({ type: 'actor-style', style }, 'Shape your acting approach?', styleCopy[style].body + ' You can review a different approach after twelve months, between productions.', [], 'Set Acting Approach')} />)}
    </Card>
    <Card><Heading size={20}>Auditions & Offers</Heading><CreativeBookingClause world={world} industry={industry} /><Body muted>Choose your next role. Prestige, popularity, competition and agency access matter alongside the fee. Casting decisions are recorded when you audition.</Body>

    </Card>
    {actorOffers(world).filter(offer => offer.status === 'open' && offer.expires >= creativeMonthNumber(world)).map(offer => {
      const reason = actorOfferReason(world, offer);
      const audition = (negotiate: boolean) => dialog.confirm({ type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate }, 'Audition for ' + offer.title + '?', negotiate ? 'Audition and ask for a higher fee. If cast, an accepted request raises the fee by 12%; a refusal lowers it by 3%. Pay arrives during working months, before commission and tax.' : 'Audition for this role. If cast, earn the quoted gross across paid production months, before agency commission and tax.', [{ id: 'role', label: 'Role', value: creativeLabel(offer.role), tone: 'neutral' }, { id: 'gross', label: 'Expected contractual gross', value: boardMoney(offerGross(offer)), tone: 'positive' }, { id: 'duration', label: 'Production', value: offer.months + ' months', tone: 'neutral' }, { id: 'commission', label: 'Agency commission', value: agencyRateText(industry.representation.commissionBps), tone: 'neutral' }, ...(negotiate ? [{ id: 'accepted-gross', label: 'Gross if fee increase accepted', value: boardMoney(offerGross({ ...offer, annualPay: roundRatio(offer.annualPay * 11200n, 10000n) })), tone: 'positive' as const }, { id: 'declined-gross', label: 'Gross if fee increase declined', value: boardMoney(offerGross({ ...offer, annualPay: roundRatio(offer.annualPay * 9700n, 10000n) })), tone: 'negative' as const }] : [])], negotiate ? 'Negotiate & Audition' : 'Attend Audition', negotiate ? undefined : () => audition(true));
      return <CreativeOfferCard key={offer.id} offer={offer} money={boardMoney} reason={reason} busy={busy} label="Review Audition" onReview={() => audition(false)} />;
    })}
    <Card><Heading size={20}>Awards & Recognition</Heading><SocialBusinessFacts items={[{ label: 'Nominations', value: String(state.nominations) }, { label: 'Acting awards', value: String(state.awards) }, { label: 'Career setbacks', value: String(state.collapseCount) }]} />{state.comeback && <Body>Your next audition comes with a comeback behind it.</Body>}<Body muted>Critical recognition and popular success are tracked separately. Production results show actual pay, reviews and audience response.</Body></Card>
    <CreativeMilestones industry={industry} /><CreativeHistory career={career} title="Filmography" /><CreativeContacts world={world} industry={industry} />
    {['active', 'between'].includes(career.status) && <Card><ActionRow title="Leave This Acting Career" subtitle="Stop future contract pay; retain credits, earnings and relationships" disabled={busy} onPress={() => dialog.confirm({ type: 'leave-career', careerId: career.id }, 'Leave your acting career?', 'Unfinished work stops. Past payments, completed productions, nominations and professional relationships remain recorded.', [], 'Leave Acting')} /></Card>}
    {dialog.modal}
  </Page>;
}
