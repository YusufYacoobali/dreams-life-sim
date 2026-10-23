# Minigame visual review — 23 October 2026

Compared the actual screens with [the ImageGen reference](../../../../../design/polish3/mockups/minigame-reference.png) and the [previous implementation](../../before/minigames). The new UI uses off-white rounded sheets, navy text, blue actions, SVG icons and a circular flight pad over the existing bundled scenes. The playground selector and gameplay level label are removed.

These captures exercise the real isolated playground/game components in Chromium with react-native-web. They are browser evidence, not native-device screenshots or performance measurements. The dark large-text review models native Text font/line-height scaling and `useWindowDimensions().fontScale` at 1.4. The browser harness only observes practice session props; it does not replace game controls, physics, inputs or scores.

| State | 400×900 light | 320×844 dark, large text |
| --- | --- | --- |
| Start | [Clutch Shot](light/sports-instructions.png) | [Clutch Shot](dark-large/sports-instructions.png) |
| Flight pad | [Orbital Docking](light/astronaut-playing.png) | [Orbital Docking](dark-large/astronaut-playing.png) |
| Result | [Safe Cracker](light/crime-result.png) | [Safe Cracker](dark-large/crime-result.png) |
| Pause | [Paused](light/crime-paused.png) | [Paused](dark-large/crime-paused.png) |
| Failure | [Alarm](light/crime-failure.png) | [Alarm](dark-large/crime-failure.png) |

Both reviews completed all three timed games with real typed inputs at difficulty 3. Football scored 98, the safe scored 91/94, and docking scored 97. The flight transcripts include Coast and directional thrust. All four arrow buttons measure 64×64 CSS pixels; Coast measures 80×80, or 88×88 with large text. Browser reports also confirm three-mistake alarm failure, a distinct clean Play-again session, pause/resume, explicit forfeit with its input retained, reduced-motion assisted defaults, locally loaded artwork and zero page errors.

[Light report](light/browser-checks.json) and [dark/large-text report](dark-large/browser-checks.json) include the actual practice inputs, outcomes and control geometry. The five focused minigame suites also passed 51 tests, covering legacy difficulty/input/outcome replay, SQLite rollback and retry, haptic preference gates, stale/rapid callbacks, screen-reader assisted selection and native iOS/Android worklet reconstruction. Spoken screen-reader behavior, physical haptics and native-device performance still require device checks; browser practice captures do not establish them.

Reproduce with `DREAMS_REVIEW_TOOLS=/tmp/dreams-polish3-tools DREAMS_REVIEW_APPEARANCE=light DREAMS_REVIEW_VIEWPORT=400x900 node tools/review-minigames.cjs /tmp/minigames-light`. For the second review use `DREAMS_REVIEW_APPEARANCE=dark DREAMS_REVIEW_VIEWPORT=320x844 DREAMS_REVIEW_FONT_SCALE=1.4` and a separate temporary output directory. Keep bundled review assets in `/tmp`; only screenshots and the small browser report belong here.
