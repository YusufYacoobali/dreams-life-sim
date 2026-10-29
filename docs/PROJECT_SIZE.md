# Project and app size

## EAS archive correction — 25 October 2026

The EAS upload was still about 559 MB because `/.git/` did not remove the
temporary shallow clone's Git data. EAS checks the bare `.git` path before
removing that directory; a directory-only rule with a trailing slash misses
the check. The Git objects retain copies of tracked documentation, review
media and design inputs even when those files are excluded from the build.
Use `/.git` without a trailing slash in `.easignore`.

Actual archives created with EAS CLI 25.3.0's `makeProjectTarballAsync` and its
normal Git client (`requireCommit: false`) measured:

| Compressed EAS archive | Bytes | MiB |
| --- | ---: | ---: |
| Before | 585,443,417 | 558.32 |
| After | 150,533,522 | 143.56 |

This is a **74.29% reduction**, below 200 MB even in decimal units. The old
archive contained 434,820,866 bytes of Git metadata; the new archive has no
`.git` directory. SHA-256 comparisons confirm that all 1,749 files under
`app/`, `src/`, `plugins/` and `assets/` are still included and byte-identical,
including all 1,230 asset files. The only changed non-Git archive file is
`.easignore`. Excluded development files remain excluded. This verification
packs and inspects the source upload locally; it does not run a cloud build
or measure an installed app.

To inspect future uploads without starting a cloud build, use the archive
stage from a configured Expo/EAS checkout:

```sh
npx eas-cli@latest build:inspect --platform android --profile production --stage archive --output ../dreams-eas-archive
```

Keep the output outside the project so it cannot enter the next upload.
The resulting directory should contain the runtime files and native plugins,
with no `.git` directory. It is the extracted source archive, not a native build.

## Size cleanup — 23 October 2026

Size cleanup on 23 October 2026, compared with `73e9f48`, including Cult Leader and the event-writing update. Decimal MB; checkout/context values are rounded logical file sizes, not compressed downloads.

| Scope | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Tracked checkout | 565.5 MB | about 448.7 MB | about 21% |
| Source eligible for an EAS upload | about 565 MB | about 155 MB | about 73% |
| Android exported assets | 157.20 MB | 149.53 MB | 7.67 MB / 4.9% |
| iOS exported assets | 156.23 MB | 148.56 MB | 7.67 MB / 4.9% |

The asset baseline sums original upstream PNG encodings in the final platform asset sets, with package assets retaining their measured exported sizes. These exports measure the local asset payload, not an APK/AAB/IPA or store download. Android release code minification and resource shrinking are enabled through `plugins/withReleaseShrinking.cjs`, using the switches consumed by Expo's SDK 57 template. Their native size benefit needs a fresh release build. Production EAS builds already use store distribution.

## Changes

- Losslessly optimized runtime PNG encoding. Each output is decoded and compared for exact RGBA pixels, dimensions, PNG depth and colour type before replacement. Transparency, source artwork, portrait registrations and the selected launcher icon are preserved. Current asset manifests and the notice inventory reflect the new encoded hashes.
- Removed 105 obsolete files: V1 portrait outputs/prototypes, replaced launcher templates and their two retired prototype review tools. Current V2 assets and every saved appearance ID remain available.
- Replaced embedded base64 images in five review pages with shared lossless snapshots, saving about 34 MB. Review media uses browser-supported lossless WebP where smaller; runtime images retain PNG. The snapshots remain separate from mutable app artwork. Their filenames identify the original embedded source hash.
- Gzipped 127 older large records from 44.94 MB to 15.67 MB. Every original byte is retained and verified by SHA-256. Historical prose, commands and recorded checksums stay intact; download links identify compressed copies.
- Removed 796 superseded screenshots, UI hierarchy XML and console captures (38.08 MB) from the working tree. Written findings, structured records, all test fixtures and saved-life/database data remain. [The archive index](verification/ARCHIVED_ARTIFACTS.md) links to the exact earlier Git revision.
- Added `.easignore` to exclude documentation, design inputs, tests, tools and other development artifacts from cloud build uploads. Native plugins and runtime assets are included. Ordinary logs and coverage outputs are ignored by Git.

## Keeping it small

After generating artwork, install the optional Python tooling and optimize its runtime output:

```sh
python -m pip install -r tools/requirements-asset-optimization.txt
python tools/optimize-runtime-pngs.py
python tools/compact-review-html.py
node tools/generate-third-party-notices.cjs
```

Review HTML must travel with `docs/verification/media`. Restore exact older structured records into a temporary tree when investigating them:

```sh
python tools/compact-verification-records.py --restore /tmp/dreams-review-records
```

The compression index records original paths and hashes. Existing historical checksums apply to the decompressed bytes. Original source encodings and deleted artifacts remain available in Git; no history was rewritten. Full historical clones still contain old binary blobs. A fresh shallow clone (`git clone --depth 1 --branch work …`) avoids most historical storage. `node_modules` remains ignored development/build tooling.

## Verification

All 67 affected tests in seven suites pass, including the full portrait combination sweep and the integrated Cult Leader UI. After integrating the latest event-writing changes, its 35 affected artwork cases pass again. Final strict app/test types, the 488-module import graph and the current notices check pass. All 127 compressed records restore to their exact original bytes. The five compacted review pages load in Chromium with no JavaScript errors or broken images, including 1,296 ordinary image nodes and 407 SVG images in the V2 implementation page. Both offline platform exports succeed and have valid Hermes headers. All 1,177 statically referenced runtime PNGs retain exact upstream RGBA pixels and colour profiles, and both platforms bundle byte-identical copies of their optimized source. Gameplay, world/save versions, RNG, fixtures and prices are unchanged by this cleanup.
