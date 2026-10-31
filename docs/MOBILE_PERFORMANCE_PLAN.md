# Codex Plan — Dreams v2 Mobile Performance Optimisation

**Branch:** `v2`  
**Baseline commit:** `8ba6ba14`  
**Goal:** Make Dreams noticeably faster on mobile, particularly after ages 50, 70 and 90, without changing gameplay, saves or visual design.

Implement, verify, commit and push the optimisation work to `v2`.

## Non-negotiable requirements

- Do not change gameplay outcomes, probabilities, RNG order, event pacing, money, characters, relationships or journals.
- Preserve the current UI design and navigation.
- Do not truncate historical data, shorten lives or remove features.
- Preserve Time Machine, backups, receipts, rollback, recovery and generations.
- Keep existing save compatibility, checkpoint formats and monetisation.
- Do not add dependencies or upgrade Expo/React Native unless a measured problem requires it.
- Optimise actual bottlenecks rather than blindly rewriting working systems.

## Phase 1 — Measure the Baseline

Start with a detailed performance audit before modifying runtime code.

### Existing implementation

The app already uses:

- Expo 57, React Native 0.86, Hermes and Zustand.
- SQLite WAL with exclusive transactions.
- Compressed checkpoint v4 with ledger and person chunk caching.
- Immutable certified worlds with validation shortcuts.
- A virtualised, memoised Life journal.
- Busy-state feedback before Age Up processing.

Retain these existing optimisations.

### Measure five operations

1. Age Up / Continue Year.
2. Ordinary actions such as talking, working and buying items.
3. Saving and reopening long lives.
4. Switching between Life, Relationships, Assets and Activities.
5. Loading journal history, statistics, assets and large relationship collections.

Benchmark age 10, 25, 50, 70 and 90 worlds.

Include ordinary lives, lifestyle-enabled lives, active property/vehicle/pet/hobby lives and a multi-generation life.

### Record separate timings

Measure the following independently:

| Component | What to investigate |
|---|---|
| Simulation | Monthly calculations and annual events |
| World copy | `copyWorld()` allocations and time |
| Validation | Zod parsing, ledger integrity and reference checks |
| Checkpoint packing | JSON, gzip, hashes and base64 |
| SQLite | Reading, writing and transaction commits |
| Zustand | State publication and affected subscribers |
| React rendering | Component renders and commits |
| Native display | JS/UI FPS, responsiveness and frame stalls |

Capture median, p95, peak memory and cold/warm measurements.

Use existing benchmark infrastructure in `tools/benchmark-final-performance.cjs`, `tools/benchmark-performance-pairs.cjs` and `tests/performance/life-journal-render.bench.tsx`.

**Deliverable:** `docs/verification/mobile-performance/baseline.md` with measured bottlenecks ranked by impact.

## Phase 2 — Optimise Age Up and Engine Processing

Primary files:

- `src/game/engine.ts`
- `src/game/model.ts`
- `src/game/ledgerIndex.ts`
- Relevant `src/game/systems/*` modules

### 2.1 Reduce repeated calculations

Inspect `processMonth()` and `continueYear()`.

Look for repeated full-world scans in:

- `financialActors()`
- Monthly finances and assets
- NPC relationships
- Social media
- Health and mortality
- Careers
- Legal processing
- Hobby and pet monthly processing

Where the same expensive lookup occurs repeatedly within a single month, consider constructing a temporary indexed view once and reusing it.

Examples include:

- People by ID
- Active employment by person
- Relationships by participant
- Assets by owner
- Ledger transactions by account/category

These indexes must be read-only derived data, not new saved gameplay state.

**Critical:** Preserve participant ordering and seeded RNG consumption. Existing object iteration order can affect the simulation.

Do not cache a derived result across months if the underlying state can change.

### 2.2 Improve validation efficiency

The model currently validates an entire world after every successful command.

Keep that integrity guarantee.

Investigate unnecessary repeated traversal of:

- Unchanged frozen branches
- Historical transactions
- Person histories
- Relationships
- Archived careers and incidents

Reuse the existing private certification mechanism where safe.

Never treat `Object.freeze()` alone as proof that imported data is valid.

Potential optimisations must retain full balance reconciliation, reference checks, chronology validation and tamper detection.

### 2.3 Investigate ledger indexing

Long-life benchmarks contain approximately 47,000 ledger rows at age 90.

Profile the existing `indexLedger()` and validation call sites.

First remove duplicate index construction within a single validated command, where demonstrably present.

Consider append-only incremental indexing only if necessary and only when certified unchanged rows, order and appended transactions can be proven.

Any mismatch must fall back to full validation, not silently accept incorrect history.

### 2.4 Avoid expensive repeated searches

Replace measured repeated linear searches with temporary maps where this improves performance.

Avoid unnecessary `filter`, `find`, `map` and `reduce` passes on very large arrays.

Do not restructure every function for style alone.

**Acceptance:** Identical commands produce byte-identical canonical worlds, RNG states and journal histories.

## Phase 3 — Improve Save and Load Performance

Primary files:

- `src/persistence/repository.ts`
- `src/persistence/checkpoints.ts`
- `src/persistence/native.ts`
- `src/game/model.ts`

### 3.1 Optimise checkpoint packing

Existing v4 checkpoints already compress and group records.

Investigate actual costs of:

- Serialising unchanged branches
- Building large temporary strings
- Converting strings to UTF-8
- gzip compression
- base64 encoding
- Repeated allocation
- Cached chunk lookup

Use the existing bounded caches before introducing another caching layer.

Avoid creating duplicate full-world strings where a safe equivalent already exists.

Keep deterministic encoding and existing archive compatibility.

### 3.2 Optimise SQLite commit overhead

Inspect `SaveRepository.commit()`.

It currently checks the saved revision and receipt, reads the existing payload for exact integrity checks, packs the next checkpoint and commits the updated world, backup and receipt.

Measure whether the large payload read or native SQLite interaction is materially expensive on devices.

If so, investigate a safer equivalent that preserves:

- Same-revision corruption detection
- External-write conflict detection
- Exact backup contents
- Receipt idempotency
- Full rollback on failed writes
- Atomic checkpoint storage

**Never remove the existing payload integrity check merely to make commits appear faster.**

Do not introduce partial saves or defer durable commits until after success is shown.

### 3.3 Improve save loading

Profile cold reopening of ages 50, 70 and 90.

Investigate:

- Decompression and decoding
- Large-object allocation
- Full-world validation
- Freezing and index construction
- Restoring the active life into Zustand
- First-screen presentation

Use safe reuse of already validated data only within the correct life and revision.

Keep corrupted-save detection and the existing recovery flow.

## Phase 4 — Reduce Mobile Memory Usage

Memory is particularly important for long lives.

### Investigate retained memory

Profile memory from:

- Current immutable world
- Temporary working world
- Packed checkpoint strings
- SQLite result payloads
- Ledger indexes
- Person/branch caches
- React projections
- Saved-life previews
- Historical Time Machine snapshots

Identify allocations that survive unnecessarily after a command or life switch.

### Implement safe improvements

- Avoid retaining unused old world references in UI closures.
- Ensure caches are bounded or weakly referenced where appropriate.
- Release obsolete temporary projections.
- Avoid duplicating large arrays for display-only transformations.
- Keep active-life caches isolated by life and person identity.
- Inspect memory after opening and closing multiple long lives.

Do not clear caches aggressively if doing so makes Age Up slower.

Do not delete or prune saved histories to improve memory usage.

**Acceptance:** No unbounded memory growth during repeated Age Up, life switching, opening details or returning to the home screen.

## Phase 5 — Improve React Native Screen Performance

Primary files:

- `src/state/useGame.ts`
- `src/state/gameStore.ts`
- `app/(game)/(tabs)/life.tsx`
- `app/(game)/(tabs)/relationships.tsx`
- `app/(game)/(tabs)/assets.tsx`
- Relevant large-detail screens

### 5.1 Reduce unnecessary rerenders

Audit components subscribing to the entire `world` object.

Where useful, replace broad subscriptions with narrow selectors or memoised display projections.

For example, a change to an unrelated NPC record should not force expensive reprocessing of an unchanged asset list.

Keep identity and state consistency across new lives, generations, Time Machine branches and restores.

### 5.2 Preserve the current Life journal optimisations

The Life journal already has FlatList virtualisation, stable rows and memoised fact components.

Do not replace this implementation automatically.

Investigate only measured issues such as:

- Unnecessary row renders
- Repeated auto-scroll and layout work
- Large-text measurements
- Expensive portrait/layout calculations

Keep the existing Android compatibility protection around clipped views. Do not simply enable clipping or introduce fixed row heights for variable-length journal text.

### 5.3 Optimise large secondary screens

Check Relationships, Assets, finances, history and lifetime statistics.

Use bounded, memoised projections and list virtualisation where appropriate.

For example, `lifetimeStatistics()` traverses historical ledger entries; this should be measured when opening the screen and when the world changes.

Do not recompute expensive statistics merely because the theme or a local UI state changed.

Maintain the full displayed history and accessibility behaviour.

## Phase 6 — Improve Perceived Age Up Responsiveness

The store already publishes busy state and yields once to the UI before performing a command.

However, long synchronous simulation can still occupy the JavaScript thread.

First verify whether this is an actual source of visible frame stalls.

If it is, investigate cooperative Age Up processing.

### Optional cooperative processing

Potentially divide long simulation work at existing safe monthly boundaries, allowing the UI to render between chunks.

This must preserve:

- The exact original simulation functions and calculation order
- All RNG draws
- One logical Age Up or Continue Year command
- Existing event interruption behaviour
- Original journal ordering
- Atomic final persistence
- No partially published world
- Safe failure/cancellation behaviour

Do not split a command into additional persisted transactions just to show a progress bar.

If cooperative execution significantly increases latency or threatens save correctness, keep the synchronous resolver and optimise its measured hot paths instead.

Do not add elaborate new loading screens or redesign the Age Up button.

## Phase 7 — Real Mobile Profiling

Test actual release-mode builds when a device is available.

Use React Native DevTools for JS/React investigation and Android Studio or Xcode tooling for native runtime profiling.

Measure:

- Tap-to-visible-feedback
- Tap-to-completed-save
- JS and UI frame stalls
- Screen navigation time
- Peak native memory
- Memory after repeated actions
- Cold launch and reopening
- Long-list scroll smoothness

Include a capable iPhone and a mid-range Android device.

Do not compare development-build timings directly against release builds.

If device access is unavailable, leave this acceptance gate explicitly open. Successful Hermes exports alone are not mobile performance proof.

## Phase 8 — Performance Targets

Treat these as engineering goals, not predetermined results.

| Metric | Desired improvement |
|---|---|
| Age 70–90 command latency | Aim for 20–30% lower p95 on identical workloads |
| Checkpoint packing | Aim for 20% less time if identified as a bottleneck |
| Long-life peak memory | Aim for 15–25% reduction if duplicated allocations are found |
| Screen navigation | Noticeably reduced stalls and unnecessary renders |
| Ages 10–50 | No material regression |
| Save compatibility | Zero gameplay or persistence differences |

Use equivalent frozen workloads, controlled sample counts and interleaved measurements where practical.

If a change has no statistically convincing benefit, revert it rather than adding complexity.

## Phase 9 — Full Regression and Compatibility

Required tests:

1. Strict app/test TypeScript.
2. Full Jest regression.
3. 120-life soak.
4. Historical World 49/50 capability compatibility.
5. Reader 32 and archive 1/2 compatibility.
6. Checkpoint v1–v4 decoding.
7. Exact legacy canonical-world and checkpoint round trips.
8. Time Machine branch independence.
9. Backup and recovery.
10. SQLite transaction rollback and retry.
11. Receipt idempotency.
12. External-write and corruption detection.
13. Exact seeded RNG and event outcomes.
14. Birth, death and generational continuation.
15. Age 50/70/90 performance comparison.
16. iOS/Android production Hermes exports.

Include ordinary, enhanced creative-career, crime/romance and lifestyle-enabled saves.

All performance tests must retain real histories and use comparable commands and dates.

Do not remove, truncate or modify test fixtures simply to improve benchmark numbers.

## Implementation approach

Work in independently reviewed stages:

**Stage A — Baseline:** Identify and rank bottlenecks.

**Stage B — Safe optimisations:** Improve measured repeated calculations, validation and cache usage.

**Stage C — Persistence:** Reduce save/load overhead without weakening integrity.

**Stage D — Memory and UI:** Reduce retained allocations and unnecessary rendering.

**Stage E — Responsiveness:** Consider cooperative processing only if profiling justifies it.

**Stage F — Verification:** Re-run all required checks and compare exact outcomes and performance.

Commit each coherent improvement to `v2`.

## Final deliverables

Create:

- `docs/MOBILE_PERFORMANCE_OVERHAUL.md`
- `docs/verification/mobile-performance/baseline.md`
- `docs/verification/mobile-performance/after.md`
- `docs/verification/mobile-performance/comparison.json`
- Benchmark raw reports and reproduction commands

Update `docs/HANDOFF.md`.

Document every optimisation, the measured effect, its regression risks and any unavailable device acceptance.

## Final instruction to Codex

**This is a performance-only overhaul. Do not change game design, content, visuals, purchases or player progression.**

Prioritise Age Up, world validation, checkpoint packing, memory allocation and avoidable React rerenders.

Apply only optimisations backed by evidence. Preserve every historical record and every seeded gameplay outcome.

Fully implement, test, document and push the improvements to `v2`. Do not stop at a profiling report or leave the main performance optimisations as recommendations.