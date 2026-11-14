import { createPerformanceRecorder } from '../../src/performance/recorder';
import { beginCommandPress, beginCommandTiming, beginCommandSpan, markCommandPublished, markCommandUi, markPublishedUiEvent } from '../../src/performance/commandTiming';

test('recording is opt-in, bounded, content-free and exports independent snapshots', () => {
  let permitted = false;
  const recorder = createPerformanceRecorder(() => permitted, 16);
  expect(recorder.start()).toBe(false); expect(beginCommandTiming('advance','private life',1,30)).toBeNull(); expect(recorder.snapshot()).toBeNull();
  permitted = true; expect(recorder.start()).toBe(true);
  for (let n = 0; n < 9; n++) { const trace = beginCommandTiming('advance','private life',n,30)!; const end = beginCommandSpan('simulation'); end?.(); trace.finish(true); }
  const snapshot = recorder.snapshot()!;
  expect(snapshot.retainedEvents).toBe(16); expect(snapshot.totalEvents).toBe(36); expect(snapshot.overwrittenEvents).toBe(20); expect(snapshot.completeTraces).toBe(4);
  expect(JSON.stringify(snapshot)).not.toContain('private life');
  expect(Object.keys(snapshot.events[0]).sort()).toEqual(['age','command','elapsedMs','phase','trace']);
  snapshot.events[0].command = 'changed export'; expect(recorder.snapshot()!.events[0].command).toBe('advance');
  recorder.stop(); expect(beginCommandTiming('advance','private life',10,30)).toBeNull(); expect(recorder.status().retainedEvents).toBe(16);
  recorder.clear(); expect(recorder.status()).toEqual({recording:false,retainedEvents:0,overwrittenEvents:0});
});

test('overwritten/unfinished traces are excluded and nested phase pairs remain coherent', () => {
  const recorder = createPerformanceRecorder(() => true,16); recorder.start();
  const trace = beginCommandTiming('advance','private',1,50)!;
  for (let n=0;n<10;n++) { const outer=beginCommandSpan('month'),inner=beginCommandSpan('month');inner?.();outer?.(); }
  trace.finish(true);
  expect(recorder.snapshot()!.completeTraces).toBe(0);expect(recorder.snapshot()!.partialTraces).toBe(1);
  recorder.start();const next=beginCommandTiming('advance','private',1,50)!;
  const outer=beginCommandSpan('month'),inner=beginCommandSpan('month');inner?.();outer?.();next.finish(true);
  expect(recorder.snapshot()!.summary['advance/age-50/month'].samples).toBe(2);
  recorder.stop();
});

test('only the published revision is attributed; stopped/replaced sessions reject late UI callbacks', () => {
  const recorder=createPerformanceRecorder(()=>true,64),frames:FrameRequestCallback[]=[];
  const frame=jest.spyOn(global,'requestAnimationFrame').mockImplementation(callback=>{frames.push(callback);return frames.length;});
  try {
    recorder.start();const endPress=beginCommandPress(),trace=beginCommandTiming('advance','private',1,23)!;endPress?.();
    markCommandPublished('private',2);markCommandUi('other',2,false);markPublishedUiEvent('private',1,'ui:react-render',9);
    markCommandUi('private',2,false);markPublishedUiEvent('private',2,'ui:react-render',3);trace.finish(true);
    expect(recorder.snapshot()!.summary['advance/age-23/ui:react-render'].p50).toBe(3);
    recorder.stop();frames[0](1);const count=recorder.status().retainedEvents;
    recorder.start();frames[0](2);expect(recorder.status().retainedEvents).toBe(0);expect(count).toBe(5);
  } finally {recorder.stop();frame.mockRestore();}
});
