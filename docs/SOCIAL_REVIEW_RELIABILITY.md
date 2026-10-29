# Social review reliability

Social, collaboration, sponsorship and fame confirmations keep the reviewed
command and terms until saving succeeds. A failed save retains the draft and
shows one accessible error in the modal. Cancelling is local; duplicate review,
confirmation and cancellation actions are guarded during saving. Only the
submitted confirmation reports busy.

The six callers hide their background error only while a review displays it.
Review identity includes the actual life, active person and relevant account
route, without resetting on an ordinary revision. Post, profile and new-profile
forms are also keyed to their actual account or entry route. Moving to another
context clears stale fields and commands; retrying in the same context retains
them. Existing post navigation is unchanged.

The profile editor remains open through review, cancellation and failed saving,
then closes after durable success. Text and production choices are disabled
during a save. Local posting-schedule pickers close immediately and save nothing;
an unchanged posting plan cannot be saved again. A changed plan preserves its
selected schedule after failure and applies the original production command.

The [connected checks](../tests/ui/social-review-save-flow.test.tsx) use an actual
on-disk SQLite database and the original v10 creator snapshot at revision 87.
Its audience, eight prior posts, Fame, recorded earnings, money and random
streams remain untouched. The actual snapshot supports a polished post, profile
edit, public event and posting-plan change without manufacturing funding, fame,
qualifications, time or successful outcomes.

Checks cover the exact rollback of all eight tables/current world, retained
draft and reviewed price, one modal alert, warm retry with zero full checkpoint
unpacks, an exact cold result through a newly opened database/store, and one
acknowledgement without repeating its effect. They also cover local picker and
review cancellation, unchanged-routine no-ops, duplicate submission, busy editing,
Android Back and account-context resets. Navigation is unchanged by reviewing,
cancelling or failed saving.

All twelve affected tests across three suites pass in 14.274 seconds with a
30-second test timeout, including the existing social and creator-studio flows.
Application and test type checks pass. Game, persistence, progression and
immutable fixtures remain byte-identical to base 44d719f. These are
component/SQLite checks; physical timing and native visual acceptance belong to
the primary integration stream.
