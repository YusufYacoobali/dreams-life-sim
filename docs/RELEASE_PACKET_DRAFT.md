# Local release packet — unpublished draft

Updated21October2026: runtime/candidateb75e617 includes all confirmed feature gaps and the first-month campus planning fix. Focused/types, ordinary Android campus/year/cold resume and final Android/iOS Hermes bundle checks pass; its exact-source automatic gate passed2,821tests/221suites and strict app/all-test types. No standalone artifact or publication is claimed. [Current handoff](HANDOFF.md) and [release audit](RELEASE_READINESS_AUDIT.md) identify exact results, remaining device/signing work and the unchanged dependency-access block.

## Candidate identity and listing

| Field | Draft/source value |
| --- | --- |
| Name | Dreams Life Simulator |
| Package/bundle ID | `com.yusufyacoobali.dreamslifesim` |
| Public version | 1.0.0 |
| Android code / iOS build | 1 / 1; increment for later distributed builds as appropriate |
| Direction | Free offline gameplay; no account, subscription or paywall required by the approved design |
| Category | Game / Simulation; store selection unsubmitted |
| Audience/content | Adults; non-graphic mature themes. Actual rating questionnaire remains required; no rating assigned here. |
| Support | Publisher-provided public support destination/contact still required |
| Privacy | Public policy destination still required; check draft against the distributed artifact |
| Screenshots/art | Use accepted release-build captures and original source-proven art; this packet approves no store-upload asset set |

Draft short description:

> Make choices, build relationships and shape a life through the years.

Draft description:

> Create a character or discover a random life, then make choices as the years
> unfold. Navigate school, work, relationships, family, money and unexpected
> events. Explore ordinary ambitions and unusual careers, with consequences
> that follow the people and history in your saved life.
>
> Play locally and resume where you left off. The setting, people and systems
> are fictional; country rules are authored gameplay approximations rather than
> legal, financial or medical guidance. The game includes non-graphic mature
> themes such as crime, illness and loss.

Before publication, verify the selected release build actually delivers offline
play, exact resume and every advertised destination. Do not use Expo overlays,
development menus, placeholder state or artificially forced outcomes as release
screenshots.

## Privacy information — draft for owner review

Candidate player-facing text:

> Dreams Life Simulator stores your characters, choices, settings and saved
> life history on your device. You can enter a character name and choose
> fictional-life details. These are used to play and resume that life.
>
> The current game does not require a developer account or provide an in-game
> cloud-sync service. Your operating system or device backup settings may
> include the app's local data, including saved lives, in a platform backup.
> That handling depends on your device, platform account and settings.
>
> If you use an available platform file/share action, the file goes to the
> location or application you choose. That provider's handling is outside the
> game's local save mechanism. Optional sound and haptic settings control local
> feedback; the configured game does not request microphone recording.
>
> For support or privacy questions: [publisher must supply the actual public
> contact and policy destination before publication].

The placeholder is deliberately unresolved; this is not a published policy.
App/source searches identify no developer endpoint, analytics/ad SDK call, HTTP
asset or remote font request. Generated Android source still declares Internet
and legacy storage/overlay permissions. Dependency-merged SDK behavior has not
been inspected in a release build. This draft therefore does **not** certify or
submit a store “no data collected” answer. Review actual release dependencies,
permissions, OS backup and any chosen distribution diagnostics before forms.
No GDPR/COPPA, content-rating or other legal-compliance conclusion is invented.

## Concrete build handoff

The current ignored candidate is
`/workspace/dreams-worktrees/native-prebuild-gameplay/android`; original tracked
files remain exact after restoring prebuild's two package script changes.
[Portable inputs and inspected sources](verification/native-prebuild-current-20261021/README.md)
retain the command/template/exit/source/lock. The unbuilt native project is not
merged into the application.

1. Preserve active API24/AVD data, all saved DB copies, frozen source and existing
   evidence. JDK17/platform36/BuildTools35+36/NDK27.1/CMake3.22.1/Gradle9.3.1
   are already installed. The guarded wrapper matches4e and checks disk/memory
   floors before launch; package/config/branding inputs remain unchanged from
   successful offline prebuild, so do not regenerate it unnecessarily.
2. Resolve the separately denied native dependency boundary through the
   environment owner's supported access process. No unchanged denied-host retry,
   alternate mirror/proxy or CI bypass. The actual12:10Gradle attempt returned403 at the required React0.86.3 AAR
   redirect host. Fresh enforced environment73 still excludes that host.
3. Once dependencies/toolchain are legitimately available, compile a standalone
   candidate and inspect merged manifests/resources/native libraries/notices.
   The generated release profile uses template debug signing and must not be
   distributed as production. Supply real signing through the owner's chosen
   secure process; this packet creates no keystore/account.
4. Record the candidate hash/version and test installed opening/play/save/
   force-stop/resume with networking unavailable. Deep-link/error recovery,
   backup implications, prompts, fonts, launcher masks, feedback, keyboard/large
   text, background/foreground and interruptions require actual outcomes.
5. Run macOS/iOS and physical accessibility/performance acceptance with named
   devices/builds when available. Keep unavailable checks unrun. Finish scoped
   content/scenario/session/balance acceptance through the existing coordinator
   plan; do not inflate natural coverage or add reused country seeds to totals.
6. Fill real support/privacy destinations, rating/data-safety answers, distribution
   method, screenshots and metadata after artifact review. Store publication
   remains a separate action; no upload or external message occurs here.

Parked import/export/sharing and file/history breadth is not a new feature gate.
Preserve existing functions/old lives and finish automatic save/resume and the
remaining production acceptance.
