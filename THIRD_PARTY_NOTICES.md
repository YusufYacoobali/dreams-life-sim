# Third-party notices — candidate inventory

Candidate lock/install/source inventory; includes build tooling and optional packages. Not a shipped-library count, legal clearance, complete font-rights determination, or final native/Metro artifact inventory.

Generated deterministically by `node tools/generate-third-party-notices.cjs` from the pinned inputs and installed files below. No network, package installation, package-code execution or license inference occurs. The existing root LICENSE is preserved. See [inventory method and limits](docs/THIRD_PARTY_INVENTORY.md) and [machine-readable evidence](docs/third-party-inventory.json).

## Inputs and scope

- `package.json` SHA-256 `1639accbbe2deda438f70ba8b2499ad8d2df8be8dd23f6a2cee37e3a5b6c4cfe`
- `package-lock.json` SHA-256 `57e36de7942b0fddac071842fdbf3570664c753914e040b6b919a9e6ab8deb16`
- `app.json` SHA-256 `eb6d2b57f0d92e33a6b96c79d5bdfe1c749d58cbccdb5ab1fbd7c2061598f4b8`

**29 direct dependencies; 784 candidate non-dev lock entries; 774 installed version matches; 10 not installed; 0 version mismatches.** These entries include tooling and optional packages, and are not a count of shipped libraries.

734 readable notice files are preserved as 280 exact text blocks. 1 entries lack lock license metadata; 56 have no readable matching notice file in this installation. Neither condition establishes permission or prohibition. See JSON for exact missing/optional/error evidence.

## Direct dependencies

| Dependency | Requested | Locked version | Lock path |
| --- | --- | --- | --- |
| @expo/vector-icons | ^15.1.1 | 15.1.1 | node_modules/@expo/vector-icons |
| expo | ~57.0.31 | 57.0.31 | node_modules/expo |
| expo-asset | ~57.0.20 | 57.0.20 | node_modules/expo-asset |
| expo-audio | ~57.0.5 | 57.0.5 | node_modules/expo-audio |
| expo-constants | ~57.0.22 | 57.0.22 | node_modules/expo-constants |
| expo-document-picker | ~57.0.3 | 57.0.3 | node_modules/expo-document-picker |
| expo-file-system | ~57.0.7 | 57.0.7 | node_modules/expo-file-system |
| expo-font | ~57.0.4 | 57.0.4 | node_modules/expo-font |
| expo-haptics | ~57.0.3 | 57.0.3 | node_modules/expo-haptics |
| expo-linear-gradient | ~57.0.2 | 57.0.2 | node_modules/expo-linear-gradient |
| expo-linking | ~57.0.13 | 57.0.13 | node_modules/expo-linking |
| expo-notifications | ~57.0.23 | 57.0.23 | node_modules/expo-notifications |
| expo-router | ~57.0.29 | 57.0.29 | node_modules/expo-router |
| expo-sharing | ~57.0.24 | 57.0.24 | node_modules/expo-sharing |
| expo-splash-screen | ~57.0.10 | 57.0.10 | node_modules/expo-splash-screen |
| expo-sqlite | ~57.0.4 | 57.0.4 | node_modules/expo-sqlite |
| expo-status-bar | ~57.0.1 | 57.0.1 | node_modules/expo-status-bar |
| expo-system-ui | ~57.0.4 | 57.0.4 | node_modules/expo-system-ui |
| fflate | ^0.8.2 | 0.8.2 | node_modules/fflate |
| react | 19.2.3 | 19.2.3 | node_modules/react |
| react-dom | 19.2.3 | 19.2.3 | node_modules/react-dom |
| react-native | 0.86.3 | 0.86.3 | node_modules/react-native |
| react-native-reanimated | 4.5.1 | 4.5.1 | node_modules/react-native-reanimated |
| react-native-safe-area-context | ~5.7.0 | 5.7.0 | node_modules/react-native-safe-area-context |
| react-native-screens | ~4.26.0 | 4.26.2 | node_modules/react-native-screens |
| react-native-svg | 15.15.4 | 15.15.4 | node_modules/react-native-svg |
| react-native-worklets | 0.10.1 | 0.10.1 | node_modules/react-native-worklets |
| zod | ^4.6.7 | 4.6.7 | node_modules/zod |
| zustand | ^5.0.15 | 5.0.15 | node_modules/zustand |

## Candidate package evidence

SPDX/license values below are copied metadata, not inferred or verified legal conclusions. Installed text applies to the recorded installed version; any mismatch requires review.

| Package/version | Lock license metadata | Installation | Notice sources and text references |
| --- | --- | --- | --- |
| @babel/code-frame@7.29.7 (node_modules/@babel/code-frame) | MIT | version-matched | node_modules/@babel/code-frame/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/compat-data@7.29.7 (node_modules/@babel/compat-data) | MIT | version-matched | node_modules/@babel/compat-data/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/core@7.29.7 (node_modules/@babel/core) | MIT | version-matched | node_modules/@babel/core/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| semver@6.3.1 (node_modules/@babel/core/node_modules/semver) | ISC | version-matched | node_modules/@babel/core/node_modules/semver/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| @babel/generator@7.29.8 (node_modules/@babel/generator) | MIT | version-matched | node_modules/@babel/generator/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/helper-annotate-as-pure@7.29.7 (node_modules/@babel/helper-annotate-as-pure) | MIT | version-matched | node_modules/@babel/helper-annotate-as-pure/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/helper-compilation-targets@7.29.7 (node_modules/@babel/helper-compilation-targets) | MIT | version-matched | node_modules/@babel/helper-compilation-targets/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| semver@6.3.1 (node_modules/@babel/helper-compilation-targets/node_modules/semver) | ISC | version-matched | node_modules/@babel/helper-compilation-targets/node_modules/semver/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| @babel/helper-create-class-features-plugin@7.29.7 (node_modules/@babel/helper-create-class-features-plugin) | MIT | version-matched | node_modules/@babel/helper-create-class-features-plugin/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| semver@6.3.1 (node_modules/@babel/helper-create-class-features-plugin/node_modules/semver) | ISC | version-matched | node_modules/@babel/helper-create-class-features-plugin/node_modules/semver/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| @babel/helper-create-regexp-features-plugin@7.29.10 (node_modules/@babel/helper-create-regexp-features-plugin) | MIT | version-matched | node_modules/@babel/helper-create-regexp-features-plugin/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| semver@6.3.1 (node_modules/@babel/helper-create-regexp-features-plugin/node_modules/semver) | ISC | version-matched | node_modules/@babel/helper-create-regexp-features-plugin/node_modules/semver/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| @babel/helper-define-polyfill-provider@0.6.8 (node_modules/@babel/helper-define-polyfill-provider) | MIT | version-matched | node_modules/@babel/helper-define-polyfill-provider/LICENSE [text-43571857d624621d9c1f5933339bdb3a31832919bed8143494acf1ae2fa46dc5] |
| @babel/helper-globals@7.29.7 (node_modules/@babel/helper-globals) | MIT | version-matched | node_modules/@babel/helper-globals/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/helper-member-expression-to-functions@7.29.7 (node_modules/@babel/helper-member-expression-to-functions) | MIT | version-matched | node_modules/@babel/helper-member-expression-to-functions/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/helper-module-imports@7.29.7 (node_modules/@babel/helper-module-imports) | MIT | version-matched | node_modules/@babel/helper-module-imports/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/helper-module-transforms@7.29.7 (node_modules/@babel/helper-module-transforms) | MIT | version-matched | node_modules/@babel/helper-module-transforms/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/helper-optimise-call-expression@7.29.7 (node_modules/@babel/helper-optimise-call-expression) | MIT | version-matched | node_modules/@babel/helper-optimise-call-expression/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/helper-plugin-utils@7.29.7 (node_modules/@babel/helper-plugin-utils) | MIT | version-matched | node_modules/@babel/helper-plugin-utils/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/helper-remap-async-to-generator@7.29.7 (node_modules/@babel/helper-remap-async-to-generator) | MIT | version-matched | node_modules/@babel/helper-remap-async-to-generator/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/helper-replace-supers@7.29.7 (node_modules/@babel/helper-replace-supers) | MIT | version-matched | node_modules/@babel/helper-replace-supers/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/helper-skip-transparent-expression-wrappers@7.29.7 (node_modules/@babel/helper-skip-transparent-expression-wrappers) | MIT | version-matched | node_modules/@babel/helper-skip-transparent-expression-wrappers/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/helper-string-parser@7.29.7 (node_modules/@babel/helper-string-parser) | MIT | version-matched | node_modules/@babel/helper-string-parser/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/helper-validator-identifier@7.29.7 (node_modules/@babel/helper-validator-identifier) | MIT | version-matched | node_modules/@babel/helper-validator-identifier/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/helper-validator-option@7.29.7 (node_modules/@babel/helper-validator-option) | MIT | version-matched | node_modules/@babel/helper-validator-option/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/helper-wrap-function@7.29.7 (node_modules/@babel/helper-wrap-function) | MIT | version-matched | node_modules/@babel/helper-wrap-function/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/helpers@7.29.10 (node_modules/@babel/helpers) | MIT | version-matched | node_modules/@babel/helpers/LICENSE [text-4be9d87b56a306293223b490c0d0b245e9e94f39884147bf051a6c7b825aeb30] |
| @babel/parser@7.29.9 (node_modules/@babel/parser) | MIT | version-matched | node_modules/@babel/parser/LICENSE [text-2e97627cb278aa7556fb9e8817368302301a595b6c7582512b8d74c57b773652] |
| @babel/plugin-proposal-decorators@7.29.7 (node_modules/@babel/plugin-proposal-decorators) | MIT | version-matched | node_modules/@babel/plugin-proposal-decorators/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-proposal-export-default-from@7.29.7 (node_modules/@babel/plugin-proposal-export-default-from) | MIT | version-matched | node_modules/@babel/plugin-proposal-export-default-from/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-async-generators@7.8.4 (node_modules/@babel/plugin-syntax-async-generators) | MIT | version-matched | node_modules/@babel/plugin-syntax-async-generators/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-bigint@7.8.3 (node_modules/@babel/plugin-syntax-bigint) | MIT | version-matched | node_modules/@babel/plugin-syntax-bigint/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-class-properties@7.12.13 (node_modules/@babel/plugin-syntax-class-properties) | MIT | version-matched | node_modules/@babel/plugin-syntax-class-properties/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-class-static-block@7.14.5 (node_modules/@babel/plugin-syntax-class-static-block) | MIT | version-matched | node_modules/@babel/plugin-syntax-class-static-block/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-decorators@7.29.7 (node_modules/@babel/plugin-syntax-decorators) | MIT | version-matched | node_modules/@babel/plugin-syntax-decorators/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-dynamic-import@7.8.3 (node_modules/@babel/plugin-syntax-dynamic-import) | MIT | version-matched | node_modules/@babel/plugin-syntax-dynamic-import/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-export-default-from@7.29.7 (node_modules/@babel/plugin-syntax-export-default-from) | MIT | version-matched | node_modules/@babel/plugin-syntax-export-default-from/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-flow@7.29.7 (node_modules/@babel/plugin-syntax-flow) | MIT | version-matched | node_modules/@babel/plugin-syntax-flow/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-import-attributes@7.29.7 (node_modules/@babel/plugin-syntax-import-attributes) | MIT | version-matched | node_modules/@babel/plugin-syntax-import-attributes/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-import-meta@7.10.4 (node_modules/@babel/plugin-syntax-import-meta) | MIT | version-matched | node_modules/@babel/plugin-syntax-import-meta/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-json-strings@7.8.3 (node_modules/@babel/plugin-syntax-json-strings) | MIT | version-matched | node_modules/@babel/plugin-syntax-json-strings/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-jsx@7.29.7 (node_modules/@babel/plugin-syntax-jsx) | MIT | version-matched | node_modules/@babel/plugin-syntax-jsx/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-logical-assignment-operators@7.10.4 (node_modules/@babel/plugin-syntax-logical-assignment-operators) | MIT | version-matched | node_modules/@babel/plugin-syntax-logical-assignment-operators/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-nullish-coalescing-operator@7.8.3 (node_modules/@babel/plugin-syntax-nullish-coalescing-operator) | MIT | version-matched | node_modules/@babel/plugin-syntax-nullish-coalescing-operator/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-numeric-separator@7.10.4 (node_modules/@babel/plugin-syntax-numeric-separator) | MIT | version-matched | node_modules/@babel/plugin-syntax-numeric-separator/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-object-rest-spread@7.8.3 (node_modules/@babel/plugin-syntax-object-rest-spread) | MIT | version-matched | node_modules/@babel/plugin-syntax-object-rest-spread/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-optional-catch-binding@7.8.3 (node_modules/@babel/plugin-syntax-optional-catch-binding) | MIT | version-matched | node_modules/@babel/plugin-syntax-optional-catch-binding/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-optional-chaining@7.8.3 (node_modules/@babel/plugin-syntax-optional-chaining) | MIT | version-matched | node_modules/@babel/plugin-syntax-optional-chaining/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-private-property-in-object@7.14.5 (node_modules/@babel/plugin-syntax-private-property-in-object) | MIT | version-matched | node_modules/@babel/plugin-syntax-private-property-in-object/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-top-level-await@7.14.5 (node_modules/@babel/plugin-syntax-top-level-await) | MIT | version-matched | node_modules/@babel/plugin-syntax-top-level-await/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-syntax-typescript@7.29.7 (node_modules/@babel/plugin-syntax-typescript) | MIT | version-matched | node_modules/@babel/plugin-syntax-typescript/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-arrow-functions@7.29.7 (node_modules/@babel/plugin-transform-arrow-functions) | MIT | version-matched | node_modules/@babel/plugin-transform-arrow-functions/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-async-generator-functions@7.29.7 (node_modules/@babel/plugin-transform-async-generator-functions) | MIT | version-matched | node_modules/@babel/plugin-transform-async-generator-functions/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-async-to-generator@7.29.7 (node_modules/@babel/plugin-transform-async-to-generator) | MIT | version-matched | node_modules/@babel/plugin-transform-async-to-generator/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-block-scoping@7.29.7 (node_modules/@babel/plugin-transform-block-scoping) | MIT | version-matched | node_modules/@babel/plugin-transform-block-scoping/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-class-properties@7.29.7 (node_modules/@babel/plugin-transform-class-properties) | MIT | version-matched | node_modules/@babel/plugin-transform-class-properties/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-class-static-block@7.29.7 (node_modules/@babel/plugin-transform-class-static-block) | MIT | version-matched | node_modules/@babel/plugin-transform-class-static-block/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-classes@7.29.7 (node_modules/@babel/plugin-transform-classes) | MIT | version-matched | node_modules/@babel/plugin-transform-classes/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-destructuring@7.29.7 (node_modules/@babel/plugin-transform-destructuring) | MIT | version-matched | node_modules/@babel/plugin-transform-destructuring/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-export-namespace-from@7.29.7 (node_modules/@babel/plugin-transform-export-namespace-from) | MIT | version-matched | node_modules/@babel/plugin-transform-export-namespace-from/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-flow-strip-types@7.29.7 (node_modules/@babel/plugin-transform-flow-strip-types) | MIT | version-matched | node_modules/@babel/plugin-transform-flow-strip-types/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-for-of@7.29.7 (node_modules/@babel/plugin-transform-for-of) | MIT | version-matched | node_modules/@babel/plugin-transform-for-of/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-logical-assignment-operators@7.29.7 (node_modules/@babel/plugin-transform-logical-assignment-operators) | MIT | version-matched | node_modules/@babel/plugin-transform-logical-assignment-operators/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-modules-commonjs@7.29.7 (node_modules/@babel/plugin-transform-modules-commonjs) | MIT | version-matched | node_modules/@babel/plugin-transform-modules-commonjs/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-named-capturing-groups-regex@7.29.7 (node_modules/@babel/plugin-transform-named-capturing-groups-regex) | MIT | version-matched | node_modules/@babel/plugin-transform-named-capturing-groups-regex/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-nullish-coalescing-operator@7.29.7 (node_modules/@babel/plugin-transform-nullish-coalescing-operator) | MIT | version-matched | node_modules/@babel/plugin-transform-nullish-coalescing-operator/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-object-rest-spread@7.29.7 (node_modules/@babel/plugin-transform-object-rest-spread) | MIT | version-matched | node_modules/@babel/plugin-transform-object-rest-spread/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-optional-catch-binding@7.29.7 (node_modules/@babel/plugin-transform-optional-catch-binding) | MIT | version-matched | node_modules/@babel/plugin-transform-optional-catch-binding/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-optional-chaining@7.29.7 (node_modules/@babel/plugin-transform-optional-chaining) | MIT | version-matched | node_modules/@babel/plugin-transform-optional-chaining/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-parameters@7.29.7 (node_modules/@babel/plugin-transform-parameters) | MIT | version-matched | node_modules/@babel/plugin-transform-parameters/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-private-methods@7.29.7 (node_modules/@babel/plugin-transform-private-methods) | MIT | version-matched | node_modules/@babel/plugin-transform-private-methods/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-private-property-in-object@7.29.7 (node_modules/@babel/plugin-transform-private-property-in-object) | MIT | version-matched | node_modules/@babel/plugin-transform-private-property-in-object/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-react-display-name@7.29.7 (node_modules/@babel/plugin-transform-react-display-name) | MIT | version-matched | node_modules/@babel/plugin-transform-react-display-name/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-react-jsx@7.29.7 (node_modules/@babel/plugin-transform-react-jsx) | MIT | version-matched | node_modules/@babel/plugin-transform-react-jsx/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-react-jsx-development@7.29.7 (node_modules/@babel/plugin-transform-react-jsx-development) | MIT | version-matched | node_modules/@babel/plugin-transform-react-jsx-development/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-react-jsx-self@7.29.7 (node_modules/@babel/plugin-transform-react-jsx-self) | MIT | version-matched | node_modules/@babel/plugin-transform-react-jsx-self/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-react-jsx-source@7.29.7 (node_modules/@babel/plugin-transform-react-jsx-source) | MIT | version-matched | node_modules/@babel/plugin-transform-react-jsx-source/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-react-pure-annotations@7.29.7 (node_modules/@babel/plugin-transform-react-pure-annotations) | MIT | version-matched | node_modules/@babel/plugin-transform-react-pure-annotations/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-regenerator@7.29.8 (node_modules/@babel/plugin-transform-regenerator) | MIT | version-matched | node_modules/@babel/plugin-transform-regenerator/LICENSE [text-804a84c51eaa182f86636b463d2bffc73e8592aa2bea192556e003deaf506711] |
| @babel/plugin-transform-runtime@7.29.7 (node_modules/@babel/plugin-transform-runtime) | MIT | version-matched | node_modules/@babel/plugin-transform-runtime/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| semver@6.3.1 (node_modules/@babel/plugin-transform-runtime/node_modules/semver) | ISC | version-matched | node_modules/@babel/plugin-transform-runtime/node_modules/semver/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| @babel/plugin-transform-shorthand-properties@7.29.7 (node_modules/@babel/plugin-transform-shorthand-properties) | MIT | version-matched | node_modules/@babel/plugin-transform-shorthand-properties/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-template-literals@7.29.7 (node_modules/@babel/plugin-transform-template-literals) | MIT | version-matched | node_modules/@babel/plugin-transform-template-literals/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-typescript@7.29.9 (node_modules/@babel/plugin-transform-typescript) | MIT | version-matched | node_modules/@babel/plugin-transform-typescript/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/plugin-transform-unicode-regex@7.29.7 (node_modules/@babel/plugin-transform-unicode-regex) | MIT | version-matched | node_modules/@babel/plugin-transform-unicode-regex/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/preset-typescript@7.29.7 (node_modules/@babel/preset-typescript) | MIT | version-matched | node_modules/@babel/preset-typescript/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/runtime@7.29.10 (node_modules/@babel/runtime) | MIT | version-matched | node_modules/@babel/runtime/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/template@7.29.7 (node_modules/@babel/template) | MIT | version-matched | node_modules/@babel/template/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/traverse@7.29.10 (node_modules/@babel/traverse) | MIT | version-matched | node_modules/@babel/traverse/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @babel/types@7.29.8 (node_modules/@babel/types) | MIT | version-matched | node_modules/@babel/types/LICENSE [text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76] |
| @bcoe/v8-coverage@0.2.3 (node_modules/@bcoe/v8-coverage) | MIT | version-matched | node_modules/@bcoe/v8-coverage/LICENSE.md [text-98d226d560dfbb0a07a77c3654acc18ba6c87589c48cf00cb2a9855ad50fcd07]; node_modules/@bcoe/v8-coverage/LICENSE.txt [text-1a9c55b2961f5e3062e181fa55666c44d011fc3cc03ed6d4fa4321c51f2a5ec5]; node_modules/@bcoe/v8-coverage/dist/lib/LICENSE.md [text-98d226d560dfbb0a07a77c3654acc18ba6c87589c48cf00cb2a9855ad50fcd07] |
| @expo-google-fonts/material-symbols@0.4.51 (node_modules/@expo-google-fonts/material-symbols) | MIT AND Apache-2.0 | version-matched | node_modules/@expo-google-fonts/material-symbols/LICENSE [text-f81a99a72ec5e64e3f74fad0db3df27ab69ab0edd4878368f83379d3e4fc9313]; node_modules/@expo-google-fonts/material-symbols/LICENSE_FONT [text-58d1e17ffe5109a7ae296caafcadfdbe6a7d176f0bc4ab01e12a689b0499d8bd] |
| @expo/code-signing-certificates@0.0.6 (node_modules/@expo/code-signing-certificates) | MIT | version-matched | node_modules/@expo/code-signing-certificates/LICENSE [text-41f2eef190265a6ea435951170947e35461707f91631821b3a67421bea5b2a7c] |
| @expo/config@57.0.10 (node_modules/@expo/config) | MIT | version-matched | node_modules/@expo/config/LICENSE [text-16feb932ce2ba7bc7712657bb28afe409eaa4334f9f05d0e1b7a5f12bf6132f4] |
| @expo/config-plugins@57.0.11 (node_modules/@expo/config-plugins) | MIT | version-matched | node_modules/@expo/config-plugins/LICENSE [text-16feb932ce2ba7bc7712657bb28afe409eaa4334f9f05d0e1b7a5f12bf6132f4] |
| @expo/json-file@11.0.1 (node_modules/@expo/config-plugins/node_modules/@expo/json-file) | MIT | version-matched | node_modules/@expo/config-plugins/node_modules/@expo/json-file/LICENSE [text-16feb932ce2ba7bc7712657bb28afe409eaa4334f9f05d0e1b7a5f12bf6132f4] |
| @expo/config-types@57.0.2 (node_modules/@expo/config-types) | MIT | version-matched | node_modules/@expo/config-types/LICENSE [text-8dacb1e00ec1cf679e7987c87c9953ce6a4d96e7ef361dd04cd453643e9b3351] |
| @expo/devcert@1.2.2 (node_modules/@expo/devcert) | MIT | version-matched | node_modules/@expo/devcert/LICENSE [text-ddd64c9417c74998fe7d0bed6faaf7466bcbe4772bb2b52e7fc9815e33455921] |
| debug@3.2.7 (node_modules/@expo/devcert/node_modules/debug) | MIT | version-matched | node_modules/@expo/devcert/node_modules/debug/LICENSE [text-98c970de440dcfc77471610aec2377c9d9b0db2b3be6d1add524a586e1d7f422] |
| @expo/devtools@57.0.1 (node_modules/@expo/devtools) | MIT | version-matched | node_modules/@expo/devtools/LICENSE [text-16feb932ce2ba7bc7712657bb28afe409eaa4334f9f05d0e1b7a5f12bf6132f4] |
| @expo/dom-webview@57.0.1 (node_modules/@expo/dom-webview) | MIT | version-matched | node_modules/@expo/dom-webview/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| @expo/env@2.5.2 (node_modules/@expo/env) | MIT | version-matched | node_modules/@expo/env/LICENSE [text-9d9cf7980a46628abcbcf88577ecaed2968b69f9123d6aaba6f9496ed3648c1a] |
| @expo/expo-modules-macros-plugin@0.6.1 (node_modules/@expo/expo-modules-macros-plugin) | MIT | version-matched | node_modules/@expo/expo-modules-macros-plugin/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| @expo/fingerprint@0.20.14 (node_modules/@expo/fingerprint) | MIT | version-matched | node_modules/@expo/fingerprint/LICENSE [text-16feb932ce2ba7bc7712657bb28afe409eaa4334f9f05d0e1b7a5f12bf6132f4] |
| @expo/image-utils@0.11.6 (node_modules/@expo/image-utils) | MIT | version-matched | node_modules/@expo/image-utils/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| @expo/inline-modules@0.1.8 (node_modules/@expo/inline-modules) | MIT | version-matched | node_modules/@expo/inline-modules/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| @expo/json-file@11.2.1 (node_modules/@expo/json-file) | MIT | version-matched | node_modules/@expo/json-file/LICENSE [text-16feb932ce2ba7bc7712657bb28afe409eaa4334f9f05d0e1b7a5f12bf6132f4] |
| @expo/local-build-cache-provider@57.0.9 (node_modules/@expo/local-build-cache-provider) | MIT | version-matched | node_modules/@expo/local-build-cache-provider/LICENSE [text-16feb932ce2ba7bc7712657bb28afe409eaa4334f9f05d0e1b7a5f12bf6132f4] |
| @expo/log-box@57.0.4 (node_modules/@expo/log-box) | MIT | version-matched | node_modules/@expo/log-box/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| @expo/metro@56.0.2 (node_modules/@expo/metro) | MIT | version-matched | node_modules/@expo/metro/LICENSE [text-0c0fc06d178272faaf09281aff0cb014d52c56fb0d9516b964808d4cccb65c93] |
| @expo/metro-config@57.0.13 (node_modules/@expo/metro-config) | MIT | version-matched | node_modules/@expo/metro-config/LICENSE [text-16feb932ce2ba7bc7712657bb28afe409eaa4334f9f05d0e1b7a5f12bf6132f4] |
| @expo/env@2.4.3 (node_modules/@expo/metro-config/node_modules/@expo/env) | MIT | version-matched | node_modules/@expo/metro-config/node_modules/@expo/env/LICENSE [text-9d9cf7980a46628abcbcf88577ecaed2968b69f9123d6aaba6f9496ed3648c1a] |
| @expo/json-file@11.0.1 (node_modules/@expo/metro-config/node_modules/@expo/json-file) | MIT | version-matched | node_modules/@expo/metro-config/node_modules/@expo/json-file/LICENSE [text-16feb932ce2ba7bc7712657bb28afe409eaa4334f9f05d0e1b7a5f12bf6132f4] |
| hermes-estree@0.36.1 (node_modules/@expo/metro-config/node_modules/hermes-estree) | MIT | version-matched | node_modules/@expo/metro-config/node_modules/hermes-estree/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| hermes-parser@0.36.1 (node_modules/@expo/metro-config/node_modules/hermes-parser) | MIT | version-matched | node_modules/@expo/metro-config/node_modules/hermes-parser/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| picomatch@4.0.7 (node_modules/@expo/metro-config/node_modules/picomatch) | MIT | version-matched | node_modules/@expo/metro-config/node_modules/picomatch/LICENSE [text-d0cd141b0c322fded5dfad1d4645bb2fedfc05b7321fe1009469638190d59ef9] |
| @expo/metro-file-map@57.0.4 (node_modules/@expo/metro-file-map) | MIT | version-matched | node_modules/@expo/metro-file-map/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| @expo/metro-runtime@57.0.17 (node_modules/@expo/metro-runtime) | MIT | version-matched | node_modules/@expo/metro-runtime/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| @expo/osascript@2.8.1 (node_modules/@expo/osascript) | MIT | version-matched | node_modules/@expo/osascript/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| @expo/package-manager@1.14.2 (node_modules/@expo/package-manager) | MIT | version-matched | node_modules/@expo/package-manager/LICENSE [text-16feb932ce2ba7bc7712657bb28afe409eaa4334f9f05d0e1b7a5f12bf6132f4] |
| @expo/plist@0.8.1 (node_modules/@expo/plist) | MIT | version-matched | node_modules/@expo/plist/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| @expo/prebuild-config@57.0.19 (node_modules/@expo/prebuild-config) | MIT | version-matched | node_modules/@expo/prebuild-config/LICENSE [text-16feb932ce2ba7bc7712657bb28afe409eaa4334f9f05d0e1b7a5f12bf6132f4] |
| @expo/require-utils@57.0.6 (node_modules/@expo/require-utils) | MIT | version-matched | node_modules/@expo/require-utils/LICENSE [text-49c5f9c7097c9a940ff663a54c27a4c60e379df6cc2b3052df0d37a09a85df93] |
| @expo/schema-utils@57.0.2 (node_modules/@expo/schema-utils) | MIT | version-matched | node_modules/@expo/schema-utils/LICENSE [text-49c5f9c7097c9a940ff663a54c27a4c60e379df6cc2b3052df0d37a09a85df93] |
| @expo/sdk-runtime-versions@1.0.1 (node_modules/@expo/sdk-runtime-versions) | MIT | version-matched | node_modules/@expo/sdk-runtime-versions/LICENSE [text-49c5f9c7097c9a940ff663a54c27a4c60e379df6cc2b3052df0d37a09a85df93] |
| @expo/spawn-async@1.8.0 (node_modules/@expo/spawn-async) | MIT | version-matched | node_modules/@expo/spawn-async/LICENSE [text-736835b6c374cbfb66ccfbfc4f8819bcbeae3cfd5f5e5507f25f4caeabf9540e] |
| @expo/sudo-prompt@9.3.2 (node_modules/@expo/sudo-prompt) | MIT | version-matched | node_modules/@expo/sudo-prompt/LICENSE [text-1c0d7e365e7c3dcfc1c30b6913d8a61a2741a4702b7ae727093c5610b47dbfa0] |
| @expo/ui@57.0.26 (node_modules/@expo/ui) | MIT | version-matched | node_modules/@expo/ui/src/community/segmented-control/vendor/LICENSE [text-22a28f29cff8f5ecf9f463301d9c03b8245a2952ebae0bcab633fd654c0792fb] |
| @expo/vector-icons@15.1.1 (node_modules/@expo/vector-icons) | MIT | version-matched | node_modules/@expo/vector-icons/LICENSE [text-a5416f6b586be51823285bc9a389bfd756eef80cfb7616ea90aaa11bae6189e1]; node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/LICENSE [text-000a66d1bc9e206b5963ba9370cd03350a4b26e205b5880e8e0f882a51951178] |
| @expo/xcpretty@4.4.7 (node_modules/@expo/xcpretty) | MIT | version-matched | node_modules/@expo/xcpretty/LICENSE [text-051e2d2738b442a8a8403194f485deeacd9a7e895c08ffbf9e600a9dae858dcc] |
| @isaacs/ttlcache@1.4.1 (node_modules/@isaacs/ttlcache) | ISC | version-matched | node_modules/@isaacs/ttlcache/LICENSE [text-049dff02fd6730c5960862ccca921d05541a7788ad0d76e25cc56dc9541bbf4b] |
| @istanbuljs/load-nyc-config@1.1.0 (node_modules/@istanbuljs/load-nyc-config) | ISC | version-matched | node_modules/@istanbuljs/load-nyc-config/LICENSE [text-6a29f2a84a4df3a25f1eca7e35bd4604d88275e25f6240eb017a77ce884bd577] |
| argparse@1.0.10 (node_modules/@istanbuljs/load-nyc-config/node_modules/argparse) | MIT | version-matched | node_modules/@istanbuljs/load-nyc-config/node_modules/argparse/LICENSE [text-c8442419dc614089ea022b3da6bfc089b41a58fb7b9030d1e651f2f36189dce2] |
| camelcase@5.3.1 (node_modules/@istanbuljs/load-nyc-config/node_modules/camelcase) | MIT | version-matched | node_modules/@istanbuljs/load-nyc-config/node_modules/camelcase/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| js-yaml@3.15.2 (node_modules/@istanbuljs/load-nyc-config/node_modules/js-yaml) | MIT | version-matched | node_modules/@istanbuljs/load-nyc-config/node_modules/js-yaml/LICENSE [text-a07bc24468b9654ce76a547d47a2db282d07733b715db4c73a98bd63961f9550] |
| @istanbuljs/schema@0.1.6 (node_modules/@istanbuljs/schema) | MIT | version-matched | node_modules/@istanbuljs/schema/LICENSE [text-5a547aafe7b171c859ec64de1dd3c3363689f830133f508d043c83da12a6d0a2] |
| @jest/console@29.7.0 (node_modules/@jest/console) | MIT | version-matched | node_modules/@jest/console/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| @jest/core@29.7.0 (node_modules/@jest/core) | MIT | version-matched | node_modules/@jest/core/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| ci-info@3.9.0 (node_modules/@jest/core/node_modules/ci-info) | MIT | version-matched | node_modules/@jest/core/node_modules/ci-info/LICENSE [text-f58943cb354fb2707fea2f7b26b04e6014ddb56835cdfd414c9d2c6c59165b64] |
| @jest/create-cache-key-function@29.7.0 (node_modules/@jest/create-cache-key-function) | MIT | version-matched | node_modules/@jest/create-cache-key-function/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| @jest/diff-sequences@30.5.0 (node_modules/@jest/diff-sequences) | MIT | version-matched | node_modules/@jest/diff-sequences/LICENSE [text-9d5211db733ccdd26f9170bec24cdca84093f60415da6b769ee9cdf23d04e19f] |
| @jest/environment@29.7.0 (node_modules/@jest/environment) | MIT | version-matched | node_modules/@jest/environment/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| @jest/expect@29.7.0 (node_modules/@jest/expect) | MIT | version-matched | node_modules/@jest/expect/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| @jest/expect-utils@29.7.0 (node_modules/@jest/expect-utils) | MIT | version-matched | node_modules/@jest/expect-utils/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| @jest/fake-timers@29.7.0 (node_modules/@jest/fake-timers) | MIT | version-matched | node_modules/@jest/fake-timers/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| @jest/get-type@30.5.0 (node_modules/@jest/get-type) | MIT | version-matched | node_modules/@jest/get-type/LICENSE [text-9d5211db733ccdd26f9170bec24cdca84093f60415da6b769ee9cdf23d04e19f] |
| @jest/globals@29.7.0 (node_modules/@jest/globals) | MIT | version-matched | node_modules/@jest/globals/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| react-is@18.3.1 (node_modules/@jest/react-is-18) | MIT | version-matched | node_modules/@jest/react-is-18/LICENSE [text-52412d7bc7ce4157ea628bbaacb8829e0a9cb3c58f57f99176126bc8cf2bfc85] |
| react-is@19.3.1 (node_modules/@jest/react-is-19) | MIT | version-matched | node_modules/@jest/react-is-19/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| @jest/reporters@29.7.0 (node_modules/@jest/reporters) | MIT | version-matched | node_modules/@jest/reporters/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| balanced-match@1.0.2 (node_modules/@jest/reporters/node_modules/balanced-match) | MIT | version-matched | node_modules/@jest/reporters/node_modules/balanced-match/LICENSE.md [text-a1bd5deadb6a06dd74efa852c1b8b23f63b67f2214fbe9c8bd591da51da69268] |
| brace-expansion@1.1.21 (node_modules/@jest/reporters/node_modules/brace-expansion) | MIT | version-matched | node_modules/@jest/reporters/node_modules/brace-expansion/LICENSE [text-68f12f6e2c33688699249c01d8f9623c534da20aa71989c57b061b7bc1676d14] |
| glob@7.2.3 (node_modules/@jest/reporters/node_modules/glob) | ISC | version-matched | node_modules/@jest/reporters/node_modules/glob/LICENSE [text-6236fa0b88a4a0cce3dda0367979491b2052b3c8d6b1c10b3668de083e86a7f0] |
| istanbul-lib-instrument@6.0.3 (node_modules/@jest/reporters/node_modules/istanbul-lib-instrument) | BSD-3-Clause | version-matched | node_modules/@jest/reporters/node_modules/istanbul-lib-instrument/LICENSE [text-e09f9b52c6ce5c17ba8103cd0cbf446c33b5448b0c1d01d711b36a1f15a501ba] |
| minimatch@3.1.5 (node_modules/@jest/reporters/node_modules/minimatch) | ISC | version-matched | node_modules/@jest/reporters/node_modules/minimatch/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| @jest/schemas@29.6.3 (node_modules/@jest/schemas) | MIT | version-matched | node_modules/@jest/schemas/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| @jest/source-map@29.6.3 (node_modules/@jest/source-map) | MIT | version-matched | node_modules/@jest/source-map/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| @jest/test-result@29.7.0 (node_modules/@jest/test-result) | MIT | version-matched | node_modules/@jest/test-result/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| @jest/test-sequencer@29.7.0 (node_modules/@jest/test-sequencer) | MIT | version-matched | node_modules/@jest/test-sequencer/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| @jest/transform@29.7.0 (node_modules/@jest/transform) | MIT | version-matched | node_modules/@jest/transform/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| @jest/types@29.6.3 (node_modules/@jest/types) | MIT | version-matched | node_modules/@jest/types/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| @jridgewell/gen-mapping@0.3.13 (node_modules/@jridgewell/gen-mapping) | MIT | version-matched | node_modules/@jridgewell/gen-mapping/LICENSE [text-769d154fbde32a915af110b1123650bc79f4cbe675acc66e005265bf069c6c6c] |
| @jridgewell/remapping@2.3.5 (node_modules/@jridgewell/remapping) | MIT | version-matched | node_modules/@jridgewell/remapping/LICENSE [text-769d154fbde32a915af110b1123650bc79f4cbe675acc66e005265bf069c6c6c] |
| @jridgewell/resolve-uri@3.1.2 (node_modules/@jridgewell/resolve-uri) | MIT | version-matched | node_modules/@jridgewell/resolve-uri/LICENSE [text-b8778b155bfde5a28b023a558753c0fa058a52bb9de35c343c250be1bbcdedab] |
| @jridgewell/source-map@0.3.11 (node_modules/@jridgewell/source-map) | MIT | version-matched | node_modules/@jridgewell/source-map/LICENSE [text-769d154fbde32a915af110b1123650bc79f4cbe675acc66e005265bf069c6c6c] |
| @jridgewell/sourcemap-codec@1.6.0 (node_modules/@jridgewell/sourcemap-codec) | MIT | version-matched | node_modules/@jridgewell/sourcemap-codec/LICENSE [text-769d154fbde32a915af110b1123650bc79f4cbe675acc66e005265bf069c6c6c] |
| @jridgewell/trace-mapping@0.3.31 (node_modules/@jridgewell/trace-mapping) | MIT | version-matched | node_modules/@jridgewell/trace-mapping/LICENSE [text-769d154fbde32a915af110b1123650bc79f4cbe675acc66e005265bf069c6c6c] |
| @radix-ui/primitive@1.2.0 (node_modules/@radix-ui/primitive) | MIT | version-matched | node_modules/@radix-ui/primitive/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-compose-refs@1.1.5 (node_modules/@radix-ui/react-compose-refs) | MIT | version-matched | node_modules/@radix-ui/react-compose-refs/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-context@1.3.0 (node_modules/@radix-ui/react-context) | MIT | version-matched | node_modules/@radix-ui/react-context/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-direction@1.2.0 (node_modules/@radix-ui/react-direction) | MIT | version-matched | node_modules/@radix-ui/react-direction/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-focus-guards@1.2.0 (node_modules/@radix-ui/react-focus-guards) | MIT | version-matched | node_modules/@radix-ui/react-focus-guards/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-id@1.1.4 (node_modules/@radix-ui/react-id) | MIT | version-matched | node_modules/@radix-ui/react-id/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-slot@1.5.0 (node_modules/@radix-ui/react-slot) | MIT | version-matched | node_modules/@radix-ui/react-slot/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-use-callback-ref@1.1.5 (node_modules/@radix-ui/react-use-callback-ref) | MIT | version-matched | node_modules/@radix-ui/react-use-callback-ref/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-use-controllable-state@1.3.0 (node_modules/@radix-ui/react-use-controllable-state) | MIT | version-matched | node_modules/@radix-ui/react-use-controllable-state/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-use-effect-event@0.0.5 (node_modules/@radix-ui/react-use-effect-event) | MIT | version-matched | node_modules/@radix-ui/react-use-effect-event/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-use-is-hydrated@0.1.3 (node_modules/@radix-ui/react-use-is-hydrated) | MIT | version-matched | node_modules/@radix-ui/react-use-is-hydrated/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-use-layout-effect@1.1.4 (node_modules/@radix-ui/react-use-layout-effect) | MIT | version-matched | node_modules/@radix-ui/react-use-layout-effect/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @react-native-masked-view/masked-view@0.3.2 (node_modules/@react-native-masked-view/masked-view) | MIT | version-matched | node_modules/@react-native-masked-view/masked-view/LICENSE [text-22a28f29cff8f5ecf9f463301d9c03b8245a2952ebae0bcab633fd654c0792fb] |
| @react-native/assets-registry@0.86.3 (node_modules/@react-native/assets-registry) | MIT | version-matched | (none found) |
| @react-native/babel-plugin-codegen@0.86.3 (node_modules/@react-native/babel-plugin-codegen) | MIT | version-matched | (none found) |
| @react-native/babel-preset@0.86.3 (node_modules/@react-native/babel-preset) | MIT | version-matched | (none found) |
| @react-native/codegen@0.86.3 (node_modules/@react-native/codegen) | MIT | version-matched | (none found) |
| hermes-estree@0.36.0 (node_modules/@react-native/codegen/node_modules/hermes-estree) | MIT | version-matched | node_modules/@react-native/codegen/node_modules/hermes-estree/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| hermes-parser@0.36.0 (node_modules/@react-native/codegen/node_modules/hermes-parser) | MIT | version-matched | node_modules/@react-native/codegen/node_modules/hermes-parser/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| @react-native/community-cli-plugin@0.86.3 (node_modules/@react-native/community-cli-plugin) | MIT | version-matched | (none found) |
| @react-native/debugger-frontend@0.86.3 (node_modules/@react-native/debugger-frontend) | BSD-3-Clause | version-matched | node_modules/@react-native/debugger-frontend/dist/third-party/LICENSE [text-be635b6249bf2e3a9ab088d9be654960253291042824b62dfcf5e955625dc6fe] |
| @react-native/debugger-shell@0.86.3 (node_modules/@react-native/debugger-shell) | MIT | version-matched | (none found) |
| @react-native/dev-middleware@0.86.3 (node_modules/@react-native/dev-middleware) | MIT | version-matched | (none found) |
| @react-native/gradle-plugin@0.86.3 (node_modules/@react-native/gradle-plugin) | MIT | version-matched | (none found) |
| @react-native/jest-preset@0.86.3 (node_modules/@react-native/jest-preset) | MIT | version-matched | (none found) |
| @react-native/js-polyfills@0.86.3 (node_modules/@react-native/js-polyfills) | MIT | version-matched | (none found) |
| @react-native/metro-babel-transformer@0.86.3 (node_modules/@react-native/metro-babel-transformer) | MIT | version-matched | (none found) |
| hermes-estree@0.36.0 (node_modules/@react-native/metro-babel-transformer/node_modules/hermes-estree) | MIT | version-matched | node_modules/@react-native/metro-babel-transformer/node_modules/hermes-estree/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| hermes-parser@0.36.0 (node_modules/@react-native/metro-babel-transformer/node_modules/hermes-parser) | MIT | version-matched | node_modules/@react-native/metro-babel-transformer/node_modules/hermes-parser/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| @react-native/metro-config@0.86.3 (node_modules/@react-native/metro-config) | MIT | version-matched | (none found) |
| @react-native/normalize-colors@0.86.3 (node_modules/@react-native/normalize-colors) | MIT | version-matched | (none found) |
| @react-native/virtualized-lists@0.86.3 (node_modules/@react-native/virtualized-lists) | MIT | version-matched | (none found) |
| @sinclair/typebox@0.27.12 (node_modules/@sinclair/typebox) | MIT | version-matched | node_modules/@sinclair/typebox/license [text-32fb6556bc84c192f493cbb1503b99f6ee893227a9473290e88699fde9807fd3] |
| @sinonjs/commons@3.0.1 (node_modules/@sinonjs/commons) | BSD-3-Clause | version-matched | node_modules/@sinonjs/commons/LICENSE [text-4df78f3bcde252efdbef67e5a3ef02877be68a4b4ff7ee0c78e4d89a0a7f1f00] |
| @sinonjs/fake-timers@10.3.0 (node_modules/@sinonjs/fake-timers) | BSD-3-Clause | version-matched | node_modules/@sinonjs/fake-timers/LICENSE [text-660eedb52e4c076d2feae829b12b6b983d54f569221402618eb56cd2bb2ddcfb] |
| @testing-library/react-native@13.3.3 (node_modules/@testing-library/react-native) | MIT | version-matched | node_modules/@testing-library/react-native/LICENSE [text-7252e9bc5eba33ff2b205f12c581fde208fa92c94ae8dac36d8167b648ad622c] |
| @jest/schemas@30.5.0 (node_modules/@testing-library/react-native/node_modules/@jest/schemas) | MIT | version-matched | node_modules/@testing-library/react-native/node_modules/@jest/schemas/LICENSE [text-9d5211db733ccdd26f9170bec24cdca84093f60415da6b769ee9cdf23d04e19f] |
| @sinclair/typebox@0.34.52 (node_modules/@testing-library/react-native/node_modules/@sinclair/typebox) | MIT | version-matched | node_modules/@testing-library/react-native/node_modules/@sinclair/typebox/license [text-a62f9f2edd97ed0d92f0ef93584dd109a7d34299795abc7780b8b5a85ff00671] |
| ansi-styles@5.2.0 (node_modules/@testing-library/react-native/node_modules/ansi-styles) | MIT | version-matched | node_modules/@testing-library/react-native/node_modules/ansi-styles/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| pretty-format@30.5.1 (node_modules/@testing-library/react-native/node_modules/pretty-format) | MIT | version-matched | node_modules/@testing-library/react-native/node_modules/pretty-format/LICENSE [text-9d5211db733ccdd26f9170bec24cdca84093f60415da6b769ee9cdf23d04e19f] |
| @types/babel__core@7.20.5 (node_modules/@types/babel__core) | MIT | version-matched | node_modules/@types/babel__core/LICENSE [text-c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383] |
| @types/babel__generator@7.27.0 (node_modules/@types/babel__generator) | MIT | version-matched | node_modules/@types/babel__generator/LICENSE [text-c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383] |
| @types/babel__template@7.4.4 (node_modules/@types/babel__template) | MIT | version-matched | node_modules/@types/babel__template/LICENSE [text-c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383] |
| @types/babel__traverse@7.28.0 (node_modules/@types/babel__traverse) | MIT | version-matched | node_modules/@types/babel__traverse/LICENSE [text-c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383] |
| @types/graceful-fs@4.1.9 (node_modules/@types/graceful-fs) | MIT | version-matched | node_modules/@types/graceful-fs/LICENSE [text-c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383] |
| @types/istanbul-lib-coverage@2.0.6 (node_modules/@types/istanbul-lib-coverage) | MIT | version-matched | node_modules/@types/istanbul-lib-coverage/LICENSE [text-c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383] |
| @types/istanbul-lib-report@3.0.3 (node_modules/@types/istanbul-lib-report) | MIT | version-matched | node_modules/@types/istanbul-lib-report/LICENSE [text-c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383] |
| @types/istanbul-reports@3.0.4 (node_modules/@types/istanbul-reports) | MIT | version-matched | node_modules/@types/istanbul-reports/LICENSE [text-c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383] |
| @types/node@26.6.5 (node_modules/@types/node) | MIT | version-matched | node_modules/@types/node/LICENSE [text-c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383] |
| @types/react@19.2.18 (node_modules/@types/react) | MIT | version-matched | node_modules/@types/react/LICENSE [text-c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383] |
| @types/react-test-renderer@19.3.0 (node_modules/@types/react-test-renderer) | MIT | version-matched | node_modules/@types/react-test-renderer/LICENSE [text-c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383] |
| @types/stack-utils@2.0.3 (node_modules/@types/stack-utils) | MIT | version-matched | node_modules/@types/stack-utils/LICENSE [text-c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383] |
| @types/yargs@17.0.35 (node_modules/@types/yargs) | MIT | version-matched | node_modules/@types/yargs/LICENSE [text-c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383] |
| @types/yargs-parser@21.0.3 (node_modules/@types/yargs-parser) | MIT | version-matched | node_modules/@types/yargs-parser/LICENSE [text-c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383] |
| @ungap/structured-clone@1.4.0 (node_modules/@ungap/structured-clone) | ISC | version-matched | node_modules/@ungap/structured-clone/LICENSE [text-dc6d4961d8b6ee747231582ae9c53ce1d66bf76bc9f5a28f554c0e97210953bf] |
| @xmldom/xmldom@0.8.15 (node_modules/@xmldom/xmldom) | MIT | version-matched | node_modules/@xmldom/xmldom/LICENSE [text-4da724fc305d81606b245b324d4d2586916b9d248b23d82183df753ace0fdf71] |
| abort-controller@3.0.0 (node_modules/abort-controller) | MIT | version-matched | node_modules/abort-controller/LICENSE [text-dbbf03317f0101fed5643cd87ca80fb769e358fa4f428445bf2315deeb23a154] |
| accepts@2.0.0 (node_modules/accepts) | MIT | version-matched | node_modules/accepts/LICENSE [text-71f83c4c0621102a56d9853812777b85751bce7e9726f686f5b056c1f8a4b0e6] |
| acorn@8.19.0 (node_modules/acorn) | MIT | version-matched | node_modules/acorn/LICENSE [text-76a876cf886ff9be2a8b5e2e86514fed06223c8c9f0c1e9ee9606e93841e00b7] |
| agent-base@7.1.4 (node_modules/agent-base) | MIT | version-matched | node_modules/agent-base/LICENSE [text-8d8c55319c7729d57be811c747452636688d54f19701ee0752b6b15ad3771d9a] |
| agent-cli-detector@0.1.7 (node_modules/agent-cli-detector) | MIT | version-matched | node_modules/agent-cli-detector/LICENSE [text-f855c605d6ba3587ef8ba49a428cec58711964547c5364f1dade33ed23315361] |
| anser@1.4.10 (node_modules/anser) | MIT | version-matched | node_modules/anser/LICENSE [text-706ffe2db6ae2993ed01bc7f3cde114373fe79eb6123dfc6d8d41f53989a2be6] |
| ansi-escapes@4.3.2 (node_modules/ansi-escapes) | MIT | version-matched | node_modules/ansi-escapes/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| type-fest@0.21.3 (node_modules/ansi-escapes/node_modules/type-fest) | (MIT OR CC0-1.0) | version-matched | node_modules/ansi-escapes/node_modules/type-fest/license [text-64a93ffc0a06a2266dbb57ed7ebe3b56ba66ab337b6347fabdbf86c76819fbae] |
| ansi-regex@5.0.1 (node_modules/ansi-regex) | MIT | version-matched | node_modules/ansi-regex/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| ansi-styles@4.3.0 (node_modules/ansi-styles) | MIT | version-matched | node_modules/ansi-styles/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| anymatch@3.1.3 (node_modules/anymatch) | ISC | version-matched | node_modules/anymatch/LICENSE [text-5a3b0007c4203f10fe11b3fe8747253eb994f135e10b73e1f88ada941af09c6e] |
| arg@5.0.2 (node_modules/arg) | MIT | version-matched | node_modules/arg/LICENSE.md [text-91887c62d26f64b8d6e98b1dca57e75aca62e6f9af79fb0783f8f1904abaeea6] |
| argparse@2.0.1 (node_modules/argparse) | Python-2.0 | version-matched | node_modules/argparse/LICENSE [text-de4d1f2d2ad5ad0cfd1657a106476b31cb5db5ef9d1ff842b237c0c81f0c8a23] |
| aria-hidden@1.2.6 (node_modules/aria-hidden) | MIT | version-matched | node_modules/aria-hidden/LICENSE [text-30f0cfddf483d1128e3610205020f2041a6c5e837aa999e0aa82e5576187d4a9] |
| asap@2.0.6 (node_modules/asap) | MIT | version-matched | node_modules/asap/LICENSE.md [text-e80373b1ed0f33cecc47173b4b0c6afe0d0318b32dbd84116a1a957e3f7f43a8] |
| await-lock@2.2.2 (node_modules/await-lock) | MIT | version-matched | node_modules/await-lock/LICENSE [text-396eefd21683c5f4de3640e7627638d07be75126f896d3ee0cf924cbff64e0a2] |
| babel-jest@29.7.0 (node_modules/babel-jest) | MIT | version-matched | node_modules/babel-jest/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| babel-plugin-istanbul@6.1.1 (node_modules/babel-plugin-istanbul) | BSD-3-Clause | version-matched | node_modules/babel-plugin-istanbul/LICENSE [text-5b8a867ac027eaa06bb77bdfee4dddfa2be02a872a5458f9a5b3233453aa06d5] |
| babel-plugin-jest-hoist@29.6.3 (node_modules/babel-plugin-jest-hoist) | MIT | version-matched | node_modules/babel-plugin-jest-hoist/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| babel-plugin-polyfill-corejs2@0.4.17 (node_modules/babel-plugin-polyfill-corejs2) | MIT | version-matched | node_modules/babel-plugin-polyfill-corejs2/LICENSE [text-43571857d624621d9c1f5933339bdb3a31832919bed8143494acf1ae2fa46dc5] |
| semver@6.3.1 (node_modules/babel-plugin-polyfill-corejs2/node_modules/semver) | ISC | version-matched | node_modules/babel-plugin-polyfill-corejs2/node_modules/semver/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| babel-plugin-polyfill-corejs3@0.13.0 (node_modules/babel-plugin-polyfill-corejs3) | MIT | version-matched | node_modules/babel-plugin-polyfill-corejs3/LICENSE [text-43571857d624621d9c1f5933339bdb3a31832919bed8143494acf1ae2fa46dc5] |
| babel-plugin-polyfill-regenerator@0.6.8 (node_modules/babel-plugin-polyfill-regenerator) | MIT | version-matched | node_modules/babel-plugin-polyfill-regenerator/LICENSE [text-43571857d624621d9c1f5933339bdb3a31832919bed8143494acf1ae2fa46dc5] |
| babel-plugin-react-compiler@1.0.0 (node_modules/babel-plugin-react-compiler) | MIT | version-matched | (none found) |
| babel-plugin-react-native-web@0.21.4 (node_modules/babel-plugin-react-native-web) | MIT | version-matched | node_modules/babel-plugin-react-native-web/LICENSE [text-cc06054a391f6b5dbcf6f142d2bb9d637db897746b0e6c58ed913834b581cae4] |
| babel-plugin-syntax-hermes-parser@0.36.0 (node_modules/babel-plugin-syntax-hermes-parser) | MIT | version-matched | node_modules/babel-plugin-syntax-hermes-parser/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| hermes-estree@0.36.0 (node_modules/babel-plugin-syntax-hermes-parser/node_modules/hermes-estree) | MIT | version-matched | node_modules/babel-plugin-syntax-hermes-parser/node_modules/hermes-estree/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| hermes-parser@0.36.0 (node_modules/babel-plugin-syntax-hermes-parser/node_modules/hermes-parser) | MIT | version-matched | node_modules/babel-plugin-syntax-hermes-parser/node_modules/hermes-parser/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| babel-plugin-transform-flow-enums@0.0.2 (node_modules/babel-plugin-transform-flow-enums) | MIT | version-matched | node_modules/babel-plugin-transform-flow-enums/LICENSE [text-52412d7bc7ce4157ea628bbaacb8829e0a9cb3c58f57f99176126bc8cf2bfc85] |
| babel-preset-current-node-syntax@1.2.0 (node_modules/babel-preset-current-node-syntax) | MIT | version-matched | node_modules/babel-preset-current-node-syntax/LICENSE [text-dddddf170b975dc55422b4a7d852fb000b9088aea454730df07b36ebb40a8953] |
| babel-preset-expo@57.0.16 (node_modules/babel-preset-expo) | MIT | version-matched | node_modules/babel-preset-expo/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| babel-preset-jest@29.6.3 (node_modules/babel-preset-jest) | MIT | version-matched | node_modules/babel-preset-jest/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| badgin@1.2.3 (node_modules/badgin) | MIT | version-matched | (none found) |
| balanced-match@4.0.4 (node_modules/balanced-match) | MIT | version-matched | node_modules/balanced-match/LICENSE.md [text-d408f38ffa3355c5faec517153295338892eb0f1ea43f57874bb23c6075979b5] |
| base64-js@1.5.1 (node_modules/base64-js) | MIT | version-matched | node_modules/base64-js/LICENSE [text-5b37224c080cdcc97c871ada971c224e9926370fe74f11b539aa1cf9f3b1aca1] |
| baseline-browser-mapping@2.11.29 (node_modules/baseline-browser-mapping) | Apache-2.0 | version-matched | node_modules/baseline-browser-mapping/LICENSE.txt [text-c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4] |
| big-integer@1.6.52 (node_modules/big-integer) | Unlicense | version-matched | node_modules/big-integer/LICENSE [text-e9b0e94f628e00b5ed98046cfa041696ff89eebbbdd54108ee350625bc6d0363] |
| boolbase@1.0.0 (node_modules/boolbase) | ISC | version-matched | (none found) |
| bplist-creator@0.1.0 (node_modules/bplist-creator) | MIT | version-matched | node_modules/bplist-creator/LICENSE [text-d9bacb8be7c3a210dfe531bde8503eb567f51a8fdbfc438fcf7a171d7ab338d8] |
| bplist-parser@0.3.1 (node_modules/bplist-parser) | MIT | version-matched | (none found) |
| brace-expansion@5.0.12 (node_modules/brace-expansion) | MIT | version-matched | node_modules/brace-expansion/LICENSE [text-9c63a23124d68cd30cd316a94a1a0bca34f032786df6df69fc4b5f136bac8d2e] |
| braces@3.0.3 (node_modules/braces) | MIT | version-matched | node_modules/braces/LICENSE [text-35bdd8a44339719441900fb50fbefc5e2dca1ca662cbaed7a687de842c8b70f2] |
| browserslist@4.29.3 (node_modules/browserslist) | MIT | version-matched | node_modules/browserslist/LICENSE [text-21c2679a63d7699c0e644409e2f17d0adbc7a965003feb06b3ff4b833d21f722] |
| bser@2.1.2 (node_modules/bser) | MIT | version-matched | node_modules/bser/LICENSE [text-2d4c3d00d67067461412a2d9a2f3f8b7b9cda62b3db501e4b6844ccf35c949aa] |
| buffer-from@1.1.2 (node_modules/buffer-from) | MIT | version-matched | node_modules/buffer-from/LICENSE [text-14275f5c8139d02054c5259d52a88ccbba662a86af18c30f071c8d082dc6004c] |
| bytes@3.1.2 (node_modules/bytes) | MIT | version-matched | node_modules/bytes/LICENSE [text-e3b44af066615de2ea48d18d852d0762f18c0b2efcea714fa48a6f729d405b85] |
| callsites@3.1.0 (node_modules/callsites) | MIT | version-matched | node_modules/callsites/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| camelcase@6.3.0 (node_modules/camelcase) | MIT | version-matched | node_modules/camelcase/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| caniuse-lite@1.0.30001816 (node_modules/caniuse-lite) | CC-BY-4.0 | version-matched | node_modules/caniuse-lite/LICENSE [text-fd3a263fe19ed8faa9068b43abaebafc02c77897b0c6fc09abc04bb592e5f16e] |
| chalk@4.1.2 (node_modules/chalk) | MIT | version-matched | node_modules/chalk/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| char-regex@1.0.2 (node_modules/char-regex) | MIT | version-matched | node_modules/char-regex/LICENSE [text-34239137535c0fee5a5b590310300f988fff92bbba6719889454eda410f536e3] |
| chrome-launcher@0.15.2 (node_modules/chrome-launcher) | Apache-2.0 | version-matched | node_modules/chrome-launcher/LICENSE [text-7ec9661a8afafab1eee3523d6f1a193eff76314a5ab10b4ce96aefd87621b0c3] |
| chromium-edge-launcher@0.3.0 (node_modules/chromium-edge-launcher) | Apache-2.0 | version-matched | node_modules/chromium-edge-launcher/LICENSE [text-7ec9661a8afafab1eee3523d6f1a193eff76314a5ab10b4ce96aefd87621b0c3] |
| ci-info@2.0.0 (node_modules/ci-info) | MIT | version-matched | node_modules/ci-info/LICENSE [text-25bd22427e27b0d3f1c3da2670bb44b622bcced22ebdf4777d5488ac129370a1] |
| cjs-module-lexer@1.4.3 (node_modules/cjs-module-lexer) | MIT | version-matched | node_modules/cjs-module-lexer/LICENSE [text-6b0c1f98ec71a46b44276c4e5095822f33efaba2dfac61c17c24fe5d666ccaee] |
| cli-cursor@2.1.0 (node_modules/cli-cursor) | MIT | version-matched | node_modules/cli-cursor/license [text-6fb9754611c20f6649f68805e8c990e83261f29316e29de9e6cedae607b8634c] |
| cli-spinners@2.9.2 (node_modules/cli-spinners) | MIT | version-matched | node_modules/cli-spinners/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| client-only@0.0.1 (node_modules/client-only) | MIT | version-matched | (none found) |
| cliui@8.0.1 (node_modules/cliui) | ISC | version-matched | node_modules/cliui/LICENSE.txt [text-2dc0465729366c3a7890dfa9e972a1ba7048a26c02116fb8b419a6a1ac110149] |
| clone@1.0.4 (node_modules/clone) | MIT | version-matched | node_modules/clone/LICENSE [text-3fb0857ef0133928cf72c88dfc464e931486e88778961eedec25585e2321507f] |
| co@4.6.0 (node_modules/co) | MIT | version-matched | node_modules/co/LICENSE [text-29f4d474804f60aae177d7fed67d0d613d00006640cc9cf80077eef03fb9a2cc] |
| collect-v8-coverage@1.0.3 (node_modules/collect-v8-coverage) | MIT | version-matched | node_modules/collect-v8-coverage/LICENSE [text-68de92df8196cfbbadaaf85102e430777fc41cb2710a261c3d37557316982c2a] |
| color@4.2.3 (node_modules/color) | MIT | version-matched | node_modules/color/LICENSE [text-4c0844caafd3db9a4b643ea493558873710f4e9c8b257887ba066e5e80557848] |
| color-convert@2.0.1 (node_modules/color-convert) | MIT | version-matched | node_modules/color-convert/LICENSE [text-693866fc419c6f61c8570438ec00659d156ec2b4d4a4d04091711f5f11a365d4] |
| color-name@1.1.4 (node_modules/color-name) | MIT | version-matched | node_modules/color-name/LICENSE [text-c064f7a3e353bc1bc977f3c897941c75ef763f44f41677e0a15370ca0853d6e2] |
| color-string@1.9.1 (node_modules/color-string) | MIT | version-matched | node_modules/color-string/LICENSE [text-8984783ab2478bbee455f0eb6c375b5b62c57c86d4a55f6bf96dfd08e8d48a10] |
| commander@7.2.0 (node_modules/commander) | MIT | version-matched | node_modules/commander/LICENSE [text-04512a63dce4d2d506ad612dc0bd7681ccf6e3655f7b6eaef7dfac8323d1ec0b] |
| compressible@2.0.18 (node_modules/compressible) | MIT | version-matched | node_modules/compressible/LICENSE [text-b6be1b6c4e8c0441448a70fc6517c8d1ad62ad6a614b1fd049f74aa86c8b9820] |
| compression@1.8.2 (node_modules/compression) | MIT | version-matched | node_modules/compression/LICENSE [text-23d466b1b134b415b66fa50c6526b4cf3e7b9258554da88d3abb371721e7ce68] |
| debug@2.6.9 (node_modules/compression/node_modules/debug) | MIT | version-matched | node_modules/compression/node_modules/debug/LICENSE [text-98c970de440dcfc77471610aec2377c9d9b0db2b3be6d1add524a586e1d7f422] |
| ms@2.0.0 (node_modules/compression/node_modules/ms) | MIT | version-matched | node_modules/compression/node_modules/ms/license.md [text-6652830c2607c722b66f1b57de15877ab8fc5dca406cc5b335afeb365d0f32c1] |
| negotiator@0.6.4 (node_modules/compression/node_modules/negotiator) | MIT | version-matched | node_modules/compression/node_modules/negotiator/LICENSE [text-553d4d20029a24e315b428a1a54a9e109eaa340f2e958a4f50a92362c2c4070b] |
| concat-map@0.0.1 (node_modules/concat-map) | MIT | version-matched | node_modules/concat-map/LICENSE [text-435a6722c786b0a56fbe7387028f1d9d3f3a2d0fb615bb8fee118727c3f59b7b] |
| connect@3.7.0 (node_modules/connect) | MIT | version-matched | node_modules/connect/LICENSE [text-9913ff70f23424d49fda2b05902cfb72f17ae1e48aaf898c349a284289a74751] |
| debug@2.6.9 (node_modules/connect/node_modules/debug) | MIT | version-matched | node_modules/connect/node_modules/debug/LICENSE [text-98c970de440dcfc77471610aec2377c9d9b0db2b3be6d1add524a586e1d7f422] |
| ms@2.0.0 (node_modules/connect/node_modules/ms) | MIT | version-matched | node_modules/connect/node_modules/ms/license.md [text-6652830c2607c722b66f1b57de15877ab8fc5dca406cc5b335afeb365d0f32c1] |
| content-type@2.1.0 (node_modules/content-type) | MIT | version-matched | node_modules/content-type/LICENSE [text-257aed98914108e91a337912727b6a802eef218248507f74b76faffaff517a38] |
| convert-source-map@2.0.0 (node_modules/convert-source-map) | MIT | version-matched | node_modules/convert-source-map/LICENSE [text-1fa6ee8bb95a81ae3d73a5bd074a3ac380ffec13697051063ca1a601921b91db] |
| core-js-compat@3.50.0 (node_modules/core-js-compat) | MIT | version-matched | node_modules/core-js-compat/LICENSE [text-b87653fff2d44426ab5cd4723cee3b1364dc8d35a0acdf098c54689543123bf8] |
| create-jest@29.7.0 (node_modules/create-jest) | MIT | version-matched | node_modules/create-jest/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| cross-spawn@7.0.6 (node_modules/cross-spawn) | MIT | version-matched | node_modules/cross-spawn/LICENSE [text-aaa78451b6fecd1b9c4594c796c133c0e90cad100372ff8bc6de615e9ef9adf1] |
| css-select@5.2.2 (node_modules/css-select) | BSD-2-Clause | version-matched | node_modules/css-select/LICENSE [text-cb992345949ccd6e8394b2cd6c465f7b897c864f845937dbf64e8997f389e164] |
| css-tree@1.1.3 (node_modules/css-tree) | MIT | version-matched | node_modules/css-tree/LICENSE [text-d34ff47ca7a39e9ee3987a03a42cce0af4f77ec280f06f3969e2c33ca350a899] |
| source-map@0.6.1 (node_modules/css-tree/node_modules/source-map) | BSD-3-Clause | version-matched | node_modules/css-tree/node_modules/source-map/LICENSE [text-6cb0631f71c7749763fd3dd1d5bee52dd1070ec17f2edc1710079ad070bd2fbd] |
| css-what@6.2.2 (node_modules/css-what) | BSD-2-Clause | version-matched | node_modules/css-what/LICENSE [text-cb992345949ccd6e8394b2cd6c465f7b897c864f845937dbf64e8997f389e164] |
| csstype@3.2.3 (node_modules/csstype) | MIT | version-matched | node_modules/csstype/LICENSE [text-11d55bd4541c75ee7879547ac49089c489163dae49551389713c3d026cab383e] |
| debug@4.4.3 (node_modules/debug) | MIT | version-matched | node_modules/debug/LICENSE [text-3a61c6c96caf5c1d9b623fb9b04c822b783dfcb78aa7e49c76a3f643e6ed7f95] |
| decode-uri-component@0.2.2 (node_modules/decode-uri-component) | MIT | version-matched | node_modules/decode-uri-component/license [text-ed7a9a0f74e43951b2520efe1a4349cb9ed5f3dff0b0f268e2e51a4d38df7ea4] |
| dedent@1.7.2 (node_modules/dedent) | MIT | version-matched | node_modules/dedent/LICENSE.md [text-76c9d5f5ea942054715c026f33f8717c9e24603196a3737b8899afa216bcbdab] |
| deepmerge@4.3.1 (node_modules/deepmerge) | MIT | version-matched | node_modules/deepmerge/license.txt [text-6cfc4687cb2f2d86f4a77e6b526290d3878e5e512f3fec2f4cb36a9cb36f798b] |
| defaults@1.0.4 (node_modules/defaults) | MIT | version-matched | node_modules/defaults/LICENSE [text-fe99d9a94ec7edc64a9767701f830f66e08239b000d653a359d66e640289ed0c] |
| depd@2.0.0 (node_modules/depd) | MIT | version-matched | node_modules/depd/LICENSE [text-bd134b41da59e452fb5a1d366b660886f741c87c2bf9428e93764c419fbc40f5] |
| destroy@1.2.0 (node_modules/destroy) | MIT | version-matched | node_modules/destroy/LICENSE [text-ffe370c8785b0b688d954977ce8dc52e19e5f17962cc5f80009c85eba4925d56] |
| detect-libc@2.1.2 (node_modules/detect-libc) | Apache-2.0 | version-matched | node_modules/detect-libc/LICENSE [text-b40930bbcf80744c86c46a12bc9da056641d722716c378f5659b9e555ef833e1] |
| detect-newline@3.1.0 (node_modules/detect-newline) | MIT | version-matched | node_modules/detect-newline/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| detect-node-es@1.1.0 (node_modules/detect-node-es) | MIT | version-matched | node_modules/detect-node-es/LICENSE [text-54b32293ea560d22cd9b62af9b2cda1a030d910a48c6601d227c5ff2338d95f8] |
| diff-sequences@29.6.3 (node_modules/diff-sequences) | MIT | version-matched | node_modules/diff-sequences/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| dnssd-advertise@1.1.6 (node_modules/dnssd-advertise) | MIT | version-matched | node_modules/dnssd-advertise/LICENSE.md [text-479b48ab7acdf844b2f44d6a3ce806f932ad009d84d2c71651355b372a2ad0ad] |
| dom-serializer@2.0.0 (node_modules/dom-serializer) | MIT | version-matched | node_modules/dom-serializer/LICENSE [text-94cfe87de9b178e8fee313a19178e625129e2ce559db32e772e7bd95114ee6ff] |
| domelementtype@2.3.0 (node_modules/domelementtype) | BSD-2-Clause | version-matched | node_modules/domelementtype/LICENSE [text-cb992345949ccd6e8394b2cd6c465f7b897c864f845937dbf64e8997f389e164] |
| domhandler@5.0.3 (node_modules/domhandler) | BSD-2-Clause | version-matched | node_modules/domhandler/LICENSE [text-cb992345949ccd6e8394b2cd6c465f7b897c864f845937dbf64e8997f389e164] |
| domutils@3.2.2 (node_modules/domutils) | BSD-2-Clause | version-matched | node_modules/domutils/LICENSE [text-cb992345949ccd6e8394b2cd6c465f7b897c864f845937dbf64e8997f389e164] |
| ee-first@1.1.1 (node_modules/ee-first) | MIT | version-matched | node_modules/ee-first/LICENSE [text-965ef284f7f4c176842ec2e87fa13e79feed777d56d7a21a5a3b38f1bb6dc288] |
| electron-to-chromium@1.5.459 (node_modules/electron-to-chromium) | ISC | version-matched | node_modules/electron-to-chromium/LICENSE [text-25ba5c59dad3e0dd8f9540beaa0f0a86a10e3aec35af5fdc8e88c5f6a5c0d8c6] |
| emittery@0.13.1 (node_modules/emittery) | MIT | version-matched | node_modules/emittery/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| emoji-regex@8.0.0 (node_modules/emoji-regex) | MIT | version-matched | node_modules/emoji-regex/LICENSE-MIT.txt [text-483acb265f182907d1caf6cff9c16c96f31325ed23792832cc5d8b12d5f88c8a] |
| encodeurl@1.0.2 (node_modules/encodeurl) | MIT | version-matched | node_modules/encodeurl/LICENSE [text-7585ea7bba616ccbbe43cb54ecb67956688c3c5641bb84f3099a652a73193afe] |
| entities@4.5.0 (node_modules/entities) | BSD-2-Clause | version-matched | node_modules/entities/LICENSE [text-cb992345949ccd6e8394b2cd6c465f7b897c864f845937dbf64e8997f389e164] |
| error-ex@1.3.4 (node_modules/error-ex) | MIT | version-matched | node_modules/error-ex/LICENSE [text-92b07a2e5b0e051d37dde85042c736d6d551cfcbc0983f39d7ef903b3986bbc1] |
| is-arrayish@0.2.1 (node_modules/error-ex/node_modules/is-arrayish) | MIT | version-matched | node_modules/error-ex/node_modules/is-arrayish/LICENSE [text-92b07a2e5b0e051d37dde85042c736d6d551cfcbc0983f39d7ef903b3986bbc1] |
| error-stack-parser@2.1.4 (node_modules/error-stack-parser) | MIT | version-matched | node_modules/error-stack-parser/LICENSE [text-899da9d991cb211a3642b84e82a9ae0b4b4e44546fd207e34d7d4ec2eb40f420] |
| es-errors@1.3.0 (node_modules/es-errors) | MIT | version-matched | node_modules/es-errors/LICENSE [text-5e325595b4ea8cfec3802f545b1def5d7b73e4a5b8e9ba63e32a320f67732292] |
| escalade@3.2.0 (node_modules/escalade) | MIT | version-matched | node_modules/escalade/license [text-9a9edad7baae52622bddf3c15b2ef8a33d2c89f2d25408ad13e8a7481c6b0c97] |
| escape-html@1.0.3 (node_modules/escape-html) | MIT | version-matched | node_modules/escape-html/LICENSE [text-255aa557a1f55224ce522f311629c0bf20854740a67955cefd798fbd1d3d1ded] |
| escape-string-regexp@4.0.0 (node_modules/escape-string-regexp) | MIT | version-matched | node_modules/escape-string-regexp/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| esprima@4.0.1 (node_modules/esprima) | BSD-2-Clause | version-matched | node_modules/esprima/LICENSE.BSD [text-94bcb9959136723aa4fb36e1a6c4d5c662a2369978cfae344dabfb83ae619e79] |
| etag@1.8.1 (node_modules/etag) | MIT | version-matched | node_modules/etag/LICENSE [text-a7996721249a136fbcfc1c201bcb5f414f38a701d4a24f28abe65e16cfcce813] |
| event-target-shim@5.0.1 (node_modules/event-target-shim) | MIT | version-matched | node_modules/event-target-shim/LICENSE [text-97d87142793695cd73243de7258694abe85b3b6060fca7f247b0a2afa8219678] |
| execa@5.1.1 (node_modules/execa) | MIT | version-matched | node_modules/execa/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| mimic-fn@2.1.0 (node_modules/execa/node_modules/mimic-fn) | MIT | version-matched | node_modules/execa/node_modules/mimic-fn/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| onetime@5.1.2 (node_modules/execa/node_modules/onetime) | MIT | version-matched | node_modules/execa/node_modules/onetime/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| exit@0.1.2 (node_modules/exit) | (not provided) | version-matched | node_modules/exit/LICENSE-MIT [text-65bd93f75d6c0cdc1c9e1a39bd1814e2e34355c665e1564a1517f27c1523ab7e] |
| expect@29.7.0 (node_modules/expect) | MIT | version-matched | node_modules/expect/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-diff@29.7.0 (node_modules/expect/node_modules/jest-diff) | MIT | version-matched | node_modules/expect/node_modules/jest-diff/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-matcher-utils@29.7.0 (node_modules/expect/node_modules/jest-matcher-utils) | MIT | version-matched | node_modules/expect/node_modules/jest-matcher-utils/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| expo@57.0.31 (node_modules/expo) | MIT | version-matched | node_modules/expo/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-application@57.0.3 (node_modules/expo-application) | MIT | version-matched | node_modules/expo-application/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-asset@57.0.20 (node_modules/expo-asset) | MIT | version-matched | node_modules/expo-asset/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-audio@57.0.5 (node_modules/expo-audio) | MIT | version-matched | node_modules/expo-audio/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-constants@57.0.22 (node_modules/expo-constants) | MIT | version-matched | node_modules/expo-constants/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| @expo/env@2.4.3 (node_modules/expo-constants/node_modules/@expo/env) | MIT | version-matched | node_modules/expo-constants/node_modules/@expo/env/LICENSE [text-9d9cf7980a46628abcbcf88577ecaed2968b69f9123d6aaba6f9496ed3648c1a] |
| expo-document-picker@57.0.3 (node_modules/expo-document-picker) | MIT | version-matched | node_modules/expo-document-picker/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-file-system@57.0.7 (node_modules/expo-file-system) | MIT | version-matched | node_modules/expo-file-system/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-font@57.0.4 (node_modules/expo-font) | MIT | version-matched | node_modules/expo-font/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-glass-effect@57.0.4 (node_modules/expo-glass-effect) | MIT | version-matched | node_modules/expo-glass-effect/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-haptics@57.0.3 (node_modules/expo-haptics) | MIT | version-matched | node_modules/expo-haptics/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-linear-gradient@57.0.2 (node_modules/expo-linear-gradient) | MIT | version-matched | node_modules/expo-linear-gradient/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-linking@57.0.13 (node_modules/expo-linking) | MIT | version-matched | node_modules/expo-linking/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-modules-autolinking@57.0.16 (node_modules/expo-modules-autolinking) | MIT | version-matched | node_modules/expo-modules-autolinking/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-modules-core@57.0.24 (node_modules/expo-modules-core) | MIT | version-matched | node_modules/expo-modules-core/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-modules-jsi@57.1.3 (node_modules/expo-modules-jsi) | MIT | version-matched | node_modules/expo-modules-jsi/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-notifications@57.0.23 (node_modules/expo-notifications) | MIT | version-matched | node_modules/expo-notifications/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-router@57.0.29 (node_modules/expo-router) | MIT | version-matched | node_modules/expo-router/vendor/react-helmet-async/LICENSE [text-c358ea82eed53098b2ee0913e1de8243c69d45862e11c48614db47fd5889d947] |
| @radix-ui/react-collection@1.2.0 (node_modules/expo-router/node_modules/@radix-ui/react-collection) | MIT | version-matched | node_modules/expo-router/node_modules/@radix-ui/react-collection/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-presence@1.1.11 (node_modules/expo-router/node_modules/@radix-ui/react-presence) | MIT | version-matched | node_modules/expo-router/node_modules/@radix-ui/react-presence/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-primitive@2.2.0 (node_modules/expo-router/node_modules/@radix-ui/react-primitive) | MIT | version-matched | node_modules/expo-router/node_modules/@radix-ui/react-primitive/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-roving-focus@1.2.1 (node_modules/expo-router/node_modules/@radix-ui/react-roving-focus) | MIT | version-matched | node_modules/expo-router/node_modules/@radix-ui/react-roving-focus/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-tabs@1.2.1 (node_modules/expo-router/node_modules/@radix-ui/react-tabs) | MIT | version-matched | node_modules/expo-router/node_modules/@radix-ui/react-tabs/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| react-is@19.3.1 (node_modules/expo-router/node_modules/react-is) | MIT | version-matched | node_modules/expo-router/node_modules/react-is/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| expo-server@57.0.3 (node_modules/expo-server) | MIT | version-matched | node_modules/expo-server/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-sharing@57.0.24 (node_modules/expo-sharing) | MIT | version-matched | node_modules/expo-sharing/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-splash-screen@57.0.10 (node_modules/expo-splash-screen) | MIT | version-matched | node_modules/expo-splash-screen/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-sqlite@57.0.4 (node_modules/expo-sqlite) | MIT | version-matched | node_modules/expo-sqlite/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-status-bar@57.0.1 (node_modules/expo-status-bar) | MIT | version-matched | node_modules/expo-status-bar/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-symbols@57.0.3 (node_modules/expo-symbols) | MIT | version-matched | node_modules/expo-symbols/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| expo-system-ui@57.0.4 (node_modules/expo-system-ui) | MIT | version-matched | node_modules/expo-system-ui/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| @expo/cli@57.0.32 (node_modules/expo/node_modules/@expo/cli) | MIT | version-matched | node_modules/expo/node_modules/@expo/cli/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| @expo/router-server@57.0.14 (node_modules/expo/node_modules/@expo/cli/node_modules/@expo/router-server) | MIT | version-matched | node_modules/expo/node_modules/@expo/cli/node_modules/@expo/router-server/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| @expo/env@2.4.3 (node_modules/expo/node_modules/@expo/env) | MIT | version-matched | node_modules/expo/node_modules/@expo/env/LICENSE [text-9d9cf7980a46628abcbcf88577ecaed2968b69f9123d6aaba6f9496ed3648c1a] |
| @expo/ws-tunnel@2.0.1 (node_modules/expo/node_modules/@expo/ws-tunnel) | MIT | version-matched | node_modules/expo/node_modules/@expo/ws-tunnel/LICENSE [text-49c5f9c7097c9a940ff663a54c27a4c60e379df6cc2b3052df0d37a09a85df93] |
| accepts@1.3.8 (node_modules/expo/node_modules/accepts) | MIT | version-matched | node_modules/expo/node_modules/accepts/LICENSE [text-71f83c4c0621102a56d9853812777b85751bce7e9726f686f5b056c1f8a4b0e6] |
| ci-info@3.9.0 (node_modules/expo/node_modules/ci-info) | MIT | version-matched | node_modules/expo/node_modules/ci-info/LICENSE [text-f58943cb354fb2707fea2f7b26b04e6014ddb56835cdfd414c9d2c6c59165b64] |
| expo-keep-awake@57.0.2 (node_modules/expo/node_modules/expo-keep-awake) | MIT | version-matched | node_modules/expo/node_modules/expo-keep-awake/LICENSE [text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4] |
| mime-db@1.52.0 (node_modules/expo/node_modules/mime-db) | MIT | version-matched | node_modules/expo/node_modules/mime-db/LICENSE [text-cc1dfd4dafa27271e8212cd3b274eeb3f262e40a6fdab36ddc3f9696f706f58b] |
| mime-types@2.1.35 (node_modules/expo/node_modules/mime-types) | MIT | version-matched | node_modules/expo/node_modules/mime-types/LICENSE [text-71f83c4c0621102a56d9853812777b85751bce7e9726f686f5b056c1f8a4b0e6] |
| negotiator@0.6.3 (node_modules/expo/node_modules/negotiator) | MIT | version-matched | node_modules/expo/node_modules/negotiator/LICENSE [text-553d4d20029a24e315b428a1a54a9e109eaa340f2e958a4f50a92362c2c4070b] |
| picomatch@4.0.7 (node_modules/expo/node_modules/picomatch) | MIT | version-matched | node_modules/expo/node_modules/picomatch/LICENSE [text-d0cd141b0c322fded5dfad1d4645bb2fedfc05b7321fe1009469638190d59ef9] |
| ws@8.22.0 (node_modules/expo/node_modules/ws) | MIT | version-matched | node_modules/expo/node_modules/ws/LICENSE [text-2b29dcfe0d6471f7e8c92c5fb38c9f93edee10330937055440192f1832b1ecef] |
| zod@3.25.76 (node_modules/expo/node_modules/zod) | MIT | version-matched | node_modules/expo/node_modules/zod/LICENSE [text-3f1189b28e3866e0d979968d466b78f813f76827cfdca1fbb124cc0a5c8841f8] |
| exponential-backoff@3.1.3 (node_modules/exponential-backoff) | Apache-2.0 | version-matched | node_modules/exponential-backoff/LICENSE [text-f5afc95c69e116ea6b1755f91a8763f53eadb78b4f1582a08d2d18586a03a117] |
| fast-deep-equal@3.1.3 (node_modules/fast-deep-equal) | MIT | version-matched | node_modules/fast-deep-equal/LICENSE [text-7bf9b2de73a6b356761c948d0e9eeb4be6c1270bd04c79cd489c1e400ffdfc1a] |
| fast-json-stable-stringify@2.1.0 (node_modules/fast-json-stable-stringify) | MIT | version-matched | node_modules/fast-json-stable-stringify/LICENSE [text-a833d366242c298cf1b10263516572fb8dcbe68eb5072cdcac2b4546e2b4eb36] |
| fb-dotslash@0.5.8 (node_modules/fb-dotslash) | (MIT OR Apache-2.0) | version-matched | (none found) |
| fb-watchman@2.0.4 (node_modules/fb-watchman) | MIT | version-matched | node_modules/fb-watchman/LICENSE [text-2d4c3d00d67067461412a2d9a2f3f8b7b9cda62b3db501e4b6844ccf35c949aa] |
| fetch-nodeshim@0.4.10 (node_modules/fetch-nodeshim) | MIT | version-matched | node_modules/fetch-nodeshim/LICENSE.md [text-540c425a30eea428eb24cc9d6884982783eb89403f443db1a4ad61eb78003f04] |
| fflate@0.8.2 (node_modules/fflate) | MIT | version-matched | node_modules/fflate/LICENSE [text-805f6cb28bb8b6d3a0badd83c93bccd9671fa01a3b4b92b7042b0743325ac243] |
| fill-range@7.1.1 (node_modules/fill-range) | MIT | version-matched | node_modules/fill-range/LICENSE [text-35bdd8a44339719441900fb50fbefc5e2dca1ca662cbaed7a687de842c8b70f2] |
| filter-obj@1.1.0 (node_modules/filter-obj) | MIT | version-matched | node_modules/filter-obj/license [text-6fb9754611c20f6649f68805e8c990e83261f29316e29de9e6cedae607b8634c] |
| finalhandler@1.1.2 (node_modules/finalhandler) | MIT | version-matched | node_modules/finalhandler/LICENSE [text-24973d5320410e565ec92f18f73f12af7d97c634d414ba170d119fe3f98904c8] |
| debug@2.6.9 (node_modules/finalhandler/node_modules/debug) | MIT | version-matched | node_modules/finalhandler/node_modules/debug/LICENSE [text-98c970de440dcfc77471610aec2377c9d9b0db2b3be6d1add524a586e1d7f422] |
| ms@2.0.0 (node_modules/finalhandler/node_modules/ms) | MIT | version-matched | node_modules/finalhandler/node_modules/ms/license.md [text-6652830c2607c722b66f1b57de15877ab8fc5dca406cc5b335afeb365d0f32c1] |
| find-up@4.1.0 (node_modules/find-up) | MIT | version-matched | node_modules/find-up/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| flow-enums-runtime@0.0.6 (node_modules/flow-enums-runtime) | MIT | version-matched | node_modules/flow-enums-runtime/LICENSE [text-52412d7bc7ce4157ea628bbaacb8829e0a9cb3c58f57f99176126bc8cf2bfc85] |
| fontfaceobserver@2.3.0 (node_modules/fontfaceobserver) | BSD-2-Clause | version-matched | node_modules/fontfaceobserver/LICENSE [text-00b9d4904d850fcd9bb470d0f4853c50f169df974fab5552cf41a4ff81a524e2] |
| fresh@0.5.2 (node_modules/fresh) | MIT | version-matched | node_modules/fresh/LICENSE [text-a0ec0dab16b3666f24950f86d257930ac2ad475557b4bfe245620e0817d8a45d] |
| fs.realpath@1.0.0 (node_modules/fs.realpath) | ISC | version-matched | node_modules/fs.realpath/LICENSE [text-8465b04b67f473341171b5c9c8b2c741a4a395b3f6ed58339b3a4f4db3db7472] |
| fsevents@2.3.3 (node_modules/fsevents) | MIT | not-installed · optional | (none found) |
| function-bind@1.1.2 (node_modules/function-bind) | MIT | version-matched | node_modules/function-bind/LICENSE [text-773e131a7684726005a7e4688a80b4620033bc08499bc1404dd1a1eb3bca725e] |
| gensync@1.0.0-beta.2 (node_modules/gensync) | MIT | version-matched | node_modules/gensync/LICENSE [text-e3a956681ee067f971ac413994171b3d90ca801ec6324e76c9c55366cfe31cb0] |
| get-caller-file@2.0.5 (node_modules/get-caller-file) | ISC | version-matched | node_modules/get-caller-file/LICENSE.md [text-902dbb4154679fb2b8d7c33878183f45b268d01eae5e5033dddaa8852d45f213] |
| get-nonce@1.0.1 (node_modules/get-nonce) | MIT | version-matched | node_modules/get-nonce/LICENSE [text-acf3b087b348d2f2e731b9d4131af185aad694c1204ce14a46909483fd42da05] |
| get-package-type@0.1.0 (node_modules/get-package-type) | MIT | version-matched | node_modules/get-package-type/LICENSE [text-24a4cce7958e3905080069a18952f1f35796fcd861b4c5686047f0a33faa21ed] |
| get-stream@6.0.1 (node_modules/get-stream) | MIT | version-matched | node_modules/get-stream/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| getenv@2.0.0 (node_modules/getenv) | MIT | version-matched | node_modules/getenv/LICENSE.md [text-df408d2e27f1df207f97556db32aba3921883ebce365ada1c354d89ad3114a96] |
| glob@13.0.6 (node_modules/glob) | BlueOak-1.0.0 | version-matched | node_modules/glob/LICENSE.md [text-a49c9ba464796f65b59fca3f1e6ca40912df1e859f575383223f7ec6c5baae09] |
| graceful-fs@4.2.11 (node_modules/graceful-fs) | ISC | version-matched | node_modules/graceful-fs/LICENSE [text-f65c5d9f22a317b2a10803bd1868461ce6499c2ed7217bc80c0cc772a748789c] |
| has-flag@4.0.0 (node_modules/has-flag) | MIT | version-matched | node_modules/has-flag/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| hasown@2.0.4 (node_modules/hasown) | MIT | version-matched | node_modules/hasown/LICENSE [text-bf9b0d665be2a689851eea667ca9f42066ea1d903b38349c51e6a44b2577680a] |
| hermes-compiler@250829098.0.17 (node_modules/hermes-compiler) | MIT | version-matched | (none found) |
| hermes-estree@0.35.0 (node_modules/hermes-estree) | MIT | version-matched | node_modules/hermes-estree/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| hermes-parser@0.35.0 (node_modules/hermes-parser) | MIT | version-matched | node_modules/hermes-parser/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| hosted-git-info@7.0.2 (node_modules/hosted-git-info) | ISC | version-matched | node_modules/hosted-git-info/LICENSE [text-c1476ec53119cd4c8370f91f5152ac76312a29b4fae2d49b5e0e0970fe0fa5ee] |
| lru-cache@10.4.3 (node_modules/hosted-git-info/node_modules/lru-cache) | ISC | version-matched | node_modules/hosted-git-info/node_modules/lru-cache/LICENSE [text-451ec07eeb9c4e1b86de9abdaa426462a8be48f887ec7421cf0bbb9c769555ab] |
| html-escaper@2.0.2 (node_modules/html-escaper) | MIT | version-matched | node_modules/html-escaper/LICENSE.txt [text-27d06bbb2eb031be8aa376868a2e1f11b6acba938d4cc8e1234b66b9739c54a3] |
| http-errors@2.0.1 (node_modules/http-errors) | MIT | version-matched | node_modules/http-errors/LICENSE [text-dcb94ff9b1e037a847bc20589dc81a1066d041fd4c16deb18b0fa968c66cf395] |
| statuses@2.0.2 (node_modules/http-errors/node_modules/statuses) | MIT | version-matched | node_modules/http-errors/node_modules/statuses/LICENSE [text-512cfa4d5e7a7569c7ae4dd95241cb6ae2aaf648ef9ebd080c01bd24868d26e9] |
| https-proxy-agent@7.0.6 (node_modules/https-proxy-agent) | MIT | version-matched | node_modules/https-proxy-agent/LICENSE [text-8d8c55319c7729d57be811c747452636688d54f19701ee0752b6b15ad3771d9a] |
| human-signals@2.1.0 (node_modules/human-signals) | Apache-2.0 | version-matched | node_modules/human-signals/LICENSE [text-0f2c1c521a08ca2e202316a29c57cba39077ebe2618cf10f23df410f4047f60a] |
| ignore@5.3.2 (node_modules/ignore) | MIT | version-matched | node_modules/ignore/LICENSE-MIT [text-9c94db23dc4b1e9aaee5d195668b916afc71efed54af226b66cf0ccc4389c1c0] |
| import-local@3.2.0 (node_modules/import-local) | MIT | version-matched | node_modules/import-local/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| imurmurhash@0.1.4 (node_modules/imurmurhash) | MIT | version-matched | (none found) |
| indent-string@4.0.0 (node_modules/indent-string) | MIT | version-matched | node_modules/indent-string/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| inflight@1.0.6 (node_modules/inflight) | ISC | version-matched | node_modules/inflight/LICENSE [text-05dc4d785ac3a488676d3ed10e901b75ad89dafcc63f8e66610fd4a39cc5c7e8] |
| inherits@2.0.4 (node_modules/inherits) | ISC | version-matched | node_modules/inherits/LICENSE [text-5ffe28e7ade7d8f10d85d5337a73fd793dac5c462fb9a28fbf8c5046c7fbca3b] |
| invariant@2.2.4 (node_modules/invariant) | MIT | version-matched | node_modules/invariant/LICENSE [text-f657f99d3fb9647db92628e96007aabb46e5f04f33e49999075aab8e250ca7ce] |
| is-arrayish@0.3.4 (node_modules/is-arrayish) | MIT | version-matched | node_modules/is-arrayish/LICENSE [text-92b07a2e5b0e051d37dde85042c736d6d551cfcbc0983f39d7ef903b3986bbc1] |
| is-core-module@2.17.0 (node_modules/is-core-module) | MIT | version-matched | node_modules/is-core-module/LICENSE [text-5c496ce5ae47eb8e5ddcaa5e29c27c446a3855b19e3a66991b52f361bed22b28] |
| is-docker@2.2.1 (node_modules/is-docker) | MIT | version-matched | node_modules/is-docker/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| is-fullwidth-code-point@3.0.0 (node_modules/is-fullwidth-code-point) | MIT | version-matched | node_modules/is-fullwidth-code-point/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| is-generator-fn@2.1.0 (node_modules/is-generator-fn) | MIT | version-matched | node_modules/is-generator-fn/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| is-number@7.0.0 (node_modules/is-number) | MIT | version-matched | node_modules/is-number/LICENSE [text-35bdd8a44339719441900fb50fbefc5e2dca1ca662cbaed7a687de842c8b70f2] |
| is-stream@2.0.1 (node_modules/is-stream) | MIT | version-matched | node_modules/is-stream/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| is-wsl@2.2.0 (node_modules/is-wsl) | MIT | version-matched | node_modules/is-wsl/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| isexe@2.0.0 (node_modules/isexe) | ISC | version-matched | node_modules/isexe/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| istanbul-lib-coverage@3.2.2 (node_modules/istanbul-lib-coverage) | BSD-3-Clause | version-matched | node_modules/istanbul-lib-coverage/LICENSE [text-e09f9b52c6ce5c17ba8103cd0cbf446c33b5448b0c1d01d711b36a1f15a501ba] |
| istanbul-lib-instrument@5.2.1 (node_modules/istanbul-lib-instrument) | BSD-3-Clause | version-matched | node_modules/istanbul-lib-instrument/LICENSE [text-e09f9b52c6ce5c17ba8103cd0cbf446c33b5448b0c1d01d711b36a1f15a501ba] |
| semver@6.3.1 (node_modules/istanbul-lib-instrument/node_modules/semver) | ISC | version-matched | node_modules/istanbul-lib-instrument/node_modules/semver/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| istanbul-lib-report@3.0.1 (node_modules/istanbul-lib-report) | BSD-3-Clause | version-matched | node_modules/istanbul-lib-report/LICENSE [text-e09f9b52c6ce5c17ba8103cd0cbf446c33b5448b0c1d01d711b36a1f15a501ba] |
| istanbul-lib-source-maps@4.0.1 (node_modules/istanbul-lib-source-maps) | BSD-3-Clause | version-matched | node_modules/istanbul-lib-source-maps/LICENSE [text-b661867c1d66a1b71ee3a6109159874334cd5c182a80d1bcc7353b5a4c6823c6] |
| source-map@0.6.1 (node_modules/istanbul-lib-source-maps/node_modules/source-map) | BSD-3-Clause | version-matched | node_modules/istanbul-lib-source-maps/node_modules/source-map/LICENSE [text-6cb0631f71c7749763fd3dd1d5bee52dd1070ec17f2edc1710079ad070bd2fbd] |
| istanbul-reports@3.2.0 (node_modules/istanbul-reports) | BSD-3-Clause | version-matched | node_modules/istanbul-reports/LICENSE [text-e09f9b52c6ce5c17ba8103cd0cbf446c33b5448b0c1d01d711b36a1f15a501ba] |
| jest@29.7.0 (node_modules/jest) | MIT | version-matched | node_modules/jest/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-changed-files@29.7.0 (node_modules/jest-changed-files) | MIT | version-matched | node_modules/jest-changed-files/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-circus@29.7.0 (node_modules/jest-circus) | MIT | version-matched | node_modules/jest-circus/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-diff@29.7.0 (node_modules/jest-circus/node_modules/jest-diff) | MIT | version-matched | node_modules/jest-circus/node_modules/jest-diff/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-matcher-utils@29.7.0 (node_modules/jest-circus/node_modules/jest-matcher-utils) | MIT | version-matched | node_modules/jest-circus/node_modules/jest-matcher-utils/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-cli@29.7.0 (node_modules/jest-cli) | MIT | version-matched | node_modules/jest-cli/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-config@29.7.0 (node_modules/jest-config) | MIT | version-matched | node_modules/jest-config/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| balanced-match@1.0.2 (node_modules/jest-config/node_modules/balanced-match) | MIT | version-matched | node_modules/jest-config/node_modules/balanced-match/LICENSE.md [text-a1bd5deadb6a06dd74efa852c1b8b23f63b67f2214fbe9c8bd591da51da69268] |
| brace-expansion@1.1.21 (node_modules/jest-config/node_modules/brace-expansion) | MIT | version-matched | node_modules/jest-config/node_modules/brace-expansion/LICENSE [text-68f12f6e2c33688699249c01d8f9623c534da20aa71989c57b061b7bc1676d14] |
| ci-info@3.9.0 (node_modules/jest-config/node_modules/ci-info) | MIT | version-matched | node_modules/jest-config/node_modules/ci-info/LICENSE [text-f58943cb354fb2707fea2f7b26b04e6014ddb56835cdfd414c9d2c6c59165b64] |
| glob@7.2.3 (node_modules/jest-config/node_modules/glob) | ISC | version-matched | node_modules/jest-config/node_modules/glob/LICENSE [text-6236fa0b88a4a0cce3dda0367979491b2052b3c8d6b1c10b3668de083e86a7f0] |
| minimatch@3.1.5 (node_modules/jest-config/node_modules/minimatch) | ISC | version-matched | node_modules/jest-config/node_modules/minimatch/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| jest-diff@30.5.2 (node_modules/jest-diff) | MIT | version-matched | node_modules/jest-diff/LICENSE [text-9d5211db733ccdd26f9170bec24cdca84093f60415da6b769ee9cdf23d04e19f] |
| @jest/schemas@30.5.0 (node_modules/jest-diff/node_modules/@jest/schemas) | MIT | version-matched | node_modules/jest-diff/node_modules/@jest/schemas/LICENSE [text-9d5211db733ccdd26f9170bec24cdca84093f60415da6b769ee9cdf23d04e19f] |
| @sinclair/typebox@0.34.52 (node_modules/jest-diff/node_modules/@sinclair/typebox) | MIT | version-matched | node_modules/jest-diff/node_modules/@sinclair/typebox/license [text-a62f9f2edd97ed0d92f0ef93584dd109a7d34299795abc7780b8b5a85ff00671] |
| ansi-styles@5.2.0 (node_modules/jest-diff/node_modules/ansi-styles) | MIT | version-matched | node_modules/jest-diff/node_modules/ansi-styles/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| pretty-format@30.5.1 (node_modules/jest-diff/node_modules/pretty-format) | MIT | version-matched | node_modules/jest-diff/node_modules/pretty-format/LICENSE [text-9d5211db733ccdd26f9170bec24cdca84093f60415da6b769ee9cdf23d04e19f] |
| jest-docblock@29.7.0 (node_modules/jest-docblock) | MIT | version-matched | node_modules/jest-docblock/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-each@29.7.0 (node_modules/jest-each) | MIT | version-matched | node_modules/jest-each/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-environment-node@29.7.0 (node_modules/jest-environment-node) | MIT | version-matched | node_modules/jest-environment-node/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-get-type@29.6.3 (node_modules/jest-get-type) | MIT | version-matched | node_modules/jest-get-type/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-haste-map@29.7.0 (node_modules/jest-haste-map) | MIT | version-matched | node_modules/jest-haste-map/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-leak-detector@29.7.0 (node_modules/jest-leak-detector) | MIT | version-matched | node_modules/jest-leak-detector/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-matcher-utils@30.5.2 (node_modules/jest-matcher-utils) | MIT | version-matched | node_modules/jest-matcher-utils/LICENSE [text-9d5211db733ccdd26f9170bec24cdca84093f60415da6b769ee9cdf23d04e19f] |
| @jest/schemas@30.5.0 (node_modules/jest-matcher-utils/node_modules/@jest/schemas) | MIT | version-matched | node_modules/jest-matcher-utils/node_modules/@jest/schemas/LICENSE [text-9d5211db733ccdd26f9170bec24cdca84093f60415da6b769ee9cdf23d04e19f] |
| @sinclair/typebox@0.34.52 (node_modules/jest-matcher-utils/node_modules/@sinclair/typebox) | MIT | version-matched | node_modules/jest-matcher-utils/node_modules/@sinclair/typebox/license [text-a62f9f2edd97ed0d92f0ef93584dd109a7d34299795abc7780b8b5a85ff00671] |
| ansi-styles@5.2.0 (node_modules/jest-matcher-utils/node_modules/ansi-styles) | MIT | version-matched | node_modules/jest-matcher-utils/node_modules/ansi-styles/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| pretty-format@30.5.1 (node_modules/jest-matcher-utils/node_modules/pretty-format) | MIT | version-matched | node_modules/jest-matcher-utils/node_modules/pretty-format/LICENSE [text-9d5211db733ccdd26f9170bec24cdca84093f60415da6b769ee9cdf23d04e19f] |
| jest-message-util@29.7.0 (node_modules/jest-message-util) | MIT | version-matched | node_modules/jest-message-util/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-mock@29.7.0 (node_modules/jest-mock) | MIT | version-matched | node_modules/jest-mock/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-pnp-resolver@1.2.3 (node_modules/jest-pnp-resolver) | MIT | version-matched | (none found) |
| jest-regex-util@29.6.3 (node_modules/jest-regex-util) | MIT | version-matched | node_modules/jest-regex-util/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-resolve@29.7.0 (node_modules/jest-resolve) | MIT | version-matched | node_modules/jest-resolve/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-resolve-dependencies@29.7.0 (node_modules/jest-resolve-dependencies) | MIT | version-matched | node_modules/jest-resolve-dependencies/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-runner@29.7.0 (node_modules/jest-runner) | MIT | version-matched | node_modules/jest-runner/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| source-map@0.6.1 (node_modules/jest-runner/node_modules/source-map) | BSD-3-Clause | version-matched | node_modules/jest-runner/node_modules/source-map/LICENSE [text-6cb0631f71c7749763fd3dd1d5bee52dd1070ec17f2edc1710079ad070bd2fbd] |
| source-map-support@0.5.13 (node_modules/jest-runner/node_modules/source-map-support) | MIT | version-matched | node_modules/jest-runner/node_modules/source-map-support/LICENSE.md [text-3a7d3bb198e909ed642bd68bd29a7d7c09a636d27a51ec663d35f00c4760ec42] |
| jest-runtime@29.7.0 (node_modules/jest-runtime) | MIT | version-matched | node_modules/jest-runtime/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| balanced-match@1.0.2 (node_modules/jest-runtime/node_modules/balanced-match) | MIT | version-matched | node_modules/jest-runtime/node_modules/balanced-match/LICENSE.md [text-a1bd5deadb6a06dd74efa852c1b8b23f63b67f2214fbe9c8bd591da51da69268] |
| brace-expansion@1.1.21 (node_modules/jest-runtime/node_modules/brace-expansion) | MIT | version-matched | node_modules/jest-runtime/node_modules/brace-expansion/LICENSE [text-68f12f6e2c33688699249c01d8f9623c534da20aa71989c57b061b7bc1676d14] |
| glob@7.2.3 (node_modules/jest-runtime/node_modules/glob) | ISC | version-matched | node_modules/jest-runtime/node_modules/glob/LICENSE [text-6236fa0b88a4a0cce3dda0367979491b2052b3c8d6b1c10b3668de083e86a7f0] |
| minimatch@3.1.5 (node_modules/jest-runtime/node_modules/minimatch) | ISC | version-matched | node_modules/jest-runtime/node_modules/minimatch/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| jest-snapshot@29.7.0 (node_modules/jest-snapshot) | MIT | version-matched | node_modules/jest-snapshot/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-diff@29.7.0 (node_modules/jest-snapshot/node_modules/jest-diff) | MIT | version-matched | node_modules/jest-snapshot/node_modules/jest-diff/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-matcher-utils@29.7.0 (node_modules/jest-snapshot/node_modules/jest-matcher-utils) | MIT | version-matched | node_modules/jest-snapshot/node_modules/jest-matcher-utils/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-util@29.7.0 (node_modules/jest-util) | MIT | version-matched | node_modules/jest-util/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| ci-info@3.9.0 (node_modules/jest-util/node_modules/ci-info) | MIT | version-matched | node_modules/jest-util/node_modules/ci-info/LICENSE [text-f58943cb354fb2707fea2f7b26b04e6014ddb56835cdfd414c9d2c6c59165b64] |
| jest-validate@29.7.0 (node_modules/jest-validate) | MIT | version-matched | node_modules/jest-validate/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-watcher@29.7.0 (node_modules/jest-watcher) | MIT | version-matched | node_modules/jest-watcher/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| jest-worker@29.7.0 (node_modules/jest-worker) | MIT | version-matched | node_modules/jest-worker/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| supports-color@8.1.1 (node_modules/jest-worker/node_modules/supports-color) | MIT | version-matched | node_modules/jest-worker/node_modules/supports-color/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| jimp-compact@0.16.1 (node_modules/jimp-compact) | MIT | version-matched | (none found) |
| js-tokens@4.0.0 (node_modules/js-tokens) | MIT | version-matched | node_modules/js-tokens/LICENSE [text-2213d91c606205c71eb051a199478cdc2adde945893404d7f1421436dd6d5cc1] |
| js-yaml@4.3.2 (node_modules/js-yaml) | MIT | version-matched | node_modules/js-yaml/LICENSE [text-a07bc24468b9654ce76a547d47a2db282d07733b715db4c73a98bd63961f9550] |
| jsc-safe-url@0.2.4 (node_modules/jsc-safe-url) | 0BSD | version-matched | node_modules/jsc-safe-url/LICENSE [text-096ff3c9ceea6df46491b0d04e4a9dca7b4be87b1b7f0b7c08a8aea08a0ffb40] |
| jsesc@3.1.0 (node_modules/jsesc) | MIT | version-matched | node_modules/jsesc/LICENSE-MIT.txt [text-483acb265f182907d1caf6cff9c16c96f31325ed23792832cc5d8b12d5f88c8a] |
| json-parse-even-better-errors@2.3.1 (node_modules/json-parse-even-better-errors) | MIT | version-matched | node_modules/json-parse-even-better-errors/LICENSE.md [text-50627796eb4236cd05674e71d090e594447995225b7d94cd59e57c25fa3a0217] |
| json5@2.2.3 (node_modules/json5) | MIT | version-matched | node_modules/json5/LICENSE.md [text-53e59feb13058722d977c699eb0407c7bce2f93c949b681bbd2ff31698535927] |
| kleur@3.0.3 (node_modules/kleur) | MIT | version-matched | node_modules/kleur/license [text-306fa513e39b23a6e8747520de761809d206b99800ef41907b530226574c59ae] |
| lan-network@0.2.1 (node_modules/lan-network) | MIT | version-matched | node_modules/lan-network/LICENSE.md [text-8ff4aae800e54e41c72f162f6227aa3f23209b0db4936efee7a7249015492e15] |
| leven@3.1.0 (node_modules/leven) | MIT | version-matched | node_modules/leven/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| lighthouse-logger@1.4.2 (node_modules/lighthouse-logger) | Apache-2.0 | version-matched | node_modules/lighthouse-logger/LICENSE [text-7ec9661a8afafab1eee3523d6f1a193eff76314a5ab10b4ce96aefd87621b0c3] |
| debug@2.6.9 (node_modules/lighthouse-logger/node_modules/debug) | MIT | version-matched | node_modules/lighthouse-logger/node_modules/debug/LICENSE [text-98c970de440dcfc77471610aec2377c9d9b0db2b3be6d1add524a586e1d7f422] |
| ms@2.0.0 (node_modules/lighthouse-logger/node_modules/ms) | MIT | version-matched | node_modules/lighthouse-logger/node_modules/ms/license.md [text-6652830c2607c722b66f1b57de15877ab8fc5dca406cc5b335afeb365d0f32c1] |
| lightningcss@1.33.0 (node_modules/lightningcss) | MPL-2.0 | version-matched | node_modules/lightningcss/LICENSE [text-5eba353fe5076ac3432177f8ab1cf75e3afcd0584251e37c3bfead5f447d040e] |
| lightningcss-android-arm64@1.33.0 (node_modules/lightningcss-android-arm64) | MPL-2.0 | not-installed · optional | (none found) |
| lightningcss-darwin-arm64@1.33.0 (node_modules/lightningcss-darwin-arm64) | MPL-2.0 | not-installed · optional | (none found) |
| lightningcss-darwin-x64@1.33.0 (node_modules/lightningcss-darwin-x64) | MPL-2.0 | not-installed · optional | (none found) |
| lightningcss-freebsd-x64@1.33.0 (node_modules/lightningcss-freebsd-x64) | MPL-2.0 | not-installed · optional | (none found) |
| lightningcss-linux-arm-gnueabihf@1.33.0 (node_modules/lightningcss-linux-arm-gnueabihf) | MPL-2.0 | not-installed · optional | (none found) |
| lightningcss-linux-arm64-gnu@1.33.0 (node_modules/lightningcss-linux-arm64-gnu) | MPL-2.0 | not-installed · optional | (none found) |
| lightningcss-linux-arm64-musl@1.33.0 (node_modules/lightningcss-linux-arm64-musl) | MPL-2.0 | not-installed · optional | (none found) |
| lightningcss-linux-x64-gnu@1.33.0 (node_modules/lightningcss-linux-x64-gnu) | MPL-2.0 | version-matched · optional | node_modules/lightningcss-linux-x64-gnu/LICENSE [text-5eba353fe5076ac3432177f8ab1cf75e3afcd0584251e37c3bfead5f447d040e] |
| lightningcss-linux-x64-musl@1.33.0 (node_modules/lightningcss-linux-x64-musl) | MPL-2.0 | version-matched · optional | node_modules/lightningcss-linux-x64-musl/LICENSE [text-5eba353fe5076ac3432177f8ab1cf75e3afcd0584251e37c3bfead5f447d040e] |
| lightningcss-win32-arm64-msvc@1.33.0 (node_modules/lightningcss-win32-arm64-msvc) | MPL-2.0 | not-installed · optional | (none found) |
| lightningcss-win32-x64-msvc@1.33.0 (node_modules/lightningcss-win32-x64-msvc) | MPL-2.0 | not-installed · optional | (none found) |
| lines-and-columns@1.2.4 (node_modules/lines-and-columns) | MIT | version-matched | node_modules/lines-and-columns/LICENSE [text-456fe85ad3e71db9523313cf7437b0f90c392d8a48c869908e46716b26d2cf53] |
| locate-path@5.0.0 (node_modules/locate-path) | MIT | version-matched | node_modules/locate-path/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| lodash.debounce@4.0.8 (node_modules/lodash.debounce) | MIT | version-matched | node_modules/lodash.debounce/LICENSE [text-ffd8b33b354585f4ce119f19c53728281e48a97b074491eb6bf6d5c5ff305272] |
| lodash.throttle@4.1.1 (node_modules/lodash.throttle) | MIT | version-matched | node_modules/lodash.throttle/LICENSE [text-ffd8b33b354585f4ce119f19c53728281e48a97b074491eb6bf6d5c5ff305272] |
| log-symbols@2.2.0 (node_modules/log-symbols) | MIT | version-matched | node_modules/log-symbols/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| ansi-styles@3.2.1 (node_modules/log-symbols/node_modules/ansi-styles) | MIT | version-matched | node_modules/log-symbols/node_modules/ansi-styles/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| chalk@2.4.2 (node_modules/log-symbols/node_modules/chalk) | MIT | version-matched | node_modules/log-symbols/node_modules/chalk/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| color-convert@1.9.3 (node_modules/log-symbols/node_modules/color-convert) | MIT | version-matched | node_modules/log-symbols/node_modules/color-convert/LICENSE [text-693866fc419c6f61c8570438ec00659d156ec2b4d4a4d04091711f5f11a365d4] |
| color-name@1.1.3 (node_modules/log-symbols/node_modules/color-name) | MIT | version-matched | node_modules/log-symbols/node_modules/color-name/LICENSE [text-c064f7a3e353bc1bc977f3c897941c75ef763f44f41677e0a15370ca0853d6e2] |
| escape-string-regexp@1.0.5 (node_modules/log-symbols/node_modules/escape-string-regexp) | MIT | version-matched | node_modules/log-symbols/node_modules/escape-string-regexp/license [text-6fb9754611c20f6649f68805e8c990e83261f29316e29de9e6cedae607b8634c] |
| has-flag@3.0.0 (node_modules/log-symbols/node_modules/has-flag) | MIT | version-matched | node_modules/log-symbols/node_modules/has-flag/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| supports-color@5.5.0 (node_modules/log-symbols/node_modules/supports-color) | MIT | version-matched | node_modules/log-symbols/node_modules/supports-color/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| loose-envify@1.4.0 (node_modules/loose-envify) | MIT | version-matched | node_modules/loose-envify/LICENSE [text-4eb7543b08d955a6d23fcc224601d43ff566e775be918805e26210d7f6eb4893] |
| lru-cache@5.1.1 (node_modules/lru-cache) | ISC | version-matched | node_modules/lru-cache/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| make-dir@4.0.0 (node_modules/make-dir) | MIT | version-matched | node_modules/make-dir/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| makeerror@1.0.12 (node_modules/makeerror) | BSD-3-Clause | version-matched | node_modules/makeerror/license [text-efd6f9e708b909de1a18730b90fb6394a3125680ac2f98a87cd23d1a0c93afa2] |
| marky@1.3.0 (node_modules/marky) | Apache-2.0 | version-matched | node_modules/marky/LICENSE [text-f1d42ae4dd4e847f03e57241ab62538f35580ce533acf1d8274426283b01151c] |
| mdn-data@2.0.14 (node_modules/mdn-data) | CC0-1.0 | version-matched | node_modules/mdn-data/LICENSE [text-36ffd9dc085d529a7e60e1276d73ae5a030b020313e6c5408593a6ae2af39673] |
| memoize-one@5.2.1 (node_modules/memoize-one) | MIT | version-matched | node_modules/memoize-one/LICENSE [text-b1c501095de70182748cb8e8d97ac5577701a4ef3b755ba30d59fd87b24bdb0f] |
| merge-stream@2.0.0 (node_modules/merge-stream) | MIT | version-matched | node_modules/merge-stream/LICENSE [text-2cee71bf4612fc2efe1c6261e3f2b21f3c7259ef8a4f3593b095ae7a7bd65ad9] |
| metro@0.84.5 (node_modules/metro) | MIT | version-matched | (none found) |
| metro-babel-transformer@0.84.5 (node_modules/metro-babel-transformer) | MIT | version-matched | (none found) |
| metro-cache@0.84.5 (node_modules/metro-cache) | MIT | version-matched | (none found) |
| metro-cache-key@0.84.5 (node_modules/metro-cache-key) | MIT | version-matched | (none found) |
| metro-config@0.84.5 (node_modules/metro-config) | MIT | version-matched | (none found) |
| metro-core@0.84.5 (node_modules/metro-core) | MIT | version-matched | (none found) |
| metro-file-map@0.84.5 (node_modules/metro-file-map) | MIT | version-matched | (none found) |
| metro-minify-terser@0.84.5 (node_modules/metro-minify-terser) | MIT | version-matched | (none found) |
| metro-resolver@0.84.5 (node_modules/metro-resolver) | MIT | version-matched | (none found) |
| metro-runtime@0.84.5 (node_modules/metro-runtime) | MIT | version-matched | (none found) |
| metro-source-map@0.84.5 (node_modules/metro-source-map) | MIT | version-matched | (none found) |
| metro-symbolicate@0.84.5 (node_modules/metro-symbolicate) | MIT | version-matched | (none found) |
| metro-transform-plugins@0.84.5 (node_modules/metro-transform-plugins) | MIT | version-matched | (none found) |
| metro-transform-worker@0.84.5 (node_modules/metro-transform-worker) | MIT | version-matched | (none found) |
| micromatch@4.0.8 (node_modules/micromatch) | MIT | version-matched | node_modules/micromatch/LICENSE [text-35bdd8a44339719441900fb50fbefc5e2dca1ca662cbaed7a687de842c8b70f2] |
| mime@1.6.0 (node_modules/mime) | MIT | version-matched | node_modules/mime/LICENSE [text-8f2658c03422c408b2b2ce4d151decc3b1a6fd3d86e5ca9433777bccdcdf75a2] |
| mime-db@1.54.0 (node_modules/mime-db) | MIT | version-matched | node_modules/mime-db/LICENSE [text-cc1dfd4dafa27271e8212cd3b274eeb3f262e40a6fdab36ddc3f9696f706f58b] |
| mime-types@3.0.2 (node_modules/mime-types) | MIT | version-matched | node_modules/mime-types/LICENSE [text-71f83c4c0621102a56d9853812777b85751bce7e9726f686f5b056c1f8a4b0e6] |
| mimic-fn@1.2.0 (node_modules/mimic-fn) | MIT | version-matched | node_modules/mimic-fn/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| min-indent@1.0.1 (node_modules/min-indent) | MIT | version-matched | node_modules/min-indent/license [text-9638fa87f845af6cecc56fab498c1f74f4a98522d3b53377bedcbdb44b5a8dcc] |
| minimatch@10.2.6 (node_modules/minimatch) | BlueOak-1.0.0 | version-matched | node_modules/minimatch/LICENSE.md [text-2c7c5d22ed5a8ee968c64757710979afcd77438c48b4a265b94e615babd8a901] |
| minipass@7.1.3 (node_modules/minipass) | BlueOak-1.0.0 | version-matched | node_modules/minipass/LICENSE.md [text-8a1af140fdfbf5afd3df27f7e662f989c5b963a300020dfafce42033cae9e004] |
| mkdirp@1.0.4 (node_modules/mkdirp) | MIT | version-matched | node_modules/mkdirp/LICENSE [text-144c935613e823350f7798d19da78b5e8315a79af5c2a3744fd85cd61baf07ee] |
| ms@2.1.3 (node_modules/ms) | MIT | version-matched | node_modules/ms/license.md [text-1662fae9b5314d11cf51284e2dcd1f006a354f7343f08712a730fcff9a359801] |
| multitars@1.0.2 (node_modules/multitars) | MIT | version-matched | node_modules/multitars/LICENSE.md [text-479b48ab7acdf844b2f44d6a3ce806f932ad009d84d2c71651355b372a2ad0ad] |
| nanoid@3.3.20 (node_modules/nanoid) | MIT | version-matched | node_modules/nanoid/LICENSE [text-da4db1480d9beea3483a2eda5c53b22238d0827d57da162b48f122e04d2d9987] |
| natural-compare@1.4.0 (node_modules/natural-compare) | MIT | version-matched | (none found) |
| negotiator@1.1.0 (node_modules/negotiator) | MIT | version-matched | node_modules/negotiator/LICENSE [text-553d4d20029a24e315b428a1a54a9e109eaa340f2e958a4f50a92362c2c4070b] |
| node-forge@1.4.0 (node_modules/node-forge) | (BSD-3-Clause OR GPL-2.0) | version-matched | node_modules/node-forge/LICENSE [text-f63ff0e4e239244aa79280da2dd4811a0469e5e201caf5cbc0d97c3a1dff8e82] |
| node-int64@0.4.0 (node_modules/node-int64) | MIT | version-matched | node_modules/node-int64/LICENSE [text-8f85aab053e268546014761da47630a09886626afbd0d8d440cb2c69611bb8d3] |
| node-releases@2.0.59 (node_modules/node-releases) | MIT | version-matched | node_modules/node-releases/LICENSE [text-3706296ed611888111ceccc1dff4712844dea4bde0b185c82d718c3b69895abe] |
| normalize-path@3.0.0 (node_modules/normalize-path) | MIT | version-matched | node_modules/normalize-path/LICENSE [text-e70ff771504ba41f2be55de812a017ff46433d7a250c862e38fc419159e44500] |
| npm-package-arg@11.0.3 (node_modules/npm-package-arg) | ISC | version-matched | node_modules/npm-package-arg/LICENSE [text-898c2bcff663681498ad1ca8235d45b6e70b10cdf1f869a5b5e69f6e46efedd3] |
| npm-run-path@4.0.1 (node_modules/npm-run-path) | MIT | version-matched | node_modules/npm-run-path/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| nth-check@2.1.1 (node_modules/nth-check) | BSD-2-Clause | version-matched | node_modules/nth-check/LICENSE [text-cb992345949ccd6e8394b2cd6c465f7b897c864f845937dbf64e8997f389e164] |
| nullthrows@1.1.1 (node_modules/nullthrows) | MIT | version-matched | node_modules/nullthrows/LICENSE [text-dd5f97aa25431e25fea6654f12f4ce167dc19b3148ab515cc271aa8efe6eb0be] |
| ob1@0.84.5 (node_modules/ob1) | MIT | version-matched | (none found) |
| on-finished@2.3.0 (node_modules/on-finished) | MIT | version-matched | node_modules/on-finished/LICENSE [text-8089bcc08845ec143e5761f4a101a65b8c792a0dedbfeeb90a15560c0b77f768] |
| on-headers@1.1.0 (node_modules/on-headers) | MIT | version-matched | node_modules/on-headers/LICENSE [text-74d8054d56d522bdaa340d3d71130cb204997d523a5292c85ac1264dd77c8d06] |
| once@1.4.0 (node_modules/once) | ISC | version-matched | node_modules/once/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| onetime@2.0.1 (node_modules/onetime) | MIT | version-matched | node_modules/onetime/license [text-6fb9754611c20f6649f68805e8c990e83261f29316e29de9e6cedae607b8634c] |
| open@7.4.2 (node_modules/open) | MIT | version-matched | node_modules/open/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| ora@3.4.0 (node_modules/ora) | MIT | version-matched | node_modules/ora/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| ansi-regex@4.1.1 (node_modules/ora/node_modules/ansi-regex) | MIT | version-matched | node_modules/ora/node_modules/ansi-regex/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| ansi-styles@3.2.1 (node_modules/ora/node_modules/ansi-styles) | MIT | version-matched | node_modules/ora/node_modules/ansi-styles/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| chalk@2.4.2 (node_modules/ora/node_modules/chalk) | MIT | version-matched | node_modules/ora/node_modules/chalk/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| color-convert@1.9.3 (node_modules/ora/node_modules/color-convert) | MIT | version-matched | node_modules/ora/node_modules/color-convert/LICENSE [text-693866fc419c6f61c8570438ec00659d156ec2b4d4a4d04091711f5f11a365d4] |
| color-name@1.1.3 (node_modules/ora/node_modules/color-name) | MIT | version-matched | node_modules/ora/node_modules/color-name/LICENSE [text-c064f7a3e353bc1bc977f3c897941c75ef763f44f41677e0a15370ca0853d6e2] |
| escape-string-regexp@1.0.5 (node_modules/ora/node_modules/escape-string-regexp) | MIT | version-matched | node_modules/ora/node_modules/escape-string-regexp/license [text-6fb9754611c20f6649f68805e8c990e83261f29316e29de9e6cedae607b8634c] |
| has-flag@3.0.0 (node_modules/ora/node_modules/has-flag) | MIT | version-matched | node_modules/ora/node_modules/has-flag/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| strip-ansi@5.2.0 (node_modules/ora/node_modules/strip-ansi) | MIT | version-matched | node_modules/ora/node_modules/strip-ansi/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| supports-color@5.5.0 (node_modules/ora/node_modules/supports-color) | MIT | version-matched | node_modules/ora/node_modules/supports-color/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| p-limit@3.1.0 (node_modules/p-limit) | MIT | version-matched | node_modules/p-limit/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| p-locate@4.1.0 (node_modules/p-locate) | MIT | version-matched | node_modules/p-locate/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| p-limit@2.3.0 (node_modules/p-locate/node_modules/p-limit) | MIT | version-matched | node_modules/p-locate/node_modules/p-limit/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| p-try@2.2.0 (node_modules/p-try) | MIT | version-matched | node_modules/p-try/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| parse-json@5.2.0 (node_modules/parse-json) | MIT | version-matched | node_modules/parse-json/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| parse-png@2.1.0 (node_modules/parse-png) | MIT | version-matched | node_modules/parse-png/license [text-69dee148a2cc470554dfa7142e830662062394d0fe67cddd379aba90dc60d6b3] |
| parseurl@1.3.3 (node_modules/parseurl) | MIT | version-matched | node_modules/parseurl/LICENSE [text-11d017c3b9f1ee3f44caf7203035f0461d5b57e0db8ce1bc03a9af34fa7d3f6b] |
| path-exists@4.0.0 (node_modules/path-exists) | MIT | version-matched | node_modules/path-exists/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| path-is-absolute@1.0.1 (node_modules/path-is-absolute) | MIT | version-matched | node_modules/path-is-absolute/license [text-6fb9754611c20f6649f68805e8c990e83261f29316e29de9e6cedae607b8634c] |
| path-key@3.1.1 (node_modules/path-key) | MIT | version-matched | node_modules/path-key/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| path-parse@1.0.7 (node_modules/path-parse) | MIT | version-matched | node_modules/path-parse/LICENSE [text-3f4609137f65070541b9214300ea0d640af8192857de0eeb2b03403003d9228a] |
| path-scurry@2.0.2 (node_modules/path-scurry) | BlueOak-1.0.0 | version-matched | node_modules/path-scurry/LICENSE.md [text-8a1af140fdfbf5afd3df27f7e662f989c5b963a300020dfafce42033cae9e004] |
| lru-cache@11.5.3 (node_modules/path-scurry/node_modules/lru-cache) | BlueOak-1.0.0 | version-matched | node_modules/path-scurry/node_modules/lru-cache/LICENSE.md [text-8a1af140fdfbf5afd3df27f7e662f989c5b963a300020dfafce42033cae9e004] |
| picocolors@1.1.1 (node_modules/picocolors) | ISC | version-matched | node_modules/picocolors/LICENSE [text-6582629e2979466878f6014313dcc2f3756c9616148682227ce3063dde310750] |
| picomatch@2.3.2 (node_modules/picomatch) | MIT | version-matched | node_modules/picomatch/LICENSE [text-d0cd141b0c322fded5dfad1d4645bb2fedfc05b7321fe1009469638190d59ef9] |
| pirates@4.0.7 (node_modules/pirates) | MIT | version-matched | node_modules/pirates/LICENSE [text-b3e8623bbd73e4f964f9b5091c7b4c7e078fd760113890b8c1af951ab7921877] |
| pkg-dir@4.2.0 (node_modules/pkg-dir) | MIT | version-matched | node_modules/pkg-dir/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| plist@3.1.1 (node_modules/plist) | MIT | version-matched | node_modules/plist/LICENSE [text-3677dc86e6e5f119b500c308cc24cf533e2eb44c41050ea64584e049e5b70161] |
| @xmldom/xmldom@0.9.12 (node_modules/plist/node_modules/@xmldom/xmldom) | MIT | version-matched | node_modules/plist/node_modules/@xmldom/xmldom/LICENSE [text-4da724fc305d81606b245b324d4d2586916b9d248b23d82183df753ace0fdf71] |
| pngjs@3.4.0 (node_modules/pngjs) | MIT | version-matched | node_modules/pngjs/LICENSE [text-176b07a18c0bb3836aaeb61088fd0bf11a38f66e6f15e3fbda85faa225250d6e] |
| postcss@8.5.31 (node_modules/postcss) | MIT | version-matched | node_modules/postcss/LICENSE [text-5be1f3465bba68a626777f984878814aaf35e7ef8e9fd314d469bcf887050fb8] |
| pretty-format@29.7.0 (node_modules/pretty-format) | MIT | version-matched | node_modules/pretty-format/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| ansi-styles@5.2.0 (node_modules/pretty-format/node_modules/ansi-styles) | MIT | version-matched | node_modules/pretty-format/node_modules/ansi-styles/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| proc-log@4.2.0 (node_modules/proc-log) | ISC | version-matched | node_modules/proc-log/LICENSE [text-dc32a0dee275e0a9aeffbc974dbf4899a30dcdc2e5ffa8934aecb69261065864] |
| progress@2.0.3 (node_modules/progress) | MIT | version-matched | node_modules/progress/LICENSE [text-d7d2a7786de7c7cfd96f920c6f12927d74e1d2a861ca4498bf465c3bc3f4c21c] |
| promise@8.3.0 (node_modules/promise) | MIT | version-matched | node_modules/promise/LICENSE [text-5e733eb92ed0c571da3f27c5da203e0a9f975b4f96e7692c9fa3660ca54820ec] |
| prompts@2.4.2 (node_modules/prompts) | MIT | version-matched | node_modules/prompts/license [text-ade66f698fd417addc4d948a85ef33e8abb302daff6453feda18b191d250e54d] |
| pure-rand@6.1.0 (node_modules/pure-rand) | MIT | version-matched | node_modules/pure-rand/LICENSE [text-e9d6a94ab01c6c9ab68c099d3ba8dd9f8aca60f2e2250c2302275405fca9e806] |
| query-string@7.1.3 (node_modules/query-string) | MIT | version-matched | node_modules/query-string/license [text-846c2349412e40c3c33095b2903f6a311ef4b30ccd26c214044a2cdc24fdc5cc] |
| range-parser@1.2.1 (node_modules/range-parser) | MIT | version-matched | node_modules/range-parser/LICENSE [text-f655e6291356ec0de7a8f0e69f294961a2cea86678ec94588be1e6a492e278ab] |
| react@19.2.3 (node_modules/react) | MIT | version-matched | node_modules/react/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| react-devtools-core@6.1.5 (node_modules/react-devtools-core) | MIT | version-matched | (none found) |
| react-dom@19.2.3 (node_modules/react-dom) | MIT | version-matched | node_modules/react-dom/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| react-fast-compare@3.2.2 (node_modules/react-fast-compare) | MIT | version-matched | node_modules/react-fast-compare/LICENSE [text-1e187eec147d04bcbb3b7aef9f3b0ea82228961fa7d390d3efb9e57751dbe0cb] |
| react-freeze@1.0.4 (node_modules/react-freeze) | MIT | version-matched | node_modules/react-freeze/LICENSE [text-19ba4296d3501ae3a71920bc9872a5c50ce94105bbf4c2a21d5172658cedd6ae] |
| react-is@18.3.1 (node_modules/react-is) | MIT | version-matched | node_modules/react-is/LICENSE [text-52412d7bc7ce4157ea628bbaacb8829e0a9cb3c58f57f99176126bc8cf2bfc85] |
| react-native@0.86.3 (node_modules/react-native) | MIT | version-matched | node_modules/react-native/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| react-native-drawer-layout@4.2.12 (node_modules/react-native-drawer-layout) | MIT | version-matched | node_modules/react-native-drawer-layout/LICENSE [text-41f321b33afaa5cdaeb7c1aecd6fd5c21467ff910fb677aa47c941d05b5032c0] |
| react-native-gesture-handler@3.4.0 (node_modules/react-native-gesture-handler) | MIT | version-matched | node_modules/react-native-gesture-handler/LICENSE [text-f1ae22eddd3a96c3b7b8a494ef03749ae6a1e19574bacc9c195d83c916de09e2] |
| react-native-is-edge-to-edge@1.3.1 (node_modules/react-native-is-edge-to-edge) | MIT | version-matched | node_modules/react-native-is-edge-to-edge/LICENSE [text-4efb635cc4fd67f738ce2af65f8b73514ee338d0d201b836ab3a823cfda771d1] |
| react-native-reanimated@4.5.1 (node_modules/react-native-reanimated) | MIT | version-matched | node_modules/react-native-reanimated/LICENSE [text-f1ae22eddd3a96c3b7b8a494ef03749ae6a1e19574bacc9c195d83c916de09e2] |
| react-native-safe-area-context@5.7.0 (node_modules/react-native-safe-area-context) | MIT | version-matched | node_modules/react-native-safe-area-context/LICENSE [text-f5c7a4d527258e11fdfe3d84eb73cd14fe6d64224ef051e59f6ee21fe378800c] |
| react-native-screens@4.26.2 (node_modules/react-native-screens) | MIT | version-matched | node_modules/react-native-screens/LICENSE [text-95b52e497653b738fd50e4bd3a8197dc41593c63129acb4f8069dbf49530ef82] |
| react-native-svg@15.15.4 (node_modules/react-native-svg) | MIT | version-matched | node_modules/react-native-svg/LICENSE [text-1bc2aa7dad15097cd71308d9ae013ff14d11a84357b170c1554f4035fb8a3acb] |
| react-native-worklets@0.10.1 (node_modules/react-native-worklets) | MIT | version-matched | node_modules/react-native-worklets/LICENSE [text-92c22d327a6644efda43527bfa6f136f4382359f40bc288eda0764f67be9c269] |
| commander@12.1.0 (node_modules/react-native/node_modules/commander) | MIT | version-matched | node_modules/react-native/node_modules/commander/LICENSE [text-04512a63dce4d2d506ad612dc0bd7681ccf6e3655f7b6eaef7dfac8323d1ec0b] |
| react-refresh@0.14.2 (node_modules/react-refresh) | MIT | version-matched | node_modules/react-refresh/LICENSE [text-52412d7bc7ce4157ea628bbaacb8829e0a9cb3c58f57f99176126bc8cf2bfc85] |
| react-remove-scroll@2.7.2 (node_modules/react-remove-scroll) | MIT | version-matched | node_modules/react-remove-scroll/LICENSE [text-30f0cfddf483d1128e3610205020f2041a6c5e837aa999e0aa82e5576187d4a9] |
| react-remove-scroll-bar@2.3.8 (node_modules/react-remove-scroll-bar) | MIT | version-matched | (none found) |
| react-style-singleton@2.2.3 (node_modules/react-style-singleton) | MIT | version-matched | node_modules/react-style-singleton/LICENSE [text-30f0cfddf483d1128e3610205020f2041a6c5e837aa999e0aa82e5576187d4a9] |
| react-test-renderer@19.2.3 (node_modules/react-test-renderer) | MIT | version-matched | node_modules/react-test-renderer/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| react-is@19.3.1 (node_modules/react-test-renderer/node_modules/react-is) | MIT | version-matched | node_modules/react-test-renderer/node_modules/react-is/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| redent@3.0.0 (node_modules/redent) | MIT | version-matched | node_modules/redent/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| regenerate@1.5.0 (node_modules/regenerate) | MIT | version-matched | node_modules/regenerate/LICENSE-MIT.txt [text-483acb265f182907d1caf6cff9c16c96f31325ed23792832cc5d8b12d5f88c8a] |
| regenerate-unicode-properties@10.3.0 (node_modules/regenerate-unicode-properties) | MIT | version-matched | node_modules/regenerate-unicode-properties/LICENSE-MIT.txt [text-483acb265f182907d1caf6cff9c16c96f31325ed23792832cc5d8b12d5f88c8a] |
| regenerator-runtime@0.13.11 (node_modules/regenerator-runtime) | MIT | version-matched | node_modules/regenerator-runtime/LICENSE [text-51887a3d47051ac2fce1210562e5b9fe0830a8a8fabeb272c2d586eeb18a05fd] |
| regexpu-core@6.5.3 (node_modules/regexpu-core) | MIT | version-matched | node_modules/regexpu-core/LICENSE-MIT.txt [text-483acb265f182907d1caf6cff9c16c96f31325ed23792832cc5d8b12d5f88c8a] |
| regjsgen@0.8.0 (node_modules/regjsgen) | MIT | version-matched | node_modules/regjsgen/LICENSE-MIT.txt [text-21edea5565f8e8d4a0e548fe741b16f7d642afd8dadafa9dbab4232115abe0ec] |
| regjsparser@0.13.4 (node_modules/regjsparser) | BSD-2-Clause | version-matched | node_modules/regjsparser/LICENSE.BSD [text-2d65cdba6e67bd7fa9c59070eb3ef5b65490cf1644560eb30c931a1d364009c2] |
| require-directory@2.1.1 (node_modules/require-directory) | MIT | version-matched | node_modules/require-directory/LICENSE [text-a92e52eb1fa7cd746e3827bf01d3a3589bbc8e1e51348b1da042aad165525ad1] |
| resolve@1.22.13 (node_modules/resolve) | MIT | version-matched | node_modules/resolve/LICENSE [text-60acd7711e6c138e6041836e32d922705254cc1568a30fdf16aa8f59bb87aeaa] |
| resolve-cwd@3.0.0 (node_modules/resolve-cwd) | MIT | version-matched | node_modules/resolve-cwd/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| resolve-from@5.0.0 (node_modules/resolve-from) | MIT | version-matched | node_modules/resolve-from/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| resolve-workspace-root@2.0.1 (node_modules/resolve-workspace-root) | MIT | version-matched | node_modules/resolve-workspace-root/LICENSE.md [text-0cff14eaf2736ff712a34ef8d61f4144082e61387fff1ee3bef9da003d96a4ce] |
| resolve.exports@2.0.4 (node_modules/resolve.exports) | MIT | version-matched | node_modules/resolve.exports/license [text-306fa513e39b23a6e8747520de761809d206b99800ef41907b530226574c59ae] |
| restore-cursor@2.0.0 (node_modules/restore-cursor) | MIT | version-matched | node_modules/restore-cursor/license [text-6fb9754611c20f6649f68805e8c990e83261f29316e29de9e6cedae607b8634c] |
| safe-buffer@5.2.1 (node_modules/safe-buffer) | MIT | version-matched | node_modules/safe-buffer/LICENSE [text-c7cc929b57080f4b9d0c6cf57669f0463fc5b39906344dfc8d3bc43426b30eac] |
| sandbox-cli-detector@0.2.0 (node_modules/sandbox-cli-detector) | MIT | version-matched | node_modules/sandbox-cli-detector/LICENSE [text-f855c605d6ba3587ef8ba49a428cec58711964547c5364f1dade33ed23315361] |
| sax@1.6.1 (node_modules/sax) | BlueOak-1.0.0 | version-matched | node_modules/sax/LICENSE.md [text-8a1af140fdfbf5afd3df27f7e662f989c5b963a300020dfafce42033cae9e004] |
| scheduler@0.27.0 (node_modules/scheduler) | MIT | version-matched | node_modules/scheduler/LICENSE [text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93] |
| semver@7.8.5 (node_modules/semver) | ISC | version-matched | node_modules/semver/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| send@0.19.2 (node_modules/send) | MIT | version-matched | node_modules/send/LICENSE [text-25a328069fe771f8ed5b6f983ed4b0e6c84b3312ac0f69b28c3d52dc277962c9] |
| debug@2.6.9 (node_modules/send/node_modules/debug) | MIT | version-matched | node_modules/send/node_modules/debug/LICENSE [text-98c970de440dcfc77471610aec2377c9d9b0db2b3be6d1add524a586e1d7f422] |
| ms@2.0.0 (node_modules/send/node_modules/debug/node_modules/ms) | MIT | version-matched | node_modules/send/node_modules/debug/node_modules/ms/license.md [text-6652830c2607c722b66f1b57de15877ab8fc5dca406cc5b335afeb365d0f32c1] |
| encodeurl@2.0.0 (node_modules/send/node_modules/encodeurl) | MIT | version-matched | node_modules/send/node_modules/encodeurl/LICENSE [text-7585ea7bba616ccbbe43cb54ecb67956688c3c5641bb84f3099a652a73193afe] |
| on-finished@2.4.1 (node_modules/send/node_modules/on-finished) | MIT | version-matched | node_modules/send/node_modules/on-finished/LICENSE [text-8089bcc08845ec143e5761f4a101a65b8c792a0dedbfeeb90a15560c0b77f768] |
| statuses@2.0.2 (node_modules/send/node_modules/statuses) | MIT | version-matched | node_modules/send/node_modules/statuses/LICENSE [text-512cfa4d5e7a7569c7ae4dd95241cb6ae2aaf648ef9ebd080c01bd24868d26e9] |
| serialize-error@2.1.0 (node_modules/serialize-error) | MIT | version-matched | node_modules/serialize-error/license [text-6fb9754611c20f6649f68805e8c990e83261f29316e29de9e6cedae607b8634c] |
| serve-static@1.16.3 (node_modules/serve-static) | MIT | version-matched | node_modules/serve-static/LICENSE [text-63b9a188d7d43e64b0558b7115255045b9fe20a5fc3ff483421cb899e7f52bcb] |
| encodeurl@2.0.0 (node_modules/serve-static/node_modules/encodeurl) | MIT | version-matched | node_modules/serve-static/node_modules/encodeurl/LICENSE [text-7585ea7bba616ccbbe43cb54ecb67956688c3c5641bb84f3099a652a73193afe] |
| server-only@0.0.1 (node_modules/server-only) | MIT | version-matched | (none found) |
| setprototypeof@1.2.0 (node_modules/setprototypeof) | ISC | version-matched | node_modules/setprototypeof/LICENSE [text-76d6d1ea0c268da37dd3c961b4fcfb23dee8417fff9e8786d4d44c585b781b69] |
| sf-symbols-typescript@2.2.0 (node_modules/sf-symbols-typescript) | MIT | version-matched | node_modules/sf-symbols-typescript/LICENSE [text-80de3c4eed58e1e8584be9891ba78e70493192972e2210aaafe4f09f616cb3c9] |
| shallowequal@1.1.0 (node_modules/shallowequal) | MIT | version-matched | node_modules/shallowequal/LICENSE [text-709e45bb17277819ce27e9abe5dc8e56fe93081e54adb6e6385517f28aa11ac4] |
| shebang-command@2.0.0 (node_modules/shebang-command) | MIT | version-matched | node_modules/shebang-command/license [text-69dee148a2cc470554dfa7142e830662062394d0fe67cddd379aba90dc60d6b3] |
| shebang-regex@3.0.0 (node_modules/shebang-regex) | MIT | version-matched | node_modules/shebang-regex/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| shell-quote@1.12.0 (node_modules/shell-quote) | MIT | version-matched | node_modules/shell-quote/LICENSE [text-8bb16db1b047019e4395965f2cf3611b06c34bf86dc2d0210b3c3f91b53c21fe] |
| signal-exit@3.0.7 (node_modules/signal-exit) | ISC | version-matched | node_modules/signal-exit/LICENSE.txt [text-e05b1eaf5b5f99b7ad75cd1f38858ff9a311780b97715ead67936d60bf96aa7e] |
| simple-plist@1.3.1 (node_modules/simple-plist) | MIT | version-matched | node_modules/simple-plist/LICENSE [text-9ce8fc28ff49e651f98d6583b41ae1653dafaf6fc7444f3dfd13eb97451084bb] |
| simple-swizzle@0.2.4 (node_modules/simple-swizzle) | MIT | version-matched | node_modules/simple-swizzle/LICENSE [text-8f67ef1afdbd7b8ddc3e2da9968bb97af30795ae9c90a2cc4d867e5608216973] |
| sisteransi@1.0.5 (node_modules/sisteransi) | MIT | version-matched | node_modules/sisteransi/license [text-ade66f698fd417addc4d948a85ef33e8abb302daff6453feda18b191d250e54d] |
| slash@3.0.0 (node_modules/slash) | MIT | version-matched | node_modules/slash/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| slugify@1.6.9 (node_modules/slugify) | MIT | version-matched | node_modules/slugify/LICENSE [text-8df3c23e3dfffa0d3d41c59fae5741ea3e2c50eb19c52a5d8912a68fdba554c2] |
| source-map@0.5.7 (node_modules/source-map) | BSD-3-Clause | version-matched | node_modules/source-map/LICENSE [text-6cb0631f71c7749763fd3dd1d5bee52dd1070ec17f2edc1710079ad070bd2fbd] |
| source-map-js@1.2.2 (node_modules/source-map-js) | BSD-3-Clause | version-matched | node_modules/source-map-js/LICENSE [text-6cb0631f71c7749763fd3dd1d5bee52dd1070ec17f2edc1710079ad070bd2fbd] |
| source-map-support@0.5.21 (node_modules/source-map-support) | MIT | version-matched | node_modules/source-map-support/LICENSE.md [text-3a7d3bb198e909ed642bd68bd29a7d7c09a636d27a51ec663d35f00c4760ec42] |
| source-map@0.6.1 (node_modules/source-map-support/node_modules/source-map) | BSD-3-Clause | version-matched | node_modules/source-map-support/node_modules/source-map/LICENSE [text-6cb0631f71c7749763fd3dd1d5bee52dd1070ec17f2edc1710079ad070bd2fbd] |
| split-on-first@1.1.0 (node_modules/split-on-first) | MIT | version-matched | node_modules/split-on-first/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| sprintf-js@1.0.3 (node_modules/sprintf-js) | BSD-3-Clause | version-matched | node_modules/sprintf-js/LICENSE [text-a4cdda44b5adea4731d53dcae78fb5124f8fd853e994f01e25d8c33a7daf818b] |
| stack-utils@2.0.6 (node_modules/stack-utils) | MIT | version-matched | node_modules/stack-utils/LICENSE.md [text-9be2ec8089dfa4059a78e4e3e0443c416b2d63dedffb246c7473d0f3d763c6c4] |
| escape-string-regexp@2.0.0 (node_modules/stack-utils/node_modules/escape-string-regexp) | MIT | version-matched | node_modules/stack-utils/node_modules/escape-string-regexp/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| stackframe@1.3.4 (node_modules/stackframe) | MIT | version-matched | node_modules/stackframe/LICENSE [text-899da9d991cb211a3642b84e82a9ae0b4b4e44546fd207e34d7d4ec2eb40f420] |
| stacktrace-parser@0.1.11 (node_modules/stacktrace-parser) | MIT | version-matched | node_modules/stacktrace-parser/LICENSE [text-e1898814043cb5500483d9c8517edda824b352f696d35e5043fcfb537c221531] |
| standard-navigation@0.0.5 (node_modules/standard-navigation) | MIT | version-matched | (none found) |
| statuses@1.5.0 (node_modules/statuses) | MIT | version-matched | node_modules/statuses/LICENSE [text-512cfa4d5e7a7569c7ae4dd95241cb6ae2aaf648ef9ebd080c01bd24868d26e9] |
| stream-buffers@2.2.0 (node_modules/stream-buffers) | Unlicense | version-matched | (none found) |
| strict-uri-encode@2.0.0 (node_modules/strict-uri-encode) | MIT | version-matched | node_modules/strict-uri-encode/license [text-e6fdf7ac2af533b4436d99aa75df32aa78690510f7d68a3e73e8576967298d2f] |
| string-length@4.0.2 (node_modules/string-length) | MIT | version-matched | node_modules/string-length/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| string-width@4.2.3 (node_modules/string-width) | MIT | version-matched | node_modules/string-width/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| strip-ansi@6.0.1 (node_modules/strip-ansi) | MIT | version-matched | node_modules/strip-ansi/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| strip-bom@4.0.0 (node_modules/strip-bom) | MIT | version-matched | node_modules/strip-bom/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| strip-final-newline@2.0.0 (node_modules/strip-final-newline) | MIT | version-matched | node_modules/strip-final-newline/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| strip-indent@3.0.0 (node_modules/strip-indent) | MIT | version-matched | node_modules/strip-indent/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| strip-json-comments@3.1.1 (node_modules/strip-json-comments) | MIT | version-matched | node_modules/strip-json-comments/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| structured-headers@0.4.1 (node_modules/structured-headers) | MIT | version-matched | (none found) |
| supports-color@7.2.0 (node_modules/supports-color) | MIT | version-matched | node_modules/supports-color/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| supports-hyperlinks@2.3.0 (node_modules/supports-hyperlinks) | MIT | version-matched | node_modules/supports-hyperlinks/license [text-61bed033eebace09bbefb1a3903ebc09e0086ea793d1694fbe300827adc9f921] |
| supports-preserve-symlinks-flag@1.0.0 (node_modules/supports-preserve-symlinks-flag) | MIT | version-matched | node_modules/supports-preserve-symlinks-flag/LICENSE [text-0f0ca96f50793990031ebc488a38f7292ff70bce8ab6a8e5eeda674abc32ccdf] |
| terminal-link@2.1.1 (node_modules/terminal-link) | MIT | version-matched | node_modules/terminal-link/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| terser@5.51.2 (node_modules/terser) | BSD-2-Clause | version-matched | node_modules/terser/LICENSE [text-901d0a7fcaccaae9917d165039c0473c354e5da2e0e94140dde67aad9ffb19da] |
| commander@2.20.3 (node_modules/terser/node_modules/commander) | MIT | version-matched | node_modules/terser/node_modules/commander/LICENSE [text-04512a63dce4d2d506ad612dc0bd7681ccf6e3655f7b6eaef7dfac8323d1ec0b] |
| test-exclude@6.0.0 (node_modules/test-exclude) | ISC | version-matched | node_modules/test-exclude/LICENSE.txt [text-365496ca1f56da40b23c9815fc40fa9005847b2f8f8fd1c1a4929ef25ec8cd1d] |
| balanced-match@1.0.2 (node_modules/test-exclude/node_modules/balanced-match) | MIT | version-matched | node_modules/test-exclude/node_modules/balanced-match/LICENSE.md [text-a1bd5deadb6a06dd74efa852c1b8b23f63b67f2214fbe9c8bd591da51da69268] |
| brace-expansion@1.1.21 (node_modules/test-exclude/node_modules/brace-expansion) | MIT | version-matched | node_modules/test-exclude/node_modules/brace-expansion/LICENSE [text-68f12f6e2c33688699249c01d8f9623c534da20aa71989c57b061b7bc1676d14] |
| glob@7.2.3 (node_modules/test-exclude/node_modules/glob) | ISC | version-matched | node_modules/test-exclude/node_modules/glob/LICENSE [text-6236fa0b88a4a0cce3dda0367979491b2052b3c8d6b1c10b3668de083e86a7f0] |
| minimatch@3.1.5 (node_modules/test-exclude/node_modules/minimatch) | ISC | version-matched | node_modules/test-exclude/node_modules/minimatch/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| throat@5.0.0 (node_modules/throat) | MIT | version-matched | node_modules/throat/LICENSE [text-e21b0992cd8a2e8bf3e5f2f1b392daccab5d27386fcf2bc25e336c4161b5d1f9] |
| tinyglobby@0.2.17 (node_modules/tinyglobby) | MIT | version-matched | node_modules/tinyglobby/LICENSE [text-22c68811e174cbbfb3813d4135918df4f540959c14d872e601d9abe83d3cde8f] |
| fdir@6.5.0 (node_modules/tinyglobby/node_modules/fdir) | MIT | version-matched | node_modules/tinyglobby/node_modules/fdir/LICENSE [text-9a39f2aadab11a3697edd668ff2d8ad885b649737b7ab4d3bf12b34e5ada0c86] |
| picomatch@4.0.7 (node_modules/tinyglobby/node_modules/picomatch) | MIT | version-matched | node_modules/tinyglobby/node_modules/picomatch/LICENSE [text-d0cd141b0c322fded5dfad1d4645bb2fedfc05b7321fe1009469638190d59ef9] |
| tmpl@1.0.5 (node_modules/tmpl) | BSD-3-Clause | version-matched | node_modules/tmpl/license [text-efd6f9e708b909de1a18730b90fb6394a3125680ac2f98a87cd23d1a0c93afa2] |
| to-regex-range@5.0.1 (node_modules/to-regex-range) | MIT | version-matched | node_modules/to-regex-range/LICENSE [text-e7d1fee7347ffddccc5fd03327ffdb50f8c112be0d5016d62388a92c4ae6e7a9] |
| toidentifier@1.0.1 (node_modules/toidentifier) | MIT | version-matched | node_modules/toidentifier/LICENSE [text-a832d679750e49ab433626ab196350b89964b60eb0d3edd3341887c7d5f4c128] |
| toqr@0.1.1 (node_modules/toqr) | MIT | version-matched | node_modules/toqr/LICENSE.md [text-479b48ab7acdf844b2f44d6a3ce806f932ad009d84d2c71651355b372a2ad0ad] |
| tslib@2.8.1 (node_modules/tslib) | 0BSD | version-matched | node_modules/tslib/LICENSE.txt [text-210b19e543130388c68654b7497e967119ce17145f66ab7d85688fbd70f08751] |
| type-detect@4.0.8 (node_modules/type-detect) | MIT | version-matched | node_modules/type-detect/LICENSE [text-e5aee0714b6ecc416454b968d1017570ef609f20d8722ab84b07acd550b78198] |
| type-fest@0.7.1 (node_modules/type-fest) | (MIT OR CC0-1.0) | version-matched | node_modules/type-fest/license [text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0] |
| typescript@6.0.3 (node_modules/typescript) | Apache-2.0 | version-matched | node_modules/typescript/LICENSE.txt [text-a7d00bfd54525bc694b6e32f64c7ebcf5e6b7ae3657be5cc12767bce74654a47]; node_modules/typescript/ThirdPartyNoticeText.txt [text-1af3c68039c57e539422da82a4faada506ce6d0ea6f90e0b699d02dbcdb7a90c] |
| undici-types@8.9.0 (node_modules/undici-types) | MIT | version-matched | node_modules/undici-types/LICENSE [text-a6db8096b2707bc0102d256917d4d33f298ba36d8c3f25de067a2b5bb379db27] |
| unicode-canonical-property-names-ecmascript@2.0.1 (node_modules/unicode-canonical-property-names-ecmascript) | MIT | version-matched | node_modules/unicode-canonical-property-names-ecmascript/LICENSE-MIT.txt [text-483acb265f182907d1caf6cff9c16c96f31325ed23792832cc5d8b12d5f88c8a] |
| unicode-match-property-ecmascript@2.0.0 (node_modules/unicode-match-property-ecmascript) | MIT | version-matched | node_modules/unicode-match-property-ecmascript/LICENSE-MIT.txt [text-483acb265f182907d1caf6cff9c16c96f31325ed23792832cc5d8b12d5f88c8a] |
| unicode-match-property-value-ecmascript@2.2.1 (node_modules/unicode-match-property-value-ecmascript) | MIT | version-matched | node_modules/unicode-match-property-value-ecmascript/LICENSE-MIT.txt [text-483acb265f182907d1caf6cff9c16c96f31325ed23792832cc5d8b12d5f88c8a] |
| unicode-property-aliases-ecmascript@2.2.0 (node_modules/unicode-property-aliases-ecmascript) | MIT | version-matched | node_modules/unicode-property-aliases-ecmascript/LICENSE-MIT.txt [text-483acb265f182907d1caf6cff9c16c96f31325ed23792832cc5d8b12d5f88c8a] |
| unpipe@1.0.0 (node_modules/unpipe) | MIT | version-matched | node_modules/unpipe/LICENSE [text-1a526fbe8d8577f5a4b1c2821842b55b7c0e18862531c62ae4ce69c9b19b74b6] |
| update-browserslist-db@1.3.4 (node_modules/update-browserslist-db) | MIT | version-matched | node_modules/update-browserslist-db/LICENSE [text-9877e90da14aa8c931a1f9d07cc2a20ce119106e5dab1ebb41af865266d0cd2a] |
| use-callback-ref@1.3.3 (node_modules/use-callback-ref) | MIT | version-matched | node_modules/use-callback-ref/LICENSE [text-30f0cfddf483d1128e3610205020f2041a6c5e837aa999e0aa82e5576187d4a9] |
| use-latest-callback@0.2.6 (node_modules/use-latest-callback) | MIT | version-matched | node_modules/use-latest-callback/LICENSE [text-29de249ac0cee0d56924ff07bdabc8f708ad58432c7a357f6065000c49b12e11] |
| use-sidecar@1.1.3 (node_modules/use-sidecar) | MIT | version-matched | node_modules/use-sidecar/LICENSE [text-30f0cfddf483d1128e3610205020f2041a6c5e837aa999e0aa82e5576187d4a9] |
| utils-merge@1.0.1 (node_modules/utils-merge) | MIT | version-matched | node_modules/utils-merge/LICENSE [text-6e7d699cdd1e4fa837ba7718ea49841aa67201b449ea8b3f9cf274be15974a64] |
| v8-to-istanbul@9.3.0 (node_modules/v8-to-istanbul) | ISC | version-matched | node_modules/v8-to-istanbul/LICENSE.txt [text-1a9c55b2961f5e3062e181fa55666c44d011fc3cc03ed6d4fa4321c51f2a5ec5] |
| validate-npm-package-name@5.0.1 (node_modules/validate-npm-package-name) | ISC | version-matched | node_modules/validate-npm-package-name/LICENSE [text-f3e1645267f7dd77ee6545283cc1766e5883e8fb3b5088fe2cfb995defbb3dde] |
| vary@1.1.2 (node_modules/vary) | MIT | version-matched | node_modules/vary/LICENSE [text-bd47ce7b88c7759630d1e2b9fcfa170a0f1fde522be09e13fb1581a79d090400] |
| vaul@1.1.2 (node_modules/vaul) | MIT | version-matched | node_modules/vaul/LICENSE.md [text-b09b9ccf866cc09b502d9cf4679e2461beb1469709ea0c6a30009766e10b3acf] |
| @radix-ui/react-dialog@1.3.1 (node_modules/vaul/node_modules/@radix-ui/react-dialog) | MIT | version-matched | node_modules/vaul/node_modules/@radix-ui/react-dialog/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-dismissable-layer@1.2.1 (node_modules/vaul/node_modules/@radix-ui/react-dismissable-layer) | MIT | version-matched | node_modules/vaul/node_modules/@radix-ui/react-dismissable-layer/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-focus-scope@1.3.1 (node_modules/vaul/node_modules/@radix-ui/react-focus-scope) | MIT | version-matched | node_modules/vaul/node_modules/@radix-ui/react-focus-scope/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-portal@1.2.0 (node_modules/vaul/node_modules/@radix-ui/react-portal) | MIT | version-matched | node_modules/vaul/node_modules/@radix-ui/react-portal/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-presence@1.1.11 (node_modules/vaul/node_modules/@radix-ui/react-presence) | MIT | version-matched | node_modules/vaul/node_modules/@radix-ui/react-presence/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| @radix-ui/react-primitive@2.2.0 (node_modules/vaul/node_modules/@radix-ui/react-primitive) | MIT | version-matched | node_modules/vaul/node_modules/@radix-ui/react-primitive/LICENSE [text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138] |
| vlq@1.0.1 (node_modules/vlq) | MIT | version-matched | node_modules/vlq/LICENSE [text-560005aa01c5230147ca813dabd1970628d6c6ef57ad8f1553ad20ef9dce451b] |
| walker@1.0.8 (node_modules/walker) | Apache-2.0 | version-matched | node_modules/walker/LICENSE [text-555e1f70ce6b9b7ce77ad07ba8b2b6b3a543b2c7cc8fe15a2c30ad1b89667e21] |
| warn-once@0.1.1 (node_modules/warn-once) | MIT | version-matched | node_modules/warn-once/LICENSE [text-f9a72660f8b9b8a9ae3773ecaab64f61d1412a4f1c9eb945e455d22608fdc348] |
| wcwidth@1.0.1 (node_modules/wcwidth) | MIT | version-matched | node_modules/wcwidth/LICENSE [text-6294da0e0a201bbe1de254445c9d07133a9448af05e4e44d0a2364747d114368] |
| whatwg-fetch@3.6.20 (node_modules/whatwg-fetch) | MIT | version-matched | node_modules/whatwg-fetch/LICENSE [text-c887d1c97797646dbb216925ab44a93c6b3e7f03bbe6ef6e0f92b8b8ade63014] |
| whatwg-url-minimum@0.1.2 (node_modules/whatwg-url-minimum) | MIT | version-matched | node_modules/whatwg-url-minimum/LICENSE.md [text-c2ecf83f830f226f662c99d003162002c78edd8b59f1105621bdcc2c44043a7d] |
| which@2.0.2 (node_modules/which) | ISC | version-matched | node_modules/which/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| wrap-ansi@7.0.0 (node_modules/wrap-ansi) | MIT | version-matched | node_modules/wrap-ansi/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| wrappy@1.0.2 (node_modules/wrappy) | ISC | version-matched | node_modules/wrappy/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| write-file-atomic@4.0.2 (node_modules/write-file-atomic) | ISC | version-matched | node_modules/write-file-atomic/LICENSE.md [text-ea7f376fe7a1fc28572b83ac8f806d92effb31852b9981bc9ba9d5266caa6b28] |
| ws@7.5.13 (node_modules/ws) | MIT | version-matched | node_modules/ws/LICENSE [text-3de284c8e6fa7e8437eff6f53695471e0332129a5b42a79361e17b7637de94b3] |
| xcode@4.0.0 (node_modules/xcode) | Apache-2.0 | version-matched | node_modules/xcode/LICENSE [text-cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30]; node_modules/xcode/NOTICE [text-0e5b0fe8d11e1627336bc6361de610ba8acf9a035fd73e07b5b4a0909a48371f] |
| xml2js@0.6.0 (node_modules/xml2js) | MIT | version-matched | node_modules/xml2js/LICENSE [text-c51452ef1dfd5606c9fe266930fa6bf7e8a534d52973b6475df5bf212cad5b0a] |
| xmlbuilder@11.0.1 (node_modules/xml2js/node_modules/xmlbuilder) | MIT | version-matched | node_modules/xml2js/node_modules/xmlbuilder/LICENSE [text-e368bc4263b466cf98c225af15e300549e00da8859416a4536109e9654d434a8] |
| xmlbuilder@15.1.1 (node_modules/xmlbuilder) | MIT | version-matched | node_modules/xmlbuilder/LICENSE [text-e368bc4263b466cf98c225af15e300549e00da8859416a4536109e9654d434a8] |
| y18n@5.0.8 (node_modules/y18n) | ISC | version-matched | node_modules/y18n/LICENSE [text-2034cce3b6fafcddd642c4175e01d3ddfc332a53b9f20fdc46b1466dc89ac469] |
| yallist@3.1.1 (node_modules/yallist) | ISC | version-matched | node_modules/yallist/LICENSE [text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b] |
| yaml@2.9.1 (node_modules/yaml) | ISC | version-matched | node_modules/yaml/LICENSE [text-5bba27375d93e9119f76c1015f7672cf9ad5f70952296e0842fb2243d6376869] |
| yargs@17.7.3 (node_modules/yargs) | MIT | version-matched | node_modules/yargs/LICENSE [text-2f1a503bfab84b3ba7393627308b3274501e459e3b5185bbb56bbf16cb1602d4] |
| yargs-parser@21.1.1 (node_modules/yargs-parser) | ISC | version-matched | node_modules/yargs-parser/LICENSE.txt [text-365496ca1f56da40b23c9815fc40fa9005847b2f8f8fd1c1a4929ef25ec8cd1d] |
| yocto-queue@0.1.0 (node_modules/yocto-queue) | MIT | version-matched | node_modules/yocto-queue/license [text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3] |
| zod@4.6.7 (node_modules/zod) | MIT | version-matched | node_modules/zod/LICENSE [text-3f1189b28e3866e0d979968d466b78f813f76827cfdca1fbb124cc0a5c8841f8] |
| zustand@5.0.15 (node_modules/zustand) | MIT | version-matched | node_modules/zustand/LICENSE [text-c1e6e266563517467b1bf874817d23e426f3149252bd7d42758cd697514b8417] |

## Font and project-art scope

The source-import scan detects Ionicons. Its actual font bytes and source imports are recorded in JSON; the vector-icons package and embedded vendor notice files are indexed above. Package metadata does not alone settle every font-specific notice. Only static default imports from `@expo/vector-icons/FAMILY` are detected; this is not an exhaustive final-bundle graph.

Project-generated art is separate from npm licensing. JSON records source/config-referenced image hashes; provenance is in [the generated-art record](assets/generated/README.md), [launcher provenance](docs/APP_IDENTITY_AND_BRANDING.md) and [ordinary-hobby source manifest](docs/planning/drafts/ordinary-hobby-art.json). Historic candidate labels do not establish current runtime or legal acceptance. Final native resources, store art, OS fonts and Pods/AAR notices remain outside this candidate inventory.

## Installed notice text display

Original contents are data; preserve their upstream notices and source references. Text blocks are deduplicated only when the original byte hash matches. Exact text strings, bytes and hashes are retained in JSON. This Markdown display normalizes line endings and removes trailing line whitespace; substantive notice text is unchanged.

### text-000a66d1bc9e206b5963ba9370cd03350a4b26e205b5880e8e0f882a51951178

SHA-256 `000a66d1bc9e206b5963ba9370cd03350a4b26e205b5880e8e0f882a51951178` · 1082 original bytes.

Sources:

- `node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2015 Joel Arvidsson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-00b9d4904d850fcd9bb470d0f4853c50f169df974fab5552cf41a4ff81a524e2

SHA-256 `00b9d4904d850fcd9bb470d0f4853c50f169df974fab5552cf41a4ff81a524e2` · 1298 original bytes.

Sources:

- `node_modules/fontfaceobserver/LICENSE`

```text
Copyright (c) 2014 - Bram Stein

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### text-04512a63dce4d2d506ad612dc0bd7681ccf6e3655f7b6eaef7dfac8323d1ec0b

SHA-256 `04512a63dce4d2d506ad612dc0bd7681ccf6e3655f7b6eaef7dfac8323d1ec0b` · 1098 original bytes.

Sources:

- `node_modules/commander/LICENSE`
- `node_modules/react-native/node_modules/commander/LICENSE`
- `node_modules/terser/node_modules/commander/LICENSE`

```text
(The MIT License)

Copyright (c) 2011 TJ Holowaychuk <tj@vision-media.ca>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-049dff02fd6730c5960862ccca921d05541a7788ad0d76e25cc56dc9541bbf4b

SHA-256 `049dff02fd6730c5960862ccca921d05541a7788ad0d76e25cc56dc9541bbf4b` · 777 original bytes.

Sources:

- `node_modules/@isaacs/ttlcache/LICENSE`

```text
The ISC License

Copyright (c) 2022-2023 - Isaac Z. Schlueter and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-051e2d2738b442a8a8403194f485deeacd9a7e895c08ffbf9e600a9dae858dcc

SHA-256 `051e2d2738b442a8a8403194f485deeacd9a7e895c08ffbf9e600a9dae858dcc` · 1142 original bytes.

Sources:

- `node_modules/@expo/xcpretty/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2013-2016 Marin Usalj
Copyright (c) 2021-present 650 Industries, Inc. (aka Expo)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-05dc4d785ac3a488676d3ed10e901b75ad89dafcc63f8e66610fd4a39cc5c7e8

SHA-256 `05dc4d785ac3a488676d3ed10e901b75ad89dafcc63f8e66610fd4a39cc5c7e8` · 748 original bytes.

Sources:

- `node_modules/inflight/LICENSE`

```text
The ISC License

Copyright (c) Isaac Z. Schlueter

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-096ff3c9ceea6df46491b0d04e4a9dca7b4be87b1b7f0b7c08a8aea08a0ffb40

SHA-256 `096ff3c9ceea6df46491b0d04e4a9dca7b4be87b1b7f0b7c08a8aea08a0ffb40` · 641 original bytes.

Sources:

- `node_modules/jsc-safe-url/LICENSE`

```text
Zero-Clause BSD
=============

Permission to use, copy, modify, and/or distribute this software for
any purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED “AS IS” AND THE AUTHOR DISCLAIMS ALL
WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE
FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY
DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN
AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT
OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-0c0fc06d178272faaf09281aff0cb014d52c56fb0d9516b964808d4cccb65c93

SHA-256 `0c0fc06d178272faaf09281aff0cb014d52c56fb0d9516b964808d4cccb65c93` · 1147 original bytes.

Sources:

- `node_modules/@expo/metro/LICENSE`

```text
MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.
Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-0cff14eaf2736ff712a34ef8d61f4144082e61387fff1ee3bef9da003d96a4ce

SHA-256 `0cff14eaf2736ff712a34ef8d61f4144082e61387fff1ee3bef9da003d96a4ce` · 1142 original bytes.

Sources:

- `node_modules/resolve-workspace-root/LICENSE.md`

```text
# The MIT License (MIT)

Copyright (c) 2024-present Cedric van Putten <me@cedric.dev>

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
```

### text-0e5b0fe8d11e1627336bc6361de610ba8acf9a035fd73e07b5b4a0909a48371f

SHA-256 `0e5b0fe8d11e1627336bc6361de610ba8acf9a035fd73e07b5b4a0909a48371f` · 168 original bytes.

Sources:

- `node_modules/xcode/NOTICE`

```text
Apache Cordova
Copyright 2012-2020 The Apache Software Foundation

This product includes software developed at
The Apache Software Foundation (http://www.apache.org/).
```

### text-0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138

SHA-256 `0e80a2d229d2fd4fc7e8636142ec5d0ff0bc031f14c15b682e2ac01dfd5b5138` · 1063 original bytes.

Sources:

- `node_modules/@radix-ui/primitive/LICENSE`
- `node_modules/@radix-ui/react-compose-refs/LICENSE`
- `node_modules/@radix-ui/react-context/LICENSE`
- `node_modules/@radix-ui/react-direction/LICENSE`
- `node_modules/@radix-ui/react-focus-guards/LICENSE`
- `node_modules/@radix-ui/react-id/LICENSE`
- `node_modules/@radix-ui/react-slot/LICENSE`
- `node_modules/@radix-ui/react-use-callback-ref/LICENSE`
- `node_modules/@radix-ui/react-use-controllable-state/LICENSE`
- `node_modules/@radix-ui/react-use-effect-event/LICENSE`
- `node_modules/@radix-ui/react-use-is-hydrated/LICENSE`
- `node_modules/@radix-ui/react-use-layout-effect/LICENSE`
- `node_modules/expo-router/node_modules/@radix-ui/react-collection/LICENSE`
- `node_modules/expo-router/node_modules/@radix-ui/react-presence/LICENSE`
- `node_modules/expo-router/node_modules/@radix-ui/react-primitive/LICENSE`
- `node_modules/expo-router/node_modules/@radix-ui/react-roving-focus/LICENSE`
- `node_modules/expo-router/node_modules/@radix-ui/react-tabs/LICENSE`
- `node_modules/vaul/node_modules/@radix-ui/react-dialog/LICENSE`
- `node_modules/vaul/node_modules/@radix-ui/react-dismissable-layer/LICENSE`
- `node_modules/vaul/node_modules/@radix-ui/react-focus-scope/LICENSE`
- `node_modules/vaul/node_modules/@radix-ui/react-portal/LICENSE`
- `node_modules/vaul/node_modules/@radix-ui/react-presence/LICENSE`
- `node_modules/vaul/node_modules/@radix-ui/react-primitive/LICENSE`

```text
MIT License

Copyright (c) 2022 WorkOS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-0f0ca96f50793990031ebc488a38f7292ff70bce8ab6a8e5eeda674abc32ccdf

SHA-256 `0f0ca96f50793990031ebc488a38f7292ff70bce8ab6a8e5eeda674abc32ccdf` · 1067 original bytes.

Sources:

- `node_modules/supports-preserve-symlinks-flag/LICENSE`

```text
MIT License

Copyright (c) 2022 Inspect JS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-0f2c1c521a08ca2e202316a29c57cba39077ebe2618cf10f23df410f4047f60a

SHA-256 `0f2c1c521a08ca2e202316a29c57cba39077ebe2618cf10f23df410f4047f60a` · 11357 original bytes.

Sources:

- `node_modules/human-signals/LICENSE`

```text
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright 2019 ehmicky <ehmicky@gmail.com>

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### text-117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76

SHA-256 `117da2af0d4ce0fe1c8e19b5cff9dcd806adf973d328d27b11d4448c4ff24f76` · 1106 original bytes.

Sources:

- `node_modules/@babel/code-frame/LICENSE`
- `node_modules/@babel/compat-data/LICENSE`
- `node_modules/@babel/core/LICENSE`
- `node_modules/@babel/generator/LICENSE`
- `node_modules/@babel/helper-annotate-as-pure/LICENSE`
- `node_modules/@babel/helper-compilation-targets/LICENSE`
- `node_modules/@babel/helper-create-class-features-plugin/LICENSE`
- `node_modules/@babel/helper-create-regexp-features-plugin/LICENSE`
- `node_modules/@babel/helper-globals/LICENSE`
- `node_modules/@babel/helper-member-expression-to-functions/LICENSE`
- `node_modules/@babel/helper-module-imports/LICENSE`
- `node_modules/@babel/helper-module-transforms/LICENSE`
- `node_modules/@babel/helper-optimise-call-expression/LICENSE`
- `node_modules/@babel/helper-plugin-utils/LICENSE`
- `node_modules/@babel/helper-remap-async-to-generator/LICENSE`
- `node_modules/@babel/helper-replace-supers/LICENSE`
- `node_modules/@babel/helper-skip-transparent-expression-wrappers/LICENSE`
- `node_modules/@babel/helper-string-parser/LICENSE`
- `node_modules/@babel/helper-validator-identifier/LICENSE`
- `node_modules/@babel/helper-validator-option/LICENSE`
- `node_modules/@babel/helper-wrap-function/LICENSE`
- `node_modules/@babel/plugin-proposal-decorators/LICENSE`
- `node_modules/@babel/plugin-proposal-export-default-from/LICENSE`
- `node_modules/@babel/plugin-syntax-async-generators/LICENSE`
- `node_modules/@babel/plugin-syntax-bigint/LICENSE`
- `node_modules/@babel/plugin-syntax-class-properties/LICENSE`
- `node_modules/@babel/plugin-syntax-class-static-block/LICENSE`
- `node_modules/@babel/plugin-syntax-decorators/LICENSE`
- `node_modules/@babel/plugin-syntax-dynamic-import/LICENSE`
- `node_modules/@babel/plugin-syntax-export-default-from/LICENSE`
- `node_modules/@babel/plugin-syntax-flow/LICENSE`
- `node_modules/@babel/plugin-syntax-import-attributes/LICENSE`
- `node_modules/@babel/plugin-syntax-import-meta/LICENSE`
- `node_modules/@babel/plugin-syntax-json-strings/LICENSE`
- `node_modules/@babel/plugin-syntax-jsx/LICENSE`
- `node_modules/@babel/plugin-syntax-logical-assignment-operators/LICENSE`
- `node_modules/@babel/plugin-syntax-nullish-coalescing-operator/LICENSE`
- `node_modules/@babel/plugin-syntax-numeric-separator/LICENSE`
- `node_modules/@babel/plugin-syntax-object-rest-spread/LICENSE`
- `node_modules/@babel/plugin-syntax-optional-catch-binding/LICENSE`
- `node_modules/@babel/plugin-syntax-optional-chaining/LICENSE`
- `node_modules/@babel/plugin-syntax-private-property-in-object/LICENSE`
- `node_modules/@babel/plugin-syntax-top-level-await/LICENSE`
- `node_modules/@babel/plugin-syntax-typescript/LICENSE`
- `node_modules/@babel/plugin-transform-arrow-functions/LICENSE`
- `node_modules/@babel/plugin-transform-async-generator-functions/LICENSE`
- `node_modules/@babel/plugin-transform-async-to-generator/LICENSE`
- `node_modules/@babel/plugin-transform-block-scoping/LICENSE`
- `node_modules/@babel/plugin-transform-class-properties/LICENSE`
- `node_modules/@babel/plugin-transform-class-static-block/LICENSE`
- `node_modules/@babel/plugin-transform-classes/LICENSE`
- `node_modules/@babel/plugin-transform-destructuring/LICENSE`
- `node_modules/@babel/plugin-transform-export-namespace-from/LICENSE`
- `node_modules/@babel/plugin-transform-flow-strip-types/LICENSE`
- `node_modules/@babel/plugin-transform-for-of/LICENSE`
- `node_modules/@babel/plugin-transform-logical-assignment-operators/LICENSE`
- `node_modules/@babel/plugin-transform-modules-commonjs/LICENSE`
- `node_modules/@babel/plugin-transform-named-capturing-groups-regex/LICENSE`
- `node_modules/@babel/plugin-transform-nullish-coalescing-operator/LICENSE`
- `node_modules/@babel/plugin-transform-object-rest-spread/LICENSE`
- `node_modules/@babel/plugin-transform-optional-catch-binding/LICENSE`
- `node_modules/@babel/plugin-transform-optional-chaining/LICENSE`
- `node_modules/@babel/plugin-transform-parameters/LICENSE`
- `node_modules/@babel/plugin-transform-private-methods/LICENSE`
- `node_modules/@babel/plugin-transform-private-property-in-object/LICENSE`
- `node_modules/@babel/plugin-transform-react-display-name/LICENSE`
- `node_modules/@babel/plugin-transform-react-jsx-development/LICENSE`
- `node_modules/@babel/plugin-transform-react-jsx-self/LICENSE`
- `node_modules/@babel/plugin-transform-react-jsx-source/LICENSE`
- `node_modules/@babel/plugin-transform-react-jsx/LICENSE`
- `node_modules/@babel/plugin-transform-react-pure-annotations/LICENSE`
- `node_modules/@babel/plugin-transform-runtime/LICENSE`
- `node_modules/@babel/plugin-transform-shorthand-properties/LICENSE`
- `node_modules/@babel/plugin-transform-template-literals/LICENSE`
- `node_modules/@babel/plugin-transform-typescript/LICENSE`
- `node_modules/@babel/plugin-transform-unicode-regex/LICENSE`
- `node_modules/@babel/preset-typescript/LICENSE`
- `node_modules/@babel/runtime/LICENSE`
- `node_modules/@babel/template/LICENSE`
- `node_modules/@babel/traverse/LICENSE`
- `node_modules/@babel/types/LICENSE`

```text
MIT License

Copyright (c) 2014-present Sebastian McKenzie and other contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-11d017c3b9f1ee3f44caf7203035f0461d5b57e0db8ce1bc03a9af34fa7d3f6b

SHA-256 `11d017c3b9f1ee3f44caf7203035f0461d5b57e0db8ce1bc03a9af34fa7d3f6b` · 1173 original bytes.

Sources:

- `node_modules/parseurl/LICENSE`

```text

(The MIT License)

Copyright (c) 2014 Jonathan Ong <me@jongleberry.com>
Copyright (c) 2014-2017 Douglas Christopher Wilson <doug@somethingdoug.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-11d55bd4541c75ee7879547ac49089c489163dae49551389713c3d026cab383e

SHA-256 `11d55bd4541c75ee7879547ac49089c489163dae49551389713c3d026cab383e` · 1062 original bytes.

Sources:

- `node_modules/csstype/LICENSE`

```text
Copyright (c) 2017-2018 Fredrik Nicol

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-14275f5c8139d02054c5259d52a88ccbba662a86af18c30f071c8d082dc6004c

SHA-256 `14275f5c8139d02054c5259d52a88ccbba662a86af18c30f071c8d082dc6004c` · 1078 original bytes.

Sources:

- `node_modules/buffer-from/LICENSE`

```text
MIT License

Copyright (c) 2016, 2018 Linus Unnebäck

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-144c935613e823350f7798d19da78b5e8315a79af5c2a3744fd85cd61baf07ee

SHA-256 `144c935613e823350f7798d19da78b5e8315a79af5c2a3744fd85cd61baf07ee` · 1166 original bytes.

Sources:

- `node_modules/mkdirp/LICENSE`

```text
Copyright James Halliday (mail@substack.net) and Isaac Z. Schlueter (i@izs.me)

This project is free software released under the MIT license:

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-1662fae9b5314d11cf51284e2dcd1f006a354f7343f08712a730fcff9a359801

SHA-256 `1662fae9b5314d11cf51284e2dcd1f006a354f7343f08712a730fcff9a359801` · 1079 original bytes.

Sources:

- `node_modules/ms/license.md`

```text
The MIT License (MIT)

Copyright (c) 2020 Vercel, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-16feb932ce2ba7bc7712657bb28afe409eaa4334f9f05d0e1b7a5f12bf6132f4

SHA-256 `16feb932ce2ba7bc7712657bb28afe409eaa4334f9f05d0e1b7a5f12bf6132f4` · 1107 original bytes.

Sources:

- `node_modules/@expo/config-plugins/LICENSE`
- `node_modules/@expo/config-plugins/node_modules/@expo/json-file/LICENSE`
- `node_modules/@expo/config/LICENSE`
- `node_modules/@expo/devtools/LICENSE`
- `node_modules/@expo/fingerprint/LICENSE`
- `node_modules/@expo/json-file/LICENSE`
- `node_modules/@expo/local-build-cache-provider/LICENSE`
- `node_modules/@expo/metro-config/LICENSE`
- `node_modules/@expo/metro-config/node_modules/@expo/json-file/LICENSE`
- `node_modules/@expo/package-manager/LICENSE`
- `node_modules/@expo/prebuild-config/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-176b07a18c0bb3836aaeb61088fd0bf11a38f66e6f15e3fbda85faa225250d6e

SHA-256 `176b07a18c0bb3836aaeb61088fd0bf11a38f66e6f15e3fbda85faa225250d6e` · 1151 original bytes.

Sources:

- `node_modules/pngjs/LICENSE`

```text
pngjs2 original work Copyright (c) 2015 Luke Page & Original Contributors
pngjs derived work Copyright (c) 2012 Kuba Niegowski

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-19ba4296d3501ae3a71920bc9872a5c50ce94105bbf4c2a21d5172658cedd6ae

SHA-256 `19ba4296d3501ae3a71920bc9872a5c50ce94105bbf4c2a21d5172658cedd6ae` · 1083 original bytes.

Sources:

- `node_modules/react-freeze/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2021 Software Mansion

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-1a526fbe8d8577f5a4b1c2821842b55b7c0e18862531c62ae4ce69c9b19b74b6

SHA-256 `1a526fbe8d8577f5a4b1c2821842b55b7c0e18862531c62ae4ce69c9b19b74b6` · 1114 original bytes.

Sources:

- `node_modules/unpipe/LICENSE`

```text
(The MIT License)

Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-1a9c55b2961f5e3062e181fa55666c44d011fc3cc03ed6d4fa4321c51f2a5ec5

SHA-256 `1a9c55b2961f5e3062e181fa55666c44d011fc3cc03ed6d4fa4321c51f2a5ec5` · 731 original bytes.

Sources:

- `node_modules/@bcoe/v8-coverage/LICENSE.txt`
- `node_modules/v8-to-istanbul/LICENSE.txt`

```text
Copyright (c) 2017, Contributors

Permission to use, copy, modify, and/or distribute this software
for any purpose with or without fee is hereby granted, provided
that the above copyright notice and this permission notice
appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE
LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-1af3c68039c57e539422da82a4faada506ce6d0ea6f90e0b699d02dbcdb7a90c

SHA-256 `1af3c68039c57e539422da82a4faada506ce6d0ea6f90e0b699d02dbcdb7a90c` · 37824 original bytes.

Sources:

- `node_modules/typescript/ThirdPartyNoticeText.txt`

```text
/*!----------------- TypeScript ThirdPartyNotices -------------------------------------------------------

The TypeScript software incorporates third party material from the projects listed below. The original copyright notice and the license under which Microsoft received such third party material are set forth below. Microsoft reserves all other rights not expressly granted, whether by implication, estoppel or otherwise.

---------------------------------------------
Third Party Code Components
--------------------------------------------

------------------- DefinitelyTyped --------------------
This file is based on or incorporates material from the projects listed below (collectively "Third Party Code"). Microsoft is not the original author of the Third Party Code. The original copyright notice and the license, under which Microsoft received such Third Party Code, are set forth below. Such licenses and notices are provided for informational purposes only. Microsoft, not the third party, licenses the Third Party Code to you under the terms set forth in the EULA for the Microsoft Product. Microsoft reserves all other rights not expressly granted under this agreement, whether by implication, estoppel or otherwise.
DefinitelyTyped
This project is licensed under the MIT license. Copyrights are respective of each contributor listed at the beginning of each definition file. Provided for Informational Purposes Only

MIT License
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the ""Software""), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
--------------------------------------------------------------------------------------

------------------- Unicode --------------------
UNICODE, INC. LICENSE AGREEMENT - DATA FILES AND SOFTWARE

Unicode Data Files include all data files under the directories
http://www.unicode.org/Public/, http://www.unicode.org/reports/,
http://www.unicode.org/cldr/data/, http://source.icu-project.org/repos/icu/, and
http://www.unicode.org/utility/trac/browser/.

Unicode Data Files do not include PDF online code charts under the
directory http://www.unicode.org/Public/.

Software includes any source code published in the Unicode Standard
or under the directories
http://www.unicode.org/Public/, http://www.unicode.org/reports/,
http://www.unicode.org/cldr/data/, http://source.icu-project.org/repos/icu/, and
http://www.unicode.org/utility/trac/browser/.

NOTICE TO USER: Carefully read the following legal agreement.
BY DOWNLOADING, INSTALLING, COPYING OR OTHERWISE USING UNICODE INC.'S
DATA FILES ("DATA FILES"), AND/OR SOFTWARE ("SOFTWARE"),
YOU UNEQUIVOCALLY ACCEPT, AND AGREE TO BE BOUND BY, ALL OF THE
TERMS AND CONDITIONS OF THIS AGREEMENT.
IF YOU DO NOT AGREE, DO NOT DOWNLOAD, INSTALL, COPY, DISTRIBUTE OR USE
THE DATA FILES OR SOFTWARE.

COPYRIGHT AND PERMISSION NOTICE

Copyright (c) 1991-2017 Unicode, Inc. All rights reserved.
Distributed under the Terms of Use in http://www.unicode.org/copyright.html.

Permission is hereby granted, free of charge, to any person obtaining
a copy of the Unicode data files and any associated documentation
(the "Data Files") or Unicode software and any associated documentation
(the "Software") to deal in the Data Files or Software
without restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, and/or sell copies of
the Data Files or Software, and to permit persons to whom the Data Files
or Software are furnished to do so, provided that either
(a) this copyright and permission notice appear with all copies
of the Data Files or Software, or
(b) this copyright and permission notice appear in associated
Documentation.

THE DATA FILES AND SOFTWARE ARE PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT OF THIRD PARTY RIGHTS.
IN NO EVENT SHALL THE COPYRIGHT HOLDER OR HOLDERS INCLUDED IN THIS
NOTICE BE LIABLE FOR ANY CLAIM, OR ANY SPECIAL INDIRECT OR CONSEQUENTIAL
DAMAGES, OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE,
DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THE DATA FILES OR SOFTWARE.

Except as contained in this notice, the name of a copyright holder
shall not be used in advertising or otherwise to promote the sale,
use or other dealings in these Data Files or Software without prior
written authorization of the copyright holder.
-------------------------------------------------------------------------------------

-------------------Document Object Model-----------------------------
DOM

W3C License
This work is being provided by the copyright holders under the following license.
By obtaining and/or copying this work, you (the licensee) agree that you have read, understood, and will comply with the following terms and conditions.
Permission to copy, modify, and distribute this work, with or without modification, for any purpose and without fee or royalty is hereby granted, provided that you include the following
on ALL copies of the work or portions thereof, including modifications:
* The full text of this NOTICE in a location viewable to users of the redistributed or derivative work.
* Any pre-existing intellectual property disclaimers, notices, or terms and conditions. If none exist, the W3C Software and Document Short Notice should be included.
* Notice of any changes or modifications, through a copyright statement on the new code or document such as "This software or document includes material copied from or derived
from [title and URI of the W3C document]. Copyright © [YEAR] W3C® (MIT, ERCIM, Keio, Beihang)."
Disclaimers
THIS WORK IS PROVIDED "AS IS," AND COPYRIGHT HOLDERS MAKE NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO, WARRANTIES OF MERCHANTABILITY OR
FITNESS FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF THE SOFTWARE OR DOCUMENT WILL NOT INFRINGE ANY THIRD PARTY PATENTS, COPYRIGHTS, TRADEMARKS OR OTHER RIGHTS.
COPYRIGHT HOLDERS WILL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, SPECIAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF ANY USE OF THE SOFTWARE OR DOCUMENT.
The name and trademarks of copyright holders may NOT be used in advertising or publicity pertaining to the work without specific, written prior permission.
Title to copyright in this work will at all times remain with copyright holders.

---------

DOM
Copyright © 2018 WHATWG (Apple, Google, Mozilla, Microsoft). This work is licensed under a Creative Commons Attribution 4.0 International License: Attribution 4.0 International
=======================================================================
Creative Commons Corporation ("Creative Commons") is not a law firm and does not provide legal services or legal advice. Distribution of Creative Commons public licenses does not create a lawyer-client or other relationship. Creative Commons makes its licenses and related information available on an "as-is" basis. Creative Commons gives no warranties regarding its licenses, any material licensed under their terms and conditions, or any related information. Creative Commons disclaims all liability for damages resulting from their use to the fullest extent possible. Using Creative Commons Public Licenses Creative Commons public licenses provide a standard set of terms and conditions that creators and other rights holders may use to share original works of authorship and other material subject to copyright and certain other rights specified in the public license below. The following considerations are for informational purposes only, are not exhaustive, and do not form part of our licenses. Considerations for licensors: Our public licenses are intended for use by those authorized to give the public permission to use material in ways otherwise restricted by copyright and certain other rights. Our licenses are irrevocable. Licensors should read and understand the terms and conditions of the license they choose before applying it. Licensors should also secure all rights necessary before applying our licenses so that the public can reuse the material as expected. Licensors should clearly mark any material not subject to the license. This includes other CC- licensed material, or material used under an exception or limitation to copyright. More considerations for licensors:

wiki.creativecommons.org/Considerations_for_licensors Considerations for the public: By using one of our public licenses, a licensor grants the public permission to use the licensed material under specified terms and conditions. If the licensor's permission is not necessary for any reason--for example, because of any applicable exception or limitation to copyright--then that use is not regulated by the license. Our licenses grant only permissions under copyright and certain other rights that a licensor has authority to grant. Use of the licensed material may still be restricted for other reasons, including because others have copyright or other rights in the material. A licensor may make special requests, such as asking that all changes be marked or described. Although not required by our licenses, you are encouraged to respect those requests where reasonable. More_considerations for the public: wiki.creativecommons.org/Considerations_for_licensees =======================================================================
Creative Commons Attribution 4.0 International Public License By exercising the Licensed Rights (defined below), You accept and agree to be bound by the terms and conditions of this Creative Commons Attribution 4.0 International Public License ("Public License"). To the extent this Public License may be interpreted as a contract, You are granted the Licensed Rights in consideration of Your acceptance of these terms and conditions, and the Licensor grants You such rights in consideration of benefits the Licensor receives from making the Licensed Material available under these terms and conditions. Section 1 -- Definitions. a. Adapted Material means material subject to Copyright and Similar Rights that is derived from or based upon the Licensed Material and in which the Licensed Material is translated, altered, arranged, transformed, or otherwise modified in a manner requiring permission under the Copyright and Similar Rights held by the Licensor. For purposes of this Public License, where the Licensed Material is a musical work, performance, or sound recording, Adapted Material is always produced where the Licensed Material is synched in timed relation with a moving image. b. Adapter's License means the license You apply to Your Copyright and Similar Rights in Your contributions to Adapted Material in accordance with the terms and conditions of this Public License. c. Copyright and Similar Rights means copyright and/or similar rights closely related to copyright including, without limitation, performance, broadcast, sound recording, and Sui Generis Database Rights, without regard to how the rights are labeled or categorized. For purposes of this Public License, the rights specified in Section 2(b)(1)-(2) are not Copyright and Similar Rights. d. Effective Technological Measures means those measures that, in the absence of proper authority, may not be circumvented under laws fulfilling obligations under Article 11 of the WIPO Copyright Treaty adopted on December 20, 1996, and/or similar international agreements. e. Exceptions and Limitations means fair use, fair dealing, and/or any other exception or limitation to Copyright and Similar Rights that applies to Your use of the Licensed Material. f. Licensed Material means the artistic or literary work, database, or other material to which the Licensor applied this Public License. g. Licensed Rights means the rights granted to You subject to the terms and conditions of this Public License, which are limited to all Copyright and Similar Rights that apply to Your use of the Licensed Material and that the Licensor has authority to license. h. Licensor means the individual(s) or entity(ies) granting rights under this Public License. i. Share means to provide material to the public by any means or process that requires permission under the Licensed Rights, such as reproduction, public display, public performance, distribution, dissemination, communication, or importation, and to make material available to the public including in ways that members of the public may access the material from a place and at a time individually chosen by them. j. Sui Generis Database Rights means rights other than copyright resulting from Directive 96/9/EC of the European Parliament and of the Council of 11 March 1996 on the legal protection of databases, as amended and/or succeeded, as well as other essentially equivalent rights anywhere in the world. k. You means the individual or entity exercising the Licensed Rights under this Public License. Your has a corresponding meaning. Section 2 -- Scope. a. License grant. 1. Subject to the terms and conditions of this Public License, the Licensor hereby grants You a worldwide, royalty-free, non-sublicensable, non-exclusive, irrevocable license to exercise the Licensed Rights in the Licensed Material to: a. reproduce and Share the Licensed Material, in whole or in part; and b. produce, reproduce, and Share Adapted Material. 2. Exceptions and Limitations. For the avoidance of doubt, where Exceptions and Limitations apply to Your use, this Public License does not apply, and You do not need to comply with its terms and conditions. 3. Term. The term of this Public License is specified in Section 6(a). 4. Media and formats; technical modifications allowed. The Licensor authorizes You to exercise the Licensed Rights in all media and formats whether now known or hereafter created, and to make technical modifications necessary to do so. The Licensor waives and/or agrees not to assert any right or authority to forbid You from making technical modifications necessary to exercise the Licensed Rights, including technical modifications necessary to circumvent Effective Technological Measures. For purposes of this Public License, simply making modifications authorized by this Section 2(a) (4) never produces Adapted Material. 5. Downstream recipients. a. Offer from the Licensor -- Licensed Material. Every recipient of the Licensed Material automatically receives an offer from the Licensor to exercise the Licensed Rights under the terms and conditions of this Public License. b. No downstream restrictions. You may not offer or impose any additional or different terms or conditions on, or apply any Effective Technological Measures to, the Licensed Material if doing so restricts exercise of the Licensed Rights by any recipient of the Licensed Material. 6. No endorsement. Nothing in this Public License constitutes or may be construed as permission to assert or imply that You are, or that Your use of the Licensed Material is, connected with, or sponsored, endorsed, or granted official status by, the Licensor or others designated to receive attribution as provided in Section 3(a)(1)(A)(i). b. Other rights. 1. Moral rights, such as the right of integrity, are not licensed under this Public License, nor are publicity, privacy, and/or other similar personality rights; however, to the extent possible, the Licensor waives and/or agrees not to assert any such rights held by the Licensor to the limited extent necessary to allow You to exercise the Licensed Rights, but not otherwise. 2. Patent and trademark rights are not licensed under this Public License. 3. To the extent possible, the Licensor waives any right to collect royalties from You for the exercise of the Licensed Rights, whether directly or through a collecting society under any voluntary or waivable statutory or compulsory licensing scheme. In all other cases the Licensor expressly reserves any right to collect such royalties. Section 3 -- License Conditions. Your exercise of the Licensed Rights is expressly made subject to the following conditions. a. Attribution. 1. If You Share the Licensed Material (including in modified form), You must: a. retain the following if it is supplied by the Licensor with the Licensed Material: i. identification of the creator(s) of the Licensed Material and any others designated to receive attribution, in any reasonable manner requested by the Licensor (including by pseudonym if designated); ii. a copyright notice; iii. a notice that refers to this Public License; iv. a notice that refers to the disclaimer of warranties; v. a URI or hyperlink to the Licensed Material to the extent reasonably practicable; b. indicate if You modified the Licensed Material and retain an indication of any previous modifications; and c. indicate the Licensed Material is licensed under this Public License, and include the text of, or the URI or hyperlink to, this Public License. 2. You may satisfy the conditions in Section 3(a)(1) in any reasonable manner based on the medium, means, and context in which You Share the Licensed Material. For example, it may be reasonable to satisfy the conditions by providing a URI or hyperlink to a resource that includes the required information. 3. If requested by the Licensor, You must remove any of the information required by Section 3(a)(1)(A) to the extent reasonably practicable. 4. If You Share Adapted Material You produce, the Adapter's License You apply must not prevent recipients of the Adapted Material from complying with this Public License. Section 4 -- Sui Generis Database Rights. Where the Licensed Rights include Sui Generis Database Rights that apply to Your use of the Licensed Material: a. for the avoidance of doubt, Section 2(a)(1) grants You the right to extract, reuse, reproduce, and Share all or a substantial portion of the contents of the database; b. if You include all or a substantial portion of the database contents in a database in which You have Sui Generis Database Rights, then the database in which You have Sui Generis Database Rights (but not its individual contents) is Adapted Material; and c. You must comply with the conditions in Section 3(a) if You Share all or a substantial portion of the contents of the database. For the avoidance of doubt, this Section 4 supplements and does not replace Your obligations under this Public License where the Licensed Rights include other Copyright and Similar Rights. Section 5 -- Disclaimer of Warranties and Limitation of Liability. a. UNLESS OTHERWISE SEPARATELY UNDERTAKEN BY THE LICENSOR, TO THE EXTENT POSSIBLE, THE LICENSOR OFFERS THE LICENSED MATERIAL AS-IS AND AS-AVAILABLE, AND MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND CONCERNING THE LICENSED MATERIAL, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHER. THIS INCLUDES, WITHOUT LIMITATION, WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ABSENCE OF LATENT OR OTHER DEFECTS, ACCURACY, OR THE PRESENCE OR ABSENCE OF ERRORS, WHETHER OR NOT KNOWN OR DISCOVERABLE. WHERE DISCLAIMERS OF WARRANTIES ARE NOT ALLOWED IN FULL OR IN PART, THIS DISCLAIMER MAY NOT APPLY TO YOU. b. TO THE EXTENT POSSIBLE, IN NO EVENT WILL THE LICENSOR BE LIABLE TO YOU ON ANY LEGAL THEORY (INCLUDING, WITHOUT LIMITATION, NEGLIGENCE) OR OTHERWISE FOR ANY DIRECT, SPECIAL, INDIRECT, INCIDENTAL, CONSEQUENTIAL, PUNITIVE, EXEMPLARY, OR OTHER LOSSES, COSTS, EXPENSES, OR DAMAGES ARISING OUT OF THIS PUBLIC LICENSE OR USE OF THE LICENSED MATERIAL, EVEN IF THE LICENSOR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH LOSSES, COSTS, EXPENSES, OR DAMAGES. WHERE A LIMITATION OF LIABILITY IS NOT ALLOWED IN FULL OR IN PART, THIS LIMITATION MAY NOT APPLY TO YOU. c. The disclaimer of warranties and limitation of liability provided above shall be interpreted in a manner that, to the extent possible, most closely approximates an absolute disclaimer and waiver of all liability. Section 6 -- Term and Termination. a. This Public License applies for the term of the Copyright and Similar Rights licensed here. However, if You fail to comply with this Public License, then Your rights under this Public License terminate automatically. b. Where Your right to use the Licensed Material has terminated under Section 6(a), it reinstates: 1. automatically as of the date the violation is cured, provided it is cured within 30 days of Your discovery of the violation; or 2. upon express reinstatement by the Licensor. For the avoidance of doubt, this Section 6(b) does not affect any right the Licensor may have to seek remedies for Your violations of this Public License. c. For the avoidance of doubt, the Licensor may also offer the Licensed Material under separate terms or conditions or stop distributing the Licensed Material at any time; however, doing so will not terminate this Public License. d. Sections 1, 5, 6, 7, and 8 survive termination of this Public License. Section 7 -- Other Terms and Conditions. a. The Licensor shall not be bound by any additional or different terms or conditions communicated by You unless expressly agreed. b. Any arrangements, understandings, or agreements regarding the Licensed Material not stated herein are separate from and independent of the terms and conditions of this Public License. Section 8 -- Interpretation. a. For the avoidance of doubt, this Public License does not, and shall not be interpreted to, reduce, limit, restrict, or impose conditions on any use of the Licensed Material that could lawfully be made without permission under this Public License. b. To the extent possible, if any provision of this Public License is deemed unenforceable, it shall be automatically reformed to the minimum extent necessary to make it enforceable. If the provision cannot be reformed, it shall be severed from this Public License without affecting the enforceability of the remaining terms and conditions. c. No term or condition of this Public License will be waived and no failure to comply consented to unless expressly agreed to by the Licensor. d. Nothing in this Public License constitutes or may be interpreted as a limitation upon, or waiver of, any privileges and immunities that apply to the Licensor or You, including from the legal processes of any jurisdiction or authority. ======================================================================= Creative Commons is not a party to its public licenses. Notwithstanding, Creative Commons may elect to apply one of its public licenses to material it publishes and in those instances will be considered the "Licensor." Except for the limited purpose of indicating that material is shared under a Creative Commons public license or as otherwise permitted by the Creative Commons policies published at creativecommons.org/policies, Creative Commons does not authorize the use of the trademark "Creative Commons" or any other trademark or logo of Creative Commons without its prior written consent including, without limitation, in connection with any unauthorized modifications to any of its public licenses or any other arrangements, understandings, or agreements concerning use of licensed material. For the avoidance of doubt, this paragraph does not form part of the public licenses. Creative Commons may be contacted at creativecommons.org.

--------------------------------------------------------------------------------

----------------------Web Background Synchronization------------------------------

Web Background Synchronization Specification
Portions of spec © by W3C

W3C Community Final Specification Agreement
To secure commitments from participants for the full text of a Community or Business Group Report, the group may call for voluntary commitments to the following terms; a "summary" is
available. See also the related "W3C Community Contributor License Agreement".
1. The Purpose of this Agreement.
This Agreement sets forth the terms under which I make certain copyright and patent rights available to you for your implementation of the Specification.
Any other capitalized terms not specifically defined herein have the same meaning as those terms have in the "W3C Patent Policy", and if not defined there, in the "W3C Process Document".
2. Copyrights.
2.1. Copyright Grant. I grant to you a perpetual (for the duration of the applicable copyright), worldwide, non-exclusive, no-charge, royalty-free, copyright license, without any obligation for accounting to me, to reproduce, prepare derivative works of, publicly display, publicly perform, sublicense, distribute, and implement the Specification to the full extent of my copyright interest in the Specification.
2.2. Attribution. As a condition of the copyright grant, you must include an attribution to the Specification in any derivative work you make based on the Specification. That attribution must include, at minimum, the Specification name and version number.
3. Patents.
3.1. Patent Licensing Commitment. I agree to license my Essential Claims under the W3C Community RF Licensing Requirements. This requirement includes Essential Claims that I own and any that I have the right to license without obligation of payment or other consideration to an unrelated third party. W3C Community RF Licensing Requirements obligations made concerning the Specification and described in this policy are binding on me for the life of the patents in question and encumber the patents containing Essential Claims, regardless of changes in participation status or W3C Membership. I also agree to license my Essential Claims under the W3C Community RF Licensing Requirements in derivative works of the Specification so long as all normative portions of the Specification are maintained and that this licensing commitment does not extend to any portion of the derivative work that was not included in the Specification.
3.2. Optional, Additional Patent Grant. In addition to the provisions of Section 3.1, I may also, at my option, make certain intellectual property rights infringed by implementations of the Specification, including Essential Claims, available by providing those terms via the W3C Web site.
4. No Other Rights. Except as specifically set forth in this Agreement, no other express or implied patent, trademark, copyright, or other property rights are granted under this Agreement, including by implication, waiver, or estoppel.
5. Antitrust Compliance. I acknowledge that I may compete with other participants, that I am under no obligation to implement the Specification, that each participant is free to develop competing technologies and standards, and that each party is free to license its patent rights to third parties, including for the purpose of enabling competing technologies and standards.
6. Non-Circumvention. I agree that I will not intentionally take or willfully assist any third party to take any action for the purpose of circumventing my obligations under this Agreement.
7. Transition to W3C Recommendation Track. The Specification developed by the Project may transition to the W3C Recommendation Track. The W3C Team is responsible for notifying me that a Corresponding Working Group has been chartered. I have no obligation to join the Corresponding Working Group. If the Specification developed by the Project transitions to the W3C Recommendation Track, the following terms apply:
7.1. If I join the Corresponding Working Group. If I join the Corresponding Working Group, I will be subject to all W3C rules, obligations, licensing commitments, and policies that govern that Corresponding Working Group.
7.2. If I Do Not Join the Corresponding Working Group.
7.2.1. Licensing Obligations to Resulting Specification. If I do not join the Corresponding Working Group, I agree to offer patent licenses according to the W3C Royalty-Free licensing requirements described in Section 5 of the W3C Patent Policy for the portions of the Specification included in the resulting Recommendation. This licensing commitment does not extend to any portion of an implementation of the Recommendation that was not included in the Specification. This licensing commitment may not be revoked but may be modified through the exclusion process defined in Section 4 of the W3C Patent Policy. I am not required to join the Corresponding Working Group to exclude patents from the W3C Royalty-Free licensing commitment, but must otherwise follow the normal exclusion procedures defined by the W3C Patent Policy. The W3C Team will notify me of any Call for Exclusion in the Corresponding Working Group as set forth in Section 4.5 of the W3C Patent Policy.
7.2.2. No Disclosure Obligation. If I do not join the Corresponding Working Group, I have no patent disclosure obligations outside of those set forth in Section 6 of the W3C Patent Policy.
8. Conflict of Interest. I will disclose significant relationships when those relationships might reasonably be perceived as creating a conflict of interest with my role. I will notify W3C of any change in my affiliation using W3C-provided mechanisms.
9. Representations, Warranties and Disclaimers. I represent and warrant that I am legally entitled to grant the rights and promises set forth in this Agreement. IN ALL OTHER RESPECTS THE SPECIFICATION IS PROVIDED “AS IS.” The entire risk as to implementing or otherwise using the Specification is assumed by the implementer and user. Except as stated herein, I expressly disclaim any warranties (express, implied, or otherwise), including implied warranties of merchantability, non-infringement, fitness for a particular purpose, or title, related to the Specification. IN NO EVENT WILL ANY PARTY BE LIABLE TO ANY OTHER PARTY FOR LOST PROFITS OR ANY FORM OF INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES OF ANY CHARACTER FROM ANY CAUSES OF ACTION OF ANY KIND WITH RESPECT TO THIS AGREEMENT, WHETHER BASED ON BREACH OF CONTRACT, TORT (INCLUDING NEGLIGENCE), OR OTHERWISE, AND WHETHER OR NOT THE OTHER PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. All of my obligations under Section 3 regarding the transfer, successors in interest, or assignment of Granted Claims will be satisfied if I notify the transferee or assignee of any patent that I know contains Granted Claims of the obligations under Section 3. Nothing in this Agreement requires me to undertake a patent search.
10. Definitions.
10.1. Agreement. “Agreement” means this W3C Community Final Specification Agreement.
10.2. Corresponding Working Group. “Corresponding Working Group” is a W3C Working Group that is chartered to develop a Recommendation, as defined in the W3C Process Document, that takes the Specification as an input.
10.3. Essential Claims. “Essential Claims” shall mean all claims in any patent or patent application in any jurisdiction in the world that would necessarily be infringed by implementation of the Specification. A claim is necessarily infringed hereunder only when it is not possible to avoid infringing it because there is no non-infringing alternative for implementing the normative portions of the Specification. Existence of a non-infringing alternative shall be judged based on the state of the art at the time of the publication of the Specification. The following are expressly excluded from and shall not be deemed to constitute Essential Claims:
10.3.1. any claims other than as set forth above even if contained in the same patent as Essential Claims; and
10.3.2. claims which would be infringed only by:
portions of an implementation that are not specified in the normative portions of the Specification, or
enabling technologies that may be necessary to make or use any product or portion thereof that complies with the Specification and are not themselves expressly set forth in the Specification (e.g., semiconductor manufacturing technology, compiler technology, object-oriented technology, basic operating system technology, and the like); or
the implementation of technology developed elsewhere and merely incorporated by reference in the body of the Specification.
10.3.3. design patents and design registrations.
For purposes of this definition, the normative portions of the Specification shall be deemed to include only architectural and interoperability requirements. Optional features in the RFC 2119 sense are considered normative unless they are specifically identified as informative. Implementation examples or any other material that merely illustrate the requirements of the Specification are informative, rather than normative.
10.4. I, Me, or My. “I,” “me,” or “my” refers to the signatory.
10.5 Project. “Project” means the W3C Community Group or Business Group for which I executed this Agreement.
10.6. Specification. “Specification” means the Specification identified by the Project as the target of this agreement in a call for Final Specification Commitments. W3C shall provide the authoritative mechanisms for the identification of this Specification.
10.7. W3C Community RF Licensing Requirements. “W3C Community RF Licensing Requirements” license shall mean a non-assignable, non-sublicensable license to make, have made, use, sell, have sold, offer to sell, import, and distribute and dispose of implementations of the Specification that:
10.7.1. shall be available to all, worldwide, whether or not they are W3C Members;
10.7.2. shall extend to all Essential Claims owned or controlled by me;
10.7.3. may be limited to implementations of the Specification, and to what is required by the Specification;
10.7.4. may be conditioned on a grant of a reciprocal RF license (as defined in this policy) to all Essential Claims owned or controlled by the licensee. A reciprocal license may be required to be available to all, and a reciprocal license may itself be conditioned on a further reciprocal license from all.
10.7.5. may not be conditioned on payment of royalties, fees or other consideration;
10.7.6. may be suspended with respect to any licensee when licensor issued by licensee for infringement of claims essential to implement the Specification or any W3C Recommendation;
10.7.7. may not impose any further conditions or restrictions on the use of any technology, intellectual property rights, or other restrictions on behavior of the licensee, but may include reasonable, customary terms relating to operation or maintenance of the license relationship such as the following: choice of law and dispute resolution;
10.7.8. shall not be considered accepted by an implementer who manifests an intent not to accept the terms of the W3C Community RF Licensing Requirements license as offered by the licensor.
10.7.9. The RF license conforming to the requirements in this policy shall be made available by the licensor as long as the Specification is in effect. The term of such license shall be for the life of the patents in question.
I am encouraged to provide a contact from which licensing information can be obtained and other relevant licensing information. Any such information will be made publicly available.
10.8. You or Your. “You,” “you,” or “your” means any person or entity who exercises copyright or patent rights granted under this Agreement, and any person that person or entity controls.

-------------------------------------------------------------------------------------

------------------- WebGL -----------------------------
Copyright (c) 2018 The Khronos Group Inc.

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and/or associated documentation files (the
"Materials"), to deal in the Materials without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Materials, and to
permit persons to whom the Materials are furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Materials.

THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
------------------------------------------------------

------------- End of ThirdPartyNotices ------------------------------------------- */
```

### text-1bc2aa7dad15097cd71308d9ae013ff14d11a84357b170c1554f4035fb8a3acb

SHA-256 `1bc2aa7dad15097cd71308d9ae013ff14d11a84357b170c1554f4035fb8a3acb` · 1083 original bytes.

Sources:

- `node_modules/react-native-svg/LICENSE`

```text
The MIT License (MIT)

Copyright (c) [2015-2016] [Horcrux]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-1c0d7e365e7c3dcfc1c30b6913d8a61a2741a4702b7ae727093c5610b47dbfa0

SHA-256 `1c0d7e365e7c3dcfc1c30b6913d8a61a2741a4702b7ae727093c5610b47dbfa0` · 1084 original bytes.

Sources:

- `node_modules/@expo/sudo-prompt/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2015 Joran Dirk Greef

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-1e187eec147d04bcbb3b7aef9f3b0ea82228961fa7d390d3efb9e57751dbe0cb

SHA-256 `1e187eec147d04bcbb3b7aef9f3b0ea82228961fa7d390d3efb9e57751dbe0cb` · 1109 original bytes.

Sources:

- `node_modules/react-fast-compare/LICENSE`

```text
MIT License

Copyright (c) 2018 Formidable Labs
Copyright (c) 2017 Evgeny Poberezkin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-1fa6ee8bb95a81ae3d73a5bd074a3ac380ffec13697051063ca1a601921b91db

SHA-256 `1fa6ee8bb95a81ae3d73a5bd074a3ac380ffec13697051063ca1a601921b91db` · 1078 original bytes.

Sources:

- `node_modules/convert-source-map/LICENSE`

```text
Copyright 2013 Thorsten Lorenz.
All rights reserved.

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
```

### text-2034cce3b6fafcddd642c4175e01d3ddfc332a53b9f20fdc46b1466dc89ac469

SHA-256 `2034cce3b6fafcddd642c4175e01d3ddfc332a53b9f20fdc46b1466dc89ac469` · 731 original bytes.

Sources:

- `node_modules/y18n/LICENSE`

```text
Copyright (c) 2015, Contributors

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
```

### text-210b19e543130388c68654b7497e967119ce17145f66ab7d85688fbd70f08751

SHA-256 `210b19e543130388c68654b7497e967119ce17145f66ab7d85688fbd70f08751` · 655 original bytes.

Sources:

- `node_modules/tslib/LICENSE.txt`

```text
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```

### text-21c2679a63d7699c0e644409e2f17d0adbc7a965003feb06b3ff4b833d21f722

SHA-256 `21c2679a63d7699c0e644409e2f17d0adbc7a965003feb06b3ff4b833d21f722` · 1118 original bytes.

Sources:

- `node_modules/browserslist/LICENSE`

```text
The MIT License (MIT)

Copyright 2014 Andrey Sitnik <andrey@sitnik.es> and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-21edea5565f8e8d4a0e548fe741b16f7d642afd8dadafa9dbab4232115abe0ec

SHA-256 `21edea5565f8e8d4a0e548fe741b16f7d642afd8dadafa9dbab4232115abe0ec` · 1099 original bytes.

Sources:

- `node_modules/regjsgen/LICENSE-MIT.txt`

```text
The MIT License (MIT)

Copyright 2014-2020 Benjamin Tan <https://ofcr.se/>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-2213d91c606205c71eb051a199478cdc2adde945893404d7f1421436dd6d5cc1

SHA-256 `2213d91c606205c71eb051a199478cdc2adde945893404d7f1421436dd6d5cc1` · 1103 original bytes.

Sources:

- `node_modules/js-tokens/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2014, 2015, 2016, 2017, 2018 Simon Lydell

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-22a28f29cff8f5ecf9f463301d9c03b8245a2952ebae0bcab633fd654c0792fb

SHA-256 `22a28f29cff8f5ecf9f463301d9c03b8245a2952ebae0bcab633fd654c0792fb` · 1080 original bytes.

Sources:

- `node_modules/@expo/ui/src/community/segmented-control/vendor/LICENSE`
- `node_modules/@react-native-masked-view/masked-view/LICENSE`

```text
MIT License

Copyright (c) 2015-present, Facebook, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-22c68811e174cbbfb3813d4135918df4f540959c14d872e601d9abe83d3cde8f

SHA-256 `22c68811e174cbbfb3813d4135918df4f540959c14d872e601d9abe83d3cde8f` · 1076 original bytes.

Sources:

- `node_modules/tinyglobby/LICENSE`

```text
MIT License

Copyright (c) 2024 Madeline Gurriarán

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-23d466b1b134b415b66fa50c6526b4cf3e7b9258554da88d3abb371721e7ce68

SHA-256 `23d466b1b134b415b66fa50c6526b4cf3e7b9258554da88d3abb371721e7ce68` · 1172 original bytes.

Sources:

- `node_modules/compression/LICENSE`

```text
(The MIT License)

Copyright (c) 2014 Jonathan Ong <me@jongleberry.com>
Copyright (c) 2014-2015 Douglas Christopher Wilson <doug@somethingdoug.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-24973d5320410e565ec92f18f73f12af7d97c634d414ba170d119fe3f98904c8

SHA-256 `24973d5320410e565ec92f18f73f12af7d97c634d414ba170d119fe3f98904c8` · 1119 original bytes.

Sources:

- `node_modules/finalhandler/LICENSE`

```text
(The MIT License)

Copyright (c) 2014-2017 Douglas Christopher Wilson <doug@somethingdoug.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-24a4cce7958e3905080069a18952f1f35796fcd861b4c5686047f0a33faa21ed

SHA-256 `24a4cce7958e3905080069a18952f1f35796fcd861b4c5686047f0a33faa21ed` · 1068 original bytes.

Sources:

- `node_modules/get-package-type/LICENSE`

```text
MIT License

Copyright (c) 2020 CFWare, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-255aa557a1f55224ce522f311629c0bf20854740a67955cefd798fbd1d3d1ded

SHA-256 `255aa557a1f55224ce522f311629c0bf20854740a67955cefd798fbd1d3d1ded` · 1157 original bytes.

Sources:

- `node_modules/escape-html/LICENSE`

```text
(The MIT License)

Copyright (c) 2012-2013 TJ Holowaychuk
Copyright (c) 2015 Andreas Lubbe
Copyright (c) 2015 Tiancheng "Timothy" Gu

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-257aed98914108e91a337912727b6a802eef218248507f74b76faffaff517a38

SHA-256 `257aed98914108e91a337912727b6a802eef218248507f74b76faffaff517a38` · 1089 original bytes.

Sources:

- `node_modules/content-type/LICENSE`

```text
(The MIT License)

Copyright (c) 2015 Douglas Christopher Wilson

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-25a328069fe771f8ed5b6f983ed4b0e6c84b3312ac0f69b28c3d52dc277962c9

SHA-256 `25a328069fe771f8ed5b6f983ed4b0e6c84b3312ac0f69b28c3d52dc277962c9` · 1128 original bytes.

Sources:

- `node_modules/send/LICENSE`

```text
(The MIT License)

Copyright (c) 2012 TJ Holowaychuk
Copyright (c) 2014-2022 Douglas Christopher Wilson

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-25ba5c59dad3e0dd8f9540beaa0f0a86a10e3aec35af5fdc8e88c5f6a5c0d8c6

SHA-256 `25ba5c59dad3e0dd8f9540beaa0f0a86a10e3aec35af5fdc8e88c5f6a5c0d8c6` · 728 original bytes.

Sources:

- `node_modules/electron-to-chromium/LICENSE`

```text
Copyright 2018 Kilian Valkhof

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-25bd22427e27b0d3f1c3da2670bb44b622bcced22ebdf4777d5488ac129370a1

SHA-256 `25bd22427e27b0d3f1c3da2670bb44b622bcced22ebdf4777d5488ac129370a1` · 1091 original bytes.

Sources:

- `node_modules/ci-info/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2016-2018 Thomas Watson Steen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-27d06bbb2eb031be8aa376868a2e1f11b6acba938d4cc8e1234b66b9739c54a3

SHA-256 `27d06bbb2eb031be8aa376868a2e1f11b6acba938d4cc8e1234b66b9739c54a3` · 1089 original bytes.

Sources:

- `node_modules/html-escaper/LICENSE.txt`

```text
Copyright (C) 2017-present by Andrea Giammarchi - @WebReflection

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-29de249ac0cee0d56924ff07bdabc8f708ad58432c7a357f6065000c49b12e11

SHA-256 `29de249ac0cee0d56924ff07bdabc8f708ad58432c7a357f6065000c49b12e11` · 1071 original bytes.

Sources:

- `node_modules/use-latest-callback/LICENSE`

```text
MIT License

Copyright (c) 2023 Satyajit Sahoo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-29f4d474804f60aae177d7fed67d0d613d00006640cc9cf80077eef03fb9a2cc

SHA-256 `29f4d474804f60aae177d7fed67d0d613d00006640cc9cf80077eef03fb9a2cc` · 1104 original bytes.

Sources:

- `node_modules/co/LICENSE`

```text
(The MIT License)

Copyright (c) 2014 TJ Holowaychuk &lt;tj@vision-media.ca&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-2b29dcfe0d6471f7e8c92c5fb38c9f93edee10330937055440192f1832b1ecef

SHA-256 `2b29dcfe0d6471f7e8c92c5fb38c9f93edee10330937055440192f1832b1ecef` · 1183 original bytes.

Sources:

- `node_modules/expo/node_modules/ws/LICENSE`

```text
Copyright (c) 2011 Einar Otto Stangvik <einaros@gmail.com>
Copyright (c) 2013 Arnout Kazemier and contributors
Copyright (c) 2016 Luigi Pinca and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-2c7c5d22ed5a8ee968c64757710979afcd77438c48b4a265b94e615babd8a901

SHA-256 `2c7c5d22ed5a8ee968c64757710979afcd77438c48b4a265b94e615babd8a901` · 1550 original bytes.

Sources:

- `node_modules/minimatch/LICENSE.md`

```text
# Blue Oak Model License

Version 1.0.0

## Purpose

This license gives everyone as much permission to work with
this software as possible, while protecting contributors
from liability.

## Acceptance

In order to receive this license, you must agree to its
rules. The rules of this license are both obligations
under that agreement and conditions to your license.
You must not do anything with this software that triggers
a rule that you cannot or will not follow.

## Copyright

Each contributor licenses you to do everything with this
software that would otherwise infringe that contributor's
copyright in it.

## Notices

You must ensure that everyone who gets a copy of
any part of this software from you, with or without
changes, also gets the text of this license or a link to
<https://blueoakcouncil.org/license/1.0.0>.

## Excuse

If anyone notifies you in writing that you have not
complied with [Notices](#notices), you can keep your
license by taking all practical steps to comply within 30
days after the notice. If you do not do so, your license
ends immediately.

## Patent

Each contributor licenses you to do everything with this
software that would otherwise infringe any patent claims
they can license or become able to license.

## Reliability

No contributor can revoke this license.

## No Liability

**_As far as the law allows, this software comes as is,
without any warranty or condition, and no contributor
will be liable to anyone for any damages related to this
software or this license, under any kind of legal claim._**
```

### text-2cee71bf4612fc2efe1c6261e3f2b21f3c7259ef8a4f3593b095ae7a7bd65ad9

SHA-256 `2cee71bf4612fc2efe1c6261e3f2b21f3c7259ef8a4f3593b095ae7a7bd65ad9` · 1119 original bytes.

Sources:

- `node_modules/merge-stream/LICENSE`

```text
The MIT License (MIT)

Copyright (c) Stephen Sugden <me@stephensugden.com> (stephensugden.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-2d4c3d00d67067461412a2d9a2f3f8b7b9cda62b3db501e4b6844ccf35c949aa

SHA-256 `2d4c3d00d67067461412a2d9a2f3f8b7b9cda62b3db501e4b6844ccf35c949aa` · 1092 original bytes.

Sources:

- `node_modules/bser/LICENSE`
- `node_modules/fb-watchman/LICENSE`

```text
MIT License

Copyright (c) Meta Platforms, Inc. and its affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-2d65cdba6e67bd7fa9c59070eb3ef5b65490cf1644560eb30c931a1d364009c2

SHA-256 `2d65cdba6e67bd7fa9c59070eb3ef5b65490cf1644560eb30c931a1d364009c2` · 1300 original bytes.

Sources:

- `node_modules/regjsparser/LICENSE.BSD`

```text
Copyright (c) Julian Viereck and Contributors, All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### text-2dc0465729366c3a7890dfa9e972a1ba7048a26c02116fb8b419a6a1ac110149

SHA-256 `2dc0465729366c3a7890dfa9e972a1ba7048a26c02116fb8b419a6a1ac110149` · 731 original bytes.

Sources:

- `node_modules/cliui/LICENSE.txt`

```text
Copyright (c) 2015, Contributors

Permission to use, copy, modify, and/or distribute this software
for any purpose with or without fee is hereby granted, provided
that the above copyright notice and this permission notice
appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE
LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-2e97627cb278aa7556fb9e8817368302301a595b6c7582512b8d74c57b773652

SHA-256 `2e97627cb278aa7556fb9e8817368302301a595b6c7582512b8d74c57b773652` · 1086 original bytes.

Sources:

- `node_modules/@babel/parser/LICENSE`

```text
Copyright (C) 2012-2014 by various contributors (see AUTHORS)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-2f1a503bfab84b3ba7393627308b3274501e459e3b5185bbb56bbf16cb1602d4

SHA-256 `2f1a503bfab84b3ba7393627308b3274501e459e3b5185bbb56bbf16cb1602d4` · 1146 original bytes.

Sources:

- `node_modules/yargs/LICENSE`

```text
MIT License

Copyright 2010 James Halliday (mail@substack.net); Modified work Copyright 2014 Contributors (ben@npmjs.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-306fa513e39b23a6e8747520de761809d206b99800ef41907b530226574c59ae

SHA-256 `306fa513e39b23a6e8747520de761809d206b99800ef41907b530226574c59ae` · 1114 original bytes.

Sources:

- `node_modules/kleur/license`
- `node_modules/resolve.exports/license`

```text
The MIT License (MIT)

Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-30f0cfddf483d1128e3610205020f2041a6c5e837aa999e0aa82e5576187d4a9

SHA-256 `30f0cfddf483d1128e3610205020f2041a6c5e837aa999e0aa82e5576187d4a9` · 1071 original bytes.

Sources:

- `node_modules/aria-hidden/LICENSE`
- `node_modules/react-remove-scroll/LICENSE`
- `node_modules/react-style-singleton/LICENSE`
- `node_modules/use-callback-ref/LICENSE`
- `node_modules/use-sidecar/LICENSE`

```text
MIT License

Copyright (c) 2017 Anton Korzunov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-32fb6556bc84c192f493cbb1503b99f6ee893227a9473290e88699fde9807fd3

SHA-256 `32fb6556bc84c192f493cbb1503b99f6ee893227a9473290e88699fde9807fd3` · 1203 original bytes.

Sources:

- `node_modules/@sinclair/typebox/license`

```text
TypeBox: JSON Schema Type Builder with Static Type Resolution for TypeScript

The MIT License (MIT)

Copyright (c) 2017-2023 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-34239137535c0fee5a5b590310300f988fff92bbba6719889454eda410f536e3

SHA-256 `34239137535c0fee5a5b590310300f988fff92bbba6719889454eda410f536e3` · 1092 original bytes.

Sources:

- `node_modules/char-regex/LICENSE`

```text
MIT License

Copyright (c) 2019 Richie Bendall

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-35bdd8a44339719441900fb50fbefc5e2dca1ca662cbaed7a687de842c8b70f2

SHA-256 `35bdd8a44339719441900fb50fbefc5e2dca1ca662cbaed7a687de842c8b70f2` · 1091 original bytes.

Sources:

- `node_modules/braces/LICENSE`
- `node_modules/fill-range/LICENSE`
- `node_modules/is-number/LICENSE`
- `node_modules/micromatch/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2014-present, Jon Schlinkert.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-365496ca1f56da40b23c9815fc40fa9005847b2f8f8fd1c1a4929ef25ec8cd1d

SHA-256 `365496ca1f56da40b23c9815fc40fa9005847b2f8f8fd1c1a4929ef25ec8cd1d` · 731 original bytes.

Sources:

- `node_modules/test-exclude/LICENSE.txt`
- `node_modules/yargs-parser/LICENSE.txt`

```text
Copyright (c) 2016, Contributors

Permission to use, copy, modify, and/or distribute this software
for any purpose with or without fee is hereby granted, provided
that the above copyright notice and this permission notice
appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE
LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-3677dc86e6e5f119b500c308cc24cf533e2eb44c41050ea64584e049e5b70161

SHA-256 `3677dc86e6e5f119b500c308cc24cf533e2eb44c41050ea64584e049e5b70161` · 1107 original bytes.

Sources:

- `node_modules/plist/LICENSE`

```text
(The MIT License)

Copyright (c) 2010-2017 Nathan Rajlich <nathan@tootallnate.net>

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
```

### text-36ffd9dc085d529a7e60e1276d73ae5a030b020313e6c5408593a6ae2af39673

SHA-256 `36ffd9dc085d529a7e60e1276d73ae5a030b020313e6c5408593a6ae2af39673` · 6555 original bytes.

Sources:

- `node_modules/mdn-data/LICENSE`

```text
CC0 1.0 Universal

Statement of Purpose

The laws of most jurisdictions throughout the world automatically confer
exclusive Copyright and Related Rights (defined below) upon the creator and
subsequent owner(s) (each and all, an "owner") of an original work of
authorship and/or a database (each, a "Work").

Certain owners wish to permanently relinquish those rights to a Work for the
purpose of contributing to a commons of creative, cultural and scientific
works ("Commons") that the public can reliably and without fear of later
claims of infringement build upon, modify, incorporate in other works, reuse
and redistribute as freely as possible in any form whatsoever and for any
purposes, including without limitation commercial purposes. These owners may
contribute to the Commons to promote the ideal of a free culture and the
further production of creative, cultural and scientific works, or to gain
reputation or greater distribution for their Work in part through the use and
efforts of others.

For these and/or other purposes and motivations, and without any expectation
of additional consideration or compensation, the person associating CC0 with a
Work (the "Affirmer"), to the extent that he or she is an owner of Copyright
and Related Rights in the Work, voluntarily elects to apply CC0 to the Work
and publicly distribute the Work under its terms, with knowledge of his or her
Copyright and Related Rights in the Work and the meaning and intended legal
effect of CC0 on those rights.

1. Copyright and Related Rights. A Work made available under CC0 may be
protected by copyright and related or neighboring rights ("Copyright and
Related Rights"). Copyright and Related Rights include, but are not limited
to, the following:

  i. the right to reproduce, adapt, distribute, perform, display, communicate,
  and translate a Work;

  ii. moral rights retained by the original author(s) and/or performer(s);

  iii. publicity and privacy rights pertaining to a person's image or likeness
  depicted in a Work;

  iv. rights protecting against unfair competition in regards to a Work,
  subject to the limitations in paragraph 4(a), below;

  v. rights protecting the extraction, dissemination, use and reuse of data in
  a Work;

  vi. database rights (such as those arising under Directive 96/9/EC of the
  European Parliament and of the Council of 11 March 1996 on the legal
  protection of databases, and under any national implementation thereof,
  including any amended or successor version of such directive); and

  vii. other similar, equivalent or corresponding rights throughout the world
  based on applicable law or treaty, and any national implementations thereof.

2. Waiver. To the greatest extent permitted by, but not in contravention of,
applicable law, Affirmer hereby overtly, fully, permanently, irrevocably and
unconditionally waives, abandons, and surrenders all of Affirmer's Copyright
and Related Rights and associated claims and causes of action, whether now
known or unknown (including existing as well as future claims and causes of
action), in the Work (i) in all territories worldwide, (ii) for the maximum
duration provided by applicable law or treaty (including future time
extensions), (iii) in any current or future medium and for any number of
copies, and (iv) for any purpose whatsoever, including without limitation
commercial, advertising or promotional purposes (the "Waiver"). Affirmer makes
the Waiver for the benefit of each member of the public at large and to the
detriment of Affirmer's heirs and successors, fully intending that such Waiver
shall not be subject to revocation, rescission, cancellation, termination, or
any other legal or equitable action to disrupt the quiet enjoyment of the Work
by the public as contemplated by Affirmer's express Statement of Purpose.

3. Public License Fallback. Should any part of the Waiver for any reason be
judged legally invalid or ineffective under applicable law, then the Waiver
shall be preserved to the maximum extent permitted taking into account
Affirmer's express Statement of Purpose. In addition, to the extent the Waiver
is so judged Affirmer hereby grants to each affected person a royalty-free,
non transferable, non sublicensable, non exclusive, irrevocable and
unconditional license to exercise Affirmer's Copyright and Related Rights in
the Work (i) in all territories worldwide, (ii) for the maximum duration
provided by applicable law or treaty (including future time extensions), (iii)
in any current or future medium and for any number of copies, and (iv) for any
purpose whatsoever, including without limitation commercial, advertising or
promotional purposes (the "License"). The License shall be deemed effective as
of the date CC0 was applied by Affirmer to the Work. Should any part of the
License for any reason be judged legally invalid or ineffective under
applicable law, such partial invalidity or ineffectiveness shall not
invalidate the remainder of the License, and in such case Affirmer hereby
affirms that he or she will not (i) exercise any of his or her remaining
Copyright and Related Rights in the Work or (ii) assert any associated claims
and causes of action with respect to the Work, in either case contrary to
Affirmer's express Statement of Purpose.

4. Limitations and Disclaimers.

  a. No trademark or patent rights held by Affirmer are waived, abandoned,
  surrendered, licensed or otherwise affected by this document.

  b. Affirmer offers the Work as-is and makes no representations or warranties
  of any kind concerning the Work, express, implied, statutory or otherwise,
  including without limitation warranties of title, merchantability, fitness
  for a particular purpose, non infringement, or the absence of latent or
  other defects, accuracy, or the present or absence of errors, whether or not
  discoverable, all to the greatest extent permissible under applicable law.

  c. Affirmer disclaims responsibility for clearing rights of other persons
  that may apply to the Work or any use thereof, including without limitation
  any person's Copyright and Related Rights in the Work. Further, Affirmer
  disclaims responsibility for obtaining any necessary consents, permissions
  or other rights required for any use of the Work.

  d. Affirmer understands and acknowledges that Creative Commons is not a
  party to this document and has no duty or obligation with respect to this
  CC0 or use of the Work.

For more information, please see
<http://creativecommons.org/publicdomain/zero/1.0/>
```

### text-3706296ed611888111ceccc1dff4712844dea4bde0b185c82d718c3b69895abe

SHA-256 `3706296ed611888111ceccc1dff4712844dea4bde0b185c82d718c3b69895abe` · 1107 original bytes.

Sources:

- `node_modules/node-releases/LICENSE`

```text
The MIT License

Copyright (c) 2017 Sergey Rubanov (https://github.com/chicoxyzzy)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-396eefd21683c5f4de3640e7627638d07be75126f896d3ee0cf924cbff64e0a2

SHA-256 `396eefd21683c5f4de3640e7627638d07be75126f896d3ee0cf924cbff64e0a2` · 1084 original bytes.

Sources:

- `node_modules/await-lock/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2015-present James Ide

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-3a61c6c96caf5c1d9b623fb9b04c822b783dfcb78aa7e49c76a3f643e6ed7f95

SHA-256 `3a61c6c96caf5c1d9b623fb9b04c822b783dfcb78aa7e49c76a3f643e6ed7f95` · 1139 original bytes.

Sources:

- `node_modules/debug/LICENSE`

```text
(The MIT License)

Copyright (c) 2014-2017 TJ Holowaychuk <tj@vision-media.ca>
Copyright (c) 2018-2021 Josh Junon

Permission is hereby granted, free of charge, to any person obtaining a copy of this software
and associated documentation files (the 'Software'), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-3a7d3bb198e909ed642bd68bd29a7d7c09a636d27a51ec663d35f00c4760ec42

SHA-256 `3a7d3bb198e909ed642bd68bd29a7d7c09a636d27a51ec663d35f00c4760ec42` · 1079 original bytes.

Sources:

- `node_modules/jest-runner/node_modules/source-map-support/LICENSE.md`
- `node_modules/source-map-support/LICENSE.md`

```text
The MIT License (MIT)

Copyright (c) 2014 Evan Wallace

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-3de284c8e6fa7e8437eff6f53695471e0332129a5b42a79361e17b7637de94b3

SHA-256 `3de284c8e6fa7e8437eff6f53695471e0332129a5b42a79361e17b7637de94b3` · 1106 original bytes.

Sources:

- `node_modules/ws/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2011 Einar Otto Stangvik <einaros@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-3f1189b28e3866e0d979968d466b78f813f76827cfdca1fbb124cc0a5c8841f8

SHA-256 `3f1189b28e3866e0d979968d466b78f813f76827cfdca1fbb124cc0a5c8841f8` · 1072 original bytes.

Sources:

- `node_modules/expo/node_modules/zod/LICENSE`
- `node_modules/zod/LICENSE`

```text
MIT License

Copyright (c) 2025 Colin McDonnell

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-3f4609137f65070541b9214300ea0d640af8192857de0eeb2b03403003d9228a

SHA-256 `3f4609137f65070541b9214300ea0d640af8192857de0eeb2b03403003d9228a` · 1080 original bytes.

Sources:

- `node_modules/path-parse/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2015 Javier Blanco

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-3fb0857ef0133928cf72c88dfc464e931486e88778961eedec25585e2321507f

SHA-256 `3fb0857ef0133928cf72c88dfc464e931486e88778961eedec25585e2321507f` · 1070 original bytes.

Sources:

- `node_modules/clone/LICENSE`

```text
Copyright © 2011-2015 Paul Vorbach <paul@vorba.ch>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the “Software”), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-41f2eef190265a6ea435951170947e35461707f91631821b3a67421bea5b2a7c

SHA-256 `41f2eef190265a6ea435951170947e35461707f91631821b3a67421bea5b2a7c` · 1106 original bytes.

Sources:

- `node_modules/@expo/code-signing-certificates/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2020-present 650 Industries, Inc. (aka Expo)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-41f321b33afaa5cdaeb7c1aecd6fd5c21467ff910fb677aa47c941d05b5032c0

SHA-256 `41f321b33afaa5cdaeb7c1aecd6fd5c21467ff910fb677aa47c941d05b5032c0` · 1079 original bytes.

Sources:

- `node_modules/react-native-drawer-layout/LICENSE`

```text
MIT License

Copyright (c) 2017 React Native Community

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-43571857d624621d9c1f5933339bdb3a31832919bed8143494acf1ae2fa46dc5

SHA-256 `43571857d624621d9c1f5933339bdb3a31832919bed8143494acf1ae2fa46dc5` · 1103 original bytes.

Sources:

- `node_modules/@babel/helper-define-polyfill-provider/LICENSE`
- `node_modules/babel-plugin-polyfill-corejs2/LICENSE`
- `node_modules/babel-plugin-polyfill-corejs3/LICENSE`
- `node_modules/babel-plugin-polyfill-regenerator/LICENSE`

```text
MIT License

Copyright (c) 2014-present Nicolò Ribaudo and other contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-435a6722c786b0a56fbe7387028f1d9d3f3a2d0fb615bb8fee118727c3f59b7b

SHA-256 `435a6722c786b0a56fbe7387028f1d9d3f3a2d0fb615bb8fee118727c3f59b7b` · 1073 original bytes.

Sources:

- `node_modules/concat-map/LICENSE`

```text
This software is released under the MIT license:

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-451ec07eeb9c4e1b86de9abdaa426462a8be48f887ec7421cf0bbb9c769555ab

SHA-256 `451ec07eeb9c4e1b86de9abdaa426462a8be48f887ec7421cf0bbb9c769555ab` · 775 original bytes.

Sources:

- `node_modules/hosted-git-info/node_modules/lru-cache/LICENSE`

```text
The ISC License

Copyright (c) 2010-2023 Isaac Z. Schlueter and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-456fe85ad3e71db9523313cf7437b0f90c392d8a48c869908e46716b26d2cf53

SHA-256 `456fe85ad3e71db9523313cf7437b0f90c392d8a48c869908e46716b26d2cf53` · 1080 original bytes.

Sources:

- `node_modules/lines-and-columns/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2015 Brian Donovan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-479b48ab7acdf844b2f44d6a3ce806f932ad009d84d2c71651355b372a2ad0ad

SHA-256 `479b48ab7acdf844b2f44d6a3ce806f932ad009d84d2c71651355b372a2ad0ad` · 1114 original bytes.

Sources:

- `node_modules/dnssd-advertise/LICENSE.md`
- `node_modules/multitars/LICENSE.md`
- `node_modules/toqr/LICENSE.md`

```text
MIT License

Copyright (c) Phil Pluckthun,
Copyright (c) 650 Industries, Inc. (aka Expo),

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-483acb265f182907d1caf6cff9c16c96f31325ed23792832cc5d8b12d5f88c8a

SHA-256 `483acb265f182907d1caf6cff9c16c96f31325ed23792832cc5d8b12d5f88c8a` · 1077 original bytes.

Sources:

- `node_modules/emoji-regex/LICENSE-MIT.txt`
- `node_modules/jsesc/LICENSE-MIT.txt`
- `node_modules/regenerate-unicode-properties/LICENSE-MIT.txt`
- `node_modules/regenerate/LICENSE-MIT.txt`
- `node_modules/regexpu-core/LICENSE-MIT.txt`
- `node_modules/unicode-canonical-property-names-ecmascript/LICENSE-MIT.txt`
- `node_modules/unicode-match-property-ecmascript/LICENSE-MIT.txt`
- `node_modules/unicode-match-property-value-ecmascript/LICENSE-MIT.txt`
- `node_modules/unicode-property-aliases-ecmascript/LICENSE-MIT.txt`

```text
Copyright Mathias Bynens <https://mathiasbynens.be/>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0

SHA-256 `48da2f39e100d4085767e94966b43f4fa95ff6a0698fba57ed460914e35f94a0` · 1109 original bytes.

Sources:

- `node_modules/@istanbuljs/load-nyc-config/node_modules/camelcase/license`
- `node_modules/@testing-library/react-native/node_modules/ansi-styles/license`
- `node_modules/ansi-regex/license`
- `node_modules/ansi-styles/license`
- `node_modules/callsites/license`
- `node_modules/chalk/license`
- `node_modules/detect-newline/license`
- `node_modules/execa/node_modules/mimic-fn/license`
- `node_modules/find-up/license`
- `node_modules/has-flag/license`
- `node_modules/indent-string/license`
- `node_modules/is-fullwidth-code-point/license`
- `node_modules/is-generator-fn/license`
- `node_modules/is-wsl/license`
- `node_modules/jest-diff/node_modules/ansi-styles/license`
- `node_modules/jest-matcher-utils/node_modules/ansi-styles/license`
- `node_modules/leven/license`
- `node_modules/locate-path/license`
- `node_modules/log-symbols/license`
- `node_modules/log-symbols/node_modules/ansi-styles/license`
- `node_modules/log-symbols/node_modules/chalk/license`
- `node_modules/log-symbols/node_modules/has-flag/license`
- `node_modules/log-symbols/node_modules/supports-color/license`
- `node_modules/mimic-fn/license`
- `node_modules/npm-run-path/license`
- `node_modules/ora/license`
- `node_modules/ora/node_modules/ansi-regex/license`
- `node_modules/ora/node_modules/ansi-styles/license`
- `node_modules/ora/node_modules/chalk/license`
- `node_modules/ora/node_modules/has-flag/license`
- `node_modules/ora/node_modules/strip-ansi/license`
- `node_modules/ora/node_modules/supports-color/license`
- `node_modules/p-locate/license`
- `node_modules/p-locate/node_modules/p-limit/license`
- `node_modules/p-try/license`
- `node_modules/path-exists/license`
- `node_modules/path-key/license`
- `node_modules/pkg-dir/license`
- `node_modules/pretty-format/node_modules/ansi-styles/license`
- `node_modules/redent/license`
- `node_modules/resolve-cwd/license`
- `node_modules/resolve-from/license`
- `node_modules/shebang-regex/license`
- `node_modules/slash/license`
- `node_modules/split-on-first/license`
- `node_modules/stack-utils/node_modules/escape-string-regexp/license`
- `node_modules/string-width/license`
- `node_modules/strip-ansi/license`
- `node_modules/strip-bom/license`
- `node_modules/strip-final-newline/license`
- `node_modules/strip-indent/license`
- `node_modules/supports-color/license`
- `node_modules/terminal-link/license`
- `node_modules/type-fest/license`

```text
MIT License

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-49c5f9c7097c9a940ff663a54c27a4c60e379df6cc2b3052df0d37a09a85df93

SHA-256 `49c5f9c7097c9a940ff663a54c27a4c60e379df6cc2b3052df0d37a09a85df93` · 1106 original bytes.

Sources:

- `node_modules/@expo/require-utils/LICENSE`
- `node_modules/@expo/schema-utils/LICENSE`
- `node_modules/@expo/sdk-runtime-versions/LICENSE`
- `node_modules/expo/node_modules/@expo/ws-tunnel/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2025-present 650 Industries, Inc. (aka Expo)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-4be9d87b56a306293223b490c0d0b245e9e94f39884147bf051a6c7b825aeb30

SHA-256 `4be9d87b56a306293223b490c0d0b245e9e94f39884147bf051a6c7b825aeb30` · 1189 original bytes.

Sources:

- `node_modules/@babel/helpers/LICENSE`

```text
MIT License

Copyright (c) 2014-present Sebastian McKenzie and other contributors
Copyright (c) 2014-present, Facebook, Inc. (ONLY ./src/helpers/regenerator* files)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-4c0844caafd3db9a4b643ea493558873710f4e9c8b257887ba066e5e80557848

SHA-256 `4c0844caafd3db9a4b643ea493558873710f4e9c8b257887ba066e5e80557848` · 1059 original bytes.

Sources:

- `node_modules/color/LICENSE`

```text
Copyright (c) 2012 Heather Arthur

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-4da724fc305d81606b245b324d4d2586916b9d248b23d82183df753ace0fdf71

SHA-256 `4da724fc305d81606b245b324d4d2586916b9d248b23d82183df753ace0fdf71` · 1298 original bytes.

Sources:

- `node_modules/@xmldom/xmldom/LICENSE`
- `node_modules/plist/node_modules/@xmldom/xmldom/LICENSE`

```text
Copyright 2019 - present Christopher J. Brody and other contributors, as listed in: https://github.com/xmldom/xmldom/graphs/contributors
Copyright 2012 - 2017 @jindw <jindw@xidea.org> and other contributors, as listed in: https://github.com/jindw/xmldom/graphs/contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-4df78f3bcde252efdbef67e5a3ef02877be68a4b4ff7ee0c78e4d89a0a7f1f00

SHA-256 `4df78f3bcde252efdbef67e5a3ef02877be68a4b4ff7ee0c78e4d89a0a7f1f00` · 1508 original bytes.

Sources:

- `node_modules/@sinonjs/commons/LICENSE`

```text
BSD 3-Clause License

Copyright (c) 2018, Sinon.JS
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the copyright holder nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### text-4eb7543b08d955a6d23fcc224601d43ff566e775be918805e26210d7f6eb4893

SHA-256 `4eb7543b08d955a6d23fcc224601d43ff566e775be918805e26210d7f6eb4893` · 1100 original bytes.

Sources:

- `node_modules/loose-envify/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2015 Andres Suarez <zertosh@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b

SHA-256 `4ec3d4c66cd87f5c8d8ad911b10f99bf27cb00cdfcff82621956e379186b016b` · 765 original bytes.

Sources:

- `node_modules/@babel/core/node_modules/semver/LICENSE`
- `node_modules/@babel/helper-compilation-targets/node_modules/semver/LICENSE`
- `node_modules/@babel/helper-create-class-features-plugin/node_modules/semver/LICENSE`
- `node_modules/@babel/helper-create-regexp-features-plugin/node_modules/semver/LICENSE`
- `node_modules/@babel/plugin-transform-runtime/node_modules/semver/LICENSE`
- `node_modules/@jest/reporters/node_modules/minimatch/LICENSE`
- `node_modules/babel-plugin-polyfill-corejs2/node_modules/semver/LICENSE`
- `node_modules/isexe/LICENSE`
- `node_modules/istanbul-lib-instrument/node_modules/semver/LICENSE`
- `node_modules/jest-config/node_modules/minimatch/LICENSE`
- `node_modules/jest-runtime/node_modules/minimatch/LICENSE`
- `node_modules/lru-cache/LICENSE`
- `node_modules/once/LICENSE`
- `node_modules/semver/LICENSE`
- `node_modules/test-exclude/node_modules/minimatch/LICENSE`
- `node_modules/which/LICENSE`
- `node_modules/wrappy/LICENSE`
- `node_modules/yallist/LICENSE`

```text
The ISC License

Copyright (c) Isaac Z. Schlueter and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-4efb635cc4fd67f738ce2af65f8b73514ee338d0d201b836ab3a823cfda771d1

SHA-256 `4efb635cc4fd67f738ce2af65f8b73514ee338d0d201b836ab3a823cfda771d1` · 1076 original bytes.

Sources:

- `node_modules/react-native-is-edge-to-edge/LICENSE`

```text
MIT License

Copyright (c) 2024 Mathieu Acthernoene

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-50627796eb4236cd05674e71d090e594447995225b7d94cd59e57c25fa3a0217

SHA-256 `50627796eb4236cd05674e71d090e594447995225b7d94cd59e57c25fa3a0217` · 1209 original bytes.

Sources:

- `node_modules/json-parse-even-better-errors/LICENSE.md`

```text
Copyright 2017 Kat Marchán
Copyright npm, Inc.

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

---

This library is a fork of 'better-json-errors' by Kat Marchán, extended and
distributed under the terms of the MIT license above.
```

### text-512cfa4d5e7a7569c7ae4dd95241cb6ae2aaf648ef9ebd080c01bd24868d26e9

SHA-256 `512cfa4d5e7a7569c7ae4dd95241cb6ae2aaf648ef9ebd080c01bd24868d26e9` · 1172 original bytes.

Sources:

- `node_modules/http-errors/node_modules/statuses/LICENSE`
- `node_modules/send/node_modules/statuses/LICENSE`
- `node_modules/statuses/LICENSE`

```text

The MIT License (MIT)

Copyright (c) 2014 Jonathan Ong <me@jongleberry.com>
Copyright (c) 2016 Douglas Christopher Wilson <doug@somethingdoug.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-51887a3d47051ac2fce1210562e5b9fe0830a8a8fabeb272c2d586eeb18a05fd

SHA-256 `51887a3d47051ac2fce1210562e5b9fe0830a8a8fabeb272c2d586eeb18a05fd` · 1080 original bytes.

Sources:

- `node_modules/regenerator-runtime/LICENSE`

```text
MIT License

Copyright (c) 2014-present, Facebook, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-52412d7bc7ce4157ea628bbaacb8829e0a9cb3c58f57f99176126bc8cf2bfc85

SHA-256 `52412d7bc7ce4157ea628bbaacb8829e0a9cb3c58f57f99176126bc8cf2bfc85` · 1086 original bytes.

Sources:

- `node_modules/@jest/react-is-18/LICENSE`
- `node_modules/babel-plugin-transform-flow-enums/LICENSE`
- `node_modules/flow-enums-runtime/LICENSE`
- `node_modules/react-is/LICENSE`
- `node_modules/react-refresh/LICENSE`

```text
MIT License

Copyright (c) Facebook, Inc. and its affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-53e59feb13058722d977c699eb0407c7bce2f93c949b681bbd2ff31698535927

SHA-256 `53e59feb13058722d977c699eb0407c7bce2f93c949b681bbd2ff31698535927` · 1145 original bytes.

Sources:

- `node_modules/json5/LICENSE.md`

```text
MIT License

Copyright (c) 2012-2018 Aseem Kishore, and [others].

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[others]: https://github.com/json5/json5/contributors
```

### text-540c425a30eea428eb24cc9d6884982783eb89403f443db1a4ad61eb78003f04

SHA-256 `540c425a30eea428eb24cc9d6884982783eb89403f443db1a4ad61eb78003f04` · 1239 original bytes.

Sources:

- `node_modules/fetch-nodeshim/LICENSE.md`

```text
MIT License

Copyright (c) Phil Pluckthun,
Copyright (c) 650 Industries, Inc. (aka Expo),
Copyright (c) 2016 - 2020 Node Fetch Team,
Copyright (c) Remix Software Inc. 2020-2021,
Copyright (c) Shopify Inc. 2022-2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-54b32293ea560d22cd9b62af9b2cda1a030d910a48c6601d227c5ff2338d95f8

SHA-256 `54b32293ea560d22cd9b62af9b2cda1a030d910a48c6601d227c5ff2338d95f8` · 1068 original bytes.

Sources:

- `node_modules/detect-node-es/LICENSE`

```text
MIT License

Copyright (c) 2017 Ilya Kantor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-553d4d20029a24e315b428a1a54a9e109eaa340f2e958a4f50a92362c2c4070b

SHA-256 `553d4d20029a24e315b428a1a54a9e109eaa340f2e958a4f50a92362c2c4070b` · 1177 original bytes.

Sources:

- `node_modules/compression/node_modules/negotiator/LICENSE`
- `node_modules/expo/node_modules/negotiator/LICENSE`
- `node_modules/negotiator/LICENSE`

```text
(The MIT License)

Copyright (c) 2012-2014 Federico Romero
Copyright (c) 2012-2014 Isaac Z. Schlueter
Copyright (c) 2014-2015 Douglas Christopher Wilson

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-555e1f70ce6b9b7ce77ad07ba8b2b6b3a543b2c7cc8fe15a2c30ad1b89667e21

SHA-256 `555e1f70ce6b9b7ce77ad07ba8b2b6b3a543b2c7cc8fe15a2c30ad1b89667e21` · 550 original bytes.

Sources:

- `node_modules/walker/LICENSE`

```text
Copyright 2013 Naitik Shah

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### text-560005aa01c5230147ca813dabd1970628d6c6ef57ad8f1553ad20ef9dce451b

SHA-256 `560005aa01c5230147ca813dabd1970628d6c6ef57ad8f1553ad20ef9dce451b` · 1114 original bytes.

Sources:

- `node_modules/vlq/LICENSE`

```text
Copyright (c) 2017 [these people](https://github.com/Rich-Harris/vlq/graphs/contributors)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-58d1e17ffe5109a7ae296caafcadfdbe6a7d176f0bc4ab01e12a689b0499d8bd

SHA-256 `58d1e17ffe5109a7ae296caafcadfdbe6a7d176f0bc4ab01e12a689b0499d8bd` · 11357 original bytes.

Sources:

- `node_modules/@expo-google-fonts/material-symbols/LICENSE_FONT`

```text

                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### text-5a3b0007c4203f10fe11b3fe8747253eb994f135e10b73e1f88ada941af09c6e

SHA-256 `5a3b0007c4203f10fe11b3fe8747253eb994f135e10b73e1f88ada941af09c6e` · 784 original bytes.

Sources:

- `node_modules/anymatch/LICENSE`

```text
The ISC License

Copyright (c) 2019 Elan Shanker, Paul Miller (https://paulmillr.com)

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-5a547aafe7b171c859ec64de1dd3c3363689f830133f508d043c83da12a6d0a2

SHA-256 `5a547aafe7b171c859ec64de1dd3c3363689f830133f508d043c83da12a6d0a2` · 1068 original bytes.

Sources:

- `node_modules/@istanbuljs/schema/LICENSE`

```text
MIT License

Copyright (c) 2019 CFWare, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-5b37224c080cdcc97c871ada971c224e9926370fe74f11b539aa1cf9f3b1aca1

SHA-256 `5b37224c080cdcc97c871ada971c224e9926370fe74f11b539aa1cf9f3b1aca1` · 1081 original bytes.

Sources:

- `node_modules/base64-js/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2014 Jameson Little

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-5b8a867ac027eaa06bb77bdfee4dddfa2be02a872a5458f9a5b3233453aa06d5

SHA-256 `5b8a867ac027eaa06bb77bdfee4dddfa2be02a872a5458f9a5b3233453aa06d5` · 1501 original bytes.

Sources:

- `node_modules/babel-plugin-istanbul/LICENSE`

```text
Copyright (c) 2016, Istanbul Code Coverage
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of babel-plugin-istanbul nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### text-5bba27375d93e9119f76c1015f7672cf9ad5f70952296e0842fb2243d6376869

SHA-256 `5bba27375d93e9119f76c1015f7672cf9ad5f70952296e0842fb2243d6376869` · 738 original bytes.

Sources:

- `node_modules/yaml/LICENSE`

```text
Copyright Eemeli Aro <eemeli@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
```

### text-5be1f3465bba68a626777f984878814aaf35e7ef8e9fd314d469bcf887050fb8

SHA-256 `5be1f3465bba68a626777f984878814aaf35e7ef8e9fd314d469bcf887050fb8` · 1095 original bytes.

Sources:

- `node_modules/postcss/LICENSE`

```text
The MIT License (MIT)

Copyright 2013 Andrey Sitnik <andrey@sitnik.es>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-5c496ce5ae47eb8e5ddcaa5e29c27c446a3855b19e3a66991b52f361bed22b28

SHA-256 `5c496ce5ae47eb8e5ddcaa5e29c27c446a3855b19e3a66991b52f361bed22b28` · 1078 original bytes.

Sources:

- `node_modules/is-core-module/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2014 Dave Justice

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3

SHA-256 `5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3` · 1117 original bytes.

Sources:

- `node_modules/ansi-escapes/license`
- `node_modules/camelcase/license`
- `node_modules/cli-spinners/license`
- `node_modules/emittery/license`
- `node_modules/escape-string-regexp/license`
- `node_modules/execa/license`
- `node_modules/execa/node_modules/onetime/license`
- `node_modules/get-stream/license`
- `node_modules/import-local/license`
- `node_modules/is-docker/license`
- `node_modules/is-stream/license`
- `node_modules/jest-worker/node_modules/supports-color/license`
- `node_modules/make-dir/license`
- `node_modules/open/license`
- `node_modules/p-limit/license`
- `node_modules/parse-json/license`
- `node_modules/string-length/license`
- `node_modules/strip-json-comments/license`
- `node_modules/wrap-ansi/license`
- `node_modules/yocto-queue/license`

```text
MIT License

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-5e325595b4ea8cfec3802f545b1def5d7b73e4a5b8e9ba63e32a320f67732292

SHA-256 `5e325595b4ea8cfec3802f545b1def5d7b73e4a5b8e9ba63e32a320f67732292` · 1071 original bytes.

Sources:

- `node_modules/es-errors/LICENSE`

```text
MIT License

Copyright (c) 2024 Jordan Harband

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-5e733eb92ed0c571da3f27c5da203e0a9f975b4f96e7692c9fa3660ca54820ec

SHA-256 `5e733eb92ed0c571da3f27c5da203e0a9f975b4f96e7692c9fa3660ca54820ec` · 1059 original bytes.

Sources:

- `node_modules/promise/LICENSE`

```text
Copyright (c) 2014 Forbes Lindesay

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-5eba353fe5076ac3432177f8ab1cf75e3afcd0584251e37c3bfead5f447d040e

SHA-256 `5eba353fe5076ac3432177f8ab1cf75e3afcd0584251e37c3bfead5f447d040e` · 15648 original bytes.

Sources:

- `node_modules/lightningcss-linux-x64-gnu/LICENSE`
- `node_modules/lightningcss-linux-x64-musl/LICENSE`
- `node_modules/lightningcss/LICENSE`

```text
 Mozilla Public License Version 2.0
==================================

1. Definitions
--------------

1.1. "Contributor"
means each individual or legal entity that creates, contributes to
the creation of, or owns Covered Software.

1.2. "Contributor Version"
means the combination of the Contributions of others (if any) used
by a Contributor and that particular Contributor's Contribution.

1.3. "Contribution"
means Covered Software of a particular Contributor.

1.4. "Covered Software"
means Source Code Form to which the initial Contributor has attached
the notice in Exhibit A, the Executable Form of such Source Code
Form, and Modifications of such Source Code Form, in each case
including portions thereof.

1.5. "Incompatible With Secondary Licenses"
means

(a) that the initial Contributor has attached the notice described
in Exhibit B to the Covered Software; or

(b) that the Covered Software was made available under the terms of
version 1.1 or earlier of the License, but not also under the
terms of a Secondary License.

1.6. "Executable Form"
means any form of the work other than Source Code Form.

1.7. "Larger Work"
means a work that combines Covered Software with other material, in
a separate file or files, that is not Covered Software.

1.8. "License"
means this document.

1.9. "Licensable"
means having the right to grant, to the maximum extent possible,
whether at the time of the initial grant or subsequently, any and
all of the rights conveyed by this License.

1.10. "Modifications"
means any of the following:

(a) any file in Source Code Form that results from an addition to,
deletion from, or modification of the contents of Covered
Software; or

(b) any new file in Source Code Form that contains any Covered
Software.

1.11. "Patent Claims" of a Contributor
means any patent claim(s), including without limitation, method,
process, and apparatus claims, in any patent Licensable by such
Contributor that would be infringed, but for the grant of the
License, by the making, using, selling, offering for sale, having
made, import, or transfer of either its Contributions or its
Contributor Version.

1.12. "Secondary License"
means either the GNU General Public License, Version 2.0, the GNU
Lesser General Public License, Version 2.1, the GNU Affero General
Public License, Version 3.0, or any later versions of those
licenses.

1.13. "Source Code Form"
means the form of the work preferred for making modifications.

1.14. "You" (or "Your")
means an individual or a legal entity exercising rights under this
License. For legal entities, "You" includes any entity that
controls, is controlled by, or is under common control with You. For
purposes of this definition, "control" means (a) the power, direct
or indirect, to cause the direction or management of such entity,
whether by contract or otherwise, or (b) ownership of more than
fifty percent (50%) of the outstanding shares or beneficial
ownership of such entity.

2. License Grants and Conditions
--------------------------------

2.1. Grants

Each Contributor hereby grants You a world-wide, royalty-free,
non-exclusive license:

(a) under intellectual property rights (other than patent or trademark)
Licensable by such Contributor to use, reproduce, make available,
modify, display, perform, distribute, and otherwise exploit its
Contributions, either on an unmodified basis, with Modifications, or
as part of a Larger Work; and

(b) under Patent Claims of such Contributor to make, use, sell, offer
for sale, have made, import, and otherwise transfer either its
Contributions or its Contributor Version.

2.2. Effective Date

The licenses granted in Section 2.1 with respect to any Contribution
become effective for each Contribution on the date the Contributor first
distributes such Contribution.

2.3. Limitations on Grant Scope

The licenses granted in this Section 2 are the only rights granted under
this License. No additional rights or licenses will be implied from the
distribution or licensing of Covered Software under this License.
Notwithstanding Section 2.1(b) above, no patent license is granted by a
Contributor:

(a) for any code that a Contributor has removed from Covered Software;
or

(b) for infringements caused by: (i) Your and any other third party's
modifications of Covered Software, or (ii) the combination of its
Contributions with other software (except as part of its Contributor
Version); or

(c) under Patent Claims infringed by Covered Software in the absence of
its Contributions.

This License does not grant any rights in the trademarks, service marks,
or logos of any Contributor (except as may be necessary to comply with
the notice requirements in Section 3.4).

2.4. Subsequent Licenses

No Contributor makes additional grants as a result of Your choice to
distribute the Covered Software under a subsequent version of this
License (see Section 10.2) or under the terms of a Secondary License (if
permitted under the terms of Section 3.3).

2.5. Representation

Each Contributor represents that the Contributor believes its
Contributions are its original creation(s) or it has sufficient rights
to grant the rights to its Contributions conveyed by this License.

2.6. Fair Use

This License is not intended to limit any rights You have under
applicable copyright doctrines of fair use, fair dealing, or other
equivalents.

2.7. Conditions

Sections 3.1, 3.2, 3.3, and 3.4 are conditions of the licenses granted
in Section 2.1.

3. Responsibilities
-------------------

3.1. Distribution of Source Form

All distribution of Covered Software in Source Code Form, including any
Modifications that You create or to which You contribute, must be under
the terms of this License. You must inform recipients that the Source
Code Form of the Covered Software is governed by the terms of this
License, and how they can obtain a copy of this License. You may not
attempt to alter or restrict the recipients' rights in the Source Code
Form.

3.2. Distribution of Executable Form

If You distribute Covered Software in Executable Form then:

(a) such Covered Software must also be made available in Source Code
Form, as described in Section 3.1, and You must inform recipients of
the Executable Form how they can obtain a copy of such Source Code
Form by reasonable means in a timely manner, at a charge no more
than the cost of distribution to the recipient; and

(b) You may distribute such Executable Form under the terms of this
License, or sublicense it under different terms, provided that the
license for the Executable Form does not attempt to limit or alter
the recipients' rights in the Source Code Form under this License.

3.3. Distribution of a Larger Work

You may create and distribute a Larger Work under terms of Your choice,
provided that You also comply with the requirements of this License for
the Covered Software. If the Larger Work is a combination of Covered
Software with a work governed by one or more Secondary Licenses, and the
Covered Software is not Incompatible With Secondary Licenses, this
License permits You to additionally distribute such Covered Software
under the terms of such Secondary License(s), so that the recipient of
the Larger Work may, at their option, further distribute the Covered
Software under the terms of either this License or such Secondary
License(s).

3.4. Notices

You may not remove or alter the substance of any license notices
(including copyright notices, patent notices, disclaimers of warranty,
or limitations of liability) contained within the Source Code Form of
the Covered Software, except that You may alter any license notices to
the extent required to remedy known factual inaccuracies.

3.5. Application of Additional Terms

You may choose to offer, and to charge a fee for, warranty, support,
indemnity or liability obligations to one or more recipients of Covered
Software. However, You may do so only on Your own behalf, and not on
behalf of any Contributor. You must make it absolutely clear that any
such warranty, support, indemnity, or liability obligation is offered by
You alone, and You hereby agree to indemnify every Contributor for any
liability incurred by such Contributor as a result of warranty, support,
indemnity or liability terms You offer. You may include additional
disclaimers of warranty and limitations of liability specific to any
jurisdiction.

4. Inability to Comply Due to Statute or Regulation
---------------------------------------------------

If it is impossible for You to comply with any of the terms of this
License with respect to some or all of the Covered Software due to
statute, judicial order, or regulation then You must: (a) comply with
the terms of this License to the maximum extent possible; and (b)
describe the limitations and the code they affect. Such description must
be placed in a text file included with all distributions of the Covered
Software under this License. Except to the extent prohibited by statute
or regulation, such description must be sufficiently detailed for a
recipient of ordinary skill to be able to understand it.

5. Termination
--------------

5.1. The rights granted under this License will terminate automatically
if You fail to comply with any of its terms. However, if You become
compliant, then the rights granted under this License from a particular
Contributor are reinstated (a) provisionally, unless and until such
Contributor explicitly and finally terminates Your grants, and (b) on an
ongoing basis, if such Contributor fails to notify You of the
non-compliance by some reasonable means prior to 60 days after You have
come back into compliance. Moreover, Your grants from a particular
Contributor are reinstated on an ongoing basis if such Contributor
notifies You of the non-compliance by some reasonable means, this is the
first time You have received notice of non-compliance with this License
from such Contributor, and You become compliant prior to 30 days after
Your receipt of the notice.

5.2. If You initiate litigation against any entity by asserting a patent
infringement claim (excluding declaratory judgment actions,
counter-claims, and cross-claims) alleging that a Contributor Version
directly or indirectly infringes any patent, then the rights granted to
You by any and all Contributors for the Covered Software under Section
2.1 of this License shall terminate.

5.3. In the event of termination under Sections 5.1 or 5.2 above, all
end user license agreements (excluding distributors and resellers) which
have been validly granted by You or Your distributors under this License
prior to termination shall survive termination.

************************************************************************
* *
* 6. Disclaimer of Warranty *
* ------------------------- *
* *
* Covered Software is provided under this License on an "as is" *
* basis, without warranty of any kind, either expressed, implied, or *
* statutory, including, without limitation, warranties that the *
* Covered Software is free of defects, merchantable, fit for a *
* particular purpose or non-infringing. The entire risk as to the *
* quality and performance of the Covered Software is with You. *
* Should any Covered Software prove defective in any respect, You *
* (not any Contributor) assume the cost of any necessary servicing, *
* repair, or correction. This disclaimer of warranty constitutes an *
* essential part of this License. No use of any Covered Software is *
* authorized under this License except under this disclaimer. *
* *
************************************************************************

************************************************************************
* *
* 7. Limitation of Liability *
* -------------------------- *
* *
* Under no circumstances and under no legal theory, whether tort *
* (including negligence), contract, or otherwise, shall any *
* Contributor, or anyone who distributes Covered Software as *
* permitted above, be liable to You for any direct, indirect, *
* special, incidental, or consequential damages of any character *
* including, without limitation, damages for lost profits, loss of *
* goodwill, work stoppage, computer failure or malfunction, or any *
* and all other commercial damages or losses, even if such party *
* shall have been informed of the possibility of such damages. This *
* limitation of liability shall not apply to liability for death or *
* personal injury resulting from such party's negligence to the *
* extent applicable law prohibits such limitation. Some *
* jurisdictions do not allow the exclusion or limitation of *
* incidental or consequential damages, so this exclusion and *
* limitation may not apply to You. *
* *
************************************************************************

8. Litigation
-------------

Any litigation relating to this License may be brought only in the
courts of a jurisdiction where the defendant maintains its principal
place of business and such litigation shall be governed by laws of that
jurisdiction, without reference to its conflict-of-law provisions.
Nothing in this Section shall prevent a party's ability to bring
cross-claims or counter-claims.

9. Miscellaneous
----------------

This License represents the complete agreement concerning the subject
matter hereof. If any provision of this License is held to be
unenforceable, such provision shall be reformed only to the extent
necessary to make it enforceable. Any law or regulation which provides
that the language of a contract shall be construed against the drafter
shall not be used to construe this License against a Contributor.

10. Versions of the License
---------------------------

10.1. New Versions

Mozilla Foundation is the license steward. Except as provided in Section
10.3, no one other than the license steward has the right to modify or
publish new versions of this License. Each version will be given a
distinguishing version number.

10.2. Effect of New Versions

You may distribute the Covered Software under the terms of the version
of the License under which You originally received the Covered Software,
or under the terms of any subsequent version published by the license
steward.

10.3. Modified Versions

If you create software not governed by this License, and you want to
create a new license for such software, you may create and use a
modified version of this License if you rename the license and remove
any references to the name of the license steward (except to note that
such modified license differs from this License).

10.4. Distributing Source Code Form that is Incompatible With Secondary
Licenses

If You choose to distribute Source Code Form that is Incompatible With
Secondary Licenses under the terms of this version of the License, the
notice described in Exhibit B of this License must be attached.

Exhibit A - Source Code Form License Notice
-------------------------------------------

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.

If it is not possible or desirable to put the notice in a particular
file, then You may include the notice in a location (such as a LICENSE
file in a relevant directory) where a recipient would be likely to look
for such a notice.

You may add additional accurate notices of copyright ownership.

Exhibit B - "Incompatible With Secondary Licenses" Notice
---------------------------------------------------------

This Source Code Form is "Incompatible With Secondary Licenses", as
defined by the Mozilla Public License, v. 2.0.
```

### text-5ffe28e7ade7d8f10d85d5337a73fd793dac5c462fb9a28fbf8c5046c7fbca3b

SHA-256 `5ffe28e7ade7d8f10d85d5337a73fd793dac5c462fb9a28fbf8c5046c7fbca3b` · 749 original bytes.

Sources:

- `node_modules/inherits/LICENSE`

```text
The ISC License

Copyright (c) Isaac Z. Schlueter

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```

### text-60acd7711e6c138e6041836e32d922705254cc1568a30fdf16aa8f59bb87aeaa

SHA-256 `60acd7711e6c138e6041836e32d922705254cc1568a30fdf16aa8f59bb87aeaa` · 1071 original bytes.

Sources:

- `node_modules/resolve/LICENSE`

```text
MIT License

Copyright (c) 2012 James Halliday

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-61bed033eebace09bbefb1a3903ebc09e0086ea793d1694fbe300827adc9f921

SHA-256 `61bed033eebace09bbefb1a3903ebc09e0086ea793d1694fbe300827adc9f921` · 1110 original bytes.

Sources:

- `node_modules/supports-hyperlinks/license`

```text
MIT License

Copyright (c) James Talmage <james@talmage.io> (github.com/jamestalmage)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-6236fa0b88a4a0cce3dda0367979491b2052b3c8d6b1c10b3668de083e86a7f0

SHA-256 `6236fa0b88a4a0cce3dda0367979491b2052b3c8d6b1c10b3668de083e86a7f0` · 976 original bytes.

Sources:

- `node_modules/@jest/reporters/node_modules/glob/LICENSE`
- `node_modules/jest-config/node_modules/glob/LICENSE`
- `node_modules/jest-runtime/node_modules/glob/LICENSE`
- `node_modules/test-exclude/node_modules/glob/LICENSE`

```text
The ISC License

Copyright (c) Isaac Z. Schlueter and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

## Glob Logo

Glob's logo created by Tanya Brassie <http://tanyabrassie.com/>, licensed
under a Creative Commons Attribution-ShareAlike 4.0 International License
https://creativecommons.org/licenses/by-sa/4.0/
```

### text-6294da0e0a201bbe1de254445c9d07133a9448af05e4e44d0a2364747d114368

SHA-256 `6294da0e0a201bbe1de254445c9d07133a9448af05e4e44d0a2364747d114368` · 1581 original bytes.

Sources:

- `node_modules/wcwidth/LICENSE`

```text
wcwidth.js: JavaScript Portng of Markus Kuhn's wcwidth() Implementation
=======================================================================

Copyright (C) 2012 by Jun Woong.

This package is a JavaScript porting of `wcwidth()` implementation
[by Markus Kuhn](http://www.cl.cam.ac.uk/~mgk25/ucs/wcwidth.c).

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.


THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES,
INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR
OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
```

### text-63b9a188d7d43e64b0558b7115255045b9fe20a5fc3ff483421cb899e7f52bcb

SHA-256 `63b9a188d7d43e64b0558b7115255045b9fe20a5fc3ff483421cb899e7f52bcb` · 1189 original bytes.

Sources:

- `node_modules/serve-static/LICENSE`

```text
(The MIT License)

Copyright (c) 2010 Sencha Inc.
Copyright (c) 2011 LearnBoost
Copyright (c) 2011 TJ Holowaychuk
Copyright (c) 2014-2016 Douglas Christopher Wilson

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-64a93ffc0a06a2266dbb57ed7ebe3b56ba66ab337b6347fabdbf86c76819fbae

SHA-256 `64a93ffc0a06a2266dbb57ed7ebe3b56ba66ab337b6347fabdbf86c76819fbae` · 1116 original bytes.

Sources:

- `node_modules/ansi-escapes/node_modules/type-fest/license`

```text
MIT License

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https:/sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-6582629e2979466878f6014313dcc2f3756c9616148682227ce3063dde310750

SHA-256 `6582629e2979466878f6014313dcc2f3756c9616148682227ce3063dde310750` · 787 original bytes.

Sources:

- `node_modules/picocolors/LICENSE`

```text
ISC License

Copyright (c) 2021-2024 Oleksii Raspopov, Kostiantyn Denysov, Anton Verinov

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-65bd93f75d6c0cdc1c9e1a39bd1814e2e34355c665e1564a1517f27c1523ab7e

SHA-256 `65bd93f75d6c0cdc1c9e1a39bd1814e2e34355c665e1564a1517f27c1523ab7e` · 1062 original bytes.

Sources:

- `node_modules/exit/LICENSE-MIT`

```text
Copyright (c) 2013 "Cowboy" Ben Alman

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
```

### text-660eedb52e4c076d2feae829b12b6b983d54f569221402618eb56cd2bb2ddcfb

SHA-256 `660eedb52e4c076d2feae829b12b6b983d54f569221402618eb56cd2bb2ddcfb` · 1519 original bytes.

Sources:

- `node_modules/@sinonjs/fake-timers/LICENSE`

```text
Copyright (c) 2010-2014, Christian Johansen, christian@cjohansen.no. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### text-6652830c2607c722b66f1b57de15877ab8fc5dca406cc5b335afeb365d0f32c1

SHA-256 `6652830c2607c722b66f1b57de15877ab8fc5dca406cc5b335afeb365d0f32c1` · 1077 original bytes.

Sources:

- `node_modules/compression/node_modules/ms/license.md`
- `node_modules/connect/node_modules/ms/license.md`
- `node_modules/finalhandler/node_modules/ms/license.md`
- `node_modules/lighthouse-logger/node_modules/ms/license.md`
- `node_modules/send/node_modules/debug/node_modules/ms/license.md`

```text
The MIT License (MIT)

Copyright (c) 2016 Zeit, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-68de92df8196cfbbadaaf85102e430777fc41cb2710a261c3d37557316982c2a

SHA-256 `68de92df8196cfbbadaaf85102e430777fc41cb2710a261c3d37557316982c2a` · 1070 original bytes.

Sources:

- `node_modules/collect-v8-coverage/LICENSE`

```text
MIT License

Copyright (c) 2019 Simen Bekkhus

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-68f12f6e2c33688699249c01d8f9623c534da20aa71989c57b061b7bc1676d14

SHA-256 `68f12f6e2c33688699249c01d8f9623c534da20aa71989c57b061b7bc1676d14` · 1096 original bytes.

Sources:

- `node_modules/@jest/reporters/node_modules/brace-expansion/LICENSE`
- `node_modules/jest-config/node_modules/brace-expansion/LICENSE`
- `node_modules/jest-runtime/node_modules/brace-expansion/LICENSE`
- `node_modules/test-exclude/node_modules/brace-expansion/LICENSE`

```text
MIT License

Copyright (c) 2013 Julian Gruber <julian@juliangruber.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-693866fc419c6f61c8570438ec00659d156ec2b4d4a4d04091711f5f11a365d4

SHA-256 `693866fc419c6f61c8570438ec00659d156ec2b4d4a4d04091711f5f11a365d4` · 1087 original bytes.

Sources:

- `node_modules/color-convert/LICENSE`
- `node_modules/log-symbols/node_modules/color-convert/LICENSE`
- `node_modules/ora/node_modules/color-convert/LICENSE`

```text
Copyright (c) 2011-2016 Heather Arthur <fayearthur@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-69dee148a2cc470554dfa7142e830662062394d0fe67cddd379aba90dc60d6b3

SHA-256 `69dee148a2cc470554dfa7142e830662062394d0fe67cddd379aba90dc60d6b3` · 1116 original bytes.

Sources:

- `node_modules/parse-png/license`
- `node_modules/shebang-command/license`

```text
MIT License

Copyright (c) Kevin Mårtensson <kevinmartensson@gmail.com> (github.com/kevva)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-6a29f2a84a4df3a25f1eca7e35bd4604d88275e25f6240eb017a77ce884bd577

SHA-256 `6a29f2a84a4df3a25f1eca7e35bd4604d88275e25f6240eb017a77ce884bd577` · 744 original bytes.

Sources:

- `node_modules/@istanbuljs/load-nyc-config/LICENSE`

```text
ISC License

Copyright (c) 2019, Contributors

Permission to use, copy, modify, and/or distribute this software
for any purpose with or without fee is hereby granted, provided
that the above copyright notice and this permission notice
appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE
LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-6b0c1f98ec71a46b44276c4e5095822f33efaba2dfac61c17c24fe5d666ccaee

SHA-256 `6b0c1f98ec71a46b44276c4e5095822f33efaba2dfac61c17c24fe5d666ccaee` · 1085 original bytes.

Sources:

- `node_modules/cjs-module-lexer/LICENSE`

```text
MIT License
-----------

Copyright (C) 2018-2020 Guy Bedford

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-6cb0631f71c7749763fd3dd1d5bee52dd1070ec17f2edc1710079ad070bd2fbd

SHA-256 `6cb0631f71c7749763fd3dd1d5bee52dd1070ec17f2edc1710079ad070bd2fbd` · 1526 original bytes.

Sources:

- `node_modules/css-tree/node_modules/source-map/LICENSE`
- `node_modules/istanbul-lib-source-maps/node_modules/source-map/LICENSE`
- `node_modules/jest-runner/node_modules/source-map/LICENSE`
- `node_modules/source-map-js/LICENSE`
- `node_modules/source-map-support/node_modules/source-map/LICENSE`
- `node_modules/source-map/LICENSE`

```text

Copyright (c) 2009-2011, Mozilla Foundation and contributors
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the names of the Mozilla Foundation nor the names of project
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### text-6cfc4687cb2f2d86f4a77e6b526290d3878e5e512f3fec2f4cb36a9cb36f798b

SHA-256 `6cfc4687cb2f2d86f4a77e6b526290d3878e5e512f3fec2f4cb36a9cb36f798b` · 1116 original bytes.

Sources:

- `node_modules/deepmerge/license.txt`

```text
The MIT License (MIT)

Copyright (c) 2012 James Halliday, Josh Duff, and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-6e7d699cdd1e4fa837ba7718ea49841aa67201b449ea8b3f9cf274be15974a64

SHA-256 `6e7d699cdd1e4fa837ba7718ea49841aa67201b449ea8b3f9cf274be15974a64` · 1084 original bytes.

Sources:

- `node_modules/utils-merge/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2013-2017 Jared Hanson

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-6fb9754611c20f6649f68805e8c990e83261f29316e29de9e6cedae607b8634c

SHA-256 `6fb9754611c20f6649f68805e8c990e83261f29316e29de9e6cedae607b8634c` · 1119 original bytes.

Sources:

- `node_modules/cli-cursor/license`
- `node_modules/filter-obj/license`
- `node_modules/log-symbols/node_modules/escape-string-regexp/license`
- `node_modules/onetime/license`
- `node_modules/ora/node_modules/escape-string-regexp/license`
- `node_modules/path-is-absolute/license`
- `node_modules/restore-cursor/license`
- `node_modules/serialize-error/license`

```text
The MIT License (MIT)

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-706ffe2db6ae2993ed01bc7f3cde114373fe79eb6123dfc6d8d41f53989a2be6

SHA-256 `706ffe2db6ae2993ed01bc7f3cde114373fe79eb6123dfc6d8d41f53989a2be6` · 1134 original bytes.

Sources:

- `node_modules/anser/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2012-20 Ionică Bizău <bizauionica@gmail.com> (https://ionicabizau.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-709e45bb17277819ce27e9abe5dc8e56fe93081e54adb6e6385517f28aa11ac4

SHA-256 `709e45bb17277819ce27e9abe5dc8e56fe93081e54adb6e6385517f28aa11ac4` · 1116 original bytes.

Sources:

- `node_modules/shallowequal/LICENSE`

```text
MIT License

Copyright (c) 2017 Alberto Leal <mailforalberto@gmail.com> (github.com/dashed)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-71f83c4c0621102a56d9853812777b85751bce7e9726f686f5b056c1f8a4b0e6

SHA-256 `71f83c4c0621102a56d9853812777b85751bce7e9726f686f5b056c1f8a4b0e6` · 1167 original bytes.

Sources:

- `node_modules/accepts/LICENSE`
- `node_modules/expo/node_modules/accepts/LICENSE`
- `node_modules/expo/node_modules/mime-types/LICENSE`
- `node_modules/mime-types/LICENSE`

```text
(The MIT License)

Copyright (c) 2014 Jonathan Ong <me@jongleberry.com>
Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-7252e9bc5eba33ff2b205f12c581fde208fa92c94ae8dac36d8167b648ad622c

SHA-256 `7252e9bc5eba33ff2b205f12c581fde208fa92c94ae8dac36d8167b648ad622c` · 1083 original bytes.

Sources:

- `node_modules/@testing-library/react-native/LICENSE`

```text
MIT License

Copyright (c) 2018 Callstack and Rally Health

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-736835b6c374cbfb66ccfbfc4f8819bcbeae3cfd5f5e5507f25f4caeabf9540e

SHA-256 `736835b6c374cbfb66ccfbfc4f8819bcbeae3cfd5f5e5507f25f4caeabf9540e` · 1082 original bytes.

Sources:

- `node_modules/@expo/spawn-async/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2015 650 Industries

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-74d8054d56d522bdaa340d3d71130cb204997d523a5292c85ac1264dd77c8d06

SHA-256 `74d8054d56d522bdaa340d3d71130cb204997d523a5292c85ac1264dd77c8d06` · 1089 original bytes.

Sources:

- `node_modules/on-headers/LICENSE`

```text
(The MIT License)

Copyright (c) 2014 Douglas Christopher Wilson

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-7585ea7bba616ccbbe43cb54ecb67956688c3c5641bb84f3099a652a73193afe

SHA-256 `7585ea7bba616ccbbe43cb54ecb67956688c3c5641bb84f3099a652a73193afe` · 1089 original bytes.

Sources:

- `node_modules/encodeurl/LICENSE`
- `node_modules/send/node_modules/encodeurl/LICENSE`
- `node_modules/serve-static/node_modules/encodeurl/LICENSE`

```text
(The MIT License)

Copyright (c) 2016 Douglas Christopher Wilson

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-769d154fbde32a915af110b1123650bc79f4cbe675acc66e005265bf069c6c6c

SHA-256 `769d154fbde32a915af110b1123650bc79f4cbe675acc66e005265bf069c6c6c` · 1080 original bytes.

Sources:

- `node_modules/@jridgewell/gen-mapping/LICENSE`
- `node_modules/@jridgewell/remapping/LICENSE`
- `node_modules/@jridgewell/source-map/LICENSE`
- `node_modules/@jridgewell/sourcemap-codec/LICENSE`
- `node_modules/@jridgewell/trace-mapping/LICENSE`

```text
Copyright 2024 Justin Ridgewell <justin@ridgewell.name>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-76a876cf886ff9be2a8b5e2e86514fed06223c8c9f0c1e9ee9606e93841e00b7

SHA-256 `76a876cf886ff9be2a8b5e2e86514fed06223c8c9f0c1e9ee9606e93841e00b7` · 1099 original bytes.

Sources:

- `node_modules/acorn/LICENSE`

```text
MIT License

Copyright (C) 2012-2022 by various contributors (see AUTHORS)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-76c9d5f5ea942054715c026f33f8717c9e24603196a3737b8899afa216bcbdab

SHA-256 `76c9d5f5ea942054715c026f33f8717c9e24603196a3737b8899afa216bcbdab` · 1038 original bytes.

Sources:

- `node_modules/dedent/LICENSE.md`

```text
# MIT License

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-76d6d1ea0c268da37dd3c961b4fcfb23dee8417fff9e8786d4d44c585b781b69

SHA-256 `76d6d1ea0c268da37dd3c961b4fcfb23dee8417fff9e8786d4d44c585b781b69` · 727 original bytes.

Sources:

- `node_modules/setprototypeof/LICENSE`

```text
Copyright (c) 2015, Wes Todd

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-773e131a7684726005a7e4688a80b4620033bc08499bc1404dd1a1eb3bca725e

SHA-256 `773e131a7684726005a7e4688a80b4620033bc08499bc1404dd1a1eb3bca725e` · 1052 original bytes.

Sources:

- `node_modules/function-bind/LICENSE`

```text
Copyright (c) 2013 Raynos.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-7bf9b2de73a6b356761c948d0e9eeb4be6c1270bd04c79cd489c1e400ffdfc1a

SHA-256 `7bf9b2de73a6b356761c948d0e9eeb4be6c1270bd04c79cd489c1e400ffdfc1a` · 1074 original bytes.

Sources:

- `node_modules/fast-deep-equal/LICENSE`

```text
MIT License

Copyright (c) 2017 Evgeny Poberezkin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-7ec9661a8afafab1eee3523d6f1a193eff76314a5ab10b4ce96aefd87621b0c3

SHA-256 `7ec9661a8afafab1eee3523d6f1a193eff76314a5ab10b4ce96aefd87621b0c3` · 11342 original bytes.

Sources:

- `node_modules/chrome-launcher/LICENSE`
- `node_modules/chromium-edge-launcher/LICENSE`
- `node_modules/lighthouse-logger/LICENSE`

```text

                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright 2014 Google Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### text-804a84c51eaa182f86636b463d2bffc73e8592aa2bea192556e003deaf506711

SHA-256 `804a84c51eaa182f86636b463d2bffc73e8592aa2bea192556e003deaf506711` · 1148 original bytes.

Sources:

- `node_modules/@babel/plugin-transform-regenerator/LICENSE`

```text
MIT License

Copyright (c) 2014-present Sebastian McKenzie and other contributors
Copyright (c) 2014-present Facebook, Inc.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-805f6cb28bb8b6d3a0badd83c93bccd9671fa01a3b4b92b7042b0743325ac243

SHA-256 `805f6cb28bb8b6d3a0badd83c93bccd9671fa01a3b4b92b7042b0743325ac243` · 1069 original bytes.

Sources:

- `node_modules/fflate/LICENSE`

```text
MIT License

Copyright (c) 2023 Arjun Barrett

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-8089bcc08845ec143e5761f4a101a65b8c792a0dedbfeeb90a15560c0b77f768

SHA-256 `8089bcc08845ec143e5761f4a101a65b8c792a0dedbfeeb90a15560c0b77f768` · 1167 original bytes.

Sources:

- `node_modules/on-finished/LICENSE`
- `node_modules/send/node_modules/on-finished/LICENSE`

```text
(The MIT License)

Copyright (c) 2013 Jonathan Ong <me@jongleberry.com>
Copyright (c) 2014 Douglas Christopher Wilson <doug@somethingdoug.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-80de3c4eed58e1e8584be9891ba78e70493192972e2210aaafe4f09f616cb3c9

SHA-256 `80de3c4eed58e1e8584be9891ba78e70493192972e2210aaafe4f09f616cb3c9` · 1069 original bytes.

Sources:

- `node_modules/sf-symbols-typescript/LICENSE`

```text
MIT License

Copyright (c) 2023 Fernando Rojo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-8465b04b67f473341171b5c9c8b2c741a4a395b3f6ed58339b3a4f4db3db7472

SHA-256 `8465b04b67f473341171b5c9c8b2c741a4a395b3f6ed58339b3a4f4db3db7472` · 2125 original bytes.

Sources:

- `node_modules/fs.realpath/LICENSE`

```text
The ISC License

Copyright (c) Isaac Z. Schlueter and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

----

This library bundles a version of the `fs.realpath` and `fs.realpathSync`
methods from Node.js v0.10 under the terms of the Node.js MIT license.

Node's license follows, also included at the header of `old.js` which contains
the licensed code:

  Copyright Joyent, Inc. and other Node contributors.

  Permission is hereby granted, free of charge, to any person obtaining a
  copy of this software and associated documentation files (the "Software"),
  to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense,
  and/or sell copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
  DEALINGS IN THE SOFTWARE.
```

### text-846c2349412e40c3c33095b2903f6a311ef4b30ccd26c214044a2cdc24fdc5cc

SHA-256 `846c2349412e40c3c33095b2903f6a311ef4b30ccd26c214044a2cdc24fdc5cc` · 1116 original bytes.

Sources:

- `node_modules/query-string/license`

```text
MIT License

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (http://sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-8984783ab2478bbee455f0eb6c375b5b62c57c86d4a55f6bf96dfd08e8d48a10

SHA-256 `8984783ab2478bbee455f0eb6c375b5b62c57c86d4a55f6bf96dfd08e8d48a10` · 1082 original bytes.

Sources:

- `node_modules/color-string/LICENSE`

```text
Copyright (c) 2011 Heather Arthur <fayearthur@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-898c2bcff663681498ad1ca8235d45b6e70b10cdf1f869a5b5e69f6e46efedd3

SHA-256 `898c2bcff663681498ad1ca8235d45b6e70b10cdf1f869a5b5e69f6e46efedd3` · 739 original bytes.

Sources:

- `node_modules/npm-package-arg/LICENSE`

```text
The ISC License

Copyright (c) npm, Inc.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-899da9d991cb211a3642b84e82a9ae0b4b4e44546fd207e34d7d4ec2eb40f420

SHA-256 `899da9d991cb211a3642b84e82a9ae0b4b4e44546fd207e34d7d4ec2eb40f420` · 1080 original bytes.

Sources:

- `node_modules/error-stack-parser/LICENSE`
- `node_modules/stackframe/LICENSE`

```text
Copyright (c) 2017 Eric Wendelin and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-8a1af140fdfbf5afd3df27f7e662f989c5b963a300020dfafce42033cae9e004

SHA-256 `8a1af140fdfbf5afd3df27f7e662f989c5b963a300020dfafce42033cae9e004` · 1552 original bytes.

Sources:

- `node_modules/minipass/LICENSE.md`
- `node_modules/path-scurry/LICENSE.md`
- `node_modules/path-scurry/node_modules/lru-cache/LICENSE.md`
- `node_modules/sax/LICENSE.md`

```text
# Blue Oak Model License

Version 1.0.0

## Purpose

This license gives everyone as much permission to work with
this software as possible, while protecting contributors
from liability.

## Acceptance

In order to receive this license, you must agree to its
rules.  The rules of this license are both obligations
under that agreement and conditions to your license.
You must not do anything with this software that triggers
a rule that you cannot or will not follow.

## Copyright

Each contributor licenses you to do everything with this
software that would otherwise infringe that contributor's
copyright in it.

## Notices

You must ensure that everyone who gets a copy of
any part of this software from you, with or without
changes, also gets the text of this license or a link to
<https://blueoakcouncil.org/license/1.0.0>.

## Excuse

If anyone notifies you in writing that you have not
complied with [Notices](#notices), you can keep your
license by taking all practical steps to comply within 30
days after the notice.  If you do not do so, your license
ends immediately.

## Patent

Each contributor licenses you to do everything with this
software that would otherwise infringe any patent claims
they can license or become able to license.

## Reliability

No contributor can revoke this license.

## No Liability

***As far as the law allows, this software comes as is,
without any warranty or condition, and no contributor
will be liable to anyone for any damages related to this
software or this license, under any kind of legal claim.***
```

### text-8bb16db1b047019e4395965f2cf3611b06c34bf86dc2d0210b3c3f91b53c21fe

SHA-256 `8bb16db1b047019e4395965f2cf3611b06c34bf86dc2d0210b3c3f91b53c21fe` · 1109 original bytes.

Sources:

- `node_modules/shell-quote/LICENSE`

```text
The MIT License

Copyright (c) 2013 James Halliday (mail@substack.net)

Permission is hereby granted, free of charge,
to any person obtaining a copy of this software and
associated documentation files (the "Software"), to
deal in the Software without restriction, including
without limitation the rights to use, copy, modify,
merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom
the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-8d8c55319c7729d57be811c747452636688d54f19701ee0752b6b15ad3771d9a

SHA-256 `8d8c55319c7729d57be811c747452636688d54f19701ee0752b6b15ad3771d9a` · 1101 original bytes.

Sources:

- `node_modules/agent-base/LICENSE`
- `node_modules/https-proxy-agent/LICENSE`

```text
(The MIT License)

Copyright (c) 2013 Nathan Rajlich <nathan@tootallnate.net>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-8dacb1e00ec1cf679e7987c87c9953ce6a4d96e7ef361dd04cd453643e9b3351

SHA-256 `8dacb1e00ec1cf679e7987c87c9953ce6a4d96e7ef361dd04cd453643e9b3351` · 1107 original bytes.

Sources:

- `node_modules/@expo/config-types/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2020-present 650 Industries, Inc. (aka Expo)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-8df3c23e3dfffa0d3d41c59fae5741ea3e2c50eb19c52a5d8912a68fdba554c2

SHA-256 `8df3c23e3dfffa0d3d41c59fae5741ea3e2c50eb19c52a5d8912a68fdba554c2` · 1106 original bytes.

Sources:

- `node_modules/slugify/LICENSE`

```text
The MIT License (MIT)

Copyright (c) Simeon Velichkov <simeonvelichkov@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-8f2658c03422c408b2b2ce4d151decc3b1a6fd3d86e5ca9433777bccdcdf75a2

SHA-256 `8f2658c03422c408b2b2ce4d151decc3b1a6fd3d86e5ca9433777bccdcdf75a2` · 1098 original bytes.

Sources:

- `node_modules/mime/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2010 Benjamin Thomas, Robert Kieffer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-8f67ef1afdbd7b8ddc3e2da9968bb97af30795ae9c90a2cc4d867e5608216973

SHA-256 `8f67ef1afdbd7b8ddc3e2da9968bb97af30795ae9c90a2cc4d867e5608216973` · 1077 original bytes.

Sources:

- `node_modules/simple-swizzle/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2015 Josh Junon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-8f85aab053e268546014761da47630a09886626afbd0d8d440cb2c69611bb8d3

SHA-256 `8f85aab053e268546014761da47630a09886626afbd0d8d440cb2c69611bb8d3` · 1058 original bytes.

Sources:

- `node_modules/node-int64/LICENSE`

```text
Copyright (c) 2014 Robert Kieffer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-8ff4aae800e54e41c72f162f6227aa3f23209b0db4936efee7a7249015492e15

SHA-256 `8ff4aae800e54e41c72f162f6227aa3f23209b0db4936efee7a7249015492e15` · 1067 original bytes.

Sources:

- `node_modules/lan-network/LICENSE.md`

```text
MIT License

Copyright (c) Phil Pluckthun,

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-901d0a7fcaccaae9917d165039c0473c354e5da2e0e94140dde67aad9ffb19da

SHA-256 `901d0a7fcaccaae9917d165039c0473c354e5da2e0e94140dde67aad9ffb19da` · 1303 original bytes.

Sources:

- `node_modules/terser/LICENSE`

```text
Copyright 2012-2018 (c) Mihai Bazon <mihai.bazon@gmail.com>

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

    * Redistributions of source code must retain the above
      copyright notice, this list of conditions and the following
      disclaimer.

    * Redistributions in binary form must reproduce the above
      copyright notice, this list of conditions and the following
      disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
SUCH DAMAGE.
```

### text-902dbb4154679fb2b8d7c33878183f45b268d01eae5e5033dddaa8852d45f213

SHA-256 `902dbb4154679fb2b8d7c33878183f45b268d01eae5e5033dddaa8852d45f213` · 745 original bytes.

Sources:

- `node_modules/get-caller-file/LICENSE.md`

```text
ISC License (ISC)
Copyright 2018 Stefan Penner

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-91887c62d26f64b8d6e98b1dca57e75aca62e6f9af79fb0783f8f1904abaeea6

SHA-256 `91887c62d26f64b8d6e98b1dca57e75aca62e6f9af79fb0783f8f1904abaeea6` · 1079 original bytes.

Sources:

- `node_modules/arg/LICENSE.md`

```text
The MIT License (MIT)

Copyright (c) 2021 Vercel, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-92b07a2e5b0e051d37dde85042c736d6d551cfcbc0983f39d7ef903b3986bbc1

SHA-256 `92b07a2e5b0e051d37dde85042c736d6d551cfcbc0983f39d7ef903b3986bbc1` · 1077 original bytes.

Sources:

- `node_modules/error-ex/LICENSE`
- `node_modules/error-ex/node_modules/is-arrayish/LICENSE`
- `node_modules/is-arrayish/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2015 JD Ballard

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-92c22d327a6644efda43527bfa6f136f4382359f40bc288eda0764f67be9c269

SHA-256 `92c22d327a6644efda43527bfa6f136f4382359f40bc288eda0764f67be9c269` · 1062 original bytes.

Sources:

- `node_modules/react-native-worklets/LICENSE`

```text
MIT License

Copyright (c) 2024 nobody
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-94bcb9959136723aa4fb36e1a6c4d5c662a2369978cfae344dabfb83ae619e79

SHA-256 `94bcb9959136723aa4fb36e1a6c4d5c662a2369978cfae344dabfb83ae619e79` · 1303 original bytes.

Sources:

- `node_modules/esprima/LICENSE.BSD`

```text
Copyright JS Foundation and other contributors, https://js.foundation/

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### text-94cfe87de9b178e8fee313a19178e625129e2ce559db32e772e7bd95114ee6ff

SHA-256 `94cfe87de9b178e8fee313a19178e625129e2ce559db32e772e7bd95114ee6ff` · 1098 original bytes.

Sources:

- `node_modules/dom-serializer/LICENSE`

```text
License

(The MIT License)

Copyright (c) 2014 The cheeriojs contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-95b52e497653b738fd50e4bd3a8197dc41593c63129acb4f8069dbf49530ef82

SHA-256 `95b52e497653b738fd50e4bd3a8197dc41593c63129acb4f8069dbf49530ef82` · 1099 original bytes.

Sources:

- `node_modules/react-native-screens/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2018 Software Mansion <swmansion.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-9638fa87f845af6cecc56fab498c1f74f4a98522d3b53377bedcbdb44b5a8dcc

SHA-256 `9638fa87f845af6cecc56fab498c1f74f4a98522d3b53377bedcbdb44b5a8dcc` · 1173 original bytes.

Sources:

- `node_modules/min-indent/license`

```text

The MIT License (MIT)

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com), James Kyle <me@thejameskyle.com> (thejameskyle.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-965ef284f7f4c176842ec2e87fa13e79feed777d56d7a21a5a3b38f1bb6dc288

SHA-256 `965ef284f7f4c176842ec2e87fa13e79feed777d56d7a21a5a3b38f1bb6dc288` · 1099 original bytes.

Sources:

- `node_modules/ee-first/LICENSE`

```text

The MIT License (MIT)

Copyright (c) 2014 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-97d87142793695cd73243de7258694abe85b3b6060fca7f247b0a2afa8219678

SHA-256 `97d87142793695cd73243de7258694abe85b3b6060fca7f247b0a2afa8219678` · 1082 original bytes.

Sources:

- `node_modules/event-target-shim/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2015 Toru Nagashima

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-9877e90da14aa8c931a1f9d07cc2a20ce119106e5dab1ebb41af865266d0cd2a

SHA-256 `9877e90da14aa8c931a1f9d07cc2a20ce119106e5dab1ebb41af865266d0cd2a` · 1118 original bytes.

Sources:

- `node_modules/update-browserslist-db/LICENSE`

```text
The MIT License (MIT)

Copyright 2022 Andrey Sitnik <andrey@sitnik.es> and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-98c970de440dcfc77471610aec2377c9d9b0db2b3be6d1add524a586e1d7f422

SHA-256 `98c970de440dcfc77471610aec2377c9d9b0db2b3be6d1add524a586e1d7f422` · 1107 original bytes.

Sources:

- `node_modules/@expo/devcert/node_modules/debug/LICENSE`
- `node_modules/compression/node_modules/debug/LICENSE`
- `node_modules/connect/node_modules/debug/LICENSE`
- `node_modules/finalhandler/node_modules/debug/LICENSE`
- `node_modules/lighthouse-logger/node_modules/debug/LICENSE`
- `node_modules/send/node_modules/debug/LICENSE`

```text
(The MIT License)

Copyright (c) 2014 TJ Holowaychuk <tj@vision-media.ca>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software
and associated documentation files (the 'Software'), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-98d226d560dfbb0a07a77c3654acc18ba6c87589c48cf00cb2a9855ad50fcd07

SHA-256 `98d226d560dfbb0a07a77c3654acc18ba6c87589c48cf00cb2a9855ad50fcd07` · 1088 original bytes.

Sources:

- `node_modules/@bcoe/v8-coverage/LICENSE.md`
- `node_modules/@bcoe/v8-coverage/dist/lib/LICENSE.md`

```text
The MIT License (MIT)

Copyright © 2015-2017 Charles Samborski

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-9913ff70f23424d49fda2b05902cfb72f17ae1e48aaf898c349a284289a74751

SHA-256 `9913ff70f23424d49fda2b05902cfb72f17ae1e48aaf898c349a284289a74751` · 1189 original bytes.

Sources:

- `node_modules/connect/LICENSE`

```text
(The MIT License)

Copyright (c) 2010 Sencha Inc.
Copyright (c) 2011 LearnBoost
Copyright (c) 2011-2014 TJ Holowaychuk
Copyright (c) 2015 Douglas Christopher Wilson

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-9a39f2aadab11a3697edd668ff2d8ad885b649737b7ab4d3bf12b34e5ada0c86

SHA-256 `9a39f2aadab11a3697edd668ff2d8ad885b649737b7ab4d3bf12b34e5ada0c86` · 1053 original bytes.

Sources:

- `node_modules/tinyglobby/node_modules/fdir/LICENSE`

```text
Copyright 2023 Abdullah Atta

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-9a9edad7baae52622bddf3c15b2ef8a33d2c89f2d25408ad13e8a7481c6b0c97

SHA-256 `9a9edad7baae52622bddf3c15b2ef8a33d2c89f2d25408ad13e8a7481c6b0c97` · 1104 original bytes.

Sources:

- `node_modules/escalade/license`

```text
MIT License

Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-9be2ec8089dfa4059a78e4e3e0443c416b2d63dedffb246c7473d0f3d763c6c4

SHA-256 `9be2ec8089dfa4059a78e4e3e0443c416b2d63dedffb246c7473d0f3d763c6c4` · 1179 original bytes.

Sources:

- `node_modules/stack-utils/LICENSE.md`

```text
The MIT License (MIT)

Copyright (c) 2016-2022 Isaac Z. Schlueter <i@izs.me>, James Talmage <james@talmage.io> (github.com/jamestalmage), and Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-9c63a23124d68cd30cd316a94a1a0bca34f032786df6df69fc4b5f136bac8d2e

SHA-256 `9c63a23124d68cd30cd316a94a1a0bca34f032786df6df69fc4b5f136bac8d2e` · 1144 original bytes.

Sources:

- `node_modules/brace-expansion/LICENSE`

```text
MIT License

Copyright Julian Gruber <julian@juliangruber.com>

TypeScript port Copyright Isaac Z. Schlueter <i@izs.me>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-9c94db23dc4b1e9aaee5d195668b916afc71efed54af226b66cf0ccc4389c1c0

SHA-256 `9c94db23dc4b1e9aaee5d195668b916afc71efed54af226b66cf0ccc4389c1c0` · 1095 original bytes.

Sources:

- `node_modules/ignore/LICENSE-MIT`

```text
Copyright (c) 2013 Kael Zhang <i@kael.me>, contributors
http://kael.me/

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-9ce8fc28ff49e651f98d6583b41ae1653dafaf6fc7444f3dfd13eb97451084bb

SHA-256 `9ce8fc28ff49e651f98d6583b41ae1653dafaf6fc7444f3dfd13eb97451084bb` · 1078 original bytes.

Sources:

- `node_modules/simple-plist/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2013 Joe Wollard

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-9d5211db733ccdd26f9170bec24cdca84093f60415da6b769ee9cdf23d04e19f

SHA-256 `9d5211db733ccdd26f9170bec24cdca84093f60415da6b769ee9cdf23d04e19f` · 1132 original bytes.

Sources:

- `node_modules/@jest/diff-sequences/LICENSE`
- `node_modules/@jest/get-type/LICENSE`
- `node_modules/@testing-library/react-native/node_modules/@jest/schemas/LICENSE`
- `node_modules/@testing-library/react-native/node_modules/pretty-format/LICENSE`
- `node_modules/jest-diff/LICENSE`
- `node_modules/jest-diff/node_modules/@jest/schemas/LICENSE`
- `node_modules/jest-diff/node_modules/pretty-format/LICENSE`
- `node_modules/jest-matcher-utils/LICENSE`
- `node_modules/jest-matcher-utils/node_modules/@jest/schemas/LICENSE`
- `node_modules/jest-matcher-utils/node_modules/pretty-format/LICENSE`

```text
MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.
Copyright Contributors to the Jest project.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-9d9cf7980a46628abcbcf88577ecaed2968b69f9123d6aaba6f9496ed3648c1a

SHA-256 `9d9cf7980a46628abcbcf88577ecaed2968b69f9123d6aaba6f9496ed3648c1a` · 1106 original bytes.

Sources:

- `node_modules/@expo/env/LICENSE`
- `node_modules/@expo/metro-config/node_modules/@expo/env/LICENSE`
- `node_modules/expo-constants/node_modules/@expo/env/LICENSE`
- `node_modules/expo/node_modules/@expo/env/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2023-present 650 Industries, Inc. (aka Expo)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-a07bc24468b9654ce76a547d47a2db282d07733b715db4c73a98bd63961f9550

SHA-256 `a07bc24468b9654ce76a547d47a2db282d07733b715db4c73a98bd63961f9550` · 1084 original bytes.

Sources:

- `node_modules/@istanbuljs/load-nyc-config/node_modules/js-yaml/LICENSE`
- `node_modules/js-yaml/LICENSE`

```text
(The MIT License)

Copyright (C) 2011-2015 by Vitaly Puzrin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-a0ec0dab16b3666f24950f86d257930ac2ad475557b4bfe245620e0817d8a45d

SHA-256 `a0ec0dab16b3666f24950f86d257930ac2ad475557b4bfe245620e0817d8a45d` · 1174 original bytes.

Sources:

- `node_modules/fresh/LICENSE`

```text
(The MIT License)

Copyright (c) 2012 TJ Holowaychuk <tj@vision-media.ca>
Copyright (c) 2016-2017 Douglas Christopher Wilson <doug@somethingdoug.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-a1bd5deadb6a06dd74efa852c1b8b23f63b67f2214fbe9c8bd591da51da69268

SHA-256 `a1bd5deadb6a06dd74efa852c1b8b23f63b67f2214fbe9c8bd591da51da69268` · 1096 original bytes.

Sources:

- `node_modules/@jest/reporters/node_modules/balanced-match/LICENSE.md`
- `node_modules/jest-config/node_modules/balanced-match/LICENSE.md`
- `node_modules/jest-runtime/node_modules/balanced-match/LICENSE.md`
- `node_modules/test-exclude/node_modules/balanced-match/LICENSE.md`

```text
(MIT)

Copyright (c) 2013 Julian Gruber &lt;julian@juliangruber.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-a49c9ba464796f65b59fca3f1e6ca40912df1e859f575383223f7ec6c5baae09

SHA-256 `a49c9ba464796f65b59fca3f1e6ca40912df1e859f575383223f7ec6c5baae09` · 1764 original bytes.

Sources:

- `node_modules/glob/LICENSE.md`

```text
All packages under `src/` are licensed according to the terms in
their respective `LICENSE` or `LICENSE.md` files.

The remainder of this project is licensed under the Blue Oak
Model License, as follows:

-----

# Blue Oak Model License

Version 1.0.0

## Purpose

This license gives everyone as much permission to work with
this software as possible, while protecting contributors
from liability.

## Acceptance

In order to receive this license, you must agree to its
rules.  The rules of this license are both obligations
under that agreement and conditions to your license.
You must not do anything with this software that triggers
a rule that you cannot or will not follow.

## Copyright

Each contributor licenses you to do everything with this
software that would otherwise infringe that contributor's
copyright in it.

## Notices

You must ensure that everyone who gets a copy of
any part of this software from you, with or without
changes, also gets the text of this license or a link to
<https://blueoakcouncil.org/license/1.0.0>.

## Excuse

If anyone notifies you in writing that you have not
complied with [Notices](#notices), you can keep your
license by taking all practical steps to comply within 30
days after the notice.  If you do not do so, your license
ends immediately.

## Patent

Each contributor licenses you to do everything with this
software that would otherwise infringe any patent claims
they can license or become able to license.

## Reliability

No contributor can revoke this license.

## No Liability

***As far as the law allows, this software comes as is,
without any warranty or condition, and no contributor
will be liable to anyone for any damages related to this
software or this license, under any kind of legal claim.***
```

### text-a4cdda44b5adea4731d53dcae78fb5124f8fd853e994f01e25d8c33a7daf818b

SHA-256 `a4cdda44b5adea4731d53dcae78fb5124f8fd853e994f01e25d8c33a7daf818b` · 1518 original bytes.

Sources:

- `node_modules/sprintf-js/LICENSE`

```text
Copyright (c) 2007-2014, Alexandru Marasteanu <hello [at) alexei (dot] ro>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
* Redistributions of source code must retain the above copyright
  notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright
  notice, this list of conditions and the following disclaimer in the
  documentation and/or other materials provided with the distribution.
* Neither the name of this software nor the names of its contributors may be
  used to endorse or promote products derived from this software without
  specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### text-a5416f6b586be51823285bc9a389bfd756eef80cfb7616ea90aaa11bae6189e1

SHA-256 `a5416f6b586be51823285bc9a389bfd756eef80cfb7616ea90aaa11bae6189e1` · 1115 original bytes.

Sources:

- `node_modules/@expo/vector-icons/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2015 Joel Arvidsson
Copyright (c) 2020 650 Industries

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-a62f9f2edd97ed0d92f0ef93584dd109a7d34299795abc7780b8b5a85ff00671

SHA-256 `a62f9f2edd97ed0d92f0ef93584dd109a7d34299795abc7780b8b5a85ff00671` · 1164 original bytes.

Sources:

- `node_modules/@testing-library/react-native/node_modules/@sinclair/typebox/license`
- `node_modules/jest-diff/node_modules/@sinclair/typebox/license`
- `node_modules/jest-matcher-utils/node_modules/@sinclair/typebox/license`

```text
TypeBox

Json Schema Type Builder with Static Type Resolution for TypeScript

The MIT License (MIT)

Copyright (c) 2017-2026 Haydn Paterson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-a6db8096b2707bc0102d256917d4d33f298ba36d8c3f25de067a2b5bb379db27

SHA-256 `a6db8096b2707bc0102d256917d4d33f298ba36d8c3f25de067a2b5bb379db27` · 1090 original bytes.

Sources:

- `node_modules/undici-types/LICENSE`

```text
MIT License

Copyright (c) Matteo Collina and Undici contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-a7996721249a136fbcfc1c201bcb5f414f38a701d4a24f28abe65e16cfcce813

SHA-256 `a7996721249a136fbcfc1c201bcb5f414f38a701d4a24f28abe65e16cfcce813` · 1094 original bytes.

Sources:

- `node_modules/etag/LICENSE`

```text
(The MIT License)

Copyright (c) 2014-2016 Douglas Christopher Wilson

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-a7d00bfd54525bc694b6e32f64c7ebcf5e6b7ae3657be5cc12767bce74654a47

SHA-256 `a7d00bfd54525bc694b6e32f64c7ebcf5e6b7ae3657be5cc12767bce74654a47` · 9197 original bytes.

Sources:

- `node_modules/typescript/LICENSE.txt`

```text
Apache License

Version 2.0, January 2004

http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

"License" shall mean the terms and conditions for use, reproduction, and distribution as defined by Sections 1 through 9 of this document.

"Licensor" shall mean the copyright owner or entity authorized by the copyright owner that is granting the License.

"Legal Entity" shall mean the union of the acting entity and all other entities that control, are controlled by, or are under common control with that entity. For the purposes of this definition, "control" means (i) the power, direct or indirect, to cause the direction or management of such entity, whether by contract or otherwise, or (ii) ownership of fifty percent (50%) or more of the outstanding shares, or (iii) beneficial ownership of such entity.

"You" (or "Your") shall mean an individual or Legal Entity exercising permissions granted by this License.

"Source" form shall mean the preferred form for making modifications, including but not limited to software source code, documentation source, and configuration files.

"Object" form shall mean any form resulting from mechanical transformation or translation of a Source form, including but not limited to compiled object code, generated documentation, and conversions to other media types.

"Work" shall mean the work of authorship, whether in Source or Object form, made available under the License, as indicated by a copyright notice that is included in or attached to the work (an example is provided in the Appendix below).

"Derivative Works" shall mean any work, whether in Source or Object form, that is based on (or derived from) the Work and for which the editorial revisions, annotations, elaborations, or other modifications represent, as a whole, an original work of authorship. For the purposes of this License, Derivative Works shall not include works that remain separable from, or merely link (or bind by name) to the interfaces of, the Work and Derivative Works thereof.

"Contribution" shall mean any work of authorship, including the original version of the Work and any modifications or additions to that Work or Derivative Works thereof, that is intentionally submitted to Licensor for inclusion in the Work by the copyright owner or by an individual or Legal Entity authorized to submit on behalf of the copyright owner. For the purposes of this definition, "submitted" means any form of electronic, verbal, or written communication sent to the Licensor or its representatives, including but not limited to communication on electronic mailing lists, source code control systems, and issue tracking systems that are managed by, or on behalf of, the Licensor for the purpose of discussing and improving the Work, but excluding communication that is conspicuously marked or otherwise designated in writing by the copyright owner as "Not a Contribution."

"Contributor" shall mean Licensor and any individual or Legal Entity on behalf of whom a Contribution has been received by Licensor and subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare Derivative Works of, publicly display, publicly perform, sublicense, and distribute the Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable (except as stated in this section) patent license to make, have made, use, offer to sell, sell, import, and otherwise transfer the Work, where such license applies only to those patent claims licensable by such Contributor that are necessarily infringed by their Contribution(s) alone or by combination of their Contribution(s) with the Work to which such Contribution(s) was submitted. If You institute patent litigation against any entity (including a cross-claim or counterclaim in a lawsuit) alleging that the Work or a Contribution incorporated within the Work constitutes direct or contributory patent infringement, then any patent licenses granted to You under this License for that Work shall terminate as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the Work or Derivative Works thereof in any medium, with or without modifications, and in Source or Object form, provided that You meet the following conditions:

You must give any other recipients of the Work or Derivative Works a copy of this License; and

You must cause any modified files to carry prominent notices stating that You changed the files; and

You must retain, in the Source form of any Derivative Works that You distribute, all copyright, patent, trademark, and attribution notices from the Source form of the Work, excluding those notices that do not pertain to any part of the Derivative Works; and

If the Work includes a "NOTICE" text file as part of its distribution, then any Derivative Works that You distribute must include a readable copy of the attribution notices contained within such NOTICE file, excluding those notices that do not pertain to any part of the Derivative Works, in at least one of the following places: within a NOTICE text file distributed as part of the Derivative Works; within the Source form or documentation, if provided along with the Derivative Works; or, within a display generated by the Derivative Works, if and wherever such third-party notices normally appear. The contents of the NOTICE file are for informational purposes only and do not modify the License. You may add Your own attribution notices within Derivative Works that You distribute, alongside or as an addendum to the NOTICE text from the Work, provided that such additional attribution notices cannot be construed as modifying the License. You may add Your own copyright statement to Your modifications and may provide additional or different license terms and conditions for use, reproduction, or distribution of Your modifications, or for any such Derivative Works as a whole, provided Your use, reproduction, and distribution of the Work otherwise complies with the conditions stated in this License.

5. Submission of Contributions. Unless You explicitly state otherwise, any Contribution intentionally submitted for inclusion in the Work by You to the Licensor shall be under the terms and conditions of this License, without any additional terms or conditions. Notwithstanding the above, nothing herein shall supersede or modify the terms of any separate license agreement you may have executed with Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade names, trademarks, service marks, or product names of the Licensor, except as required for reasonable and customary use in describing the origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or agreed to in writing, Licensor provides the Work (and each Contributor provides its Contributions) on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied, including, without limitation, any warranties or conditions of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A PARTICULAR PURPOSE. You are solely responsible for determining the appropriateness of using or redistributing the Work and assume any risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory, whether in tort (including negligence), contract, or otherwise, unless required by applicable law (such as deliberate and grossly negligent acts) or agreed to in writing, shall any Contributor be liable to You for damages, including any direct, indirect, special, incidental, or consequential damages of any character arising as a result of this License or out of the use or inability to use the Work (including but not limited to damages for loss of goodwill, work stoppage, computer failure or malfunction, or any and all other commercial damages or losses), even if such Contributor has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability. While redistributing the Work or Derivative Works thereof, You may choose to offer, and charge a fee for, acceptance of support, warranty, indemnity, or other liability obligations and/or rights consistent with this License. However, in accepting such obligations, You may act only on Your own behalf and on Your sole responsibility, not on behalf of any other Contributor, and only if You agree to indemnify, defend, and hold each Contributor harmless for any liability incurred by, or claims asserted against, such Contributor by reason of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS
```

### text-a832d679750e49ab433626ab196350b89964b60eb0d3edd3341887c7d5f4c128

SHA-256 `a832d679750e49ab433626ab196350b89964b60eb0d3edd3341887c7d5f4c128` · 1108 original bytes.

Sources:

- `node_modules/toidentifier/LICENSE`

```text
MIT License

Copyright (c) 2016 Douglas Christopher Wilson <doug@somethingdoug.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-a833d366242c298cf1b10263516572fb8dcbe68eb5072cdcac2b4546e2b4eb36

SHA-256 `a833d366242c298cf1b10263516572fb8dcbe68eb5072cdcac2b4546e2b4eb36` · 1145 original bytes.

Sources:

- `node_modules/fast-json-stable-stringify/LICENSE`

```text
This software is released under the MIT license:

Copyright (c) 2017 Evgeny Poberezkin
Copyright (c) 2013 James Halliday

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-a92e52eb1fa7cd746e3827bf01d3a3589bbc8e1e51348b1da042aad165525ad1

SHA-256 `a92e52eb1fa7cd746e3827bf01d3a3589bbc8e1e51348b1da042aad165525ad1` · 1099 original bytes.

Sources:

- `node_modules/require-directory/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2011 Troy Goode <troygoode@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-aaa78451b6fecd1b9c4594c796c133c0e90cad100372ff8bc6de615e9ef9adf1

SHA-256 `aaa78451b6fecd1b9c4594c796c133c0e90cad100372ff8bc6de615e9ef9adf1` · 1105 original bytes.

Sources:

- `node_modules/cross-spawn/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2018 Made With MOXY Lda <hello@moxy.studio>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-acf3b087b348d2f2e731b9d4131af185aad694c1204ce14a46909483fd42da05

SHA-256 `acf3b087b348d2f2e731b9d4131af185aad694c1204ce14a46909483fd42da05` · 1071 original bytes.

Sources:

- `node_modules/get-nonce/LICENSE`

```text
MIT License

Copyright (c) 2020 Anton Korzunov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-ade66f698fd417addc4d948a85ef33e8abb302daff6453feda18b191d250e54d

SHA-256 `ade66f698fd417addc4d948a85ef33e8abb302daff6453feda18b191d250e54d` · 1079 original bytes.

Sources:

- `node_modules/prompts/license`
- `node_modules/sisteransi/license`

```text
MIT License

Copyright (c) 2018 Terkel Gjervig Nielsen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-b09b9ccf866cc09b502d9cf4679e2461beb1469709ea0c6a30009766e10b3acf

SHA-256 `b09b9ccf866cc09b502d9cf4679e2461beb1469709ea0c6a30009766e10b3acf` · 1070 original bytes.

Sources:

- `node_modules/vaul/LICENSE.md`

```text
MIT License

Copyright (c) 2023 Emil Kowalski

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-b1c501095de70182748cb8e8d97ac5577701a4ef3b755ba30d59fd87b24bdb0f

SHA-256 `b1c501095de70182748cb8e8d97ac5577701a4ef3b755ba30d59fd87b24bdb0f` · 1073 original bytes.

Sources:

- `node_modules/memoize-one/LICENSE`

```text
MIT License

Copyright (c) 2019 Alexander Reardon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-b3e8623bbd73e4f964f9b5091c7b4c7e078fd760113890b8c1af951ab7921877

SHA-256 `b3e8623bbd73e4f964f9b5091c7b4c7e078fd760113890b8c1af951ab7921877` · 1071 original bytes.

Sources:

- `node_modules/pirates/LICENSE`

```text
MIT License

Copyright (c) 2016-2018 Ari Porad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-b40930bbcf80744c86c46a12bc9da056641d722716c378f5659b9e555ef833e1

SHA-256 `b40930bbcf80744c86c46a12bc9da056641d722716c378f5659b9e555ef833e1` · 11357 original bytes.

Sources:

- `node_modules/detect-libc/LICENSE`

```text
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "{}"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright {yyyy} {name of copyright owner}

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### text-b661867c1d66a1b71ee3a6109159874334cd5c182a80d1bcc7353b5a4c6823c6

SHA-256 `b661867c1d66a1b71ee3a6109159874334cd5c182a80d1bcc7353b5a4c6823c6` · 1483 original bytes.

Sources:

- `node_modules/istanbul-lib-source-maps/LICENSE`

```text
Copyright 2015 Yahoo! Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the Yahoo! Inc. nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL YAHOO! INC. BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### text-b6be1b6c4e8c0441448a70fc6517c8d1ad62ad6a614b1fd049f74aa86c8b9820

SHA-256 `b6be1b6c4e8c0441448a70fc6517c8d1ad62ad6a614b1fd049f74aa86c8b9820` · 1233 original bytes.

Sources:

- `node_modules/compressible/LICENSE`

```text
(The MIT License)

Copyright (c) 2013 Jonathan Ong <me@jongleberry.com>
Copyright (c) 2014 Jeremiah Senkpiel <fishrock123@rocketmail.com>
Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-b87653fff2d44426ab5cd4723cee3b1364dc8d35a0acdf098c54689543123bf8

SHA-256 `b87653fff2d44426ab5cd4723cee3b1364dc8d35a0acdf098c54689543123bf8` · 1134 original bytes.

Sources:

- `node_modules/core-js-compat/LICENSE`

```text
Copyright (c) 2013–2025 Denis Pushkarev (zloirock.ru)
Copyright (c) 2025–2026 CoreJS Company (core-js.io)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-b8778b155bfde5a28b023a558753c0fa058a52bb9de35c343c250be1bbcdedab

SHA-256 `b8778b155bfde5a28b023a558753c0fa058a52bb9de35c343c250be1bbcdedab` · 1079 original bytes.

Sources:

- `node_modules/@jridgewell/resolve-uri/LICENSE`

```text
Copyright 2019 Justin Ridgewell <jridgewell@google.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-bd134b41da59e452fb5a1d366b660886f741c87c2bf9428e93764c419fbc40f5

SHA-256 `bd134b41da59e452fb5a1d366b660886f741c87c2bf9428e93764c419fbc40f5` · 1094 original bytes.

Sources:

- `node_modules/depd/LICENSE`

```text
(The MIT License)

Copyright (c) 2014-2018 Douglas Christopher Wilson

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-bd47ce7b88c7759630d1e2b9fcfa170a0f1fde522be09e13fb1581a79d090400

SHA-256 `bd47ce7b88c7759630d1e2b9fcfa170a0f1fde522be09e13fb1581a79d090400` · 1094 original bytes.

Sources:

- `node_modules/vary/LICENSE`

```text
(The MIT License)

Copyright (c) 2014-2017 Douglas Christopher Wilson

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-be635b6249bf2e3a9ab088d9be654960253291042824b62dfcf5e955625dc6fe

SHA-256 `be635b6249bf2e3a9ab088d9be654960253291042824b62dfcf5e955625dc6fe` · 1636 original bytes.

Sources:

- `node_modules/@react-native/debugger-frontend/dist/third-party/LICENSE`

```text
// Copyright (c) Meta Platforms, Inc. and affiliates.
// Copyright 2014 The Chromium Authors. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//    * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//    * Neither the name of Google Inc., Meta Platforms, Inc., nor the
// names of its contributors may be used to endorse or promote products
// derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### text-bf9b0d665be2a689851eea667ca9f42066ea1d903b38349c51e6a44b2577680a

SHA-256 `bf9b0d665be2a689851eea667ca9f42066ea1d903b38349c51e6a44b2577680a` · 1083 original bytes.

Sources:

- `node_modules/hasown/LICENSE`

```text
MIT License

Copyright (c) Jordan Harband and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-c064f7a3e353bc1bc977f3c897941c75ef763f44f41677e0a15370ca0853d6e2

SHA-256 `c064f7a3e353bc1bc977f3c897941c75ef763f44f41677e0a15370ca0853d6e2` · 1085 original bytes.

Sources:

- `node_modules/color-name/LICENSE`
- `node_modules/log-symbols/node_modules/color-name/LICENSE`
- `node_modules/ora/node_modules/color-name/LICENSE`

```text
The MIT License (MIT)
Copyright (c) 2015 Dmitry Ivanov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-c1476ec53119cd4c8370f91f5152ac76312a29b4fae2d49b5e0e0970fe0fa5ee

SHA-256 `c1476ec53119cd4c8370f91f5152ac76312a29b4fae2d49b5e0e0970fe0fa5ee` · 733 original bytes.

Sources:

- `node_modules/hosted-git-info/LICENSE`

```text
Copyright (c) 2015, Rebecca Turner

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```

### text-c1e6e266563517467b1bf874817d23e426f3149252bd7d42758cd697514b8417

SHA-256 `c1e6e266563517467b1bf874817d23e426f3149252bd7d42758cd697514b8417` · 1070 original bytes.

Sources:

- `node_modules/zustand/LICENSE`

```text
MIT License

Copyright (c) 2019 Paul Henschel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383

SHA-256 `c2cfccb812fe482101a8f04597dfc5a9991a6b2748266c47ac91b6a5aae15383` · 1141 original bytes.

Sources:

- `node_modules/@types/babel__core/LICENSE`
- `node_modules/@types/babel__generator/LICENSE`
- `node_modules/@types/babel__template/LICENSE`
- `node_modules/@types/babel__traverse/LICENSE`
- `node_modules/@types/graceful-fs/LICENSE`
- `node_modules/@types/istanbul-lib-coverage/LICENSE`
- `node_modules/@types/istanbul-lib-report/LICENSE`
- `node_modules/@types/istanbul-reports/LICENSE`
- `node_modules/@types/node/LICENSE`
- `node_modules/@types/react-test-renderer/LICENSE`
- `node_modules/@types/react/LICENSE`
- `node_modules/@types/stack-utils/LICENSE`
- `node_modules/@types/yargs-parser/LICENSE`
- `node_modules/@types/yargs/LICENSE`

```text
    MIT License

    Copyright (c) Microsoft Corporation.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE
```

### text-c2ecf83f830f226f662c99d003162002c78edd8b59f1105621bdcc2c44043a7d

SHA-256 `c2ecf83f830f226f662c99d003162002c78edd8b59f1105621bdcc2c44043a7d` · 1143 original bytes.

Sources:

- `node_modules/whatwg-url-minimum/LICENSE.md`

```text
MIT License

Copyright (c) Phil Pluckthun,
Copyright (c) 650 Industries, Inc. (aka Expo),
Copyright (c) Sebastian Mayr

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-c358ea82eed53098b2ee0913e1de8243c69d45862e11c48614db47fd5889d947

SHA-256 `c358ea82eed53098b2ee0913e1de8243c69d45862e11c48614db47fd5889d947` · 11356 original bytes.

Sources:

- `node_modules/expo-router/vendor/react-helmet-async/LICENSE`

```text
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright 2018 The New York Times Company

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### text-c51452ef1dfd5606c9fe266930fa6bf7e8a534d52973b6475df5bf212cad5b0a

SHA-256 `c51452ef1dfd5606c9fe266930fa6bf7e8a534d52973b6475df5bf212cad5b0a` · 1079 original bytes.

Sources:

- `node_modules/xml2js/LICENSE`

```text
Copyright 2010, 2011, 2012, 2013. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
```

### text-c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4

SHA-256 `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` · 11357 original bytes.

Sources:

- `node_modules/baseline-browser-mapping/LICENSE.txt`

```text
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### text-c7cc929b57080f4b9d0c6cf57669f0463fc5b39906344dfc8d3bc43426b30eac

SHA-256 `c7cc929b57080f4b9d0c6cf57669f0463fc5b39906344dfc8d3bc43426b30eac` · 1081 original bytes.

Sources:

- `node_modules/safe-buffer/LICENSE`

```text
The MIT License (MIT)

Copyright (c) Feross Aboukhadijeh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-c8442419dc614089ea022b3da6bfc089b41a58fb7b9030d1e651f2f36189dce2

SHA-256 `c8442419dc614089ea022b3da6bfc089b41a58fb7b9030d1e651f2f36189dce2` · 1079 original bytes.

Sources:

- `node_modules/@istanbuljs/load-nyc-config/node_modules/argparse/LICENSE`

```text
(The MIT License)

Copyright (C) 2012 by Vitaly Puzrin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-c887d1c97797646dbb216925ab44a93c6b3e7f03bbe6ef6e0f92b8b8ade63014

SHA-256 `c887d1c97797646dbb216925ab44a93c6b3e7f03bbe6ef6e0f92b8b8ade63014` · 1061 original bytes.

Sources:

- `node_modules/whatwg-fetch/LICENSE`

```text
Copyright (c) 2014-2023 GitHub, Inc.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-cb992345949ccd6e8394b2cd6c465f7b897c864f845937dbf64e8997f389e164

SHA-256 `cb992345949ccd6e8394b2cd6c465f7b897c864f845937dbf64e8997f389e164` · 1260 original bytes.

Sources:

- `node_modules/css-select/LICENSE`
- `node_modules/css-what/LICENSE`
- `node_modules/domelementtype/LICENSE`
- `node_modules/domhandler/LICENSE`
- `node_modules/domutils/LICENSE`
- `node_modules/entities/LICENSE`
- `node_modules/nth-check/LICENSE`

```text
Copyright (c) Felix Böhm
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### text-cc06054a391f6b5dbcf6f142d2bb9d637db897746b0e6c58ed913834b581cae4

SHA-256 `cc06054a391f6b5dbcf6f142d2bb9d637db897746b0e6c58ed913834b581cae4` · 1070 original bytes.

Sources:

- `node_modules/babel-plugin-react-native-web/LICENSE`

```text
MIT License

Copyright (c) Nicolas Gallagher.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-cc1dfd4dafa27271e8212cd3b274eeb3f262e40a6fdab36ddc3f9696f706f58b

SHA-256 `cc1dfd4dafa27271e8212cd3b274eeb3f262e40a6fdab36ddc3f9696f706f58b` · 1172 original bytes.

Sources:

- `node_modules/expo/node_modules/mime-db/LICENSE`
- `node_modules/mime-db/LICENSE`

```text
(The MIT License)

Copyright (c) 2014 Jonathan Ong <me@jongleberry.com>
Copyright (c) 2015-2022 Douglas Christopher Wilson <doug@somethingdoug.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30

SHA-256 `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30` · 11358 original bytes.

Sources:

- `node_modules/xcode/LICENSE`

```text

                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### text-d0cd141b0c322fded5dfad1d4645bb2fedfc05b7321fe1009469638190d59ef9

SHA-256 `d0cd141b0c322fded5dfad1d4645bb2fedfc05b7321fe1009469638190d59ef9` · 1091 original bytes.

Sources:

- `node_modules/@expo/metro-config/node_modules/picomatch/LICENSE`
- `node_modules/expo/node_modules/picomatch/LICENSE`
- `node_modules/picomatch/LICENSE`
- `node_modules/tinyglobby/node_modules/picomatch/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2017-present, Jon Schlinkert.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-d34ff47ca7a39e9ee3987a03a42cce0af4f77ec280f06f3969e2c33ca350a899

SHA-256 `d34ff47ca7a39e9ee3987a03a42cce0af4f77ec280f06f3969e2c33ca350a899` · 1065 original bytes.

Sources:

- `node_modules/css-tree/LICENSE`

```text
Copyright (C) 2016-2019 by Roman Dvornov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-d408f38ffa3355c5faec517153295338892eb0f1ea43f57874bb23c6075979b5

SHA-256 `d408f38ffa3355c5faec517153295338892eb0f1ea43f57874bb23c6075979b5` · 1155 original bytes.

Sources:

- `node_modules/balanced-match/LICENSE.md`

```text
(MIT)

Original code Copyright Julian Gruber <julian@juliangruber.com>

Port to TypeScript Copyright Isaac Z. Schlueter <i@izs.me>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-d7d2a7786de7c7cfd96f920c6f12927d74e1d2a861ca4498bf465c3bc3f4c21c

SHA-256 `d7d2a7786de7c7cfd96f920c6f12927d74e1d2a861ca4498bf465c3bc3f4c21c` · 1098 original bytes.

Sources:

- `node_modules/progress/LICENSE`

```text
(The MIT License)

Copyright (c) 2017 TJ Holowaychuk <tj@vision-media.ca>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-d9bacb8be7c3a210dfe531bde8503eb567f51a8fdbfc438fcf7a171d7ab338d8

SHA-256 `d9bacb8be7c3a210dfe531bde8503eb567f51a8fdbfc438fcf7a171d7ab338d8` · 1090 original bytes.

Sources:

- `node_modules/bplist-creator/LICENSE`

```text
(The MIT License)

Copyright (c) 2012 Near Infinity Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy of this software
and associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-da4db1480d9beea3483a2eda5c53b22238d0827d57da162b48f122e04d2d9987

SHA-256 `da4db1480d9beea3483a2eda5c53b22238d0827d57da162b48f122e04d2d9987` · 1095 original bytes.

Sources:

- `node_modules/nanoid/LICENSE`

```text
The MIT License (MIT)

Copyright 2017 Andrey Sitnik <andrey@sitnik.ru>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93

SHA-256 `da6d3703ed11cbe42bd212c725957c98da23cbff1998c05fa4b3d976d1a58e93` · 1088 original bytes.

Sources:

- `node_modules/@expo/metro-config/node_modules/hermes-estree/LICENSE`
- `node_modules/@expo/metro-config/node_modules/hermes-parser/LICENSE`
- `node_modules/@jest/console/LICENSE`
- `node_modules/@jest/core/LICENSE`
- `node_modules/@jest/create-cache-key-function/LICENSE`
- `node_modules/@jest/environment/LICENSE`
- `node_modules/@jest/expect-utils/LICENSE`
- `node_modules/@jest/expect/LICENSE`
- `node_modules/@jest/fake-timers/LICENSE`
- `node_modules/@jest/globals/LICENSE`
- `node_modules/@jest/react-is-19/LICENSE`
- `node_modules/@jest/reporters/LICENSE`
- `node_modules/@jest/schemas/LICENSE`
- `node_modules/@jest/source-map/LICENSE`
- `node_modules/@jest/test-result/LICENSE`
- `node_modules/@jest/test-sequencer/LICENSE`
- `node_modules/@jest/transform/LICENSE`
- `node_modules/@jest/types/LICENSE`
- `node_modules/@react-native/codegen/node_modules/hermes-estree/LICENSE`
- `node_modules/@react-native/codegen/node_modules/hermes-parser/LICENSE`
- `node_modules/@react-native/metro-babel-transformer/node_modules/hermes-estree/LICENSE`
- `node_modules/@react-native/metro-babel-transformer/node_modules/hermes-parser/LICENSE`
- `node_modules/babel-jest/LICENSE`
- `node_modules/babel-plugin-jest-hoist/LICENSE`
- `node_modules/babel-plugin-syntax-hermes-parser/LICENSE`
- `node_modules/babel-plugin-syntax-hermes-parser/node_modules/hermes-estree/LICENSE`
- `node_modules/babel-plugin-syntax-hermes-parser/node_modules/hermes-parser/LICENSE`
- `node_modules/babel-preset-jest/LICENSE`
- `node_modules/create-jest/LICENSE`
- `node_modules/diff-sequences/LICENSE`
- `node_modules/expect/LICENSE`
- `node_modules/expect/node_modules/jest-diff/LICENSE`
- `node_modules/expect/node_modules/jest-matcher-utils/LICENSE`
- `node_modules/expo-router/node_modules/react-is/LICENSE`
- `node_modules/hermes-estree/LICENSE`
- `node_modules/hermes-parser/LICENSE`
- `node_modules/jest-changed-files/LICENSE`
- `node_modules/jest-circus/LICENSE`
- `node_modules/jest-circus/node_modules/jest-diff/LICENSE`
- `node_modules/jest-circus/node_modules/jest-matcher-utils/LICENSE`
- `node_modules/jest-cli/LICENSE`
- `node_modules/jest-config/LICENSE`
- `node_modules/jest-docblock/LICENSE`
- `node_modules/jest-each/LICENSE`
- `node_modules/jest-environment-node/LICENSE`
- `node_modules/jest-get-type/LICENSE`
- `node_modules/jest-haste-map/LICENSE`
- `node_modules/jest-leak-detector/LICENSE`
- `node_modules/jest-message-util/LICENSE`
- `node_modules/jest-mock/LICENSE`
- `node_modules/jest-regex-util/LICENSE`
- `node_modules/jest-resolve-dependencies/LICENSE`
- `node_modules/jest-resolve/LICENSE`
- `node_modules/jest-runner/LICENSE`
- `node_modules/jest-runtime/LICENSE`
- `node_modules/jest-snapshot/LICENSE`
- `node_modules/jest-snapshot/node_modules/jest-diff/LICENSE`
- `node_modules/jest-snapshot/node_modules/jest-matcher-utils/LICENSE`
- `node_modules/jest-util/LICENSE`
- `node_modules/jest-validate/LICENSE`
- `node_modules/jest-watcher/LICENSE`
- `node_modules/jest-worker/LICENSE`
- `node_modules/jest/LICENSE`
- `node_modules/pretty-format/LICENSE`
- `node_modules/react-dom/LICENSE`
- `node_modules/react-native/LICENSE`
- `node_modules/react-test-renderer/LICENSE`
- `node_modules/react-test-renderer/node_modules/react-is/LICENSE`
- `node_modules/react/LICENSE`
- `node_modules/scheduler/LICENSE`

```text
MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-dbbf03317f0101fed5643cd87ca80fb769e358fa4f428445bf2315deeb23a154

SHA-256 `dbbf03317f0101fed5643cd87ca80fb769e358fa4f428445bf2315deeb23a154` · 1071 original bytes.

Sources:

- `node_modules/abort-controller/LICENSE`

```text
MIT License

Copyright (c) 2017 Toru Nagashima

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-dc32a0dee275e0a9aeffbc974dbf4899a30dcdc2e5ffa8934aecb69261065864

SHA-256 `dc32a0dee275e0a9aeffbc974dbf4899a30dcdc2e5ffa8934aecb69261065864` · 742 original bytes.

Sources:

- `node_modules/proc-log/LICENSE`

```text
The ISC License

Copyright (c) GitHub, Inc.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-dc6d4961d8b6ee747231582ae9c53ce1d66bf76bc9f5a28f554c0e97210953bf

SHA-256 `dc6d4961d8b6ee747231582ae9c53ce1d66bf76bc9f5a28f554c0e97210953bf` · 765 original bytes.

Sources:

- `node_modules/@ungap/structured-clone/LICENSE`

```text
ISC License

Copyright (c) 2021, Andrea Giammarchi, @WebReflection

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```

### text-dcb94ff9b1e037a847bc20589dc81a1066d041fd4c16deb18b0fa968c66cf395

SHA-256 `dcb94ff9b1e037a847bc20589dc81a1066d041fd4c16deb18b0fa968c66cf395` · 1168 original bytes.

Sources:

- `node_modules/http-errors/LICENSE`

```text

The MIT License (MIT)

Copyright (c) 2014 Jonathan Ong me@jongleberry.com
Copyright (c) 2016 Douglas Christopher Wilson doug@somethingdoug.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-dd5f97aa25431e25fea6654f12f4ce167dc19b3148ab515cc271aa8efe6eb0be

SHA-256 `dd5f97aa25431e25fea6654f12f4ce167dc19b3148ab515cc271aa8efe6eb0be` · 1079 original bytes.

Sources:

- `node_modules/nullthrows/LICENSE`

```text
The MIT License (MIT)
Copyright (c) 2016 Andres Suarez

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-ddd64c9417c74998fe7d0bed6faaf7466bcbe4772bb2b52e7fc9815e33455921

SHA-256 `ddd64c9417c74998fe7d0bed6faaf7466bcbe4772bb2b52e7fc9815e33455921` · 1137 original bytes.

Sources:

- `node_modules/@expo/devcert/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2017 Dave Wasmer
Copyright (c) 2021-present 650 Industries, Inc. (aka Expo)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-dddddf170b975dc55422b4a7d852fb000b9088aea454730df07b36ebb40a8953

SHA-256 `dddddf170b975dc55422b4a7d852fb000b9088aea454730df07b36ebb40a8953` · 1095 original bytes.

Sources:

- `node_modules/babel-preset-current-node-syntax/LICENSE`

```text
MIT License

Copyright (c) 2020 Nicolò Ribaudo and other contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-de4d1f2d2ad5ad0cfd1657a106476b31cb5db5ef9d1ff842b237c0c81f0c8a23

SHA-256 `de4d1f2d2ad5ad0cfd1657a106476b31cb5db5ef9d1ff842b237c0c81f0c8a23` · 12775 original bytes.

Sources:

- `node_modules/argparse/LICENSE`

```text
A. HISTORY OF THE SOFTWARE
==========================

Python was created in the early 1990s by Guido van Rossum at Stichting
Mathematisch Centrum (CWI, see http://www.cwi.nl) in the Netherlands
as a successor of a language called ABC.  Guido remains Python's
principal author, although it includes many contributions from others.

In 1995, Guido continued his work on Python at the Corporation for
National Research Initiatives (CNRI, see http://www.cnri.reston.va.us)
in Reston, Virginia where he released several versions of the
software.

In May 2000, Guido and the Python core development team moved to
BeOpen.com to form the BeOpen PythonLabs team.  In October of the same
year, the PythonLabs team moved to Digital Creations, which became
Zope Corporation.  In 2001, the Python Software Foundation (PSF, see
https://www.python.org/psf/) was formed, a non-profit organization
created specifically to own Python-related Intellectual Property.
Zope Corporation was a sponsoring member of the PSF.

All Python releases are Open Source (see http://www.opensource.org for
the Open Source Definition).  Historically, most, but not all, Python
releases have also been GPL-compatible; the table below summarizes
the various releases.

    Release         Derived     Year        Owner       GPL-
                    from                                compatible? (1)

    0.9.0 thru 1.2              1991-1995   CWI         yes
    1.3 thru 1.5.2  1.2         1995-1999   CNRI        yes
    1.6             1.5.2       2000        CNRI        no
    2.0             1.6         2000        BeOpen.com  no
    1.6.1           1.6         2001        CNRI        yes (2)
    2.1             2.0+1.6.1   2001        PSF         no
    2.0.1           2.0+1.6.1   2001        PSF         yes
    2.1.1           2.1+2.0.1   2001        PSF         yes
    2.1.2           2.1.1       2002        PSF         yes
    2.1.3           2.1.2       2002        PSF         yes
    2.2 and above   2.1.1       2001-now    PSF         yes

Footnotes:

(1) GPL-compatible doesn't mean that we're distributing Python under
    the GPL.  All Python licenses, unlike the GPL, let you distribute
    a modified version without making your changes open source.  The
    GPL-compatible licenses make it possible to combine Python with
    other software that is released under the GPL; the others don't.

(2) According to Richard Stallman, 1.6.1 is not GPL-compatible,
    because its license has a choice of law clause.  According to
    CNRI, however, Stallman's lawyer has told CNRI's lawyer that 1.6.1
    is "not incompatible" with the GPL.

Thanks to the many outside volunteers who have worked under Guido's
direction to make these releases possible.


B. TERMS AND CONDITIONS FOR ACCESSING OR OTHERWISE USING PYTHON
===============================================================

PYTHON SOFTWARE FOUNDATION LICENSE VERSION 2
--------------------------------------------

1. This LICENSE AGREEMENT is between the Python Software Foundation
("PSF"), and the Individual or Organization ("Licensee") accessing and
otherwise using this software ("Python") in source or binary form and
its associated documentation.

2. Subject to the terms and conditions of this License Agreement, PSF hereby
grants Licensee a nonexclusive, royalty-free, world-wide license to reproduce,
analyze, test, perform and/or display publicly, prepare derivative works,
distribute, and otherwise use Python alone or in any derivative version,
provided, however, that PSF's License Agreement and PSF's notice of copyright,
i.e., "Copyright (c) 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010,
2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020 Python Software Foundation;
All Rights Reserved" are retained in Python alone or in any derivative version
prepared by Licensee.

3. In the event Licensee prepares a derivative work that is based on
or incorporates Python or any part thereof, and wants to make
the derivative work available to others as provided herein, then
Licensee hereby agrees to include in any such work a brief summary of
the changes made to Python.

4. PSF is making Python available to Licensee on an "AS IS"
basis.  PSF MAKES NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR
IMPLIED.  BY WAY OF EXAMPLE, BUT NOT LIMITATION, PSF MAKES NO AND
DISCLAIMS ANY REPRESENTATION OR WARRANTY OF MERCHANTABILITY OR FITNESS
FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF PYTHON WILL NOT
INFRINGE ANY THIRD PARTY RIGHTS.

5. PSF SHALL NOT BE LIABLE TO LICENSEE OR ANY OTHER USERS OF PYTHON
FOR ANY INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES OR LOSS AS
A RESULT OF MODIFYING, DISTRIBUTING, OR OTHERWISE USING PYTHON,
OR ANY DERIVATIVE THEREOF, EVEN IF ADVISED OF THE POSSIBILITY THEREOF.

6. This License Agreement will automatically terminate upon a material
breach of its terms and conditions.

7. Nothing in this License Agreement shall be deemed to create any
relationship of agency, partnership, or joint venture between PSF and
Licensee.  This License Agreement does not grant permission to use PSF
trademarks or trade name in a trademark sense to endorse or promote
products or services of Licensee, or any third party.

8. By copying, installing or otherwise using Python, Licensee
agrees to be bound by the terms and conditions of this License
Agreement.


BEOPEN.COM LICENSE AGREEMENT FOR PYTHON 2.0
-------------------------------------------

BEOPEN PYTHON OPEN SOURCE LICENSE AGREEMENT VERSION 1

1. This LICENSE AGREEMENT is between BeOpen.com ("BeOpen"), having an
office at 160 Saratoga Avenue, Santa Clara, CA 95051, and the
Individual or Organization ("Licensee") accessing and otherwise using
this software in source or binary form and its associated
documentation ("the Software").

2. Subject to the terms and conditions of this BeOpen Python License
Agreement, BeOpen hereby grants Licensee a non-exclusive,
royalty-free, world-wide license to reproduce, analyze, test, perform
and/or display publicly, prepare derivative works, distribute, and
otherwise use the Software alone or in any derivative version,
provided, however, that the BeOpen Python License is retained in the
Software, alone or in any derivative version prepared by Licensee.

3. BeOpen is making the Software available to Licensee on an "AS IS"
basis.  BEOPEN MAKES NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR
IMPLIED.  BY WAY OF EXAMPLE, BUT NOT LIMITATION, BEOPEN MAKES NO AND
DISCLAIMS ANY REPRESENTATION OR WARRANTY OF MERCHANTABILITY OR FITNESS
FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF THE SOFTWARE WILL NOT
INFRINGE ANY THIRD PARTY RIGHTS.

4. BEOPEN SHALL NOT BE LIABLE TO LICENSEE OR ANY OTHER USERS OF THE
SOFTWARE FOR ANY INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES OR LOSS
AS A RESULT OF USING, MODIFYING OR DISTRIBUTING THE SOFTWARE, OR ANY
DERIVATIVE THEREOF, EVEN IF ADVISED OF THE POSSIBILITY THEREOF.

5. This License Agreement will automatically terminate upon a material
breach of its terms and conditions.

6. This License Agreement shall be governed by and interpreted in all
respects by the law of the State of California, excluding conflict of
law provisions.  Nothing in this License Agreement shall be deemed to
create any relationship of agency, partnership, or joint venture
between BeOpen and Licensee.  This License Agreement does not grant
permission to use BeOpen trademarks or trade names in a trademark
sense to endorse or promote products or services of Licensee, or any
third party.  As an exception, the "BeOpen Python" logos available at
http://www.pythonlabs.com/logos.html may be used according to the
permissions granted on that web page.

7. By copying, installing or otherwise using the software, Licensee
agrees to be bound by the terms and conditions of this License
Agreement.


CNRI LICENSE AGREEMENT FOR PYTHON 1.6.1
---------------------------------------

1. This LICENSE AGREEMENT is between the Corporation for National
Research Initiatives, having an office at 1895 Preston White Drive,
Reston, VA 20191 ("CNRI"), and the Individual or Organization
("Licensee") accessing and otherwise using Python 1.6.1 software in
source or binary form and its associated documentation.

2. Subject to the terms and conditions of this License Agreement, CNRI
hereby grants Licensee a nonexclusive, royalty-free, world-wide
license to reproduce, analyze, test, perform and/or display publicly,
prepare derivative works, distribute, and otherwise use Python 1.6.1
alone or in any derivative version, provided, however, that CNRI's
License Agreement and CNRI's notice of copyright, i.e., "Copyright (c)
1995-2001 Corporation for National Research Initiatives; All Rights
Reserved" are retained in Python 1.6.1 alone or in any derivative
version prepared by Licensee.  Alternately, in lieu of CNRI's License
Agreement, Licensee may substitute the following text (omitting the
quotes): "Python 1.6.1 is made available subject to the terms and
conditions in CNRI's License Agreement.  This Agreement together with
Python 1.6.1 may be located on the Internet using the following
unique, persistent identifier (known as a handle): 1895.22/1013.  This
Agreement may also be obtained from a proxy server on the Internet
using the following URL: http://hdl.handle.net/1895.22/1013".

3. In the event Licensee prepares a derivative work that is based on
or incorporates Python 1.6.1 or any part thereof, and wants to make
the derivative work available to others as provided herein, then
Licensee hereby agrees to include in any such work a brief summary of
the changes made to Python 1.6.1.

4. CNRI is making Python 1.6.1 available to Licensee on an "AS IS"
basis.  CNRI MAKES NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR
IMPLIED.  BY WAY OF EXAMPLE, BUT NOT LIMITATION, CNRI MAKES NO AND
DISCLAIMS ANY REPRESENTATION OR WARRANTY OF MERCHANTABILITY OR FITNESS
FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF PYTHON 1.6.1 WILL NOT
INFRINGE ANY THIRD PARTY RIGHTS.

5. CNRI SHALL NOT BE LIABLE TO LICENSEE OR ANY OTHER USERS OF PYTHON
1.6.1 FOR ANY INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES OR LOSS AS
A RESULT OF MODIFYING, DISTRIBUTING, OR OTHERWISE USING PYTHON 1.6.1,
OR ANY DERIVATIVE THEREOF, EVEN IF ADVISED OF THE POSSIBILITY THEREOF.

6. This License Agreement will automatically terminate upon a material
breach of its terms and conditions.

7. This License Agreement shall be governed by the federal
intellectual property law of the United States, including without
limitation the federal copyright law, and, to the extent such
U.S. federal law does not apply, by the law of the Commonwealth of
Virginia, excluding Virginia's conflict of law provisions.
Notwithstanding the foregoing, with regard to derivative works based
on Python 1.6.1 that incorporate non-separable material that was
previously distributed under the GNU General Public License (GPL), the
law of the Commonwealth of Virginia shall govern this License
Agreement only as to issues arising under or with respect to
Paragraphs 4, 5, and 7 of this License Agreement.  Nothing in this
License Agreement shall be deemed to create any relationship of
agency, partnership, or joint venture between CNRI and Licensee.  This
License Agreement does not grant permission to use CNRI trademarks or
trade name in a trademark sense to endorse or promote products or
services of Licensee, or any third party.

8. By clicking on the "ACCEPT" button where indicated, or by copying,
installing or otherwise using Python 1.6.1, Licensee agrees to be
bound by the terms and conditions of this License Agreement.

        ACCEPT


CWI LICENSE AGREEMENT FOR PYTHON 0.9.0 THROUGH 1.2
--------------------------------------------------

Copyright (c) 1991 - 1995, Stichting Mathematisch Centrum Amsterdam,
The Netherlands.  All rights reserved.

Permission to use, copy, modify, and distribute this software and its
documentation for any purpose and without fee is hereby granted,
provided that the above copyright notice appear in all copies and that
both that copyright notice and this permission notice appear in
supporting documentation, and that the name of Stichting Mathematisch
Centrum or CWI not be used in advertising or publicity pertaining to
distribution of the software without specific, written prior
permission.

STICHTING MATHEMATISCH CENTRUM DISCLAIMS ALL WARRANTIES WITH REGARD TO
THIS SOFTWARE, INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS, IN NO EVENT SHALL STICHTING MATHEMATISCH CENTRUM BE LIABLE
FOR ANY SPECIAL, INDIRECT OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT
OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-df408d2e27f1df207f97556db32aba3921883ebce365ada1c354d89ad3114a96

SHA-256 `df408d2e27f1df207f97556db32aba3921883ebce365ada1c354d89ad3114a96` · 1101 original bytes.

Sources:

- `node_modules/getenv/LICENSE.md`

```text
The MIT License (MIT)
Copyright (c) 2012-2019 Christoph Tavan <dev@tavan.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-e05b1eaf5b5f99b7ad75cd1f38858ff9a311780b97715ead67936d60bf96aa7e

SHA-256 `e05b1eaf5b5f99b7ad75cd1f38858ff9a311780b97715ead67936d60bf96aa7e` · 748 original bytes.

Sources:

- `node_modules/signal-exit/LICENSE.txt`

```text
The ISC License

Copyright (c) 2015, Contributors

Permission to use, copy, modify, and/or distribute this software
for any purpose with or without fee is hereby granted, provided
that the above copyright notice and this permission notice
appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE
LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES
OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-e09f9b52c6ce5c17ba8103cd0cbf446c33b5448b0c1d01d711b36a1f15a501ba

SHA-256 `e09f9b52c6ce5c17ba8103cd0cbf446c33b5448b0c1d01d711b36a1f15a501ba` · 1488 original bytes.

Sources:

- `node_modules/@jest/reporters/node_modules/istanbul-lib-instrument/LICENSE`
- `node_modules/istanbul-lib-coverage/LICENSE`
- `node_modules/istanbul-lib-instrument/LICENSE`
- `node_modules/istanbul-lib-report/LICENSE`
- `node_modules/istanbul-reports/LICENSE`

```text
Copyright 2012-2015 Yahoo! Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the Yahoo! Inc. nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL YAHOO! INC. BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### text-e1898814043cb5500483d9c8517edda824b352f696d35e5043fcfb537c221531

SHA-256 `e1898814043cb5500483d9c8517edda824b352f696d35e5043fcfb537c221531` · 1076 original bytes.

Sources:

- `node_modules/stacktrace-parser/LICENSE`

```text
MIT License

Copyright (c) 2014-2019 Georg Tavonius

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-e21b0992cd8a2e8bf3e5f2f1b392daccab5d27386fcf2bc25e336c4161b5d1f9

SHA-256 `e21b0992cd8a2e8bf3e5f2f1b392daccab5d27386fcf2bc25e336c4161b5d1f9` · 1058 original bytes.

Sources:

- `node_modules/throat/LICENSE`

```text
Copyright (c) 2013 Forbes Lindesay

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-e368bc4263b466cf98c225af15e300549e00da8859416a4536109e9654d434a8

SHA-256 `e368bc4263b466cf98c225af15e300549e00da8859416a4536109e9654d434a8` · 1101 original bytes.

Sources:

- `node_modules/xml2js/node_modules/xmlbuilder/LICENSE`
- `node_modules/xmlbuilder/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2013 Ozgur Ozcitak

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-e3a956681ee067f971ac413994171b3d90ca801ec6324e76c9c55366cfe31cb0

SHA-256 `e3a956681ee067f971ac413994171b3d90ca801ec6324e76c9c55366cfe31cb0` · 1075 original bytes.

Sources:

- `node_modules/gensync/LICENSE`

```text
Copyright 2018 Logan Smyth <loganfsmyth@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-e3b44af066615de2ea48d18d852d0762f18c0b2efcea714fa48a6f729d405b85

SHA-256 `e3b44af066615de2ea48d18d852d0762f18c0b2efcea714fa48a6f729d405b85` · 1153 original bytes.

Sources:

- `node_modules/bytes/LICENSE`

```text
(The MIT License)

Copyright (c) 2012-2014 TJ Holowaychuk <tj@vision-media.ca>
Copyright (c) 2015 Jed Watson <jed.watson@me.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-e5aee0714b6ecc416454b968d1017570ef609f20d8722ab84b07acd550b78198

SHA-256 `e5aee0714b6ecc416454b968d1017570ef609f20d8722ab84b07acd550b78198` · 1109 original bytes.

Sources:

- `node_modules/type-detect/LICENSE`

```text
Copyright (c) 2013 Jake Luer <jake@alogicalparadox.com> (http://alogicalparadox.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-e6fdf7ac2af533b4436d99aa75df32aa78690510f7d68a3e73e8576967298d2f

SHA-256 `e6fdf7ac2af533b4436d99aa75df32aa78690510f7d68a3e73e8576967298d2f` · 1125 original bytes.

Sources:

- `node_modules/strict-uri-encode/license`

```text
The MIT License (MIT)

Copyright (c) Kevin Martensson <kevinmartensson@gmail.com> (github.com/kevva)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-e70ff771504ba41f2be55de812a017ff46433d7a250c862e38fc419159e44500

SHA-256 `e70ff771504ba41f2be55de812a017ff46433d7a250c862e38fc419159e44500` · 1088 original bytes.

Sources:

- `node_modules/normalize-path/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2014-2018, Jon Schlinkert.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-e7d1fee7347ffddccc5fd03327ffdb50f8c112be0d5016d62388a92c4ae6e7a9

SHA-256 `e7d1fee7347ffddccc5fd03327ffdb50f8c112be0d5016d62388a92c4ae6e7a9` · 1091 original bytes.

Sources:

- `node_modules/to-regex-range/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2015-present, Jon Schlinkert.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-e80373b1ed0f33cecc47173b4b0c6afe0d0318b32dbd84116a1a957e3f7f43a8

SHA-256 `e80373b1ed0f33cecc47173b4b0c6afe0d0318b32dbd84116a1a957e3f7f43a8` · 1083 original bytes.

Sources:

- `node_modules/asap/LICENSE.md`

```text

Copyright 2009–2014 Contributors. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
```

### text-e9b0e94f628e00b5ed98046cfa041696ff89eebbbdd54108ee350625bc6d0363

SHA-256 `e9b0e94f628e00b5ed98046cfa041696ff89eebbbdd54108ee350625bc6d0363` · 1234 original bytes.

Sources:

- `node_modules/big-integer/LICENSE`

```text
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org>
```

### text-e9d6a94ab01c6c9ab68c099d3ba8dd9f8aca60f2e2250c2302275405fca9e806

SHA-256 `e9d6a94ab01c6c9ab68c099d3ba8dd9f8aca60f2e2250c2302275405fca9e806` · 1071 original bytes.

Sources:

- `node_modules/pure-rand/LICENSE`

```text
MIT License

Copyright (c) 2018 Nicolas DUBIEN

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-ea7f376fe7a1fc28572b83ac8f806d92effb31852b9981bc9ba9d5266caa6b28

SHA-256 `ea7f376fe7a1fc28572b83ac8f806d92effb31852b9981bc9ba9d5266caa6b28` · 734 original bytes.

Sources:

- `node_modules/write-file-atomic/LICENSE.md`

```text
Copyright (c) 2015, Rebecca Turner

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-ed7a9a0f74e43951b2520efe1a4349cb9ed5f3dff0b0f268e2e51a4d38df7ea4

SHA-256 `ed7a9a0f74e43951b2520efe1a4349cb9ed5f3dff0b0f268e2e51a4d38df7ea4` · 1139 original bytes.

Sources:

- `node_modules/decode-uri-component/license`

```text
The MIT License (MIT)

Copyright (c) 2017, Sam Verschueren <sam.verschueren@gmail.com> (github.com/SamVerschueren)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-efd6f9e708b909de1a18730b90fb6394a3125680ac2f98a87cd23d1a0c93afa2

SHA-256 `efd6f9e708b909de1a18730b90fb6394a3125680ac2f98a87cd23d1a0c93afa2` · 1499 original bytes.

Sources:

- `node_modules/makeerror/license`
- `node_modules/tmpl/license`

```text
BSD License

Copyright (c) 2014, Naitik Shah. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

 * Neither the name Naitik Shah nor the names of its contributors may be used to
   endorse or promote products derived from this software without specific
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### text-f1ae22eddd3a96c3b7b8a494ef03749ae6a1e19574bacc9c195d83c916de09e2

SHA-256 `f1ae22eddd3a96c3b7b8a494ef03749ae6a1e19574bacc9c195d83c916de09e2` · 1099 original bytes.

Sources:

- `node_modules/react-native-gesture-handler/LICENSE`
- `node_modules/react-native-reanimated/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2016 Software Mansion <swmansion.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-f1d42ae4dd4e847f03e57241ab62538f35580ce533acf1d8274426283b01151c

SHA-256 `f1d42ae4dd4e847f03e57241ab62538f35580ce533acf1d8274426283b01151c` · 10892 original bytes.

Sources:

- `node_modules/marky/LICENSE`

```text
Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

    "License" shall mean the terms and conditions for use, reproduction, and
    distribution as defined by Sections 1 through 9 of this document.

    "Licensor" shall mean the copyright owner or entity authorized by the
    copyright owner that is granting the License.

    "Legal Entity" shall mean the union of the acting entity and all other
    entities that control, are controlled by, or are under common control with
    that entity. For the purposes of this definition, "control" means (i) the
    power, direct or indirect, to cause the direction or management of such
    entity, whether by contract or otherwise, or (ii) ownership of
    fifty percent (50%) or more of the outstanding shares, or (iii) beneficial
    ownership of such entity.

    "You" (or "Your") shall mean an individual or Legal Entity exercising
    permissions granted by this License.

    "Source" form shall mean the preferred form for making modifications,
    including but not limited to software source code, documentation source,
    and configuration files.

    "Object" form shall mean any form resulting from mechanical transformation
    or translation of a Source form, including but not limited to compiled
    object code, generated documentation, and conversions to
    other media types.

    "Work" shall mean the work of authorship, whether in Source or Object
    form, made available under the License, as indicated by a copyright notice
    that is included in or attached to the work (an example is provided in the
    Appendix below).

    "Derivative Works" shall mean any work, whether in Source or Object form,
    that is based on (or derived from) the Work and for which the editorial
    revisions, annotations, elaborations, or other modifications represent,
    as a whole, an original work of authorship. For the purposes of this
    License, Derivative Works shall not include works that remain separable
    from, or merely link (or bind by name) to the interfaces of, the Work and
    Derivative Works thereof.

    "Contribution" shall mean any work of authorship, including the original
    version of the Work and any modifications or additions to that Work or
    Derivative Works thereof, that is intentionally submitted to Licensor for
    inclusion in the Work by the copyright owner or by an individual or
    Legal Entity authorized to submit on behalf of the copyright owner.
    For the purposes of this definition, "submitted" means any form of
    electronic, verbal, or written communication sent to the Licensor or its
    representatives, including but not limited to communication on electronic
    mailing lists, source code control systems, and issue tracking systems
    that are managed by, or on behalf of, the Licensor for the purpose of
    discussing and improving the Work, but excluding communication that is
    conspicuously marked or otherwise designated in writing by the copyright
    owner as "Not a Contribution."

    "Contributor" shall mean Licensor and any individual or Legal Entity on
    behalf of whom a Contribution has been received by Licensor and
    subsequently incorporated within the Work.

2. Grant of Copyright License.

    Subject to the terms and conditions of this License, each Contributor
    hereby grants to You a perpetual, worldwide, non-exclusive, no-charge,
    royalty-free, irrevocable copyright license to reproduce, prepare
    Derivative Works of, publicly display, publicly perform, sublicense,
    and distribute the Work and such Derivative Works in
    Source or Object form.

3. Grant of Patent License.

    Subject to the terms and conditions of this License, each Contributor
    hereby grants to You a perpetual, worldwide, non-exclusive, no-charge,
    royalty-free, irrevocable (except as stated in this section) patent
    license to make, have made, use, offer to sell, sell, import, and
    otherwise transfer the Work, where such license applies only to those
    patent claims licensable by such Contributor that are necessarily
    infringed by their Contribution(s) alone or by combination of their
    Contribution(s) with the Work to which such Contribution(s) was submitted.
    If You institute patent litigation against any entity (including a
    cross-claim or counterclaim in a lawsuit) alleging that the Work or a
    Contribution incorporated within the Work constitutes direct or
    contributory patent infringement, then any patent licenses granted to
    You under this License for that Work shall terminate as of the date such
    litigation is filed.

4. Redistribution.

    You may reproduce and distribute copies of the Work or Derivative Works
    thereof in any medium, with or without modifications, and in Source or
    Object form, provided that You meet the following conditions:

    1. You must give any other recipients of the Work or Derivative Works a
    copy of this License; and

    2. You must cause any modified files to carry prominent notices stating
    that You changed the files; and

    3. You must retain, in the Source form of any Derivative Works that You
    distribute, all copyright, patent, trademark, and attribution notices from
    the Source form of the Work, excluding those notices that do not pertain
    to any part of the Derivative Works; and

    4. If the Work includes a "NOTICE" text file as part of its distribution,
    then any Derivative Works that You distribute must include a readable copy
    of the attribution notices contained within such NOTICE file, excluding
    those notices that do not pertain to any part of the Derivative Works,
    in at least one of the following places: within a NOTICE text file
    distributed as part of the Derivative Works; within the Source form or
    documentation, if provided along with the Derivative Works; or, within a
    display generated by the Derivative Works, if and wherever such
    third-party notices normally appear. The contents of the NOTICE file are
    for informational purposes only and do not modify the License.
    You may add Your own attribution notices within Derivative Works that You
    distribute, alongside or as an addendum to the NOTICE text from the Work,
    provided that such additional attribution notices cannot be construed
    as modifying the License.

    You may add Your own copyright statement to Your modifications and may
    provide additional or different license terms and conditions for use,
    reproduction, or distribution of Your modifications, or for any such
    Derivative Works as a whole, provided Your use, reproduction, and
    distribution of the Work otherwise complies with the conditions
    stated in this License.

5. Submission of Contributions.

    Unless You explicitly state otherwise, any Contribution intentionally
    submitted for inclusion in the Work by You to the Licensor shall be under
    the terms and conditions of this License, without any additional
    terms or conditions. Notwithstanding the above, nothing herein shall
    supersede or modify the terms of any separate license agreement you may
    have executed with Licensor regarding such Contributions.

6. Trademarks.

    This License does not grant permission to use the trade names, trademarks,
    service marks, or product names of the Licensor, except as required for
    reasonable and customary use in describing the origin of the Work and
    reproducing the content of the NOTICE file.

7. Disclaimer of Warranty.

    Unless required by applicable law or agreed to in writing, Licensor
    provides the Work (and each Contributor provides its Contributions)
    on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
    either express or implied, including, without limitation, any warranties
    or conditions of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS
    FOR A PARTICULAR PURPOSE. You are solely responsible for determining the
    appropriateness of using or redistributing the Work and assume any risks
    associated with Your exercise of permissions under this License.

8. Limitation of Liability.

    In no event and under no legal theory, whether in tort
    (including negligence), contract, or otherwise, unless required by
    applicable law (such as deliberate and grossly negligent acts) or agreed
    to in writing, shall any Contributor be liable to You for damages,
    including any direct, indirect, special, incidental, or consequential
    damages of any character arising as a result of this License or out of
    the use or inability to use the Work (including but not limited to damages
    for loss of goodwill, work stoppage, computer failure or malfunction,
    or any and all other commercial damages or losses), even if such
    Contributor has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability.

    While redistributing the Work or Derivative Works thereof, You may choose
    to offer, and charge a fee for, acceptance of support, warranty,
    indemnity, or other liability obligations and/or rights consistent with
    this License. However, in accepting such obligations, You may act only
    on Your own behalf and on Your sole responsibility, not on behalf of any
    other Contributor, and only if You agree to indemnify, defend, and hold
    each Contributor harmless for any liability incurred by, or claims
    asserted against, such Contributor by reason of your accepting any such
    warranty or additional liability.

END OF TERMS AND CONDITIONS

APPENDIX: How to apply the Apache License to your work

    To apply the Apache License to your work, attach the following boilerplate
    notice, with the fields enclosed by brackets "[]" replaced with your own
    identifying information. (Don't include the brackets!) The text should be
    enclosed in the appropriate comment syntax for the file format. We also
    recommend that a file or class name and description of purpose be included
    on the same "printed page" as the copyright notice for easier
    identification within third-party archives.

        Copyright 2016 Nolan Lawson


        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
        or implied. See the License for the specific language governing
        permissions and limitations under the License.
```

### text-f3e1645267f7dd77ee6545283cc1766e5883e8fb3b5088fe2cfb995defbb3dde

SHA-256 `f3e1645267f7dd77ee6545283cc1766e5883e8fb3b5088fe2cfb995defbb3dde` · 728 original bytes.

Sources:

- `node_modules/validate-npm-package-name/LICENSE`

```text
Copyright (c) 2015, npm, Inc


Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-f58943cb354fb2707fea2f7b26b04e6014ddb56835cdfd414c9d2c6c59165b64

SHA-256 `f58943cb354fb2707fea2f7b26b04e6014ddb56835cdfd414c9d2c6c59165b64` · 1086 original bytes.

Sources:

- `node_modules/@jest/core/node_modules/ci-info/LICENSE`
- `node_modules/expo/node_modules/ci-info/LICENSE`
- `node_modules/jest-config/node_modules/ci-info/LICENSE`
- `node_modules/jest-util/node_modules/ci-info/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2016 Thomas Watson Steen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-f5afc95c69e116ea6b1755f91a8763f53eadb78b4f1582a08d2d18586a03a117

SHA-256 `f5afc95c69e116ea6b1755f91a8763f53eadb78b4f1582a08d2d18586a03a117` · 11351 original bytes.

Sources:

- `node_modules/exponential-backoff/LICENSE`

```text

                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright 2019 Coveo Solutions Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### text-f5c7a4d527258e11fdfe3d84eb73cd14fe6d64224ef051e59f6ee21fe378800c

SHA-256 `f5c7a4d527258e11fdfe3d84eb73cd14fe6d64224ef051e59f6ee21fe378800c` · 1067 original bytes.

Sources:

- `node_modules/react-native-safe-area-context/LICENSE`

```text
MIT License

Copyright (c) 2019 Th3rd Wave

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-f63ff0e4e239244aa79280da2dd4811a0469e5e201caf5cbc0d97c3a1dff8e82

SHA-256 `f63ff0e4e239244aa79280da2dd4811a0469e5e201caf5cbc0d97c3a1dff8e82` · 17972 original bytes.

Sources:

- `node_modules/node-forge/LICENSE`

```text
You may use the Forge project under the terms of either the BSD License or the
GNU General Public License (GPL) Version 2.

The BSD License is recommended for most projects. It is simple and easy to
understand and it places almost no restrictions on what you can do with the
Forge project.

If the GPL suits your project better you are also free to use Forge under
that license.

You don't have to do anything special to choose one license or the other and
you don't have to notify anyone which license you are using. You are free to
use this project in commercial projects as long as the copyright header is
left intact.

If you are a commercial entity and use this set of libraries in your
commercial software then reasonable payment to Digital Bazaar, if you can
afford it, is not required but is expected and would be appreciated. If this
library saves you time, then it's saving you money. The cost of developing
the Forge software was on the order of several hundred hours and tens of
thousands of dollars. We are attempting to strike a balance between helping
the development community while not being taken advantage of by lucrative
commercial entities for our efforts.

-------------------------------------------------------------------------------
New BSD License (3-clause)
Copyright (c) 2010, Digital Bazaar, Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of Digital Bazaar, Inc. nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL DIGITAL BAZAAR BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

-------------------------------------------------------------------------------
        GNU GENERAL PUBLIC LICENSE
           Version 2, June 1991

 Copyright (C) 1989, 1991 Free Software Foundation, Inc.
 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

          Preamble

  The licenses for most software are designed to take away your
freedom to share and change it.  By contrast, the GNU General Public
License is intended to guarantee your freedom to share and change free
software--to make sure the software is free for all its users.  This
General Public License applies to most of the Free Software
Foundation's software and to any other program whose authors commit to
using it.  (Some other Free Software Foundation software is covered by
the GNU Lesser General Public License instead.)  You can apply it to
your programs, too.

  When we speak of free software, we are referring to freedom, not
price.  Our General Public Licenses are designed to make sure that you
have the freedom to distribute copies of free software (and charge for
this service if you wish), that you receive source code or can get it
if you want it, that you can change the software or use pieces of it
in new free programs; and that you know you can do these things.

  To protect your rights, we need to make restrictions that forbid
anyone to deny you these rights or to ask you to surrender the rights.
These restrictions translate to certain responsibilities for you if you
distribute copies of the software, or if you modify it.

  For example, if you distribute copies of such a program, whether
gratis or for a fee, you must give the recipients all the rights that
you have.  You must make sure that they, too, receive or can get the
source code.  And you must show them these terms so they know their
rights.

  We protect your rights with two steps: (1) copyright the software, and
(2) offer you this license which gives you legal permission to copy,
distribute and/or modify the software.

  Also, for each author's protection and ours, we want to make certain
that everyone understands that there is no warranty for this free
software.  If the software is modified by someone else and passed on, we
want its recipients to know that what they have is not the original, so
that any problems introduced by others will not reflect on the original
authors' reputations.

  Finally, any free program is threatened constantly by software
patents.  We wish to avoid the danger that redistributors of a free
program will individually obtain patent licenses, in effect making the
program proprietary.  To prevent this, we have made it clear that any
patent must be licensed for everyone's free use or not licensed at all.

  The precise terms and conditions for copying, distribution and
modification follow.

        GNU GENERAL PUBLIC LICENSE
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

  0. This License applies to any program or other work which contains
a notice placed by the copyright holder saying it may be distributed
under the terms of this General Public License.  The "Program", below,
refers to any such program or work, and a "work based on the Program"
means either the Program or any derivative work under copyright law:
that is to say, a work containing the Program or a portion of it,
either verbatim or with modifications and/or translated into another
language.  (Hereinafter, translation is included without limitation in
the term "modification".)  Each licensee is addressed as "you".

Activities other than copying, distribution and modification are not
covered by this License; they are outside its scope.  The act of
running the Program is not restricted, and the output from the Program
is covered only if its contents constitute a work based on the
Program (independent of having been made by running the Program).
Whether that is true depends on what the Program does.

  1. You may copy and distribute verbatim copies of the Program's
source code as you receive it, in any medium, provided that you
conspicuously and appropriately publish on each copy an appropriate
copyright notice and disclaimer of warranty; keep intact all the
notices that refer to this License and to the absence of any warranty;
and give any other recipients of the Program a copy of this License
along with the Program.

You may charge a fee for the physical act of transferring a copy, and
you may at your option offer warranty protection in exchange for a fee.

  2. You may modify your copy or copies of the Program or any portion
of it, thus forming a work based on the Program, and copy and
distribute such modifications or work under the terms of Section 1
above, provided that you also meet all of these conditions:

    a) You must cause the modified files to carry prominent notices
    stating that you changed the files and the date of any change.

    b) You must cause any work that you distribute or publish, that in
    whole or in part contains or is derived from the Program or any
    part thereof, to be licensed as a whole at no charge to all third
    parties under the terms of this License.

    c) If the modified program normally reads commands interactively
    when run, you must cause it, when started running for such
    interactive use in the most ordinary way, to print or display an
    announcement including an appropriate copyright notice and a
    notice that there is no warranty (or else, saying that you provide
    a warranty) and that users may redistribute the program under
    these conditions, and telling the user how to view a copy of this
    License.  (Exception: if the Program itself is interactive but
    does not normally print such an announcement, your work based on
    the Program is not required to print an announcement.)

These requirements apply to the modified work as a whole.  If
identifiable sections of that work are not derived from the Program,
and can be reasonably considered independent and separate works in
themselves, then this License, and its terms, do not apply to those
sections when you distribute them as separate works.  But when you
distribute the same sections as part of a whole which is a work based
on the Program, the distribution of the whole must be on the terms of
this License, whose permissions for other licensees extend to the
entire whole, and thus to each and every part regardless of who wrote it.

Thus, it is not the intent of this section to claim rights or contest
your rights to work written entirely by you; rather, the intent is to
exercise the right to control the distribution of derivative or
collective works based on the Program.

In addition, mere aggregation of another work not based on the Program
with the Program (or with a work based on the Program) on a volume of
a storage or distribution medium does not bring the other work under
the scope of this License.

  3. You may copy and distribute the Program (or a work based on it,
under Section 2) in object code or executable form under the terms of
Sections 1 and 2 above provided that you also do one of the following:

    a) Accompany it with the complete corresponding machine-readable
    source code, which must be distributed under the terms of Sections
    1 and 2 above on a medium customarily used for software interchange; or,

    b) Accompany it with a written offer, valid for at least three
    years, to give any third party, for a charge no more than your
    cost of physically performing source distribution, a complete
    machine-readable copy of the corresponding source code, to be
    distributed under the terms of Sections 1 and 2 above on a medium
    customarily used for software interchange; or,

    c) Accompany it with the information you received as to the offer
    to distribute corresponding source code.  (This alternative is
    allowed only for noncommercial distribution and only if you
    received the program in object code or executable form with such
    an offer, in accord with Subsection b above.)

The source code for a work means the preferred form of the work for
making modifications to it.  For an executable work, complete source
code means all the source code for all modules it contains, plus any
associated interface definition files, plus the scripts used to
control compilation and installation of the executable.  However, as a
special exception, the source code distributed need not include
anything that is normally distributed (in either source or binary
form) with the major components (compiler, kernel, and so on) of the
operating system on which the executable runs, unless that component
itself accompanies the executable.

If distribution of executable or object code is made by offering
access to copy from a designated place, then offering equivalent
access to copy the source code from the same place counts as
distribution of the source code, even though third parties are not
compelled to copy the source along with the object code.

  4. You may not copy, modify, sublicense, or distribute the Program
except as expressly provided under this License.  Any attempt
otherwise to copy, modify, sublicense or distribute the Program is
void, and will automatically terminate your rights under this License.
However, parties who have received copies, or rights, from you under
this License will not have their licenses terminated so long as such
parties remain in full compliance.

  5. You are not required to accept this License, since you have not
signed it.  However, nothing else grants you permission to modify or
distribute the Program or its derivative works.  These actions are
prohibited by law if you do not accept this License.  Therefore, by
modifying or distributing the Program (or any work based on the
Program), you indicate your acceptance of this License to do so, and
all its terms and conditions for copying, distributing or modifying
the Program or works based on it.

  6. Each time you redistribute the Program (or any work based on the
Program), the recipient automatically receives a license from the
original licensor to copy, distribute or modify the Program subject to
these terms and conditions.  You may not impose any further
restrictions on the recipients' exercise of the rights granted herein.
You are not responsible for enforcing compliance by third parties to
this License.

  7. If, as a consequence of a court judgment or allegation of patent
infringement or for any other reason (not limited to patent issues),
conditions are imposed on you (whether by court order, agreement or
otherwise) that contradict the conditions of this License, they do not
excuse you from the conditions of this License.  If you cannot
distribute so as to satisfy simultaneously your obligations under this
License and any other pertinent obligations, then as a consequence you
may not distribute the Program at all.  For example, if a patent
license would not permit royalty-free redistribution of the Program by
all those who receive copies directly or indirectly through you, then
the only way you could satisfy both it and this License would be to
refrain entirely from distribution of the Program.

If any portion of this section is held invalid or unenforceable under
any particular circumstance, the balance of the section is intended to
apply and the section as a whole is intended to apply in other
circumstances.

It is not the purpose of this section to induce you to infringe any
patents or other property right claims or to contest validity of any
such claims; this section has the sole purpose of protecting the
integrity of the free software distribution system, which is
implemented by public license practices.  Many people have made
generous contributions to the wide range of software distributed
through that system in reliance on consistent application of that
system; it is up to the author/donor to decide if he or she is willing
to distribute software through any other system and a licensee cannot
impose that choice.

This section is intended to make thoroughly clear what is believed to
be a consequence of the rest of this License.

  8. If the distribution and/or use of the Program is restricted in
certain countries either by patents or by copyrighted interfaces, the
original copyright holder who places the Program under this License
may add an explicit geographical distribution limitation excluding
those countries, so that distribution is permitted only in or among
countries not thus excluded.  In such case, this License incorporates
the limitation as if written in the body of this License.

  9. The Free Software Foundation may publish revised and/or new versions
of the General Public License from time to time.  Such new versions will
be similar in spirit to the present version, but may differ in detail to
address new problems or concerns.

Each version is given a distinguishing version number.  If the Program
specifies a version number of this License which applies to it and "any
later version", you have the option of following the terms and conditions
either of that version or of any later version published by the Free
Software Foundation.  If the Program does not specify a version number of
this License, you may choose any version ever published by the Free Software
Foundation.

  10. If you wish to incorporate parts of the Program into other free
programs whose distribution conditions are different, write to the author
to ask for permission.  For software which is copyrighted by the Free
Software Foundation, write to the Free Software Foundation; we sometimes
make exceptions for this.  Our decision will be guided by the two goals
of preserving the free status of all derivatives of our free software and
of promoting the sharing and reuse of software generally.

          NO WARRANTY

  11. BECAUSE THE PROGRAM IS LICENSED FREE OF CHARGE, THERE IS NO WARRANTY
FOR THE PROGRAM, TO THE EXTENT PERMITTED BY APPLICABLE LAW.  EXCEPT WHEN
OTHERWISE STATED IN WRITING THE COPYRIGHT HOLDERS AND/OR OTHER PARTIES
PROVIDE THE PROGRAM "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED
OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.  THE ENTIRE RISK AS
TO THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU.  SHOULD THE
PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF ALL NECESSARY SERVICING,
REPAIR OR CORRECTION.

  12. IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING
WILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MAY MODIFY AND/OR
REDISTRIBUTE THE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES,
INCLUDING ANY GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING
OUT OF THE USE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED
TO LOSS OF DATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY
YOU OR THIRD PARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER
PROGRAMS), EVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE
POSSIBILITY OF SUCH DAMAGES.
```

### text-f655e6291356ec0de7a8f0e69f294961a2cea86678ec94588be1e6a492e278ab

SHA-256 `f655e6291356ec0de7a8f0e69f294961a2cea86678ec94588be1e6a492e278ab` · 1178 original bytes.

Sources:

- `node_modules/range-parser/LICENSE`

```text
(The MIT License)

Copyright (c) 2012-2014 TJ Holowaychuk <tj@vision-media.ca>
Copyright (c) 2015-2016 Douglas Christopher Wilson <doug@somethingdoug.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### text-f657f99d3fb9647db92628e96007aabb46e5f04f33e49999075aab8e250ca7ce

SHA-256 `f657f99d3fb9647db92628e96007aabb46e5f04f33e49999075aab8e250ca7ce` · 1080 original bytes.

Sources:

- `node_modules/invariant/LICENSE`

```text
MIT License

Copyright (c) 2013-present, Facebook, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-f65c5d9f22a317b2a10803bd1868461ce6499c2ed7217bc80c0cc772a748789c

SHA-256 `f65c5d9f22a317b2a10803bd1868461ce6499c2ed7217bc80c0cc772a748789c` · 791 original bytes.

Sources:

- `node_modules/graceful-fs/LICENSE`

```text
The ISC License

Copyright (c) 2011-2022 Isaac Z. Schlueter, Ben Noordhuis, and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### text-f81a99a72ec5e64e3f74fad0db3df27ab69ab0edd4878368f83379d3e4fc9313

SHA-256 `f81a99a72ec5e64e3f74fad0db3df27ab69ab0edd4878368f83379d3e4fc9313` · 1061 original bytes.

Sources:

- `node_modules/@expo-google-fonts/material-symbols/LICENSE`

```text
MIT License

Copyright (c) 2020 Expo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-f855c605d6ba3587ef8ba49a428cec58711964547c5364f1dade33ed23315361

SHA-256 `f855c605d6ba3587ef8ba49a428cec58711964547c5364f1dade33ed23315361` · 1068 original bytes.

Sources:

- `node_modules/agent-cli-detector/LICENSE`
- `node_modules/sandbox-cli-detector/LICENSE`

```text
MIT License

Copyright (c) 2026 David Mokos

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-f9a72660f8b9b8a9ae3773ecaab64f61d1412a4f1c9eb945e455d22608fdc348

SHA-256 `f9a72660f8b9b8a9ae3773ecaab64f61d1412a4f1c9eb945e455d22608fdc348` · 1071 original bytes.

Sources:

- `node_modules/warn-once/LICENSE`

```text
MIT License

Copyright (c) 2022 Satyajit Sahoo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4

SHA-256 `fb3ca4a837f5779e83cef89b78253a8949cfb9429c340309f62d0465ec6610b4` · 1106 original bytes.

Sources:

- `node_modules/@expo/dom-webview/LICENSE`
- `node_modules/@expo/expo-modules-macros-plugin/LICENSE`
- `node_modules/@expo/image-utils/LICENSE`
- `node_modules/@expo/inline-modules/LICENSE`
- `node_modules/@expo/log-box/LICENSE`
- `node_modules/@expo/metro-file-map/LICENSE`
- `node_modules/@expo/metro-runtime/LICENSE`
- `node_modules/@expo/osascript/LICENSE`
- `node_modules/@expo/plist/LICENSE`
- `node_modules/babel-preset-expo/LICENSE`
- `node_modules/expo-application/LICENSE`
- `node_modules/expo-asset/LICENSE`
- `node_modules/expo-audio/LICENSE`
- `node_modules/expo-constants/LICENSE`
- `node_modules/expo-document-picker/LICENSE`
- `node_modules/expo-file-system/LICENSE`
- `node_modules/expo-font/LICENSE`
- `node_modules/expo-glass-effect/LICENSE`
- `node_modules/expo-haptics/LICENSE`
- `node_modules/expo-linear-gradient/LICENSE`
- `node_modules/expo-linking/LICENSE`
- `node_modules/expo-modules-autolinking/LICENSE`
- `node_modules/expo-modules-core/LICENSE`
- `node_modules/expo-modules-jsi/LICENSE`
- `node_modules/expo-notifications/LICENSE`
- `node_modules/expo-server/LICENSE`
- `node_modules/expo-sharing/LICENSE`
- `node_modules/expo-splash-screen/LICENSE`
- `node_modules/expo-sqlite/LICENSE`
- `node_modules/expo-status-bar/LICENSE`
- `node_modules/expo-symbols/LICENSE`
- `node_modules/expo-system-ui/LICENSE`
- `node_modules/expo/LICENSE`
- `node_modules/expo/node_modules/@expo/cli/LICENSE`
- `node_modules/expo/node_modules/@expo/cli/node_modules/@expo/router-server/LICENSE`
- `node_modules/expo/node_modules/expo-keep-awake/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### text-fd3a263fe19ed8faa9068b43abaebafc02c77897b0c6fc09abc04bb592e5f16e

SHA-256 `fd3a263fe19ed8faa9068b43abaebafc02c77897b0c6fc09abc04bb592e5f16e` · 18651 original bytes.

Sources:

- `node_modules/caniuse-lite/LICENSE`

```text
Attribution 4.0 International

=======================================================================

Creative Commons Corporation ("Creative Commons") is not a law firm and
does not provide legal services or legal advice. Distribution of
Creative Commons public licenses does not create a lawyer-client or
other relationship. Creative Commons makes its licenses and related
information available on an "as-is" basis. Creative Commons gives no
warranties regarding its licenses, any material licensed under their
terms and conditions, or any related information. Creative Commons
disclaims all liability for damages resulting from their use to the
fullest extent possible.

Using Creative Commons Public Licenses

Creative Commons public licenses provide a standard set of terms and
conditions that creators and other rights holders may use to share
original works of authorship and other material subject to copyright
and certain other rights specified in the public license below. The
following considerations are for informational purposes only, are not
exhaustive, and do not form part of our licenses.

     Considerations for licensors: Our public licenses are
     intended for use by those authorized to give the public
     permission to use material in ways otherwise restricted by
     copyright and certain other rights. Our licenses are
     irrevocable. Licensors should read and understand the terms
     and conditions of the license they choose before applying it.
     Licensors should also secure all rights necessary before
     applying our licenses so that the public can reuse the
     material as expected. Licensors should clearly mark any
     material not subject to the license. This includes other CC-
     licensed material, or material used under an exception or
     limitation to copyright. More considerations for licensors:
	wiki.creativecommons.org/Considerations_for_licensors

     Considerations for the public: By using one of our public
     licenses, a licensor grants the public permission to use the
     licensed material under specified terms and conditions. If
     the licensor's permission is not necessary for any reason--for
     example, because of any applicable exception or limitation to
     copyright--then that use is not regulated by the license. Our
     licenses grant only permissions under copyright and certain
     other rights that a licensor has authority to grant. Use of
     the licensed material may still be restricted for other
     reasons, including because others have copyright or other
     rights in the material. A licensor may make special requests,
     such as asking that all changes be marked or described.
     Although not required by our licenses, you are encouraged to
     respect those requests where reasonable. More_considerations
     for the public:
	wiki.creativecommons.org/Considerations_for_licensees

=======================================================================

Creative Commons Attribution 4.0 International Public License

By exercising the Licensed Rights (defined below), You accept and agree
to be bound by the terms and conditions of this Creative Commons
Attribution 4.0 International Public License ("Public License"). To the
extent this Public License may be interpreted as a contract, You are
granted the Licensed Rights in consideration of Your acceptance of
these terms and conditions, and the Licensor grants You such rights in
consideration of benefits the Licensor receives from making the
Licensed Material available under these terms and conditions.


Section 1 -- Definitions.

  a. Adapted Material means material subject to Copyright and Similar
     Rights that is derived from or based upon the Licensed Material
     and in which the Licensed Material is translated, altered,
     arranged, transformed, or otherwise modified in a manner requiring
     permission under the Copyright and Similar Rights held by the
     Licensor. For purposes of this Public License, where the Licensed
     Material is a musical work, performance, or sound recording,
     Adapted Material is always produced where the Licensed Material is
     synched in timed relation with a moving image.

  b. Adapter's License means the license You apply to Your Copyright
     and Similar Rights in Your contributions to Adapted Material in
     accordance with the terms and conditions of this Public License.

  c. Copyright and Similar Rights means copyright and/or similar rights
     closely related to copyright including, without limitation,
     performance, broadcast, sound recording, and Sui Generis Database
     Rights, without regard to how the rights are labeled or
     categorized. For purposes of this Public License, the rights
     specified in Section 2(b)(1)-(2) are not Copyright and Similar
     Rights.

  d. Effective Technological Measures means those measures that, in the
     absence of proper authority, may not be circumvented under laws
     fulfilling obligations under Article 11 of the WIPO Copyright
     Treaty adopted on December 20, 1996, and/or similar international
     agreements.

  e. Exceptions and Limitations means fair use, fair dealing, and/or
     any other exception or limitation to Copyright and Similar Rights
     that applies to Your use of the Licensed Material.

  f. Licensed Material means the artistic or literary work, database,
     or other material to which the Licensor applied this Public
     License.

  g. Licensed Rights means the rights granted to You subject to the
     terms and conditions of this Public License, which are limited to
     all Copyright and Similar Rights that apply to Your use of the
     Licensed Material and that the Licensor has authority to license.

  h. Licensor means the individual(s) or entity(ies) granting rights
     under this Public License.

  i. Share means to provide material to the public by any means or
     process that requires permission under the Licensed Rights, such
     as reproduction, public display, public performance, distribution,
     dissemination, communication, or importation, and to make material
     available to the public including in ways that members of the
     public may access the material from a place and at a time
     individually chosen by them.

  j. Sui Generis Database Rights means rights other than copyright
     resulting from Directive 96/9/EC of the European Parliament and of
     the Council of 11 March 1996 on the legal protection of databases,
     as amended and/or succeeded, as well as other essentially
     equivalent rights anywhere in the world.

  k. You means the individual or entity exercising the Licensed Rights
     under this Public License. Your has a corresponding meaning.


Section 2 -- Scope.

  a. License grant.

       1. Subject to the terms and conditions of this Public License,
          the Licensor hereby grants You a worldwide, royalty-free,
          non-sublicensable, non-exclusive, irrevocable license to
          exercise the Licensed Rights in the Licensed Material to:

            a. reproduce and Share the Licensed Material, in whole or
               in part; and

            b. produce, reproduce, and Share Adapted Material.

       2. Exceptions and Limitations. For the avoidance of doubt, where
          Exceptions and Limitations apply to Your use, this Public
          License does not apply, and You do not need to comply with
          its terms and conditions.

       3. Term. The term of this Public License is specified in Section
          6(a).

       4. Media and formats; technical modifications allowed. The
          Licensor authorizes You to exercise the Licensed Rights in
          all media and formats whether now known or hereafter created,
          and to make technical modifications necessary to do so. The
          Licensor waives and/or agrees not to assert any right or
          authority to forbid You from making technical modifications
          necessary to exercise the Licensed Rights, including
          technical modifications necessary to circumvent Effective
          Technological Measures. For purposes of this Public License,
          simply making modifications authorized by this Section 2(a)
          (4) never produces Adapted Material.

       5. Downstream recipients.

            a. Offer from the Licensor -- Licensed Material. Every
               recipient of the Licensed Material automatically
               receives an offer from the Licensor to exercise the
               Licensed Rights under the terms and conditions of this
               Public License.

            b. No downstream restrictions. You may not offer or impose
               any additional or different terms or conditions on, or
               apply any Effective Technological Measures to, the
               Licensed Material if doing so restricts exercise of the
               Licensed Rights by any recipient of the Licensed
               Material.

       6. No endorsement. Nothing in this Public License constitutes or
          may be construed as permission to assert or imply that You
          are, or that Your use of the Licensed Material is, connected
          with, or sponsored, endorsed, or granted official status by,
          the Licensor or others designated to receive attribution as
          provided in Section 3(a)(1)(A)(i).

  b. Other rights.

       1. Moral rights, such as the right of integrity, are not
          licensed under this Public License, nor are publicity,
          privacy, and/or other similar personality rights; however, to
          the extent possible, the Licensor waives and/or agrees not to
          assert any such rights held by the Licensor to the limited
          extent necessary to allow You to exercise the Licensed
          Rights, but not otherwise.

       2. Patent and trademark rights are not licensed under this
          Public License.

       3. To the extent possible, the Licensor waives any right to
          collect royalties from You for the exercise of the Licensed
          Rights, whether directly or through a collecting society
          under any voluntary or waivable statutory or compulsory
          licensing scheme. In all other cases the Licensor expressly
          reserves any right to collect such royalties.


Section 3 -- License Conditions.

Your exercise of the Licensed Rights is expressly made subject to the
following conditions.

  a. Attribution.

       1. If You Share the Licensed Material (including in modified
          form), You must:

            a. retain the following if it is supplied by the Licensor
               with the Licensed Material:

                 i. identification of the creator(s) of the Licensed
                    Material and any others designated to receive
                    attribution, in any reasonable manner requested by
                    the Licensor (including by pseudonym if
                    designated);

                ii. a copyright notice;

               iii. a notice that refers to this Public License;

                iv. a notice that refers to the disclaimer of
                    warranties;

                 v. a URI or hyperlink to the Licensed Material to the
                    extent reasonably practicable;

            b. indicate if You modified the Licensed Material and
               retain an indication of any previous modifications; and

            c. indicate the Licensed Material is licensed under this
               Public License, and include the text of, or the URI or
               hyperlink to, this Public License.

       2. You may satisfy the conditions in Section 3(a)(1) in any
          reasonable manner based on the medium, means, and context in
          which You Share the Licensed Material. For example, it may be
          reasonable to satisfy the conditions by providing a URI or
          hyperlink to a resource that includes the required
          information.

       3. If requested by the Licensor, You must remove any of the
          information required by Section 3(a)(1)(A) to the extent
          reasonably practicable.

       4. If You Share Adapted Material You produce, the Adapter's
          License You apply must not prevent recipients of the Adapted
          Material from complying with this Public License.


Section 4 -- Sui Generis Database Rights.

Where the Licensed Rights include Sui Generis Database Rights that
apply to Your use of the Licensed Material:

  a. for the avoidance of doubt, Section 2(a)(1) grants You the right
     to extract, reuse, reproduce, and Share all or a substantial
     portion of the contents of the database;

  b. if You include all or a substantial portion of the database
     contents in a database in which You have Sui Generis Database
     Rights, then the database in which You have Sui Generis Database
     Rights (but not its individual contents) is Adapted Material; and

  c. You must comply with the conditions in Section 3(a) if You Share
     all or a substantial portion of the contents of the database.

For the avoidance of doubt, this Section 4 supplements and does not
replace Your obligations under this Public License where the Licensed
Rights include other Copyright and Similar Rights.


Section 5 -- Disclaimer of Warranties and Limitation of Liability.

  a. UNLESS OTHERWISE SEPARATELY UNDERTAKEN BY THE LICENSOR, TO THE
     EXTENT POSSIBLE, THE LICENSOR OFFERS THE LICENSED MATERIAL AS-IS
     AND AS-AVAILABLE, AND MAKES NO REPRESENTATIONS OR WARRANTIES OF
     ANY KIND CONCERNING THE LICENSED MATERIAL, WHETHER EXPRESS,
     IMPLIED, STATUTORY, OR OTHER. THIS INCLUDES, WITHOUT LIMITATION,
     WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR
     PURPOSE, NON-INFRINGEMENT, ABSENCE OF LATENT OR OTHER DEFECTS,
     ACCURACY, OR THE PRESENCE OR ABSENCE OF ERRORS, WHETHER OR NOT
     KNOWN OR DISCOVERABLE. WHERE DISCLAIMERS OF WARRANTIES ARE NOT
     ALLOWED IN FULL OR IN PART, THIS DISCLAIMER MAY NOT APPLY TO YOU.

  b. TO THE EXTENT POSSIBLE, IN NO EVENT WILL THE LICENSOR BE LIABLE
     TO YOU ON ANY LEGAL THEORY (INCLUDING, WITHOUT LIMITATION,
     NEGLIGENCE) OR OTHERWISE FOR ANY DIRECT, SPECIAL, INDIRECT,
     INCIDENTAL, CONSEQUENTIAL, PUNITIVE, EXEMPLARY, OR OTHER LOSSES,
     COSTS, EXPENSES, OR DAMAGES ARISING OUT OF THIS PUBLIC LICENSE OR
     USE OF THE LICENSED MATERIAL, EVEN IF THE LICENSOR HAS BEEN
     ADVISED OF THE POSSIBILITY OF SUCH LOSSES, COSTS, EXPENSES, OR
     DAMAGES. WHERE A LIMITATION OF LIABILITY IS NOT ALLOWED IN FULL OR
     IN PART, THIS LIMITATION MAY NOT APPLY TO YOU.

  c. The disclaimer of warranties and limitation of liability provided
     above shall be interpreted in a manner that, to the extent
     possible, most closely approximates an absolute disclaimer and
     waiver of all liability.


Section 6 -- Term and Termination.

  a. This Public License applies for the term of the Copyright and
     Similar Rights licensed here. However, if You fail to comply with
     this Public License, then Your rights under this Public License
     terminate automatically.

  b. Where Your right to use the Licensed Material has terminated under
     Section 6(a), it reinstates:

       1. automatically as of the date the violation is cured, provided
          it is cured within 30 days of Your discovery of the
          violation; or

       2. upon express reinstatement by the Licensor.

     For the avoidance of doubt, this Section 6(b) does not affect any
     right the Licensor may have to seek remedies for Your violations
     of this Public License.

  c. For the avoidance of doubt, the Licensor may also offer the
     Licensed Material under separate terms or conditions or stop
     distributing the Licensed Material at any time; however, doing so
     will not terminate this Public License.

  d. Sections 1, 5, 6, 7, and 8 survive termination of this Public
     License.


Section 7 -- Other Terms and Conditions.

  a. The Licensor shall not be bound by any additional or different
     terms or conditions communicated by You unless expressly agreed.

  b. Any arrangements, understandings, or agreements regarding the
     Licensed Material not stated herein are separate from and
     independent of the terms and conditions of this Public License.


Section 8 -- Interpretation.

  a. For the avoidance of doubt, this Public License does not, and
     shall not be interpreted to, reduce, limit, restrict, or impose
     conditions on any use of the Licensed Material that could lawfully
     be made without permission under this Public License.

  b. To the extent possible, if any provision of this Public License is
     deemed unenforceable, it shall be automatically reformed to the
     minimum extent necessary to make it enforceable. If the provision
     cannot be reformed, it shall be severed from this Public License
     without affecting the enforceability of the remaining terms and
     conditions.

  c. No term or condition of this Public License will be waived and no
     failure to comply consented to unless expressly agreed to by the
     Licensor.

  d. Nothing in this Public License constitutes or may be interpreted
     as a limitation upon, or waiver of, any privileges and immunities
     that apply to the Licensor or You, including from the legal
     processes of any jurisdiction or authority.


=======================================================================

Creative Commons is not a party to its public
licenses. Notwithstanding, Creative Commons may elect to apply one of
its public licenses to material it publishes and in those instances
will be considered the “Licensor.” The text of the Creative Commons
public licenses is dedicated to the public domain under the CC0 Public
Domain Dedication. Except for the limited purpose of indicating that
material is shared under a Creative Commons public license or as
otherwise permitted by the Creative Commons policies published at
creativecommons.org/policies, Creative Commons does not authorize the
use of the trademark "Creative Commons" or any other trademark or logo
of Creative Commons without its prior written consent including,
without limitation, in connection with any unauthorized modifications
to any of its public licenses or any other arrangements,
understandings, or agreements concerning use of licensed material. For
the avoidance of doubt, this paragraph does not form part of the
public licenses.

Creative Commons may be contacted at creativecommons.org.
```

### text-fe99d9a94ec7edc64a9767701f830f66e08239b000d653a359d66e640289ed0c

SHA-256 `fe99d9a94ec7edc64a9767701f830f66e08239b000d653a359d66e640289ed0c` · 1112 original bytes.

Sources:

- `node_modules/defaults/LICENSE`

```text
The MIT License (MIT)

Copyright (c) 2022 Sindre Sorhus
Copyright (c) 2015 Elijah Insua

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### text-ffd8b33b354585f4ce119f19c53728281e48a97b074491eb6bf6d5c5ff305272

SHA-256 `ffd8b33b354585f4ce119f19c53728281e48a97b074491eb6bf6d5c5ff305272` · 1951 original bytes.

Sources:

- `node_modules/lodash.debounce/LICENSE`
- `node_modules/lodash.throttle/LICENSE`

```text
Copyright jQuery Foundation and other contributors <https://jquery.org/>

Based on Underscore.js, copyright Jeremy Ashkenas,
DocumentCloud and Investigative Reporters & Editors <http://underscorejs.org/>

This software consists of voluntary contributions made by many
individuals. For exact contribution history, see the revision history
available at https://github.com/lodash/lodash

The following license applies to all parts of this software except as
documented below:

====

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

====

Copyright and related rights for sample code are waived via CC0. Sample
code is defined as all source code displayed within the prose of the
documentation.

CC0: http://creativecommons.org/publicdomain/zero/1.0/

====

Files located in the node_modules and vendor directories are externally
maintained libraries used by this software which have their own
licenses; we recommend you read them, as their terms may differ from the
terms above.
```

### text-ffe370c8785b0b688d954977ce8dc52e19e5f17962cc5f80009c85eba4925d56

SHA-256 `ffe370c8785b0b688d954977ce8dc52e19e5f17962cc5f80009c85eba4925d56` · 1173 original bytes.

Sources:

- `node_modules/destroy/LICENSE`

```text

The MIT License (MIT)

Copyright (c) 2014 Jonathan Ong me@jongleberry.com
Copyright (c) 2015-2022 Douglas Christopher Wilson doug@somethingdoug.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
