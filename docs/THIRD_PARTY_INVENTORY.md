# Candidate third-party notice inventory

[THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) and the
[machine-readable inventory](third-party-inventory.json) record actual local
dependency metadata and installed notice files. They are release preparation,
not legal clearance or a list of everything shipped in a native application.
The existing [Expo starter MIT notice](../LICENSE) remains unchanged.

## Reproduce and verify

Use the repository's locked, already-installed dependencies:

```sh
node tools/generate-third-party-notices.cjs
node tools/generate-third-party-notices.cjs --check
node tools/generate-third-party-notices.cjs --output-dir /tmp/dreams-notice-check
```

The generator uses only Node built-ins and reads package files as data. It does
not install dependencies, execute their JavaScript, fetch web resources, change
the lockfile, infer SPDX values, edit artwork or modify the root license. It
records hashes of the manifest, lockfile and app configuration. Sorting is
explicit; no generation timestamp or absolute workspace path enters output.
Identical inputs and installed evidence produce byte-identical output. Another
platform or dependency installation can change optional availability or evidence;
regenerate for that installation and review the differences.

## Selection and exact evidence

- Include all root `dependencies` and lockfile package records whose `dev` flag
  is not `true`. Expo's dependency graph includes build tooling; these records
  are deliberately overinclusive and are not a shipped-library count.
- Record the locked and installed versions, metadata licenses, platform/CPU
  restrictions, optional flag, missing package/manifest and version mismatch.
  An installed version mismatch does not prove the locked version's license.
- Search installed package trees recursively for license, licence, copying,
  copyright, notice and third-party-notice filenames, including embedded vendor
  notices. Skip nested `node_modules`, `.git`, `.cache` and directory symlinks;
  each selected nested package is inventoried separately. Files resolving outside
  the actual installation tree are excluded explicitly.
- Preserve readable UTF-8 contents as exact JSON strings and deduplicate by the
  original file-byte SHA-256. Markdown code fences make notice contents data.
  The Markdown display normalizes line endings and trailing line whitespace;
  the JSON retains those original bytes through its exact UTF-8 text strings.
  Unreadable/non-UTF-8 files and absent notice files remain explicit; filenames
  and prose do not manufacture SPDX metadata or legal conclusions.

The current `exit@0.1.2` lock entry and installed manifest omit license metadata,
while its installed `LICENSE-MIT` file contains an MIT notice. The artifact keeps
metadata missing and preserves that exact file/text evidence. It does not assign
an inferred metadata license.

## Fonts, artwork and final artifacts

The source scan identifies explicit default imports from
`@expo/vector-icons/FAMILY`, records their source paths and installed TTF bytes,
and includes the package's embedded vendor notices. Current game imports use
Ionicons. Package MIT metadata does not by itself establish every font's
licensing/attribution terms. Named/dynamic imports, SDK resources and final Metro
asset selection need their own final-artifact review.

Source/config-referenced PNGs are fingerprinted separately. Project-generated
art provenance is in [the generated-art record](../assets/generated/README.md),
[launcher provenance](APP_IDENTITY_AND_BRANDING.md) and the
[ordinary-hobby source manifest](planning/drafts/ordinary-hobby-art.json).
Historic draft/candidate wording in an art record is not a current runtime or
rights conclusion. The tool does not infer image rights from appearance, names
or a hash, and does not modify original images.

The final APK/IPA, native Pods/AARs, Android/iOS system components, OS fonts,
SDK-bundled assets, optional-platform code and store artwork are not fully
enumerated by an npm lockfile. When native release builds become available,
compare their actual dependency/resource graph and notices with this candidate,
preserve applicable upstream notices, and resolve discrepancies before claiming
distribution readiness. No signing, store action, blocked build/network retry or
device acceptance is part of this inventory.

## Recorded local validation

### SDK 57 action-sound refresh

The `8366895` integration source adds `expo-audio ~57.0.5` and promotes the
already locked `expo-asset 57.0.20` to a direct dependency. Regeneration uses
the same isolated dependency installation as the reviewed Settings change;
no dependency is installed or fetched for this inventory refresh.

The refreshed candidate contains 25 direct dependencies, 766 non-dev lock
entries, 756 installed version matches, ten absent optional packages and zero
version mismatches. Its 718 readable notice files still deduplicate to the same
276 exact text blocks. All previous text strings, byte counts and SHA-256 hashes
remain unchanged. The existing Expo text block gains the Audio source and the
promoted Asset source replaces its former nested installation path.

Audio's lock and installed manifest both report MIT. Its installed `LICENSE`
contains the original 2015-present 650 Industries, Inc. notice: 1,106 bytes,
SHA-256 `fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4`.
The generated outputs preserve that actual text rather than assigning terms
from a package name. This is npm source/install evidence; it does not establish
the complete native Audio dependency/notice graph or distribution clearance.

The original local action cue is separately documented in
[its source record](../assets/audio/README.md) and
[the feedback scope](FEEDBACK_SETTINGS.md). The generator's stated image/font
scan does not fingerprint WAV assets. This refresh does not expand that scan or
claim a complete shipped-resource inventory.

The current-input check and a fresh separate-directory regeneration both pass;
both generated artifacts match byte for byte. Every retained JSON text block
and all 718 readable source files match their recorded original-byte hashes.
The ten optional absences and 54 entries without readable notice files retain
their explicit limitations. The root license, generator, installed files,
game/persistence, dependencies and app configuration are unchanged by this
refresh; no game, native or export gate was run.

### Initial inventory baseline

On the `944019d` source baseline, the inventory records 23 direct dependencies,
765 candidate non-dev lock entries, 755 matching installed versions and ten
absent optional packages. There are zero installed-version mismatches. The 717
readable notice files deduplicate to 276 exact byte/text blocks. Fifty-four
entries have no readable matching notice file in this installation, including
the ten absent optional packages; their available metadata remains recorded.
One detected font family and fourteen source/config image references have
separate binary evidence.

Fresh output in a separate directory matches both generated artifacts byte for
byte. Every text block reconstructs its source-byte SHA-256 from the exact JSON
string, and all recorded source files match those hashes. The missing `exit`
metadata/actual notice case, optional absences, zero version mismatches and
embedded vector-icon vendor notice were checked. The generator syntax and
staged whitespace checks pass. Existing game, persistence, tests, manifest,
lockfile, app configuration and root license are unchanged; no broad game/build
gate was rerun for these new release-preparation files.
