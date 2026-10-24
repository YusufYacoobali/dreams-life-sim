# Audience criticism cooldown

This workstream starts from `3c797e2` and changes prospective publication only.
Existing controversies, post records, annual archives and pending responses are
retained verbatim. No save fields or schemas are added.

The latest controversy with both a source account and source post starts the
owner's seven-calendar-year cooldown. The source account can be closed or its
post archived. A 2030 incident blocks further audience criticism through 2036;
2037 is eligible again. A different playable person's history is separate.

Only the first actual publication in an eligible calendar year gets a chance,
across all of the person's accounts. Recent and archived posts in deleted
accounts count too. Existing current-year publications therefore also prevent a
new chance after updating or reloading the app. This deliberately avoids turning
weekly scheduling or switching platforms into hundreds of annual rerolls.

The existing response draw gives an 8% chance for ordinary posts and 25% for
provocative posts, halved by existing moderation. There is no extra RNG draw.
Cooldown and annual eligibility are checked before response classification,
comments, followers, image, relationship trust, strikes and suspension change.
Ordinary publishing costs, energy and intent-related stress continue normally.
When criticism is prevented, its two impact/response draws are also absent; this
is the intended consequence of changing whether the incident exists, rather
than drawing a hidden incident and suppressing its popup.

Focused checks cover manual and automatic publishing, exact annual probability
thresholds and RNG consumption, multiple platforms, deleted/archived histories,
2030/2036/2037 boundaries, unordered incidents, unrelated public incidents,
checkpoint restoration, adult-child succession and no invisible penalties.
Connected SQLite tests retain the old bound wording through rollback, retry and
cold reload, and test a blocked post's real failed save and successful retry.

The former three-new-controversies-in-one-year tests now arrange publication
seven years apart. Their copy-only comparisons, suspension retention and exact
old pending-scene tests remain. Historical fixture payloads are unchanged.

These are automated engine/persistence/UI checks, not native-device measurements
or observations of naturally occurring criticism frequency.
