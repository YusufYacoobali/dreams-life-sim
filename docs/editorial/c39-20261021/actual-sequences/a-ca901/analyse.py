import json,gzip,base64,hashlib,re,collections,copy
from pathlib import Path
out=Path(__file__).parent;p=Path('/workspace/.cache/dreams-current-c39-policies/professional-v3')
sha=lambda b:hashlib.sha256(b).hexdigest()
def pin(f):
 b=Path(f).read_bytes();return {'file':str(f),'bytes':len(b),'sha256':sha(b)}
result=json.loads((p/'CA-result.json').read_text());commands=json.loads((p/'CA-commands.json').read_text());frame=json.loads((p/'CA-final.checkpoint.json').read_text());manifest=json.loads((p/'manifest.json').read_text());receipt=json.loads(Path('/tmp/dreams-production-finish-accepted-professional-v3-receipt.json').read_text());rootSource=json.loads(Path('/tmp/dreams-production-finish-accepted-source.json').read_text())
assert receipt['complete'] is True and receipt['exitCode']==0 and receipt['before']['status']==receipt['after']['status']=='exact' and receipt['before']['files']==receipt['after']['files']==688
assert manifest['source']['commit']==receipt['sourceCommit']==rootSource['commit']=='33b6a5fcb0aae73dfc235a15394b34d8afda00cc'
assert result['country']=='CA' and result['seed']==901 and len(commands)==result['commandsCommitted']==584
assert sha(json.dumps(commands,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode())==result['traceSha256']
# Ordinary artifact gzip/JSON inspection only: no model, decoder, validator, codec or engine import.
main=json.loads(gzip.decompress(base64.b64decode(frame['main']['data'])));people={}
for block in frame['people']:people.update(json.loads(gzip.decompress(base64.b64decode(block['data']))))
player=people[main['activePersonId']];assert player['id']=='person_player'
oldInput=json.loads(Path('/tmp/dreams-c39-editorial-review-input-20261021.json').read_text());authored={r['id']:copy.deepcopy(r) for r in oldInput['rows']};authored['first-camera-closeup']['choices'][2]['result']='{parent} gets a photograph of the back of your head. You have already found something else to do.'
ledger=json.loads(Path('/workspace/dreams-worktrees/camera-copy-correction/docs/editorial/c39-20261021/ledger.json').read_text());ledgerRows={r['id']:r for r in ledger['rows']};currentPins=json.loads(Path('/workspace/dreams-worktrees/camera-copy-correction/docs/editorial/c39-20261021/current-source-pins.json').read_text())
assert len(currentPins['files'])==335 and all(rootSource['source'][r['path']]==r['sha256'] for r in currentPins['files'])
for r in authored.values():assert sha(json.dumps(r,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode())==ledgerRows[r['id']]['source']['expandedLiteralSha256']
chosen={c['eventId']:(i,c) for i,c in enumerate(commands) if c['type']=='choose'};journal={j['id']:j for j in main['journal']};fullName=lambda id:people[id]['firstName']+' '+people[id]['lastName'];dateKey=lambda d:(d['year'],d['month'],d['day'])
def within(date,start,end):return dateKey(start)<=dateKey(date) and (end is None or dateKey(date)<dateKey(end))
def witnesses(token,value,date):
 candidates=[]
 if token=='parent':
  for e in main['relationships']:
   if e['kind']=='parent' and e['to']==player['id'] and people[e['from']]['firstName']==value:candidates.append({'personId':e['from'],'fullName':fullName(e['from']),'role':'parent','relationshipId':e['id']})
 elif token=='classmate':
  for s in main['schoolCommunities']:
   if s['personId']==player['id'] and within(date,s['started'],s['ended']):
    for id in s['classmateIds']:
     if people[id]['firstName']==value:candidates.append({'personId':id,'fullName':fullName(id),'role':'classmate','schoolId':s['id'],'school':s['school']})
 elif token in ['coworker','supervisor']:
  for w in main['workplaces']:
   if w['personId']==player['id'] and within(date,w['started'],w['ended']):
    for member in w['members']:
     if member['role']==token and fullName(member['personId'])==value and within(date,member['joined'],member['left']):candidates.append({'personId':member['personId'],'fullName':value,'role':token,'workplaceId':w['id'],'employer':w['employer'],'joined':member['joined'],'left':member['left']})
 elif token=='partner':
  for marriage in main['marriages']:
   if player['id'] in [marriage['a'],marriage['b']] and within(date,marriage['started'],marriage['ended']):
    id=marriage['b'] if marriage['a']==player['id'] else marriage['a']
    if fullName(id)==value:candidates.append({'personId':id,'fullName':value,'role':'spouse/partner','marriageId':marriage['id'],'started':marriage['started'],'ended':marriage['ended']})
 elif token=='city':
  assert not main['relocations']
  if player['city']==value:return [{'city':value,'country':player['country'],'playerRelocationRecords':0}]
 for c in candidates:
  person=people[c['personId']];c['born']=person['born'];c['died']=person['died'];assert dateKey(person['born'])<=dateKey(date) and (person['died'] is None or dateKey(date)<dateKey(person['died']))
 return candidates
sequence=[]
for event in main['eventHistory']:
 eid=f"event_{event['year']}_{event['templateId']}";ci,command=chosen[eid];r=authored[event['templateId']];selected=next(c for c in r['choices'] if c['id']==command['choiceId']);j=journal[eid+'_choice'];age=j['date']['year']-player['born']['year'];assert r['min']<=age<=r['max'];template=selected['journal'];tokens=re.findall(r'\{([a-zA-Z]+)\}',template);pattern=re.escape(template)
 for token in tokens:pattern=pattern.replace(re.escape('{'+token+'}'),'(.*?)',1)
 match=re.fullmatch(pattern,j['text']);assert match,(eid,template,j['text']);names=[]
 for token,value in zip(tokens,match.groups()):
  facts=witnesses(token,value,j['date']);assert facts,(eid,token,value);names.append({'token':token,'actualJournalText':value,'savedHistoricalRoleWitnesses':facts})
 context={k:v for k,v in r.items() if k not in ['index','id','title','body','min','max','choices','sourceFile','rarity','illustration']}
 sequence.append({'age':age,'date':j['date'],'eventId':eid,'templateId':r['id'],'actualCommandIndexZeroBased':ci,'actualChoice':command,'actualAuthoredChoiceOrdinalOneBased':next(i+1 for i,c in enumerate(r['choices']) if c['id']==selected['id']),'actualPersistedJournal':j,'observedNamesWithSavedRoleFacts':names,'sourceCorrelationOnly':{'source':ledgerRows[r['id']]['source'],'primaryCategory':ledgerRows[r['id']]['primaryCategory'],'title':r['title'],'setupTemplate':r['body'],'authoredAge':{'min':r['min'],'max':r['max']},'authoredContextPredicates':context,'selectedChoice':selected,'actualBoundSetupCaptured':False,'actualBoundResultBodyCaptured':False,'actualEffectRowsCaptured':False}})
assert len(sequence)==69 and len({r['templateId'] for r in sequence})==58 and all(r['actualAuthoredChoiceOrdinalOneBased']==1 for r in sequence)
assert all(not re.search(r'\{(?:parent|city|classmate|teacher|coworker|supervisor|friend|partner|child|pet|condition)\}',r['actualPersistedJournal']['text']) for r in sequence)
repeats=[]
for tid in sorted({r['templateId'] for r in sequence}):
 ages=[r['age'] for r in sequence if r['templateId']==tid]
 if len(ages)>1:
  gaps=[b-a for a,b in zip(ages,ages[1:])];assert min(gaps)>=5;repeats.append({'templateId':tid,'ages':ages,'gapsYears':gaps})
assert not main['storyThreads'];categories=collections.Counter(r['sourceCorrelationOnly']['primaryCategory'] for r in sequence);contexts=collections.Counter()
for r in sequence:
 for k,v in r['sourceCorrelationOnly']['authoredContextPredicates'].items():
  if v:contexts[k]+=1
periods=[]
for label,lo,hi in [('early-childhood',1,5),('primary-school-age',6,11),('secondary-school-age',12,17),('adult-before-retirement',18,64),('retirement-and-later-life',65,96)]:
 rows=[r for r in sequence if lo<=r['age']<=hi];periods.append({'period':label,'inclusiveAgeRange':[lo,hi],'catalogueOccurrences':len(rows),'distinctTemplates':len({r['templateId'] for r in rows}),'birthdayYearsWithoutCatalogueEvent':hi-lo+1-len(rows)})
files=[p/'manifest.json',p/'result.json',p/'CA-result.json',p/'CA-commands.json',p/'CA-final.checkpoint.json',Path('/tmp/dreams-production-finish-accepted-professional-v3-receipt.json'),Path('/tmp/dreams-production-finish-accepted-source.json'),Path('/tmp/dreams-production-finish-accepted-policy-registration-authorized.json'),Path('/tmp/dreams-production-finish-accepted-professional-v3.out'),Path('/workspace/dreams-worktrees/camera-copy-correction/docs/editorial/c39-20261021/ledger.json'),Path('/workspace/dreams-worktrees/camera-copy-correction/docs/editorial/c39-20261021/current-source-pins.json'),Path('/tmp/dreams-c39-editorial-review-input-20261021.json')]
provenance={'sourceCommit':rootSource['commit'],'versions':manifest['versions'],'cohortReceipt':receipt,'rawPins':[pin(f) for f in files],'sourceRelationship':'All335 app/src file hashes in the source-reviewed corrected ledger exactly match accepted33b source manifest. This analysis reads artifacts only; no source/runtime/world/checkpoint codec modules imported.','checkpointInspection':'Standard gzip/base64/JSON inspection of persisted main and people blocks only. Ledger blocks were not decoded; this is not an independent production-codec or full canonical-world validation.','producerRecordedTraceSha256':result['traceSha256'],'independentPureJsonTraceSha256':sha(json.dumps(commands,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()),'producerRecordedFinalWorldSha256':result['finalWorldSha256'],'independentFullWorldHashRecomputed':False}
summary={'format':'dreams-c39-recorded-sequence-review-v1','preselection':{'policy':'Professional A3','country':'CA','seed':901,'selectedBeforeRun':True,'noOutcomeSearch':True},'sourceCommit':rootSource['commit'],'versions':manifest['versions'],'reviewer':{'agent':'/root/story_editorial','kind':'Codex recorded-artifact/source-correlated narrative review','externalHuman':False},'player':{'id':player['id'],'name':fullName(player['id']),'born':player['born'],'died':player['died'],'ageAtDeath':result['ageAtEnd'],'city':player['city'],'country':player['country']},'timing':{'coordinatorCohortElapsedSeconds':receipt['elapsedSeconds'],'toolCohortElapsedMs':json.loads((p/'result.json').read_text())['elapsedMs'],'producerCanadaElapsedMs':result['elapsedMs']},'actualCounts':{'commandsCommitted':len(commands),'observations':len(result['observations']),'producerRecordedColdChecks':len(result['coldChecks']),'advanceCommands':sum(c['type']=='advance' for c in commands),'resumeCommands':sum(c['type']=='resume' for c in commands),'completedChronologicalBirthdayYears':96,'fatalPartialFinalAnnualPeriod':True,'catalogueOccurrences':len(sequence),'distinctCatalogueTemplates':len({r['templateId'] for r in sequence}),'distinctCatalogueBranches':len({(r['templateId'],r['actualChoice']['choiceId']) for r in sequence}),'totalChooseCommands':sum(c['type']=='choose' for c in commands),'catalogueChoiceOrdinalCounts':{'first':69,'second':0,'third':0},'nonCatalogueChoices':3,'actualRecordedBoundCatalogueResults':0,'actualRecordedCatalogueEffectRowSnapshots':0,'actualCatalogueJournalsRead':69,'callbackThreads':len(main['storyThreads']),'persistedPlayerJournalFactsAvailable':len([j for j in main['journal'] if j['personId']==player['id']])},'periods':periods,'actualSourcePredicateOccurrencesOverlapping':dict(contexts),'categoryOccurrenceCounts':dict(categories),'repeats':repeats,'quietCatalogueAges':[age for age in range(1,97) if age not in {r['age'] for r in sequence}],'milestoneStatuses':{k:v['status'] for k,v in result['milestones'].items()},'unreached':['child: joint child-preference requirement not met;64 actual ineligible observations, no override','project/arcade origin and deferred/24-month callbacks: no origin chosen, no story thread','Teen dating, actual child/pet/attended-hobby/completed-trip/known-condition/special-career catalogue contexts not encountered','corrected camera away branch: actual camera choice was nose, not away','second and third catalogue branches:0 observed','raw bound setup/results/effect-row cap checks: not retained by A3 telemetry'],'findings':[],'conclusion':'No concrete narrative contradiction identified in this fixed life’s69 actual chosen-ID/journal occurrences and separately source-correlated58 selected branches. This is a scoped recorded-sequence review, not full result/effect-row/native/SQLite-life/30-minute/all-country/all795-branch acceptance.','limits':['No game execution, replay, rerun, RNG call, seed search, native/UI action or source change.','The current authored setup/label/result/requested effects are correlated to actual selected IDs; they are not captured historical bound scenes.','Saved role/date records corroborate named journals but do not reconstruct every past location, choice availability or intermediate person stat.','Actual producer78coldChecks and final world hash are recorded/pinned, not re-executed or independently canonical-hash verified by this review.','B GB902 and D US900 are separate preselected future reviews; no evidence is borrowed from them.','All69 catalogue journals and separately selected milestone/health/education facts were read;427 player journal facts are available, not a claim that every financial line was independently audited here.']}
(out/'sequence.json').write_text(json.dumps(sequence,ensure_ascii=False,indent=2)+'\n');(out/'provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n');(out/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'commands':len(commands),'occurrences':len(sequence),'distinct':summary['actualCounts']['distinctCatalogueTemplates'],'actualNamedJournalTokens':sum(len(r['observedNamesWithSavedRoleFacts']) for r in sequence),'findings':0,'inputBytesPinned':sum(x['bytes'] for x in provenance['rawPins'])},indent=2))
