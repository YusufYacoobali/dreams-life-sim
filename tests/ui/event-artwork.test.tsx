import React from 'react';
import { Image, StyleSheet } from 'react-native';
import * as Native from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { bindEvent, eventTemplates } from '../../src/game/content/events';
import { assetCatalog } from '../../src/game/content/assets';
import { copyWorld, encodeWorld, fullName, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import type { Pending } from '../../src/game/runtime';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { Illustration, illustrationCells } from '../../src/assets/Illustration';
import { FamilyArt, familyCells } from '../../src/assets/FamilyArt';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
import { healthLegalRects } from '../../src/assets/healthLegalLayout';
import { FameBusinessArt } from '../../src/assets/FameBusinessArt';
import { fameBusinessRects } from '../../src/assets/fameBusinessLayout';
import { CareerArt } from '../../src/assets/CareerArt';
import { careerRects } from '../../src/assets/careerLayout';
import { PetsLeisureArt, petIllustrations } from '../../src/assets/PetsLeisureArt';
import { OrdinaryHobbyArt, ordinaryHobbyIllustrations } from '../../src/assets/HobbyArt';
import { TravelArt } from '../../src/assets/TravelArt';
import { travelArtIds } from '../../src/assets/travelLayout';
import { SchoolArt } from '../../src/assets/SchoolArt';
import { schoolRects } from '../../src/assets/schoolLayout';
import { CatalogArt } from '../../src/assets/CatalogArt';
import { PolishArt, polishImages } from '../../src/assets/PolishArt';
import { EventModal, type EventPresentation } from '../../src/ui/EventModal';
import { resolveEventArtwork, presentationArtwork, type EventCategory } from '../../src/ui/eventArtwork';
import { ThemeProvider } from '../../src/ui/theme';
import { pupil } from '../support/pupil';
import cohort from '../fixtures/story-name-collision-cohort.json';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

let mockWorld: World;
const mockDispatch = jest.fn();
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: (state: unknown) => unknown) => selector({ world:mockWorld,busy:false,error:null,dispatch:mockDispatch }) }));
import { PendingEvent } from '../../src/ui/PendingEvent';
const frame = (children: React.ReactNode, dark = false) => <SafeAreaProvider initialMetrics={{ frame:{ x:0,y:0,width:320,height:700 },insets:{ top:24,bottom:24,left:0,right:0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}>{children}</ThemeProvider></SafeAreaProvider>;
const result = (illustration: string, id = 'registry-proof'): Pending => ({ kind:'result',id,title:'Literal title',body:'A friend mentioned a partner. This prose is not category metadata.',illustration,effects:[] });
const descriptor = (pending: Pending, world: World) => {
  const resolved = resolveEventArtwork(pending,world);
  if (!React.isValidElement<{ id:string }>(resolved.illustration)) throw new Error('Expected bundled artwork');
  return { category:resolved.category,type:resolved.illustration.type,id:resolved.illustration.props.id };
};
afterEach(() => { jest.restoreAllMocks(); mockDispatch.mockReset(); });

test.each([
  ['career',Illustration,'career'], ['rings',FamilyArt,'romance'], ['doctor',HealthLegalArt,'health'],
  ['court',HealthLegalArt,'legal'], ['shop',FameBusinessArt,'business'], ['astronaut',CareerArt,'career'],
  ['pet-parrot',PetsLeisureArt,'pets'], ['pet-dog',PolishArt,'pets'], ['leisure-guitar',PetsLeisureArt,'hobby'],
  ['leisure-reading',OrdinaryHobbyArt,'hobby'], ['paris',TravelArt,'travel'], ['project',SchoolArt,'school'],
  ['laptop',CatalogArt,'assets'], ['studio',CatalogArt,'assets'], ['engagement-ring',CatalogArt,'romance'], ['toys',PolishArt,'childhood'],
  ['music',CareerArt,'hobby'], ['stage',CareerArt,'career'], ['royalty',CareerArt,'career'], ['will',FamilyArt,'family'],
] as const)('saved artwork %s resolves through its actual bundled registry', (id,type,category) => {
  const world = pupil(), before = encodeWorld(world), pending = result(id);
  expect(descriptor(pending,world)).toMatchObject({ type,category });
  render(frame(<>{resolveEventArtwork(pending,world).illustration}</>));
  expect(screen.UNSAFE_getAllByType(Image)).toHaveLength(1);
  expect(screen.UNSAFE_getByType(Image).props.accessible).toBe(false);
  expect(encodeWorld(world)).toBe(before);
});

test('authored popup illustration IDs have bundled artwork instead of silently falling back to everyday', () => {
  const ids = new Set<string>();
  const walk = (directory:string) => {
    for (const entry of readdirSync(directory,{ withFileTypes:true })) {
      const file = join(directory,entry.name);
      if (entry.isDirectory()) { walk(file); continue; }
      if (!/\.tsx?$/.test(entry.name)) continue;
      const source = ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
      const visit = (node:ts.Node) => {
        if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'illustration' && ts.isStringLiteral(node.initializer)) ids.add(node.initializer.text);
        if (ts.isCallExpression(node) && node.expression.getText(source) === 'result' && node.arguments[0]?.getText(source) === 'world' && node.arguments[3] && ts.isStringLiteral(node.arguments[3])) ids.add(node.arguments[3].text);
        ts.forEachChild(node,visit);
      };
      visit(source);
    }
  };
  walk(join(__dirname,'../../src/game'));
  const world = pupil(), intentionalGeneric = new Set(['relationship','journal','everyday']);
  expect(ids.size).toBeGreaterThanOrEqual(60);
  for (const id of ids) if (!intentionalGeneric.has(id)) {
    expect({ authoredId:id,art:descriptor(result(id),world).id }).not.toEqual({ authoredId:id,art:'everyday' });
  }
});

test('every existing registry ID remains renderable, including all catalogue entries and safe unknown IDs', () => {
  const world = pupil(), before = encodeWorld(world);
  const ids = new Set([...Object.keys(illustrationCells),...Object.keys(familyCells),...Object.keys(healthLegalRects),
    ...Object.keys(fameBusinessRects),...Object.keys(careerRects),...Object.keys(petIllustrations),...Object.keys(ordinaryHobbyIllustrations),
    ...travelArtIds,...Object.keys(schoolRects),...assetCatalog.map(item=>item.id),...Object.keys(polishImages)]);
  for (const id of ids) {
    const resolved = resolveEventArtwork(result(id),world);
    expect(React.isValidElement(resolved.illustration)).toBe(true);
    expect(presentationArtwork(resolved.illustration,resolved.category).category).toBe(resolved.category);
  }
  for (const id of ['missing-art','__proto__','constructor']) expect(descriptor(result(id),world)).toEqual({ type:PolishArt,id:'everyday',category:'everyday' });
  expect(encodeWorld(world)).toBe(before);
});

test.each([
  ['shoe-principle','mischief','childhood'], ['first-mirror-guest','toys','childhood'],
  ['blanket-dragon','toys','childhood'], ['school-lunch-trade','school-life','school'],
  ['friend-different-budget','friends','friendship'], ['old-photo','family-life','family'],
  ['adult-accidental-living-exhibit','surprise','surprise'], ['useful-advice','everyday','everyday'],
] as const)('%s uses its registered scene context for decisions and old saved result IDs', (id,art,category) => {
  const world = pupil(), template = eventTemplates.find(item=>item.id===id)!;
  const decision: Pending = { kind:'decision',id:'event_2007_'+id,templateId:id,title:template.title,body:'Literal {parent} body with the word romance left untouched.',illustration:template.illustration,personIds:[world.activePersonId],choices:[] };
  const before = JSON.stringify(decision), snapshot = encodeWorld(world);
  expect(descriptor(decision,world)).toEqual({ type:PolishArt,id:art,category });
  expect(descriptor(result(template.illustration,decision.id+'_result'),world)).toEqual({ type:PolishArt,id:art,category });
  expect(JSON.stringify(decision)).toBe(before); expect(encodeWorld(world)).toBe(snapshot);
});

test('romantic templates retain the heart, while an unknown heart cannot invent a romantic story', () => {
  const world = pupil(), pending = result('relationship','event_2030_partner-phone-attention_result');
  expect(descriptor(pending,world)).toEqual({ type:Illustration,id:'relationship',category:'romance' });
  expect(descriptor({ ...pending,id:'event_2030_partner-phone-attention_result_extra' },world)).toEqual({ type:PolishArt,id:'everyday',category:'everyday' });
  expect(descriptor({ ...pending,id:'event_2030_partner-phone-attention' },world)).toEqual({ type:PolishArt,id:'everyday',category:'everyday' });
  expect(descriptor(result('relationship'),world)).toEqual({ type:PolishArt,id:'everyday',category:'everyday' });
  expect(descriptor(result('relationship','event_2030_invented-partner-template_result'),world)).toEqual({ type:PolishArt,id:'everyday',category:'everyday' });
});

test('legacy generic hearts use only bound people and saved roles, without rewriting a loaded decision', () => {
  mockWorld = pupil();
  const parent = mockWorld.relationships.find(row=>row.to===mockWorld.activePersonId&&row.roles.includes('parent'))!, person = mockWorld.people[parent.from];
  person.gender = 'female'; parent.parentType = 'adoptive';
  const template = eventTemplates.find(item=>item.id==='shoe-principle')!;
  const bound = bindEvent(mockWorld,template); delete bound.participants;
  mockWorld.pending = { ...bound,templateId:'historical-unknown',id:'legacy-mother-scene' };
  const before = encodeWorld(mockWorld);
  render(frame(<PendingEvent />));
  expect(screen.getByText('Adoptive mother · '+fullName(person))).toBeOnTheScreen();
  expect(screen.getByText(bound.body)).toBeOnTheScreen();
  expect(screen.UNSAFE_getByType(Image).props.source).toEqual(polishImages['family-life']);
  expect(encodeWorld(mockWorld)).toBe(before); expect(mockDispatch).not.toHaveBeenCalled();
  expect(mockWorld.pending).not.toHaveProperty('participants');
});

test('frozen participant names and school roles survive render, result acknowledgement and checkpoint reload without rebinding', () => {
  const record = cohort.records.find(row=>row.decisionPointer==='IT/result.json#/decisions/9')!, source = copyWorld(unpackCheckpoint(record.checkpoint));
  const scene = bindEvent(source,eventTemplates.find(row=>row.id==='teen-group-project-credit')!);
  const interrupt = scene.choices.find(choice=>choice.id==='interrupt')!;
  expect(interrupt).toMatchObject({ label:'Delete the pitch while they are presenting it',resultTitle:'The company has ceased trading',
    resultBody:'Leonardo Ferrari (classmate) faces a blank screen and shouts at you. Leonardo Ferrari (teacher) gives the incomplete presentation a poor mark. You spend the rest of the lesson arguing over who ruined it first.',
    journal:'I deleted Leonardo Ferrari (classmate)’s presentation mid-speech and damaged both our grade and our relationship.' });
  expect(new Set(scene.choices.map(choice=>choice.resultBody)).size).toBe(scene.choices.length);
  expect(new Set(scene.choices.map(choice=>choice.journal)).size).toBe(scene.choices.length);
  source.pending = scene;
  source.people[scene.participants![0].personId].firstName = 'Renamed after binding';
  mockWorld = unpackCheckpoint(packCheckpoint(source)); const before = encodeWorld(mockWorld), pending = mockWorld.pending!;
  const view = render(frame(<PendingEvent />,true));
  expect(screen.getByText('Classmate · Leonardo Ferrari')).toBeOnTheScreen();
  expect(screen.getByText('Teacher · Leonardo Ferrari')).toBeOnTheScreen();
  expect(screen.getByText(pending.body)).toBeOnTheScreen(); expect(encodeWorld(mockWorld)).toBe(before);
  expect(mockDispatch).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button',{ name:'Delete the pitch while they are presenting it' }));
  expect(mockDispatch).toHaveBeenCalledWith({ type:'choose',eventId:pending.id,choiceId:'interrupt' });
  const chosen = resolveCommand(mockWorld,{ type:'choose',eventId:pending.id,choiceId:'interrupt' });
  expect(chosen.pending).toMatchObject({kind:'result',title:interrupt.resultTitle,body:interrupt.resultBody,participants:scene.participants});
  expect(chosen.journal.at(-1)?.text).toBe(interrupt.journal);
  mockWorld = unpackCheckpoint(packCheckpoint(chosen)); view.rerender(frame(<PendingEvent />,true));
  expect(screen.getByText('Classmate · Leonardo Ferrari')).toBeOnTheScreen();
  expect(screen.getByText('Teacher · Leonardo Ferrari')).toBeOnTheScreen();
  expect(screen.getByText(interrupt.resultBody)).toBeOnTheScreen();
  expect(mockWorld.pending).toEqual(chosen.pending); expect(mockWorld.journal.at(-1)?.text).toBe(interrupt.journal);
  const cold = encodeWorld(mockWorld); fireEvent.press(screen.getByRole('button',{ name:'Continue' }));
  expect(mockDispatch).toHaveBeenLastCalledWith({ type:'acknowledge',resultId:chosen.pending!.id });
  expect(encodeWorld(mockWorld)).toBe(cold);
});

test.each([false,true])('local illustration components infer category colours and keep participant labels readable (dark=%s)', dark => {
  jest.spyOn(Native,'useWindowDimensions').mockReturnValue({ width:320,height:700,scale:2,fontScale:1.6 });
  const cases: { illustration:React.ReactNode;category:EventCategory }[] = [
    { illustration:<FamilyArt id="rose" size={64} />,category:'romance' },
    { illustration:<FamilyArt id="rings" size={64} />,category:'romance' },
    { illustration:<FamilyArt id="hearts" size={64} />,category:'romance' },
    { illustration:<FamilyArt id="carriage" size={64} />,category:'family' },
    { illustration:<PolishArt id="friends" size={64} />,category:'friendship' },
    { illustration:<SchoolArt id="project" size={64} />,category:'school' },
    { illustration:<HealthLegalArt id="doctor" size={64} />,category:'health' },
    { illustration:<TravelArt id="flight" width={64} />,category:'travel' },
    { illustration:<CatalogArt id="engagement-ring" size={64} />,category:'romance' },
  ];
  const choose = jest.fn(), base: EventPresentation = { kind:'result',id:'local-artwork',title:'Literal story',body:'Nothing is rewritten.',effects:[],participants:[{ personId:'bound-person',name:'A$& {teacher} Example',role:'adoptive mother' }] };
  const view = render(frame(<EventModal event={{ ...base,illustration:cases[0].illustration }} onChoose={choose} />,dark));
  const colors = new Map<EventCategory,string>();
  for (const item of cases) {
    view.rerender(frame(<EventModal event={{ ...base,illustration:item.illustration }} onChoose={choose} />,dark));
    expect(presentationArtwork(item.illustration).category).toBe(item.category);
    const color = StyleSheet.flatten(screen.getByTestId('event-artwork-badge').props.style).backgroundColor;
    if (colors.has(item.category)) expect(color).toBe(colors.get(item.category));
    colors.set(item.category,color);
    expect(screen.getByText('Adoptive mother · A$& {teacher} Example')).toBeOnTheScreen();
    expect(screen.getByText(base.body)).toBeOnTheScreen();
    expect(screen.getByRole('button',{ name:'Continue' })).toBeEnabled();
  }
  expect(new Set(colors.values()).size).toBe(colors.size);
  expect(colors.get('romance')).toBe(dark ? '#5D2D48' : '#FFE2ED');
  view.rerender(frame(<EventModal event={{ ...base,illustration:<FamilyArt id="hearts" />,category:'family' }} onChoose={choose} />,dark));
  expect(screen.UNSAFE_getByType(Image).props.source).toEqual(polishImages['family-life']);
  expect(StyleSheet.flatten(screen.getByTestId('event-artwork-badge').props.style).backgroundColor).toBe(colors.get('family'));
  fireEvent.press(screen.getByRole('button',{ name:'Continue' })); expect(choose).toHaveBeenCalledWith('continue');
});
