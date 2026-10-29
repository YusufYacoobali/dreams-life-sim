# Voluntary secondary-school withdrawal

This adds the previously absent dropout action required by Scenario B in the
[master specification](planning/source-specification.md) and the education
section of the [simulation blueprint](planning/simulation-and-persistence.md).
It does not establish a complete new criminal-life or native acceptance journey.

The country packs remain simplified authored game models. A separate voluntary
leaving minimum does not change normal `schoolEnd`, school attendance, fees,
qualification requirements, job/crime ages or any other country values.

| Game country | Minimum leaving age |
| --- | ---: |
| US, CA, GB, FR, DE, ES, IT | 16 |
| AU, BR | 17 |
| IN | 14 |
| JP, ZA | 15 |

These values describe game school rules, not comprehensive national or regional
law. The saved record identifies rule version 1 and its actual country minimum;
the frozen V1 table remains available for validating that history if a future
authored model uses a different rule version.

School offers an explicit confirmation for eligible secondary students. The
command binds the actual community ID, school, country and city. Primary school,
being below the minimum, custody, active pursuit and the existing physical
school-routine restrictions remain blocked. A pending decision/result must finish
first. Browsing, cancellation and unavailable/no-op attempts save nothing.

Confirmation closes the original school community with `endReason: withdrawn`
and records its actual date, age, rule/minimum, study and attendance months,
grades, effort and last extra-study year in typed `schoolWithdrawals[]`. It sets
the current education stage to `none` and stops future public-school attendance,
club practice and automatic re-enrolment. Existing reports, help records, study
history, known classmates/teachers, skills, qualifications, debt, balances and
RNG remain. No diploma, job, offence, money, achievement or successful later life
is awarded by leaving school. Existing uncompleted class-project plans cancel
through the ordinary school-context cancellation path; their actual origin and
participants remain in history.

The School history card opens the original community's classmates and teachers;
they are labelled former contacts and keep their actual person IDs. The Education
screen links to the current School review and describes the authored minimum.
The review is bound to the current life/person/community/location, resets when
that context changes and preserves a failed same-context confirmation for retry.
Busy confirmation/cancel controls prevent duplicate submissions. One accessible
save error is shown while the review stays open; cancellation retains the error
on the page. Success closes only after the atomic save succeeds.

The existing adult recovery route is unchanged: its age/availability gates still
apply, and secondary completion requires 24 actual attended months and the target
grade. Withdrawal itself cannot count as a school completion or recovery credit.
The original incomplete school record remains even after a later qualification.
An explicit withdrawal also stops the inferred under-school-end student hours
limit. Actual later full-time study still has the 16-hour student limit; evening
recovery remains compatible with work. Ordinary job,
minor/adult and qualification gates remain unchanged. Applying still requires the
existing interview and never grants employment or wages from withdrawal alone.

This is folded into the already coordinated World33→34 migration at
World34 / engine35 / reader14. Old lives receive only an empty withdrawal history;
new lives start empty, without automatic withdrawal, other outcome changes or
extra random draws. Existing database rows, bound scenes/results, receipts,
backups and moments retain their original raw bytes until an ordinary save.
No additional version bump or original fixture rewrite is introduced.

The genuine AU World33 canonical proof retains its original SHA256. Only the new
empty withdrawal field is removed and the two root version tags are restored to
compare against that historical hash. Current focused work is on content9;
coordinated content10 integration must additionally restore content9 for that
same immutable comparison, without replacing any original producer or hash.

Focused acceptance covers all twelve minimum-age boundaries, primary/custody/
pending/stale-context refusals, unchanged state/RNG and later recovery, project
callback cancellation, contradictory saved records, actual on-disk SQLite
rollback/retry/warm-zero-unpack/closed-connection cold resume and acknowledgement
once, historical contacts and selected-life context reset. These are declared
unit fixtures plus genuine archived historical payload checks, not a claim of
a native dropout journey or a completed replacement Scenario B sweep.

Saved-record checks bind the withdrawal to its closed actual school, the frozen
country minimum and the person's lifetime. School/community linking uses a map
and sets rather than rescanning histories for each withdrawal.
