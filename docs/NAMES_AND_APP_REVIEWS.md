# Character names and native app reviews

## Names

New lives, parents, contacts and children use the same country-aware name data.
The catalogue contains 2,243 entries across the country/gender lists and surname
pools: at least 48 masculine, 48 feminine and 16 neutral suggestions, plus 60
surnames, for each of the twelve countries. Shared names can appear in more than
one pool. Accents and multiword surnames are retained.

New contacts prefer first names not already used by living people in their
city. If that pool is exhausted, they prefer a distinct full name. Selection
reuses the two existing name draws; collision avoidance consumes no additional
randomness and never appends numbers or renames an existing person. Biological
siblings keep the inherited family surname and avoid accidental name duplicates.

Manually entered names remain unrestricted. Loading a save leaves all existing
people, names, bound scenes and history intact. There are no new save fields or
schema changes.

## Review request

The previous adapter disabled native reviews whenever `__DEV__` was true.
Dreams native development builds can now use an available native review API;
Expo Go stays excluded because that application belongs to Expo. Availability is
checked again when the app returns to the foreground.

After **Sure**, the answer is saved first. The native request waits until the
game's own review card has unmounted, no modal remains and two animation frames
have passed. It then rechecks the visible Life screen, foreground state, current
life/person/revision and absence of pending events. A changed context cancels
presentation. A transient claim-save failure can retry on the next foreground
without a render-time retry loop.

The first opportunity still requires age five and a completed, dismissed year.
Ordinary passive stat drift no longer marks an entire year as a negative event.
Explicit negative choices, illness, grief, custody, financial distress and other
existing structured exclusions remain. The saved prompt cadence and **Maybe
later** behaviour are unchanged; no preference reset or external review URL is
used.

Apple and Google decide whether an accepted request actually displays a sheet.
The installed Expo iOS module reports TestFlight as unavailable; Expo Go cannot
request a Dreams review. A native development build can exercise a test sheet,
while live store reviews require the appropriate store distribution. A successful
API request is never recorded as proof that a rating was submitted.

## Verification

- Name checks generate 1,440 NPCs across all twelve countries, verify suitable
  name pools, full-name uniqueness, exact RNG consumption and cold-save stability.
  Parent cohorts, manual player names, biological siblings and a genuine older
  saved scene are covered too.
- The 512-generation birth check retains its original whole-world digest after
  restoring independently captured pre-expansion person, household and dynasty
  names for comparison. Stats, family structure, jobs, finances and RNG remain
  in that proof. The old fixtures and digest are unchanged. Legacy dramatic
  wording remains exact except for a person first created when resolving the
  decision; saved actors keep their names.
- The connected review tests use real SQLite preferences and the production
  store. They cover save failure/retry, modal dismissal, foreground rechecks,
  hidden Life screens, stale callbacks, transient claim failures and native
  availability guards. Native StoreKit/Play calls are mocked; no physical-device
  review sheet is claimed.
- Thirty-six unedited engine childhoods were observed by both the previous and
  current tracker. Both versions found an opportunity in all 36 lives, with
  160 eligible year boundaries and earliest age five. This confirms that the
  ordinary eligibility path already works; it does not establish which build
  condition prevented an individual user's prompt.

The full regression, platform exports and exact source boundaries are recorded
in [verification results](verification/names-and-reviews/verification.json).
The original full-run failures and successful affected-suite reruns are recorded
separately; the original run is not represented as having passed cleanly.
That run covered 318 suites and 5,187 tests, including twelve complete seeded
lives. Four affected suites passed their 150-test rerun after updating assumptions
about generated names.

Before pushing, the incoming Android audio/reminder/settings commit `c9d2d0e`
was merged without conflict. The merged source passed another ten suites and
105 tests covering those changes and the review flow, plus typecheck, import
checks and fresh Android/iOS Hermes exports. The full regression was performed
before that independent merge; the report distinguishes both source boundaries.
See the [per-country pools and natural review opportunities](verification/names-and-reviews/review-opportunities.json).
