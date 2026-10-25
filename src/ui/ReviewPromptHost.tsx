import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useGame } from '../state/useGame';
import { reviewCandidateEligible, type ReviewOffer, type ReviewResponse } from '../reviews/tracker';
import { openStoreReview, requestNativeReview, reviewPromptSupported } from '../reviews/nativeReview';
import { reviewPromptMessage } from '../reviews/promptCopy';
import { Illustration } from '../assets/Illustration';
import { EventModal } from './EventModal';
import { hasAppModal, modalPresenceStore, useHasAppModal } from './modalPresence';

const offerContext = (offer: ReviewOffer | null) => offer ? JSON.stringify([offer.id, offer.lifeId, offer.personId, offer.revision]) : null;

/** Mounted once outside frozen screens. The review's own modal never blocks itself. */
export function ReviewPromptHost({visible}:{visible:boolean}) {
  const world=useGame(s=>s.world), tracker=useGame(s=>s.reviewTracker), offer=useGame(s=>s.reviewOffer);
  const busy=useGame(s=>s.busy), reviewBusy=useGame(s=>s.reviewBusy), error=useGame(s=>s.reviewError);
  const claim=useGame(s=>s.claimReview), respond=useGame(s=>s.respondReview), appModal=useHasAppModal();
  const [active,setActive]=useState(!AppState.currentState||AppState.currentState==='active');
  const [nativeRequest,setNativeRequest]=useState<ReviewOffer|null>(null);
  const anyModal=modalPresenceStore(state=>state.owners.size>0);
  const attempted=useRef<string|null>(null), submitting=useRef(false), mounted=useRef(true), liveOffer=useRef(offerContext(offer));
  const nativeInFlight=useRef(false);
  liveOffer.current=offerContext(offer);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{const subscription=AppState.addEventListener('change',state=>{if(state==='active')attempted.current=null;setActive(state==='active');});return()=>subscription.remove();},[]);
  const scoped=!!offer&&world?.id===offer.lifeId&&world.activePersonId===offer.personId&&world.revision===offer.revision;
  const clean=visible&&active&&reviewPromptSupported()&&!appModal;
  const latest=useRef({world,clean,busy,reviewBusy,offer});
  latest.current={world,clean,busy,reviewBusy,offer};
  const canPresent=(request:ReviewOffer)=>{
    const state=latest.current,w=state.world;
    return mounted.current&&state.clean&&!state.busy&&!state.reviewBusy&&!state.offer&&
      w?.id===request.lifeId&&w.activePersonId===request.personId&&w.revision===request.revision&&
      !w.pending&&!w.annual&&!w.deferred.length&&modalPresenceStore.getState().owners.size===0;
  };
  useEffect(()=>{
    if(!nativeRequest)return;
    if(!world||world.id!==nativeRequest.lifeId||world.activePersonId!==nativeRequest.personId||world.revision!==nativeRequest.revision){setNativeRequest(null);return;}
    if(anyModal||!canPresent(nativeRequest))return;
    let second:number|undefined;
    // Let the review card unmount and its native overlay disappear before
    // asking StoreKit/Play to present another surface.
    const first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>{
      if(nativeInFlight.current||!canPresent(nativeRequest))return;
      nativeInFlight.current=true;
      void requestNativeReview(()=>canPresent(nativeRequest)).then(async requested=>{
        // Sure is explicit permission to visit the store if the native API is
        // missing or fails. Play may silently suppress a successful request;
        // Settings also offers a direct store action for that case.
        if(!requested&&canPresent(nativeRequest))await openStoreReview(()=>canPresent(nativeRequest));
        if(mounted.current)setNativeRequest(current=>current?.id===nativeRequest.id?null:current);
      }).finally(()=>{nativeInFlight.current=false;});
    });});
    return()=>{cancelAnimationFrame(first);if(second!==undefined)cancelAnimationFrame(second);};
  },[nativeRequest,world,clean,busy,reviewBusy,offer,anyModal]);
  useEffect(()=>{
    if(!clean||busy||reviewBusy||offer||!world||!tracker||!reviewCandidateEligible(tracker,world)||hasAppModal())return;
    const token=world.id+':'+world.activePersonId+':'+world.revision;
    if(attempted.current===token)return;
    attempted.current=token;
    void claim();
  },[clean,busy,reviewBusy,offer,world,tracker,claim]);
  const answer=async(response:ReviewResponse)=>{
    if(!mounted.current||!scoped||!offer||liveOffer.current!==offerContext(offer)||!clean||busy||reviewBusy||submitting.current||hasAppModal())return;
    submitting.current=true;
    try {if(await respond(response)&&response==='sure'&&mounted.current)setNativeRequest(offer);}
    finally{submitting.current=false;}
  };
  const show=scoped&&!!offer&&clean&&!busy&&!!world&&!world.pending&&!world.annual&&!world.deferred.length;
  return <EventModal scope="stack" modalOwner="review" event={show?{id:offer.id,kind:'decision',title:'Enjoying Dreams?',body:reviewPromptMessage(tracker?.offerSequence??1),illustration:<Illustration id="relationship" size={64}/>,category:'romance',choices:[{id:'sure',label:'Sure'},{id:'later',label:'Maybe later'}]}:null} busy={reviewBusy} error={error} onChoose={id=>{if(id==='sure'||id==='later')void answer(id);}} onClose={()=>{void answer('later');}} />;
}
