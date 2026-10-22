# Motion, haptics and action sounds

This implements the bounded Settings X31 feedback options in `docs/planning/screens-and-navigation.md` and the requirement that every exposed option changes real behaviour in `docs/planning/design-reconciliation.md`.

## Behaviour

### Opening and life milestones

The22October motion pass concentrates its larger effects on three rare moments:

| Moment | Treatment | Interaction boundary |
| --- | --- | --- |
| Opening the game | Existing sunset artwork gently settles; a warm sunrise glow, eight drifting lights and a short wordmark accent introduce Dreams. | Continue, creation and other available controls remain visible and actionable throughout. |
| A newly created life | A soft portrait reveal, expanding blue halos and a small heart/star constellation. | Birth facts and Begin Life remain immediately available; save failures do not restart the scene. |
| Life's end | The existing memorial settles into a warm glow with a few upward lights. | Biography, actual statistics and summary/new-life/child controls remain immediately available. |

The native driver animates only opacity/transforms on decorative artwork, for at
most1.8seconds. Effects have fixed positions, ignore touches and are hidden from
assistive technology. They consume no game randomness, run no per-frame React
state updates, add no artificial loading delay and never dispatch a game action.
An unchanged scene identity does not replay on busy/error/result rerenders.
Backgrounding or enabling reduced motion settles the scene and stops its native
animation. Unknown/reduced-motion preferences use an attractive static frame;
a late device preference answer does not make already-visible artwork jump.

The highest-value smaller placements are accepted option changes, a newly
committed year marker, and a newly earned milestone. Keep their feedback brief
and factual. Existing pressed colours/checkmarks already communicate selection;
large entrance effects belong to the three moments above. Animating every
journal row, keyboard field or save status would add distraction and make the
game feel slower. No such effects or new year/milestone animation are claimed
by this batch.

### Tap feedback

- **Reduce Motion** disables the shared event dialog fade and both root/game native stack transitions. The actual OS reduced-motion preference always wins, including later device changes. While the initial device query or app preferences are unresolved, motion stays reduced. A later OS event cannot be overwritten by a stale initial query. Existing bottom tabs already default to no transition, and journal/list scroll resets already use `animated: false`.
- **Haptic Feedback** defaults off and retains each player's saved choice. An accepted tap requests a light iOS impact or Android native virtual-key haptic. Onboarding/creation selections, navigation and Age Up use this same setting; keyboard keystrokes remain the operating system's responsibility. This is tap acknowledgement, not an assertion that a game action succeeded. Device support and system restrictions still apply.
- **Sound Effects** defaults off. Enabling it prepares one original, local, 45 ms tap. Shared buttons can play it after starting their action. Expo Audio mixes with other audio, obeys silent mode and media volume, disables recording and background playback, and releases its player when disabled or unmounted. Backgrounding pauses sound and invalidates any pending seek. A late seek cannot play after disable/background/unmount.
- Haptic and sound promises are never awaited by a game action. Missing native modules, failed audio initialization, failed playback and rejected haptics leave the text, pressed state, delayed busy state and game action operational. Disabled, unchanged or blocked selections produce no extra feedback. Haptic-only selection feedback preserves the existing sound behaviour; selecting an appearance or navigating Back does not add a sound or gameplay work.
- No music, soundtrack, streaming, recording, sound-based gameplay, or fabricated connection status is exposed.

## Preference durability

The existing independent `preferences.app_settings` record remains version 1 and limited to 1,024 characters. Older version-1 appearance-only records gain in-memory `false` defaults for `reducedMotion`, `haptics` and `soundEffects`, without a write on opening. Only enabled optional flags are serialized. Appearance defaults to Light as before. Nothing changes the database reader version, world model, life archives, gameplay RNG or simulation rules.

All preferences publish only after the real settings write succeeds. A failure keeps the prior choice and the exact failed choice for Try Again. A pending write blocks conflicting writes; selecting an already-current choice writes nothing. Invalid/future/oversized records remain untouched until explicit recovery.

Restore Default Appearance keeps the confirmation open after failure and presents one accessible error. A normal reset preserves saved motion/haptic/sound choices. When recovering an unreadable whole record, the confirmation explicitly states that the record will be replaced with Light, device motion and feedback off. Cancelling does nothing.

## Dependencies and native configuration

SDK 57's own bundled-module manifest specifies `expo-audio ~57.0.5` and `expo-asset ~57.0.20`. Both are pinned to those SDK ranges. The existing `expo-haptics ~57.0.3` is reused. Asset was already an Expo transitive dependency at the same version; promoting it provides Audio's explicit peer without accidentally installing SDK 58. The lockfile retains existing unrelated versions.

Expo Audio's config plugin explicitly disables microphone permission, Android recording, background recording and background playback. Actual Expo config introspection confirms no microphone permission, iOS audio background mode, or audio foreground service is added. The optional native module must be included in the next native build; an older development client can continue playing without sound until rebuilt.

Dependencies were installed only in this isolated worktree after unlinking its `node_modules` symlink. The main worktree and its dependency installation were untouched.

## Verification

The new connected UI suite uses a temporary **on-disk SQLite database** and real preference/game stores. It verifies all eight table rows remain exact after failed preference writes, exact retry choices, actual close/reopen persistence, unchanged full life archives/world/RNG, no warm checkpoint unpack, no-op and concurrent-write guards, failed reset retention, real root/game navigator and dialog animation props, device-event/query ordering and listener cleanup.

Native APIs are mocked at the device boundary. Both iOS and Android cases execute a real durable birth acknowledgement while haptic and sound-seek promises remain unresolved, then cold-open the exact result. Additional checks cover disabled/busy controls, unsupported platforms, sound disable/background cleanup, unavailable native feedback and unreadable app preferences.

Focused verification also includes the existing Appearance/preferences and shared-button contrast suites, strict application/test TypeScript checks, SDK dependency resolution, and actual Expo config introspection. No full engine suite, export build, Android automation or native sound/haptic check was run in this branch. Native acceptance must still check audible volume/silent-mode behaviour, physical haptics, OS reduced motion and navigation on the rebuilt app; mocked APIs do not prove those hardware outcomes.
