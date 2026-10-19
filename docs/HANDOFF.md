# Continue Dreams: Life Simulator in a new cloud chat

This handoff was requested on 19 October 2026. All application changes, tests,
the genuine migration fixture and deferred source/art drafts are committed
to the **same `work` branch**. Fetch `origin/work`; do not start from `main` or
the older `checkpoint/early-school-callbacks-20261019-1346` branch.

The continuation completed the listed automated callback acceptance cases; see
[CALLBACK_ACCEPTANCE.md](CALLBACK_ACCEPTANCE.md). It then added twenty distinct
early-life situations (**70 total**), including five parent-free preschool scenes,
and a read-only School Plans section with original participants, due dates,
permission, conditional costs and paid/cancelled outcomes. Welcome now scrolls
when its content exceeds the viewport. Native visual/large-text review remains open.

Current versions are **world 23 / engine 22 / content 3 / database 4**. Genuine
world-22 and content-two archives retain their people, decisions, paid outings,
projects, history and RNG. Permanently contradictory scheduled contexts are
rejected on import; temporary absence before the deadline remains valid.

Database four stores newly written current/recovery/branch/import rows using the
existing bounded checkpoint-v1 compression. It still reads old plain rows and
upgrades the database marker transactionally without bulk rewriting lives or
consuming RNG. An old plain row can remain the backup until the next real commit.
Older app versions explicitly refuse the new database marker. The checkpoint
format and world/engine versions did not change.

The final clean regression passes **905 tests / 60 suites** in **667.495 seconds**,
including genuine migration fixtures, SQLite rollback/retry/recovery/cold resume,
format-only Intl startup, callback lifecycle and twelve complete seeded lives.
Strict application/test typing, fresh Android/iOS Hermes exports (5.1/4.8 MB,
45 assets) and current Metro manifests/source bundles also pass. These are
cloud/native-component checks, not device or release acceptance.

The separate direct Node sweep passes **120/120 distinct seeds** across all twelve
countries in **2,209.809 seconds**, ages at death 40–98, at most 24 people and
55,199 ledger rows. Its game-source hash is unchanged. The 43 overlapping
completed Jest lives match terminal age/people/ledger metrics; that slower
expanded Jest run was stopped and remains partial, not another completed sweep.
[Per-seed records](verification/life-sweep-120-20261019.json) preserve the scope.
The 1,000-seed, 1,000-person, 120-year and multi-generation gates remain open.

The real 79-observation SQLite workload now uses **29,933,568 bytes** closed and
**36,327,648 bytes** peak including WAL/shared memory, compared with 72,376,320
and 103,391,328 bytes for plain live/backup rows. All 235 commands, entire live
and backup worlds, 79 historical payloads/metadata, receipts and preferences
match. These are fresh-database comparisons; existing files may retain allocated
pages, and native timing/storage acceptance is still open. The conservative
120-late-checkpoint projection remains 95.7 MB. See [PERFORMANCE.md](PERFORMANCE.md)
for scoped measurements, decoder differential checks and remaining gates.

[EDUCATION_SOURCE_AUDIT.md](EDUCATION_SOURCE_AUDIT.md) records a partial official
source review for the next school paths. No country-rule values changed and no
complete country profile is release verified.

## User priorities and authorisation

Build the entire production game through the [master plan](planning/MASTER_PLAN.md)
and [preserved specification](planning/source-specification.md). Do not stop at
the first playable life. Work autonomously through tested, committed milestones.
Keep [PROGRESS.md](PROGRESS.md) honest about implemented, unimplemented and
unverified work. During active work, **commit AND push at a safe point at least
every two hours**; do both before another handoff. No sub-agents are authorised.

The user explicitly redirected work to **onboarding, Begin Life and the first
years of playing** after runtime errors and substantial visual gaps. Fix reported
startup/playability issues before adding later features. Keep the game free,
offline, with local saves/export/import; no Premium, ads, subscription or cloud
account. Target adults with non-graphic mature themes and all twelve launch
countries. All 27 reference images in `design/` were already opened and reconciled
in [the design reconciliation](planning/design-reconciliation.md).

The conservative overall estimate remains about **50%**. The per-area baseline
is in [OPENING_PLAN.md](OPENING_PLAN.md). Passing tests does not establish native
visual fidelity or release readiness; do not inflate percentages for this checkpoint.

## Stable startup fix to preserve

`0dde6b6` fixed both reported Intl crashes in `src/game/money.ts`: Hermes may
reject BigInt inputs and omit `formatToParts`. Money display now uses only safe
Number probes with `.format`, then assembles the actual arbitrary-size balance
as exact text. It does not need `formatToParts`, `resolvedOptions` or `signDisplay`.
Missing/unusable Intl gets an exact readable fallback. Preserve all currencies,
signs, grouping, fractions, JPY precision and existing saves.

The prior world-22 checkpoint `52d081b` had **779 passing tests / 53 suites**,
strict source/test typing, Android/iOS production Hermes bundles and current
Metro source checks. The format-only opening check follows real SQLite creation,
Begin Life, first Age Up, choice/result, save, cold resume and all four starting
tabs. Users should pull `work`, restart `npx expo start -c`, and reload; clearing
the bundler cache does not require deleting saved lives.

## Callback implementation and completed automated acceptance

The callback checkpoint moved to **world 23 / engine 22 / content 2** and added
`world.storyThreads`. Older saves migrate to an empty history without executing
a callback, consuming RNG or changing existing outcomes. A genuine world-22
archive in `tests/fixtures/v22-school-story-archive.json` preserves an actual
school story result and its earlier decision/checkpoint. It was generated from
world-22 source at `2f25f5e`, not by editing version tags.

New files:

- `src/game/systems/storySchemas.ts`: saved threads and typed schedule/resolve effects.
- `storyContext.ts`: actual school/peer/teacher/parent availability and saved location.
- `stories.ts`: permission draw, real quote, due-month offers, payments/effects and cancellation.
- `storyValidation.ts`: origin, permission arithmetic, pending references and payment reconciliation.
- `tests/game/story-callbacks.test.ts` and `tests/ui/story-callback-flow.test.tsx`.

The existing arcade invitation can ask the real co-resident parent for permission.
One NPC-stream draw is saved with chance and trust at request. Refusal books and
charges nothing. Acceptance schedules next month; actual attendance charges the
named parent's available local-currency bank account once, with a real ledger
reference. An unaffordable outing disables attendance while declining stays free.
The player and party host receive no invented cash, gifts or achievements.

One new distinct situation, `school-project-promise`, offers a genuine shared
project with the current peer and teacher, due two months later. Its callback
changes actual bounded grades, energy, peer bond and teacher trust. It grants no
qualification. That checkpoint's catalogue contained **50 situations**; callback/result
steps do not count as additional distinct stories.

The scheduler runs after monthly mortality/travel. Saved decisions use the
existing priority queue, so urgent medical/legal events can precede a callback.
The annual cursor pauses at the real month and resumes the remaining months.
Cancelled plans retain their original identities and remove their own queued
decision. Another parent, classmate or teacher is never silently substituted.

## Original callback checkpoint verification (historical)

- The new **28 checks / 2 suites pass**, including all twelve party currencies,
  saved permission/refusal, funds/decline, all project branches, exact due months,
  repeat/replay rejection, cold results and remaining-year progression, hospital/
  wanted cancellation, school change, death/priority-queue cleanup, tamper rejection
  and genuine world-22 current/prior archive migration.
- The native-component flow uses real SQLite: origin failure/retry preserves RNG
  and permission, due-choice failure/retry preserves money, cold results preserve
  the payment and cursor, and completing the year does not charge twice.
- The complete world-23 regression passes: **808 tests / 55 suites**, 476.624 seconds,
  including twelve complete seeded lives and the new callback/native-component
  flows. Strict application/test typing and fresh Android/iOS production Hermes
  exports pass (5.1/4.8 MB, 45 assets). Both current Metro source bundles return
  HTTP200 and contain the new callbacks and exact-money code. The deferred archive's
  seven file hashes and this handoff's local links were also checked.

The 808-test result describes the original transfer checkpoint. The continuation
completed the additional automated callback cases listed below; native/release
acceptance and the complete production game remain unfinished.

The originally remaining callback cases now have explicit connected checks:
real travel/custody, permanent relocation, teacher departure/replacement, parent
household change/death, player death and actual existing-child legacy, month-12
medical/legal queues and grade/bond caps. The native-component check also proves
atomic cancellation of two callbacks through SQLite failure/retry/cold resume.
See [CALLBACK_ACCEPTANCE.md](CALLBACK_ACCEPTANCE.md) for fixture scope and limits.
Keep the 120/1,000-life performance gate open. The soak wrapper now accepts an
explicit count and scales its timeout, with per-life progress on expanded runs.
The current 120-seed pure-engine run passes; 1,000-seed, 120-year, multi-generation
and native gates remain open. The current content-three history has 27.3 MB of
actual payloads and projects 95.7 MB for 120 repeated late checkpoints, above the
planned 50 MB budget; see [PERFORMANCE.md](PERFORMANCE.md).

## Cloud environment and native limitations

Use the repository's existing checkout, not an extra worktree. Node **24.19** and
npm **11.9** are validated. No application secret, account or backend is required.
Use `npm ci` with the lockfile; if the default cache is not writable, the verified
command is `npm ci --cache /workspace/.cache/npm`. Run `npm run typecheck`, targeted tests, then the
required regression and `EXPO_OFFLINE=1 npx expo export --platform all`. SDK 57's
offline `expo install --check` works. Dependencies were aligned, including explicit
`expo-font ~57.0.4`; do not force dependency upgrades or change HOME/proxy/TLS.

For cloud localhost Metro, keep CI unset and use Node's IPv4 preference:

```bash
env -u CI EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 EXPO_UNSTABLE_HEADLESS=1 \
  __UNSAFE_EXPO_HOME_DIRECTORY=/workspace/.cache/expo \
  node --dns-result-order=ipv4first ./node_modules/expo/bin/cli start \
  --localhost --port 8081 --max-workers 2
```

Inspect existing listeners before starting another server. `/status` must respond
on `127.0.0.1:8081` for `adb reverse`; without IPv4 preference this environment
bound only `::1`. Fetch Android/iOS manifests and actual current source bundles.
Do not claim readiness from a PID/open port alone or present localhost previews.
Services, tool caches and running processes need not survive a new cloud chat.

A custom Android build remains blocked by the active policy: the required RN
0.86.3 AAR redirects to `repo.reactnative.dev` and receives HTTP403. The exact
domain is saved in the environment draft but has not been observed in the active
policy. Saving a draft does not apply/publish it. Do not retry unchanged denied
downloads or use a mirror/bypass. Recheck the managed runtime after a real change.

The official Expo Go **57.0.9** APK from
https://github.com/expo/expo-go-releases/releases/tag/Expo-Go-57.0.9 installed on
the software Android 15 emulator and downloaded this checkout's SDK57 bundle,
logging `Running main`. Repeated Android System UI/Phone hangs prevented usable
opening interaction and visual comparison. Bundling and `Running main` are not a
native pass. The unaccelerated emulator was stopped; there is no completed native
test life. iOS simulator execution requires macOS. Native picker/share, portraits,
blend modes, layout fidelity, performance and release acceptance remain open.

## Full-game backlog and preserved work

Persistent school contacts, clubs, conduct, help and reports are already connected.
The broad systems in [PROGRESS.md](PROGRESS.md) are partial implementations, not
release-complete features. Continue childhood depth and missing education paths,
then the broader catalogue, pets/hobbies/entertainment, achievements/challenges/
heirlooms, autonomous NPC depth, remaining art, accessibility, country-rule source
verification, balance, performance, multi-generation sweeps and native release gates.
At least **180 more distinct reviewed stories** are still needed after the
content-three expansion; system offers/reports are not substitutes.

Unintegrated pet source and generated art, previously outside the active checkout,
are preserved in [planning/deferred-work](planning/deferred-work/README.md).
Do not lose them or copy their older schema directly into the current application.
The original detailed callback plan is also preserved there; this handoff takes
precedence over its stale implementation-status paragraphs.
