# Local display settings

Settings is available from the Life menu, Activities and the Saved Lives header,
including before creating a life. Light is the default. Dark uses the existing
dark palette; Use Device Appearance follows React Native's colour-scheme hook.
The choice applies after its SQLite write succeeds. Shared pages now set their
own themed status-bar contrast, including Saved Lives opened from Welcome.
Welcome and the dark death screen retain their own light status-bar text.

The version-one display record lives in the existing `preferences` table under
`app_settings`, bounded to 1,024 characters. Database representation remains four;
world/engine/content versions remain 25/24/3. Reading an older database with no
record uses Light without writing anything. Display settings are independent
of life selection, history, recovery, imports and exported life archives.

Failed writes preserve the last saved mode and retain the pending choice for
Try Again. Unreadable, oversized or unsupported settings are retained rather
than overwritten on load. The game can still open its saved life. Settings
offers a retry and an explicit confirmation to restore the default appearance.
Only that display record changes. A busy store rejects overlapping writes;
it cannot publish a setting before the actual write completes.

The native configuration now declares automatic appearance support and includes
the SDK-aligned `expo-system-ui` 57.0.4 package. Expo's
[colour-theme guidance](https://docs.expo.dev/develop/user-interface/color-themes/)
requires that module for Android development builds. Local config introspection
confirms Android's `expo_system_ui_user_interface_style=automatic` and iOS's
`UIUserInterfaceStyle=Automatic`. The module adds one locked package; the offline
SDK dependency check reports alignment. A standalone app needs a native rebuild
to include native configuration changes. This is not a successful native build
or device-theme acceptance claim.

Nine state/repository checks cover missing/corrupt/future/oversize data, real
SQLite failure/retry, unchanged complete life exports, life import/selection,
reset and overlapping writes. Two connected component checks cover saved mode,
actual page colours/status-bar props, save failure, retry, cold store reload,
cancelled/confirmed reset and changes from the colour-scheme hook. The Life-menu
opening flow also verifies Settings navigation without changing the played life.
All 107 UI/state/persistence checks across 36 suites pass in 100.108 seconds.
The final navigation/layout follow-up, strict typing, fresh Android/iOS Hermes
exports and current Metro source checks are recorded at the checkpoint.

The complete 983-test scholarship regression at `c09ec6b` precedes this display
follow-up; its game source is unchanged. Do not add overlapping test counts into
a new full-regression total. Native theme transitions, keyboard, large text,
screen-reader behaviour, Android/iOS device rendering and release acceptance
remain open. [The native attempt](NATIVE_OPENING.md) records the separate
software-emulator limitation. 
