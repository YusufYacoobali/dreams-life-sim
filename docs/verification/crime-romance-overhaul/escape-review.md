# Exit Shuffle source review

The escape challenge uses the existing mini-game session and transactional command
pipeline. It adds a fourth kind without changing the three existing evaluations.
The fictional stamp board contains no map, equipment or real escape method.

An actual active sentence owns the opportunity. Starting reserves the existing
person/year legal escape allowance before any input. The saved session contains
the seed, difficulty, assistance setting, elapsed time and ordered inputs. Cold
reopening resumes that transcript. Security and Smarts, Fitness and crime
experience affect new difficulty; saved difficulty is never recomputed.

Three to five stamps must be matched before the deadline. Gate positions are
shuffled after every input. High difficulty ends on the first wrong stamp; other levels
end on the second.
Assisted controls remove the real-time deadline. Every symbol also has a readable
word and spoken label. The board uses the existing mini-game sheet, pause,
confirmation, feedback and result components. It grows inside the existing
ScrollView for small screens and large text.

Completion invokes the ordinary legal system exactly once. Success changes the
bound sentence to escaped, records an escape incident and marks the actual
person wanted; unfinished time remains. Failure, timeout and forfeiture preserve
the sentence, reduce conduct and create an actual escape case. Surrender and
later proceedings continue through the existing legal code. A result is valid
only with its reservation, sentence identity, application month and single
same-year incident.

## Verification

The focused broad regression passed **10 suites / 132 tests** in 63.846 seconds:

- `tests/game/prison-escape.test.ts`
- `tests/state/prison-escape-save.test.ts`
- `tests/ui/prison-escape.test.tsx`
- `tests/ui/minigame-flow.test.tsx`
- `tests/game/minigames.test.ts`
- `tests/state/minigame-save.test.ts`
- `tests/ui/minigame-native-worklets.test.ts`
- `tests/game/polish3-minigames.test.ts`
- `tests/game/polish-minigame-migration.test.ts`
- `tests/game/legal.test.ts`

The new cases cover all five difficulty levels, reachable wins, wrong inputs,
timeouts, forfeiture, stale commands, exact cold reopening, SQLite rollback at
start/input/settlement, exact retries, single settlement and independent Time
Machine branches. A live component journey plays the actual assisted board and
checks the saved escaped sentence, wanted person and one legal incident.
Another live journey forfeits in custody, checks the real pending escape charge
stays behind the mini-game result, then returns to the same saved legal decision
without replacing it or settling the attempt twice.

Existing cases retain the old games' deterministic results, archived saves,
retries, custody, court and sentence behavior. Source review also checked the
sentence-bound entry on Prison Activities, the shared `/mini-game` route and the
global saved-challenge resume entry.

These are source, component and real SQLite checks. They are not installed-device
or signed-release acceptance. Final integrated types, full regression, exports
and performance results belong to the overhaul's main verification report.

After the final board layout and custody-forfeit navigation case, both affected
UI suites passed **21 tests** with no skips (24.339 seconds). Strict application
and test TypeScript checks passed together via `npm run typecheck`.
