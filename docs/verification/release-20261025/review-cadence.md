# Review cadence and durable offers

The previous tracker required a fresh completed-year candidate at exactly the
current life revision and rejected whole years for poor wellbeing, health/legal
conditions, any NPC death or an adverse choice. An ordinary life could therefore
miss every opportunity. A claimed offer also advanced the schedule before its
answer, while cold startup discarded the in-memory offer and could not reclaim
it. Existing older lives without a candidate could never prompt immediately.

Review cadence now depends on committed annual completions and current UI
readiness. A living, birth-acknowledged character aged five or older can receive
an overdue prompt when Life has no annual/pending/deferred flow or active
mini-game. Health, sentiment, story history and stale candidate revisions do not
starve the schedule. The host retains its route, foreground and modal guards.

The first eligible Life opening can offer even when an older save has no app
review metadata. Actual age-ups remain app-wide and transactional with their
life save and receipt; imports, God Mode, births, other commands, duplicate
receipts, monthly pauses and result acknowledgements add no completed years.
Sure schedules 10–20 completed age-ups, clamped to that interval; Maybe later
uses ten. No game RNG is consumed.

The invitation now uses the existing single red-heart illustration and eight
rotating body messages. The durable `offerSequence` selects the copy, so a new
offer changes it while an unanswered offer, retry or cold reopening keeps the
same wording. The message bank wraps after eight. This is presentation only:
no new saved fields, scheduling changes, assets or randomness are introduced.
The integrated SQLite UI test checks rotation, wraparound and identical life
exports; the existing light/dark UI cases verify decorative heart artwork and
stable wording after a failed answer save.

Unanswered persisted offers resume using the same offer ID/sequence and fresh
active life/person/revision rather than disappearing on restart. Answered
records remain idempotent. The v1 app-review preference remains readable; its
legacy candidate/observation fields clear lazily on subsequent review-related
commits. No world schema, database tables, historical fixture or game payload
changes. Bootstrap still performs no review metadata write.

Coverage is authored in `tests/reviews/tracker.test.ts` and
`tests/persistence/reviews.test.ts`: first age-five eligibility, actual five
SQLite-backed Age Ups, old age-25 save without metadata, low-wellbeing repeat
boundaries at ten and twenty, cold unanswered offers, stale claim rejection,
atomic save-failure rollback, receipt replay, global cross-life counts, plain
settings persistence and unchanged world payload bytes. Root coordinates all
runners; this note does not claim execution on a native device or a displayed
Google Play sheet.
