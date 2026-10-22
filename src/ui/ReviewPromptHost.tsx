import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useGame } from '../state/useGame';
import { reviewCandidateEligible, type ReviewResponse } from '../reviews/tracker';
import { nativeReviewAvailable, requestNativeReview } from '../reviews/nativeReview';
import { EventModal } from './EventModal';
import { hasAppModal, useHasAppModal } from './modalPresence';

/** Mounted once outside frozen screens. The review's own modal never blocks itself. */
export function ReviewPromptHost({visible}:{visible:boolean}) {
  const world=useGame(s=>s.world), tracker=useGame(s=>s.reviewTracker), offer=useGame(s=>s.reviewOffer);
  const busy=useGame(s=>s.busy), reviewBusy=useGame(s=>s.reviewBusy), error=useGame(s=>s.reviewError);
  const claim=useGame(s=>s.claimReview), respond=useGame(s=>s.respondReview), appModal=useHasAppModal();
  const [available,setAvailable]=useState(false), [active,setActive]=useState(!AppState.currentState||AppState.currentState==='active');
  const attempted=useRef<string|null>(null), submitting=useRef(false), mounted=useRef(true), liveOffer=useRef(offer?.id);
  liveOffer.current=offer?.id;
  useEffect(()=>{mounted.current=true;let live=true;void nativeReviewAvailable().then(value=>{if(live)setAvailable(value);});return()=>{live=false;mounted.current=false;};},[]);
  useEffect(()=>{const subscription=AppState.addEventListener('change',state=>setActive(state==='active'));return()=>subscription.remove();},[]);
  const scoped=!!offer&&world?.id===offer.lifeId&&world.activePersonId===offer.personId&&world.revision===offer.revision;
  const clean=visible&&active&&available&&!appModal;
  useEffect(()=>{
    if(!clean||busy||reviewBusy||offer||!world||!tracker||!reviewCandidateEligible(tracker,world)||hasAppModal())return;
    const token=world.id+':'+world.activePersonId+':'+world.revision;
    if(attempted.current===token)return;
    attempted.current=token;
    void claim();
  },[clean,busy,reviewBusy,offer,world,tracker,claim]);
  const answer=async(response:ReviewResponse)=>{
    if(!mounted.current||!scoped||!offer||liveOffer.current!==offer.id||!clean||busy||reviewBusy||submitting.current||hasAppModal())return;
    submitting.current=true;
    try {if(await respond(response)&&response==='sure')await requestNativeReview();}
    finally{submitting.current=false;}
  };
  const show=scoped&&!!offer&&clean&&!busy&&!!world&&!world.pending&&!world.annual&&!world.deferred.length;
  return <EventModal modalOwner="review" event={show?{id:offer.id,kind:'decision',title:'Enjoying Dreams?',body:'I’m building this game solo, and a quick store review would really help. Thanks for being part of Dreams! ❤️',choices:[{id:'sure',label:'Sure'},{id:'later',label:'Maybe later'}]}:null} busy={reviewBusy} error={error} onChoose={id=>{if(id==='sure'||id==='later')void answer(id);}} onClose={()=>{void answer('later');}} />;
}
