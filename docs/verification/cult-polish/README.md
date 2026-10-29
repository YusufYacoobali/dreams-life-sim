# Cult Leader gameplay polish — 23 October 2026

This focused pass extends the Cult Leader implementation at `9101307c` on
`work` and integrates the later event-writing and asset-cleanup source at
`5a5902f`, plus the subsequent welcome and final editorial source at `aab4f88`. The career,
artwork and two management routes are retained. See the
[feature guide](../../CULT_LEADER.md) and the
[original implementation report](../cult-career/README.md).

## What changed

- Inner-circle vacancies can be filled from real known local adult contacts.
  The limit is five active members, rather than five lifetime identities.
  Former members retain their NPC identity, memories and delayed consequences.
  Rejoining requires repaired trust. Two paid invitations are available each
  year; the command never creates replacement NPCs.
- Unchanged responsibility assignments are rejected before action counters or
  loyalty rewards. Multiple advisers can share their role without another
  adviser being treated as displaced.
- Recruitment methods, sermons and all six ceremonies have distinct outcomes.
  Beliefs, reputation, heat, preparation and available members affect results.
  Sixteen activity incidents offer 48 immediate choices during normal actions;
  they are not added to the quarterly random-story pool. Existing scene limits
  still apply, and absent members cannot provide attendance bonuses.
- New failed-claim offers have 18 individual practical remedies, including real
  refunds, witness payments, a one-time auction and belief changes. Admissions
  and settlements also vary by claim. Saved legacy offers retain their original
  choices and exact outcomes. Quiet claims still need a public double-down or
  high heat to surface a decision.
- Twelve further dramatic stories add public challenges, safety expenses,
  departures, rival consequences and financial investigations. There are now
  56 authored situations with 168 choices: 28 original, 12 dramatic and 16 tied
  to activities.
- The dashboard is denser, belief lists have name/description search, current
  selections stay visible, and former members have a separate history popup.
  No additional navigation level, runtime package or artwork was introduced.

## Saves and focused verification

Current markers are **World 48 / engine 50 / content 27 / SQLite reader 28 /
database v4**. Published World 46 and integrated World 47 saves upgrade without
rewriting cult people, offers, threads, random state or financial history.
Reader 13–27 upgrades remain metadata-only.

The genuine pre-polish fixture was captured by the original `9101307c` engine,
including an expelled treasurer, scheduled rival return, resolved accusation,
failed claim, active witnesses, interrupted annual cursor and communal accounts.
Legacy admission/postponement/blame produce the exact original full-world
fingerprints after migration. Existing fixture bytes and historical hashes are
unchanged. A second fixture comes from the published integrated `5a5902f`
engine and proves World 47 cult and immediate-writing payloads also upgrade
without rebinding words or quotes.

Focused checks exercise vacancy replacement across 12 years, former-member
rejoining, simultaneous organisations, shared advisers, all activity methods and
ceremonies, all 18 remedies, actual prosecution and duplicate prevention. Three
six-year US/GB/JP journeys use real engine commands and cold reload every
pending choice/result, checking deterministic resolution, immutable inputs,
account reconciliation and retained former identities. Connected UI checks
cover actual SQLite saves, held commits, retries, stale candidates, replacement
reviews, search and unchanged default dialogs.

Game-core runtime is frozen at `d1df219`; final app source is at `753292d`. Final command results are recorded in
[test-summary.json](test-summary.json). Final verified coverage is **308 suites
and 4,460 tests**, across the complete regression and affected reruns. The full
invocation finished with 305/306 suites and 4,398/4,399 tests passing; its sole
failure was an old assertion expecting two recruiter choices. That test was
expanded to cover all eight actual choices, including 12 additional success/
failure cases, and all 18 cases in that file pass. The later welcome-only merge
adds one suite with ten new cases; all ten affected welcome/cinematic/startup
suites pass 47 cases. These overlapping runs are listed separately and are not
summed as duplicate coverage. A later prose-only event update adds 39 passing
cases in one further suite; its three affected workplace cases also pass. The
[AST comparison](editorial-mechanics-check.json) confirms identical IDs, effects,
gates, weights and randomness across all 19 scenes.

The **120-life soak** passes all three shards, completing each seed 0–119 once.
All life results are retained in [soak-results.json](soak-results.json). Strict
app/test types, the 493-module import graph, notices check and both production
exports pass. Game mechanics did not change during the full regression
or soak. Later presentation and prose changes have their affected checks and
new exports; this report does not claim another complete regression at that
later source.

## Browser layout evidence

The 44 PNG files show 22 production React Native component panels at their top
and final actions. Where an earlier screen exists, it appears alongside the
original `9101307c` tree. The archives contain 38 before/after trees. Light mode
uses 390×844; dark mode uses 320×844 with 1.4× text. The CSS/SVG adapter reproduces
native Modal portals and Yoga's intrinsic text height. These are browser
captures, not Android/iOS screenshots.

All 466 rendered images decode, no phone overflows horizontally, the final
actions remain reachable, no browser error occurs and no external image request
is made. See [browser-checks.json](browser-checks.json). Examples:

- [Dashboard before/after](cult-dashboard-light.png)
- [Belief search with large text](cult-belief-search-dark-large.png)
- [Vacancy candidates](cult-vacancy-light.png)
- [Invitation review](cult-replacement-review-dark-large.png)

Reproduce trees with `DREAMS_CULT_REVIEW_TREES=/tmp/dreams-cult-review-trees
npx jest --runInBand tests/ui/cult-flow.test.tsx`. The review tools accept
`DREAMS_CULT_REVIEW_BEFORE`, `DREAMS_CULT_REVIEW_TREES`,
`DREAMS_CULT_REVIEW_HTML` and `DREAMS_CULT_REVIEW_DIR` to keep this evidence
separate from the original implementation. Playwright and Chromium are external
review tooling, not app dependencies.

## Production boundary

The export verifier compares all 25 changed runtime source files (18 for cult
polish, two for welcome and five editorial content modules) against both platform source maps, checks the
Hermes headers and confirms all 12 original
cult illustrations match their asset hashes. Source hashes are in
[runtime-source-hashes.json](runtime-source-hashes.json), and final bundle
results are in [platform-checks.json](platform-checks.json).

No Android/iOS simulator, installed release or physical phone was available in
this environment. Export, component and browser results do not establish native
touch behavior, rendering or frame rate. Device validation remains outstanding.
