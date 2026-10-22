import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import type { GameCommand } from '../../../src/game/engine';
import { assetCatalog } from '../../../src/game/content/assets';
import { rentalQuote, rentalReason } from '../../../src/game/systems/rentalHomes';
import { rentalResidence } from '../../../src/game/systems/rentalSchemas';
import { accountFor } from '../../../src/game/systems/common';
import { fullName } from '../../../src/game/model';
import { countries } from '../../../src/game/countries';
import { formatMoney } from '../../../src/game/money';
import { CatalogArt } from '../../../src/assets/CatalogArt';
import { Body, Button, Card, Header, Heading, Page } from '../../../src/ui/components';
import { EventModal, type EventPresentation } from '../../../src/ui/EventModal';
import { SocialBusinessFacts as Facts } from '../../../src/ui/SocialBusinessPresentation';
import { useColors } from '../../../src/ui/theme';

type Review = { identity: string; command: GameCommand; event: EventPresentation };
export default function Rental() {
  const { id }=useLocalSearchParams<{id:string}>();
  const identity=useGame(s => s.world ? s.world.id+':'+s.world.activePersonId : 'none');
  return <RentalDetails key={identity+':'+id} id={id} />;
}
function RentalDetails({id}:{id:string}) {
  const world=useGame(s=>s.world)!, dispatch=useGame(s=>s.dispatch), busy=useGame(s=>s.busy), error=useGame(s=>s.error), c=useColors();
  const player=world.people[world.activePersonId], offer=assetCatalog.find(item=>item.id===id&&item.kind==='property');
  const residence=rentalResidence(world), lease=residence?.catalogId===id ? residence : undefined;
  const identity=JSON.stringify([world.id,player.id,player.country,player.city,player.died,player.householdId,world.revision,residence?.id]);
  const identityRef=useRef(identity), mounted=useRef(true), submitting=useRef(false), reviewRef=useRef<Review|null>(null);
  identityRef.current=identity;
  if(reviewRef.current&&reviewRef.current.identity!==identity) reviewRef.current=null;
  const [review,setReview]=useState<Review|null>(null), current=review?.identity===identity&&reviewRef.current===review ? review : null;
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;reviewRef.current=null;};},[]);
  useEffect(()=>{setReview(saved=>saved&&saved.identity!==identity?null:saved);},[identity]);
  if(!offer) return <Page><Header title="Rental unavailable" onBack={()=>router.back()} /><Body>This home could not be found.</Body></Page>;
  const quote=rentalQuote(world,offer), rent=lease?.monthlyRent??quote.monthlyRent, currency=lease?.currency??quote.currency;
  const money=(minor:bigint)=>formatMoney({minor,currency}), reason=rentalReason(world,offer), holder=lease&&world.people[lease.tenantId];
  const open=(ending:boolean)=>{
    if(!mounted.current||busy||submitting.current||identityRef.current!==identity||(!ending&&reason)||(ending&&lease?.tenantId!==player.id))return;
    const next:Review={identity,command:ending?{type:'end-home-lease',leaseId:lease!.id}:{type:'sign-home-lease',catalogId:offer.id,quotedRent:quote.monthlyRent},event:{id:(ending?'end-lease:':'sign-lease:')+identity,kind:'confirmation',title:ending?'Move out of '+lease!.name+'?':'Rent '+offer.name+'?',body:ending?'Future rent will stop. Your normal housing budget resumes. Rent already paid is not refunded.':'Your household will move in. The first month is due now, with no deposit. Rent is due monthly until you move out; unpaid rent becomes debt.',terms:ending?[]:[{id:'rent',label:'Monthly rent',value:money(rent),tone:'negative'},{id:'today',label:'Due today',value:money(rent),tone:'negative'},{id:'term',label:'Lease term',value:'Month to month',tone:'neutral'}],confirmLabel:ending?'Move Out':'Sign Lease'}};
    reviewRef.current=next;setReview(next);
  };
  const cancel=()=>{if(!mounted.current||!current||busy||submitting.current||reviewRef.current!==current||identityRef.current!==current.identity)return;reviewRef.current=null;setReview(null);};
  return <Page><Header title="Rental Details" backDisabled={!!current&&busy} onBack={()=>{if(!submitting.current)router.back();}} />
    <Card><View style={{alignItems:'center'}}><CatalogArt id={offer.id} size={190} /></View><Heading>{offer.name}</Heading><Body>{offer.description}</Body><Body muted>{player.city}, {countries[player.country].name}</Body><Heading size={28}>{money(rent)} / month</Heading>{offer.bedrooms&&<Body muted>{offer.bedrooms} {offer.bedrooms===1?'bedroom':'bedrooms'}</Body>}</Card>
    {lease ? <Card><Heading size={20}>Your Rented Home</Heading><Body>Leaseholder: {fullName(holder!)}</Body><Facts items={[{label:'Monthly rent',value:money(rent)},{label:'Lease term',value:'Month to month'}]} /><Body muted>Rent is paid once a month by the leaseholder. Adults share the other household bills.</Body>{lease.tenantId===player.id?<Button label="Review Move Out" tone="secondary" disabled={busy} onPress={()=>open(true)} />:<Body muted>Only the leaseholder can end this lease.</Body>}</Card> : <Card><Heading size={20}>Review your lease</Heading><Facts items={[{label:'Monthly rent',value:money(rent)},{label:'Due today',value:money(rent),note:'First month · no deposit or signing fee'},{label:'Account balance',value:formatMoney({minor:accountFor(world).cash,currency:accountFor(world).currency})},{label:'Lease term',value:'Month to month'}]} /><Body muted>Rent replaces your usual housing costs. You still pay your share of other bills. Any home you own remains yours.</Body>{reason&&<Body>{reason}</Body>}<Button label="Review Lease" accessibilityLabel={['Review Lease',reason].filter(Boolean).join('. ')} disabled={busy||!!reason} onPress={()=>open(false)} /></Card>}
    {error&&!current&&<Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{color:c.red,fontSize:16}}>{error}</Text>}
    <EventModal event={current?.event??null} busy={busy} error={error} onCancel={cancel} onChoose={async()=>{
      if(!mounted.current||!current||busy||submitting.current||reviewRef.current!==current||identityRef.current!==current.identity)return;
      submitting.current=true;
      try{if(await dispatch(current.command)&&mounted.current&&identityRef.current===current.identity&&reviewRef.current===current){reviewRef.current=null;setReview(null);}}finally{submitting.current=false;}
    }} />
  </Page>;
}
