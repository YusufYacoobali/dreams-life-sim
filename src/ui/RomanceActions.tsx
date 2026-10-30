import React, { useEffect, useRef, useState } from 'react';
import type { World } from '../game/model';
import { romanceActionOptions, romanceActionReason } from '../game/systems/romanceDrama';
import type { RomanceCommand } from '../game/systems/romanceSchemas';
import { useGame } from '../state/useGame';
import { ActionRow, Card, Heading } from './components';
import { PersonActionArt } from '../assets/PersonActionArt';
import { EventModal, type EventPresentation } from './EventModal';

/** Only knowledge available to the player is exposed by the action query. */
export function RomanceActions({world,personId,blocked=false,onReviewChange}:{world:World;personId:string;blocked?:boolean;onReviewChange?:(open:boolean)=>void}) {
  const dispatch=useGame(s=>s.dispatch),busy=useGame(s=>s.busy),error=useGame(s=>s.error);
  const [action,setAction]=useState<RomanceCommand['action']|null>(null),submitting=useRef(false),mounted=useRef(true),reviewContext=useRef(''),current=useRef(world); current.current=world;
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{onReviewChange?.(!!action); return()=>onReviewChange?.(false);},[action,onReviewChange]);
  const options=romanceActionOptions(world,personId); if (!options.length) return null;
  const reviewKey=world.id+':'+world.activePersonId+':'+world.revision+':'+personId+':'+action;
  const selected=options.find(o=>o.action===action), target=world.people[personId];
  const event:EventPresentation|null=selected?{id:'romance-review:'+world.id+':'+world.activePersonId+':'+personId+':'+action,kind:'confirmation',illustration:'hearts',title:selected.label+'?',body:action==='affair'?'Ask '+target.firstName+' to begin an affair. They can refuse. If they agree, your partner may discover it.':action==='reconcile'?'Ask '+target.firstName+' whether they want to date again. They can refuse.':action==='confess'?'Tell '+target.firstName+' about your affair. They decide how to respond.':action==='decline-contact'?'Tell '+target.firstName+' you do not want further contact. You can later choose to allow it again.':'Have this conversation with '+target.firstName+'. Their answer is their own.',terms:[],confirmLabel:selected.label}:null;
  return <Card><Heading size={18}>Relationship Decisions</Heading>
    {options.map(o=><ActionRow key={o.action} title={o.label} icon={<PersonActionArt id={o.action==='affair'?'ask-date':o.action==='decline-contact'?'breakup':'talk'} size={40}/>} disabled={busy||blocked||!!world.pending} disabledReason={o.disabledReason} onPress={()=>{if(!busy&&!blocked&&!romanceActionReason(current.current,personId,o.action)){reviewContext.current=world.id+':'+world.activePersonId+':'+world.revision+':'+personId+':'+o.action;setAction(o.action);}}}/>)}
    <EventModal event={event} busy={busy} error={error} onCancel={()=>{if(!busy&&!submitting.current){reviewContext.current='';setAction(null);}}} onChoose={async()=>{if(!action||submitting.current||busy||!mounted.current||reviewContext.current!==reviewKey||reviewContext.current!==current.current.id+':'+current.current.activePersonId+':'+current.current.revision+':'+personId+':'+action||romanceActionReason(current.current,personId,action))return; submitting.current=true;try{if(await dispatch({type:'romance-action',personId,action})&&mounted.current){reviewContext.current='';setAction(null);}}finally{submitting.current=false;}}}/>
  </Card>;
}
