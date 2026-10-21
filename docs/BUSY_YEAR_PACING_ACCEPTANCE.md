# Busy-year optional scene pacing

Isolated implementation of the independently approved
[bounded plan](BUSY_YEAR_PACING_PLAN.md), based on
`ace1e38e12ae2493501a30e6f003201e0fd6ab41`. This addresses
[writing and events, line 47](planning/writing-and-events.md:47): years that have
already carried important decisions receive fewer optional scenes.

## Resulting behaviour

A new annual frame records at most three important choices actually resolved
during its monthly phase. Saved V1 observations link the event and template to
the actual choice journal's position, participant and date. Validation uses at
most six direct journal lookups across the current and archived annual frames;
it does not add a growing history scan to unrelated commands.

Zero, one, two and three recorded choices use authored optional-offer chances of
78%, 50%, 25% and 10%. These are game tuning values, not measured balance or the
specification's illustrative event distribution. The important V1 set includes
medical, arrest/hearing, public controversy, brand/property offers and the three
due school-story callbacks. An unanswered offer, failed command, ordinary
activity, manual interview, acknowledgement or year-end scene adds no load.

The first birthday remains guaranteed and uniformly selected from the existing
introductory pool. Monthly mandatory prompts, callback eligibility/effects,
queue priority, rarity weights and cooldowns are unchanged. The code retains
the exact former offer-roll and conditional candidate-selection draw schedule,
even when a lower busy-year threshold suppresses that candidate. A suppressed
candidate is never bound, stored or recorded in event history.

Existing interrupted frames without `pacing` keep the entire old 78% policy.
Loading, resolving an old pending choice and cold reopening never invent a
counter. Death archives actual new-frame observations; ordinary continuation
as an existing child retains that frame rather than estimating another person's
past workload. No money, stat, reward, achievement or extra journal is granted.

The branch retains its base's global tags, World37 / engine38 / content12 /
reader17. Root owns the later World38 / engine39 / content13 / reader18 union.
No global version changes, fixture edits, import/export features or root progress
documents belong to this slice.

## Focused evidence and limits

The two new suites passed **9 tests / 2 suites in 12.379s**: actual session
`57982` closed with exit 0. Raw log:
`/tmp/dreams-busy-year-pacing-tests-valid-ids.out`.

- A genuine v27 pre-year saved project context starts a new annual frame,
  reaches its actual month-two callback and resolves the existing choice.
  A declared legacy-frame control starts from the same context. With fixed
  initial events stream `1` (first offer roll 63), the new one-choice year gives
  its quiet summary while the legacy year offers its existing scene. All four
  final random streams and the whole world outside the specified
  pacing/display/history/quiet-summary differences agree. There is no seed
  search or post-setup stream/date/money/stat change.
- First-birthday selection retains its existing single uniform draw. An empty
  eligible pool retains only the original offer roll. Actual medical and queued
  court choices from a genuine v9 context record two observations in order;
  this case explicitly declares a new-policy frame instead of claiming an
  automatic legacy migration. Recorder-only synthetic facts isolate the cap,
  exclusions and 10% threshold; they are not whole-save or natural observations.
- Genuine old project and medical/court frames retain absent metadata and bound
  facts through real choices and production checkpoint round trips. Forged
  journal positions/identities, classifications, people, dates and duplicates
  are refused. An explicit unit mortality/family setup exercises actual
  choose-to-critical-death and existing-child continuation hooks, preserving
  the recorded frame. It is not a natural pregnancy/death journey.
- The actual project choice is held at the SQLite receipt while a second
  read-only connection observes all eight unchanged tables. A duplicate busy
  dispatch is refused. The injected receipt failure rolls back all eight
  tables and leaves the exact old published world. Identical retry performs
  zero full checkpoint unpacks, saves one observation and result, preserves
  the exact previous raw-current backup and original v27/v30 archives/moments,
  then a new connection cold-opens that same world. The result is acknowledged
  once; replay changes neither world nor tables.

Initial focused session `98789` closed with exit 1 (3 passed, 6 failed) because
the declared test life IDs omitted the existing required `life_` prefix. The
test inputs were corrected without changing runtime rules or weakening
assertions; its raw log remains
`/tmp/dreams-busy-year-pacing-tests-initial.out`.

Initial `npm run typecheck` session `21087` closed with exit 2 only on a test
helper's overly broad `GameCommand` return annotation. It was narrowed to the
actual choose-command type without emitted behaviour changes; the log remains
`/tmp/dreams-busy-year-pacing-types-initial.out`.

Final sequential `npm run typecheck` (app and every test) session `89329`
actually closed with exit 0 and no TypeScript diagnostics:
`/tmp/dreams-busy-year-pacing-types-final.out`. The final difference check was
clean. Only the test helper's return type changed after the passing focused
suite, so the tested runtime and emitted test behaviour are unchanged.

No full suite, annual cohort, native UI journey, physical-device latency or
70-sample action benchmark was run for this isolated feature. Its one warm
save proof is scoped to the actual tested retry. Broader integration/release
acceptance and global tags remain root's responsibility.
