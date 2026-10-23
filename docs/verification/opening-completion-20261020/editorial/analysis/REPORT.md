# Actual varied-choice editorial observations

All twelve coordinator-run countries completed with actual process exit0
(session24133), in **677,963ms (677.963s)**. Source checkout
`73cedc7643fa3cbcd0ad32dfa27abfb59dac8aaa` retains frozen C35 game
`84625d5208d1a6815dccc2802ff75c83393eeb143c382e83d60ed0dafaf94f33`,
World34 / engine35 / content10. The source-injected producer/tool/helper hashes,
all12 raw command/final-world hashes and every input's bytes/SHA256 are in
[summary.json](summary.json) and [inputs.json](inputs.json). This analysis changes
no source, native state or raw evidence and runs no game commands/tests/lives.

## Concrete priorities

1. **P2, early gameplay: distinct bound people become indistinguishable names.**
IN909's age10 mascot scene (`IN/result.json#/decisions/8`) makes both classmate
Rohan Khan and teacher Rohan Mehta “Rohan”. GB902's age14 family assignment
(`GB/result.json#/decisions/12`) has teacher Amelia Morgan set an interview and
parent Amelia Takahashi answer the call, both “Amelia”. In Italy907, classmate
`person_npc_15_6` and teacher `person_npc_29_11` both actually use the full name
Leonardo Ferrari. The teacher's actual result at decision9 and classmate's at
decision10 both show that full name before adulthood; the yearbook body itself
also uses “Leonardo” for both roles. `events.ts:297` reduces school/parent names
to first names, and ordinary full-name result labels cannot solve the identical-
full-name case. Identities/roles are correct; the presentation is ambiguous.
Future collision-only role labels can distinguish them without renaming people,
adding random draws or rewriting any old bound decision/result/history.
[Exact bound text, IDs, roles and actual result labels](name-collision-evidence.json).

2. **P2: emergency choices omit the condition being assessed.** All201 actual
medical decisions use generic symptoms/care wording;161 occur after earlier
accepted care for that same condition. US900's known Asthma prompt at
`US/result.json#/decisions/20` and a distinct Anxiety assessment at
`US/result.json#/decisions/26` both display the same generic $360 wording. Italy's
late prompts107–109 likewise alternate actual Asthma, Diabetes and Depression
without saying which condition is involved. `src/game/systems/health.ts:212`
binds an exact conditionId but includes neither its known name nor established
symptoms. A narrow future copy correction can identify already-diagnosed care,
show only observable symptoms while undiagnosed, and preserve every quote,
choice, effect, eligibility rule, frequency, RNG stream and old bound text.
This observation does **not** justify reducing care offers or rebalancing disease.

3. **P3: repeat care overwrites the diagnosed date.** The actual US Asthma record
`condition_person_player_59_0` has hospital care on2021-11-01
(`medical_63_person_player_0`), but its final `diagnosed` field is2049-01-01.
There are14 such actual condition histories across the cohort.
`src/game/systems/health.ts:100` unconditionally replaces that field on accepted
emergency care; the NPC treatment path at229 does the same. Preserve an existing
date for future care and keep new admissions/treatments separate. Do not infer or
rewrite dates already overwritten in old saves. Exact condition IDs, record IDs,
dates and checkpoints are in [medical-context-evidence.json](medical-context-evidence.json.gz).

No additional contradiction was found in the selected catalogue effects,
reported capped values/tones, authored age ranges, mapped choice IDs, cooldowns
or binding tokens. That is a bounded check of actual observed choices, not
editorial approval of every unchosen branch or context.

## Actual choice and pacing coverage

The633 chosen catalogue occurrences cover **133/250 templates** and
**274/750 distinct authored branches**. Authored branch occurrences are
**208 first /218 second /207 third**. Thus425 selected second/third occurrences
are now observed.117 templates and476 branches remain unobserved/unchosen;
full lists are retained, without treating catalogue minimums as acceptance.
System prompts are separate:201 medical decisions and one project callback.
There are131 within-life catalogue repeats; the minimum repeat gap is five
calendar years. No outside-age offer, unknown mapped choice, duplicate annual
year or shorter recurrence was found. The actual quiet-year results total
191. No observed annual pacing defect
supports changing the ordinary five-year cooldown or offer weights.

| Country | Age at natural death | Catalogue choices | Unique templates | Within-life repeats | System/callback choices |
| --- | ---: | ---: | ---: | ---: | ---: |
| US | 49 | 41 | 34 | 7 | 42 |
| CA | 86 | 63 | 44 | 19 | 2 |
| GB | 85 | 74 | 55 | 19 | 6 |
| AU | 58 | 46 | 41 | 5 | 10 |
| FR | 76 | 58 | 48 | 10 | 4 |
| DE | 74 | 57 | 44 | 13 | 50 |
| ES | 74 | 55 | 46 | 9 | 10 |
| IT | 80 | 58 | 42 | 16 | 52 |
| BR | 76 | 53 | 37 | 16 | 3 |
| IN | 52 | 41 | 37 | 4 | 7 |
| JP | 68 | 49 | 41 | 8 | 12 |
| ZA | 46 | 38 | 33 | 5 | 4 |

| Observed choice age | Occurrences | Unique templates in band |
| --- | ---: | ---: |
| 1–2 | 22 | 9 |
| 3–5 | 30 | 17 |
| 6–11 | 61 | 33 |
| 12–17 | 55 | 27 |
| 18–29 | 104 | 40 |
| 30–49 | 181 | 44 |
| 50–64 | 102 | 49 |
| 65–84 | 76 | 28 |
| 85–150 | 2 | 2 |

The strategy performs no optional work, relationships, family, home, pet, hobby
or travel actions. Accordingly it observes0/20 workplace,0/10 friend,0/7 partner,
0/20 parenting,0/6 owned-home,0/10 pet,0/10 hobby,0/10 visited-place and0/9
special-career templates. These are missing acceptance contexts, not missing
implementations. Actual diagnosed chronic-condition stories cover3/5 templates.
All ordinary authored story-file hashes match the prior catalogue, permitting
exact source-line references; system health copy is analyzed against C35.

## Actual consequences, callback and persistence evidence

All1,412 selected direct stat/bond/skill/grade effects match the actual capped
before/after values and reported result values/tones.190 nonzero requested
changes correctly report zero after caps. Complex emergency-care and callback
effects are retained separately rather than counted as direct-effect checks.
A keyword screen of the selected catalogue labels/results/journals found no
pay/fee/qualification/employment promises to credit. This is not a general
semantic audit of every unchosen or absent work/family branch.

France904 naturally promised the class project on2014-01-01
(`FR/result.json#/decisions/12`), preserving peer Gabriel
`person_npc_16_5`, teacher Camille `person_npc_30_11`, school
`school_person_player_30_1` and thread `story_40_0`. On2014-03-01 the real due
callback offered the same participants; the second branch, `ask-help`, resolved
that thread. Actual grades87→88, energy−3, peer bond19→21, teacher bond41→43
and teacher trust50→52 match its result. Promise alone awarded no grades.
This one natural callback does not cover arcade consent/payment, all callback
branches, cancellations or every school/country.

The raw commands and decision rows reconcile exactly to committed revisions;
all12 trace file hashes match their results/aggregate.2,721 recorded production
codec checks assert whole canonical equality and replace play with the decoded
world. All final checkpoint bytes match their recorded final cold hashes, and
all12 final frames/causes/estates are retained. These are the producer's
production-codec checks and independent artifact reconciliation, not a new
analysis replay or a physical/SQLite lifetime test. The producer asserts every
source pin unchanged after load, each life and the cohort; the coordinator also
reports583 frozen pins unchanged. No separate sourceAfter file is invented.

One producer telemetry limitation is explicit: `annual[]` records a closure only
if `before.annual` existed. A death inside an `advance` that created and ended a
frame can omit that final partial-year row. All12 lives start one more year than
they complete; use `yearsStarted−yearsCompletedToTarget`, not recorded partial
closure rows alone, for those uncompleted started years. The final whole-world
cold proofs remain present. This is an observation gap, not a changed lifespan
or engine-year defect.

## Preserve scope and historical evidence

The old fixed C9 audit remains **991 choices, all first branch,184 unique IDs**.
Its report/analysis hashes were rechecked unchanged. It is not extended by these
633 C35 choices. The new passive strategy and earlier active A/B/C strategies
have different contexts/lifespans; this is not a controlled balance comparison.
The same seeds900..911 are reused, adding no distinct seeds to the120 annual
policy. Natural deaths at46–86 and all omitted contexts remain actual limits.

The independent archive preserves87 files (30,974,791 uncompressed bytes), with
byte-identical deterministic reconstruction. Archive SHA256:
`a947ddf5e84aaa39340ac3ff6bf8bf998177a297ba6547db92adbe7958e5621d`.
Its [manifest](/tmp/dreams-opening-next-editorial-archive-manifest.json) and
[proof](/tmp/dreams-opening-next-editorial-archive-proof.json) establish byte
preservation only, separate from this editorial analysis. Actual stdout is
742,870bytes and matches the aggregate JSON plus output path; it is not empty.

No all250/all750/all-context, full Scenario A/B/C, complete-game, balance-complete,
native, physical-performance or full-life SQLite acceptance is claimed.
