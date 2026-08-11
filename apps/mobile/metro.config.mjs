import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const loadCommonJs = createRequire(import.meta.url);
const { getDefaultConfig } = loadCommonJs('expo/metro-config');
const { withNativeWind } = loadCommonJs('nativewind/metro');
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
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

export default withNativeWind(config, {
  input: path.join(projectRoot, 'src/global.css'),
  configPath: path.join(projectRoot, 'tailwind.config.mjs'),
});
