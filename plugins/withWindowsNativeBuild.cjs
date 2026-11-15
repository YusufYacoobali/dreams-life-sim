// Android's default CMake 3.22.1 bundles Ninja 1.10.2, which cannot handle
// the long generated C++ paths used by React Native on Windows. CMake 3.31.6
// bundles Ninja 1.12.1 with Windows long-path support. Keep other hosts on
// their existing toolchain.
const windowsNativeBuildBlock = `// @generated begin dreams-windows-native-build
if (System.getProperty('os.name').startsWith('Windows')) {
    android.externalNativeBuild.cmake.version = '3.31.6'
}
// @generated end dreams-windows-native-build`;

function updateBuildGradle(contents) {
  const eol = contents.includes('\r\n') ? '\r\n' : '\n';
  const block = windowsNativeBuildBlock.replace(/\n/g, eol);
  const existing = /\/\/ @generated begin dreams-windows-native-build\r?\n[\s\S]*?\/\/ @generated end dreams-windows-native-build/;
  if (existing.test(contents)) return contents.replace(existing, block);
  return contents + (contents.endsWith('\n') ? '' : eol) + eol + block + eol;
}

module.exports = config => {
  const { withAppBuildGradle } = require('expo/config-plugins');
  return withAppBuildGradle(config, result => {
    if (result.modResults.language !== 'groovy') throw Error('Windows native build setup requires a Groovy app/build.gradle.');
    result.modResults.contents = updateBuildGradle(result.modResults.contents);
    return result;
  });
};
module.exports.updateBuildGradle = updateBuildGradle;
module.exports.windowsNativeBuildBlock = windowsNativeBuildBlock;
