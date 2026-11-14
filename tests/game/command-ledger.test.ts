import { beginCommandLedger, commandCategoryRows, findCommandReceipt } from '../../src/game/commandLedger';
import { commandLedgerAccess, copyWorld, decodeWorld, encodeWorld } from '../../src/game/model';
import { createDataDraft } from '../../src/game/dataDraft';
import { qualifyingAnnualIncome } from '../../src/game/systems/credit';
import graduate from '../fixtures/v3-employed-graduate.json';

test('command lookups preserve receipt/category ordering and observe every edit to the new mutable tail',()=>{
  const before=decodeWorld(JSON.stringify(graduate),true),tx=createDataDraft(before,[before.ledger]),world=tx.draft;
  const release=beginCommandLedger(world,commandLedgerAccess(before));
  try {
    const names=[...new Set(before.ledger.slice(0,5).map(row=>row.category))];
    expect(commandCategoryRows(world,names)).toEqual(before.ledger.filter(row=>names.includes(row.category)));
    expect(findCommandReceipt(world,before.ledger[0].id)).toBe(before.ledger[0]);
    const row={...before.ledger[0],id:'new-tail',cashDelta:10n};world.ledger.push(row);
    expect(findCommandReceipt(world,row.id)).toBe(row);row.cashDelta=25n;
    expect(findCommandReceipt(world,row.id)?.cashDelta).toBe(25n);
    row.category='new-category';expect(commandCategoryRows(world,['new-category'])).toEqual([row]);
    expect(qualifyingAnnualIncome(world)).toEqual(qualifyingAnnualIncome(copyWorld(before)));
    world.ledger.reverse();
    expect(commandCategoryRows(world,names)).toBe(world.ledger); // unsupported prefix: complete scan
    expect(findCommandReceipt(world,row.id)).toBe(row);
  }finally{release();tx.discard();}
});

test('untrusted frozen roots, independent lives and closed command scopes cannot borrow cached state',()=>{
  const before=decodeWorld(JSON.stringify(graduate),true),text=encodeWorld(before);
  expect(commandLedgerAccess(Object.freeze({...before}))).toBeUndefined();
  const first=createDataDraft(before,[before.ledger]),second=createDataDraft(before,[before.ledger]);
  const release=beginCommandLedger(first.draft,commandLedgerAccess(before));
  first.draft.ledger.push({...before.ledger[0],id:'first-only'});
  expect(findCommandReceipt(second.draft,'first-only')).toBeUndefined();
  release();expect(commandCategoryRows(first.draft,['income'])).toBe(first.draft.ledger);
  first.discard();second.discard();expect(encodeWorld(before)).toBe(text);
});
