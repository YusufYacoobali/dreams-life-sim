# Scholarship review durability

This separate UI slice follows the reviewed admissions lifecycle `97fc770` and
factual study-course history `873e897`. It changes no eligibility, outcomes,
money, admissions, aid activation, tuition, RNG, world schema or save engine.

The original Scholarship screen dismissed application and decline confirmation
immediately after starting dispatch. A failed durable write therefore lost the
review and its selected course/subject. The bounded fix stores the exact
reviewed command and presentation, waits for a successful durable dispatch
before closing, and presents one error in the retained modal. A synchronous
submission guard prevents a second callback or cancellation during the write.
Course, subject and navigation controls are guarded during saving; only the
pressed confirmation shows saving feedback. Local previews and cancellation
remain immediate and never dispatch.

Life, active person and actual country/city key the form. Ordinary same-context
revisions preserve it. A genuine identity/residence change remounts the form;
an old unmounted confirmation cannot submit its command. The engine continues
to recheck real current award/course eligibility and offer identity. No offer
is activated before actual enrolment and no tuition is paid by applying or
declining. Trade/professional selection and existing graduate subject behavior
are preserved. The already-selected local course/subject is labelled disabled.

The new connected tests import the unchanged v24 archive and its real pupil
checkpoint, then use ordinary annual commands to reach the actual 2018 passing
secondary completion. They use a file-backed SQLite database and retain the
independent original v30 archive. There is no world, grade, cash, date or RNG
setup. The first actual Academic application offers the same saved roll51.

Application and decline each exercise held save/duplicate/Back/cancel guards,
receipt-insertion failure, complete eight-table and whole-world rollback,
retained exact review and single alert, retry with zero warm full unpack,
exact previous-current backup bytes, a closed connection and new connection
cold reopen, and one result acknowledgement. Accounts, debt and ledger remain
unchanged; there is no course, payment or active aid period. Original saved
lives, backups, historical payloads, metadata, receipts and branch records
remain exact. Another connected case checks read-only local choices, a real
same-context meditation/acknowledgement, then selecting the original life with
the same person ID and rejecting the old form callback.

The original-handler filtered baseline actually closed exit1 in8.536seconds
(`/tmp/dreams-scholarship-durable-baseline.out`): after the failed receipt write,
the reviewed title was absent. The corrected source passed both affected UI
suites, three tests in21.731seconds, actual exit0
(`/tmp/dreams-scholarship-durable-focused-first.out`). This includes the existing
genuine award/enrolment/tuition-renewal journey; its application failure now
retries the retained confirmation directly.

Strict app and all-test types both actually closed exit0
(`/tmp/dreams-scholarship-durable-types-final.out`), and `git diff --check` passes.
This does not claim new
natural-life, national-policy, native, broad regression or frozen C36 integration
acceptance.
