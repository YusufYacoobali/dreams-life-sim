# Dreams: Life Simulator

Continuing in a new cloud chat: use branch **`work`** and read [the handoff](docs/HANDOFF.md) first for the current checkpoint, unfinished work and exact verification limits.

An offline Expo / React Native life simulator for iOS and Android. Development is in progress against the 27 supplied references in `design/`. Creation, deterministic Age Up, education/work, ownership/markets, family/legacy, persistent health/clinical care, crime/courts/prison, social profiles/fame, businesses and acting/modelling/sport, musician, political, YouTuber, Streamer, Astronaut, Military and Royalty paths are connected. The free Time Machine restores complete historical states into separate saved branches, preserving the original future. Local archives include compressed history and branch origin. Holidays and gap years connect temporary location, paid/unpaid leave, actual household companions, local introductions and monthly experiences. Permanent household emigration and real work/study offers connect saved consent, old tax settlement, owned moving funds, foreign-currency jobs and paid tuition. Pets/hobbies, content depth and release validation remain pending; this is not the complete game.

The opening experience is the current priority: welcome art, custom/random creation, a dedicated appearance editor, the one-time newborn introduction and the first Life dashboard now follow the reference structures; native visual acceptance remains pending. See [the opening plan and estimated completion breakdown](docs/OPENING_PLAN.md). Money display now supports runtimes that reject BigInt inputs and omit `Intl.NumberFormat.formatToParts`. Exact amounts use basic number-format probes, with a readable fallback if Intl is unavailable. School connects persistent classmates and teachers, one attended club routine, classroom behaviour, academic help and factual reports. School Plans shows saved participants, permission, conditional costs and recent outcomes. School results now require passing grades and recorded study; free evening courses can earn a missing secondary qualification or improve entry grades around an ordinary job. The source catalogue contains 70 original situations. The listed automated callback acceptance cases pass; wider content, native interaction and release acceptance remain open.

The game is free and uses local saves. No account, subscription or cloud service is planned. Country models are authored game assumptions; see [rule verification status](docs/COUNTRY_RULES.md).

```sh
npm ci
npm start
```

Use an Expo SDK 57-compatible device or development build. Android emulator commands require a configured Android SDK; iOS simulators require macOS. Native bundle generation is verified. The custom Android build awaits access to its required React Native AAR host. Official Expo Go downloaded the real bundle on the software emulator, but repeated Android System UI/Phone hangs prevented opening interactions and visual acceptance; see the handoff. Native app fidelity remains unverified.

```sh
npm run typecheck
npm test
npm run test:soak
npx expo export --platform all
```

Tests include native component interactions, deterministic domain checks and real SQLite transactions using Node 24's SQLite module. See [progress and verification](docs/PROGRESS.md), the [master plan](docs/planning/MASTER_PLAN.md) and [design reconciliation](docs/planning/design-reconciliation.md) for implemented scope, remaining work and visual acceptance limits.

The optional `node tools/benchmark-history.cjs` diagnostic measures the current engine/checkpoint workload in this cloud runtime. Its [results and limits](docs/PERFORMANCE.md) do not establish native-device performance.

Generated illustrations and layered age-based portraits are bundled offline; provenance and review status are in [assets/generated](assets/generated/README.md). The full artwork family and native visual acceptance remain pending.
