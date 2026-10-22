# Interactive mini-games

Clutch Shot, Safe Cracker and Orbital Docking are full-screen, playable challenges integrated into the existing simulation. All six implementation steps are complete on `work`. No new runtime dependency or rendering engine was added.

## Where to play

| Game | Live entry | Opportunity | Normal-time limit |
| --- | --- | --- | --- |
| Clutch Shot | Active athlete career → Play Match Challenge | Once per actual active season/project | 10 seconds |
| Safe Cracker | Crime → Safe Cracker, for Burglary | Uses the existing yearly burglary allowance | 12 seconds |
| Orbital Docking | Astronaut → active Orbital Research or Habitat Maintenance → Docking Challenge | Once per actual assignment | 14 seconds |

**Settings → God Mode → Mini-Game Playground** offers all three games at difficulty 1–5, without a career or qualification. The existing God Mode build gate and saved toggle apply. Development and configured `internal`/`preview` builds allow access; public production builds do not. Playground input, results and immediate restarts use component-local state and never dispatch to a saved life.

Before Play, **Not now** leaves an optional career challenge unused. **Use normal burglary** runs the ordinary burglary command. Starting Safe Cracker commits the year's burglary allowance immediately; exiting cannot recover it. A shared resume entry remains available above the game screens while an attempt is active.

## Gameplay and presentation

- **Clutch Shot:** drag the gold aiming target or use placement buttons, watch the moving power indicator, then shoot. A moving goalkeeper reacts to the release. The ball spins along an eased trajectory, with a shot trail, goal/save/miss presentation and crowd reaction. Skill and recorded career experience determine difficulty.
- **Safe Cracker:** time the dial against three successive targets. Incorrect inputs increase suspicion; three mistakes trigger the alarm. Metallic layers, moving bolts, warning flashes, a restrained shake and an opening safe distinguish the scene. Difficulty uses crime skill and recorded incidents.
- **Orbital Docking:** tap four directional thrusters to change velocity; coast between impulses. Align with the port while keeping approach speed safe, before time or fuel runs out. Earth, atmospheric layers, stars, station panels, thruster flares and a final capture animate around deterministic flight. Skill and actual service periods determine difficulty.

The shared framework provides instructions, a short countdown, remaining-time progress, pause/resume, explicit forfeit confirmation and saved results. Backgrounding, Android Back and navigation blur pause the attempt. Saving failures offer retry, authoritative reload and exit with previously saved progress. A lost completion acknowledgement reuses its original receipt rather than applying the outcome again.

Normal legal events created by burglary remain saved while the challenge result is visible. They present when returning to the game, avoiding a second native modal over the mini-game screen.

## Effects on the simulator

Scores are integers from 0–100, derived in pure logic by replaying typed input and saved challenge parameters. There is no completion command accepting a client-provided score.

| Rating | Score | Next eligible match/mission score | Burglary loot multiplier | Burglary detection-risk change |
| --- | --- | --- | --- | --- |
| Perfect | 85–100 | +8 | 1.15× | −7 percentage points |
| Good | 60–84 | +4 | 1.05× | −3 percentage points |
| Poor | 30–59 | −3 | 0.60× | +8 percentage points |
| Failed / forfeited | 0–29 | −8 | 0× | +18 percentage points |

Match/mission scores remain clamped to 0–100. The modifier is consumed once by the next eligible recorded period; it does not award instant money, trophies or skill. A missed or interrupted period does not consume it. Normal sports attendance, season calculation, reputation and awards remain authoritative.

Docking modifies an attended, risk-free mission period's score and output. The actual six-period assignment, qualification, pay and mission assessment are retained. Injury and fatal-risk rolls are drawn exactly as before. A failed docking does not directly kill the character, and a perfect result cannot suppress a separately rolled accident.

Safe Cracker resolves through the existing burglary implementation. It retains ordinary energy/stress changes, crime experience, evidence, detection, investigations, arrest, trials, fines and prison. Final detection risk stays between 10% and 95%; success never guarantees freedom. A forfeited attempt still resolves through that pipeline with zero loot and increased risk.

## Sessions, saves and migration

`World.miniGames` records life/person identity, session/opportunity identity, owning career/assignment or burglary year, difficulty, deterministic seed, start revision/date, input transcript, elapsed time, pause/status, score/rating, settlement and consumed period.

Start, input, pause, resume, complete and forfeit are typed engine commands saved through the existing revision checks, SQLite transaction and idempotency receipts. Challenge seeds do not consume the world's random streams. Only the ordinary domain resolution consumes its usual RNG. While a session is active, other life mutations and God Mode edits are blocked until resume/forfeit; this includes ending or changing the active life.

The new markers are **World 42 / engine 44 / content 20 / SQLite reader 22**. Checkpoint/archive formats remain unchanged. The preceding World 41 / engine 43 save migrates by adding an empty session array and updating the version markers. Older supported migration chains still pass through that boundary. Reader 13–21 upgrades change only the database marker, without rewriting old payloads. The bumped reader prevents an older app from silently discarding new attempts. Historical fixture bytes and frozen historical fingerprints remain unchanged.

Restoring a Time Machine branch rebinds session `lifeId` while retaining session identity, seed and transcript, so an active attempt stays resumable without creating a fresh challenge.

## Animation, accessibility and offline assets

Reanimated drives the clock, progress, dial, power, goalkeeper, ball and ship on the UI runtime. SVG shapes are static; moving groups update numeric affine matrices through a native SVG adapter. There is no per-frame complex SVG path construction. Docking uses analytic motion between impulses, shared by UI worklets and command replay, so its outcome does not depend on render rate. Telemetry crosses to React at most twice per second plus accepted input; countdown labels update once per second.

Controls use at least 48-point targets, text labels and scrollable instructions/results. Reduced Motion removes decorative travel, shake, twinkle and the success particle effect, and defaults to **Assisted controls**. Screen-reader detection also defaults to assisted mode. Assisted controls retain the same scoring bounds while removing fast timing: deliberate placement/power choices, manual dial steps, or 0.4-second flight turns. Text exposes aiming position/keeper side and flight alignment, range, velocity direction, speed and fuel.

Sound and haptic requests respect existing saved preferences. Three short authored WAV cues and one small Lottie success effect are bundled locally; together they total 38,636 bytes. SVG artwork is code, and all assets work offline. No AI generation, network request, new renderer or additional runtime package is involved in play.

Regenerate or check the authored effects:

```sh
python tools/generate-minigame-effects.py
python tools/generate-minigame-effects.py --check
```

## Verification and remaining limits

Automated coverage includes deterministic scoring/difficulty, valid bounds, live athlete/mission integration, successful and failed flight, ordinary burglary, forfeits, timeout, yearly limits, duplicate input/completion, save rollback, cold reopen, lost acknowledgements, background pause, Time Machine branching, playground isolation, reduced motion and disabled feedback preferences. A perfect Safe Cracker result is tested through actual arrest, court fines and a recorded prison sentence. Mission tests explicitly preserve a separately rolled fatal accident and the six-period structure.

Native Babel/VM checks reconstruct the actual scene animation callbacks, SVG adapters and physics worklets for Android/iOS in development and production configurations. They catch undefined helper captures and unsupported SVG transform updates. These are simulated UI-runtime checks, not native interaction tests.

Browser checks exercise the actual isolated playground components and controls at 400×900, 320×568 and 768×1024, including all three results and the reduced-motion assisted default. [Saved screenshots and browser reports](verification/minigames-20261022/) identify their renderer explicitly. The optional review harness uses external tooling through `DREAMS_REVIEW_TOOLS` and is not part of the application dependencies.

Final command results are recorded in [verification/results.json](verification/minigames-20261022/results.json).

The full regression run covers 3,269 tests in 247 suites: 3,268 passed initially, and one existing statistics-screen test exceeded its 30-second timeout under concurrent CPU load. That case passed on a targeted rerun in 19.799 seconds without a code change. All four mini-game suites passed in the full run. The final app/test typechecks, zero-cycle import check and Android/iOS production Hermes exports pass. The online Expo compatibility request was blocked by the environment proxy; the offline SDK check reports dependencies up to date.

The complete 120-life soak passes across all four workers, with every seed from 0–119 checked exactly once. The 34 mini-game tests cover the new feature separately from that ordinary-life regression. [Per-life observations](verification/minigames-20261022/soak-lives.json) retain the completed seeds and invariant-run metrics.

The soak runner supports `DREAMS_SOAK_WORKERS=1..4` (default 1), distributing the same seeded lives across disjoint shards without changing their checks:

```sh
npm run typecheck
npm run check:imports
npm test
DREAMS_SOAK_WORKERS=4 npm run test:soak
npx expo export --platform all
```

**Remaining device acceptance:** this environment has no Android/iOS simulator SDK or physical phone. Hermes export success does not establish an APK/IPA, native interaction, spoken VoiceOver/TalkBack behavior, physical haptic/audio feel or sustained 60 FPS. No device frame-rate claim is made. On an installed internal release build, use the playground at levels 1 and 5 on a mid-range Android phone and iPhone; exercise drag/timing/thrusters, background/resume, reduced motion, large text, sound/haptics off/on and repeated restarts while profiling frames. Balance and presentation can then be tuned from actual device play without changing the saved-life integration.
