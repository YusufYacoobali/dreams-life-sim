# Continue Dreams: Life Simulator in a new cloud chat

This handoff was requested on 19 October 2026. All application changes, tests,
the genuine migration fixture and deferred source/art drafts are committed
to the **same `work` branch**. Fetch `origin/work`; do not start from `main` or
the older `checkpoint/early-school-callbacks-20261019-1346` branch.

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

The current source moves to **world 23 / engine 22 / content 2** and adds
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
qualification. The source catalogue is now **50 situations**; callback/result
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

Remaining callback acceptance work must be checked explicitly: real travel and
custody, permanent relocation, teacher departure/replacement, parent household
change/death, player death and actual existing-child legacy, multiple callbacks
with medical/legal priorities at month 12, and grade/bond caps. The implementation
must be reviewed against these cases; earlier tests for unrelated systems do not
establish these new connections. Keep the 120/1,000-life performance gate open.
The current default twelve-life engine sweep alone takes several minutes. The
soak wrapper requests 120 lives while the suite currently has a fixed 900,000 ms
timeout; scale and measure the harness before claiming larger sweeps completed.

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
At least **200 more distinct reviewed stories** are still needed after the new
project situation; system offers/reports are not substitutes.

Unintegrated pet source and generated art, previously outside the active checkout,
are preserved in [planning/deferred-work](planning/deferred-work/README.md).
Do not lose them or copy their older schema directly into the current application.
The original detailed callback plan is also preserved there; this handoff takes
precedence over its stale implementation-status paragraphs.
