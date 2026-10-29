# App journeys release audit — 25 October 2026

Source review began at `dc097168`. This report covers startup, local saves,
recovery/import/export, pending events, lifecycle, navigation and accessible UI.
Native packaging, reminders and review prompts have separate audit owners.
No device, test runner, type checker or production export was run by this agent;
the release coordinator runs the checks below against the integrated source.

## Concrete findings and fixes

| Finding | Change | Focused coverage |
| --- | --- | --- |
| A corrupt active checkpoint let startup finish with a useful recovery error but no route to Saved Lives. A fresh installation likewise needed to create a life before importing one. | [Welcome](../../../app/index.tsx) now shows the existing Saved Lives route once startup is ready. The action is disabled while busy, has a 48px target and scalable text, and uses the existing tertiary styling. Continue/birth/death/new-life behavior is retained. | `tests/ui/welcome-recovery-flow.test.tsx` corrupts a real SQLite current row over the genuine v28 archive, opens recovery through Welcome, previews without writes, restores explicitly and reads through a fresh repository. A second journey imports from a clean installation without a disposable life. Existing Welcome checks cover light/dark, loading, busy and large-text cases. |
| Cult Leader routes fell through to the Life navigation tab because the Activities route prefixes omitted `/cult`. | [Game layout](../../../app/(game)/_layout.tsx) includes `/cult`, covering both the dashboard and headquarters without changing destinations or saved data. | `tests/ui/lifetime-statistics-flow.test.tsx` checks both real path fallbacks, selected tab semantics and unchanged world/database rows. |
| Every Share action retained a uniquely named archive in app cache after its native sheet completed. | [Saved Lives](../../../app/saved-lives.tsx) deletes only its own temporary cache file after `shareAsync` settles, including rejection. Folder exports remain untouched; cleanup errors do not report an already completed share as failed. | `tests/ui/saved-files-flow.test.tsx` keeps a native share pending, verifies the archive exists while it is needed, then checks success/failure cleanup, retained folder exports and unchanged SQLite tables. |
| The local v4 checkpoint codec accepts up to 44M characters, while the archive's current and historical payload validators still capped them at 28M. An otherwise supported archive could be exported and rejected on import. | [Archive validation](../../../src/persistence/archive.ts) uses the codec's 44M payload bound. Complete archives still have the existing 64M input/output cap; checksum, full-world, history, duplicate/future-checkpoint and version validation remain intact. | `tests/persistence/archive-limits.test.ts` crosses the old limit with a fully valid real v4 checkpoint plus legal JSON whitespace. Current/history records restore the exact world and retain historical bytes; codec and complete-archive limits still reject oversized input/output. The artificial padding isolates the boundary; it is not presented as a naturally played large life. |

No historical fixture, game rule, world/schema marker, saved identity, random
stream, checkpoint contents or original recorded outcome was rewritten.

## Source-reviewed protections

- [Store actions](../../../src/state/gameStore.ts) publish a new world only after
  persistence succeeds. Busy guards reject duplicate submissions; failures keep
  the visible world and return retryable errors. Import/recovery publish their
  committed summaries without an additional fallible list read.
- [Native persistence](../../../src/persistence/native.ts) uses WAL and exclusive
  transactions, and a failed open clears its cached promise so retry can reopen.
  [Repository commits](../../../src/persistence/repository.ts) atomically retain
  the previous checkpoint and idempotency receipt. Recovery is explicit; import
  previews and read-only saved-life summaries do not select or modify a life.
- [PendingEvent](../../../src/ui/PendingEvent.tsx) renders the persisted offer;
  viewing does not choose an outcome. [The root modal host](../../../src/ui/EventModal.tsx)
  retains route/life ownership, retired-callback guards, busy/error feedback,
  protected Back behavior and focus restoration. Plain choice callers retain
  text layout and accessible labels; decorative art adds no spoken action.
- [Cinematics](../../../src/ui/cinematic/CinematicTransition.tsx) have reduced-motion,
  background, asset-failure and watchdog exits. [Mini-games](../../../src/minigames/components/MiniGameScreen.tsx)
  pause on background/blur and drain pending input before saving elapsed state;
  failed inputs retain their original retry. Saved attempts remain resumable.
- Shared pages keep Back outside long scrolling content and avoid the keyboard;
  buttons and navigation retain roles, busy/disabled states and scalable text.
  Existing tests cover 320px layouts, large text, light/dark, modal scrolling,
  assisted mini-games and exact saves. Source/component evidence does not prove
  installed VoiceOver/TalkBack focus or native visual acceptance.

## Coordinated verification

New/affected checks (not run by this agent):

```sh
npm test -- --ci tests/ui/welcome-screen.test.tsx tests/ui/welcome-recovery-flow.test.tsx tests/ui/saved-files-flow.test.tsx tests/ui/lifetime-statistics-flow.test.tsx tests/persistence/archive-limits.test.ts
```

Existing critical-journey coverage to retain in the release regression:

```sh
npm test -- --ci tests/ui/startup-flow.test.tsx tests/state/gameStore.test.ts tests/persistence/repository.test.ts tests/persistence/time-machine.test.ts tests/ui/time-machine-flow.test.tsx tests/ui/saved-life-preview.test.tsx tests/ui/event-modal-host.test.tsx tests/ui/modal-window-layout.test.tsx tests/ui/cinematic-transition.test.tsx tests/ui/minigame-flow.test.tsx tests/state/minigame-save.test.ts tests/ui/page-layout.test.tsx tests/ui/end-life-flow.test.tsx
npm run typecheck
npm run check:imports
```

Archive boundary cases allocate large strings deliberately; keep this batch
serial, as the existing Jest script does. Existing production export/source-map
checks should be rerun after the final integration, rather than reusing the
earlier UI-polish report as evidence for changed runtime files.

## Installed-device acceptance still needed

On both signed release platforms: cold launch and corrupt-save recovery; import
from a real provider; folder export and external-app sharing/cancellation;
background/force-stop during a pending decision, save and mini-game; native
birth/death overlays and Back; iPad share popover; 320px/large-text scrolling;
VoiceOver/TalkBack labels, radio selection, focus return and assisted play.
Verify an existing save survives installation upgrade and offline restart.
These observations were not made in this audit. Reminders, OS permission state,
store-review policy and release packaging belong to their companion reports.
