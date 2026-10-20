# Release-readiness audit

Recorded 20 October 2026 against `e41a2db59149f4b6e6388f84044a339eca6d2467`:
World 31 / engine 32 / content 8 / database reader 11 / checkpoint v4.
This is a source/evidence audit. It does not establish a release candidate or
replace the coordinator's checks after integrating concurrent branches.

The game has substantial connected gameplay and scoped native acceptance.
Remaining release work includes executable build identity, original launcher
branding, release-device acceptance and distribution preparation. Those tasks
are distinct from missing gameplay and from the user's parked archive/storage
work. Current overall and feature estimates stay in [OPENING_PLAN.md](OPENING_PLAN.md).

## Evidence and limits

| Area | Observed status and evidence | Remaining acceptance |
| --- | --- | --- |
| Regression and types | The recorded hobby milestone passes 1,793 tests / 114 suites, strict app/test types and 133 UI/state/progression checks; [source-pinned record](verification/hobby-community-events-20261020.json). This audit did not rerun them. | Run appropriate gates against the final integrated source; preserve original fixtures and failed-run diagnostics. |
| Native bundles | Fresh Android and iOS Hermes exports passed for the recorded source. | Export success does not establish an installable, signed application. |
| Android interaction | Actual Android 24 software-emulator / official Expo Go checks include opening, keyboard/130% text, callbacks, purchase/finance and exact saved/cold results; consult each [verification record](verification/) for its specific scope. | Current release build, compact/large phones and supported tablets, real hardware, accessibility services, background/foreground and process interruption. |
| iOS | Linux Hermes export evidence exists. | macOS native build/simulator and real-device interaction remain unrun; no macOS runner/device was available to this audit. |
| Automatic resume | Recorded SQLite rollback/retry, exact current/backup/history and native cold-result checks pass within their stated scenarios. | Continue final-build interruptions at annual stages, pending decisions/results and realistic storage failures. No additional archive UI is required by the current user scope. |
| Life/content breadth | Minimum 250 situations, scoped current 120-seed annual policy and a separate 12-country natural hobby-event policy are recorded. | Editorial approval, balance, varied choices, integrated successful/criminal/famous lives and replayability remain independent gates. The historical 1,000-seed run is not a current-source 1,000-seed pass. |
| Performance | Scoped cloud timings and warm zero-unpack checks exist. | Named release devices, physical p95, restore time, memory and smooth scrolling; software-emulator observation is not physical timing. |
| Country behavior | Twelve country packs and nine currencies are implemented with extensive mathematical/gameplay checks. | Country rules are explicitly authored approximations in [COUNTRY_RULES.md](COUNTRY_RULES.md); consistency tests do not verify national source accuracy. |

## Concrete source and release-configuration gaps

1. **Build identity is not configured.** [app.json](../app.json) contains the
   display name, slug, version and URL scheme, but no `ios.bundleIdentifier`,
   `android.package`, `ios.buildNumber` or `android.versionCode`. There is no
   `eas.json` or checked-in native project. EAS itself is optional; a documented
   local build path is sufficient. Before a distributable build, choose stable
   identifiers, establish monotonically increasing build numbers and select the
   intended distribution method. Signing credentials and store/account actions
   have not been performed.
2. **Launcher branding is still the Expo starter.** The configured
   [icon](../assets/icon.png) was visually inspected: it displays the blue Expo
   mark and construction guides. Android adaptive layers also remain the starter
   files. Replace them with original game branding, verify adaptive/monochrome
   masking and launch appearance, and inspect installed release builds. Existing
   generated in-game illustrations are a separate asset family and do not close
   launcher/store artwork acceptance.
3. **Hosted regression automation was absent.** This milestone adds
   [quality.yml](../.github/workflows/quality.yml): Node 24, locked `npm ci`, strict
   app/test types and in-band Jest, with a 45-minute job timeout and read-only
   repository permission. It runs on `work`/`main` pushes, pull requests and
   manual dispatch. Checkout does not retain credentials. It contains no
   deployment, signing, native/Gradle build or secret requirement. Its first
   GitHub-hosted execution is unrun at this audit checkpoint. Branch protection
   and required-check configuration are also unverified.
4. **Top-level documentation was stale.** The README claimed 70 situations and
   that Android opening interactions were prevented by old emulator hangs.
   It now links current progress/acceptance and accurately distinguishes scoped
   Expo Go evidence from remaining standalone, physical and iOS checks. Historic
   Phase 0 documents still describe their original planning state; current
   implementation evidence is authoritative in [PROGRESS.md](PROGRESS.md).

## Offline, assets and failure handling

Source searches of `app/` and `src/` found no `fetch`, `XMLHttpRequest`, HTTP URL
asset source, remote font loading, analytics or tracking call. The runtime art
components use static `require` references to locally bundled PNGs. The 13 unique
PNG files directly referenced by those source calls total **23,090,937 bytes**
(about 22.02 MiB) on this source snapshot. This measures source file bytes only;
it excludes native/vector-font/package overhead, decoded image memory and final
APK/IPA size. It does not establish the provisional 30 MB installed art budget.

Generated-art provenance is documented in
[assets/generated/README.md](../assets/generated/README.md). The root MIT license
retains Expo's starter notice. A distributable third-party notice inventory and
asset-rights/provenance review still need to be checked against the shipped
dependency graph and final branding. This audit did not replace the license or
claim legal clearance.

The application has no custom exported Expo Router `ErrorBoundary` or not-found
route; it uses the framework's defaults. Domain/storage failures are handled by
the stores and rendered action/bootstrap errors. This absence alone is not a
verified crash defect. Final-build acceptance should deliberately exercise an
unexpected rendering failure and invalid deep link, then verify the default
recovery behavior preserves the saved life and offers a usable route back.
Do not replace existing atomic persistence or introduce broad catches that hide
failed commands merely to pass a visual check.

A true **standalone airplane-mode** opening/play/save/force-stop/resume test is
still needed. Source searches cannot establish SDK-level network behavior,
merged native permissions, Android backup behavior, privacy manifests or store
data-safety answers. Inspect those in actual generated release artifacts and
prepare truthful privacy/support information before distribution.

## Build/environment boundary

The prior custom Android build could not obtain its required React Native AAR
from `repo.reactnative.dev`; automatic approval review rejected that access.
This audit made no request to that host, did not retry the build and did not use
CI, another repository, proxy or downloaded replacement to bypass the decision.
No iOS native toolchain was available. These are blocked/unrun native-build
checks, not reasons to stop unrelated gameplay and local quality work.

## Next release actions

1. Integrate independent gameplay/UI streams and run the coordinator's relevant
   regression, strict types, exports, source-pinned natural journeys and native
   acceptance. Inspect the new hosted CI result after the safe push.
2. Prepare original launcher/adaptive branding and stable application/build
   identity; document a concrete build/signing path without exposing secrets.
3. Once native build dependencies and suitable devices are available, produce
   release builds and execute offline/resume, permission/privacy, reference,
   accessibility, interruption and physical-performance checks with named
   devices/build revisions and captured discrepancies.
4. Complete the existing scenario/content/balance plan, first-minute and
   continuous-session reviews, and full lives. Preserve explicit failures,
   blocked and unrun cases. Store metadata, mature-content rating, privacy and
   support information, third-party notices and any publication remain later
   distribution work; no submission has occurred.

Local verification parsed the workflow as YAML, checked its events, read-only
permissions, Node version, timeout and exact commands, confirmed package/lock
dependency alignment, validated the new document links, and passed
`git diff --check`. No Jest, export, Gradle, native or hosted CI run was performed
for this documentation/workflow change.

No completion percentage or quality gate was raised by this documentation/CI
milestone. Additional import/export/sharing and history-storage work remain
parked; reliable automatic saving and exact resume remain required.
