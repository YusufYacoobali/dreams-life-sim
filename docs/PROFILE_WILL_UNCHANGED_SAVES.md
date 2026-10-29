# Unchanged social identity and will saves

The social profile reference in `design/12-social-media-fame-business-hobbies.png`
and the dedicated `design/write will.png` expose actual editable identities and
estate instructions. Reconfirming the retained values should not add a result,
receipt, journal entry or automatic save. This follows the user's smooth-button
priority and the existing unchanged posting, work and study routine behavior.

`app/(game)/social-profile/[id].tsx` compares the handle and biography after the
same trimming used by the command schema. An unchanged profile has a visible
reason and disabled review button. Handle case changes and either field changing
independently remain real edits. Local draft text stays exact after cancelling a
review or a failed save; the submitted command uses its actual trimmed values.
The existing durable review, identity reset, eligibility and posting flow stay in
place.

`app/(game)/will.tsx` compares only actual executor, basis-point shares and
asset-to-beneficiary bequests. It compares sorted copies, without modifying the
saved arrays, so decimal formatting and share/bequest ordering do not create a
change. No assignment uses the existing empty-bequest default; saved person/date
metadata is not a user instruction. Each actual instruction remains in the
comparison. A missing saved will still permits the first valid save, including
when its allocation matches the default legal shares. Invalid totals retain the
existing validation instead of being treated as an unchanged valid will.

The will editor resets only on actual life/person identity. Local inputs and
pickers freeze during saving; only the pressed save/revoke button shows progress.
Duplicate submission, cancellation and Back cannot replace a submitted draft.
One accessible alert reports a failed save while every draft field remains
available to retry. Engine estate obligations, ownership, eligibility, fees,
currencies and automatic persistence behavior are unchanged.

## Focused evidence

`tests/ui/profile-will-save-flow.test.tsx` adds ten connected cases using real
on-disk SQLite and the actual routes, engine, repository and store. The social
baseline is the original active snapshot in the genuine v10 creator archive.
The will baseline is the genuine v6 retained family, with two ordinary paid asset
purchases and an ordinary saved will where needed. These retained fixtures have
their original financial/background setup; they are not a new natural birth-to-
death claim. No people, outcomes, funds, stats, ages, dates or random streams are
overridden, and no fixture bytes are edited.

The cases cover trimmed-current profile values, case/biography changes,
cancellation, unchanged decimal percentages, actual share/bequest reordering,
first valid no-bequest will, invalid totals, and executor/allocation/bequest/
bequest-removal changes independently. Actual receipt failure rolls back all
eight tables; the same raw draft retries warm with zero checkpoint unpack.
Held saves reject duplicate/other mutation presses and show only the pressed
button busy. Closing and reopening a new SQLite connection/repository/store
retains the complete projected world, actual result and one acknowledgement.
Switching to another retained life drops the old will draft. An unrelated genuine
v7 archive's lives, backups and historical snapshot payloads remain exact.

All **20 tests / three affected suites** pass in **16.986 seconds**: the ten new
cases, nine existing social review/save cases and the existing will editor case.
Raw output: `/tmp/dreams-profile-will-focused-tests.out`.
After adding the held-save Back assertion, the same ten new cases pass again
in **5.388 seconds**; this overlaps the twenty-test result rather than adding ten
distinct cases. Raw output: `/tmp/dreams-profile-will-final-tests.out`.
Affected strict TypeScript checks pass (exit zero, empty output) using
`/tmp/dreams-profile-will-tsconfig.json` and
`/tmp/dreams-profile-will-types.out`.

These component/SQLite checks establish no native, physical-device, all-family,
full-life, global regression or release acceptance. The coordinator owns those
combined gates and integration. Core/model/persistence/version data is untouched.
