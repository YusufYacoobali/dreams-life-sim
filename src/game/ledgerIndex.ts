import type { World } from './model';
import { extendLookup, lookupFromMap, type Lookup } from './persistentLookup';

type Row = World['ledger'][number];
type PositionedRow = { row: Row; index: number };
type Category = { rows: readonly Row[]; previous?: Category };
export type LedgerIndex = {
  transactions: Lookup<Row>; cashChanges: ReadonlyMap<string,bigint>; debtChanges: ReadonlyMap<string,bigint>;
  accountReferences: ReadonlyMap<string,{ownerId:string;currency:Row['currency']}>; debtCurrencies: ReadonlyMap<string,Row['currency']>;
  consistent: boolean; readonly positioned: Lookup<PositionedRow>; categories: (...names:string[]) => Row[];
};
type Data = {
  transactions: Lookup<PositionedRow>; categories: Map<string,Category>;
  cashChanges: Map<string,bigint>; debtChanges: Map<string,bigint>;
  accountReferences: Map<string,{ownerId:string;currency:Row['currency']}>; debtCurrencies: Map<string,Row['currency']>;
  consistent: boolean;
};
const internal = new WeakMap<LedgerIndex,Data>();
function expose(value: Data): LedgerIndex {
  // These maps are never exported from the model's private certificate cache.
  // Standalone callers receive their own fresh index, even for frozen inputs.
  const index: LedgerIndex = {
    cashChanges:value.cashChanges,debtChanges:value.debtChanges,accountReferences:value.accountReferences,debtCurrencies:value.debtCurrencies,consistent:value.consistent,
    transactions:Object.freeze({get:(id:string)=>value.transactions.get(id)?.row,has:(id:string)=>value.transactions.has(id)}),
    positioned:value.transactions,
    categories:(...names:string[])=>names.flatMap(name=>{
      const blocks: (readonly Row[])[]=[];
      for(let block=value.categories.get(name);block;block=block.previous) blocks.push(block.rows);
      const rows:Row[]=[];
      for(let i=blocks.length-1;i>=0;i--) for(const row of blocks[i]) rows.push(row);
      return rows;
    }),
  };
  internal.set(index,value); return Object.freeze(index);
}
function add(value: Data,row: Row) {
  const account=value.accountReferences.get(row.accountId), debtCurrency=row.liabilityId?value.debtCurrencies.get(row.liabilityId):undefined;
  if(account && (account.ownerId!==row.personId || account.currency!==row.currency) || debtCurrency && debtCurrency!==row.currency || !row.liabilityId && row.debtDelta!==0n) value.consistent=false;
  if(!account) value.accountReferences.set(row.accountId,{ownerId:row.personId,currency:row.currency});
  value.cashChanges.set(row.accountId,(value.cashChanges.get(row.accountId)??0n)+row.cashDelta);
  if(row.liabilityId) {
    value.debtCurrencies.set(row.liabilityId,row.currency);
    value.debtChanges.set(row.liabilityId,(value.debtChanges.get(row.liabilityId)??0n)+row.debtDelta);
  }
}
/** Untrusted/mutable callers always rebuild. Freezing is never certification. */
export function indexLedger(rows: World['ledger']): LedgerIndex {
  const positions=new Map<string,PositionedRow>(), categories=new Map<string,Row[]>();
  const value:Data={transactions:lookupFromMap(positions),categories:new Map(),cashChanges:new Map(),debtChanges:new Map(),accountReferences:new Map(),debtCurrencies:new Map(),consistent:true};
  for(let index=0;index<rows.length;index++) {
    const row=rows[index];
    if(positions.has(row.id)) value.consistent=false;
    positions.set(row.id,{row,index}); add(value,row);
    const category=categories.get(row.category); if(category) category.push(row); else categories.set(row.category,[row]);
  }
  for(const [name,rows] of categories) value.categories.set(name,{rows});
  return expose(value);
}
/** The model calls this only after proving an unchanged certified prefix.
 * New IDs are checked against both old history and this entire append batch. */
export function appendLedgerIndex(previous: LedgerIndex,rows: World['ledger'],start: number): LedgerIndex {
  const before=internal.get(previous); if(!before) return indexLedger(rows);
  if(start===rows.length) return previous;
  const value:Data={...before,categories:new Map(before.categories),cashChanges:new Map(before.cashChanges),debtChanges:new Map(before.debtChanges),accountReferences:new Map(before.accountReferences),debtCurrencies:new Map(before.debtCurrencies)};
  const appended=new Map<string,PositionedRow>(), categories=new Map<string,Row[]>();
  for(let index=start;index<rows.length;index++) {
    const row=rows[index];
    if(before.transactions.has(row.id) || appended.has(row.id)) value.consistent=false;
    appended.set(row.id,{row,index}); add(value,row);
    const category=categories.get(row.category); if(category) category.push(row); else categories.set(row.category,[row]);
  }
  value.transactions=extendLookup(before.transactions,appended);
  for(const [name,rows] of categories) value.categories.set(name,{rows,previous:before.categories.get(name)});
  return expose(value);
}
