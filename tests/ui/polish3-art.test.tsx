import React from 'react';
import { Image } from 'react-native';
import { render,screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { decodeWorld,type World } from '../../src/game/model';
import { jobs } from '../../src/game/content/jobs';
import { jobArtIds } from '../../src/assets/JobArt';
import { personActionArtIds } from '../../src/assets/PersonActionArt';
import { financeImages } from '../../src/assets/financeImages';
import { polishImages } from '../../src/assets/polishImages';
import { ThemeProvider } from '../../src/ui/theme';
import manifest from '../../assets/generated/polish3/manifest.json';
import graduate from '../fixtures/v3-employed-graduate.json';

let mockWorld:World;
jest.mock('expo-router',()=>({router:{push:jest.fn(),back:jest.fn()},Redirect:()=>null,useLocalSearchParams:()=>({})}));
jest.mock('../../src/state/useGame',()=>({useGame:(select:(state:unknown)=>unknown)=>select({world:mockWorld,busy:false,error:null,dispatch:jest.fn()})}));
import Assets from '../../app/(game)/(tabs)/assets';
import Profile from '../../app/(game)/profile';
import Finances from '../../app/(game)/finances';
import Bank from '../../app/(game)/bank';

const frame=(child:React.ReactNode)=><SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width:390,height:844},insets:{top:47,bottom:34,left:0,right:0}}}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>;
const images=()=>screen.UNSAFE_getAllByType(Image).map(node=>node.props.source);

test('ordinary jobs and common actions have distinct transparent offline illustrations',()=>{
 expect([...jobArtIds].sort()).toEqual(jobs.filter(job=>!job.specialCareer).map(job=>job.id).sort());
 expect(personActionArtIds).toEqual(expect.arrayContaining(['talk','compliment','spend-time','argue','apologise','insult','ask-advice','ask-money','ask-loan','give-money','praise','scold','distance']));
 const icons=Object.values(manifest.icons),hashes=new Set<string>();
 expect(icons).toHaveLength(jobArtIds.length+personActionArtIds.length+2);
 for(const icon of icons){
  const bytes=readFileSync(join(__dirname,'../../assets/generated/polish3',icon.file));
  expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(bytes.readUInt32BE(16)).toBe(256);expect(bytes.readUInt32BE(20)).toBe(256);expect(bytes[25]).toBe(6);
  const hash=createHash('sha256').update(bytes).digest('hex');expect(hash).toBe(icon.sha256);hashes.add(hash);
 }
 expect(hashes.size).toBe(icons.length);
});

test('Assets, Profile, Finances and Bank retain separate wealth, accounting and loan artwork',()=>{
 mockWorld=decodeWorld(JSON.stringify(graduate));
 const view=render(frame(<Assets/>));
 expect(images()).toContainEqual(financeImages['net-worth']);expect(images()).toContainEqual(financeImages.finances);expect(images()).toContainEqual(polishImages.loan);
 expect(financeImages['net-worth']).not.toEqual(financeImages.finances);expect(financeImages.finances).not.toEqual(polishImages.loan);
 expect(screen.getByRole('button',{name:/Real Estate/})).toBeOnTheScreen();
 view.rerender(frame(<Profile/>));expect(images()).toContainEqual(financeImages['net-worth']);
 view.rerender(frame(<Finances/>));expect(images()).toContainEqual(financeImages.finances);
 view.rerender(frame(<Bank/>));expect(images()).toContainEqual(financeImages.finances);
});
