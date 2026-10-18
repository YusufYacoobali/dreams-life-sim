# Dreams: Life Simulator

An offline Expo / React Native life simulator for iOS and Android. Development is in progress against the 27 supplied references in `design/`. Creation, deterministic Age Up, persistent events, education, ordinary work, cash/debt, ownership, mortgages and investments are connected. Death, saved lives and local import/export/recovery work at the implemented core level. Family formation and expanded systems remain pending; this is not the complete game.

The game is free and uses local saves. No account, subscription or cloud service is planned. Country models are authored game assumptions; see [rule verification status](docs/COUNTRY_RULES.md).

```sh
npm ci
npm start
```

Use an Expo SDK 57-compatible device or development build. Android emulator commands require a configured Android SDK; iOS simulators require macOS. This cloud workspace has verified native bundle generation, not device execution.

```sh
npm run typecheck
npm test
npm run test:soak
npx expo export --platform all
```

Tests include native component interactions, deterministic domain checks and real SQLite transactions using Node 24's SQLite module. See [progress and verification](docs/PROGRESS.md), the [master plan](docs/planning/MASTER_PLAN.md) and [design reconciliation](docs/planning/design-reconciliation.md) for implemented scope, remaining work and visual acceptance limits.

Generated illustrations and layered age-based portraits are bundled offline; provenance and review status are in [assets/generated](assets/generated/README.md). The full artwork family and native visual acceptance remain pending.
