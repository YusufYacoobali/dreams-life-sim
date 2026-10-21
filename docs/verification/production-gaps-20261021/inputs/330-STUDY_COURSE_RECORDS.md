# Factual course records

This separate slice follows approved admissions `97fc770d7d4191545f37357f4e4ac37e13d16b4d`.
It records real new course starts and actual later study/withdrawal/completion,
without reconstructing the admissions, costs or dates of old saved courses.
It changes no qualification rules, study outcomes, tuition, funding, receipts,
random draws or save commands. Read-only Education history shows missing facts
as unrecorded. Root owns the required future `studyCourses` migration array;
the isolated branch default is temporary and must be replaced centrally with
an empty array only when migrating World <=35.

`origin: enrolment` records a command that actually starts a course, its true
date, provider location/native currency and first tuition/loan/aid references.
Ordinary study updates actual attended months and tuition-coverage counts.
Actual withdrawal, completion/failure or death closes that record. Existing
qualifications remain in their original source; a record awards nothing.

`origin: legacy-current` appears only when an existing ongoing course actually
ends or completes now. Its known program, current terms, months and actual end
date are retained. Past start date, provider location/currency and first-payment
references stay null. Existing ledger rows and student debt remain untouched.

`origin: legacy-incomplete` is an observation made when a real new course would
overwrite an already-incomplete old slot. It retains the observed field/school,
months, required months, coverage, grade and terms. Its earlier program/start/
end/currency/payments stay unknown. The observation date is not an invented
withdrawal date. Slots with months >= required months are not relabelled as
dropouts: they can represent completed or finished-but-failed study.

Tuition-paid months are recorded coverage, not a reconstructed paid money total.
Only real new first-payment references establish an amount. Validation binds
known dates to the actual person's life, active records to the actual course,
new admission/aid records to their real first period, and positive billed
tuition/borrowing to the actual ledger. A legacy observation cannot acquire
invented earlier payments, dates or provider currency.

## Separately captured legacy boundary

The new `v35-legacy-incomplete-course.json` is a genuine two-command producer,
not a new natural dropout simulation. Its unchanged input is the existing v24
university archive. Exact detached old source is
`6f4b34c40005f5fba8eeee540bada9e0787ccbb0`; every tracked `src`/package/input blob
is checked against its captured Git tree manifest before and after execution.
The old production engine executes only `leave-school`, then acknowledgement
of its actual result. Dates, stats, qualifications, money and RNG are unedited.

- Input SHA256: `ac41f013cbda20115f32456ca88373411ee66bf4d6653dc6b30e8e8e5d5503a6`.
- Old game SHA256: `24a5a40521b31fa94eca4c4d161bbbd74e24c460a08bc675afcd340e392e7ba5`.
- Old game/persistence SHA256: `34cc89201f1da71c8c118c09a78025c94161e69afae15ed5354cd413fdeca7e1`.
- Before canonical SHA256: `2b8a9243bed88afe2e0850b395888623c80b62f5cf3b281fcfdec0d50a311e40`.
- After canonical SHA256: `8b76dbcfc76cff4d7799d089229fe45a3f88d8443cbfc043206fd5908478841d`.
- New fixture: 243132 bytes, SHA256 `39bc3670249bcd3ae29c66d0bee6cd80e71ab72977207494559299e0f9e1d7c1`.

The fixture stores both source manifests, actual commands, input/tool hashes and
production checkpoints. `tests/support/capture-legacy-incomplete-course.cjs`
documents the explicit producer; it is not executed by tests. Actual producer
closure is exit0 in `/tmp/dreams-university-legacy-capture.out`.
All original archives remain byte-for-byte unchanged.

## Focused acceptance boundary

Authored checks use the actual v24 ongoing course, the original archived pupil
with a new real enrolment, the separately produced old incomplete slot, and the
genuine completed v3 course as a negative control. File-SQLite UI cases check
all-eight-table failed-commit rollback, retained exact review, retry with zero
warm full unpack, original archive payloads, exact backup bytes and closed-
connection cold history. New course withdrawal keeps its actual first bill and
existing debt; old course withdrawal records unknown history honestly; a real
new trade course observes the old incomplete slot before overwriting it.
Ordinary old-course continuation verifies real completion, qualification and
four actual tuition periods without backfilling an admission or old first bill.

The first seven-file focused run closed exit1: 103 passed and four failed out
of107 in90.098 seconds (`/tmp/dreams-study-course-focused-first.out`). Three
failures compared object identity for unchanged legacy dialogs that recreate
identical presentations; the helper now checks all review values and always
releases a held write in cleanup. The fourth exposed a stale recorded grade
when insufficient tuition paused attendance. Synchronising the factual snapshot
before monthly early returns fixes that edge without changing attendance,
tuition, aid or RNG.

The final affected history/domain, scholarship-domain and connected admissions
UI run passed54tests/3suites in44.405seconds, actual exit0
(`/tmp/dreams-study-course-focused-final.out`). The earlier other focused
education/finance/admissions/scholarship UI cases passed in the seven-file run.
Strict app and all-test types both closed exit0
(`/tmp/dreams-study-course-types-final.out`); `git diff --check` passes. No broad/native,
full-life, country-policy or frozen C36 integration acceptance is claimed here.
