from pathlib import Path
from collections import Counter,defaultdict
from datetime import datetime,timezone
import base64,gzip,hashlib,json,re

raw=Path('/tmp/dreams-opening-next-editorial-20261020')
old=Path('/tmp/dreams-editorial-observation-audit-20261020')
out=Path('/tmp/dreams-editorial-varied-choice-audit-20261020')
assert not out.exists(), 'Never overwrite a fixed analysis'
out.mkdir()
sha=lambda b:hashlib.sha256(b).hexdigest()
read=lambda p:json.loads(p.read_text())
write=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n')
aggregate=read(raw/'result.json');manifest=read(raw/'manifest.json');catalogue=read(raw/'catalogue.json')
assert aggregate['format']=='dreams-editorial-policy-v1' and aggregate['completedLives']==12
assert aggregate['source']==manifest['source']==catalogue['source']
assert aggregate['source']['checkoutHead']=='73cedc7643fa3cbcd0ad32dfa27abfb59dac8aaa'
assert aggregate['source']['game']=='84625d5208d1a6815dccc2802ff75c83393eeb143c382e83d60ed0dafaf94f33'
assert aggregate['versions']=={'world':34,'engine':35,'content':10}
assert aggregate['seedAssignments']==manifest['seedAssignments']
assert [v['seed'] for v in aggregate['seedAssignments']]==list(range(900,912))
assert len(catalogue['templates'])==250
catalog={r['id']:r for r in catalogue['templates']};assert len(catalog)==250
oldCatalog=read(old/'catalogue.json'); oldLines={v['id']:v for v in oldCatalog['templates']}
sourceRoot=Path(aggregate['source']['sourceRoot']); sourceProof=[]
for pin in oldCatalog['sourceFiles']:
 p=sourceRoot/pin['path'];h=sha(p.read_bytes());sourceProof.append({'path':pin['path'],'sha256':h,'sameAsOldCatalogue':h==pin['sha256']})
lineSafe={x['path']:x['sameAsOldCatalogue'] for x in sourceProof}

inputFiles=[]
for p in sorted(raw.rglob('*')):
 if p.is_file():inputFiles.append({'path':str(p),'relative':str(p.relative_to(raw)),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())})
for p in [Path('/tmp/dreams-opening-next-editorial.out'),Path('/tmp/dreams-opening-next-editorial.ndjson')]:
 inputFiles.append({'path':str(p),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())})
stdout=read(Path('/tmp/dreams-opening-next-editorial.out'));assert {k:v for k,v in stdout.items() if k!='output'}==aggregate
progress=[json.loads(s) for s in Path('/tmp/dreams-opening-next-editorial.ndjson').read_text().splitlines() if s.strip()]
assert len(progress)==12 and {r['country'] for r in progress}=={r['country'] for r in aggregate['records']}

oldHashes={name:sha((old/name).read_bytes()) for name in ['SHA256SUMS','inputs.json','catalogue.json','analysis.json','REPORT.md']}
assert oldHashes['analysis.json']=='e33d46b1490465f59d71420c6e77260b6378fc625af77f834a3aeea7bdc4f180'
assert oldHashes['REPORT.md']=='3c350e7b66ebb9bdbb896abddf191a6af80d7cd6bd3e8fa663a0a60af7fb12d4'

annualRows=[];systems=[];countries=[];anomalies=[];effectChecks=0;zeroCapped=0;checkedByKind=Counter();allKinds=Counter();branchOrd=Counter();eligibleOrd=Counter();byAge=defaultdict(list);medical=[];callbacks=[];branches=defaultdict(set);gaps=[];frames=[];diagnosisMoves=[]
contextKeys=['parent','parentContact','school','classmate','teacher','workplace','coworker','supervisor','friend','partner','local','child','home','pet','hobby','visited','chronicCondition','specialCareer']
def band(age):
 for lo,hi in [(1,2),(3,5),(6,11),(12,17),(18,29),(30,49),(50,64),(65,84),(85,150)]:
  if lo<=age<=hi:return str(lo)+'–'+str(hi)
 return 'outside'
def unpackPeople(file):
 f=read(file);inflate=lambda part:json.loads(gzip.decompress(base64.b64decode(part['data'])))
 if f['format']=='dreams-checkpoint-v1':return inflate(f),f['format']
 w=inflate(f['main']);w['people']={k:v for block in f['people'] for k,v in inflate(block).items()};return w,f['format']
for summary in aggregate['records']:
 code=summary['country'];p=raw/code;r=read(p/'result.json')
 assert r['source']==aggregate['source'] and r['country']==code and r['naturallyDied'] and r['maxYears']==150
 commands=[json.loads(s) for s in (p/'commands.ndjson').read_text().splitlines()]
 decisions=[json.loads(s) for s in (p/'decisions.ndjson').read_text().splitlines()]
 assert decisions==r['decisions']
 assert len(commands)==r['commandsCommitted']==r['finalRevision']-r['birthRevision']
 assert sha((p/'commands.ndjson').read_bytes())==r['traceSha256']==summary['traceSha256']
 assert all(x['index']==i and x['revision']==x['beforeRevision']+1 and x['command']['type'] in ['choose','acknowledge','advance','resume'] for i,x in enumerate(commands))
 commandByBefore={x['beforeRevision']:x for x in commands}
 cold=[json.loads(s) for s in (p/'cold.ndjson').read_text().splitlines()];assert cold==r['coldChecks']
 lastCold=next(x for x in cold if x['revision']==r['finalRevision'])
 assert lastCold['worldSha256']==r['finalWorldSha256']==summary['finalWorldSha256']
 assert lastCold['checkpointSha256']==sha((p/'final.checkpoint.json').read_bytes())
 world,fmt=unpackPeople(p/'final.checkpoint.json');person=world['people'][world['activePersonId']]
 assert person['died'] and person['causeOfDeath']==r['causeOfDeath']
 assert world['eventHistory']==(r['annual'][-1]['eventHistory'] if r['annual'] else [])
 for condition in person['health']['conditions']:
  care=[x for x in person['health']['records'] if x['conditionId']==condition['id'] and x['kind'] in ['hospital','diagnosis','treatment']]
  if care and condition['diagnosed']:
   first=min(care,key=lambda x:(x['date']['year'],x['date']['month'],x['date']['day']))
   dateKey=lambda d:(d['year'],d['month'],d['day'])
   if dateKey(condition['diagnosed'])>dateKey(first['date']):diagnosisMoves.append({'country':code,'conditionId':condition['id'],'type':condition['type'],'firstRecordedCare':first['date'],'firstRecordId':first['id'],'storedDiagnosed':condition['diagnosed'],'checkpoint':code+'/final.checkpoint.json'})
 rows=[];seenTemplates=Counter();lastYear={};yearOffers=Counter();known=set()
 for i,d in enumerate(decisions):
  event=d['event'];selected=next(c for c in event['choices'] if c['id']==d['selected']['id']);ptr=code+'/result.json#/decisions/'+str(i)
  command=commandByBefore[d['revision']];assert command['command']=={'type':'choose','eventId':event['id'],'choiceId':selected['id']}
  assert d['afterRevision']==d['revision']+1 and d['ordinal']==i
  assert d['selected']['eligibleIndex']==i%len(d['eligibleIds']) and d['eligibleIds'][d['selected']['eligibleIndex']]==selected['id']
  assert event['choices'][d['selected']['sourceIndex']]['id']==selected['id']
  assert next(x for x in d['choices'] if x['choice']['id']==selected['id'])['unavailableReason'] is None
  allKinds.update(x['kind'] for x in selected['effects'])
  before={x['id']:x for x in d['affectedBefore']['people']};after={x['id']:x for x in d['affectedAfter']['people']};br={x['id']:x for x in d['affectedBefore']['relationships']};ar={x['id']:x for x in d['affectedAfter']['relationships']}
  simple=all(x['kind'] in ['stat','skill','school-grade','relationship','schedule-story','transfer'] for x in selected['effects'])
  for j,e in enumerate(selected['effects']):
   typ=e['kind'];pid=e.get('personId');a=b=None
   if typ=='stat':a=before[pid]['stats'][e['stat']];b=after[pid]['stats'][e['stat']]
   elif typ=='skill':a=before[pid]['skills'][e['skill']];b=after[pid]['skills'][e['skill']]
   elif typ=='school-grade':a=before[pid]['education']['grades'];b=after[pid]['education']['grades']
   elif typ=='relationship':a=br[e['relationshipId']]['strength'];b=ar[e['relationshipId']]['strength']
   if a is None or not simple:continue
   effectChecks+=1;checkedByKind[typ]+=1;expected=max(0,min(100,a+e['delta']));delta=b-a;zeroCapped+=int(delta==0 and e['delta']!=0)
   actual=next((x for x in (d['actualResult'] or {}).get('effects',[]) if x['id']=='effect_'+str(j)),None)
   if b!=expected or actual and actual['value']!=('+' if delta>=0 else '')+str(delta)+'%':anomalies.append({'type':'capped-effect-mismatch','pointer':ptr,'effect':e,'before':a,'after':b,'row':actual})
   if actual:
    good=-delta if typ=='stat' and e['stat']=='stress' else delta;tone='positive' if good>0 else 'negative' if good<0 else 'neutral'
    if actual['tone']!=tone:anomalies.append({'type':'effect-tone-mismatch','pointer':ptr,'row':actual,'expected':tone})
  if d['scope']=='annual-catalogue':
   t=catalog[event['templateId']];match=re.fullmatch(r'event_(\d+)_(.+)',event['id']);assert match and match[2]==t['id']
   year=int(match[1]);assert year==d['date']['year'] and t['min']<=d['age']<=t['max']
   assert t['choices'][d['selected']['sourceIndex']]['id']==selected['id']
   if t['id'] in lastYear:gaps.append(year-lastYear[t['id']]);assert year-lastYear[t['id']]>=5
   lastYear[t['id']]=year;seenTemplates[t['id']]+=1;yearOffers[year]+=1
   assert {'templateId':t['id'],'year':year} in world['eventHistory']
   branchOrd[str(d['selected']['authoredBranch'])]+=1;eligibleOrd[str(d['selected']['eligibleIndex']+1)]+=1;branches[t['id']].add(selected['id'])
   line=oldLines.get(t['id']);source={'file':line['file'],'line':line['line'],'hashMatchesPriorCatalogue':True} if line and lineSafe.get(line['file']) else None
   row={'country':code,'seed':r['seed'],'age':d['age'],'date':d['date'],'eventId':event['id'],'templateId':t['id'],'choiceId':selected['id'],'authoredBranch':d['selected']['authoredBranch'],'eligiblePosition':d['selected']['eligibleIndex']+1,'pointer':ptr,'revision':d['revision'],'afterRevision':d['afterRevision'],'source':source}
   annualRows.append(row);rows.append(row);byAge[band(d['age'])].append(row)
  else:
   systems.append({'country':code,'age':d['age'],'templateId':event['templateId'],'choiceId':selected['id'],'pointer':ptr})
  if event['templateId']=='medical-emergency':
   effect=next(x for x in selected['effects'] if x['kind']=='emergency-care');cid=effect['conditionId'];cond=next(x for x in person['health']['conditions'] if x['id']==cid)
   medical.append({'country':code,'conditionId':cid,'type':cond['type'],'knownFromEarlierAcceptedCare':cid in known,'pointer':ptr,'eventId':event['id'],'date':d['date'],'selected':selected['id'],'body':event['body']})
   if effect['accepted']:known.add(cid)
  for e in selected['effects']:
   if e['kind']=='resolve-story':
    thread=next(x for x in d['actualStoryThreads'] if x['id']==e['threadId']);assert thread['resolution']==e['resolution'] and thread['status']=='resolved'
    assert all(x in event['personIds'] for x in [thread['personId'],thread['peerId'],thread['teacherId'],thread['parentId']] if x)
    callbacks.append({'country':code,'pointer':ptr,'thread':thread,'actualResult':d['actualResult'],'date':d['date']})
  texts=[event['title'],event['body'],selected['label'],selected['resultTitle'],selected['resultBody'],selected['journal']]
  if any(re.search(r'\{(?:parent|peer|teacher|city|friend|partner|child|coworker|supervisor|pet|condition)\}',s) for s in texts):anomalies.append({'type':'literal-binding-token','pointer':ptr})
 assert all(v==1 for v in yearOffers.values())
 assert len(rows)==r['catalogueDecisions'] and len({x['templateId'] for x in rows})==len(r['observedCatalogueIds'])
 quiet=sum(bool(re.fullmatch(r'year_\d+_summary',x['event']['id'])) for x in r['results'])
 countries.append({'country':code,'seed':r['seed'],'ageAtNaturalDeath':r['ageAtEnd'],'causeOfDeath':r['causeOfDeath'],'yearsStarted':r['yearsStarted'],'yearsCompletedToTarget':r['yearsCompleted'],'partialAnnualClosures':sum(not a['completedToTarget'] for a in r['annual']),'catalogueChoices':len(rows),'uniqueTemplates':len(seenTemplates),'withinLifeRepeats':sum(n-1 for n in seenTemplates.values()),'authoredBranches':dict(Counter(str(x['authoredBranch']) for x in rows)),'quietYearResults':quiet,'systemDecisions':r['systemOrCallbackDecisions'],'commandsCommitted':r['commandsCommitted'],'coldChecks':len(cold),'traceSha256':r['traceSha256'],'finalWorldSha256':r['finalWorldSha256'],'finalCheckpointSha256':sha((p/'final.checkpoint.json').read_bytes()),'finalCheckpointFormat':fmt})
 frames.extend(cold)

contexts={}
for key in contextKeys:
 values=sorted({str(t[key]) for t in catalog.values() if t.get(key)},key=str)
 for val in values:
  ids={t['id'] for t in catalog.values() if str(t.get(key))==val};observed=ids&set(branches)
  contexts[key+':'+val]={'catalogue':len(ids),'observed':len(observed),'unobservedIds':sorted(ids-observed)}
observed=set(branches);unseen=sorted(set(catalog)-observed);unselected=[{'templateId':t['id'],'choiceId':c['id'],'authoredBranch':i+1} for t in catalog.values() for i,c in enumerate(t['choices']) if c['id'] not in branches[t['id']]]
# Do not let defaultdict accesses change the observed set used above.
allBranches=sum(len(t['choices']) for t in catalog.values());uniqueBranches=allBranches-len(unselected)
findings=[{'id':'medical-context-omitted','priority':'P2','type':'editorial-context','title':'Emergency decisions hide which actual known condition needs care','source':'src/game/systems/health.ts:212','evidence':['US/result.json#/decisions/20','US/result.json#/decisions/26','IT/result.json#/decisions/107','IT/result.json#/decisions/108','IT/result.json#/decisions/109'],'observedMedicalDecisions':len(medical),'knownFromPriorAcceptedCare':sum(x['knownFromEarlierAcceptedCare'] for x in medical),'proposedScope':'Future copy may name an already-diagnosed condition or its established symptoms; retain undiagnosed knowledge, quotes, effects, eligibility, RNG and old bound text. This does not justify medical cooldown or balance changes.'},{'id':'diagnosis-date-overwritten','priority':'P3','type':'saved-chronology','title':'Repeated hospital care replaces the original diagnosed timestamp','source':'src/game/systems/health.ts:100','relatedNpcPath':'src/game/systems/health.ts:229','actualCases':diagnosisMoves,'proposedScope':'Future care should preserve an existing diagnosed date while recording a new treatment/admission separately. Do not rewrite historical saved records.'}]
summary={'format':'dreams-editorial-varied-choice-analysis-v1','capturedAt':datetime.now(timezone.utc).isoformat(),'inputDirectory':str(raw),'coordinatorClosure':{'session':24133,'status':'CLOSED','exitCode':0,'provenance':'Coordinator message after actual process closure; completed aggregate additionally validated'},'source':aggregate['source'],'versions':aggregate['versions'],'elapsedMs':aggregate['elapsedMs'],'inputManifest':'inputs.json','sourceStoryFileProof':sourceProof,'countries':countries,'coverage':{'completedNaturalLives':12,'reusedSeedRange':[900,911],'additionalAnnualSeeds':0,'commands':sum(x['commandsCommitted'] for x in countries),'catalogueSituations':250,'catalogueBranches':allBranches,'catalogueChoices':len(annualRows),'uniqueObservedTemplates':len(observed),'uniqueObservedBranches':uniqueBranches,'authoredBranchOccurrences':dict(branchOrd),'eligiblePositionOccurrences':dict(eligibleOrd),'withinLifeRepeats':sum(x['withinLifeRepeats'] for x in countries),'minRepeatGapYears':min(gaps) if gaps else None,'unseenCatalogueIds':unseen,'unselectedCatalogueBranches':unselected,'byAge':{k:{'choices':len(v),'uniqueTemplates':len({x['templateId'] for x in v})} for k,v in byAge.items()},'contexts':contexts,'systemTypes':dict(Counter(x['templateId'] for x in systems)),'callbackDecisions':len(callbacks),'retainedThreadStatuses':dict(Counter(t['status'] for country in aggregate['records'] for t in read(raw/country['country']/'result.json')['retainedStoryThreads'])),'coldChecks':len(frames),'checkpointFormats':dict(Counter(x['format'] for x in frames))},'checks':{'committedTraceAndDecisionRowsReconciled':True,'finalFramesMatchRecordedFinalColdHashes':True,'sourceBeforeAfter':'Reviewed unchanged driver asserts equality after load, each life and cohort; root additionally reports583 frozen source pins unchanged. No fabricated separate sourceAfter snapshot.','simpleActualCappedEffectChecks':effectChecks,'checkedEffectKinds':dict(checkedByKind),'zeroCappedNonzeroRequests':zeroCapped,'selectedEffectKinds':dict(allKinds),'anomalies':anomalies,'analysisDidNotReplayLivesOrRerunTests':True},'findings':findings,'callbackEvidence':callbacks,'medicalDecisionsByCountry':dict(Counter(x['country'] for x in medical)),'oldAudit':{'directory':str(old),'sourceGame':'ed3148b53360a79b7ee7237c7a1916d6e878f00662609bf0b3a2a7c027a39f6f','catalogueChoices':991,'uniqueTemplates':184,'allSelectedBranch':1,'hashesUnchanged':oldHashes,'combinedCoverageClaimed':False},'negativeScope':['No all250 situations/all750 branches/allcontexts acceptance','No native or physicalperformance acceptance','SQLite birth only; laterpureengine and productioncodec','No complete Scenario A/B/C or full game/balance acceptance','No new distinct seeds added to120annual policy','Passive varied-choice strategy is not a controlled comparison with earlier active policies; early deaths and omitted contexts remain real']}
write(out/'summary.json',summary);write(out/'inputs.json',{'files':inputFiles,'oldAuditHashes':oldHashes,'plan':{'path':'/tmp/dreams-editorial-varied-choice-analysis-plan-20261020.md','sha256':sha(Path('/tmp/dreams-editorial-varied-choice-analysis-plan-20261020.md').read_bytes())},'analyserSha256':sha(Path(__file__).read_bytes())})
(out/'catalogue-observations.ndjson').write_text(''.join(json.dumps(x,ensure_ascii=False,sort_keys=True)+'\n' for x in annualRows))
write(out/'medical-context-evidence.json',{'decisions':medical,'diagnosisDateCases':diagnosisMoves})
print(json.dumps({'summary':str(out/'summary.json'),'coverage':{k:summary['coverage'][k] for k in ['catalogueChoices','uniqueObservedTemplates','uniqueObservedBranches','authoredBranchOccurrences','withinLifeRepeats','minRepeatGapYears','systemTypes','callbackDecisions','coldChecks']},'effectChecks':effectChecks,'anomalies':anomalies,'diagnosisDateCases':len(diagnosisMoves),'sourceStoryFilesUnchanged':all(x['sameAsOldCatalogue'] for x in sourceProof)},ensure_ascii=False))
