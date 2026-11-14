/** Dependency certificates for pure subsystem validators. Every observed root
 * read (including presence and enumeration) must still match exactly. Branch
 * identity is meaningful only when the model has certified and frozen it.
 * New/unknown inputs always execute all checks. No periodic validation bypass. */
type Dependency = {key:PropertyKey;value:unknown;present:boolean};
type Check = {dependencies:readonly Dependency[];keys?:readonly (string|symbol)[];result:unknown};
export type IntegrityChecks = ReadonlyMap<Function,Check>;
export function createIntegrityChecks<W extends object>(world: W, previous?: IntegrityChecks) {
  const records = new Map<Function,Check>();
  return {
    records,
    run<T>(validate:(world:W,...args:any[])=>T,...args:any[]): T {
      const old=previous?.get(validate);
      if(old && old.dependencies.every(dep=>Reflect.has(world,dep.key)===dep.present && Object.is(Reflect.get(world,dep.key),dep.value)) &&
        (!old.keys || (()=>{const keys=Reflect.ownKeys(world);return keys.length===old.keys!.length && keys.every((key,index)=>key===old.keys![index]);})())) {
        records.set(validate,old); return old.result as T;
      }
      // An explicitly supplied ledger index has exactly the ledger's identity
      // dependency even if the validator never reads world.ledger itself.
      const read=new Set<PropertyKey>(args.length?['ledger']:[]); let keys:readonly (string|symbol)[] | undefined;
      const observed=new Proxy(world,{
        get:(target,key)=>{read.add(key);return Reflect.get(target,key);},
        has:(target,key)=>{read.add(key);return Reflect.has(target,key);},
        getOwnPropertyDescriptor:(target,key)=>{read.add(key);return Reflect.getOwnPropertyDescriptor(target,key);},
        ownKeys:target=>{keys=Reflect.ownKeys(target);return [...keys];},
        set:()=>{throw new Error('Integrity checks must not mutate their input');},
        deleteProperty:()=>{throw new Error('Integrity checks must not mutate their input');},
        defineProperty:()=>{throw new Error('Integrity checks must not mutate their input');},
      });
      const result=validate(observed,...args);
      records.set(validate,{dependencies:[...read].map(key=>({key,value:Reflect.get(world,key),present:Reflect.has(world,key)})),keys,result});
      return result;
    },
  };
}
