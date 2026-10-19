# Continue Dreams: Life Simulator in a new cloud chat

This handoff was requested on 19 October 2026. All application changes, tests,
the genuine migration fixture and deferred source/art drafts are committed
to the **same `work` branch**. Fetch `origin/work`; do not start from `main` or
the older `checkpoint/early-school-callbacks-20261019-1346` branch.

The active continuation is now **world 25 / engine 24 / content 4 / database
4**, with **90 distinct situations**. [Early home/classroom stories](EARLY_HOME_STORIES.md)
adds twenty scenes, five independent first-year alternatives in total, explicit
remote-parent contexts and actual physical-household availability. Missing
household IDs do not count as co-residence. The completed content-three 120-life
sweep below is historical; no expanded content-four result is claimed. All **1,038 tests / 68 suites** pass in **714.295 seconds**, with strict
source/test typing, fresh Android/iOS Hermes exports (5.2/4.9 MB, 46 assets)
and current Metro manifests/source. No expanded content-four sweep is claimed.
[The pet integration notes](planning/drafts/pets-integration.md) record inspected,
unintegrated next work; pets are not implemented by these notes.

[Local display settings](DISPLAY_SETTINGS.md) now persist Light/Dark/Use Device
Appearance independently of all lives. Writes publish only after SQLite succeeds;
failed/corrupt/future preferences have retry/explicit reset without rewriting life
archives. Shared pages set theme-aware status-bar props. All **107 UI/state/
persistence checks / 36 suites** pass in **100.108 seconds**, plus the final six
opening/navigation checks, strict typing, fresh Hermes exports (46 assets) and
current Metro manifests/source. Expo config introspection confirms Android/iOS
automatic support with SDK-aligned `expo-system-ui` 57.0.4. No native rendering or
standalone build pass is claimed. The complete 983-test regression below predates
this display follow-up; the 1,038-test content-four result above includes it.

The basic creation form now keeps optional family background/preferences under
More Options, with a visible summary for a selected royal family. All fourteen
relevant component checks pass, including opening the optional controls, country
eligibility and the actual royal birth/save-failure/retry/cold path. Strict typing,
fresh Android/iOS Hermes exports and current Metro source pass. Game source is
unchanged from the verified scholarship milestone. Native layout remains open.

Creation, appearance and newborn pages now reserve the bottom safe area, keeping
their final controls above the home indicator/navigation region. Strict source/
test typing, eleven relevant component checks and fresh Android/iOS Hermes
exports pass. This is a layout correction, not native visual acceptance.
[The Android 29 attempt](NATIVE_OPENING.md) booted at 390×844 logical pixels but
reproduced a System UI ANR before Expo Go launched; installation/Metro connection
did not yield usable gameplay. Its actual OS-failure screenshot/logs are retained.
The isolated software emulator is stopped. Native opening gates remain open.

The prior scholarship milestone uses **world 25 / engine 24 / content 3 /
database 4**, adding two [restricted tuition scholarships](SCHOLARSHIPS.md).
They use saved applications, separate admission, explicit acceptance and actual
tuition waivers rather than cash grants. Renewal records grades/resources and
reconciles the remaining bill and loan to the ledger. All 44 new domain checks
and the real SQLite application/enrolment/renewal rollback-retry/cold journey
pass. The complete **983-test / 64-suite** regression passes in **743.271
seconds**, with strict typing, fresh Android/iOS Hermes exports (46 assets) and
current Metro manifests/source bundles. The separate pure-engine sweep passes
**120/120 lives**, all twelve countries, in **1,994.655 seconds**, exit zero. Its
[per-seed record](verification/life-sweep-v25-120-20261019.json) retains the
first-available-choice scope and overlapping-seed limits. The unchanged
world-25 game hash is
`4875659620673b3e9a2e4c99b8777058d714e7237fcc6a1e95d7b47d8bfbb3c8`.
Game source stayed unchanged from startup through the final summary. The
1,000-seed/person, all-choice, 120-year and multi-generation gates remain open. The twenty early-life drafts were subsequently integrated by content four above.

The previous milestone adds **actual school outcomes and evening recovery**;
see [EDUCATION_RECOVERY.md](EDUCATION_RECOVERY.md). That milestone used **world
24 / engine 23 / content 3 / database 4**. At the configured school-completion
age, 50% grades and twelve recorded study months are required. Failure grants
no qualification. Two no-fee evening paths fit around work: 24 attended months
for a missing secondary qualification, or twelve for entry-grade improvement.
Attendance pauses for actual absence, hospital care, custody/pursuit and service
assignments. Actual prison study can qualify through its separate route without
inventing evening credits. Withdrawal, failure, relocation, death and legacy
retain the original records. Country ages and the authored-country status are
unchanged; detailed national stages and scholarships remain open.

The genuine pre-change archive in
`tests/fixtures/v23-low-grade-school-archive.json` was generated at `55fee6b`
through eighteen actual years and real SQLite commands. It retains the old
0%-grade diploma and two earlier moments. Migration adds empty new histories
without changing people, earned qualifications, bound choices, money or RNG.
Continuing its unfinished seventeenth-year checkpoint applies the new rules only
to future school completion. Never regenerate this archive with newer source.

The clean final regression passes **938 tests / 62 suites** in **697.17 seconds**,
including twelve complete seeded lives, all genuine migrations, format-only Intl
startup and the new connected SQLite/UI journey. That journey branches the real
archive, fails/retries evening enrolment and the final awarding command, then
resumes the same course/results cold without duplicate qualifications. Strict
source/test typing, fresh Android/iOS Hermes exports (5.1/4.8 MB, **46 assets**)
and current Metro manifests/source bundles also pass. Two royal UI checks now
share one actually simulated childhood, decode independent worlds and have
explicit cold-history budgets; the older test that skipped eleven study months
now attends them. Native visual, performance and release gates remain open.

Five original school-art subjects are integrated into study, reports, saved arcade/
project plans and evening classes. The six-subject unmodified atlas is source/
browser reviewed at 48/128px on light/dark cards; its trip subject is reserved for
later content, not a new trip mechanic. [The gallery](verification/school-art-20261019.png)
is browser evidence, not a native screen comparison. The story catalogue remains
**70 distinct situations**. The listed callback acceptance cases were completed
before this milestone; see [CALLBACK_ACCEPTANCE.md](CALLBACK_ACCEPTANCE.md).

A fresh world-24 direct Node sweep passes **120/120 lives** (seeds 0–119) in
**2,040.171 seconds**, covering all twelve countries. Its game-source hash
`7680a530c54ea2a17e457f860db3a3ce793e993ff300eb2870f9c19103a32946`
is unchanged at completion. [Every seed](verification/life-sweep-v24-120-20261019.json)
is recorded. This is pure-engine cloud evidence, with first available choices;
overlapping earlier/default seeds are not additional distinct lives.
The completed world-23 sweep remains historical evidence: 120 distinct seeds,
all twelve countries, 2,209.809 seconds and 43 matching partial-Jest terminal
comparisons. It does not replace a current-world result. The 1,000-seed,
1,000-person, 120-year and multi-generation release gates remain open.

Database four still writes bounded checkpoint-v1 live/recovery/branch/import
rows and reads old plain rows without an eager rewrite. The current world-24
real SQLite run commits 236 commands and retains all 79 historical moments:
**29,986,816 bytes closed / 36,397,376 bytes peak**. Cold reload preserves the
entire world exactly. [Current measurements](verification/sqlite-history-v24-20261019.json)
are cloud diagnostics, not native latency or 120-year/multi-generation acceptance.
The world-23 real
79-observation workload measured 29.9 MB closed and 36.3 MB peak, compared with
72.4/103.4 MB for plain live/backup rows, with entire worlds/history/receipts
unchanged. This is historical scoped evidence, not a new-world native/storage
acceptance pass. The conservative 120-late-checkpoint projection was 95.7 MB.
See [PERFORMANCE.md](PERFORMANCE.md) and the machine-readable records.

[EDUCATION_SOURCE_AUDIT.md](EDUCATION_SOURCE_AUDIT.md) records partial official
source research. No complete country profile is release verified. Overall and
opening baseline estimates remain unchanged.

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
The world-23 120-seed pure-engine run passed; the new world-24 sweep is in
progress. The 1,000-seed, 120-year, multi-generation and native gates remain open. The current content-three history has 27.3 MB of
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

Persistent school contacts, clubs, conduct, help, reports, grade/credit-based
completion and evening recovery are connected. Scholarships and deeper country/
stage-specific paths remain open.
The broad systems in [PROGRESS.md](PROGRESS.md) are partial implementations, not
release-complete features. Continue childhood depth and missing education paths,
then the broader catalogue, pets/hobbies/entertainment, achievements/challenges/
heirlooms, autonomous NPC depth, remaining art, accessibility, country-rule source
verification, balance, performance, multi-generation sweeps and native release gates.
At least **160 more distinct reviewed stories** are still needed after the
content-four expansion; system offers/reports are not substitutes.

Unintegrated pet source and generated art, previously outside the active checkout,
are preserved in [planning/deferred-work](planning/deferred-work/README.md).
Do not lose them or copy their older schema directly into the current application.
The original detailed callback plan is also preserved there; this handoff takes
precedence over its stale implementation-status paragraphs.
