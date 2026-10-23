import React from 'react';
import { createRoot } from 'react-dom/client';
import { ScrollView,Text,View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../src/ui/theme';
import { FeedbackProvider } from '../../src/ui/feedback';
import { Portrait } from '../../src/ui/components';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { ageOn,fullName } from '../../src/game/model';
import Assets from '../../app/(game)/(tabs)/assets';
import Profile from '../../app/(game)/profile';
import Finances from '../../app/(game)/finances';
import Jobs from '../../app/(game)/jobs';
import Person from '../../app/(game)/person/[id]';
import Shopping from '../../app/(game)/shopping/[kind]';
import Offer from '../../app/(game)/offer/[id]';
import Rental from '../../app/(game)/rental/[id]';
import { galleryPeople,reviewScreen,reviewWorld } from './state';

const query=new URLSearchParams(location.search),dark=query.get('theme')==='dark';
const screens:Record<string,React.ComponentType>={assets:Assets,profile:Profile,finances:Finances,jobs:Jobs,person:Person,support:Person,shopping:Shopping,offer:Offer,rental:Rental};
function Gallery(){
 const world=reviewWorld();
 return <View style={{padding:20,gap:24,flexShrink:0,backgroundColor:dark?'#1B2433':'#F8F7F5'}}>
  {(['male','female','nonbinary'] as const).map(gender=><View key={gender} style={{gap:12,flexShrink:0}}>
   <Text style={{fontSize:22,fontWeight:'700',color:dark?'#fff':'#0B1545'}}>{gender==='nonbinary'?'Neutral defaults':gender==='male'?'50 male defaults':'50 female defaults'}</Text>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{galleryPeople.filter(row=>row.gender===gender).map(row=>{
    const person=world.people[row.id];return <View key={person.id} style={{width:104,alignItems:'center',gap:5,paddingVertical:5,backgroundColor:dark?'#303D52':'#F0F1F3',borderRadius:14}}>
     <Portrait name={fullName(person)} personId={person.id} appearance={person.appearance} age={ageOn(person,world.date)} size={88}/>
     <Text style={{fontSize:11,color:dark?'#fff':'#0B1545'}}>Age {row.age} · Skin {person.appearance.skin+1}</Text>
    </View>;
   })}</View>
  </View>)}
 </View>;
}
const Screen=screens[reviewScreen];
createRoot(document.getElementById('root')!).render(<SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width:innerWidth,height:innerHeight},insets:{top:24,bottom:20,left:0,right:0}}}>
 <ThemeProvider appearance={dark?'dark':'light'}><FeedbackProvider reducedMotion haptics={false} onButtonFeedback={async()=>{}} soundEffects={false}>
  {reviewScreen==='portraits'?<Gallery/>:Screen?<><Screen/><PendingEvent/></>:<Text>Unknown review screen</Text>}
 </FeedbackProvider></ThemeProvider>
</SafeAreaProvider>);
