# Dreams Polish 3

This batch implements all nine requested phases over `25a8faa` on `work`.
Existing gameplay, avatar V2 illustrations, saved employment and mini-game
physics are retained. The current tuple is **World45 / engine47 / content24 /
reader25 / SQLite v4**. World44 saves and reader13–24 databases advance their markers only. Loading
never rewrites a saved appearance or changes recorded mini-game difficulty;
earlier archive migrations retain their established behavior.

## Behavior

- Automatic NPC artwork uses audited masculine, feminine and neutral style
  tags. New NPCs save a stable head/outfit and an edit-sensitive fingerprint.
  Conservative legacy rendering repairs built-in automatic defaults while
  protecting players, former players, explicit choices and custom markers.
  A legacy heir's displayed look is frozen during the normal child handover.
  See [the artwork and save policy](avatar-defaults.md).
- Person profiles emphasize the actual relationship. Equivalent occupation
  text is replaced by the employer; different facts such as Father and Teacher
  remain. Common actions use 36 dedicated illustrations and one registry.
  New outcomes use concise role-aware writing, actual amounts and explicit
  loan obligations without additional simulation randomness.
- Net Worth, Finances and Bank & Loans use distinct artwork. Every ordinary
  job has its own illustration: 100 new transparent icons cover 62 jobs,
  36 actions and both finance destinations. The coordinated sheets, prompts,
  crop registrations and provenance are retained. All were made with Image Gen.
- One Real Estate catalogue and shared details offer Buy Outright, Mortgage
  and Rent. Quotes and confirmation commands come from the existing engines;
  old rental routes remain compatible. Cars show Top Speed, Mileage and
  actual Condition in three equal boxes at ordinary text sizes. Mileage is
  marked as the listing reading; large accessibility text can reflow.
- Ordinary employment expands to **54 full-time and 8 part-time jobs**, with
  all seven existing special-role entries retained. Existing IDs and wages
  stay literal. New roles have individual interviews and requirements, including
  receipt-backed experience for senior roles. All part-time roles use hourly
  contracts and existing country/student rules. Jobs uses a virtualized list.
- Mini-game starts/results use native text and controls over existing scenes,
  following the [Image Gen reference](../../../design/polish3/mockups/minigame-reference.png).
  New sessions use difficulty 3; saved sessions keep their recorded value.
  Docking uses four circular directional controls and central Coast. Physics,
  sports/crime logic, evaluation and session source remain untouched.

## Visual review

[Before/after browser captures](index.html) render the real production React
Native components through react-native-web. The baseline is the untouched
`25a8faa` checkout. Phone captures cover 390px light and 320px dark with emulated
1.4× native text scaling, including scroll bottoms. The gallery covers 50 male,
50 female and 12 neutral defaults across ages and skin tones. Every visual
fixture passes world validation.

[Artwork review](../polish3-art/index.html) shows every new illustration at
36–48px and larger sizes on light and dark backgrounds. Alpha bounds and
unique image hashes are recorded in its report.

[Mini-game review](after/minigames/README.md) exercises timed play, failure,
retry, pause, forfeit, assisted controls, reduced motion and actual typed
thruster inputs in both phone layouts. The observed missing pause glyph was
replaced with SVG; final captures have no broken glyphs or backdrop edge behind
result/pause sheets. The scene assets remain the originals.

These are browser captures, not native-device screenshots. Physical haptics,
spoken screen-reader behavior, native performance and store-sheet presentation
were not exercised in this environment.

## Verification

Runtime source was frozen at **4698d79** before the final regression and both
offline exports. The full run and passing reruns of its 13 failed suites verify
**286 suites / 3,735 tests**, with no remaining failed or skipped tests. Initial
failures were old copy/selector expectations, local native-module test setup,
automatic artwork handover expectations and the rejected future-reader marker.
Only tests changed afterward. This is combined verified coverage, not one clean
full invocation; [the exact run counts](test-summary.json) retain that distinction.
The original 512-generation birth hash remains literal, with only the permitted
automatic artwork differences projected through recorded baseline appearances.
Original historical archive bytes and frozen source registrations remain intact.

- `npm run typecheck`: strict application and all-test types pass.
- `npm run check:imports`: 469 runtime modules, no cycles.
- `npm test -- --runInBand=false --maxWorkers=3`: complete regression, followed
  by passing focused reruns for the 13 test-only corrections.
- Current-input artwork/dependency notice inventory check passes.
- Offline Expo Android and iOS exports pass. Both Hermes headers are valid;
  all 67 changed runtime source files match their source maps, and all 100 new
  PNGs match the locally bundled bytes. [Bundle evidence](offline-bundles.json).

`DREAMS_SOAK_WORKERS=3 npm run test:soak -- 36` also passes: **36 complete
lives**, all 12 countries and all three genders, ages 40–95. World invariants
are checked after every year; every life terminates with a factual death record
and no unfinished annual cursor. [Per-seed soak results](soak-summary.json).
