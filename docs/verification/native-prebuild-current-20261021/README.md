# Current offline Android native-source preparation

Bounded unchanged command logs/source excerpts and an inspection of a generated,
unbuilt, ignored Android project. This is not a merged/signed release artifact
or new device/gameplay acceptance.

Root `/workspace/dreams-worktrees/native-prebuild-current`, exact
`83adaea6f92523d04a27df2e77b11e0a8b14ef1d`, matches703 combined UI source files.
The shared installation has 757 lock records; repository lock SHA:
`0079491a8e148250f4d4fda7c9fab44d0e1bcb126dea893d06f269489e6a4e1b`.

Actual command, exit0:

```sh
CI=1 EXPO_OFFLINE=1 EXPO_NO_GIT_STATUS=1 EXPO_NO_TELEMETRY=1 \
__UNSAFE_EXPO_HOME_DIRECTORY=/workspace/.cache/dreams-expo-prebuild-current \
TMPDIR=/tmp/dreams-native-prebuild-current-cache \
node ./node_modules/expo/bin/cli prebuild --platform android --no-install \
  --template /workspace/dreams-life-sim/node_modules/expo/template.tgz \
  --skip-dependency-update react,react-native
```

The explicit installed template avoids a remote template lookup. The no-Git-status
flag avoids a nested CLI probe in the clean isolated tree; direct Git head/status
are retained. No install/Gradle/download, denied host, device input, production key
or iOS generation was requested. Actual start/closure/input files accompany
`prebuild.out`/`prebuild.exit`.

All 703 source bytes match before and after. Only two package convenience scripts
were rewritten; `package-after-prebuild.json` preserves them and the original
`package-before.json` was restored exactly. Both actual tracked status files are
empty; `ignored-native-path.txt` confirms ignored Android output. The native tree
remains local for a later legitimate toolchain/dependency build.

`inspection.json` hashes 42 generated files and 20 image headers, identity,
source-default toolchain, permission/backup/profile facts and limits. Template
development signing material was excluded from reads/copies/hashes. Copied native
texts are exact bytes with paths in the inspection; none is merged into the
application. Final fonts/APK/merged-manifest acceptance is not implied.
`sdk-preparation.json` identifies package IDs/archive sizes from an existing
19 October official index: no SDK download/install, large NDK work held for space
review. SDK presence/next actions must be refreshed after any later installation.

`environment-status-safe.json` selects current managed status without environment
IDs, credentials or proxy data: spec 54 / current/enforced restricted, zero custom
hosts / 144 effective; Google SDK host permitted, prior RN artifact host absent.
No denied request or policy change occurred.

See [the release audit](../../RELEASE_READINESS_AUDIT.md) and
[unpublished packet](../../RELEASE_PACKET_DRAFT.md) for remaining installed,
physical/iOS/privacy/distribution acceptance.
