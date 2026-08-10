const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const developmentSourceEntries = {
  '@palea/ui-native': path.join(
    workspaceRoot,
    'packages/ui-native/src/index.ts',
  ),
};

const config = getDefaultConfig(projectRoot);

// Expo SDK 54 watches pnpm workspaces automatically. In development, resolve
// UI components to TypeScript source so Metro can Fast Refresh them. Tokens
// stay on their public entry because NativeWind consumes them while generating
// the Tailwind configuration. A production export uses public `dist` entries.
if (process.env.NODE_ENV !== 'production') {
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    const sourceEntry = developmentSourceEntries[moduleName];
    if (sourceEntry) return { filePath: sourceEntry, type: 'sourceFile' };
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = withNativeWind(config, {
  input: path.join(__dirname, 'src/global.css'),
  configPath: path.join(__dirname, 'tailwind.config.cjs'),
});
