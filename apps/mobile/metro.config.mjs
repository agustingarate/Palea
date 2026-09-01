import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { preparePdfAssets } from './scripts/prepare-pdf-assets.mjs';

const loadCommonJs = createRequire(import.meta.url);
const { getDefaultConfig } = loadCommonJs('expo/metro-config');
const { withNativeWind } = loadCommonJs('nativewind/metro');
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
preparePdfAssets(projectRoot);
const workspaceRoot = path.resolve(projectRoot, '../..');
const queryCoreEntry = loadCommonJs.resolve('@tanstack/query-core');
const developmentSourceEntries = {
  '@palea/localization': path.join(
    workspaceRoot,
    'packages/localization/src/index.ts',
  ),
  '@palea/ui-native': path.join(
    workspaceRoot,
    'packages/ui-native/src/index.ts',
  ),
};
const config = getDefaultConfig(projectRoot);

// Preserve Expo's defaults while adding the workspace root needed to resolve
// pnpm's linked dependency tree.
config.watchFolders = [...new Set([...config.watchFolders, workspaceRoot])];
config.resolver.nodeModulesPaths = [
  path.join(projectRoot, 'node_modules'),
  path.join(workspaceRoot, 'node_modules'),
];

// Expo SDK 54 watches pnpm workspaces automatically. In development, resolve
// selected workspace packages to TypeScript source so Metro can Fast Refresh
// them. Tokens stay on their public entry because NativeWind consumes them
// while generating the Tailwind configuration. A production export uses public
// `dist` entries.
if (process.env.NODE_ENV !== 'production') {
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === '@tanstack/query-core')
      return { filePath: queryCoreEntry, type: 'sourceFile' };
    const sourceEntry = developmentSourceEntries[moduleName];
    if (sourceEntry) return { filePath: sourceEntry, type: 'sourceFile' };
    return context.resolveRequest(context, moduleName, platform);
  };
}

export default withNativeWind(config, {
  input: path.join(projectRoot, 'src/global.css'),
  configPath: path.join(projectRoot, 'tailwind.config.mjs'),
});
