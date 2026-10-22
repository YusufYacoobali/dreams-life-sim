import { useLayoutEffect } from 'react';
import { create } from 'zustand';

type Owner = 'app' | 'review';
let sequence=0;
export const modalPresenceStore=create<{owners:ReadonlyMap<number,Owner>}>(()=>({owners:new Map()}));
export function registerModal(owner:Owner='app') {
  const id=sequence++;
  modalPresenceStore.setState(state=>({owners:new Map(state.owners).set(id,owner)}));
  return ()=>modalPresenceStore.setState(state=>{const owners=new Map(state.owners);owners.delete(id);return {owners};});
}
export const hasAppModal=()=>[...modalPresenceStore.getState().owners.values()].some(owner=>owner!=='review');
export function useModalPresence(owner:Owner='app') {useLayoutEffect(()=>registerModal(owner),[owner]);}
export const useHasAppModal=()=>modalPresenceStore(state=>[...state.owners.values()].some(owner=>owner!=='review'));
