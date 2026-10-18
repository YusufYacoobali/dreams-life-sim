# Dreams: Life Simulator

An offline Expo / React Native life simulator for iOS and Android. Development is in progress against the 27 supplied references in `design/`. The current core supports creation, birth, deterministic Age Up, persistent decisions/results, journal, death, saved lives and local import/export/recovery. The broader education, work, family, economy and expanded systems remain in development; this is not the complete game.

The game is free and uses local saves. No account, subscription or cloud service is planned.

```sh
npm ci
npm start
```

Use an Expo SDK 57-compatible device or development build. Android emulator commands require a configured Android SDK; iOS simulators require macOS. This cloud workspace has verified native bundle generation, not device execution.

```sh
npm run typecheck
npm test
npx expo export --platform all
```

Tests include native component interactions, deterministic domain checks and real SQLite transactions using Node 24's SQLite module. See [progress and verification](docs/PROGRESS.md), the [master plan](docs/planning/MASTER_PLAN.md) and [design reconciliation](docs/planning/design-reconciliation.md) for implemented scope, remaining work and visual acceptance limits.

Generated illustrations are bundled offline; provenance and review status are in [assets/generated](assets/generated/README.md). Portraits and the full artwork family are still pending.
