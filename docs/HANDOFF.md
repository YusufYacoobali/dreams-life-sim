# Continue Dreams: Life Simulator in a new cloud chat

This handoff was requested on 19 October 2026. All application changes, tests,
the genuine migration fixture and deferred source/art drafts are committed
to the **same `work` branch**. Fetch `origin/work`; do not start from `main` or
the older `checkpoint/early-school-callbacks-20261019-1346` branch.

Continuation on 19 October completed the listed automated callback acceptance
cases; see [the connection-by-connection evidence](CALLBACK_ACCEPTANCE.md).
That callback checkpoint passed **831 tests / 56 suites** in 596.53 seconds,
with strict typing, fresh Android/iOS Hermes exports and current Metro source
requests. This closes those automated cases, not native or release acceptance.
Continue the early-game work and full backlog below; estimates remain unchanged.

The subsequent early-game work adds twenty distinct situations (**70 total**)
and a read-only School Plans section showing original participants, due dates,
permission, conditional costs and recent outcomes. The current content version
is **3** with world 23 / engine 22 unchanged. A genuine content-two SQLite archive
in `tests/fixtures/v23-school-plans-archive.json` preserves the paid outing,
scheduled project and both prior moments. Imports now reject permanently invalid
scheduled contexts while preserving temporary absence. Focused checks and strict
typing pass. The new complete regression passes **878 tests / 58 suites** in
779.349 seconds, with fresh Android/iOS production Hermes exports and both current
Metro source bundles. A separate 120-life sweep is in progress; do not count it
as passed until completion. Native and release gates remain open.

The subsequent persistence check removes checkpoint-decoder allocations without
changing checkpoint-v1, bounds or gameplay state. The complete regression passes
**902 tests / 59 suites** in 687.703 seconds, with strict typing and fresh native
Hermes exports and current Metro source bundles. [PERFORMANCE.md](PERFORMANCE.md) records the scoped benchmark,
10,000 differential cases and a measured direct Node sweep runner. Its twelve
terminal age/people/ledger results match Jest exactly; expanded 120-life runs
remain in progress. [EDUCATION_SOURCE_AUDIT.md](EDUCATION_SOURCE_AUDIT.md) records
a partial official-source review for the next school paths; no rule values changed.

Welcome now scrolls on overflow instead of constraining its title/actions to a
fixed-height column. Strict typing, all four connected startup/onboarding checks,
fresh Android/iOS Hermes exports and both current Metro source bundles pass after
the layout change. Native small-screen/large-text review remains open.

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

## Current callback work — continue this before another feature

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

## Verification at this handoff

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

This is a verified development checkpoint, not completion of callback acceptance
or of the production game. The further cases below remain explicit work.

The originally remaining callback cases now have explicit connected checks:
real travel/custody, permanent relocation, teacher departure/replacement, parent
household change/death, player death and actual existing-child legacy, month-12
medical/legal queues and grade/bond caps. The native-component check also proves
atomic cancellation of two callbacks through SQLite failure/retry/cold resume.
See [CALLBACK_ACCEPTANCE.md](CALLBACK_ACCEPTANCE.md) for fixture scope and limits.
Keep the 120/1,000-life performance gate open. The soak wrapper now accepts an
explicit count and scales its timeout, with per-life progress on expanded runs.
Its one-life diagnostic passes; a 120-life run is in progress and the 1,000-life
gate remains open. The current history
benchmark projects 68.5 MB for 120 repeated late checkpoints, above the planned
50 MB history budget; see [PERFORMANCE.md](PERFORMANCE.md).

## Cloud environment and native limitations

Use the repository's existing checkout, not an extra worktree. Node **24.19** and
npm **11.9** are validated. No application secret, account or backend is required.
Use `npm ci` with the lockfile. Run `npm run typecheck`, targeted tests, then the
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
