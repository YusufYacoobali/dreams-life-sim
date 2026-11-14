import type { World } from './model';
import { liveArrayPrefix } from './dataDraft';
type Row=World['ledger'][number];
export type CommandLedgerAccess=Readonly<{
  rows:World['ledger']; find:(id:string)=>Row|undefined; categories:(names:readonly string[])=>readonly Row[];
}>;
const scopes=new WeakMap<World,CommandLedgerAccess>();
/** The engine installs an accessor obtained from a privately certified world.
 * This is only an acceleration for simulation; it grants no integrity certificate. */
export function beginCommandLedger(world:World,access:CommandLedgerAccess|undefined) {
  if(access) scopes.set(world,access);
  return ()=>{scopes.delete(world);};
}
function prefix(world:World) {
  const access=scopes.get(world), change=liveArrayPrefix(world.ledger);
  return access && change?.appendOnly && change.base===access.rows ? access : undefined;
}
export function findCommandReceipt(world:World,id:string):Row|undefined {
  const access=prefix(world);
  if(!access) return world.ledger.find(row=>row.id===id);
  const old=access.find(id);if(old)return old;
  for(let index=access.rows.length;index<world.ledger.length;index++) if(world.ledger[index].id===id)return world.ledger[index];
}
export function commandCategoryRows(world:World,names:readonly string[]):readonly Row[] {
  const access=prefix(world);if(!access)return world.ledger;
  const rows=[...access.categories(names)], wanted=new Set(names);
  // New raw rows can still be edited by a system's retained local reference.
  // Read the complete live tail on EVERY lookup, never a stale tail cache.
  for(let index=access.rows.length;index<world.ledger.length;index++) if(wanted.has(world.ledger[index].category)) rows.push(world.ledger[index]);
  return rows;
}
