# Store build versions

Google Play requires a new **Android version code** for every uploaded binary. A successful EAS build can still be rejected if that code was already used. The public version (`1.0.0`) is a separate field and can stay the same for this replacement build.

`eas.json` now uses Expo's [remote version source and automatic incrementing](https://docs.expo.dev/build-reference/app-versions/):

```json
{
  "cli": { "appVersionSource": "remote" },
  "build": {
    "production": { "autoIncrement": true }
  }
}
```

EAS manages Android `versionCode` and iOS `buildNumber` for production builds. The checked-in `app.json` values are local defaults; the remotely managed values are injected into EAS builds. Internal/preview/performance profiles do not auto-increment; their distribution and feature gates are unchanged. The existing EAS project, package/bundle identifiers and signing configuration are retained.

## Initialize the Android counter once

From the `v2` checkout in PowerShell:

```powershell
git pull
npx eas-cli@latest build:version:get --platform android --profile production
```

Compare the result with the highest version code already used in Play Console, including testing tracks. If EAS has no remote counter, or its counter is lower than the Play value, initialize it:

```powershell
npx eas-cli@latest build:version:set --platform android --profile production
```

Enter the highest already-used code, **1 if only code 1 has been uploaded**. Keep any higher existing EAS counter. With the counter initialized to 1, auto-increment makes the next production Android build code **2**, then 3, 4, and so on. This setup is needed once, rather than resetting the counter for every build.

## Build the replacement AAB

```powershell
npx eas-cli@latest build --platform android --profile production
```

Verify the incremented version code in the EAS build output/details and upload the **newly generated AAB**. The previously downloaded version-code-1 AAB remains unchanged; the config fix cannot update a binary that was already built. Build numbers can have gaps when builds fail or are discarded.

Local `npm run android:release` / `npx expo run:android` builds do not reserve an EAS counter value. Use the EAS production command above for store archives. If native local code needs the current remote value, use `eas build:version:sync` as described in Expo's versioning guide.

The Expo Go development warning, project archive size and version-catalog warnings do not cause a duplicate Play version-code rejection. The supplied log shows a completed build and successful use of the existing remote keystore.

## Verification

The configuration validates and resolves through the official `@expo/eas-json` schema for Android/iOS production and internal profiles. Existing release/access configuration tests pass, and the resolved production Expo configuration retains the linked project and normal purchase/profiling gates. No Expo account session is available on this cloud host, so the remote counter has **not** been read or changed here, and no replacement build or Play submission has been started.
