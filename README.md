# Dreams: Life Simulator

An offline Expo / React Native life simulator for iOS and Android. Development is in progress against the 27 supplied references in `design/`. Creation, deterministic Age Up, education/work, ownership/markets, family/legacy, persistent health/clinical care, crime/courts/prison, social profiles/fame, businesses and acting/modelling/sport, musician, political, YouTuber, Streamer, Astronaut, Military and Royalty paths are connected. The free Time Machine restores complete historical states into separate saved branches, preserving the original future. Local archives include compressed history and branch origin. Holidays and gap years connect temporary location, paid/unpaid leave, actual household companions, local introductions and monthly experiences. Permanent household emigration and real work/study offers connect saved consent, old tax settlement, owned moving funds, foreign-currency jobs and paid tuition. Pets/hobbies, content depth and release validation remain pending; this is not the complete game.

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

The optional `node tools/benchmark-history.cjs` diagnostic measures the current engine/checkpoint workload in this cloud runtime. Its [results and limits](docs/PERFORMANCE.md) do not establish native-device performance.

Generated illustrations and layered age-based portraits are bundled offline; provenance and review status are in [assets/generated](assets/generated/README.md). The full artwork family and native visual acceptance remain pending.
