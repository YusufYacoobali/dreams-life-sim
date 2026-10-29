# Production gameplay gaps at frozen C36

Read-only source/specification audit of
`6f4b34c40005f5fba8eeee540bada9e0787ccbb0`, World35 / engine36 /
content11 / reader15. No game, UI, fixture, integration or native change;
no tests, lifetime replay, outcome search or performance run. This document
does not close the coordinator's ongoing C36 acceptance gates or revise the
historical approximate65% effort estimate.

HANDOFF, PROGRESS and OPENING_PLAN were read before the production specification,
master plan and relevant implementation. Some root progress paragraphs still
describe the published C35 checkpoint; the frozen code already includes Best
Friends, the named-story/medical fixes and the personal-screen polish. Those
features must not be treated as missing or implemented again.

## Ranked next implementation work

### 1. First teenage relationships are inaccessible

**Actual missing gameplay.** The specification explicitly places first
relationships in ages13–17 ([source specification](planning/source-specification.md#L263)).
However, [romanceReason](../src/game/systems/relationships.ts#L82) rejects either
person below their country's adultAge. Dating introductions repeat that gate
in the [command](../src/game/systems/relationships.ts#L118) and
[Meet People UI](../app/(game)/meet-people.tsx#L17). The person's entire romance
card is [hidden until adultAge](../app/(game)/person/[id].tsx#L66).
Friendships and school contacts work; they cannot become an actual teenage
dating relationship through any current player command.

Recommended first slice: a separate nonsexual, minor-only, close-age first-date
command on an existing known peer, with mutual preferences, consent, exclusivity,
kinship and physical-availability checks. Keep the existing adult romance helper,
proposal, wedding, pregnancy, independent housing and family gates unchanged.
Use one small review/result and the actual persistent relationship; no new NPC,
instant trust, money, qualification or adulthood grant. Review actual lifetime
and consent history rather than inferring an earlier start from friendship.
The bound rules and focused test plan should be agreed before implementation.

### 2. Annual catalogue events have no authored rarity weights

**Actual missing selection behavior.** [Specification4.4](planning/source-specification.md#L669)
requires common/uncommon/rare/extraordinary weighted pools. The
[writing plan](planning/writing-and-events.md#L51) also specifies filtering before
weighting and a safe ordinary/quiet fallback. Current
[EventTemplate](../src/game/content/eventTypes.ts#L13) has no rarity/weight field;
[finishYear](../src/game/engine.ts#L179) chooses uniformly from eligible templates
after one fixed78% optional-event roll. Existing eligibility, five-year
per-template cooldowns and the guaranteed introductory year are implemented.

Recommended first slice: versioned authored rarity metadata plus a small pure
selector, covering the existing catalogue instead of adding duplicate stories.
Keep age-one introduction selection guaranteed and existing bound pending/results
untouched; apply new rules only to future selections. Empty rarity tiers must not
turn an exceptional event into certainty. The plan's draft70/24/5/1 and45/40/15
figures are tuning proposals, not verified balance to label as final. Adaptive
optional-event load after an already busy year is a related later improvement;
the current selector does not track that load either.

### 3. University admissions lack waitlisting and withdrawal of an application

**Actual missing application lifecycle.** The
[education blueprint](planning/simulation-and-persistence.md#L135) explicitly
supports accepted, rejected, waitlisted and withdrawn applications. Current
[enroll](../src/game/systems/education.ts#L89) checks funding, rolls once and
immediately either rejects or starts/charges the course. The
[education schema](../src/game/systems/schemas.ts#L9) stores the current course,
not an admission application or offer deadline. Scholarship applications are
separate real records and do not supply this missing admission lifecycle.

Recommended first slice: a typed actual application/offer record and one bounded
waitlist outcome, with an explicit withdrawal and one eventual decision. Recheck
current prerequisites, study/work compatibility, tuition and the actual scholarship
offer before accepting a place; charge no tuition merely for waiting/withdrawing.
Preserve successful legacy enroll behavior and all old course/qualification/debt
facts. Do not claim researched national admission policies. Also retain a factual
incomplete-course record when later withdrawal would otherwise be overwritten by
a new enrolment; the current [leave-school](../src/game/systems/education.ts#L119)
keeps debt but has no separate general course-history collection.

### 4. Childhood narrative callbacks stop at one or two months

**Missing longer interpersonal continuation, not a missing callback engine.**
[Specification4.2–4.3](planning/source-specification.md#L634) and the
[writing plan](planning/writing-and-events.md#L59) ask for earlier named choices
to matter years later, including a real former friend or classmate connecting
to a later opportunity. Current [storyKinds](../src/game/systems/storySchemas.ts#L5)
are only arcade-invitation and project-promise. Their
[due periods](../src/game/systems/stories.ts#L22) are one and two months;
[resolution](../src/game/systems/stories.ts#L85) completes those plans without a
later narrative stage. Legal investigations, health, education, investments and
family already have real long-term consequences; those must not be described as
absent. Existing short callback acceptance is separately documented in
[CALLBACK_ACCEPTANCE](CALLBACK_ACCEPTANCE.md).

Recommended first slice: one optional later-life continuation sourced from a real
resolved school/project thread and the same living peer. For example, a later
work referral can be offered only if that actual contact has relevant employment
and the player still meets the real role's requirements. The invitation should
route into the genuine interview/application, not grant a job, salary or degree.
Bind original IDs and prerequisites, save once-only occurrence, author refusal/
death/relocation fallbacks, and preserve all existing short-thread outcomes.
Do not retrofit unrecorded childhood facts into old worlds.

### 5. NPC courtship has no autonomous separation path

**Remaining autonomous-life depth.** The specification asks for relationships
that [develop, deteriorate and end](planning/source-specification.md#L864);
the [NPC blueprint](planning/simulation-and-persistence.md#L127) also includes
independent life decisions. Current [npcRelationshipsYear](../src/game/systems/npcRelationships.ts#L52)
forms new dating pairs; [npcCourtshipsYear](../src/game/systems/npcCourtships.ts#L60)
observes them and may arrange a mutually paid wedding. Annual
[relationship decay](../src/game/systems/relationships.ts#L233) concerns only the
active player's edges. An unmarried pair separates through the active player's
[breakup command](../src/game/systems/relationships.ts#L188) or death, not an NPC
decision. The accepted [NPC family milestone](NPC_FAMILY_DEVELOPMENT.md#L65)
explicitly records automatic separation/reunion as future work.

Recommended first slice: a bounded, once-per-year decision for known adult NPC
dating couples with actually poor relationships, excluding the player and current
partner. Preserve the same people/ordinary roles/history and close any saved
courtship clock on the actual separation date; never reuse old24-month time after
reunion. Keep marriage/divorce, custody, property, dependents and relocation out of
this first slice. Independent NPC relocation is also still future depth; existing
marriage/care/player-relocation moves mean that NPC movement is not wholly absent.

## Implemented features whose acceptance remains separate

- Welcome/custom/random creation, appearance draft, one-time newborn Begin Life,
  five dashboard bars and a deliberate first-year event are present:
  [master first-minute plan](planning/MASTER_PLAN.md#L87),
  [new-life route](../app/new-life.tsx), [birth route](../app/birth.tsx),
  [annual introduction](../src/game/engine.ts#L180). Do not add a compulsory tutorial;
  the plan explicitly avoids one. Remaining native/reference/accessibility/platform
  checks are acceptance work, not proof these features are missing.
- School contacts/clubs/exams/reports, secondary withdrawal, evening recovery,
  tuition loans/scholarships, ordinary interviews,8/12/20-hour contracts, paid
  periods, four real ranks/promotions, raises and earned retirement already exist.
  Role-specific career-ladder depth and country-rule/balance review remain valid
  later work; a blanket claim that jobs lack hourly pay or promotion is false.
- Best Friends, actual NPC dating/weddings/birth, family/estate continuation,
  factual Profile/Statistics/Finances and the completed source catalogue are present.
  Their broader editorial, balance, visual, physical-device, standalone Android
  and iOS acceptance cannot be inferred from source inspection.
- The original short-callback native/storage-failure negative cases and full
  release gates remain distinct from adding a longer callback. Reused cohort
  seeds and old gate results retain their original source/scope.
- Automatic resume remains required. Import/export/sharing, Time Machine breadth
  and storage/history optimisation are excluded from these recommendations under
  the user's latest scope.

The first three workstreams can proceed independently behind explicit file
ownership; coordinate the final engine dispatch, version/schema/migration and
content merge centrally. Complete a real gameplay slice before expanding policy
drivers or catalogue counts. This audit changes documentation only and adds no
new acceptance claim.
