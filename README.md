# Dreams: Life Simulator

Continuing in a new cloud chat: use branch **`work`** and read [the handoff](docs/HANDOFF.md) first for the current checkpoint, unfinished work and exact verification limits.

An offline Expo / React Native life simulator for iOS and Android, in development against the 27 supplied references in `design/`. Creation, deterministic Age Up, education/work, ownership/markets, family/legacy, health, crime/courts/prison, social profiles/fame, businesses, travel/emigration, pets, hobbies and all eleven special-career paths are connected. The source catalogue meets the 250-situation minimum; editorial, balance, visual and release acceptance remain open. See [current progress](docs/PROGRESS.md) and the [completion breakdown](docs/OPENING_PLAN.md) for the implemented scope and remaining production work.

Smooth actions, startup/onboarding and early gameplay remain priorities. Automatic saving publishes only committed results, and reopening resumes the saved decision, outcome or interrupted year. The [opening actions](docs/OPENING_ACTIONS.md), [callback acceptance](docs/CALLBACK_ACCEPTANCE.md) and [hobby events](docs/HOBBY_COMMUNITY_EVENTS.md) documents record actual Android software-emulator checks and their limits. Physical-device performance, standalone builds, iOS interaction and complete reference/accessibility acceptance remain open.

The game is free and uses local saves. No account, subscription or cloud service is planned. Existing local archive/history features remain intact; additional import/export/sharing and history-storage work is parked under the user's current scope. Country models are authored game assumptions; see [rule verification status](docs/COUNTRY_RULES.md).

```sh
npm ci
npm start
```

Use Node 24 for the test suite and an Expo SDK 57-compatible device or development build. Android emulator commands require a configured Android SDK; iOS simulators require macOS. Android/iOS Hermes exports and scoped Android Expo Go interactions are verified. The standalone Android build remains blocked by its required React Native AAR host; it has not been retried through another route. See the [release-readiness audit](docs/RELEASE_READINESS_AUDIT.md) for build identity, branding, device and distribution work still required.

```sh
npm run typecheck
npm run check:imports
npm test
npm run test:soak
npx expo export --platform all
```

Tests include native component interactions, deterministic domain checks and real SQLite transactions using Node 24's SQLite module. The [CI workflow](.github/workflows/quality.yml) runs strict app/test types and the Jest regression suite on pushes and pull requests; adding the workflow does not establish that its first hosted run has passed. See the [master plan](docs/planning/MASTER_PLAN.md) and [design reconciliation](docs/planning/design-reconciliation.md) for production requirements.

The optional `node tools/benchmark-history.cjs` diagnostic measures the current engine/checkpoint workload in this cloud runtime. Its [results and limits](docs/PERFORMANCE.md) do not establish native-device performance.

Full-screen welcome, birth and death ink transitions use local SVG/Reanimated choreography. See [implementation, playback and verification](docs/CINEMATIC_TRANSITIONS.md).

Interactive **Clutch Shot**, **Safe Cracker** and **Orbital Docking** challenges connect to athlete seasons, burglary and astronaut assignments. Internal God Mode includes a practice playground with difficulty selection. See [mini-game controls, save rules and verification](docs/MINIGAMES.md).

Development and configured internal preview builds include **Settings → God Mode** for testing money, stats, skills and relationships. Public production builds disable access. See [God Mode setup and save behavior](docs/GOD_MODE.md).

**Activities → Your Life → End This Life** finishes the current character’s story after confirmation, using the normal death, estate and child-continuation flow. A **Before End This Life** checkpoint is saved atomically so the earlier life can be restored as a separate branch through Time Machine.

New lives begin with a short [birth journal](docs/BIRTH_JOURNAL.md): actual family names, ages and occupations, with occasional original birth anecdotes. The existing Life journal opens at the beginning of this introduction without an additional screen.

Generated illustrations and layered age-based portraits are bundled offline; provenance and review status are in [assets/generated](assets/generated/README.md). The full artwork family and native visual acceptance remain pending.

The [reference polish review](docs/verification/product-polish/README.md) covers contextual event/pet artwork, relationship rows and profiles, thicker stat bars, saved school milestones, twenty homes and twenty vehicles, household rental leases, and shorter travel/care/business flows. Before/after browser captures, offline bundle checks and compatibility evidence are included; native device visual acceptance remains open.
