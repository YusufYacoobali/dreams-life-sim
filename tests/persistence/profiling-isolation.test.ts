import { DatabaseSync } from 'node:sqlite';
let mockProfiling=false;
const mockConnections:{name:string;sqlite:DatabaseSync}[]=[];
jest.mock('../../src/access/buildAccess',()=>({isCommandProfilingEnabled:()=>mockProfiling}));
jest.mock('expo-sqlite',()=>({openDatabaseAsync:jest.fn(async(name:string)=>{
 const sqlite=new (require('node:sqlite').DatabaseSync)(':memory:');mockConnections.push({name,sqlite});
 const db={execAsync:async(sql:string)=>sqlite.exec(sql),runAsync:async(sql:string,v:unknown[]=[])=>sqlite.prepare(sql).run(...v),getFirstAsync:async(sql:string,v:unknown[]=[])=>sqlite.prepare(sql).get(...v)??null,getAllAsync:async(sql:string,v:unknown[]=[])=>sqlite.prepare(sql).all(...v),withExclusiveTransactionAsync:async(action:(db:unknown)=>Promise<void>)=>{sqlite.exec('BEGIN');try{await action(db);sqlite.exec('COMMIT');}catch(error){sqlite.exec('ROLLBACK');throw error;}},closeAsync:async()=>sqlite.close()};return db;
})}));
afterEach(()=>{for(const {sqlite} of mockConnections)try{sqlite.close();}catch{}mockConnections.length=0;mockProfiling=false;});
test.each([false,true])('native repository chooses only its build-specific database, profiling=%s',async profiling=>{
 mockProfiling=profiling;let native!:typeof import('../../src/persistence/native');jest.isolateModules(()=>{native=require('../../src/persistence/native');});
 // Initialise uses a transaction; emulate its driver transaction on the same connection.
 await native.openRepository();expect(mockConnections.map(c=>c.name)).toEqual([profiling?'dreams-performance.db':'dreams.db']);
 if(!profiling){await expect(native.readProfilingCheckpoint('private')).rejects.toThrow('unavailable');expect(mockConnections).toHaveLength(1);}
});
