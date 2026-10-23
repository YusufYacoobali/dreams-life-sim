import { AppState, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import Constants, { ExecutionEnvironment } from 'expo-constants';

type NativeReview = Pick<typeof import('expo-store-review'),'isAvailableAsync'|'requestReview'>;
function nativeReview():NativeReview|null {
  // Expo Go belongs to Expo, not Dreams. A Dreams development build can still
  // exercise StoreKit's test sheet; __DEV__ alone must not disable that path.
  if(Constants.executionEnvironment===ExecutionEnvironment.StoreClient||!['ios','android'].includes(Platform.OS))return null;
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
