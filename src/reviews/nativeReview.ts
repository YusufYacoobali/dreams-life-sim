import { AppState, Linking, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import Constants, { ExecutionEnvironment } from 'expo-constants';

type NativeReview = Pick<typeof import('expo-store-review'),'isAvailableAsync'|'requestReview'>;
/** Our reminder can render even when a store/native module is unavailable. */
export function reviewPromptSupported(): boolean {
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient && ['ios', 'android'].includes(Platform.OS);
}

/** Only a deliberate user action opens a store page. Never infer a rating. */
export function reviewStoreUrl(): string | null {
  if (!reviewPromptSupported()) return null;
  if (Platform.OS === 'android') {
    const id = Constants.expoConfig?.android?.package ?? 'com.yacoobali.lifesim';
    return 'https://play.google.com/store/apps/details?id=' + encodeURIComponent(id) + '&showAllReviews=true';
  }
  const configured = Constants.expoConfig?.ios?.appStoreUrl;
  if (!configured || !/^https:\/\/apps\.apple\.com\//.test(configured)) return null;
  return configured + (configured.includes('?') ? '&' : '?') + 'action=write-review';
}

export async function openStoreReview(canPresent: () => boolean = () => true): Promise<boolean> {
  const url = reviewStoreUrl();
  const allowed = () => (!AppState.currentState || AppState.currentState === 'active') && canPresent();
  if (!url || !allowed()) return false;
  if (Platform.OS === 'android') {
    try { await Linking.openURL(url.replace('https://play.google.com/store/apps/details', 'market://details')); return true; }
    catch { /* Devices without a Play handler can open the same listing in a browser. */ }
  }
  if (!allowed()) return false;
  try { await Linking.openURL(url); return true; } catch { return false; }
}

function nativeReview():NativeReview|null {
  // Expo Go belongs to Expo, not Dreams. A Dreams development build can still
  // exercise StoreKit's test sheet; __DEV__ alone must not disable that path.
  if(!reviewPromptSupported())return null;
  try {
    const native=requireOptionalNativeModule<NativeReview>('ExpoStoreReview');
    return typeof native?.isAvailableAsync==='function'&&typeof native.requestReview==='function'?native:null;
  }catch{return null;}
}
/** Use the Expo native module directly: its JS helper can fall back to a URL. */
export async function nativeReviewAvailable():Promise<boolean> {
  try{return await nativeReview()?.isAvailableAsync()??false;}catch{return false;}
}
/** Stores decide whether to show a sheet. They never expose rating completion. */
export async function requestNativeReview(canPresent:()=>boolean=()=>true):Promise<boolean> {
  if(AppState.currentState&&AppState.currentState!=='active')return false;
  try {
    const native=nativeReview();
    if(!native||!await native.isAvailableAsync()||AppState.currentState&&AppState.currentState!=='active'||!canPresent())return false;
    await native.requestReview();
    return true; // A request was made. The store does not report sheet visibility.
  }catch{return false;}
}
