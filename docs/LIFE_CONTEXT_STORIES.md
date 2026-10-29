# Situations connected to the current life

Content eight adds 125 distinct situations and 375 choices, bringing the source
catalogue to the minimum of 250. Interviews, reports, ordinary acknowledgements
and generated offers remain outside that count. Editorial review, overall
coverage, balance and release acceptance remain open.

| Primary subject | New situations |
| --- | ---: |
| Ordinary adult/community life | 25 |
| Actual children: baby / young / teenage / adult | 3 / 7 / 5 / 5 |
| A current household home | 6 |
| Wellbeing, including five diagnosed long-term active-condition scenes | 15 |
| Active special careers | 9 |
| Actual household pets | 10 |
| Recent attended hobby practice | 10 |
| Memories of completed trips | 10 |
| Later life from age 55 | 10 |
| Existing ordinary-workplace contacts | 10 |
| **Total** | **125** |

All new scenes require the player to be locally available. Travel, hospital,
custody, wanted status, service absence and death exclude them. Selection reads
existing records once for the annual choice; it creates no people, experiences,
purchases or random draws. Existing selection and five-year cooldown rules stay
in use. Older templates keep their existing predicates.

Child scenes use an actual parent or guardian relationship, correct age group
and local availability. Minor children must live in the same household; adult
children can live separately in the same city. The selected child's full name,
person ID and relationship ID bind before display. Choices can change that actual
bounded relationship without awarding the child qualifications or inventing a
school result.

Home scenes require a current local household property with a resident owner.
Pet scenes require an active local household pet and an available responsible
owner. Species-specific scenes cannot substitute a different animal. Their
choices change the selected pet's actual bounded bond with the player, including
a child who lives with the responsible adult. Effect rows show the actual gain
or loss. They do not award care months, food, veterinary treatment, health or
payments. Ordinary funded care, illness and recovery continue through the
existing monthly systems.

Hobby scenes require a current local plan and actual attended practice in the
last twelve months. Enrolment alone, a stopped plan or old practice is
insufficient. Eight scenes refer to their specific hobby and two work across
hobbies. The reflective moments do not create practice records, proficiency,
equipment or a second payment. Travel memories require a completed trip in which
the player was an actual participant. The saved destination supplies the text;
active, early-returned and declined trips do not count as completed journeys.

Five wellbeing scenes require a diagnosed, active chronic condition recorded
for at least twelve months. They cover questions, unsolicited claims, pacing,
privacy and comparison. Choices affect the player's ordinary bounded stats;
they do not diagnose, cure, replace treatment or create a consultation. The
other ten wellbeing scenes do not assume a diagnosis.

Nine special-career scenes require a current active contract, studio or public
royal membership. Former careers cannot fill the slot. Ordinary-work scenes use
the current actual team; they do not generate colleagues or grant performance,
service or wages. The salary conversation binds the contract's exact gross pay
and currency. Choices use existing stats and named relationships.

Names are inserted once using a replacement callback. Dollar patterns such as
`$&` and literal text such as `{pet}` in a valid name are not reinterpreted as
replacement syntax or another placeholder. The focused regression reproduced
the previous defect before the fix. Stored choices remain verbatim; future
bindings use the correction.

World 30 / engine 31 / content 8 / reader 10 / checkpoint v4. Old worlds change
only version tags. No people, contracts, finances, RNG, bound scenes or original
historical payloads are rewritten merely by opening the reader. Reader 10
protects the new `pet-bond` effect from older apps; the checkpoint codec and its
bounds are unchanged. Additional file/history features remain parked under the
user's instruction.

All 375 new choices have connected engine/result/journal/codec/acknowledgement
checks. Twelve country fixtures verify actual context binding without writes or
draws. Three SQLite/UI flows cover a child's pet bond, a negative pet response
and an actual-child scene through rollback, warm retry, cold result and single
acknowledgement. The final full-regression, natural-journey, export and actual
Android scope is recorded with the completed milestone in PROGRESS.md.

The previous Android interview is also pinned without regeneration in
`tests/fixtures/v30-native-interview-checkpoints.json`: 190,494 bytes, SHA256
`2014c9e936f325bce82aef47633f1c7697d22cc421c1a8edebaae09db477a6d3`.
Its producer is pushed `2f8ad13`, engine 30/content 7/reader 9/v4. Exact raw
unanswered-92 and hired-93 payloads retain their bound choices and complete
hiring outcome through the current tags, SQLite failure/retry and cold resume.
This is a regression fixture, not new player file-feature work. Never regenerate it.

The first whole regression found two older assumptions about unchanged annual
story sequences. The reading-consent score is now89 after actual new story
choices (the saved roll remains47). The owner-loss UI test now starts at an
immutable old-producer seed707 Italy checkpoint, age11/revision38, immediately
before the original natural owner death. Its actual next Age Up still produces
the shelter outcome on the current engine, covering atomic failure, retry, cold
resume and no second fee. This avoids making the branch test depend on future
catalogue selection. The37,124-byte fixture is SHA256
`8a20bb94a0cfd128b8ecf10fa3fcdf2427638218ce0dca9a53a4504489c8a55b`;
producer2f8ad13, engine30/content7. It is pure-engine preparation, not native or
a new current-content lifetime. Never regenerate either pinned fixture. Full
provenance is in verification/life-context-immutable-fixtures-20261020.json.
