/** A small plain-data copy-on-write transaction. No draft can escape finish().
 * Targets are unfrozen shells: proxying frozen source properties violates JS
 * proxy invariants. Sources and earlier snapshots are never written to. */
type Data = Record<PropertyKey, unknown>;
type State = {
  base: Data; copy?: Data; proxy: Data; revoke: () => void;
  children: Map<PropertyKey, State>; parents: Map<State, Set<PropertyKey>>;
  assigned: Set<PropertyKey>; written: Set<PropertyKey>; appendOnly: boolean;
};
export type ArrayChange = Readonly<{ base: readonly unknown[]; appendOnly: boolean; written: readonly number[] }>;
const arrayChanges = new WeakMap<object, ArrayChange>();
const sources = new WeakMap<object, object>();
/** Read-only provenance. Only finished, recursively frozen outputs are keys. */
export const arrayChange = (value: object): ArrayChange | undefined => arrayChanges.get(value);
export const draftSource = (value: object): object | undefined => sources.get(value);
const indexOfKey = (key: PropertyKey) => typeof key === 'string' && /^(0|[1-9]\d*)$/.test(key) && Number(key) < 0xffffffff ? Number(key) : -1;
const object = (value: unknown): value is Data => !!value && typeof value === 'object';
const put = (target: Data, key: PropertyKey, value: unknown) => Object.defineProperty(target,key,{value,writable:true,enumerable:true,configurable:true});

export function createDataDraft<T extends object>(base: T, atomicArrays: readonly object[] = []) {
  const originals = new WeakMap<object, State>(), proxies = new WeakMap<object, State>(), states: State[] = [];
  let closed = false;
  function mark(state: State, seen = new Set<State>()) {
    if (seen.has(state)) return; seen.add(state);
    if (!state.copy) state.copy = (Array.isArray(state.base) ? state.base.slice() : Object.assign(Object.create(Object.getPrototypeOf(state.base)),state.base)) as Data;
    for (const [parent,keys] of state.parents) for (const key of keys) if (parent.children.get(key) === state) {
      parent.written.add(key);
      if (Array.isArray(parent.base) && indexOfKey(key) >= 0 && indexOfKey(key) < parent.base.length) parent.appendOnly = false;
      mark(parent,seen);
    }
  }
  function node(value: Data): State {
    const known = proxies.get(value) ?? originals.get(value); if (known) return known;
    const state = {base:value,children:new Map(),parents:new Map(),assigned:new Set(),written:new Set(),appendOnly:true} as State;
    const current = () => state.copy ?? state.base;
    const handler: ProxyHandler<Data> = {
      get(_target,key) {
        if (key === Symbol.iterator && atomicArrays.includes(state.base)) return function* () {
          // Live length/contents, like the standard array iterator, without
          // a proxy allocation or property trap for every historical receipt.
          let index=0;
          while(index < (current() as unknown as unknown[]).length) yield current()[index++];
        };
        const value = Reflect.get(current(),key);
        if (!object(value)) return value;
        // The command engine has always treated certified old ledger rows as
        // atomic frozen values. Reading a large financial history must not
        // allocate a proxy for each transaction. Replacements still track.
        if (atomicArrays.includes(state.base) && indexOfKey(key)>=0 && !state.assigned.has(key)) return value;
        // New objects remain ordinary mutable objects during the command.
        // Systems retain local references after inserting people/contracts;
        // wrapping those would split their subsequent direct mutations.
        if (state.assigned.has(key) && !proxies.has(value)) return value;
        const child = node(value); state.children.set(key,child);
        let keys = child.parents.get(state); if (!keys) child.parents.set(state,keys=new Set()); keys.add(key);
        return child.proxy;
      },
      set(_target,key,value) {
        const previous = Reflect.get(current(),key), unwrapped = object(value) ? proxies.get(value)?.base ?? value : value;
        if (Object.is(previous,value) || Object.is(previous,unwrapped) && !proxies.get(value)?.copy) return true;
        mark(state); state.written.add(key); state.assigned.add(key); state.children.delete(key);
        if (Array.isArray(state.base)) {
          if (key === 'length') {
            if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 0xffffffff) throw new RangeError('Invalid array length');
            if (value < state.base.length) state.appendOnly=false;
            for (const childKey of state.children.keys()) if (indexOfKey(childKey) >= value) state.children.delete(childKey);
            Reflect.set(state.copy!,key,value); return true;
          }
          if (indexOfKey(key) >= 0 && indexOfKey(key) < state.base.length) state.appendOnly=false;
        }
        put(state.copy!,key,value); return true;
      },
      deleteProperty(_target,key) {
        if (!Object.prototype.hasOwnProperty.call(current(),key)) return true;
        mark(state); state.written.add(key); state.children.delete(key); state.assigned.delete(key);
        if (Array.isArray(state.base) && indexOfKey(key) >= 0 && indexOfKey(key) < state.base.length) state.appendOnly=false;
        return Reflect.deleteProperty(state.copy!,key);
      },
      has: (_target,key) => Reflect.has(current(),key),
      ownKeys: () => Reflect.ownKeys(current()),
      getOwnPropertyDescriptor(_target,key) {
        const descriptor = Object.getOwnPropertyDescriptor(current(),key);
        return descriptor ? {...descriptor,writable:true,configurable:key !== 'length' || !Array.isArray(state.base)} : undefined;
      },
      getPrototypeOf: () => Object.getPrototypeOf(state.base),
      setPrototypeOf: () => { throw new TypeError('Draft prototypes cannot change'); },
      preventExtensions: () => { throw new TypeError('Finish the transaction before freezing'); },
      defineProperty: () => { throw new TypeError('Drafts support ordinary data assignments only'); },
    };
    const {proxy,revoke} = Proxy.revocable((Array.isArray(value)?[]:Object.create(Object.getPrototypeOf(value))) as Data,handler);
    state.proxy=proxy; state.revoke=revoke; originals.set(value,state); proxies.set(proxy,state); states.push(state); return state;
  }
  const root=node(base as Data);
  function close() { if (!closed) { closed=true; for (const state of states) state.revoke(); } }
  return {
    draft: root.proxy as T,
    discard: close,
    finish(): T {
      if (closed) throw new TypeError('Transaction is closed');
      const completed=new Map<State,Data>(), inserted=new WeakMap<object,Data>(), visiting=new WeakSet<object>();
      function plain(value: unknown): unknown {
        if (!object(value)) return value;
        const state=proxies.get(value); if (state) return finish(state);
        // Assigned containers may contain nested proxies (spread/map/filter).
        const original=originals.get(value); if (original) return finish(original);
        const cached=inserted.get(value); if (cached) { if (visiting.has(value)) throw new TypeError('Cyclic draft data'); return cached; }
        if (!Array.isArray(value) && ![Object.prototype,null].includes(Object.getPrototypeOf(value))) throw new TypeError('Drafts require plain data');
        const copy=(Array.isArray(value)?new Array(value.length):Object.create(Object.getPrototypeOf(value))) as Data;
        inserted.set(value,copy); visiting.add(value);
        for (const key of Object.keys(value)) {
          const descriptor=Object.getOwnPropertyDescriptor(value,key)!;
          if (!('value' in descriptor)) throw new TypeError('Drafts require data properties');
          put(copy,key,plain(descriptor.value));
        }
        visiting.delete(value); return Object.freeze(copy);
      }
      function finish(state: State): Data {
        if (!state.copy) return state.base;
        const cached=completed.get(state); if (cached) return cached;
        const result=state.copy; completed.set(state,result);
        for (const [key,child] of state.children) if (Object.prototype.hasOwnProperty.call(result,key) && (result[key]===child.base || result[key]===child.proxy)) put(result,key,finish(child));
        for (const key of state.assigned) if (key !== 'length' && Object.prototype.hasOwnProperty.call(result,key)) put(result,key,plain(result[key]));
        Object.freeze(result);
        if (Array.isArray(result)) arrayChanges.set(result,Object.freeze({base:state.base as unknown as readonly unknown[],appendOnly:state.appendOnly,
          written:Object.freeze([...state.written].map(indexOfKey).filter(index=>index>=0))}));
        return result;
      }
      try {
        const result=finish(root) as T;
        sources.set(result,base); return result;
      } finally { close(); }
    },
  };
}
