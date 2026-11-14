/** Read-only base plus a persistent hash trie of additions. Extending a lookup
 * copies at most eight small trie nodes per key, never its historical Map.
 * No parent lookup/world/array chain is retained. Hash collisions compare keys. */
export type Lookup<T> = Readonly<{ get(key: string): T | undefined; has(key: string): boolean }>;
type Node<T> = { children?: readonly (Node<T> | undefined)[]; entries?: readonly (readonly [string,T])[] };
type Data<T> = { base: ReadonlyMap<string,T>; added?: Node<T> };
const data = new WeakMap<object,Data<unknown>>();
function hash(key: string) {
  let value=2166136261;
  for(let i=0;i<key.length;i++) value=Math.imul(value ^ key.charCodeAt(i),16777619);
  return value >>> 0;
}
function find<T>(node: Node<T> | undefined,key: string,value: number): T | undefined {
  for(let depth=0;node && depth<8;depth++) node=node.children?.[(value >>> (depth*4)) & 15];
  return node?.entries?.find(entry=>entry[0]===key)?.[1];
}
function insert<T>(node: Node<T> | undefined,key: string,item: T,value: number,depth=0): Node<T> {
  if(depth===8) {
    const entries=node?.entries?.slice() ?? [], index=entries.findIndex(entry=>entry[0]===key);
    if(index>=0) entries[index]=[key,item]; else entries.push([key,item]);
    return {entries};
  }
  const children=node?.children?.slice() ?? [], index=(value >>> (depth*4)) & 15;
  children[index]=insert(children[index],key,item,value,depth+1); return {children};
}
function wrap<T>(value: Data<T>): Lookup<T> {
  const get=(key: string)=>find(value.added,key,hash(key)) ?? value.base.get(key);
  const lookup=Object.freeze({get,has:(key: string)=>get(key)!==undefined});
  data.set(lookup,value as Data<unknown>); return lookup;
}
export function lookupFromMap<T>(base: ReadonlyMap<string,T>): Lookup<T> { return wrap({base}); }
export function extendLookup<T>(lookup: Lookup<T>,entries: Iterable<readonly [string,T]>): Lookup<T> {
  const original=data.get(lookup) as Data<T> | undefined;
  if(!original) throw new Error('Unknown lookup');
  let added=original.added;
  for(const [key,value] of entries) added=insert(added,key,value,hash(key));
  return added===original.added?lookup:wrap({base:original.base,added});
}
