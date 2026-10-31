import { LifestylePetArt, lifestylePetRects } from '../assets/LifestylePetArt';
import { OutingArt } from '../assets/OutingArt';
import { CultArt, cultImages, type CultArtId } from '../assets/CultArt';
import React from 'react';
import type { World } from '../game/model';
import type { Pending, StoryParticipant } from '../game/runtime';
import { eventTemplates } from '../game/content/events';
import type { EventTemplate } from '../game/content/eventTypes';
import { assetCatalog } from '../game/content/assets';
import { storyParticipants } from '../game/storyNames';
import { Illustration, illustrationCells, type IllustrationId } from '../assets/Illustration';
import { FamilyArt, familyCells, type FamilyArtId } from '../assets/FamilyArt';
import { HealthLegalArt, type HealthLegalArtId } from '../assets/HealthLegalArt';
import { healthLegalRects } from '../assets/healthLegalLayout';
import { FameBusinessArt, type FameBusinessArtId } from '../assets/FameBusinessArt';
import { fameBusinessRects } from '../assets/fameBusinessLayout';
import { CareerArt, type CareerArtId } from '../assets/CareerArt';
import { careerRects } from '../assets/careerLayout';
import { PetsLeisureArt, petIllustrations } from '../assets/PetsLeisureArt';
import { HobbyArt, OrdinaryHobbyArt, ordinaryHobbyIllustrations } from '../assets/HobbyArt';
import { TravelArt } from '../assets/TravelArt';
import { travelArtIds } from '../assets/travelLayout';
import { SchoolArt } from '../assets/SchoolArt';
import { schoolRects } from '../assets/schoolLayout';
import { CatalogArt } from '../assets/CatalogArt';
import { PolishArt, polishImages, type PolishArtId } from '../assets/PolishArt';
import { lightColors, type Colors } from './theme';
import { JobArt, jobArtIds } from '../assets/JobArt';
import { EmploymentArt } from '../assets/EmploymentArt';
import { PersonActionArt, personActionArtIds } from '../assets/PersonActionArt';
import { FinanceArt } from '../assets/FinanceArt';
import { PlatformMark } from '../assets/PlatformMark';
import { platforms, platformArtId } from '../game/content/social';

export type EventCategory = 'romance' | 'family' | 'friendship' | 'childhood' | 'school' | 'surprise' | 'everyday'
  | 'health' | 'legal' | 'travel' | 'pets' | 'hobby' | 'career' | 'business' | 'assets' | 'money' | 'milestone';
export type EventArtwork = { illustration: React.ReactNode; category: EventCategory };

const badgeColors: Record<EventCategory, readonly [string, string]> = {
  romance: ['#FFE2ED', '#5D2D48'], family: ['#FFF0DA', '#55412E'], friendship: ['#DDF5ED', '#244C44'],
  childhood: ['#FFF3CC', '#54472B'], school: ['#E2EEFF', '#293F61'], surprise: ['#FFF0C7', '#55462B'],
  everyday: ['#EDE8FA', '#403B58'], health: ['#DDF4EA', '#294C42'], legal: ['#E4EAF3', '#37445A'],
  travel: ['#DDF1FF', '#24475D'], pets: ['#FFEBD8', '#57402F'], hobby: ['#EBE6FB', '#41375B'],
  career: ['#E0F3DE', '#304D36'], business: ['#E0F3DE', '#304D36'], assets: ['#DEF3F2', '#2B4C4F'],
  money: ['#E7F3DB', '#3C4C2C'], milestone: ['#FFF1CA', '#55482C'],
};
export function eventBadgeColor(category: EventCategory, colors: Colors): string {
  return badgeColors[category][colors.surface === lightColors.surface ? 0 : 1];
}

const polishCategories: Record<PolishArtId, EventCategory> = {
  toys:'childhood', mischief:'childhood', 'school-life':'school', friends:'friendship', 'family-life':'family',
  surprise:'surprise', everyday:'everyday', 'health-check':'health', 'life-star':'milestone', archive:'everyday', settings:'everyday', loan:'money',
  'pet-cat':'pets', 'pet-dog':'pets', 'pet-rabbit':'pets', 'pet-bird':'pets', 'pet-feed':'pets', 'pet-vet':'pets',
  'pet-play':'pets', 'pet-training':'pets', 'pet-memorial':'pets', 'pet-walk':'pets', 'pet-bed':'pets', 'pet-adoption':'pets',
};
const mainCategories: Record<IllustrationId, EventCategory> = {
  education:'school', career:'career', relationship:'everyday', property:'assets', money:'money', vehicle:'assets', travel:'travel',
  pets:'pets', wellbeing:'health', crime:'legal', journal:'everyday', birthday:'milestone',
};
const romanticArt = new Set(['relationship', 'rings', 'rose', 'hearts', 'breakup', 'engagement-ring']);
const legalArt = new Set(['court','police','prison','handcuffs','justice','prison-meal','prison-visit','release']);
const businessArt = new Set(['shop','cafe','delivery','software','team','factory','business','growth']);
const catalogueKinds = new Map(assetCatalog.map(item => [item.id,item.kind]));
const templates = new Map(eventTemplates.map(template => [template.id,template]));

// A fixed registry caches the small React artwork descriptions, never worlds or
// generated outcomes. Earlier ambiguous atlas IDs keep their existing source.
const artwork = new Map<string, EventArtwork>();
function register(id: string, illustration: React.ReactNode, category: EventCategory) {
  if (!artwork.has(id)) artwork.set(id,{ illustration,category });
}
for (const platform of platforms) register(platformArtId(platform),<PlatformMark platform={platform} size={64} />,'career');
for (const id of Object.keys(polishImages) as PolishArtId[]) register(id,<PolishArt id={id} size={64} />,polishCategories[id]);
for (const id of Object.keys(illustrationCells) as IllustrationId[]) register(id,<Illustration id={id} size={64} />,mainCategories[id]);
for (const id of Object.keys(familyCells) as FamilyArtId[]) register(id,<FamilyArt id={id} size={64} />,romanticArt.has(id) ? 'romance' : 'family');
for (const id of Object.keys(healthLegalRects) as HealthLegalArtId[]) register(id,<HealthLegalArt id={id} size={64} />,legalArt.has(id) ? 'legal' : 'health');
for (const id of Object.keys(fameBusinessRects) as FameBusinessArtId[]) register(id,<FameBusinessArt id={id} size={64} />,businessArt.has(id) ? 'business' : 'career');
for (const id of Object.keys(careerRects) as CareerArtId[]) register(id,<CareerArt id={id} size={64} />,'career');
for (const id of jobArtIds) register('job:'+id,<JobArt id={id} size={64} />,'career');
const moneyActions = new Set(['ask-money','ask-loan','give-money','request-gift','accept-loan','decline-loan','repay-loan','request-raise']);
const romanceActions = new Set(['ask-date','propose','plan-wedding','divorce','breakup','ask-teen-date','end-teen-relationship']);
const familyActions = new Set(['ask-advice','ask-permission','ask-activity','praise','scold','ask-help','review-custody','move-in','family-planning']);
const actionCategory = (id:string):EventCategory => moneyActions.has(id) ? 'money' : romanceActions.has(id) ? 'romance' : familyActions.has(id) ? 'family' : id==='academic-help' ? 'school' : id==='work-feedback' ? 'career' : 'friendship';
for (const id of personActionArtIds) register('person-action:'+id,<PersonActionArt id={id} size={64} />,actionCategory(id));
register('finance:net-worth',<FinanceArt id="net-worth" size={64} />,'assets');
register('finance:finances',<FinanceArt id="finances" size={64} />,'money');
// Authored music scenes saved this older ID before the career atlas named its
// guitar/microphone illustration "musician". Keep the saved ID compatible.
register('music',<CareerArt id="musician" size={64} />,'hobby');
for (const id of Object.keys(petIllustrations) as (keyof typeof petIllustrations)[]) register(id,<PetsLeisureArt id={petIllustrations[id]} size={64} />,id.startsWith('pet-') ? 'pets' : 'hobby');
for (const id of Object.keys(ordinaryHobbyIllustrations) as (keyof typeof ordinaryHobbyIllustrations)[]) register(id,<OrdinaryHobbyArt id={ordinaryHobbyIllustrations[id]} size={64} />,'hobby');
for (const id of travelArtIds) register(id,<TravelArt id={id} width={64} />,'travel');
for (const id of Object.keys(schoolRects) as (keyof typeof schoolRects)[]) register(id,<SchoolArt id={id} size={64} />,'school');
for (const item of assetCatalog) register(item.id,<CatalogArt id={item.id} size={64} />,item.id === 'engagement-ring' ? 'romance' : 'assets');

for (const id of Object.keys(cultImages) as CultArtId[]) register(id === 'cult' ? 'cult' : 'cult-' + id, <CultArt id={id} size={64} />, 'career');

for (const id of Object.keys(lifestylePetRects) as (keyof typeof lifestylePetRects)[]) register('pet-' + id, <LifestylePetArt id={id} size={64} />, 'pets');
for (const kind of ['running', 'swimming', 'writing', 'pottery', 'singing', 'coding', 'fishing', 'dancing'] as const) register('leisure-' + kind, <HobbyArt kind={kind} size={64} />, 'hobby');
for (const kind of ['theatre', 'comedy', 'park', 'aquarium', 'sports', 'festival'] as const) register('leisure-' + kind, <OutingArt kind={kind} size={64} />, 'hobby');


const categoryArt: Record<EventCategory, string> = {
  romance:'hearts', family:'family-life', friendship:'friends', childhood:'toys', school:'school-life', surprise:'surprise', everyday:'everyday',
  health:'health-check', legal:'justice', travel:'flight', pets:'pet-adoption', hobby:'leisure-guitar', career:'career', business:'business',
  assets:'property', money:'money', milestone:'life-star',
};
// These are specific comic situations, not keyword guesses from bound prose.
const sceneArt: Readonly<Record<string, PolishArtId>> = {
  'shoe-principle':'mischief', 'blanket-dragon':'toys', 'rainy-fort':'toys', 'broken-mug':'mischief',
  'first-echo':'toys', 'first-sock-escape':'mischief', 'first-mirror-guest':'toys',
  'toddler-wall-gallery':'mischief', 'toddler-grocery-microphone':'mischief', 'toddler-cardboard-rocket':'toys',
  'toddler-suspicious-haircut':'mischief', 'child-lost-button':'toys', 'child-first-sleepover-plan':'toys',
  'adult-accidental-living-exhibit':'surprise',
};

function sceneTemplate(pending: Pending): EventTemplate | undefined {
  if (pending.kind === 'decision') return templates.get(pending.templateId);
  // Old choice results retain the original event ID followed by _result.
  // An exact registered suffix avoids matching unrelated user/asset IDs.
  const id = /^event_\d+_(.+)_result$/.exec(pending.id)?.[1];
  return id ? templates.get(id) : undefined;
}
function templateCategory(template: EventTemplate): EventCategory | undefined {
  if (template.partner || template.widowed) return 'romance';
  if (template.school || template.classmate || template.teacher || template.study) return 'school';
  if (template.parent || template.child) return template.max <= 8 ? 'childhood' : 'family';
  if (template.friend) return 'friendship';
  if (template.legal) return 'legal';
  if (template.specialCareer === 'business') return 'business';
  if (template.workplace || template.coworker || template.supervisor || template.specialCareer) return 'career';
  if (template.pet) return 'pets';
  if (template.hobby) return 'hobby';
  if (template.visited) return 'travel';
  if (template.chronicCondition) return 'health';
  if (template.home) return 'assets';
  if (template.max <= 12) return 'childhood';
}
function boundCategory(participants: readonly StoryParticipant[]): EventCategory | undefined {
  const roles = new Set(participants.flatMap(person => person.role.toLowerCase().split(' / ')));
  if (['spouse','partner','fiancé','late spouse','former partner'].some(role => roles.has(role))) return 'romance';
  if (['classmate','teacher'].some(role => roles.has(role))) return 'school';
  if (['mother','father','parent','adoptive mother','adoptive father','adoptive parent','guardian','daughter','son','child','adopted daughter','adopted son','adopted child','child in your care','sibling'].some(role => roles.has(role))) return 'family';
  if (['friend','acquaintance','new acquaintance'].some(role => roles.has(role))) return 'friendship';
  if (['coworker','supervisor'].some(role => roles.has(role))) return 'career';
}

/** Read-only compatibility for frozen scenes; never edits their story/effects. */
export function resolveEventArtwork(pending: Pending, world: World): EventArtwork {
  const template = sceneTemplate(pending), specific = template && sceneArt[template.id];
  if (specific) return artwork.get(specific)!;
  const source = artwork.get(pending.illustration);
  const context = template && (templateCategory(template) ?? (template.dramatic && pending.illustration === 'journal' ? 'surprise' : undefined));
  const people = pending.participants ?? (pending.kind === 'decision' ? storyParticipants(world,pending.personIds) : []);
  const genericStoryArt = ['relationship','journal','conversation'].includes(pending.illustration);
  const category = context ?? (romanticArt.has(pending.illustration) || genericStoryArt || !source ? boundCategory(people) : undefined) ?? source?.category ?? 'everyday';
  const generic = genericStoryArt
    || category === 'school' && pending.illustration === 'education' && !!template;
  if (!source || (generic && category !== 'romance') || (romanticArt.has(pending.illustration) && category !== 'romance')) {
    return { illustration:artwork.get(categoryArt[category])!.illustration,category };
  }
  return { illustration:source.illustration,category };
}

/** Local reviews keep the public ReactNode API and may supply explicit context. */
export function presentationArtwork(illustration: React.ReactNode, category?: EventCategory): EventArtwork {
  if (React.isValidElement<{ id?:string; children?:React.ReactNode }>(illustration)) {
    const { id } = illustration.props;
    let inferred: EventCategory | undefined;
    if (illustration.type === PolishArt && id && Object.hasOwn(polishCategories,id)) inferred = polishCategories[id as PolishArtId];
    else if (illustration.type === Illustration && id && Object.hasOwn(mainCategories,id)) inferred = mainCategories[id as IllustrationId];
    else if (illustration.type === FamilyArt) inferred = romanticArt.has(id ?? '') ? 'romance' : 'family';
    else if (illustration.type === HealthLegalArt) inferred = legalArt.has(id ?? '') ? 'legal' : 'health';
    else if (illustration.type === FameBusinessArt) inferred = businessArt.has(id ?? '') ? 'business' : 'career';
    else if (illustration.type === CareerArt || illustration.type === JobArt || illustration.type === EmploymentArt || illustration.type === PlatformMark) inferred = 'career';
    else if (illustration.type === PersonActionArt) inferred = actionCategory(id ?? '');
    else if (illustration.type === FinanceArt) inferred = id === 'net-worth' ? 'assets' : 'money';
    else if (illustration.type === TravelArt) inferred = 'travel';
    else if (illustration.type === SchoolArt) inferred = 'school';
    else if (illustration.type === CatalogArt) inferred = id === 'engagement-ring' ? 'romance' : catalogueKinds.has(id ?? '') ? 'assets' : undefined;
    else if (illustration.type === HobbyArt || illustration.type === OrdinaryHobbyArt) inferred = 'hobby';
    else if (illustration.type === PetsLeisureArt) inferred = ['dog','cat','rabbit','parrot','paw','vet'].includes(id ?? '') ? 'pets' : 'hobby';
    else if (illustration.type === React.Fragment) return presentationArtwork(illustration.props.children,category);
    const resolved = category ?? inferred ?? 'everyday';
    if (id && romanticArt.has(id) && inferred && resolved !== 'romance') return { illustration:artwork.get(categoryArt[resolved])!.illustration,category:resolved };
    return { illustration,category:resolved };
  }
  if (Array.isArray(illustration)) {
    const first = illustration.find(React.isValidElement);
    return { illustration,category:category ?? presentationArtwork(first).category };
  }
  return { illustration,category:category ?? 'everyday' };
}
