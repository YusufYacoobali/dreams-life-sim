# Application identity and launcher artwork

Prepared 20 October 2026. This change configures reversible source settings and
original launcher artwork; it does not establish an installed or signed release.

Updated22October2026: Android package and iOS bundle identifier are now
`com.yacoobali.lifesim`, as requested. The current launcher artwork is retained;
the user deferred the proposed replacement picture. These source changes need
fresh native generation/build acceptance; the older generated candidate is stale.

## Identity

[app.json](../app.json) now declares:

| Setting | Value |
| --- | --- |
| Display name | Dreams Life Simulator |
| Android package | `com.yacoobali.lifesim` |
| iOS bundle identifier | `com.yacoobali.lifesim` |
| Public version | `1.0.0` |
| Android version code | `1` |
| iOS build number | `1` |
| URL scheme | `dreams-life` (existing) |

These identifiers do not create an app/store record. No signing credential,
EAS/cloud project, account, native build or store submission was created. Future
distributed builds must increase their build numbers. The game, persistence,
existing lives and original historical payloads are unchanged.

## Original artwork and provenance

The configured [launcher image](../assets/generated/dreams-app-icon.png) shows a
golden winding life path toward a sunrise, with coral/cream clouds on a navy
background. Its rounded dimensional forms follow the game's illustrated style;
its colours connect to the inspected existing welcome hero. It contains no text,
Expo mark or construction guides.

The image-generation tool (`image_gen.imagegen`) created the original and one
composition correction, with `transparent_background: false`:

- Original: `/workspace/generated_images/exec-0846c004-418a-4bf1-a72e-0c43076eb752.png`,
  SHA-256 `60101accbb9cf9c3c6d9585a5cfb3b5d7fdb264cf4112a9f71e15b98157e88d3`.
  The brief requested a bold soft-3D golden life-path/sun/cloud emblem, opaque
  navy square, sunset palette, simple small-size silhouette, no words or brand
  symbols, and generous adaptive-mask safety space. The first composition was
  too large for that safety space.
- Final composition edit:
  `/workspace/generated_images/exec-7d06ae94-8b50-4462-9d59-aeabdaf0a29e.png`,
  SHA-256 `260eecc71e31a4d05ba65deaff4dddabf32d4c5b9576e3faa448150983245cb9`.
  The original was supplied to the tool as its reference. The edit requested
  roughly 70% of the original emblem's size, centred within the middle 52% of
  the square while retaining the same forms, palette and full-bleed navy.

The final file is copied **unchanged** into the repository: **1,420,852 bytes,
1254 × 1254, PNG RGB**. RGB has no transparency channel. The tool returned this
square source resolution despite a 1024-pixel brief; the original is retained
without mechanical image editing. Expo's native icon pipeline derives platform
sizes during native builds. A generated 1024-pixel iOS artifact has not been
produced or accepted in this environment.

The same opaque source is configured as the main icon and Android adaptive
foreground, with background colour `#071D49`. Old starter background and
monochrome references were removed; no false transparent/monochrome layer is
claimed. All existing starter files and in-game artwork remain intact.

## Verification and remaining acceptance

- The coordinator visually reviewed the final source composition and accepted
  its readability. A read-only warm-colour pixel diagnostic bounds the emblem
  at approximately 23.4–76.1% horizontally and 27.2–75.5% vertically. Its maximum
  measured radius is 28.2% of the source width, inside a nominal 72/108 circular
  viewport. This is a source diagnostic, not launcher-mask acceptance.
- Offline `expo config --type prebuild --json` succeeds with SDK 57. The actual
  `expo-router` and `expo-sqlite` plugin functions resolve, configured identity,
  build and icon values remain exact, and the complete authored config passes
  the installed `ExpoConfig` TypeScript type. No remote schema was fetched.
- PNG header, dimensions, byte count, RGB opacity, unchanged-copy hash and
  `git diff --check` pass. A separate 48/64/96px browser preview could not run
  because local-file navigation was blocked by browser policy; no small-preview
  pass is claimed. The source image was visually reviewed directly.

Native generation, installed launcher masks/sizes, iOS icon acceptance, launch
appearance and physical-device readability remain unrun. The prior blocked
React Native AAR request was not retried. The coordinator owns fresh integrated
exports; no broad regression or device gate was repeated for this isolated
asset/configuration change. [Release audit](RELEASE_READINESS_AUDIT.md).
