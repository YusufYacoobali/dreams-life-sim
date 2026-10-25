# God Mode testing

Open a living, acknowledged life, then **Settings → God Mode → Open God Mode Editor**. Enabling the toggle also shows a shortcut in Profile and Assets. Switching it off leaves saved changes intact.

## Build access

As reaffirmed on 25 October 2026, God Mode is temporarily available in **all builds**, including production/store builds, at the owner's request for testing. The release audit's production-off change was reverted. `app.config.cjs` embeds `extra.godModeTesting=true` for every profile, without requiring internal-distribution environment switches. Metro/Expo Go development access also remains available.

The Settings toggle remains off until enabled, and the loaded preference still gates the editor, shortcuts, playground and save commands. Switching off preserves prior edits. An already installed APK needs rebuilding and reinstalling to receive the updated configuration; the present app does not configure OTA updates.

`src/access/godMode.ts` contains the access policy; `buildAccess.ts` supplies trusted build configuration. `createGameStore` denies editing unless its access dependency allows it, and the native store combines build access with the loaded testing preference. Missing/invalid capability metadata still fails closed outside development. Editing commands have no knowledge of purchases. No purchase SDK, entitlement, subscription or paywall is implemented.

## Editor

The four tabs stage changes until **Save Changes**. **Reset Changes** restores the values at editor opening. **Cancel** and header Back offer to discard unsaved edits. Reductions in money, stats, skills and relationship values, or increases in stress, require confirmation. All commands commit together. A conflicting revision requires **Reload Values**, which reads the current save and discards the stale draft.

- Money: set, add or subtract exact amounts on every existing account owned by the active character. Presets are 10K, 100K, 1M, 10M and 1B major units, formatted in each account's currency using the character's locale. JPY allows no decimals; the other eight currencies allow two. Negative balances and withdrawals from locked inheritance are rejected.
- Stats: happiness, health, smarts, looks, respect, energy, fitness, stress, discipline and fame. Every field has an accessible adjustable slider and a whole-number input from 0–100. Max All includes stress at 100; Perfect Stats uses stress at 0; Min All uses every value at 0.
- Skills: acting, music, sport, politics, modeling, content, science and service. Additional editable percentages are fertility, current grades and public image, taken from the existing schemas.
- Relationships: select an existing relationship involving the active character and edit strength/trust. Roles, romance/marriage records, parentage, custody and memories are preserved.

Health 0 does not kill the character during the edit, but can cause death on the next normal Age Up. Other gameplay consequences remain enabled. Fame is normally recalculated from followers and earned fame: the editor updates the earned-fame base and peak, but an existing audience can subsequently raise fame above a requested low value. It does not rewrite follower history. Edited grades update the active study-course mirror without rewriting historical grades, qualifications or tuition receipts.

## Save integrity

`src/game/godMode.ts` validates typed commands and applies them to `copyWorld()` before a full immutable-world validation. It advances only the revision. Date, all game RNG streams, active/deferred events, annual cursor and unrelated records remain intact.

Money goes through `post()` with category `god-mode-adjustment`, zero debt delta and the account's own currency. It reconciles with the existing ledger and appears under **God Mode adjustments** in Finances. It does not count as earnings, taxable income, support income or loan proceeds.

`gameStore.editGodMode()` authorizes, validates and commits through the normal repository. A unique retry identifier prevents separate editor sessions from sharing receipts. Failed writes publish no new world. The automatic **Before God Mode** checkpoint, backup, receipt and changed life commit in the same SQLite transaction. Existing Time Machine, export/import and recovery support the resulting saves without a World/schema-version migration.

## Verification

On 25 October 2026, restoring the owner's all-build testing requirement passed
**23 cases across three affected access/config/editor suites**, strict app/test
types and the notice check. Actual production/store configuration resolves
`godModeTesting=true`, including with a conflicting environment flag. Real
SQLite edit/save/cold-load flows pass for internal and production builds; the
saved toggle still prevents further edits when off. Gameplay and save code are
unchanged by this configuration restoration.

On 24 October 2026, the all-build testing override passed **109 tests across six focused suites**, app/test TypeScript checks, runtime import-cycle checks and a production Android Metro/Hermes export. The actual Expo public production configuration resolves `godModeTesting=true` with store distribution and no testing environment switch. Editor UI/save journeys use the real build gate with `__DEV__=false`, including enable, edit, save/reload, failed writes, conflicts and disabling. Access cases cover production, development, internal, preview and unknown profiles. This verifies configuration, UI/store integration and bundling; it does not establish installation on a physical device.

The dedicated suites are `tests/game/god-mode.test.ts`, `tests/state/god-mode-save.test.ts`, `tests/state/god-mode-access.test.ts` and `tests/ui/god-mode-flow.test.tsx`. They exercise all stat/skill boundaries, all nine currencies, protected cash, relationship and study invariants, atomic failure/retry, conflicts, checkpoint branches, archives, cold-store reload, ordinary gameplay consequences, access gating and actual editor interaction.

On 22 October 2026, after integrating startup fix `2668ad4`, all **234 tests across 20 affected suites** pass, including the dedicated suites and existing store, preferences, repository, history, copying, career, study, Settings, Profile, Assets/Bank, Finances, feedback, startup, runtime-import and native-worklet checks. Both app and test TypeScript checks pass, and 393 runtime modules have no import cycles. Resolved Expo configuration reports testing access `true` for the configured preview profile and `false` for production even with testing switches present. The production Android/iOS Hermes export exits successfully, with both bundle headers verified. The dependency-notices check passes. The full repository regression suite was not completed.

Run `npm run typecheck` and the focused Jest suites. Device slider gestures, spoken screen-reader output and actual internal/store binary installation require native-device verification; component tests and bundle generation do not establish those results.

## Changed files

| Area | Files |
| --- | --- |
| Access and build configuration | `src/access/godMode.ts`, `src/access/buildAccess.ts`, `app.config.cjs`, `eas.json` |
| Editor and navigation | `app/god-mode.tsx`, `src/ui/GodModeEditor.tsx`, `src/ui/GodModeAccess.tsx`, `app/settings.tsx`, `app/_layout.tsx`, `app/(game)/profile.tsx`, `app/(game)/(tabs)/assets.tsx` |
| Validated commands and draft | `src/game/godMode.ts`, `src/game/godModeDraft.ts`, `src/game/systems/social.ts` |
| Save integration and preferences | `src/state/gameStore.ts`, `src/state/useGame.ts`, `src/state/preferencesStore.ts`, `src/state/usePreferences.ts`, `src/persistence/repository.ts` |
| Finance presentation | `src/ui/annualFinances.ts` |
| Tests and native test setup | `tests/game/god-mode.test.ts`, `tests/state/god-mode-save.test.ts`, `tests/state/god-mode-access.test.ts`, `tests/ui/god-mode-flow.test.tsx`, `tests/state/preferencesStore.test.ts`, `tests/ui/feedback-settings-flow.test.tsx`, `tests/support/native-ui.cjs` |
| Dependency and documentation | `package.json`, `package-lock.json`, `THIRD_PARTY_NOTICES.md`, `docs/third-party-inventory.json`, `README.md`, `docs/GOD_MODE.md` |
