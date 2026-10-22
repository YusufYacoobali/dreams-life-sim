import { AppState, Linking, Platform } from 'react-native';
let mockModule:{isAvailableAsync?:jest.Mock;requestReview?:jest.Mock}|null;
jest.mock('expo-modules-core',()=>({requireOptionalNativeModule:jest.fn(()=>mockModule)}));
import { nativeReviewAvailable, requestNativeReview } from '../../src/reviews/nativeReview';
const reviewGlobals=global as typeof globalThis & {__DEV__:boolean};
const initialDev=reviewGlobals.__DEV__,initialState=AppState.currentState;
beforeEach(()=>{reviewGlobals.__DEV__=false;Object.defineProperty(Platform,'OS',{configurable:true,value:'ios'});AppState.currentState='active';mockModule={isAvailableAsync:jest.fn(async()=>true),requestReview:jest.fn(async()=>{})};});
afterEach(()=>{reviewGlobals.__DEV__=initialDev;AppState.currentState=initialState;jest.restoreAllMocks();});

test('available release builds invoke only the native review API and never a store URL',async()=>{
  const link=jest.spyOn(Linking,'openURL');expect(await nativeReviewAvailable()).toBe(true);await requestNativeReview();expect(mockModule!.requestReview).toHaveBeenCalledTimes(1);expect(link).not.toHaveBeenCalled();
});
test.each(['missing','missing-method','unavailable','web','development'] as const)('%s gracefully suppresses prompts and external URLs',async kind=>{
  const link=jest.spyOn(Linking,'openURL'),request=mockModule!.requestReview!;
  if(kind==='missing')mockModule=null;if(kind==='missing-method')delete mockModule!.requestReview;if(kind==='unavailable')mockModule!.isAvailableAsync!.mockResolvedValue(false);if(kind==='web')Object.defineProperty(Platform,'OS',{value:'web'});if(kind==='development')reviewGlobals.__DEV__=true;
  expect(await nativeReviewAvailable()).toBe(false);await requestNativeReview();expect(request).not.toHaveBeenCalled();expect(link).not.toHaveBeenCalled();
});
test('backgrounding during the availability await prevents a native sheet',async()=>{
  let release!:(available:boolean)=>void;mockModule!.isAvailableAsync!.mockImplementation(()=>new Promise<boolean>(resolve=>{release=resolve;}));const requesting=requestNativeReview();AppState.currentState='background';release(true);await requesting;expect(mockModule!.requestReview).not.toHaveBeenCalled();
});
test('native errors are quiet and never trigger URL fallback or claim a rating completion',async()=>{
  const link=jest.spyOn(Linking,'openURL');mockModule!.requestReview!.mockRejectedValue(new Error('Store throttled'));await expect(requestNativeReview()).resolves.toBeUndefined();expect(link).not.toHaveBeenCalled();mockModule!.isAvailableAsync!.mockRejectedValue(new Error('Unavailable'));expect(await nativeReviewAvailable()).toBe(false);
});
