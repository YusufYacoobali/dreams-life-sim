import { AppState, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

type NativeReview = Pick<typeof import('expo-store-review'),'isAvailableAsync'|'requestReview'>;
function nativeReview():NativeReview|null {
  if((typeof __DEV__!=='undefined'&&__DEV__)||!['ios','android'].includes(Platform.OS))return null;
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
export async function requestNativeReview():Promise<void> {
  if(AppState.currentState&&AppState.currentState!=='active')return;
  try {const native=nativeReview();if(native&&await native.isAvailableAsync()&&(!AppState.currentState||AppState.currentState==='active'))await native.requestReview();}catch{ /* Missing modules and store throttling are quiet. */ }
}
