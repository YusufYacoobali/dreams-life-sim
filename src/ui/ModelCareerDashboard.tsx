import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { useGame } from '../state/useGame';
import { countries } from '../game/countries';
import { formatMoney, roundRatio } from '../game/money';
import { modelCareer, modelEntryReason, modelSpecialisationReason, modelOfferReason, modelPortfolioQuote, modelPortfolioReason, modelProductionReason, modelBrandQuote, modelBrandReason, modelBrandTerm } from '../game/systems/modelCareer';
import { creativeMonthLabel, creativeMonthNumber } from '../game/systems/creativeSchemas';
import type { CreativeOffer } from '../game/systems/creativeSchemas';
import { modelSpecialisations, type ModelSpecialisation } from '../game/systems/modelCareerSchemas';
import { modelSpecialisationContent, modelProductionActions } from '../game/content/modelCareer';
import { CareerArt } from '../assets/CareerArt';
import { ActionRow, Body, Button, Card, Header, Heading, Page, StatBar } from './components';
import { SocialBusinessFacts, SocialBusinessIntro } from './SocialBusinessPresentation';
import { useCreativeCareerDialog } from './CreativeCareerDialog';
import { CreativeAgency, CreativeBookingClause, CreativeContacts, CreativeCurrentProject, CreativeError, CreativeHistory, CreativeMilestones, CreativeOfferCard, creativeLabel, creativeTotals, creativeSettlementPayments, offerGross, representationTerms } from './CreativeCareerUI';
import { useColors } from './theme';
import type { EffectRow } from './EventModal';

export function ModelCareerDashboard() {
  const world = useGame(state => state.world), busy = useGame(state => state.busy), error = useGame(state => state.error), dialog = useCreativeCareerDialog('model'), c = useColors();
  const settlementPayments = useMemo(() => world ? creativeSettlementPayments(world.ledger) : new Map<string, bigint>(), [world?.ledger]);
  if (!world) return <Page><Header title="Model" onBack={() => router.back()} /><Card><Body>Open a life to explore modelling.</Body></Card></Page>;
  const person = world.people[world.activePersonId], career = modelCareer(world), state = career?.modelCareer;
  const entryReason = modelEntryReason(world);
  if (!career || !state) return <Page><Header title="Model" onBack={() => router.back()} /><CreativeError error={!dialog.open ? error : null} />
    <Card><SocialBusinessIntro art={<CareerArt id="model" size={72} />} title="Build a Modelling Career" eyebrow="Portfolio · Bookings · Brand Relationships" body="Develop a distinctive portfolio, choose your clients and decide how you want to be seen. Presentation, experience and professionalism shape your career." />
      <Body>Modelling remains free. Train and explore the industry before accepting a paid booking.</Body>{entryReason && <Body muted>{entryReason}</Body>}
      <Button label="Explore Modelling Opportunities" disabled={busy || !!entryReason} onPress={() => dialog.confirm({ type: 'model-enter' }, 'Explore the fashion industry?', 'Establish your portfolio and meet recurring industry contacts. You will review individual bookings before signing anything; no income arrives upfront.', [], 'Explore Modelling')} />
      <ActionRow title="Skills & Training" subtitle="Develop modelling skill through practice or coaching" icon={<CareerArt id="training" size={36} />} onPress={() => router.push('/career-training')} />
    </Card>{career && <><Card><Body muted>Your existing booking and its recorded outcomes stay intact. Finish that contract before exploring the new portfolio and booking choices.</Body></Card><CreativeHistory career={career} title="Your Existing Work" />{career.status === 'between' && <Card><ActionRow title="Leave This Career" subtitle="Keep your past bookings and take another direction" disabled={busy} onPress={() => dialog.confirm({ type: 'leave-career', careerId: career.id }, 'Leave this career?', 'Your recorded bookings, payments and professional contacts remain.', [], 'Leave Career')} /></Card>}</>}{dialog.modal}
  </Page>;
  const boardMoney = (minor: bigint) => formatMoney({ minor, currency: countries[state.boardCountry].currency });
  const portfolioMoney = (minor: bigint) => formatMoney({ minor, currency: countries[person.country].currency });
  const referenceMoney = (minor: bigint) => formatMoney({ minor, currency: person.finance.earningsCurrency });
  const industry = state.industry, totals = creativeTotals(world, career, industry), active = career.status === 'active', project = career.projects.find(item => item.status === 'active');
  const quarter = Math.floor((world.date.year * 12 + world.date.month - 1) / 3), refreshReason = active ? 'Finish your current booking first' : industry.boardSeason === quarter && state.boardCountry === person.country ? 'New casting opportunities arrive next quarter' : undefined;
  const hasClaim = (brand: typeof state.brands[number]) => !!brand.penaltyLiabilityId && (world.liabilities.find(item => item.id === brand.penaltyLiabilityId)?.principal ?? 0n) > 0n;
  const brandRows = [...state.brands].reverse().sort((a, b) => Number(b.status === 'active' || hasClaim(b)) - Number(a.status === 'active' || hasClaim(a)));
  const reviewCasting = (offer: CreativeOffer) => {
    const terms: EffectRow[] = [{ id: 'work', label: 'Booking', value: offer.role, tone: 'neutral' }, { id: 'gross', label: 'Expected contractual gross', value: boardMoney(offerGross(offer)), tone: 'positive' }, { id: 'term', label: 'Paid production', value: offer.months + ' months', tone: 'neutral' }];
    if (offer.exclusivity) {
      const rights = modelBrandTerm(offer);
      terms.push({ id: 'rights', label: 'Exclusive rights from signing', value: rights + ' months', tone: 'neutral' }, { id: 'appearances', label: 'Required brand appearances', value: String(Math.ceil(rights / 3)), tone: 'neutral' }, { id: 'claim', label: 'Cancellation or breach claim · 20% of agreed gross', value: boardMoney(roundRatio(offerGross(offer), 5n)), tone: 'negative' }, { id: 'restrictions', label: 'Competing endorsements restricted', value: 'Style and fitness sponsorships, including Social; competing advertising, ambassador and luxury bookings', tone: 'neutral' });
    }
    dialog.confirm({ type: 'model-casting', offerId: offer.id, quotedAnnualPay: offer.annualPay }, 'Attend the casting for ' + offer.title + '?', 'The client considers your skill, portfolio, professional standing and representation. Selection is not guaranteed. If booked, pay arrives during real working months.' + (offer.exclusivity ? ' Exclusive rights continue for the full agreed term. Abandoning the booking, breaching exclusivity or leaving required appearances unfulfilled creates the quoted settlement claim.' : ''), terms, 'Attend Casting');
  };
  const leaveCareer = () => {
    const brand = state.brands.find(item => item.status === 'active' && item.projectId === project?.id);
    const terms: EffectRow[] = brand ? [{ id: 'claim', label: 'Claim for abandoning this booking · 20% of agreed gross', value: formatMoney({ minor: modelBrandQuote(world, brand, 'breach'), currency: brand.currency }), tone: 'negative' }, { id: 'appearances', label: 'Remaining brand appearances', value: String(Math.max(0, brand.obligations - brand.fulfilled)), tone: 'neutral' }] : [];
    dialog.confirm({ type: 'leave-career', careerId: career.id }, 'Leave your modelling career?', 'Unfinished work stops. Your portfolio, paid earnings, relationships and recorded agreements remain; outstanding brand obligations still need to be settled.' + (brand ? ' Abandoning this exclusive booking creates the quoted settlement debt, which remains due until paid.' : ''), terms, 'Leave Modelling');
  };
  const agency = (tier: 'independent' | 'boutique' | 'major', negotiate: boolean) => dialog.confirm({ type: 'model-agency', tier, negotiate }, negotiate ? 'Negotiate your representation?' : tier === 'independent' ? 'Become an independent model?' : 'Review agency representation?', negotiate ? 'Ask for a better commission on future bookings. The agency’s response depends on your standing and working relationship.' : 'Connections influence the castings you can pursue. Existing booking commissions and brand obligations keep their agreed terms.', representationTerms(career, tier, negotiate), negotiate ? 'Negotiate Agreement' : tier === 'independent' ? 'Become Independent' : 'Sign Representation');
  const chooseFocus = () => {
    let draft = [...state.specialisations];
    const select = () => dialog.select('Your modelling specialisations', 'Build one to three areas, then review the whole set. A confirmed change commits you for twelve months. Existing work and portfolio skills stay yours.', [
      ...modelSpecialisations.map(id => ({ id, label: modelSpecialisationContent[id].title + (draft.includes(id) ? ' · Selected' : ''), disabledReason: draft.includes(id) && draft.length === 1 ? 'Keep at least one specialisation' : !draft.includes(id) && draft.length === 3 ? 'Remove an area before adding another' : undefined })),
      { id: 'review', label: 'Review Specialisations', disabledReason: modelSpecialisationReason(world, draft) },
    ], value => {
      if (value === 'review') { dialog.confirm({ type: 'model-specialise', specialisations: [...draft] }, 'Update your modelling identity?', draft.map(id => modelSpecialisationContent[id].title).join(' · ') + '. These areas shape future castings. Existing bookings and portfolio skills stay intact. You can change the set again after twelve months.', [], 'Set Specialisations'); return; }
      const specialisation = value as ModelSpecialisation;
      draft = draft.includes(specialisation) ? draft.filter(item => item !== specialisation) : [...draft, specialisation];
      select();
    });
    select();
  };
  const portfolioWork = () => dialog.select('Develop your portfolio', 'Choose an area for your next shoot. Portfolio work is optional and limited by the current quarter.', modelSpecialisations.map(id => ({ id, label: modelSpecialisationContent[id].title + ' · ' + state.portfolio[id] + '%' })), value => {
    const specialisation = value as ModelSpecialisation;
    dialog.select('Choose your shoot', modelSpecialisationContent[specialisation].description, (['self', 'professional'] as const).map(style => ({ id: style, label: (style === 'self' ? 'Self-directed shoot' : 'Professional shoot') + ' · ' + portfolioMoney(modelPortfolioQuote(world, style)), disabledReason: modelPortfolioReason(world, specialisation, style) })), choice => {
      const style = choice as 'self' | 'professional', cost = modelPortfolioQuote(world, style);
      dialog.confirm({ type: 'model-portfolio', specialisation, style, quotedCost: cost }, 'Arrange this portfolio shoot?', style === 'professional' ? 'Pay the quoted shoot budget to strengthen this portfolio area and your professionalism. A stronger portfolio improves your chances at later castings.' : 'Develop this portfolio area with your own creative planning and effort.', [{ id: 'cost', label: 'Actual payment', value: portfolioMoney(cost), tone: cost ? 'negative' : 'neutral' }], 'Arrange Portfolio Shoot');
    });
  });
  return <Page><Header title="Model" onBack={() => router.back()} /><CreativeError error={!dialog.open ? error : null} />
    <Card><SocialBusinessIntro art={<CareerArt id="model" size={72} />} title="Your Modelling Career" eyebrow={active ? 'Booked · ' + project?.name : career.status === 'between' ? 'Between bookings' : creativeLabel(career.status)} body="A memorable editorial, a reliable commercial campaign and an exclusive luxury agreement reward different choices. Build the career that fits your portfolio." />
      <StatBar label="Modelling" value={person.skills.modeling} color={c.blue} /><StatBar label="Industry reputation" value={career.reputation} color={c.green} />
      <SocialBusinessFacts items={[{ label: 'Completed bookings', value: String(industry.completed) }, { label: 'Professionalism', value: state.professionalism + '%' }, { label: 'Recorded gross earnings', value: referenceMoney(totals.gross), note: 'Before commission and tax' }, { label: 'Agency commission paid', value: referenceMoney(totals.commission) }]} />
      <ActionRow title="Skills & Training" subtitle="Develop presentation, technique and professional experience" icon={<CareerArt id="training" size={36} />} onPress={() => router.push('/career-training')} />
    </Card>
    {['left', 'retired'].includes(career.status) && <Card><Heading size={20}>Return to Modelling</Heading>{entryReason && <Body muted>{entryReason}</Body>}<Button label="Review Modelling Return" disabled={busy || !!entryReason} onPress={() => dialog.confirm({ type: 'model-enter' }, 'Return to modelling?', 'Keep your portfolio, past clients and industry history. Review your next booking before committing to work.', [], 'Return to Modelling')} /></Card>}
    <CreativeAgency world={world} career={career} industry={industry} busy={busy} dialog={dialog} kind="model" onChange={agency} />
    <Card><Heading size={20}>Portfolio & Modelling Identity</Heading><Body muted>Your work builds experience in each area. Choose up to three specialisations and develop your own presentation and style.</Body>
      {modelSpecialisations.map(id => <StatBar key={id} label={modelSpecialisationContent[id].title} value={state.portfolio[id]} color={state.specialisations.includes(id) ? c.blue : c.green} />)}
      <Body>Focus: {state.specialisations.map(id => modelSpecialisationContent[id].title).join(' · ')}</Body>
      {state.lastSpecialisationMonth !== undefined && <Body muted>{creativeMonthNumber(world) < state.lastSpecialisationMonth + 12 ? 'Next specialisation change: ' + creativeMonthLabel(state.lastSpecialisationMonth + 12) + '.' : 'Specialisation changes are available now.'}</Body>}
      <Button label="Choose Specialisations" tone="secondary" disabled={busy || !!modelSpecialisationReason(world)} onPress={chooseFocus} />{state.lastPortfolioQuarter >= quarter && <Body muted>Your next portfolio shoot is available next quarter.</Body>}<Button label="Develop Portfolio" disabled={busy || state.lastPortfolioQuarter >= quarter} onPress={portfolioWork} />
      {state.notableWork.length > 0 && <ActionRow title="Notable Portfolio Work" subtitle={state.notableWork.length + ' retained credits' + (state.archivedWork ? ' · ' + state.archivedWork + ' earlier credits summarised' : '')} onPress={() => dialog.info('Your portfolio credits', 'Actual work, recorded quality and contractual receipts.', [...state.notableWork].reverse().map((work, index) => ({ id: String(index), label: work.title + ' · ' + work.date.year, value: modelSpecialisationContent[work.specialisation].title + ' · Quality ' + work.quality + '% · Gross ' + formatMoney({ minor: work.gross, currency: work.currency }), tone: 'neutral' })))} />}
    </Card>
    {active && project?.creative && <><CreativeCurrentProject career={career} /><Card><Heading size={20}>{project.creative.category === 'runway' ? 'Your Runway Approach' : 'Campaign Decisions'}</Heading><Body muted>Prepare, interpret the brief or discuss the remaining terms. Work progresses through normal calendar months.</Body>
      {modelProductionActions.map(action => <ActionRow key={action.id} title={action.title} subtitle={action.description} disabled={busy} disabledReason={modelProductionReason(world, project.id, action.id)} onPress={() => dialog.confirm({ type: 'model-production', projectId: project.id, action: action.id }, action.title + '?', action.description, [], 'Choose This Approach')} />)}
    </Card></>}
    <Card><Heading size={20}>Castings & Bookings</Heading><CreativeBookingClause world={world} industry={industry} /><Body muted>Weigh the fee, prestige, commitment and any exclusive rights. Fees arrive during paid production months. Exclusive rights and obligations may continue after production ends.</Body>
      {refreshReason && <Body muted>{refreshReason}</Body>}<Button label="Review New Bookings" tone="secondary" disabled={busy || !!refreshReason} onPress={() => dialog.confirm({ type: 'model-refresh-offers' }, 'Review this quarter’s bookings?', 'New castings appear as the calendar moves. Revisiting the list keeps recorded responses and existing contracts unchanged.', [], 'Review Booking List')} />
    </Card>
    {industry.board.map(offer => <CreativeOfferCard key={offer.id} offer={offer} money={boardMoney} reason={modelOfferReason(world, offer)} busy={busy} label="Review Casting" onReview={() => reviewCasting(offer)} onDecline={() => dialog.confirm({ type: 'model-decline', offerId: offer.id }, 'Decline ' + offer.title + '?', 'Pass on this opportunity and keep the rest of the list available.', [], 'Decline Booking')} />)}
    <Card><Heading size={20}>Brand Relationships & Agreements</Heading><Body muted>Exclusive rights can outlast production. Check the remaining obligations before accepting competing endorsements.</Body>
      {!state.brands.length && <Body muted>Ambassador and luxury agreements will appear here when you sign one.</Body>}
      {brandRows.slice(0, 8).map(brand => {
        const debt = brand.penaltyLiabilityId ? world.liabilities.find(item => item.id === brand.penaltyLiabilityId) : undefined;
        const outstanding = debt?.principal ?? 0n, actualPaid = brand.penaltyLiabilityId ? settlementPayments.get(brand.penaltyLiabilityId) ?? 0n : brand.penaltyPaid, brandMoney = (amount: bigint) => formatMoney({ minor: amount, currency: brand.currency });
        return <Card key={brand.id}><Heading size={18}>{brand.name}</Heading><Body>{creativeLabel(brand.sector)} · {creativeLabel(brand.status)}</Body><Body>Original booking fee: {brandMoney(brand.agreedFee)}</Body><Body muted>Obligations fulfilled: {brand.fulfilled} / {brand.obligations} · Rights end {Math.floor(brand.ends / 12)}-{String(brand.ends % 12 + 1).padStart(2, '0')}</Body>{actualPaid > 0n && <Body>Settlement paid: {brandMoney(actualPaid)}</Body>}
        {outstanding > 0n && <Body>Outstanding settlement: {brandMoney(outstanding)}</Body>}
        {(brand.status === 'active' ? ['fulfil', 'renegotiate', 'breach'] as const : outstanding > 0n ? ['breach'] as const : []).map(action => {
          const label = action === 'fulfil' ? 'Fulfil Agreement' : action === 'renegotiate' ? 'Negotiate Agreement' : outstanding > 0n ? 'Settle Contract Claim' : 'Break Exclusivity', cost = modelBrandQuote(world, brand, action);
          return <ActionRow key={action} title={label} subtitle={(action === 'fulfil' ? 'Attend an agreed obligation for ' : action === 'renegotiate' ? 'Review remaining terms with ' : 'Review the settlement for ') + brand.name} disabled={busy} disabledReason={modelBrandReason(world, brand, action)} onPress={() => dialog.confirm({ type: 'model-brand', brandId: brand.id, action, quotedCost: cost }, label + '?', action === 'breach' ? outstanding > 0n ? 'Pay the recorded outstanding contract claim. Previous payments and work stay in your history.' : 'Pay the agreed settlement to break these exclusive rights. This affects the client relationship and your professional standing; completed payments remain recorded.' : action === 'fulfil' ? 'Fulfil an actual obligation under this agreement. It adds no second salary or sponsorship payment.' : 'Ask the brand to revise the remaining terms. Your standing and working relationship determine whether it agrees.', cost ? [{ id: 'cost', label: 'Actual payment', value: brandMoney(cost), tone: 'negative' }] : [], label)} />;
        })}
      </Card>; })}
      {state.brands.length > 8 && <ActionRow title="Earlier Brand Agreements" subtitle={state.brands.length - 8 + ' more retained agreements'} onPress={() => dialog.info('Earlier brand agreements', 'Completed, cancelled and breached agreements keep their recorded histories.', brandRows.slice(8).map(brand => ({ id: brand.id, label: brand.name, value: creativeLabel(brand.status) + ' · ' + brand.fulfilled + '/' + brand.obligations + ' obligations', tone: 'neutral' })))} />}
    </Card>
    <CreativeMilestones industry={industry} /><CreativeHistory career={career} title="Modelling Career History" /><CreativeContacts world={world} industry={industry} />
    {['active', 'between'].includes(career.status) && <Card><ActionRow title="Leave This Modelling Career" subtitle="Stop future booking pay; preserve your portfolio and clients" disabled={busy} onPress={leaveCareer} /></Card>}
    {dialog.modal}
  </Page>;
}
