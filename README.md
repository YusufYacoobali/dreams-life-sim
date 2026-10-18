# Dreams Life Sim

Expo React Native project with TypeScript for iOS and Android. Only the official
blank starter is present; game development has not started.

## Run

Dependencies are installed. From this directory:

```sh
npm start
```

Open the project in Expo Go on your phone using the QR code. Keep the phone and
computer on the same network. This project uses Expo SDK 57.

`npm run android` opens a configured Android emulator. `npm run ios` opens an
iOS simulator on macOS; on Windows, use Expo Go on a physical iPhone.

## Check and reinstall

```sh
npm run typecheck
npm ci
```

TypeScript strict mode is enabled. The npm lockfile pins the dependencies.
The existing `design/` directory is available for design material.

## Dependency audit

At setup, `npm audit` reports 22 upstream dependency advisories (7 moderate and
15 high). Its suggested forced fixes include incompatible Expo and React Native
downgrades. The Expo-compatible dependency versions have been retained.
