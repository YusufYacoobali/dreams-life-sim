# Story editorial and context review

Source review on 20 October 2026, starting from `e41a2db`. The catalogue still
contains 250 annual situations and 750 choices. Interviews, routine confirmations,
club events and monthly reports do not increase those counts. This is a review
of authored copy, effects and binding requirements, not release playtest acceptance.

The review follows [Writing and events](planning/writing-and-events.md): a setup
must fit its actual people and circumstances, and its result must describe the
resolved incident without inventing wages, qualifications, purchases or progress.

| Authored group | Situations | Choices |
| --- | ---: | ---: |
| Original general situations | 22 | 66 |
| Original childhood situations | 28 | 84 |
| School-day stories | 20 | 60 |
| Early-home stories | 20 | 60 |
| Teen-home stories | 10 | 30 |
| Workplace stories | 10 | 30 |
| Adult friend and partner stories | 15 | 45 |
| Ordinary adult stories | 25 | 75 |
| Parenting stories | 20 | 60 |
| Home stories | 6 | 18 |
| Wellbeing stories | 15 | 45 |
| Special-career stories | 9 | 27 |
| Pet stories | 10 | 30 |
| Hobby stories | 10 | 30 |
| Travel memories | 10 | 30 |
| Later-life stories | 10 | 30 |
| Working-life stories | 10 | 30 |
| **Total** | **250** | **750** |

Two concrete wording errors are corrected:

- The free-walk result in `friend-different-budget` said its conversation was
  “not noticeably less expensive”. It now says “no less enjoyable”; no money
  changes hands, and its existing Happiness, Energy and friendship effects stay.
- `birthday-number` could appear at every age from 30 to 90, but its title asserted
  an “unnecessarily round number”. “Another year, another timetable” now matches
  its existing general birthday reflection without restricting it to decades.

The context review also reproduced a real eligibility defect. Production urgent
care on the immutable employed-graduate scenario charges 36,000 USD minor units,
creates the actual provider/treatment/hospital records, and admits the patient.
The old `community-garden` template still offered that patient an afternoon
volunteering outdoors in New York. The annual resolver already filters custody
and active travel; it does not apply that special filter to hospital stays or
service assignments. Newer local stories already use the shared presence rules.

Six older scenes now opt into those same existing rules:

| Scene | Physical context requiring availability |
| --- | --- |
| `library-card` | Visiting and borrowing from a library |
| `community-garden` | Volunteering at the local garden |
| `local-meeting` | Attending the local public-space meeting |
| `familiar-street` | Returning to and walking around a city neighbourhood |
| `toddler-caterpillar-crossing` | Watching or walking around a caterpillar on a path |
| `rest-guilt` | Its walk branch explicitly walks around the home city |

`rest-guilt` mixes two indoor choices with its outdoor walk. The current authoring
model has a template-level local flag, so this entire scene waits until the person
is available. Online and reflective alternatives remain available, including an
online misunderstanding, a remote old-photo conversation and suitable indoor
childhood scenes. This avoids introducing another choice-restriction system.

No stat, bond, skill, grade, fee, effect, template ID, choice ID or cooldown changes.
Eligibility and binding add no random draws and mutate no world. The eligible
pool can change during absence, so future annual story selection can differ.

The correction affects future binding. Already-bound text, people, choices,
effects and random state remain stored data. A previously bound mixed scene is
not replaced, cancelled or newly restricted after a hospital admission. No
current, backup or historical payload is eagerly rewritten, and no immutable
fixture was regenerated. The coordinating branch owns the content-version
transition to content9 alongside its other versioned work; this branch does not
edit the engine, model or persistence versions.

Verification covers actual urgent-care stays, caregiver-funded child care, a
paid foreign booking, a normal assignment following the genuine saved service
year, a hospital admission at that archive's actual interrupted month-twelve
boundary, exact saved results, and preservation of previously bound copy and
mixed-scene choices. These are domain/fixture checks, not new native journeys or
physical performance measurements. The final focused run passes **174 tests in
five suites in 33.616 seconds**: editorial context, adult relationship, early-home,
childhood and content-refresh. The complete combined regression, annual sweep,
builds and device acceptance remain integration gates.

Editorial and balance work still includes longer continuous play, recurrence and
pacing across natural lives, subjective variety, country review and device text
presentation. The 250-situation minimum and this source review do not establish
those gates.
