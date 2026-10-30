# Exit Shuffle refinement review

Newly started attempts use optional session `escapeVersion: 2`. Missing version means the published v1 stamp puzzle, with its original sequence, moving gates, mistake budget, scoring and timeout. Decoding never inserts the version. Existing attempts therefore finish under the rules they reserved.

New attempts also store `escapePatternVersion: 1`. A final gameplay review found
that taking the low two bits of FNV after a final stage digit forced the earlier
v2 pattern to repeat every four symbols. Across seeds 0–255, each of the three
highest-difficulty rounds had only four distinct patterns. New patterns draw
from the existing pure Mulberry32 helper with a local, round-specific seed;
they never consume a life-simulation random stream. The same sample has
244 / 254 / 255 distinct patterns at lengths 6 / 7 / 8, with occasional natural
repetition. These observations check variety. Human difficulty still requires
playtesting.

The pattern revision remains absent on earlier task-stage v2 sessions. Their
original symbols, progress and complete outcomes are preserved. Five genuine
checkpoints captured from `6e35d152` cover started, recall, paused, hint and
settled states; replay checks compare complete world hashes. The original
published v1 fixture remains separate and unchanged. A pattern revision attached
to a v1 session or another game is rejected.

V2 is a pattern-memory game with no countdown deadline. The player studies each round, commits “Hide pattern and begin”, then reconstructs it from four shuffled named gates. The pattern is removed from both the visible and accessibility trees before gate buttons appear. Recall progress displays only checks and dots; feedback never prints the missing symbol. Correct selections advance, incorrect selections consume the attempt's shared mistake budget without resetting or revealing the answer.

| Difficulty | Round lengths | Mistakes allowed |
| --- | --- | --- |
| 1 | 3, 4 | 3 |
| 2 | 4, 5 | 3 |
| 3 | 4, 5, 6 | 2 |
| 4 | 5, 6, 7 | 2 |
| 5 | 6, 7, 8 | 1 |

The existing actual-sentence security calculation supplies new-session difficulty, adjusted by the character's genuine skills. Tests increase the actual sentence's security through its conduct record and assert a longer puzzle.

Assisted mode uses the same recall challenge with two hints across the whole attempt. A hint reveals only the next symbol and removes all gate controls; the player must commit “Hide hint and continue” before selecting again. Hints reduce the final score, remain spent after reload, and cannot reopen the full sequence. All previews advance at the player's pace. Named text, wrapping panels and scalable buttons preserve large-text and screen-reader support.

An optional 180 ms opacity transition marks changes and gives feedback without carrying information. Reduced motion removes it. Native text and panels suit the existing visual identity and avoid loading an image to convey essential puzzle state; generated illustration would not improve this abstract memory task.

The saved seed, version and append-only transcript reconstruct every round, phase, input, mistake, hint and outcome. Preview/hint transitions are actual persisted inputs, not local component state. Reopening in recall stays in recall. The existing reservation consumes the person's annual escape allowance at start; wrong controls, replayed transitions, reordered inputs and a second start are rejected. Failure/forfeiture uses the canonical escape incident/case resolver. Success escapes the actual owning sentence and makes the person wanted. Settlement cannot run twice.

The stage-2 focused run passed **7 suites / 60 cases**, covering the five levels across 30 seeds each, v1 compatibility, phased UI visibility, limited hints, reduced-motion rendering, saved resume, actual security, failure and forfeiture cases, success, duplicate settlement rejection, connected SQLite rollback/retry/cold reopening, branch independence and the complete live screen-to-save journey. Existing generic mini-game/session suites are included. Independent exact baseline fixture checks are recorded separately by integrated QA.

After the generator revision, the final affected run passed **14 suites / 184
cases** with no skipped cases or source changes. The memory suite now has 17
cases, including the variety check and five exact earlier-v2 save replays.
[escape-pattern-variety.json](escape-pattern-variety.json) records the actual
final module's sampled patterns; the
[affected report](regression-final-affected.json.gz) retains all case outcomes.

Command:

```sh
npx jest --runInBand tests/game/escape-memory.test.ts tests/game/prison-escape.test.ts tests/state/prison-escape-save.test.ts tests/ui/prison-escape.test.tsx tests/ui/minigame-flow.test.tsx tests/game/minigames.test.ts tests/state/minigame-save.test.ts
```

A source-level review confirms that no recall UI receives an ordered symbol label or enabled preview controls. Actual device screen-reader, touch and animation behaviour remain unverified in this cloud environment.

## Gameplay and accessibility review

The five profiles are distinct: the first step lengthens both rounds; the next adds a third round and narrows the shared mistake allowance; levels four and five lengthen all three patterns, with the final level allowing no wrong guesses. Each individual pattern is 3–8 symbols, and the whole attempt asks for 7–21 selections. This keeps the game short while making high security materially harder. A wrong choice stays on the same position, so the player can recover using the remaining allowance without repeating a completed round. The two global hints cannot solve even the easiest full attempt, and spending both does not reset the mistake budget.

There is no advantage from motor speed: both modes have explicit preview transitions and unlimited thinking time. The full preview and the hint never coexist with selectable gates; reload preserves this separation. Gates use complete spoken names and at least the existing button touch size, and text wraps rather than clipping into fixed cells. Round transitions announce the new round's memory task through the polite live feedback, while reduced motion makes all changes immediate. Historical v1 instructions, matching board, clock and lack of hints remain truthful to their reserved mechanics.

The strictest profile deliberately has a sharp failure threshold. Device playtesting should assess whether its 6/7/8-symbol rounds feel satisfying under high-security stakes; cloud tests establish reachability and persistence, not human difficulty or native assistive-technology acceptance. No extra retry, forced multi-year arc, art-loading dependency or timer was introduced.
