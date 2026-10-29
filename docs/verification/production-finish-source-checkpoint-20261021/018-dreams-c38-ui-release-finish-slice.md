# Bounded C38 UI, accessibility and release acceptance slice

Read-only source/spec/evidence audit at exact
`ace1e38e12ae2493501a30e6f003201e0fd6ab41` in
`/workspace/dreams-worktrees/integration-retirement-accessibility`.
No source edits, tests, runtime replay, device actions, installations or new
visual acceptance occurred. This is a finite finish checklist, not another
27-reference reconciliation or an assertion that C37/C38 is accepted.

## Concrete findings

No additional missing UI implementation was demonstrated in this bounded slice.
The main remaining categories are implemented-but-unaccepted and release/device
work. Do not count the following existing features as absent:

- The exact four tabs are implemented (`src/ui/GameShell.tsx:6`); the canonical
  inventory exists in `docs/planning/screens-and-navigation.md:31`.
- Custom/random creation, appearance, newborn Begin Life and first-year choices
  exist (`app/new-life.tsx`, `app/birth.tsx`, `src/game/engine.ts:191`). The recent
  appearance labels describe existing options (`src/ui/appearanceLabels.ts:4`),
  rather than adding new appearance mechanics.
- Shared scrolling dialogs, busy/disabled choices, error alerts, effect signs,
  safe-area spacing and reduced-motion behavior exist
  (`src/ui/EventModal.tsx:31`, `:42`, `:49`, `:53`, `:57`). Shared primary controls
  have useful target dimensions (`src/ui/components.tsx:128`), and tab targets
  have minimum height 56 (`src/ui/GameShell.tsx`). Actual service focus/reading
  order remains an acceptance question, not a proven missing focus feature.
- Death has the dedicated generated illustration, factual biography/estate and
  the specified navigation actions (`app/death.tsx:23` onward); earlier child
  and no-child domain/UI checks are not a final-device visual pass.
- Original generated PNGs and typed family/crop registries exist
  (`assets/generated/README.md`, `src/assets/Illustration.tsx:5`,
  `src/assets/CharacterPortrait.tsx:6`, `src/assets/CareerArt.tsx`,
  `src/assets/CatalogArt.tsx`). The old Phase 0 artwork table saying all assets
  are planned is historical; it does not prove the current art is missing.
  Reuse of appropriate category art is expressly allowed by spec 8.4. No new
  accessory, eye-color or per-person image catalogue is justified by this audit.

## Finite required finish criteria

1. **Current opening acceptance — implemented/unaccepted.** Close the genuine
   custom newborn -> Begin Life -> first birthday decision -> result/ack/restart
   journey under the final pinned source. Record chosen visible actions and
   preserve every baseline life/history row. Treat Random Life as a separate
   observed journey. Spec 15 and 13.4 require this first-minute experience; raw
   helper/syntax passes are not gameplay or visual acceptance.
2. **Matched major-family UI matrix — implemented/unaccepted.** Use the existing
   reference register V01–V14 and necessary N flows, with one tracked discrepancy
   list. Cover opening; Life/profile/journal/statistics; Assets/annual finance;
   purchase/investing; people/family; school/admissions; ordinary work; special
   careers/business; health; legal/prison; travel/pets/leisure; social/fame;
   extras/settings; death/legacy. Check normal/large text, one long or empty/
   refused state, back/source-tab return, scrolling and safe areas. Preserve and
   reuse valid older observations where exact unchanged source lineage is shown;
   do not treat every route/state/platform combination as a new feature.
   Acceptance basis: spec 6.1, 6.4, 7, 13.4 and
   `docs/planning/artwork-and-delivery.md:183`.
3. **Accessibility and real feedback — implemented/unaccepted.** On the final
   build use TalkBack/VoiceOver for ordered discovery, selected/disabled reasons,
   errors/results and return focus. Check OS/app Reduce Motion, actual sound
   enable/disable/silent mode/background and physical haptics. Source and mocked
   tests cover lifecycle/durability; hardware outcomes remain explicitly open
   in `docs/FEEDBACK_SETTINGS.md:25` and `:35`. Test representative compact and
   large portrait phones and the supported tablet shell; `app.json` explicitly
   enables iPad. Do not infer actual iOS acceptance from an iOS JS export.
4. **Installable release artifacts — platform blocked/unrun.** Produce named
   standalone Android/iOS builds with configured identity/icon/version, inspect
   actual merged permissions/native dependencies and packaged notices, then
   verify airplane-mode creation/play/save/process-stop/resume and an upgrade
   retaining an old save. The last recorded Android AAR-host access refusal and
   unavailable macOS/iOS environment are in
   `docs/RELEASE_READINESS_AUDIT.md:115` onward; this audit did not retry or prove
   those constraints changed. The configured bundle/package ID is already in
   `app.json`; no EAS-specific feature is required. The npm notice inventory is
   prepared, while actual native artifact enumeration remains open
   (`docs/THIRD_PARTY_INVENTORY.md:70`).
5. **Named release-device responsiveness — implemented/unaccepted.** Measure
   usable cold start, action/annual latency, memory and scrolling on real release
   builds with developed and 1,000-contact worlds. Compare to the provisional
   budgets in `docs/planning/artwork-and-delivery.md:201`; cloud warm zero-unpack
   medians and software-emulator pixels are different evidence. Preserve the
   user's quick-button priority; fix measured failures rather than add another
   save-tool or generic performance framework.
6. **Actual session and distribution closeout — unaccepted release work.** Record
   one uninterrupted 30-minute session and several complete lives, and close
   resulting concrete defects (`artwork-and-delivery.md:217`, spec15). Final
   privacy/support/store metadata, rating, signing and distribution preparation
   remain in the release audit. No store submission, remote account action or
   publication is implied by this audit. The broader gameplay/scenario/editorial
   criteria are owned by the main reconciliation, not duplicated here.

## Evidence and scope boundaries

The accepted 25 PNG/XML register is pinned to historical
`73cedc7643fa3cbcd0ad32dfa27abfb59dac8aaa`
(`docs/verification/opening-completion-20261020/native/accepted-captures.json:4`).
It explicitly did not create a new life in that increment and records two actual
saved-result cold reopens, not four. The next published record is likewise scoped
to `ed296f91082a96b2fabe8973864bf6dba28344b3`
(`docs/verification/friends-editorial-20261020.json:5`). Neither is blanket
acceptance of current ace1e38. Root's current C37 native/full work and C38 union
remain separate; pending Story ordinary-life/Hobby busy-year branches are not
counted here.

Import/export/sharing, Time Machine breadth and storage/history optimization are
**parked by the user**, not completion blockers in this finish list. Automatic
save/exact resume and viewing previous lives remain required. Original art and
the existing inventory should be preserved, not regenerated solely because a
planning paragraph is stale.

For planning only: functional UI/source coverage roughly 85–90%; visual and
accessibility acceptance roughly 55–65%; standalone/physical/iOS release readiness
roughly 10–20%. These ranges reflect the implemented routes/components versus
the concrete unaccepted matrix above; they are not measured scores or a reason
to raise the published overall 65% before the coordinator closes current gates.
No more precise denominator was established by this bounded audit.
