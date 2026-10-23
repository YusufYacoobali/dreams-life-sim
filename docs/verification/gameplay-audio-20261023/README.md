# Gameplay audio — 23 October 2026

The existing Sound Effects preference now controls a shared `expo-audio` player cache and one playback lane. All cues are optional and fire without awaiting playback in navigation, game commands or saving. The default setting and saved preference format are unchanged.

## Committed outcomes

- **Age Up:** once after the initial `advance` write succeeds. Monthly processing, result acknowledgement, interrupted-year continuation and restored results never repeat it. If the same commit reaches a major milestone, the short year cue plays first and the celebration follows in the same lane.
- **Big success:** new qualifications, marriage, biological/adoptive parenthood, upper-tier promotions, actual career awards, a million-listens milestone, election wins, service distinctions, substantial achievements and important Cult Leader milestones. Routine work, small achievements, stat gains and ordinary positive events stay quiet. Cult milestones include founding, reaching 100/1,000/10,000 followers and fulfilling a successful claim.
- **Purchase:** explicit asset/investment purchases, renovations, company formation or substantial company/headquarters upgrades, with a newly committed payment. Personal, business and Cult treasury receipts are checked separately. Browsing, transfers, recurring bills and monthly costs do not count as purchases.
- **Failure:** genuine action/save failures, rejected applications/interviews and a settled failed mini-game. Voluntary withdrawal/forfeit and arbitrary negative stats do not count as failures.

Death, family bereavement, pet death, new diagnosis/hospitalisation and pregnancy loss suppress result cues and stop any celebration already playing. A short quiet interval also suppresses the same interaction's generic tap. New gameplay results take precedence over taps and mini-game input effects; a newer committed action stops the previous effect instead of layering it.

Live commit notifications are not saved or replayed. Their transient receipt IDs prevent duplicate playback. Off/background notifications are dropped. Backgrounding, disabling sound and unmounting the last audio owner cancel pending playback; returning to the app never restarts it. Existing mini-game input files use the same cache/lane and retain their volumes and complete short playback durations.

## Playback calibration

The supplied files are unchanged. Playback windows skip the success lead-in and end before measured silent tails; no re-encoding is needed. Details, hashes and measured levels are in [report.json](report.json).

| Cue | File duration | Playback window | Volume |
| --- | ---: | ---: | ---: |
| Tap | 45 ms | 0–45 ms | 0.35 |
| Age Up | 144 ms | 0–144 ms | 0.65 |
| Big success | 3,291 ms | 140–2,560 ms | 0.45 |
| Purchase | 1,411 ms | 0–1,220 ms | 0.22 |
| Error | 1,019 ms | 0–740 ms | 0.32 |

Native load/seek failures are contained; cold readiness and seek waits are bounded, and stale effects are discarded. Audio mode keeps silent-mode playback and background playback disabled and mixes with existing external audio.

## Verification

Production/test typechecks, runtime import-cycle checks and third-party inventory checks passed. Focused and regression tests cover real SQLite saves, failed writes and retries, all purchase account types, interruptions and restores, application rejection/withdrawal, mini-game ratings, significant versus routine outcomes, preference persistence, duplicate requests, native adapter failures and background cancellation. The iOS and Android adapter tests use mocked native hardware.

Both Android and iOS production Metro/Hermes exports passed, with all four MP3s and the existing tap/mini-game WAVs packaged. This verifies bundling, not native playback. [report.json](report.json) records the final suite counts, source hashes and exported asset evidence.

**Device listening checks remain pending:** this environment has no attached iOS/Android runtime. On supported devices, verify all four cues, media volume and the iOS silent switch, sound on/off across relaunch, background cancellation, repeated taps, failed saves, interrupted years, purchases and automatic milestones. Confirm the relative levels and playback windows by listening. No native listening pass is claimed.

Re-run typechecks with `npm run typecheck`, the classifier/save tests with `jest tests/state/gameplay-feedback.test.ts`, controller checks with `jest tests/ui/audio-controller.test.ts` and preference integration with `jest tests/ui/feedback-settings-flow.test.tsx`. Export each native platform with `expo export --platform android --dump-assetmap` and `expo export --platform ios --dump-assetmap` using separate output directories. The command/suite list and source snapshot are retained in the report.
